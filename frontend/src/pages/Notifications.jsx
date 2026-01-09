import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // 실시간 알림을 위한 폴링 (실제로는 WebSocket 사용 권장)
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      fetchNotifications(); // 목록 새로고침
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const testEmergencyAlert = async () => {
    try {
      await api.post('/api/notifications/test-emergency');
      alert('테스트 긴급 알림이 발송되었습니다!');
      fetchNotifications();
    } catch (error) {
      console.error('Test alert error:', error);
    }
  };

  const call119 = async (location, eventType) => {
    if (!confirm('119에 신고하시겠습니까?')) return;
    
    try {
      const response = await api.post('/api/notifications/call-119', {
        location,
        eventType
      });
      
      alert(`119 신고가 완료되었습니다!\n신고번호: ${response.data.reportNumber}`);
      fetchNotifications();
    } catch (error) {
      console.error('119 call error:', error);
      alert('119 신고 중 오류가 발생했습니다.');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'EMERGENCY_ALERT': '🚨',
      'EVENT_DETECTED': '⚠️',
      'SYSTEM_ALERT': 'ℹ️',
      'USER_ACTION': '👤'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'EMERGENCY_ALERT': '#e53e3e',
      'EVENT_DETECTED': '#d69e2e',
      'SYSTEM_ALERT': '#3182ce',
      'USER_ACTION': '#38a169'
    };
    return colors[type] || '#718096';
  };

  return (
    <div>
      {/* 알림 제어 패널 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🚨 알림 제어 패널</h2>
        </div>
        
        <div className="grid grid-3">
          <button
            className="btn btn-primary"
            onClick={testEmergencyAlert}
            style={{ padding: '16px', fontSize: '16px' }}
          >
            🧪 테스트 긴급 알림
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => call119('테스트 위치', '테스트 상황')}
            style={{ padding: '16px', fontSize: '16px', backgroundColor: '#e53e3e', color: 'white' }}
          >
            🚑 119 신고 테스트
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={fetchNotifications}
            style={{ padding: '16px', fontSize: '16px' }}
          >
            🔄 알림 새로고침
          </button>
        </div>
      </div>

      {/* 알림 통계 */}
      <div className="grid grid-4">
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>총 알림</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
            {notifications.length}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>긴급 알림</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#e53e3e' }}>
            {notifications.filter(n => n.type === 'EMERGENCY_ALERT').length}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>읽지 않음</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#d69e2e' }}>
            {notifications.filter(n => n.status === 'SENT').length}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>읽음</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#38a169' }}>
            {notifications.filter(n => n.status === 'READ').length}
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📢 알림 목록</h2>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : notifications.length > 0 ? (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '16px',
                  margin: '8px 0',
                  border: `2px solid ${notification.status === 'SENT' ? getNotificationColor(notification.type) : '#e2e8f0'}`,
                  borderRadius: '8px',
                  backgroundColor: notification.status === 'SENT' ? 'rgba(229, 62, 62, 0.05)' : '#f7fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => notification.status === 'SENT' && markAsRead(notification.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ 
                    fontSize: '24px',
                    animation: notification.type === 'EMERGENCY_ALERT' && notification.status === 'SENT' ? 'pulse 1s infinite' : 'none'
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: getNotificationColor(notification.type)
                      }}>
                        {notification.title}
                      </h4>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {notification.status === 'SENT' && (
                          <span style={{
                            backgroundColor: '#e53e3e',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            NEW
                          </span>
                        )}
                        
                        <span style={{ fontSize: '12px', color: '#718096' }}>
                          {formatDateTime(notification.sentAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p style={{ 
                      margin: 0, 
                      color: '#4a5568',
                      lineHeight: '1.5'
                    }}>
                      {notification.message}
                    </p>
                    
                    {notification.eventId && (
                      <div style={{ marginTop: '12px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/events?eventId=${notification.eventId}`;
                          }}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          📋 이벤트 보기
                        </button>
                        
                        {notification.type === 'EMERGENCY_ALERT' && (
                          <button
                            className="btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              call119('긴급 상황 위치', '긴급 상황');
                            }}
                            style={{ 
                              fontSize: '12px', 
                              padding: '6px 12px',
                              marginLeft: '8px',
                              backgroundColor: '#e53e3e',
                              color: 'white'
                            }}
                          >
                            🚑 119 신고
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            알림이 없습니다.
          </div>
        )}
      </div>

      {/* 알림 설정 안내 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">⚙️ 알림 시스템 안내</h2>
        </div>
        
        <div style={{ lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '12px', color: '#1a202c' }}>알림 유형</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li><strong>🚨 긴급 알림:</strong> 비명, 도움 요청 등 즉시 대응이 필요한 상황</li>
            <li><strong>⚠️ 이벤트 감지:</strong> 일반적인 이상 소음이나 이벤트 감지</li>
            <li><strong>ℹ️ 시스템 알림:</strong> 시스템 상태, 설정 변경 등의 정보</li>
            <li><strong>👤 사용자 액션:</strong> 사용자 활동 관련 알림</li>
          </ul>
          
          <h4 style={{ marginTop: '20px', marginBottom: '12px', color: '#1a202c' }}>119 신고 기능</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li>긴급 상황 감지 시 원클릭으로 119에 신고할 수 있습니다.</li>
            <li>신고 시 위치, 상황 정보가 자동으로 전달됩니다.</li>
            <li>신고 완료 후 신고번호가 발급됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Notifications;