const db = require('../config/database'); // Database connection
const path = require('path');
const fs = require('fs').promises;
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse
} = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * Get students by class (with pagination and search)
 */
exports.getStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Verify teacher owns the class
    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    // Build query
    let query = `
      SELECT 
        s.*,
        COUNT(DISTINCT fe.id) as face_embeddings_count,
        CASE WHEN COUNT(fe.id) > 0 THEN true ELSE false END as face_enrolled
      FROM students s
      LEFT JOIN face_embeddings fe ON s.id = fe.student_id AND fe.is_active = true
      WHERE s.class_id = $1 AND s.is_active = true
    `;

    const params = [classId];

    // Add search filter
    if (search) {
      query += ` AND (s.name ILIKE $2 OR s.roll_no ILIKE $2 OR s.email ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY s.id
      ORDER BY s.roll_no ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM students
      WHERE class_id = $1 AND is_active = true
      ${search ? 'AND (name ILIKE $2 OR roll_no ILIKE $2 OR email ILIKE $2)' : ''}
    `;
    const countParams = search ? [classId, `%${search}%`] : [classId];
    const countResult = await db.query(countQuery, countParams);

    return paginatedResponse(res, result.rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].total)
    });

  } catch (error) {
    logger.error('Get students error:', error);
    return errorResponse(res, 'Failed to fetch students', 500);
  }
};

/**
 * Get single student by ID
 */
exports.getStudentById = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.user.id;

    const result = await db.query(
      `SELECT 
        s.*,
        c.name as class_name,
        c.code as class_code,
        COUNT(DISTINCT fe.id) as face_embeddings_count,
        COUNT(DISTINCT ar.id) as total_attendance_records,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN face_embeddings fe ON s.id = fe.student_id AND fe.is_active = true
      LEFT JOIN attendance_records ar ON s.id = ar.student_id
      WHERE s.id = $1 AND s.class_id = $2 AND c.teacher_id = $3
      GROUP BY s.id, c.id`,
      [studentId, classId, teacherId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'Student not found');
    }

    return successResponse(res, result.rows[0]);

  } catch (error) {
    logger.error('Get student error:', error);
    return errorResponse(res, 'Failed to fetch student', 500);
  }
};

/**
 * Create student
 */
exports.createStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const {
      roll_no,
      name,
      email,
      phone,
      parent_name,
      parent_email,
      parent_phone,
      date_of_birth
    } = req.body;

    if (!roll_no || !name) {
      return errorResponse(res, 'Roll number and name are required', 400);
    }

    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );
    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    const rollCheck = await db.query(
      'SELECT id FROM students WHERE class_id = $1 AND roll_no = $2',
      [classId, roll_no]
    );
    if (rollCheck.rows.length > 0) {
      return errorResponse(res, 'Roll number already exists in this class', 409);
    }

    const result = await db.query(
      `INSERT INTO students (
        class_id, roll_no, name, email, phone, 
        parent_name, parent_email, parent_phone, date_of_birth
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [classId, roll_no, name, email || null, phone || null,
        parent_name || null, parent_email || null, parent_phone || null,
        date_of_birth || null]
    );

    logger.info('Student created', { studentId: result.rows[0].id, rollNo: roll_no });
    return successResponse(res, result.rows[0], 'Student created successfully', 201);

  } catch (error) {
    logger.error('Create student error:', error);
    return errorResponse(res, 'Failed to create student', 500);
  }
};

/**
 * Update student
 */
exports.updateStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.user.id;

    const studentCheck = await db.query(
      `SELECT s.id FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND s.class_id = $2 AND c.teacher_id = $3`,
      [studentId, classId, teacherId]
    );
    if (studentCheck.rows.length === 0) {
      return notFoundResponse(res, 'Student not found');
    }

    const allowedFields = [
      'roll_no','name','email','phone',
      'parent_name','parent_email','parent_phone','date_of_birth'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    values.push(studentId);

    const query = `
      UPDATE students
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    logger.info('Student updated', { studentId });

    return successResponse(res, result.rows[0], 'Student updated successfully');

  } catch (error) {
    logger.error('Update student error:', error);
    return errorResponse(res, 'Failed to update student', 500);
  }
};

