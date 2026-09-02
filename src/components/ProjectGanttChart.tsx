import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Flag,
  Target,
  User,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  ConsultingProject,
  JobDisposition,
  ProjectStage,
  ProjectStatus,
  Priority,
} from '../types';
import {
  formatIDRShort,
  getStageName,
  getStageColor,
  getServiceTypeName,
  getServiceTypeBadgeColor,
  getPriorityBadge,
  getStatusBadge,
} from '../utils/formatters';

interface ProjectGanttChartProps {
  onSelectProject: (project: ConsultingProject) => void;
  onOpenDispositionForProject: (project: ConsultingProject) => void;
}

type TimeScaleMode = 'month' | 'week' | 'quarter';

interface MilestoneTooltipData {
  title: string;
  subtitle: string;
  date: string;
  type: 'kickoff' | 'surveyor_audit' | 'task_deadline' | 'target_completion';
  status?: string;
  assignee?: string;
  details?: string;
  x: number;
  y: number;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  onSelectProject,
  onOpenDispositionForProject,
}) => {
  const { filteredProjects, dispositions, teamMembers } = useProjects();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const leftPanelScrollRef = useRef<HTMLDivElement>(null);

  // States
  const [scaleMode, setScaleMode] = useState<TimeScaleMode>('month');
  const [zoomLevel, setZoomLevel] = useState<number>(36); // pixels per day/slot
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  
  // Milestone visibility toggles
  const [showKickoff, setShowKickoff] = useState(true);
  const [showSurveyorAudits, setShowSurveyorAudits] = useState(true);
  const [showTaskDeadlines, setShowTaskDeadlines] = useState(true);
  const [showCompletionTargets, setShowCompletionTargets] = useState(true);
  const [showStageBreakdown, setShowStageBreakdown] = useState(true);

  // Hover Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<MilestoneTooltipData | null>(null);

  // Toggle Project Expand
  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedProjectIds(new Set(filteredProjects.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedProjectIds(new Set());
  };

  // Filter projects based on internal search & health
  const displayedProjects = useMemo(() => {
    return filteredProjects.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productOrServiceName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHealth =
        selectedHealthFilter === 'ALL' || p.status === selectedHealthFilter;

      return matchesSearch && matchesHealth;
    });
  }, [filteredProjects, searchQuery, selectedHealthFilter]);

  // Determine global timeline boundary dates
  const { minDate, maxDate, totalDays, allDates } = useMemo(() => {
    if (filteredProjects.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setMonth(start.getMonth() - 2);
      const end = new Date(today);
      end.setMonth(end.getMonth() + 4);
      return {
        minDate: start,
        maxDate: end,
        totalDays: 180,
        allDates: [],
      };
    }

    let min = new Date(filteredProjects[0].startDate || '2025-01-01');
    let max = new Date(filteredProjects[0].targetCompletionDate || '2025-06-30');

    filteredProjects.forEach((p) => {
      if (p.startDate) {
        const d = new Date(p.startDate);
        if (d < min) min = d;
      }
      if (p.targetCompletionDate) {
        const d = new Date(p.targetCompletionDate);
        if (d > max) max = d;
      }
      if (p.surveyorAuditDate) {
        const d = new Date(p.surveyorAuditDate);
        if (d > max) max = d;
        if (d < min) min = d;
      }
    });

    // Also factor in disposition dates
    dispositions.forEach((d) => {
      if (d.dueDate) {
        const due = new Date(d.dueDate);
        if (due > max) max = due;
      }
      if (d.assignedDate) {
        const assigned = new Date(d.assignedDate);
        if (assigned < min) min = assigned;
      }
    });

    // Add padding: 14 days before min, 28 days after max
    const startBoundary = new Date(min);
    startBoundary.setDate(startBoundary.getDate() - 14);
    startBoundary.setHours(0, 0, 0, 0);

    const endBoundary = new Date(max);
    endBoundary.setDate(endBoundary.getDate() + 28);
    endBoundary.setHours(0, 0, 0, 0);

    // Calculate total days
    const diffTime = Math.abs(endBoundary.getTime() - startBoundary.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Generate date array
    const dates: Date[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(startBoundary);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    return {
      minDate: startBoundary,
      maxDate: endBoundary,
      totalDays: days,
      allDates: dates,
    };
  }, [filteredProjects, dispositions]);

  // Today reference
  const today = useMemo(() => {
    // Check if real current date is within bounds; if not, use context appropriate date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Helper: Convert Date to Pixel Offset from start
  const getPixelOffset = (dateStrOrObj: string | Date | undefined): number => {
    if (!dateStrOrObj) return 0;
    const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - minDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays * zoomLevel);
  };

  // Helper: Calculate bar width
  const getBarWidth = (startStr?: string, endStr?: string): number => {
    if (!startStr || !endStr) return zoomLevel * 10;
    const s = new Date(startStr);
    const e = new Date(endStr);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    const diffTime = Math.max(1, e.getTime() - s.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays * zoomLevel;
  };

  // Today marker X position
  const todayX = useMemo(() => {
    return getPixelOffset(today);
  }, [today, minDate, zoomLevel]);

  const isTodayInView = useMemo(() => {
    return today >= minDate && today <= maxDate;
  }, [today, minDate, maxDate]);

  // Scroll to Today marker
  const scrollToToday = () => {
    if (timelineScrollRef.current) {
      const scrollPos = todayX - timelineScrollRef.current.clientWidth / 2;
      timelineScrollRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth',
      });
    }
  };

  // Auto scroll to today on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToToday();
    }, 200);
    return () => clearTimeout(timer);
  }, [minDate, zoomLevel]);

  // Sync scrolling between left sidebar and timeline vertical
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (leftPanelScrollRef.current) {
      leftPanelScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleLeftPanelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Group dates for header visualization (Months & Weeks)
  const headerMonths = useMemo(() => {
    const months: { label: string; year: number; month: number; daysCount: number; startIdx: number }[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let daysInMonth = 0;
    let startIdx = 0;

    allDates.forEach((d, idx) => {
      const m = d.getMonth();
      const y = d.getFullYear();
      if (m !== currentMonth || y !== currentYear) {
        if (currentMonth !== -1) {
          months.push({
            label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
              new Date(currentYear, currentMonth, 1)
            ),
            year: currentYear,
            month: currentMonth,
            daysCount: daysInMonth,
            startIdx,
          });
        }
        currentMonth = m;
        currentYear = y;
        daysInMonth = 1;
        startIdx = idx;
      } else {
        daysInMonth++;
      }
    });

    if (currentMonth !== -1) {
      months.push({
        label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
          new Date(currentYear, currentMonth, 1)
        ),
        year: currentYear,
        month: currentMonth,
        daysCount: daysInMonth,
        startIdx,
      });
    }

    return months;
  }, [allDates]);

  // Days remaining calculation helper
  const getDaysRemainingText = (targetDateStr: string, status: ProjectStatus) => {
    if (status === 'COMPLETED') {
      return { text: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due Today',
        color: 'text-amber-700 bg-amber-50 border-amber-300 font-bold animate-pulse',
      };
    } else if (diffDays <= 7) {
      return {
        text: `${diffDays}d left`,
        color: 'text-amber-700 bg-amber-50 border-amber-200 font-semibold',
      };
    } else {
      return {
        text: `${diffDays}d left`,
        color: 'text-slate-600 bg-slate-100 border-slate-200',
      };
    }
  };

  // Indonesian 6 Standard Stages definitions
  const STAGES_CONFIG: { id: ProjectStage; label: string; color: string; order: number }[] = [
    { id: 'INQUIRY', label: '1. Scoping & NIB', color: 'bg-slate-400', order: 1 },
    { id: 'GAP_ANALYSIS', label: '2. Gap Analysis', color: 'bg-amber-500', order: 2 },
    { id: 'DOC_PREPARATION', label: '3. BOM & Cost Prep', color: 'bg-blue-500', order: 3 },
    { id: 'FIELD_VERIFICATION', label: '4. LVI Audit', color: 'bg-indigo-500', order: 4 },
    { id: 'MINISTRY_REVIEW', label: '5. SIINas Review', color: 'bg-purple-500', order: 5 },
    { id: 'CERTIFICATE_ISSUED', label: '6. TKDN Certified', color: 'bg-emerald-500', order: 6 },
  ];

  // Render milestone marker tooltip helper
  const handleMilestoneHover = (
    e: React.MouseEvent,
    data: Omit<MilestoneTooltipData, 'x' | 'y'>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      ...data,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMilestoneLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Top Gantt Toolbar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Search & Filter Summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter project milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56 font-medium"
            />
          </div>

          {/* Health quick selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedHealthFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedHealthFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({filteredProjects.length})
            </button>
            <button
              onClick={() => setSelectedHealthFilter('ON_TRACK')}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                selectedHealthFilter === 'ON_TRACK'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              On Track
            </button>
            <button
              onClick={() => setSelectedHealthFilter('AT_RISK')}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                selectedHealthFilter === 'AT_RISK'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              At Risk
            </button>
            <button
              onClick={() => setSelectedHealthFilter('DELAYED')}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                selectedHealthFilter === 'DELAYED'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Delayed
            </button>
          </div>
        </div>

        {/* Right: Milestone Layer Toggles, Zoom, Jump to Today */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Milestone Display Layer Toggles */}
          <div className="hidden lg:flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Layers:</span>
            <button
              onClick={() => setShowKickoff((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                showKickoff
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-400 line-through'
              }`}
              title="Toggle Project Kickoff Pins"
            >
              🚩 Kickoff
            </button>
            <button
              onClick={() => setShowSurveyorAudits((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                showSurveyorAudits
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400 line-through'
              }`}
              title="Toggle LVI Field Audit Pins"
            >
              🔍 Audit
            </button>
            <button
              onClick={() => setShowTaskDeadlines((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                showTaskDeadlines
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-400 line-through'
              }`}
              title="Toggle Task Disposition Deadlines"
            >
              📌 Tasks
            </button>
            <button
              onClick={() => setShowCompletionTargets((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                showCompletionTargets
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400 line-through'
              }`}
              title="Toggle Final Target Certification Pins"
            >
              🎯 Targets
            </button>
          </div>

          {/* Expand / Collapse All Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded"
              title="Expand all project sub-tasks & phase breakdowns"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded"
              title="Collapse all project sub-tasks"
            >
              Collapse
            </button>
          </div>

          {/* Jump to Today Button */}
          <button
            onClick={scrollToToday}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Focus timeline on current date"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(18, z - 6))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Zoom Out Timeline"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-500 font-bold min-w-[36px] text-center">
              {zoomLevel}px
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(60, z + 6))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Zoom In Timeline"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Split Container */}
      <div className="flex flex-1 min-h-[580px] max-h-[750px] overflow-hidden relative">
        {/* LEFT COLUMN: Project & Task Hierarchy Sidebar */}
        <div
          ref={leftPanelScrollRef}
          onScroll={handleLeftPanelScroll}
          className="w-80 md:w-96 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto overflow-x-hidden select-none z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]"
        >
          {/* Header Row */}
          <div className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 px-4 py-3 h-[68px] flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Project & Milestones</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 lowercase font-medium">
              {displayedProjects.length} projects
            </span>
          </div>

          {/* Project Items List */}
          {displayedProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching projects found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedProjects.map((project) => {
                const isExpanded = expandedProjectIds.has(project.id);
                const daysInfo = getDaysRemainingText(project.targetCompletionDate, project.status);
                const projectDispositions = dispositions.filter((d) => d.projectId === project.id);

                return (
                  <div key={project.id} className="group transition-colors">
                    {/* Main Project Row */}
                    <div
                      onClick={() => onSelectProject(project)}
                      className="p-3.5 hover:bg-slate-50/90 cursor-pointer transition-colors relative"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <button
                            onClick={(e) => toggleExpand(project.id, e)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                            title={isExpanded ? 'Collapse sub-tasks' : 'Expand sub-tasks'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {project.code}
                          </span>

                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getStatusBadge(
                              project.status
                            )}`}
                          >
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Days Remaining / Overdue pill */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono border whitespace-nowrap ${daysInfo.color}`}
                        >
                          {daysInfo.text}
                        </span>
                      </div>

                      {/* Project Client & Title */}
                      <div className="pl-6">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                          {project.clientName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {project.productOrServiceName}
                        </p>

                        {/* Meta Tags & Progress */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold border ${getServiceTypeBadgeColor(
                              project.serviceType
                            )}`}
                          >
                            {getServiceTypeName(project.serviceType).split(' ')[0]}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-700">
                              {project.progressPercentage}%
                            </span>
                            <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${project.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Sub-Rows (Stages and Dispositions) */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 border-t border-slate-100 pl-8 pr-3 py-2 space-y-2 text-[11px]">
                        {/* Stage Progress Summary */}
                        <div className="flex items-center justify-between text-slate-600 pb-1 border-b border-slate-200/60">
                          <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500">
                            Current Stage
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStageColor(
                              project.stage
                            )}`}
                          >
                            {getStageName(project.stage)}
                          </span>
                        </div>

                        {/* Dispositions list */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500">
                              Job Dispositions ({projectDispositions.length})
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDispositionForProject(project);
                              }}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Add Task
                            </button>
                          </div>

                          {projectDispositions.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic py-1">
                              No active job dispositions assigned.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {projectDispositions.map((disp) => (
                                <div
                                  key={disp.id}
                                  className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200/80 shadow-2xs text-[10px]"
                                >
                                  <div className="flex items-center gap-1.5 truncate mr-2">
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        disp.status === 'COMPLETED'
                                          ? 'bg-emerald-500'
                                          : disp.priority === 'URGENT'
                                          ? 'bg-rose-500'
                                          : 'bg-amber-500'
                                      }`}
                                    />
                                    <span className="font-medium text-slate-800 truncate">
                                      {disp.title}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                                    Due: {disp.dueDate}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Gantt Grid & Milestones */}
        <div
          ref={timelineScrollRef}
          onScroll={handleTimelineScroll}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-50 select-none"
        >
          <div
            className="relative"
            style={{
              width: `${totalDays * zoomLevel}px`,
              minWidth: '100%',
            }}
          >
            {/* STICKY TIMELINE HEADER (Two tiers: Months & Days) */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
              {/* Tier 1: Months / Quarters */}
              <div className="flex border-b border-slate-100 h-8">
                {headerMonths.map((m, idx) => (
                  <div
                    key={`${m.year}-${m.month}-${idx}`}
                    className="border-r border-slate-200 px-3 flex items-center font-bold text-xs text-slate-800 bg-slate-100/90 whitespace-nowrap overflow-hidden"
                    style={{ width: `${m.daysCount * zoomLevel}px` }}
                  >
                    <CalendarIcon className="w-3 h-3 text-emerald-600 mr-1.5 inline flex-shrink-0" />
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Tier 2: Days numbers and Weekday labels */}
              <div className="flex h-9 bg-white">
                {allDates.map((d, idx) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isFirstOfMonth = d.getDate() === 1;
                  const isTodayDate =
                    d.getFullYear() === today.getFullYear() &&
                    d.getMonth() === today.getMonth() &&
                    d.getDate() === today.getDate();

                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 border-r border-slate-100 flex flex-col items-center justify-center text-[10px] font-mono transition-colors ${
                        isTodayDate
                          ? 'bg-emerald-500 text-white font-bold'
                          : isWeekend
                          ? 'bg-slate-100/80 text-slate-400'
                          : isFirstOfMonth
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-l-slate-300'
                          : 'text-slate-600'
                      }`}
                      style={{ width: `${zoomLevel}px` }}
                    >
                      <span className="text-[8px] uppercase tracking-tighter opacity-80">
                        {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                      <span>{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VERTICAL GRID LINES (Background) */}
            <div className="absolute inset-0 top-[68px] pointer-events-none flex">
              {allDates.map((d, idx) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isFirstOfMonth = d.getDate() === 1;
                return (
                  <div
                    key={idx}
                    className={`flex-shrink-0 border-r ${
                      isFirstOfMonth
                        ? 'border-slate-300 bg-slate-50/20'
                        : isWeekend
                        ? 'border-slate-100/70 bg-slate-100/30'
                        : 'border-slate-100/50'
                    }`}
                    style={{ width: `${zoomLevel}px` }}
                  />
                );
              })}
            </div>

            {/* TODAY VERTICAL INDICATOR LINE */}
            {isTodayInView && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${todayX + zoomLevel / 2}px` }}
              >
                {/* Floating Today Pill on Header */}
                <div className="sticky top-1 -translate-x-1/2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap flex items-center gap-1 z-30">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Today: {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
                {/* Vertical high contrast dashed line */}
                <div className="w-[2px] h-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)] border-l border-emerald-600" />
              </div>
            )}

            {/* TIMELINE ROWS FOR PROJECTS */}
            <div className="divide-y divide-slate-100 relative z-10">
              {displayedProjects.map((project) => {
                const isExpanded = expandedProjectIds.has(project.id);
                const projectDispositions = dispositions.filter((d) => d.projectId === project.id);

                const barLeft = getPixelOffset(project.startDate);
                const barWidth = getBarWidth(project.startDate, project.targetCompletionDate);

                // Milestones coordinates
                const kickoffX = getPixelOffset(project.startDate);
                const surveyorAuditX = project.surveyorAuditDate
                  ? getPixelOffset(project.surveyorAuditDate)
                  : null;
                const targetCompletionX = getPixelOffset(project.targetCompletionDate);

                return (
                  <div key={project.id} className="group/row">
                    {/* Main Project Schedule Bar Row */}
                    <div
                      className="h-[88px] relative flex items-center cursor-pointer hover:bg-slate-100/30 transition-colors"
                      onClick={() => onSelectProject(project)}
                    >
                      {/* SCHEDULE BAR CONTAINER */}
                      <div
                        className="absolute h-10 rounded-xl shadow-xs border transition-all hover:shadow-md flex items-center overflow-visible group/bar select-none"
                        style={{
                          left: `${barLeft}px`,
                          width: `${barWidth}px`,
                          backgroundColor:
                            project.status === 'COMPLETED'
                              ? '#f0fdf4'
                              : project.status === 'DELAYED'
                              ? '#fff1f2'
                              : project.status === 'AT_RISK'
                              ? '#fffbeb'
                              : '#f8fafc',
                          borderColor:
                            project.status === 'COMPLETED'
                              ? '#86efac'
                              : project.status === 'DELAYED'
                              ? '#fda4af'
                              : project.status === 'AT_RISK'
                              ? '#fcd34d'
                              : '#cbd5e1',
                        }}
                      >
                        {/* Progress Fill Indicator */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 rounded-l-xl opacity-25 transition-all duration-300 ${
                            project.status === 'COMPLETED'
                              ? 'bg-emerald-600 rounded-r-xl'
                              : project.status === 'DELAYED'
                              ? 'bg-rose-500'
                              : project.status === 'AT_RISK'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${project.progressPercentage}%` }}
                        />

                        {/* Progress Striped Accent Header */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl ${
                            project.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : project.status === 'DELAYED'
                              ? 'bg-rose-500'
                              : project.status === 'AT_RISK'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />

                        {/* Text Label on Bar */}
                        <div className="px-3 flex items-center justify-between w-full z-10 pointer-events-none truncate">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {project.code}
                            </span>
                            <span className="text-[11px] text-slate-600 truncate font-medium hidden sm:inline">
                              {project.clientName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-white/90 px-1.5 py-0.5 rounded shadow-2xs border border-slate-200/60 ml-2">
                            {project.progressPercentage}%
                          </span>
                        </div>
                      </div>

                      {/* KEY MILESTONES OVERLAY ON TIMELINE */}

                      {/* 1. Kickoff Milestone */}
                      {showKickoff && (
                        <div
                          className="absolute -top-1 z-20 cursor-pointer transform -translate-x-1/2 hover:scale-125 transition-transform"
                          style={{ left: `${kickoffX}px` }}
                          onMouseEnter={(e) =>
                            handleMilestoneHover(e, {
                              title: `Project Kickoff (${project.code})`,
                              subtitle: project.clientName,
                              date: project.startDate,
                              type: 'kickoff',
                              details: `Initial consultation commenced. Target TKDN: ${project.targetTkdnPercentage}%`,
                            })
                          }
                          onMouseLeave={handleMilestoneLeave}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs border-2 border-white">
                            <Flag className="w-3 h-3 text-emerald-400" />
                          </div>
                        </div>
                      )}

                      {/* 2. Surveyor Field Audit Milestone */}
                      {showSurveyorAudits && surveyorAuditX !== null && (
                        <div
                          className="absolute -bottom-2 z-20 cursor-pointer transform -translate-x-1/2 hover:scale-125 transition-transform"
                          style={{ left: `${surveyorAuditX}px` }}
                          onMouseEnter={(e) =>
                            handleMilestoneHover(e, {
                              title: `LVI Field Audit (${project.surveyorBody})`,
                              subtitle: project.clientName,
                              date: project.surveyorAuditDate || '',
                              type: 'surveyor_audit',
                              assignee: project.surveyorAuditorName || 'Assigned Lead LVI Auditor',
                              details: `Site verification and factory inspection at plant location.`,
                            })
                          }
                          onMouseLeave={handleMilestoneLeave}
                        >
                          <div className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[9px] shadow-sm border-2 border-white flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-indigo-200" />
                            <span>LVI: {project.surveyorBody.split(' ')[1] || 'LVI'}</span>
                          </div>
                        </div>
                      )}

                      {/* 3. Job Disposition Deadlines (Pins) */}
                      {showTaskDeadlines &&
                        projectDispositions.map((disp) => {
                          const taskX = getPixelOffset(disp.dueDate);
                          return (
                            <div
                              key={disp.id}
                              className="absolute top-2 z-20 cursor-pointer transform -translate-x-1/2 hover:scale-125 transition-transform"
                              style={{ left: `${taskX}px` }}
                              onMouseEnter={(e) =>
                                handleMilestoneHover(e, {
                                  title: disp.title,
                                  subtitle: `Assigned to: ${disp.assignedToName}`,
                                  date: disp.dueDate,
                                  type: 'task_deadline',
                                  status: disp.status,
                                  assignee: disp.assignedToRole,
                                  details: disp.instructions,
                                })
                              }
                              onMouseLeave={handleMilestoneLeave}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center shadow-xs border-2 border-white text-white text-[9px] font-bold ${
                                  disp.status === 'COMPLETED'
                                    ? 'bg-emerald-600'
                                    : disp.priority === 'URGENT'
                                    ? 'bg-rose-600 ring-2 ring-rose-300'
                                    : 'bg-amber-600'
                                }`}
                              >
                                {disp.status === 'COMPLETED' ? '✓' : '📌'}
                              </div>
                            </div>
                          );
                        })}

                      {/* 4. Target Completion / Certificate Deadline */}
                      {showCompletionTargets && (
                        <div
                          className="absolute -top-1 z-20 cursor-pointer transform -translate-x-1/2 hover:scale-125 transition-transform"
                          style={{ left: `${targetCompletionX}px` }}
                          onMouseEnter={(e) =>
                            handleMilestoneHover(e, {
                              title: `Target Certification Deadline`,
                              subtitle: project.clientName,
                              date: project.targetCompletionDate,
                              type: 'target_completion',
                              status: project.status,
                              details: `Contract Value: ${formatIDRShort(
                                project.contractValueIDR
                              )}. Target completion & certificate hand-off.`,
                            })
                          }
                          onMouseLeave={handleMilestoneLeave}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${
                              project.status === 'COMPLETED'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-amber-400'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* EXPANDED SUB-ROWS: Stage Phases Breakdown & Tasks */}
                    {isExpanded && (
                      <div className="bg-slate-50/50 border-t border-slate-100 py-3 space-y-3">
                        {/* 1. Six Stage Phases Sequence Bar */}
                        <div className="h-6 relative flex items-center">
                          <div
                            className="absolute h-4 rounded-md flex overflow-hidden border border-slate-300 shadow-2xs"
                            style={{
                              left: `${barLeft}px`,
                              width: `${barWidth}px`,
                            }}
                          >
                            {STAGES_CONFIG.map((st, idx) => {
                              const currentStageOrder =
                                STAGES_CONFIG.find((s) => s.id === project.stage)?.order || 1;
                              const isCompleted = st.order < currentStageOrder;
                              const isCurrent = st.order === currentStageOrder;

                              return (
                                <div
                                  key={st.id}
                                  className={`flex-1 flex items-center justify-center text-[9px] font-bold border-r border-white/40 transition-colors ${
                                    isCompleted
                                      ? 'bg-emerald-600 text-white'
                                      : isCurrent
                                      ? 'bg-amber-500 text-white animate-pulse'
                                      : 'bg-slate-200 text-slate-400'
                                  }`}
                                  title={`Phase ${st.label}: ${
                                    isCompleted ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'
                                  }`}
                                >
                                  <span className="truncate px-0.5">{idx + 1}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Individual Job Dispositions Timelines */}
                        {projectDispositions.map((disp) => {
                          const taskStart = getPixelOffset(disp.assignedDate || project.startDate);
                          const taskEnd = getPixelOffset(disp.dueDate);
                          const taskW = Math.max(zoomLevel * 3, taskEnd - taskStart);

                          return (
                            <div key={disp.id} className="h-6 relative flex items-center">
                              <div
                                className="absolute h-5 rounded-md px-2 flex items-center justify-between text-[9px] font-semibold shadow-2xs border transition-all hover:scale-[1.01]"
                                style={{
                                  left: `${taskStart}px`,
                                  width: `${taskW}px`,
                                  backgroundColor:
                                    disp.status === 'COMPLETED'
                                      ? '#ecfdf5'
                                      : disp.priority === 'URGENT'
                                      ? '#fff1f2'
                                      : '#f8fafc',
                                  borderColor:
                                    disp.status === 'COMPLETED'
                                      ? '#a7f3d0'
                                      : disp.priority === 'URGENT'
                                      ? '#fecdd3'
                                      : '#e2e8f0',
                                }}
                              >
                                <span className="text-slate-800 truncate font-medium">
                                  {disp.title}
                                </span>
                                <span className="font-mono text-slate-500 ml-1 whitespace-nowrap">
                                  {disp.assignedToName.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Card */}
      {activeTooltip && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700 w-72 pointer-events-none text-xs animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-emerald-400 truncate">{activeTooltip.title}</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {activeTooltip.date}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <p className="font-semibold text-white">{activeTooltip.subtitle}</p>
            {activeTooltip.assignee && (
              <p className="text-slate-400">
                Lead: <span className="text-slate-200">{activeTooltip.assignee}</span>
              </p>
            )}
            {activeTooltip.status && (
              <p className="text-slate-400">
                Status:{' '}
                <span className="text-emerald-300 font-semibold">{activeTooltip.status}</span>
              </p>
            )}
            {activeTooltip.details && (
              <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 mt-1">
                {activeTooltip.details}
              </p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}

      {/* Bottom Timeline Legend */}
      <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
            Legend:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>On Track</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>At Risk / Gap Flagged</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Delayed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>🚩 Kickoff</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-bold">
              🔍 Audit
            </span>
            <span>LVI Field Audit</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600 text-white text-[9px]" />
            <span>📌 Task Due Date</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-slate-800" />
            <span>🎯 Target Completion</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500" />
            <span className="text-emerald-700 font-bold">Today Line</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Click any project row or milestone pin to inspect full compliance file
        </div>
      </div>
    </div>
  );
};
