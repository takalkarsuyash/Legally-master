import React, { useState, useEffect } from 'react';
import { X, Coins, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { TokenPurchaseService } from '../services/tokenPurchaseService';
import { WalletService } from '../services/walletService';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: (tokenAmount: number, ethAmount: number, transactionHash: string) => void;
  currentBalance: number;
}

const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchaseComplete,
  currentBalance
}) => {
  const [selectedPackage, setSelectedPackage] = useState<{eth: number, tokens: number} | null>(null);
  const [customEthAmount, setCustomEthAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [gasFee, setGasFee] = useState('0.001');
  const [userBalance, setUserBalance] = useState('0');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const packages = TokenPurchaseService.getRecommendedPurchases();

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [gasEstimate, walletAddress] = await Promise.all([
        TokenPurchaseService.estimateGasFee(),
        WalletService.getCurrentAccount()
      ]);

      setGasFee(gasEstimate);

      if (walletAddress) {
        const balance = await WalletService.getBalance(walletAddress);
        setUserBalance(balance);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handlePackageSelect = (pkg: {eth: number, tokens: number}) => {
    setSelectedPackage(pkg);
    setCustomEthAmount('');
    setError('');
    setSuccess('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomEthAmount(value);
    setSelectedPackage(null);
    setError('');
    setSuccess('');

    if (value && !isNaN(Number(value)) && Number(value) > 0) {
      const ethAmount = Number(value);
      const tokenAmount = TokenPurchaseService.calculateTokenAmount(ethAmount);
      setSelectedPackage({ eth: ethAmount, tokens: tokenAmount });
    }
  };

  const validatePurchase = (): boolean => {
    if (!selectedPackage) {
      setError('Please select a token package or enter a custom amount');
      return false;
    }

    const totalCost = selectedPackage.eth + Number(gasFee);
    if (totalCost > Number(userBalance)) {
      setError('Insufficient ETH balance for this purchase');
      return false;
    }

    if (selectedPackage.eth < 0.001) {
      setError('Minimum purchase amount is 0.001 ETH');
      return false;
    }

    return true;
  };

  const handlePurchase = async () => {
    if (!validatePurchase() || !selectedPackage) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await TokenPurchaseService.purchaseTokens(selectedPackage.eth);
      
      if (result.success && result.transactionHash && result.tokenAmount) {
        setSuccess(`Successfully purchased ${result.tokenAmount.toLocaleString()} tokens!`);
        onPurchaseComplete(result.tokenAmount, selectedPackage.eth, result.transactionHash);
        
        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (error: any) {
      setError(error.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Purchase Tokens</h2>
                <p className="text-sm text-gray-500">Buy tokens to access premium features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Current Token Balance</p>
                <p className="text-2xl font-bold text-blue-900">{currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Wallet Balance</p>
                <p className="text-lg font-semibold text-blue-900">{Number(userBalance).toFixed(4)} ETH</p>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Package Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Token Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packages.map((pkg, index) => (
                <button
                  key={index}
                  onClick={() => handlePackageSelect(pkg)}
                  disabled={loading}
                  className={`p-4 border-2 rounded-xl transition-all text-left ${
                    selectedPackage?.eth === pkg.eth && selectedPackage?.tokens === pkg.tokens
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                    pkg.popular ? 'ring-2 ring-yellow-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{pkg.tokens.toLocaleString()} Tokens</span>
                    {pkg.popular && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{pkg.eth} ETH</p>
                  <p className="text-xs text-gray-500">
                    ~${(pkg.eth * 3000).toLocaleString()} USD
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Enter Custom Amount</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="custom-eth" className="block text-sm font-medium text-gray-700 mb-1">
                  ETH Amount
                </label>
                <input
                  type="number"
                  id="custom-eth"
                  value={customEthAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="0.01"
                  step="0.001"
                  min="0.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              {customEthAmount && !isNaN(Number(customEthAmount)) && Number(customEthAmount) > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    You will receive: <span className="font-semibold">
                      {TokenPurchaseService.calculateTokenAmount(Number(customEthAmount)).toLocaleString()} tokens
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Summary */}
          {selectedPackage && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-900">Transaction Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens:</span>
                  <span className="font-medium">{selectedPackage.tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">{selectedPackage.eth} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Gas Fee:</span>
                  <span className="font-medium">{gasFee} ETH</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="font-semibold">{(selectedPackage.eth + Number(gasFee)).toFixed(6)} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? 'Processing Purchase...' : 'Purchase Tokens'}
          </button>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Purchases are processed through smart contracts on the blockchain</p>
            <p>• Transaction fees (gas) are paid separately to the network</p>
            <p>• Tokens are credited to your account after transaction confirmation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchaseModal;