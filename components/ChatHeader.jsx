"use client";

import React, { useState } from 'react';
import UserAvatar from './UserAvatar';
import AddUserModal from './AddUserModal';

const ChatHeader = ({ chat }) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  if (!chat) return null;

  // Get participant count from the participants array if available
  const participantCount = chat.participants?.length || 0;
  
  // Extract participant names for display
  let participantNames = '';
  if (chat.participants && chat.participants.length > 0) {
    participantNames = chat.participants
      .map(p => p.users?.full_name || 'User')
      .join(', ');
  }

  return (
    <div className="flex flex-col border-b border-gray-200 bg-gray-50">
      {/* Top header with controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="text-lg font-medium">{chat.name}</div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="flex items-center text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="ml-1 text-sm">
              {participantCount > 0 ? `${participantCount} / 6 users` : '1 / 6 users'}
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button 
            onClick={() => setShowAddUserModal(true)} 
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chat detail header */}
      <div className="flex items-center p-3">
        <div className="mr-3">
          <UserAvatar src={chat.avatar_url} text={chat.name} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{chat.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {chat.is_group ? 'Group Chat' : 'Direct Message'} • {participantNames || 'No participants yet'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2 overflow-hidden">
                {Array(Math.min(participantCount || 1, 5)).fill(0).map((_, idx) => (
                  <div key={idx} className="inline-block h-8 w-8 rounded-full border-2 border-white bg-gray-200 text-center text-xs text-gray-700 flex items-center justify-center overflow-hidden">
                    {chat.participants && chat.participants[idx]?.users?.full_name?.[0] || 
                     ["U", "S", "E", "R", "S"][idx]}
                  </div>
                ))}
                {(participantCount || 0) > 5 && (
                  <div className="inline-block h-8 w-8 rounded-full border-2 border-white bg-green-500 text-white text-center text-xs flex items-center justify-center">
                    +{participantCount - 5}
                  </div>
                )}
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <AddUserModal 
        isOpen={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)} 
        chatId={chat.id} 
      />
    </div>
  );
};

export default ChatHeader;