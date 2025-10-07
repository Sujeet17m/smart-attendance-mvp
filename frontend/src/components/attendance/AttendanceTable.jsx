import { CheckCircle, XCircle, Edit2 } from 'lucide-react';

export default function AttendanceTable({ records, onUpdate }) {
  const toggleAttendance = (record) => {
    const newStatus = record.status === 'present' ? 'absent' : 'present';
    onUpdate(record.id, newStatus);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Roll No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Student Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {record.roll_no}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {record.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {record.confidence_score ? (
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          record.confidence_score >= 0.9
                            ? 'bg-green-500'
                            : record.confidence_score >= 0.75
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${record.confidence_score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12">
                      {(record.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {record.status === 'present' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle size={16} className="mr-1" />
                    Present
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle size={16} className="mr-1" />
                    Absent
                  </span>
                )}
                {record.is_manual_override && (
                  <span className="ml-2 text-xs text-gray-500">(Manual)</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => toggleAttendance(record)}
                  className="text-primary-600 hover:text-primary-900 font-medium flex items-center"
                >
                  <Edit2 size={14} className="mr-1" />
                  Toggle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}