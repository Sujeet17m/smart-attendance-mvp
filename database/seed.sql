-- Smart Attendance System - Demo Data Seed
-- Run after schema.sql

-- ============================================================================
-- DEMO TEACHER
-- ============================================================================

-- Password: teacher123 (bcrypt hash)
INSERT INTO teachers (id, email, name, password_hash, phone) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'teacher@demo.com',
    'Demo Teacher',
    '$2b$10$rBV2/hzeHI.8Kin9F3qXBORHYJsl9.N.ql3qGBp6F0WqYqTXVMvRm',
    '+1234567890'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- DEMO CLASSES
-- ============================================================================

INSERT INTO classes (id, teacher_id, name, code, description) VALUES
(
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'Computer Science 101',
    'CS-101-A',
    'Introduction to Computer Science - Section A'
),
(
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'Mathematics 201',
    'MATH-201-B',
    'Advanced Mathematics - Section B'
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- DEMO STUDENTS (CS-101-A)
-- ============================================================================

INSERT INTO students (class_id, roll_no, name, email, parent_email, parent_phone) VALUES
(
    '650e8400-e29b-41d4-a716-446655440001',
    'CS001',
    'Alex Johnson',
    'alex.johnson@student.edu',
    'alex.parent@demo.com',
    '+1234567801'
),
(
    '650e8400-e29b-41d4-a716-446655440001',
    'CS002',
    'Sarah Williams',
    'sarah.williams@student.edu',
    'sarah.parent@demo.com',
    '+1234567802'
),
(
    '650e8400-e29b-41d4-a716-446655440001',
    'CS003',
    'Michael Chen',
    'michael.chen@student.edu',
    'michael.parent@demo.com',
    '+1234567803'
),
(
    '650e8400-e29b-41d4-a716-446655440001',
    'CS004',
    'Emily Davis',
    'emily.davis@student.edu',
    'emily.parent@demo.com',
    '+1234567804'
),
(
    '650e8400-e29b-41d4-a716-446655440001',
    'CS005',
    'James Wilson',
    'james.wilson@student.edu',
    'james.parent@demo.com',
    '+1234567805'
)
ON CONFLICT (class_id, roll_no) DO NOTHING;

-- ============================================================================
-- DEMO GEOFENCE
-- ============================================================================

INSERT INTO geofences (name, description, latitude, longitude, radius_meters, created_by) VALUES
(
    'Main Campus - Building A',
    'Computer Science Department',
    28.6139,
    77.2090,
    100,
    '550e8400-e29b-41d4-a716-446655440000'
)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
DECLARE
    teacher_count INTEGER;
    class_count INTEGER;
    student_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO teacher_count FROM teachers;
    SELECT COUNT(*) INTO class_count FROM classes;
    SELECT COUNT(*) INTO student_count FROM students;
    
    RAISE NOTICE 'Demo data seeded successfully!';
    RAISE NOTICE 'Teachers: %', teacher_count;
    RAISE NOTICE 'Classes: %', class_count;
    RAISE NOTICE 'Students: %', student_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE '  Email: teacher@demo.com';
    RAISE NOTICE '  Password: teacher123';
END $$;