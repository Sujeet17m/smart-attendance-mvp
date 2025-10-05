const axios = require('axios');

class FaceService {
  constructor() {
    this.baseUrl = process.env.FACE_SERVICE_URL;
  }

  async enrollFace(userId, imageData) {
    try {
      const response = await axios.post(`${this.baseUrl}/enroll`, {
        userId,
        imageData
      });
      return response.data;
    } catch (error) {
      throw new Error('Face enrollment failed');
    }
  }

  async verifyFace(userId, imageData) {
    try {
      const response = await axios.post(`${this.baseUrl}/verify`, {
        userId,
        imageData
      });
      return response.data;
    } catch (error) {
      throw new Error('Face verification failed');
    }
  }

  async updateFace(userId, imageData) {
    try {
      const response = await axios.put(`${this.baseUrl}/update`, {
        userId,
        imageData
      });
      return response.data;
    } catch (error) {
      throw new Error('Face update failed');
    }
  }
}

module.exports = new FaceService();
