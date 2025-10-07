import api from './api.service';

const attendanceService = {
  processVideo: async (formData) => {
    const response = await api.post('/attendance/process-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await api.get(`/attendance/sessions/${sessionId}`);
    return response.data;
  },

  updateRecord: async (recordId, data) => {
    const response = await api.put(`/attendance/records/${recordId}`, data);
    return response.data;
  },

  sendNotifications: async (sessionId) => {
    const response = await api.post(`/attendance/sessions/${sessionId}/notify`);
    return response.data;
  },

  getHistory: async (params) => {
    const response = await api.get('/attendance/history', { params });
    return response.data;
  },

  exportReport: async (sessionId) => {
    const response = await api.get(`/attendance/sessions/${sessionId}/export`, {
      responseType: 'blob'
    });
    return response;
  }
};

export default attendanceService;