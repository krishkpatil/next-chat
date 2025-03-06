"use client";

import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import { supabase } from '../utils/supabase';
import { useSupabase } from '../contexts/SupabaseContext';
import useMessages from '../hooks/useMessages';

const ChatView = ({ chat }) => {
  const { user } = useSupabase();
  const [chatDetails, setChatDetails] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, loading: loadingMessages, error: messagesError, sendMessage } = useMessages(chat?.id);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch chat details when chat ID changes
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!chat?.id) {
        setChatDetails(null);
        return;
      }
      
      setLoadingChat(true);
      
      try {
        // Try to get chat details from Supabase
        const { data, error } = await supabase
          .from('chats')
          .select(`
            *,
            participants:chat_participants(
              user_id,
              is_admin,
              users:user_id(
                id,
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .eq('id', chat.id);
          
        if (error) {
          console.error("Error fetching chat details:", error);
          // If we can't get the details, use a default placeholder
          setChatDetails({
            id: chat.id,
            name: "Chat",
            is_group: true
          });
        } else if (data && data.length > 0) {
          console.log("Chat details loaded:", data[0]);
          setChatDetails(data[0]);
        } else {
          console.warn("No chat found with ID:", chat.id);
          setChatDetails({
            id: chat.id,
            name: "Chat",
            is_group: true
          });
        }
      } catch (error) {
        console.error("Error in fetchChatDetails:", error);
        setChatDetails({
          id: chat.id,
          name: "Chat",
          is_group: true
        });
      } finally {
        setLoadingChat(false);
      }
    };
    
    fetchChatDetails();
  }, [chat?.id]);

  // Handle sending a message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    const { error } = await sendMessage(text.trim());
    
    if (error) {
      console.error('Error sending message:', error);
      // You could add a toast notification here
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at);
      const dateString = date.toISOString().split('T')[0];
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      
      groups[dateString].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      displayDate: formatDate(date),
      messages
    }));
  };

  if (!chat?.id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <p className="text-xl">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  if (loadingChat || loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader 
        chat={chatDetails || { 
          id: chat.id, 
          name: "Chat", 
          is_group: true 
        }} 
      />
      
      <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
        {messagesError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            Error loading messages: {messagesError}
          </div>
        )}

        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map(group => (
              <div key={group.date}>
                <div className="flex justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {group.displayDate}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {group.messages.map(message => {
                    const isFromCurrentUser = user?.id === message.user_id;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isFromCurrentUser && (
                          <div className="mr-2 self-end mb-1">
                            <UserAvatar 
                              size="sm" 
                              src={message.user?.avatar_url} 
                              text={message.user?.full_name || 'User'} 
                            />
                          </div>
                        )}
                        
                        <div className="max-w-xs md:max-w-md">
                          {!isFromCurrentUser && message.user && (
                            <div className="text-xs text-green-500 mb-1 pl-1">
                              {message.user.full_name || message.user_id}
                            </div>
                          )}
                          
                          <div 
                            className={`rounded-lg px-4 py-2 shadow-sm ${
                              isFromCurrentUser ? 'bg-green-100 text-gray-800' : 'bg-white text-gray-800'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{message.content}</div>
                            <div className="flex justify-end items-center text-xs text-gray-500 mt-1">
                              {formatTimestamp(message.created_at)}
                              {isFromCurrentUser && (
                                <span className="ml-1">
                                  {(message.metadata?.read_by?.length > 1) ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline text-blue-500" viewBox="0 0 24 24" fill="none">
                                      <path d="M5 13l4 4L19 7M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {isFromCurrentUser && user && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatView;