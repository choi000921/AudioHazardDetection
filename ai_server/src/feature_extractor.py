import librosa
import numpy as np
import os
from tqdm import tqdm

class AudioFeatureExtractor:
    def __init__(self, sr=22050, n_mels=128, duration=3):
        self.sr = sr
        self.n_mels = n_mels
        self.duration = duration
        self.target_length = sr * duration

    def _pad_or_truncate(self, audio):
        """음성 데이터의 길이를 동일하게 맞춤 (Padding & Truncating)"""
        if len(audio) > self.target_length:
            return audio[:self.target_length]
        else:
            return np.pad(audio, (0, self.target_length - len(audio)), 'constant')

    def extract_mel_features(self, file_path):
        """고도화된 특징 추출: Mel + Delta + Spectral Centroid + ZCR"""
        try:
            # 1. 파일 로드
            audio, _ = librosa.load(file_path, sr=self.sr)
            audio = self._pad_or_truncate(audio)
            
            # 2. 진폭 정규화
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio))

            # 3. Mel-spectrogram 추출 및 dB 변환
            mel_spec = librosa.feature.melspectrogram(
                y=audio, sr=self.sr, n_mels=self.n_mels, fmax=8000
            )
            log_mel = librosa.power_to_db(mel_spec, ref=np.max)
            
            # --- [추가 특징 추출 섹션] ---
            
            # 4. Delta (변화율) 및 Delta-Delta (가속도)
            # 시간에 따른 주파수 변화를 측정 (비명 감지에 핵심)
            delta = librosa.feature.delta(log_mel)
            delta2 = librosa.feature.delta(log_mel, order=2)
            
            # 5. Spectral Centroid (소리의 중심 주파수)
            # 날카로운 소리(비명)일수록 값이 큼
            centroid = librosa.feature.spectral_centroid(y=audio, sr=self.sr)
            
            # 6. Zero Crossing Rate (ZCR)
            # 금속성 마찰음이나 파찰음을 구분
            zcr = librosa.feature.zero_crossing_rate(audio)
            
            # --- [특징 결합 섹션] ---
            
            # 통계치(평균, 표준편차) 계산
            mf_mean = np.mean(log_mel, axis=1)
            mf_std = np.std(log_mel, axis=1)
            delta_mean = np.mean(delta, axis=1)
            delta2_mean = np.mean(delta2, axis=1)
            
            # 모든 특징을 하나로 합침 (총 차원: 128 + 128 + 128 + 128 + 1 + 1 = 514차원)
            combined_features = np.hstack([
                mf_mean, mf_std, 
                delta_mean, delta2_mean, 
                np.mean(centroid), np.mean(zcr)
            ])
            
            return combined_features

        except Exception as e:
            return None

    def build_dataset(self, base_path, categories, max_files_per_class=10000):
        """데이터셋 구축 로직"""
        features = []
        labels = []
        
        for category in categories:
            folder_path = os.path.join(base_path, category)
            print(f"\n[탐색 시작] 카테고리: {category}")
            
            all_wav_files = []
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    if file.endswith('.wav'):
                        all_wav_files.append(os.path.join(root, file))
            
            print(f"-> 발견된 총 파일 수: {len(all_wav_files)}개")
            
            np.random.seed(42)
            np.random.shuffle(all_wav_files)
            target_files = all_wav_files[:max_files_per_class]
            
            for file_path in tqdm(target_files, desc=f"{category} 전처리 중"):
                feat = self.extract_mel_features(file_path)
                if feat is not None:
                    features.append(feat)
                    labels.append(category.split('/')[-1])
                    
        return np.array(features), np.array(labels)

if __name__ == "__main__":
    print("이 파일은 도구함입니다. 'train_model.py'를 실행하여 전체 과정을 진행하세요.")