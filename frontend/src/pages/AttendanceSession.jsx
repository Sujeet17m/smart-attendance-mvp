import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Send, RefreshCw } from 'lucide-react';
import AttendanceTable from '../components/attendance/AttendanceTable';
import attendanceService from '../services/attendance.service';
import toast from 'react-hot-toast';

export default function AttendanceSession() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSession();
    
    // Auto-refresh if processing
    const interval = setInterval(() => {
      if (session?.processing_status === 'processing') {
        loadSession(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSession = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await attendanceService.getSession(sessionId);
      setSession(data);
    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateRecord = async (recordId, status) => {
    try {
      await attendanceService.updateRecord(recordId, { status });
      toast.success('Attendance updated');
      loadSession(true);
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const handleSendNotifications = async () => {
    try {
      const loadingToast = toast.loading('Sending notifications...');
      await attendanceService.sendNotifications(sessionId);
      toast.dismiss(loadingToast);
      toast.success('Notifications sent successfully!');
    } catch (error) {
      toast.error('Failed to send notifications');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await attendanceService.exportReport(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${sessionId}.csv`;
      a.click();
      toast.success('Report exported!');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Session not found</p>
        <Link to="/attendance/history" className="btn btn-primary mt-4">
          Back to History
        </Link>
      </div>
    );
  }

  const isProcessing = session.processing_status === 'processing';
  const isCompleted = session.processing_status === 'completed';
  const attendanceRate = session.total_students > 0
    ? ((session.present_count / session.total_students) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/attendance/history" className="btn btn-secondary">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.class_name}</h1>
            <p className="text-gray-600">
              {new Date(session.session_date).toLocaleDateString()} at{' '}
              {new Date(session.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {isCompleted && (
          <div className="flex space-x-3">
            <button onClick={() => loadSession()} className="btn btn-secondary">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleExport} className="btn btn-secondary">
              <Download size={18} className="mr-2" />
              Export CSV
            </button>
            <button onClick={handleSendNotifications} className="btn btn-primary">
              <Send size={18} className="mr-2" />
              Send Notifications
            </button>
          </div>
        )}
      </div>

      {/* Status Banner */}
      {isProcessing && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <div className="spinner w-5 h-5 mr-3"></div>
            <div>
              <p className="font-semibold text-yellow-800">Processing Video...</p>
              <p className="text-sm text-yellow-700">
                Face detection and recognition in progress. This page will auto-refresh.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {isCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-sm opacity-90 mb-1">Present</p>
            <p className="text-4xl font-bold">{session.present_count}</p>
          </div>
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-sm opacity-90 mb-1">Absent</p>
            <p className="text-4xl font-bold">{session.absent_count}</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-sm opacity-90 mb-1">Total Students</p>
            <p className="text-4xl font-bold">{session.total_students}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-sm opacity-90 mb-1">Attendance Rate</p>
            <p className="text-4xl font-bold">{attendanceRate}%</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {isCompleted && session.records && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Attendance Records
          </h2>
          <AttendanceTable
            records={session.records}
            onUpdate={handleUpdateRecord}
          />
        </div>
      )}
    </div>
  );
}