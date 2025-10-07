import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Download } from 'lucide-react';
import attendanceService from '../services/attendance.service';
import toast from 'react-hot-toast';

export default function AttendanceHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    class_id: ''
  });

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getHistory(filters);
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-600 mt-1">View all past attendance sessions</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ start_date: '', end_date: '', class_id: '' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>No attendance sessions found</p>
            <Link to="/attendance" className="btn btn-primary mt-4">
              Take Attendance
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{session.class_name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(session.session_date).toLocaleDateString()} at{' '}
                    {new Date(session.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {session.present_count || 0} Present
                    </p>
                    <p className="text-xs text-gray-500">
                      of {session.total_students || 0} students
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.processing_status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : session.processing_status === 'processing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {session.processing_status}
                  </span>

                  {/* Actions */}
                  <Link
                    to={`/attendance/session/${session.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={16} className="mr-2" />
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}