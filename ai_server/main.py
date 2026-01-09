"""
CHANGED: 팀원 추론 코드 연결 FastAPI 서버
실제 ScreamDetectionPipeline을 사용하는 AI 서버
"""

import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
from src.inference_adapter import predict

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Alertory AI Server", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Alertory AI Server", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI 서버가 정상 작동 중입니다."}

@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):
    """
    오디오 파일을 받아서 응급상황 여부를 판별
    
    Returns:
        {
            "label": str,        # SCREAM, Normal 등
            "confidence": float, # 0-100 신뢰도
            "text": str,         # 결과 설명 텍스트
            "is_danger": bool    # 위험 상황 여부
        }
    """
    temp_file_path = None
    
    try:
        # 파일 확장자 검증
        if not file.filename:
            raise HTTPException(status_code=400, detail="파일명이 필요합니다.")
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = ['.wav', '.mp3', '.flac', '.m4a', '.webm', '.aac', '.ogg']
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"지원되지 않는 파일 형식: {file_ext}. 지원 형식: {', '.join(allowed_extensions)}"
            )
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        logger.info(f"파일 수신: {file.filename} ({len(content)} bytes)")
        
        # 추론 실행
        result = predict(temp_file_path)
        
        logger.info(f"추론 완료: {result}")
        return result
        
    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.error(f"파일을 찾을 수 없음: {e}")
        raise HTTPException(status_code=400, detail="업로드된 파일을 처리할 수 없습니다.")
    except Exception as e:
        logger.error(f"예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")
    finally:
        # 임시 파일 정리
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"임시 파일 삭제 실패: {e}")

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Alertory AI Server 시작 중...")
    logger.info("📡 포트: 8001")
    logger.info("🔗 엔드포인트: http://localhost:8001/predict")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
