import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DevicePreviewProvider } from './context/DevicePreviewContext';

// Layout
import { AppLayout } from './layouts/AppLayout';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ProjectDiscovery } from './pages/discovery/ProjectDiscovery';
import { ProjectsList } from './pages/projects/ProjectsList';
import { ProjectGenerator } from './pages/generator/ProjectGenerator';
import { ProjectWorkspace } from './pages/workspace/ProjectWorkspace';
import { SkillIntelligence } from './pages/skills/SkillIntelligence';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PublicPortfolio } from './pages/portfolio/PublicPortfolio';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false
}) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono">
        Loading ProjectForge AI...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isOnboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on auth status
const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DevicePreviewProvider>
            <Routes>
              {/* Standalone Public Showcase Route */}
              <Route path="/project/:slug" element={<PublicPortfolio />} />

              {/* Main Application Routes with Layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingWizard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discover"
                  element={<ProjectDiscovery />}
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <ProjectsList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/generator"
                  element={
                    <ProtectedRoute>
                      <ProjectGenerator />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:projectId"
                  element={
                    <ProtectedRoute>
                      <ProjectWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/skills"
                  element={
                    <ProtectedRoute>
                      <SkillIntelligence />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all 404 redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DevicePreviewProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};
