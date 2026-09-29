import React from 'react';
import { useDevicePreview } from '../../context/DevicePreviewContext';

export const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deviceMode, isMobileFrame, isTabletFrame } = useDevicePreview();

  if (deviceMode === 'responsive') {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900/90 py-6 px-2 flex flex-col items-center justify-start overflow-y-auto">
      {/* Device Header Tag */}
      <div className="mb-3 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-mono text-slate-300 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Previewing: {isMobileFrame ? 'Mobile Phone (390px × 844px)' : 'Tablet Screen (768px × 1024px)'}</span>
      </div>

      {/* Frame Container */}
      <div
        className={`relative bg-slate-950 border-4 border-slate-700/80 rounded-[40px] shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
          isMobileFrame
            ? 'w-[390px] h-[844px]'
            : 'w-[768px] h-[1024px]'
        }`}
      >
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950/80 mr-3" />
          <div className="w-2 h-2 rounded-full bg-blue-950/80" />
        </div>

        {/* Inner Scrollable Screen Content */}
        <div className="w-full h-full overflow-y-auto pt-6 pb-16 scrollbar-none">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
