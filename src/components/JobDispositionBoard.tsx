import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  CheckSquare,
  Square,
  User,
  ArrowRight,
  MoreVertical,
  Calendar,
  MessageSquare,
  FileText,
  ShieldCheck,
  ChevronDown,
  Building,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  JobDisposition,
  DispositionStatus,
  Priority,
  DispositionCategory,
} from '../types';
import { getDispositionStatusBadge, getPriorityBadge } from '../utils/formatters';

interface JobDispositionBoardProps {
  onOpenNewDisposition: () => void;
  onEditDisposition: (disp: JobDisposition) => void;
}

export const JobDispositionBoard: React.FC<JobDispositionBoardProps> = ({
  onOpenNewDisposition,
  onEditDisposition,
}) => {
  const {
    dispositions,
    teamMembers,
    updateDisposition,
    toggleChecklistItem,
    deleteDisposition,
    currentUser,
  } = useProjects();

  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<DispositionStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const STATUS_COLUMNS: { key: DispositionStatus; title: string; color: string }[] = [
    { key: 'PENDING', title: 'Pending Assignment', color: 'border-t-slate-400' },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'border-t-blue-500' },
    { key: 'AWAITING_CLIENT', title: 'Awaiting Client Data', color: 'border-t-amber-500' },
    { key: 'UNDER_REVIEW', title: 'Under Lead Review', color: 'border-t-purple-500' },
    { key: 'COMPLETED', title: 'Done / Approved', color: 'border-t-emerald-500' },
  ];

  const filteredDispositions = dispositions.filter((d) => {
    if (filterAssignee !== 'ALL' && d.assignedToId !== filterAssignee) return false;
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && d.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchClient = d.clientName.toLowerCase().includes(q);
      const matchCode = d.projectCode.toLowerCase().includes(q);
      const matchAssignee = d.assignedToName.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchCode && !matchAssignee) return false;
    }
    return true;
  });

  const getCategoryLabel = (cat: DispositionCategory) => {
    switch (cat) {
      case 'TKDN_CALCULATION': return 'TKDN Calculation & BOM';
      case 'DOC_COLLECTION': return 'Doc Collection';
      case 'FIELD_AUDIT_PREP': return 'Field Audit Prep';
      case 'REGULATORY_SUBMISSION': return 'SIINas / OSS Submission';
      case 'LEGAL_COMPLIANCE': return 'Legal / Permits';
      case 'CLIENT_CONSULTATION': return 'Consultation';
      default: return cat;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Job Disposition & Task Assignment Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal task distribution, SLA tracking, and lead consultant delegation board
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task, client, code..."
            className="text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
          />

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Consultants</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name.split(',')[0]}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'ALL')}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Dispatch button */}
          <button
            onClick={onOpenNewDisposition}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Dispatch Disposition</span>
          </button>
        </div>
      </div>

      {/* Kanban Column View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {STATUS_COLUMNS.map((col) => {
          const colDispositions = filteredDispositions.filter((d) => d.status === col.key);

          return (
            <div
              key={col.key}
              className={`rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs min-h-[550px] flex flex-col border-t-4 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-800">{col.title}</h4>
                <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                  {colDispositions.length}
                </span>
              </div>

              {/* Task Cards in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                {colDispositions.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                    No tasks
                  </div>
                ) : (
                  colDispositions.map((disp) => {
                    const completedChecks = disp.checklist?.filter((c) => c.done).length || 0;
                    const totalChecks = disp.checklist?.length || 0;

                    return (
                      <div
                        key={disp.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3"
                      >
                        {/* Top: Code & Priority Badge */}
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {disp.projectCode}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              disp.priority === 'URGENT'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : disp.priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {disp.priority}
                          </span>
                        </div>

                        {/* Client & Title */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                            {disp.clientName}
                          </p>
                          <h4 className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                            {disp.title}
                          </h4>
                          <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {getCategoryLabel(disp.category)}
                          </span>
                        </div>

                        {/* Instructions Memo (collapsible / preview) */}
                        {disp.instructions && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 line-clamp-3">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase">
                              Memo from {disp.assignedByName.split(',')[0]}:
                            </span>
                            {disp.instructions}
                          </div>
                        )}

                        {/* Checklist Progress */}
                        {totalChecks > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>Checklist Items:</span>
                              <span className="font-mono font-bold text-slate-700">
                                {completedChecks}/{totalChecks}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                              <div
                                className={`h-full ${
                                  completedChecks === totalChecks ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${(completedChecks / totalChecks) * 100}%` }}
                              />
                            </div>
                            {/* Interactive Checklist list */}
                            <div className="space-y-1">
                              {disp.checklist.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleChecklistItem(disp.id, item.id)}
                                  className="w-full text-left flex items-start gap-1.5 text-[11px] p-1 rounded hover:bg-slate-50 transition-colors"
                                >
                                  {item.done ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  )}
                                  <span
                                    className={`line-clamp-2 ${
                                      item.done ? 'line-through text-slate-400' : 'text-slate-700'
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={disp.assignedToAvatar}
                              alt={disp.assignedToName}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[90px]">
                              {disp.assignedToName.split(',')[0]}
                            </span>
                          </div>
                          <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            <span>{disp.dueDate.slice(5)}</span>
                          </div>
                        </div>

                        {/* Status Change Quick Dropdown */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                          <select
                            value={disp.status}
                            onChange={(e) =>
                              updateDisposition(disp.id, {
                                status: e.target.value as DispositionStatus,
                              })
                            }
                            className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="AWAITING_CLIENT">Awaiting Client</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="COMPLETED">Mark Done</option>
                          </select>

                          <button
                            onClick={() => onEditDisposition(disp)}
                            className="text-[10px] text-slate-500 hover:text-slate-900 font-semibold px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200"
                          >
                            Edit
                          </button>
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
    </div>
  );
};
