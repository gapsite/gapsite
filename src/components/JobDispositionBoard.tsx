import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Building,
  MoreVertical,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  JobDisposition,
  DispositionStatus,
  DispositionCategory,
  Priority,
} from '../types';
import { getDispositionStatusBadge } from '../utils/formatters';

interface JobDispositionBoardProps {
  onOpenNewDisposition: () => void;
  onEditDisposition: (disposition: JobDisposition) => void;
}

const STATUS_COLUMNS: {
  key: DispositionStatus;
  label: string;
  subtitle: string;
  borderColor: string;
  bgHeader: string;
}[] = [
  {
    key: 'PENDING',
    label: 'Pending Assignment',
    subtitle: 'Menunggu Alokasi / Antrean',
    borderColor: 'border-t-slate-400',
    bgHeader: 'bg-slate-50',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    subtitle: 'Sedang Dikerjakan Spesialis',
    borderColor: 'border-t-blue-500',
    bgHeader: 'bg-blue-50/40',
  },
  {
    key: 'AWAITING_CLIENT',
    label: 'Awaiting Client',
    subtitle: 'Menunggu Kelengkapan Klien',
    borderColor: 'border-t-amber-500',
    bgHeader: 'bg-amber-50/40',
  },
  {
    key: 'UNDER_REVIEW',
    label: 'Under Review',
    subtitle: 'Review & QA Lead Consultant',
    borderColor: 'border-t-purple-500',
    bgHeader: 'bg-purple-50/40',
  },
  {
    key: 'REVISION_NEEDED',
    label: 'Needs Revision',
    subtitle: 'Perlu Perbaikan Dokumen/BOM',
    borderColor: 'border-t-rose-500',
    bgHeader: 'bg-rose-50/40',
  },
  {
    key: 'COMPLETED',
    label: 'Done / Approved',
    subtitle: 'Selesai & Terverifikasi',
    borderColor: 'border-t-emerald-500',
    bgHeader: 'bg-emerald-50/40',
  },
];

const CATEGORY_LABELS: Record<DispositionCategory, string> = {
  DOC_COLLECTION: 'Dokumen & KBLI',
  TKDN_CALCULATION: 'Kalkulasi TKDN/BOM',
  FIELD_AUDIT_PREP: 'Persiapan Audit LVI',
  REGULATORY_SUBMISSION: 'Submit SIINas Kemenperin',
  LEGAL_COMPLIANCE: 'Legalitas & NIB/OSS',
  CLIENT_CONSULTATION: 'Konsultasi Klien',
};

