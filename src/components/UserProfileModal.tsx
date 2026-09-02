import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  KeyRound,
  Sparkles,
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  Tag,
  FileSignature,
  Bell,
  Eye,
  EyeOff,
  Palette,
  Briefcase,
  Award,
  Lock,
  RefreshCw,
  Upload,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  {
    category: 'Executive & Lead',
    avatars: [
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Executive Female' },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Senior Lead Male' },
      { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', label: 'Director Female' },
      { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', label: 'Managing Lead Male' },
    ],
  },
  {
    category: 'Consultants & Auditors',
    avatars: [
      { url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', label: 'Senior Consultant' },
      { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', label: 'TKDN Assessor' },
      { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', label: 'Lead Auditor' },
      { url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80', label: 'Legal Counsel' },
    ],
  },
  {
    category: 'Operations & Engineering',
    avatars: [
      { url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', label: 'Technical Specialist' },
      { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', label: 'Finance Manager' },
      { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', label: 'Surveyor LVI' },
      { url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', label: 'Modern Minimalist' },
    ],
  },
];

const THEME_ACCENTS = [
  { id: 'indigo', name: 'Indigo Corporate', bgClass: 'bg-indigo-600', ringClass: 'ring-indigo-500', textClass: 'text-indigo-600' },
  { id: 'emerald', name: 'Emerald TKDN', bgClass: 'bg-emerald-600', ringClass: 'ring-emerald-500', textClass: 'text-emerald-600' },
  { id: 'amber', name: 'Amber Gold', bgClass: 'bg-amber-500', ringClass: 'ring-amber-500', textClass: 'text-amber-600' },
  { id: 'blue', name: 'Sapphire Blue', bgClass: 'bg-blue-600', ringClass: 'ring-blue-500', textClass: 'text-blue-600' },
  { id: 'purple', name: 'Royal Purple', bgClass: 'bg-purple-600', ringClass: 'ring-purple-500', textClass: 'text-purple-600' },
  { id: 'rose', name: 'Rose Precision', bgClass: 'bg-rose-600', ringClass: 'ring-rose-500', textClass: 'text-rose-600' },
  { id: 'teal', name: 'Teal Oceanic', bgClass: 'bg-teal-600', ringClass: 'ring-teal-500', textClass: 'text-teal-600' },
  { id: 'slate', name: 'Slate Executive', bgClass: 'bg-slate-700', ringClass: 'ring-slate-600', textClass: 'text-slate-700' },
] as const;

const COMMON_SKILLS = [
  'Permenperin 16/2011',
  'BMP 40% Calculation',
  'SIINas Verification',
  'LVI Facilitation',
  'Kemenperin Audit File',
  'Supply Chain Local Content',
  'Manufacturing TKDN',
  'Energy & Solar PV TKDN',
  'EPC Project Compliance',
  'Machinery & Equipment',
  'ISO 9001 / ISO 14001',
  'Statutory Legal Filing',
  'Corporate Finance & Invoicing',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, isMasterAdmin } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-tab in Profile Modal
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'security' | 'signature' | 'notifications'>('profile');

  // Form State initialized from currentUser
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    department: '',
    roleTitle: '',
    clientCompany: '',
    bio: '',
    registrationNumber: '',
    avatar: '',
    themeAccent: 'indigo' as 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate' | 'teal',
    pin: '',
    signatureText: '',
    signatureImage: '',
    specialization: [] as string[],
    notificationPreferences: {
      emailNotifications: true,
      whatsappAlerts: true,
      inAppDispatches: true,
      weeklySummary: false,
    },
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinConfirm, setPinConfirm] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Synchronize state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        department: currentUser.department || '',
        roleTitle: currentUser.roleTitle || '',
        clientCompany: currentUser.clientCompany || '',
        bio: currentUser.bio || '',
        registrationNumber: currentUser.registrationNumber || '',
        avatar: currentUser.avatar || '',
        themeAccent: (currentUser.themeAccent || (currentUser.role === 'MASTER_ADMIN' ? 'amber' : 'emerald')) as any,
        pin: currentUser.pin || '',
        signatureText: currentUser.signatureText || currentUser.name || '',
        signatureImage: currentUser.signatureImage || '',
        specialization: Array.isArray(currentUser.specialization) ? [...currentUser.specialization] : [],
        notificationPreferences: {
          emailNotifications: currentUser.notificationPreferences?.emailNotifications ?? true,
          whatsappAlerts: currentUser.notificationPreferences?.whatsappAlerts ?? true,
          inAppDispatches: currentUser.notificationPreferences?.inAppDispatches ?? true,
          weeklySummary: currentUser.notificationPreferences?.weeklySummary ?? false,
        },
      });
      setPinConfirm(currentUser.pin || '');
      setSaveSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (formData.specialization.includes(trimmed)) return;
    setFormData((prev) => ({
      ...prev,
      specialization: [...prev.specialization, trimmed],
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.filter((s) => s !== skill),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 2MB for optimal performance.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          avatar: event.target?.result as string,
        }));
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!formData.name.trim()) {
      setErrorMessage('Full Name cannot be empty.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (formData.pin && formData.pin.length < 4) {
      setErrorMessage('Security PIN must be at least 4 digits for account switching.');
      return;
    }
    if (formData.pin && formData.pin !== pinConfirm) {
      setErrorMessage('PIN and PIN confirmation do not match.');
      return;
    }

    const updates: Partial<TeamMember> = {
      name: formData.name.trim(),
      username: formData.username.trim() || formData.email.split('@')[0],
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department: formData.department.trim(),
      roleTitle: formData.roleTitle.trim(),
      clientCompany: formData.clientCompany.trim(),
      bio: formData.bio.trim(),
      registrationNumber: formData.registrationNumber.trim(),
      avatar: formData.avatar,
      themeAccent: formData.themeAccent,
      pin: formData.pin,
      signatureText: formData.signatureText.trim(),
      signatureImage: formData.signatureImage,
      specialization: formData.specialization,
      notificationPreferences: formData.notificationPreferences,
    };

    updateUser(currentUser.id, updates);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={formData.avatar || currentUser.avatar}
                alt={formData.name || currentUser.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 ring-2 ring-emerald-500/30 shadow-md"
              />
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>{formData.name || currentUser.name}</span>
                  {currentUser.role === 'MASTER_ADMIN' && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                      SUPREME
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-emerald-400">{formData.roleTitle || currentUser.roleTitle || currentUser.role}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">@{formData.username || currentUser.username}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              Role: {currentUser.role.replace('_', ' ')}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center px-4 bg-slate-50 border-b border-slate-200 overflow-x-auto gap-1 py-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Personal Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'avatar'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Avatar & Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Switch PIN & Auth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signature')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'signature'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5 text-purple-600" />
            <span>E-Sign & Title</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-rose-600" />
            <span>Alerts</span>
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Error / Success Feedback */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Personal profile and settings updated successfully!</span>
            </div>
          )}

          {/* TAB 1: PERSONAL DATA */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  You are personalizing your own profile as <strong>{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')}).
                  Changes take effect immediately across all project dispatches, audit logs, and communication streams.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name / Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ir. Budi Santoso, ST, MT"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / Handle (@username) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '.') })}
                      placeholder="e.g. budi.santoso"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                    <span className="text-slate-400 font-mono text-xs absolute left-3.5 top-2.5">@</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. budi@verix.id"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +62 812-3456-7890"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Division
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. TKDN Industrial Consulting & Audits"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization Unit
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      placeholder="e.g. VERIX Consulting Group / PT Sucofindo / Client PT ABC"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Bio / Responsibility Scope
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a short summary of your compliance focus, statutory certifications, or project specializations..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Specializations & Skills */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Specializations & Compliance Competencies</span>
                  <span className="text-[10px] font-normal text-slate-400">Click tags to add/remove</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.specialization.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <span>{spec}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(spec)}
                        className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.specialization.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No competencies selected yet.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(newSkillInput);
                        }
                      }}
                      placeholder="Add custom specialization (e.g. BMP Direct Labor)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSkill(newSkillInput)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {COMMON_SKILLS.filter((s) => !formData.specialization.includes(s)).slice(0, 6).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AVATAR & VISUAL THEME */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {/* Current Avatar Preview & Uploader */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                <div className="relative">
                  <img
                    src={formData.avatar || currentUser.avatar}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <span className="absolute -bottom-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white border border-slate-700">
                    Live
                  </span>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-xs font-bold text-slate-900">Personal Avatar Image</p>
                  <p className="text-[11px] text-slate-500">
                    Upload a high-resolution photo from your device or select from our curated compliance persona library below.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const randomId = Math.floor(Math.random() * 70) + 1;
                        setFormData((prev) => ({
                          ...prev,
                          avatar: `https://i.pravatar.cc/150?img=${randomId}`,
                        }));
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Randomize</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Image URL Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Paste Custom Image URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarUrl.trim()) {
                        setFormData((prev) => ({ ...prev, avatar: customAvatarUrl.trim() }));
                        setCustomAvatarUrl('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Avatar Presets by Category */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800">Select From Persona Presets</p>
                {AVATAR_PRESETS.map((group) => (
                  <div key={group.category} className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {group.category}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                      {group.avatars.map((item) => {
                        const isSelected = formData.avatar === item.url;
                        return (
                          <button
                            key={item.url}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, avatar: item.url }))}
                            className={`p-1.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="relative">
                              <img
                                src={item.url}
                                alt={item.label}
                                className="w-11 h-11 rounded-lg object-cover"
                              />
                              {isSelected && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px]">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-slate-700 truncate w-full">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Personal Accent Color */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Personal Accent & Identity Badge Tint
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_ACCENTS.map((theme) => {
                    const isSelected = formData.themeAccent === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, themeAccent: theme.id as any }))}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${theme.bgClass} shrink-0`} />
                        <span className="text-xs font-semibold truncate">{theme.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SWITCH PIN & AUTHENTICATION */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Fast Perspective Switching & Security PIN</p>
                  <p className="mt-0.5 text-[11px] text-amber-800">
                    When switching between user perspectives in the workspace, standard accounts require entering their private Security PIN. Keep this PIN memorable and secure.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your 4–6 Digit Security PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 123456"
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-2.5 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Current PIN length: {formData.pin.length}/6 digits
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Security PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter your PIN"
                      className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 ${
                        pinConfirm && pinConfirm !== formData.pin
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {pinConfirm && pinConfirm !== formData.pin && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1">
                      PIN confirmation does not match.
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Preset PIN generator */}
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-slate-800">Generate Strong Numeric PIN</p>
                  <p className="text-[10px] text-slate-500">Auto-generate a 6-digit cryptographic PIN</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                    setFormData((prev) => ({ ...prev, pin: newPin }));
                    setPinConfirm(newPin);
                    setShowPin(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Generate PIN
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: E-SIGN & OFFICIAL DESIGNATION */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Role Title / Professional Designation
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    placeholder="e.g. Senior TKDN Lead Consultant & Energy Sector Specialist"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  This custom title appears on all exported audit files, milestone sign-offs, and client receipts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Assessor / Auditor License / Registration ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g. ASK-TKDN-2024-098 / SKA-MEK-1102"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Digital Signature Text & Stamp Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Electronic Signature Signoff Text
                </label>
                <input
                  type="text"
                  value={formData.signatureText}
                  onChange={(e) => setFormData({ ...formData, signatureText: e.target.value })}
                  placeholder="e.g. [E-SIGNED] Ir. Budi Santoso - VERIX TKDN"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />

                {/* Visual Stamp Card */}
                <div className="p-3 bg-white border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
                      VERIX VERIFIED DIGITAL SIGNATURE
                    </p>
                    <p className="text-xs font-black text-slate-900 font-serif italic">
                      {formData.signatureText || formData.name || 'Digital Signature'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formData.roleTitle || currentUser.roleTitle} • {formData.registrationNumber || 'ID-ACTIVE'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shrink-0 font-black text-xs">
                    ✓
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & DISPATCH ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-800 mb-2">
                Personal Dispatch & Communication Alerts
              </p>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Email Notification on Task Assignment</p>
                    <p className="text-[11px] text-slate-500">Receive immediate email when a job disposition is assigned to you.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.emailNotifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          emailNotifications: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">WhatsApp Urgent Dispatch Alerts</p>
                    <p className="text-[11px] text-slate-500">Send WhatsApp alerts to {formData.phone || 'your phone number'} on urgent deadlines.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.whatsappAlerts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          whatsappAlerts: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">In-App Live Activity Toast Banners</p>
                    <p className="text-[11px] text-slate-500">Display toast badges when milestones or document reviews are signed off.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.inAppDispatches}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          inAppDispatches: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Weekly Executive Digest</p>
                    <p className="text-[11px] text-slate-500">Weekly summary of TKDN certificate achievements and revenue targets.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.weeklySummary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          weeklySummary: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save & Apply Personalization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
