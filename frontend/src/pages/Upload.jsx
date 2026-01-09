import React, { useState } from 'react';
import api from '../api/axios';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('선택된 파일:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });
      
      // 파일 타입 검증 (확장자 기반으로 변경)
      const fileName = selectedFile.name.toLowerCase();
      const allowedExtensions = ['.wav', '.mp3', '.m4a', '.flac', '.webm', '.aac', '.ogg'];
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      // MIME 타입도 체크 (브라우저 호환성)
      const allowedMimeTypes = [
        'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/mpeg', 'audio/mp3', 'audio/mpeg3',
        'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac',
        'audio/flac', 'audio/x-flac',
        'audio/webm', 'audio/ogg'
      ];
      const hasValidMimeType = allowedMimeTypes.includes(selectedFile.type) || selectedFile.type.startsWith('audio/');
      
      console.log('파일 검증:', {
        hasValidExtension,
        hasValidMimeType,
        fileType: selectedFile.type
      });
      
      if (!hasValidExtension && !hasValidMimeType) {
        alert(`지원되지 않는 파일 형식입니다.\n파일: ${selectedFile.name}\nMIME 타입: ${selectedFile.type}\n지원 형식: WAV, MP3, M4A, FLAC, WebM, AAC, OGG`);
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }
    
    if (!locationLabel) {
      alert('위치 정보를 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      setResult(null);
      
      console.log('업로드 시작:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        locationLabel: locationLabel.trim()
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('locationLabel', locationLabel);

      console.log('FormData 생성 완료, API 호출 시작...');

      const response = await api.post('/api/audio/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API 응답:', response.data);
      setResult(response.data);
      
      // 성공 시 폼 초기화
      setFile(null);
      setLocationLabel('');
      
      // 파일 입력 초기화
      const fileInput = document.getElementById('audioFile');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = '업로드 중 오류가 발생했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`업로드 실패: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      'SCREAM': '#e53e3e',
      'NOISE': '#d69e2e',
      'NORMAL': '#38a169'
    };
    return colors[eventType] || '#3182ce';
  };

  const getEventTypeText = (eventType) => {
    const texts = {
      'SCREAM': '비명 감지',
      'NOISE': '소음 감지', 
      'NORMAL': '정상',
      'Normal': '정상' // AI 서버 응답 형식 추가
    };
    return texts[eventType] || eventType;
  };

  return (
    <div>
      {/* 업로드 폼 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">오디오 파일 업로드</h2>
        </div>
        
        <div className="form-group">
          <label className="form-label">오디오 파일</label>
          <input
            id="audioFile"
            type="file"
            accept=".wav,.mp3,.m4a,.flac,.webm,audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/flac,audio/webm,audio/ogg,audio/*"
            onChange={handleFileChange}
            className="form-input"
            disabled={uploading}
          />
          <small style={{ color: '#718096', display: 'block', marginTop: '4px' }}>
            지원 형식: WAV, MP3, M4A, FLAC, WebM, AAC, OGG (최대 10MB)
          </small>
        </div>
        
        <div className="form-group">
          <label className="form-label">위치 정보</label>
          <select
            className="form-input"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            disabled={uploading}
          >
            <option value="">위치를 선택해주세요</option>
            <option value="A공장 1층">A공장 1층</option>
            <option value="A공장 2층">A공장 2층</option>
            <option value="A공장 3층">A공장 3층</option>
            <option value="B공장 1층">B공장 1층</option>
            <option value="B공장 2층">B공장 2층</option>
            <option value="B공장 3층">B공장 3층</option>
          </select>
          <small style={{ color: '#718096', display: 'block', marginTop: '4px' }}>
            오디오가 녹음된 위치를 선택해주세요.
          </small>
        </div>
        
        {file && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f7fafc', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>선택된 파일:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
        
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={uploading || !file || !locationLabel}
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
        >
          {uploading ? '분석 중...' : '업로드 및 분석'}
        </button>
      </div>

      {/* 분석 결과 */}
      {result && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">분석 결과</h2>
          </div>
          
          {result.success ? (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                    감지 결과
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700',
                    color: getEventTypeColor(result.eventType)
                  }}>
                    {getEventTypeText(result.eventType)}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                    신뢰도
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
                    {result.confidence?.toFixed(1)}%
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                    위험도
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: result.isDanger ? '#e53e3e' : '#38a169'
                  }}>
                    {result.dangerLevel || (result.isDanger ? '위험' : '안전')}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                    위치
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                    {result.locationLabel}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                    이벤트 ID
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                    #{result.eventId}
                  </div>
                </div>
              </div>
              
              {/* ADDED: 설명 섹션 */}
              {result.description && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f7fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
                    설명
                  </div>
                  <div style={{ fontSize: '16px', color: '#1a202c', lineHeight: '1.5' }}>
                    {result.description}
                  </div>
                </div>
              )}
              
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f0fff4', 
                borderRadius: '8px',
                border: '1px solid #9ae6b4',
                color: '#22543d'
              }}>
                ✅ {result.message}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fed7d7', 
              borderRadius: '8px',
              border: '1px solid #feb2b2',
              color: '#742a2a'
            }}>
              ❌ {result.message}
            </div>
          )}
        </div>
      )}

      {/* 사용 안내 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">사용 안내</h2>
        </div>
        
        <div style={{ lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '12px', color: '#1a202c' }}>오디오 업로드 기능</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li>공장 내에서 녹음된 오디오 파일을 업로드하여 AI 분석을 받을 수 있습니다.</li>
            <li>시스템이 자동으로 비명, 소음, 정상 상태를 구분하여 분석합니다.</li>
            <li>분석 결과는 이벤트로 저장되어 대시보드와 이벤트 페이지에서 확인할 수 있습니다.</li>
            <li>위치 정보를 정확히 입력하면 사고 발생 지점을 빠르게 파악할 수 있습니다.</li>
          </ul>
          
          <h4 style={{ marginTop: '20px', marginBottom: '12px', color: '#1a202c' }}>지원 파일 형식</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li><strong>WAV:</strong> 무손실 오디오 형식 (권장)</li>
            <li><strong>MP3:</strong> 압축 오디오 형식</li>
            <li><strong>M4A:</strong> Apple 오디오 형식</li>
            <li><strong>FLAC:</strong> 무손실 압축 오디오 형식</li>
            <li><strong>WebM:</strong> 웹 표준 오디오 형식</li>
            <li><strong>AAC:</strong> 고급 오디오 코덱</li>
            <li><strong>OGG:</strong> 오픈소스 오디오 형식</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;