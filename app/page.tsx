'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../contexts/SupabaseContext';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import NavigationSidebar from '../components/NavigationSidebar';
import RightSidebar from '../components/RightSidebar';

export default function Home() {
  const { user, isLoading } = useSupabase();
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No user authenticated, redirecting to signin');
      router.replace('/auth/signin');
    }
  }, [user, isLoading, router]);

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
        activeChat={null} 
        onSelectChat={() => {}} 
      />
      <ChatView 
        chat={{ id: null }} 
      />
      <RightSidebar />
    </main>
  );
}