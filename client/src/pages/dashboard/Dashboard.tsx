import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Compass, FolderKanban, ArrowRight,
  CheckCircle2, Clock, Flame, Lightbulb,
  Plus, Check, ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { MetricSkeleton, CardSkeleton } from '../../components/common/Skeleton';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success && res.data) {
        setStatsData(res.data);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentProject = statsData?.currentProject?.project;
  const progressScore = statsData?.currentProject?.progress || 0;
  const nextTask = statsData?.currentProject?.nextTask;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Welcome & Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Project Architect</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-indigo-200 via-cyan-200 to-white bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Turn your skills and ideas into production-ready software. Discover architecture, schemas, and step-by-step tasks.
          </p>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <Link
              to="/generator"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Generate Project</span>
            </Link>
            <Link
              to="/discover"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              <span>Explore Ideas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <>
            <MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton />
          </>
        ) : (
          [
            { label: 'Projects Created', value: statsData?.stats?.projectsCreated ?? 0, icon: FolderKanban, color: 'text-indigo-400' },
            { label: 'Active Builds', value: statsData?.stats?.activeProjects ?? 0, icon: Flame, color: 'text-amber-400' },
            { label: 'Tasks Completed', value: statsData?.stats?.tasksCompleted ?? 0, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Completed Projects', value: statsData?.stats?.projectsCompleted ?? 0, icon: Sparkles, color: 'text-cyan-400' }
          ].map(stat => (
            <div key={stat.label} className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium tracking-wide uppercase">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-white font-mono">{stat.value}</div>
            </div>
          ))
        )}
      </div>

      {/* 3. Main Split: Current Active Project & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Project Spotlight (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-400" />
              <span>Current Project</span>
            </h2>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View all projects &rarr;
            </Link>
          </div>

          {loading ? (
            <CardSkeleton />
          ) : currentProject ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {currentProject.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                      {currentProject.complexity?.difficulty}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {currentProject.complexity?.estimatedDuration}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{currentProject.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {currentProject.tagline || currentProject.oneLineDescription}
                  </p>
                </div>

                {/* Readiness Score Progress Meter */}
                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-indigo-500 transition-all duration-1000 ease-out"
                        strokeDasharray={`${progressScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-mono font-bold text-white">{progressScore}%</span>
                  </div>
                  <div className="pr-2">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Readiness</div>
                    <div className="text-xs font-bold text-emerald-400">
                      {progressScore >= 80 ? 'Production Ready' : progressScore >= 50 ? 'In Development' : 'Planning'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  ...(currentProject.techStack?.frontend || []),
                  ...(currentProject.techStack?.backend || []),
                  ...(currentProject.techStack?.database || [])
                ].slice(0, 5).map((tech: string) => (
                  <span key={tech} className="text-xs bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Next Action Item Box */}
              {nextTask ? (
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                      Next Engineering Task
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate block">
                      {nextTask.title}
                    </span>
                  </div>
                  <Link
                    to={`/workspace/${currentProject._id}`}
                    className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Execute</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-medium">All preliminary tasks completed! Ready for testing & portfolio generation.</span>
                  <Link to={`/workspace/${currentProject._id}`} className="text-xs font-bold text-emerald-400 underline">
                    Open Workspace
                  </Link>
                </div>
              )}

              {/* Workspace Navigation CTA */}
              <div className="flex items-center justify-end pt-2">
                <Link
                  to={`/workspace/${currentProject._id}`}
                  className="w-full sm:w-auto text-center py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Open Full Project Workspace (14 Modules)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">No Active Project Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Discover a project matching your skills, or generate one in 30 seconds.
                </p>
              </div>
              <Link
                to="/generator"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Your First Project</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: AI Skill Insights & Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>AI Skill Recommendations</span>
          </h2>

          <div className="space-y-3">
            {statsData?.recommendations?.map((rec: string, index: number) => (
              <div key={index} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                </div>
              </div>
            ))}

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
              <h4 className="text-xs font-bold text-slate-200 mb-1">Explore Skill Radar</h4>
              <p className="text-[11px] text-slate-400 mb-3">
                See your technical proficiency breakdown and identify high-value areas to learn next.
              </p>
              <Link
                to="/skills"
                className="block text-center py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition-colors"
              >
                View Skill Intelligence &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
