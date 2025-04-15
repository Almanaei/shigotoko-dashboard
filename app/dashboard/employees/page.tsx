'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users,
  Search, 
  Plus,
  Filter,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';

// Employee type definition
interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  status: 'active' | 'on-leave' | 'terminated';
  avatar?: string;
}

// Sample employees for demo
const sampleEmployees: Employee[] = [
  {
    id: '1',
    name: 'Akira Tanaka',
    position: 'Senior Developer',
    department: 'Development',
    email: 'akira@shigotoko.com',
    phone: '+1 (555) 123-4567',
    location: 'Tokyo, Japan',
    joinDate: '2022-05-12',
    status: 'active'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    position: 'Project Manager',
    department: 'Management',
    email: 'maria@shigotoko.com',
    phone: '+1 (555) 234-5678',
    location: 'Madrid, Spain',
    joinDate: '2021-11-03',
    status: 'active'
  },
  {
    id: '3',
    name: 'David Chen',
    position: 'UI/UX Designer',
    department: 'Design',
    email: 'david@shigotoko.com',
    phone: '+1 (555) 345-6789',
    location: 'Toronto, Canada',
    joinDate: '2023-01-15',
    status: 'active'
  },
  {
    id: '4',
    name: 'Sarah Kim',
    position: 'Marketing Specialist',
    department: 'Marketing',
    email: 'sarah@shigotoko.com',
    phone: '+1 (555) 456-7890',
    location: 'Seoul, South Korea',
    joinDate: '2022-08-22',
    status: 'on-leave'
  },
  {
    id: '5',
    name: 'James Peterson',
    position: 'HR Manager',
    department: 'Human Resources',
    email: 'james@shigotoko.com',
    phone: '+1 (555) 567-8901',
    location: 'New York, USA',
    joinDate: '2021-06-01',
    status: 'active'
  },
  {
    id: '6',
    name: 'Olivia Johnson',
    position: 'Financial Analyst',
    department: 'Finance',
    email: 'olivia@shigotoko.com',
    phone: '+1 (555) 678-9012',
    location: 'London, UK',
    joinDate: '2022-03-14',
    status: 'active'
  },
  {
    id: '7',
    name: 'Ravi Patel',
    position: 'DevOps Engineer',
    department: 'Development',
    email: 'ravi@shigotoko.com',
    phone: '+1 (555) 789-0123',
    location: 'Mumbai, India',
    joinDate: '2022-11-01',
    status: 'terminated'
  }
];

// Helper function to get the status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800">
          Active
        </Badge>
      );
    case 'on-leave':
      return (
        <Badge className="bg-amber-100 text-amber-800">
          On Leave
        </Badge>
      );
    case 'terminated':
      return (
        <Badge className="bg-red-100 text-red-800">
          Terminated
        </Badge>
      );
    default:
      return (
        <Badge>
          {status}
        </Badge>
      );
  }
};

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    // In a real app, we would fetch employees from an API
    // For now, we'll use the sample data
    setEmployees(sampleEmployees);
  }, []);
  
  // Get unique departments for filtering
  const departments = ['all', ...new Set(employees.map(emp => emp.department))];
  
  // Filter employees based on search term and department filter
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employees</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Employee
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search employees..."
            className="pl-10 w-full h-10 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <select
            className="h-10 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Link key={employee.id} href={`/dashboard/employees/${employee.id}`}>
              <Card className="h-full p-5 hover:shadow-md transition-shadow cursor-pointer border">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex space-x-3">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-medium">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Award className="h-4 w-4 mr-2" />
                      {employee.department}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {employee.email}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {employee.phone}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {employee.location}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 flex justify-between items-center text-sm">
                    <div>
                      <span className="text-muted-foreground">Joined: </span>
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No employees found</h3>
          <p className="text-muted-foreground">
            {searchTerm || departmentFilter !== 'all' ? "Try adjusting your search criteria" : "Add employees to your organization"}
          </p>
        </div>
      )}
    </div>
  );
} 