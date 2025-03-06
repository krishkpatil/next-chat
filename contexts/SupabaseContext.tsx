'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setUser(null);
          setSession(null);
        } else {
          console.log('Initial session:', session ? 'Found' : 'None');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error('Unexpected error in initial session setup:', e);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial session check
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setIsLoading(true);
        try {
          setSession(session);
          setUser(session?.user ?? null);
        } catch (error) {
          console.error('Error in auth state change:', error);
        } finally {
          setIsLoading(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in with:', email);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error.message);
        return { error };
      }
      
      console.log('Sign in successful');
      return { error: null };
    } catch (e) {
      console.error('Exception during sign in:', e);
      return { error: { name: 'SignInError', message: String(e) } as AuthError };
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
            full_name: fullName,
            phone
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error.message);
        return { error };
      }

      if (data.user) {
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

      return { error: null };
    } catch (e) {
      console.error('Exception during sign up:', e);
      return { error: { name: 'SignUpError', message: String(e) } as AuthError };
    }
  };

  const signOut = async () => {
    console.log('Signing out user:', user?.email);
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear local storage related to the current chat
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('activeChat');
      }
      
      console.log('Sign out completed');
      return { error };
    } catch (e) {
      console.error('Exception during sign out:', e);
      return { error: { name: 'SignOutError', message: String(e) } as AuthError };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut
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