'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardDepartmentsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main departments page
    router.push('/departments');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you to the departments page.</p>
      </div>
    </div>
  );
} 