import api from './api.service';

const classService = {
  getClasses: async (params) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  getClassById: async (classId) => {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  },

  createClass: async (data) => {
    const response = await api.post('/classes', data);
    return response.data;
  },

  updateClass: async (classId, data) => {
    const response = await api.put(`/classes/${classId}`, data);
    return response.data;
  },

  deleteClass: async (classId) => {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  },

  getStatistics: async (classId) => {
    const response = await api.get(`/classes/${classId}/statistics`);
    return response.data;
  }
};

export default classService;