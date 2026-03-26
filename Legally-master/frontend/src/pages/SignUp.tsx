import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/databaseService';
import { Lock, UserPlus, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const SignUp: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with Backend
      const verifyRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'OTP verification failed');

      // 2. Sign up with Supabase Auth since OTP is verified
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            gender: gender,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // 3. Create User Profile immediately
        await DatabaseService.createUserProfile(
            data.user.id,
            email,
            firstName,
            lastName
        );

        toast.success("Account verified and created successfully!");
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-ambient-pattern">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-90 border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
             {step === 'otp' ? <Key className="h-6 w-6 text-primary" /> : <UserPlus className="h-6 w-6 text-primary" />}
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            {step === 'otp' ? 'Verify your Email' : t('auth.signup.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'otp' ? `We sent a code to ${email}` : t('auth.signup.subtitle')}
          </p>
        </div>

        {step === 'form' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label htmlFor="first-name" className="sr-only">First Name</label>
                    <input
                        id="first-name"
                        name="firstName"
                        type="text"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder={t('auth.signup.first_name')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="last-name" className="sr-only">Last Name</label>
                    <input
                        id="last-name"
                        name="lastName"
                        type="text"
                        required
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder={t('auth.signup.last_name')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
            </div>
            <div>
              <label htmlFor="gender" className="sr-only">Gender</label>
              <select
                id="gender"
                name="gender"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-white"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="" disabled>{t('auth.signup.select_gender')}</option>
                <option value="male">{t('auth.signup.male')}</option>
                <option value="female">{t('auth.signup.female')}</option>
                <option value="other">{t('auth.signup.other')}</option>
              </select>
            </div>
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
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending Code...' : t('auth.signup.submit')}
            </button>
          </div>
        </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyAndSignUp}>
            <div>
              <label htmlFor="otp" className="sr-only">One-Time Password</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-xl text-center font-mono tracking-[0.5em]"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={loading}
                className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center text-sm">
            <span className="text-gray-500">{t('auth.signup.already_have_account')} </span>
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                {t('auth.signup.signin_link')}
            </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
