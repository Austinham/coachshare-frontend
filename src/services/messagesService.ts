import axios from 'axios';

// Simple Message interface
export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isFromCurrentUser: boolean;
}

// Simple Conversation interface
export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  role: 'coach' | 'athlete';
}

// Simplified storage keys
const STORAGE_KEYS = {
  COACH_CONVERSATIONS: 'conversations_coach',
  ATHLETE_CONVERSATIONS: 'conversations_athlete',
  MESSAGES: 'messages',
  USER: 'user'
};

/**
 * Simplified Messages Service
 */
const MessagesService = {
  /**
   * Get all conversations for the current user
   */
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const { role } = getCurrentUser();
      const key = role === 'coach' ? STORAGE_KEYS.COACH_CONVERSATIONS : STORAGE_KEYS.ATHLETE_CONVERSATIONS;
      
      // Clear any existing mock data
      localStorage.removeItem(key);
      return [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Get messages for the conversation
   */
  getMessages: async (): Promise<Message[]> => {
    try {
      // Clear any existing mock data
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Send a new message
   */
  sendMessage: async (content: string): Promise<Message> => {
    throw new Error('Messaging feature is not yet available');
  },

  /**
   * Mark conversation as read
   */
  markAsRead: async (): Promise<void> => {
    // No-op since messaging is not available
  },

  /**
   * Reset all message-related data
   */
  resetAll: () => {
    // Clear all message-related data from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('messages_') || key.startsWith('conversations_') || key.startsWith('message_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

/**
 * Helper to get current user info
 */
function getCurrentUser() {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    const user = userData ? JSON.parse(userData) : {};
    
    return {
      role: user.role || 'coach',
      isDragonDave: false
    };
  } catch (error) {
    return { role: 'coach', isDragonDave: false };
  }
}

export default MessagesService; 