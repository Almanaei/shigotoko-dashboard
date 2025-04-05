"use client";

import { Users, ArrowUp, ArrowDown, Clock, BarChart3 } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardProvider';

export default function Stats() {
  const { state } = useDashboard();
  const { stats } = state;

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg p-4 shadow-sm dark:shadow-card-dark animate-slide-in">
      <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Total Employees</p>
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalEmployees}</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-800/40 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.totalRevenue}</h3>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-800/40 p-2 rounded-lg">
              <ArrowUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Turnover Rate</p>
              <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.turnoverRate}</h3>
            </div>
            <div className="bg-amber-100 dark:bg-amber-800/40 p-2 rounded-lg">
              <ArrowDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Attendance Rate</p>
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.attendanceRate}</h3>
            </div>
            <div className="bg-purple-100 dark:bg-purple-800/40 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Team KPI Achievement</p>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{stats.teamKPI}</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
            style={{ width: stats.teamKPI }}
          ></div>
        </div>
      </div>
    </div>
  );
} 