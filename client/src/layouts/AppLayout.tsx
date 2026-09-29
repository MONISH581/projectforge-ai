import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { BottomNav } from '../components/common/BottomNav';
import { DeviceFrame } from '../components/common/DeviceFrame';
import { useAuth } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <DeviceFrame>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {user && <Sidebar />}
          <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-8 max-w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </DeviceFrame>
  );
};
