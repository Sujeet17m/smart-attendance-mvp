-- Face embeddings table (add to existing database schema)
CREATE TABLE IF NOT EXISTS face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    embedding_vector REAL[] NOT NULL,
    quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_face_embeddings_student ON face_embeddings(student_id);
CREATE INDEX idx_face_embeddings_quality ON face_embeddings(quality_score DESC);

-- Face detection logs
CREATE TABLE IF NOT EXISTS face_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL,
    student_id UUID REFERENCES students(id),
    frame_number INTEGER NOT NULL,
    timestamp FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    bbox JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_face_detection_video ON face_detection_logs(video_id);
CREATE INDEX idx_face_detection_student ON face_detection_logs(student_id);

-- Comments
COMMENT ON TABLE face_embeddings IS 'Stores face embeddings for student recognition';
COMMENT ON TABLE face_detection_logs IS 'Logs all face detections from processed videos';
