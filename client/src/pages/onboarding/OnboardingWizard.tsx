import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Plus, Trash2,
  Code2, Layout, Server, Database, Brain, Smartphone,
  Cloud, Shield, Target, Compass
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const OnboardingWizard: React.FC = () => {
  const { user, profile, setOnboarded } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [studentInfo, setStudentInfo] = useState({
    college: profile?.college || 'Massachusetts Institute of Technology',
    degree: profile?.degree || 'B.S. Computer Science',
    department: profile?.department || 'Computer Science & Engineering',
    currentYear: profile?.currentYear || '3rd Year',
    experienceLevel: (profile?.experienceLevel || 'intermediate') as 'beginner' | 'intermediate' | 'advanced',
  });

  // Curated skills library for quick toggle
  const availableSkills = [
    // Programming
    { name: 'Python', category: 'programming' as const, icon: Code2 },
    { name: 'TypeScript', category: 'programming' as const, icon: Code2 },
    { name: 'JavaScript', category: 'programming' as const, icon: Code2 },
    { name: 'Java', category: 'programming' as const, icon: Code2 },
    { name: 'C++', category: 'programming' as const, icon: Code2 },
    { name: 'Go', category: 'programming' as const, icon: Code2 },
    // Frontend
    { name: 'React', category: 'frontend' as const, icon: Layout },
    { name: 'Next.js', category: 'frontend' as const, icon: Layout },
    { name: 'Tailwind CSS', category: 'frontend' as const, icon: Layout },
    { name: 'Vue.js', category: 'frontend' as const, icon: Layout },
    // Backend
    { name: 'Node.js', category: 'backend' as const, icon: Server },
    { name: 'Express.js', category: 'backend' as const, icon: Server },
    { name: 'FastAPI', category: 'backend' as const, icon: Server },
    { name: 'Django', category: 'backend' as const, icon: Server },
    // Database
    { name: 'MongoDB', category: 'database' as const, icon: Database },
    { name: 'PostgreSQL', category: 'database' as const, icon: Database },
    { name: 'MySQL', category: 'database' as const, icon: Database },
    { name: 'Firebase', category: 'database' as const, icon: Database },
    { name: 'Redis', category: 'database' as const, icon: Database },
    // AI
    { name: 'Gemini API', category: 'ai' as const, icon: Brain },
    { name: 'OpenAI GPT-4', category: 'ai' as const, icon: Brain },
    { name: 'Machine Learning', category: 'ai' as const, icon: Brain },
    { name: 'Computer Vision', category: 'ai' as const, icon: Brain },
    // Mobile
    { name: 'Flutter', category: 'mobile' as const, icon: Smartphone },
    { name: 'React Native', category: 'mobile' as const, icon: Smartphone },
    // Cloud & DevOps
    { name: 'Docker', category: 'cloud_devops' as const, icon: Cloud },
    { name: 'AWS', category: 'cloud_devops' as const, icon: Cloud },
    // Cybersecurity
    { name: 'Web Security (OWASP)', category: 'cybersecurity' as const, icon: Shield },
  ];

  const [selectedSkills, setSelectedSkills] = useState<Array<{
    name: string;
    category: any;
    level: 'beginner' | 'intermediate' | 'advanced';
    yearsExperience: number;
    confidenceScore: number;
  }>>([
    { name: 'Python', category: 'programming', level: 'advanced', yearsExperience: 2, confidenceScore: 85 },
    { name: 'React', category: 'frontend', level: 'intermediate', yearsExperience: 1.5, confidenceScore: 75 },
    { name: 'MongoDB', category: 'database', level: 'beginner', yearsExperience: 1, confidenceScore: 60 }
  ]);

  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState<any>('programming');

  // Step 3: Interests
  const domainInterests = [
    'AI & Machine Learning', 'Web Development', 'Mobile Apps', 'Cybersecurity',
    'FinTech & Payments', 'Healthcare & Biotech', 'Sustainability & Climate',
    'EdTech & Learning', 'Social Impact', 'Productivity & DevTools',
    'Campus Technology', 'E-commerce & Marketplaces', 'IoT & Hardware'
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'AI & Machine Learning', 'Web Development', 'Sustainability & Climate'
  ]);

  // Step 4: Career Goals
  const careerOptions = [
    'Full Stack Developer', 'AI / ML Engineer', 'Software Engineer',
    'Mobile Application Developer', 'Cloud & DevOps Engineer',
    'Data Scientist', 'Cybersecurity Engineer', 'Startup Founder'
  ];
  const [careerGoal, setCareerGoal] = useState('Full Stack AI Engineer');

  // Step 5: Preferences
  const [preferences, setPreferences] = useState({
    preferredTeamSize: 'solo' as 'solo' | 'team' | 'any',
    targetDuration: '1_month' as '1_week' | '2_weeks' | '1_month' | '2_months' | '3_plus_months',
    preferredPlatforms: ['Web', 'AI'],
    projectObjective: 'portfolio' as 'academic' | 'portfolio' | 'hackathon' | 'startup' | 'learning'
  });

  const toggleSkill = (skill: typeof availableSkills[0]) => {
    const exists = selectedSkills.find(s => s.name === skill.name);
    if (exists) {
      setSelectedSkills(prev => prev.filter(s => s.name !== skill.name));
    } else {
      setSelectedSkills(prev => [
        ...prev,
        {
          name: skill.name,
          category: skill.category,
          level: 'intermediate',
          yearsExperience: 1,
          confidenceScore: 70
        }
      ]);
    }
  };

  const addCustomSkill = () => {
    if (!customSkillName.trim()) return;
    const exists = selectedSkills.some(s => s.name.toLowerCase() === customSkillName.trim().toLowerCase());
    if (exists) return;

    setSelectedSkills(prev => [
      ...prev,
      {
        name: customSkillName.trim(),
        category: customSkillCategory,
        level: 'intermediate',
        yearsExperience: 1,
        confidenceScore: 70
      }
    ]);
    setCustomSkillName('');
  };

  const updateSkillConfidence = (name: string, confidenceScore: number) => {
    setSelectedSkills(prev => prev.map(s => s.name === name ? { ...s, confidenceScore } : s));
  };

  const updateSkillLevel = (name: string, level: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedSkills(prev => prev.map(s => s.name === name ? { ...s, level } : s));
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
    } else {
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleFinish = async () => {
    if (selectedSkills.length === 0) {
      error('Please select at least one skill to continue.');
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    const payload = {
      ...studentInfo,
      skills: selectedSkills,
      interests: selectedInterests,
      careerGoal,
      preferences
    };

    const res = await api.completeOnboarding(payload);
    setLoading(false);

    if (res.success) {
      setOnboarded(true);
      success('Profile & Skill Intelligence initialized! Welcome aboard.');
      navigate('/dashboard');
    } else {
      error(res.error?.message || 'Failed to save onboarding data.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
      {/* Progress Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step {currentStep} of 5</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          {currentStep === 1 && 'Confirm Student Profile'}
          {currentStep === 2 && 'Map Your Technical Skills'}
          {currentStep === 3 && 'Select Domain Interests'}
          {currentStep === 4 && 'Define Your Target Career'}
          {currentStep === 5 && 'Project Preferences & Scope'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          {currentStep === 1 && 'Tell ProjectForge about your university background and current coding experience.'}
          {currentStep === 2 && 'Select your languages, frameworks, and tools so AI can tailor project difficulty.'}
          {currentStep === 3 && 'What problem domains excite you the most?'}
          {currentStep === 4 && 'ProjectForge aligns projects with roles tech recruiters are actively seeking.'}
          {currentStep === 5 && 'Tell us your time commitment and desired outcome.'}
        </p>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4, 5].map(step => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'w-8 bg-indigo-500'
                  : step < currentStep
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Step Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* STEP 1: Student Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">College / University</label>
              <input
                type="text"
                value={studentInfo.college}
                onChange={e => setStudentInfo({ ...studentInfo, college: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Degree Program</label>
                <input
                  type="text"
                  value={studentInfo.degree}
                  onChange={e => setStudentInfo({ ...studentInfo, degree: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                <input
                  type="text"
                  value={studentInfo.department}
                  onChange={e => setStudentInfo({ ...studentInfo, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Academic Year</label>
                <select
                  value={studentInfo.currentYear}
                  onChange={e => setStudentInfo({ ...studentInfo, currentYear: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate / Post-Grad">Graduate / Post-Grad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Self-Assessed Experience Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setStudentInfo({ ...studentInfo, experienceLevel: lvl })}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        studentInfo.experienceLevel === lvl
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Skills Library & Custom Adder */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Popular Student Technologies (Click to toggle)
                </span>
                <span className="text-xs text-indigo-400 font-medium">
                  {selectedSkills.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                {availableSkills.map(skill => {
                  const isSelected = selectedSkills.some(s => s.name === skill.name);
                  return (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <skill.icon className="w-3.5 h-3.5" />
                      <span>{skill.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Skill Adder */}
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <span className="block text-xs font-medium text-slate-300 mb-2">Add a Custom Skill</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. GraphQL, Solidity, PyTorch..."
                  value={customSkillName}
                  onChange={e => setCustomSkillName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <select
                  value={customSkillCategory}
                  onChange={e => setCustomSkillCategory(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="programming">Programming</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="database">Database</option>
                  <option value="ai">AI</option>
                  <option value="mobile">Mobile</option>
                  <option value="cloud_devops">Cloud</option>
                  <option value="cybersecurity">Security</option>
                </select>
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Selected Skills Proficiency Sliders */}
            {selectedSkills.length > 0 && (
              <div>
                <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tune Skill Confidence
                </span>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {selectedSkills.map(skill => (
                    <div key={skill.name} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-28">
                        <div className="text-xs font-semibold text-slate-200">{skill.name}</div>
                        <select
                          value={skill.level}
                          onChange={e => updateSkillLevel(skill.name, e.target.value as any)}
                          className="bg-transparent text-[11px] text-indigo-400 capitalize focus:outline-none cursor-pointer"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>

                      <div className="flex-1 max-w-xs flex items-center gap-2">
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={skill.confidenceScore}
                          onChange={e => updateSkillConfidence(skill.name, parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-400 w-8 text-right">
                          {skill.confidenceScore}%
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSkills(prev => prev.filter(s => s.name !== skill.name))}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Domain Interests */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select problem spaces where you'd be motivated to build and ship real software:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {domainInterests.map(interest => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-semibold shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs leading-snug">{interest}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Career Goal */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select your primary near-term career objective:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {careerOptions.map(option => {
                const isSelected = careerGoal === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCareerGoal(option)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="text-xs sm:text-sm">{option}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Project Preferences */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Primary Project Objective
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'portfolio', label: 'Portfolio Showcase' },
                  { id: 'academic', label: 'Academic / Capstone' },
                  { id: 'hackathon', label: 'Hackathon MVP' },
                  { id: 'startup', label: 'Startup Prototype' },
                  { id: 'learning', label: 'Skill Deep Dive' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferences({ ...preferences, projectObjective: item.id as any })}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      preferences.projectObjective === item.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Expected Duration
                </label>
                <select
                  value={preferences.targetDuration}
                  onChange={e => setPreferences({ ...preferences, targetDuration: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="1_week">1 Week (Sprint)</option>
                  <option value="2_weeks">2 Weeks</option>
                  <option value="1_month">1 Month (Recommended)</option>
                  <option value="2_months">2 Months</option>
                  <option value="3_plus_months">3+ Months (Semester Capstone)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Team Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solo', label: 'Solo' },
                    { id: 'team', label: 'Team (2-4)' },
                    { id: 'any', label: 'Flexible' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, preferredTeamSize: item.id as any })}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        preferences.preferredTeamSize === item.id
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>{loading ? 'Initializing ProjectForge...' : 'Launch Student Dashboard'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
