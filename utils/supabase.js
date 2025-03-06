// utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log configuration values (without sensitive data) to help with debugging
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
} else {
  console.log('Supabase URL configured:', supabaseUrl.substring(0, 10) + '...');
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
} else {
  console.log('Supabase Anon Key configured:', supabaseAnonKey.substring(0, 5) + '...');
}

// Create the Supabase client with options to better handle auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
});

// Helper functions for debugging auth issues
export const checkAuthStatus = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error checking auth status:', error);
      return null;
    }
    return data?.user || null;
  } catch (err) {
    console.error('Exception during auth check:', err);
    return null;
  }
};

export const forceSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during force sign out:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception during force sign out:', err);
    return false;
  }
};