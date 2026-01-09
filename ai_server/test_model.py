"""
학습된 모델 테스트 스크립트
검증용 wav 파일로 모델 성능 확인
"""
import os
import sys
import torch
import librosa
import numpy as np
from pathlib import Path

sys.path.append('.')
from models import ASTModel

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {DEVICE}")


def load_audio(file_path, duration=3, sr=16000, n_mels=80):
    """오디오 로드 및 전처리"""
    try:
        audio, _ = librosa.load(file_path, sr=sr, mono=True)
        audio = librosa.util.fix_length(audio, size=sr * duration)
        
        # Mel-spectrogram 변환
        mel_spec = librosa.feature.melspectrogram(
            y=audio, sr=sr, n_mels=n_mels,
            n_fft=1024, hop_length=320
        )
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # 정규화
        mel_spec_db = (mel_spec_db - mel_spec_db.mean()) / (mel_spec_db.std() + 1e-8)
        
        return torch.FloatTensor(mel_spec_db).unsqueeze(0)
    except Exception as e:
        print(f"오디오 로드 실패: {e}")
        return None


def predict_single_file(model, file_path):
    """단일 파일 예측"""
    audio_tensor = load_audio(file_path)
    if audio_tensor is None:
        return None, None
    
    audio_tensor = audio_tensor.unsqueeze(0).to(DEVICE)  # (1, 1, 80, T)
    
    with torch.no_grad():
        output = model(audio_tensor)
        probs = torch.softmax(output, dim=1)[0]
        predicted_class = probs.argmax().item()
        confidence = probs[predicted_class].item()
    
    class_names = ["정상(NORMAL)", "위급(EMERGENCY)"]
    return class_names[predicted_class], confidence


def test_folder(model, folder_path):
    """폴더 내 모든 wav 파일 테스트"""
    wav_files = list(Path(folder_path).rglob('*.wav'))
    
    if not wav_files:
        print(f"❌ {folder_path}에 wav 파일이 없습니다.")
        return
    
    print(f"\n📂 테스트 폴더: {folder_path}")
    print(f"   총 {len(wav_files)}개 파일 발견\n")
    print("="*70)
    
    results = {"정상(NORMAL)": 0, "위급(EMERGENCY)": 0}
    
    for i, file_path in enumerate(wav_files, 1):
        prediction, confidence = predict_single_file(model, str(file_path))
        
        if prediction is None:
            continue
        
        results[prediction] += 1
        
        # 결과 출력
        status_icon = "🚨" if "위급" in prediction else "✅"
        print(f"{status_icon} [{i:3d}] {file_path.name}")
        print(f"        예측: {prediction} (신뢰도: {confidence*100:.1f}%)")
        print("-"*70)
    
    print("\n" + "="*70)
    print("📊 테스트 결과 요약")
    print("="*70)
    print(f"  ✅ 정상(NORMAL):    {results['정상(NORMAL)']:3d}개")
    print(f"  🚨 위급(EMERGENCY): {results['위급(EMERGENCY)']:3d}개")
    print(f"  📁 총 파일:         {len(wav_files):3d}개")
    print("="*70)


def main():
    print("="*70)
    print("학습된 모델 테스트 도구")
    print("="*70)
    
    # 모델 로드
    model_path = "models/ast_best.pth"
    if not os.path.exists(model_path):
        print(f"❌ 모델 파일을 찾을 수 없습니다: {model_path}")
        print("   먼저 train_scream_model.py로 학습을 진행하세요.")
        return
    
    print(f"\n📦 모델 로드 중: {model_path}")
    model = ASTModel(num_classes=2).to(DEVICE)
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.eval()
    print("✅ 모델 로드 완료\n")
    
    # 사용법 안내
    print("\n사용법:")
    print("  1. 단일 파일 테스트: python test_model.py <파일경로>")
    print("  2. 폴더 테스트:     python test_model.py <폴더경로>")
    print("  3. 대화형 모드:     python test_model.py\n")
    
    # 인자가 있으면 해당 경로 테스트
    if len(sys.argv) > 1:
        test_path = sys.argv[1]
        
        if os.path.isfile(test_path):
            # 단일 파일
            print(f"📄 단일 파일 테스트: {test_path}\n")
            prediction, confidence = predict_single_file(model, test_path)
            if prediction:
                status_icon = "🚨" if "위급" in prediction else "✅"
                print(f"{status_icon} 예측: {prediction}")
                print(f"   신뢰도: {confidence*100:.1f}%")
        
        elif os.path.isdir(test_path):
            # 폴더 테스트
            test_folder(model, test_path)
        
        else:
            print(f"❌ 경로를 찾을 수 없습니다: {test_path}")
    
    else:
        # 대화형 모드
        while True:
            print("\n" + "="*70)
            user_input = input("테스트할 파일/폴더 경로 입력 (종료: q): ").strip()
            
            if user_input.lower() == 'q':
                print("종료합니다.")
                break
            
            if not os.path.exists(user_input):
                print(f"❌ 경로를 찾을 수 없습니다: {user_input}")
                continue
            
            if os.path.isfile(user_input):
                prediction, confidence = predict_single_file(model, user_input)
                if prediction:
                    status_icon = "🚨" if "위급" in prediction else "✅"
                    print(f"\n{status_icon} 예측: {prediction}")
                    print(f"   신뢰도: {confidence*100:.1f}%")
            
            elif os.path.isdir(user_input):
                test_folder(model, user_input)


if __name__ == "__main__":
    main()
