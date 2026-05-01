import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Circle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.stats);
      setRecentTasks(response.data.recentTasks);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Tasks', value: stats?.total || 0, icon: <TrendingUp size={24} />, color: 'from-blue-500 to-cyan-500' },
    { title: 'Completed', value: stats?.completed || 0, icon: <CheckCircle size={24} />, color: 'from-green-500 to-emerald-500' },
    { title: 'Pending', value: stats?.pending || 0, icon: <Clock size={24} />, color: 'from-yellow-500 to-orange-500' },
    { title: 'Overdue', value: stats?.overdue || 0, icon: <AlertCircle size={24} />, color: 'from-red-500 to-pink-500' },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      TODO: 'bg-gray-500/20 text-gray-300',
      IN_PROGRESS: 'bg-blue-500/20 text-blue-300',
      COMPLETED: 'bg-green-500/20 text-green-300',
    };
    return badges[status] || badges.TODO;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-300">Here's what's happening with your tasks today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-20`}>
                {stat.icon}
              </div>
              <span className="text-3xl font-bold text-white">{stat.value}</span>
            </div>
            <h3 className="text-gray-300 font-medium">{stat.title}</h3>
          </div>
        ))}
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progress */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Task Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Todo</span>
                <span>{stats?.todo || 0} tasks</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${((stats?.todo || 0) / (stats?.total || 1)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-gray-300 mb-2">
                <span>In Progress</span>
                <span>{stats?.inProgress || 0} tasks</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((stats?.inProgress || 0) / (stats?.total || 1)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Completed</span>
                <span>{stats?.completed || 0} tasks</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((stats?.completed || 0) / (stats?.total || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex-1">
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-gray-400 text-sm">
                      {task.project?.name} • Due {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No date'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;