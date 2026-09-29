import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, FolderKanban, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    { label: 'Home', icon: Home, to: '/dashboard' },
    { label: 'Explore', icon: Compass, to: '/discover' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'AI Forge', icon: Sparkles, to: '/generator' },
    { label: 'Profile', icon: User, to: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 md:hidden safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map(item => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 bg-indigo-500/10' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
