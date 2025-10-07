import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  History, 
  Users, 
  BookOpen, 
  FileText,
  Settings 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Take Attendance', to: '/attendance', icon: Camera },
  { name: 'History', to: '/attendance/history', icon: History },
  { name: 'Students', to: '/students', icon: Users },
  { name: 'Classes', to: '/classes', icon: BookOpen },
  { name: 'Reports', to: '/reports', icon: FileText },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto hidden lg:block">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon size={20} className="mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}