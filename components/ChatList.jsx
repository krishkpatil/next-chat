import React from 'react';
import ChatItem from './ChatItem';

const ChatList = ({ chats, activeChat, onSelectChat, onDeleteChat }) => {
  return (
    <div className="overflow-y-auto h-full">
      {chats.map((chat) => (
        <div key={chat.id} onClick={() => onSelectChat(chat.id)}>
          <ChatItem 
            chat={chat} 
            isActive={chat.id === activeChat} 
            onDelete={onDeleteChat}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatList;