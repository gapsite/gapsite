import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  Users,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { TeamMember } from '../types';

export const LoginView: React.FC = () => {
  const { teamMembers, login, quickSwitchUser } = useProjects();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your username, email, or select an account.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(identifier, pin);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed. Please verify credentials.');
      }
    }, 250);
  };

  const handleSelectQuickAccount = (member: TeamMember) => {
    setIdentifier(member.username || member.email);
    setPin(member.pin || '1234');
    setErrorMsg(null);
    quickSwitchUser(member.id);
  };

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'DIRECTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LEAD_CONSULTANT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TECHNICAL_CONSULTANT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SURVEYOR_LIAISON':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'FINANCE_OFFICER':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'CLIENT_VIEWER':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        {/* Left Side: System Info & Role Selection */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>VERIX</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Industrial OS
                  </span>
                </h1>
                <p className="text-xs text-slate-400">TKDN & Statutory Compliance ERP</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Quick Role Demo Access</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Click any pre-configured role below to log in immediately with appropriate permissions:
              </p>

              {/* Fast Login Account Cards */}
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectQuickAccount(member)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate group-hover:text-blue-300 transition-colors">
                            {member.name}
                          </span>
                          {member.clientCompany && (
                            <span className="text-[10px] text-slate-400 truncate">({member.clientCompany})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(
                              member.role
                            )}`}
                          >
                            {member.role.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            PIN: {member.pin || '1234'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all text-xs font-semibold shrink-0 ml-2">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Role-Based Access Control (RBAC)
            </span>
            <span className="font-mono text-slate-400">v2.4.0-Enterprise</span>
          </div>
        </div>

        {/* Right Side: Direct Login Form */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
          <div>
            <div className="mb-6">
              <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold inline-block mb-2">
                Secure Consultant Portal
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered username or email with your security PIN to access the audit platform.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. bambang.director or dewi.auditor"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Security PIN / Password
                  </label>
                  <span className="text-[11px] text-slate-400">Default: 1234</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Enter Industrial CRM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Verix Consulting Group • Republic of Indonesia</span>
            </p>
            <p>Certified for SIINas, Permenperin 16/2011, OSS-RBA & Sucofindo/SI Audits</p>
          </div>
        </div>
      </div>
    </div>
  );
};
