import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchActivityLogs();
    }
  }, [activeTab, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/activity-logs', {
        params: {
          page: pagination.page,
          size: pagination.size
        }
      });
      setActivityLogs(response.data.content);
      setPagination(prev => ({
        ...prev,
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error('Activity logs fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await api.post(`/api/admin/users/${userId}/approve`);
      fetchUsers();
      alert('사용자가 승인되었습니다.');
    } catch (error) {
      console.error('Approve error:', error);
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  const rejectUser = async (userId) => {
    if (!confirm('정말로 이 사용자를 거절하시겠습니까?')) return;
    
    try {
      await api.post(`/api/admin/users/${userId}/reject`);
      fetchUsers();
      alert('사용자가 거절되었습니다.');
    } catch (error) {
      console.error('Reject error:', error);
      alert('거절 중 오류가 발생했습니다.');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      alert('사용자가 삭제되었습니다.');
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      await api.put(`/api/admin/users/${userId}`, userData);
      fetchUsers();
      setEditingUser(null);
      alert('사용자 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Update error:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge-warning',
      'ACTIVE': 'badge-success',
      'REJECTED': 'badge-danger',
      'SUSPENDED': 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      'PENDING': '승인대기',
      'ACTIVE': '활성',
      'REJECTED': '거절',
      'SUSPENDED': '정지'
    };
    return texts[status] || status;
  };

  const getRoleBadge = (role) => {
    const badges = {
      'ADMIN': 'badge-danger',
      'MANAGER': 'badge-info'
    };
    return badges[role] || 'badge-info';
  };

  const getRoleText = (role) => {
    const texts = {
      'ADMIN': '관리자',
      'MANAGER': '매니저'
    };
    return texts[role] || role;
  };

  const getActionText = (action) => {
    const texts = {
      'LOGIN': '로그인',
      'LOGOUT': '로그아웃',
      'SETTINGS_CHANGE': '설정변경',
      'EVENT_ACK': '이벤트확인',
      'USER_MANAGEMENT': '사용자관리'
    };
    return texts[action] || action;
  };

  return (
    <div>
      {/* 탭 메뉴 */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
            style={{ 
              borderRadius: '0',
              borderBottom: activeTab === 'users' ? '2px solid #3b4cb8' : 'none'
            }}
          >
            👥 사용자 관리
          </button>
          <button
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('logs')}
            style={{ 
              borderRadius: '0',
              borderBottom: activeTab === 'logs' ? '2px solid #3b4cb8' : 'none'
            }}
          >
            📋 활동 로그
          </button>
        </div>

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">👥 사용자 관리 ({users.length}명)</h2>
            </div>

            {/* 사용자 통계 */}
            <div className="grid grid-4" style={{ marginBottom: '24px' }}>
              <div className="card">
                <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>전체 사용자</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c' }}>
                  {users.length}
                </div>
              </div>
              
              <div className="card">
                <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>승인 대기</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#d69e2e' }}>
                  {users.filter(u => u.status === 'PENDING').length}
                </div>
              </div>
              
              <div className="card">
                <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>활성 사용자</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#38a169' }}>
                  {users.filter(u => u.status === 'ACTIVE').length}
                </div>
              </div>
              
              <div className="card">
                <h3 style={{ fontSize: '14px', color: '#718096', margin: '0 0 8px 0' }}>관리자</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#e53e3e' }}>
                  {users.filter(u => u.role === 'ADMIN').length}
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>사용자명</th>
                      <th>이메일</th>
                      <th>이름</th>
                      <th>역할</th>
                      <th>상태</th>
                      <th>가입일</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td style={{ fontWeight: '600' }}>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.name}</td>
                        <td>
                          <span className={`badge ${getRoleBadge(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(user.status)}`}>
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td>{formatDateTime(user.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {user.status === 'PENDING' && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => approveUser(user.id)}
                                  style={{ fontSize: '10px', padding: '4px 8px' }}
                                >
                                  ✅ 승인
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => rejectUser(user.id)}
                                  style={{ fontSize: '10px', padding: '4px 8px' }}
                                >
                                  ❌ 거절
                                </button>
                              </>
                            )}
                            
                            <button
                              className="btn btn-secondary"
                              onClick={() => setEditingUser(user)}
                              style={{ fontSize: '10px', padding: '4px 8px' }}
                            >
                              ✏️ 수정
                            </button>
                            
                            {user.role !== 'ADMIN' && (
                              <button
                                className="btn"
                                onClick={() => deleteUser(user.id)}
                                style={{ 
                                  fontSize: '10px', 
                                  padding: '4px 8px',
                                  backgroundColor: '#e53e3e',
                                  color: 'white'
                                }}
                              >
                                🗑️ 삭제
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 활동 로그 탭 */}
        {activeTab === 'logs' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">📋 사용자 활동 로그 ({pagination.totalElements}건)</h2>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>시간</th>
                        <th>사용자</th>
                        <th>액션</th>
                        <th>상세</th>
                        <th>IP 주소</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatDateTime(log.createdAt)}</td>
                          <td style={{ fontWeight: '600' }}>{log.username}</td>
                          <td>
                            <span className="badge badge-info">
                              {getActionText(log.action)}
                            </span>
                          </td>
                          <td>{log.details}</td>
                          <td style={{ fontSize: '12px', color: '#718096' }}>
                            {log.ipAddress}
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
            )}
          </div>
        )}
      </div>

      {/* 사용자 수정 모달 */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '24px' }}>👤 사용자 정보 수정</h3>
            
            <div className="form-group">
              <label className="form-label">이름</label>
              <input
                type="text"
                className="form-input"
                value={editingUser.name}
                onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                type="email"
                className="form-input"
                value={editingUser.email}
                onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">역할</label>
              <select
                className="form-select"
                value={editingUser.role}
                onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="MANAGER">매니저</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">상태</label>
              <select
                className="form-select"
                value={editingUser.status}
                onChange={(e) => setEditingUser(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="PENDING">승인대기</option>
                <option value="ACTIVE">활성</option>
                <option value="REJECTED">거절</option>
                <option value="SUSPENDED">정지</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn btn-primary"
                onClick={() => updateUser(editingUser.id, {
                  name: editingUser.name,
                  email: editingUser.email,
                  role: editingUser.role,
                  status: editingUser.status
                })}
                style={{ flex: 1 }}
              >
                💾 저장
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingUser(null)}
                style={{ flex: 1 }}
              >
                ❌ 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;