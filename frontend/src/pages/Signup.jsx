import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '', // CHANGED: username에서 email로 변경
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 유효성 검사
      if (!formData.name.trim()) {
        setError('이름을 입력해주세요.');
        return;
      }
      
      if (!formData.email.trim()) {
        setError('이메일을 입력해주세요.');
        return;
      }
      
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return;
      }
      
      if (formData.password.length < 4) {
        setError('비밀번호는 4자리 이상이어야 합니다.');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      // CHANGED: 실제 API 호출로 회원가입
      const result = await authAPI.signup(formData.email, formData.password, formData.name);
      
      if (result.success) {
        setSuccess('회원가입이 완료되었습니다! 관리자 승인 후 로그인 가능합니다.');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || '회원가입에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
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
          <h1 className="auth-title">회원가입</h1>
          <p className="auth-subtitle">Alertory 시스템 가입</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label">이름</label>
            <input
              type="text"
              name="name"
              className="auth-form-input"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="실명을 입력하세요"
            />
          </div>

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
              placeholder="4자리 이상 입력하세요"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              className="auth-form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-link-container">
          <span style={{ color: '#718096', fontSize: '14px' }}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="auth-link">
              로그인
            </Link>
          </span>
        </div>

        <div className="auth-info">
          <strong>회원가입 안내:</strong><br />
          • 이메일로 계정을 생성합니다<br />
          • 가입 후 관리자 승인이 필요합니다<br />
          • 승인 완료 후 로그인 가능합니다
        </div>
      </div>
    </div>
  );
};

export default Signup;