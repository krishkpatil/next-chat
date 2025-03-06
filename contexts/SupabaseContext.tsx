'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<any>;
  signOut: () => Promise<any>;
  debugUser: () => User | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
        } else {
          console.log('Session loaded:', session ? 'Found' : 'None');
          if (session?.user) {
            console.log('User email:', session.user.email);
          }
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error('Unexpected error in session setup:', e);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set the initial data
    setData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in with:', email);
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log('Sign in result:', result.error ? 'Error' : 'Success');
      if (result.data.user) {
        console.log('Successfully signed in as:', result.data.user.email);
      }
      return result;
    } catch (e) {
      console.error('Exception during sign in:', e);
      throw e;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    console.log('Starting sign up for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (!error && data.user) {
        console.log('User created, adding to users table:', data.user.id);
        // Create a record in the users table
        const { error: userError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone
        });
        
        if (userError) {
          console.error('Error creating user record:', userError);
        }
      }

      return { data, error };
    } catch (e) {
      console.error('Exception during sign up:', e);
      throw e;
    }
  };

  const signOut = async () => {
    console.log('Signing out user:', user?.email);
    try {
      // Then trigger the sign out from Supabase
      const result = await supabase.auth.signOut();
      
      // Clear local storage related to the current chat
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('activeChat');
      }
      
      console.log('Sign out completed');
      return result;
    } catch (e) {
      console.error('Exception during sign out:', e);
      throw e;
    }
  };

  const debugUser = () => {
    if (user) {
      console.log("Current user:", {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log("No user authenticated");
    }
    return user;
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    debugUser
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};