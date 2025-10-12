import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-900"></div>
          <p className="mt-4 text-gray-700 text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
