"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import NavigationSidebar from '../components/NavigationSidebar';
import RightSidebar from '../components/RightSidebar';

export default function Home() {
  // Use localStorage to preserve the active chat between reloads
  const [activeChat, setActiveChat] = useState(undefined);
  
  // Load the active chat from localStorage on initial render
  useEffect(() => {
    const savedChat = localStorage.getItem('activeChat');
    if (savedChat) {
      setActiveChat(savedChat);
    }
  }, []);
  
  // Save the active chat to localStorage when it changes
  const handleSelectChat = (chatId) => {
    setActiveChat(chatId);
    localStorage.setItem('activeChat', chatId);
  };

  return (
    <main className="flex h-screen bg-white overflow-hidden">
      <NavigationSidebar />
      <Sidebar 
        activeChat={activeChat} 
        onSelectChat={handleSelectChat} 
      />
      <ChatView 
        chat={{ id: activeChat }} 
      />
      <RightSidebar />
    </main>
  );
}