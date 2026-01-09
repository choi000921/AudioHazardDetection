import axios from 'axios';

// CHANGED: Axios instance with correct backend port and credentials
const api = axios.create({
  baseURL: 'http://localhost:8080', // CHANGED: 백엔드 포트 8080으로 통일
  withCredentials: true, // 세션 쿠키 전송을 위해 필수
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;