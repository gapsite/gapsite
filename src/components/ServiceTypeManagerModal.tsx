import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  Check,
  Tag,
  Info,
  Scale,
  FolderPlus,
  Archive,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { ConsultingServiceConfig, SurveyorBody } from '../types';
import { SERVICE_CATEGORIES, SERVICE_COLOR_THEMES } from '../data/serviceTypesData';
import { formatCurrencyIDR } from '../utils/formatters';

interface ServiceTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceTypeManagerModal: React.FC<ServiceTypeManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    consultingServices,
    addConsultingService,
    updateConsultingService,
    deleteConsultingService,
    toggleConsultingServiceStatus,
    resetConsultingServicesToDefault,
    isMasterAdmin,
    currentUser,
    projects,
  } = useProjects();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState(SERVICE_CATEGORIES[0]);
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRegulatoryBasis, setFormRegulatoryBasis] = useState('');
  const [formSurveyor, setFormSurveyor] = useState('PT Sucofindo (Persero)');
  const [formDurationDays, setFormDurationDays] = useState<number>(30);
  const [formBasePriceIDR, setFormBasePriceIDR] = useState<number>(50000000);
  const [formBadgeColor, setFormBadgeColor] = useState(SERVICE_COLOR_THEMES[0].value);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Delete & Reassign State
  const [deletingService, setDeletingService] = useState<ConsultingServiceConfig | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return consultingServices.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchShort = s.shortName.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        const matchCat = s.category.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchReg = (s.regulatoryBasis || '').toLowerCase().includes(q);
        const matchSurveyor = (s.defaultSurveyor || '').toLowerCase().includes(q);
        if (!matchName && !matchShort && !matchCode && !matchCat && !matchDesc && !matchReg && !matchSurveyor) {
          return false;
        }
      }
      return true;
    });
  }, [consultingServices, statusFilter, categoryFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalServices = consultingServices.length;
    const activeServices = consultingServices.filter((s) => s.status === 'ACTIVE').length;
    const inactiveServices = totalServices - activeServices;

    // Count linked projects & portfolio value
    let linkedProjectsCount = 0;
    let totalPortfolioValue = 0;

    projects.forEach((p) => {
      const isKnown = consultingServices.some((s) => s.id === p.serviceType);
      if (isKnown) {
        linkedProjectsCount++;
        totalPortfolioValue += p.contractValueIDR || 0;
      }
    });

    return {
      totalServices,
      activeServices,
      inactiveServices,
      linkedProjectsCount,
      totalPortfolioValue,
    };
  }, [consultingServices, projects]);

  // Get project count for a single service
  const getProjectCountForService = (serviceId: string) => {
    return projects.filter((p) => p.serviceType === serviceId).length;
  };

  // Open Form for Adding New
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setFormName('');
    setFormShortName('');
    setFormCode('');
    setFormCategory(SERVICE_CATEGORIES[0]);
    setFormCustomCategory('');
    setFormDescription('');
    setFormRegulatoryBasis('');
    setFormSurveyor('PT Sucofindo (Persero)');
    setFormDurationDays(30);
    setFormBasePriceIDR(50000000);
    setFormBadgeColor(SERVICE_COLOR_THEMES[0].value);
    setFormStatus('ACTIVE');
    setIsFormModalOpen(true);
    setFeedbackMsg(null);
  };

  // Open Form for Editing Existing
  const handleOpenEditModal = (service: ConsultingServiceConfig) => {
    setEditingServiceId(service.id);
    setFormName(service.name);
    setFormShortName(service.shortName);
    setFormCode(service.code);
    
    if (SERVICE_CATEGORIES.includes(service.category)) {
      setFormCategory(service.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('OTHER');
      setFormCustomCategory(service.category);
    }

    setFormDescription(service.description);
    setFormRegulatoryBasis(service.regulatoryBasis || '');
    setFormSurveyor(service.defaultSurveyor || 'PT Sucofindo (Persero)');
    setFormDurationDays(service.typicalDurationDays || 30);
    setFormBasePriceIDR(service.basePriceIDR || 50000000);
    setFormBadgeColor(service.badgeColor || SERVICE_COLOR_THEMES[0].value);
    setFormStatus(service.status);
    setIsFormModalOpen(true);
    setFeedbackMsg(null);
  };

  // Save Service (Create or Update)
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isMasterAdmin) {
      setFeedbackMsg({
        type: 'error',
        text: 'Only Master Admin (admin.master) has authority to save service changes.',
      });
      return;
    }

    if (!formName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Service name cannot be empty.' });
      return;
    }

    const finalCategory =
      formCategory === 'OTHER' ? formCustomCategory.trim() || 'Custom Advisory Service' : formCategory;

    if (editingServiceId) {
      // Update
      const res = updateConsultingService(editingServiceId, {
        name: formName.trim(),
        shortName: formShortName.trim() || formName.trim(),
        code: formCode.trim().toUpperCase(),
        category: finalCategory,
        description: formDescription.trim(),
        regulatoryBasis: formRegulatoryBasis.trim(),
        defaultSurveyor: formSurveyor,
        typicalDurationDays: Number(formDurationDays) || 30,
        basePriceIDR: Number(formBasePriceIDR) || 50000000,
        badgeColor: formBadgeColor,
        status: formStatus,
      });

      if (res.success) {
        setIsFormModalOpen(false);
        setFeedbackMsg({ type: 'success', text: res.message || 'Service updated successfully.' });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to update service.' });
      }
    } else {
      // Create
      const res = addConsultingService({
        id: formCode.trim().toUpperCase(),
        name: formName.trim(),
        shortName: formShortName.trim() || formName.trim(),
        code: formCode.trim().toUpperCase(),
        category: finalCategory,
        description: formDescription.trim(),
        regulatoryBasis: formRegulatoryBasis.trim(),
        defaultSurveyor: formSurveyor,
        typicalDurationDays: Number(formDurationDays) || 30,
        basePriceIDR: Number(formBasePriceIDR) || 50000000,
        badgeColor: formBadgeColor,
        status: formStatus,
      });

      if (res.success) {
        setIsFormModalOpen(false);
        setFeedbackMsg({ type: 'success', text: res.message || 'New consulting service added.' });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to create service.' });
      }
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deletingService) return;

    const res = deleteConsultingService(deletingService.id, reassignTargetId || undefined);
    setDeletingService(null);
    setReassignTargetId('');

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Service removed.' });
    } else {
      setFeedbackMsg({ type: 'error', text: res.message || 'Failed to delete service.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Consulting Services Catalog & Statutory Offerings
                </h2>
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  admin.master Authority
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Admin Authority Banner / Warning */}
        {!isMasterAdmin ? (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> You are signed in as <em>{currentUser.name}</em>. Only authenticated <strong>admin.master</strong> accounts can add, edit, or decommission service offerings.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 rounded-full">
              Modification Protected
            </span>
          </div>
        ) : (
          <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-300 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Master Admin Authority Active:</strong> You have full statutory authority to modify, create, and decommission consulting service offerings.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              Adryan kelvianto (admin.master)
            </span>
          </div>
        )}

        {/* Feedback Message Notification */}
        {feedbackMsg && (
          <div
            className={`px-5 py-2 text-xs font-medium flex items-center justify-between border-b shrink-0 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Offerings
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {metrics.totalServices}
              </span>
              <span className="text-[11px] text-slate-500">Service Types</span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Active Catalog
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {metrics.activeServices}
              </span>
              <span className="text-[11px] text-slate-500">Available</span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Client Projects
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {metrics.linkedProjectsCount}
              </span>
              <span className="text-[11px] text-slate-500">Tied Projects</span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              Portfolio Value
            </span>
            <div className="flex items-baseline gap-1 mt-1 truncate">
              <span className="text-base font-black text-purple-700 dark:text-purple-300 font-mono truncate">
                {formatCurrencyIDR(metrics.totalPortfolioValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, laws, surveyors..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 font-medium"
            >
              <option value="ALL">All Categories</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive / Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {isMasterAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to reset the consulting service catalog to factory defaults? Any custom added services will be replaced.'
                    )
                  ) {
                    const res = resetConsultingServicesToDefault();
                    setFeedbackMsg({ type: 'success', text: res.message || 'Catalog reset.' });
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                title="Reset to statutory default catalog"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
            )}

            <button
              type="button"
              disabled={!isMasterAdmin}
              onClick={handleOpenAddModal}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                isMasterAdmin
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Consulting Service</span>
            </button>
          </div>
        </div>

        {/* Services Cards List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {filteredServices.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No consulting services found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No services matched your search or category filters. Try resetting the filters or add a new service type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredServices.map((service) => {
                const projectCount = getProjectCountForService(service.id);
                const isActive = service.status === 'ACTIVE';

                return (
                  <div
                    key={service.id}
                    className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    {/* Top Row: Code, Name, Status */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border font-mono ${service.badgeColor}`}
                          >
                            {service.code || service.id}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {service.category}
                          </span>
                          {service.isDefault && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                              Core Statutory
                            </span>
                          )}
                        </div>

                        {/* Status badge & toggle */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMasterAdmin ? (
                            <button
                              type="button"
                              onClick={() => toggleConsultingServiceStatus(service.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                              }`}
                              title="Click to toggle Active / Inactive"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                            </button>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Service Title */}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {service.name}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Key Attributes Meta */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Regulatory Basis
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate block" title={service.regulatoryBasis}>
                            {service.regulatoryBasis || 'Statutory Regulation'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Accredited Surveyor
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                            {service.defaultSurveyor || 'Accredited Verifier'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Estimated SLA
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {service.typicalDurationDays || 30} Business Days
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Standard Base Fee
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatCurrencyIDR(service.basePriceIDR || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          <strong>{projectCount}</strong> client project(s)
                        </span>
                      </div>

                      {isMasterAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(service)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Service Type"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeletingService(service);
                              setReassignTargetId('');
                            }}
                            className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Delete / Archive Service Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              All modifications are automatically reflected in Project Creation, Filters, Milestones, and Invoicing.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close Manager
          </button>
        </div>
      </div>

      {/* -------------------- ADD / EDIT SERVICE SUB-MODAL -------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  {editingServiceId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingServiceId ? 'Edit Consulting Service Offering' : 'Add New Consulting Service Type'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingServiceId
                      ? 'Update statutory metadata, pricing baselines, and legal regulations.'
                      : 'Create a new consulting offering recognized across the system.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Service Full Name & Short Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Full Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sertifikasi TKDN Manufaktur Mesin & Elektronika"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Short Badge Label
                  </label>
                  <input
                    type="text"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                    placeholder="e.g. TKDN Mesin"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              {/* Code / Acronym & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Service Code / Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingServiceId}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TKDN-MESIN or GREEN-IND"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-mono font-bold uppercase disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {editingServiceId ? 'Identifier is locked to prevent foreign key mismatch.' : 'Unique uppercase alphanumeric code.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Industry / Domain Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-medium"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="OTHER">+ Custom Category Name...</option>
                  </select>

                  {formCategory === 'OTHER' && (
                    <input
                      type="text"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="Enter custom category name"
                      className="w-full mt-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5"
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Scope of Work & Service Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed explanation of audit methodology, document preparation, and client deliverables..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Regulatory Basis & Default Surveyor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Regulatory Basis / Statutory Clause
                  </label>
                  <input
                    type="text"
                    value={formRegulatoryBasis}
                    onChange={(e) => setFormRegulatoryBasis(e.target.value)}
                    placeholder="e.g. Permenperin No. 16/2011, PP No. 5/2021"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Accredited Verifier / Surveyor Body
                  </label>
                  <input
                    type="text"
                    value={formSurveyor}
                    onChange={(e) => setFormSurveyor(e.target.value)}
                    placeholder="e.g. PT Sucofindo (Persero)"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              {/* Duration, Price, Badge Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Standard Fee (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={formBasePriceIDR}
                    onChange={(e) => setFormBasePriceIDR(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-mono font-bold"
                  />
                  <span className="text-[10px] font-mono text-emerald-600 block mt-1">
                    {formatCurrencyIDR(formBasePriceIDR || 0)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Badge Color Theme
                  </label>
                  <select
                    value={formBadgeColor}
                    onChange={(e) => setFormBadgeColor(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 font-medium"
                  >
                    {SERVICE_COLOR_THEMES.map((theme) => (
                      <option key={theme.value} value={theme.value}>
                        {theme.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Preview:</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${formBadgeColor}`}>
                      {formCode || 'SAMPLE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Service Catalog Status
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Active services appear in the New Project dropdown and Filter tabs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('ACTIVE')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      formStatus === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    ACTIVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('INACTIVE')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      formStatus === 'INACTIVE'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    INACTIVE
                  </button>
                </div>
              </div>

              {/* Sub-modal Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingServiceId ? 'Save Changes' : 'Create Service Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- DELETE / ARCHIVE CONFIRMATION SUB-MODAL -------------------- */}
      {deletingService && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove or Archive Service Type?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You are about to remove <strong>{deletingService.name}</strong> ({deletingService.code}).
                </p>
              </div>
            </div>

            {getProjectCountForService(deletingService.id) > 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-2 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Warning: {getProjectCountForService(deletingService.id)} client project(s) are linked to this service!
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  To protect historical audit trails and TKDN calculations, you can either reassign these projects to another service, or archive this service as INACTIVE.
                </p>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-100 mb-1">
                    Reassign Projects to:
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Do not reassign (Archive as INACTIVE instead) --</option>
                    {consultingServices
                      .filter((s) => s.id !== deletingService.id && s.status === 'ACTIVE')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                No active projects are linked to this service. It will be permanently removed from the master catalog.
              </p>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingService(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {getProjectCountForService(deletingService.id) > 0 && !reassignTargetId
                    ? 'Archive as Inactive'
                    : 'Confirm Removal'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
