import React, { useState, useCallback } from 'react';
import ChatList from './ChatList';
import UserAvatar from './UserAvatar';
import { supabase } from '../utils/supabase';
import { useSupabase } from '../contexts/SupabaseContext';

const Sidebar = ({ activeChat, onSelectChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { user, signOut } = useSupabase();
  
  // Use React's useEffect to fetch chats when component mounts
  React.useEffect(() => {
    const fetchChats = async () => {
      if (!user) {
        setChats([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        console.log("Current user ID:", user.id);
        
        // Get chat participants for the current user
        const { data: participantsData, error: participantsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);
          
        if (participantsError) throw participantsError;
        
        console.log("User participant data:", participantsData);
        
        if (!participantsData || participantsData.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }
        
        // Extract just the chat IDs
        const chatIds = participantsData.map(p => p.chat_id);
        
        console.log("User chat IDs:", chatIds);
        
        // Get chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds)
          .order('last_message_at', { ascending: false });
          
        if (chatError) throw chatError;
        
        console.log("User chat data:", chatData);
        
        // Transform to match UI format
        setChats(chatData.map(chat => ({
          id: chat.id,
          name: chat.name,
          lastMessage: chat.last_message || '',
          timestamp: formatDate(chat.last_message_at || chat.created_at),
          is_group: chat.is_group
        })));
      } catch (error) {
        console.error('Error fetching chats:', error);
        setLoadError('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
    
    // Set up real-time subscription
    const chatSubscription = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, 
        (payload) => {
          // Check if user is part of this chat
          supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('chat_id', payload.new.id)
            .eq('user_id', user?.id)
            .then(({ data }) => {
              if (data && data.length > 0) {
                setChats(prev => [
                  {
                    id: payload.new.id,
                    name: payload.new.name,
                    lastMessage: payload.new.last_message || '',
                    timestamp: formatDate(payload.new.last_message_at || payload.new.created_at),
                    is_group: payload.new.is_group
                  },
                  ...prev
                ]);
              }
            });
        }
      )
      .subscribe();
      
    return () => {
      chatSubscription.unsubscribe();
    };
  }, [user]);
  
  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString();
  };
  
  // Create chat function that doesn't use hooks
  const handleCreateChat = async () => {
    if (!user) {
      console.error("No user authenticated");
      return;
    }

    try {
      console.log("Creating chat for user:", user.id);
      
      // Create a chat with the current user as participant
      const { data: chatId, error: createError } = await supabase
        .rpc('create_chat_with_participant', {
          p_name: "New Chat",
          p_is_group: true,
          p_user_id: user.id
        });
        
      if (createError) throw createError;
      
      console.log("Chat creation response:", chatId);
      
      if (!chatId) {
        throw new Error("No chat ID returned from creation function");
      }
      
      // Instead of fetching the chat again, just create it with what we know
      const newChat = {
        id: chatId,
        name: "New Chat",
        lastMessage: '',
        timestamp: formatDate(new Date()),
        is_group: true
      };
      
      setChats(prev => [newChat, ...prev]);
      onSelectChat(chatId);
      
      console.log("Chat created successfully:", newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };
  
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('activeChat');
      
      // Redirect to login page or refresh the page
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleDeleteChat = async (chatId) => {
    try {
      // First delete chat participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId);
        
      if (participantsError) throw participantsError;
      
      // Then delete messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);
        
      if (messagesError) throw messagesError;
      
      // Finally delete the chat
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
        
      if (chatError) throw chatError;
      
      // Remove the chat from state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      // If this was the active chat, clear the selection
      if (activeChat === chatId) {
        onSelectChat(undefined);
        localStorage.removeItem('activeChat');
      }
      
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };
  
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full md:w-80 h-full flex flex-col border-r border-gray-200">
      <div className="p-3 bg-gray-50 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center">
          <UserAvatar text="P" />
          <h1 className="ml-2 text-lg font-semibold">Periskope</h1>
        </div>
        <div className="flex space-x-2 text-gray-500">
          <button onClick={handleLogout} className="hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          <button onClick={handleCreateChat} className="hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-2">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search"
            className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-2 border-b border-gray-200">
        <div className="flex space-x-1">
          <button className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Custom filter
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
            Save
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        ) : loadError ? (
          <div className="text-red-500 p-4 text-center">
            {loadError}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-gray-500 p-4 text-center">
            No chats found
          </div>
        ) : (
          <ChatList 
            chats={filteredChats} 
            activeChat={activeChat} 
            onSelectChat={onSelectChat} 
            onDeleteChat={handleDeleteChat}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;