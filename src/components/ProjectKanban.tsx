import React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Building,
  Shield,
  Plus,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { ConsultingProject, ProjectStage } from '../types';
import {
  formatIDRShort,
  getServiceTypeName,
  getServiceTypeBadgeColor,
  getStageColor,
} from '../utils/formatters';

interface ProjectKanbanProps {
  onSelectProject: (project: ConsultingProject) => void;
  onOpenDispositionForProject: (project: ConsultingProject) => void;
}

export const ProjectKanban: React.FC<ProjectKanbanProps> = ({
  onSelectProject,
  onOpenDispositionForProject,
}) => {
  const { filteredProjects, changeProjectStage, dispositions } = useProjects();

  const STAGES: { key: ProjectStage; title: string; subtitle: string; color: string }[] = [
    {
      key: 'INQUIRY',
      title: '1. Inquiry & Scoping',
      subtitle: 'Legal Check & KBLI Alignment',
      color: 'border-t-slate-400 bg-slate-50/50',
    },
    {
      key: 'GAP_ANALYSIS',
      title: '2. Gap Analysis',
      subtitle: 'Supply Chain & BOM Assessment',
      color: 'border-t-amber-500 bg-amber-50/20',
    },
    {
      key: 'DOC_PREPARATION',
      title: '3. BOM & Doc Prep',
      subtitle: 'Cost Sheets & Fixed Assets',
      color: 'border-t-blue-500 bg-blue-50/20',
    },
    {
      key: 'FIELD_VERIFICATION',
      title: '4. Field Verification',
      subtitle: 'Sucofindo / SI Site Audit',
      color: 'border-t-indigo-500 bg-indigo-50/20',
    },
    {
      key: 'MINISTRY_REVIEW',
      title: '5. SIINas Review',
      subtitle: 'Kemenperin Directorate Sign-Off',
      color: 'border-t-purple-500 bg-purple-50/20',
    },
    {
      key: 'CERTIFICATE_ISSUED',
      title: '6. Certificate Issued',
      subtitle: 'Official TKDN Certified',
      color: 'border-t-emerald-500 bg-emerald-50/20',
    },
  ];

  const getStageIndex = (stage: ProjectStage): number => {
    return STAGES.findIndex((s) => s.key === stage);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
      {STAGES.map((stageObj, colIdx) => {
        const stageProjects = filteredProjects.filter((p) => p.stage === stageObj.key);
        const stageTotalValue = stageProjects.reduce((acc, p) => acc + (p.contractValueIDR || 0), 0);

        return (
          <div
            key={stageObj.key}
            className={`rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs flex flex-col min-h-[520px] border-t-4 ${stageObj.color}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {stageObj.title}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">{stageObj.subtitle}</p>
              </div>
              <span className="text-xs font-mono font-bold bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
                {stageProjects.length}
              </span>
            </div>

            {/* Total Stage Value */}
            <div className="text-[10px] text-slate-500 font-medium pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Stage Value:</span>
              <span className="font-mono font-bold text-slate-700">
                {formatIDRShort(stageTotalValue)}
              </span>
            </div>

            {/* Project Cards in this column */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
              {stageProjects.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  No projects in this stage
                </div>
              ) : (
                stageProjects.map((project) => {
                  const projectDispositions = dispositions.filter((d) => d.projectId === project.id);
                  const openTasks = projectDispositions.filter((d) => d.status !== 'COMPLETED');
                  const isTkdnOnTarget =
                    (project.officialVerifiedTkdnPercentage || project.projectedTkdnPercentage) >=
                    project.targetTkdnPercentage;

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="bg-white rounded-xl p-3 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group space-y-2.5 relative"
                    >
                      {/* Top Row: Code & Priority */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-900 group-hover:text-emerald-700">
                            {project.code}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {project.companyType}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            project.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : project.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {project.priority}
                        </span>
                      </div>

                      {/* Client Name & Product */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                          {project.clientName}
                        </h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {project.productOrServiceName}
                        </p>
                      </div>

                      {/* Service Badge & KBLI */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold border ${getServiceTypeBadgeColor(
                            project.serviceType
                          )}`}
                        >
                          {getServiceTypeName(project.serviceType)}
                        </span>
                        <span className="font-mono text-slate-400 font-semibold">
                          {project.kbliCode.split(' ')[0]}
                        </span>
                      </div>

                      {/* TKDN Target vs Realized Box */}
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500 font-medium">Target: {project.targetTkdnPercentage}%</span>
                          <span
                            className={`font-mono font-bold ${
                              isTkdnOnTarget ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {project.officialVerifiedTkdnPercentage
                              ? `${project.officialVerifiedTkdnPercentage}% (Verified)`
                              : `${project.projectedTkdnPercentage}% (Projected)`}
                          </span>
                        </div>
                        {/* Mini Bar */}
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isTkdnOnTarget ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                ((project.officialVerifiedTkdnPercentage || project.projectedTkdnPercentage) /
                                  project.targetTkdnPercentage) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Surveyor & Date */}
                      <div className="text-[10px] text-slate-600 flex items-center justify-between">
                        <span className="font-medium truncate max-w-[120px]">{project.surveyorBody}</span>
                        {project.surveyorAuditDate && (
                          <span className="text-indigo-700 font-semibold flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {project.surveyorAuditDate.slice(5)}
                          </span>
                        )}
                      </div>

                      {/* Footer: Documents, Open Dispositions, Stage Shift Buttons */}
                      <div
                        className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenDispositionForProject(project)}
                            className={`px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-1 ${
                              openTasks.length > 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Open Tasks for this project"
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>{openTasks.length} Tasks</span>
                          </button>
                        </div>

                        {/* Stage movement arrows */}
                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              onClick={() => changeProjectStage(project.id, STAGES[colIdx - 1].key)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              title={`Move Back to ${STAGES[colIdx - 1].title}`}
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {colIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => changeProjectStage(project.id, STAGES[colIdx + 1].key)}
                              className="p-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-0.5 transition-colors"
                              title={`Advance to ${STAGES[colIdx + 1].title}`}
                            >
                              <span className="text-[9px]">Advance</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
