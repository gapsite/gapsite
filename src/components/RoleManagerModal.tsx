import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Shield,
  Layers,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember, UserRole, UserPermission } from '../types';

const ALL_PERMISSIONS: { id: UserPermission; label: string; description: string; category: string }[] = [
  {
    id: 'MANAGE_USERS_ROLES',
    label: 'Manage Users & Permissions',
    description: 'Create, modify, suspend accounts and reassign system RBAC roles',
    category: 'System Governance',
  },
  {
    id: 'CREATE_PROJECTS',
    label: 'Create Consulting Projects',
    description: 'Initiate new statutory client projects with stages and initial budget',
    category: 'Project Operations',
  },
  {
    id: 'EDIT_PROJECTS',
    label: 'Edit Project Parameters',
    description: 'Modify KBLI, project metadata, stages, tags and budget schedules',
    category: 'Project Operations',
  },
  {
    id: 'DELETE_PROJECTS',
    label: 'Delete Projects',
    description: 'Archive or permanently erase consulting projects from the database',
    category: 'Project Operations',
  },
  {
    id: 'CALCULATE_TKDN',
    label: 'TKDN Calculator & BOM Costing',
    description: 'Perform bill-of-materials computations and recalculate TKDN percentage',
    category: 'Technical & Audit',
  },
  {
    id: 'UPLOAD_DOCUMENTS',
    label: 'Upload Regulatory Dossiers',
    description: 'Attach BOM spreadsheets, lab reports, company deeds, and invoices',
    category: 'Document Management',
  },
  {
    id: 'VERIFY_DOCUMENTS',
    label: 'Verify & Approve Documents',
    description: 'Mark uploaded dossiers as verified or reject with auditor remarks',
    category: 'Document Management',
  },
  {
    id: 'SIGNOFF_MILESTONES',
    label: 'Sign-off Audit Milestones',
    description: 'Perform lead assessor sign-off on statutory checklist milestones',
    category: 'Technical & Audit',
  },
  {
    id: 'MANAGE_DISPOSITIONS',
    label: 'Assign & Complete Dispositions',
    description: 'Create task delegations, update status, and close action items',
    category: 'Project Operations',
  },
  {
    id: 'MANAGE_FINANCE',
    label: 'Manage Financials & Invoices',
    description: 'Log consulting fees, surveyor disbursements, and payment terms',
    category: 'Financial Control',
  },
  {
    id: 'EXPORT_AUDIT_REPORTS',
    label: 'Export Audit Summary Dossiers',
    description: 'Download PDF/Excel compliance packages for Surveyor submission',
    category: 'Technical & Audit',
  },
];

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  DIRECTOR: [
    'MANAGE_USERS_ROLES',
    'VIEW_PROJECTS',
    'CREATE_PROJECTS',
    'EDIT_PROJECTS',
    'DELETE_PROJECTS',
    'CALCULATE_TKDN',
    'UPLOAD_DOCUMENTS',
    'VERIFY_DOCUMENTS',
    'SIGNOFF_MILESTONES',
    'MANAGE_DISPOSITIONS',
    'MANAGE_FINANCE',
    'EXPORT_AUDIT_REPORTS',
  ],
  LEAD_CONSULTANT: [
    'VIEW_PROJECTS',
    'CREATE_PROJECTS',
    'EDIT_PROJECTS',
    'CALCULATE_TKDN',
    'UPLOAD_DOCUMENTS',
    'VERIFY_DOCUMENTS',
    'SIGNOFF_MILESTONES',
    'MANAGE_DISPOSITIONS',
    'EXPORT_AUDIT_REPORTS',
  ],
  TECHNICAL_CONSULTANT: [
    'VIEW_PROJECTS',
    'CALCULATE_TKDN',
    'UPLOAD_DOCUMENTS',
    'MANAGE_DISPOSITIONS',
    'EXPORT_AUDIT_REPORTS',
  ],
  SURVEYOR_LIAISON: [
    'VIEW_PROJECTS',
    'EDIT_PROJECTS',
    'UPLOAD_DOCUMENTS',
    'VERIFY_DOCUMENTS',
    'SIGNOFF_MILESTONES',
    'MANAGE_DISPOSITIONS',
    'EXPORT_AUDIT_REPORTS',
  ],
  FINANCE_OFFICER: [
    'VIEW_PROJECTS',
    'UPLOAD_DOCUMENTS',
    'MANAGE_FINANCE',
    'EXPORT_AUDIT_REPORTS',
  ],
  CLIENT_VIEWER: [
    'VIEW_PROJECTS',
    'UPLOAD_DOCUMENTS',
    'EXPORT_AUDIT_REPORTS',
  ],
};

const ROLE_DETAILS: Record<UserRole, { title: string; color: string; desc: string }> = {
  DIRECTOR: {
    title: 'Managing Partner / Director',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300',
    desc: 'Unrestricted enterprise access to all projects, user governance, financial SPKs, and audit signoffs.',
  },
  LEAD_CONSULTANT: {
    title: 'Lead Assessor / Senior Consultant',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
    desc: 'Full project execution, statutory milestone sign-off, BOM verification, and surveyor liaison.',
  },
  TECHNICAL_CONSULTANT: {
    title: 'Technical Consultant / BOM Specialist',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
    desc: 'TKDN calculation modeling, BOM breakdown, cost accounting, and technical dossier collation.',
  },
  SURVEYOR_LIAISON: {
    title: 'Regulatory & Surveyor Liaison',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    desc: 'Sucofindo / SI interface, OSS-RBA coordination, SIINas profile management, and regulatory compliance.',
  },
  FINANCE_OFFICER: {
    title: 'Financial Controller / Billing Specialist',
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300',
    desc: 'Managing client fee schedules, billing invoices, surveyor disbursement payments, and financial auditing.',
  },
  CLIENT_VIEWER: {
    title: 'Client Portal Viewer',
    color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    desc: 'Read-only visibility for corporate clients to upload requested files, track progress, and inspect final certificates.',
  },
};

