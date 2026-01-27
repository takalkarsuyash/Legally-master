import { useWallet } from '../contexts/WalletContext';
import { FEATURE_COSTS } from '../types/database';

export const useTokens = () => {
  const { userTokens, spendTokens, refreshUserData } = useWallet();

  const checkTokenBalance = (featureName: string): { canAfford: boolean; cost: number; balance: number } => {
    // FREE MODE: Always return sufficient balance
    const cost = FEATURE_COSTS[featureName] || 0;
    const balance = 10000; // Mock high balance

    return {
      canAfford: true, // Always allow
      cost,
      balance
    };
  };

  const consumeTokens = async (featureName: string): Promise<{ success: boolean; newBalance?: number; message?: string }> => {
    // FREE MODE: Bypass check
    // Always proceed to spendTokens (which is also mocked)
    const result = await spendTokens(featureName);

    if (result.success) {
      // Refresh user data to get updated balance
      await refreshUserData();
    }

    return result;
  };

  const getFeatureCost = (featureName: string): number => {
    return FEATURE_COSTS[featureName] || 0;
  };

  const formatTokenAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  return {
    tokens: userTokens,
    checkTokenBalance,
    consumeTokens,
    getFeatureCost,
    formatTokenAmount,
    refreshTokens: refreshUserData,
  };
};