/**
 * Delete student (soft delete)
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.user.id;

    const studentCheck = await db.query(
      `SELECT s.id FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND s.class_id = $2 AND c.teacher_id = $3`,
      [studentId, classId, teacherId]
    );
    if (studentCheck.rows.length === 0) {
      return notFoundResponse(res, 'Student not found');
    }

    await db.query('UPDATE students SET is_active = false WHERE id = $1', [studentId]);
    logger.info('Student deleted', { studentId });

    return successResponse(res, null, 'Student deleted successfully');

  } catch (error) {
    logger.error('Delete student error:', error);
    return errorResponse(res, 'Failed to delete student', 500);
  }
};

/**
 * Bulk import students
 */
exports.bulkImportStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return errorResponse(res, 'Students array is required', 400);
    }

    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );
    if (classCheck.rows.length === 0) {
      return notFoundResponse(res, 'Class not found');
    }

    const imported = [];
    const errors = [];
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      for (const student of students) {
        try {
          if (!student.roll_no || !student.name) {
            errors.push({ roll_no: student.roll_no, error: 'Roll number and name required' });
            continue;
          }

          const dupCheck = await client.query(
            'SELECT id FROM students WHERE class_id = $1 AND roll_no = $2',
            [classId, student.roll_no]
          );
          if (dupCheck.rows.length > 0) {
            errors.push({ roll_no: student.roll_no, error: 'Roll number already exists' });
            continue;
          }

          const result = await client.query(
            `INSERT INTO students (
              class_id, roll_no, name, email, phone,
              parent_name, parent_email, parent_phone
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            [
              classId,
              student.roll_no,
              student.name,
              student.email || null,
              student.phone || null,
              student.parent_name || null,
              student.parent_email || null,
              student.parent_phone || null
            ]
          );

          imported.push(result.rows[0]);

        } catch (error) {
          errors.push({ roll_no: student.roll_no, error: error.message });
        }
      }

      await client.query('COMMIT');

      logger.info('Bulk import completed', {
        classId,
        imported: imported.length,
        errors: errors.length
      });

      return successResponse(res, {
        imported: imported.length,
        errors: errors.length,
        students: imported,
        error_details: errors
      }, 'Bulk import completed');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Bulk import error:', error);
    return errorResponse(res, 'Failed to import students', 500);
  }
};

/**
 * ============================
 * Face Image Retrieval Methods
 * ============================
 */

/**
 * Get single student face image (highest quality)
 */
exports.getStudentFaceImage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT image_url 
       FROM face_embeddings 
       WHERE student_id = $1 
       ORDER BY quality_score DESC 
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No face image found for this student' });
    }

    const imageUrl = result.rows[0].image_url;
    const imagePath = path.join(__dirname, '../../../face-service/storage', imageUrl);

    try {
      await fs.access(imagePath);
      return res.json({ success: true, imageUrl: `/storage/${imageUrl}`, studentId: id });
    } catch {
      return res.status(404).json({ error: 'Image file not found on disk' });
    }

  } catch (error) {
    logger.error('Error fetching student face image:', error);
    return res.status(500).json({ error: 'Failed to fetch student face image' });
  }
};

/**
 * Get all face images for a student
 */
exports.getStudentFaceImages = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, image_url, quality_score, created_at
       FROM face_embeddings 
       WHERE student_id = $1 
       ORDER BY quality_score DESC`,
      [id]
    );

    const images = result.rows.map(row => ({
      id: row.id,
      url: `/storage/${row.image_url}`,
      quality: row.quality_score,
      createdAt: row.created_at
    }));

    return res.json({ success: true, studentId: id, images, count: images.length });

  } catch (error) {
    logger.error('Error fetching student face images:', error);
    return res.status(500).json({ error: 'Failed to fetch student face images' });
  }
};