export const RoleManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { teamMembers, currentUser, addUser, updateUser, deleteUser, toggleUserStatus, quickSwitchUser } =
    useProjects();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'roles'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal for add/edit user
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    roleTitle: string;
    department: string;
    pin: string;
    clientCompany: string;
    avatar: string;
    specialization: string;
    permissions: UserPermission[];
  }>({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'TECHNICAL_CONSULTANT',
    roleTitle: 'Technical Assessor',
    department: 'Technical & TKDN Calculations',
    pin: '1234',
    clientCompany: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    specialization: 'BOM Costing, SIINas',
    permissions: ROLE_DEFAULT_PERMISSIONS['TECHNICAL_CONSULTANT'],
  });

  if (!isOpen) return null;

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      phone: '+62 ',
      role: 'TECHNICAL_CONSULTANT',
      roleTitle: 'Technical Assessor',
      department: 'Technical & TKDN Calculations',
      pin: '1234',
      clientCompany: '',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
      specialization: '',
      permissions: ROLE_DEFAULT_PERMISSIONS['TECHNICAL_CONSULTANT'],
    });
    setIsEditUserOpen(true);
  };

  const handleOpenEditUser = (user: TeamMember) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      roleTitle: user.roleTitle || user.role,
      department: user.department || 'Consulting Services',
      pin: user.pin || '1234',
      clientCompany: user.clientCompany || '',
      avatar: user.avatar,
      specialization: (user.specialization || []).join(', '),
      permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role],
    });
    setIsEditUserOpen(true);
  };

  const handleRoleChangeInForm = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      roleTitle: ROLE_DETAILS[newRole].title,
      permissions: ROLE_DEFAULT_PERMISSIONS[newRole],
    }));
  };

  const handleTogglePermissionInForm = (perm: UserPermission) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      };
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and Email are required.');
      return;
    }

    const specArray = formData.specialization
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        username: formData.username.toLowerCase().trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        role: formData.role,
        roleTitle: formData.roleTitle,
        department: formData.department,
        pin: formData.pin,
        clientCompany: formData.clientCompany,
        avatar: formData.avatar,
        specialization: specArray,
        permissions: formData.permissions,
      });
    } else {
      addUser({
        name: formData.name,
        username: formData.username.toLowerCase().trim() || formData.email.split('@')[0].toLowerCase(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        role: formData.role,
        roleTitle: formData.roleTitle,
        department: formData.department,
        pin: formData.pin || '1234',
        clientCompany: formData.clientCompany,
        avatar: formData.avatar,
        status: 'ACTIVE',
        specialization: specArray,
        permissions: formData.permissions,
        activeTaskCount: 0,
        completedTaskCount: 0,
        capacityPercentage: 50,
      });
    }

    setIsEditUserOpen(false);
  };

  const filteredUsers = teamMembers.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.clientCompany && u.clientCompany.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Enterprise Role & Access Manager</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  RBAC Controller
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure user roles, statutory permission sets, and active consultant credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Team Accounts ({teamMembers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Permission Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'roles'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role Profiles</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter users..."
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="DIRECTOR">Director</option>
                <option value="LEAD_CONSULTANT">Lead Assessor</option>
                <option value="TECHNICAL_CONSULTANT">Technical Assessor</option>
                <option value="SURVEYOR_LIAISON">Surveyor Liaison</option>
                <option value="FINANCE_OFFICER">Finance Officer</option>
                <option value="CLIENT_VIEWER">Client Viewer</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((user) => {
                  const roleMeta = ROLE_DETAILS[user.role] || ROLE_DETAILS.TECHNICAL_CONSULTANT;
                  const isCurrent = currentUser.id === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl bg-white border transition-all ${
                        isCurrent
                          ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shrink-0"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{user.roleTitle || user.role}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400">
                                @{user.username || user.email.split('@')[0]}
                              </span>
                              {user.clientCompany && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 truncate">
                                  {user.clientCompany}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Edit User"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title={user.status === 'ACTIVE' ? 'Suspend / Deactivate' : 'Activate User'}
                            onClick={() => toggleUserStatus(user.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {user.status === 'ACTIVE' ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              type="button"
                              title="Delete User"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${user.name}?`)) {
                                  deleteUser(user.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Department:</span>
                          <span className="font-medium text-slate-800">{user.department || 'Consulting'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Role Badge:</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.color}`}
                          >
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Security PIN:</span>
                          <span className="font-mono text-slate-700 font-bold">{user.pin || '1234'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Active Permissions:</span>
                          <span className="font-bold text-blue-600 font-mono">
                            {(user.permissions || []).length} / {ALL_PERMISSIONS.length}
                          </span>
                        </div>
                      </div>

                      {/* Quick Switch Button */}
                      {!isCurrent && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => quickSwitchUser(user.id)}
                            className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 hover:border-blue-300 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Switch Session to this Role</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Standard Role Permission Matrix</h3>
                  <p className="text-xs text-slate-400">
                    Cross-comparison of default access tiers assigned across Indonesian statutory consulting workflows.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-3 font-bold">Statutory Capability / Action</th>
                      <th className="p-3 font-bold text-center">Director</th>
                      <th className="p-3 font-bold text-center">Lead Assessor</th>
                      <th className="p-3 font-bold text-center">Technical Assessor</th>
                      <th className="p-3 font-bold text-center">Surveyor Liaison</th>
                      <th className="p-3 font-bold text-center">Finance</th>
                      <th className="p-3 font-bold text-center">Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ALL_PERMISSIONS.map((perm) => (
                      <tr key={perm.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{perm.label}</div>
                          <div className="text-[11px] text-slate-500">{perm.description}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {ROLE_DEFAULT_PERMISSIONS.LEAD_CONSULTANT.includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {ROLE_DEFAULT_PERMISSIONS.TECHNICAL_CONSULTANT.includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {ROLE_DEFAULT_PERMISSIONS.SURVEYOR_LIAISON.includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {ROLE_DEFAULT_PERMISSIONS.FINANCE_OFFICER.includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {ROLE_DEFAULT_PERMISSIONS.CLIENT_VIEWER.includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ROLE PROFILES */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(ROLE_DETAILS) as UserRole[]).map((roleKey) => {
                  const role = ROLE_DETAILS[roleKey];
                  const userCount = teamMembers.filter((m) => m.role === roleKey).length;
                  const perms = ROLE_DEFAULT_PERMISSIONS[roleKey];

                  return (
                    <div
                      key={roleKey}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${role.color}`}
                          >
                            {roleKey.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {userCount} {userCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mb-1">{role.title}</h4>
                        <p className="text-xs text-slate-600 mb-4">{role.desc}</p>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Included Capabilities ({perms.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {perms.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {ALL_PERMISSIONS.find((ap) => ap.id === p)?.label || p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Currently logged in as: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Close Manager
          </button>
        </div>
      </div>

      {/* EDIT / CREATE USER SUB-MODAL */}
      {isEditUserOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Provision New Consultant / Client Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name & Titles *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Budi Santoso, S.T."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. budi.assessor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@verixconsulting.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 812-3456-7890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChangeInForm(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="DIRECTOR">DIRECTOR (Managing Partner)</option>
                    <option value="LEAD_CONSULTANT">LEAD_CONSULTANT (Lead Assessor)</option>
                    <option value="TECHNICAL_CONSULTANT">TECHNICAL_CONSULTANT (BOM Specialist)</option>
                    <option value="SURVEYOR_LIAISON">SURVEYOR_LIAISON (Sucofindo / SI)</option>
                    <option value="FINANCE_OFFICER">FINANCE_OFFICER (Billing Controller)</option>
                    <option value="CLIENT_VIEWER">CLIENT_VIEWER (Client Representative)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Security PIN (4 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Industrial TKDN Assessment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {formData.role === 'CLIENT_VIEWER' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Client Company Name</label>
                    <input
                      type="text"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      placeholder="e.g. PT Surya Daya Nusantara"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization / Expertise (comma separated)</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Solar PV TKDN, BOM Costing, Permenperin 16/2011"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Custom Permission Checkboxes */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Granular Permission Overrides ({formData.permissions.length} Active)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermissionInForm(perm.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">{perm.label}</span>
                          <span className="text-[10px] text-slate-500 block leading-tight truncate">
                            {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Save Account Changes' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
