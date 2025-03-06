'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../contexts/SupabaseContext';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import NavigationSidebar from '../components/NavigationSidebar';
import RightSidebar from '../components/RightSidebar';

export default function Home() {
  const { user, isLoading } = useSupabase();
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No user authenticated, redirecting to signin');
      router.replace('/auth/signin');
    }
  }, [user, isLoading, router]);

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    console.log('Selected chat:', chatId);
    setActiveChat(chatId);
    
    // Optionally save to localStorage
    localStorage.setItem('activeChat', chatId);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // If no user, show nothing (will be redirected)
  if (!user) {
    return null;
  }

  // Authenticated view
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