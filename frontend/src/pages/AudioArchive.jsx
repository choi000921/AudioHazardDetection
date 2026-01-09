import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AudioArchive = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    eventType: '',
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
    fetchAudioFiles();
  }, [filters, pagination.page]);

  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.startDate) params.append('startDate', filters.startDate + 'T00:00:00');
      if (filters.endDate) params.append('endDate', filters.endDate + 'T23:59:59');
      params.append('page', pagination.page);
      params.append('size', pagination.size);

      const response = await api.get(`/api/events?${params}`);
      // 오디오 파일이 있는 이벤트만 필터링
      const eventsWithAudio = response.data.content.filter(event => event.audioFilePath);
      
      setAudioFiles(eventsWithAudio);
      setPagination(prev => ({
        ...prev,
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error('Audio files fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const downloadAudioFile = async (eventId, fileName) => {
    try {
      const response = await api.get(`/api/audio/download/${eventId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `audio_${eventId}.wav`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const playAudio = (eventId) => {
    // 실제로는 오디오 스트리밍 API 호출
    alert(`이벤트 #${eventId}의 오디오를 재생합니다. (실제 구현 시 오디오 플레이어 연동)`);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getEventTypeBadge = (eventType) => {
    const badges = {
      'SCREAM': 'badge-danger',
      'NOISE': 'badge-warning',
      'NORMAL': 'badge-success',
      'HELP_REQUEST': 'badge-danger'
    };
    return badges[eventType] || 'badge-info';
  };

  const getEventTypeText = (eventType) => {
    const texts = {
      'SCREAM': '비명',
      'NOISE': '소음',
      'NORMAL': '정상',
      'HELP_REQUEST': '도움요청'
    };
    return texts[eventType] || eventType;
  };

  const locations = ['A공장 1층', 'A공장 2층', 'A공장 3층', 'B공장 1층', 'B공장 2층', 'B공장 3층'];

  return (
    <div>
      {/* 필터 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🎵 음성 파일 필터</h2>
        </div>
        
        <div className="grid grid-4">
          <div className="form-group">
            <label className="form-label">위치</label>
            <select
              className="form-select"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            >
              <option value="">전체 위치</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">이벤트 유형</label>
            <select
              className="form-select"
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
            >
              <option value="">전체 유형</option>
              <option value="SCREAM">비명</option>
              <option value="NOISE">소음</option>
              <option value="HELP_REQUEST">도움요청</option>
              <option value="NORMAL">정상</option>
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

      {/* 통계 */}
      <div className="grid grid-4">
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>총 음성 파일</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
            {pagination.totalElements}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>비명 감지</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#e53e3e' }}>
            {audioFiles.filter(f => f.eventType === 'SCREAM').length}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>도움 요청</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#d69e2e' }}>
            {audioFiles.filter(f => f.eventType === 'HELP_REQUEST').length}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>저장 용량</h3>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#38a169' }}>
            {(audioFiles.length * 2.5).toFixed(1)} MB
          </div>
        </div>
      </div>

      {/* 음성 파일 목록 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            🎵 음성 파일 보관함 ({pagination.totalElements}개)
          </h2>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : audioFiles.length > 0 ? (
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
                    <th>파일 크기</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {audioFiles.map((file) => (
                    <tr key={file.id}>
                      <td>#{file.id}</td>
                      <td>{formatDateTime(file.detectedAt)}</td>
                      <td>
                        <span className={`badge ${getEventTypeBadge(file.eventType)}`}>
                          {getEventTypeText(file.eventType)}
                        </span>
                      </td>
                      <td>{file.locationLabel}</td>
                      <td>{file.confidence?.toFixed(1)}%</td>
                      <td>~2.5 MB</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => playAudio(file.id)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            ▶️ 재생
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => downloadAudioFile(file.id, `event_${file.id}_${file.eventType}.wav`)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            💾 다운로드
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
                ◀️ 이전
              </button>
              
              <span style={{ padding: '0 20px' }}>
                {pagination.page + 1} / {pagination.totalPages}
              </span>
              
              <button
                className="btn btn-secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages - 1}
              >
                다음 ▶️
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            조건에 맞는 음성 파일이 없습니다.
          </div>
        )}
      </div>

      {/* 사용 안내 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📋 음성 파일 보관함 안내</h2>
        </div>
        
        <div style={{ lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '12px', color: '#1a202c' }}>기능 안내</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li><strong>재생:</strong> 브라우저에서 바로 음성 파일을 재생할 수 있습니다.</li>
            <li><strong>다운로드:</strong> 음성 파일을 로컬 컴퓨터에 저장할 수 있습니다.</li>
            <li><strong>필터링:</strong> 위치, 유형, 날짜별로 음성 파일을 검색할 수 있습니다.</li>
            <li><strong>자동 보관:</strong> 모든 이벤트의 음성이 자동으로 보관됩니다.</li>
          </ul>
          
          <h4 style={{ marginTop: '20px', marginBottom: '12px', color: '#1a202c' }}>파일 형식</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li><strong>형식:</strong> WAV (무손실 압축)</li>
            <li><strong>품질:</strong> 44.1kHz, 16bit</li>
            <li><strong>평균 크기:</strong> 약 2.5MB (30초 기준)</li>
            <li><strong>보관 기간:</strong> 설정에서 지정한 기간 (기본 30일)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioArchive;