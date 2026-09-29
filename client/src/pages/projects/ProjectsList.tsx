import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Plus, Clock, ArrowRight,
  Sparkles, Trash2, CheckCircle2
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { CardSkeleton } from '../../components/common/Skeleton';
import { Project } from '../../types';

export const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchUserProjects = async () => {
    setLoading(true);
    const res = await api.getProjects();
    if (res.success && res.data) {
      setProjects(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserProjects();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}" and all its workspace data?`)) {
      return;
    }

    const res = await api.deleteProject(id);
    if (res.success) {
      success(`Project "${name}" deleted`);
      fetchUserProjects();
    } else {
      error(res.error?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">My Projects</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {projects.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your project architectures, track development tasks, and export documentation.
          </p>
        </div>

        <Link
          to="/generator"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton /><CardSkeleton />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {projects.map(p => (
            <Link
              key={p._id}
              to={`/workspace/${p._id}`}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg group block"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                      {p.complexity?.difficulty}
                    </span>
                  </div>

                  {/* Readiness Score */}
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-400">
                    <span>{p.completionScore || 0}%</span>
                    <span className="text-[10px] text-slate-500 font-normal">Ready</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {p.tagline || p.oneLineDescription}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {[
                    ...(p.techStack?.frontend || []),
                    ...(p.techStack?.backend || [])
                  ].slice(0, 4).map(t => (
                    <span key={t} className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {p.complexity?.estimatedDuration}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => handleDelete(e, p._id, p.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Projects Created Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Generate your first software architecture blueprint with AI.
          </p>
          <Link
            to="/generator"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Project</span>
          </Link>
        </div>
      )}
    </div>
  );
};
