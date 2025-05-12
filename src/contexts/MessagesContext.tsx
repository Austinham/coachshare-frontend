import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import MessagesService, { Message, Conversation } from '@/services/messagesService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface MessagesContextType {
  conversations: Conversation[];
  messages: Message[];
  activeConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
  refreshConversations: () => Promise<void>;
  resetMessages: () => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

interface MessagesProviderProps {
  children: ReactNode;
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      refreshConversations();
    }
  }, [user]);

  // Refresh conversations list
  const refreshConversations = async (): Promise<void> => {
    try {
      setLoading(true);
      const fetchedConversations = await MessagesService.getConversations();
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark conversation as read
  const markAsRead = async (): Promise<void> => {
    try {
      await MessagesService.markAsRead();
      
      // Update local state to reset unread counters
      if (activeConversation) {
        setConversations(prev => 
          prev.map(c => 
            c.id === activeConversation.id ? { ...c, unread: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Send a message
  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim() || !activeConversation) {
      toast.error('No message to send or no active conversation');
      return;
    }
    
    try {
      // Send message and add to messages list
      const sentMessage = await MessagesService.sendMessage(content);
      setMessages(prev => [...prev, sentMessage]);
      
      // Update conversation preview
      setConversations(prev => 
        prev.map(c => 
          c.id === activeConversation.id 
            ? { ...c, lastMessage: `You: ${content}`, lastMessageTime: new Date().toISOString() } 
            : c
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };
  
  // Reset messages
  const resetMessages = () => {
    setMessages([]);
  };

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        messages,
        activeConversation,
        loading,
        error,
        sendMessage,
        markAsRead,
        setActiveConversation,
        refreshConversations,
        resetMessages
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = (): MessagesContextType => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}; 