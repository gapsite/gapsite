import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Clock,
  Calculator,
  FolderKanban,
  Wallet,
  FileCheck,
  FileSpreadsheet,
  Receipt,
  Landmark,
  Users,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  BadgeCheck,
  Lock,
  User,
  Sparkles,
  KeyRound,
  Printer,
  Tag,
  CreditCard,
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
  onOpenServiceManager?: () => void;
  onOpenDocTypeManager?: () => void;
  onOpenLetterheadManager?: () => void;
  onOpenTransactionCategoryManager?: () => void;
  onOpenPaymentChannelManager?: () => void;
  onOpenUserProfile?: () => void;
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
  onOpenServiceManager,
  onOpenDocTypeManager,
  onOpenLetterheadManager,
  onOpenTransactionCategoryManager,
  onOpenPaymentChannelManager,
  onOpenUserProfile,
}) => {
  const {
    projects,
    dispositions,
    transactions,
    payrollRecords,
    receivables,
    bankLoans,
    taxObligations,
    transactionCategories,
    paymentChannels,
    teamMembers,
    currentUser,
    logout,
    hasPermission,
    filters,
    setFilters,
    pendingMembersCount,
    isMasterAdmin,
    consultingServices,
    documentTypes,
  } = useProjects();

  const isAdminMaster = Boolean(
    currentUser && (
      currentUser.username === 'admin.master' ||
      currentUser.username === 'admin_master' ||
      currentUser.role === 'MASTER_ADMIN' ||
      currentUser.role === 'ADMIN_MASTER' ||
      currentUser.id === 'usr-0' ||
      isMasterAdmin
    )
  );

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
          subtitle: '',
          icon: FolderKanban,
          badge: `${projects.length} Active Accounts`,
        };
      case 'dispositions':
        return {
          title: 'Job Dispositions & Task Dispatch',
          subtitle: '',
          icon: Clock,
          badge: `${pendingDispositions.length} Pending Actions`,
        };
      case 'finance':
        return {
          title: 'Financial Management Suite',
          subtitle: '',
          icon: Wallet,
          badge: `${transactions.length} Ledger Records`,
        };
      case 'payroll':
        return {
          title: 'Gaji Karyawan & Payroll Konsultan',
          subtitle: 'Penggajian, Slip Gaji Resmi, Tunjangan, PPh 21 TER, & Pencatatan Kas Realtime',
          icon: Users,
          badge: `${payrollRecords.length} Slip Gaji`,
        };
      case 'receivables':
        return {
          title: 'Piutang Usaha & Invoice Termin',
          subtitle: 'Monitoring Tagihan Klien, Aging Schedule, & Pembayaran Invoice',
          icon: Receipt,
          badge: `${receivables.filter((r) => r.status !== 'LUNAS' && r.status !== 'BATAL').length} Tagihan Aktif`,
        };
      case 'bank-loans':
        return {
          title: 'Debt & Bank Loan Management',
          subtitle: 'Kredit Modal Kerja, Pinjaman Bank, & Jadwal Cicilan',
          icon: Landmark,
          badge: `${bankLoans.length} Fasilitas Pinjaman`,
        };
      case 'tax':
        return {
          title: 'Pajak & Kewajiban Perpajakan (PPN & PPh)',
          subtitle: 'Monitoring PPN Keluaran/Masukan, PPh 21 TER, PPh 23, PPh Final 4(2), & Status Pembayaran NTPN',
          icon: Receipt,
          badge: `${taxObligations.filter((t) => t.status !== 'PAID').length} Terhutang`,
        };
      case 'financial-reports':
        return {
          title: 'Laporan Keuangan & Output Finansial',
          subtitle: '',
          icon: FileSpreadsheet,
          badge: 'Official Reports Studio',
        };
      case 'documents':
        return {
          title: 'Document & Commercial Vault',
          subtitle: '',
          icon: FileCheck,
          badge: 'Categorized Vault',
        };
      case 'calculator':
        return {
          title: 'TKDN Permenperin Estimator',
          subtitle: '',
          icon: Calculator,
          badge: 'Permenperin Compliance',
        };
      case 'team':
        return {
          title: 'Team & Workload Matrix',
          subtitle: '',
          icon: Users,
          badge: `${teamMembers.length} Consultants`,
        };
      default:
        return {
          title: 'Admin Dashboard',
          subtitle: '',
          icon: Layers,
          badge: 'Operations',
        };
    }
  };

  const page = getPageDetails();
  const IconComponent = page.icon;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs print:hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile Sidebar Trigger & Breadcrumb / Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
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
                {page.subtitle && (
                  <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                    {page.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md hidden md:block">
            <div className="relative">
              <label htmlFor="global-search-input" className="sr-only">
                Search projects, client PT, KBLI, PIC, or disposition
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              <input
                id="global-search-input"
                name="search"
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search projects, client PT, KBLI, PIC, disposition #..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 text-slate-900 placeholder-slate-500 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  aria-label="Clear search input"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded bg-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Action Controls, Notification & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Master Admin / Approver Verification Quick Action Button (Shows when pending members exist and user is authorized) */}
            {(isMasterAdmin || hasPermission('VERIFY_NEW_USERS') || hasPermission('MANAGE_USERS_ROLES')) && pendingMembersCount > 0 && onOpenRoleManager && (
              <button
                onClick={onOpenRoleManager}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer ${
                  isMasterAdmin
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
                title={isMasterAdmin ? 'Master Admin: Verify Registered Members' : 'View Pending Registrations'}
              >
                {isMasterAdmin ? (
                  <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="hidden sm:inline">{isMasterAdmin ? 'Verify Members' : 'Pending Approvals'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isMasterAdmin ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 text-amber-900'
                }`}>
                  {pendingMembersCount}
                </span>
              </button>
            )}

            {/* Statutory Services Catalog Button (admin.master exclusive) */}
            {isMasterAdmin && onOpenServiceManager && (
              <button
                onClick={onOpenServiceManager}
                className="p-2 rounded-xl transition-colors hidden lg:flex items-center gap-1.5 text-xs font-semibold border cursor-pointer text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200"
                title="Consulting Services Catalog, Offerings & Statutory Types"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Services</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-200/80 text-amber-950">
                  {consultingServices.length}
                </span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors border border-slate-300"
                title="Notifications & Dispositions"
                aria-label={`Notifications & Dispositions (${pendingDispositions.length + (isMasterAdmin ? pendingMembersCount : 0)} pending)`}
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {(pendingDispositions.length > 0 || pendingMembersCount > 0) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-white">
                    {pendingDispositions.length + (isMasterAdmin ? pendingMembersCount : 0)}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      Active Notifications & Dispositions
                    </h4>
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                      {pendingDispositions.length + pendingMembersCount} Pending
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                    {/* Master Admin Pending User Notification Banner */}
                    {pendingMembersCount > 0 && (
                      <div
                        onClick={() => {
                          setShowNotifications(false);
                          if (onOpenRoleManager) onOpenRoleManager();
                        }}
                        className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-2.5 ${
                          isMasterAdmin
                            ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <BadgeCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isMasterAdmin ? 'text-amber-700' : 'text-slate-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">New Registrations Pending</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono">
                              {pendingMembersCount} PENDING
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {isMasterAdmin
                              ? `Action Required: ${pendingMembersCount} applicant(s) awaiting your Master Admin verification and signoff.`
                              : `${pendingMembersCount} applicant(s) awaiting Master Admin (admin.master) statutory signoff.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {pendingDispositions.length === 0 && pendingMembersCount === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No pending notifications right now.</p>
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
                className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl transition-all text-left cursor-pointer ${
                  currentUser.role === 'MASTER_ADMIN'
                    ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-400 shadow-xs ring-1 ring-amber-400/30 hover:border-amber-500'
                    : 'border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className={`w-7 h-7 rounded-full object-cover ${
                      currentUser.role === 'MASTER_ADMIN'
                        ? 'border border-amber-400 ring-2 ring-amber-400/50'
                        : 'ring-1 ring-emerald-500'
                    }`}
                  />
                  {currentUser.role === 'MASTER_ADMIN' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 text-slate-950 rounded-full text-[7px] font-black flex items-center justify-center shadow-xs">
                      ★
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[100px]">
                      {currentUser.name.split(',')[0]}
                    </p>
                    {currentUser.role === 'MASTER_ADMIN' && (
                      <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-mono">
                        SUPREME
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] leading-none mt-0.5 truncate max-w-[100px] ${currentUser.role === 'MASTER_ADMIN' ? 'text-amber-800 font-bold' : 'text-slate-400'}`}>
                    {currentUser.role === 'MASTER_ADMIN' ? 'MASTER ADMIN' : currentUser.role.split('&')[0]}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User switcher popup */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className={`p-2.5 rounded-xl border mb-2 ${
                    currentUser.role === 'MASTER_ADMIN'
                      ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-400 shadow-sm'
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className={`w-10 h-10 rounded-full object-cover ${
                            currentUser.role === 'MASTER_ADMIN' ? 'border-2 border-amber-400 ring-2 ring-amber-400/40' : 'border border-slate-200'
                          }`}
                        />
                        {currentUser.role === 'MASTER_ADMIN' && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-md">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                          {currentUser.role === 'MASTER_ADMIN' && (
                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono">
                              SUPREME
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 border ${
                          currentUser.role === 'MASTER_ADMIN'
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }`}>
                          {currentUser.role.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          @{currentUser.username || currentUser.email.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personalize Profile & My Account - Available for EVERY SINGLE ROLE */}
                  {onOpenUserProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenUserProfile();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors mb-1.5 border border-emerald-200 cursor-pointer shadow-xs"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Personalize My Profile</span>
                    </button>
                  )}

                  {isAdminMaster && onOpenRoleManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenRoleManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors mb-1.5 border border-purple-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Role & Access Manager</span>
                      </span>
                      {pendingMembersCount > 0 ? (
                        <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-mono font-bold">
                          {pendingMembersCount} Pending
                        </span>
                      ) : (
                        <span className="text-[10px] bg-purple-200/70 text-purple-900 px-1.5 py-0.2 rounded font-mono">
                          RBAC
                        </span>
                      )}
                    </button>
                  )}

                  {isAdminMaster && onOpenServiceManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenServiceManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors mb-1.5 border cursor-pointer text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>Services Catalog</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-200 text-amber-950">
                        {consultingServices.length} Types
                      </span>
                    </button>
                  )}

                  {isAdminMaster && onOpenDocTypeManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenDocTypeManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors mb-1.5 border cursor-pointer text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-300"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Required Doc Types</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-blue-200 text-blue-950">
                        {documentTypes.length} Types
                      </span>
                    </button>
                  )}

                  {isAdminMaster && onOpenTransactionCategoryManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenTransactionCategoryManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors mb-1.5 border cursor-pointer text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border-indigo-300"
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        <span>Kategori Transaksi</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-indigo-200 text-indigo-950">
                        {transactionCategories ? transactionCategories.length : 0} Kat
                      </span>
                    </button>
                  )}

                  {isAdminMaster && onOpenPaymentChannelManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenPaymentChannelManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors mb-1.5 border cursor-pointer text-sky-900 bg-sky-50 hover:bg-sky-100 border-sky-300"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-sky-600" />
                        <span>Saluran Bank & Rek</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-sky-200 text-sky-950">
                        {paymentChannels ? paymentChannels.length : 0} Rek
                      </span>
                    </button>
                  )}

                  {isAdminMaster && onOpenLetterheadManager && (
                    <button
                      id="btn-header-letterhead-manager"
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLetterheadManager();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-colors mb-2 border cursor-pointer text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                    >
                      <span className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-emerald-600" />
                        <span>Kop Surat & Logo</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-emerald-200 text-emerald-950">
                        admin.master
                      </span>
                    </button>
                  )}

                  {/* Active Session Security Card */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Active Session</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Logged In
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      Account switching is locked to your authenticated session. To use another profile, please sign out and enter that account's login credentials.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-4 h-4" />
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
