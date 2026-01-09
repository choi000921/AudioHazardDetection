import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchSystemStatus();
  }, [locationFilter]);

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams();
      if (locationFilter) params.append('location', locationFilter);
      
      const response = await api.get(`/api/dashboard?${params}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await api.get('/api/status');
      setSystemStatus(response.data);
    } catch (error) {
      console.error('System status fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getEventTypeBadge = (eventType) => {
    const badges = {
      'SCREAM': 'badge-danger',
      'NOISE': 'badge-warning',
      'NORMAL': 'badge-success'
    };
    return badges[eventType] || 'badge-info';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'NEW': 'badge-danger',
      'ACKNOWLEDGED': 'badge-warning',
      'RESOLVED': 'badge-success'
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      {/* 위치 필터 */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h2 className="card-title">위치 필터</h2>
        </div>
        <div className="form-group">
          <select
            className="form-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">전체 위치</option>
            <option value="A공장 1층">A공장 1층</option>
            <option value="A공장 2층">A공장 2층</option>
            <option value="A공장 3층">A공장 3층</option>
            <option value="B공장 1층">B공장 1층</option>
            <option value="B공장 2층">B공장 2층</option>
            <option value="B공장 3층">B공장 3층</option>
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4">
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>전체 이벤트</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
            {dashboardData?.stats?.totalEvents || 0}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>신규 이벤트</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#e53e3e' }}>
            {dashboardData?.stats?.newEvents || 0}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>처리된 이벤트</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#38a169' }}>
            {dashboardData?.stats?.acknowledgedEvents || 0}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>AI 상태</h3>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#38a169' }}>
            {systemStatus?.aiStatus === 'ACTIVE' ? '🟢 활성' : '🔴 비활성'}
          </div>
        </div>
      </div>

      {/* 최근 이벤트 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">최근 이벤트</h2>
        </div>
        
        {dashboardData?.recentEvents?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>유형</th>
                  <th>위치</th>
                  <th>신뢰도</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.detectedAt)}</td>
                    <td>
                      <span className={`badge ${getEventTypeBadge(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td>{event.locationLabel}</td>
                    <td>{event.confidence?.toFixed(1)}%</td>
                    <td>
                      <span className={`badge ${getStatusBadge(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            이벤트가 없습니다.
          </div>
        )}
      </div>

      {/* 시스템 정보 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">시스템 정보</h2>
        </div>
        
        <div className="grid grid-2">
          <div>
            <strong>감지 상태:</strong> {systemStatus?.detectionEnabled ? '활성화' : '비활성화'}
          </div>
          <div>
            <strong>버전:</strong> {systemStatus?.version}
          </div>
          <div>
            <strong>마지막 업데이트:</strong> {systemStatus?.lastUpdate ? formatDateTime(new Date(systemStatus.lastUpdate)) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;