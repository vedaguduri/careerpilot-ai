import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Check, 
  History, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Save, 
  Sparkles,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { MasterResume, MasterResumeAST } from '../types';
import { api } from '../services/api';

export const MyResume: React.FC = () => {
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [ast, setAst] = useState<MasterResumeAST | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'versions'>('editor');
  const [newSkillInput, setNewSkillInput] = useState('');

  const loadResume = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMasterResume();
      if ('structured_data' in res && res.structured_data) {
        setMasterResume(res as MasterResume);
        setAst((res as MasterResume).structured_data);
      }
      const v = await api.getResumeVersions();
      setVersions(v);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResume();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadMessage('');
    try {
      const res = await api.uploadResume(file);
      setMasterResume(res.master_resume);
      setAst(res.master_resume.structured_data);
      setUploadMessage('Resume parsed and structured master AST updated successfully.');
      const v = await api.getResumeVersions();
      setVersions(v);
    } catch (err: any) {
      setUploadMessage(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveMasterAst = async () => {
    if (!ast) return;
    setIsSaving(true);
    try {
      const updated = await api.updateMasterResume(ast, 'Updated structured fields via editor');
      setMasterResume(updated);
      setAst(updated.structured_data);
      const v = await api.getResumeVersions();
      setVersions(v);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim() || !ast) return;
    const clean = newSkillInput.trim();
    if (!ast.skills.includes(clean)) {
      setAst({ ...ast, skills: [...ast.skills, clean] });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!ast) return;
    setAst({ ...ast, skills: ast.skills.filter(s => s !== skillToRemove) });
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <FileText className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
        <p className="text-xs text-slate-400">Loading master resume representation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Master Resume Workspace</h1>
            {masterResume && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                v{masterResume.version_number}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Your single source of truth. CareerPilot builds all tailored job-specific resumes strictly from this verified master foundation.
          </p>
        </div>

        {/* Upload Resume Button */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer transition-colors shadow-sm active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Extracting AST...' : 'Upload Resume File'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.tex,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploadMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Tabs: Editor vs Version History */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'editor' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Structured Master Editor
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'versions' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Version History ({versions.length})
          </button>
        </div>

        {activeTab === 'editor' && ast && (
          <button
            onClick={handleSaveMasterAst}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Save Master Changes'}</span>
          </button>
        )}
      </div>

      {/* Editor Tab */}
      {activeTab === 'editor' && ast && (
        <div className="space-y-6">
          
          {/* Contact Details */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-emerald-400">
              Personal & Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={ast.contact?.name || ''}
                  onChange={(e) => setAst({ ...ast, contact: { ...ast.contact, name: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={ast.contact?.email || ''}
                  onChange={(e) => setAst({ ...ast, contact: { ...ast.contact, email: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Phone</label>
                <input
                  type="text"
                  value={ast.contact?.phone || ''}
                  onChange={(e) => setAst({ ...ast, contact: { ...ast.contact, phone: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Location</label>
                <input
                  type="text"
                  value={ast.contact?.location || ''}
                  onChange={(e) => setAst({ ...ast, contact: { ...ast.contact, location: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">LinkedIn Profile</label>
                <input
                  type="text"
                  value={ast.contact?.linkedin || ''}
                  onChange={(e) => setAst({ ...ast, contact: { ...ast.contact, linkedin: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">GitHub / Portfolio</label>
                <input
                  type="text"
                  value={ast.contact?.github || ''}
                  onChange={(e) => setAst({ ...ast, contact: { ...ast.contact, github: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-emerald-400">
              Professional Summary
            </h3>
            <textarea
              rows={3}
              value={ast.professional_summary || ''}
              onChange={(e) => setAst({ ...ast, professional_summary: e.target.value })}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Skills Management */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-emerald-400">
                Verified Technical Skills ({ast.skills?.length || 0})
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add skill (e.g. Docker)..."
                  className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ast.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience Blocks */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-emerald-400">
              Work Experience ({ast.work_experience?.length || 0})
            </h3>
            <div className="space-y-4">
              {ast.work_experience?.map((exp, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block mb-1">Company</span>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const copy = [...ast.work_experience];
                          copy[i].company = e.target.value;
                          setAst({ ...ast, work_experience: copy });
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Role Title</span>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const copy = [...ast.work_experience];
                          copy[i].role = e.target.value;
                          setAst({ ...ast, work_experience: copy });
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Dates</span>
                      <input
                        type="text"
                        value={`${exp.start_date} – ${exp.end_date}`}
                        onChange={(e) => {
                          const parts = e.target.value.split('–');
                          const copy = [...ast.work_experience];
                          copy[i].start_date = parts[0]?.trim() || '';
                          copy[i].end_date = parts[1]?.trim() || 'Present';
                          setAst({ ...ast, work_experience: copy });
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Accomplishment Bullets</span>
                    <textarea
                      rows={3}
                      value={exp.highlights?.join('\n') || ''}
                      onChange={(e) => {
                        const copy = [...ast.work_experience];
                        copy[i].highlights = e.target.value.split('\n').filter(Boolean);
                        setAst({ ...ast, work_experience: copy });
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-sans leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Version History Tab */}
      {activeTab === 'versions' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-400">
            Resume Snapshot History
          </h3>
          <div className="space-y-3">
            {versions.map((ver) => (
              <div 
                key={ver.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">v{ver.version_number}</span>
                    <span className="text-white font-medium">{ver.change_summary}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{ver.created_at}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                  Preserved
                </span>
              </div>
            ))}
            {versions.length === 0 && (
              <p className="text-xs text-slate-500 italic">No previous versions recorded yet.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
