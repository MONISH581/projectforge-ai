import React, { useState, useEffect } from 'react';
import {
  Shield, Users, FolderKanban, Cpu, CheckCircle2,
  AlertTriangle, Search, Plus, Trash2, Star, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CardSkeleton, MetricSkeleton } from '../../components/common/Skeleton';

export const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'projects' | 'technologies' | 'ai'>('overview');
  const [loading, setLoading] = useState(true);

  // Admin Data states
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  // Add Tech Modal
  const [newTech, setNewTech] = useState({ name: '', category: 'programming', description: '', iconName: 'Code', popular: true });
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    const res = await api.getAdminOverview();
    if (res.success && res.data) {
      setOverview(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOverview();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    if (activeSection === 'users') {
      api.getAdminUsers(userSearch).then(r => r.success && setUsers(r.data || []));
    } else if (activeSection === 'projects') {
      api.getAdminProjects().then(r => r.success && setProjects(r.data || []));
    } else if (activeSection === 'technologies') {
      api.getAdminTechnologies().then(r => r.success && setTechnologies(r.data || []));
    } else if (activeSection === 'ai') {
      api.getAdminAiUsage().then(r => r.success && setAiLogs(r.data || []));
    }
  }, [activeSection, userSearch, isAdmin]);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const res = await api.setAdminUserStatus(userId, nextStatus);
    if (res.success) {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: nextStatus } : u));
      success(`User status updated to ${nextStatus}`);
    } else {
      error('Failed to change user status');
    }
  };

  const handleToggleFeaturedProject = async (projectId: string) => {
    const res = await api.toggleAdminFeatureProject(projectId);
    if (res.success && res.data) {
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, isFeatured: res.data.isFeatured } : p));
      success('Project featured status updated');
    }
  };

  const handleCreateTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTech.name.trim()) return;

    const res = await api.createAdminTechnology(newTech);
    if (res.success && res.data) {
      setTechnologies(prev => [...prev, res.data]);
      setIsTechModalOpen(false);
      setNewTech({ name: '', category: 'programming', description: '', iconName: 'Code', popular: true });
      success('Technology catalog entry created');
    }
  };

  const handleDeleteTech = async (id: string) => {
    const res = await api.deleteAdminTechnology(id);
    if (res.success) {
      setTechnologies(prev => prev.filter(t => t._id !== id));
      success('Technology deleted');
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Administrative Access Required</h2>
        <p className="text-xs text-slate-400 mt-1">You must possess administrator privileges to access this console.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Root Level
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            System telemetry, user moderation, platform catalog management, and AI usage monitoring.
          </p>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl scrollbar-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'projects', label: 'Projects' },
            { id: 'technologies', label: 'Technologies' },
            { id: 'ai', label: 'AI Telemetry' }
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeSection === sec.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. OVERVIEW SECTION */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {loading ? (
              <><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /></>
            ) : (
              [
                { label: 'Total Users', value: overview?.metrics?.totalUsers || 0, icon: Users, color: 'text-indigo-400' },
                { label: 'Active Users', value: overview?.metrics?.activeUsers || 0, icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Total Projects', value: overview?.metrics?.totalProjects || 0, icon: FolderKanban, color: 'text-cyan-400' },
                { label: 'AI Requests', value: overview?.metrics?.aiRequests || 0, icon: Cpu, color: 'text-amber-400' }
              ].map(m => (
                <div key={m.label} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{m.label}</span>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="text-xl sm:text-3xl font-extrabold text-white font-mono">{m.value}</div>
                </div>
              ))
            )}
          </div>

          {/* System Health Status Box */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Platform Health & Diagnostics</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Express Server</span>
                <span className="text-emerald-400 font-bold block mt-1">● OPERATIONAL</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Document Store</span>
                <span className="text-emerald-400 font-bold block mt-1">● CONNECTED</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">AI Provider Engine</span>
                <span className="text-emerald-400 font-bold block mt-1">● READY</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Heap Memory</span>
                <span className="text-slate-200 font-bold block mt-1">{overview?.systemHealth?.memoryUsageMb || 0} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white">Registered Platform Users</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search user..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{u.name}</td>
                    <td className="p-3 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.status)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PROJECTS MODERATION */}
      {activeSection === 'projects' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-white">Project Catalog Moderation</h3>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p._id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{p.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.tagline}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFeaturedProject(p._id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      p.isFeatured
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${p.isFeatured ? 'fill-current' : ''}`} />
                    <span>{p.isFeatured ? 'Featured' : 'Feature'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TECHNOLOGIES CATALOG CRUD */}
      {activeSection === 'technologies' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Curated Technologies Catalog</h3>
            <button
              onClick={() => setIsTechModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Technology</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {technologies.map(t => (
              <div key={t._id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <span className="text-[10px] text-slate-500 block uppercase capitalize">{t.category}</span>
                </div>
                <button
                  onClick={() => handleDeleteTech(t._id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AI TELEMETRY */}
      {activeSection === 'ai' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-white">AI Inference Activity Logs</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {aiLogs.map((log: any) => (
                  <tr key={log._id}>
                    <td className="p-3 text-cyan-300 font-medium">{log.type}</td>
                    <td className="p-3 text-slate-300">{log.provider}</td>
                    <td className="p-3 text-slate-400">{log.latencyMs} ms</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        log.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.success ? 'Success' : 'Error'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Technology Modal */}
      {isTechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Technology to Catalog</h3>
            <form onSubmit={handleCreateTech} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SvelteKit, Bun, ChromaDB"
                  value={newTech.name}
                  onChange={e => setNewTech({ ...newTech, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newTech.category}
                  onChange={e => setNewTech({ ...newTech, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="programming">Programming</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="database">Database</option>
                  <option value="ai">AI</option>
                  <option value="mobile">Mobile</option>
                  <option value="cloud_devops">Cloud & DevOps</option>
                  <option value="cybersecurity">Cybersecurity</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTechModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs"
                >
                  Save Technology
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
