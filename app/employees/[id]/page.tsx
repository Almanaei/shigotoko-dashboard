"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, Building, Activity } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import MemoizedAvatar from '@/components/dashboard/MemoizedAvatar';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: string;
  joinDate: string;
  performance: number;
  department: string | null;
  departmentId: string | null;
}

export default function EmployeeDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/employees/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Employee not found');
          } else {
            setError('Failed to fetch employee details');
          }
          return;
        }
        
        const data = await response.json();
        setEmployee(data);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [params.id]);

  const goBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={goBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-medium text-red-800 mb-2">{error}</h2>
          <p className="text-red-600 mb-4">
            We couldn't find the employee you're looking for.
          </p>
          <Link href="/employees" className="text-blue-600 hover:text-blue-800 font-medium">
            View all employees
          </Link>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={goBack}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </button>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 flex flex-col md:flex-row items-center justify-between border-b border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="mr-5">
              <MemoizedAvatar user={{ name: employee.name, avatar: employee.avatar }} size="lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.name}</h1>
              <p className="text-blue-600 dark:text-blue-400 font-medium">{employee.position}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              employee.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {employee.status === 'active' ? 'Active' : 'Inactive'}
            </span>
            
            {employee.department && employee.departmentId && (
              <Link 
                href={`/departments/${employee.departmentId as string}`}
                className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
              >
                {employee.department}
              </Link>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{employee.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{employee.phone || 'Not available'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Building className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                    <p className="text-gray-900 dark:text-white">{employee.department || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Employment Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Join Date</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(employee.joinDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${employee.performance}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{employee.performance}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 