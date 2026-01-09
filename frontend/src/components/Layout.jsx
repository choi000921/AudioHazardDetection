import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { path: '/dashboard', label: '대시보드', icon: '📊' },
    { path: '/realtime', label: '실시간 감지', icon: '🎤' },
    { path: '/events', label: '이벤트', icon: '🚨' },
    { path: '/notifications', label: '알림', icon: '🔔' },
    { path: '/analytics', label: '분석', icon: '📈' },
    { path: '/audio-archive', label: '음성 보관함', icon: '🎵' },
    { path: '/admin', label: '관리자', icon: '👥' },
    { path: '/settings', label: '설정', icon: '⚙️' },
    { path: '/upload', label: '오디오 업로드', icon: '📤' },
  ];

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item ? item.label : 'Alertory';
  };

  const handleLogout = () => {
    if (confirm('정말로 로그아웃하시겠습니까?')) {
      setShowUserMenu(false);
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="app-container">
      {/* 사이드바 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="sidebar-logo">
              <div className="logo-icon">A</div>
              <div className="logo-text">
                <h1>Alertory</h1>
                <p>위급상황 감지 시스템</p>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="main-content">
        <div className="top-bar">
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="user-info">
            <div 
              ref={userMenuRef}
              className="user-menu"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{ marginLeft: '8px' }}>
                {user?.name || 'User'}
              </span>
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>▼</span>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-item">
                    <strong>{user?.name}</strong>
                    <div style={{ fontSize: '12px', color: '#718096' }}>
                      {user?.username}
                    </div>
                  </div>
                  <div className="user-dropdown-divider"></div>
                  <button 
                    className="user-dropdown-item user-dropdown-button"
                    onClick={handleLogout}
                  >
                    🚪 로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;