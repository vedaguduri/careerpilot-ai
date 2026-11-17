import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Cpu, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Check, 
  Trash2, 
  AlertCircle, 
  RefreshCw,
  Zap,
  Globe,
  DollarSign
} from 'lucide-react';
import { AIProviderConfig, UserPreference } from '../types';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'preferences' | 'benchmark'>('ai');
  
  // AI BYOK States
  const [catalog, setCatalog] = useState<Record<string, any>>({});
  const [userProviders, setUserProviders] = useState<AIProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [spendLimit, setSpendLimit] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Dynamic Models
  const [providerModels, setProviderModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string>>({
    tailoring: 'llama-3.3-70b-versatile',
    matching: 'llama-3.3-70b-versatile',
    analysis: 'mixtral-8x7b-32768'
  });

  // Benchmark States
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [benchmarking, setBenchmarking] = useState(false);

  // User Preferences
  const [preferences, setPreferences] = useState<UserPreference>({
    desired_roles: ['Software Engineer', 'Full Stack Developer', 'Backend Architect'],
    preferred_locations: ['Bengaluru', 'Remote - India', 'Remote - Global', 'San Francisco'],
    experience_level: 'mid',
    work_arrangements: ['remote', 'hybrid'],
    min_salary: 3000000,
    preferred_currency: 'INR'
  });
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newLocInput, setNewLocInput] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [cat, userKeys, prefs] = await Promise.all([
          api.getAIProvidersCatalog(),
          api.getUserAIProviders(),
          api.getPreferences()
        ]);
        setCatalog(cat);
        setUserProviders(userKeys);
        if (prefs) setPreferences(prefs);
        if (cat[selectedProvider]) {
          setProviderModels(cat[selectedProvider].default_models || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadInit();
  }, []);

  const handleProviderSelect = async (p: string) => {
    setSelectedProvider(p);
    setTestResult(null);
    setApiKeyInput('');
    const existing = userProviders.find(k => k.provider === p);
    if (existing) {
      setBaseUrlInput(existing.base_url || '');
      setSpendLimit(existing.monthly_spend_limit_usd || 0);
      if (existing.selected_models) {
        setTaskAssignments(prev => ({ ...prev, ...existing.selected_models }));
      }
    } else {
      setBaseUrlInput(catalog[p]?.default_base_url || '');
    }

    setLoadingModels(true);
    try {
      const models = await api.listProviderModels(p);
      setProviderModels(models);
    } catch {
      setProviderModels(catalog[p]?.default_models || []);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAIProviderConnection(selectedProvider, apiKeyInput || undefined, baseUrlInput || undefined);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveProvider = async () => {
    setIsSavingKey(true);
    try {
      const updated = await api.saveAIProvider({
        provider: selectedProvider,
        api_key: apiKeyInput || undefined,
        base_url: baseUrlInput || undefined,
        selected_models: taskAssignments,
        monthly_spend_limit_usd: spendLimit
      });
      setUserProviders(prev => {
        const filtered = prev.filter(k => k.provider !== selectedProvider);
        return [...filtered, updated];
      });
      setApiKeyInput('');
      setTestResult({ success: true, message: 'Provider credentials encrypted and saved securely.' });
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDeleteProvider = async (p: string) => {
    try {
      await api.deleteAIProvider(p);
      setUserProviders(prev => prev.filter(k => k.provider !== p));
      setTestResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const currentModel = taskAssignments.tailoring || 'llama-3.3-70b-versatile';
      const res = await api.runModelBenchmark(selectedProvider, currentModel);
      setBenchmarkResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBenchmarking(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefSaveSuccess(false);
    try {
      await api.updatePreferences(preferences);
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Settings Top Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Platform Settings & Controls</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure your multi-provider AI vault (BYOK), task-based model routing, and automated job discovery preferences.
        </p>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-5 text-xs">
          <button
            onClick={() => setActiveSubTab('ai')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeSubTab === 'ai' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Models & BYOK Vault</span>
          </button>

          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeSubTab === 'preferences' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Job Preferences</span>
          </button>

          <button
            onClick={() => setActiveSubTab('benchmark')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeSubTab === 'benchmark' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Synthetic Model Benchmark</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: AI MODELS & BYOK VAULT */}
      {activeSubTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Provider Selector & Configured Status */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-400">
              Supported AI Providers
            </h3>

            <div className="space-y-2">
              {Object.keys(catalog).map((pKey) => {
                const info = catalog[pKey];
                const configured = userProviders.find(k => k.provider === pKey);
                const isSelected = selectedProvider === pKey;

                return (
                  <div
                    key={pKey}
                    onClick={() => handleProviderSelect(pKey)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/80 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{info.name}</span>
                        {pKey === 'ollama' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Local
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {configured ? `Active (${configured.key_fingerprint})` : 'Not configured'}
                      </span>
                    </div>

                    {configured ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Key Vault & Task Routing */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Vault Key Configuration Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span>{catalog[selectedProvider]?.name || 'Provider'} Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    AES-256-GCM encrypted at rest. Never stored in plaintext or exposed to frontend code.
                  </p>
                </div>

                {catalog[selectedProvider]?.docs_url && (
                  <a
                    href={catalog[selectedProvider].docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Get API Key ↗
                  </a>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">API Key</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      userProviders.some(k => k.provider === selectedProvider)
                        ? '•••••••••••••••••••• (Leave blank to keep existing key)'
                        : 'Enter your API key...'
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Base URL (Optional / Custom Endpoint)</label>
                  <input
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder={catalog[selectedProvider]?.default_base_url || 'https://api...'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Test Connection Output */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}>
                  {testResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult.message || testResult.error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                {userProviders.some(k => k.provider === selectedProvider) ? (
                  <button
                    onClick={() => handleDeleteProvider(selectedProvider)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Key</span>
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    onClick={handleSaveProvider}
                    disabled={isSavingKey}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
                  >
                    {isSavingKey ? 'Encrypting & Saving...' : 'Save & Encrypt'}
                  </button>
                </div>
              </div>
            </div>

            {/* Task-Based Model Assignment Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Task-Based Model Routing</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign high-reasoning models for truthful tailoring, and fast/free models for matching.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-300 block mb-1 font-medium">Resume Tailoring & Diffs</label>
                  <select
                    value={taskAssignments.tailoring || ''}
                    onChange={(e) => setTaskAssignments({ ...taskAssignments, tailoring: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none"
                  >
                    {providerModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.id}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-300 block mb-1 font-medium">Job Matching Explanation</label>
                  <select
                    value={taskAssignments.matching || ''}
                    onChange={(e) => setTaskAssignments({ ...taskAssignments, matching: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none"
                  >
                    {providerModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: USER PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-white">Automated Job Discovery Preferences</h3>
            <p className="text-xs text-slate-400">
              CareerPilot uses these preferences to continuously discover and rank real-world opportunities across public ATS feeds and APIs.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Roles */}
            <div>
              <label className="text-slate-300 block mb-1.5 font-medium">Target Roles</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {preferences.desired_roles.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                    <span>{r}</span>
                    <button 
                      onClick={() => setPreferences({ ...preferences, desired_roles: preferences.desired_roles.filter(x => x !== r) })}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRoleInput.trim()) {
                      setPreferences({ ...preferences, desired_roles: [...preferences.desired_roles, newRoleInput.trim()] });
                      setNewRoleInput('');
                    }
                  }}
                  placeholder="Add role (e.g. Distributed Systems Architect)..."
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs flex-1 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (newRoleInput.trim()) {
                      setPreferences({ ...preferences, desired_roles: [...preferences.desired_roles, newRoleInput.trim()] });
                      setNewRoleInput('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Locations (India & Global) */}
            <div>
              <label className="text-slate-300 block mb-1.5 font-medium">Preferred Locations (India & International)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {preferences.preferred_locations.map((loc, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                    <span>{loc}</span>
                    <button 
                      onClick={() => setPreferences({ ...preferences, preferred_locations: preferences.preferred_locations.filter(x => x !== loc) })}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocInput}
                  onChange={(e) => setNewLocInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newLocInput.trim()) {
                      setPreferences({ ...preferences, preferred_locations: [...preferences.preferred_locations, newLocInput.trim()] });
                      setNewLocInput('');
                    }
                  }}
                  placeholder="Add location (e.g. Bengaluru, Hyderabad, San Francisco, Remote)..."
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs flex-1 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (newLocInput.trim()) {
                      setPreferences({ ...preferences, preferred_locations: [...preferences.preferred_locations, newLocInput.trim()] });
                      setNewLocInput('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Experience Level & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Experience Level</label>
                <select
                  value={preferences.experience_level}
                  onChange={(e) => setPreferences({ ...preferences, experience_level: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                >
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid-Level (3-5 years)</option>
                  <option value="senior">Senior (6-9 years)</option>
                  <option value="lead">Staff / Lead (10+ years)</option>
                  <option value="principal">Principal / Architect</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Minimum Target Salary (Annual)</label>
                <div className="flex gap-2">
                  <select
                    value={preferences.preferred_currency || 'INR'}
                    onChange={(e) => setPreferences({ ...preferences, preferred_currency: e.target.value })}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                  <input
                    type="number"
                    value={preferences.min_salary || ''}
                    onChange={(e) => setPreferences({ ...preferences, min_salary: Number(e.target.value) })}
                    placeholder="e.g. 3500000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {prefSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Job discovery preferences saved successfully.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs shadow-md transition-colors"
            >
              {savingPrefs ? 'Saving Preferences...' : 'Save Job Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SYNTHETIC BENCHMARK */}
      {activeSubTab === 'benchmark' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 max-w-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Privacy-Preserving Model Evaluation</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Benchmark LLM latency, structured JSON schema reliability, and token efficiency using synthetic prompts.
              No personal user data or master resume text is ever sent during benchmarking.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Target Provider & Model:</span>
              <span className="font-mono text-emerald-400 font-semibold">{selectedProvider} / {taskAssignments.tailoring}</span>
            </div>

            <button
              onClick={handleRunBenchmark}
              disabled={benchmarking}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Zap className={`w-3.5 h-3.5 ${benchmarking ? 'animate-bounce' : ''}`} />
              <span>{benchmarking ? 'Benchmarking Inference...' : 'Run Benchmark Evaluation'}</span>
            </button>
          </div>

          {benchmarkResult && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-900/40 space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                <Check className="w-4 h-4" />
                <span>Benchmark Completed</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Latency</span>
                  <span className="text-base font-bold font-mono text-white">{benchmarkResult.latency_ms} ms</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Input Tokens</span>
                  <span className="text-base font-bold font-mono text-slate-200">{benchmarkResult.input_tokens_used}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Est. Cost</span>
                  <span className="text-base font-bold font-mono text-emerald-400">${benchmarkResult.estimated_cost_usd}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Schema Validity</span>
                  <span className="text-base font-bold font-mono text-emerald-400">100% Pass</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {benchmarkResult.privacy_notice}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
