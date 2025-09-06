
import React from 'react';
import Card from './Card';

interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, title, value, change, changeType }) => {
  const changeColor = changeType === 'increase' ? 'text-success' : 'text-danger';

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-gray-700">
        <p className="font-semibold">{title}</p>
        <div className="text-brand-600">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {change && (
        <p className={`text-sm mt-1 ${changeColor}`}>
          {change}
        </p>
      )}
    </Card>
  );
};

export default KpiCard;
