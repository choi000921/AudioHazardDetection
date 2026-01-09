import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix
import numpy as np
import pandas as pd

def save_confusion_matrix(y_test, y_pred, classes, model_name):
    # 1. Confusion Matrix 계산
    cm = confusion_matrix(y_test, y_pred)
    
    # 2. 시각화 설정 (한글 폰트가 서버에 없을 수 있어 영어로 표기하거나 폰트 설정이 필요함)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=classes, yticklabels=classes)
    
    plt.title(f'Confusion Matrix - {model_name}', fontsize=15)
    plt.ylabel('Actual Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    
    # 3. 이미지 저장
    plt.tight_layout()
    plt.savefig(f'result_chart_{model_name}.png')
    print(f"차트가 'result_chart_{model_name}.png'로 저장되었습니다.")
    plt.close()

# 이 함수를 train_model.py의 main() 함수 끝부분, 
# 각 모델의 예측(y_pred)이 끝나는 시점에 호출하시면 됩니다.