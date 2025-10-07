import { useState, useRef, useEffect } from 'react';
import { Camera, Square, Upload, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoCapture({ classId, onComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      toast.success('Camera ready!');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please allow camera permissions.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      toast.error('Camera not ready');
      return;
    }

    try {
      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      // Fallback for browsers that don't support vp9
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setCameraReady(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started!');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped!');
    }
  };

  const resetRecording = () => {
    setVideoBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const handleProcess = () => {
    if (videoBlob) {
      onComplete(videoBlob);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="font-bold">REC {recordingTime}s / 10s</span>
          </div>
        )}

        {/* Placeholder when no camera */}
        {!cameraReady && !videoBlob && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Click "Start Camera" to begin</p>
          </div>
        )}

        {/* Video Preview Overlay */}
        {videoBlob && !cameraReady && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <Upload size={48} className="mx-auto mb-2" />
              <p className="text-lg font-semibold">Video Ready to Process</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📹 Recording Instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure good lighting in the classroom</li>
          <li>• Pan camera slowly across all students</li>
          <li>• Keep each student in frame for 2-3 seconds</li>
          <li>• Recording will auto-stop after 10 seconds</li>
        </ul>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {!videoBlob ? (
          <>
            {!cameraReady ? (
              <button
                onClick={startCamera}
                className="btn btn-primary w-full py-3 text-lg"
              >
                <Camera className="inline mr-2" size={20} />
                Start Camera
              </button>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`btn w-full py-3 text-lg ${
                  isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="inline mr-2" size={20} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Camera className="inline mr-2" size={20} />
                    Start Recording (10s)
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleProcess}
              className="btn btn-success w-full py-3 text-lg"
            >
              <Upload className="inline mr-2" size={20} />
              Process Video & Detect Faces
            </button>
            <button
              onClick={resetRecording}
              className="btn btn-secondary w-full py-2"
            >
              <RotateCcw className="inline mr-2" size={18} />
              Record Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}