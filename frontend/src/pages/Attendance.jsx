import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCapture from '../components/attendance/VideoCapture';
import ClassSelector from '../components/class/ClassSelector';
import LocationStatus from '../components/shared/LocationStatus';
import classService from '../services/class.service';
import attendanceService from '../services/attendance.service';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [location, setLocation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
    getLocation();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classService.getClasses({ limit: 100 });
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Could not get location. Attendance will be recorded without location verification.');
        }
      );
    }
  };

  const handleVideoComplete = async (videoBlob) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    setProcessing(true);
    const loadingToast = toast.loading('Uploading video...');

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', videoBlob, 'attendance.webm');
      formData.append('class_id', selectedClass.id);
      
      if (location) {
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
      }

      // Upload and process
      const response = await attendanceService.processVideo(formData);

      toast.dismiss(loadingToast);
      toast.success('Video uploaded! Processing attendance...');

      // Navigate to results page
      navigate(`/attendance/session/${response.session_id}`);

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to process video');
      console.error('Upload error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Take Attendance</h1>
        <p className="text-gray-600 mt-1">
          Record a 10-second video to automatically mark attendance
        </p>
      </div>

      {/* Location Status */}
      <LocationStatus location={location} />

      {/* Class Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Step 1: Select Class
        </h2>
        <ClassSelector
          classes={classes}
          selectedClass={selectedClass}
          onSelect={setSelectedClass}
        />
      </div>

      {/* Video Capture */}
      {selectedClass && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 2: Record Video
          </h2>
          <VideoCapture
            classId={selectedClass.id}
            onComplete={handleVideoComplete}
          />
        </div>
      )}

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <div className="spinner w-16 h-16 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Video
            </h3>
            <p className="text-gray-600">
              Please wait while we upload and process your video...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}