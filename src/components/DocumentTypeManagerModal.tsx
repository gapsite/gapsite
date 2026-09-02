import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  RotateCcw,
  Tag,
  Check,
  X,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  FolderPlus,
  Palette,
  Sliders,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  DocumentTypeDefinition,
  DocumentCategoryGroup,
  DocumentCategoryDefinition,
  DocumentCategory,
} from '../types';
import {
  DOCUMENT_COLOR_THEMES,
} from '../data/documentTypesData';

interface DocumentTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentTypeManagerModal: React.FC<DocumentTypeManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    documentTypes,
    addDocumentType,
    updateDocumentType,
    deleteDocumentType,
    toggleDocumentTypeStatus,
    resetDocumentTypesToDefault,
    documentCategories,
    activeDocumentCategories,
    addDocumentCategory,
    updateDocumentCategory,
    deleteDocumentCategory,
    toggleDocumentCategoryStatus,
    resetDocumentCategoriesToDefault,
    consultingServices,
    isMasterAdmin,
    currentUser,
    projects,
  } = useProjects();

  // Top Tabs
  const [activeTab, setActiveTab] = useState<'DOCUMENT_TYPES' | 'CATEGORIES_MASTER'>('DOCUMENT_TYPES');

  // Search & Filters for Document Types
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Search & Filters for Categories Tab
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Document Type Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDocTypeId, setEditingDocTypeId] = useState<string | null>(null);

  // Document Type Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategoryGroup>('TECHNICAL_DOSSIER');
  const [formDescription, setFormDescription] = useState('');
  const [formBadgeColor, setFormBadgeColor] = useState(DOCUMENT_COLOR_THEMES[0].value);
  const [formAcceptedTypes, setFormAcceptedTypes] = useState<string>('.pdf, .xlsx, .docx, .jpg, .png');
  const [formIsAutoCompleting, setFormIsAutoCompleting] = useState(true);
  const [formSelectedServices, setFormSelectedServices] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Delete & Reassign Document Type State
  const [deletingDocType, setDeletingDocType] = useState<DocumentTypeDefinition | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Category Edit / Create Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormId, setCategoryFormId] = useState('');
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormDescription, setCategoryFormDescription] = useState('');
  const [categoryFormBadgeColor, setCategoryFormBadgeColor] = useState(DOCUMENT_COLOR_THEMES[0].value);
  const [categoryFormStatus, setCategoryFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Delete Category Modal State
  const [deletingCategory, setDeletingCategory] = useState<DocumentCategoryDefinition | null>(null);
  const [reassignCategoryTargetId, setReassignCategoryTargetId] = useState<string>('');

  // Global Feedback Message
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Filtered Document Types List
  const filteredDocTypes = useMemo(() => {
    return documentTypes.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = d.id.toLowerCase().includes(q);
        const matchName = d.name.toLowerCase().includes(q);
        const matchCategory = d.category.toLowerCase().includes(q);
        const matchDesc = (d.description || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchCategory && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [documentTypes, statusFilter, categoryFilter, searchQuery]);

  // Filtered Categories List
  const filteredCategories = useMemo(() => {
    return documentCategories.filter((c) => {
      if (categoryStatusFilter !== 'ALL' && (c.status || 'ACTIVE') !== categoryStatusFilter) {
        return false;
      }
      if (categorySearchQuery.trim()) {
        const q = categorySearchQuery.toLowerCase();
        const matchId = c.id.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [documentCategories, categoryStatusFilter, categorySearchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = documentTypes.length;
    const active = documentTypes.filter((d) => d.status === 'ACTIVE').length;
    const inactive = total - active;
    const systemDefault = documentTypes.filter((d) => d.isSystemDefault).length;
    const custom = total - systemDefault;

    // Document usage map across all projects
    const docUsageMap: Record<string, number> = {};
    projects.forEach((p) => {
      p.documents?.forEach((doc) => {
        docUsageMap[doc.type] = (docUsageMap[doc.type] || 0) + 1;
      });
    });

    const totalUploadedDocuments = Object.values(docUsageMap).reduce((a, b) => a + b, 0);

    // Categories count map
    const categoryUsageMap: Record<string, number> = {};
    documentTypes.forEach((dt) => {
      categoryUsageMap[dt.category] = (categoryUsageMap[dt.category] || 0) + 1;
    });

    return {
      total,
      active,
      inactive,
      systemDefault,
      custom,
      docUsageMap,
      totalUploadedDocuments,
      categoryUsageMap,
      totalCategories: documentCategories.length,
      activeCategories: documentCategories.filter((c) => c.status !== 'INACTIVE').length,
    };
  }, [documentTypes, documentCategories, projects]);

  const currentSelectedCategoryDef = useMemo(() => {
    return documentCategories.find((c) => c.id === formCategory);
  }, [documentCategories, formCategory]);

  if (!isOpen) return null;

  // Document Type Handlers
  const handleOpenAdd = () => {
    setEditingDocTypeId(null);
    setFormId('');
    setFormName('');
    const defaultCat = activeDocumentCategories.length > 0 ? activeDocumentCategories[0].id : 'TECHNICAL_DOSSIER';
    setFormCategory(defaultCat);
    setFormDescription('');
    setFormBadgeColor(DOCUMENT_COLOR_THEMES[0].value);
    setFormAcceptedTypes('.pdf, .xlsx, .docx, .jpg, .png');
    setFormIsAutoCompleting(true);
    setFormSelectedServices([]);
    setFormStatus('ACTIVE');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (docType: DocumentTypeDefinition) => {
    setEditingDocTypeId(docType.id);
    setFormId(docType.id);
    setFormName(docType.name);
    setFormCategory(docType.category);
    setFormDescription(docType.description || '');
    setFormBadgeColor(docType.badgeColor || DOCUMENT_COLOR_THEMES[0].value);
    setFormAcceptedTypes((docType.acceptedFileTypes || ['.pdf', '.xlsx', '.docx']).join(', '));
    setFormIsAutoCompleting(docType.isAutoCompleting ?? true);
    setFormSelectedServices(docType.requiredForServices || []);
    setFormStatus(docType.status);
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Document type name is required.' });
      return;
    }

    const acceptedArr = formAcceptedTypes
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => (s.startsWith('.') ? s : `.${s}`));

    if (editingDocTypeId) {
      const res = updateDocumentType(editingDocTypeId, {
        name: formName.trim(),
        category: formCategory as any,
        description: formDescription.trim(),
        badgeColor: formBadgeColor,
        acceptedFileTypes: acceptedArr.length > 0 ? acceptedArr : ['.pdf'],
        isAutoCompleting: formIsAutoCompleting,
        requiredForServices: formSelectedServices,
        status: formStatus,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Document type updated.' });
        setIsFormModalOpen(false);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to update.' });
      }
    } else {
      const res = addDocumentType({
        id: formId.trim() || undefined,
        name: formName.trim(),
        category: formCategory as any,
        description: formDescription.trim(),
        badgeColor: formBadgeColor,
        acceptedFileTypes: acceptedArr.length > 0 ? acceptedArr : ['.pdf'],
        isAutoCompleting: formIsAutoCompleting,
        requiredForServices: formSelectedServices,
        isSystemDefault: false,
        status: formStatus,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Document type added.' });
        setIsFormModalOpen(false);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to add.' });
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingDocType) return;
    const res = deleteDocumentType(deletingDocType.id, reassignTargetId || undefined);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Document type removed.' });
      setDeletingDocType(null);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message || 'Failed to remove document type.' });
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all document types to system statutory defaults? Custom document types will be replaced by the standard Permenperin & statutory set.'
      )
    ) {
      const res = resetDocumentTypesToDefault();
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Document types catalog reset.' });
      }
    }
  };

  // Category Management Handlers
  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryFormId('');
    setCategoryFormName('');
    setCategoryFormDescription('');
    setCategoryFormBadgeColor(DOCUMENT_COLOR_THEMES[0].value);
    setCategoryFormStatus('ACTIVE');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: DocumentCategoryDefinition) => {
    setEditingCategoryId(cat.id);
    setCategoryFormId(cat.id);
    setCategoryFormName(cat.name);
    setCategoryFormDescription(cat.description || '');
    setCategoryFormBadgeColor(cat.badgeColor || DOCUMENT_COLOR_THEMES[0].value);
    setCategoryFormStatus(cat.status || 'ACTIVE');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Category display name is required.' });
      return;
    }

    if (editingCategoryId) {
      const res = updateDocumentCategory(editingCategoryId, {
        name: categoryFormName.trim(),
        description: categoryFormDescription.trim(),
        badgeColor: categoryFormBadgeColor,
        status: categoryFormStatus,
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Category updated successfully.' });
        setIsCategoryModalOpen(false);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to update category.' });
      }
    } else {
      const cleanId = categoryFormId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      if (!cleanId) {
        setFeedbackMsg({ type: 'error', text: 'Category code is required (e.g. TECHNICAL_DOSSIER).' });
        return;
      }
      const res = addDocumentCategory({
        id: cleanId,
        name: categoryFormName.trim(),
        description: categoryFormDescription.trim(),
        badgeColor: categoryFormBadgeColor,
        status: categoryFormStatus,
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'New category created successfully.' });
        // If currently in the document type form, automatically select this new category
        if (isFormModalOpen) {
          setFormCategory(cleanId);
        }
        setIsCategoryModalOpen(false);
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to create category.' });
      }
    }
  };

  const handleDeleteCategoryConfirm = () => {
    if (!deletingCategory) return;
    const res = deleteDocumentCategory(deletingCategory.id, reassignCategoryTargetId || undefined);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Category removed.' });
      setDeletingCategory(null);
      if (formCategory === deletingCategory.id) {
        setFormCategory(reassignCategoryTargetId || 'TECHNICAL_DOSSIER');
      }
    } else {
      setFeedbackMsg({ type: 'error', text: res.message || 'Failed to remove category.' });
    }
  };

  const handleResetCategoriesDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all document categories to statutory defaults? Any custom category names or color modifications will be restored.'
      )
    ) {
      const res = resetDocumentCategoriesToDefault();
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Document categories catalog reset.' });
      }
    }
  };

  const toggleServiceSelection = (svcId: string) => {
    if (formSelectedServices.includes(svcId)) {
      setFormSelectedServices(formSelectedServices.filter((id) => id !== svcId));
    } else {
      setFormSelectedServices([...formSelectedServices, svcId]);
    }
  };

  return (
    <div
      id="doc-type-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="doc-type-manager-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Document Requirements & Categories Master
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Permenperin & Statutory Mapping
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="btn-close-doc-manager-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Admin Security Banner */}
        <div className="px-6 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-indigo-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              Executive Authority: <strong>{currentUser.name}</strong> ({currentUser.roleTitle || currentUser.role})
            </span>
            {isMasterAdmin ? (
              <span className="px-2 py-0.5 rounded-md bg-indigo-200/80 text-indigo-800 font-semibold text-[10px]">
                SUPERADMIN / MASTER GRANTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-semibold text-[10px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> READ-ONLY (Requires admin.master)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!isMasterAdmin && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                Master Admin Privileges Required
              </span>
            )}

            {isMasterAdmin && activeTab === 'DOCUMENT_TYPES' && (
              <>
                <button
                  id="btn-reset-doc-types-defaults"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-all text-xs flex items-center space-x-1.5 shadow-sm"
                  title="Reset to statutory default document types"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Types to Defaults</span>
                </button>
                <button
                  id="btn-add-new-doc-type"
                  onClick={handleOpenAdd}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all text-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document Type</span>
                </button>
              </>
            )}

            {isMasterAdmin && activeTab === 'CATEGORIES_MASTER' && (
              <>
                <button
                  id="btn-reset-categories-defaults"
                  onClick={handleResetCategoriesDefaults}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-all text-xs flex items-center space-x-1.5 shadow-sm"
                  title="Reset categories to statutory defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Categories</span>
                </button>
                <button
                  id="btn-add-new-category"
                  onClick={handleOpenAddCategory}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-xs flex items-center space-x-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add New Category</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feedback Alert Message */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2 text-xs font-medium flex items-center justify-between ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
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

        {/* Tab Switcher & Metrics Banner */}
        <div className="px-6 pt-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              id="tab-btn-doc-types"
              type="button"
              onClick={() => setActiveTab('DOCUMENT_TYPES')}
              className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center space-x-2 border-t border-x transition-all ${
                activeTab === 'DOCUMENT_TYPES'
                  ? 'bg-white text-blue-700 border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Required Document Types</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'DOCUMENT_TYPES' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {metrics.total}
              </span>
            </button>

            <button
              id="tab-btn-categories-master"
              type="button"
              onClick={() => setActiveTab('CATEGORIES_MASTER')}
              className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center space-x-2 border-t border-x transition-all ${
                activeTab === 'CATEGORIES_MASTER'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Document Categories Master</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'CATEGORIES_MASTER'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {metrics.totalCategories}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3 pb-2 text-[11px] text-slate-500">
            <span>
              Active Types: <strong className="text-emerald-700">{metrics.active}</strong>
            </span>
            <span>•</span>
            <span>
              Categories: <strong className="text-indigo-700">{metrics.activeCategories}</strong>
            </span>
            <span>•</span>
            <span>
              Linked Files: <strong className="text-amber-700">{metrics.totalUploadedDocuments}</strong>
            </span>
          </div>
        </div>

        {/* TAB CONTENT: 1. DOCUMENT TYPES */}
        {activeTab === 'DOCUMENT_TYPES' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search, Category Filter & Status Filter */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 min-w-[260px] max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="input-search-doc-types"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, name, category, or clause..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Category:</span>
                </div>
                <select
                  id="select-category-filter-doc-types"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories ({documentTypes.length})</option>
                  {documentCategories.map((c) => {
                    const count = documentTypes.filter((d) => d.category === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count})
                      </option>
                    );
                  })}
                </select>

                <select
                  id="select-status-filter-doc-types"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive / Archived</option>
                </select>

                {isMasterAdmin && (
                  <button
                    onClick={() => setActiveTab('CATEGORIES_MASTER')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                    title="Manage & edit categories master"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manage Categories</span>
                  </button>
                )}
              </div>
            </div>

            {/* Document Types List */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-3">
              {filteredDocTypes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-700">No document types match your search</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your search query or category filters, or click "Add Document Type" to create a new requirement.
                  </p>
                  {isMasterAdmin && (
                    <button
                      onClick={handleOpenAdd}
                      className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Document Type</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDocTypes.map((docType) => {
                    const linkedCount = metrics.docUsageMap[docType.id] || 0;
                    const categoryDef = documentCategories.find((c) => c.id === docType.category);

                    return (
                      <div
                        key={docType.id}
                        id={`doc-type-card-${docType.id}`}
                        className={`bg-white rounded-xl border p-4.5 transition-all relative flex flex-col justify-between shadow-sm hover:shadow-md ${
                          docType.status === 'ACTIVE'
                            ? 'border-slate-200 hover:border-blue-300'
                            : 'border-slate-200 bg-slate-50/70 opacity-75'
                        }`}
                      >
                        <div>
                          {/* Top Bar: Code, Category, Status & Actions */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                  docType.badgeColor || 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}
                              >
                                {docType.id}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                  categoryDef?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {categoryDef?.name || docType.category}
                              </span>

                              {docType.isSystemDefault ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  STATUTORY DEFAULT
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  CUSTOM TYPE
                                </span>
                              )}
                            </div>

                            {/* Actions for Admin Master */}
                            <div className="flex items-center space-x-1">
                              {isMasterAdmin ? (
                                <>
                                  <button
                                    id={`btn-edit-doctype-${docType.id}`}
                                    onClick={() => handleOpenEdit(docType)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Edit Document Type"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    id={`btn-toggle-doctype-${docType.id}`}
                                    onClick={() => toggleDocumentTypeStatus(docType.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      docType.status === 'ACTIVE'
                                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                    title={docType.status === 'ACTIVE' ? 'Deactivate Type' : 'Activate Type'}
                                  >
                                    {docType.status === 'ACTIVE' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </button>

                                  <button
                                    id={`btn-delete-doctype-${docType.id}`}
                                    onClick={() => {
                                      setDeletingDocType(docType);
                                      setReassignTargetId('');
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Remove / Archive Document Type"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    docType.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {docType.status}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Document Name & Description */}
                          <h3 className="text-sm font-bold text-slate-900 mt-1">{docType.name}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {docType.description || 'Statutory requirement for verification files.'}
                          </p>
                        </div>

                        {/* Metadata Footer */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center space-x-2 text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Tag className="w-3 h-3 text-slate-400" />
                              <span>{(docType.acceptedFileTypes || ['.pdf']).join(', ')}</span>
                            </span>

                            {docType.isAutoCompleting && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700">
                                Auto-Milestone
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 text-slate-600">
                            <span className="font-semibold text-slate-800">{linkedCount}</span>
                            <span>uploaded file{linkedCount === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: 2. CATEGORIES MASTER */}
        {activeTab === 'CATEGORIES_MASTER' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Search & Filter Toolbar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 min-w-[260px] max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="input-search-categories"
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Search category code, name, or description..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  {categorySearchQuery && (
                    <button
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <select
                  id="select-category-status-filter"
                  value={categoryStatusFilter}
                  onChange={(e) => setCategoryStatusFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories ({documentCategories.length})</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                {isMasterAdmin && (
                  <button
                    id="btn-create-category-tab"
                    onClick={handleOpenAddCategory}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-xs flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Category</span>
                  </button>
                )}
              </div>
            </div>

            {/* Categories Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-3">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-700">No categories found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your search query, or click "Create Category" to define a new document classification.
                  </p>
                  {isMasterAdmin && (
                    <button
                      onClick={handleOpenAddCategory}
                      className="mt-4 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Category</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCategories.map((cat) => {
                    const docCount = metrics.categoryUsageMap[cat.id] || 0;
                    const linkedTypes = documentTypes.filter((d) => d.category === cat.id);

                    return (
                      <div
                        key={cat.id}
                        id={`category-card-${cat.id}`}
                        className={`bg-white rounded-xl border p-4.5 transition-all relative flex flex-col justify-between shadow-sm hover:shadow-md ${
                          cat.status !== 'INACTIVE'
                            ? 'border-slate-200 hover:border-indigo-300'
                            : 'border-slate-200 bg-slate-50/70 opacity-75'
                        }`}
                      >
                        <div>
                          {/* Top: Category Code & Badge */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                  cat.badgeColor || 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                {cat.id}
                              </span>

                              {cat.isSystemDefault ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  SYSTEM DEFAULT
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  CUSTOM CATEGORY
                                </span>
                              )}
                            </div>

                            {/* Actions for Admin Master */}
                            <div className="flex items-center space-x-1">
                              {isMasterAdmin ? (
                                <>
                                  <button
                                    id={`btn-edit-category-${cat.id}`}
                                    onClick={() => handleOpenEditCategory(cat)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Edit Category Details & Badge"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    id={`btn-toggle-category-${cat.id}`}
                                    onClick={() => toggleDocumentCategoryStatus(cat.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      cat.status !== 'INACTIVE'
                                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                    title={cat.status !== 'INACTIVE' ? 'Deactivate Category' : 'Activate Category'}
                                  >
                                    {cat.status !== 'INACTIVE' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </button>

                                  <button
                                    id={`btn-delete-category-${cat.id}`}
                                    onClick={() => {
                                      setDeletingCategory(cat);
                                      setReassignCategoryTargetId('');
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    cat.status !== 'INACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {cat.status || 'ACTIVE'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Category Name & Scope Description */}
                          <h3 className="text-sm font-bold text-slate-900 mt-1">{cat.name}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description || 'Statutory category grouping for verification documents.'}
                          </p>

                          {/* Linked Document Types Preview */}
                          <div className="mt-3">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Included Document Types ({docCount})
                            </span>
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                              {linkedTypes.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">No document types currently assigned.</span>
                              ) : (
                                linkedTypes.map((dt) => (
                                  <span
                                    key={dt.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {dt.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Updated: {cat.updatedAt || 'Default'}</span>
                          <span className="font-semibold text-indigo-700">
                            {docCount} Document Type{docCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              Changes to document types and categories dynamically sync across project checklists, upload vaults, and regulatory files.
            </span>
          </div>

          <button
            id="btn-close-doctype-modal-bottom"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD / EDIT REQUIRED DOCUMENT TYPE MODAL */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div
          id="form-doctype-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            id="form-doctype-modal-card"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingDocTypeId ? 'Edit Required Document Type' : 'Add New Required Document Type'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Define statutory code, display name, category group, and file rules.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code / Identifier */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Document Code / Key Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-doctype-id"
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    disabled={!!editingDocTypeId}
                    placeholder="e.g. HALAL_CERTIFICATE, BPOM_LICENSE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-60"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Unique uppercase identifier (alphanumeric and underscores).
                  </span>
                </div>

                {/* Category Section with Inline Edit / Add Category for admin_master */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold flex items-center space-x-1">
                      <span>Category</span>
                      <span className="text-rose-500">*</span>
                    </label>

                    {isMasterAdmin && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          id="btn-quick-new-category"
                          onClick={handleOpenAddCategory}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-0.5"
                          title="Create a new document category"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New Category</span>
                        </button>

                        {currentSelectedCategoryDef && (
                          <>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              id="btn-quick-edit-category"
                              onClick={() => handleOpenEditCategory(currentSelectedCategoryDef)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-0.5"
                              title="Edit selected category properties"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <select
                    id="select-doctype-category"
                    value={formCategory}
                    onChange={(e) => {
                      if (e.target.value === '__NEW_CATEGORY__') {
                        handleOpenAddCategory();
                      } else {
                        setFormCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {documentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.status === 'INACTIVE' ? '(Inactive)' : ''}
                      </option>
                    ))}
                    {isMasterAdmin && (
                      <option value="__NEW_CATEGORY__" className="text-indigo-600 font-bold bg-indigo-50">
                        ➕ + Create New Category...
                      </option>
                    )}
                  </select>

                  {/* Category Details & Quick Action Pill */}
                  {currentSelectedCategoryDef && (
                    <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            currentSelectedCategoryDef.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {currentSelectedCategoryDef.id}
                        </span>
                        <span className="text-slate-600 truncate">{currentSelectedCategoryDef.description}</span>
                      </div>

                      {isMasterAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(currentSelectedCategoryDef)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800 font-semibold flex-shrink-0 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Display Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Document Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-doctype-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sertifikat Halal MUI / BPJPH, Laporan Hasil Uji Lab"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description & Regulatory Context
                </label>
                <textarea
                  id="input-doctype-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Explain why this document is required, standard clauses, or verification purpose..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Accepted File Types and Badge Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Accepted File Types
                  </label>
                  <input
                    id="input-doctype-accepted-types"
                    type="text"
                    value={formAcceptedTypes}
                    onChange={(e) => setFormAcceptedTypes(e.target.value)}
                    placeholder=".pdf, .xlsx, .docx, .jpg, .png"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Comma separated list of extensions (e.g. .pdf, .xlsx, .docx)
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Color Badge Theme
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {DOCUMENT_COLOR_THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setFormBadgeColor(theme.value)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                          theme.value
                        } ${
                          formBadgeColor === theme.value
                            ? 'ring-2 ring-blue-500 ring-offset-1 scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Applicability */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Applies to Specific Consulting Services (Optional)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-600 pb-1.5 border-b border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500">
                      {formSelectedServices.length === 0
                        ? 'Applies to ALL Consulting Services (Default)'
                        : `Restricted to ${formSelectedServices.length} selected service(s)`}
                    </span>
                  </div>
                  {consultingServices.map((svc) => {
                    const isSelected = formSelectedServices.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className="flex items-center space-x-2 text-[11px] text-slate-700 hover:bg-slate-100/80 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleServiceSelection(svc.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold">{svc.code}</span>
                        <span className="text-slate-500">- {svc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsAutoCompleting}
                    onChange={(e) => setFormIsAutoCompleting(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Auto-Complete Milestones</span>
                    <span className="text-[10px] text-slate-500">
                      Uploading this file satisfies matching milestone checklist items.
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formStatus === 'ACTIVE'}
                    onChange={(e) => setFormStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Active in Upload Catalog</span>
                    <span className="text-[10px] text-slate-500">
                      Enable consultants and auditors to select this document type.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-colors"
                >
                  {editingDocTypeId ? 'Save Changes' : 'Create Document Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD / EDIT CATEGORY MODAL (Admin Master) */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div
          id="category-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            id="category-modal-card"
            className="bg-white rounded-2xl shadow-2xl border border-indigo-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCategoryId ? 'Edit Document Category' : 'Create New Document Category'}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Admin Master configuration for statutory and custom category groups.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Category Code / Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-category-id"
                  type="text"
                  value={categoryFormId}
                  onChange={(e) => setCategoryFormId(e.target.value.toUpperCase())}
                  disabled={!!editingCategoryId}
                  placeholder="e.g. TECHNICAL_DOSSIER, SURVEYOR_AUDIT_REPORT"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-60"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Unique uppercase identifier stored in database documents.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Category Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-category-name"
                  type="text"
                  value={categoryFormName}
                  onChange={(e) => setCategoryFormName(e.target.value)}
                  placeholder="e.g. Legal & Statutory Licensing, Surveyor & LVI Audit Reports"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Category Description & Scope
                </label>
                <textarea
                  id="input-category-description"
                  value={categoryFormDescription}
                  onChange={(e) => setCategoryFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the regulatory or operational purpose of this document classification..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Category Badge Color Theme</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {DOCUMENT_COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => setCategoryFormBadgeColor(theme.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                        theme.value
                      } ${
                        categoryFormBadgeColor === theme.value
                          ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryFormStatus === 'ACTIVE'}
                    onChange={(e) => setCategoryFormStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Active Status</span>
                    <span className="text-[10px] text-slate-500">
                      Enable this category for assigning document requirements.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
                >
                  {editingCategoryId ? 'Save Category Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE DOCUMENT TYPE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingDocType && (
        <div
          id="delete-doctype-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            id="delete-doctype-modal-card"
            className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Remove Document Type</h3>
                  <p className="text-xs text-rose-100">
                    {deletingDocType.name} ({deletingDocType.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletingDocType(null)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p>
                Are you sure you want to remove <strong>{deletingDocType.name}</strong> from the active master catalog?
              </p>

              {metrics.docUsageMap[deletingDocType.id] > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      {metrics.docUsageMap[deletingDocType.id]} active uploaded document(s) use this type
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    To maintain statutory audit trails, you can reassign these documents to another type, or archive this document type as INACTIVE.
                  </p>

                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                      Reassign existing files to: (Optional)
                    </label>
                    <select
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">Archive as Inactive (Preserve type in history)</option>
                      {documentTypes
                        .filter((d) => d.id !== deletingDocType.id && d.status === 'ACTIVE')
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.id})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">
                  This document type is not referenced by any project documents and can be safely deleted permanently.
                </p>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingDocType(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                >
                  {metrics.docUsageMap[deletingDocType.id] > 0 && !reassignTargetId
                    ? 'Archive as Inactive'
                    : 'Confirm Removal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE CATEGORY CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingCategory && (
        <div
          id="delete-category-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            id="delete-category-modal-card"
            className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Document Category</h3>
                  <p className="text-xs text-rose-100">
                    {deletingCategory.name} ({deletingCategory.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletingCategory(null)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p>
                Are you sure you want to remove category <strong>{deletingCategory.name}</strong>?
              </p>

              {metrics.categoryUsageMap[deletingCategory.id] > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      {metrics.categoryUsageMap[deletingCategory.id]} document type(s) belong to this category
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    You must reassign these document types to another active category, or this category will be marked as INACTIVE.
                  </p>

                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                      Reassign document types to:
                    </label>
                    <select
                      value={reassignCategoryTargetId}
                      onChange={(e) => setReassignCategoryTargetId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">Deactivate Category (Keep existing mappings)</option>
                      {documentCategories
                        .filter((c) => c.id !== deletingCategory.id && c.status !== 'INACTIVE')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.id})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">
                  This category has no document types attached and can be safely deleted.
                </p>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCategoryConfirm}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                >
                  {metrics.categoryUsageMap[deletingCategory.id] > 0 && !reassignCategoryTargetId
                    ? 'Deactivate Category'
                    : 'Confirm Deletion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
