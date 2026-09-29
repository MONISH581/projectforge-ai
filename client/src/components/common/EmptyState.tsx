import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 max-w-md mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
