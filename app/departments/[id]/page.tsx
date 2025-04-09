"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building, Users, User } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  description: string | null;
  employeeCount: number;
  color: string | null;
  employees?: Employee[];
}

interface Employee {
  id: string;
  name: string;
  position: string;
  avatar: string | null;
}

export default function DepartmentDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/departments/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Department not found');
          } else {
            setError('Failed to fetch department details');
          }
          return;
        }
        
        const data = await response.json();
        setDepartment(data);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error fetching department:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [params.id]);

  const goBack = () => {
    router.back();
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
            <Building className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-medium text-red-800 mb-2">{error}</h2>
          <p className="text-red-600 mb-4">
            We couldn't find the department you're looking for.
          </p>
          <Link href="/departments" className="text-blue-600 hover:text-blue-800 font-medium">
            View all departments
          </Link>
        </div>
      </div>
    );
  }

  if (!department) {
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
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 flex flex-col md:flex-row items-center justify-between border-b border-purple-100 dark:border-purple-900/30">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="mr-5 w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{department.name}</h1>
              {department.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-1">{department.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-300 font-medium">
                {department.employeeCount} {department.employeeCount === 1 ? 'Employee' : 'Employees'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Employees</h2>
          
          {department.employees && department.employees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {department.employees.map(employee => (
                <Link 
                  key={employee.id}
                  href={`/employees/${employee.id}`}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                    {employee.avatar ? (
                      <img 
                        src={employee.avatar} 
                        alt={employee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{employee.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-medium">No employees found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">This department doesn't have any employees yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 