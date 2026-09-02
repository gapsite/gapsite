import React from 'react';
import {
  Filter,
  RotateCcw,
  LayoutGrid,
  List,
  Building2,
  Layers,
  CalendarRange,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { ServiceType, ProjectStage, ProjectStatus, Priority, SurveyorBody } from '../types';

interface FilterBarProps {
  viewMode: 'table' | 'kanban' | 'gantt';
  setViewMode: (mode: 'table' | 'kanban' | 'gantt') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ viewMode, setViewMode }) => {
  const {
    filters,
    setFilters,
    resetFilters,
    teamMembers,
    filteredProjects,
    projects,
    activeConsultingServices,
  } = useProjects();

  const serviceCategories = React.useMemo(() => {
    const list: { label: string; value: ServiceType | 'ALL'; count?: number }[] = [
      { label: 'All Services', value: 'ALL' },
    ];
    activeConsultingServices.forEach((svc) => {
      list.push({
        label: svc.shortName || svc.name,
        value: svc.id,
      });
    });
    return list;
  }, [activeConsultingServices]);

  const stages: { label: string; value: ProjectStage | 'ALL' }[] = [
    { label: 'All Stages', value: 'ALL' },
    { label: '1. Inquiry & KBLI Screening', value: 'INQUIRY' },
    { label: '2. Gap Analysis & Cost Plan', value: 'GAP_ANALYSIS' },
    { label: '3. SIINas & BOM Compilation', value: 'DOC_PREPARATION' },
    { label: '4. Surveyor Verification (LVI)', value: 'FIELD_VERIFICATION' },
    { label: '5. Ministry Review & Panel', value: 'MINISTRY_REVIEW' },
    { label: '6. Official Certificate Issued', value: 'CERTIFICATE_ISSUED' },
  ];

  const surveyors: (SurveyorBody | 'ALL')[] = [
    'ALL',
    'PT Surveyor Indonesia',
    'PT Sucofindo (Persero)',
    'PT Biro Klasifikasi Indonesia',
    'PT Anindya Wiraputra Consult',
    'Badan Standarisasi dan Kebijakan Jasa Industri',
  ];

  const statuses: { label: string; value: ProjectStatus | 'ALL' }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'On Track', value: 'ON_TRACK' },
    { label: 'At Risk', value: 'AT_RISK' },
    { label: 'Delayed', value: 'DELAYED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const priorities: (Priority | 'ALL')[] = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.serviceType !== 'ALL' ||
    filters.stage !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.surveyor !== 'ALL' ||
    filters.leadConsultantId !== 'ALL';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-5 space-y-3.5">
      {/* Top Filter Row: Service Types & View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Service Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Category:
          </span>
          {serviceCategories.map((cat) => {
            const isSelected = filters.serviceType === cat.value;
            const count =
              cat.value === 'ALL'
                ? projects.length
                : projects.filter((p) => p.serviceType === cat.value).length;

            return (
              <button
                key={cat.value}
                onClick={() => setFilters((prev) => ({ ...prev, serviceType: cat.value }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Switcher (Table vs Kanban) */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-slate-600">
            Showing <strong className="text-slate-900 font-bold">{filteredProjects.length}</strong> of{' '}
            {projects.length}
          </div>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table Grid View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Pipeline Stage Kanban View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'gantt' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gantt Timeline & Milestones View"
            >
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Gantt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Dropdowns Row: Stage, Surveyor, Status, Consultant, Priority, Reset */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 items-end">
        {/* Stage Filter */}
        <div className="flex flex-col">
          <label htmlFor="filter-stage-select" className="block text-center text-xs font-bold uppercase text-slate-800 mb-1 tracking-wide truncate">
            Stage
          </label>
          <select
            id="filter-stage-select"
            name="stage"
            value={filters.stage}
            onChange={(e) => setFilters((prev) => ({ ...prev, stage: e.target.value as ProjectStage | 'ALL' }))}
            className="w-full h-8 text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            {stages.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* LVI Filter */}
        <div className="flex flex-col">
          <label htmlFor="filter-surveyor-select" className="block text-center text-xs font-bold uppercase text-slate-800 mb-1 tracking-wide truncate">
            Surveyor (LVI)
          </label>
          <select
            id="filter-surveyor-select"
            name="surveyor"
            value={filters.surveyor}
            onChange={(e) => setFilters((prev) => ({ ...prev, surveyor: e.target.value as SurveyorBody | 'ALL' }))}
            className="w-full h-8 text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="ALL">All LVI</option>
            <option value="PT Surveyor Indonesia">1. PT Surveyor Indonesia</option>
            <option value="PT Sucofindo (Persero)">2. PT Sucofindo (Persero)</option>
            <option value="PT Biro Klasifikasi Indonesia">3. PT Biro Klasifikasi Indonesia</option>
            <option value="PT Anindya Wiraputra Consult">4. PT Anindya Wiraputra Consult</option>
            <option value="Badan Standarisasi dan Kebijakan Jasa Industri">5. Badan Standarisasi dan Kebijakan Jasa Industri</option>
          </select>
        </div>

        {/* Health Status Filter */}
        <div className="flex flex-col">
          <label htmlFor="filter-status-select" className="block text-center text-xs font-bold uppercase text-slate-800 mb-1 tracking-wide truncate">
            Risk & Health
          </label>
          <select
            id="filter-status-select"
            name="status"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as ProjectStatus | 'ALL' }))}
            className="w-full h-8 text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            {statuses.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Consultant Filter */}
        <div className="flex flex-col">
          <label htmlFor="filter-consultant-select" className="block text-center text-xs font-bold uppercase text-slate-800 mb-1 tracking-wide truncate">
            Lead Consultant
          </label>
          <select
            id="filter-consultant-select"
            name="leadConsultant"
            value={filters.leadConsultantId}
            onChange={(e) => setFilters((prev) => ({ ...prev, leadConsultantId: e.target.value }))}
            className="w-full h-8 text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="ALL">All Consultants</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name.split(',')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col">
          <label htmlFor="filter-priority-select" className="block text-center text-xs font-bold uppercase text-slate-800 mb-1 tracking-wide truncate">
            Priority
          </label>
          <select
            id="filter-priority-select"
            name="priority"
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value as Priority | 'ALL' }))}
            className="w-full h-8 text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="flex flex-col">
          <label htmlFor="btn-reset-filters" className="block text-center text-xs font-bold uppercase text-slate-800 mb-1 tracking-wide truncate">
            Reset
          </label>
          <button
            id="btn-reset-filters"
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            aria-label="Reset all search and dropdown filters"
            className={`w-full h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              hasActiveFilters
                ? 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 cursor-pointer font-bold'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
