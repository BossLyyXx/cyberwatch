import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-ghost';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

// FIX: Forward ref to the underlying button element to allow parent components to get a reference to it.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = 'primary', size = 'md', icon, className = '', ...props }, ref) => {
  const baseStyles = 'rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-500 shadow hover:shadow-md focus-visible:ring-offset-white',
    secondary: 'bg-brand-50 border border-brand-300 text-brand-800 hover:bg-brand-300/30 focus-visible:ring-offset-white',
    danger: 'bg-danger text-white hover:bg-red-500 focus-visible:ring-offset-white',
    ghost: 'bg-transparent text-brand-600 hover:bg-brand-500/10',
    'danger-ghost': 'bg-transparent text-danger hover:bg-danger/10',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button ref={ref} className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;