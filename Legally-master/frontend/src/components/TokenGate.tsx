import React, { useState } from 'react';
import { AlertCircle, Coins, CheckCircle } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import { useWallet } from '../contexts/WalletContext';

interface TokenGateProps {
  featureName: string;
  children: React.ReactNode;
  onTokensSpent?: () => void;
}

const TokenGate: React.FC<TokenGateProps> = ({ featureName, children, onTokensSpent }) => {
  // Bypass all checks for development/testing
  return <>{children}</>;
};

export default TokenGate;

// Example usage component showing how to integrate with existing features
export const ExampleFeatureWithTokens: React.FC = () => {
  const [hasAccess, setHasAccess] = useState(false);

  return (
    <TokenGate 
      featureName="document_query" 
      onTokensSpent={() => setHasAccess(true)}
    >
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Access Granted!</h3>
        <p className="text-green-700">You can now use this premium feature.</p>
        {/* Your actual feature content goes here */}
      </div>
    </TokenGate>
  );
};