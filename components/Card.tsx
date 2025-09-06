import React from 'react';

// FIX: Extend React.HTMLAttributes<HTMLDivElement> to allow passing standard HTML attributes like `style`.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-gray-200/80 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;