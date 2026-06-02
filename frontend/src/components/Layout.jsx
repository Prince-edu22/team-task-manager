import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="flex h-screen">

        {/* Mobile Menu Button */}
       <button
  className="fixed top-1 left-2 z-[9999] p-1 bg-black/50 text-white rounded"
  onClick={() => setSidebarOpen(!sidebarOpen)}
>
  {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
</button>
        {/* Sidebar */}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: sidebarOpen ? "0px" : "-288px",
            width: "288px",
            height: "100vh",
            background: "rgba(0,0,0,0.9)",
            transition: "left 0.3s ease",
            zIndex: 40,
          }}
        >
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              TaskFlow
            </h1>
            <p className="text-gray-400 text-sm mt-1">Team Task Manager</p>
          </div>

          <nav className="mt-8 px-4 space-y-2">
            <NavLink
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/projects"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <FolderKanban size={20} />
              <span>Projects</span>
            </NavLink>

            <NavLink
              to="/tasks"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <CheckSquare size={20} />
              <span>Tasks</span>
            </NavLink>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              </div>

              <div className="flex-1">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all w-full"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 mt-12 md:mt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;