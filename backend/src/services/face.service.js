// const axios = require('axios');
// const config = require('../config');
// const logger = require('../utils/logger.util');

// /**
//  * Call face recognition service to process video
//  */
// exports.processVideo = async (payload) => {
//   try {
//     const { video_url, session_id, class_id } = payload;

//     logger.info('Calling face recognition service', { session_id, video_url });

//     const response = await axios.post(
//       `${config.faceService.url}/api/process-video`,
//       {
//         video_url,
//         session_id,
//         class_id
//       },
//       {
//         timeout: config.faceService.timeout,
//         headers: {
//           'Content-Type': 'application/json',
//           'X-API-Key': config.faceService.apiKey || ''
//         }
//       }
//     );

//     logger.info('Face recognition service response received', {
//       session_id,
//       success: response.data.success
//     });

//     return response.data;

//   } catch (error) {
//     logger.error('Face service API error:', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status
//     });

//     if (error.code === 'ECONNREFUSED') {
//       throw new Error('Face recognition service is not available');
//     }

//     if (error.response?.status === 500) {
//       throw new Error('Face recognition service error');
//     }

//     throw error;
//   }
// };

// /**
//  * Enroll face for student
//  */
// exports.enrollFace = async (payload) => {
//   try {
//     const { student_id, image_urls } = payload;

//     logger.info('Enrolling face', { student_id, imageCount: image_urls.length });

//     const response = await axios.post(
//       `${config.faceService.url}/api/enroll-face`,
//       {
//         student_id,
//         image_urls
//       },
//       {
//         timeout: config.faceService.timeout,
//         headers: {
//           'Content-Type': 'application/json',
//           'X-API-Key': config.faceService.apiKey || ''
//         }
//       }
//     );

//     logger.info('Face enrollment completed', { student_id });

//     return response.data;

//   } catch (error) {
//     logger.error('Face enrollment error:', error);
//     throw error;
//   }
// };

// const axios = require('axios');
// const FormData = require('form-data');
// const config = require('../config');
// const logger = require('../utils/logger.util');

// const DEFAULT_TIMEOUT = config.faceService?.timeout || 60000;
// const BASE_URL = config.faceService?.url || process.env.FACE_SERVICE_URL || 'http://localhost:8002';
// const API_KEY = config.faceService?.apiKey || '';

// const client = axios.create({
//   baseURL: BASE_URL,
//   timeout: DEFAULT_TIMEOUT,
// });

// /**
//  * Helper to build headers for form-data or json
//  */
// function buildHeaders(formData) {
//   if (formData) {
//     return { ...formData.getHeaders(), 'X-API-Key': API_KEY || '' };
//   }
//   return { 'Content-Type': 'application/json', 'X-API-Key': API_KEY || '' };
// }

// /**
//  * Process attendance video
//  * Accepts either:
//  *  - payload.video_url (existing flow)  OR
//  *  - payload.videoBuffer (Buffer) to upload directly
//  * payload may also include session_id and class_id
//  */
// exports.processVideo = async (payload = {}) => {
//   try {
//     const { video_url, videoBuffer, session_id, class_id } = payload;

//     logger.info('Calling face recognition service (processVideo)', { session_id, video_url, hasBuffer: !!videoBuffer });

//     // If caller provided a buffer, upload via FormData
//     if (videoBuffer) {
//       const formData = new FormData();
//       formData.append('video', videoBuffer, {
//         filename: 'attendance.mp4',
//         contentType: 'video/mp4',
//       });
//       if (class_id) formData.append('class_id', class_id);
//       if (session_id) formData.append('session_id', session_id);

//       const response = await client.post('/api/process-video', formData, {
//         headers: buildHeaders(formData),
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity,
//       });

//       logger.info('Face recognition service response received (buffer)', {
//         session_id,
//         success: response.data?.success,
//       });

//       return response.data;
//     }

//     // Fallback to existing JSON URL-based API
//     const response = await client.post(
//       '/api/process-video',
//       { video_url, session_id, class_id },
//       { headers: buildHeaders(null) }
//     );

//     logger.info('Face recognition service response received (url)', {
//       session_id,
//       success: response.data?.success,
//     });

//     return response.data;
//   } catch (error) {
//     logger.error('Face service API error (processVideo):', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//     });

//     if (error.code === 'ECONNREFUSED') {
//       throw new Error('Face recognition service is not available');
//     }
//     if (error.response?.status === 500) {
//       throw new Error('Face recognition service error');
//     }
//     throw error;
//   }
// };

// /**
//  * Enroll face for student
//  * Accepts either:
//  *  - payload.image_urls (existing flow) OR
//  *  - payload.imageBuffers (Array<Buffer>) to upload directly
//  * payload should include student_id
//  */
// exports.enrollFace = async (payload = {}) => {
//   try {
//     const { student_id, image_urls, imageBuffers } = payload;

//     logger.info('Enrolling face', {
//       student_id,
//       imageCount: (image_urls && image_urls.length) || (imageBuffers && imageBuffers.length) || 0,
//       usingBuffers: !!imageBuffers,
//     });

