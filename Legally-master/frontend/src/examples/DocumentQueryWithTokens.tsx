// Example: How to integrate token spending into your existing DocumentQuery component

import React, { useState } from 'react';
import { FileText, Send } from 'lucide-react';
import { useTokens } from '../hooks/useTokens';
import { useWallet } from '../contexts/WalletContext';
import TokenGate from '../components/TokenGate';

const DocumentQueryWithTokens: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const { isConnected } = useWallet();

  // Your existing document query logic
  const handleQuery = async () => {
    setLoading(true);
    try {
      // Your existing API call here
      const response = await fetch('/api/document-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Document Query</h2>
              <p className="text-blue-100">Ask questions about your legal documents</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Connect your wallet to start querying documents</p>
            </div>
          ) : (
            <TokenGate 
              featureName="document_query" 
              onTokensSpent={() => {
                // Optional: Any additional logic after tokens are spent
                console.log('Tokens spent for document query');
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your question about the document
                  </label>
                  <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="What are the key terms in this contract?"
                  />
                </div>

                <button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Processing...' : 'Query Document'}
                </button>

                {results && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Query Results:</h3>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {results}
                    </div>
                  </div>
                )}
              </div>
            </TokenGate>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentQueryWithTokens;