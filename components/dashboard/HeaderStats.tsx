import { ArrowDown, ArrowUp, Users, DollarSign, Percent, Clock, MoreVertical, CalendarIcon } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardProvider';
import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: {
    value: string;
    percentage: string;
    positive: boolean;
  };
  iconBg?: string;
}

// Chart component for KPI visualization
const KPIChart = () => (
  <div className="relative h-24 w-full mt-2">
    <svg width="100%" height="100%" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Path for the chart line */}
      <path 
        d="M0,80 C20,78 40,70 60,65 C80,60 100,65 120,60 C140,55 160,45 180,55 C200,65 220,85 240,80 C260,75 280,30 300,25" 
        stroke="currentColor" 
        strokeWidth="2" 
        className="stroke-blue-100 dark:stroke-blue-900/20"
        fill="none" 
      />
      {/* Highlight point */}
      <circle cx="240" cy="80" r="6" className="fill-blue-600 dark:fill-blue-500" />
      {/* Label for the highlight point */}
      <g transform="translate(240, 60)">
        <rect x="-15" y="-20" width="30" height="20" rx="4" className="fill-blue-600 dark:fill-blue-500" />
        <text x="0" y="-7" textAnchor="middle" fill="white" fontFamily="sans-serif" fontSize="10">85%</text>
      </g>
      {/* X-axis labels */}
      <text x="0" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">Jan</text>
      <text x="50" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">Feb</text>
      <text x="100" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">Mar</text>
      <text x="150" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">Apr</text>
      <text x="200" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">May</text>
      <text x="250" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">Jun</text>
      <text x="295" y="100" className="fill-gray-400 dark:fill-gray-500" fontFamily="sans-serif" fontSize="8">Jul</text>
    </svg>
  </div>
);

const StatCard = ({ title, value, icon, trend, iconBg = "bg-blue-600" }: StatCardProps) => (
  <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm dark:shadow-card-dark">
    <div className="flex justify-between items-start">
      <div className="flex items-center">
        <div className={`${iconBg} p-2 rounded mr-3 text-white`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
    
    <div className="mt-4">
      <p className="text-3xl font-bold dark:text-white">{value}</p>
      <div className="flex items-center mt-1 text-xs">
        {trend.positive ? (
          <ArrowUp className="h-3 w-3 text-green-500 dark:text-green-400 mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 text-red-500 dark:text-red-400 mr-1" />
        )}
        <span className={trend.positive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
          {trend.percentage}
        </span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">
          vs last month {trend.value}
        </span>
      </div>
    </div>
  </div>
);

const KPICard = ({ kpi }: { kpi: string }) => (
  <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm dark:shadow-card-dark">
    <div className="flex justify-between items-start">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Team KPI</h3>
      <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
    
    <div className="mt-3">
      <p className="text-4xl font-bold text-gray-900 dark:text-white">{kpi}</p>
      <div className="flex items-center mt-1 text-xs">
        <ArrowUp className="h-3 w-3 text-green-500 dark:text-green-400 mr-1" />
        <span className="text-green-500 dark:text-green-400">10%</span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">
          vs last month 72%
        </span>
      </div>
    </div>
    
    <KPIChart />
  </div>
);

export default function HeaderStats() {
  const { state } = useDashboard();
  const { stats } = state;
  const [month, setMonth] = useState('January');

  return (
    <div className="mb-6 animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Explore your needs here</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5">
            <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-sm font-medium dark:text-white">{month}</span>
            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400 ml-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12L4 8H12L8 12Z" fill="currentColor"/>
            </svg>
          </div>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors dark:bg-blue-700 dark:hover:bg-blue-800">
            Export
          </button>
        </div>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-1">
          <StatCard
            title="Total Employee"
            value={stats.totalEmployees.toString()}
            icon={<Users className="h-5 w-5" />}
            trend={{ 
              percentage: "10%", 
              value: "313", 
              positive: true 
            }}
          />
        </div>
        
        <div className="col-span-1">
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ 
              percentage: "5%", 
              value: "$7,992.11", 
              positive: true 
            }}
            iconBg="bg-green-600"
          />
        </div>
        
        <div className="col-span-1">
          <StatCard
            title="Turnover Rate"
            value={stats.turnoverRate}
            icon={<Percent className="h-5 w-5" />}
            trend={{ 
              percentage: "1%", 
              value: "9%", 
              positive: false 
            }}
            iconBg="bg-red-600"
          />
        </div>
        
        <div className="col-span-1">
          <StatCard
            title="Attendance Rate"
            value={stats.attendanceRate}
            icon={<Clock className="h-5 w-5" />}
            trend={{ 
              percentage: "5%", 
              value: "99%", 
              positive: false 
            }}
            iconBg="bg-purple-600"
          />
        </div>
        
        <div className="col-span-1">
          <KPICard kpi={stats.teamKPI} />
        </div>
      </div>
    </div>
  );
} 