import React, { useState } from 'react';
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
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember } from '../types';

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: TeamMember | null;
  onSuccess?: () => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}) => {
  const { currentUser, switchAccount, logout, canSwitchAccount, isMasterAdmin } = useProjects();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!canSwitchAccount && !pin.trim()) {
      setErrorMsg('Please enter the Security PIN for this account.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = switchAccount(targetUser.id, pin.trim());
      setIsSubmitting(false);

      if (result.success) {
        setPin('');
        setErrorMsg(null);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(result.message || 'Authentication failed. Incorrect Security PIN.');
      }
    }, 200);
  };

  const isMasterTarget = targetUser.role === 'MASTER_ADMIN' || targetUser.username === 'admin.master';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md ${
              isMasterTarget ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
            }`}>
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Account Switch Security Check</h3>
              <p className="text-[11px] text-slate-400">Restricted Profile Access Policy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setPin('');
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSwitchSubmit} className="p-6 space-y-4">
          {/* Security Notice */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Access Verification Required</p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Direct account switching without credentials is strictly reserved for <span className="font-semibold">Master Admin</span> and authorized directors.
              </p>
            </div>
          </div>

          {/* Current vs Target Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Switching Account</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                RBAC Protected
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="relative">
                <img
                  src={targetUser.avatar}
                  alt={targetUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 ring-2 ring-blue-500/20"
                />
                {isMasterTarget && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    ★
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{targetUser.name}</h4>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {targetUser.roleTitle || targetUser.role.replace('_', ' ')}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    @{targetUser.username || targetUser.email.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Status: {targetUser.status}
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
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Enter Security PIN for {targetUser.name} *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? 'text' : 'password'}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-6 digit Security PIN"
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
            <p className="text-[10px] text-slate-400 mt-1">
              Enter the registered security PIN to authorize the account switch.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setPin('');
                onClose();
              }}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
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
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Authenticate & Switch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

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
              <span>Sign out current account and choose another</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
