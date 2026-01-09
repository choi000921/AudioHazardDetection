import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 전
    endDate: new Date().toISOString().split('T')[0] // 오늘
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics', {
        params: dateRange
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      // Mock 데이터 생성
      generateMockData();
    } finally {
      setLoading(false);
    }
  };



  const exportReport = async (format) => {
    try {
      const response = await api.get(`/api/analytics/export?format=${format}`, {
        params: dateRange,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_report_${dateRange.startDate}_${dateRange.endDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(`${format.toUpperCase()} 리포트 내보내기 기능은 준비 중입니다.`);
    }
  };

  const getEventTypeText = (type) => {
    const texts = {
      'SCREAM': '비명',
      'NOISE': '소음',
      'HELP_REQUEST': '도움요청',
      'NORMAL': '정상'
    };
    return texts[type] || type;
  };

  const getEventTypeColor = (type) => {
    const colors = {
      'SCREAM': '#e53e3e',
      'NOISE': '#d69e2e',
      'HELP_REQUEST': '#9f7aea',
      'NORMAL': '#38a169'
    };
    return colors[type] || '#718096';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>데이터 분석 중...</div>;
  }

  return (
    <div>
      {/* 날짜 범위 선택 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📊 분석 기간 설정</h2>
        </div>
        
        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">시작 날짜</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">종료 날짜</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">리포트 내보내기</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => exportReport('pdf')}
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                📄 PDF
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => exportReport('xlsx')}
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                📊 Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-4">
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>총 이벤트</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
            {analyticsData?.summary?.totalEvents || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            선택 기간 내 발생
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>긴급 상황</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#e53e3e' }}>
            {analyticsData?.summary?.emergencyEvents || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            즉시 대응 필요
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>오탐지</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#d69e2e' }}>
            {analyticsData?.summary?.falseAlarms || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            정확도 개선 필요
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>평균 응답시간</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#38a169' }}>
            {analyticsData?.summary?.responseTime || 0}분
          </div>
          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
            이벤트 확인까지
          </div>
        </div>
      </div>

      {/* 시간대별 분석 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">⏰ 시간대별 이벤트 발생 현황</h2>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '8px',
          marginBottom: '20px'
        }}>
          {analyticsData?.eventsByHour?.slice(0, 12).map((data) => (
            <div key={data.hour} style={{ textAlign: 'center' }}>
              <div style={{
                height: `${Math.max(data.count * 10, 10)}px`,
                backgroundColor: '#667eea',
                borderRadius: '4px',
                marginBottom: '4px'
              }}></div>
              <div style={{ fontSize: '12px', color: '#718096' }}>
                {data.hour}시
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600' }}>
                {data.count}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '8px'
        }}>
          {analyticsData?.eventsByHour?.slice(12, 24).map((data) => (
            <div key={data.hour} style={{ textAlign: 'center' }}>
              <div style={{
                height: `${Math.max(data.count * 10, 10)}px`,
                backgroundColor: '#764ba2',
                borderRadius: '4px',
                marginBottom: '4px'
              }}></div>
              <div style={{ fontSize: '12px', color: '#718096' }}>
                {data.hour}시
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600' }}>
                {data.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 위치별 & 유형별 분석 */}
      <div className="grid grid-2">
        {/* 위치별 분석 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📍 위치별 이벤트 분포</h2>
          </div>
          
          {analyticsData?.eventsByLocation?.map((location) => (
            <div key={location.location} style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '4px' 
              }}>
                <span style={{ fontWeight: '600' }}>{location.location}</span>
                <span>{location.count}건 ({location.percentage}%)</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${location.percentage}%`,
                  height: '100%',
                  backgroundColor: '#667eea',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* 유형별 분석 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🏷️ 이벤트 유형별 분포</h2>
          </div>
          
          {analyticsData?.eventsByType?.map((type) => (
            <div key={type.type} style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '4px' 
              }}>
                <span style={{ fontWeight: '600' }}>{getEventTypeText(type.type)}</span>
                <span>{type.count}건 ({type.percentage}%)</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${type.percentage}%`,
                  height: '100%',
                  backgroundColor: getEventTypeColor(type.type),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 주간 트렌드 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📈 주간 이벤트 트렌드</h2>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'end', 
          gap: '16px',
          height: '200px',
          padding: '20px 0'
        }}>
          {analyticsData?.weeklyTrend?.map((day, index) => (
            <div key={day.date} style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '100%',
                height: `${Math.max((day.events / 15) * 100, 5)}%`,
                backgroundColor: index === analyticsData.weeklyTrend.length - 1 ? '#e53e3e' : '#667eea',
                borderRadius: '4px 4px 0 0',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '8px',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {day.events}
              </div>
              <div style={{ fontSize: '12px', color: '#718096', textAlign: 'center' }}>
                {new Date(day.date).toLocaleDateString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 분석 인사이트 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">💡 분석 인사이트</h2>
        </div>
        
        <div className="grid grid-2">
          <div>
            <h4 style={{ color: '#1a202c', marginBottom: '12px' }}>주요 발견사항</h4>
            <ul style={{ paddingLeft: '20px', color: '#4a5568', lineHeight: '1.6' }}>
              <li>A공장 2층에서 가장 많은 이벤트 발생 (40%)</li>
              <li>오후 2-4시 사이 이벤트 집중 발생</li>
              <li>소음 관련 이벤트가 전체의 55.6% 차지</li>
              <li>평균 응답 시간 2.3분으로 양호한 수준</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#1a202c', marginBottom: '12px' }}>개선 권장사항</h4>
            <ul style={{ paddingLeft: '20px', color: '#4a5568', lineHeight: '1.6' }}>
              <li>A공장 2층 추가 모니터링 강화 필요</li>
              <li>오후 시간대 순찰 인력 증배 검토</li>
              <li>소음 임계값 조정으로 오탐지 감소</li>
              <li>응답 시간 2분 이내 목표 설정</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;