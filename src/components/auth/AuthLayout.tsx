
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="absolute top-8 left-8">
        <h1 className="text-2xl font-bold text-coach-primary">CoachShare</h1>
      </div>
      <main className="flex items-center justify-center min-h-screen p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
