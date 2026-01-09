import os
import sys
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# 고도화된 feature_extractor.py 불러오기
from feature_extractor import AudioFeatureExtractor

# 1. 경로 및 설정
BASE_PATH = '/home/ubuntu/voice_analysis/data/final_data'
CATEGORIES = [
    '배경 소음 클래스', 
    '음성 클래스', 
    'Processed_Data_Full/Scream'
]

def save_confusion_matrix(y_test, y_pred, classes, model_name):
    """학습 결과를 시각화하여 저장하는 함수"""
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=classes, yticklabels=classes)
    plt.title(f'Confusion Matrix - {model_name} (High-Dim Features)', fontsize=15)
    plt.ylabel('Actual Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.tight_layout()
    plt.savefig(f'result_chart_{model_name}_v2.png')
    print(f"-> 성능 차트가 'result_chart_{model_name}_v2.png'로 저장되었습니다.")
    plt.close()

def main():
    print("="*50)
    print("고도화된 음성 분석 모델 재학습을 시작합니다.")
    print("특징값: Mel + Delta + Centroid + ZCR (514차원)")
    print("="*50)

    # 2. 특징 추출 (전처리)
    extractor = AudioFeatureExtractor(duration=3)
    
    # 각 클래스당 10,000개 추출 (고도화된 extract_mel_features 사용)
    X, y = extractor.build_dataset(BASE_PATH, CATEGORIES, max_files_per_class=10000)
    
    if len(X) == 0:
        print("에러: 데이터를 찾지 못했습니다. 경로를 확인하세요.")
        return

    # [Hard Negative Mining] 기계 소음 데이터 보강
    MACHINE_PATH = os.path.join(BASE_PATH, '배경 소음 클래스')
    MACHINE_SUB_DIR = ['Machine_Tool_Noise(일반 기계들)']
    
    print("\n[전략] 기계 소음 오탐 방지를 위한 추가 데이터 보강 중...")
    try:
        X_extra, y_extra = extractor.build_dataset(MACHINE_PATH, MACHINE_SUB_DIR, max_files_per_class=5000)
        y_extra = np.array(['배경 소음 클래스'] * len(y_extra))
        X = np.vstack([X, X_extra])
        y = np.hstack([y, y_extra])
        print(f"-> 기계 소음 데이터 {len(X_extra)}개 보강 완료. (총 데이터: {len(X)}개)")
    except Exception as e:
        print(f"기계 소음 보강 건너뜀: {e}")

    # 3. 데이터 인코딩 및 분할
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # 4. 데이터 스케일링 (중요: 특징마다 단위가 다르므로 반드시 필요)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # 5. 모델 정의 (고차원 데이터에 최적화된 파라미터)
    models = {
        "XGBoost": XGBClassifier(
            n_estimators=500,       # 특징이 많아졌으므로 나무 개수 증가
            learning_rate=0.05,     # 더 촘촘하게 학습
            max_depth=8,            # 복잡한 소음 패턴을 잡기 위해 깊이 조절
            subsample=0.8,          # 과적합 방지
            colsample_bytree=0.8,   # 특징 선택 다양화
            eval_metric='mlogloss',
            random_state=42,
            n_jobs=-1
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=500, 
            max_depth=20, 
            random_state=42, 
            n_jobs=-1
        )
    }

    # 6. 모델 학습 및 평가
    results = {}
    for name, model in models.items():
        print(f"\n[{name}] 고도화 학습 시작 (이 과정은 시간이 다소 소요될 수 있습니다)...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        results[name] = acc
        
        print(f"{name} 최종 정확도: {acc:.4f}")
        print(classification_report(y_test, y_pred, target_names=le.classes_))
        
        # 결과 시각화 및 저장
        save_confusion_matrix(y_test, y_pred, le.classes_, name)

    # 7. 최적의 모델 저장
    best_model_name = max(results, key=results.get)
    joblib.dump(models[best_model_name], 'best_voice_model_xgb.pkl')
    joblib.dump(le, 'label_encoder.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    
    print("\n" + "="*50)
    print(f"🎉 재학습 완료! 최적 모델 저장됨: {best_model_name}")
    print(f"전체 평균 정확도: {results[best_model_name]:.4f}")
    print("="*50)

if __name__ == "__main__":
    main()