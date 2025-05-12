import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageSquare, UserCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import MessagesService from '@/services/messagesService';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    activeConversation, 
    loading, 
    setActiveConversation, 
    sendMessage, 
    markAsRead,
    refreshConversations,
    resetMessages
  } = useMessages();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = React.useState('');
  
  // Get user info
  const userIsCoach = user?.role === 'coach';
  
  // Load conversations on mount
  useEffect(() => {
    refreshConversations();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle conversation selection
  const selectConversation = async (conversation) => {
    // Reset messages first
    resetMessages();
    
    // Set active conversation
    setActiveConversation(conversation);
    
    try {
      // Load messages and mark as read
      await MessagesService.getMessages();
      await markAsRead();
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast.error('Failed to load messages');
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Format time
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'XX';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  return (
    <>
      <Helmet>
        <title>Messages | CoachShare</title>
      </Helmet>
      
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Coming Soon!</h3>
                <p className="text-gray-600">
                  We're working hard to bring you a seamless messaging experience. The messaging feature will be available soon, allowing you to communicate directly with your {userIsCoach ? 'athletes' : 'coach'}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={userIsCoach ? 'athletes' : 'coaches'}>
                <TabsList className="grid grid-cols-2 mx-4 mt-1 mb-2">
                  <TabsTrigger value="athletes">Athletes</TabsTrigger>
                  <TabsTrigger value="coaches">Coaches</TabsTrigger>
                </TabsList>
                
                {/* Athletes Tab */}
                <TabsContent value="athletes" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    {loading && conversations.length === 0 ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                      </div>
                    ) : conversations.filter(c => c.role === 'athlete').length > 0 ? (
                      conversations
                        .filter(c => c.role === 'athlete')
                        .map(conversation => (
                          <div 
                            key={conversation.id}
                            onClick={() => selectConversation(conversation)}
                            className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer ${
                              activeConversation?.id === conversation.id ? 'bg-gray-100' : ''
                            }`}
                          >
                            <Avatar>
                              <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conversation.name}</p>
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessageTime)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>
                            {conversation.unread > 0 && (
                              <Badge className="ml-auto">{conversation.unread}</Badge>
                            )}
                          </div>
                        ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                        <MessageSquare className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No conversations yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                {/* Coaches Tab */}
                <TabsContent value="coaches" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    {loading && conversations.length === 0 ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                      </div>
                    ) : conversations.filter(c => c.role === 'coach').length > 0 ? (
                      conversations
                        .filter(c => c.role === 'coach')
                        .map(conversation => (
                          <div 
                            key={conversation.id}
                            onClick={() => selectConversation(conversation)}
                            className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer ${
                              activeConversation?.id === conversation.id ? 'bg-gray-100' : ''
                            }`}
                          >
                            <Avatar>
                              <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conversation.name}</p>
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessageTime)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>
                            {conversation.unread > 0 && (
                              <Badge className="ml-auto">{conversation.unread}</Badge>
                            )}
                          </div>
                        ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                        <MessageSquare className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No conversations yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Messages Area */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>
                {activeConversation ? activeConversation.name : 'Select a conversation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeConversation ? (
                <>
                  <ScrollArea className="h-[calc(100vh-340px)] p-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id || index}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                  
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        disabled
                      />
                      <Button onClick={handleSendMessage} disabled>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-340px)] text-center p-4">
                  <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                  <p className="text-gray-500">
                    Select a conversation from the list to start messaging
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Messages; 