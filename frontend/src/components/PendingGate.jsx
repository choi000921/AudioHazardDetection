import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// ADDED: PendingGate component for non-ACTIVE users
const PendingGate = () => {
  const { user, logout } = useAuth();

  const getStatusMessage = (status) => {
    switch (status) {
      case 'PENDING':
        return '승인이 필요한 계정입니다.\n관리자에게 연락 바랍니다. 1234-5678';
      case 'REJECTED':
        return '가입이 거절된 계정입니다.\n관리자에게 문의 바랍니다. 1234-5678';
      case 'SUSPENDED':
        return '정지된 계정입니다.\n관리자에게 문의 바랍니다. 1234-5678';
      default:
        return '계정 상태를 확인할 수 없습니다.\n관리자에게 문의 바랍니다. 1234-5678';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px', color: '#dc3545' }}>
          접근 제한
        </h2>
        
        <div className="alert alert-warning">
          <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
            {getStatusMessage(user?.status)}
          </p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <p><strong>계정:</strong> {user?.email}</p>
          <p><strong>이름:</strong> {user?.name}</p>
          <p><strong>상태:</strong> {user?.status}</p>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
          >
            로그아웃
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleBackToLogin}
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingGate;