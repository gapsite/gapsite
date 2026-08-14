import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Award,
  Plus,
  ShieldCheck,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember } from '../types';

interface TeamWorkloadViewProps {
  onAssignToMember: (member: TeamMember) => void;
}

export const TeamWorkloadView: React.FC<TeamWorkloadViewProps> = ({ onAssignToMember }) => {
  const { teamMembers, dispositions, projects } = useProjects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Consulting Team & Capacity Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workload distribution, industrial specializations, and job disposition assignments
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Active Specialists: <span className="font-mono font-bold text-slate-900">{teamMembers.length}</span>
        </div>
      </div>

      {/* Grid of Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const memberDispositions = dispositions.filter((d) => d.assignedToId === member.id);
          const activeDispositions = memberDispositions.filter((d) => d.status !== 'COMPLETED');
          const completedCount = memberDispositions.filter((d) => d.status === 'COMPLETED').length + member.completedTaskCount;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              {/* Member Profile */}
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                    <p className="text-xs text-emerald-700 font-semibold truncate">{member.role}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">{member.email}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity & Workload Gauge */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Workload Capacity:</span>
                    <span
                      className={`font-mono font-bold ${
                        member.capacityPercentage > 80
                          ? 'text-red-700'
                          : member.capacityPercentage > 50
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {member.capacityPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        member.capacityPercentage > 80
                          ? 'bg-red-500'
                          : member.capacityPercentage > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${member.capacityPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>{activeDispositions.length} Active Tasks</span>
                    <span>{completedCount} Completed Deliverables</span>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Domain Specializations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialization.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Task List Preview & Action */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Current Assigned Tasks ({activeDispositions.length}):
                  </span>
                  {activeDispositions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Available for new assignments</p>
                  ) : (
                    activeDispositions.slice(0, 2).map((d) => (
                      <div
                        key={d.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-800 truncate">{d.title}</span>
                          <span className="font-mono text-[9px] text-amber-700 font-bold">
                            Due {d.dueDate.slice(5)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{d.clientName}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => onAssignToMember(member)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Job Disposition</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
