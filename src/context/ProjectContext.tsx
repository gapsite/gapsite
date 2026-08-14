import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ConsultingProject,
  JobDisposition,
  TeamMember,
  ProjectDocument,
  ProjectActivity,
  TkdnCostBreakdown,
  ServiceType,
  ProjectStage,
  ProjectStatus,
  Priority,
  SurveyorBody,
  FinancialTransaction,
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_DISPOSITIONS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';

interface FilterState {
  searchQuery: string;
  serviceType: ServiceType | 'ALL';
  stage: ProjectStage | 'ALL';
  status: ProjectStatus | 'ALL';
  priority: Priority | 'ALL';
  surveyor: SurveyorBody | 'ALL';
  leadConsultantId: string | 'ALL';
}

interface ProjectContextType {
  projects: ConsultingProject[];
  dispositions: JobDisposition[];
  teamMembers: TeamMember[];
  transactions: FinancialTransaction[];
  currentUser: TeamMember;
  setCurrentUser: (member: TeamMember) => void;
  
  // Auth & Session
  isAuthenticated: boolean;
  login: (identifier: string, pinOrPassword?: string) => { success: boolean; message?: string };
  logout: () => void;
  quickSwitchUser: (userId: string) => void;
  
  // Role & Permissions Helper
  hasPermission: (permission: import('../types').UserPermission) => boolean;
  isRole: (...roles: import('../types').UserRole[]) => boolean;
  
