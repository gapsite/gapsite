import React, { useState } from 'react';
import {
  ShieldCheck,
  FolderKanban,
  FileCheck,
  Calculator,
  Users,
  Plus,
  Bell,
  Search,
  ChevronDown,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Wallet,
  FileSpreadsheet,
  Lock,
  LogOut,
  User,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { MainTabType } from './Sidebar';

interface NavbarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  onOpenNewProject: () => void;
  onOpenNewDisposition: () => void;
  onOpenTkdnCalculator: () => void;
  onOpenExport: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewProject,
  onOpenNewDisposition,
  onOpenTkdnCalculator,
  onOpenExport,
}) => {
  const {
    projects,
    dispositions,
    transactions,
    currentUser,
    logout,
    filters,
    setFilters,
  } = useProjects();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingDispositions = dispositions.filter(
    (d) => d.status === 'PENDING' || d.status === 'IN_PROGRESS' || d.status === 'UNDER_REVIEW'
  );

  const totalDocs = projects.reduce((acc, p) => acc + p.documents.length, 0);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      {/* Top Banner / System Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                  VERIX<span className="text-emerald-400">.CRM</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  SIINas & TKDN
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Industrial Licensing & Certification Intelligence
              </p>
            </div>
          </div>

          {/* Global Quick Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search project code, client, KBLI, BOM, consultant..."
                className="w-full pl-10 pr-4 py-1.5 text-sm bg-slate-800/90 text-slate-100 placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Header Action Buttons & User Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Export Button */}
            <button
              onClick={onOpenExport}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden xl:flex items-center gap-1.5 text-xs font-medium border border-slate-700/80"
              title="Export Report & Ledger"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export</span>
            </button>

            {/* Quick TKDN Estimator Button */}
            <button
              onClick={onOpenTkdnCalculator}
              className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-950/60 rounded-lg transition-colors hidden lg:flex items-center gap-1.5 text-xs font-medium border border-emerald-800/60"
              title="Quick TKDN Permenperin Formula Estimator"
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>TKDN Calc</span>
            </button>

            {/* Quick Job Disposition Dispatch */}
            <button
              onClick={onOpenNewDisposition}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Assign New Task / Job Disposition to Consultant"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Job Disposition</span>
            </button>

            {/* Primary "+ New Project" Button */}
            <button
              onClick={onOpenNewProject}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Project</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications & Alerts"
              >
                <Bell className="w-4 h-4" />
                {pendingDispositions.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      Pending Job Dispositions & Alerts
                    </h4>
                    <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                      {pendingDispositions.length} Active
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                    {pendingDispositions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No pending dispositions right now.</p>
                    ) : (
                      pendingDispositions.slice(0, 5).map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-200 line-clamp-1">{d.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              d.priority === 'URGENT' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-blue-950 text-blue-300'
                            }`}>
                              {d.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{d.clientName}</p>
                          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                            <span>Assigned: {d.assignedToName.split(',')[0]}</span>
                            <span className="text-amber-400">Due {d.dueDate}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-all text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/50"
                />
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name.split(',')[0]}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{currentUser.role.split('&')[0]}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between px-2 py-1 mb-2 bg-slate-800/80 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Active Session</span>
                    </span>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      LOGGED IN
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 mb-2.5">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{currentUser.roleTitle || currentUser.role}</p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">@{currentUser.username}</span>
                      <span className="truncate max-w-[120px]">{currentUser.email}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 px-1 mb-2.5 leading-relaxed">
                    Account switching is locked to your authenticated session. To use another profile, please sign out and enter that account's login credentials.
                  </p>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out from Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-800/80 pt-2 pb-2.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects CRM</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'projects' ? 'bg-slate-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {projects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dispositions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dispositions'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Job Dispositions & Tasks</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'dispositions' ? 'bg-slate-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {dispositions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'finance'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Financial Management</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'finance' ? 'bg-slate-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('financial-reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'financial-reports'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Laporan Keuangan</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Document & BOM Vault</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'documents' ? 'bg-slate-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalDocs}
            </span>
          </button>


          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>TKDN Formula Estimator</span>
            <span className="text-[9px] bg-teal-900/80 text-teal-300 px-1 rounded uppercase font-mono">
              Permenperin
            </span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Workload Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};
