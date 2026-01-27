import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SignInButton from './SignInButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

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
      onClose();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
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

export default AuthModal;