  // User Management
  addUser: (user: Omit<TeamMember, 'id'>) => TeamMember;
  updateUser: (id: string, updates: Partial<TeamMember>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredProjects: ConsultingProject[];
  
  // Selected Project for detail modal / drawer
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedProject: ConsultingProject | null;
  
  // Project Actions
  addProject: (project: Omit<ConsultingProject, 'id' | 'code' | 'documents' | 'activities' | 'progressPercentage'>) => ConsultingProject;
  updateProject: (id: string, updates: Partial<ConsultingProject>) => void;
  deleteProject: (id: string) => void;
  changeProjectStage: (id: string, newStage: ProjectStage) => void;
  
  // Disposition Actions
  addDisposition: (disp: Omit<JobDisposition, 'id' | 'assignedDate'>) => JobDisposition;
  updateDisposition: (id: string, updates: Partial<JobDisposition>) => void;
  deleteDisposition: (id: string) => void;
  toggleChecklistItem: (dispositionId: string, checklistId: string) => void;
  
  // Document Actions
  uploadDocument: (projectId: string, doc: Omit<ProjectDocument, 'id' | 'uploadDate' | 'version'> & { version?: string }) => void;
  updateDocumentStatus: (projectId: string, docId: string, status: ProjectDocument['status'], reviewNotes?: string) => void;
  deleteDocument: (projectId: string, docId: string) => void;
  
  // Activity Action
  addActivity: (
    projectId: string,
    action: string,
    details: string,
    type?: ProjectActivity['type'],
    metadata?: ProjectActivity['metadata']
  ) => void;

  // Financial Transaction Actions
  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'transactionNumber' | 'createdAt'>) => FinancialTransaction;
  updateTransaction: (id: string, updates: Partial<FinancialTransaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Milestone & Dynamic Checklist Actions
  toggleMilestoneManualSignoff: (
    projectId: string,
    milestoneId: string,
    completed: boolean,
    notes?: string
  ) => void;
  addCustomMilestoneToProject: (
    projectId: string,
    milestone: {
      title: string;
      description: string;
      stage: ProjectStage;
      regulatoryClause?: string;
      requiredDocTypes: ProjectDocument['type'][];
    }
  ) => void;

  // Quick TKDN Calculator Helper
  calculateTkdnScore: (breakdown: TkdnCostBreakdown) => {
    tkdnPercentage: number;
    kdnTotal: number;
    grandTotal: number;
    materialTkdn: number;
    laborTkdn: number;
    overheadTkdn: number;
  };
}

const STORAGE_KEY_PROJECTS = 'verix_crm_projects_v1';
const STORAGE_KEY_DISPOSITIONS = 'verix_crm_dispositions_v1';
const STORAGE_KEY_MEMBERS = 'verix_crm_team_members_v1';
const STORAGE_KEY_TRANSACTIONS = 'verix_crm_transactions_v1';
const STORAGE_KEY_CURRENT_USER_ID = 'verix_crm_current_user_id_v1';
const STORAGE_KEY_AUTH_STATE = 'verix_crm_auth_state_v1';

const defaultFilters: FilterState = {
  searchQuery: '',
  serviceType: 'ALL',
  stage: 'ALL',
  status: 'ALL',
  priority: 'ALL',
  surveyor: 'ALL',
  leadConsultantId: 'ALL',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ConsultingProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [dispositions, setDispositions] = useState<JobDisposition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISPOSITIONS);
      return saved ? JSON.parse(saved) : INITIAL_DISPOSITIONS;
    } catch {
      return INITIAL_DISPOSITIONS;
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
    } catch {
      return INITIAL_TEAM_MEMBERS;
    }
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_STATE);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [currentUser, setCurrentUser] = useState<TeamMember>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      if (savedId) {
        const found = teamMembers.find((m) => m.id === savedId);
        if (found) return found;
      }
      return INITIAL_TEAM_MEMBERS[0];
    } catch {
      return INITIAL_TEAM_MEMBERS[0];
    }
  });

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISPOSITIONS, JSON.stringify(dispositions));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [dispositions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(teamMembers));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, currentUser.id);
      localStorage.setItem(STORAGE_KEY_AUTH_STATE, JSON.stringify(isAuthenticated));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [currentUser, isAuthenticated]);

  // Auth Functions
  const login = (identifier: string, pinOrPassword?: string): { success: boolean; message?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const foundUser = teamMembers.find(
      (m) =>
        m.username?.toLowerCase() === cleanId ||
        m.email.toLowerCase() === cleanId ||
        m.name.toLowerCase().includes(cleanId)
    );

    if (!foundUser) {
      return { success: false, message: 'User account not found. Please check username or email.' };
    }

    if (foundUser.status === 'SUSPENDED' || foundUser.status === 'INACTIVE') {
      return { success: false, message: `Account is currently ${foundUser.status.toLowerCase()}. Please contact the Managing Director.` };
    }

    // Check PIN if set and provided
    if (foundUser.pin && pinOrPassword && foundUser.pin !== pinOrPassword.trim()) {
      return { success: false, message: 'Incorrect PIN or password. Default sample PIN is available in the quick-select.' };
    }

    const updatedUser = {
      ...foundUser,
      lastLoginAt: 'Just now',
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);

    // Update lastLogin in team members
    setTeamMembers((prev) => prev.map((m) => (m.id === foundUser.id ? updatedUser : m)));

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const quickSwitchUser = (userId: string) => {
    const user = teamMembers.find((m) => m.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  // Permission Checks
  const hasPermission = (permission: import('../types').UserPermission): boolean => {
    if (!isAuthenticated) return false;
    if (currentUser.role === 'DIRECTOR') return true;
    return currentUser.permissions ? currentUser.permissions.includes(permission) : false;
  };

  const isRole = (...roles: import('../types').UserRole[]): boolean => {
    if (!isAuthenticated) return false;
    return roles.includes(currentUser.role);
  };

  // User Management
  const addUser = (userData: Omit<TeamMember, 'id'>): TeamMember => {
    const newId = `usr-${Date.now()}`;
    const newUser: TeamMember = {
      ...userData,
      id: newId,
      status: userData.status || 'ACTIVE',
      lastLoginAt: 'Never',
    };
    setTeamMembers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        if (currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
  };

  const deleteUser = (id: string) => {
    if (currentUser.id === id) {
      alert('Cannot delete the currently active user.');
      return;
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const updated = { ...m, status: newStatus as 'ACTIVE' | 'INACTIVE' };
        if (currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
  };

  const resetFilters = () => setFilters(defaultFilters);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchClient = p.clientName.toLowerCase().includes(q);
        const matchProduct = p.productOrServiceName.toLowerCase().includes(q);
        const matchKbli = p.kbliCode.toLowerCase().includes(q);
        const matchLead = p.leadConsultantName.toLowerCase().includes(q);
        const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCode && !matchClient && !matchProduct && !matchKbli && !matchLead && !matchTags) {
          return false;
        }
      }
      // Service Type
      if (filters.serviceType !== 'ALL' && p.serviceType !== filters.serviceType) {
        return false;
      }
      // Stage
      if (filters.stage !== 'ALL' && p.stage !== filters.stage) {
        return false;
      }
      // Status
      if (filters.status !== 'ALL' && p.status !== filters.status) {
        return false;
      }
      // Priority
      if (filters.priority !== 'ALL' && p.priority !== filters.priority) {
        return false;
      }
      // Surveyor
      if (filters.surveyor !== 'ALL' && p.surveyorBody !== filters.surveyor) {
        return false;
      }
      // Consultant
      if (filters.leadConsultantId !== 'ALL' && p.leadConsultantId !== filters.leadConsultantId) {
        return false;
      }
      return true;
    });
  }, [projects, filters]);

  // Calculation Helper
  const calculateTkdnScore = (b: TkdnCostBreakdown) => {
    const kdnMaterial = b.directMaterialKDN || 0;
    const klnMaterial = b.directMaterialKLN || 0;
    const totalMaterial = kdnMaterial + klnMaterial;

    const kdnLabor = b.directLaborWNI || 0;
    const klnLabor = b.directLaborWNA || 0;
    const totalLabor = kdnLabor + klnLabor;

    const kdnOverhead = b.factoryOverheadDomestic || 0;
    const klnOverhead = b.factoryOverheadImported || 0;
    const totalOverhead = kdnOverhead + klnOverhead;

    const kdnTotal = kdnMaterial + kdnLabor + kdnOverhead;
    const grandTotal = totalMaterial + totalLabor + totalOverhead;

    const tkdnPercentage = grandTotal > 0 ? Number(((kdnTotal / grandTotal) * 100).toFixed(2)) : 0;
    const materialTkdn = totalMaterial > 0 ? Number(((kdnMaterial / totalMaterial) * 100).toFixed(2)) : 0;
    const laborTkdn = totalLabor > 0 ? Number(((kdnLabor / totalLabor) * 100).toFixed(2)) : 0;
    const overheadTkdn = totalOverhead > 0 ? Number(((kdnOverhead / totalOverhead) * 100).toFixed(2)) : 0;

    return {
      tkdnPercentage,
      kdnTotal,
      grandTotal,
      materialTkdn,
      laborTkdn,
      overheadTkdn,
    };
  };

  // Helper to compute stage progress %
  const getStageProgress = (stage: ProjectStage): number => {
    switch (stage) {
      case 'INQUIRY': return 15;
      case 'GAP_ANALYSIS': return 35;
      case 'DOC_PREPARATION': return 55;
      case 'FIELD_VERIFICATION': return 75;
      case 'MINISTRY_REVIEW': return 90;
      case 'CERTIFICATE_ISSUED': return 100;
      case 'CLOSED': return 100;
      default: return 10;
    }
  };

  const addProject = (
    projData: Omit<ConsultingProject, 'id' | 'code' | 'documents' | 'activities' | 'progressPercentage'>
  ): ConsultingProject => {
    const nextNum = projects.length + 101;
    const code = `PRJ-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
    const id = `prj-${Date.now()}`;
    const newProject: ConsultingProject = {
      ...projData,
      id,
      code,
      progressPercentage: getStageProgress(projData.stage),
      documents: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          action: 'Project Initialized',
          details: `Consulting engagement created under KBLI ${projData.kbliCode}`,
          type: 'STATUS_CHANGE',
        },
      ],
    };

    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<ConsultingProject>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        let progress = p.progressPercentage;
        if (updates.stage && updates.stage !== p.stage) {
          progress = getStageProgress(updates.stage);
        }

        const generatedActivities: ProjectActivity[] = [];
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

        // 1. Status Change
        if (updates.status && updates.status !== p.status) {
          generatedActivities.push({
            id: `act-${Date.now()}-status`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Project Status Updated',
            details: `Project status changed from "${p.status.replace(/_/g, ' ')}" to "${updates.status.replace(/_/g, ' ')}"`,
            type: 'STATUS_CHANGE',
            metadata: {
              previousValue: p.status,
              newValue: updates.status,
            },
          });
        }

        // 2. Stage Progression
        if (updates.stage && updates.stage !== p.stage) {
          generatedActivities.push({
            id: `act-${Date.now()}-stage`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Stage Progression',
            details: `Project moved from ${p.stage.replace(/_/g, ' ')} to ${updates.stage.replace(/_/g, ' ')}`,
            type: 'STATUS_CHANGE',
            metadata: {
              previousValue: p.stage,
              newValue: updates.stage,
            },
          });
        }

        // 3. User / Lead Consultant Assignment
        if (
          (updates.leadConsultantId && updates.leadConsultantId !== p.leadConsultantId) ||
          (updates.leadConsultantName && updates.leadConsultantName !== p.leadConsultantName)
        ) {
          const newName = updates.leadConsultantName || 'New Consultant';
          generatedActivities.push({
            id: `act-${Date.now()}-user`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Lead Consultant Reassigned',
            details: `Assigned Lead Consultant role to ${newName} (previously ${p.leadConsultantName})`,
            type: 'USER_ASSIGNMENT',
            metadata: {
              previousValue: p.leadConsultantName,
              newValue: newName,
              assigneeName: newName,
            },
          });
        }

        // 4. Surveyor Body Assignment
        if (updates.surveyorBody && updates.surveyorBody !== p.surveyorBody) {
          generatedActivities.push({
            id: `act-${Date.now()}-surveyor`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Surveyor Body Appointed',
            details: `Appointed audit body: ${updates.surveyorBody}`,
            type: 'AUDIT_MILESTONE',
            metadata: {
              previousValue: p.surveyorBody,
              newValue: updates.surveyorBody,
            },
          });
        }

        // 5. Surveyor Site Audit Schedule
        if (
          (updates.surveyorAuditDate && updates.surveyorAuditDate !== p.surveyorAuditDate) ||
          (updates.surveyorAuditorName && updates.surveyorAuditorName !== p.surveyorAuditorName)
        ) {
          const auditDate = updates.surveyorAuditDate || p.surveyorAuditDate || 'TBD';
          const auditorName = updates.surveyorAuditorName || p.surveyorAuditorName || 'Lead Auditor';
          generatedActivities.push({
            id: `act-${Date.now()}-audit`,
            timestamp,
            actor: currentUser.name,
            actorAvatar: currentUser.avatar,
            actorRole: currentUser.role,
            action: 'Surveyor Audit Scheduled',
            details: `Site verification booked for ${auditDate} with auditor ${auditorName} (${updates.surveyorBody || p.surveyorBody})`,
            type: 'AUDIT_MILESTONE',
            metadata: {
              newValue: auditDate,
              assigneeName: auditorName,
            },
          });
        }

        return {
          ...p,
          ...updates,
          progressPercentage: updates.progressPercentage ?? progress,
          activities: [...generatedActivities, ...(p.activities || [])],
        };
      })
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDispositions((prev) => prev.filter((d) => d.projectId !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const changeProjectStage = (id: string, newStage: ProjectStage) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const progress = getStageProgress(newStage);
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Stage Progression',
          details: `Project moved from ${p.stage.replace(/_/g, ' ')} to ${newStage.replace(/_/g, ' ')}`,
          type: 'STATUS_CHANGE',
          metadata: {
            previousValue: p.stage,
            newValue: newStage,
          },
        };
        return {
          ...p,
          stage: newStage,
          progressPercentage: progress,
          status: newStage === 'CERTIFICATE_ISSUED' ? 'COMPLETED' : p.status,
          activities: [newAct, ...p.activities],
        };
      })
    );
  };

  const addDisposition = (
    dispData: Omit<JobDisposition, 'id' | 'assignedDate'>
  ): JobDisposition => {
    const id = `dsp-${Date.now()}`;
    const newDisp: JobDisposition = {
      ...dispData,
      id,
      assignedDate: new Date().toISOString().slice(0, 10),
    };

    setDispositions((prev) => [newDisp, ...prev]);

    // Update team member active count
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === dispData.assignedToId) {
          return {
            ...m,
            activeTaskCount: m.activeTaskCount + 1,
            capacityPercentage: Math.min(100, m.capacityPercentage + 10),
          };
        }
        return m;
      })
    );

    // Add activity to project
    addActivity(
      dispData.projectId,
      'Job Disposition Dispatched',
      `Assigned task "${dispData.title}" to ${dispData.assignedToName} (${dispData.assignedToRole}) • Priority: ${dispData.priority} • Due: ${dispData.dueDate}`,
      'USER_ASSIGNMENT',
      {
        assigneeName: dispData.assignedToName,
        assigneeRole: dispData.assignedToRole,
        dispositionId: id,
      }
    );

    return newDisp;
  };

  const updateDisposition = (id: string, updates: Partial<JobDisposition>) => {
    setDispositions((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        if (updates.status === 'COMPLETED' && d.status !== 'COMPLETED') {
          updated.completedAt = new Date().toISOString().slice(0, 10);
          addActivity(
            d.projectId,
            'Job Disposition Completed',
            `Task "${d.title}" completed by ${d.assignedToName}`,
            'DISPOSITION',
            {
              dispositionId: id,
              assigneeName: d.assignedToName,
            }
          );
        }
        return updated;
      })
    );
  };

  const deleteDisposition = (id: string) => {
    setDispositions((prev) => prev.filter((d) => d.id !== id));
  };

  const toggleChecklistItem = (dispositionId: string, checklistId: string) => {
    setDispositions((prev) =>
      prev.map((d) => {
        if (d.id !== dispositionId) return d;
        const newChecklist = d.checklist.map((c) =>
          c.id === checklistId ? { ...c, done: !c.done } : c
        );
        const allDone = newChecklist.length > 0 && newChecklist.every((c) => c.done);
        return {
          ...d,
          checklist: newChecklist,
          status: allDone && d.status === 'IN_PROGRESS' ? 'UNDER_REVIEW' : d.status,
        };
      })
    );
  };

  const uploadDocument = (
    projectId: string,
    docData: Omit<ProjectDocument, 'id' | 'uploadDate' | 'version'> & { version?: string }
  ) => {
    const newDoc: ProjectDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().slice(0, 10),
      version: docData.version || 'v1.0',
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          documents: [newDoc, ...p.documents],
        };
      })
    );

    addActivity(
      projectId,
      'Document Uploaded',
      `Uploaded "${newDoc.name}" (${newDoc.type.replace(/_/g, ' ')}) • Size: ${newDoc.fileSize} • Version: ${newDoc.version}${newDoc.referenceNumber ? ` • Ref: ${newDoc.referenceNumber}` : ''}`,
      'DOC_UPLOAD',
      {
        documentName: newDoc.name,
        documentType: newDoc.type,
        documentCategory: newDoc.categoryGroup,
      }
    );
  };

  const updateDocumentStatus = (
    projectId: string,
    docId: string,
    status: ProjectDocument['status'],
    reviewNotes?: string
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        let targetDocName = 'Document';
        const updatedDocs = p.documents.map((d) => {
          if (d.id !== docId) return d;
          targetDocName = d.name;
          return {
            ...d,
            status,
            reviewNotes: reviewNotes !== undefined ? reviewNotes : d.reviewNotes,
            verifiedBy: status === 'VERIFIED' ? currentUser.name : d.verifiedBy,
          };
        });

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Document Status Updated',
          details: `Document "${targetDocName}" status changed to ${status.replace(/_/g, ' ')}${reviewNotes ? ` (Notes: ${reviewNotes})` : ''}`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: targetDocName,
            newValue: status,
          },
        };

        return { ...p, documents: updatedDocs, activities: [newAct, ...(p.activities || [])] };
      })
    );
  };

  const deleteDocument = (projectId: string, docId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const targetDoc = p.documents.find((d) => d.id === docId);
        const docName = targetDoc ? targetDoc.name : 'document';
        
        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: 'Document Removed',
          details: `Removed "${docName}" from project repository`,
          type: 'DOC_UPLOAD',
          metadata: {
            documentName: docName,
          },
        };

        return {
          ...p,
          documents: p.documents.filter((d) => d.id !== docId),
          activities: [newAct, ...(p.activities || [])],
        };
      })
    );
  };

  const addActivity = (
    projectId: string,
    action: string,
    details: string,
    type: ProjectActivity['type'] = 'NOTE',
    metadata?: ProjectActivity['metadata']
  ) => {
    const newAct: ProjectActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: currentUser.name,
      actorAvatar: currentUser.avatar,
      actorRole: currentUser.role,
      action,
      details,
      type,
      metadata,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activities: [newAct, ...(p.activities || [])],
        };
      })
    );
  };

  const addTransaction = (
    tx: Omit<FinancialTransaction, 'id' | 'transactionNumber' | 'createdAt'>
  ): FinancialTransaction => {
    const dateObj = new Date(tx.date || new Date());
    const yyyymm = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const seq = Math.floor(100 + Math.random() * 900);
    const newTx: FinancialTransaction = {
      ...tx,
      id: `trx-${Date.now()}`,
      transactionNumber: `TRX-${yyyymm}-${seq}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    // If associated with a project, add an activity log to the project
    if (tx.projectId) {
      addActivity(
        tx.projectId,
        tx.type === 'INCOME' ? 'Financial Billing / Income Recorded' : 'Project Disbursement / Expense Logged',
        `${tx.type === 'INCOME' ? 'Income' : 'Disbursement'} of Rp ${tx.amountIDR.toLocaleString('id-ID')} (${tx.description})`,
        'NOTE'
      );
    }

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<FinancialTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleMilestoneManualSignoff = (
    projectId: string,
    milestoneId: string,
    completed: boolean,
    notes?: string
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentSignoffs = p.manualMilestoneSignoffs || {};
        const updatedSignoffs = {
          ...currentSignoffs,
          [milestoneId]: {
            completed,
            signedBy: currentUser.name,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            notes: notes || '',
          },
        };

        const newAct: ProjectActivity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorAvatar: currentUser.avatar,
          actorRole: currentUser.role,
          action: completed ? 'Milestone Manually Signed Off' : 'Milestone Sign-Off Revoked',
          details: `Milestone ${milestoneId} marked as ${completed ? 'COMPLETED' : 'PENDING'} by ${currentUser.name}${notes ? ` (Remark: ${notes})` : ''}`,
          type: 'AUDIT_MILESTONE',
          metadata: {
            newValue: completed ? 'COMPLETED' : 'PENDING',
          },
        };

        return {
          ...p,
          manualMilestoneSignoffs: updatedSignoffs,
          activities: [newAct, ...(p.activities || [])],
        };
      })
    );
  };

  const addCustomMilestoneToProject = (
    projectId: string,
    milestone: {
      title: string;
      description: string;
      stage: ProjectStage;
      regulatoryClause?: string;
      requiredDocTypes: ProjectDocument['type'][];
    }
  ) => {
    const newCustomMilestone: any = {
      id: `custom-${Date.now()}`,
      stage: milestone.stage,
      title: milestone.title,
      description: milestone.description,
      regulatoryClause: milestone.regulatoryClause || 'Custom Client Milestone',
      requiredDocTypes: milestone.requiredDocTypes || [],
      optionalDocTypes: [],
      matchedDocuments: [],
      status: 'PENDING',
      isCompleted: false,
      completionPercentage: 0,
      unfulfilledDocTypes: milestone.requiredDocTypes || [],
      custom: true,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const existingCustom = p.customMilestones || [];
        return {
          ...p,
          customMilestones: [...existingCustom, newCustomMilestone],
        };
      })
    );

    addActivity(
      projectId,
      'Custom Milestone Added',
      `Added custom regulatory milestone "${milestone.title}" in stage ${milestone.stage}`,
      'AUDIT_MILESTONE'
    );
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        dispositions,
        teamMembers,
        transactions,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        quickSwitchUser,
        hasPermission,
        isRole,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        filters,
        setFilters,
        resetFilters,
        filteredProjects,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        addProject,
        updateProject,
        deleteProject,
        changeProjectStage,
        addDisposition,
        updateDisposition,
        deleteDisposition,
        toggleChecklistItem,
        uploadDocument,
        updateDocumentStatus,
        deleteDocument,
        addActivity,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleMilestoneManualSignoff,
        addCustomMilestoneToProject,
        calculateTkdnScore,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
