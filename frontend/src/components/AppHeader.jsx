import { useState } from 'react';
import { Button, Space, Typography, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const BRAND_NAME = 'MultiDashboard';

export default function AppHeader({ pageTitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const onLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      message.error('ไม่สามารถออกจากระบบได้');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSwitchView = () => {
    if (!isAdmin) {
      return;
    }
    const target = location.pathname.startsWith('/admin') ? '/dashboard' : '/admin';
    navigate(target);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Typography.Title level={4} style={{ margin: 0, color: '#4f46e5' }}>
            {BRAND_NAME}
          </Typography.Title>
          {pageTitle ? (
            <Typography.Text className="hidden sm:inline-block" type="secondary">
              {pageTitle}
            </Typography.Text>
          ) : null}
        </div>

        <Space align="center" size="middle">
          {isAdmin ? (
            <Button onClick={handleSwitchView}>
              {location.pathname.startsWith('/admin') ? 'ไปหน้าใช้งาน' : 'ไปหน้าแอดมิน'}
            </Button>
          ) : null}
          <Typography.Text type="secondary">
            {user?.name || user?.username || user?.email || 'ผู้ใช้งาน'}
          </Typography.Text>
          <Button type="primary" danger loading={isLoggingOut} onClick={onLogout}>
            ออกจากระบบ
          </Button>
        </Space>
      </div>
    </header>
  );
}
