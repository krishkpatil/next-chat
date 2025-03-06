// components/AddUserModal.jsx
import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const AddUserModal = ({ isOpen, onClose, chatId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  if (!isOpen) return null;
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
      if (userError) {
        throw new Error('User not found with this email');
      }
      
      // Check if user is already in the chat
      const { data: existingMember, error: memberError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userData.id)
        .single();
        
      if (existingMember) {
        throw new Error('User is already a member of this chat');
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
      <div className="bg-white rounded-lg p-6 w-96">
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