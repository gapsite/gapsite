import React, { useState } from 'react';
import {
  ShieldCheck,
  FolderKanban,
  Clock,
  Wallet,
  FileCheck,
  Calculator,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Building,
  BarChart3,
  ShieldAlert,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';

export type MainTabType = 'projects' | 'dispositions' | 'finance' | 'documents' | 'calculator' | 'team';

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenNewProject: () => void;
  onOpenNewDisposition: () => void;
  onOpenTkdnCalculator: () => void;
  onOpenExport: () => void;
  onOpenRoleManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenNewProject,
  onOpenNewDisposition,
  onOpenTkdnCalculator,
  onOpenExport,
  onOpenRoleManager,
}) => {
  const {
    projects,
    dispositions,
    transactions,
    teamMembers,
    currentUser,
    setCurrentUser,
    logout,
  } = useProjects();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const pendingDispositions = dispositions.filter(
    (d) => d.status === 'PENDING' || d.status === 'IN_PROGRESS' || d.status === 'UNDER_REVIEW'
  );

  const totalDocs = projects.reduce((acc, p) => acc + p.documents.length, 0);

  const handleNavClick = (tab: MainTabType) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-mono">
                    VERIX<span className="text-emerald-400">.CRM</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    TKDN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Licensing & Compliance
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Action Dispatch Button */}
        <div className="p-3 shrink-0 border-b border-slate-800/60">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="space-y-1.5">
              <button
                onClick={onOpenNewProject}
                className="w-full px-3.5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Project Registration</span>
              </button>

              <button
                onClick={onOpenNewDisposition}
                className="w-full px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Dispatch Task</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenNewProject}
                className="w-10 h-10 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/30 hover:from-emerald-500 hover:to-teal-500 transition-all"
                title="New Project Registration"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                onClick={onOpenNewDisposition}
                className="w-10 h-8 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all"
                title="Dispatch Job Task"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {/* SECTION 1: CRM & PROJECT PIPELINE */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                CRM & Project Operations
              </p>
            )}
            <div className="space-y-1">
              {/* Projects CRM */}
              <button
                onClick={() => handleNavClick('projects')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'projects'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                title="Projects CRM Pipeline"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderKanban className={`w-4 h-4 shrink-0 ${activeTab === 'projects' ? 'text-slate-950' : 'text-emerald-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">Projects CRM</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      activeTab === 'projects'
                        ? 'bg-slate-950 text-emerald-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {projects.length}
                  </span>
                )}
              </button>

              {/* Job Dispositions & Tasks */}
              <button
                onClick={() => handleNavClick('dispositions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dispositions'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                title="Job Dispositions & Tasks"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'dispositions' ? 'text-slate-950' : 'text-amber-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">Job Dispositions</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      activeTab === 'dispositions'
                        ? 'bg-slate-950 text-emerald-300'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {pendingDispositions.length} Active
                  </span>
                )}
              </button>

              {/* Team Workload Matrix */}
              <button
                onClick={() => handleNavClick('team')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'team'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                title="Team Workload Matrix"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'team' ? 'text-slate-950' : 'text-cyan-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">Team & Workload</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {teamMembers.length} Staff
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 2: FINANCIAL MANAGEMENT SUITE */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Financial Management
              </p>
            )}
            <div className="space-y-1">
              {/* Financial Management Main Tab */}
              <button
                onClick={() => handleNavClick('finance')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'finance'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                title="Financial Management & Daily Cash Flow"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Wallet className={`w-4 h-4 shrink-0 ${activeTab === 'finance' ? 'text-slate-950' : 'text-emerald-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">Finance & Cash Flow</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      activeTab === 'finance'
                        ? 'bg-slate-950 text-emerald-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {transactions.length} Entries
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 3: DOCUMENT & BOM VAULT */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Document & File Vault
              </p>
            )}
            <div className="space-y-1">
              {/* Documents Repository */}
              <button
                onClick={() => handleNavClick('documents')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'documents'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                title="Document & BOM Vault"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCheck className={`w-4 h-4 shrink-0 ${activeTab === 'documents' ? 'text-slate-950' : 'text-indigo-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">Document Repository</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      activeTab === 'documents'
                        ? 'bg-slate-950 text-emerald-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {totalDocs}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 4: TOOLS & COMPLIANCE */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tools & Reports
              </p>
            )}
            <div className="space-y-1">
              {/* TKDN Estimator */}
              <button
                onClick={() => handleNavClick('calculator')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                title="TKDN Permenperin Formula Estimator"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calculator className={`w-4 h-4 shrink-0 ${activeTab === 'calculator' ? 'text-slate-950' : 'text-teal-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span className="truncate">TKDN Estimator</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-[9px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded font-mono font-semibold uppercase border border-teal-800">
                    Formula
                  </span>
                )}
              </button>

              {/* Dossier & Report Export */}
              <button
                onClick={onOpenExport}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
                  isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-start'
                }`}
                title="Export Project Dossiers & Reports"
              >
                <Download className="w-4 h-4 text-slate-400 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>Export Dossier</span>}
              </button>

              {/* Roles & Access Control */}
              {onOpenRoleManager && (
                <button
                  onClick={onOpenRoleManager}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-purple-100 hover:bg-purple-950/40 border border-purple-900/30 transition-all cursor-pointer ${
                    isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'
                  }`}
                  title="Manage Roles, Accounts & Permissions"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">Role & Permissions</span>}
                  </div>
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1.5 py-0.2 rounded font-mono font-bold">
                      RBAC
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer / Active User Perspective Switcher */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl transition-all text-left ${
                isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/50 shrink-0"
                />
                {(!isCollapsed || isMobileOpen) && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-none">
                      {currentUser.name.split(',')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-1 leading-none">
                      {currentUser.role.split('&')[0]}
                    </p>
                  </div>
                )}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </button>

            {/* Dropdown for Switching Perspective */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Active Consultant Perspective
                </p>
                <div className="mt-1 space-y-1">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setCurrentUser(member);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                        currentUser.id === member.id
                          ? 'bg-emerald-950 border border-emerald-700 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{member.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{member.roleTitle || member.role}</p>
                      </div>
                      {currentUser.id === member.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-mono">SIINas • OSS-RBA</span>
              <span className="text-emerald-400 font-semibold">Online v2.4</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
