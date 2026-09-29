import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="h-5 bg-slate-800 rounded-md w-1/3" />
      <div className="h-5 bg-slate-800 rounded-full w-16" />
    </div>
    <div className="h-4 bg-slate-800 rounded-md w-3/4" />
    <div className="h-4 bg-slate-800 rounded-md w-1/2" />
    <div className="pt-2 flex gap-2">
      <div className="h-6 bg-slate-800 rounded-md w-14" />
      <div className="h-6 bg-slate-800 rounded-md w-14" />
      <div className="h-6 bg-slate-800 rounded-md w-14" />
    </div>
  </div>
);

export const MetricSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-2">
    <div className="h-3.5 bg-slate-800 rounded w-1/2" />
    <div className="h-7 bg-slate-800 rounded w-1/3" />
  </div>
);
