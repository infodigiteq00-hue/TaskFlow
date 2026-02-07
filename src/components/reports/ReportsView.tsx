import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TASK_CATEGORIES } from '@/types/task';
import type { Task, TeamMember, Company } from '@/types/task';

export interface ReportsViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  companies: Company[];
}

export function ReportsView({ tasks, teamMembers, companies }: ReportsViewProps) {
  // Task by category data
  const categoryData = TASK_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: tasks.filter((t) => t.category === cat.value).length,
    icon: cat.icon,
  })).filter((d) => d.value > 0);

  // Task by status data
  const statusData = [
    { name: 'Pending', value: tasks.filter((t) => t.status === 'pending').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length, color: 'hsl(199, 89%, 48%)' },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length, color: 'hsl(142, 71%, 45%)' },
    { name: 'Urgent', value: tasks.filter((t) => t.status === 'urgent').length, color: 'hsl(0, 84%, 60%)' },
  ];

  // Team performance data
  const teamData = teamMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignedTo.includes(member.id));
    return {
      name: member.name.split(' ')[0],
      completed: memberTasks.filter((t) => t.status === 'completed').length,
      active: memberTasks.filter((t) => t.status !== 'completed').length,
    };
  });

  // Weekly progress (mock data)
  const weeklyData = [
    { day: 'Mon', tasks: 3 },
    { day: 'Tue', tasks: 5 },
    { day: 'Wed', tasks: 4 },
    { day: 'Thu', tasks: 7 },
    { day: 'Fri', tasks: 6 },
    { day: 'Sat', tasks: 2 },
    { day: 'Sun', tasks: 1 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in w-full overflow-x-hidden">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Performance Reports</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">Analytics and insights for your team</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Tasks</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{tasks.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-success">
            {tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0}%
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Active Companies</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{companies.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Team Members</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{teamMembers.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Task Status Distribution</h3>
          <div className="h-48 sm:h-64 min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
            {statusData.map((status) => (
              <div key={status.name} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">{status.name}: {status.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Tasks by Category</h3>
          <div className="h-48 sm:h-64 min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(174, 72%, 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Team Performance</h3>
          <div className="h-48 sm:h-64 min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" fill="hsl(199, 89%, 48%)" name="Active" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Weekly Task Completion</h3>
          <div className="h-48 sm:h-64 min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="hsl(174, 72%, 40%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(174, 72%, 40%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
