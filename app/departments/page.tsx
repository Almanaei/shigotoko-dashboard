"use client";

import React, { useState } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard } from '@/lib/DashboardProvider';
import { ACTIONS, Department } from '@/lib/DashboardProvider';
import { Search, PlusCircle, Building2, Edit2, Trash2, X, Check, Users } from 'lucide-react';

export default function DepartmentsPage() {
  const { state, dispatch } = useDashboard();
  const { departments, employees } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  // Filter departments based on search term
  const filteredDepartments = searchTerm
    ? departments.filter(department => 
        department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : departments;

  // Calculate employee counts for each department
  const departmentEmployeeCounts = departments.map(department => {
    const count = employees.filter(employee => 
      employee.department.toLowerCase() === department.name.toLowerCase()
    ).length;
    return { ...department, employeeCount: count };
  });

  // Handle add department
  const handleAddDepartment = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      employeeCount: 0
    });
    setShowAddModal(true);
  };

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({ ...department });
    setShowEditModal(true);
  };

  // Handle delete department
  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit for adding department
  const handleSubmitAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      employeeCount: 0,
      ...formData as Omit<Department, 'id' | 'employeeCount'>
    };
    dispatch({ type: ACTIONS.ADD_DEPARTMENT, payload: newDepartment });
    setShowAddModal(false);
  };

  // Handle form submit for editing department
  const handleSubmitEditDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepartment && formData.id) {
      dispatch({
        type: ACTIONS.UPDATE_DEPARTMENT,
        payload: {
          id: formData.id,
          department: formData
        }
      });
    }
    setShowEditModal(false);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedDepartment) {
      dispatch({
        type: ACTIONS.DELETE_DEPARTMENT,
        payload: selectedDepartment.id
      });
      setShowDeleteModal(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            onClick={handleAddDepartment}
          >
            <PlusCircle className="h-4 w-4" />
            Add Department
          </button>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark overflow-hidden mb-6 animate-slide-in">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search departments..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredDepartments.map((department) => {
              const count = employees.filter(e => e.department.toLowerCase() === department.name.toLowerCase()).length;
              return (
                <div 
                  key={department.id} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center mr-3" style={{ backgroundColor: department.color }}>
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{department.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {count} {count === 1 ? 'employee' : 'employees'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleEditDepartment(department)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleDeleteDepartment(department)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {department.description}
                  </p>
                  <div className="mt-auto">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (count / 10) * 100)}%`,
                          backgroundColor: department.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredDepartments.length === 0 && (
              <div className="col-span-full py-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Building2 className="h-12 w-12 mb-3 opacity-20" />
                <p>No departments found</p>
                <button 
                  className="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  onClick={handleAddDepartment}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add a department
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Department Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full animate-scale-in">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Department</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitAddDepartment}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-10 h-10 border-0 p-0 rounded-md mr-3"
                      />
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-dark-border gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Add Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full animate-scale-in">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Department</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitEditDepartment}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-10 h-10 border-0 p-0 rounded-md mr-3"
                      />
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-dark-border gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full animate-scale-in p-6">
              <div className="flex items-start mb-4">
                <div className="mr-3 bg-red-100 dark:bg-red-900/20 p-2 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Delete Department</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete <span className="font-medium">{selectedDepartment.name}</span>? This action cannot be undone.
                  </p>
                  {employees.some(e => e.department.toLowerCase() === selectedDepartment.name.toLowerCase()) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-400 text-sm">
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">⚠️</div>
                        <p>
                          This department has employees assigned to it. Deleting it may affect employee records.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  onClick={handleConfirmDelete}
                >
                  Delete Department
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 