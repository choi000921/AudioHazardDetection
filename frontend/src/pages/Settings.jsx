import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Settings = () => {
  const [settings, setSettings] = useState({
    noiseThreshold: 0.7,
    screamThreshold: 0.8,
    alertEnabled: true,
    detectMode: 'ALWAYS',
    activeStart: '09:00',
    activeEnd: '18:00',
    retentionDays: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings/me');
      setSettings(response.data);
    } catch (error) {
      console.error('Settings fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/settings/me', settings);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('Settings save error:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      {/* 감지 설정 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">감지 설정</h2>
        </div>
        
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">
              소음 임계값 ({(settings.noiseThreshold * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.noiseThreshold}
              onChange={(e) => handleChange('noiseThreshold', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#718096' }}>
              이 값보다 높은 소음 레벨에서 이벤트가 감지됩니다.
            </small>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              비명 임계값 ({(settings.screamThreshold * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.screamThreshold}
              onChange={(e) => handleChange('screamThreshold', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#718096' }}>
              이 값보다 높은 확률로 비명이 감지될 때 알림이 발생합니다.
            </small>
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">알림 설정</h2>
        </div>
        
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={settings.alertEnabled}
              onChange={(e) => handleChange('alertEnabled', e.target.checked)}
            />
            <span className="form-label" style={{ margin: 0 }}>알림 활성화</span>
          </label>
          <small style={{ color: '#718096', display: 'block', marginTop: '4px' }}>
            이벤트 감지 시 알림을 받습니다.
          </small>
        </div>
      </div>

      {/* 감지 모드 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">감지 모드</h2>
        </div>
        
        <div className="form-group">
          <label className="form-label">감지 모드</label>
          <select
            className="form-select"
            value={settings.detectMode}
            onChange={(e) => handleChange('detectMode', e.target.value)}
          >
            <option value="ALWAYS">항상 감지</option>
            <option value="SCHEDULED">시간대별 감지</option>
          </select>
        </div>
        
        {settings.detectMode === 'SCHEDULED' && (
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">시작 시간</label>
              <input
                type="time"
                className="form-input"
                value={settings.activeStart}
                onChange={(e) => handleChange('activeStart', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">종료 시간</label>
              <input
                type="time"
                className="form-input"
                value={settings.activeEnd}
                onChange={(e) => handleChange('activeEnd', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 데이터 보관 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">데이터 보관</h2>
        </div>
        
        <div className="form-group">
          <label className="form-label">데이터 보관 기간 (일)</label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="365"
            value={settings.retentionDays}
            onChange={(e) => handleChange('retentionDays', parseInt(e.target.value))}
          />
          <small style={{ color: '#718096', display: 'block', marginTop: '4px' }}>
            이 기간이 지난 이벤트 데이터는 자동으로 삭제됩니다.
          </small>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '12px 32px', fontSize: '16px' }}
        >
          {saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>
    </div>
  );
};

export default Settings;