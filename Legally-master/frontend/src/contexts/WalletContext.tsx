
import React, { createContext, useContext, useEffect, useState } from 'react';
import { WalletService } from '../services/walletService';
import { DatabaseService } from '../services/databaseService';
import { UserProfile, UserTokens } from '../types/database';
interface WalletContextType {
  // Wallet state
  walletAddress: string | null;
  isConnected: boolean;
  loading: boolean;
  
  // User state
  userProfile: UserProfile | null;
  userTokens: UserTokens | null;
  isNewUser: boolean;
  
  // Modal states
  showWalletModal: boolean;
  showRegistrationModal: boolean;
  
  // Actions
  connectWallet: (walletId?: string) => Promise<void>;
  disconnectWallet: () => void;
  registerUser: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  spendTokens: (featureName: string) => Promise<{ success: boolean; newBalance?: number; message?: string }>;
  
  // Modal actions
  setShowWalletModal: (show: boolean) => void;
  setShowRegistrationModal: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  isConnected: false,
  loading: false,
  userProfile: null,
  userTokens: null,
  isNewUser: false,
  showWalletModal: false,
  showRegistrationModal: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  registerUser: async () => {},
  refreshUserData: async () => {},
  spendTokens: async () => ({ success: true, message: 'Free Mode Default' }),
  setShowWalletModal: () => {},
  setShowRegistrationModal: () => {},
});

export const useWallet = () => {
  return useContext(WalletContext);
};
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const connectWallet = async (walletId?: string) => {
    setLoading(true);
    try {
      let address: string;
      
      if (walletId) {
        // Connect with specific wallet
        address = await WalletService.connectWallet(walletId);
      } else {
        // Try to get current account
        const currentAccount = await WalletService.getCurrentAccount();
        if (currentAccount) {
          address = currentAccount;
        } else {
          // Show wallet selection modal
          setShowWalletModal(true);
          setLoading(false);
          return;
        }
      }

      // if (address) {
      //   toast.success("Wallet connected successfully!");
      // }
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const signer = await provider.getSigner();

      // const contract = new ethers.Contract(
      //   "0xddaAd340b0f1Ef65169Ae5E41A8b10776a75482d",
      //   CONTRACT_ABI,
      //   signer
      // );

      // console.log("Contract Instance:", contract);

      // // Claim tokens
      // try {
      //   const tx = await contract.claimTokens();
      //   await tx.wait();
      //   toast.success("Tokens claimed successfully!");
      //   console.log("Tokens claimed successfully!");
      // } catch (err) {
      //   if (err.message.includes("Already claimed")) {
      //     console.warn("User already claimed their tokens");
      //   } else {
      //     throw err;
      //   }
      // }

      if (address) {
        setWalletAddress(address)
        localStorage.setItem('walletAddress', address);
        
        // Load or create user data
        await loadUserData(address);
        setShowWalletModal(false);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setShowWalletModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (address: string) => {
    try {
      const existingUser = await DatabaseService.getUserByWalletId(address);
      
      if (existingUser) {
        setUserProfile(existingUser);
        setIsNewUser(false);
        
        // Load token data
        const tokens = await DatabaseService.getUserTokens(existingUser.id);
        setUserTokens(tokens);
      } else {
        setIsNewUser(true);
        setShowRegistrationModal(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const registerUser = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const newUser = await DatabaseService.createUserProfile(walletAddress);
      
      if (newUser) {
        setUserProfile(newUser);
        setIsNewUser(false);
        setShowRegistrationModal(false);
        
        // Load initial token balance
        const tokens = await DatabaseService.getUserTokens(newUser.id);
        setUserTokens(tokens);
      }
    } catch (error) {
      console.error('Failed to register user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!walletAddress || !userProfile) return;
    
    try {
      const [updatedProfile, updatedTokens] = await Promise.all([
        DatabaseService.getUserByWalletId(walletAddress),
        DatabaseService.getUserTokens(userProfile.id)
      ]);
      
      if (updatedProfile) setUserProfile(updatedProfile);
      if (updatedTokens) setUserTokens(updatedTokens);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const spendTokens = async (featureName: string) => {
    // Mock successful payment
    return { success: true, newBalance: 1000, message: 'Payment bypassed' };
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setUserProfile(null);
    setUserTokens(null);
    setIsNewUser(false);
    localStorage.removeItem('walletAddress');
    setShowWalletModal(false);
    setShowRegistrationModal(false);
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      const storedAddress = localStorage.getItem('walletAddress');
      
      if (storedAddress && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.includes(storedAddress)) {
            setWalletAddress(storedAddress);
            await loadUserData(storedAddress);
          } else {
            localStorage.removeItem('walletAddress');
          }
        } catch (error) {
          console.error("Error checking existing connection:", error);
          localStorage.removeItem("walletAddress");
        }
      }

      setLoading(false);
    };

    checkExistingConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          setWalletAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
          loadUserData(accounts[0]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, [walletAddress]);

  const value: WalletContextType = {
    // Wallet state
    walletAddress,
    isConnected: true, // Always pretend to be connected
    loading,
    
    // User state
    userProfile,
    userTokens,
    isNewUser,
    
    // Modal states
    showWalletModal,
    showRegistrationModal,
    
    // Actions
    connectWallet,
    disconnectWallet,
    registerUser,
    refreshUserData,
    spendTokens,
    
    // Modal actions
    setShowWalletModal,
    setShowRegistrationModal,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
