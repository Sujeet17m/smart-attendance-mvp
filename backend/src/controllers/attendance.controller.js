const db = require('../config/database');
const uploadService = require('../services/upload.service');
const faceService = require('../services/face.service');
const notificationService = require('../services/notification.service');
const geofenceService = require('../services/geofence.service');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * Process video for attendance
 */
exports.processVideo = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { class_id, latitude, longitude } = req.body;

    // Validate
    if (!class_id) {
      return errorResponse(res, 'Class ID is required', 400);
    }

    if (!req.file) {
      return errorResponse(res, 'Video file is required', 400);
    }

    // Verify class ownership
    const classCheck = await db.query(
      'SELECT id, name FROM classes WHERE id = $1 AND teacher_id = $2',
      [class_id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    // Validate location if provided
    let locationVerified = false;
    let geofenceId = null;

    if (latitude && longitude) {
      const geofenceCheck = await geofenceService.validateLocation(
        parseFloat(latitude),
        parseFloat(longitude)
      );

      locationVerified = geofenceCheck.valid;
      geofenceId = geofenceCheck.geofenceId;
    }

    // Upload video to S3
    logger.info('Uploading video to S3...');
    const videoUrl = await uploadService.uploadToS3(req.file);
    logger.info('Video uploaded', { videoUrl });

    // Get student count for this class
    const studentCount = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = $1 AND is_active = true',
      [class_id]
    );

    // Create attendance session
    const session = await db.query(
      `INSERT INTO attendance_sessions (
        class_id, teacher_id, video_url,
        location_latitude, location_longitude,
        location_verified, geofence_id,
        processing_status, total_students
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        class_id,
        teacherId,
        videoUrl,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        locationVerified,
        geofenceId,
        'processing',
        parseInt(studentCount.rows[0].count)
      ]
    );

    const sessionId = session.rows[0].id;

    logger.info('Attendance session created', { sessionId });

    // Start async processing (don't wait)
    processVideoAsync(sessionId, videoUrl, class_id).catch(error => {
      logger.error('Async video processing failed:', error);
    });

    return successResponse(res, {
      session_id: sessionId,
      status: 'processing',
      location_verified: locationVerified,
      message: 'Video uploaded successfully. Processing started.'
    }, 'Video processing started', 202);

  } catch (error) {
    logger.error('Process video error:', error);
    return errorResponse(res, 'Failed to process video', 500);
  }
};

/**
 * Async video processing
 */
async function processVideoAsync(sessionId, videoUrl, classId) {
  try {
    // Update processing started time
    await db.query(
      'UPDATE attendance_sessions SET processing_started_at = CURRENT_TIMESTAMP WHERE id = $1',
      [sessionId]
    );

    // Call face recognition service
    logger.info('Calling face recognition service...', { sessionId });
    
    const faceResults = await faceService.processVideo({
      video_url: videoUrl,
      session_id: sessionId,
      class_id: classId
    });

    logger.info('Face recognition completed', {
      sessionId,
      studentsProcessed: faceResults.results?.length || 0
    });

    // Update session status
    const presentCount = faceResults.results?.filter(r => r.present).length || 0;
    const totalStudents = faceResults.results?.length || 0;

    await db.query(
      `UPDATE attendance_sessions 
       SET processing_status = $1,
           processing_completed_at = CURRENT_TIMESTAMP,
           present_count = $2,
           absent_count = $3
       WHERE id = $4`,
      ['completed', presentCount, totalStudents - presentCount, sessionId]
    );

    logger.info('Attendance session completed', {
      sessionId,
      present: presentCount,
      absent: totalStudents - presentCount
    });

  } catch (error) {
    logger.error('Async processing error:', error);

    // Update session with error
    await db.query(
      `UPDATE attendance_sessions 
       SET processing_status = $1, notes = $2 
       WHERE id = $3`,
      ['failed', `Processing error: ${error.message}`, sessionId]
    );
  }
}

/**
 * Get session results
 */
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    // Get session with records
    const result = await db.query(
      `SELECT 
        sess.*,
        c.name as class_name,
        c.code as class_code,
        json_agg(
          json_build_object(
            'id', ar.id,
            'student_id', s.id,
            'roll_no', s.roll_no,
            'name', s.name,
            'status', ar.status,
            'confidence_score', ar.confidence_score,
            'face_detected', ar.face_detected,
            'is_manual_override', ar.is_manual_override
          ) ORDER BY s.roll_no
        ) FILTER (WHERE s.id IS NOT NULL) as records
      FROM attendance_sessions sess
      JOIN classes c ON sess.class_id = c.id
      LEFT JOIN attendance_records ar ON sess.id = ar.session_id
      LEFT JOIN students s ON ar.student_id = s.id
      WHERE sess.id = $1 AND sess.teacher_id = $2
      GROUP BY sess.id, c.id`,
      [sessionId, teacherId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'Session not found');
    }

    return successResponse(res, result.rows[0]);

  } catch (error) {
    logger.error('Get session error:', error);
    return errorResponse(res, 'Failed to fetch session', 500);
  }
};


/**
 * Update attendance record (manual correction)
 */
exports.updateRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const teacherId = req.user.id;
    const { status, notes } = req.body;

    // Validate status
    if (!['present', 'absent'].includes(status)) {
      return errorResponse(res, 'Invalid status. Must be present or absent', 400);
    }

    // Verify teacher owns the session
    const recordCheck = await db.query(
      `SELECT ar.id, ar.session_id
       FROM attendance_records ar
       JOIN attendance_sessions sess ON ar.session_id = sess.id
       WHERE ar.id = $1 AND sess.teacher_id = $2`,
      [recordId, teacherId]
    );

    if (recordCheck.rows.length === 0) {
      return notFoundResponse(res, 'Attendance record not found');
    }

    // Update record
    const result = await db.query(
      `UPDATE attendance_records 
       SET status = $1, 
           is_manual_override = true,
           override_by = $2,
           override_at = CURRENT_TIMESTAMP,
           override_reason = $3,
           notes = $4
       WHERE id = $5
       RETURNING *`,
      [status, teacherId, 'Manual correction by teacher', notes || null, recordId]
    );

    // Update session counts
    const sessionId = recordCheck.rows[0].session_id;
    await updateSessionCounts(sessionId);

    logger.info('Attendance record updated', { recordId, status });

    return successResponse(res, result.rows[0], 'Attendance updated successfully');

  } catch (error) {
    logger.error('Update record error:', error);
    return errorResponse(res, 'Failed to update attendance', 500);
  }
};

/**
 * Helper: Update session present/absent counts
 */
async function updateSessionCounts(sessionId) {
  await db.query(
    `UPDATE attendance_sessions
     SET present_count = (
       SELECT COUNT(*) FROM attendance_records 
       WHERE session_id = $1 AND status = 'present'
     ),
     absent_count = (
       SELECT COUNT(*) FROM attendance_records 
       WHERE session_id = $1 AND status = 'absent'
     )
     WHERE id = $1`,
    [sessionId]
  );
}

/**
 * Send parent notifications
 */
exports.sendNotifications = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    // Verify ownership
    const sessionCheck = await db.query(
      'SELECT id FROM attendance_sessions WHERE id = $1 AND teacher_id = $2',
      [sessionId, teacherId]
    );

    if (sessionCheck.rows.length === 0) {
      return notFoundResponse(res, 'Session not found');
    }

    // Get attendance data for notifications
    const attendanceData = await db.query(
      `SELECT 
        s.id as student_id,
        s.name as student_name,
        s.roll_no,
        s.parent_email,
        s.parent_phone,
        ar.status,
        sess.session_date,
        c.name as class_name
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN attendance_sessions sess ON ar.session_id = sess.id
      JOIN classes c ON sess.class_id = c.id
      WHERE ar.session_id = $1 AND s.parent_email IS NOT NULL`,
      [sessionId]
    );

    if (attendanceData.rows.length === 0) {
      return errorResponse(res, 'No students with parent emails found', 400);
    }

    // Send notifications via n8n
    const notificationResult = await notificationService.sendAttendanceNotifications({
      session_id: sessionId,
      notifications: attendanceData.rows
    });

    logger.info('Notifications sent', { 
      sessionId, 
      count: attendanceData.rows.length 
    });

    return successResponse(res, {
      notifications_sent: attendanceData.rows.length,
      webhook_response: notificationResult
    }, 'Notifications sent successfully');

  } catch (error) {
    logger.error('Send notifications error:', error);
    return errorResponse(res, 'Failed to send notifications', 500);
  }
};

/**
 * Get attendance history
 */
exports.getAttendanceHistory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { 
      class_id, 
      start_date, 
      end_date, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = `
      SELECT 
        sess.*,
        c.name as class_name,
        c.code as class_code
      FROM attendance_sessions sess
      JOIN classes c ON sess.class_id = c.id
      WHERE sess.teacher_id = $1
    `;

    const params = [teacherId];
    let paramCount = 2;

    // Add filters
    if (class_id) {
      query += ` AND sess.class_id = $${paramCount}`;
      params.push(class_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND sess.session_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sess.session_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY sess.session_date DESC, sess.created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;

    const offset = (page - 1) * limit;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM attendance_sessions sess
      WHERE sess.teacher_id = $1
    `;

    const countParams = [teacherId];
    let countParamCount = 2;

    if (class_id) {
      countQuery += ` AND sess.class_id = $${countParamCount}`;
      countParams.push(class_id);
      countParamCount++;
    }

    if (start_date) {
      countQuery += ` AND sess.session_date >= $${countParamCount}`;
      countParams.push(start_date);
      countParamCount++;
    }

    if (end_date) {
      countQuery += ` AND sess.session_date <= $${countParamCount}`;
      countParams.push(end_date);
    }

    const countResult = await db.query(countQuery, countParams);

    return successResponse(res, {
      sessions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    logger.error('Get attendance history error:', error);
    return errorResponse(res, 'Failed to fetch attendance history', 500);
  }
};

/**
 * Export attendance report
 */
exports.exportReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    // Get session data
    const result = await db.query(
      `SELECT 
        sess.session_date,
        sess.session_time,
        c.name as class_name,
        c.code as class_code,
        s.roll_no,
        s.name as student_name,
        ar.status,
        ar.confidence_score,
        ar.is_manual_override
      FROM attendance_sessions sess
      JOIN classes c ON sess.class_id = c.id
      JOIN attendance_records ar ON sess.id = ar.session_id
      JOIN students s ON ar.student_id = s.id
      WHERE sess.id = $1 AND sess.teacher_id = $2
      ORDER BY s.roll_no`,
      [sessionId, teacherId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'Session not found');
    }

    // Generate CSV
    const csv = generateCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${sessionId}.csv`);
    
    return res.send(csv);

  } catch (error) {
    logger.error('Export report error:', error);
    return errorResponse(res, 'Failed to export report', 500);
  }
};

/**
 * Helper: Generate CSV from data
 */
function generateCSV(data) {
  if (data.length === 0) return '';

  const headers = [
    'Date', 'Time', 'Class', 'Code', 'Roll No', 
    'Student Name', 'Status', 'Confidence', 'Manual Override'
  ];

  const rows = data.map(row => [
    row.session_date,
    row.session_time,
    row.class_name,
    row.class_code,
    row.roll_no,
    row.student_name,
    row.status,
    row.confidence_score ? (row.confidence_score * 100).toFixed(1) + '%' : 'N/A',
    row.is_manual_override ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

module.exports = {
  processVideo: exports.processVideo,
  getSession: exports.getSession,
  updateRecord: exports.updateRecord,
  sendNotifications: exports.sendNotifications,
  getAttendanceHistory: exports.getAttendanceHistory,
  exportReport: exports.exportReport
};

const FaceService = require('../services/face.service');
const faceService = new FaceService();

// Add to existing processAttendance function:
async function processAttendance(req, res) {
  try {
    const { classId } = req.body;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    // Process video with face service
    const faceResults = await faceService.processVideo(
      videoFile.buffer,
      classId
    );

    // Store results in database
    const attendanceRecords = [];
    
    for (const student of faceResults.recognized_students) {
      // Create attendance record
      const record = await db.query(
        `INSERT INTO attendance (
          class_id, student_id, date, status, confidence, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *`,
        [classId, student.student_id, new Date(), 'present', student.confidence]
      );
      
      attendanceRecords.push(record.rows[0]);
    }

    res.json({
      success: true,
      message: 'Attendance processed successfully',
      summary: {
        total_students: faceResults.unique_students_identified,
        processing_time: faceResults.processing_time,
      },
      records: attendanceRecords,
    });

  } catch (error) {
    console.error('Error processing attendance:', error);
    res.status(500).json({ error: 'Failed to process attendance' });
  }
}