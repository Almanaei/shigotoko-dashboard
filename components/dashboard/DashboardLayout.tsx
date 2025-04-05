import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import HeaderStats from './HeaderStats';
import AttendanceTable from './AttendanceTable';
import TaskBoard from './TaskBoard';
import HelpButton from '../ui/HelpButton';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { DashboardProvider, useDashboard, initializeMockData } from '@/lib/DashboardProvider';
import { Menu, X } from 'lucide-react';

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { dispatch } = useDashboard();

  // Initialize mock data
  useEffect(() => {
    initializeMockData(dispatch);
  }, [dispatch]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background dark:bg-dark-background transition-colors duration-200">
      {/* Mobile sidebar toggle */}
      <div className="fixed z-20 lg:hidden top-4 left-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-white dark:bg-dark-card shadow-md text-gray-700 dark:text-dark-text"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-10 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-20
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition duration-200 ease-in-out
      `}>
        <Sidebar collapsed={!sidebarOpen && mounted} />
      </div>
      
      {/* Main content */}
      <main className={`
        flex-1 overflow-y-auto p-4 md:p-6 
        transition-all duration-200
        ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}
        mt-12 lg:mt-0
      `}>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <HeaderStats />
          <AttendanceTable />
          <TaskBoard />
          <HelpButton />
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </ThemeProvider>
  );
} 