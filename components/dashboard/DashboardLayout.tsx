import Sidebar from './Sidebar';
import HeaderStats from './HeaderStats';
import AttendanceTable from './AttendanceTable';
import TaskBoard from './TaskBoard';
import HelpButton from '../ui/HelpButton';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#F5F6FA]">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-6">
        <HeaderStats />
        <AttendanceTable />
        <TaskBoard />
        <HelpButton />
      </main>
    </div>
  );
} 