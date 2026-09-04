import React, { useState, useMemo } from 'react';
import {
  X,
  Building,
  ShieldCheck,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  UploadCloud,
  Plus,
  Trash2,
  Calculator,
  User,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Send,
  Sparkles,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Paperclip,
  Briefcase,
  Receipt,
  CreditCard,
  CheckSquare,
  Eye,
  Edit2,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TransactionModal } from './finance/TransactionModal';
import { CategorizedUploadModal } from './CategorizedUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { ActivityLog } from './ActivityLog';
import { CertificationChecklist } from './CertificationChecklist';
import { evaluateProjectMilestones } from '../utils/checklistGenerator';
import {
  ConsultingProject,
  ProjectStage,
  DocumentType,
  DocumentCategoryGroup,
  DocumentStatus,
  ProjectDocument,
  ProjectStatus,
  Priority,
  SurveyorBody,
  TransactionType,
} from '../types';
import {
  formatIDR,
  formatIDRShort,
  getStageName,
  getStageColor,
  getServiceTypeName,
  getServiceTypeBadgeColor,
  getDocTypeName,
  getDocStatusBadge,
  getDocCategoryGroup,
  getDocCategoryBadge,
  getTransactionCategoryLabel,
  getPaymentMethodLabel,
} from '../utils/formatters';

interface ProjectDetailModalProps {
  project: ConsultingProject | null;
  onClose: () => void;
  onOpenNewDispositionForProject: (project: ConsultingProject) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenNewDispositionForProject,
}) => {
  const {
    projects,
    updateProject,
    changeProjectStage,
    deleteProject,
    dispositions,
    uploadDocument,
    updateDocumentStatus,
    deleteDocument,
    addActivity,
    currentUser,
    calculateTkdnScore,
    transactions,
    deleteTransaction,
    updateTransaction,
    consultingServices,
    isMasterAdmin,
    paymentChannels,
  } = useProjects();

  const currentProject = useMemo(() => {
    if (!project) return null;
    return projects.find((p) => p.id === project.id) || project;
  }, [projects, project]);

  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'dispositions' | 'documents' | 'tkdn' | 'finance' | 'audit'>('overview');
  
  // Financial modal state inside project
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeModalType, setFinanceModalType] = useState<TransactionType>('INCOME');

  // Document sub-tab filter and modal state
  const [docCategorySubTab, setDocCategorySubTab] = useState<DocumentCategoryGroup>('ALL');
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ docId: string; docName: string } | null>(null);

  const canManageDocuments =
    isMasterAdmin ||
    currentUser?.role === 'DIRECTOR' ||
    currentUser?.role === 'LEAD_CONSULTANT' ||
    currentUser?.role === 'TECHNICAL_CONSULTANT' ||
    currentUser?.role === 'SURVEYOR_LIAISON' ||
    currentUser?.role === 'FINANCE_OFFICER' ||
    Boolean(currentUser?.permissions?.includes('UPLOAD_DOCUMENTS')) ||
    Boolean(currentUser?.permissions?.includes('EDIT_PROJECTS')) ||
    Boolean(currentUser?.permissions?.includes('DELETE_PROJECTS')) ||
    Boolean(currentUser?.permissions?.includes('MANAGE_DOCUMENT_TYPES'));
  
  // Quick doc upload state
  const [docUploadName, setDocUploadName] = useState('');
  const [docUploadType, setDocUploadType] = useState<DocumentType>('BOM_EXCEL');
  const [docUploadSize, setDocUploadSize] = useState('2.4 MB');

  if (!currentProject) return null;

  // Real-time evaluation of certification checklist milestones
  const { milestones: evaluatedMilestones, summary: evaluatedSummary } = useMemo(() => {
    return evaluateProjectMilestones(currentProject);
  }, [currentProject]);

  const projectDispositions = dispositions.filter((d) => d.projectId === project.id);
  const openDispositions = projectDispositions.filter((d) => d.status !== 'COMPLETED');
  
  // Calculate cost breakdown if present
  const costBreakdown = project.costBreakdown || {
    directMaterialKDN: 400000000,
    directMaterialKLN: 350000000,
    directLaborWNI: 120000000,
    directLaborWNA: 0,
    factoryOverheadDomestic: 80000000,
    factoryOverheadImported: 40000000,
  };

  const calculated = calculateTkdnScore(costBreakdown);

  const handleQuickDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUploadName.trim()) return;
    uploadDocument(project.id, {
      projectId: project.id,
      name: docUploadName.trim(),
      type: docUploadType,
      fileSize: docUploadSize,
      uploadedBy: currentUser.name,
      status: 'UNDER_REVIEW',
      version: 'v1.0',
    });
    setDocUploadName('');
  };

  const isTkdnOnTarget =
    (project.officialVerifiedTkdnPercentage || project.projectedTkdnPercentage) >=
    project.targetTkdnPercentage;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="bg-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-emerald-400">
                  {project.code}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {project.companyType}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700 bg-emerald-950 text-emerald-300">
                  {getServiceTypeName(project.serviceType)}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                {project.clientName}
              </h2>
            </div>
          </div>

          {/* Top Right: Stage Stepper & Close */}
          <div className="flex items-center gap-3">
            {/* Quick Stage Progression Dropdown */}
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 text-[11px] px-1 font-medium">Stage:</span>
              <select
                value={project.stage}
                onChange={(e) => changeProjectStage(project.id, e.target.value as ProjectStage)}
                className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="INQUIRY">1. Inquiry & Scoping</option>
                <option value="GAP_ANALYSIS">2. Gap Analysis</option>
                <option value="DOC_PREPARATION">3. BOM & Doc Prep</option>
                <option value="FIELD_VERIFICATION">4. Field Verification (LVI)</option>
                <option value="MINISTRY_REVIEW">5. SIINas Kemenperin Review</option>
                <option value="CERTIFICATE_ISSUED">6. Certificate Issued</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 px-6 border-b border-slate-200 flex items-center space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none shrink-0 py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Overview & Legal Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Certification Checklist</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'checklist' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {evaluatedSummary.completedMilestones}/{evaluatedSummary.totalMilestones}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dispositions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dispositions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Job Dispositions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'dispositions' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {projectDispositions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Document Repository</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'documents' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {project.documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tkdn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tkdn'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-500" />
            <span>TKDN Cost Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'finance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Billings & Direct Expenses</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'finance' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {transactions.filter((t) => t.projectId === project.id).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Audit Trail & Activity Log</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'audit' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {project.activities?.length || 0}
            </span>
          </button>

        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Banner KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Consulting Value</span>
                  <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                    {formatIDR(project.contractValueIDR)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Timeline: {project.startDate} to {project.targetCompletionDate}
                  </p>
                </div>

                {project.targetTkdnPercentage > 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">TKDN Index</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-lg font-black font-mono text-emerald-900">
                        {project.officialVerifiedTkdnPercentage
                          ? `${project.officialVerifiedTkdnPercentage}%`
                          : `${project.projectedTkdnPercentage}%`}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / Target {project.targetTkdnPercentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      {isTkdnOnTarget ? 'Meets statutory requirement' : 'Gap optimization needed'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Kategori Project</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-blue-950">
                        {project.projectCategory === 'COMPANY_LICENSING' ? 'Izin Perusahaan' :
                         project.projectCategory === 'SOFTWARE_DEV' ? 'Software Development' :
                         project.projectCategory === 'OTHER_SERVICES' ? 'Lain - Lain' : 'Non-TKDN'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-700 font-medium mt-1">
                      Non-TKDN Service Scope
                    </p>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {project.projectCategory === 'COMPANY_LICENSING' ? 'Instansi / Lembaga' :
                     project.projectCategory === 'SOFTWARE_DEV' ? 'Engineering Unit' : 'LVI / Surveyor'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{project.surveyorBody || '-'}</p>
                  {project.surveyorAuditDate ? (
                    <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                      Audit Site Date: {project.surveyorAuditDate}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {project.projectCategory === 'SOFTWARE_DEV' ? 'Internal Development' : 'Site inspection unassigned'}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Lead Consultant</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{project.leadConsultantName}</p>
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    {openDispositions.length} active dispositions
                  </p>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client & Legal Permits Details */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Client & Industrial Registry
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Client Legal Entity:</span>
                      <span className="font-semibold text-slate-900">{project.clientName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Certified Product / Scope:</span>
                      <span className="font-semibold text-slate-900 text-right max-w-xs line-clamp-2">
                        {project.productOrServiceName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">KBLI Industrial Code:</span>
                      <span className="font-mono font-bold text-slate-800">{project.kbliCode}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Industry Sector:</span>
                      <span className="font-medium text-slate-800">{project.industry}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">SIINas Kemenperin ID:</span>
                      <span className="font-mono text-indigo-700 font-bold">
                        {project.siinasAccountId || 'SIINAS-PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scope Description & Priority Flags */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Consulting Objectives & Tags
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>
                  
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Engagement Focus Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenNewDispositionForProject(project)}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Dispatch New Job Disposition</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Certification Compliance Roadmap Widget */}
              <div className="p-5 rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Dynamic Regulatory Checklist
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {evaluatedSummary.completedMilestones} of {evaluatedSummary.totalMilestones} Milestones Completed ({evaluatedSummary.progressPercentage}%)
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Certification & Audit Readiness Tracker</span>
                    </h4>

                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Statutory milestones update automatically as documents (BOM Excel, Supplier TKDN, Lab test reports, SIINas profile) are uploaded and verified.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Doc Vault Status
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {evaluatedSummary.uploadedRequiredDocTypes}/{evaluatedSummary.totalRequiredDocTypes} Files Attached
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('checklist')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Open Live Checklist</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Mini Milestones Progress Bar */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Stage Milestones Progress</span>
                    <span className="font-mono font-bold text-emerald-400">{evaluatedSummary.progressPercentage}% Complete</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${evaluatedSummary.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CERTIFICATION CHECKLIST */}
          {activeTab === 'checklist' && (
            <CertificationChecklist
              project={currentProject}
              onOpenUploadModal={(docType) => {
                setDocUploadType(docType || 'BOM_EXCEL');
                setIsDocUploadModalOpen(true);
              }}
            />
          )}

          {/* TAB 2: JOB DISPOSITIONS */}
          {activeTab === 'dispositions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Project Work Orders & Delegated Job Dispositions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tasks assigned to consultants and industrial auditors for this client engagement
                  </p>
                </div>
                <button
                  onClick={() => onOpenNewDispositionForProject(project)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Disposition</span>
                </button>
              </div>

              {projectDispositions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No job dispositions assigned yet. Click "New Disposition" to assign a task.
                </div>
              ) : (
                <div className="space-y-3">
                  {projectDispositions.map((disp) => {
                    const completedChecks = disp.checklist?.filter((c) => c.done).length || 0;
                    const totalChecks = disp.checklist?.length || 0;

                    return (
                      <div
                        key={disp.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{disp.title}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  disp.priority === 'URGENT'
                                    ? 'bg-red-100 text-red-700'
                                    : disp.priority === 'HIGH'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {disp.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Assigned by {disp.assignedByName} on {disp.assignedDate} • Due: {disp.dueDate}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {disp.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {disp.instructions && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {disp.instructions}
                          </p>
                        )}

                        {/* Checklist preview */}
                        {totalChecks > 0 && (
                          <div className="space-y-1 text-xs">
                            <span className="font-bold text-[11px] text-slate-700">
                              Checklist Progress ({completedChecks}/{totalChecks}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                              {disp.checklist.map((item) => (
                                <div key={item.id} className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                                  <CheckCircle2
                                    className={`w-3.5 h-3.5 ${
                                      item.done ? 'text-emerald-600' : 'text-slate-300'
                                    }`}
                                  />
                                  <span className={item.done ? 'line-through text-slate-400' : ''}>
                                    {item.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={disp.assignedToAvatar}
                              alt={disp.assignedToName}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-medium text-slate-800 text-[11px]">
                              {disp.assignedToName} ({disp.assignedToRole})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENT REPOSITORY */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Categorized Upload Header & Action Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Project Document & Commercial Vault
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Categorized records for Quotation letters, Client Invoices/Receipts, Expense Proofs, and Technical BOM files
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDocUploadModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Specific Category</span>
                  </button>
                </div>
              </div>

              {/* Document Sub-Menu Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDocCategorySubTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    docCategorySubTab === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All ({project.documents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocCategorySubTab('OFFER_QUOTATION')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    docCategorySubTab === 'OFFER_QUOTATION'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>
                    Offers / SPK (
                    {
                      project.documents.filter(
                        (d) => (d.categoryGroup || getDocCategoryGroup(d.type)) === 'OFFER_QUOTATION'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocCategorySubTab('INVOICE_RECEIPT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    docCategorySubTab === 'INVOICE_RECEIPT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>
                    Invoices & Receipts (
                    {
                      project.documents.filter(
                        (d) => (d.categoryGroup || getDocCategoryGroup(d.type)) === 'INVOICE_RECEIPT'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocCategorySubTab('EXPENSE_PROOF')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    docCategorySubTab === 'EXPENSE_PROOF'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    Expense Proofs (
                    {
                      project.documents.filter(
                        (d) => (d.categoryGroup || getDocCategoryGroup(d.type)) === 'EXPENSE_PROOF'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocCategorySubTab('TECHNICAL_DOSSIER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    docCategorySubTab === 'TECHNICAL_DOSSIER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>
                    Technical BOM (
                    {
                      project.documents.filter(
                        (d) => (d.categoryGroup || getDocCategoryGroup(d.type)) === 'TECHNICAL_DOSSIER'
                      ).length
                    }
                    )
                  </span>
                </button>
              </div>

              {/* Filtered Document List */}
              <div className="space-y-2.5">
                {project.documents.filter((doc) => {
                  if (docCategorySubTab === 'ALL') return true;
                  const cat = doc.categoryGroup || getDocCategoryGroup(doc.type);
                  return cat === docCategorySubTab;
                }).length === 0 ? (
                  <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-xs font-medium">No documents found in this sub-menu category.</p>
                    <button
                      type="button"
                      onClick={() => setIsDocUploadModalOpen(true)}
                      className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                    >
                      + Upload a document for this category
                    </button>
                  </div>
                ) : (
                  project.documents
                    .filter((doc) => {
                      if (docCategorySubTab === 'ALL') return true;
                      const cat = doc.categoryGroup || getDocCategoryGroup(doc.type);
                      return cat === docCategorySubTab;
                    })
                    .map((doc) => {
                      const statusInfo = getDocStatusBadge(doc.status);
                      const catBadge = getDocCategoryBadge(doc.categoryGroup || getDocCategoryGroup(doc.type));

                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                              {(doc.categoryGroup === 'OFFER_QUOTATION' || doc.type.includes('OFFER') || doc.type.includes('CONTRACT')) && (
                                <Briefcase className="w-4 h-4 text-indigo-600" />
                              )}
                              {(doc.categoryGroup === 'INVOICE_RECEIPT' || doc.type.includes('INVOICE') || doc.type.includes('RECEIPT')) && (
                                <Receipt className="w-4 h-4 text-emerald-600" />
                              )}
                              {(doc.categoryGroup === 'EXPENSE_PROOF' || doc.type.includes('EXPENSE') || doc.type.includes('FEE')) && (
                                <CreditCard className="w-4 h-4 text-rose-600" />
                              )}
                              {(doc.type === 'BOM_EXCEL' || doc.categoryGroup === 'TECHNICAL_DOSSIER') && (
                                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                              )}
                              {doc.type === 'LEGAL_PERMIT' && (
                                <FileText className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors text-left flex items-center gap-1.5"
                                >
                                  <span>{doc.name}</span>
                                  <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                </button>
                                {doc.referenceNumber && (
                                  <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-semibold">
                                    #{doc.referenceNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${catBadge.color}`}>
                                  {catBadge.label}
                                </span>
                                <span>•</span>
                                <span className="text-slate-600 font-medium">{getDocTypeName(doc.type)}</span>
                                <span>•</span>
                                <span>{doc.fileSize}</span>
                                <span>•</span>
                                <span>Uploaded by {doc.uploadedBy.split(',')[0]} ({doc.uploadDate})</span>
                              </div>
                              {doc.amountIDR && (
                                <div className="mt-1 flex items-center gap-2 text-[11px]">
                                  <span className="font-bold text-slate-700">Valuation / Amount:</span>
                                  <span className="font-mono font-bold text-emerald-700">
                                    {formatIDR(doc.amountIDR)}
                                  </span>
                                  {doc.counterpartyName && (
                                    <span className="text-slate-500">
                                      • {doc.counterpartyName}
                                    </span>
                                  )}
                                  {doc.validUntil && (
                                    <span className="text-slate-400">
                                      • Valid until {doc.validUntil}
                                    </span>
                                  )}
                                </div>
                              )}
                              {doc.notes && (
                                <p className="text-[11px] text-slate-600 mt-1 italic">
                                  "{doc.notes}"
                                </p>
                              )}
                              {doc.reviewNotes && (
                                <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded mt-1 font-medium">
                                  Flag: {doc.reviewNotes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Preview document & run compliance checks"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>Preview & Check</span>
                            </button>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.color} min-w-[75px] text-center inline-block`}
                            >
                              {statusInfo.label}
                            </span>

                            <div className="w-[60px] flex items-center justify-end shrink-0">
                              {doc.status !== 'VERIFIED' && (
                                <button
                                  onClick={() => updateDocumentStatus(project.id, doc.id, 'VERIFIED')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold border border-emerald-300 cursor-pointer"
                                >
                                  Verify
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Edit & Periksa Dokumen"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {canManageDocuments && (
                              <button
                                onClick={() => setDocToDelete({ docId: doc.id, docName: doc.name })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                                title="Hapus dokumen dari repositori"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TKDN BREAKDOWN (Permenperin 35/2025) */}
          {activeTab === 'tkdn' && (
            <div className="space-y-5">
              {/* Visual Formula Result Card */}
              <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Calculated TKDN Domestic Level
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-mono font-bold">
                      Permenperin 35/2025
                    </span>
                  </div>
                  <div className="text-4xl font-black font-mono text-emerald-400 mt-1 flex items-baseline gap-2">
                    <span>{calculated.tkdnPercentage}%</span>
                    {calculated.isFactoryIncentiveApplied && (
                      <span className="text-xs font-sans font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                        Incentive Floor Applied (25% Min)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Weighted-factor formula: (Material 75%) + (Labor 10%) + (Overhead 15%) • 5-Year Certificate Validity
                  </p>
                </div>

                <div className="text-right space-y-1 text-xs">
                  <p className="text-slate-400">
                    Target Contract TKDN: <strong className="text-white">{project.targetTkdnPercentage}%</strong>
                  </p>
                  <p className="text-slate-400">
                    Domestic Cost Share: <strong className="text-emerald-300 font-mono">{formatIDR(calculated.kdnTotal)}</strong>
                  </p>
                  <p className="text-slate-400">
                    Total Production COGS: <strong className="text-white font-mono">{formatIDR(calculated.grandTotal)}</strong>
                  </p>
                </div>
              </div>

              {/* Permenperin 35/2025 Statutory Weighted Formula Pipeline */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Permenperin 35/2025 Weighted Factor Decomposition
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 font-semibold">
                    Base Weighted Score: {calculated.baseProductionTkdn}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Material (75%):</span>
                    <span className="font-bold text-emerald-700">+{calculated.materialWeightedScore}%</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Labor WNI (10%):</span>
                    <span className="font-bold text-blue-700">+{calculated.laborWeightedScore}%</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Overhead (15%):</span>
                    <span className="font-bold text-teal-700">+{calculated.overheadWeightedScore}%</span>
                  </div>
                </div>
              </div>

              {/* 3 Categories Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Material */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>1. Direct Material (BOM)</span>
                    <div className="text-right">
                      <span className="font-mono text-emerald-700">{calculated.materialTkdn}%</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Bobot 75%</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Domestic (KDN):</span>
                      <span className="font-mono font-bold text-slate-800">{formatIDRShort(costBreakdown.directMaterialKDN)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Imported (KLN):</span>
                      <span className="font-mono text-slate-600">{formatIDRShort(costBreakdown.directMaterialKLN)}</span>
                    </div>
                  </div>
                </div>

                {/* Labor */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>2. Direct Labor (Payroll)</span>
                    <div className="text-right">
                      <span className="font-mono text-blue-700">{calculated.laborTkdn}%</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Bobot 10%</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Indonesian (WNI):</span>
                      <span className="font-mono font-bold text-slate-800">{formatIDRShort(costBreakdown.directLaborWNI)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expatriate (WNA):</span>
                      <span className="font-mono text-slate-600">{formatIDRShort(costBreakdown.directLaborWNA)}</span>
                    </div>
                  </div>
                </div>

                {/* Overhead */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>3. Factory Overhead</span>
                    <div className="text-right">
                      <span className="font-mono text-teal-700">{calculated.overheadTkdn}%</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Bobot 15%</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Domestic Overhead:</span>
                      <span className="font-mono font-bold text-slate-800">{formatIDRShort(costBreakdown.factoryOverheadDomestic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Imported Mach. Amort.:</span>
                      <span className="font-mono text-slate-600">{formatIDRShort(costBreakdown.factoryOverheadImported)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCE & DIRECT BILLINGS */}
          {activeTab === 'finance' && (() => {
            const rawProjectTrx = transactions.filter((t) => t.projectId === project.id);
            const seenTrxIds = new Set<string>();
            const projectTrx = rawProjectTrx.filter((t) => {
              if (!t || !t.id) return false;
              const cleanId = String(t.id).trim();
              if (!cleanId || seenTrxIds.has(cleanId)) return false;
              seenTrxIds.add(cleanId);
              return true;
            });
            const totalProjectIncome = projectTrx
              .filter((t) => t.type === 'INCOME')
              .reduce((sum, t) => sum + t.amountIDR, 0);
            const totalProjectExpense = projectTrx
              .filter((t) => t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amountIDR, 0);
            const netMargin = totalProjectIncome - totalProjectExpense;
            const marginPercent = totalProjectIncome > 0 ? ((netMargin / totalProjectIncome) * 100).toFixed(1) : '0';
            const contractVal = project.contractValueIDR || 0;
            const billedPercent = contractVal > 0 ? Math.min(100, (totalProjectIncome / contractVal) * 100) : 0;

            return (
              <div className="space-y-6">
                {/* Financial Summary KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Contract Value</span>
                    <p className="text-base font-black font-mono text-slate-900 mt-0.5">
                      {formatIDR(contractVal)}
                    </p>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Billed so far: <strong className="text-emerald-700">{billedPercent.toFixed(0)}%</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Inflow / Retainers Billed
                    </span>
                    <p className="text-base font-black font-mono text-emerald-900 mt-0.5">
                      {formatIDR(totalProjectIncome)}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      {projectTrx.filter((t) => t.type === 'INCOME').length} invoice entries
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      Direct Project Outflows
                    </span>
                    <p className="text-base font-black font-mono text-rose-900 mt-0.5">
                      {formatIDR(totalProjectExpense)}
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1">
                      Auditor fees, filing, travel
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Margin</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-800">
                        {marginPercent}%
                      </span>
                    </div>
                    <p className={`text-base font-black font-mono mt-0.5 ${netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {netMargin >= 0 ? '+' : '-'}{formatIDR(Math.abs(netMargin))}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Net operational earnings
                    </p>
                  </div>
                </div>

                {/* Toolbar & Add Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Project Financial Transaction Ledger ({projectTrx.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFinanceModalType('EXPENSE');
                        setIsFinanceModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>+ Record Expense</span>
                    </button>
                    <button
                      onClick={() => {
                        setFinanceModalType('INCOME');
                        setIsFinanceModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>+ Record Retainer / Inflow</span>
                    </button>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-center">
                        <th className="py-2.5 px-3 text-center">Date & Ref</th>
                        <th className="py-2.5 px-3 text-center">Description</th>
                        <th className="py-2.5 px-3 text-center">Category</th>
                        <th className="py-2.5 px-3 text-center">Party & Channel</th>
                        <th className="py-2.5 px-3 text-center">Amount (IDR)</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectTrx.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No financial transactions logged yet for this project.
                          </td>
                        </tr>
                      ) : (
                        projectTrx.map((t, idx) => {
                          return (
                            <tr key={`prj-trx-${t.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                                <div className="font-bold text-slate-900">{t.date}</div>
                                <div className="text-[10px] text-slate-400">{t.transactionNumber}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-slate-800">{t.description}</p>
                                {t.attachmentName && (
                                  t.attachmentUrl ? (
                                    <a
                                      href={t.attachmentUrl}
                                      download={t.attachmentName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 px-1.5 py-0.5 rounded font-medium mt-0.5 border border-indigo-200 transition-colors"
                                      title="Download / View Attachment"
                                    >
                                      <Paperclip className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[140px]">{t.attachmentName}</span>
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                                      <Paperclip className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[140px]">{t.attachmentName}</span>
                                    </span>
                                  )
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                }`}>
                                  {getTransactionCategoryLabel(t.category)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                <div className="font-medium">{t.clientOrVendorName}</div>
                                <div className="text-[10px] text-slate-400">{getPaymentMethodLabel(t.paymentMethod, paymentChannels)}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                                <span className={t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                                  {t.type === 'INCOME' ? '+' : '-'}Rp {(t.amountIDR || 0).toLocaleString('id-ID')}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    if (!isMasterAdmin) {
                                      alert('Access Denied: Only admin.master (Master Admin) can delete transactions.');
                                      return;
                                    }
                                    if (confirm(`Delete transaction "${t.transactionNumber}"? This action cannot be undone.`)) {
                                      deleteTransaction(t.id);
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isMasterAdmin
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-rose-400 cursor-not-allowed opacity-60'
                                  }`}
                                  title={isMasterAdmin ? "Delete transaction (admin.master)" : "Protected: Only admin.master can delete transactions"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <ActivityLog project={project} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={project.status}
              onChange={(e) => updateProject(project.id, { status: e.target.value as ProjectStatus })}
              className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800"
            >
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk / Gap Flagged</option>
              <option value="DELAYED">Delayed</option>
              <option value="COMPLETED">Completed / Certified</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {isMasterAdmin && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete project ${project.code} (${project.title})? This will delete the project regardless of its status/data.`)) {
                    deleteProject(project.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 font-semibold hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                title="Delete Project (admin_master only)"
              >
                Delete Project
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Close File
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal (Contextual to this project) */}
      <TransactionModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        initialType={financeModalType}
        initialProject={project}
      />

      {/* Categorized Document Upload Modal */}
      <CategorizedUploadModal
        isOpen={isDocUploadModalOpen}
        onClose={() => setIsDocUploadModalOpen(false)}
        initialProject={project}
        initialCategory={docCategorySubTab === 'ALL' ? 'OFFER_QUOTATION' : docCategorySubTab}
      />

      {/* Document Full Preview & Compliance Inspector Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        project={project}
      />

      {/* Delete Document Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-rose-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Hapus Dokumen Proyek?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-white">"{docToDelete.docName}"</strong>? Dokumen ini akan dihapus secara permanen dari repositori proyek dan perubahannya disinkronisasi ke Cloud Firestore secara real-time.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(project.id, docToDelete.docId);
                  setDocToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-rose-900/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

