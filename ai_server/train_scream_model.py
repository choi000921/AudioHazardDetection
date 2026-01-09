"""
2-클래스 위급상황 감지 모델 학습 스크립트
데이터 경로: C:\\Users\\015h\\Downloads\\Processed_Data_Full
    - Scream: 위급상황 (비명 + 도움요청 통합)
    - Notscream: 정상 소리
"""
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import librosa
from tqdm import tqdm
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import sys
sys.path.append('..')
from models import ASTModel


DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {DEVICE}")

# 데이터 경로
DATA_PATH = r"C:\Users\015h\Downloads\Processed_Data_Full"
SCREAM_PATH = os.path.join(DATA_PATH, "Scream")  # 비명 + 도움요청 통합
NOTSCREAM_PATH = os.path.join(DATA_PATH, "Notscream")


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
    files = []
    for root, _, filenames in os.walk(folder_path):
        for f in filenames:
            if f.endswith(('.wav', '.mp3', '.flac', '.ogg')):
                files.append(os.path.join(root, f))
    
    if max_files and len(files) > max_files:
        files = np.random.choice(files, max_files, replace=False).tolist()
    
    labels = [label] * len(files)
    return files, labels


def train_model(model, train_loader, val_loader, epochs=30, lr=0.001):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'max', factor=0.5, patience=3)
    
    best_acc = 0.0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    
    for epoch in range(epochs):
        # Train
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        
        for inputs, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs} [Train]"):
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
        
        train_acc = 100. * train_correct / train_total
        train_loss /= len(train_loader)
        
        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        
        with torch.no_grad():
            for inputs, labels in tqdm(val_loader, desc=f"Epoch {epoch+1}/{epochs} [Val]"):
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, pred = outputs.max(1)
                val_total += labels.size(0)
                val_correct += pred.eq(labels).sum().item()
        
        val_acc = 100. * val_correct / val_total
        val_loss /= len(val_loader)
        
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"Epoch {epoch+1}: Train Acc={train_acc:.2f}%, Val Acc={val_acc:.2f}%")
        
        scheduler.step(val_acc)
        
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), '../models/ast_best.pth')
            print(f"Best model saved! (Val Acc: {val_acc:.2f}%)")
    
    return history


def main():
    print("="*60)
    print("비명 감지 모델 학습")
    print("="*60)
    
    # 데이터 수집
    print("\n데이터 수집 중...")
    notscream_files, notscream_labels = collect_files(NOTSCREAM_PATH, 0, max_files=5000)
    scream_files, scream_labels = collect_files(SCREAM_PATH, 1, max_files=5000)
    
    print(f"  정상(Notscream): {len(notscream_files)}개")
    print(f"  위급(Scream): {len(scream_files)}개")
    
    all_files = notscream_files + scream_files
    all_labels = notscream_labels + scream_labels
    
    # 데이터 분할
    X_train, X_val, y_train, y_val = train_test_split(
        all_files, all_labels, test_size=0.2, random_state=42, stratify=all_labels
    )
    
    print(f"\nTrain: {len(X_train)}개, Val: {len(X_val)}개")
    
    # 데이터로더
    train_dataset = AudioDataset(X_train, y_train)
    val_dataset = AudioDataset(X_val, y_val)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=2)
    
    # 모델 학습
    print("\n모델 학습 시작...\n")
    model = ASTModel(num_classes=2).to(DEVICE)
    history = train_model(model, train_loader, val_loader, epochs=30, lr=0.001)
    
    # 학습 곡선 저장
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(history['train_loss'], label='Train')
    axes[0].plot(history['val_loss'], label='Val')
    axes[0].set_title('Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    axes[1].plot(history['train_acc'], label='Train')
    axes[1].plot(history['val_acc'], label='Val')
    axes[1].set_title('Accuracy (%)')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    
    print("\n" + "="*60)
    print("학습 완료!")
    print("저장: ../models/ast_best.pth")
    print("그래프: training_history.png")
    print("="*60)


if __name__ == "__main__":
    main()
