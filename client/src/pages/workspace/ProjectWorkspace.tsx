import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckCircle2, Clock, Sparkles, Layers,
  Database as DatabaseIcon, Globe, Layout, Milestone,
  CheckSquare, MessageSquare, Terminal, FileText,
  UploadCloud, Share2, Copy, Check, Plus, Trash2,
  RefreshCw, ExternalLink, Shield, Code, ArrowRight, Play
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { MermaidViewer } from '../../components/common/MermaidViewer';
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  Project, ProjectRequirements, ProjectArchitecture,
  ProjectDatabase, ProjectApis, ProjectUI, ProjectRoadmap,
  Task, TestCase, ProjectDocument
} from '../../types';

export const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requirements' | 'architecture' | 'database' |
    'apis' | 'ui' | 'roadmap' | 'tasks' | 'chat' | 'code' |
    'tests' | 'docs' | 'deployment' | 'portfolio'
  >('overview');

  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Submodule states
  const [requirements, setRequirements] = useState<ProjectRequirements | null>(null);
  const [architecture, setArchitecture] = useState<ProjectArchitecture | null>(null);
  const [database, setDatabase] = useState<ProjectDatabase | null>(null);
  const [apis, setApis] = useState<ProjectApis | null>(null);
  const [uiPlan, setUiPlan] = useState<ProjectUI | null>(null);
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [projectDoc, setProjectDoc] = useState<ProjectDocument | null>(null);
  const [deploymentData, setDeploymentData] = useState<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // Code guidance state
  const [codeStructure, setCodeStructure] = useState('');
  const [selectedModule, setSelectedModule] = useState('Authentication');
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  // New task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<any>('medium');

  // Load project & active tab data
  const fetchProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await api.getProject(projectId);
    if (res.success && res.data) {
      setProject(res.data);
    } else {
      error(res.error?.message || 'Project not found');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Load data for selected tab
  useEffect(() => {
    if (!projectId) return;

    if (activeTab === 'requirements' && !requirements) {
      api.getRequirements(projectId).then(r => r.success && setRequirements(r.data));
    } else if (activeTab === 'architecture' && !architecture) {
      api.getArchitecture(projectId).then(r => r.success && setArchitecture(r.data));
    } else if (activeTab === 'database' && !database) {
      api.getDatabase(projectId).then(r => r.success && setDatabase(r.data));
    } else if (activeTab === 'apis' && !apis) {
      api.getApis(projectId).then(r => r.success && setApis(r.data));
    } else if (activeTab === 'ui' && !uiPlan) {
      api.getUIPlan(projectId).then(r => r.success && setUiPlan(r.data));
    } else if (activeTab === 'roadmap' && !roadmap) {
      api.getRoadmap(projectId).then(r => r.success && setRoadmap(r.data));
    } else if (activeTab === 'tasks') {
      api.getTasks(projectId).then(r => r.success && setTasks(r.data || []));
    } else if (activeTab === 'chat') {
      api.getChat(projectId).then(r => r.success && setChatMessages(r.data || []));
    } else if (activeTab === 'code') {
      api.getCodeStructure(projectId).then(r => r.success && setCodeStructure(r.data?.structure || ''));
      if (!generatedCode) handleGenerateCode('Authentication');
    } else if (activeTab === 'tests') {
      api.getTests(projectId).then(r => r.success && setTestCases(r.data?.testCases || []));
    } else if (activeTab === 'docs' && !projectDoc) {
      api.getDocs(projectId).then(r => r.success && setProjectDoc(r.data));
    } else if (activeTab === 'deployment' && !deploymentData) {
      api.getDeployment(projectId).then(r => r.success && setDeploymentData(r.data));
    }
  }, [activeTab, projectId]);

  // Task actions
  const handleTaskStatusChange = async (taskId: string, newStatus: any) => {
    const res = await api.updateTask(projectId!, taskId, { status: newStatus });
    if (res.success) {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      success('Task updated');
      fetchProjectData(); // recalculate completion
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const res = await api.createTask(projectId!, {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: 'todo'
    });

    if (res.success && res.data) {
      setTasks(prev => [...prev, res.data]);
      setIsTaskModalOpen(false);
      setNewTaskTitle('');
      success('Task created');
      fetchProjectData();
    }
  };

  // Test status action
  const handleTestStatusChange = async (testId: string, status: any) => {
    const res = await api.updateTest(projectId!, testId, { status });
    if (res.success) {
      setTestCases(prev => prev.map(tc => tc._id === testId ? { ...tc, status } : tc));
      success(`Marked test as ${status}`);
      fetchProjectData();
    }
  };

  // AI Chat send
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const query = chatInput.trim();
    setChatInput('');
    setChatSending(true);

    // Optimistic user message
    const tempUserMsg = { id: Date.now().toString(), sender: 'user', content: query, timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, tempUserMsg]);

    const res = await api.sendChat(projectId!, query);
    setChatSending(false);

    if (res.success && res.data) {
      setChatMessages(res.data.conversation);
    } else {
      error('Failed to get AI mentor response');
    }
  };

  // Code generation
  const handleGenerateCode = async (mod: string) => {
    setSelectedModule(mod);
    setCodeLoading(true);
    const res = await api.generateCode(projectId!, mod);
    setCodeLoading(false);
    if (res.success && res.data) {
      setGeneratedCode(res.data);
    }
  };

  // Export Docs
  const handleExport = async (format: 'markdown' | 'json') => {
    const res = await api.exportDocs(projectId!, format);
    if (res.success && res.data) {
      const blob = new Blob([format === 'json' ? JSON.stringify(res.data, null, 2) : res.data.markdown], {
        type: format === 'json' ? 'application/json' : 'text/markdown'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename || `${project?.slug || 'project'}-blueprint.${format === 'json' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success(`Exported ${project?.name} as ${format.toUpperCase()}`);
    }
  };

  if (loading && !project) {
    return (
      <div className="max-w-6xl mx-auto py-8 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!project) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'requirements', label: 'Requirements', icon: CheckSquare },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'database', label: 'Database', icon: DatabaseIcon },
    { id: 'apis', label: 'APIs', icon: Globe },
    { id: 'ui', label: 'UI Screens', icon: Layout },
    { id: 'roadmap', label: 'Roadmap', icon: Milestone },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2, count: tasks.filter(t => t.status !== 'completed').length },
    { id: 'chat', label: 'AI Mentor', icon: MessageSquare, highlight: true },
    { id: 'code', label: 'Starter Code', icon: Terminal },
    { id: 'tests', label: 'Testing', icon: Shield },
    { id: 'docs', label: 'Documentation', icon: FileText },
    { id: 'deployment', label: 'Deployment', icon: UploadCloud },
    { id: 'portfolio', label: 'Portfolio', icon: Share2 }
  ] as const;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Workspace Header Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {project.category}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                {project.complexity?.difficulty}
              </span>
              <span className="text-xs text-slate-400 font-mono">v{project.version}</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-cyan-300/80 font-medium mt-0.5">
              {project.tagline}
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Readiness Gauge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-xs font-mono font-bold text-white">
                {project.completionScore || 0}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold pr-1">Readiness</div>
            </div>

            {/* Export Dropdown */}
            <button
              onClick={() => handleExport('markdown')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Export MD</span>
            </button>

            {/* View Portfolio Live */}
            <Link
              to={`/project/${project.slug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Public Portfolio</span>
              <ExternalLink className="w-3 h-3 text-cyan-200" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation (Horizontal Scrollable for Mobile) */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-800/80 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${'highlight' in tab && (tab as any).highlight && activeTab !== tab.id ? 'text-cyan-400 animate-pulse' : ''}`} />
              <span>{tab.label}</span>
              {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. OVERVIEW TAB */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">The Problem</span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{project.problemStatement}</p>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">The Proposed Solution</span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{project.proposedSolution}</p>
            </div>
          </div>

          {/* Features Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Features Roadmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">MVP (Phase 1)</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {project.features?.mvp?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase">Phase 2 Enhancements</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {project.features?.phase2?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase">Advanced Frontiers</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {project.features?.advanced?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Technology Architecture Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">Technology Stack</h3>
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
                <span className="text-slate-500 block text-[10px] uppercase font-bold">AI / Intelligence</span>
                <span className="font-semibold text-cyan-300 mt-1 block">{project.techStack?.ai?.join(', ') || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. REQUIREMENTS TAB */}
      {/* ============================================================== */}
      {activeTab === 'requirements' && (
        <div className="space-y-6 animate-fade-in">
          {requirements ? (
            <>
              {/* Functional Requirements */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Functional Requirements (FR)</h3>
                  <button
                    onClick={async () => {
                      const res = await api.regenerateRequirements(projectId!);
                      if (res.success) { setRequirements(res.data); success('Requirements updated via AI'); }
                    }}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>AI Regenerate</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {requirements.functional?.map(fr => (
                    <div key={fr.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">{fr.code}</span>
                          <span className="text-sm font-semibold text-white">{fr.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                            {fr.module}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{fr.description}</p>
                      </div>
                      <span className={`self-start text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        fr.priority === 'must_have' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        fr.priority === 'should_have' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {fr.priority.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Stories */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white">User Stories & Acceptance Criteria</h3>
                <div className="space-y-3">
                  {requirements.userStories?.map(us => (
                    <div key={us.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <p className="text-xs sm:text-sm text-slate-200">
                        <strong className="text-indigo-400">As a</strong> {us.asA},{' '}
                        <strong className="text-indigo-400">I want to</strong> {us.iWant},{' '}
                        <strong className="text-indigo-400">so that</strong> {us.soThat}.
                      </p>
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Acceptance Criteria:
                        </span>
                        <ul className="space-y-1">
                          {us.acceptanceCriteria?.map((ac, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{ac}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ARCHITECTURE TAB */}
      {/* ============================================================== */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 animate-fade-in">
          {architecture ? (
            <div className="space-y-6">
              {/* Architecture Switcher Bar */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      setArchitecture({ ...architecture, currentView: 'beginner' });
                      await api.updateArchitecture(projectId!, { currentView: 'beginner' });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      architecture.currentView === 'beginner'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Beginner Architecture (3-Tier)
                  </button>
                  <button
                    onClick={async () => {
                      setArchitecture({ ...architecture, currentView: 'production' });
                      await api.updateArchitecture(projectId!, { currentView: 'production' });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      architecture.currentView === 'production'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Production Cloud Topology
                  </button>
                </div>

                <button
                  onClick={async () => {
                    const res = await api.regenerateArchitecture(projectId!);
                    if (res.success) { setArchitecture(res.data); success('Architecture regenerated'); }
                  }}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-slate-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </div>

              {/* Mermaid Diagram Box */}
              <MermaidViewer
                title={`${architecture.currentView === 'beginner' ? 'Beginner 3-Tier Monolith Flow' : 'Production Cloud Topology Flow'}`}
                chart={
                  architecture.currentView === 'beginner'
                    ? architecture.beginnerArchitecture?.diagramMermaid || 'graph TD; Client --> API;'
                    : architecture.productionArchitecture?.diagramMermaid || 'flowchart TD; Client --> Gateway;'
                }
              />

              {/* Components Cards */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white">System Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(architecture.currentView === 'beginner'
                    ? architecture.beginnerArchitecture?.components
                    : architecture.productionArchitecture?.components
                  )?.map(c => (
                    <div key={c.name} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {c.tech}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{c.description}</p>
                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Responsibilities:</span>
                        <ul className="space-y-0.5">
                          {c.responsibilities?.map((r, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-cyan-400" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. DATABASE TAB */}
      {/* ============================================================== */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-fade-in">
          {database ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Database Engine:</span>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-indigo-600 text-white">
                    {database.databaseType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const nextType = database.databaseType === 'mongodb' ? 'postgresql' : 'mongodb';
                      const res = await api.regenerateDatabase(projectId!, nextType);
                      if (res.success) { setDatabase(res.data); success(`Generated schema for ${nextType}`); }
                    }}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 bg-slate-800 rounded-xl"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Switch to {database.databaseType === 'mongodb' ? 'PostgreSQL' : 'MongoDB'}</span>
                  </button>
                </div>
              </div>

              {/* ER Diagram */}
              {database.diagramMermaid && (
                <MermaidViewer title="Entity Relationship Diagram (ERD)" chart={database.diagramMermaid} />
              )}

              {/* Collections / Tables */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Schemas & Field Definitions ({database.tables?.length})</h3>
                <div className="grid grid-cols-1 gap-4">
                  {database.tables?.map(tbl => (
                    <div key={tbl.name} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-cyan-300 font-mono">{tbl.name}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{tbl.description}</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{tbl.fields?.length} fields</span>
                      </div>

                      {/* Fields Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900/90 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                            <tr>
                              <th className="p-2.5">Field Name</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Key</th>
                              <th className="p-2.5">Required</th>
                              <th className="p-2.5">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {tbl.fields?.map(f => (
                              <tr key={f.name} className="hover:bg-slate-900/40">
                                <td className="p-2.5 font-mono text-indigo-300 font-medium">{f.name}</td>
                                <td className="p-2.5 font-mono text-slate-400">{f.type}</td>
                                <td className="p-2.5">
                                  {f.isPrimary && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">PK</span>}
                                  {f.isForeign && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">FK ({f.references})</span>}
                                </td>
                                <td className="p-2.5 text-slate-400">{f.required ? 'Yes' : 'No'}</td>
                                <td className="p-2.5 text-slate-400">{f.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. APIS TAB */}
      {/* ============================================================== */}
      {activeTab === 'apis' && (
        <div className="space-y-6 animate-fade-in">
          {apis ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">RESTful Endpoints ({apis.endpoints?.length})</h3>
                <button
                  onClick={async () => {
                    const res = await api.regenerateApis(projectId!);
                    if (res.success) { setApis(res.data); success('API specs updated'); }
                  }}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>AI Regenerate</span>
                </button>
              </div>

              <div className="space-y-3">
                {apis.endpoints?.map(ep => (
                  <div key={ep.id} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${
                          ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          ep.method === 'POST' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          ep.method === 'PUT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-100">{ep.path}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ep.authRequired && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 font-mono">
                            Auth Required
                          </span>
                        )}
                        {ep.curlSnippet && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ep.curlSnippet!);
                              success('cURL snippet copied!');
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy cURL</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">{ep.description}</p>

                    {/* Request & Response Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {ep.requestBody && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Request Body (JSON)</span>
                          <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto">
                            {JSON.stringify(ep.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      {ep.responseSuccess && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-1">
                            Response {ep.responseSuccess.status} (Success)
                          </span>
                          <pre className="text-[11px] font-mono text-emerald-300/90 overflow-x-auto">
                            {JSON.stringify(ep.responseSuccess.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. UI SCREENS TAB */}
      {/* ============================================================== */}
      {activeTab === 'ui' && (
        <div className="space-y-6 animate-fade-in">
          {uiPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Mobile-First Screen Blueprints ({uiPlan.screens?.length})</h3>
                <button
                  onClick={async () => {
                    const res = await api.regenerateUIPlan(projectId!);
                    if (res.success) { setUiPlan(res.data); success('UI screens updated'); }
                  }}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>AI Regenerate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uiPlan.screens?.map(scr => (
                  <div key={scr.id} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{scr.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 capitalize">
                        {scr.layoutType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{scr.purpose}</p>

                    {/* Wireframe Layout Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-indigo-400 border-b border-slate-800/80 pb-1">
                        Top Bar: {scr.wireframeLayout?.header}
                      </div>
                      <div className="space-y-1.5 py-1">
                        {scr.wireframeLayout?.sections?.map((sec, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                            <span className="text-xs font-semibold text-slate-200 block">{sec.title}</span>
                            <span className="text-[11px] text-slate-400 block">{sec.details}</span>
                          </div>
                        ))}
                      </div>
                      {scr.wireframeLayout?.bottomNav && (
                        <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-1">
                          Bottom Navigation: {scr.wireframeLayout.bottomNav.join(' | ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. ROADMAP TAB */}
      {/* ============================================================== */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6 animate-fade-in">
          {roadmap ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">8-Phase Implementation Plan</h3>
              <div className="space-y-3">
                {roadmap.phases?.map(p => (
                  <div key={p.phaseNumber} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                          {p.phaseNumber}
                        </span>
                        <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      </div>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {p.estimatedDays} days
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{p.objective}</p>

                    <div className="pt-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Tasks:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.tasks?.map((t, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TASKS TAB (Kanban & List) */}
      {/* ============================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Task Management Board</h3>
              <p className="text-xs text-slate-400">Track execution from backlog to completion.</p>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['todo', 'in_progress', 'testing', 'completed'] as const).map(colStatus => {
              const colTasks = tasks.filter(t => t.status === colStatus);
              const colTitle = colStatus === 'todo' ? 'To Do' :
                               colStatus === 'in_progress' ? 'In Progress' :
                               colStatus === 'testing' ? 'Testing' : 'Completed';

              return (
                <div key={colStatus} className="p-3.5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{colTitle}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {colTasks.map(task => (
                      <div key={task._id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-white leading-snug">{task.title}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                            task.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Status Mover */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                          <select
                            value={task.status}
                            onChange={e => handleTaskStatusChange(task._id, e.target.value)}
                            className="bg-slate-900 text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="testing">Testing</option>
                            <option value="completed">Completed</option>
                          </select>

                          <button
                            onClick={async () => {
                              await api.deleteTask(projectId!, task._id);
                              setTasks(prev => prev.filter(t => t._id !== task._id));
                              success('Task removed');
                            }}
                            className="text-slate-600 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="p-4 text-center rounded-2xl border border-dashed border-slate-800 text-[11px] text-slate-500">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. AI MENTOR CHAT TAB */}
      {/* ============================================================== */}
      {activeTab === 'chat' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">ProjectForge AI Development Assistant</h3>
              <p className="text-[11px] text-slate-400">Contextual mentor loaded with this project's requirements, schema, and stack.</p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'How should I implement authentication?',
              'Explain the database relations',
              'Generate starter FastAPI routes',
              'Why should I use this architecture?'
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => setChatInput(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="min-h-[300px] max-h-[450px] overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            {chatMessages.length > 0 ? (
              chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Ask any question regarding {project.name}. The AI mentor has full context of your architecture.
              </div>
            )}
            {chatSending && (
              <div className="text-xs text-indigo-400 animate-pulse font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Mentor thinking...</span>
              </div>
            )}
          </div>

          {/* Chat Input Box */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a technical or architectural question..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={chatSending}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1"
            >
              <span>Send</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. CODE GUIDANCE TAB */}
      {/* ============================================================== */}
      {activeTab === 'code' && (
        <div className="space-y-6 animate-fade-in">
          {/* Recommended Folder Tree */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span>Recommended Codebase Directory Structure</span>
            </h3>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400/90 whitespace-pre overflow-x-auto leading-relaxed">
              {codeStructure}
            </pre>
          </div>

          {/* Starter Implementation Code */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-white">Starter Code Generator</h3>
              <div className="flex items-center gap-2">
                {['Authentication', 'Core Controller', 'Database Model'].map(mod => (
                  <button
                    key={mod}
                    onClick={() => handleGenerateCode(mod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedModule === mod
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            {codeLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Generating typed starter implementation...</div>
            ) : generatedCode ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-t-2xl">
                  <span className="font-mono text-xs text-cyan-300 font-semibold">{generatedCode.filename}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode.code);
                      success('Starter code copied to clipboard!');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre className="p-4 rounded-b-2xl bg-slate-950 border-x border-b border-slate-800 font-mono text-xs text-slate-200 whitespace-pre overflow-x-auto leading-relaxed">
                  {generatedCode.code}
                </pre>
                <p className="text-xs text-slate-400 italic pt-1">{generatedCode.explanation}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. TESTING CENTER TAB */}
      {/* ============================================================== */}
      {activeTab === 'tests' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Automated QA & Security Test Cases</h3>
            <button
              onClick={async () => {
                const res = await api.regenerateTests(projectId!);
                if (res.success) { setTestCases(res.data); success('Test cases refreshed'); }
              }}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>AI Regenerate</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800 p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
            {testCases.map(tc => (
              <div key={tc._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{tc.testId}</span>
                    <span className="text-xs font-semibold text-white">{tc.scenario}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {tc.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-300">Expected:</strong> {tc.expectedResult}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(['pass', 'fail', 'blocked', 'untested'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleTestStatusChange(tc._id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        tc.status === st
                          ? st === 'pass' ? 'bg-emerald-600 text-white' :
                            st === 'fail' ? 'bg-rose-600 text-white' :
                            st === 'blocked' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 12. DOCUMENTATION TAB */}
      {/* ============================================================== */}
      {activeTab === 'docs' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Project Documentation & README</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('markdown')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow"
              >
                Download README.md
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {projectDoc?.readme || 'No documentation generated yet.'}
            </pre>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 13. DEPLOYMENT TAB */}
      {/* ============================================================== */}
      {activeTab === 'deployment' && (
        <div className="space-y-6 animate-fade-in">
          {deploymentData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deploymentData.platforms?.map((p: any) => (
                  <div key={p.name} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block">{p.badge}</span>
                    <h4 className="text-sm font-bold text-white">{p.name}</h4>
                    <ol className="space-y-2 list-decimal list-inside text-xs text-slate-300">
                      {p.steps?.map((step: string, i: number) => (
                        <li key={i} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              {/* Environment Variables Reference */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">Required Environment Variables (.env)</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Variable Name</th>
                        <th className="p-2.5">Example Value</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {deploymentData.environmentVariables?.map((env: any) => (
                        <tr key={env.name}>
                          <td className="p-2.5 font-mono text-cyan-300 font-bold">{env.name}</td>
                          <td className="p-2.5 font-mono text-slate-400">{env.recommended}</td>
                          <td className="p-2.5 text-slate-300">{env.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : <CardSkeleton />}
        </div>
      )}

      {/* ============================================================== */}
      {/* 14. PORTFOLIO TAB */}
      {/* ============================================================== */}
      {activeTab === 'portfolio' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5 animate-fade-in text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Share2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share Your Engineering Portfolio</h3>
            <p className="text-xs text-slate-400 mt-1">
              Recruiters can inspect your architecture, database schema, APIs, test coverage, and documentation.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-slate-300 truncate">
              {window.location.origin}/project/{project.slug}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/project/${project.slug}`);
                success('Portfolio link copied!');
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
            >
              Copy Link
            </button>
          </div>

          <Link
            to={`/project/${project.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            <span>Preview Public Portfolio Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Project Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement refresh token rotation middleware"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
