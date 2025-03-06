import React from 'react';
import UserAvatar from './UserAvatar';

const ChatItem = ({ chat, isActive = false, onDelete }) => {
  const { name, lastMessage, timestamp, avatar, unread, tags, phone } = chat;

  return (
    <div className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${isActive ? 'bg-gray-100' : ''}`}>
      <div className="mr-3">
        <UserAvatar src={avatar} text={name} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <p className="font-medium text-gray-900 truncate">{name}</p>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 truncate">{lastMessage}</p>
          {unread && unread > 0 && (
            <span className="ml-2 bg-green-500 text-white rounded-full text-xs px-1.5 py-0.5 min-w-[18px] text-center">
              {unread}
            </span>
          )}
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex space-x-1 mt-1">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-1.5 py-0.5 text-xs rounded-md bg-gray-200 text-gray-700 capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {phone && (
          <div className="text-xs text-gray-400">
            {phone}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatItem;