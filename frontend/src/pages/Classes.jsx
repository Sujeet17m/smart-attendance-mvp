import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import classService from '../services/class.service';
import toast from 'react-hot-toast';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classService.getClasses({ limit: 100 });
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      await classService.deleteClass(classId);
      toast.success('Class deleted');
      loadClasses();
    } catch (error) {
      toast.error('Failed to delete class');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage your classes</p>
        </div>
        <button
          onClick={() => {
            setEditingClass(null);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Create Class
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No classes found. Create your first class!</p>
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.code}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingClass(cls);
                      setShowModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {cls.description && (
                <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-gray-600">
                  <Users size={18} className="mr-2" />
                  <span className="text-sm">{cls.student_count || 0} Students</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {cls.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Class Modal */}
      {showModal && (
        <ClassModal
          classData={editingClass}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadClasses();
          }}
        />
      )}
    </div>
  );
}

function ClassModal({ classData, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    code: classData?.code || '',
    description: classData?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (classData) {
        await classService.updateClass(classData.id, formData);
        toast.success('Class updated');
      } else {
        await classService.createClass(formData);
        toast.success('Class created');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {classData ? 'Edit Class' : 'Create New Class'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Class Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Computer Science 101"
              required
            />
          </div>

          <div>
            <label className="label">Class Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input"
              placeholder="e.g., CS-101-A"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Optional class description"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : classData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}