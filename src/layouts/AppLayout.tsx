import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';

// This component ensures that only authenticated users can access protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-coach-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Fixed Header */}
        <AppHeader onMenuToggle={toggleSidebar} />
        
        {/* Content area with sidebar */}
        <div className="flex pt-16"> {/* Add padding top to account for header height */}
          <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
          
          {/* Main content area with appropriate margin to account for sidebar width */}
          <div className={`flex-1 p-4 md:p-6 transition-all ${
            isSidebarOpen ? 'ml-16 lg:ml-64' : 'ml-16'
          }`}>
            <Outlet />
          </div>
        </div>
        
        <Toaster position="top-right" />
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
