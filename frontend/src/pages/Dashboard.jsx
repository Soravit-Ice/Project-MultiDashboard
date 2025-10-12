import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      message.success({
        content: 'Logged out successfully. See you soon! 👋',
        duration: 3,
        style: {
          marginTop: '20vh',
        },
      });
      navigate('/login');
    } catch (error) {
      message.error('Logout failed. Please try again.');
    }
  };

  const stats = [
    { label: 'Total Configs', value: '12', icon: '🚀', color: 'from-blue-500 to-cyan-500' },
    { label: 'Active', value: '8', icon: '✅', color: 'from-green-500 to-emerald-500' },
    { label: 'Pending', value: '3', icon: '⏳', color: 'from-orange-500 to-yellow-500' },
    { label: 'Messages Sent', value: '1,234', icon: '📨', color: 'from-purple-500 to-pink-500' },
  ];

  const configs = [
    { id: 1, name: 'Discord Config #1', status: 'Active', webhook: 'https://discord.com/api/webhooks/...', color: 'from-blue-500 to-indigo-500' },
    { id: 2, name: 'Discord Config #2', status: 'Active', webhook: 'https://discord.com/api/webhooks/...', color: 'from-purple-500 to-pink-500' },
    { id: 3, name: 'Discord Config #3', status: 'Pending', webhook: 'https://discord.com/api/webhooks/...', color: 'from-indigo-500 to-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Multi Dashboard
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium">
              <span className="text-xl">📊</span>
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors">
              <span className="text-xl">⚙️</span>
              Discord Config
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors">
              <span className="text-xl">📈</span>
              Analytics
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors">
              <span className="text-xl">⚙️</span>
              Settings
            </a>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name || 'User'}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Discord Configs */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Discord Configurations</h2>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow">
                + New Config
              </button>
            </div>

            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                        🎯
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{config.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{config.webhook}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        config.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {config.status}
                      </span>
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">📨</div>
              <h3 className="text-xl font-bold mb-2">Send Test Message</h3>
              <p className="text-blue-100 mb-4">Test your Discord webhook</p>
              <button className="px-4 py-2 bg-white text-blue-600 rounded-xl font-medium hover:shadow-lg transition-shadow">
                Send Now
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold mb-2">Configure Webhook</h3>
              <p className="text-purple-100 mb-4">Setup new Discord webhook</p>
              <button className="px-4 py-2 bg-white text-purple-600 rounded-xl font-medium hover:shadow-lg transition-shadow">
                Configure
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2">View Analytics</h3>
              <p className="text-indigo-100 mb-4">Check your statistics</p>
              <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-medium hover:shadow-lg transition-shadow">
                View Stats
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
