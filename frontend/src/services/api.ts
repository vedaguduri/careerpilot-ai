import { 
  User, 
  UserPreference, 
  Job, 
  MasterResume, 
  TailoredResume, 
  ApplicationRecord, 
  AIProviderConfig 
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

class ApiService {
  private getHeaders(isFormData = false): HeadersInit {
    const token = localStorage.getItem('cp_token');
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Auth ---
  async register(data: { email: string; password: string; full_name?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  }

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    return res.json();
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  }

  // --- Preferences ---
  async getPreferences(): Promise<UserPreference> {
    const res = await fetch(`${API_BASE}/preferences`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  }

  async updatePreferences(pref: Partial<UserPreference>): Promise<UserPreference> {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(pref),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  }

  // --- Resumes ---
  async uploadResume(file: File): Promise<{ master_resume: MasterResume }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to upload resume');
    return res.json();
  }

  async getMasterResume(): Promise<MasterResume | { structured_data: null }> {
    const res = await fetch(`${API_BASE}/resumes/master`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch master resume');
    return res.json();
  }

  async updateMasterResume(structured_data: any, change_summary = 'Manual edit'): Promise<MasterResume> {
    const res = await fetch(`${API_BASE}/resumes/master`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ structured_data, change_summary }),
    });
    if (!res.ok) throw new Error('Failed to update master resume');
    return res.json();
  }

  async getResumeVersions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/resumes/versions`, { headers: this.getHeaders() });
    return res.json();
  }

  // --- Jobs ---
  async getRecommendations(): Promise<Job[]> {
    const res = await fetch(`${API_BASE}/jobs/recommendations`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  }

  async searchJobs(params: Record<string, string>): Promise<Job[]> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/jobs?${query}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to search jobs');
    return res.json();
  }

  async getJob(id: string): Promise<{ job: Job; match?: any }> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
  }

  async manualImportJob(data: any): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/manual-import`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to import job');
    return res.json();
  }

  // --- Tailoring ---
  async generateTailoredResume(jobId: string): Promise<TailoredResume> {
    const res = await fetch(`${API_BASE}/tailoring/generate/${jobId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to tailor resume');
    return res.json();
  }

  async getTailoredResume(tailoredId: string): Promise<TailoredResume> {
    const res = await fetch(`${API_BASE}/tailoring/${tailoredId}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tailored resume');
    return res.json();
  }

  async decideDiff(tailoredId: string, diffId: string, decision: 'accepted' | 'rejected'): Promise<TailoredResume> {
    const res = await fetch(`${API_BASE}/tailoring/${tailoredId}/diff-decision`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ diff_id: diffId, decision }),
    });
    if (!res.ok) throw new Error('Failed to update diff');
    return res.json();
  }

  // --- Applications Tracker ---
  async getApplications(status?: string): Promise<ApplicationRecord[]> {
    const url = status && status !== 'all' ? `${API_BASE}/applications?status=${status}` : `${API_BASE}/applications`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  async createApplication(data: { job_id: string; status?: string; notes?: string; tailored_resume_id?: string }): Promise<ApplicationRecord> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async updateApplication(id: string, data: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async deleteApplication(id: string) {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- AI Providers (BYOK) ---
  async getAIProvidersCatalog(): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/ai-providers/catalog`, { headers: this.getHeaders() });
    return res.json();
  }

  async getUserAIProviders(): Promise<AIProviderConfig[]> {
    const res = await fetch(`${API_BASE}/ai-providers`, { headers: this.getHeaders() });
    return res.json();
  }

  async saveAIProvider(data: { provider: string; api_key?: string; base_url?: string; selected_models?: any; monthly_spend_limit_usd?: number }): Promise<AIProviderConfig> {
    const res = await fetch(`${API_BASE}/ai-providers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to save AI provider');
    return res.json();
  }

  async deleteAIProvider(provider: string) {
    const res = await fetch(`${API_BASE}/ai-providers/${provider}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async testAIProviderConnection(provider: string, api_key?: string, base_url?: string) {
    const res = await fetch(`${API_BASE}/ai-providers/test-connection`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ provider, api_key, base_url }),
    });
    return res.json();
  }

  async listProviderModels(provider: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/ai-providers/${provider}/models`, { headers: this.getHeaders() });
    return res.json();
  }

  async runModelBenchmark(provider: string, model_id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai-providers/benchmark`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ provider, model_id }),
    });
    return res.json();
  }

  // --- Discovery Engine ---
  async getDiscoveryStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/discovery/status`, { headers: this.getHeaders() });
    return res.json();
  }

  async triggerDiscovery(): Promise<any> {
    const res = await fetch(`${API_BASE}/discovery/trigger`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.json();
  }
}

export const api = new ApiService();
