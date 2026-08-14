import React, { useState } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { Sidebar, MainTabType } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiMetrics } from './components/KpiMetrics';
import { FilterBar } from './components/FilterBar';
import { ProjectTable } from './components/ProjectTable';
import { ProjectKanban } from './components/ProjectKanban';
import { ProjectGanttChart } from './components/ProjectGanttChart';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { JobDispositionModal } from './components/JobDispositionModal';
import { JobDispositionBoard } from './components/JobDispositionBoard';
import { DocumentManager } from './components/DocumentManager';
import { TkdnCalculatorModal } from './components/TkdnCalculatorModal';
import { NewProjectModal } from './components/NewProjectModal';
import { TeamWorkloadView } from './components/TeamWorkloadView';
import { ExportReportModal } from './components/ExportReportModal';
import { FinancialManagement } from './components/finance/FinancialManagement';
import { LoginView } from './components/LoginView';
import { RoleManagerModal } from './components/RoleManagerModal';
import {
  ConsultingProject,
  JobDisposition,
  TeamMember,
} from './types';

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
      />

      {/* Main Admin Wrapper */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
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
        />

        {/* Main Workspace Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        </main>

        {/* Admin Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">VERIX Consulting CRM</span>
              <span>•</span>
              <span>SIINas, OSS-RBA & TKDN Permenperin Compliance System</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Surveyor Indonesia & Sucofindo Audit Interface</span>
              <span>•</span>
              <span>Standardized Domestic Component Index</span>
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
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

      {/* 5. Export Dossier Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* 6. Role & Access Control Manager Modal */}
      <RoleManagerModal
        isOpen={isRoleManagerOpen}
        onClose={() => setIsRoleManagerOpen(false)}
      />
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

