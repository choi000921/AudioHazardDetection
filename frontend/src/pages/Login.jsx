import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '', // CHANGED: username에서 email로 변경
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        setError('이메일과 비밀번호를 입력해주세요.');
        return;
      }

      // CHANGED: 실제 API 호출로 로그인
      const loginResult = await authAPI.login(formData.email, formData.password);
      
      if (loginResult.success) {
        // 로그인 성공 후 사용자 정보 조회
        const userResult = await authAPI.getCurrentUser();
        if (userResult.success) {
          login(userResult.user);
          navigate('/dashboard');
        } else {
          setError('사용자 정보를 가져올 수 없습니다.');
        }
      } else {
        setError(loginResult.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">A</div>
          <h1 className="auth-title">Alertory</h1>
          <p className="auth-subtitle">공장 위급상황 감지 시스템</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label">이메일</label>
            <input
              type="email"
              name="email"
              className="auth-form-input"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">비밀번호</label>
            <input
              type="password"
              name="password"
              className="auth-form-input"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-link-container">
          <span style={{ color: '#718096', fontSize: '14px' }}>
            계정이 없으신가요?{' '}
            <Link to="/signup" className="auth-link">
              회원가입
            </Link>
          </span>
        </div>

        <div className="auth-info">
          <strong>테스트 계정:</strong><br />
          이메일: admin@alertory.com<br />
          비밀번호: 1234
        </div>
      </div>
    </div>
  );
};

export default Login;