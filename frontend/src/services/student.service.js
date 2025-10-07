import api from './api.service';

const studentService = {
  getStudents: async (classId, params) => {
    const response = await api.get(`/students/class/${classId}`, { params });
    return response.data;
  },

  getStudentById: async (classId, studentId) => {
    const response = await api.get(`/students/class/${classId}/${studentId}`);
    return response.data;
  },

  createStudent: async (classId, data) => {
    const response = await api.post(`/students/class/${classId}`, data);
    return response.data;
  },

  updateStudent: async (classId, studentId, data) => {
    const response = await api.put(`/students/class/${classId}/${studentId}`, data);
    return response.data;
  },

  deleteStudent: async (classId, studentId) => {
    const response = await api.delete(`/students/class/${classId}/${studentId}`);
    return response.data;
  },

  bulkImport: async (classId, students) => {
    const response = await api.post(`/students/class/${classId}/bulk-import`, { students });
    return response.data;
  }
};

export default studentService;