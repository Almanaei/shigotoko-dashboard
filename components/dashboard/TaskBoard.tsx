import { Search, Filter } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority: 'Important' | 'Medium' | 'Low';
  type: 'Stagging' | 'Production';
}

interface TaskColumnProps {
  title: string;
  tasks: Task[];
}

const TaskColumn = ({ title, tasks }: TaskColumnProps) => (
  <div className="bg-gray-50 rounded-lg p-3 min-h-[300px]">
    <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
    <div className="space-y-2">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="bg-white p-3 rounded-md shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium">{task.title}</h4>
              <div className="flex mt-2 space-x-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  task.priority === 'Important' 
                    ? 'bg-red-100 text-red-800' 
                    : task.priority === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {task.priority}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                  {task.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function TaskBoard() {
  // Sample task data
  const todoTasks = [
    { id: '1', title: 'Review employee appraisals', priority: 'Important', type: 'Stagging' },
    { id: '2', title: 'Update payroll system', priority: 'Important', type: 'Stagging' }
  ] as Task[];
  
  const inProgressTasks = [
    { id: '3', title: 'Onboard new employees', priority: 'Medium', type: 'Production' },
    { id: '4', title: 'Plan team building event', priority: 'Medium', type: 'Production' }
  ] as Task[];
  
  const reviewTasks = [
    { id: '5', title: 'Approve leave requests', priority: 'Important', type: 'Stagging' },
    { id: '6', title: 'Review department budget', priority: 'Important', type: 'Stagging' }
  ] as Task[];
  
  const completeTasks = [
    { id: '7', title: 'Update job descriptions', priority: 'Important', type: 'Stagging' },
    { id: '8', title: 'Conduct training session', priority: 'Important', type: 'Stagging' }
  ] as Task[];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#2D3E50]">
          February | Today is Wednesday, Feb 26th, 2024
        </h2>
      </div>
      
      <div className="flex items-center space-x-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search task"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:border-[#1ABC9C]"
          />
        </div>
        <div className="relative">
          <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC9C]">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>
      
      <h3 className="text-md font-medium text-gray-700 mb-3">Daily Task Board</h3>
      
      <div className="grid grid-cols-4 gap-4">
        <TaskColumn title="To Do" tasks={todoTasks} />
        <TaskColumn title="In Progress" tasks={inProgressTasks} />
        <TaskColumn title="Review" tasks={reviewTasks} />
        <TaskColumn title="Complete" tasks={completeTasks} />
      </div>
    </div>
  );
} 