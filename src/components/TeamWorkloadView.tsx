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
  AlertTriangle,
  Flame,
  Zap,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember } from '../types';
import { calculateMemberWorkload } from '../utils/workload';

interface TeamWorkloadViewProps {
  onAssignToMember: (member: TeamMember) => void;
}

export const TeamWorkloadView: React.FC<TeamWorkloadViewProps> = ({ onAssignToMember }) => {
  const { teamMembers, dispositions, projects } = useProjects();

  // Aggregate matrix statistics
  const totalActiveTasks = dispositions.filter((d) => d.status !== 'COMPLETED').length;
  const urgentTasks = dispositions.filter((d) => d.priority === 'URGENT' && d.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header & Capacity Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Consultant & Auditor Workload Distribution Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time capacity tracking, task load index, and domain specialization assignments across TKDN, SNI, BMP, and Halal streams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Active Specialists: <span className="font-mono font-bold text-slate-900">{teamMembers.length}</span>
          </div>
          <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Active Tasks: <span className="font-mono font-bold text-slate-900">{totalActiveTasks}</span>
          </div>
          {urgentTasks > 0 && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              Urgent SLA: <span className="font-mono font-bold text-rose-900">{urgentTasks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const stats = calculateMemberWorkload(member.id, dispositions, member.completedTaskCount || 0);
          const activeDispositions = stats.activeDispositions;
          const completedCount = stats.completedCount;

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
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold truncate">{member.roleTitle || member.role}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{member.email}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity & Workload Gauge */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <span>Workload:</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${stats.badgeBg}`}>
                        {stats.capacityStatusLabel}
                      </span>
                    </span>
                    <span className={`font-mono font-bold ${stats.capacityColor}`}>
                      {stats.capacityPercentage}%
                    </span>
                  </div>
                  
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stats.capacityPercentage > 85
                          ? 'bg-red-500'
                          : stats.capacityPercentage > 60
                          ? 'bg-amber-500'
                          : stats.capacityPercentage > 25
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${stats.capacityPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                    <span className="font-medium">
                      <strong className="text-slate-900">{stats.activeCount}</strong> active tasks
                      {stats.urgentCount > 0 && (
                        <span className="text-rose-600 font-bold ml-1">({stats.urgentCount} urgent)</span>
                      )}
                    </span>
                    <span className="text-slate-500 font-medium">{completedCount} completed</span>
                  </div>
                </div>

                {/* Specializations */}
                {member.specialization && member.specialization.length > 0 && (
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
                )}
              </div>

              {/* Active Task List Preview & Action */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Assigned Active Tasks ({activeDispositions.length}):
                  </span>
                  {activeDispositions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">Available for new client assignments</p>
                  ) : (
                    activeDispositions.slice(0, 2).map((d) => (
                      <div
                        key={d.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-800 truncate">{d.title}</span>
                          <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            d.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800'
                              : d.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            Due {d.dueDate.slice(5)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{d.clientName}</p>
                      </div>
                    ))
                  )}
                  {activeDispositions.length > 2 && (
                    <p className="text-[10px] text-slate-400 font-semibold text-right">
                      +{activeDispositions.length - 2} more active tasks
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onAssignToMember(member)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Job Task</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
