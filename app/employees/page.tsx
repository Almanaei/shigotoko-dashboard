import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employees - Shigotoko',
  description: 'Manage your organization employees',
};

export default function EmployeesPage() {
  // Redirect to the dashboard employees page
  redirect('/dashboard/employees');
}
