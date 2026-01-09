import api from './axios';

// CHANGED: Authentication API functions with form-urlencoded login
export const authAPI = {
  // CHANGED: 로그인 (email을 username으로 사용, form-urlencoded)
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('email', email); // CHANGED: email 파라미터 사용
    params.append('password', password);
    
    const response = await api.post('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // 로그아웃
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // CHANGED: 회원가입 (email 기반)
  signup: async (email, password, name) => {
    const response = await api.post('/api/auth/signup', {
      email,
      password,
      name,
    });
    return response.data;
  },

  // CHANGED: 현재 사용자 정보 조회 (경로 수정)
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};