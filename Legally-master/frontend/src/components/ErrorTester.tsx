import React, { useState } from 'react';
import { AlertTriangle, Bug } from 'lucide-react';

const ErrorTester: React.FC = () => {
    const [shouldThrowError, setShouldThrowError] = useState(false);

    if (shouldThrowError) {
        throw new Error('This is a test error to demonstrate the Error Boundary functionality!');
    }

    const throwError = () => {
        setShouldThrowError(true);
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200 max-w-md">
            <div className="flex items-center space-x-2 mb-4">
                <Bug className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Error Boundary Tester</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Click the button below to test the Error Boundary component by throwing a test error.
            </p>

            <button
                onClick={throwError}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
            >
                <AlertTriangle className="w-4 h-4" />
                <span>Throw Test Error</span>
            </button>
        </div>
    );
};

export default ErrorTester; 