//     // If buffers provided, upload via FormData
//     if (imageBuffers && Array.isArray(imageBuffers) && imageBuffers.length > 0) {
//       const formData = new FormData();
//       formData.append('student_id', student_id);
//       imageBuffers.forEach((buffer, idx) => {
//         formData.append('images', buffer, {
//           filename: `face_${idx}.jpg`,
//           contentType: 'image/jpeg',
//         });
//       });

//       const response = await client.post('/api/enroll-face', formData, {
//         headers: buildHeaders(formData),
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity,
//       });

//       logger.info('Face enrollment completed (buffers)', { student_id });

//       return response.data;
//     }

//     // Fallback to JSON URL-based enroll
//     const response = await client.post(
//       '/api/enroll-face',
//       { student_id, image_urls },
//       { headers: buildHeaders(null) }
//     );

//     logger.info('Face enrollment completed (urls)', { student_id });

//     return response.data;
//   } catch (error) {
//     logger.error('Face enrollment error:', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//     });
//     throw error;
//   }
// };

// /**
//  * Optional helpers from the new class: embeddings / delete / health
//  * Exported for convenience if you want to call them from other modules.
//  */
// exports.getStudentEmbeddings = async (studentId) => {
//   try {
//     const response = await client.get(`/api/student/${studentId}/embeddings`, {
//       headers: buildHeaders(null),
//     });
//     return response.data;
//   } catch (error) {
//     logger.error('Error fetching embeddings:', { message: error.message, studentId });
//     throw error;
//   }
// };

// exports.deleteStudentEmbeddings = async (studentId) => {
//   try {
//     const response = await client.delete(`/api/student/${studentId}/embeddings`, {
//       headers: buildHeaders(null),
//     });
//     return response.data;
//   } catch (error) {
//     logger.error('Error deleting embeddings:', { message: error.message, studentId });
//     throw error;
//   }
// };

// exports.healthCheck = async () => {
//   try {
//     const response = await client.get('/health', { headers: buildHeaders(null) });
//     return response.data;
//   } catch (error) {
//     logger.warn('Face service health check failed:', { message: error.message });
//     return { status: 'unhealthy', error: error.message };
//   }
// };


// backend/src/services/face.service.js

const axios = require('axios');
const FormData = require('form-data');
const config = require('../config'); // <-- From OLD code
const logger = require('../utils/logger.util'); // <-- From OLD code

class FaceService {
  constructor() {
    // Use the central config for URL, timeout, and API key
    this.baseURL = config.faceService.url;
    this.timeout = config.faceService.timeout || 60000;
    this.apiKey = config.faceService.apiKey || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
    });
  }

  // Helper to build common headers
  _buildHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Process attendance video from a buffer
   */
  async processVideo(videoBuffer, classId, sessionId) {
    try {
      const formData = new FormData();
      formData.append('video', videoBuffer, {
        filename: 'attendance.mp4',
        contentType: 'video/mp4',
      });
      if (classId) formData.append('class_id', classId);
      if (sessionId) formData.append('session_id', sessionId);

      logger.info('Calling face service to process video buffer', { classId, sessionId });

      const response = await this.client.post('/api/process-video', formData, {
        headers: this._buildHeaders(formData.getHeaders()),
        maxContentLength: Infinity, // Important for large files
        maxBodyLength: Infinity,
      });

      logger.info('Face service response received', { success: response.data.success });
      return response.data;
    } catch (error) {
      // Use the better error handling from the OLD code
      logger.error('Face service API error (processVideo):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Face recognition service is not available');
      }
      if (error.response?.status >= 500) {
        throw new Error('Face recognition service encountered an error');
      }
      throw error;
    }
  }

  /**
   * Enroll student face from image buffers
   */
  async enrollStudentFace(studentId, imageBuffers) {
    try {
      const formData = new FormData();
      // It's better to send student_id as a form field, not a query param
      formData.append('student_id', studentId);

      imageBuffers.forEach((buffer, index) => {
        formData.append('images', buffer, {
          filename: `face_${index}.jpg`,
          contentType: 'image/jpeg',
        });
      });

      logger.info('Enrolling face via buffers', { studentId, imageCount: imageBuffers.length });

      const response = await this.client.post('/api/enroll-face', formData, {
        headers: this._buildHeaders(formData.getHeaders()),
      });

      logger.info('Face enrollment completed', { studentId });
      return response.data;
    } catch (error) {
      logger.error('Face enrollment error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get student embeddings
   */
  async getStudentEmbeddings(studentId) {
    try {
      const response = await this.client.get(`/api/student/${studentId}/embeddings`, {
        headers: this._buildHeaders(),
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching embeddings:', { message: error.message, studentId });
      throw error;
    }
  }

  /**
   * Delete student embeddings
   */
  async deleteStudentEmbeddings(studentId) {
    try {
      const response = await this.client.delete(`/api/student/${studentId}/embeddings`, {
        headers: this._buildHeaders(),
      });
      return response.data;
    } catch (error) {
      logger.error('Error deleting embeddings:', { message: error.message, studentId });
      throw error;
    }
  }

  /**
   * Check service health
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health', { headers: this._buildHeaders() });
      return response.data;
    } catch (error) {
      logger.warn('Face service health check failed:', { message: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Export a single instance (singleton) for the application to use
module.exports = new FaceService();