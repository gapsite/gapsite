import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Clock,
  Calculator,
  Download,
  FolderKanban,
  Wallet,
  FileCheck,
  Users,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { MainTabType } from './Sidebar';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  onToggleMobileSidebar: () => void;
  onOpenNewProject: () => void;
  onOpenNewDisposition: () => void;
  onOpenTkdnCalculator: () => void;
  onOpenExport: () => void;
  onOpenRoleManager?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onToggleMobileSidebar,
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
    currentUser,
    setCurrentUser,
    teamMembers,
    logout,
    hasPermission,
    filters,
    setFilters,
  } = useProjects();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pendingDispositions = dispositions.filter(
    (d) => d.status === 'PENDING' || d.status === 'IN_PROGRESS' || d.status === 'UNDER_REVIEW'
  );

  const getPageDetails = () => {
    switch (activeTab) {
      case 'projects':
        return {
          title: 'Projects CRM Pipeline',
          subtitle: 'SIINas industrial licensing & TKDN certification tracker',
          icon: FolderKanban,
          badge: `${projects.length} Active Accounts`,
        };
      case 'dispositions':
        return {
          title: 'Job Dispositions & Task Dispatch',
          subtitle: 'Consultant delegation, technical BOM drafting & deadlines',
          icon: Clock,
          badge: `${pendingDispositions.length} Pending Actions`,
        };
      case 'finance':
        return {
          title: 'Financial Management Suite',
          subtitle: 'Daily cash flow, surveyor disbursements & consulting fees',
          icon: Wallet,
          badge: `${transactions.length} Ledger Records`,
        };
      case 'documents':
        return {
          title: 'Document & Commercial Vault',
          subtitle: 'Quotation letters, kwitansi, expense proofs & BOM dossiers',
          icon: FileCheck,
          badge: 'Categorized Vault',
        };
      case 'calculator':
        return {
          title: 'TKDN Permenperin Estimator',
          subtitle: 'Direct labor, materials & manufacturing index calculator',
          icon: Calculator,
          badge: 'Permenperin Compliance',
        };
      case 'team':
        return {
          title: 'Team & Workload Matrix',
          subtitle: 'Consultant capacity, active assignments & certifications',
          icon: Users,
          badge: `${teamMembers.length} Consultants`,
        };
      default:
        return {
          title: 'Admin Dashboard',
          subtitle: 'TKDN & Licensing CRM',
          icon: Layers,
          badge: 'Operations',
        };
    }
  };

  const page = getPageDetails();
  const IconComponent = page.icon;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile Sidebar Trigger & Breadcrumb / Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Context Details */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-800 shrink-0 hidden sm:flex">
                <IconComponent className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {page.title}
                  </h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hidden md:inline-block">
                    {page.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  {page.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search projects, clients, KBLI, invoices..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded bg-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Action Controls, Notification & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick TKDN Estimator Button */}
            <button
              onClick={onOpenTkdnCalculator}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors hidden xl:flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
              title="TKDN Permenperin Formula Estimator"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>TKDN Calc</span>
            </button>

            {/* Quick Export Button */}
            <button
              onClick={onOpenExport}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors hidden lg:flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
              title="Export Project Reports & Audit Dossiers"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                title="Notifications & Dispositions"
              >
                <Bell className="w-4 h-4" />
                {pendingDispositions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-white">
                    {pendingDispositions.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      Active Job Dispositions
                    </h4>
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                      {pendingDispositions.length} Pending
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                    {pendingDispositions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No pending dispositions right now.</p>
                    ) : (
                      pendingDispositions.slice(0, 5).map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setActiveTab('dispositions');
                            setShowNotifications(false);
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{d.title}</p>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              d.priority === 'URGENT' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {d.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{d.clientName}</p>
                          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                            <span>To: {d.assignedToName.split(',')[0]}</span>
                            <span className="font-semibold text-amber-700">Due {d.dueDate}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Pill on Header */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[100px]">
                    {currentUser.name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-[100px]">
                    {currentUser.role.split('&')[0]}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User switcher popup */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 inline-block mt-0.5">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          @{currentUser.username || currentUser.email.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {onOpenRoleManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenRoleManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors mb-2 border border-purple-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Role & Access Manager</span>
                      </span>
                      <span className="text-[10px] bg-purple-200/70 text-purple-900 px-1.5 py-0.2 rounded font-mono">
                        RBAC
                      </span>
                    </button>
                  )}

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span>Quick Switch Perspective</span>
                    <span className="font-mono text-[9px]">Demo Mode</span>
                  </p>
                  <div className="mt-1 space-y-1 max-h-44 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setCurrentUser(member);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          currentUser.id === member.id
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{member.roleTitle || member.role}</p>
                        </div>
                        {currentUser.id === member.id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
      </div>
    </header>
  );
};
