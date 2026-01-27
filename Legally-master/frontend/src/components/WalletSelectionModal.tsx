import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Wallet } from 'lucide-react';
import { WalletService, WalletProvider } from '../services/walletService';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelect: (walletId: string) => Promise<void>;
  loading: boolean;
}

const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  isOpen,
  onClose,
  onWalletSelect,
  loading
}) => {
  const [availableWallets, setAvailableWallets] = useState<WalletProvider[]>([]);
  const [allWallets, setAllWallets] = useState<WalletProvider[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    // Only show available MetaMask (and hide other providers)
    const available = WalletService.getAvailableWallets().filter(w => w.id === 'metamask');
    setAvailableWallets(available);
    setAllWallets([]);
  }, [isOpen]);

  const handleWalletClick = async (wallet: WalletProvider) => {
    if (wallet.isInstalled()) {
      await onWalletSelect(wallet.id);
    } else {
      // Redirect to installation page (only MetaMask supported)
      const installUrls: Record<string, string> = {
        metamask: 'https://metamask.io/download/',
      };

      const url = installUrls[wallet.id];
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-[9999] flex items-center justify-center" style={{ transform: 'none' }}>
      <div className="relative rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 bg-[rgba(255,255,255,0.6)] backdrop-blur-xl border border-[rgba(200,155,0,0.12)] shadow-2xl" style={{ transform: 'none' }}>
        <div className="border-b border-white/20 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#C89B00] to-[#9C7F00] rounded-xl shadow-sm text-white">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
                <p className="text-sm text-gray-600">Choose your preferred wallet to connect</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Available Wallets Section */}
          {availableWallets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Available
              </h3>
              <div className="space-y-3">
                {availableWallets.map((wallet) => (
                  <WalletOption
                    key={wallet.id}
                    wallet={wallet}
                    onClick={() => handleWalletClick(wallet)}
                    loading={loading}
                    installed={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Only MetaMask is supported in this build */}
          {/* If MetaMask isn't available, show install hint below (handled in the empty state) */}

          {availableWallets.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[rgba(200,155,0,0.08)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-[#C89B00]" />
              </div>
              <p className="text-gray-700 mb-2">No wallets detected</p>
              <p className="text-sm text-gray-600">Install MetaMask to connect your wallet</p>
              <div className="mt-4">
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#C89B00] text-white rounded-full shadow-md">Install MetaMask</a>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-t border-white/20 mt-6 p-4 rounded-2xl">
          <div className="text-xs text-gray-600 space-y-1">
            <p>• New to Ethereum wallets? <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark font-medium">Learn more</a></p>
            <p>• Your wallet address will be used to identify your account</p>
            <p>• We don't store your private keys or personal information</p>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
};

interface WalletOptionProps {
  wallet: WalletProvider;
  onClick: () => void;
  loading: boolean;
  installed: boolean;
}

const WalletOption: React.FC<WalletOptionProps> = ({ wallet, onClick, loading, installed }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all duration-200 ${
        installed 
          ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10' 
          : 'border-white/30 bg-white/40 hover:border-primary/30 hover:bg-white/60'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{wallet.icon}</div>
        <div className="text-left">
          <div className="font-semibold text-gray-900">{wallet.name}</div>
          <div className={`text-sm ${installed ? 'text-green-600' : 'text-gray-500'}`}>
            {installed ? 'Available' : 'Not installed'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!installed && <ExternalLink className="w-4 h-4 text-gray-400" />}
        {installed && (
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
        )}
      </div>
    </button>
  );
};

export default WalletSelectionModal;