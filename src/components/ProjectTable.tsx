import React, { useState } from 'react';
import {
  ChevronRight,
  MoreVertical,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building,
  Tag,
  Trash2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { ConsultingProject, ProjectStage } from '../types';
import {
  formatIDR,
  formatIDRShort,
  getStageName,
  getStageColor,
  getServiceTypeName,
  getServiceTypeBadgeColor,
  getPriorityBadge,
  getStatusBadge,
} from '../utils/formatters';
import { BatchDeleteConfirmModal, BatchDeleteItem } from './common/BatchDeleteConfirmModal';

interface ProjectTableProps {
  onSelectProject: (project: ConsultingProject) => void;
  onOpenDispositionForProject: (project: ConsultingProject) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  onSelectProject,
  onOpenDispositionForProject,
}) => {
  const { filteredProjects, dispositions, changeProjectStage, deleteProject, deleteMultipleProjects, consultingServices, isMasterAdmin, hasPermission } = useProjects();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const stagesList: ProjectStage[] = [
    'INQUIRY',
    'GAP_ANALYSIS',
    'DOC_PREPARATION',
    'FIELD_VERIFICATION',
    'MINISTRY_REVIEW',
    'CERTIFICATE_ISSUED',
  ];

  const isAllSelected = filteredProjects.length > 0 && filteredProjects.every((p) => selectedProjectIds.includes(p.id));
  const isIndeterminate = selectedProjectIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(filteredProjects.map((p) => p.id));
    }
  };

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedProjects = filteredProjects.filter((p) => selectedProjectIds.includes(p.id));
  const totalSelectedContractValue = selectedProjects.reduce((sum, p) => sum + (p.contractValueIDR || 0), 0);

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Consulting Projects Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No records match your active search filters or service category. Try resetting the filters or initiate a new client engagement.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Batch Actions Banner */}
      {selectedProjectIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedProjectIds.length} Proyek Terpilih</span>
            </div>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Total Kontrak: <strong className="text-white font-mono">{formatIDR(totalSelectedContractValue)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isAllSelected && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                Pilih Semua ({filteredProjects.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedProjectIds([])}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Batal</span>
            </button>
            {isMasterAdmin && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedProjectIds.length} Proyek Bersamaan</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">
              <th className="py-3.5 px-3 text-center w-10">
                <input
                  type="checkbox"
                  aria-label="Pilih Semua Proyek"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
              </th>
              <th className="py-3.5 px-4 text-center">Engagement Code & Client</th>
              <th className="py-3.5 px-3 text-center">Service & KBLI</th>
              <th className="py-3.5 px-3 text-center min-w-[190px]">Stage & Progress</th>
              <th className="py-3.5 px-3 text-center min-w-[180px]">TKDN Target vs Proj</th>
              <th className="py-3.5 px-3 text-center">LVI</th>
              <th className="py-3.5 px-3 text-center">Lead & Tasks</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Contract Value</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProjects.map((project) => {
              const priorityInfo = getPriorityBadge(project.priority);
              const statusInfo = getStatusBadge(project.status);
              
              // Project specific dispositions
              const projectDispositions = dispositions.filter((d) => d.projectId === project.id);
              const openDisps = projectDispositions.filter((d) => d.status !== 'COMPLETED');
              
              // Tkdn status comparison
              const isTkdnOnTarget =
                (project.officialVerifiedTkdnPercentage || project.projectedTkdnPercentage) >=
                project.targetTkdnPercentage;

              return (
                <tr
                  key={project.id}
                  className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${
                    selectedProjectIds.includes(project.id) ? 'bg-emerald-50/40' : ''
                  }`}
                  onClick={() => onSelectProject(project)}
                >
                  {/* Selection Checkbox */}
                  <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Pilih proyek ${project.code}`}
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => handleToggleProject(project.id)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </td>

                  {/* Code & Client */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          project.status === 'ON_TRACK' ? 'bg-emerald-500' :
                          project.status === 'AT_RISK' ? 'bg-amber-500 animate-pulse' :
                          project.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs hover:text-emerald-700 transition-colors">
                            {project.code}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {project.companyType}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 mt-0.5 line-clamp-1">
                          {project.clientName}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {project.productOrServiceName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Service & KBLI */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getServiceTypeBadgeColor(
                        project.serviceType,
                        consultingServices
                      )}`}
                    >
                      {getServiceTypeName(project.serviceType, consultingServices)}
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono mt-1 line-clamp-1">
                      {project.kbliCode.split('-')[0]}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {project.industry.split('&')[0]}
                    </span>
                  </td>

                  {/* Stage & Progress */}
                  <td className="py-3 px-3 min-w-[190px]">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStageColor(
                          project.stage
                        )}`}
                      >
                        {getStageName(project.stage)}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-700">
                        {project.progressPercentage}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          project.stage === 'CERTIFICATE_ISSUED'
                            ? 'bg-emerald-500'
                            : project.status === 'AT_RISK'
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${project.progressPercentage}%` }}
                      />
                    </div>
                    {project.status === 'AT_RISK' && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        TKDN Target Gap Detected
                      </p>
                    )}
                  </td>

                  {/* TKDN Target vs Projected */}
                  <td className="py-3 px-3 text-center">
                    {project.targetTkdnPercentage > 0 ? (
                      <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 whitespace-nowrap shadow-2xs">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-mono whitespace-nowrap">
                          <span className="font-semibold text-slate-500 whitespace-nowrap">
                            Tgt: {project.targetTkdnPercentage}%
                          </span>
                          <span className="text-slate-300 font-light select-none">|</span>
                          <span
                            className={`font-extrabold whitespace-nowrap ${
                              isTkdnOnTarget ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {project.officialVerifiedTkdnPercentage
                              ? `${project.officialVerifiedTkdnPercentage}% (Ver)`
                              : `${project.projectedTkdnPercentage}% (Proj)`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        {project.projectCategory === 'COMPANY_LICENSING' ? 'Perizinan' :
                         project.projectCategory === 'SOFTWARE_DEV' ? 'Software' :
                         project.projectCategory === 'OTHER_SERVICES' ? 'Lain-lain' : 'Non-TKDN'}
                      </span>
                    )}
                  </td>

                  {/* Surveyor Body */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 text-xs">
                      {project.surveyorBody}
                    </div>
                    {project.surveyorAuditDate ? (
                      <p className="text-[10px] text-indigo-700 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Audit Date: {project.surveyorAuditDate}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">Audit Unscheduled</p>
                    )}
                  </td>

                  {/* Lead Consultant & Job Dispositions */}
                  <td className="py-3 px-3">
                    <p className="text-xs font-medium text-slate-800">
                      {project.leadConsultantName.split(',')[0]}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded font-mono">
                        {project.documents.length} Docs
                      </span>
                      {openDisps.length > 0 ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          {openDisps.length} Tasks
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          All Done
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Contract Value */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                    {formatIDRShort(project.contractValueIDR)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {hasPermission('MANAGE_DISPOSITIONS') && (
                        <button
                          onClick={() => onOpenDispositionForProject(project)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                          title="Dispatch Job Task"
                        >
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Task</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectProject(project)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors border border-emerald-200"
                        title="Open Project Workspace"
                      >
                        <span>File</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      {isMasterAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete project "${project.clientName}" (${project.code})? This will delete the project regardless of its status/data.`)) {
                              deleteProject(project.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-md text-[11px] font-semibold transition-colors border border-rose-200"
                          title="Delete Project (admin.master only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Batch Delete Confirmation Modal */}
      <BatchDeleteConfirmModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeletingBatch(true);
          deleteMultipleProjects(selectedProjectIds);
          setSelectedProjectIds([]);
          setIsBatchDeleteModalOpen(false);
          setIsDeletingBatch(false);
        }}
        entityName="Proyek Konsultasi"
        warningMessage={`Menghapus ${selectedProjects.length} proyek secara bersamaan akan menghapus seluruh data proyek terkait, riwayat tugas disposisi, berkas dokumen verifikasi, dan invoice piutang terkait secara permanen.`}
        totalAmountText={formatIDR(totalSelectedContractValue)}
        isDeleting={isDeletingBatch}
        items={selectedProjects.map((p) => ({
          id: p.id,
          title: `${p.code} - ${p.clientName}`,
          subtitle: `${getServiceTypeName(p.serviceType, consultingServices)} • Progress: ${p.progressPercentage}%`,
          badge: getStageName(p.stage),
          badgeColor: getStageColor(p.stage),
          amount: formatIDR(p.contractValueIDR),
        }))}
      />
    </div>
  );
};
