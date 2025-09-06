// components/ConfirmationModal.tsx
import React, { Fragment } from 'react';
import Card from './Card';
import Button from './Button';
import { ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = 'primary',
  children
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <Card 
        className="w-full max-w-md animate-scale-in p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-danger/10' : 'bg-brand-500/10'}`}>
               <ShieldAlert className={`h-6 w-6 ${variant === 'danger' ? 'text-danger' : 'text-brand-600'}`} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {children}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {cancelText}
          </Button>
        </div>
      </Card>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { 
          from { opacity: 0; transform: scale(0.95) translateY(10px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;