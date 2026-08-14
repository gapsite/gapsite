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
  const { filters, setFilters, resetFilters, teamMembers, filteredProjects, projects } = useProjects();

  const serviceCategories: { label: string; value: ServiceType | 'ALL'; count?: number }[] = [
    { label: 'All Services', value: 'ALL' },
    { label: 'TKDN Barang', value: 'TKDN_BARANG' },
    { label: 'TKDN Jasa', value: 'TKDN_JASA' },
    { label: 'BMP Corporate', value: 'BMP_COMPANY' },
    { label: 'OSS-RBA / PB-UMKU', value: 'OSS_RBA_NIB' },
    { label: 'SNI & AMDAL', value: 'SNI_CERTIFICATION' },
  ];

  const stages: { label: string; value: ProjectStage | 'ALL' }[] = [
    { label: 'All Stages', value: 'ALL' },
    { label: '1. Inquiry & Scoping', value: 'INQUIRY' },
    { label: '2. Gap Analysis', value: 'GAP_ANALYSIS' },
    { label: '3. BOM & Doc Prep', value: 'DOC_PREPARATION' },
    { label: '4. Field Verification (Surveyor)', value: 'FIELD_VERIFICATION' },
    { label: '5. SIINas Kemenperin Review', value: 'MINISTRY_REVIEW' },
    { label: '6. Certificate Issued', value: 'CERTIFICATE_ISSUED' },
  ];

  const surveyors: (SurveyorBody | 'ALL')[] = [
    'ALL',
    'PT Sucofindo',
    'PT Surveyor Indonesia',
    'PT Superintending Company',
    'Kemenperin SIINas Direct',
  ];

  const statuses: { label: string; value: ProjectStatus | 'ALL' }[] = [
    { label: 'All Health Status', value: 'ALL' },
    { label: 'On Track', value: 'ON_TRACK' },
    { label: 'At Risk / Gap Flagged', value: 'AT_RISK' },
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

      {/* Bottom Dropdowns Row: Stage, Surveyor, Status, Consultant, Priority */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 items-center">
        {/* Stage Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Stage
          </label>
          <select
            value={filters.stage}
            onChange={(e) => setFilters((prev) => ({ ...prev, stage: e.target.value as ProjectStage | 'ALL' }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {stages.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Surveyor Body Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Surveyor Body
          </label>
          <select
            value={filters.surveyor}
            onChange={(e) => setFilters((prev) => ({ ...prev, surveyor: e.target.value as SurveyorBody | 'ALL' }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Surveyors</option>
            <option value="PT Sucofindo">PT Sucofindo</option>
            <option value="PT Surveyor Indonesia">PT Surveyor Indonesia</option>
            <option value="PT Superintending Company">PT Superintending Company</option>
            <option value="Kemenperin SIINas Direct">Kemenperin SIINas Direct</option>
          </select>
        </div>

        {/* Health Status Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Health / Risk
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as ProjectStatus | 'ALL' }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {statuses.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Consultant Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Lead Consultant
          </label>
          <select
            value={filters.leadConsultantId}
            onChange={(e) => setFilters((prev) => ({ ...prev, leadConsultantId: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
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
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value as Priority | 'ALL' }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              hasActiveFilters
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
