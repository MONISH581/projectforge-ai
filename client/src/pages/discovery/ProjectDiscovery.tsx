import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Search, Sparkles, Clock, Users,
  ArrowRight, Check, X
} from 'lucide-react';
import { api } from '../../api/client';
import { CardSkeleton } from '../../components/common/Skeleton';
import { Project } from '../../types';

export const ProjectDiscovery: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const categories = [
    'all', 'AI & Machine Learning', 'Web Development', 'Mobile Development',
    'Cybersecurity', 'FinTech', 'Healthcare Tech', 'Sustainability & Green', 'Social Impact'
  ];

  const fetchDiscoveryProjects = async () => {
    setLoading(true);
    const res = await api.discoverProjects({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
      search: searchTerm.trim() || undefined
    });

    if (res.success && res.data) {
      setProjects(res.data.projects || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscoveryProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedDifficulty]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Project Discovery</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Marketplace
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore validated project architectures tailored to your skill strengths and career target.
        </p>
      </div>

      {/* Filters & Search Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by keyword, technology, or problem..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-300 focus:outline-none shrink-0"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Domains' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {projects.map(p => (
            <div
              key={p._id}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg group"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {p.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                      {p.complexity?.difficulty}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {p.complexity?.estimatedDuration}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                  {p.tagline || p.oneLineDescription}
                </p>

                {/* Skill Match Highlight Badge */}
                {p.skillMatch && p.skillMatch.count > 0 && (
                  <div className="mt-3 p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{p.skillMatch.explanation}</span>
                  </div>
                )}

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {[
                    ...(p.techStack?.frontend || []),
                    ...(p.techStack?.backend || []),
                    ...(p.techStack?.database || [])
                  ].slice(0, 4).map(tech => (
                    <span key={tech} className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {p.complexity?.teamSize}
                </span>

                <Link
                  to={`/workspace/${p._id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-all"
                >
                  <span>Explore Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No projects found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search terms or generate a custom project with our AI wizard.
          </p>
          <Link
            to="/generator"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Custom Project</span>
          </Link>
        </div>
      )}
    </div>
  );
};
