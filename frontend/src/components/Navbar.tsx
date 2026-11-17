import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  Briefcase, 
  FileText, 
  Settings as SettingsIcon, 
  Sparkles, 
  RefreshCw, 
  LogOut, 
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onRefresh }) => {
  const { user, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'find-jobs', label: 'Find Jobs', icon: Search },
    { id: 'applications', label: 'My Applications', icon: Briefcase },
    { id: 'resume', label: 'My Resume', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleSyncDiscovery = async () => {
    setIsSyncing(true);
    setSyncDone(false);
    try {
      await api.triggerDiscovery();
      if (onRefresh) onRefresh();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-lg text-white font-sans">CareerPilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block -mt-1 font-normal">Intelligent Job Gateway</p>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Background Job Discovery Button */}
          <button
            onClick={handleSyncDiscovery}
            disabled={isSyncing}
            title="Trigger multi-source job discovery & ATS sync"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all active:scale-95 disabled:opacity-50"
          >
            {syncDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Synced</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Discovering...' : 'Sync Jobs'}</span>
              </>
            )}
          </button>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-tight">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('settings')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around pt-2.5 mt-2 border-t border-slate-800/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
