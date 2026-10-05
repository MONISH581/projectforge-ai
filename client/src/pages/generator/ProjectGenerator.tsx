import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, AlertTriangle,
  Shield, Brain, CheckCircle2, RefreshCw, Layers, Clock, Users, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ValidationReport } from '../../types';

export const ProjectGenerator: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Wizard state: 'form' | 'generating' | 'validating' | 'result'
  const [stage, setStage] = useState<'form' | 'generating' | 'validating' | 'result'>('form');
  const [activeStep, setActiveStep] = useState(1);

  // Form Inputs
  const [formData, setFormData] = useState({
    goal: '',
    domain: 'AI & Machine Learning',
    experienceLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    duration: '1 month',
    teamSize: 'Solo',
    platform: 'Web & AI',
    objective: 'Portfolio',
    preferredTech: ''
  });

  // Generation & Validation Results
  const [generationSteps, setGenerationSteps] = useState([
    { label: 'Analyzing technical skills and background', done: false },
    { label: 'Formulating problem statement & target personas', done: false },
    { label: 'Synthesizing dual system architecture', done: false },
    { label: 'Generating schema contracts & API endpoints', done: false },
    { label: 'Assembling 8-phase engineering roadmap', done: false },
  ]);

  const [generatedProject, setGeneratedProject] = useState<any>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const domains = [
    'AI & Machine Learning', 'Web Development', 'Mobile Development',
    'Cybersecurity', 'FinTech', 'Healthcare Tech', 'Sustainability & Green',
    'Social Impact', 'EdTech', 'DevTools & Productivity'
  ];

  const platforms = [
    'Web Application', 'Mobile App (iOS/Android)', 'Full-Stack (Web + Mobile)',
    'AI / ML Service API', 'Cloud Microservices', 'CLI / Developer Tool'
  ];

  const objectives = [
    'Portfolio Showcase', 'Academic Capstone', 'Hackathon MVP', 'Startup Prototype', 'Deep Learning'
  ];

  const runGenerationPipeline = async () => {
    if (!formData.goal.trim()) {
      error('Please describe what you want to build or solve.');
      return;
    }

    setStage('generating');
    setGenerationSteps(prev => prev.map(s => ({ ...s, done: false })));

    // Animate step progression concurrently while awaiting AI generation
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < generationSteps.length) {
        setGenerationSteps(prev => prev.map((s, idx) => idx <= stepIndex ? { ...s, done: true } : s));
        stepIndex++;
      }
    }, 350);

    try {
      // 1. Generate structured project proposal concurrently
      const genRes = await api.generateProjectAI(formData);
      clearInterval(interval);
      setGenerationSteps(prev => prev.map(s => ({ ...s, done: true })));

      if (!genRes.success || !genRes.data?.project) {
        throw new Error(genRes.error?.message || 'Generation failed');
      }

      const project = genRes.data.project;
      setGeneratedProject(project);

      // 2. Automatically run Validation Engine
      setStage('validating');
      const valRes = await api.validateProjectAI(project);
      if (valRes.success && valRes.data?.validation) {
        setValidationReport(valRes.data.validation);
      }

      setStage('result');
    } catch (err: any) {
      clearInterval(interval);
      error(err.message || 'AI Generation encountered an issue. Please try again.');
      setStage('form');
    }
  };

  const handleAcceptProject = async () => {
    if (!generatedProject) return;

    setIsAccepting(true);
    try {
      const res = await api.acceptProjectAI(generatedProject);
      setIsAccepting(false);

      if (res.success && res.data?.projectId) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        success(`Project "${generatedProject.name}" Accepted!`, 'Workspace fully populated with requirements, architecture, database, and tasks.');
        navigate(`/workspace/${res.data.projectId}`);
      } else {
        error(res.error?.message || 'Failed to accept project');
      }
    } catch (err: any) {
      setIsAccepting(false);
      error(err.message || 'Error initializing project workspace');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* 1. STAGE: FORM INPUTS */}
      {stage === 'form' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Step AI Architect</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              What do you want to build?
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Give us a rough seed idea or challenge. We’ll design the full production architecture, database, APIs, and roadmap.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
            {/* Seed Idea Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Project Goal or Idea Concept
              </label>
              <textarea
                rows={3}
                required
                value={formData.goal}
                onChange={e => setFormData({ ...formData, goal: e.target.value })}
                placeholder="e.g. AI-powered clinical prescription reader for senior patients with dosage audio reminders..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none leading-relaxed"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500">Quick ideas:</span>
                {[
                  'Campus peer textbook lending',
                  'AI carbon footprint receipt scanner',
                  'Real-time collaborative code review'
                ].map(idea => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setFormData({ ...formData, goal: idea })}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Industry Domain
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {domains.map(dom => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setFormData({ ...formData, domain: dom })}
                    className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all truncate ${
                      formData.domain === dom
                        ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, experienceLevel: lvl })}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        formData.experienceLevel === lvl
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Target Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="1 week">1 week (Rapid MVP)</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month (Standard)</option>
                  <option value="2 months">2 months</option>
                  <option value="3+ months">3+ months (Capstone)</option>
                </select>
              </div>
            </div>

            {/* Platform & Objective */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Target Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={e => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Primary Objective
                </label>
                <select
                  value={formData.objective}
                  onChange={e => setFormData({ ...formData, objective: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {objectives.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Preferred Tech (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Technology Preferences (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Must include FastAPI and Tailwind; or leave empty for AI recommendation"
                value={formData.preferredTech}
                onChange={e => setFormData({ ...formData, preferredTech: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="button"
              onClick={runGenerationPipeline}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Generate Project Architecture & Validate</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. STAGE: GENERATING & VALIDATING (Live Progress Stages) */}
      {(stage === 'generating' || stage === 'validating') && (
        <div className="py-12 px-4 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/30">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
            {stage === 'generating' ? 'Synthesizing Architecture' : 'Running Validation Engine'}
          </h2>
          <p className="text-xs text-slate-400 mb-8">
            Please wait while the AI Architect designs your full project specification.
          </p>

          <div className="space-y-3 text-left p-5 rounded-2xl bg-slate-900 border border-slate-800">
            {generationSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 animate-pulse'
                }`}>
                  {step.done ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </div>
                <span className={`text-xs ${step.done ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. STAGE: RESULT & VALIDATION REPORT */}
      {stage === 'result' && generatedProject && (
        <div className="space-y-6">
          {/* Project Identity Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {generatedProject.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  {generatedProject.complexity?.difficulty}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {generatedProject.complexity?.estimatedDuration}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {generatedProject.name}
            </h1>
            <p className="text-sm sm:text-base text-cyan-300/90 font-medium">
              &ldquo;{generatedProject.tagline}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {generatedProject.detailedDescription}
            </p>

            {/* Problem & Solution Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  The Problem
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {generatedProject.problemStatement}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  The Solution
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {generatedProject.proposedSolution}
                </p>
              </div>
            </div>

            {/* Tech Stack Tags */}
            <div className="pt-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Proposed Tech Architecture
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(generatedProject.techStack?.frontend || []),
                  ...(generatedProject.techStack?.backend || []),
                  ...(generatedProject.techStack?.database || []),
                  ...(generatedProject.techStack?.ai || [])
                ].map((tech: string) => (
                  <span key={tech} className="px-3 py-1 rounded-xl text-xs font-mono bg-slate-950 text-indigo-300 border border-slate-800">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Validation Engine Findings */}
          {validationReport && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">AI Project Validation Report</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Feasibility:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {validationReport.feasibilityScore}%
                  </span>
                </div>
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Project Strengths</span>
                  </span>
                  <ul className="space-y-1.5">
                    {validationReport.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Risks & Scope Watchouts</span>
                  </span>
                  <ul className="space-y-1.5">
                    {validationReport.risks.map((risk, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* MVP Recommendation Callout */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Architect's MVP Recommendation
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {validationReport.mvpRecommendation}
                </p>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStage('form')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Modify Inputs & Regenerate</span>
            </button>

            <button
              type="button"
              disabled={isAccepting}
              onClick={handleAcceptProject}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              {isAccepting ? (
                <span>Assembling Full Workspace...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Accept Project & Build (14 Modules)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
