import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { FindJobs } from './pages/FindJobs';
import { MyApplications } from './pages/MyApplications';
import { MyResume } from './pages/MyResume';
import { Settings } from './pages/Settings';
import { TailorResume } from './pages/TailorResume';
import { Onboarding } from './pages/Onboarding';
import { JobDetailModal } from './components/JobDetailModal';
import { Job } from './types';

function MainLayout() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);
  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<Job | null>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  const handleViewJob = (job: Job) => {
    setSelectedJobForDetail(job);
  };

  const handleTailorResume = (job: Job) => {
    setSelectedJobForDetail(null);
    setSelectedJobForTailoring(job);
  };

  const handleBackFromTailoring = () => {
    setSelectedJobForTailoring(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navbar */}
      <Navbar
        currentTab={selectedJobForTailoring ? 'resume' : currentTab}
        onSelectTab={(tab) => {
          setSelectedJobForTailoring(null);
          setCurrentTab(tab);
        }}
        onRefresh={() => {}}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {isOnboarding ? (
          <Onboarding onComplete={() => setIsOnboarding(false)} />
        ) : selectedJobForTailoring ? (
          <TailorResume
            job={selectedJobForTailoring}
            onBack={handleBackFromTailoring}
            onNavigateToApplications={() => {
              setSelectedJobForTailoring(null);
              setCurrentTab('applications');
            }}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <Home
                onViewJob={handleViewJob}
                onTailorResume={handleTailorResume}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}
            {currentTab === 'find-jobs' && (
              <FindJobs
                onViewJob={handleViewJob}
                onTailorResume={handleTailorResume}
              />
            )}
            {currentTab === 'applications' && <MyApplications />}
            {currentTab === 'resume' && <MyResume />}
            {currentTab === 'settings' && <Settings />}
          </>
        )}
      </main>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        onTailorResume={handleTailorResume}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 sm:px-8 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">CareerPilot AI</span>
            <span>•</span>
            <span>Truthful, Intelligent Job Search Gateway</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsOnboarding(true)} className="hover:text-emerald-400 transition-colors">
              Restart Onboarding
            </button>
            <button onClick={() => setCurrentTab('settings')} className="hover:text-emerald-400 transition-colors">
              AI Vault & BYOK
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
