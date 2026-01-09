import api from './axios';

// ADDED: Admin API functions
export const adminAPI = {
  // 승인 대기 중인 사용자 목록 조회
  getPendingUsers: async () => {
    const response = await api.get('/api/admin/users/pending');
    return response.data;
  },

  // 사용자 승인
  approveUser: async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/approve`);
    return response.data;
  },

  // 사용자 거절
  rejectUser: async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/reject`);
    return response.data;
  },
};