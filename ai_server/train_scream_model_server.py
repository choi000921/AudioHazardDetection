"""
비명 감지 모델 학습 스크립트 (GPU 서버용)
사용법: python train_scream_model_server.py --data_path /path/to/Processed_Data_Full
"""
import os
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import librosa
from tqdm import tqdm
from sklearn.model_selection import train_test_split
import matplotlib
matplotlib.use('Agg')  # GUI 없이 그래프 저장
import matplotlib.pyplot as plt
from models import ASTModel


DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🔥 Device: {DEVICE}")
if torch.cuda.is_available():
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")


class AudioDataset(Dataset):
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
            audio, _ = librosa.load(audio_path, sr=self.sr, mono=True)
            audio = librosa.util.fix_length(audio, size=self.sr * self.duration)
            
            mel_spec = librosa.feature.melspectrogram(
                y=audio, sr=self.sr, n_mels=self.n_mels,
                n_fft=1024, hop_length=320
            )
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            mel_spec_db = (mel_spec_db - mel_spec_db.mean()) / (mel_spec_db.std() + 1e-8)
            
            mel_tensor = torch.FloatTensor(mel_spec_db).unsqueeze(0)
            return mel_tensor, label
            
        except Exception as e:
            print(f"Error: {audio_path}: {e}")
            return torch.zeros(1, self.n_mels, 150), label


def collect_files(folder_path, label, max_files=None):
    """폴더에서 오디오 파일 수집"""
    print(f"📂 Scanning: {folder_path}")
    files = []
    for root, _, filenames in os.walk(folder_path):
        for f in filenames:
            if f.endswith(('.wav', '.mp3', '.flac', '.ogg', '.m4a')):
                files.append(os.path.join(root, f))
    
    print(f"   Found {len(files)} files")
    
    if max_files and len(files) > max_files:
        np.random.seed(42)
        files = np.random.choice(files, max_files, replace=False).tolist()
        print(f"   Sampled {max_files} files")
    
    labels = [label] * len(files)
    return files, labels


def train_model(model, train_loader, val_loader, epochs=30, lr=0.001, save_path='models/ast_best.pth'):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'max', factor=0.5, patience=3, verbose=True)
    
    best_acc = 0.0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    
    for epoch in range(epochs):
        # Train
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        
        train_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs} [Train]")
        for inputs, labels in train_bar:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, pred = outputs.max(1)
            train_total += labels.size(0)
            train_correct += pred.eq(labels).sum().item()
            
            train_bar.set_postfix({
                'loss': f'{train_loss/len(train_bar):.4f}',
                'acc': f'{100.*train_correct/train_total:.2f}%'
            })
        
        train_acc = 100. * train_correct / train_total
        train_loss /= len(train_loader)
        
        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        
        with torch.no_grad():
            val_bar = tqdm(val_loader, desc=f"Epoch {epoch+1}/{epochs} [Val]")
            for inputs, labels in val_bar:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, pred = outputs.max(1)
                val_total += labels.size(0)
                val_correct += pred.eq(labels).sum().item()
                
                val_bar.set_postfix({
                    'loss': f'{val_loss/len(val_bar):.4f}',
                    'acc': f'{100.*val_correct/val_total:.2f}%'
                })
        
        val_acc = 100. * val_correct / val_total
        val_loss /= len(val_loader)
        
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"Epoch {epoch+1}: Train Acc={train_acc:.2f}%, Val Acc={val_acc:.2f}%, Val Loss={val_loss:.4f}")
        
        scheduler.step(val_acc)
        
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), save_path)
            print(f"✅ Best model saved! (Val Acc: {val_acc:.2f}%)")
    
    return history


