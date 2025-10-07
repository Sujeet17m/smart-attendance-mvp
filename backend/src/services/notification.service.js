const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger.util');

/**
 * Send attendance notifications via n8n webhook
 */
exports.sendAttendanceNotifications = async (payload) => {
  try {
    if (!config.n8n.webhookUrl) {
      logger.warn('n8n webhook URL not configured');
      return { success: false, message: 'Webhook not configured' };
    }

    logger.info('Sending notifications to n8n', {
      session_id: payload.session_id,
      count: payload.notifications.length
    });

    const response = await axios.post(
      config.n8n.webhookUrl,
      payload,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Notifications webhook called successfully', {
      status: response.status
    });

    return {
      success: true,
      response: response.data
    };

  } catch (error) {
    logger.error('Notification webhook error:', {
      message: error.message,
      response: error.response?.data
    });

    // Don't throw - notifications are not critical
    return {
      success: false,
      error: error.message
    };
  }
};