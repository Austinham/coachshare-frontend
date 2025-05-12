import React, { useState, useEffect } from 'react';
import { X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Notification } from '@/utils/notificationUtils';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  syncNotificationReadStatus
} from '@/services/notificationService';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotificationsData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Sync any offline read statuses first
        await syncNotificationReadStatus();
        
        // Then fetch the latest notifications
        const result = await getNotifications(currentPage, 10);
        setNotifications(result.notifications);
        setHasUnread(result.notifications.some(notification => !notification.read));
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Unable to load notifications. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotificationsData();
  }, [user, currentPage]);
  
  // Check for unread notifications
  useEffect(() => {
    setHasUnread(notifications.some(notification => !notification.read));
  }, [notifications]);
  
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
  };
  
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
  
  // Load more notifications
  const loadPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread && (
          <Button variant="outline" onClick={markAllAsRead} className="text-sm">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-10 w-10 mx-auto mb-3 animate-spin rounded-full border-b-2 border-t-2 border-coach-primary"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
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
                      <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
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
              <p className="text-gray-500">No notifications</p>
            </div>
          )}
        </CardContent>
        
        {notifications.length > 0 && totalPages > 1 && (
          <CardFooter className="flex justify-center gap-2 bg-gray-50 border-t">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === 1}
              onClick={() => loadPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => loadPage(currentPage + 1)}
            >
              Next
            </Button>
          </CardFooter>
        )}
        
        {notifications.length > 0 && (
          <CardFooter className="bg-gray-50 border-t">
            <p className="text-xs text-gray-500">
              Click on a notification to mark it as read
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Notifications; 