def main():
    parser = argparse.ArgumentParser(description='비명 감지 모델 학습 (GPU 서버)')
    parser.add_argument('--data_path', type=str, required=True, 
                        help='데이터 루트 경로 (Processed_Data_Full 폴더)')
    parser.add_argument('--epochs', type=int, default=30, help='학습 에포크')
    parser.add_argument('--batch_size', type=int, default=64, help='배치 크기')
    parser.add_argument('--lr', type=float, default=0.001, help='학습률')
    parser.add_argument('--max_files', type=int, default=10000, help='클래스당 최대 파일 수')
    parser.add_argument('--num_workers', type=int, default=8, help='데이터 로더 워커 수')
    
    args = parser.parse_args()
    
    print("="*70)
    print("🎯 비명 감지 모델 학습 (GPU 서버)")
    print("="*70)
    print(f"데이터 경로: {args.data_path}")
    print(f"에포크: {args.epochs}, 배치: {args.batch_size}, 학습률: {args.lr}")
    print(f"최대 파일 수: {args.max_files} (클래스당)")
    print("="*70)
    
    # 경로 설정
    SCREAM_PATH = os.path.join(args.data_path, "Scream")
    NOTSCREAM_PATH = os.path.join(args.data_path, "Notscream")
    
    # 경로 확인
    if not os.path.exists(SCREAM_PATH):
        print(f"❌ 경로 없음: {SCREAM_PATH}")
        return
    if not os.path.exists(NOTSCREAM_PATH):
        print(f"❌ 경로 없음: {NOTSCREAM_PATH}")
        return
    
    # 데이터 수집
    print("\n📂 데이터 수집 중...")
    notscream_files, notscream_labels = collect_files(NOTSCREAM_PATH, 0, max_files=args.max_files)
    scream_files, scream_labels = collect_files(SCREAM_PATH, 1, max_files=args.max_files)
    
    print(f"\n✅ 수집 완료:")
    print(f"  정상(Notscream): {len(notscream_files)}개")
    print(f"  비명(Scream): {len(scream_files)}개")
    print(f"  총합: {len(notscream_files) + len(scream_files)}개")
    
    if len(notscream_files) == 0 or len(scream_files) == 0:
        print("❌ 데이터가 부족합니다.")
        return
    
    all_files = notscream_files + scream_files
    all_labels = notscream_labels + scream_labels
    
    # 데이터 분할
    X_train, X_val, y_train, y_val = train_test_split(
        all_files, all_labels, test_size=0.2, random_state=42, stratify=all_labels
    )
    
    print(f"\n📊 데이터 분할:")
    print(f"  Train: {len(X_train)}개 (정상: {y_train.count(0)}, 비명: {y_train.count(1)})")
    print(f"  Val: {len(X_val)}개 (정상: {y_val.count(0)}, 비명: {y_val.count(1)})")
    
    # 데이터로더
    print("\n🔄 데이터로더 생성 중...")
    train_dataset = AudioDataset(X_train, y_train)
    val_dataset = AudioDataset(X_val, y_val)
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, 
                             shuffle=True, num_workers=args.num_workers, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, 
                           shuffle=False, num_workers=args.num_workers, pin_memory=True)
    
    # 모델 저장 폴더 생성
    os.makedirs('models', exist_ok=True)
    
    # 모델 학습
    print("\n🔥 모델 학습 시작...\n")
    model = ASTModel(num_classes=2).to(DEVICE)
    
    # 파라미터 수 출력
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"📊 모델 파라미터: {total_params:,} (학습 가능: {trainable_params:,})\n")
    
    history = train_model(model, train_loader, val_loader, 
                         epochs=args.epochs, lr=args.lr, 
                         save_path='models/ast_best.pth')
    
    # 학습 곡선 저장
    print("\n📊 학습 곡선 저장 중...")
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    
    axes[0].plot(history['train_loss'], label='Train', marker='o')
    axes[0].plot(history['val_loss'], label='Val', marker='s')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    axes[1].plot(history['train_acc'], label='Train', marker='o')
    axes[1].plot(history['val_acc'], label='Val', marker='s')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy (%)')
    axes[1].set_title('Training and Validation Accuracy')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history.png', dpi=150)
    
    print("\n" + "="*70)
    print("✅ 학습 완료!")
    print("="*70)
    print("📦 저장된 파일:")
    print("   - models/ast_best.pth (학습된 모델)")
    print("   - training_history.png (학습 곡선)")
    print(f"\n🏆 최종 성능:")
    print(f"   Best Val Accuracy: {max(history['val_acc']):.2f}%")
    print("="*70)


if __name__ == "__main__":
    main()
