// Notification type
export interface Notification {
  _id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// These functions are deprecated in favor of the notificationService
// They're kept for backward compatibility during transition
// New code should use notificationService directly

import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  syncNotificationReadStatus
} from '@/services/notificationService';

// Load read status from localStorage - DEPRECATED
export const getReadStatus = (): Record<string, boolean> => {
  console.warn('getReadStatus is deprecated. Use notificationService.getNotifications instead.');
  try {
    const storedStatus = localStorage.getItem('notification_read_status');
    if (storedStatus) {
      return JSON.parse(storedStatus);
    }
  } catch (error) {
    console.error('Error retrieving notification read status:', error);
  }
  return {};
};

// Save read status to localStorage - DEPRECATED
export const saveReadStatus = (status: Record<string, boolean>): void => {
  console.warn('saveReadStatus is deprecated. Use notificationService methods instead.');
  try {
    localStorage.setItem('notification_read_status', JSON.stringify(status));
  } catch (error) {
    console.error('Error saving notification read status:', error);
  }
};

// Mark a notification as read
export const markNotificationRead = (id: string): void => {
  // Forward to the service
  markNotificationAsRead(id).catch(err => 
    console.error('Error marking notification as read:', err)
  );
};

// Mark all notifications as read
export const markAllNotificationsRead = (notificationIds: string[]): void => {
  // Forward to the service
  markAllNotificationsAsRead(notificationIds).catch(err => 
    console.error('Error marking all notifications as read:', err)
  );
};

// Apply read status to notifications - DEPRECATED
export const applyReadStatus = (notifications: Notification[]): Notification[] => {
  console.warn('applyReadStatus is deprecated. Use notificationService.getNotifications instead.');
  const readStatus = getReadStatus();
  return notifications.map(notification => ({
    ...notification,
    read: notification.read || readStatus[notification._id] === true
  }));
};

// Sync any pending notification read statuses
export const syncReadStatuses = (): void => {
  syncNotificationReadStatus().catch(err => 
    console.error('Error syncing notification read statuses:', err)
  );
}; 