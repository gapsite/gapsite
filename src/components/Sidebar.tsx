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
  FileText,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Building,
  BarChart3,
  ShieldAlert,
  KeyRound,
  LogOut,
  Lock,
  User,
  Landmark,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';

export type MainTabType = 'projects' | 'dispositions' | 'finance' | 'receivables' | 'bank-loans' | 'financial-reports' | 'documents' | 'calculator' | 'team';

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
  onOpenServiceManager?: () => void;
  onOpenDocTypeManager?: () => void;
  onOpenTransactionCategoryManager?: () => void;
  onOpenUserProfile?: () => void;
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
  onOpenServiceManager,
  onOpenDocTypeManager,
  onOpenUserProfile,
}) => {
  const {
    projects,
    dispositions,
    transactions,
    bankLoans,
    receivables,
    teamMembers,
    currentUser,
    logout,
    pendingMembersCount,
    consultingServices,
    documentTypes,
    isMasterAdmin,
    hasPermission,
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
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-150 print:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-200 ease-in-out print:hidden ${
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
                    GAP<span className="text-emerald-400">.CRM</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Legal & Compliance
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

        {/* Quick Action Dispatch Button (Hidden if user lacks both CREATE_PROJECTS and MANAGE_DISPOSITIONS) */}
        {(hasPermission('CREATE_PROJECTS') || hasPermission('MANAGE_DISPOSITIONS')) && (
          <div className="p-3 shrink-0 border-b border-slate-800/60">
            {(!isCollapsed || isMobileOpen) ? (
              <div className="space-y-1.5">
                {hasPermission('CREATE_PROJECTS') && (
                  <button
                    onClick={onOpenNewProject}
                    className="w-full px-3.5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.01]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>New Project</span>
                  </button>
                )}

                {hasPermission('MANAGE_DISPOSITIONS') && (
                  <button
                    onClick={onOpenNewDisposition}
                    className="w-full px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dispatch Task</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {hasPermission('CREATE_PROJECTS') && (
                  <button
                    onClick={onOpenNewProject}
                    className="w-10 h-10 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/30 hover:from-emerald-500 hover:to-teal-500 transition-all"
                    title="New Project"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
                {hasPermission('MANAGE_DISPOSITIONS') && (
                  <button
                    onClick={onOpenNewDisposition}
                    className="w-10 h-8 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all"
                    title="Dispatch Job Task"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          {/* SECTION 1: CRM & PROJECT PIPELINE */}
          {(hasPermission('VIEW_PROJECTS') || hasPermission('MANAGE_DISPOSITIONS') || (currentUser.role !== 'CLIENT_VIEWER')) && (
            <div>
              {(!isCollapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  CRM & Pipeline
                </p>
              )}
              <div className="space-y-1">
                {/* Projects CRM */}
                {hasPermission('VIEW_PROJECTS') && (
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
                )}

                {/* Job Dispositions & Tasks */}
                {hasPermission('MANAGE_DISPOSITIONS') && (
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
                )}

                {/* Team Workload Matrix (Internal Staff & Admin) */}
                {currentUser.role !== 'CLIENT_VIEWER' && (
                  <button
                    onClick={() => handleNavClick('team')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'team'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                    title="Team & Capacity Matrix"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className={`w-4 h-4 shrink-0 ${activeTab === 'team' ? 'text-slate-950' : 'text-cyan-400'}`} />
                      {(!isCollapsed || isMobileOpen) && <span className="truncate">Team Workload</span>}
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {teamMembers.length} Staff
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: FINANCIAL MANAGEMENT SUITE */}
          {hasPermission('MANAGE_FINANCE') && (
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
                  title="Finance, Cash Flow & Disbursements"
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
                      {transactions.length}
                    </span>
                  )}
                </button>

                {/* Piutang Usaha & Invoice Termin Tab */}
                <button
                  onClick={() => handleNavClick('receivables')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'receivables'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                  title="Piutang Usaha, Invoice Termin & Aging Schedule"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Receipt className={`w-4 h-4 shrink-0 ${activeTab === 'receivables' ? 'text-slate-950' : 'text-indigo-400'}`} />
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">Piutang Usaha (AR)</span>}
                  </div>
                  {(!isCollapsed || isMobileOpen) && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        activeTab === 'receivables'
                          ? 'bg-slate-950 text-emerald-300'
                          : receivables && receivables.filter((r) => r.status !== 'LUNAS' && r.status !== 'BATAL').length > 0
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {receivables ? receivables.filter((r) => r.status !== 'LUNAS' && r.status !== 'BATAL').length : 0} Aktif
                    </span>
                  )}
                </button>

                {/* Debt & Bank Loans Tab */}
                <button
                  onClick={() => handleNavClick('bank-loans')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'bank-loans'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                  title="Debt & Bank Loan Management"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Landmark className={`w-4 h-4 shrink-0 ${activeTab === 'bank-loans' ? 'text-slate-950' : 'text-indigo-400'}`} />
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">Debt & Bank Loans</span>}
                  </div>
                  {(!isCollapsed || isMobileOpen) && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        activeTab === 'bank-loans'
                          ? 'bg-slate-950 text-emerald-300'
                          : bankLoans && bankLoans.length > 0
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {bankLoans ? bankLoans.length : 0} Loan
                    </span>
                  )}
                </button>

                {/* Financial Reports & Output Generator Tab */}
                <button
                  onClick={() => handleNavClick('financial-reports')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'financial-reports'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                  title="Output Laporan Keuangan Resmi & Laba Rugi"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className={`w-4 h-4 shrink-0 ${activeTab === 'financial-reports' ? 'text-slate-950' : 'text-teal-400'}`} />
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">Laporan Keuangan</span>}
                  </div>
                  {(!isCollapsed || isMobileOpen) && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                        activeTab === 'financial-reports'
                          ? 'bg-slate-950 text-emerald-300'
                          : 'bg-teal-950 text-teal-300 border border-teal-800'
                      }`}
                    >
                      Report
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: DOCUMENT & BOM VAULT */}
          {(hasPermission('UPLOAD_DOCUMENTS') || hasPermission('VERIFY_DOCUMENTS') || hasPermission('VIEW_PROJECTS')) && (
            <div>
              {(!isCollapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Vault & Documents
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
                  title="Commercial & Technical Vault"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCheck className={`w-4 h-4 shrink-0 ${activeTab === 'documents' ? 'text-slate-950' : 'text-indigo-400'}`} />
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">Document Vault</span>}
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
          )}

          {/* SECTION 4: TOOLS & MASTER DATA */}
          {(hasPermission('CALCULATE_TKDN') ||
            hasPermission('EXPORT_AUDIT_REPORTS') ||
            isMasterAdmin) && (
            <div>
              {(!isCollapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Tools & Master Data
                </p>
              )}
              <div className="space-y-1">
                {/* TKDN Estimator */}
                {hasPermission('CALCULATE_TKDN') && (
                  <button
                    onClick={() => handleNavClick('calculator')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'calculator'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}`}
                    title="TKDN Formula Estimator"
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
                )}

                {/* File & Report Export */}
                {hasPermission('EXPORT_AUDIT_REPORTS') && (
                  <button
                    onClick={onOpenExport}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
                      isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-start'
                    }`}
                    title="Export Consulting Portfolio & Report"
                  >
                    <Download className="w-4 h-4 text-slate-400 shrink-0" />
                    {(!isCollapsed || isMobileOpen) && <span>Export Files & Reports</span>}
                  </button>
                )}

                {/* Roles & Access Control (Master Admin Only) */}
                {isMasterAdmin && onOpenRoleManager && (
                  <button
                    onClick={onOpenRoleManager}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      pendingMembersCount > 0
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/50'
                        : 'text-purple-300 hover:text-purple-100 hover:bg-purple-950/40 border border-purple-900/30'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center px-2 relative' : 'justify-between'}`}
                    title="Role & Permissions Management (Master Admin Only)"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldCheck className={`w-4 h-4 shrink-0 ${pendingMembersCount > 0 ? 'text-amber-400' : 'text-purple-400'}`} />
                      {(!isCollapsed || isMobileOpen) && <span className="truncate">Role & Permissions</span>}
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                      pendingMembersCount > 0 ? (
                        <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                          {pendingMembersCount} Pending
                        </span>
                      ) : (
                        <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1.5 py-0.2 rounded font-mono font-bold">
                          RBAC
                        </span>
                      )
                    )}
                    {isCollapsed && !isMobileOpen && pendingMembersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 rounded-full text-[8px] font-bold flex items-center justify-center">
                        {pendingMembersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Statutory Consulting Services Catalog (Master Admin Only) */}
                {isMasterAdmin && onOpenServiceManager && (
                  <button
                    onClick={onOpenServiceManager}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-amber-300 hover:text-amber-100 hover:bg-amber-950/40 border border-amber-500/30 ${
                      isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'
                    }`}
                    title="Statutory Consulting Services Catalog (Master Admin Only)"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Layers className="w-4 h-4 shrink-0 text-amber-400" />
                      {(!isCollapsed || isMobileOpen) && <span className="truncate">Services Catalog</span>}
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {consultingServices.length} Types
                      </span>
                    )}
                  </button>
                )}

                {/* Required Document Types Master Repository (Master Admin Only) */}
                {isMasterAdmin && onOpenDocTypeManager && (
                  <button
                    onClick={onOpenDocTypeManager}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-blue-300 hover:text-blue-100 hover:bg-blue-950/40 border border-blue-500/30 ${
                      isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'
                    }`}
                    title="Required Document Types Catalog (Master Admin Only)"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                      {(!isCollapsed || isMobileOpen) && <span className="truncate">Required Doc Types</span>}
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {documentTypes.length} Types
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Active User Perspective Switcher */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-left cursor-pointer ${
                currentUser.role === 'MASTER_ADMIN'
                  ? 'bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-500/50 hover:border-amber-400'
                  : 'hover:bg-slate-800'
              } ${
                isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className={`w-8 h-8 rounded-full object-cover ${
                      currentUser.role === 'MASTER_ADMIN'
                        ? 'border-2 border-amber-400 ring-2 ring-amber-400/40'
                        : 'ring-2 ring-emerald-500/50'
                    }`}
                  />
                  {currentUser.role === 'MASTER_ADMIN' && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 text-slate-950 rounded-full text-[8px] font-black flex items-center justify-center shadow-xs">
                      ★
                    </span>
                  )}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate leading-none">
                        {currentUser.name.split(',')[0]}
                      </p>
                      {currentUser.role === 'MASTER_ADMIN' && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-mono">
                          SUPREME
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate mt-1 leading-none ${currentUser.role === 'MASTER_ADMIN' ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
                      {currentUser.role === 'MASTER_ADMIN' ? 'MASTER ADMIN' : currentUser.role.split('&')[0]}
                    </p>
                  </div>
                )}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </button>

            {/* Dropdown for Logged-In User Profile */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Active Session Badge */}
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

                {/* User Identity Details */}
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 mb-2.5">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{currentUser.roleTitle || currentUser.role}</p>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">@{currentUser.username}</span>
                    <span className="truncate max-w-[120px]">{currentUser.email}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 px-1 mb-2 leading-relaxed">
                  Account switching is locked to your authenticated session. To use another profile, please sign out and enter that account's login credentials.
                </p>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  {onOpenUserProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenUserProfile();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer border border-emerald-800/60"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Personalize My Profile</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 rounded-lg transition-colors cursor-pointer shadow-xs"
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
              <span className="font-medium">PT Gandhara Artha Persada</span>
              <span className="text-emerald-400 font-semibold">Online v2.4</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
