import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    status: '',
    location: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchEvents();
  }, [filters, pagination.page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.status) params.append('status', filters.status);
      if (filters.location) params.append('location', filters.location);
      if (filters.startDate) params.append('startDate', filters.startDate + 'T00:00:00');
      if (filters.endDate) params.append('endDate', filters.endDate + 'T23:59:59');
      params.append('page', pagination.page);
      params.append('size', pagination.size);

      const response = await api.get(`/api/events?${params}`);
      setEvents(response.data.content);
      setPagination(prev => ({
        ...prev,
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error('Events fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleAcknowledge = async (eventId) => {
    try {
      await api.post(`/api/events/${eventId}/acknowledge`);
      fetchEvents(); // 목록 새로고침
    } catch (error) {
      console.error('Acknowledge error:', error);
      alert('이벤트 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadAudio = async (eventId) => {
    try {
      const response = await api.get(`/api/events/${eventId}/audio`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event_${eventId}_audio.wav`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Audio download error:', error);
      alert('음성 파일 다운로드 중 오류가 발생했습니다.');
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

  return (
    <div>
      {/* 필터 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">이벤트 필터</h2>
        </div>
        
        <div className="grid grid-5">
          <div className="form-group">
            <label className="form-label">이벤트 유형</label>
            <select
              className="form-select"
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
            >
              <option value="">전체</option>
              <option value="SCREAM">비명</option>
              <option value="NOISE">소음</option>
              <option value="NORMAL">정상</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">상태</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">전체</option>
              <option value="NEW">신규</option>
              <option value="ACKNOWLEDGED">확인됨</option>
              <option value="RESOLVED">해결됨</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">위치</label>
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            >
              <option value="">전체</option>
              <option value="A공장 1층">A공장 1층</option>
              <option value="A공장 2층">A공장 2층</option>
              <option value="A공장 3층">A공장 3층</option>
              <option value="B공장 1층">B공장 1층</option>
              <option value="B공장 2층">B공장 2층</option>
              <option value="B공장 3층">B공장 3층</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">시작 날짜</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">종료 날짜</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            이벤트 목록 ({pagination.totalElements}개)
          </h2>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : events.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>감지 시간</th>
                    <th>유형</th>
                    <th>위치</th>
                    <th>신뢰도</th>
                    <th>상태</th>
                    <th>처리 시간</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>#{event.id}</td>
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
                      <td>
                        {event.acknowledgedAt ? formatDateTime(event.acknowledgedAt) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {event.status === 'NEW' && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleAcknowledge(event.id)}
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              확인
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDownloadAudio(event.id)}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            🎵 다운로드
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 페이지네이션 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px',
              marginTop: '20px' 
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 0}
              >
                이전
              </button>
              
              <span>
                {pagination.page + 1} / {pagination.totalPages}
              </span>
              
              <button
                className="btn btn-secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages - 1}
              >
                다음
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            조건에 맞는 이벤트가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;