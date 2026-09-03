import React, { useState, Suspense } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { Sidebar, MainTabType } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterBar } from './components/FilterBar';
import { ProjectTable } from './components/ProjectTable';
import { LoginView } from './components/LoginView';
import { RealtimeRoleToast } from './components/RealtimeRoleToast';
import {
  ConsultingProject,
  JobDisposition,
  TeamMember,
} from './types';

// Dynamic imports (React.lazy) for heavy modules and views to optimize bundle chunking
const ProjectKanban = React.lazy(() =>
  import('./components/ProjectKanban').then((m) => ({ default: m.ProjectKanban }))
);
const ProjectGanttChart = React.lazy(() =>
  import('./components/ProjectGanttChart').then((m) => ({ default: m.ProjectGanttChart }))
);
const ProjectDetailModal = React.lazy(() =>
  import('./components/ProjectDetailModal').then((m) => ({ default: m.ProjectDetailModal }))
);
const JobDispositionModal = React.lazy(() =>
  import('./components/JobDispositionModal').then((m) => ({ default: m.JobDispositionModal }))
);
const JobDispositionBoard = React.lazy(() =>
  import('./components/JobDispositionBoard').then((m) => ({ default: m.JobDispositionBoard }))
);
const DocumentManager = React.lazy(() =>
  import('./components/DocumentManager').then((m) => ({ default: m.DocumentManager }))
);
const TkdnCalculatorModal = React.lazy(() =>
  import('./components/TkdnCalculatorModal').then((m) => ({ default: m.TkdnCalculatorModal }))
);
const NewProjectModal = React.lazy(() =>
  import('./components/NewProjectModal').then((m) => ({ default: m.NewProjectModal }))
);
const TeamWorkloadView = React.lazy(() =>
  import('./components/TeamWorkloadView').then((m) => ({ default: m.TeamWorkloadView }))
);
const ExportReportModal = React.lazy(() =>
  import('./components/ExportReportModal').then((m) => ({ default: m.ExportReportModal }))
);
const FinancialManagement = React.lazy(() =>
  import('./components/finance/FinancialManagement').then((m) => ({ default: m.FinancialManagement }))
);
const FinancialReportGenerator = React.lazy(() =>
  import('./components/finance/FinancialReportGenerator').then((m) => ({ default: m.FinancialReportGenerator }))
);
const RoleManagerModal = React.lazy(() =>
  import('./components/RoleManagerModal').then((m) => ({ default: m.RoleManagerModal }))
);
const ServiceTypeManagerModal = React.lazy(() =>
  import('./components/ServiceTypeManagerModal').then((m) => ({ default: m.ServiceTypeManagerModal }))
);
const DocumentTypeManagerModal = React.lazy(() =>
  import('./components/DocumentTypeManagerModal').then((m) => ({ default: m.DocumentTypeManagerModal }))
);
const UserProfileModal = React.lazy(() =>
  import('./components/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
const CompanyLetterheadModal = React.lazy(() =>
  import('./components/CompanyLetterheadModal').then((m) => ({ default: m.CompanyLetterheadModal }))
);
const TransactionCategoryManagerModal = React.lazy(() =>
  import('./components/finance/TransactionCategoryManagerModal').then((m) => ({
    default: m.TransactionCategoryManagerModal,
  }))
);
const PaymentChannelManagerModal = React.lazy(() =>
  import('./components/finance/PaymentChannelManagerModal').then((m) => ({
    default: m.PaymentChannelManagerModal,
  }))
);

const ModuleLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500 min-h-[300px] animate-in fade-in duration-200">
    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs font-medium text-slate-500">Memuat modul antarmuka...</span>
  </div>
);

const DashboardContent: React.FC = () => {
  const { selectedProject, setSelectedProjectId, isAuthenticated, hasPermission } = useProjects();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<MainTabType>('projects');
  
  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // View Mode for Projects CRM (Table vs Kanban vs Gantt)
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'gantt'>('table');

  // Modal Visibility States
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewDispositionOpen, setIsNewDispositionOpen] = useState(false);
  const [isTkdnCalcOpen, setIsTkdnCalcOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isServiceTypeManagerOpen, setIsServiceTypeManagerOpen] = useState(false);
  const [isDocTypeManagerOpen, setIsDocTypeManagerOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isCompanyLetterheadOpen, setIsCompanyLetterheadOpen] = useState(false);
  const [isTransactionCategoryManagerOpen, setIsTransactionCategoryManagerOpen] = useState(false);
  const [isPaymentChannelManagerOpen, setIsPaymentChannelManagerOpen] = useState(false);

  // Selected state for disposition modal
  const [dispositionTargetProject, setDispositionTargetProject] = useState<ConsultingProject | null>(null);
  const [editingDisposition, setEditingDisposition] = useState<JobDisposition | null>(null);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenDispositionForProject = (project: ConsultingProject) => {
    setDispositionTargetProject(project);
    setEditingDisposition(null);
    setIsNewDispositionOpen(true);
  };

  const handleEditDisposition = (disp: JobDisposition) => {
    setEditingDisposition(disp);
    setDispositionTargetProject(null);
    setIsNewDispositionOpen(true);
  };

  const handleAssignToTeamMember = (member: TeamMember) => {
    setEditingDisposition(null);
    setDispositionTargetProject(null);
    setIsNewDispositionOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Real-time Role Notification Banner/Toast */}
      <RealtimeRoleToast />

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenNewDisposition={() => {
          setDispositionTargetProject(null);
          setEditingDisposition(null);
          setIsNewDispositionOpen(true);
        }}
        onOpenTkdnCalculator={() => setIsTkdnCalcOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenRoleManager={() => setIsRoleManagerOpen(true)}
        onOpenServiceManager={() => setIsServiceTypeManagerOpen(true)}
        onOpenDocTypeManager={() => setIsDocTypeManagerOpen(true)}
        onOpenLetterheadManager={() => setIsCompanyLetterheadOpen(true)}
        onOpenTransactionCategoryManager={() => setIsTransactionCategoryManagerOpen(true)}
        onOpenPaymentChannelManager={() => setIsPaymentChannelManagerOpen(true)}
        onOpenUserProfile={() => setIsUserProfileOpen(true)}
      />

      {/* Main Admin Wrapper */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ease-in-out print:pl-0 print:block ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onOpenNewDisposition={() => {
            setDispositionTargetProject(null);
            setEditingDisposition(null);
            setIsNewDispositionOpen(true);
          }}
          onOpenTkdnCalculator={() => setIsTkdnCalcOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenRoleManager={() => setIsRoleManagerOpen(true)}
          onOpenServiceManager={() => setIsServiceTypeManagerOpen(true)}
          onOpenDocTypeManager={() => setIsDocTypeManagerOpen(true)}
          onOpenLetterheadManager={() => setIsCompanyLetterheadOpen(true)}
          onOpenTransactionCategoryManager={() => setIsTransactionCategoryManagerOpen(true)}
          onOpenPaymentChannelManager={() => setIsPaymentChannelManagerOpen(true)}
          onOpenUserProfile={() => setIsUserProfileOpen(true)}
        />

        {/* Main Workspace Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
          <Suspense fallback={<ModuleLoadingFallback />}>
            {/* TAB 1: PROJECTS CRM DASHBOARD */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Executive Summary Metrics Ribbon */}
              <KpiMetrics />

              {/* Filter & View Toolbar */}
              <FilterBar viewMode={viewMode} setViewMode={setViewMode} />

              {/* Dynamic Views: Table, Stage Kanban, or Gantt Timeline */}
              {viewMode === 'table' && (
                <ProjectTable
                  onSelectProject={(p) => setSelectedProjectId(p.id)}
                  onOpenDispositionForProject={handleOpenDispositionForProject}
                />
              )}
              {viewMode === 'kanban' && (
                <ProjectKanban
                  onSelectProject={(p) => setSelectedProjectId(p.id)}
                  onOpenDispositionForProject={handleOpenDispositionForProject}
                />
              )}
              {viewMode === 'gantt' && (
                <ProjectGanttChart
                  onSelectProject={(p) => setSelectedProjectId(p.id)}
                  onOpenDispositionForProject={handleOpenDispositionForProject}
                />
              )}
            </div>
          )}

          {/* TAB 2: JOB DISPOSITIONS & TASKS */}
          {activeTab === 'dispositions' && (
            <div className="animate-in fade-in duration-150">
              <JobDispositionBoard
                onOpenNewDisposition={() => {
                  setDispositionTargetProject(null);
                  setEditingDisposition(null);
                  setIsNewDispositionOpen(true);
                }}
                onEditDisposition={handleEditDisposition}
              />
            </div>
          )}

          {/* TAB 3: FINANCIAL MANAGEMENT & DAILY CASH FLOW */}
          {activeTab === 'finance' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="LEDGER"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3-OVERHEAD: OPERATIONAL OVERHEAD EXPENSES */}
          {activeTab === 'overhead' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="OVERHEAD"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3-OFFICE-RENT: ANNUAL OFFICE RENT & 12-MONTH BREAKDOWN */}
          {activeTab === 'office-rent' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="OFFICE_RENT"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3-RETAIL: RETAIL & PRIVATE B2B PROJECTS */}
          {activeTab === 'retail-projects' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="RETAIL_PROJECTS"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3-GOV: GOVERNMENT PROJECT INCOME & SP2D DISBURSEMENT */}
          {activeTab === 'government-projects' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="GOVERNMENT_PROJECTS"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3A: ACCOUNTS RECEIVABLE & INVOICE MANAGEMENT */}
          {activeTab === 'receivables' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="RECEIVABLES"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3B: DEBT & BANK LOAN MANAGEMENT */}
          {activeTab === 'bank-loans' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="BANK_LOANS"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3E: TAX & STATUTORY OBLIGATIONS (PPN & PPh) */}
          {activeTab === 'tax' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="TAX_MANAGEMENT"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3C: EMPLOYEE SALARY & PAYROLL MANAGEMENT */}
          {activeTab === 'payroll' && (
            <div className="animate-in fade-in duration-150">
              <FinancialManagement
                initialTab="PAYROLL"
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
                onOpenReports={() => setActiveTab('financial-reports')}
              />
            </div>
          )}

          {/* TAB 3D: OFFICIAL FINANCIAL REPORTS & STATEMENTS OUTPUT */}
          {activeTab === 'financial-reports' && (
            <div className="animate-in fade-in duration-150">
              <FinancialReportGenerator
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                }}
              />
            </div>
          )}

          {/* TAB 4: DOCUMENT & BOM VAULT */}
          {activeTab === 'documents' && (
            <div className="animate-in fade-in duration-150">
              <DocumentManager />
            </div>
          )}

          {/* TAB 5: TKDN ESTIMATOR (Inline view) */}
          {activeTab === 'calculator' && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <TkdnCalculatorModal isOpen={true} onClose={() => setActiveTab('projects')} />
              </div>
            </div>
          )}

          {/* TAB 6: TEAM & WORKLOAD MATRIX */}
          {activeTab === 'team' && (
            <div className="animate-in fade-in duration-150">
              <TeamWorkloadView onAssignToMember={handleAssignToTeamMember} />
            </div>
          )}
          </Suspense>
        </main>

        {/* Admin Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center text-center">
            <span>Copyright © 2026 Adryan Kelvianto. All rights reserved.</span>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      <Suspense fallback={null}>
        {/* 1. Project Detail Workspace Modal */}
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProjectId(null)}
            onOpenNewDispositionForProject={handleOpenDispositionForProject}
          />
        )}

        {/* 2. Job Disposition / Task Assignment Modal */}
        <JobDispositionModal
          isOpen={isNewDispositionOpen}
          onClose={() => setIsNewDispositionOpen(false)}
          initialProject={dispositionTargetProject}
          editingDisposition={editingDisposition}
        />

        {/* 3. New Project Registration Modal */}
        <NewProjectModal
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
        />

        {/* 4. Quick TKDN Formula Calculator Modal (when triggered via header) */}
        {isTkdnCalcOpen && (
          <TkdnCalculatorModal
            isOpen={isTkdnCalcOpen}
            onClose={() => setIsTkdnCalcOpen(false)}
          />
        )}

        {/* 5. Export File & Report Modal */}
        <ExportReportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onOpenFinancialReports={() => {
            setIsExportOpen(false);
            setActiveTab('financial-reports');
          }}
        />

        {/* 6. Role & Access Control Manager Modal */}
        <RoleManagerModal
          isOpen={isRoleManagerOpen}
          onClose={() => setIsRoleManagerOpen(false)}
        />

        {/* 7. Statutory Consulting Services Catalog Manager Modal (admin.master exclusive) */}
        <ServiceTypeManagerModal
          isOpen={isServiceTypeManagerOpen}
          onClose={() => setIsServiceTypeManagerOpen(false)}
        />

        {/* 8. Required Document Types Master Catalog Modal (admin.master exclusive) */}
        <DocumentTypeManagerModal
          isOpen={isDocTypeManagerOpen}
          onClose={() => setIsDocTypeManagerOpen(false)}
        />

        {/* 9. Self-Service User Personalization & Profile Modal (Accessible for EVERY role) */}
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
        />

        {/* 10. Company Letterhead & Printable Document Identity Modal (admin.master exclusive) */}
        <CompanyLetterheadModal
          isOpen={isCompanyLetterheadOpen}
          onClose={() => setIsCompanyLetterheadOpen(false)}
        />

        {/* 11. Transaction Category Master Manager Modal */}
        <TransactionCategoryManagerModal
          isOpen={isTransactionCategoryManagerOpen}
          onClose={() => setIsTransactionCategoryManagerOpen(false)}
        />

        {/* 12. Payment Channel & Bank Accounts Manager Modal */}
        <PaymentChannelManagerModal
          isOpen={isPaymentChannelManagerOpen}
          onClose={() => setIsPaymentChannelManagerOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <DashboardContent />
    </ProjectProvider>
  );
}

