import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Camera, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import classService from '../services/class.service';
import attendanceService from '../services/attendance.service';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [classesRes, historyRes] = await Promise.all([
        classService.getClasses({ limit: 5 }),
        attendanceService.getHistory({ limit: 5 })
      ]);

      setClasses(classesRes);
      setRecentSessions(historyRes.sessions || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Classes"
          value={classes.length}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Students"
          value={classes.reduce((sum, c) => sum + parseInt(c.student_count || 0), 0)}
          icon={Users}
          color="bg-green-500"
        />
        <StatCard
          title="Sessions Today"
          value={recentSessions.filter(s => 
            new Date(s.session_date).toDateString() === new Date().toDateString()
          ).length}
          icon={Camera}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg Attendance"
          value="92%"
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/attendance"
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <Camera size={32} className="text-gray-400 group-hover:text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Take Attendance</h3>
            <p className="text-sm text-gray-600">Record attendance with video</p>
          </Link>

          <Link
            to="/students"
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <Users size={32} className="text-gray-400 group-hover:text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Students</h3>
            <p className="text-sm text-gray-600">Add or edit student details</p>
          </Link>

          <Link
            to="/reports"
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <Calendar size={32} className="text-gray-400 group-hover:text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">View Reports</h3>
            <p className="text-sm text-gray-600">Generate attendance reports</p>
          </Link>
        </div>
      </div>

      {/* Recent Classes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Classes</h2>
          <Link to="/classes" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No classes found. Create your first class to get started!</p>
            <Link to="/classes" className="btn btn-primary mt-4">
              Create Class
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-1">{cls.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{cls.code}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2" />
                  {cls.student_count || 0} Students
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
          <Link to="/attendance/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No attendance sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{session.class_name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(session.session_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {session.present_count || 0} Present
                    </p>
                    <p className="text-sm text-gray-500">
                      of {session.total_students || 0}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.processing_status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : session.processing_status === 'processing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {session.processing_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}