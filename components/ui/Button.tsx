import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center text-sm shadow-sm active:scale-[0.98]";
  
  const variants = {
    primary: "bg-[#248b65] hover:bg-[#1c6d4f] text-white disabled:bg-green-300 dark:disabled:bg-green-800",
    secondary: "bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:disabled:bg-gray-800",
    outline: "bg-transparent border border-[#248b65] text-[#248b65] hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/30",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};