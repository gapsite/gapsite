import React, { useState, useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  FileText,
  Filter,
  Layers,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tag,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { ProjectActivity, ActivityType, ConsultingProject } from '../types';
import { useProjects } from '../context/ProjectContext';

interface ActivityLogProps {
  project: ConsultingProject;
  activities?: ProjectActivity[];
  compact?: boolean;
  className?: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  project,
  activities: customActivities,
  compact = false,
  className = '',
}) => {
  const { addActivity, currentUser } = useProjects();
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedToast, setCopiedToast] = useState(false);

  // Form State for Posting Remarks
  const [newRemarkText, setNewRemarkText] = useState('');
  const [selectedRemarkType, setSelectedRemarkType] = useState<ActivityType>('NOTE');
  const [isPosting, setIsPosting] = useState(false);

  // Activity list source
  const rawActivities = customActivities || project.activities || [];

  // Filter & Search Logic
  const filteredActivities = useMemo(() => {
    return rawActivities
      .filter((act) => {
        // Type filter
        if (activeFilter !== 'ALL' && act.type !== activeFilter) {
          return false;
        }
        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchAction = act.action?.toLowerCase().includes(q);
          const matchActor = act.actor?.toLowerCase().includes(q);
          const matchDetails = act.details?.toLowerCase().includes(q);
          const matchType = act.type?.toLowerCase().includes(q);
          return matchAction || matchActor || matchDetails || matchType;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [rawActivities, activeFilter, searchQuery, sortOrder]);

  // Counts by category
  const counts = useMemo(() => {
    const res = {
      ALL: rawActivities.length,
      STATUS_CHANGE: 0,
      USER_ASSIGNMENT: 0,
      DOC_UPLOAD: 0,
      DISPOSITION: 0,
      AUDIT_MILESTONE: 0,
      NOTE: 0,
    };
    rawActivities.forEach((act) => {
      if (res[act.type] !== undefined) {
        res[act.type]++;
      }
    });
    return res;
  }, [rawActivities]);

  // Handle Adding Field Remark
  const handlePostRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;

    setIsPosting(true);
    let actionTitle = 'Consultant Remark Recorded';
    if (selectedRemarkType === 'STATUS_CHANGE') actionTitle = 'Status Assessment Note';
    if (selectedRemarkType === 'USER_ASSIGNMENT') actionTitle = 'Staff Delegation Memo';
    if (selectedRemarkType === 'DOC_UPLOAD') actionTitle = 'Document Verification Note';
    if (selectedRemarkType === 'AUDIT_MILESTONE') actionTitle = 'Auditor Site Clarification';

    addActivity(
      project.id,
      actionTitle,
      newRemarkText.trim(),
      selectedRemarkType,
      {
        authorRole: currentUser.role,
      }
    );

    setNewRemarkText('');
    setIsPosting(false);
  };

  // Copy Audit Log Summary
  const handleCopyAuditSummary = () => {
    const summary = [
      `==================================================`,
      `AUDIT & ACTIVITY LOG: ${project.code} - ${project.clientName}`,
      `Product/Service: ${project.productOrServiceName}`,
      `Current Stage: ${project.stage} | Status: ${project.status}`,
      `Lead Consultant: ${project.leadConsultantName}`,
      `Generated: ${new Date().toLocaleString('id-ID')}`,
      `Total Log Entries: ${rawActivities.length}`,
      `==================================================\n`,
      ...rawActivities.map((a, idx) => {
        return `[${idx + 1}] ${a.timestamp} | ${a.type}\nAction: ${a.action}\nActor: ${a.actor} (${a.actorRole || 'Consulting Staff'})\nDetails: ${a.details}\n`;
      }),
    ].join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Type Configuration (Icon, Color, Badge)
  const getTypeConfig = (type: ActivityType) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return {
          icon: RefreshCw,
          label: 'Status & Stage',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
          bulletColor: 'bg-emerald-500',
          tagLabel: 'Status Transition',
        };
      case 'USER_ASSIGNMENT':
        return {
          icon: UserCheck,
          label: 'User Assignment',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
          bulletColor: 'bg-indigo-500',
          tagLabel: 'Staff Assignment',
        };
      case 'DOC_UPLOAD':
        return {
          icon: FileCheck,
          label: 'Document Audit',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-100 text-blue-700 ring-blue-200',
          bulletColor: 'bg-blue-500',
          tagLabel: 'Document Repo',
        };
      case 'DISPOSITION':
        return {
          icon: Clock,
          label: 'Job Disposition',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-800 ring-amber-200',
          bulletColor: 'bg-amber-500',
          tagLabel: 'Field Task',
        };
      case 'AUDIT_MILESTONE':
        return {
          icon: Award,
          label: 'Audit Milestone',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-700 ring-purple-200',
          bulletColor: 'bg-purple-500',
          tagLabel: 'Surveyor / SIINas',
        };
      case 'NOTE':
      default:
        return {
          icon: MessageSquare,
          label: 'Consultant Remark',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700 ring-slate-200',
          bulletColor: 'bg-slate-500',
          tagLabel: 'Consultant Note',
        };
    }
  };

  // Helper for human-readable time format
  const formatTimestamp = (ts: string): { formatted: string; relative: string } => {
    try {
      const date = new Date(ts.replace(' ', 'T'));
      if (isNaN(date.getTime())) return { formatted: ts, relative: '' };
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let relative = '';
      if (diffHours < 1) relative = 'Just now';
      else if (diffHours < 24) relative = `${diffHours}h ago`;
      else if (diffDays === 1) relative = 'Yesterday';
      else if (diffDays < 7) relative = `${diffDays}d ago`;

      return {
        formatted: ts,
        relative,
      };
    } catch {
      return { formatted: ts, relative: '' };
    }
  };

  return (
    <div id="activity-log-component" className={`space-y-4 ${className}`}>
      {/* Top Header & Summary Stats */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Compliance Audit Trail & Activity Log</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {rawActivities.length} Events Logged
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Immutable chronological log tracking status changes, staff assignments, and document uploads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAuditSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              title="Copy formatted audit trail for file export"
            >
              {copiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export Audit Trail</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="pt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {counts.ALL}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('STATUS_CHANGE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'STATUS_CHANGE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Status & Stage</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'STATUS_CHANGE' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/70 text-emerald-800'
            }`}>
              {counts.STATUS_CHANGE}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('USER_ASSIGNMENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'USER_ASSIGNMENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/60'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>User Assignments</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'USER_ASSIGNMENT' ? 'bg-indigo-700 text-white' : 'bg-indigo-200/70 text-indigo-800'
            }`}>
              {counts.USER_ASSIGNMENT}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('DOC_UPLOAD')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'DOC_UPLOAD'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60'
            }`}
          >
            <FileCheck className="w-3 h-3" />
            <span>Document Uploads</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'DOC_UPLOAD' ? 'bg-blue-700 text-white' : 'bg-blue-200/70 text-blue-800'
            }`}>
              {counts.DOC_UPLOAD}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('DISPOSITION')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'DISPOSITION'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Tasks / Dispositions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'DISPOSITION' ? 'bg-amber-700 text-white' : 'bg-amber-200/70 text-amber-800'
            }`}>
              {counts.DISPOSITION}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('AUDIT_MILESTONE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'AUDIT_MILESTONE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>Milestones</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'AUDIT_MILESTONE' ? 'bg-purple-700 text-white' : 'bg-purple-200/70 text-purple-800'
            }`}>
              {counts.AUDIT_MILESTONE}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('NOTE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'NOTE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Notes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === 'NOTE' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {counts.NOTE}
            </span>
          </button>
        </div>
      </div>

      {/* Remark Entry Composer */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <form onSubmit={handlePostRemark} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Record Consultant Field Remark / Audit Entry</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 mr-1">Log As:</span>
              <select
                value={selectedRemarkType}
                onChange={(e) => setSelectedRemarkType(e.target.value as ActivityType)}
                className="text-[11px] bg-white border border-slate-300 rounded-md px-2 py-0.8 font-semibold text-slate-700 focus:ring-1 focus:ring-slate-900"
              >
                <option value="NOTE">Consultant Field Remark</option>
                <option value="STATUS_CHANGE">Status Assessment Note</option>
                <option value="USER_ASSIGNMENT">Staff Delegation Memo</option>
                <option value="DOC_UPLOAD">Document Review Note</option>
                <option value="AUDIT_MILESTONE">Auditor Site Clarification</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              placeholder={`Type consultant field remark, auditor inspection finding, or compliance memo...`}
              className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-slate-900 focus:border-slate-900 font-medium"
            />
            <button
              type="submit"
              disabled={!newRemarkText.trim() || isPosting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post to Log</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search & Sort Subheader */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity by actor, action, or details..."
            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-800">{filteredActivities.length}</strong> of {rawActivities.length}
          </span>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-xs transition-colors flex items-center gap-1"
          >
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center bg-white border border-slate-200 rounded-xl">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No activity log entries found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery || activeFilter !== 'ALL'
                ? 'Try adjusting your search query or filter chip selection.'
                : 'Project activities will be recorded automatically as changes occur.'}
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const config = getTypeConfig(act.type);
            const Icon = config.icon;
            const timeInfo = typeof act.timestamp === 'string' ? formatTimestamp(act.timestamp) : { formatted: '', relative: '' };

            return (
              <div
                key={act.id}
                id={`activity-${act.id}`}
                className="relative group transition-all"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs ring-2 ${config.iconBg}`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Activity Card */}
                <div className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 transition-colors shadow-xs">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {act.action}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${config.badgeBg}`}
                      >
                        {config.tagLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-right font-mono text-[11px] text-slate-400">
                      {timeInfo.relative && (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                          {timeInfo.relative}
                        </span>
                      )}
                      <span>{timeInfo.formatted}</span>
                    </div>
                  </div>

                  {/* Card Body / Details */}
                  <div className="pt-2 text-xs text-slate-700 leading-relaxed font-normal">
                    <p>{act.details}</p>

                    {/* Metadata Visualizer */}
                    {act.metadata && (
                      <div className="mt-2 pt-2 border-t border-slate-100/80 flex flex-wrap gap-1.5 items-center text-[11px]">
                        {act.metadata.previousValue && act.metadata.newValue && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[10px]">
                            <span className="line-through text-slate-400">{act.metadata.previousValue}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                            <strong className="text-slate-900">{act.metadata.newValue}</strong>
                          </div>
                        )}

                        {act.metadata.documentName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium text-[10px]">
                            <Paperclip className="w-2.5 h-2.5" />
                            {act.metadata.documentName}
                          </span>
                        )}

                        {act.metadata.assigneeName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium text-[10px]">
                            <UserCheck className="w-2.5 h-2.5" />
                            Assignee: {act.metadata.assigneeName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Actor details */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4.5 h-4.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                        {act.actor ? act.actor.slice(0, 2).toUpperCase() : 'AU'}
                      </div>
                      <span className="font-semibold text-slate-700">{act.actor}</span>
                      {act.actorRole && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {act.actorRole}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: #{act.id.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
