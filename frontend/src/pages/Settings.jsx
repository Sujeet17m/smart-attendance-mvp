import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input type="text" value={user?.name || ''} className="input" readOnly />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={user?.email || ''} className="input" readOnly />
          </div>
          <p className="text-sm text-gray-500">
            Profile editing feature coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}