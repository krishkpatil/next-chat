'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../../contexts/SupabaseContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const { user, signIn, signUp } = useSupabase();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log("User already authenticated, redirecting:", user.email);
      setDebugInfo(`Already authenticated as: ${user.email}`);
      router.push('/');
    } else {
      console.log("No user authenticated, showing sign-in form");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDebugInfo(null);

    try {
      if (isSignUp) {
        if (!fullName || !phone) {
          setError('Please fill all fields');
          setLoading(false);
          return;
        }

        console.log(`Attempting to sign up with email: ${email}`);
        setDebugInfo(`Signing up as: ${email}`);
        
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          throw error;
        }
        
        // On successful signup, show a message that they need to verify email
        alert('Please check your email to verify your account!');
      } else {
        console.log(`Attempting to sign in with email: ${email}`);
        setDebugInfo(`Signing in as: ${email}`);
        
        const { error } = await signIn(email, password);
        if (error) {
          throw error;
        }
        
        // On successful login, redirect to home
        console.log("Sign in successful, redirecting...");
        setDebugInfo(`Successfully signed in as: ${email}`);
        router.push('/');
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || 'An error occurred');
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isSignUp ? 'Create an Account' : 'Sign In'}
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {debugInfo && (
            <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-xs">
              Debug: {debugInfo}
            </div>
          )}

          {user && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
              You are currently signed in as {user.email}. 
              <button 
                onClick={() => router.push('/')}
                className="ml-2 underline"
              >
                Go to app
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-black"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-black"
                required
              />
            </div>

            {isSignUp && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-black"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-black"
                    required
                  />
                </div>
              </>
            )}
            
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
              disabled={loading}
            >
              {loading 
                ? 'Loading...' 
                : isSignUp 
                  ? 'Sign Up' 
                  : 'Sign In'
              }
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-green-500 hover:text-green-600"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : 'Don\'t have an account? Sign Up'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}