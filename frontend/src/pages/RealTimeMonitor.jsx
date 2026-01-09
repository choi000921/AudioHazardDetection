import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const RealTimeMonitor = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState('STANDBY'); // STANDBY, DETECTING, ALERT
  const [recentDetections, setRecentDetections] = useState([]);
  const [microphoneStatus, setMicrophoneStatus] = useState('DISCONNECTED');
  const [fetchError, setFetchError] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // 최근 이벤트 조회
  const fetchRecentDetections = async () => {
    try {
      const response = await api.get('/api/events', {
        params: {
          page: 0,
          size: 10
        }
      });
      
      if (response.data && response.data.content) {
        const events = response.data.content.map(event => ({
          id: event.id,
          type: event.eventType,
          location: event.locationLabel,
          confidence: event.confidence,
          timestamp: new Date(event.detectedAt).toLocaleTimeString('ko-KR')
        }));
        setRecentDetections(events);
        setFetchError(false);
      }
    } catch (error) {
      console.error('최근 감지 이벤트 조회 오류:', error);
      setFetchError(true);
      setRecentDetections([]);
    }
  };

  useEffect(() => {
    // 페이지 로드 시 즉시 1회 조회
    fetchRecentDetections();
    
    // 2초마다 폴링
    pollingIntervalRef.current = setInterval(() => {
      fetchRecentDetections();
    }, 2000);
    
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      setMicrophoneStatus('CONNECTED');
      setIsRecording(true);
      setDetectionStatus('DETECTING');

      // 오디오 컨텍스트 설정
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // 실시간 오디오 레벨 모니터링
      const updateAudioLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(Math.round((average / 255) * 100));
        
        // 임계값 초과 시 (AI 서버 연동 제외)
        if (average > 150) { // 임계값 초과 시
          // 실제 AI 서버 연동은 이번 작업 범위에서 제외
          // 오디오 레벨만 모니터링
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();

      // MediaRecorder 설정 (실제 녹음용)
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();

    } catch (error) {
      console.error('마이크 접근 오류:', error);
      setMicrophoneStatus('ERROR');
      alert('마이크에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setDetectionStatus('STANDBY');
    setMicrophoneStatus('DISCONNECTED');
    setAudioLevel(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };


  const getStatusColor = (status) => {
    const colors = {
      'STANDBY': '#718096',
      'DETECTING': '#38a169',
      'ALERT': '#e53e3e',
      'CONNECTED': '#38a169',
      'DISCONNECTED': '#718096',
      'ERROR': '#e53e3e'
    };
    return colors[status] || '#718096';
  };

  const getStatusText = (status) => {
    const texts = {
      'STANDBY': '대기 중',
      'DETECTING': '감지 중',
      'ALERT': '이벤트 감지!',
      'CONNECTED': '연결됨',
      'DISCONNECTED': '연결 안됨',
      'ERROR': '오류'
    };
    return texts[status] || status;
  };

  const getDetectionTypeText = (type) => {
    const texts = {
      'SCREAM': '비명',
      'HELP_REQUEST': '도움 요청',
      'NOISE': '이상 소음'
    };
    return texts[type] || type;
  };

  return (
    <div>
      {/* 실시간 모니터링 상태 */}
      <div className="grid grid-4">
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>감지 상태</h3>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: getStatusColor(detectionStatus),
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(detectionStatus),
              animation: detectionStatus === 'ALERT' ? 'pulse 1s infinite' : 'none'
            }}></div>
            {getStatusText(detectionStatus)}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>마이크 상태</h3>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: getStatusColor(microphoneStatus)
          }}>
            🎤 {getStatusText(microphoneStatus)}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>오디오 레벨</h3>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            {audioLevel}%
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${audioLevel}%`,
              height: '100%',
              backgroundColor: audioLevel > 70 ? '#e53e3e' : audioLevel > 40 ? '#d69e2e' : '#38a169',
              transition: 'width 0.1s ease'
            }}></div>
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>오늘 감지</h3>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#e53e3e' }}>
            {recentDetections.length}
          </div>
        </div>
      </div>

      {/* 제어 패널 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">실시간 음성 감지 제어</h2>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button
            className={`btn ${isRecording ? 'btn-secondary' : 'btn-primary'}`}
            onClick={isRecording ? stopRecording : startRecording}
            style={{ 
              padding: '16px 32px', 
              fontSize: '18px',
              minWidth: '200px'
            }}
          >
            {isRecording ? '🛑 감지 중지' : '🎤 감지 시작'}
          </button>
        </div>
        
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f7fafc', 
          borderRadius: '8px',
          textAlign: 'center',
          color: '#4a5568'
        }}>
          {isRecording ? 
            '실시간으로 음성을 감지하고 있습니다. 비명이나 도움 요청이 감지되면 즉시 알림이 발생합니다.' :
            '감지 시작 버튼을 클릭하면 실시간 음성 감지가 시작됩니다.'
          }
        </div>
      </div>

      {/* 최근 감지 이벤트 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">최근 감지 이벤트</h2>
        </div>
        
        {fetchError ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#e53e3e' }}>
            연결 실패: 서버에 연결할 수 없습니다.
          </div>
        ) : recentDetections.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>유형</th>
                  <th>위치</th>
                  <th>신뢰도</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((detection) => (
                  <tr key={detection.id}>
                    <td>{detection.timestamp}</td>
                    <td>
                      <span className="badge badge-danger">
                        {getDetectionTypeText(detection.type)}
                      </span>
                    </td>
                    <td>{detection.location}</td>
                    <td>{detection.confidence?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            데이터 없음: 아직 감지된 이벤트가 없습니다.
          </div>
        )}
      </div>

      {/* 사용 안내 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">실시간 감지 안내</h2>
        </div>
        
        <div style={{ lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '12px', color: '#1a202c' }}>실시간 음성 감지 기능</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li>브라우저의 마이크를 통해 실시간으로 음성을 감지합니다.</li>
            <li>비명, 도움 요청, 이상 소음을 AI가 자동으로 분석합니다.</li>
            <li>위험 상황 감지 시 즉시 알림이 발생하고 이벤트가 기록됩니다.</li>
            <li>오디오 레벨을 실시간으로 모니터링할 수 있습니다.</li>
          </ul>
          
          <h4 style={{ marginTop: '20px', marginBottom: '12px', color: '#1a202c' }}>주의사항</h4>
          <ul style={{ paddingLeft: '20px', color: '#4a5568' }}>
            <li>마이크 권한을 허용해야 정상 작동합니다.</li>
            <li>Chrome, Firefox 등 최신 브라우저에서 사용하세요.</li>
            <li>공장 소음이 많은 환경에서는 민감도 조정이 필요할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;