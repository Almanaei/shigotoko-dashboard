import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents - Shigotoko',
  description: 'Manage your organization documents and files',
};

export default function DocumentsPage() {
  // Redirect to the dashboard documents page
  redirect('/dashboard/documents');
}
