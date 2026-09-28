import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      btnColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-amber-950/50'
    },
    info: {
      icon: HelpCircle,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      btnColor: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-950/50'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      isEmergency={type === 'danger'}
    >
      <div className="space-y-4">
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bgColor}`}>
          <Icon className={`w-6 h-6 flex-shrink-0 ${config.iconColor} mt-0.5`} />
          <p className="text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 ${config.btnColor}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
