const db = require('../config/database');
const { successResponse, errorResponse, notFoundResponse, paginatedResponse } = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * Get all classes for logged-in teacher
 */
exports.getClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let query = `
      SELECT 
        c.*,
        COUNT(s.id) as student_count,
        COUNT(CASE WHEN s.is_active = true THEN 1 END) as active_students
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      WHERE c.teacher_id = $1 AND c.is_active = true
    `;

    const params = [teacherId];

    // Add search filter
    if (search) {
      query += ` AND (c.name ILIKE $2 OR c.code ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    // Execute query
    const result = await db.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM classes c
      WHERE c.teacher_id = $1 AND c.is_active = true
      ${search ? 'AND (c.name ILIKE $2 OR c.code ILIKE $2)' : ''}
    `;

    const countParams = search ? [teacherId, `%${search}%`] : [teacherId];
    const countResult = await db.query(countQuery, countParams);

    return paginatedResponse(res, result.rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].total)
    });

  } catch (error) {
    logger.error('Get classes error:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
};

/**
 * Get single class by ID
 */
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const result = await db.query(
      `SELECT 
        c.*,
        COUNT(s.id) as student_count,
        COUNT(CASE WHEN s.is_active = true THEN 1 END) as active_students
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      WHERE c.id = $1 AND c.teacher_id = $2 AND c.is_active = true
      GROUP BY c.id`,
      [id, teacherId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    return successResponse(res, result.rows[0]);

  } catch (error) {
    logger.error('Get class error:', error);
    return errorResponse(res, 'Failed to fetch class', 500);
  }
};

/**
 * Create new class
 */
exports.createClass = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { name, code, description } = req.body;

    // Validate input
    if (!name || !code) {
      return errorResponse(res, 'Name and code are required', 400);
    }

    // Check if code already exists
    const existing = await db.query(
      'SELECT id FROM classes WHERE code = $1',
      [code]
    );

    if (existing.rows.length > 0) {
      return errorResponse(res, 'Class code already exists', 409);
    }

    // Create class
    const result = await db.query(
      `INSERT INTO classes (teacher_id, name, code, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teacherId, name, code, description || null]
    );

    logger.info('Class created', { classId: result.rows[0].id, code });

    return successResponse(res, result.rows[0], 'Class created successfully', 201);

  } catch (error) {
    logger.error('Create class error:', error);
    return errorResponse(res, 'Failed to create class', 500);
  }
};

/**
 * Update class
 */
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;
    const { name, code, description } = req.body;

    // Check ownership
    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    // Check if new code conflicts
    if (code) {
      const codeCheck = await db.query(
        'SELECT id FROM classes WHERE code = $1 AND id != $2',
        [code, id]
      );

      if (codeCheck.rows.length > 0) {
        return errorResponse(res, 'Class code already exists', 409);
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (code) {
      updates.push(`code = $${paramCount}`);
      values.push(code);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    values.push(id);

    const query = `
      UPDATE classes 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    logger.info('Class updated', { classId: id });

    return successResponse(res, result.rows[0], 'Class updated successfully');

  } catch (error) {
    logger.error('Update class error:', error);
    return errorResponse(res, 'Failed to update class', 500);
  }
};

/**
 * Delete class (soft delete)
 */
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Check ownership
    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    // Soft delete
    await db.query(
      'UPDATE classes SET is_active = false WHERE id = $1',
      [id]
    );

    logger.info('Class deleted', { classId: id });

    return successResponse(res, null, 'Class deleted successfully');

  } catch (error) {
    logger.error('Delete class error:', error);
    return errorResponse(res, 'Failed to delete class', 500);
  }
};

/**
 * Get class statistics
 */
exports.getClassStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Verify ownership
    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    // Get statistics
    const stats = await db.query(
      `SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT sess.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN sess.session_date >= CURRENT_DATE - INTERVAL '7 days' THEN sess.id END) as sessions_last_7_days,
        COUNT(DISTINCT CASE WHEN sess.session_date >= CURRENT_DATE - INTERVAL '30 days' THEN sess.id END) as sessions_last_30_days,
        AVG(CASE WHEN sess.processing_status = 'completed' THEN sess.present_count::float / NULLIF(sess.total_students, 0) * 100 END) as average_attendance_rate
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id AND s.is_active = true
      LEFT JOIN attendance_sessions sess ON c.id = sess.class_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [id]
    );

    // Get recent attendance trend
    const trend = await db.query(
      `SELECT 
        session_date,
        present_count,
        total_students,
        ROUND((present_count::float / NULLIF(total_students, 0) * 100)::numeric, 2) as attendance_rate
      FROM attendance_sessions
      WHERE class_id = $1 AND processing_status = 'completed'
      ORDER BY session_date DESC
      LIMIT 10`,
      [id]
    );

    return successResponse(res, {
      statistics: stats.rows[0],
      recent_trend: trend.rows
    });

  } catch (error) {
    logger.error('Get class statistics error:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};