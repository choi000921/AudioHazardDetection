import joblib
import numpy as np
import librosa
import sys
import os
import warnings
import re
import torch
from feature_extractor import AudioFeatureExtractor

# 경고 무시
warnings.filterwarnings("ignore")

# Whisper 모델 로드 (메모리 효율을 위해 small 사용)
try:
    import whisper
    # CUDA 사용 가능 시 GPU로 로드
    device = "cuda" if torch.cuda.is_available() else "cpu"
    whisper_model = whisper.load_model("small").to(device)
except ImportError:
    whisper_model = None

def estimate_gender(y, sr):
    """주파수 분석을 통한 성별 추정"""
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_values = [pitches[magnitudes[:, t].argmax(), t] for t in range(pitches.shape[1]) 
                    if 50 < pitches[magnitudes[:, t].argmax(), t] < 500]
    if not pitch_values: return "판별 불가"
    return "남성 추정" if np.mean(pitch_values) < 165 else "여성 추정"

def detect_keywords(file_path):
    """Whisper를 이용한 키워드 감지 및 신뢰도 분석"""
    if whisper_model is None: return "STT 엔진 미설치", False, 1.0

    options = {
        "language": "ko",
        "beam_size": 5,
        "fp16": torch.cuda.is_available(),
        "temperature": 0,
        "no_speech_threshold": 0.5, # 소음 필터링 기준 강화
    }
    
    try:
        result = whisper_model.transcribe(file_path, **options)
        text = result['text'].strip()
        
        # 말소리가 아닐 확률 (높을수록 기계 소음일 가능성 큼)
        # result['segments'][0]가 없을 경우를 대비해 안전하게 추출
        no_speech_prob = result['segments'][0]['no_speech_prob'] if result['segments'] else 1.0
        
        # 텍스트 정제
        text = re.sub(r'[^\w\s가-힣]', '', text) 
        has_hangul = bool(re.search('[가-힣]', text))
        display_text = text if has_hangul and len(text) >= 1 else "(음성 확인 불가)"
        
        # 위험 키워드 리스트
        danger_keywords = ["살려", "도와", "사람", "신고", "강도", "사고", "위험", "조심", "사나워", "물어", "아야"]
        is_dangerous = any(word in text for word in danger_keywords)
        
        return display_text, is_dangerous, no_speech_prob
    except Exception:
        return "(분석 오류)", False, 1.0

def predict_audio(file_path):
    try:
        # 1. 고도화된 모델 및 구성요소 로드
        model = joblib.load('best_voice_model_xgb.pkl')
        scaler = joblib.load('scaler.pkl')
        le = joblib.load('label_encoder.pkl')
        
        # 2. 특징 추출 (Delta, ZCR 등 포함된 514차원)
        extractor = AudioFeatureExtractor(duration=3)
        features = extractor.extract_mel_features(file_path)
        
        if features is None:
            print("파일을 읽을 수 없습니다.")
            return

        # 3. ML 모델 예측 (물리적 특징 기반)
        features_scaled = scaler.transform(features.reshape(1, -1))
        probability = model.predict_proba(features_scaled)
        confidence = np.max(probability) * 100
        raw_label = le.inverse_transform([np.argmax(probability)])[0]

        # 4. Whisper 상세 분석 (언어적 문맥 기반)
        detected_text, has_danger_word, no_speech_prob = detect_keywords(file_path)
        
        # 5. 최종 판정 로직 (Hybrid Decision)
        # 상황 A: 비명(Scream)으로 판단되고 확신도가 매우 높을 때 (90% 이상)
        # 상황 B: 음성 감지 중 위험 키워드가 포함되었을 때
        # 상황 C: 비명으로 판단되었으나 Whisper가 소음이라고 판단(no_speech_prob > 0.8)하면 신중히 처리
        
        is_emergency = False
        if raw_label == 'Scream' and confidence >= 90.0:
            is_emergency = True
        elif (raw_label == 'Scream' or raw_label == '음성 클래스') and has_danger_word:
            is_emergency = True
        
        # 최종 결과 출력 설정
        if is_emergency:
            result_status = "🚨 응급상황 감지 (Emergency)"
        elif (raw_label == 'Scream' or raw_label == '음성 클래스') and confidence >= 70.0:
            result_status = "📢 음성 감지 (Normal/Voice)"
        else:
            result_status = "✅ 정상 상태 (Background/Noise)"

        # 성별 및 국적 분석 (음성인 경우에만)
        if "정상" not in result_status:
            y, sr = librosa.load(file_path)
            gender = estimate_gender(y, sr)
            nationality = "내국인" if "내국인" in file_path else "외국인/미분류"
            detail_msg = f"내용: '{detected_text}'"
        else:
            gender, nationality, detail_msg = "-", "-", "특이사항 없음"

        # 결과 리포트 출력
        print("\n" + "="*70)
        print(f" [파일명]: {os.path.basename(file_path)}")
        print(f" 결과:    {result_status}")
        print(f" ML분류:  {raw_label} (확신도: {confidence:.2f}%)")
        if "정상" not in result_status:
            print(f" 성별/국적: {gender}  |  {nationality}")
            print(f" STT내용:  {detail_msg} (소음확률: {no_speech_prob*100:.1f}%)")
        print("="*70 + "\n")

        # 메모리 정리
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    if len(sys.argv) >= 2:
        predict_audio(sys.argv[1])
    else:
        print("사용법: python3 test_audio.py <파일경로>")