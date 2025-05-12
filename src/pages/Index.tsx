import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();
  
  useEffect(() => {
    if (isLoading) return; // Wait until auth state is loaded
    
    if (isAuthenticated) {
      // Redirect to dashboard if authenticated
      navigate('/app');
    } else {
      // Redirect to login if not authenticated
      navigate('/auth/login');
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-coach-primary mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
