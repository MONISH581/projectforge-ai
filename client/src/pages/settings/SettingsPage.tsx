import React, { useState } from 'react';
import { Settings, Bell, Lock, Shield, Moon, Monitor, Smartphone, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDevicePreview } from '../../context/DevicePreviewContext';
import { useToast } from '../../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { deviceMode, setDeviceMode } = useDevicePreview();
  const { success } = useToast();

  const [notifications, setNotifications] = useState({
    deadlineReminders: true,
    aiSuggestions: true,
    milestoneCelebrations: true,
    weeklyDigest: false
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    success('Notification preference saved');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize notification preferences, device simulation viewport, and account security.
        </p>
      </div>

      {/* Device Viewport Simulation Mode */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span>Device Simulation Mode (Responsive Audit)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Switch between native mobile frame, tablet viewport, or fluid desktop preview:
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'mobile', label: 'Mobile (390px)', desc: 'iPhone Frame', icon: Smartphone },
            { id: 'tablet', label: 'Tablet (768px)', desc: 'iPad Frame', icon: Smartphone },
            { id: 'responsive', label: 'Fluid Desktop', desc: 'Auto Responsive', icon: Monitor }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                setDeviceMode(m.id as any);
                success(`Switched to ${m.label}`);
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                deviceMode === m.id
                  ? 'bg-indigo-600/15 border-indigo-500 text-white font-semibold shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <m.icon className={`w-5 h-5 mx-auto mb-1 ${deviceMode === m.id ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div className="text-xs font-bold">{m.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3">
          {[
            { key: 'deadlineReminders', title: 'Task Deadline Alerts', desc: 'Get notified when project tasks are approaching deadline' },
            { key: 'aiSuggestions', title: 'AI Architecture Insights', desc: 'Receive suggestions to optimize schemas and REST APIs' },
            { key: 'milestoneCelebrations', title: 'Milestone Progress', desc: 'Celebrate when you complete project phases and test suites' }
          ].map((item: any) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">{item.title}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{item.desc}</span>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
