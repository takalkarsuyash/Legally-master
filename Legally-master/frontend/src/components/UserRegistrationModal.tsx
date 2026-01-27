import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Wallet, Coins } from 'lucide-react';
import { WalletService } from '../services/walletService';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onRegister: () => Promise<void>;
  loading: boolean;
}

const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onRegister,
  loading
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onRegister();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent backdrop-blur-sm">
      <div className="relative w-full max-w-xl mx-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-md">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Welcome Bonus</h3>
              <p className="text-sm text-gray-600">Get 1,000 free tokens to start using our platform!</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/30 transition-colors" disabled={loading}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-1 bg-white/40 rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-gray-800" />
                <span className="text-sm font-medium text-gray-800">Connected Wallet</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-gray-800">{WalletService.formatAddress(walletAddress)}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(walletAddress || '')}
                  className="ml-3 px-2 py-1 bg-white/30 rounded-md text-sm text-gray-700 hover:bg-white/40"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="col-span-1 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Coins className="w-5 h-5 text-primary-dark" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Welcome Bonus</div>
                  <div className="text-sm text-gray-700">Welcome tokens are credited automatically upon registration</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-primary">1,000</div>
                <div className="text-xs text-gray-500">free tokens</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="text-sm text-gray-600">
            <ul className="list-inside list-disc space-y-1">
              <li>Your wallet address will be used as your unique identifier</li>
              <li>Welcome tokens are credited automatically upon registration</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl border border-white/20 text-gray-800 bg-white/40 hover:bg-white/50 transition"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-semibold hover:from-primary-dark hover:to-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
};

export default UserRegistrationModal;