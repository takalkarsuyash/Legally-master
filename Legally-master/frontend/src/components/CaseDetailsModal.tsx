import React from 'react';
import { X } from 'lucide-react';

interface CaseDetail {
  label: string;
  value: string;
}

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseDetails: CaseDetail[];
}

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ isOpen, onClose, caseDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-primary-dark">Case Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          {caseDetails.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span className="font-semibold text-gray-600">{detail.label}:</span>
              <span className="text-primary-dark">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal;