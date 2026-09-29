import React, { useState, useEffect } from 'react';
import {
  BarChart2, CheckCircle2, TrendingUp, Cpu,
  Layers, Clock, Shield
} from 'lucide-react';
import { api } from '../../api/client';
import { MetricSkeleton } from '../../components/common/Skeleton';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res = await api.getAnalytics();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const summary = data?.summary;
  const taskStatus = data?.taskStatusCounts;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-indigo-400" />
          <span>Productivity & Build Analytics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Measurable execution metrics tracking your student software portfolio progress.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /></>
        ) : (
          [
            { label: 'Task Velocity', value: `${summary?.taskCompletionRate || 0}%`, sub: 'Completion Rate', color: 'text-emerald-400' },
            { label: 'Active Projects', value: summary?.inDevelopmentProjects || 0, sub: 'In Progress', color: 'text-indigo-400' },
            { label: 'Test Pass Rate', value: summary?.totalTestCases > 0 ? `${Math.round((summary.testsPassed / summary.totalTestCases) * 100)}%` : '100%', sub: 'QA Verified', color: 'text-cyan-400' },
            { label: 'AI Inferences', value: summary?.aiGenerationsCount || 0, sub: 'Architecture Generates', color: 'text-amber-400' }
          ].map(m => (
            <div key={m.label} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{m.label}</span>
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${m.color}`}>{m.value}</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{m.sub}</span>
            </div>
          ))
        )}
      </div>

      {/* Task Distribution Card */}
      {taskStatus && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <span>Task Execution Breakdown</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'To Do', count: taskStatus.todo, color: 'bg-slate-800 text-slate-300' },
              { label: 'In Progress', count: taskStatus.in_progress, color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
              { label: 'Testing', count: taskStatus.testing, color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
              { label: 'Completed', count: taskStatus.completed, color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' }
            ].map(col => (
              <div key={col.label} className={`p-4 rounded-2xl ${col.color} text-center`}>
                <div className="text-2xl font-bold font-mono">{col.count}</div>
                <div className="text-[11px] font-semibold uppercase mt-0.5">{col.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Distribution */}
      {data?.categoryCounts && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Project Categories Distribution</span>
          </h3>
          <div className="space-y-2">
            {Object.entries(data.categoryCounts).map(([cat, count]: any) => (
              <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">{cat}</span>
                <span className="font-mono text-indigo-400 font-bold">{count} {count === 1 ? 'project' : 'projects'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
