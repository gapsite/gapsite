import React, { useState, useEffect } from 'react';
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
  Clock,
  Sparkles,
  UserX,
  BadgeCheck,
  History,
  FileCheck2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember, UserRole, UserPermission, RoleDefinition } from '../types';
import { DEFAULT_ROLE_GOVERNANCE_META } from '../data/mockData';

const ALL_PERMISSIONS: { id: UserPermission; label: string; description: string; category: string }[] = [
  {
    id: 'MANAGE_USERS_ROLES',
    label: 'Manage Users & Permissions',
    description: 'Create, modify, suspend accounts and reassign system RBAC roles',
    category: 'System Governance',
  },
  {
    id: 'VERIFY_NEW_USERS',
    label: 'Verify Registered Members',
    description: 'Authorize new employee self-registrations and grant statutory access tiers',
    category: 'System Governance',
  },
  {
    id: 'MANAGE_SERVICE_TYPES',
    label: 'Manage Statutory Service Offerings',
    description: 'Create, edit, price, and decommission consulting service catalog types (admin.master)',
    category: 'System Governance',
  },
  {
    id: 'MANAGE_DOCUMENT_TYPES',
    label: 'Manage Master Document Types Catalog',
    description: 'Configure required and optional statutory audit document types, codes, and categories (admin.master)',
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
    label: 'Upload Regulatory Files',
    description: 'Attach BOM spreadsheets, lab reports, company deeds, and invoices',
    category: 'Document Management',
  },
  {
    id: 'VERIFY_DOCUMENTS',
    label: 'Verify & Approve Documents',
    description: 'Mark uploaded files as verified or reject with auditor remarks',
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
    label: 'Export Audit Summary Files',
    description: 'Download PDF/Excel compliance packages for LVI submission',
    category: 'Technical & Audit',
  },
];

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  MASTER_ADMIN: [
    'MANAGE_USERS_ROLES',
    'VERIFY_NEW_USERS',
    'MANAGE_SERVICE_TYPES',
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
  DIRECTOR: [
    'MANAGE_USERS_ROLES',
    'VERIFY_NEW_USERS',
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
  MASTER_ADMIN: {
    title: 'Chief Role Master & System SuperAdmin',
    color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    desc: 'Supreme system authority. Verifies newly registered staff, audits statutory credentials, and manages master enterprise permissions.',
  },
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
    desc: 'TKDN calculation modeling, BOM breakdown, cost accounting, and technical file collation.',
  },
  SURVEYOR_LIAISON: {
    title: 'Regulatory & LVI Liaison',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    desc: 'LVI interface, OSS-RBA coordination, SIINas profile management, and regulatory compliance.',
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

export const RoleManagerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'pending' | 'users' | 'matrix' | 'roles';
}> = ({ isOpen, onClose, initialTab }) => {
  const {
    teamMembers,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changeMemberRole,
    verifyUser,
    rejectUser,
    pendingMembersCount,
    isMasterAdmin,
    roleDefinitions,
    roleGovernanceMeta,
    updateRolePositionTitle,
    updateRoleCapabilities,
    resetRolePositionTitles,
    resetRoleCapabilities,
    updateRoleGovernanceMeta,
    resetRoleGovernanceMeta,
  } = useProjects();

  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'matrix' | 'roles'>(
    initialTab || (pendingMembersCount > 0 ? 'pending' : 'users')
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (pendingMembersCount > 0 && activeTab !== 'matrix' && activeTab !== 'roles') {
      setActiveTab('pending');
    }
  }, [initialTab, isOpen]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Master Admin: Editing Role Capabilities / Permissions Modal state
  const [editingCapabilitiesRole, setEditingCapabilitiesRole] = useState<UserRole | null>(null);
  const [editingCapabilitiesPermissions, setEditingCapabilitiesPermissions] = useState<UserPermission[]>([]);
  const [capabilitiesSyncMembers, setCapabilitiesSyncMembers] = useState(true);

  // Master Admin: Editing Role Position Name Modal state
  const [editingRoleModal, setEditingRoleModal] = useState<UserRole | null>(null);
  const [editRoleFormTitle, setEditRoleFormTitle] = useState('');
  const [editRoleFormDept, setEditRoleFormDept] = useState('');
  const [editRoleFormDesc, setEditRoleFormDesc] = useState('');
  const [editRoleSyncExisting, setEditRoleSyncExisting] = useState(true);
  const [roleEditSuccessMsg, setRoleEditSuccessMsg] = useState<string | null>(null);

  // Master Admin: Editing Role & Position Governance Name & Description Modal state
  const [isEditingGovernanceModal, setIsEditingGovernanceModal] = useState(false);
  const [editGovTitle, setEditGovTitle] = useState('');
  const [editGovDesc, setEditGovDesc] = useState('');

  // Modal for add/edit user
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);

  // Modal for custom verification
  const [verifyingUserModal, setVerifyingUserModal] = useState<TeamMember | null>(null);
  const [verifyRole, setVerifyRole] = useState<UserRole>('TECHNICAL_CONSULTANT');
  const [verifyRoleTitle, setVerifyRoleTitle] = useState('');
  const [verifyDepartment, setVerifyDepartment] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('Identity and statutory credentials verified by Role Master.');
  const [verifyPermissions, setVerifyPermissions] = useState<UserPermission[]>([]);

  // Modal for Master Admin Role Reassignment
  const [reassigningUserModal, setReassigningUserModal] = useState<TeamMember | null>(null);
  const [reassignRole, setReassignRole] = useState<UserRole>('LEAD_CONSULTANT');
  const [reassignRoleTitle, setReassignRoleTitle] = useState('');
  const [reassignDepartment, setReassignDepartment] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [reassignPermissions, setReassignPermissions] = useState<UserPermission[]>([]);
  const [reassignFeedback, setReassignFeedback] = useState<string | null>(null);
  const [isQuickMemberPickerOpen, setIsQuickMemberPickerOpen] = useState(false);

  // Master Admin: Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);

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

  const pendingUsers = teamMembers.filter((u) => u.status === 'PENDING_VERIFICATION');
  const activeUsers = teamMembers.filter((u) => u.status === 'ACTIVE');
  const inactiveUsers = teamMembers.filter((u) => u.status === 'INACTIVE' || u.status === 'SUSPENDED');

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

  const handleOpenCustomVerify = (user: TeamMember) => {
    setVerifyingUserModal(user);
    setVerifyRole(user.role);
    setVerifyRoleTitle(user.roleTitle || ROLE_DETAILS[user.role]?.title || user.role);
    setVerifyDepartment(user.department || 'Technical & TKDN Calculations');
    setVerifyPermissions(user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role]);
    setVerifyNotes(`Statutory verification approved by ${currentUser.name} (${currentUser.roleTitle || currentUser.role})`);
  };

  const handleConfirmCustomVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) {
      alert('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can verify new members.');
      return;
    }
    if (!verifyingUserModal) return;
    verifyUser(verifyingUserModal.id, {
      role: verifyRole,
      roleTitle: verifyRoleTitle,
      department: verifyDepartment,
      permissions: verifyPermissions,
      notes: verifyNotes,
    });
    setVerifyingUserModal(null);
  };

  const handleFastVerify = (user: TeamMember) => {
    if (!isMasterAdmin) {
      alert('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can verify new members.');
      return;
    }
    verifyUser(user.id, {
      role: user.role,
      roleTitle: user.roleTitle,
      department: user.department,
      permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role],
      notes: `1-Click Instant Verification by Master Admin (${currentUser.name})`,
    });
  };

  const handleApproveAllPending = () => {
    if (!isMasterAdmin) {
      alert('Unauthorized: Only Master Admin (admin.master / Adryan kelvianto) can verify new members.');
      return;
    }
    if (confirm(`Approve and verify all ${pendingUsers.length} registered applicant(s)?`)) {
      pendingUsers.forEach((u) => {
        handleFastVerify(u);
      });
    }
  };

  const handleOpenReassignRole = (user: TeamMember) => {
    setReassigningUserModal(user);
    setReassignRole(user.role);
    setReassignRoleTitle(user.roleTitle || roleDefinitions[user.role]?.title || user.role);
    setReassignDepartment(user.department || roleDefinitions[user.role]?.department || 'Consulting Services');
    setReassignPermissions(user.permissions || roleDefinitions[user.role]?.defaultPermissions || ROLE_DEFAULT_PERMISSIONS[user.role]);
    setReassignNotes(`Role adjusted to ${user.role} by Master Admin (${currentUser.name})`);
  };

  const handleReassignRoleSelect = (newRole: UserRole) => {
    setReassignRole(newRole);
    setReassignRoleTitle(roleDefinitions[newRole]?.title || newRole);
    setReassignPermissions(roleDefinitions[newRole]?.defaultPermissions || ROLE_DEFAULT_PERMISSIONS[newRole]);
    if (roleDefinitions[newRole]?.department) {
      setReassignDepartment(roleDefinitions[newRole].department);
    } else if (newRole === 'MASTER_ADMIN') {
      setReassignDepartment('Central Compliance Governance & Board');
    } else if (newRole === 'DIRECTOR') {
      setReassignDepartment('Executive Board & TKDN Lead');
    } else if (newRole === 'LEAD_CONSULTANT') {
      setReassignDepartment('Industrial TKDN Assessment');
    } else if (newRole === 'TECHNICAL_CONSULTANT') {
      setReassignDepartment('Technical & TKDN Calculations');
    } else if (newRole === 'SURVEYOR_LIAISON') {
      setReassignDepartment('Sucofindo / SI Regulatory Liaison');
    } else if (newRole === 'FINANCE_OFFICER') {
      setReassignDepartment('Finance & Project Invoicing');
    } else if (newRole === 'CLIENT_VIEWER') {
      setReassignDepartment('Client Representative Office');
    }
  };

  const handleToggleReassignPermission = (perm: UserPermission) => {
    setReassignPermissions((prev) => {
      const exists = prev.includes(perm);
      return exists ? prev.filter((p) => p !== perm) : [...prev, perm];
    });
  };

  const handleConfirmReassignRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningUserModal) return;
    changeMemberRole(reassigningUserModal.id, reassignRole, {
      roleTitle: reassignRoleTitle,
      department: reassignDepartment,
      permissions: reassignPermissions,
      notes: reassignNotes || `Role reassigned to ${reassignRole} by ${currentUser.name}`,
    });
    setReassignFeedback(
      `Updated ${reassigningUserModal.name}'s role to "${ROLE_DETAILS[reassignRole]?.title || reassignRole}"!`
    );
    setTimeout(() => setReassignFeedback(null), 4000);
    setReassigningUserModal(null);
  };

  const handleQuickInlineRoleChange = (userId: string, newRole: UserRole) => {
    const targetUser = teamMembers.find((m) => m.id === userId);
    changeMemberRole(userId, newRole);
    setReassignFeedback(
      `Fast Role Switch: ${targetUser?.name || 'Member'} is now ${ROLE_DETAILS[newRole]?.title || newRole}.`
    );
    setTimeout(() => setReassignFeedback(null), 3500);
  };

  const handleRoleChangeInForm = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      roleTitle: ROLE_DETAILS[newRole]?.title || newRole,
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

    const cleanUsername = (formData.username || formData.email.split('@')[0]).toLowerCase().trim();
    if (!cleanUsername) {
      alert('Username is required.');
      return;
    }

    const specArray = formData.specialization
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingUser) {
      // Check if another user already has this username
      const usernameTaken = teamMembers.some(
        (m) => m.id !== editingUser.id && (m.username || '').toLowerCase() === cleanUsername
      );
      if (usernameTaken) {
        alert(`The username "@${cleanUsername}" is already taken by another account. Usernames must be unique.`);
        return;
      }

      updateUser(editingUser.id, {
        name: formData.name,
        username: cleanUsername,
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
      // Check if username is already registered and cannot be reused
      const usernameTaken = teamMembers.some(
        (m) => (m.username || '').toLowerCase() === cleanUsername
      );
      if (usernameTaken) {
        alert(`The username "@${cleanUsername}" is already registered. Usernames cannot be reused once registered.`);
        return;
      }

      try {
        addUser({
          name: formData.name,
          username: cleanUsername,
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
      } catch (err: any) {
        alert(err?.message || 'Failed to create user. Username may already be taken.');
        return;
      }
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
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 border border-amber-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Role Master Governance Dashboard</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Master Authority
                </span>
                {pendingUsers.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                    {pendingUsers.length} Awaiting Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Authorize registered members, audit statutory permissions, and manage enterprise RBAC access tiers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Direct Add</span>
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-slate-900" />
              <span>Verify Registrations</span>
              {pendingUsers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 font-mono text-[10px] font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>All Members ({teamMembers.length})</span>
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
                <option value="MASTER_ADMIN">Master Admin</option>
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
          {/* TAB 0: ROLE MASTER VERIFICATION DASHBOARD (PENDING REGISTRATIONS) */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              {/* Verification Queue Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Registrations</p>
                    <p className="text-2xl font-black text-amber-950 font-mono mt-1">{pendingUsers.length}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Require Role Master approval</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Verified Members</p>
                    <p className="text-2xl font-black text-emerald-950 font-mono mt-1">{activeUsers.length}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Fully authorized statutory consultants</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">Master Governance Tier</p>
                    <p className="text-2xl font-black text-purple-950 font-mono mt-1">
                      {teamMembers.filter((m) => m.role === 'MASTER_ADMIN' || m.role === 'DIRECTOR').length}
                    </p>
                    <p className="text-[11px] text-purple-700 mt-0.5">Executive SuperAdmins & Directors</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 text-white shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Statutory Member Verification Protocol</h3>
                    <p className="text-xs text-slate-300">
                      As the Role Master, verify identity credentials, adjust statutory permissions, and activate consultant login access.
                    </p>
                  </div>
                </div>

                {pendingUsers.length > 1 && (
                  <button
                    type="button"
                    onClick={handleApproveAllPending}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Batch Approve All ({pendingUsers.length})</span>
                  </button>
                )}
              </div>

              {/* Pending Queue List */}
              {pendingUsers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    All Member Registrations Are Verified
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                    There are no pending registrations awaiting review. When a new consultant or client representative signs up through the portal, their application will appear here for Master Admin authorization.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddUser}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Provision Staff Manually</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>View Active Consultant Roster</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Master Admin Authority Banner */}
                  {isMasterAdmin ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-400/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                          ★
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                              Supreme Master Admin Authority Active
                            </h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                              admin.master
                            </span>
                          </div>
                          <p className="text-xs text-amber-800/90 mt-0.5">
                            You are signed in as <span className="font-bold text-slate-900">Adryan kelvianto</span>. Only your account has statutory authority to accept, verify, customize, or reject registered applicants.
                          </p>
                        </div>
                      </div>
                      {pendingUsers.length > 1 && (
                        <button
                          type="button"
                          onClick={handleApproveAllPending}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <BadgeCheck className="w-4 h-4" />
                          <span>Approve All ({pendingUsers.length})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">
                              Restricted: Master Admin Verification Required
                            </h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 font-bold">
                              STATUTORY RULE
                            </span>
                          </div>
                          <p className="text-xs text-rose-700 mt-0.5">
                            Only <span className="font-bold text-slate-900">Adryan kelvianto (admin.master)</span> can accept or verify new member registrations. You are currently logged in as <span className="font-semibold">{currentUser.name}</span>.
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-rose-100 rounded-xl border border-rose-300 text-rose-800 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Master Admin Required</span>
                      </div>
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending Verification Applications ({pendingUsers.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {pendingUsers.map((user) => {
                      const roleMeta = ROLE_DETAILS[user.role] || ROLE_DETAILS.TECHNICAL_CONSULTANT;

                      return (
                        <div
                          key={user.id}
                          className="p-5 rounded-2xl bg-white border-2 border-amber-400/80 shadow-md transition-all hover:shadow-lg relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl font-mono flex items-center gap-1 shadow-xs">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting Master Admin Signoff</span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Left: Applicant Bio & Credentials */}
                            <div className="lg:col-span-7 flex items-start gap-4">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm shrink-0"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-base font-bold text-slate-900">{user.name}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.color}`}>
                                    Applied: {user.roleTitle || roleDefinitions[user.role]?.title || user.role.replace('_', ' ')}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 mt-0.5 font-medium">{user.roleTitle || user.role}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-2.5 text-xs text-slate-600">
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-mono text-[11px] truncate">{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-mono text-[11px]">{user.phone || 'No phone'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{user.department || 'Consulting'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-mono text-[11px]">PIN: {user.pin || '1234'}</span>
                                  </div>
                                </div>

                                {user.specialization && user.specialization.length > 0 && (
                                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Expertise:</span>
                                    {user.specialization.map((spec, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                      >
                                        {spec}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Submitted registration: {user.registeredAt || 'Recently'}</span>
                                </p>
                              </div>
                            </div>

                            {/* Right: Master Verification Actions */}
                            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/80 gap-3">
                              <div>
                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Master Admin Approval</span>
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {isMasterAdmin
                                    ? 'Approving will activate credentials and grant statutory access. Only admin.master holds this authority.'
                                    : 'Only Master Admin (Adryan kelvianto / admin.master) is authorized to approve or reject this applicant.'}
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-200">
                                {isMasterAdmin ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleFastVerify(user)}
                                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <BadgeCheck className="w-4 h-4" />
                                      <span>Verify & Activate</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenCustomVerify(user)}
                                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                      title="Adjust permissions or role before approving"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Customize</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setUserToDelete(user)}
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                                      title="Reject & Delete Application (admin_master)"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>Requires admin.master approval</span>
                                    </span>
                                    <span className="text-[10px] text-amber-800 font-bold bg-amber-200/70 px-2 py-0.5 rounded">
                                      Locked
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verification Audit Log / Active Governance Stats */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" />
                    <span>Statutory Access Governance Policy (Verix Industrial ERP)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">ISO 9001 / Permenperin 16/2011</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-900 mb-0.5">Strict Identity Auditing</p>
                    <p className="text-[11px] text-slate-500">Every new registrant requires Role Master sign-off before entering project workspaces.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-900 mb-0.5">Granular RBAC Enforced</p>
                    <p className="text-[11px] text-slate-500">Milestone signoffs and TKDN calculations are restricted to certified assessors.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-900 mb-0.5">Direct Session Switching</p>
                    <p className="text-[11px] text-slate-500">Role Masters can instantly switch perspectives to test access boundaries across all roles.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Master Admin Executive Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-2 border-amber-500/60 shadow-lg text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          Master Admin Role Governance Console
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold uppercase font-mono">
                          FULL AUTHORITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Logged in as <strong className="text-amber-300">{currentUser.name}</strong>. You have supreme statutory authority to change, promote, demote, and reassign roles & permissions for all enterprise members.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const firstNonCurrent = teamMembers.find((m) => m.id !== currentUser.id) || teamMembers[0];
                        if (firstNonCurrent) handleOpenReassignRole(firstNonCurrent);
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Reassign Member Role</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback toast if role reassigned */}
              {reassignFeedback && (
                <div className="p-3 px-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reassignFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReassignFeedback(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((user) => {
                  const roleMeta = ROLE_DETAILS[user.role] || ROLE_DETAILS.TECHNICAL_CONSULTANT;
                  const isCurrent = currentUser.id === user.id;
                  const isPending = user.status === 'PENDING_VERIFICATION';
                  const isMaster = user.role === 'MASTER_ADMIN';

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl transition-all ${
                        isMaster
                          ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 border-2 border-amber-400 shadow-md ring-1 ring-amber-400/20'
                          : isPending
                          ? 'bg-amber-50/20 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                          : isCurrent
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {isMaster && (
                        <div className="mb-3 p-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[11px] flex items-center justify-between shadow-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs">★</span>
                            <span>Gold-Bordered Executive Master Account</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 text-[9px] font-mono tracking-wide">
                            SUPREME AUTHORITY
                          </span>
                        </div>
                      )}

                      {isPending && (
                        <div className="mb-2 p-1.5 px-2.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Pending Role Master Verification</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFastVerify(user)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Verify Now
                          </button>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className={`w-12 h-12 rounded-full object-cover shrink-0 ${
                                isMaster
                                  ? 'border-2 border-amber-400 ring-2 ring-amber-400/40'
                                  : 'border-2 border-slate-100'
                              }`}
                            />
                            {isMaster && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-md ring-1 ring-slate-900">
                                ★
                              </span>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                user.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : isPending
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                              {isMaster && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 border border-amber-300 font-mono">
                                  MASTER ADMIN
                                </span>
                              )}
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
                            title="Reassign Role & Permissions"
                            onClick={() => handleOpenReassignRole(user)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Edit User Profile"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title={user.status === 'ACTIVE' ? 'Suspend / Deactivate' : 'Activate User'}
                            onClick={() => toggleUserStatus(user.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
                          {isMasterAdmin && (
                            <button
                              type="button"
                              title={
                                user.id === currentUser.id
                                  ? 'Cannot delete active session account'
                                  : `Delete User: ${user.name} (Master Admin RBAC)`
                              }
                              disabled={user.id === currentUser.id}
                              onClick={() => setUserToDelete(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.id === currentUser.id
                                  ? 'text-slate-300 opacity-40 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Instant Role Change Selector for Master Admin */}
                      <div className="mb-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <label htmlFor={`role-select-${user.id}`} className="text-[10px] font-bold uppercase text-slate-600 shrink-0">
                            Role:
                          </label>
                          <select
                            id={`role-select-${user.id}`}
                            value={user.role}
                            onChange={(e) => handleQuickInlineRoleChange(user.id, e.target.value as UserRole)}
                            className="text-xs font-bold py-1 px-2 rounded-lg bg-white border border-slate-300 text-slate-900 w-full focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                          >
                            <option value="MASTER_ADMIN">Master Admin (SuperAdmin)</option>
                            <option value="DIRECTOR">Director (Managing Partner)</option>
                            <option value="LEAD_CONSULTANT">Lead Consultant (Assessor)</option>
                            <option value="TECHNICAL_CONSULTANT">Technical Consultant (Specialist)</option>
                            <option value="SURVEYOR_LIAISON">Surveyor Liaison (Sucofindo)</option>
                            <option value="FINANCE_OFFICER">Finance Officer (Billing)</option>
                            <option value="CLIENT_VIEWER">Client Viewer (External)</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenReassignRole(user)}
                          title="Open Custom Role & Permission Matrix"
                          className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold border border-amber-300 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-amber-700" />
                          <span>Custom</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Department:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">{user.department || 'Consulting'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Role Badge:</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.color}`}
                          >
                            {user.roleTitle || roleDefinitions[user.role]?.title || user.role.replace('_', ' ')}
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Standard Role Permission Matrix</h3>
                    {isMasterAdmin && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                        Interactive RBAC Matrix
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live cross-comparison of statutory capabilities and permissions. Master Admin can modify capability grants per role.
                  </p>
                </div>
                {isMasterAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset ALL role capabilities and default permissions across all roles back to system standards?')) {
                        resetRoleCapabilities();
                        setRoleEditSuccessMsg('All role capabilities have been restored to system factory standards.');
                        setTimeout(() => setRoleEditSuccessMsg(null), 3500);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer shrink-0"
                  >
                    Reset All Capabilities
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-3 font-bold">Statutory Capability / Action</th>
                      <th className="p-3 font-bold text-center bg-amber-50 text-amber-900 truncate max-w-[130px]" title={roleDefinitions.MASTER_ADMIN.title}>
                        <div className="truncate">{roleDefinitions.MASTER_ADMIN.title.split('&')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('MASTER_ADMIN');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.MASTER_ADMIN.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-amber-700 underline block mx-auto hover:text-amber-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                      <th className="p-3 font-bold text-center truncate max-w-[130px]" title={roleDefinitions.DIRECTOR.title}>
                        <div className="truncate">{roleDefinitions.DIRECTOR.title.split('/')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('DIRECTOR');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.DIRECTOR.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-purple-700 underline block mx-auto hover:text-purple-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                      <th className="p-3 font-bold text-center truncate max-w-[130px]" title={roleDefinitions.LEAD_CONSULTANT.title}>
                        <div className="truncate">{roleDefinitions.LEAD_CONSULTANT.title.split('/')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('LEAD_CONSULTANT');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.LEAD_CONSULTANT.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-blue-700 underline block mx-auto hover:text-blue-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                      <th className="p-3 font-bold text-center truncate max-w-[130px]" title={roleDefinitions.TECHNICAL_CONSULTANT.title}>
                        <div className="truncate">{roleDefinitions.TECHNICAL_CONSULTANT.title.split('/')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('TECHNICAL_CONSULTANT');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.TECHNICAL_CONSULTANT.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-emerald-700 underline block mx-auto hover:text-emerald-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                      <th className="p-3 font-bold text-center truncate max-w-[130px]" title={roleDefinitions.SURVEYOR_LIAISON.title}>
                        <div className="truncate">{roleDefinitions.SURVEYOR_LIAISON.title.split('&')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('SURVEYOR_LIAISON');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.SURVEYOR_LIAISON.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-amber-700 underline block mx-auto hover:text-amber-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                      <th className="p-3 font-bold text-center truncate max-w-[130px]" title={roleDefinitions.FINANCE_OFFICER.title}>
                        <div className="truncate">{roleDefinitions.FINANCE_OFFICER.title.split('/')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('FINANCE_OFFICER');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.FINANCE_OFFICER.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-teal-700 underline block mx-auto hover:text-teal-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                      <th className="p-3 font-bold text-center truncate max-w-[130px]" title={roleDefinitions.CLIENT_VIEWER.title}>
                        <div className="truncate">{roleDefinitions.CLIENT_VIEWER.title.split('(')[0].trim()}</div>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapabilitiesRole('CLIENT_VIEWER');
                              setEditingCapabilitiesPermissions([...(roleDefinitions.CLIENT_VIEWER.defaultPermissions || [])]);
                              setCapabilitiesSyncMembers(true);
                            }}
                            className="mt-1 text-[10px] font-bold text-slate-700 underline block mx-auto hover:text-slate-950 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ALL_PERMISSIONS.map((perm) => (
                      <tr key={perm.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{perm.label}</div>
                          <div className="text-[11px] text-slate-500">{perm.description}</div>
                        </td>
                        <td className="p-3 text-center bg-amber-50/50">
                          {(roleDefinitions.MASTER_ADMIN?.defaultPermissions || []).includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(roleDefinitions.DIRECTOR?.defaultPermissions || []).includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(roleDefinitions.LEAD_CONSULTANT?.defaultPermissions || []).includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(roleDefinitions.TECHNICAL_CONSULTANT?.defaultPermissions || []).includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(roleDefinitions.SURVEYOR_LIAISON?.defaultPermissions || []).includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(roleDefinitions.FINANCE_OFFICER?.defaultPermissions || []).includes(perm.id) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(roleDefinitions.CLIENT_VIEWER?.defaultPermissions || []).includes(perm.id) ? (
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
              {/* Role Master Banner & Actions */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        {roleGovernanceMeta.title || 'Role & Position Governance'}
                      </h3>
                      {isMasterAdmin && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          Master Admin Authority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {roleGovernanceMeta.desc || 'Customize statutory role position titles, department descriptions, and organizational titles across the enterprise.'}
                    </p>
                  </div>
                </div>

                {isMasterAdmin && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditGovTitle(roleGovernanceMeta.title);
                        setEditGovDesc(roleGovernanceMeta.desc);
                        setIsEditingGovernanceModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      title="Edit Governance Name & Description"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>Edit Governance Title & Desc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reset role governance titles & position names back to factory default?')) {
                          resetRoleGovernanceMeta();
                          resetRolePositionTitles();
                          setRoleEditSuccessMsg('Role Governance title, description and position names reset to system default.');
                          setTimeout(() => setRoleEditSuccessMsg(null), 3500);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      Reset Defaults
                    </button>
                  </div>
                )}
              </div>

              {roleEditSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{roleEditSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(roleDefinitions) as UserRole[]).map((roleKey) => {
                  const role = roleDefinitions[roleKey] || ROLE_DETAILS[roleKey];
                  const userCount = teamMembers.filter((m) => m.role === roleKey).length;
                  const perms = role.defaultPermissions || ROLE_DEFAULT_PERMISSIONS[roleKey] || [];

                  return (
                    <div
                      key={roleKey}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${role.color || ROLE_DETAILS[roleKey]?.color}`}
                          >
                            {role.title || roleKey.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {userCount} {userCount === 1 ? 'member' : 'members'}
                            </span>
                            {isMasterAdmin && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCapabilitiesRole(roleKey);
                                    setEditingCapabilitiesPermissions([...perms]);
                                    setCapabilitiesSyncMembers(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Edit role capabilities and permissions"
                                >
                                  <ShieldCheck className="w-3 h-3 text-indigo-700" />
                                  <span>Edit Capabilities</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRoleModal(roleKey);
                                    setEditRoleFormTitle(role.title);
                                    setEditRoleFormDept(role.department || '');
                                    setEditRoleFormDesc(role.desc || '');
                                    setEditRoleSyncExisting(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Change Role Position Name & Department"
                                >
                                  <Edit2 className="w-3 h-3 text-amber-700" />
                                  <span>Edit Title</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{role.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">({roleKey})</span>
                          </div>
                          {role.department && (
                            <p className="text-[11px] text-amber-800 font-medium">{role.department}</p>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">{role.desc}</p>

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

                        {/* Assigned Members Section */}
                        {userCount > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                              Assigned Members ({userCount})
                            </span>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                              {teamMembers
                                .filter((m) => m.role === roleKey)
                                .map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-5 h-5 rounded-full object-cover shrink-0"
                                      />
                                      <span className="font-semibold text-slate-800 truncate">
                                        {member.name}
                                      </span>
                                      {member.id === currentUser.id && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold font-mono">
                                          YOU
                                        </span>
                                      )}
                                    </div>
                                    {isMasterAdmin && member.id !== currentUser.id && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          title={`Delete ${member.name}`}
                                          onClick={() => setUserToDelete(member)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
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
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Currently logged in as: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Close Dashboard
          </button>
        </div>
      </div>

      {/* CUSTOM VERIFICATION SUB-MODAL */}
      {verifyingUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Authorize Member: {verifyingUserModal.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure role assignment and statutory verification signoff.</p>
                </div>
              </div>
              <button
                onClick={() => setVerifyingUserModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCustomVerify} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <img
                  src={verifyingUserModal.avatar}
                  alt={verifyingUserModal.name}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">{verifyingUserModal.name}</p>
                  <p className="text-[11px] text-slate-600 font-mono">@{verifyingUserModal.username || verifyingUserModal.email.split('@')[0]}</p>
                  <p className="text-[11px] text-slate-500 truncate">{verifyingUserModal.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Statutory Role</label>
                <select
                  value={verifyRole}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setVerifyRole(newRole);
                    setVerifyRoleTitle(ROLE_DETAILS[newRole]?.title || newRole);
                    setVerifyPermissions(ROLE_DEFAULT_PERMISSIONS[newRole]);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-hidden focus:border-amber-500"
                >
                  <option value="MASTER_ADMIN">MASTER_ADMIN (Role Master & SuperAdmin)</option>
                  <option value="DIRECTOR">DIRECTOR (Managing Partner)</option>
                  <option value="LEAD_CONSULTANT">LEAD_CONSULTANT (Lead Assessor)</option>
                  <option value="TECHNICAL_CONSULTANT">TECHNICAL_CONSULTANT (BOM Specialist)</option>
                  <option value="SURVEYOR_LIAISON">SURVEYOR_LIAISON (Sucofindo / SI)</option>
                  <option value="FINANCE_OFFICER">FINANCE_OFFICER (Billing Controller)</option>
                  <option value="CLIENT_VIEWER">CLIENT_VIEWER (Client Representative)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={verifyRoleTitle}
                    onChange={(e) => setVerifyRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={verifyDepartment}
                    onChange={(e) => setVerifyDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Master Verification Notes</label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Granted Statutory Permissions ({verifyPermissions.length} Active)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = verifyPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setVerifyPermissions((prev) =>
                              prev.includes(perm.id) ? prev.filter((p) => p !== perm.id) : [...prev, perm.id]
                            );
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-slate-800 truncate">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setVerifyingUserModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>Verify & Grant Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <option value="MASTER_ADMIN">MASTER_ADMIN (Role Master & SuperAdmin)</option>
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

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {isMasterAdmin && editingUser && editingUser.id !== currentUser.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      const userToDel = editingUser;
                      setIsEditUserOpen(false);
                      setUserToDelete(userToDel);
                    }}
                    className="px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User Account</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditUserOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingUser ? 'Save Account Changes' : 'Create Account'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASTER ADMIN REASSIGN ROLE MODAL */}
      {reassigningUserModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-400/80 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Master Admin Role Governance
                  </h3>
                  <p className="text-[11px] text-amber-300">
                    Reassign role & permissions for <strong className="text-white">{reassigningUserModal.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReassigningUserModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReassignRole} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300/80 flex items-center gap-3">
                <img
                  src={reassigningUserModal.avatar}
                  alt={reassigningUserModal.name}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-400 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{reassigningUserModal.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold font-mono">
                      Current: {reassigningUserModal.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">@{reassigningUserModal.username || reassigningUserModal.email.split('@')[0]}</p>
                  <p className="text-[11px] text-slate-500 truncate">{reassigningUserModal.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select New Statutory Role Target:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      'MASTER_ADMIN',
                      'DIRECTOR',
                      'LEAD_CONSULTANT',
                      'TECHNICAL_CONSULTANT',
                      'SURVEYOR_LIAISON',
                      'FINANCE_OFFICER',
                      'CLIENT_VIEWER',
                    ] as UserRole[]
                  ).map((roleKey) => {
                    const isSelected = reassignRole === roleKey;
                    const rMeta = ROLE_DETAILS[roleKey];
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleReassignRoleSelect(roleKey)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-2 border-amber-500 shadow-xs ring-2 ring-amber-400/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{roleDefinitions[roleKey]?.title || roleKey.replace('_', ' ')}</span>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{rMeta?.title || roleKey}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Title Override</label>
                  <input
                    type="text"
                    value={reassignRoleTitle}
                    onChange={(e) => setReassignRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={reassignDepartment}
                    onChange={(e) => setReassignDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Log / Reassignment Note</label>
                <textarea
                  rows={2}
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  placeholder="Reason for role change..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              {/* Granted Permissions */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Granted Statutory Permissions ({reassignPermissions.length} Active)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = reassignPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleReassignPermission(perm.id)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-slate-800 truncate">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {isMasterAdmin && reassigningUserModal && reassigningUserModal.id !== currentUser.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      const userToDel = reassigningUserModal;
                      setReassigningUserModal(null);
                      setUserToDelete(userToDel);
                    }}
                    className="px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReassigningUserModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Commit Role Change</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASTER ADMIN EDIT ROLE POSITION NAME MODAL */}
      {editingRoleModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-400/90 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Edit Role Position Title & Profile
                  </h3>
                  <p className="text-[11px] text-amber-300">
                    System Key: <code className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">{editingRoleModal}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoleModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editRoleFormTitle.trim()) {
                  alert('Role title cannot be empty.');
                  return;
                }
                updateRolePositionTitle(
                  editingRoleModal,
                  {
                    title: editRoleFormTitle,
                    department: editRoleFormDept,
                    desc: editRoleFormDesc,
                  },
                  editRoleSyncExisting
                );
                setRoleEditSuccessMsg(`Position name for ${editingRoleModal} updated to "${editRoleFormTitle.trim()}".`);
                setEditingRoleModal(null);
                setTimeout(() => setRoleEditSuccessMsg(null), 4000);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Master Admin Governance</p>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Modifying this title updates the statutory position designation across all consulting files, disposition headers, and team profile cards.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Official Position / Title Name *
                </label>
                <input
                  type="text"
                  required
                  value={editRoleFormTitle}
                  onChange={(e) => setEditRoleFormTitle(e.target.value)}
                  placeholder="e.g. Lead Assessor / Senior TKDN Specialist"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Primary Department / Directorate
                </label>
                <input
                  type="text"
                  value={editRoleFormDept}
                  onChange={(e) => setEditRoleFormDept(e.target.value)}
                  placeholder="e.g. Statutory Verification & Consulting"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Statutory Role Description / Purpose
                </label>
                <textarea
                  rows={3}
                  value={editRoleFormDesc}
                  onChange={(e) => setEditRoleFormDesc(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this role..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white resize-none transition-all"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={editRoleSyncExisting}
                    onChange={(e) => setEditRoleSyncExisting(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Synchronize to all current {roleDefinitions[editingRoleModal]?.title || editingRoleModal.replace('_', ' ')} members
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Automatically updates the job title and department on existing member profiles assigned to this role.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRoleModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Save Position Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASTER ADMIN EDIT ROLE CAPABILITIES & PERMISSIONS MODAL */}
      {editingCapabilitiesRole && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-400/90 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-indigo-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Edit Role Capabilities & Statutory Permissions
                  </h3>
                  <p className="text-[11px] text-indigo-300">
                    Role: <span className="font-bold text-white uppercase">{roleDefinitions[editingCapabilitiesRole]?.title || editingCapabilitiesRole.replace('_', ' ')}</span> &bull; Master Admin RBAC Authority
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCapabilitiesRole(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const result = updateRoleCapabilities(
                  editingCapabilitiesRole,
                  editingCapabilitiesPermissions,
                  capabilitiesSyncMembers
                );
                if (result.success) {
                  setRoleEditSuccessMsg(
                    `Statutory capabilities for "${roleDefinitions[editingCapabilitiesRole]?.title || editingCapabilitiesRole}" updated successfully (${editingCapabilitiesPermissions.length} permissions active).`
                  );
                  setEditingCapabilitiesRole(null);
                  setTimeout(() => setRoleEditSuccessMsg(null), 4000);
                } else {
                  alert(result.message || 'Failed to update capabilities');
                }
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Configuring capabilities for: {roleDefinitions[editingCapabilitiesRole]?.title}
                  </p>
                  <p className="text-[11px] text-indigo-900 mt-0.5">
                    Modifying capabilities here updates the default statutory permissions for this role and can synchronize across all active members assigned to this role.
                  </p>
                </div>
              </div>

              {/* Quick Preset / Filter buttons */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Active Capabilities: {editingCapabilitiesPermissions.length} / {ALL_PERMISSIONS.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCapabilitiesPermissions(ALL_PERMISSIONS.map((p) => p.id));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCapabilitiesPermissions([]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = ROLE_DEFAULT_PERMISSIONS[editingCapabilitiesRole] || [];
                      setEditingCapabilitiesPermissions([...defaults]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Reset Role Defaults
                  </button>
                </div>
              </div>

              {/* Permission Categories Accordion / Checkboxes */}
              {Array.from(new Set(ALL_PERMISSIONS.map((p) => p.category))).map((cat) => {
                const categoryPerms = ALL_PERMISSIONS.filter((p) => p.category === cat);
                const allSelected = categoryPerms.every((p) => editingCapabilitiesPermissions.includes(p.id));

                return (
                  <div key={cat} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {cat}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            setEditingCapabilitiesPermissions((prev) =>
                              prev.filter((p) => !categoryPerms.some((cp) => cp.id === p))
                            );
                          } else {
                            const toAdd = categoryPerms.map((cp) => cp.id);
                            setEditingCapabilitiesPermissions((prev) =>
                              Array.from(new Set([...prev, ...toAdd]))
                            );
                          }
                        }}
                        className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
                      >
                        {allSelected ? 'Deselect Category' : 'Select All in Category'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {categoryPerms.map((p) => {
                        const isChecked = editingCapabilitiesPermissions.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50/60 border-indigo-300 text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingCapabilitiesPermissions((prev) => [...prev, p.id]);
                                } else {
                                  setEditingCapabilitiesPermissions((prev) =>
                                    prev.filter((item) => item !== p.id)
                                  );
                                }
                              }}
                              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs block text-slate-900">
                                {p.label}
                              </span>
                              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                {p.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Sync existing members option */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={capabilitiesSyncMembers}
                    onChange={(e) => setCapabilitiesSyncMembers(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Synchronize updated capabilities to all current {roleDefinitions[editingCapabilitiesRole]?.title || editingCapabilitiesRole.replace('_', ' ')} members
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      Instantly updates the live permissions array of {teamMembers.filter((m) => m.role === editingCapabilitiesRole).length} existing team member(s) with this role.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const defaults = ROLE_DEFAULT_PERMISSIONS[editingCapabilitiesRole] || [];
                    setEditingCapabilitiesPermissions([...defaults]);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Restore System Default Capabilities
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCapabilitiesRole(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Save Role Capabilities</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASTER ADMIN EDIT ROLE & POSITION GOVERNANCE NAME & DESCRIPTION MODAL */}
      {isEditingGovernanceModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-400/90 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Edit Role & Position Governance Header
                  </h3>
                  <p className="text-[11px] text-amber-300">
                    Master Admin Statutory Customization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingGovernanceModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editGovTitle.trim()) {
                  alert('Governance Section Name cannot be empty.');
                  return;
                }
                updateRoleGovernanceMeta({
                  title: editGovTitle.trim(),
                  desc: editGovDesc.trim(),
                });
                setRoleEditSuccessMsg(`Governance header updated to "${editGovTitle.trim()}".`);
                setIsEditingGovernanceModal(false);
                setTimeout(() => setRoleEditSuccessMsg(null), 4000);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Role Master Governance System</p>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Customize the primary title and operational description of the Role & Position Governance module. This will be preserved in enterprise storage.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Governance Section Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={editGovTitle}
                  onChange={(e) => setEditGovTitle(e.target.value)}
                  placeholder="e.g. Role & Position Governance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Governance Section Description
                </label>
                <textarea
                  rows={3}
                  value={editGovDesc}
                  onChange={(e) => setEditGovDesc(e.target.value)}
                  placeholder="Describe the governance authority, regulatory rules, and position customization policies..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditGovTitle(DEFAULT_ROLE_GOVERNANCE_META.title);
                    setEditGovDesc(DEFAULT_ROLE_GOVERNANCE_META.desc);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Restore Default Text
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingGovernanceModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Save Governance Header</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASTER ADMIN DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-500/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-rose-950 text-white flex items-center justify-between border-b border-rose-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/30">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Delete User Account from RBAC
                  </h3>
                  <p className="text-[11px] text-rose-300">
                    Master Admin Statutory Account Purge &bull; Permenperin 16/2011 RBAC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-rose-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* User Bio Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                <img
                  src={userToDelete.avatar}
                  alt={userToDelete.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-rose-300 shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900">{userToDelete.name}</h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        ROLE_DETAILS[userToDelete.role]?.color || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {userToDelete.roleTitle || roleDefinitions[userToDelete.role]?.title || userToDelete.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {userToDelete.roleTitle || userToDelete.role}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 mt-2 text-[11px] text-slate-500 font-mono">
                    <span className="truncate">@{userToDelete.username || userToDelete.email.split('@')[0]}</span>
                    <span className="truncate">{userToDelete.email}</span>
                    <span>Dept: {userToDelete.department || 'Consulting'}</span>
                    <span>PIN: {userToDelete.pin || '1234'}</span>
                  </div>
                </div>
              </div>

              {/* Danger Warning Box */}
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-900">
                    Are you sure you want to permanently delete this user?
                  </p>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    This statutory action is irreversible. All RBAC credentials, session privileges, and assigned permissions for <strong className="text-rose-950">{userToDelete.name}</strong> will be purged immediately from the system.
                  </p>
                </div>
              </div>

              {userToDelete.id === currentUser.id ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Cannot delete the active logged-in user. Switch accounts first.</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const deletedName = userToDelete.name;
                      const res = deleteUser(userToDelete.id);
                      setUserToDelete(null);
                      if (res.success) {
                        setReassignFeedback(`User "${deletedName}" was successfully removed from RBAC.`);
                        setTimeout(() => setReassignFeedback(null), 4000);
                      }
                    }}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Confirm Permanent Deletion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
