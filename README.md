# Alertory
실시간 음성 인식 이상 상황 감지 프로젝트

## 🎯 프로젝트 개요

PyTorch 기반 AI 모델을 사용하여 짧은 음성 파일에서 응급상황을 감지하는 웹 애플리케이션입니다.

## 🏗️ 시스템 구조

- **Frontend**: React + Vite (포트 5173)
- **Backend**: Spring Boot (포트 8080)
- **Database**: MySQL (포트 3306)
- **AI Server**: FastAPI + PyTorch (포트 8001)

## 🚀 실행 방법

### 1. MySQL 데이터베이스 준비

```bash
# MySQL 서버 실행 후
mysql -u root -p
CREATE DATABASE alertory;
```

### 2. Spring Boot 백엔드 실행

```bash
./gradlew bootRun
```

### 3. React 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

### 4. AI 서버 실행 (선택사항)

```bash
cd ai_server
pip install -r requirements.txt
python start_server.py
```

### 5. 웹 애플리케이션 접속

http://localhost:5173 에서 애플리케이션을 사용할 수 있습니다.

## 🧪 인증 시스템 테스트 절차

### 1. 존재하지 않는 계정으로 로그인 테스트
```
1. http://localhost:5173/login 접속
2. 존재하지 않는 이메일 입력 (예: nonexistent@test.com)
3. 임의 비밀번호 입력
4. 로그인 버튼 클릭
5. ✅ 401 오류와 "로그인 실패" 메시지 확인
```

### 2. 회원가입 및 MySQL 저장 확인
```
1. http://localhost:5173/signup 접속
2. 이름: "테스트 사용자"
3. 이메일: "newuser@test.com"
4. 비밀번호: "1234"
5. 비밀번호 확인: "1234"
6. 회원가입 버튼 클릭
7. ✅ "회원가입이 완료되었습니다" 메시지 확인
8. MySQL에서 확인:
   ```sql
   USE alertory;
   SELECT * FROM users WHERE email = 'newuser@test.com';
   ```
9. ✅ users 테이블에 새 사용자 저장 확인
```

### 3. 가입한 계정으로 로그인 테스트
```
1. http://localhost:5173/login 접속
2. 이메일: "newuser@test.com"
3. 비밀번호: "1234"
4. 로그인 버튼 클릭
5. ✅ 200 응답과 로그인 성공 확인
6. ✅ 브라우저 개발자도구 > Application > Cookies에서 ALERTORY_SESSION 쿠키 생성 확인
```

### 4. 사용자 정보 조회 테스트
```
1. 로그인 상태에서 브라우저 개발자도구 > Console 열기
2. 다음 코드 실행:
   ```javascript
   fetch('/api/auth/me', { credentials: 'include' })
     .then(res => res.json())
     .then(data => console.log(data));
   ```
3. ✅ 응답에서 email, name, role, status 정보 확인
4. ✅ status가 "PENDING"인 경우 PendingGate 화면 표시 확인
```

### 5. 기본 테스트 계정
```
관리자 계정 (ACTIVE):
- 이메일: admin@alertory.com
- 비밀번호: 1234

일반 사용자 (ACTIVE):
- 이메일: user@test.com
- 비밀번호: 1234

승인 대기 사용자 (PENDING):
- 이메일: pending@test.com
- 비밀번호: 1234
```

## 📱 주요 기능

### 오디오 업로드 및 분석
- WAV, MP3, M4A, FLAC 파일 지원
- 실시간 AI 분석으로 응급상황 감지
- 감지 결과: SCREAM, HELP, NORMAL
- 신뢰도 점수 제공

### 분석 결과 관리
- 이벤트 저장 및 조회
- 위치 정보 기반 관리
- 대시보드에서 실시간 모니터링

### 사용자 상태 관리
- PENDING: 관리자 승인 대기 (로그인 가능, 서비스 접근 제한)
- ACTIVE: 모든 기능 사용 가능
- REJECTED: 계정 거절됨
- SUSPENDED: 계정 일시 정지

## 🤖 AI 모델

### 현재 사용 중인 모델
- **DCCRN**: 노이즈 제거 (선택적)
- **Custom Analysis**: 오디오 특성 기반 응급상황 판별

### 모델 파일 위치
```
ai_server/models/
├── dccrn_model.pth  # 노이즈 제거 모델
```

### 분석 로직
1. 오디오 전처리 (16kHz, 3초)
2. 노이즈 제거 (DCCRN 모델 사용 시)
3. 오디오 특성 분석 (RMS 에너지, 스펙트럴 중심, 영교차율)
4. 임계값 기반 응급상황 판별

## 🔧 개발 환경 설정

### 필수 요구사항
- Python 3.8+
- Node.js 16+
- Java 17+
- MySQL 8.0+
- PyTorch

### 의존성 설치

**AI 서버:**
```bash
cd ai_server
pip install torch torchaudio librosa fastapi uvicorn python-multipart
```

**프론트엔드:**
```bash
cd frontend
npm install
```

**백엔드:**
```bash
./gradlew build
```

## 📊 API 엔드포인트

### 인증 API (포트 8080)
- `POST /api/auth/signup`: 회원가입 (JSON)
- `POST /api/auth/login`: 로그인 (form-urlencoded)
- `GET /api/auth/me`: 현재 사용자 정보
- `POST /api/auth/logout`: 로그아웃

### AI 서버 (포트 8001)
- `POST /analyze`: 오디오 파일 분석
- `GET /health`: 서버 상태 확인
- `GET /docs`: API 문서

### Spring Boot 백엔드 (포트 8080)
- `POST /api/audio/upload`: 오디오 업로드 및 분석
- 기타 이벤트 관리 API

## 🐛 문제 해결

### MySQL 연결 오류
1. MySQL 서버가 실행 중인지 확인
2. `application.properties`의 DB 설정 확인
3. `alertory` 데이터베이스 생성 확인

### 세션 쿠키 문제
1. 프론트엔드가 5173 포트에서 실행 중인지 확인
2. 백엔드가 8080 포트에서 실행 중인지 확인
3. CORS 설정 확인

### AI 서버 연결 오류
1. AI 서버가 8001 포트에서 실행 중인지 확인
2. `http://localhost:8001/health`로 상태 확인

## 📝 사용법

1. 웹 애플리케이션에 접속
2. 회원가입 또는 기본 계정으로 로그인
3. 관리자 승인 후 서비스 이용 가능
4. "Upload" 페이지에서 오디오 파일 업로드
5. AI 분석 결과 확인

## 🎨 커스터마이징

### AI 분석 로직 수정
`ai_server/main.py`의 `analyze_emergency_audio` 함수를 수정하여 분석 알고리즘을 변경할 수 있습니다.

### 새로운 모델 추가
1. `ai_server/models/` 폴더에 `.pth` 파일 추가
2. `ai_server/main.py`에서 모델 로딩 코드 수정
3. 분석 로직에 새 모델 적용
