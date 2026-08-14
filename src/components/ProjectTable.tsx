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
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { ConsultingProject, ProjectStage } from '../types';
import {
  formatIDRShort,
  getStageName,
  getStageColor,
  getServiceTypeName,
  getServiceTypeBadgeColor,
  getPriorityBadge,
  getStatusBadge,
} from '../utils/formatters';

interface ProjectTableProps {
  onSelectProject: (project: ConsultingProject) => void;
  onOpenDispositionForProject: (project: ConsultingProject) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  onSelectProject,
  onOpenDispositionForProject,
}) => {
  const { filteredProjects, dispositions, changeProjectStage, deleteProject } = useProjects();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const stagesList: ProjectStage[] = [
    'INQUIRY',
    'GAP_ANALYSIS',
    'DOC_PREPARATION',
    'FIELD_VERIFICATION',
    'MINISTRY_REVIEW',
    'CERTIFICATE_ISSUED',
  ];

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Consulting Projects Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No projects match the current filter criteria or search query. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Code & Client Entity</th>
              <th className="py-3.5 px-3">Service & KBLI</th>
              <th className="py-3.5 px-3">Pipeline Stage & Progress</th>
              <th className="py-3.5 px-3 text-center">TKDN Target vs Proj</th>
              <th className="py-3.5 px-3">Surveyor Body</th>
              <th className="py-3.5 px-3">Lead & Dispositions</th>
              <th className="py-3.5 px-3">Value</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
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
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectProject(project)}
                >
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
                        project.serviceType
                      )}`}
                    >
                      {getServiceTypeName(project.serviceType)}
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
                    <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2.5">
                      <div className="flex items-center justify-center gap-1 text-xs font-mono">
                        <span className="font-semibold text-slate-500">Tgt: {project.targetTkdnPercentage}%</span>
                        <span className="text-slate-300">|</span>
                        <span
                          className={`font-extrabold ${
                            isTkdnOnTarget ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {project.officialVerifiedTkdnPercentage
                            ? `${project.officialVerifiedTkdnPercentage}% (Ver)`
                            : `${project.projectedTkdnPercentage}% (Proj)`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isTkdnOnTarget ? 'Achieved / Eligible' : 'Needs Optimization'}
                      </div>
                    </div>
                  </td>

                  {/* Surveyor Body */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 text-xs">
                      {project.surveyorBody}
                    </div>
                    {project.surveyorAuditDate ? (
                      <p className="text-[10px] text-indigo-700 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Audit: {project.surveyorAuditDate}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">Audit unscheduled</p>
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
                      <button
                        onClick={() => onOpenDispositionForProject(project)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                        title="Assign Job Disposition for this project"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Task</span>
                      </button>

                      <button
                        onClick={() => onSelectProject(project)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors border border-emerald-200"
                        title="Open Full Project Workspace & Documents"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3 h-3" />
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
  );
};
