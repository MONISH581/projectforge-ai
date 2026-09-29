import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Compass, FolderKanban, Sparkles, User,
  BarChart2, Shield, Settings, Lightbulb
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  if (!user) return null;

  const links = [
    { label: 'Dashboard', icon: Home, to: '/dashboard' },
    { label: 'Project Discovery', icon: Compass, to: '/discover' },
    { label: 'My Projects', icon: FolderKanban, to: '/projects' },
    { label: 'AI Project Generator', icon: Sparkles, to: '/generator', highlight: true },
    { label: 'Skill Intelligence', icon: Lightbulb, to: '/skills' },
    { label: 'Analytics', icon: BarChart2, to: '/analytics' },
    { label: 'Profile', icon: User, to: '/profile' },
    { label: 'Settings', icon: Settings, to: '/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800 bg-slate-950/60 p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        {links.map(item => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`
            }
          >
            <item.icon className={`w-4 h-4 ${item.highlight ? 'text-cyan-400' : ''}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Administration
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-900/80'
                }`
              }
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Admin Console</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Quick Promotion Box */}
      <div className="mt-auto pt-6">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">AI Architect Ready</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Need a production blueprint? Generate schemas, APIs, and roadmap in 30 seconds.
          </p>
          <NavLink
            to="/generator"
            className="mt-2.5 block text-center py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-600/20 transition-all"
          >
            Launch Generator
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
