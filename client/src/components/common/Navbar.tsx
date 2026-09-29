import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Search, Bell, Smartphone, Tablet, Monitor,
  LogOut, User as UserIcon, Shield, Settings,
  Check, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDevicePreview } from '../../context/DevicePreviewContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { deviceMode, setDeviceMode } = useDevicePreview();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications if user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await api.searchGlobal(searchQuery.trim());
      setIsSearching(false);
      if (res.success) {
        setSearchResults(res.data);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    info('All notifications marked as read');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              ProjectForge<span className="text-cyan-400 ml-0.5">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono -mt-1 hidden xs:block">Turn skills into projects</span>
          </div>
        </Link>

        {/* Global Search Bar */}
        {user && (
          <div className="relative flex-1 max-w-md mx-2" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects, tasks, tech..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-8 py-1.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && (searchResults || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 max-h-96 overflow-y-auto animate-fade-in">
                {isSearching ? (
                  <div className="py-4 text-center text-xs text-slate-400">Searching ProjectForge catalog...</div>
                ) : searchResults && searchResults.total > 0 ? (
                  <div className="space-y-3">
                    {/* Projects Section */}
                    {searchResults.projects?.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Projects</div>
                        <div className="space-y-1">
                          {searchResults.projects.map((p: any) => (
                            <Link
                              key={p._id}
                              to={`/workspace/${p._id}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="block p-2 rounded-lg hover:bg-slate-800/80 transition-colors"
                            >
                              <div className="text-xs font-medium text-slate-200">{p.name}</div>
                              <div className="text-[11px] text-slate-400 truncate">{p.tagline}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technologies Section */}
                    {searchResults.technologies?.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Technologies</div>
                        <div className="flex flex-wrap gap-1.5">
                          {searchResults.technologies.map((t: any) => (
                            <span key={t._id} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">No matching projects or skills found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Device Simulator Mode Switcher */}
          <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5" title="Switch Viewport Preview Mode">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                deviceMode === 'mobile' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile Phone Viewport (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px]">Mobile</span>
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                deviceMode === 'tablet' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tablet Viewport (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tablet</span>
            </button>
            <button
              onClick={() => setDeviceMode('responsive')}
              className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                deviceMode === 'responsive' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Responsive View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[11px]">Fluid</span>
            </button>
          </div>

          {user ? (
            <>
              {/* Notifications Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-100">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto mt-2">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n._id} className={`py-2.5 px-1 flex gap-3 items-start ${!n.read ? 'bg-indigo-950/20 rounded-lg' : ''}`}>
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-indigo-500" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-200">{n.title}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400">No new notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <div className="text-xs font-semibold text-slate-100 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                          Administrator
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Student Profile
                      </Link>
                      <Link
                        to="/skills"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Skill Intelligence
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:bg-amber-950/30 rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          Admin Console
                        </Link>
                      )}
                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
