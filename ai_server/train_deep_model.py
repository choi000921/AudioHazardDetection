"""
딥러닝 모델 학습 스크립트
- SEDResNet: 음성/소음 구분 (Sound Event Detection)
- ASTModel: 비명/정상 구분 (Abnormal Sound Detection)

사용법:
    python train_deep_model.py --data_path /path/to/your/data
"""
import os
import sys
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import librosa
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

from models import SEDResNet, ASTModel


# GPU 설정
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {DEVICE}")
if torch.cuda.is_available():
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")


class AudioDataset(Dataset):
    """오디오 데이터셋 클래스"""
    def __init__(self, file_paths, labels, duration=3, sr=16000, n_mels=80):
        self.file_paths = file_paths
        self.labels = labels
        self.duration = duration
        self.sr = sr
        self.n_mels = n_mels
        
    def __len__(self):
        return len(self.file_paths)
    
    def __getitem__(self, idx):
        audio_path = self.file_paths[idx]
        label = self.labels[idx]
        
        try:
            # 오디오 로드 및 전처리
            audio, _ = librosa.load(audio_path, sr=self.sr, mono=True)
            audio = librosa.util.fix_length(audio, size=self.sr * self.duration)
            
            # Mel-spectrogram 생성
            mel_spec = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sr,
                n_mels=self.n_mels,
                n_fft=1024,
                hop_length=320
            )
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            
            # 정규화
            mel_spec_db = (mel_spec_db - mel_spec_db.mean()) / (mel_spec_db.std() + 1e-8)
            
            # Tensor 변환 (1, n_mels, time_frames)
            mel_tensor = torch.FloatTensor(mel_spec_db).unsqueeze(0)
            
            return mel_tensor, label
            
        except Exception as e:
            print(f"Error loading {audio_path}: {e}")
            return torch.zeros(1, self.n_mels, 150), label


def collect_audio_files(base_path, categories, max_files_per_class=None):
    """
    오디오 파일 수집
    Args:
        base_path: 데이터 루트 경로
        categories: [{'name': '클래스명', 'label': 0, 'path': '상대경로'}] 또는 ['폴더1', '폴더2']
        max_files_per_class: 클래스당 최대 파일 수
    """
    file_paths = []
    labels = []
    
    # categories가 리스트인 경우 (단순 폴더명)
    if isinstance(categories[0], str):
        categories = [{'name': cat, 'label': i, 'path': cat} for i, cat in enumerate(categories)]
    
    for category in categories:
        cat_name = category['name']
        cat_label = category['label']
        cat_path = os.path.join(base_path, category['path'])
        
        print(f"수집 중: {cat_name} (label={cat_label})")
        print(f"   경로: {cat_path}")
        
        if not os.path.exists(cat_path):
            print(f"     경로 없음, 건너뜀")
            continue
        
        # 오디오 파일 찾기
        audio_files = []
        for root, dirs, files in os.walk(cat_path):
            for file in files:
                if file.endswith(('.wav', '.mp3', '.flac', '.ogg', '.m4a')):
                    audio_files.append(os.path.join(root, file))
        
        # 최대 개수 제한
        if max_files_per_class and len(audio_files) > max_files_per_class:
            audio_files = np.random.choice(audio_files, max_files_per_class, replace=False).tolist()
        
        file_paths.extend(audio_files)
        labels.extend([cat_label] * len(audio_files))
        
        print(f"    {len(audio_files)}개 파일 수집")
    
    return file_paths, labels


def train_model(model, train_loader, val_loader, num_epochs=30, lr=0.001, save_path='model_best.pth'):
    """모델 학습"""
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=3, verbose=True)
    
    best_val_acc = 0.0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    
    for epoch in range(num_epochs):
        # Training
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        train_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{num_epochs} [Train]")
        for inputs, labels in train_bar:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()
            
            train_bar.set_postfix({
                'loss': f"{train_loss/len(train_bar):.4f}",
                'acc': f"{100.*train_correct/train_total:.2f}%"
            })
        
        train_acc = 100. * train_correct / train_total
        train_loss = train_loss / len(train_loader)
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            val_bar = tqdm(val_loader, desc=f"Epoch {epoch+1}/{num_epochs} [Val]")
            for inputs, labels in val_bar:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
                
                val_bar.set_postfix({
                    'loss': f"{val_loss/len(val_bar):.4f}",
                    'acc': f"{100.*val_correct/val_total:.2f}%"
                })
        
        val_acc = 100. * val_correct / val_total
        val_loss = val_loss / len(val_loader)
        
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"Epoch {epoch+1}: Train Acc={train_acc:.2f}%, Val Acc={val_acc:.2f}%")
        
        scheduler.step(val_acc)
        
        # 베스트 모델 저장
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), save_path)
            print(f" Best model saved! (Val Acc: {val_acc:.2f}%)")
    
    return history


