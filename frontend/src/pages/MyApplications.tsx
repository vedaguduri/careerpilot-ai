import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  ExternalLink, 
  FileText, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  Building2,
  ChevronRight
} from 'lucide-react';
import { ApplicationRecord } from '../types';
import { api } from '../services/api';

const STAGES = [
  { id: 'saved', label: 'Saved', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { id: 'preparing', label: 'Preparing', color: 'border-amber-900/40 bg-amber-950/20 text-amber-300' },
  { id: 'applied', label: 'Applied', color: 'border-blue-900/40 bg-blue-950/20 text-blue-300' },
  { id: 'interview', label: 'Interview', color: 'border-purple-900/40 bg-purple-950/20 text-purple-300' },
  { id: 'offer', label: 'Offer', color: 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300' },
  { id: 'rejected', label: 'Archived / Rejected', color: 'border-slate-800 bg-slate-950/40 text-slate-400' },
];

export const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const records = await api.getApplications();
      setApplications(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleStatusChange = async (appId: string, newStatus: any) => {
    try {
      const updated = await api.updateApplication(appId, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await api.deleteApplication(appId);
      setApplications(prev => prev.filter(a => a.id !== appId));
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      await api.updateApplication(selectedApp.id, { notes: editingNotes });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, notes: editingNotes } : a));
      setSelectedApp({ ...selectedApp, notes: editingNotes });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Application Pipeline Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your job applications, interview timelines, and linked tailored resumes in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Active Applications:</span>
          <strong className="text-emerald-400 font-bold">{applications.length}</strong>
        </div>
      </div>

      {/* Kanban Board Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((s) => (
            <div key={s.id} className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageApps = applications.filter(a => a.status === stage.id);
            return (
              <div 
                key={stage.id}
                className="flex flex-col min-w-[220px] bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 h-[600px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-semibold text-slate-300">{stage.label}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards in this stage */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {stageApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        setEditingNotes(app.notes || '');
                      }}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-sm group space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-emerald-400 line-clamp-1">
                          {app.job?.company || 'Company'}
                        </span>
                        <select
                          value={app.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none"
                        >
                          <option value="saved">Saved</option>
                          <option value="preparing">Preparing</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Archived</option>
                        </select>
                      </div>

                      <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {app.job?.title || 'Job Role'}
                      </h4>

                      {/* Tailored resume badge if attached */}
                      {app.tailored_resume && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">Resume Tailored</span>
                        </div>
                      )}

                      {/* Application link */}
                      {app.job?.application_url && (
                        <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[10px] text-slate-400">
                          <span>Apply link ready</span>
                          <a 
                            href={app.job.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="h-28 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400">{selectedApp.job?.company}</span>
                <h3 className="text-lg font-bold text-white">{selectedApp.job?.title}</h3>
                <p className="text-xs text-slate-400">{selectedApp.job?.location}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Stage:</span>
              <select
                value={selectedApp.status}
                onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="saved">Saved</option>
                <option value="preparing">Preparing Application</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview Scheduled</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Archived / Rejected</option>
              </select>
            </div>

            {/* Notes Section */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Personal Notes & Interview Log
              </label>
              <textarea
                rows={4}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Log interview round dates, interviewer names, salary notes..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedApp.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              {selectedApp.job?.application_url && (
                <a
                  href={selectedApp.job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Open Application Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
