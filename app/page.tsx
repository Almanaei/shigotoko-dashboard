import Layout from '@/components/dashboard/Layout';
import Stats from '@/components/dashboard/Stats';
import TaskBoard from '@/components/dashboard/TaskBoard';
import Chat from '@/components/dashboard/Chat';

export default function Home() {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Stats />
            <TaskBoard />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <Chat />
          </div>
        </div>
      </div>
    </Layout>
  );
}
