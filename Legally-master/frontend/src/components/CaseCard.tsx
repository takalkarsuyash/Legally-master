import React from 'react';

interface CaseCardProps {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
}

const CaseCard: React.FC<CaseCardProps> = ({ title, description, priority, date }) => {
  const priorityColors = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority]}`}>
          {priority}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <p className="text-xs text-gray-500">{date}</p>
    </div>
  );
};

export default CaseCard;