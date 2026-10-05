import { standaloneStore } from '../data/standaloneStore';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('projectforge_api_base');
    if (custom) return custom.replace(/\/+$/, '');

    // In Capacitor native app, protocol is 'capacitor:' or port is empty on localhost
    const isCapacitor = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.location.port === '')
    );
    if (isCapacitor) {
      return 'http://192.168.1.4:5000/api';
    }
  }
  return import.meta.env.VITE_API_URL || '/api';
};

export const setApiBase = (url: string) => {
  if (url) {
    localStorage.setItem('projectforge_api_base', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('projectforge_api_base');
  }
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('projectforge_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${getApiBase()}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json();

      // If token expired, clear it
      if (response.status === 401 && json?.error?.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('projectforge_token');
        localStorage.removeItem('projectforge_user');
        window.dispatchEvent(new Event('auth:expired'));
      }

      return json;
    } catch (err: any) {
      console.warn(`[API] Network unavailable at ${url}. Serving from embedded standalone real data store.`);
      const offlineResult = standaloneStore.handleRequest(endpoint, options);
      if (offlineResult) {
        return offlineResult;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to ProjectForge API server. Please check your network.',
        },
      };
    }
  }

  // Auth Endpoints
  async register(body: any) { return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }); }
  async login(body: any) { return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }); }
  async getMe() { return this.request<any>('/auth/me'); }
  async logout() { return this.request<any>('/auth/logout', { method: 'POST' }); }
  async forgotPassword(email: string) { return this.request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); }

  // Profile & Skills Endpoints
  async getProfile() { return this.request<any>('/profile'); }
  async updateProfile(body: any) { return this.request<any>('/profile', { method: 'PUT', body: JSON.stringify(body) }); }
  async completeOnboarding(body: any) { return this.request<any>('/profile/onboarding', { method: 'POST', body: JSON.stringify(body) }); }
  async getSkills() { return this.request<any>('/skills'); }
  async addSkill(body: any) { return this.request<any>('/skills', { method: 'POST', body: JSON.stringify(body) }); }
  async updateSkill(id: string, body: any) { return this.request<any>(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
  async deleteSkill(id: string) { return this.request<any>(`/skills/${id}`, { method: 'DELETE' }); }

  // Dashboard & Discovery Endpoints
  async getDashboardStats() { return this.request<any>('/projects/dashboard-stats'); }
  async discoverProjects(params: { category?: string; difficulty?: string; search?: string } = {}) {
    const q = new URLSearchParams();
    if (params.category) q.append('category', params.category);
    if (params.difficulty) q.append('difficulty', params.difficulty);
    if (params.search) q.append('search', params.search);
    return this.request<any>(`/projects/discover?${q.toString()}`);
  }
  async getProjects() { return this.request<any>('/projects'); }
  async getProject(id: string) { return this.request<any>(`/projects/${id}`); }
  async createProject(body: any) { return this.request<any>('/projects', { method: 'POST', body: JSON.stringify(body) }); }
  async updateProject(id: string, body: any) { return this.request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
  async deleteProject(id: string) { return this.request<any>(`/projects/${id}`, { method: 'DELETE' }); }
  async forkProject(id: string) { return this.request<any>(`/projects/${id}/fork`, { method: 'POST' }); }

  // AI Generation & Validation
  async generateProjectAI(params: any) { return this.request<any>('/ai/generate', { method: 'POST', body: JSON.stringify(params) }); }
  async validateProjectAI(project: any) { return this.request<any>('/ai/validate', { method: 'POST', body: JSON.stringify({ project }) }); }
  async acceptProjectAI(project: any) { return this.request<any>('/ai/accept', { method: 'POST', body: JSON.stringify({ project }) }); }

  // Workspace Sub-modules
  async getRequirements(projectId: string) { return this.request<any>(`/projects/${projectId}/requirements`); }
  async updateRequirements(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/requirements`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateRequirements(projectId: string) { return this.request<any>(`/projects/${projectId}/requirements/regenerate`, { method: 'POST' }); }

  async getArchitecture(projectId: string) { return this.request<any>(`/projects/${projectId}/architecture`); }
  async updateArchitecture(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/architecture`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateArchitecture(projectId: string) { return this.request<any>(`/projects/${projectId}/architecture/regenerate`, { method: 'POST' }); }

  async getDatabase(projectId: string) { return this.request<any>(`/projects/${projectId}/database`); }
  async updateDatabase(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/database`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateDatabase(projectId: string, dbType: string = 'mongodb') { return this.request<any>(`/projects/${projectId}/database/regenerate`, { method: 'POST', body: JSON.stringify({ dbType }) }); }

  async getApis(projectId: string) { return this.request<any>(`/projects/${projectId}/apis`); }
  async updateApis(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/apis`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateApis(projectId: string) { return this.request<any>(`/projects/${projectId}/apis/regenerate`, { method: 'POST' }); }

  async getUIPlan(projectId: string) { return this.request<any>(`/projects/${projectId}/ui`); }
  async updateUIPlan(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/ui`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateUIPlan(projectId: string) { return this.request<any>(`/projects/${projectId}/ui/regenerate`, { method: 'POST' }); }

  async getRoadmap(projectId: string) { return this.request<any>(`/projects/${projectId}/roadmap`); }
  async updateRoadmap(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/roadmap`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateRoadmap(projectId: string) { return this.request<any>(`/projects/${projectId}/roadmap/regenerate`, { method: 'POST' }); }

  async getTasks(projectId: string) { return this.request<any>(`/projects/${projectId}/tasks`); }
  async createTask(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) }); }
  async updateTask(projectId: string, taskId: string, body: any) { return this.request<any>(`/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(body) }); }
  async deleteTask(projectId: string, taskId: string) { return this.request<any>(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }); }

  async getChat(projectId: string) { return this.request<any>(`/projects/${projectId}/chat`); }
  async sendChat(projectId: string, message: string) { return this.request<any>(`/projects/${projectId}/chat`, { method: 'POST', body: JSON.stringify({ message }) }); }

  async getCodeStructure(projectId: string) { return this.request<any>(`/projects/${projectId}/code/structure`); }
  async generateCode(projectId: string, moduleName: string) { return this.request<any>(`/projects/${projectId}/code/generate`, { method: 'POST', body: JSON.stringify({ moduleName }) }); }

  async getTests(projectId: string) { return this.request<any>(`/projects/${projectId}/tests`); }
  async updateTest(projectId: string, testId: string, body: any) { return this.request<any>(`/projects/${projectId}/tests/${testId}`, { method: 'PUT', body: JSON.stringify(body) }); }
  async regenerateTests(projectId: string) { return this.request<any>(`/projects/${projectId}/tests/regenerate`, { method: 'POST' }); }

  async getDocs(projectId: string) { return this.request<any>(`/projects/${projectId}/docs`); }
  async updateDocs(projectId: string, body: any) { return this.request<any>(`/projects/${projectId}/docs`, { method: 'PUT', body: JSON.stringify(body) }); }
  async exportDocs(projectId: string, format: 'markdown' | 'json' = 'markdown') { return this.request<any>(`/projects/${projectId}/docs/export?format=${format}`); }

  async getDeployment(projectId: string) { return this.request<any>(`/projects/${projectId}/deployment`); }

  // Portfolio
  async getPortfolio(slug: string) { return this.request<any>(`/portfolio/${slug}`); }
  async likePortfolio(slug: string) { return this.request<any>(`/portfolio/${slug}/like`, { method: 'POST' }); }
  async updatePortfolioSettings(projectId: string, body: any) { return this.request<any>(`/portfolio/settings/${projectId}`, { method: 'PUT', body: JSON.stringify(body) }); }

  // Notifications, Search & Analytics
  async getNotifications() { return this.request<any>('/notifications'); }
  async markNotificationRead(id: string) { return this.request<any>(`/notifications/${id}/read`, { method: 'PUT' }); }
  async markAllNotificationsRead() { return this.request<any>('/notifications/read-all', { method: 'PUT' }); }

  async searchGlobal(q: string) { return this.request<any>(`/search?q=${encodeURIComponent(q)}`); }
  async getAnalytics() { return this.request<any>('/analytics'); }

  // Admin
  async getAdminOverview() { return this.request<any>('/admin/overview'); }
  async getAdminUsers(search?: string) { return this.request<any>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`); }
  async setAdminUserStatus(id: string, status: 'active' | 'suspended') { return this.request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); }
  async getAdminProjects() { return this.request<any>('/admin/projects'); }
  async toggleAdminFeatureProject(id: string) { return this.request<any>(`/admin/projects/${id}/feature`, { method: 'PUT' }); }
  async getAdminTechnologies() { return this.request<any>('/admin/technologies'); }
  async createAdminTechnology(body: any) { return this.request<any>('/admin/technologies', { method: 'POST', body: JSON.stringify(body) }); }
  async updateAdminTechnology(id: string, body: any) { return this.request<any>(`/admin/technologies/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
  async deleteAdminTechnology(id: string) { return this.request<any>(`/admin/technologies/${id}`, { method: 'DELETE' }); }
  async getAdminCategories() { return this.request<any>('/admin/categories'); }
  async createAdminCategory(body: any) { return this.request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(body) }); }
  async updateAdminCategory(id: string, body: any) { return this.request<any>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
  async deleteAdminCategory(id: string) { return this.request<any>(`/admin/categories/${id}`, { method: 'DELETE' }); }
  async getAdminAiUsage() { return this.request<any>('/admin/ai-usage'); }
}

export const api = new ApiClient();
