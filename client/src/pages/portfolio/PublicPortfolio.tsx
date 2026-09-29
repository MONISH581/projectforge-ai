import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles, ExternalLink, Github, Heart, Share2,
  Check, Layers, FileCode, CheckCircle2, User, School, ArrowLeft
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { MermaidViewer } from '../../components/common/MermaidViewer';
import { CardSkeleton } from '../../components/common/Skeleton';

export const PublicPortfolio: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    if (!slug) return;
    const fetchPortfolio = async () => {
      setLoading(true);
      const res = await api.getPortfolio(slug);
      if (res.success && res.data) {
        setData(res.data);
        setLikes(res.data.portfolioMeta?.metrics?.likes || 0);
      }
      setLoading(false);
    };
    fetchPortfolio();
  }, [slug]);

  const handleLike = async () => {
    if (hasLiked || !slug) return;
    setLikes(prev => prev + 1);
    setHasLiked(true);
    await api.likePortfolio(slug);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
        <CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  if (!data || !data.project) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Portfolio Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">This project portfolio may be set to private or does not exist.</p>
        <Link to="/" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold text-white">
          Back to Home
        </Link>
      </div>
    );
  }

  const { project, developer, architecture, taskStats, testStats, portfolioMeta } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Built with ProjectForge AI</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                success('Portfolio link copied!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                hasLiked
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {project.category}
            </span>
            <span className="text-xs font-mono text-slate-400">{project.complexity?.difficulty}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm sm:text-lg text-cyan-300 font-medium">
            {project.tagline}
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {project.detailedDescription}
          </p>

          {/* External Links: GitHub & Live Demo */}
          <div className="flex items-center gap-3 pt-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>Source Code</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
              >
                <span>Live Interactive Demo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Developer Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={developer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={developer.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Lead Architect & Engineer</span>
              <h3 className="text-base font-bold text-white">{developer.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                <span>{developer.college} &bull; {developer.degree}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="text-center p-2 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-bold text-emerald-400">{taskStats.completed} / {taskStats.total}</div>
              <div className="text-[10px] text-slate-500">Tasks Completed</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-bold text-cyan-400">{testStats.passed} / {testStats.total}</div>
              <div className="text-[10px] text-slate-500">Tests Passing</div>
            </div>
          </div>
        </div>

        {/* Problem vs Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">The Problem</span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{project.problemStatement}</p>
          </div>
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">The Solution</span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{project.proposedSolution}</p>
          </div>
        </div>

        {/* Architecture Diagram */}
        {architecture && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>System Architecture</span>
            </h3>
            <MermaidViewer title="Architecture Data Flow" chart={architecture.diagramMermaid} />
          </div>
        )}

        {/* Technology Stack Grid */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white">Full Technology Stack</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Frontend</span>
              <span className="font-semibold text-slate-200 mt-1 block">{project.techStack?.frontend?.join(', ') || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Backend</span>
              <span className="font-semibold text-slate-200 mt-1 block">{project.techStack?.backend?.join(', ') || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Database</span>
              <span className="font-semibold text-slate-200 mt-1 block">{project.techStack?.database?.join(', ') || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">AI Engine</span>
              <span className="font-semibold text-cyan-300 mt-1 block">{project.techStack?.ai?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-slate-800 text-xs text-slate-500">
          Crafted with <strong className="text-slate-300">ProjectForge AI</strong> &bull; Turn your skills and ideas into projects you can actually build.
        </div>
      </div>
    </div>
  );
};
