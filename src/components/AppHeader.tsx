import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, LogOut, Settings, UserCircle, MessageCircle, Dumbbell, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/utils/notificationUtils';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, syncNotificationReadStatus } from '@/services/notificationService';

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuToggle = () => {} }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [, setIsLoading] = useState(false);
  const [, setNotificationError] = useState<string | null>(null);
  
  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setNotificationError(null);
      
      try {
        // Sync any pending read statuses (no-op now, but kept for compatibility)
        await syncNotificationReadStatus();
        
        // Then fetch the latest notifications
        const result = await getNotifications(1, 5); // Get first page with 5 items
        setNotifications(result.notifications);
        setHasUnread(result.notifications.some(notification => !notification.read));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotificationError('Unable to load notifications');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up a polling interval to refresh notifications
    const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    const notificationIds = notifications.map(notification => notification._id);
    
    // Update UI immediately
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setHasUnread(false);
    
    // Update server
    try {
      await markAllNotificationsAsRead(notificationIds);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // If error, we don't revert the UI since the operation is still cached locally
    }
  };
  
  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    // Update UI immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      )
    );
    
    // Check if there are any unread notifications left
    const stillHasUnread = notifications.some(n => n._id !== id && !n.read);
    setHasUnread(stillHasUnread);
    
    // Update server
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // If error, we don't revert the UI since the operation is still cached locally
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // In a real app, you would navigate to the relevant page based on notification type
    // For now, we just mark it as read
  };
  
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between fixed top-0 right-0 left-0 z-20">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="mr-2 lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-coach-primary">
          {user?.role === 'athlete' ? 'Athlete Portal' : 'CoachShare'}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Messages Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/app/messages')}
          className="relative"
          title="Messages"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-coach-primary"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-4">
              <DropdownMenuLabel className="p-0 text-base">Notifications</DropdownMenuLabel>
              {hasUnread && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                  <CheckCheck className="mr-2 h-3 w-3" />
                  Mark all as read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            
            {notifications.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleNotificationClick(notification._id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="outline" className="bg-coach-primary text-white text-[10px] h-5">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(notification.date)}</p>
                      </div>
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-coach-primary" onClick={() => navigate('/app/notifications')}>
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-full">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-500">
                  {user?.email}
                  {user?.role && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] uppercase">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-coach-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-coach-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => user?.role === 'coach' ? navigate('/app/coach/profile') : navigate('/app/settings')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
