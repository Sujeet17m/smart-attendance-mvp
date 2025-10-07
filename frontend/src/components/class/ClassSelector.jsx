import { BookOpen, Users } from 'lucide-react';

export default function ClassSelector({ classes, selectedClass, onSelect }) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
        <p>No classes found. Please create a class first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.map((cls) => (
        <button
          key={cls.id}
          onClick={() => onSelect(cls)}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            selectedClass?.id === cls.id
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
          }`}
        >
          <h3 className="font-semibold text-gray-900 mb-1">{cls.name}</h3>
          <p className="text-sm text-gray-500 mb-3">{cls.code}</p>
          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-2" />
            {cls.student_count || 0} Students
          </div>
        </button>
      ))}
    </div>
  );
}