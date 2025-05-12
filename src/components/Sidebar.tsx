<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  Users, 
  CalendarDays, 
  BarChart3, 
  LogOut, 
  Clock,
  Award,
  FileText,
  MessageCircle,
  Menu,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Search,
  Activity,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

// Define menu items for coaches
const coachMenuItems = [
  { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/app' },
  { icon: Dumbbell, label: 'Regimens', id: 'regimens', path: '/app/regimens' },
  { icon: Users, label: 'Athletes', id: 'athletes', path: '/app/athletes' },
  { icon: CalendarDays, label: 'Schedule', id: 'schedule', path: '/app/schedule' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics', path: '/app/analytics' },
  { icon: MessageCircle, label: 'Messages', id: 'messages', path: '/app/messages' },
  { icon: UserCircle, label: 'Profile', id: 'profile', path: '/app/coach/profile' },
];

// Define menu items for athletes
const athleteMenuItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/app' },
  { id: 'regimens', label: 'My Regimens', icon: Dumbbell, path: '/app/athlete/regimens' },
  { id: 'progress', label: 'My Progress', icon: BarChart3, path: '/app/athlete/progress' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/app/messages' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
];

// For athlete role
const athleteNavItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/app/athlete/home' },
  { id: 'regimens', label: 'My Programs', icon: Dumbbell, path: '/app/athlete/regimens' },
  { id: 'my-coaches', label: 'My Coaches', icon: UserCircle, path: '/app/athlete/my-coaches' },
  { id: 'activity', label: 'Activity', icon: Activity, path: '/app/athlete/activity' },
  { id: 'progress', label: 'Progress', icon: LineChart, path: '/app/athlete/progress' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/app/messages' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen: propIsOpen, onToggle: propOnToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Get menu items based on user role
  const menuItems = user?.role === 'athlete' ? athleteNavItems : coachMenuItems;
  
  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (propOnToggle) {
      propOnToggle();
    }
  };
  
  // Use prop value if provided, otherwise use state
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);
  
  // Set active tab based on current route
  const getActiveTab = useCallback((pathname: string) => {
    // Dashboard should only be active when exactly at /app
    if (pathname === '/app') return 'dashboard';
    
    // For other routes, find the matching path prefix
    for (const item of menuItems) {
      if (pathname.startsWith(item.path) && item.path !== '/app') {
        return item.id;
      }
    }
    
    return '';
  }, [menuItems]);

  // Update active tab when location changes
  useEffect(() => {
    const currentActiveId = getActiveTab(location.pathname);
    if (currentActiveId && currentActiveId !== activeTab) {
      setActiveTab(currentActiveId);
    }
  }, [location.pathname, activeTab, getActiveTab]);

  // Memoize navigation handler to prevent recreation on each render
  const handleNavigation = useCallback((id: string, path: string) => {
    setActiveTab(id);
    navigate(path);
  }, [navigate]);

  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col border-r border-gray-200 bg-white transition-all duration-300 z-10 ${
      isOpen ? 'lg:w-64 w-16' : 'w-16'
    }`}>
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <span className={`text-xl font-bold text-coach-primary transition-opacity ${isOpen ? 'lg:block hidden' : 'hidden'}`}>
          CoachShare
        </span>
        <span className={`text-xl font-bold text-coach-primary ${isOpen ? 'lg:hidden block' : 'block'}`}>
          CS
        </span>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:flex hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex flex-1 flex-col justify-between p-4">
        <nav className="space-y-1">
=======

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  Home, 
  Settings, 
  Share2, 
  Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/app' },
    { icon: Dumbbell, label: 'Regimens', id: 'regimens', path: '/app/regimens' },
    { icon: Users, label: 'Athletes', id: 'athletes', path: '/app/athletes' },
    { icon: CalendarDays, label: 'Schedule', id: 'schedule', path: '/app/schedule' },
    { icon: Share2, label: 'Shared', id: 'shared', path: '/app/shared' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics', path: '/app/analytics' },
  ];

  const handleNavigation = (id: string, path: string) => {
    onTabChange(id);
    navigate(path);
  };

  // Determine the active tab based on the current path
  React.useEffect(() => {
    const currentPath = location.pathname;
    const matchingItem = menuItems.find(item => 
      currentPath === item.path || currentPath.startsWith(`${item.path}/`)
    );
    
    if (matchingItem && matchingItem.id !== activeTab) {
      onTabChange(matchingItem.id);
    }
  }, [location.pathname, activeTab, onTabChange]);

  return (
    <div className={cn(
      "h-screen fixed top-0 left-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="py-4 px-3 flex items-center justify-between border-b border-gray-200 h-16">
        {isOpen && <h1 className="text-xl font-bold text-coach-primary">CoachShare</h1>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle} 
          className={cn("ml-auto", isOpen ? "" : "mx-auto")}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </div>
      
      <div className="py-6 flex-1 overflow-y-auto">
        <nav className="space-y-1 px-2">
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
<<<<<<< HEAD
              size="sm"
              className={cn(
                "w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                activeTab === item.id ? "bg-gray-100 text-gray-900" : "",
                isOpen ? "" : "justify-center px-0"
              )}
              onClick={() => handleNavigation(item.id, item.path)}
            >
              <item.icon className={cn("h-5 w-5", isOpen ? "mr-3" : "")} />
              {isOpen && <span className="hidden lg:block">{item.label}</span>}
            </Button>
          ))}
          
          {user?.role === 'athlete' && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isOpen ? "" : "justify-center px-0"
                )}
                onClick={() => navigate('/app/athlete/help')}
              >
                <FileText className={cn("h-5 w-5", isOpen ? "mr-3" : "")} />
                {isOpen && <span className="hidden lg:block">Help & Support</span>}
              </Button>
            </div>
          )}
        </nav>
        
        <div className="flex-grow"></div>
        
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span className="hidden lg:block">Logout</span>}
          </button>
        </div>
=======
              className={cn(
                "w-full justify-start mb-1 font-medium",
                (activeTab === item.id || location.pathname.startsWith(item.path)) 
                  ? "bg-coach-light text-coach-primary" 
                  : "text-gray-600",
                isOpen ? "px-3" : "px-0 justify-center"
              )}
              onClick={() => handleNavigation(item.id, item.path)}
            >
              <item.icon className={cn("h-5 w-5", isOpen ? "mr-2" : "")} />
              {isOpen && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start font-medium text-gray-600",
            isOpen ? "px-3" : "px-0 justify-center"
          )}
        >
          <Settings className={cn("h-5 w-5", isOpen ? "mr-2" : "")} />
          {isOpen && <span>Settings</span>}
        </Button>
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default React.memo(Sidebar);
=======
export default Sidebar;
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
