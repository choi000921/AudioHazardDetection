#!/bin/bash
# GPU 서버 환경 설정 스크립트

echo "=================================="
echo "🚀 GPU 서버 환경 설정"
echo "=================================="

# 1. Python 버전 확인
echo "📌 Python 버전 확인..."
python3 --version

# 2. PyTorch 설치 (CUDA 11.8)
echo ""
echo "📦 PyTorch 설치 중..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 3. 필요한 패키지 설치
echo ""
echo "📦 필요한 패키지 설치 중..."
pip3 install -r requirements.txt
pip3 install tqdm matplotlib seaborn

# 4. models 폴더 생성
echo ""
echo "📁 models 폴더 생성..."
mkdir -p models

# 5. GPU 확인
echo ""
echo "🔥 GPU 정보:"
python3 -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'GPU Count: {torch.cuda.device_count()}'); print(f'GPU Name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')"

echo ""
echo "=================================="
echo "✅ 환경 설정 완료!"
echo "=================================="
echo ""
echo "📝 다음 단계:"
echo "1. 데이터를 서버에 업로드하세요"
echo "2. 학습 실행:"
echo "   python3 train_scream_model_server.py --data_path /path/to/Processed_Data_Full"
echo ""
