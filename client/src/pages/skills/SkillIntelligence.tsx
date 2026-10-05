import React, { useState, useEffect } from 'react';
import {
  Sparkles, Plus, Trash2, Edit2, Check,
  BarChart3, Lightbulb, Target, Shield, CheckCircle2, AlertCircle, Radar
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Skill } from '../../types';

// Interactive SVG Skill Radar Polygon
const SkillRadarChart: React.FC<{
  data: { category: string; displayName: string; score: number }[];
}> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const size = 280;
  const center = size / 2;
  const radius = 95;
  const angleStep = (2 * Math.PI) / data.length;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (Math.max(10, d.score) / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  });

  const polygonPath = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[260px] h-auto overflow-visible select-none"
      >
        <defs>
          <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {levels.map((lvl, idx) => {
          const gridPoints = data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = lvl * radius;
            return `${(center + r * Math.cos(angle)).toFixed(1)},${(center + r * Math.sin(angle)).toFixed(1)}`;
          }).join(' ');

          return (
            <polygon
              key={idx}
              points={gridPoints}
              fill="none"
              stroke="#334155"
              strokeDasharray={lvl < 1 ? '2 2' : 'none'}
              strokeWidth={lvl === 1 ? '1.5' : '1'}
              opacity={0.5}
            />
          );
        })}

        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#334155"
              strokeWidth="1"
              opacity={0.4}
            />
          );
        })}

        <polygon
          points={polygonPath}
          fill="url(#radarFillGrad)"
          stroke="#38bdf8"
          strokeWidth="2"
          className="transition-all duration-500 ease-out"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="transition-all duration-500"
          />
        ))}

        {data.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 20;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="600"
              fill="#94a3b8"
              className="font-mono"
            >
              {d.displayName.split(' ')[0]}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const SkillIntelligence: React.FC = () => {

  const [skillsData, setSkillsData] = useState<{
    skills: Skill[];
    radarData: { category: string; displayName: string; score: number; skillCount: number }[];
    strengths: string[];
    gaps: string[];
    careerGoal: string;
    recommendation: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'programming' as const,
    level: 'intermediate' as const,
    yearsExperience: 1,
    confidenceScore: 70
  });

  const { success, error } = useToast();

  const fetchSkills = async () => {
    setLoading(true);
    const res = await api.getSkills();
    if (res.success && res.data) {
      setSkillsData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    const res = await api.addSkill(newSkill);
    if (res.success) {
      success(`Added skill: ${newSkill.name}`);
      setIsAddModalOpen(false);
      setNewSkill({ name: '', category: 'programming', level: 'intermediate', yearsExperience: 1, confidenceScore: 70 });
      fetchSkills();
    } else {
      error(res.error?.message || 'Failed to add skill');
    }
  };

  const handleDeleteSkill = async (id: string, name: string) => {
    const res = await api.deleteSkill(id);
    if (res.success) {
      success(`Removed skill: ${name}`);
      fetchSkills();
    } else {
      error('Failed to remove skill');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Skill Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              AI Analysis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Map your competencies, identify gap areas, and align project complexity with your career aspirations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* AI Recommendation Banner */}
      {skillsData && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-cyan-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                Target Role: {skillsData.careerGoal}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed font-medium">
                {skillsData.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Skill Radar Breakdown + Strengths & Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Proficiency Meters (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Category Proficiency Distribution</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {skillsData?.radarData.map(cat => (
                <div key={cat.category} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.displayName}</span>
                    <span className="font-mono text-indigo-400 font-bold">{cat.score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        cat.score >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                        cat.score >= 50 ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' :
                        'bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(5, cat.score)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {cat.skillCount} {cat.skillCount === 1 ? 'skill registered' : 'skills registered'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Skill Cards */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Registered Skills ({skillsData?.skills.length || 0})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skillsData?.skills.map(skill => (
                <div key={skill._id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{skill.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-slate-800 text-slate-300">
                        {skill.level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {skill.yearsExperience} {skill.yearsExperience === 1 ? 'yr' : 'yrs'} exp &bull; Category: <span className="capitalize">{skill.category.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-indigo-400">{skill.confidenceScore}%</div>
                      <div className="text-[10px] text-slate-500">Confidence</div>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(skill._id, skill.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Radar Chart + Strengths & Growth Areas */}
        <div className="space-y-4">
          {skillsData?.radarData && (
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radar className="w-5 h-5 text-cyan-400" />
                <span>Skill Competency Radar</span>
              </h3>
              <SkillRadarChart data={skillsData.radarData} />
            </div>
          )}

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Identified Strengths</span>
            </h3>
            {skillsData?.strengths && skillsData.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsData.strengths.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Increase confidence scores on your top skills to register strengths.</p>
            )}
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>Recommended Skill Bridges</span>
            </h3>
            {skillsData?.gaps && skillsData.gaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsData.gaps.map(g => (
                  <span key={g} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {g}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">All registered skills meet solid baseline proficiency!</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Technical Skill</h3>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js, Rust, Redis"
                  value={newSkill.name}
                  onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newSkill.category}
                  onChange={e => setNewSkill({ ...newSkill, category: e.target.value as any })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Level</label>
                  <select
                    value={newSkill.level}
                    onChange={e => setNewSkill({ ...newSkill, level: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Years Exp</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={newSkill.yearsExperience}
                    onChange={e => setNewSkill({ ...newSkill, yearsExperience: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Confidence</span>
                  <span className="font-mono text-indigo-400">{newSkill.confidenceScore}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={newSkill.confidenceScore}
                  onChange={e => setNewSkill({ ...newSkill, confidenceScore: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
