import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building,
  Sparkles,
  Layers,
  Filter,
  Plus,
  ArrowRight,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Calendar,
  UserCheck,
  Tag,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Trash2,
  X,
  RotateCcw,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import {
  ConsultingProject,
  DocumentType,
  EvaluatedMilestone,
  MilestoneStatus,
  ProjectStage,
  ServiceType,
  ProjectDocument,
} from '../types';
import {
  evaluateProjectMilestones,
  getComplianceReadinessBadge,
  CERTIFICATION_MILESTONE_TEMPLATES,
} from '../utils/checklistGenerator';
import {
  getStageName,
  getStageColor,
  getServiceTypeName,
  getServiceTypeBadgeColor,
  getDocTypeName,
  getDocStatusBadge,
} from '../utils/formatters';
import { useProjects } from '../context/ProjectContext';
import { CategorizedUploadModal } from './CategorizedUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentTypeManagerModal } from './DocumentTypeManagerModal';

interface CertificationChecklistProps {
  project: ConsultingProject;
  onOpenUploadModal?: (docType?: DocumentType) => void;
}

export const CertificationChecklist: React.FC<CertificationChecklistProps> = ({
  project,
}) => {
  const {
    projects,
    currentUser,
    toggleMilestoneManualSignoff,
    addCustomMilestoneToProject,
    deleteMilestoneFromProject,
    restoreMilestoneToProject,
    deleteDocRequirementFromMilestone,
    resetProjectMilestonesToDefault,
    deleteDocument,
    updateDocumentStatus,
    documentTypes,
    activeDocumentTypes,
    isMasterAdmin,
  } = useProjects();

  // Always bind to the active, live project from context
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === project.id) || project;
  }, [projects, project]);

  // Temporary action feedback notification toast
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ type, message });
    setTimeout(() => {
      setActionFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Local filters
  const [selectedStageFilter, setSelectedStageFilter] = useState<ProjectStage | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<MilestoneStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'documents'>('timeline');
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // Deletion Authorization & Confirmation States (admin.master)
  const [confirmDeleteMilestone, setConfirmDeleteMilestone] = useState<{
    id: string;
    title: string;
    stage: ProjectStage;
  } | null>(null);

  const [confirmDeleteDocReq, setConfirmDeleteDocReq] = useState<{
    milestoneId: string;
    milestoneTitle: string;
    docType: DocumentType;
    isOptional?: boolean;
    docName: string;
  } | null>(null);

  const [confirmDeleteFile, setConfirmDeleteFile] = useState<{
    docId: string;
    docName: string;
  } | null>(null);

  const [confirmResetChecklist, setConfirmResetChecklist] = useState(false);
  const [isManageDeletedModalOpen, setIsManageDeletedModalOpen] = useState(false);

  // Document Types Master Manager Modal
  const [isDocTypeModalOpen, setIsDocTypeModalOpen] = useState(false);

  // Manual signoff remarks drawer state
  const [activeSignoffMilestoneId, setActiveSignoffMilestoneId] = useState<string | null>(null);
  const [signoffNote, setSignoffNote] = useState('');

  // Add Custom Milestone Modal State
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customStage, setCustomStage] = useState<ProjectStage>('DOC_PREPARATION');
  const [customRegulatoryClause, setCustomRegulatoryClause] = useState('');
  const [customSelectedDocTypes, setCustomSelectedDocTypes] = useState<DocumentType[]>(['BOM_EXCEL']);

  // Document Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPreselectedDocType, setUploadPreselectedDocType] = useState<DocumentType | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  // Copy report feedback
  const [copiedReport, setCopiedReport] = useState(false);

  // Dynamically evaluate milestones on every render / document state change
  const { milestones, summary } = useMemo(() => {
    return evaluateProjectMilestones(currentProject);
  }, [currentProject]);

  const readiness = getComplianceReadinessBadge(summary.progressPercentage);

  // Group milestones by Stage for Stage-Flow timeline
  const stageOrder: ProjectStage[] = [
    'INQUIRY',
    'GAP_ANALYSIS',
    'DOC_PREPARATION',
    'FIELD_VERIFICATION',
    'MINISTRY_REVIEW',
    'CERTIFICATE_ISSUED',
  ];

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (selectedStageFilter !== 'ALL' && m.stage !== selectedStageFilter) return false;
      if (selectedStatusFilter !== 'ALL' && m.status !== selectedStatusFilter) return false;
      return true;
    });
  }, [milestones, selectedStageFilter, selectedStatusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenUploadForDocType = (docType: DocumentType) => {
    setUploadPreselectedDocType(docType);
    setIsUploadModalOpen(true);
  };

  const handleToggleManualSignoff = (milestoneId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      // Opening remark prompt
      setActiveSignoffMilestoneId(milestoneId);
      setSignoffNote('');
    } else {
      // Revoking signoff
      toggleMilestoneManualSignoff(currentProject.id, milestoneId, false);
      showFeedback('Tanda tangan manual checklist berhasil dicabut.', 'info');
    }
  };

  const handleConfirmManualSignoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSignoffMilestoneId) return;
    toggleMilestoneManualSignoff(currentProject.id, activeSignoffMilestoneId, true, signoffNote.trim());
    setActiveSignoffMilestoneId(null);
    setSignoffNote('');
    showFeedback('Milestone checklist berhasil diverifikasi manual.');
  };

  const handleCreateCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    addCustomMilestoneToProject(currentProject.id, {
      title: customTitle.trim(),
      description: customDescription.trim() || 'Custom regulatory verification requirement.',
      stage: customStage,
      regulatoryClause: customRegulatoryClause.trim() || 'Custom Client Milestone',
      requiredDocTypes: customSelectedDocTypes,
    });

    showFeedback(`Custom milestone "${customTitle.trim()}" berhasil ditambahkan.`);

    // Reset and close
    setCustomTitle('');
    setCustomDescription('');
    setCustomRegulatoryClause('');
    setCustomSelectedDocTypes(['BOM_EXCEL']);
    setIsAddMilestoneModalOpen(false);
  };

  const handleCopyRoadmap = () => {
    const lines = [
      `=============================================================`,
      `VERIX CONSULTING — TKDN & REGULATORY COMPLIANCE ROADMAP`,
      `=============================================================`,
      `Project Code  : [${currentProject.code}] ${currentProject.productOrServiceName}`,
      `Client Name   : ${currentProject.clientName} (${currentProject.companyType})`,
      `Service Type  : ${getServiceTypeName(currentProject.serviceType)}`,
      `Current Stage : ${getStageName(currentProject.stage)}`,
      `Lead Auditor  : ${currentProject.leadConsultantName}`,
      `LVI Body      : ${currentProject.surveyorBody}`,
      `Progress      : ${summary.completedMilestones}/${summary.totalMilestones} Milestones (${summary.progressPercentage}%)`,
      `Doc Vault     : ${summary.uploadedRequiredDocTypes}/${summary.totalRequiredDocTypes} Required Files Attached (${summary.docFulfillmentPercentage}%)`,
      `Readiness     : ${readiness.label}`,
      `-------------------------------------------------------------`,
      `MILESTONE BREAKDOWN:`,
    ];

    milestones.forEach((m, idx) => {
      const statusIcon = m.isCompleted ? '[x] COMPLETED' : m.status === 'FLAGGED' ? '[!] DISCREPANCY' : '[ ] PENDING';
      lines.push(`${idx + 1}. ${statusIcon} - ${m.title}`);
      lines.push(`   Stage: ${getStageName(m.stage)} | Ref: ${m.regulatoryClause || 'Standard'}`);
      lines.push(`   Required Files: ${m.requiredDocTypes.map(getDocTypeName).join(', ') || 'None (Consultant Review)'}`);
      if (m.matchedDocuments.length > 0) {
        lines.push(`   Attached Docs (${m.matchedDocuments.length}):`);
        m.matchedDocuments.forEach((doc) => {
          lines.push(`     - ${doc.name} [${doc.status}] (${doc.uploadDate})`);
        });
      } else {
        lines.push(`   Pending Uploads: ${m.unfulfilledDocTypes.map(getDocTypeName).join(', ')}`);
      }
      lines.push('');
    });

    lines.push(`Generated on: ${new Date().toLocaleString('id-ID')}`);
    lines.push(`=============================================================`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Realtime Action Notification Banner */}
      {actionFeedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP COMPLIANCE READINESS HEADER */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getServiceTypeBadgeColor(currentProject.serviceType)}`}>
                {getServiceTypeName(currentProject.serviceType)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Regulatory Framework Checklist
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-200 border border-purple-700/50 font-mono">
                Auto-Evaluated via Document Vault
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Dynamic Certification Roadmap</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                {summary.completedMilestones}/{summary.totalMilestones} Done
              </span>
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Milestones dynamically advance to <strong className="text-emerald-400 font-semibold">Completed</strong> as mandatory files, BOM spreadsheets, vendor certificates, and audit reports are uploaded into the repository.
            </p>
          </div>

          {/* Right Gauge & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Progress Circular Widget */}
            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      summary.progressPercentage >= 100
                        ? 'text-emerald-400'
                        : summary.progressPercentage >= 50
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }
                    strokeDasharray={`${summary.progressPercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black font-mono text-white">
                  {summary.progressPercentage}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Compliance Status
                </span>
                <span className="text-xs font-bold text-emerald-300 block">
                  {readiness.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {summary.uploadedRequiredDocTypes}/{summary.totalRequiredDocTypes} Doc Types Verified
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Manage / Restore Deleted Checklist button */}
              <button
                type="button"
                id="btn-manage-checklist-deleted"
                onClick={() => setIsManageDeletedModalOpen(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
                  (currentProject.deletedMilestoneIds && currentProject.deletedMilestoneIds.length > 0)
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Lihat checklist yang dihapus atau pulihkan ke standar regulasi"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {(currentProject.deletedMilestoneIds && currentProject.deletedMilestoneIds.length > 0)
                    ? `Pulihkan (${currentProject.deletedMilestoneIds.length} Dihapus)`
                    : 'Kelola / Reset Checklist'}
                </span>
              </button>

              <button
                type="button"
                id="btn-open-doctype-manager-from-checklist"
                onClick={() => setIsDocTypeModalOpen(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
                  isMasterAdmin
                    ? 'bg-blue-600/30 text-blue-200 border-blue-500/40 hover:bg-blue-600/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Kelola Master Tipe Dokumen Wajib"
              >
                <FileText className={`w-3.5 h-3.5 ${isMasterAdmin ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>Doc Types ({documentTypes.length})</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRoadmap}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                title="Copy formatted compliance summary for surveyor or client"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddMilestoneModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Milestone</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mini KPI Cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Milestones</span>
            <p className="text-base font-black font-mono text-white mt-0.5">
              {summary.totalMilestones} Steps
            </p>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Completed Milestones</span>
            <p className="text-base font-black font-mono text-emerald-400 mt-0.5">
              {summary.completedMilestones} Completed
            </p>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Required Doc Fulfillment</span>
            <p className="text-base font-black font-mono text-blue-400 mt-0.5">
              {summary.docFulfillmentPercentage}% Attached
            </p>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Flagged Discrepancies</span>
            <p className={`text-base font-black font-mono mt-0.5 ${summary.flaggedIssuesCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {summary.flaggedIssuesCount} Attention Needed
            </p>
          </div>
        </div>
      </div>

      {/* 2. STAGE PROGRESSION STEPPER BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Statutory Lifecycle Stage Progression</span>
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Active Project Stage: <strong className="text-slate-900">{getStageName(currentProject.stage)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stageOrder.map((stg, stgIdx) => {
            const stageMilestones = milestones.filter((m) => m.stage === stg);
            const stageCompleted = stageMilestones.filter((m) => m.isCompleted).length;
            const isAllStageDone = stageMilestones.length > 0 && stageCompleted === stageMilestones.length;
            const isCurrentProjectStage = currentProject.stage === stg;

            return (
              <button
                key={stg}
                type="button"
                onClick={() => setSelectedStageFilter(selectedStageFilter === stg ? 'ALL' : stg)}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  selectedStageFilter === stg
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-300 shadow-xs'
                    : isAllStageDone
                    ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                    : isCurrentProjectStage
                    ? 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Step 0{stgIdx + 1}
                  </span>
                  {isAllStageDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrentProjectStage ? (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {stg.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {stageCompleted}/{stageMilestones.length} Milestones
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CONTROLS, VIEW TOGGLE, & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        {/* Left Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedStatusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({milestones.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('COMPLETED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              selectedStatusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed ({summary.completedMilestones})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('IN_PROGRESS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              selectedStatusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>In Progress ({milestones.filter((m) => m.status === 'IN_PROGRESS').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('PENDING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              selectedStatusFilter === 'PENDING'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>Missing Docs ({milestones.filter((m) => m.status === 'PENDING').length})</span>
          </button>

          {summary.flaggedIssuesCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('FLAGGED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'FLAGGED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Flagged ({summary.flaggedIssuesCount})</span>
            </button>
          )}

          {selectedStageFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedStageFilter('ALL')}
              className="text-xs text-rose-600 font-bold hover:underline ml-2"
            >
              Reset Stage Filter
            </button>
          )}
        </div>

        {/* Right View Mode Buttons & Manage Action */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="btn-manage-checklist-filter-bar"
            onClick={() => setIsManageDeletedModalOpen(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              currentProject.deletedMilestoneIds && currentProject.deletedMilestoneIds.length > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Kelola & Pulihkan Milestone Checklist yang dihapus"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {currentProject.deletedMilestoneIds && currentProject.deletedMilestoneIds.length > 0
                ? `Pulihkan (${currentProject.deletedMilestoneIds.length} Dihapus)`
                : 'Kelola / Reset'}
            </span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chronological Flow
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('documents')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'documents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Matrix
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CHECKLIST CONTENT RENDERING */}
      {filteredMilestones.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No milestones match your selected filter.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the stage or completion filters above.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedStageFilter('ALL');
              setSelectedStatusFilter('ALL');
            }}
            className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'documents' ? (
        /* DOCUMENT MATRIX VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Statutory Document Matrix & Milestone Fulfillment Map
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive cross-reference of required file types and their active fulfillment status.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Milestone / Statutory Step</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Required File Types</th>
                  <th className="py-3 px-4">Attached Documents</th>
                  <th className="py-3 px-4 text-center">Milestone Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMilestones.map((m) => {
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">
                        <div className="space-y-0.5">
                          <p>{m.title}</p>
                          {m.regulatoryClause && (
                            <span className="text-[10px] text-slate-500 font-normal block font-mono">
                              {m.regulatoryClause}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${getStageColor(m.stage)}`}>
                          {m.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {m.requiredDocTypes.length === 0 ? (
                            <span className="text-slate-400 italic">None (Physical / Audit Review)</span>
                          ) : (
                            m.requiredDocTypes.map((dt) => {
                              const isFulfilled = currentProject.documents.some((d) => d.type === dt);
                              return (
                                <span
                                  key={dt}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                                    isFulfilled
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {getDocTypeName(dt)}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {m.matchedDocuments.length === 0 ? (
                          <span className="text-slate-400 italic">No files attached yet</span>
                        ) : (
                          <div className="space-y-1">
                            {m.matchedDocuments.map((doc) => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="flex items-center gap-1.5 text-[11px] text-slate-700 hover:text-blue-600 group text-left cursor-pointer transition-colors"
                                title="Click to inspect and preview document"
                              >
                                <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                <span className="font-medium truncate max-w-[180px] underline-offset-2 group-hover:underline">{doc.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${getDocStatusBadge(doc.status)}`}>
                                  {doc.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>COMPLETED</span>
                          </span>
                        ) : m.status === 'FLAGGED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>DISCREPANCY</span>
                          </span>
                        ) : m.status === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>IN PROGRESS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>PENDING DOCS</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.unfulfilledDocTypes.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenUploadForDocType(m.unfulfilledDocTypes[0])}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>Upload Required</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleManualSignoff(m.id, m.isCompleted)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              {m.isCompleted ? 'Revoke Sign-off' : 'Sign Off Step'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteMilestone({
                                id: m.id,
                                title: m.title,
                                stage: m.stage,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 inline-flex items-center gap-1 text-xs"
                            title="Hapus Milestone Checklist ini dari proyek"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="hidden xl:inline text-rose-600 font-bold text-[10px]">Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE OR GRID CARDS VIEW */
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {filteredMilestones.map((milestone, index) => {
            const isExpanded = expandedMilestones[milestone.id] !== false; // default open
            const allReqUploaded = milestone.unfulfilledDocTypes.length === 0;

            return (
              <div
                key={milestone.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  milestone.isCompleted
                    ? 'bg-white border-emerald-200 shadow-xs'
                    : milestone.status === 'FLAGGED'
                    ? 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-400/30'
                    : milestone.status === 'IN_PROGRESS'
                    ? 'bg-white border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Milestone Top Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Status Icon Indicator */}
                    <div className="mt-0.5">
                      {milestone.isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : milestone.status === 'FLAGGED' ? (
                        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shadow-xs">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      ) : milestone.status === 'IN_PROGRESS' ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-600 shadow-xs">
                          <Clock className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                          <span className="font-mono text-xs font-bold">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Metadata */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStageColor(milestone.stage)}`}>
                          {milestone.stage.replace(/_/g, ' ')}
                        </span>

                        {milestone.regulatoryClause && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {milestone.regulatoryClause}
                          </span>
                        )}

                        {milestone.custom && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Custom Scope
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{milestone.title}</span>
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges & Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0">
                    <div>
                      {milestone.isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Milestone Completed</span>
                        </span>
                      ) : milestone.status === 'FLAGGED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Discrepancy Flagged</span>
                        </span>
                      ) : milestone.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{milestone.completionPercentage}% Documents</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Awaiting Documents</span>
                        </span>
                      )}
                    </div>

                    {milestone.completedAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Fulfilled: {milestone.completedAt}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteMilestone({
                            id: milestone.id,
                            title: milestone.title,
                            stage: milestone.stage,
                          });
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50/90 hover:bg-rose-100 font-bold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                        title="Hapus Milestone Checklist ini dari proyek"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Checklist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(milestone.id)}
                        className="text-xs text-slate-500 hover:text-slate-900 font-bold inline-flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Files'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Document Breakdown Section */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200/80 p-4 sm:p-5 space-y-4">
                    {/* Auto-completion explanation alert if completed */}
                    {milestone.isCompleted && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            {milestone.manuallyCompleted
                              ? `Manually signed off and verified by Lead Consultant (${milestone.manualNotes || 'Physical inspection / administrative compliance satisfied'}).`
                              : `Auto-verified: All statutory document requirements (${milestone.requiredDocTypes.map(getDocTypeName).join(', ')}) are uploaded and verified in the project repository.`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleManualSignoff(milestone.id, true)}
                          className="text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:underline shrink-0"
                        >
                          Revoke Sign-off
                        </button>
                      </div>
                    )}

                    {/* REQUIRED STATUTORY FILES GRID */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Required Regulatory Files ({milestone.requiredDocTypes.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {milestone.matchedDocuments.length} / {milestone.requiredDocTypes.length} Document Types Attached
                        </span>
                      </div>

                      {milestone.requiredDocTypes.length === 0 ? (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                          This milestone is evaluated during surveyor on-site meetings and physical inspection. Lead consultant sign-off qualifies this stage.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {milestone.requiredDocTypes.map((reqDocType) => {
                            const matchingUploaded = currentProject.documents.filter((d) => d.type === reqDocType);
                            const hasUploaded = matchingUploaded.length > 0;

                            return (
                              <div
                                key={reqDocType}
                                className={`p-3 rounded-xl border transition-all ${
                                  hasUploaded
                                    ? 'bg-white border-slate-200'
                                    : 'bg-rose-50/50 border-rose-200/80 border-dashed'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      {hasUploaded ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      ) : (
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      )}
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {getDocTypeName(reqDocType)}
                                      </span>
                                    </div>

                                    <span className="text-[10px] text-slate-500 block font-mono">
                                      Doc Type: {reqDocType}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {!hasUploaded ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenUploadForDocType(reqDocType)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                                      >
                                        <UploadCloud className="w-3 h-3" />
                                        <span>Upload</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenUploadForDocType(reqDocType)}
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1"
                                        title="Upload new version"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>New Ver</span>
                                      </button>
                                    )}

                                    {/* Delete Doc Requirement button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteDocReq({
                                          milestoneId: milestone.id,
                                          milestoneTitle: milestone.title,
                                          docType: reqDocType,
                                          isOptional: false,
                                          docName: getDocTypeName(reqDocType),
                                        });
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                      title="Hapus Syarat Dokumen Wajib dari Checklist"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Matching Uploaded Files List */}
                                {hasUploaded && (
                                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                                    {matchingUploaded.map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 text-[11px]"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => setPreviewDoc(file)}
                                          className="flex items-center gap-1.5 truncate text-left group cursor-pointer hover:text-blue-600"
                                          title="Inspect & preview uploaded document"
                                        >
                                          <FileText className="w-3 h-3 text-indigo-600 shrink-0 group-hover:text-blue-600" />
                                          <span className="font-semibold text-slate-800 group-hover:text-blue-600 truncate underline-offset-2 group-hover:underline" title={file.name}>
                                            {file.name}
                                          </span>
                                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                                            {file.version}
                                          </span>
                                        </button>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setPreviewDoc(file)}
                                            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors"
                                            title="Quick Preview"
                                          >
                                            <Eye className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmDeleteFile({
                                                docId: file.id,
                                                docName: file.name,
                                              });
                                            }}
                                            className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                            title="Hapus Dokumen dari repositori proyek"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${getDocStatusBadge(file.status)}`}>
                                            {file.status}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            {file.fileSize}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* OPTIONAL SUPPORTING FILES (If any exist) */}
                    {milestone.optionalDocTypes && milestone.optionalDocTypes.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Optional Supporting Attachments
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {milestone.optionalDocTypes.map((optType) => {
                            const optUploaded = currentProject.documents.filter((d) => d.type === optType);
                            return (
                              <div
                                key={optType}
                                className={`text-[10px] px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                                  optUploaded.length > 0
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span>{getDocTypeName(optType)}</span>
                                {optUploaded.length > 0 ? (
                                  <span className="px-1 bg-emerald-200 text-emerald-900 rounded-full font-bold text-[9px]">
                                    {optUploaded.length}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUploadForDocType(optType)}
                                    className="text-slate-400 hover:text-slate-800"
                                    title="Upload optional document"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteDocReq({
                                      milestoneId: milestone.id,
                                      milestoneTitle: milestone.title,
                                      docType: optType,
                                      isOptional: true,
                                      docName: getDocTypeName(optType),
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5 hover:bg-rose-100 rounded"
                                  title="Hapus Syarat Opsional dari Checklist"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Consultant Manual Sign-off Action Bar */}
                    <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lead Consultant Review: {currentProject.leadConsultantName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id={`btn-delete-milestone-footer-${milestone.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteMilestone({
                              id: milestone.id,
                              title: milestone.title,
                              stage: milestone.stage,
                            });
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:border-rose-300"
                          title="Hapus Milestone Checklist ini dari proyek"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Checklist</span>
                        </button>

                        {!milestone.isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleToggleManualSignoff(milestone.id, false)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Manual Auditor Sign-off</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleManualSignoff(milestone.id, true)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200"
                          >
                            Revoke Sign-off
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MANUAL SIGNOFF REMARK MODAL / DIALOG */}
      {activeSignoffMilestoneId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirm Consultant Milestone Sign-Off</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveSignoffMilestoneId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Recording a manual sign-off marks this compliance milestone as <strong>Completed</strong> and logs an official verification entry in the project audit trail.
            </p>

            <form onSubmit={handleConfirmManualSignoff} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Auditor Remark / Meeting Reference Note
                </label>
                <textarea
                  rows={3}
                  value={signoffNote}
                  onChange={(e) => setSignoffNote(e.target.value)}
                  placeholder="e.g. On-site verification completed with Surveyor Indonesia team; sampling passed test criteria."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSignoffMilestoneId(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Sign Off Step</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD CUSTOM MILESTONE MODAL */}
      {isAddMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Custom Regulatory Milestone</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Define project-specific compliance milestones for tailored industrial certifications, special client SLAs, or municipal licensing requirements.
            </p>

            <form onSubmit={handleCreateCustomMilestone} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Milestone Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Factory Boiler Emission Lab Testing & DLH Approval"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Project Stage
                  </label>
                  <select
                    value={customStage}
                    onChange={(e) => setCustomStage(e.target.value as ProjectStage)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="INQUIRY">1. Inquiry & Scoping</option>
                    <option value="GAP_ANALYSIS">2. Gap Analysis</option>
                    <option value="DOC_PREPARATION">3. BOM & Doc Prep</option>
                    <option value="FIELD_VERIFICATION">4. Field Audit (LVI)</option>
                    <option value="MINISTRY_REVIEW">5. SIINas Review</option>
                    <option value="CERTIFICATE_ISSUED">6. Certificate Issued</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Regulatory Basis / Standard Ref
                  </label>
                  <input
                    type="text"
                    value={customRegulatoryClause}
                    onChange={(e) => setCustomRegulatoryClause(e.target.value)}
                    placeholder="e.g. Permenperin No. 16/2011 / DLH No. 4"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description & Compliance Requirement
                </label>
                <textarea
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Outline what needs to be verified or achieved for this milestone..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Required Document Types (Auto-completes when uploaded)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {(activeDocumentTypes && activeDocumentTypes.length > 0 ? activeDocumentTypes : documentTypes).map((dt) => {
                    const isSelected = customSelectedDocTypes.includes(dt.id as DocumentType);
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCustomSelectedDocTypes(customSelectedDocTypes.filter((t) => t !== dt.id));
                          } else {
                            setCustomSelectedDocTypes([...customSelectedDocTypes, dt.id as DocumentType]);
                          }
                        }}
                        className={`p-1.5 rounded text-[11px] text-left font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span className="truncate">{dt.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Append Custom Milestone</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PRESELECTED DOCUMENT UPLOAD MODAL */}
      <CategorizedUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadPreselectedDocType(undefined);
        }}
        initialProject={currentProject}
        initialDocType={uploadPreselectedDocType}
      />

      {/* 8. DOCUMENT FULL PREVIEW & COMPLIANCE INSPECTOR MODAL */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        project={currentProject}
      />

      {/* 9. MASTER DOCUMENT TYPE REPOSITORY MODAL (admin.master) */}
      <DocumentTypeManagerModal
        isOpen={isDocTypeModalOpen}
        onClose={() => setIsDocTypeModalOpen(false)}
      />

      {/* 10. CONFIRM DELETE MILESTONE CHECKLIST MODAL */}
      {confirmDeleteMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hapus Permanen Milestone Checklist</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Konfirmasi penghapusan permanen dari sistem
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteMilestone(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Milestone / Langkah</span>
                <p className="font-bold text-slate-900 mt-0.5">{confirmDeleteMilestone.title}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStageColor(confirmDeleteMilestone.stage)}`}>
                  {confirmDeleteMilestone.stage.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-500">ID: {confirmDeleteMilestone.id}</span>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Milestone checklist ini akan <strong>dihapus secara permanen dari sistem</strong> dan dihilangkan dari alur evaluasi kepatuhan sertifikasi proyek.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteMilestone(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const mTitle = confirmDeleteMilestone.title;
                  deleteMilestoneFromProject(currentProject.id, confirmDeleteMilestone.id);
                  showFeedback(`Milestone "${mTitle}" berhasil dihapus secara permanen dari sistem.`);
                  setConfirmDeleteMilestone(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Permanen di Sistem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. CONFIRM DELETE DOC REQUIREMENT MODAL */}
      {confirmDeleteDocReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Hapus Syarat {confirmDeleteDocReq.isOptional ? 'Opsional' : 'Wajib'}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Konfirmasi perubahan syarat dokumen
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteDocReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Syarat Dokumen</span>
                <p className="font-bold text-slate-900 mt-0.5">{confirmDeleteDocReq.docName}</p>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  Type: {confirmDeleteDocReq.docType} ({confirmDeleteDocReq.isOptional ? 'Optional' : 'Required'})
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Dari Milestone</span>
                <p className="text-slate-700 font-medium mt-0.5">{confirmDeleteDocReq.milestoneTitle}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Syarat dokumen ini tidak lagi diwajibkan untuk penyelesaian milestone ini. Dokumen yang sudah terunggah tetap tersimpan di repositori proyek.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteDocReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocRequirementFromMilestone(
                    currentProject.id,
                    confirmDeleteDocReq.milestoneId,
                    confirmDeleteDocReq.docType,
                    confirmDeleteDocReq.isOptional
                  );
                  showFeedback(`Syarat dokumen "${confirmDeleteDocReq.docName}" berhasil dihapus.`);
                  setConfirmDeleteDocReq(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Syarat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. CONFIRM DELETE UPLOADED FILE MODAL */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hapus Dokumen Terunggah</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Hapus file dari repositori proyek
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Nama File</span>
              <p className="font-bold text-slate-900 mt-0.5 break-all">{confirmDeleteFile.docName}</p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                File akan dihapus dari repositori proyek. Jika dokumen ini memenuhi checklist, status milestone akan kembali menjadi missing/in progress.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteFile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(currentProject.id, confirmDeleteFile.docId);
                  showFeedback(`File "${confirmDeleteFile.docName}" berhasil dihapus.`);
                  setConfirmDeleteFile(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. MANAGE & RESTORE DELETED CHECKLIST MODAL */}
      {isManageDeletedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Kelola / Pulihkan Checklist</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Lihat dan pulihkan milestone checklist yang telah dihapus
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageDeletedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {currentProject.deletedMilestoneIds && currentProject.deletedMilestoneIds.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Daftar Milestone Dihapus ({currentProject.deletedMilestoneIds.length})
                  </span>
                  {currentProject.deletedMilestoneIds.map((deletedId) => {
                    const defaultTemplates =
                      CERTIFICATION_MILESTONE_TEMPLATES[currentProject.serviceType] ||
                      CERTIFICATION_MILESTONE_TEMPLATES.TKDN_BARANG;
                    const tmpl = defaultTemplates.find((t) => t.id === deletedId);
                    const customItem = currentProject.customMilestones?.find((c) => c.id === deletedId);
                    const title = tmpl?.title || customItem?.title || `Milestone #${deletedId}`;
                    const stage = tmpl?.stage || customItem?.stage || 'DOC_PREPARATION';

                    return (
                      <div
                        key={deletedId}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="font-bold text-slate-900 truncate">{title}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${getStageColor(stage)}`}>
                              {stage.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">ID: {deletedId}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            restoreMilestoneToProject(currentProject.id, deletedId);
                            showFeedback(`Milestone "${title}" berhasil dipulihkan.`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800">Tidak ada checklist yang sedang dihapus</p>
                  <p className="text-slate-500 text-[11px]">
                    Semua milestone standar regulasi aktif dan dievaluasi secara realtime.
                  </p>
                </div>
              )}

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Anda juga dapat mereset seluruh modifikasi dan memulihkan checklist ke pengaturan standar regulasi Kemenperin / BSN asli.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsManageDeletedModalOpen(false);
                  setConfirmResetChecklist(true);
                }}
                className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Seluruh ke Default</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageDeletedModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. CONFIRM RESET CHECKLIST MODAL */}
      {confirmResetChecklist && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Reset Checklist ke Default</h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Kembalikan seluruh roadmap ke regulasi resmi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmResetChecklist(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900">
                Memulihkan {currentProject.deletedMilestoneIds?.length || 0} milestone yang telah dihapus.
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Tindakan ini akan mengembalikan seluruh template milestone dan daftar dokumen wajib sesuai standar regulasi Kemenperin / BSN asli.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmResetChecklist(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetProjectMilestonesToDefault(currentProject.id);
                  showFeedback('Seluruh checklist milestone telah direset ke standar regulasi resmi.');
                  setConfirmResetChecklist(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Default</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
