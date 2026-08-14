import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  UserCheck,
  CheckSquare,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Send,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  ConsultingProject,
  DispositionCategory,
  Priority,
  ChecklistItem,
  JobDisposition,
} from '../types';

interface JobDispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: ConsultingProject | null;
  editingDisposition?: JobDisposition | null;
}

export const JobDispositionModal: React.FC<JobDispositionModalProps> = ({
  isOpen,
  onClose,
  initialProject,
  editingDisposition,
}) => {
  const { projects, teamMembers, currentUser, addDisposition, updateDisposition } = useProjects();

  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<DispositionCategory>('TKDN_CALCULATION');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [dueDate, setDueDate] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'chk-1', text: 'Review initial documents from client repository', done: false },
    { id: 'chk-2', text: 'Cross-check supplier certificates on SIINas Kemenperin', done: false },
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Sync initial data when modal opens
  useEffect(() => {
    if (editingDisposition) {
      setProjectId(editingDisposition.projectId);
      setTitle(editingDisposition.title);
      setCategory(editingDisposition.category);
      setAssignedToId(editingDisposition.assignedToId);
      setPriority(editingDisposition.priority);
      setDueDate(editingDisposition.dueDate);
      setInstructions(editingDisposition.instructions);
      setChecklist(editingDisposition.checklist || []);
    } else {
      // Default new disposition
      const defaultProj = initialProject || projects[0];
      if (defaultProj) {
        setProjectId(defaultProj.id);
      }
      setAssignedToId(teamMembers[1]?.id || teamMembers[0]?.id || '');
      setTitle('');
      setCategory('TKDN_CALCULATION');
      setPriority('HIGH');
      // Default due date: 7 days from now
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      setDueDate(in7Days.toISOString().slice(0, 10));
      setInstructions('');
      setChecklist([
        { id: `chk-${Date.now()}-1`, text: 'Review raw materials Bill of Materials (BOM) sheet', done: false },
        { id: `chk-${Date.now()}-2`, text: 'Validate domestic supplier NPWP & Kemenperin TKDN Certificate', done: false },
      ]);
    }
  }, [isOpen, initialProject, editingDisposition, projects, teamMembers]);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedAssignee = teamMembers.find((m) => m.id === assignedToId);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: `chk-${Date.now()}`, text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !selectedAssignee || !title.trim() || !dueDate) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingDisposition) {
      updateDisposition(editingDisposition.id, {
        projectId: selectedProject.id,
        projectCode: selectedProject.code,
        projectName: selectedProject.productOrServiceName,
        clientName: selectedProject.clientName,
        title: title.trim(),
        category,
        assignedToId: selectedAssignee.id,
        assignedToName: selectedAssignee.name,
        assignedToRole: selectedAssignee.role,
        assignedToAvatar: selectedAssignee.avatar,
        priority,
        dueDate,
        instructions: instructions.trim(),
        checklist,
      });
    } else {
      addDisposition({
        projectId: selectedProject.id,
        projectCode: selectedProject.code,
        projectName: selectedProject.productOrServiceName,
        clientName: selectedProject.clientName,
        title: title.trim(),
        category,
        assignedToId: selectedAssignee.id,
        assignedToName: selectedAssignee.name,
        assignedToRole: selectedAssignee.role,
        assignedToAvatar: selectedAssignee.avatar,
        assignedById: currentUser.id,
        assignedByName: currentUser.name,
        dueDate,
        priority,
        status: 'PENDING',
        instructions: instructions.trim(),
        checklist,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {editingDisposition ? 'Edit Job Disposition' : 'Dispatch Job Disposition (Task Order)'}
              </h3>
              <p className="text-xs text-slate-400">
                Official Consulting Assignment & Workload Task Order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Project Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Associated Consulting Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.clientName} — {p.productOrServiceName.slice(0, 45)}...
                </option>
              ))}
            </select>
            {selectedProject && (
              <p className="text-[11px] text-slate-500 mt-1">
                KBLI: <span className="font-mono text-slate-700">{selectedProject.kbliCode}</span> | Surveyor:{' '}
                <span className="font-semibold text-slate-700">{selectedProject.surveyorBody}</span>
              </p>
            )}
          </div>

          {/* Disposition Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task / Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit Supplier BOM for Raw Ingot & Verify SIINas Certificate"
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          {/* Category, Priority, and Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DispositionCategory)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="TKDN_CALCULATION">TKDN Calculation & BOM</option>
                <option value="DOC_COLLECTION">Document Collection</option>
                <option value="FIELD_AUDIT_PREP">Field Audit (Surveyor) Prep</option>
                <option value="REGULATORY_SUBMISSION">SIINas / OSS-RBA Submission</option>
                <option value="LEGAL_COMPLIANCE">Legal & Permits Review</option>
                <option value="CLIENT_CONSULTATION">Client Consultation & Workshop</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority SLA
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="URGENT">Urgent (24h - 48h)</option>
                <option value="HIGH">High (3 - 5 days)</option>
                <option value="MEDIUM">Medium (1 - 2 weeks)</option>
                <option value="LOW">Low (Standard)</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Assignee Selection with Capacity Indicator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign To Team Member (Consultant / Auditor) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {teamMembers.map((member) => {
                const isSelected = assignedToId === member.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => setAssignedToId(member.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                    }`}
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{member.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-semibold text-slate-600">
                          {member.activeTaskCount} active tasks
                        </span>
                        <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              member.capacityPercentage > 80 ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${member.capacityPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions / Partner Disposition Memo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Disposition Memo & Instructions
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide technical instructions, specific verification rules (e.g. Permenperin reference, SIINas check requirements)..."
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Checklist Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Actionable Deliverable Checklist
            </label>
            <div className="space-y-1.5 mb-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="text-slate-800 font-medium flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add checklist item (e.g., Verify factory asset registration receipt)..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{editingDisposition ? 'Update Disposition' : 'Dispatch Disposition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
