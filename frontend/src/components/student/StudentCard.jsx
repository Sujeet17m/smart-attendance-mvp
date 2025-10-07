import React, { useState, useEffect } from 'react';

const StudentCard = ({ student }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Fetch student's first face image
    const fetchImage = async () => {
      try {
        const response = await fetch(`/api/students/${student.id}/face-image`);
        if (response.ok) {
          const data = await response.json();
          // Image URL will be like: /storage/faces/student-001/image.jpg
          setImageUrl(data.imageUrl);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        setImageError(true);
      }
    };

    if (student.face_enrolled) {
      fetchImage();
    }
  }, [student.id, student.face_enrolled]);

  return (
    <div className="student-card">
      <div className="student-image">
        {imageUrl && !imageError ? (
          <img 
            src={imageUrl} 
            alt={student.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="placeholder-image">
            {student.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="student-info">
        <h3>{student.name}</h3>
        <p>Roll: {student.roll_number}</p>
        <p>Class: {student.class_name}</p>
        {student.face_enrolled && (
          <span className="badge badge-success">Face Enrolled</span>
        )}
      </div>
    </div>
  );
};

export default StudentCard;