import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import SignInButton from '../components/SignInButton';

const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-ambient-pattern">
      <div className="card max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Sign In</h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in with your Google account to access the application.
        </p>
        <div className="flex justify-center">
          <SignInButton onClick={handleGoogleSignIn} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;