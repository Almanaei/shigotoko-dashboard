import { ArrowUpRight, ArrowDownRight, Users, DollarSign, Percent, Clock } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: {
    value: string;
    positive: boolean;
  };
}

const StatCard = ({ title, value, icon, trend }: StatCardProps) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center mt-2">
          {trend.positive ? (
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        </div>
      </div>
      <div className="p-2 bg-gray-50 rounded-full">
        {icon}
      </div>
    </div>
  </div>
);

export default function HeaderStats() {
  const statCards = [
    {
      title: "Total Employee",
      value: "2,420",
      icon: <Users className="h-5 w-5 text-[#2D3E50]" />,
      trend: { value: "3.2% vs last month", positive: true }
    },
    {
      title: "Total Revenue",
      value: "$45,320",
      icon: <DollarSign className="h-5 w-5 text-[#2D3E50]" />,
      trend: { value: "2.5% vs last month", positive: true }
    },
    {
      title: "Turnover Rate",
      value: "12%",
      icon: <Percent className="h-5 w-5 text-[#2D3E50]" />,
      trend: { value: "1.8% vs last month", positive: false }
    },
    {
      title: "Attendance Rate",
      value: "95%",
      icon: <Clock className="h-5 w-5 text-[#2D3E50]" />,
      trend: { value: "0.5% vs last month", positive: true }
    },
  ];

  return (
    <div className="flex gap-4 mb-6">
      <div className="grid grid-cols-4 gap-4 flex-1">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
          />
        ))}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 w-64">
        <p className="text-sm text-gray-500">Average Team KPI</p>
        <p className="text-3xl font-bold text-[#1ABC9C] mt-2">82.10%</p>
        <div className="flex items-center mt-2">
          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-gray-600">
            1.0% vs last month 72%
          </span>
        </div>
      </div>
    </div>
  );
} 