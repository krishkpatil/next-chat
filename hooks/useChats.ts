import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Chat, Tag } from '../types';
import { useSupabase } from '../contexts/SupabaseContext';

export const useChats = (currentUser) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the currentUser passed as a parameter
  const user = currentUser;

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    const fetchChats = async () => {
      setLoading(true);
      setError(null);

      try {
        // Skip the unnecessary users query
        
        // Use a direct SQL query to get chat IDs
        const { data: chatIdsData, error: chatIdsError } = await supabase
          .rpc('get_user_chat_ids', { p_user_id: user.id });

        if (chatIdsError) {
          throw chatIdsError;
        }

        const chatIds = chatIdsData || [];

        if (chatIds.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }

        // Get chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds)
          .order('last_message_at', { ascending: false });

        if (chatError) {
          throw chatError;
        }

        // Format the data to match our Chat type
        const formattedChats = chatData.map(chat => ({
          id: chat.id,
          created_at: chat.created_at,
          updated_at: chat.updated_at || chat.created_at,
          name: chat.name,
          is_group: chat.is_group,
          last_message: chat.last_message,
          last_message_at: chat.last_message_at,
          participant_count: 1, // Default to 1 (simpler)
          tags: [],  // Default to empty (simpler)
          unread_count: 0  // Default to 0 (simpler)
        }));

        setChats(formattedChats);
      } catch (e) {
        console.error('Error fetching chats:', e);
        setError('Failed to fetch chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Set up real-time subscription for chat updates
    const chatSubscription = supabase
      .channel('public:chats')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chats'
        },
        (payload) => {
          // Update chat when there's a change
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === payload.new.id 
                ? { ...chat, ...payload.new } 
                : chat
            )
          );
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats'
        },
        async (payload) => {
          // Check if the new chat belongs to the user
          const { data } = await supabase
            .rpc('get_user_chat_ids', { p_user_id: user.id });
            
          if (data && data.includes(payload.new.id)) {
            // Add the new chat to the list
            setChats(prevChats => [...prevChats, {
              id: payload.new.id,
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at,
              name: payload.new.name,
              is_group: payload.new.is_group,
              last_message: payload.new.last_message,
              last_message_at: payload.new.last_message_at,
              participant_count: 1,
              tags: [],
              unread_count: 0
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      chatSubscription.unsubscribe();
    };
  }, [user]);

  const createChat = async (name: string, participants: string[], isGroup: boolean = false) => {
    const { user } = useSupabase(); // Ensure user is available

    if (!user) return { error: 'User not authenticated' };

    try {
      // Use the secure RPC function to create a chat and add the current user
      const { data: chatId, error: createError } = await supabase
        .rpc('create_chat_with_participant', {
          p_name: name,
          p_is_group: isGroup,
          p_user_id: user.id
        });

      if (createError) throw createError;

      // Get the chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      // For now, skip adding other participants until we fix the recursion issue
      // We can add that feature later once the basic chat creation works

      return { chat: chatData };
    } catch (error: any) {
      console.error('Error creating chat:', error);
      return { error: error.message || 'Failed to create chat' };
    }
  };

  return { chats, loading, error, createChat };
};