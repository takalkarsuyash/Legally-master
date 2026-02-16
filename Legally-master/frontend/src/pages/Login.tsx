import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SignInButton from '../components/SignInButton';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Navigation is handled by the useEffect listener on 'user'
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.message.includes('Email not confirmed')) {
        alert('Please verify your email address before signing in. Check your inbox (and spam folder) for the confirmation link.');
      } else {
        alert(error.message || 'Error signing in');
      }
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-ambient-pattern">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-90 border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
             <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            {t('auth.signin.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.signin.subtitle')}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder={t('auth.signin.email_label')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder={t('auth.signin.password_label')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? t('auth.signin.submitting') : t('auth.signin.submit')}
              </button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('auth.signin.or_continue')}</span>
            </div>
          </div>

          <div className="flex justify-center">
             <SignInButton onClick={handleGoogleSignIn} loading={loading} />
          </div>
          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-gray-600">
                {t('auth.signin.no_account')}{' '}
                <Link to="/signup" className="font-medium text-primary hover:text-primary-dark">
                    {t('auth.signin.signup_link')}
                </Link>
            </p>
          </div>
          <div className="text-center text-xs text-gray-500 mt-4">
          <div className="text-center text-xs text-gray-500 mt-4">
            {t('auth.signin.terms')}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
