import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useSupabase } from '../contexts/SupabaseContext';

const AddUserModal = ({ isOpen, onClose, chatId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState([]);
  const { user } = useSupabase();
  
  useEffect(() => {
    // Reset state when modal opens or closes
    if (isOpen) {
      setEmail('');
      setError(null);
      setSuccess(false);
      fetchCurrentParticipants();
    }
  }, [isOpen, chatId]);

  // Fetch the current participants in the chat
  const fetchCurrentParticipants = async () => {
    if (!chatId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          users:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('chat_id', chatId);
        
      if (error) throw error;
      
      setCurrentParticipants(data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };
  
  if (!isOpen) return null;
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Prevent inviting yourself
      if (user && user.email === email) {
        throw new Error('You cannot add yourself to the chat');
      }
      
      // Check if the email is already a participant
      const isAlreadyParticipant = currentParticipants.some(
        participant => participant.users?.email === email
      );
      
      if (isAlreadyParticipant) {
        throw new Error('User is already a member of this chat');
      }
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
      if (userError) {
        throw new Error('User not found with this email. They must sign up first.');
      }
      
      // Add user to chat
      const { error: addError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatId,
          user_id: userData.id,
          is_admin: false
        });
        
      if (addError) throw addError;
      
      setSuccess(true);
      setEmail('');
      
      // Update the participants list
      fetchCurrentParticipants();
      
      // Auto-close the modal after success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add User to Chat</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            User added successfully!
          </div>
        )}
        
        <form onSubmit={handleAddUser}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter email address"
              required
            />
          </div>
          
          {currentParticipants.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Current Participants</h3>
              <ul className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                {currentParticipants.map((participant) => (
                  <li 
                    key={participant.user_id} 
                    className="text-sm py-1 border-b border-gray-100 last:border-0"
                  >
                    {participant.users?.full_name || 'Unknown'} 
                    <span className="text-gray-500 ml-1">
                      ({participant.users?.email})
                    </span>
                    {participant.user_id === user?.id && (
                      <span className="text-green-500 ml-1">(You)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;