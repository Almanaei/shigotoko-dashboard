import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Clock, ChevronDown, MoreVertical, Filter } from 'lucide-react';
import { useDashboard, Employee } from '@/lib/DashboardProvider';
import { useState } from 'react';

type ViewMode = 'day' | 'week' | 'month';

// Extended employee interface with attendance data
interface AttendanceEmployee extends Employee {
  role?: string;
  checkIn?: string;
  checkOut?: string;
  scheduleIn?: string;
  scheduleOut?: string;
}

export default function AttendanceTable() {
  const { state } = useDashboard();
  const employees = state.employees as AttendanceEmployee[];
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedRows.length === employees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(employees.map(emp => emp.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark mb-6 animate-slide-in">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Attendance</h2>
          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-l-md transition-colors ${
                viewMode === 'day' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button 
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-r-md transition-colors ${
                viewMode === 'month' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    checked={selectedRows.length === employees.length && employees.length > 0}
                    onChange={toggleSelectAll}
                  />
                  <span>Name</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <div className="flex items-center">
                  <span>Status</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <div className="flex items-center">
                  <span>Check In</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <div className="flex items-center">
                  <span>Check Out</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <div className="flex items-center">
                  <span>Schedule In</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                <div className="flex items-center">
                  <span>Schedule Out</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr 
                key={employee.id} 
                className={`border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                  selectedRows.includes(employee.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      checked={selectedRows.includes(employee.id)}
                      onChange={() => toggleSelectRow(employee.id)}
                    />
                    <div className="flex items-center">
                      <Avatar 
                        src={employee.avatar} 
                        alt={employee.name} 
                        size={32} 
                        className="mr-3 flex-shrink-0" 
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{employee.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{employee.role || employee.position}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <Badge 
                    variant={employee.status === "active" ? "blue" : "gray"}
                  >
                    {employee.status}
                  </Badge>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1.5" />
                    {employee.checkIn || '9:00 AM'}
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1.5" />
                    {employee.checkOut || '5:00 PM'}
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1.5" />
                    {employee.scheduleIn || '8:30 AM'}
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1.5" />
                    {employee.scheduleOut || '5:30 PM'}
                  </div>
                </td>
              </tr>
            ))}

            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 