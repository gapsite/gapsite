import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Search,
  Check,
  ChevronLeft,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember, UserRole } from '../types';
import {
  PURGED_DUMMY_USER_IDS,
  PURGED_DUMMY_USERNAMES,
  PURGED_DUMMY_EMAILS,
  isPurgedDummyName,
} from '../utils/storage';

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: TeamMember | null;
  onSuccess?: () => void;
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  MASTER_ADMIN: { label: 'Master Admin', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  DIRECTOR: { label: 'Managing Director', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  LEAD_CONSULTANT: { label: 'Lead Assessor', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  TECHNICAL_CONSULTANT: { label: 'Technical Assessor', color: 'bg-teal-100 text-teal-900 border-teal-300' },
  SURVEYOR_LIAISON: { label: 'Surveyor Liaison', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  FINANCE_OFFICER: { label: 'Finance Officer', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  CLIENT_VIEWER: { label: 'Client Portal', color: 'bg-slate-100 text-slate-900 border-slate-300' },
};

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}) => {
  const { currentUser, teamMembers, switchAccount, logout, canSwitchAccount, isMasterAdmin } = useProjects();
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(targetUser || null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (targetUser) {
      setSelectedUser(targetUser);
    } else {
      setSelectedUser(null);
    }
    setPin('');
    setErrorMsg(null);
    setSearchQuery('');
  }, [isOpen, targetUser]);

  const activeMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (m.status && m.status !== 'ACTIVE') return false;
      if (PURGED_DUMMY_USER_IDS.includes(m.id)) return false;
      if (m.username && PURGED_DUMMY_USERNAMES.includes(m.username.toLowerCase())) return false;
      if (m.email && PURGED_DUMMY_EMAILS.includes(m.email.toLowerCase())) return false;
      if (isPurgedDummyName(m.name)) return false;
      return true;
    });
  }, [teamMembers]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return activeMembers;
    const q = searchQuery.toLowerCase().trim();
    return activeMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.roleTitle && m.roleTitle.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q))
    );
  }, [activeMembers, searchQuery]);

  if (!isOpen) return null;

  const handleSelectTarget = (user: TeamMember) => {
    setSelectedUser(user);
    setErrorMsg(null);
    setPin(user.pin || (user.id === 'usr-0' ? '110711' : '123456'));
  };

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg(null);

    // If master admin is switching to any role, allow direct switch without pin validation if pin is empty
    const effectivePin = isMasterAdmin && !pin.trim() ? (selectedUser.pin || '123456') : pin.trim();

    setIsSubmitting(true);
    setTimeout(() => {
      const result = switchAccount(selectedUser.id, effectivePin);
      setIsSubmitting(false);

      if (result.success) {
        setPin('');
        setErrorMsg(null);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(result.message || 'Gagal beralih akun. Periksa Security PIN Anda.');
      }
    }, 150);
  };

  const isMasterTarget = selectedUser && (selectedUser.role === 'MASTER_ADMIN' || selectedUser.username === 'admin.master');

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md ${
              isMasterTarget ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
            }`}>
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Alih Role & Akun Pengguna</h3>
              <p className="text-[11px] text-slate-400">Multi-Role Online Workspace Switcher</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setPin('');
              setSelectedUser(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Mode 1: Account Selection List (when no targetUser is chosen or user wants to browse) */}
          {!selectedUser ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pilih Akun / Peran Tujuan</h4>
                  <p className="text-[11px] text-slate-500">
                    Sistem beroperasi online dengan 7 peran terverifikasi. Semua perubahan tersinkronisasi otomatis.
                  </p>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama, peran, atau divisi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Members List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredMembers.map((member) => {
                  const isCurrent = currentUser?.id === member.id;
                  const badge = ROLE_BADGES[member.role] || { label: member.role, color: 'bg-slate-100 text-slate-700' };

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectTarget(member)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 ring-1 ring-slate-100"
                          />
                          {member.role === 'MASTER_ADMIN' && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                              ★
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">{member.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-600 text-white font-mono">
                                AKUN AKTIF
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{member.roleTitle || member.role}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">@{member.username}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          <span>{isCurrent ? 'Aktif' : 'Pilih'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Mode 2: Confirm and PIN Verification Form for selected target */
            <form onSubmit={handleSwitchSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setErrorMsg(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Pilih Peran Lain</span>
              </button>

              {/* Target User Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Target Akun & Role</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                    RBAC Protected
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="relative shrink-0">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 ring-2 ring-blue-500/20"
                    />
                    {isMasterTarget && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{selectedUser.name}</h4>
                    <p className="text-[11px] text-slate-600 truncate">{selectedUser.roleTitle || selectedUser.role}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        @{selectedUser.username}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {ROLE_BADGES[selectedUser.role]?.label || selectedUser.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* PIN Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Security PIN untuk {selectedUser.name} *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Default: {selectedUser.role === 'MASTER_ADMIN' ? '110711' : '123456'}
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masukkan 4-6 digit PIN"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Semua perubahan (proyek, disposisi tugas, transaksi keuangan, dsb.) akan langsung tersimpan ke Hostinger MySQL & Firestore serta terlihat oleh akun lain secara online.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setErrorMsg(null);
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                    isMasterTarget
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Memverifikasi...</span>
                  ) : (
                    <>
                      <span>Masuk Sebagai {ROLE_BADGES[selectedUser.role]?.label || 'Role Ini'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Alternative: Logout */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Sign Out) dan Pilih Akun di Layar Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