def plot_training_history(history, save_path='training_history.png'):
    """학습 곡선 시각화"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    axes[0].plot(history['train_loss'], label='Train Loss', marker='o')
    axes[0].plot(history['val_loss'], label='Val Loss', marker='s')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    axes[1].plot(history['train_acc'], label='Train Acc', marker='o')
    axes[1].plot(history['val_acc'], label='Val Acc', marker='s')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy (%)')
    axes[1].set_title('Training and Validation Accuracy')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path)
    print(f"Training history saved to {save_path}")


def main():
    parser = argparse.ArgumentParser(description='딥러닝 오디오 모델 학습')
    parser.add_argument('--data_path', type=str, required=True, help='데이터 루트 경로')
    parser.add_argument('--task', type=str, default='both', choices=['sed', 'ast', 'both'], 
                        help='학습할 태스크 (sed: 음성/소음, ast: 비명/정상, both: 둘다)')
    parser.add_argument('--epochs', type=int, default=30, help='학습 에포크 수')
    parser.add_argument('--batch_size', type=int, default=32, help='배치 크기')
    parser.add_argument('--lr', type=float, default=0.001, help='학습률')
    parser.add_argument('--max_files', type=int, default=5000, help='클래스당 최대 파일 수')
    
    args = parser.parse_args()
    
    print("="*70)
    print("딥러닝 모델 학습 시작")
    print("="*70)
    print(f"데이터 경로: {args.data_path}")
    print(f"태스크: {args.task}")
    print(f"에포크: {args.epochs}, 배치: {args.batch_size}, 학습률: {args.lr}")
    print("="*70)
    
    # 모델 저장 폴더 생성
    os.makedirs('models', exist_ok=True)
    
    # Task 1: Sound Event Detection (음성/소음 구분)
    if args.task in ['sed', 'both']:
        print("\n[Task 1] Sound Event Detection - 음성/소음 구분")
        print("데이터 수집 안내:")
        print("   - 소음 데이터 폴더명을 입력하세요 (예: noise, background)")
        print("   - 음성 데이터 폴더명을 입력하세요 (예: voice, speech)")
        
        noise_folder = input("소음 폴더명: ").strip()
        voice_folder = input("음성 폴더명: ").strip()
        
        sed_categories = [
            {'name': '소음', 'label': 0, 'path': noise_folder},
            {'name': '음성', 'label': 1, 'path': voice_folder}
        ]
        
        sed_files, sed_labels = collect_audio_files(args.data_path, sed_categories, args.max_files)
        
        if len(sed_files) == 0:
            print("데이터를 찾을 수 없습니다. 경로를 확인하세요.")
        else:
            print(f"총 {len(sed_files)}개 파일 수집 완료\n")
            
            X_train, X_val, y_train, y_val = train_test_split(
                sed_files, sed_labels, test_size=0.2, random_state=42, stratify=sed_labels
            )
            
            train_dataset = AudioDataset(X_train, y_train)
            val_dataset = AudioDataset(X_val, y_val)
            train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=4)
            val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=4)
            
            print("\nSEDResNet 학습 시작...")
            sed_model = SEDResNet(num_classes=2).to(DEVICE)
            sed_history = train_model(sed_model, train_loader, val_loader, 
                                      num_epochs=args.epochs, lr=args.lr, 
                                      save_path='models/sed_resnet_best.pth')
            plot_training_history(sed_history, 'sed_training_history.png')
    
    # Task 2: Abnormal Sound Detection (비명/정상 구분)
    if args.task in ['ast', 'both']:
        print("\n\n[Task 2] Abnormal Sound Detection - 비명/정상 구분")
        print("데이터 수집 안내:")
        print("   - 정상 음성 폴더명을 입력하세요 (예: normal, voice)")
        print("   - 비명 폴더명을 입력하세요 (예: scream, emergency)")
        
        normal_folder = input("정상 폴더명: ").strip()
        scream_folder = input("비명 폴더명: ").strip()
        
        ast_categories = [
            {'name': '정상', 'label': 0, 'path': normal_folder},
            {'name': '비명', 'label': 1, 'path': scream_folder}
        ]
        
        ast_files, ast_labels = collect_audio_files(args.data_path, ast_categories, args.max_files)
        
        if len(ast_files) == 0:
            print("데이터를 찾을 수 없습니다. 경로를 확인하세요.")
        else:
            print(f"총 {len(ast_files)}개 파일 수집 완료\n")
            
            X_train, X_val, y_train, y_val = train_test_split(
                ast_files, ast_labels, test_size=0.2, random_state=42, stratify=ast_labels
            )
            
            train_dataset = AudioDataset(X_train, y_train)
            val_dataset = AudioDataset(X_val, y_val)
            train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=4)
            val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=4)
            
            print("\nASTModel 학습 시작...")
            ast_model = ASTModel(num_classes=2).to(DEVICE)
            ast_history = train_model(ast_model, train_loader, val_loader, 
                                      num_epochs=args.epochs, lr=args.lr, 
                                      save_path='models/ast_best.pth')
            plot_training_history(ast_history, 'ast_training_history.png')
    
    print("\n" + "="*70)
    print("모든 모델 학습 완료!")
    print("="*70)
    print("저장된 모델:")
    if args.task in ['sed', 'both']:
        print("   - models/sed_resnet_best.pth (음성/소음 구분)")
    if args.task in ['ast', 'both']:
        print("   - models/ast_best.pth (비명/정상 구분)")


if __name__ == "__main__":
    main()
