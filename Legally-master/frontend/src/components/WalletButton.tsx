import React, { useState } from 'react';
import { Wallet, Coins, ChevronDown, LogOut, User, CreditCard } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { WalletService } from '../services/walletService';
import WalletSelectionModal from './WalletSelectionModal';
import UserRegistrationModal from './UserRegistrationModal';
import TokenPurchaseModal from './TokenPurchaseModal';
import { DatabaseService } from '../services/databaseService';
import { useNavigate } from 'react-router-dom';

const WalletButton: React.FC = () => {
  const {
    walletAddress,
    isConnected,
    loading,
    userProfile,
    userTokens,
    showRegistrationModal,
    showWalletModal,
    connectWallet,
    disconnectWallet,
    registerUser,
    refreshUserData,
    setShowRegistrationModal,
    setShowWalletModal,
  } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);

  const handleConnectWallet = async () => {
    // Use context modal setter so the modal is controlled globally
    setShowWalletModal(true);
  };

  const handleWalletSelect = async (walletId: string) => {
    try {
      await connectWallet(walletId);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleRegisterUser = async () => {
    try {
      await registerUser();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const handleTokenPurchaseComplete = async (tokenAmount: number, ethAmount: number, transactionHash: string) => {
    if (!userProfile) return;
    
    try {
      await DatabaseService.addTokens(userProfile.id, tokenAmount, ethAmount, transactionHash);
      await refreshUserData();
      setShowTokenPurchase(false);
    } catch (error) {
      console.error('Failed to update tokens after purchase:', error);
    }
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleBuyTokens = () => {
    setShowTokenPurchase(true);
    setShowDropdown(false);
  };

  const navigate = useNavigate();

  const handleManageProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Checking wallet...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <>
        <button
          onClick={handleConnectWallet}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full shadow-md focus:outline-none ring-1 ring-green-700/20"
        >
          <Wallet className="w-4 h-4" />
          <span className="font-medium">Connect Wallet</span>
        </button>

        <WalletSelectionModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onWalletSelect={handleWalletSelect}
          loading={loading}
        />

        <UserRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          walletAddress={walletAddress || ''}
          onRegister={handleRegisterUser}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Token Balance */}
        {userTokens && (
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
            <Coins className="w-4 h-4" />
            <span>{userTokens.token_balance.toLocaleString()}</span>
          </div>
        )}

        {/* Wallet Info Button */}
        <button
          onClick={handleDropdownToggle}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg focus:outline-none"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:block">
            {WalletService.formatAddress(walletAddress!)}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow z-20">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userProfile?.name || 'Wallet User'}</p>
                  <p className="text-sm text-gray-500">Connected Account</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-700 font-mono">
                {WalletService.formatAddress(walletAddress!)}
              </div>
            </div>

            {/* Token Information */}
            {userTokens && (
              <div className="p-4 border-b">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-700">Token Balance</p>
                      <p className="text-xl font-semibold text-yellow-700">{userTokens.token_balance.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Earned</p>
                      <p className="text-sm text-green-600 font-medium">{userTokens.total_earned.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3">
              <button onClick={handleManageProfile} className="w-full mb-2 px-3 py-2 border rounded text-sm text-gray-700 focus:outline-none">Manage Profile</button>
              <button
                onClick={() => { disconnectWallet(); setShowDropdown(false); }}
                className="w-full px-3 py-2 rounded text-sm text-red-600 border border-red-100 focus:outline-none"
              >
                <LogOut className="w-4 h-4 inline-block mr-2" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onWalletSelect={handleWalletSelect}
        loading={loading}
      />

      <UserRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        walletAddress={walletAddress || ''}
        onRegister={handleRegisterUser}
        loading={loading}
      />

      {showTokenPurchase && userTokens && (
        <TokenPurchaseModal
          isOpen={showTokenPurchase}
          onClose={() => setShowTokenPurchase(false)}
          onPurchaseComplete={handleTokenPurchaseComplete}
          currentBalance={userTokens.token_balance}
        />
      )}
    </div>
  );
};

export default WalletButton;