
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300 ${className}`}>
      {title && (
        <div 
          className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300"
          style={{ padding: 'calc(var(--block-padding) * 0.75) var(--block-padding)' }}
        >
          <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div 
        className="text-gray-900 dark:text-gray-100 global-block-padding"
      >
        {children}
      </div>
    </div>
  );
};