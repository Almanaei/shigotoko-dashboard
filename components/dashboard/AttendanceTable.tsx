import { Badge } from "../ui/Badge";

interface EmployeeAttendance {
  id: number;
  name: string;
  status: "Full-time" | "Part-time";
  checkIn: string;
  checkOut: string;
  scheduleIn: string;
  scheduleOut: string;
}

const employees: EmployeeAttendance[] = [
  {
    id: 1,
    name: "Ann Bergson",
    status: "Full-time",
    checkIn: "08:05 AM",
    checkOut: "05:12 PM",
    scheduleIn: "08:00 AM",
    scheduleOut: "05:00 PM"
  },
  {
    id: 2,
    name: "Kimra Rosser",
    status: "Part-time",
    checkIn: "09:30 AM",
    checkOut: "02:15 PM",
    scheduleIn: "09:30 AM",
    scheduleOut: "02:00 PM"
  },
  {
    id: 3,
    name: "Terry Philips",
    status: "Part-time",
    checkIn: "01:05 PM",
    checkOut: "06:00 PM",
    scheduleIn: "01:00 PM",
    scheduleOut: "06:00 PM"
  },
  {
    id: 4,
    name: "Michael Chen",
    status: "Full-time",
    checkIn: "07:58 AM",
    checkOut: "04:55 PM",
    scheduleIn: "08:00 AM",
    scheduleOut: "05:00 PM"
  },
  {
    id: 5,
    name: "Sophia Rodriguez",
    status: "Full-time",
    checkIn: "08:10 AM",
    checkOut: "05:30 PM",
    scheduleIn: "08:00 AM",
    scheduleOut: "05:00 PM"
  }
];

export default function AttendanceTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#2D3E50]">Attendance</h2>
        <button className="text-sm text-[#1ABC9C] hover:underline">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check In
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check Out
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule In
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule Out
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee, index) => (
              <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge 
                    variant={employee.status === "Full-time" ? "blue" : "gray"}
                  >
                    {employee.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {employee.checkIn}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {employee.checkOut}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {employee.scheduleIn}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {employee.scheduleOut}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 