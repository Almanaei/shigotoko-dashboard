import Link from 'next/link';
import { 
  LayoutDashboard, 
  Mail, 
  Calendar, 
  Users, 
  Clock, 
  CreditCard, 
  BarChart2, 
  Menu, 
  Settings, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';

const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Task', href: '/task' },
  { icon: <Mail className="h-5 w-5" />, label: 'Inbox', href: '/inbox' },
  { icon: <Calendar className="h-5 w-5" />, label: 'Calendar', href: '/calendar' },
  { icon: <Users className="h-5 w-5" />, label: 'Management', href: '/management' },
  { icon: <Users className="h-5 w-5" />, label: 'Users', href: '/users' },
  { icon: <Clock className="h-5 w-5" />, label: 'Attendance', href: '/attendance' },
  { icon: <CreditCard className="h-5 w-5" />, label: 'Payroll', href: '/payroll' },
  { icon: <BarChart2 className="h-5 w-5" />, label: 'Report', href: '/report' },
  { icon: <Menu className="h-5 w-5" />, label: 'Other Menu', href: '/other-menu' },
  { icon: <Settings className="h-5 w-5" />, label: 'Setting', href: '/setting' },
  { icon: <HelpCircle className="h-5 w-5" />, label: 'Help and Support', href: '/help' },
  { icon: <LogOut className="h-5 w-5" />, label: 'Log Out', href: '/logout', highlight: true },
];

export default function Sidebar() {
  return (
    <aside className="w-1/4 bg-white border-r border-gray-200 h-screen p-4">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2D3E50]">Shigotoko</h1>
          <p className="text-sm text-gray-500">Dashboard | Explore your needs here</p>
        </div>
        
        <nav className="space-y-1">
          <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Data Board Menu
          </h2>
          <div className="space-y-1 mt-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${item.highlight 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-700 hover:text-[#1ABC9C] hover:bg-gray-100'}
                  transition-colors
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
} 