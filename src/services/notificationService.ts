import { Notification } from '@/utils/notificationUtils';
import api from './api';

// Get notifications from the API with pagination
export const getNotifications = async (page = 1, limit = 10): Promise<{
  notifications: Notification[],
  totalPages: number,
  currentPage: number,
  total: number
}> => {
  try {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    const { data, totalPages, currentPage, total } = response.data;
    
    return {
      notifications: data.notifications,
      totalPages,
      currentPage,
      total
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error; // Rethrow the error to be handled by the component
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    // Update on the server
    await api.patch(`/notifications/${id}/mark-read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (notificationIds: string[]): Promise<boolean> => {
  try {
    // Update on the server
    await api.patch('/notifications/mark-all-read');
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Sync notification read status with the server
// This is a placeholder function since we no longer use local storage
export const syncNotificationReadStatus = async (): Promise<void> => {
  // This function no longer does anything since we're using the server directly
  // But we keep it for compatibility with existing code
  console.log('Syncing notification read status with server (no-op)');
}; 