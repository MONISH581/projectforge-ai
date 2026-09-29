import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeviceMode = 'responsive' | 'mobile' | 'tablet';

interface DevicePreviewContextType {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  isMobileFrame: boolean;
  isTabletFrame: boolean;
}

const DevicePreviewContext = createContext<DevicePreviewContextType | undefined>(undefined);

export const DevicePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceMode, setDeviceModeState] = useState<DeviceMode>(() => {
    return (localStorage.getItem('projectforge_device_mode') as DeviceMode) || 'responsive';
  });

  const setDeviceMode = (mode: DeviceMode) => {
    setDeviceModeState(mode);
    localStorage.setItem('projectforge_device_mode', mode);
  };

  return (
    <DevicePreviewContext.Provider
      value={{
        deviceMode,
        setDeviceMode,
        isMobileFrame: deviceMode === 'mobile',
        isTabletFrame: deviceMode === 'tablet',
      }}
    >
      {children}
    </DevicePreviewContext.Provider>
  );
};

export const useDevicePreview = () => {
  const context = useContext(DevicePreviewContext);
  if (!context) throw new Error('useDevicePreview must be used within DevicePreviewProvider');
  return context;
};
