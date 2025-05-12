import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./components/auth/AuthLayout";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MessagesProvider } from "./contexts/MessagesContext";
import { RegimenType } from "@/types/regimen";

// Lazy load components for better initial loading performance
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const EmailVerification = lazy(() => import("./pages/auth/EmailVerification"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const AthleteHome = lazy(() => import("./components/athlete/AthleteHome"));
const AthleteActivity = lazy(() => import("./components/athlete/AthleteActivity"));
const AthleteProgress = lazy(() => import("./components/athlete/AthleteProgress"));
const RegimenList = lazy(() => import("./components/RegimenList"));
const RegimenCreator = lazy(() => import("./components/RegimenCreator"));
const Athletes = lazy(() => import("./pages/Athletes"));
const Schedule = lazy(() => import("./pages/Schedule"));
const AthleteRegimens = lazy(() => import("./pages/athlete/AthleteRegimens"));
const AthleteWorkoutLogs = lazy(() => import("./pages/coach/AthleteWorkoutLogs"));
const Settings = lazy(() => import("./components/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const CoachProfile = lazy(() => import("@/pages/coach/CoachProfile"));
const RegimenDetail = lazy(() => import('@/pages/athlete/AthleteRegimens'));
const MyCoaches = lazy(() => import('@/pages/athlete/MyCoaches'));
const Messages = lazy(() => import('@/pages/Messages'));
const CoachSharedLogsViewer = lazy(() => import("@/pages/coach/CoachSharedLogsViewer"));

// Create and memoize the QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour - changed from cacheTime which is deprecated
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-white">
    <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-coach-primary"></div>
  </div>
);

// Component to select the appropriate dashboard based on user role
const DashboardSelector = () => {
  const { user } = useAuth();
  
  if (user?.role === 'athlete') {
    return <AthleteHome />;
  }
  
  return <Dashboard />;
};

// Wrapper component to pass user prop to CoachProfile
const CoachProfileWrapper = () => {
  const { user } = useAuth();
  // Add a check for user existence if CoachProfile requires it non-null
  if (!user) return <PageLoader />; // Or a different loading/error state
  return <CoachProfile user={user} />;
};

const App = () => {
  const navigate = useNavigate();

  // Handler for successful regimen save
  const handleRegimenSaveSuccess = (savedRegimen: RegimenType) => {
    // You might want to navigate to the specific regimen's page if an ID is available
    // e.g., navigate(`/app/regimens/${savedRegimen.id}`);
    navigate('/app/regimens');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MessagesProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Index route that redirects to the dashboard or login */}
                  <Route path="/" element={<Index />} />
                  
                  {/* Auth Routes */}
                  <Route path="/auth" element={<AuthLayout />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="verify-email" element={<VerifyEmail />} />
                    <Route path="verify/:token" element={<EmailVerification />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                  </Route>
                  
                  {/* Direct Auth Routes (for migration) */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/verify/:token" element={<EmailVerification />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  {/* App Routes - Wrapped in Layout */}
                  <Route path="/app" element={<AppLayout />}>
                    <Route index element={<DashboardSelector />} />
                    <Route path="regimens" element={<RegimenList />} />
                    <Route path="regimens/create" element={<RegimenCreator onSaveSuccess={handleRegimenSaveSuccess} />} />
                    <Route path="athletes" element={<Athletes />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="analytics" element={<CoachSharedLogsViewer />} />
                    <Route path="settings" element={<Settings />} />
                    
                    {/* Coach Routes */}
                    <Route path="coach/profile" element={<CoachProfileWrapper />} />
                    <Route path="coach/workout-logs" element={<AthleteWorkoutLogs />} />
                    <Route path="coach/shared-logs" element={<CoachSharedLogsViewer />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="messages/:userId" element={<Messages />} />
                    
                    {/* Athlete Routes */}
                    <Route path="athlete" element={<Navigate to="home" replace />} />
                    <Route path="athlete/home" element={<AthleteHome />} />
                    <Route path="athlete/regimens" element={<AthleteRegimens />} />
                    <Route path="athlete/regimen/:id" element={<RegimenDetail />} />
                    <Route path="athlete/activity" element={<AthleteActivity />} />
                    <Route path="athlete/progress" element={<AthleteProgress />} />
                    <Route path="athlete/my-coaches" element={<MyCoaches />} />
                    <Route path="notifications" element={<Notifications />} />
                  </Route>
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MessagesProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
