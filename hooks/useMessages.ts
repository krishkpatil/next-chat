"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useSupabase } from '../contexts/SupabaseContext';

const useMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSupabase();

  // Fetch messages when chatId changes
  useEffect(() => {
    if (!chatId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Get messages for this chat
        const { data, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            user:user_id (
              id,
              full_name,
              email,
              phone,
              avatar_url
            )
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          throw messagesError;
        }

        console.log("Fetched messages:", data);
        setMessages(data || []);
        
        // Mark messages as read
        if (data && data.length > 0) {
          const unreadMessages = data.filter(msg => 
            msg.user_id !== user.id && 
            (!msg.metadata?.read_by || !msg.metadata.read_by.includes(user.id))
          );
          
          if (unreadMessages.length > 0) {
            console.log("Marking messages as read:", unreadMessages.length);
            
            // Update message metadata to mark as read
            await Promise.all(unreadMessages.map(async (msg) => {
              const currentMetadata = msg.metadata || {};
              const readBy = currentMetadata.read_by || [];
              
              if (!readBy.includes(user.id)) {
                readBy.push(user.id);
                
                await supabase
                  .from('messages')
                  .update({
                    metadata: { ...currentMetadata, read_by: readBy }
                  })
                  .eq('id', msg.id);
              }
            }));
          }
        }
      } catch (e) {
        console.error('Error fetching messages:', e);
        setError('Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const messageSubscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          console.log("New message received:", payload.new);
          
          // Add user data to the new message
          let newMessage = { ...payload.new };
          
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', payload.new.user_id)
              .single();
              
            if (userData) {
              newMessage.user = userData;
            }
          } catch (error) {
            console.error("Error fetching user data for message:", error);
          }
          
          // Add the new message to our state
          setMessages(prevMessages => [...prevMessages, newMessage]);
          
          // If the message is from someone else, mark it as read
          if (user && payload.new.user_id !== user.id) {
            const currentMetadata = payload.new.metadata || {};
            const readBy = currentMetadata.read_by || [];
            
            if (!readBy.includes(user.id)) {
              readBy.push(user.id);
              
              await supabase
                .from('messages')
                .update({
                  metadata: { ...currentMetadata, read_by: readBy }
                })
                .eq('id', payload.new.id);
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          // Update message when there's a change
          console.log("Message updated:", payload.new);
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new } 
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [chatId, user]);

  const sendMessage = async (content) => {
    if (!chatId || !user) return { error: 'User not authenticated or no chat selected' };

    try {
      console.log("Sending message to chat:", chatId);
      console.log("Current user:", user.id);
      
      // Create the message
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content,
          created_at: new Date().toISOString(),
          metadata: { 
            status: 'sent',
            read_by: [user.id] // Mark as read by sender
          }
        })
        .select()
        .single();

      if (messageError) throw messageError;

      console.log("Message sent successfully:", data);

      // Update the chat's last message
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      return { message: data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error.message || 'Failed to send message' };
    }
  };

  return { messages, loading, error, sendMessage };
};

export default useMessages;