export const JobDispositionBoard: React.FC<JobDispositionBoardProps> = ({
  onOpenNewDisposition,
  onEditDisposition,
}) => {
  const {
    dispositions,
    projects,
    teamMembers,
    updateDisposition,
    deleteDisposition,
    toggleChecklistItem,
    isMasterAdmin,
  } = useProjects();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filtered dispositions
  const filteredDispositions = useMemo(() => {
    return dispositions.filter((disp) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (disp.title || '').toLowerCase().includes(query);
        const matchProject = (disp.projectName || '').toLowerCase().includes(query);
        const matchClient = (disp.clientName || '').toLowerCase().includes(query);
        const matchAssignee = (disp.assignedToName || '').toLowerCase().includes(query);
        const matchCode = (disp.projectCode || '').toLowerCase().includes(query);
        const matchInstructions = (disp.instructions || '').toLowerCase().includes(query);

        if (!matchTitle && !matchProject && !matchClient && !matchAssignee && !matchCode && !matchInstructions) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'ALL' && disp.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && disp.priority !== selectedPriority) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'ALL' && disp.assignedToId !== selectedAssignee) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && disp.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [dispositions, searchQuery, selectedStatus, selectedPriority, selectedAssignee, selectedCategory]);

  // Key metrics
  const totalCount = dispositions.length;
  const pendingCount = dispositions.filter((d) => d.status === 'PENDING').length;
  const inProgressCount = dispositions.filter(
    (d) => d.status === 'IN_PROGRESS' || d.status === 'UNDER_REVIEW' || d.status === 'AWAITING_CLIENT' || d.status === 'REVISION_NEEDED'
  ).length;
  const completedCount = dispositions.filter((d) => d.status === 'COMPLETED').length;
  const overdueCount = dispositions.filter(
    (d) => d.status !== 'COMPLETED' && d.dueDate && d.dueDate < todayStr
  ).length;
  const urgentCount = dispositions.filter((d) => d.priority === 'URGENT' && d.status !== 'COMPLETED').length;

  const toggleChecklistOpen = (id: string) => {
    setExpandedChecklists((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = (disp: JobDisposition, newStatus: DispositionStatus) => {
    updateDisposition(disp.id, { status: newStatus });
  };

  const handleDelete = (id: string, title: string) => {
    if (!isMasterAdmin) {
      alert('Hanya Master Admin yang memiliki otorisasi untuk menghapus disposisi tugas.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus disposisi tugas "${title}"?`)) {
      deleteDisposition(id);
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Flame className="w-2.5 h-2.5 text-rose-600" />
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tugas</span>
            <CheckSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semua Disposisi</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-700 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Antrean Alokasi</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Aktif</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">{inProgressCount}</div>
          <div className="text-[10px] text-blue-500/80 mt-0.5">Sedang Berjalan</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{completedCount}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Approved & Done</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">{overdueCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Melewati Tenggat</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Urgent SLA</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{urgentCount}</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Prioritas Tinggi</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas, proyek, klien, PIC, instruksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Daftar Tabel
              </button>
            </div>

            {/* Create New Disposition */}
            <button
              type="button"
              onClick={onOpenNewDisposition}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Buat Disposisi Tugas
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter status tugas"
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            {STATUS_COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label="Filter prioritas tugas"
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            aria-label="Filter spesialis penanggung jawab"
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Spesialis / PIC</option>
            {teamMembers.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name} ({tm.role})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter kategori disposisi"
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kategori</option>
            {(Object.keys(CATEGORY_LABELS) as DispositionCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {(selectedStatus !== 'ALL' ||
            selectedPriority !== 'ALL' ||
            selectedAssignee !== 'ALL' ||
            selectedCategory !== 'ALL' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedPriority('ALL');
                setSelectedAssignee('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="text-slate-500 hover:text-slate-800 text-[11px] underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Board View: KANBAN */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {STATUS_COLUMNS.map((col) => {
            const columnDispositions = filteredDispositions.filter((d) => d.status === col.key);

            return (
              <div
                key={col.key}
                className={`rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs flex flex-col min-h-[560px] border-t-4 ${col.borderColor}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {col.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{col.subtitle}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
                    {columnDispositions.length}
                  </span>
                </div>

                {/* Column Content Cards */}
                <div className="space-y-3 flex-1">
                  {columnDispositions.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 rounded-lg text-slate-400">
                      <p className="text-[11px]">Tidak ada tugas</p>
                    </div>
                  ) : (
                    columnDispositions.map((disp) => {
                      const isOverdue = disp.status !== 'COMPLETED' && disp.dueDate && disp.dueDate < todayStr;
                      const checklistTotal = disp.checklist?.length || 0;
                      const checklistDone = disp.checklist?.filter((c) => c.done).length || 0;
                      const isChecklistOpen = expandedChecklists[disp.id] ?? false;

                      return (
                        <div
                          key={disp.id}
                          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:shadow-md transition-all space-y-2.5"
                        >
                          {/* Top Card Row: Category + Priority */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              {CATEGORY_LABELS[disp.category] || disp.category}
                            </span>
                            {getPriorityBadge(disp.priority)}
                          </div>

                          {/* Task Title */}
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 leading-snug hover:text-emerald-700 transition-colors line-clamp-2">
                              {disp.title}
                            </h5>
                          </div>

                          {/* Associated Project / Client */}
                          <div className="text-[11px] text-slate-500 space-y-0.5 border-l-2 border-slate-200 pl-2">
                            <div className="font-semibold text-slate-700 truncate">{disp.projectName}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {disp.clientName} ({disp.projectCode})
                            </div>
                          </div>

                          {/* Instructions Preview */}
                          {disp.instructions && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                              "{disp.instructions}"
                            </p>
                          )}

                          {/* Checklist Section */}
                          {checklistTotal > 0 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => toggleChecklistOpen(disp.id)}
                                className="w-full flex items-center justify-between text-[10px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 transition-colors"
                              >
                                <span className="flex items-center gap-1.5">
                                  <CheckSquare className="w-3 h-3 text-emerald-600" />
                                  Checklist ({checklistDone}/{checklistTotal})
                                </span>
                                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                  {Math.round((checklistDone / checklistTotal) * 100)}%
                                </span>
                              </button>

                              {isChecklistOpen && (
                                <div className="mt-1.5 space-y-1 bg-slate-50/70 p-2 rounded-lg border border-slate-200 max-h-40 overflow-y-auto">
                                  {disp.checklist.map((item) => (
                                    <label
                                      key={item.id}
                                      className="flex items-start gap-2 text-[11px] text-slate-700 cursor-pointer hover:bg-white p-1 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={item.done}
                                        onChange={() => toggleChecklistItem(disp.id, item.id)}
                                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span className={item.done ? 'line-through text-slate-400' : ''}>
                                        {item.text}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Due Date & Assignee Footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            {/* Assignee */}
                            <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                              {disp.assignedToAvatar ? (
                                <img
                                  src={disp.assignedToAvatar}
                                  alt={disp.assignedToName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700 shrink-0">
                                  {disp.assignedToName?.slice(0, 1) || 'U'}
                                </div>
                              )}
                              <span className="text-slate-700 font-medium truncate">
                                {disp.assignedToName}
                              </span>
                            </div>

                            {/* Due Date */}
                            <div
                              className={`flex items-center gap-1 text-[10px] font-medium ${
                                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{disp.dueDate || 'No date'}</span>
                            </div>
                          </div>

                          {/* Quick Status Dropdown & Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <select
                              value={disp.status}
                              onChange={(e) =>
                                handleStatusChange(disp, e.target.value as DispositionStatus)
                              }
                              aria-label="Ubah status penugasan"
                              className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            >
                              {STATUS_COLUMNS.map((sc) => (
                                <option key={sc.key} value={sc.key}>
                                  {sc.label}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditDisposition(disp)}
                                title="Edit Disposisi"
                                className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {isMasterAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(disp.id, disp.title)}
                                  title="Hapus Disposisi"
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Main Board View: TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Tugas & Kategori</th>
                  <th className="py-3 px-4">Proyek & Klien</th>
                  <th className="py-3 px-4">Penanggung Jawab (PIC)</th>
                  <th className="py-3 px-4">Prioritas</th>
                  <th className="py-3 px-4">Tenggat Waktu</th>
                  <th className="py-3 px-4">Checklist</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDispositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada disposisi tugas yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredDispositions.map((disp) => {
                    const isOverdue = disp.status !== 'COMPLETED' && disp.dueDate && disp.dueDate < todayStr;
                    const statusBadge = getDispositionStatusBadge(disp.status);
                    const checklistTotal = disp.checklist?.length || 0;
                    const checklistDone = disp.checklist?.filter((c) => c.done).length || 0;

                    return (
                      <tr key={disp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 leading-snug">{disp.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {CATEGORY_LABELS[disp.category] || disp.category}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="font-semibold text-slate-800 truncate">{disp.projectName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{disp.clientName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {disp.assignedToAvatar ? (
                              <img
                                src={disp.assignedToAvatar}
                                alt={disp.assignedToName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                {disp.assignedToName?.slice(0, 1) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-800">{disp.assignedToName}</div>
                              <div className="text-[10px] text-slate-400">{disp.assignedToRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(disp.priority)}</td>
                        <td className="py-3 px-4">
                          <div
                            className={`flex items-center gap-1 font-mono text-[11px] ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {disp.dueDate || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {checklistTotal > 0 ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-slate-700 font-semibold">
                                {checklistDone}/{checklistTotal}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({Math.round((checklistDone / checklistTotal) * 100)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={disp.status}
                            onChange={(e) =>
                              handleStatusChange(disp, e.target.value as DispositionStatus)
                            }
                            aria-label={`Ubah status penugasan ${disp.title}`}
                            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          >
                            {STATUS_COLUMNS.map((sc) => (
                              <option key={sc.key} value={sc.key}>
                                {sc.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditDisposition(disp)}
                              title="Edit Detail Disposisi"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isMasterAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDelete(disp.id, disp.title)}
                                title="Hapus Disposisi"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
