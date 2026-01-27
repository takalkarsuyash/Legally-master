import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { DatabaseService } from '../services/databaseService';
import { WalletService } from '../services/walletService';
import { TokenPurchaseService } from '../services/tokenPurchaseService';
import { Coins, Pencil } from 'lucide-react';

// Inline token purchase form used on the Profile page
interface TokenPurchaseFormProps {
  currentBalance: number;
  userId?: string | undefined | null;
  onComplete?: () => Promise<void> | (() => void);
}

const TokenPurchaseForm: React.FC<TokenPurchaseFormProps> = ({ currentBalance, userId, onComplete }) => {
  const [tokenAmount, setTokenAmount] = React.useState<string>('10000');
  const [ethAmount, setEthAmount] = React.useState<number>(TokenPurchaseService.calculateEthAmount(10000));
  const [gasFee, setGasFee] = React.useState<string>('0.001');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const amt = Number(tokenAmount || 0);
    const eth = TokenPurchaseService.calculateEthAmount(isNaN(amt) ? 0 : amt);
    setEthAmount(eth);
  }, [tokenAmount]);

  React.useEffect(() => {
    // estimate gas when component mounts
    let cancelled = false;
    (async () => {
      try {
        const g = await TokenPurchaseService.estimateGasFee();
        if (!cancelled) setGasFee(g);
      } catch (err) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePurchase = async () => {
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError('Please connect your wallet and register to purchase tokens.');
      return;
    }

    const tokens = Math.floor(Number(tokenAmount || 0));
    if (!tokens || tokens <= 0) {
      setError('Enter a valid token amount');
      return;
    }

    const eth = TokenPurchaseService.calculateEthAmount(tokens);
    if (eth < 0.001) {
      setError('Minimum purchase is 0.001 ETH (1000 tokens)');
      return;
    }

    setLoading(true);
    try {
      const result = await TokenPurchaseService.purchaseTokens(eth);
      if (result.success && result.tokenAmount && result.transactionHash) {
        // Credit tokens in DB
        await DatabaseService.addTokens(userId, result.tokenAmount, eth, result.transactionHash);
        setSuccess(`Purchased ${result.tokenAmount.toLocaleString()} tokens.`);
        if (onComplete) await onComplete();
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-white/60 rounded-lg border border-[rgba(200,155,0,0.04)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Your Tokens</p>
            <p className="text-xl font-semibold text-yellow-700">{currentBalance.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Est. Wallet Gas</p>
            <p className="text-sm font-medium">{Number(gasFee).toFixed(4)} ETH</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Token Amount</label>
        <input type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" min={1000} />
        <p className="text-sm text-gray-500 mt-1">Rate: 10,000 tokens = 0.01 ETH</p>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">ETH to pay</span>
          <span className="font-medium">{ethAmount.toFixed(6)} ETH</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-sm text-gray-600">Est. Gas</span>
          <span className="text-sm">{gasFee} ETH</span>
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-semibold">{(ethAmount + Number(gasFee)).toFixed(6)} ETH</span>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="flex gap-3">
        <button onClick={handlePurchase} disabled={loading} className="flex-1 px-4 py-2 bg-[#C89B00] text-white rounded-full shadow-sm disabled:opacity-50">{loading ? 'Processing...' : 'Purchase'}</button>
      </div>
    </div>
  );
};

interface UserProfile {
  id?: string;
  name?: string | null;
  surname?: string | null;
  username?: string | null;
  email?: string | null;
  profile_url?: string | null;
}

const ProfilePage: React.FC = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { walletAddress, userProfile: walletProfile, userTokens, loading: walletLoading, connectWallet, disconnectWallet, setShowWalletModal, refreshUserData } = useWallet();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCopyWalletId = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setSuccessMessage('Wallet ID copied to clipboard!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setErrorMessage('Failed to copy wallet ID');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  // Form fields
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');

  const createProfileFromUser = useCallback((user: User): UserProfile => {
    const profileUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.photoURL;
    const meta = user.user_metadata;
    return {
      id: user.id, // CRITICAL: Add ID so updates work
      name: meta?.full_name || meta?.name || meta?.given_name || 'Not provided',
      surname: meta?.last_name || meta?.family_name || '', // Add surname for comparison
      email: user.email || '',
      profile_url: profileUrl
    };
  }, []);

  // Sync either auth or wallet profile into local state
  useEffect(() => {
    if (walletAddress && walletProfile) {
      setProfile(walletProfile as UserProfile);
      setName(walletProfile.name || '');
      setSurname((walletProfile as any).surname || '');
      return;
    }

    if (!authLoading && !authUser && !walletAddress) {
      navigate('/signin', { replace: true });
    }

    if (authUser) {
      const profileData = createProfileFromUser(authUser);
      setProfile(profileData);
      
      // Pre-fill form fields
      if (!name) {
          const meta = authUser.user_metadata;
          setName(meta.first_name || meta.given_name || meta.full_name?.split(' ')[0] || '');
          setSurname(meta.last_name || meta.family_name || meta.full_name?.split(' ').slice(1).join(' ') || '');
      }
    }
  }, [authUser, authLoading, walletAddress, walletProfile, navigate, createProfileFromUser]);

  const handleImageError = () => {
    // If we've already detected an error, do nothing to prevent loops
    if (imgError) return;
    
    // Mark as error so we fallback immediately. 
    // Do NOT try to modify the URL and retry, as this causes 429s if the Google CDN blocks us.
    setImgError(true);
    
    // Clear profile URL in local state to ensure fallback renders
    if (profile) {
        setProfile(prev => ({ ...prev!, profile_url: null }));
    }
  };

  const handleSignOut = async () => {
    if (walletAddress) {
      // If wallet user, disconnect
      disconnectWallet();
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation even if network fails
    } finally {
        navigate('/', { replace: true });
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      if (profile && profile.id) {
        // Optimistic check: if nothing changed, just exit edit mode
        if (name.trim() === (profile.name || '') && surname.trim() === (profile.surname || '')) {
            setIsEditing(false);
            setSuccessMessage('Profile saved');
            setSaving(false);
            setTimeout(() => setSuccessMessage(null), 3000);
            return;
        }

        const updates: any = {
          name: name.trim() || null,
          surname: surname.trim() || null,
        };

        const updated = await DatabaseService.updateUserProfile(profile.id, updates);
        if (updated) {
          setSuccessMessage('Profile updated');
          // Refresh context data
          await refreshUserData();
          setProfile(updated);
          setIsEditing(false);
        } else {
          setErrorMessage('Failed to update profile');
        }
      } else {
        setErrorMessage('No profile to update');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred while saving');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  if ((authLoading || walletLoading) && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const finalImageUrl = imgError
    ? profile?.profile_url?.replace(/s\d+-c/, 's200-c')
    : profile?.profile_url;

  return (
    <div className="min-h-screen bg-background bg-ambient-pattern py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            {/* Left: Profile Card */}
            <div className="w-full max-w-2xl">
              <div className="relative rounded-2xl p-6 bg-[rgba(255,255,255,0.7)] backdrop-blur-md border border-[rgba(200,155,0,0.08)] shadow-lg">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 border-[#C89B00] bg-gray-100 flex items-center justify-center relative group">
                    {(() => {
                        // Priority 1: Valid Profile URL (e.g. Google)
                        if (finalImageUrl && finalImageUrl.length > 0) {
                            return (
                                <img
                                    src={finalImageUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                    onError={handleImageError}
                                />
                            );
                        }
                        


                        // Priority 3: Fallback Initials
                        return (
                            <div className="w-full h-full bg-[#C89B00] flex items-center justify-center text-white font-bold text-3xl select-none">
                                {(profile?.name ? profile.name.charAt(0) : (authUser?.email?.charAt(0) || 'U')).toUpperCase()}
                            </div>
                        );
                    })()}
                    
                    {/* Upload Overlay */}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium">
                        Change
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) alert("Image upload coming soon!");
                        }} />
                    </label>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
                </div>

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <div className="relative">
                        <input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            disabled={!isEditing}
                            className={`w-full px-3 py-2 rounded-md pr-10 ${isEditing ? 'bg-white border border-gray-300' : 'bg-transparent border-transparent cursor-default font-medium'}`} 
                        />
                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-gray-100 rounded-full"
                                title="Edit Name"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <div className="relative">
                        <input 
                            value={surname} 
                            onChange={e => setSurname(e.target.value)} 
                            disabled={!isEditing}
                            className={`w-full px-3 py-2 rounded-md pr-10 ${isEditing ? 'bg-white border border-gray-300' : 'bg-transparent border-transparent cursor-default font-medium'}`} 
                        />
                         {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-gray-100 rounded-full"
                                title="Edit Name"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                  </div>

                  {/* username removed per design */}

                  {/* Wallet ID display removed for free mode */}

                  {/* Token balance display removed for free mode */}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {isEditing && (
                    <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-[#C89B00] text-white rounded-lg hover:bg-[#9C7F00] transition-colors shadow-sm">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
                <button onClick={handleSignOut} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium bg-white">
                    {walletAddress ? 'Disconnect' : 'Sign Out'}
                </button>
              </div>
            </div>

            {/* Right: Inline Token Purchase Card */}

          </div>

          {successMessage && <div className="mt-4 text-green-600">{successMessage}</div>}
          {errorMessage && <div className="mt-4 text-red-600">{errorMessage}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;