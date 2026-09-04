import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Database,
  Mail,
  RotateCcw,
  Send,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { sendResetPasswordEmail } from '../firebase/config';
import { TeamMember, UserRole, UserPermission } from '../types';

const ROLE_PRESETS: Partial<
  Record<
    UserRole,
    {
      title: string;
      department: string;
      badgeColor: string;
      desc: string;
      defaultPermissions: UserPermission[];
    }
  >
> = {
  MASTER_ADMIN: {
    title: 'Chief Role Master & System SuperAdmin',
    department: 'Central Compliance Governance & Board',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: 'Supreme authority. Authorizes registered members, audits statutory credentials, and manages master enterprise permissions.',
    defaultPermissions: [
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
  },
  DIRECTOR: {
    title: 'Managing Partner / Director',
    department: 'Executive Leadership',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Full enterprise control, strategic sign-offs, and financial oversight.',
    defaultPermissions: [
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
  },
  LEAD_CONSULTANT: {
    title: 'Lead Assessor / Senior Consultant',
    department: 'Statutory Verification & Audits',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Leads client audits, signs off milestones, and coordinates verification.',
    defaultPermissions: [
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
  },
  TECHNICAL_CONSULTANT: {
    title: 'Technical Assessor / BOM Specialist',
    department: 'Technical & TKDN Calculations',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Performs BOM costing, supply chain verification, and SIINas modeling.',
    defaultPermissions: [
      'VIEW_PROJECTS',
      'CALCULATE_TKDN',
      'UPLOAD_DOCUMENTS',
      'MANAGE_DISPOSITIONS',
      'EXPORT_AUDIT_REPORTS',
    ],
  },
  SURVEYOR_LIAISON: {
    title: 'Regulatory & LVI Liaison',
    department: 'Liaison & LVI Coordination',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Liaises with accredited LVI bodies, tracks OSS-RBA, and manages audit schedules.',
    defaultPermissions: [
      'VIEW_PROJECTS',
      'EDIT_PROJECTS',
      'UPLOAD_DOCUMENTS',
      'VERIFY_DOCUMENTS',
      'SIGNOFF_MILESTONES',
      'MANAGE_DISPOSITIONS',
      'EXPORT_AUDIT_REPORTS',
    ],
  },
  FINANCE_OFFICER: {
    title: 'Financial Controller / Billing Specialist',
    department: 'Finance & Invoicing',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    desc: 'Manages consulting SPK retainers, surveyor fees, and payment terms.',
    defaultPermissions: [
      'VIEW_PROJECTS',
      'UPLOAD_DOCUMENTS',
      'MANAGE_FINANCE',
      'EXPORT_AUDIT_REPORTS',
    ],
  },
  CLIENT_VIEWER: {
    title: 'Client Portal Representative',
    department: 'External Corporate Client',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Monitors certification progress, uploads company files, and views reports.',
    defaultPermissions: ['VIEW_PROJECTS', 'UPLOAD_DOCUMENTS', 'EXPORT_AUDIT_REPORTS'],
  },
};

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

export const LoginView: React.FC = () => {
  const { teamMembers, login, addUser, resetPinWithEmail } = useProjects();

  // Mode: Sign In, Register New Employee, or Forgot PIN / Reset Password
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot-pin'>('signin');

  // Sign In Form State (Username + PIN only)
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+62 ');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');

  // Forgot PIN / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [dispatchedAccountName, setDispatchedAccountName] = useState('');

  const cleanRegUsername = regUsername.trim().toLowerCase();
  const isUsernameTaken = Boolean(
    cleanRegUsername &&
      teamMembers.some((m) => (m.username || '').toLowerCase() === cleanRegUsername)
  );

  const handleNameChange = (val: string) => {
    setRegName(val);
    // Suggest username if not manually modified
    if (!regUsername || regUsername === regName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const simplified = val
        .toLowerCase()
        .replace(/^(ir\.|dr\.|drs\.|prof\.)/i, '')
        .trim()
        .split(' ')[0]
        .replace(/[^a-z0-9]/g, '');
      if (simplified) {
        setRegUsername(`${simplified}.member`);
      }
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUser = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUser) {
      setErrorMsg('Please enter your registered consultant username.');
      return;
    }

    if (!cleanPin) {
      setErrorMsg('Please enter your 4-6 digit security PIN.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(cleanUser, cleanPin);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed. Please verify your registered username and security PIN.');
      }
    }, 200);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Full Name and Official Email are required.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase() || regEmail.split('@')[0].toLowerCase();

    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-z0-9._-]+$/i.test(cleanUsername)) {
      setErrorMsg('Username can only contain alphanumeric characters, dots, underscores, or hyphens.');
      return;
    }

    // Strict uniqueness check: Username cannot be reused once registered
    const usernameTaken = teamMembers.some(
      (m) => (m.username || '').toLowerCase() === cleanUsername
    );

    if (usernameTaken) {
      setErrorMsg(`The username "@${cleanUsername}" is already registered. Usernames cannot be reused once registered. Please choose a different username.`);
      return;
    }

    const emailTaken = teamMembers.some(
      (m) => m.email.toLowerCase() === regEmail.trim().toLowerCase()
    );

    if (emailTaken) {
      setErrorMsg(`An account with email "${regEmail.trim()}" is already registered. Please sign in with your registered username.`);
      return;
    }

    const cleanPin = regPin.trim();
    const cleanConfirmPin = regConfirmPin.trim();

    if (!cleanPin) {
      setErrorMsg('Security PIN is required. Please create a 4-6 digit PIN for logging in.');
      return;
    }

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setErrorMsg('Security PIN must be between 4 and 6 digits.');
      return;
    }

    if (cleanPin !== cleanConfirmPin) {
      setErrorMsg('Security PIN and Confirm PIN do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const defaultRole: UserRole = 'TECHNICAL_CONSULTANT';
        const initialStatus: TeamMember['status'] = 'PENDING_VERIFICATION';

        const newMember = addUser({
          name: regName.trim(),
          username: cleanUsername,
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim(),
          role: defaultRole,
          roleTitle: ROLE_PRESETS[defaultRole].title,
          department: ROLE_PRESETS[defaultRole].department,
          pin: cleanPin,
          avatar: AVATAR_PRESETS[0],
          status: initialStatus,
          registeredAt: 'Just now',
          specialization: ['Statutory Compliance', 'TKDN Modeling'],
          permissions: ROLE_PRESETS[defaultRole].defaultPermissions,
          activeTaskCount: 0,
          completedTaskCount: 0,
          capacityPercentage: 70,
        });

        setIsLoading(false);

        setAuthMode('signin');
        setSuccessMsg(
          `Registration submitted for ${newMember.name}! Username "@${newMember.username}" and PIN have been established. Please sign in using your username and PIN.`
        );
        setIdentifier(newMember.username || '');
        setPin(cleanPin);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err?.message || 'Failed to register account. Please choose a different username.');
      }
    }, 300);
  };

  // Handle Step 1: Send Reset to Registered Gmail
  const handleForgotPinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Please enter your registered Gmail / Official Email address.');
      return;
    }

    // Check if email format is valid
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please provide a valid email format (e.g. consultant@gmail.com).');
      return;
    }

    setIsLoading(true);

    // Search for user with this registered email (or matching username)
    const targetUser = teamMembers.find(
      (m) => m.email.toLowerCase() === cleanEmail || m.username?.toLowerCase() === cleanEmail
    );

    if (!targetUser) {
      setIsLoading(false);
      setErrorMsg(
        `No registered consultant account was found with the email "${forgotEmail}". Please verify your registered Gmail address.`
      );
      return;
    }

    // Generate 6-digit security reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setDispatchedAccountName(targetUser.name);

    // Also trigger Firebase Auth Password Reset Email if applicable
    try {
      await sendResetPasswordEmail(targetUser.email);
    } catch {
      // Handled silently
    }

    setIsLoading(false);
    setResetStep('verify');
    setSuccessMsg(
      `Password/PIN reset instructions and 6-digit verification code have been dispatched to ${targetUser.email}.`
    );
  };

  // Handle Step 2: Verify Code and Set New PIN
  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!inputCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }

    if (inputCode.trim() !== generatedCode.trim()) {
      setErrorMsg('Invalid verification code. Please check your Gmail or request a new code.');
      return;
    }

    const cleanNewPin = newPin.trim();
    const cleanConfirmPin = confirmNewPin.trim();

    if (!cleanNewPin) {
      setErrorMsg('Please enter your new 4-6 digit Security PIN.');
      return;
    }

    if (cleanNewPin.length < 4 || cleanNewPin.length > 6) {
      setErrorMsg('Security PIN must be between 4 and 6 numeric digits.');
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setErrorMsg('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = resetPinWithEmail(forgotEmail.trim().toLowerCase(), cleanNewPin);
      setIsLoading(false);

      if (!res.success) {
        setErrorMsg(res.message || 'Failed to update Security PIN. Please try again.');
        return;
      }

      // Find user username to auto-populate
      const targetUser = teamMembers.find(
        (m) => m.email.toLowerCase() === forgotEmail.trim().toLowerCase()
      );

      // Return to Sign In view with prefilled credentials
      setAuthMode('signin');
      setResetStep('request');
      setIdentifier(targetUser?.username || forgotEmail.trim());
      setPin(cleanNewPin);
      setForgotEmail('');
      setInputCode('');
      setNewPin('');
      setConfirmNewPin('');
      setSuccessMsg(
        'Security PIN successfully reset! We have prefilled your credentials so you can sign in immediately.'
      );
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/25 border border-blue-400/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">GAP CRM</h1>
            </div>
          </div>

          {/* Form Mode Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message Display */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* --- VIEW 1: SIGN IN FORM (Username + PIN only) --- */}
          {authMode === 'signin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Consultant Sign In
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium inline-flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Statutory Auth Active
                </span>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signin-username" className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Registered Username (Login ID) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="signin-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. admin.master or registered username"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Sign in with username only. Sign in with name is disabled for security.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="signin-pin" className="block text-xs font-semibold text-slate-200">
                      Security PIN *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot-pin');
                        setResetStep('request');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-blue-300 hover:text-blue-200 font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3 text-blue-300" aria-hidden="true" />
                      <span>Forgot PIN?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="signin-pin"
                      name="pin"
                      type={showPin ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter 4-6 digit registered PIN"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      aria-label={showPin ? 'Hide Security PIN' : 'Show Security PIN'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100 cursor-pointer p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* --- VIEW 2: REGISTER NEW EMPLOYEE FORM --- */}
          {authMode === 'register' && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold inline-block mb-1.5">
                  Employee Onboarding
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Register New Consultant / Staff
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provision a new team member with specific Indonesian statutory consulting credentials.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {/* Row 1: Name and Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-200 mb-1">
                      Full Name & Titles *
                    </label>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={regName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Ir. Budi Santoso, ST, MT"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-username" className="block text-xs font-semibold text-slate-200">
                        Username (Login ID) *
                      </label>
                      {cleanRegUsername && (
                        <span
                          className={`text-[10px] font-mono font-medium ${
                            isUsernameTaken ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {isUsernameTaken ? '✗ Username already taken' : '✓ Username available'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-mono" aria-hidden="true">
                        @
                      </span>
                      <input
                        id="reg-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                        placeholder="e.g. john.doe"
                        className={`w-full bg-slate-800/80 border rounded-xl pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 font-mono focus:outline-none transition-all ${
                          isUsernameTaken
                            ? 'border-red-500/80 focus:border-red-500'
                            : 'border-slate-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Unique ID required for login. Cannot be reused once registered.
                    </p>
                  </div>
                </div>

                {/* Row 2: Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-200 mb-1">
                      Official Email *
                    </label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="consultant@gapsite.com"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-200 mb-1">
                      WhatsApp / Phone
                    </label>
                    <input
                      id="reg-phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+62 812-3456-7890"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all"
                    />
                  </div>
                </div>

                {/* Row 3: PIN & Confirm PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-pin" className="block text-xs font-semibold text-slate-200">
                        Security PIN (4-6 digits) *
                      </label>
                      {regPin && (
                        <span className="text-[10px] text-slate-300 font-mono">
                          {regPin.length}/6 digits
                        </span>
                      )}
                    </div>
                    <input
                      id="reg-pin"
                      name="pin"
                      type="password"
                      maxLength={6}
                      autoComplete="new-password"
                      required
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 849201"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-confirmpin" className="block text-xs font-semibold text-slate-200">
                        Confirm Security PIN *
                      </label>
                      {regConfirmPin && (
                        <span
                          className={`text-[10px] font-mono ${
                            regPin === regConfirmPin ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {regPin === regConfirmPin ? '✓ PIN matches' : '✗ PIN mismatch'}
                        </span>
                      )}
                    </div>
                    <input
                      id="reg-confirmpin"
                      name="confirmPin"
                      type="password"
                      maxLength={6}
                      autoComplete="new-password"
                      required
                      value={regConfirmPin}
                      onChange={(e) => setRegConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Re-enter security PIN"
                      className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40 transition-all"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-[11px] text-purple-200 flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" aria-hidden="true" />
                  <span>
                    Login credentials: You will only log in using your registered <strong>Username</strong> and <strong>Security PIN</strong>.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" aria-hidden="true" />
                      <span>Register</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* --- VIEW 3: FORGOT PIN & RESET PASSWORD (Gmail Required) --- */}
          {authMode === 'forgot-pin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold inline-flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  Account Security Recovery
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign in</span>
                </button>
              </div>

              {resetStep === 'request' && (
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Reset Security PIN & Password
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Input your registered Gmail / Official Email address. We will verify your credentials and send a secure reset verification code directly to your registered inbox.
                  </p>

                  <form onSubmit={handleForgotPinRequest} className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-200 mb-1.5">
                        Registered Gmail / Official Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                        <input
                          id="forgot-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. admin@gapsite.com or ahmad@gmail.com"
                          className="w-full bg-slate-800/80 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1.5">
                        Required: The email address must match the one registered in your consultant profile.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" aria-hidden="true" />
                          <span>Send Reset to Registered Gmail</span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {resetStep === 'verify' && (
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Enter Verification Code & Set New PIN
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Dispatched to registered Gmail: <span className="font-mono text-amber-300 font-semibold">{forgotEmail}</span>
                    {dispatchedAccountName && <span className="text-slate-300"> ({dispatchedAccountName})</span>}
                  </p>

                  {/* Immediate Simulation Dispatch Code Banner */}
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-xs text-amber-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-amber-200 block">Security Code Sent:</span>
                      <span className="text-[11px] text-slate-200">Check inbox or use the 6-digit code:</span>
                    </div>
                    <span className="font-mono text-base font-black px-2.5 py-1 rounded bg-amber-500/25 text-amber-300 border border-amber-400/40 tracking-widest">
                      {generatedCode}
                    </span>
                  </div>

                  <form onSubmit={handleResetPinSubmit} className="space-y-3.5 mt-4">
                    <div>
                      <label htmlFor="verify-code" className="block text-xs font-semibold text-slate-200 mb-1">
                        6-Digit Verification Code *
                      </label>
                      <input
                        id="verify-code"
                        name="code"
                        type="text"
                        required
                        maxLength={6}
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="reset-newpin" className="block text-xs font-semibold text-slate-200">
                            New Security PIN *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowNewPin(!showNewPin)}
                            aria-label={showNewPin ? 'Hide new PIN' : 'Show new PIN'}
                            className="text-[11px] text-slate-300 hover:text-slate-100 cursor-pointer p-0.5 rounded"
                          >
                            {showNewPin ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <input
                          id="reset-newpin"
                          name="newPin"
                          type={showNewPin ? 'text' : 'password'}
                          required
                          maxLength={6}
                          autoComplete="new-password"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder="4-6 digits"
                          className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="reset-confirmpin" className="block text-xs font-semibold text-slate-200 mb-1">
                          Confirm New PIN *
                        </label>
                        <input
                          id="reset-confirmpin"
                          name="confirmNewPin"
                          type={showNewPin ? 'text' : 'password'}
                          required
                          maxLength={6}
                          autoComplete="new-password"
                          value={confirmNewPin}
                          onChange={(e) => setConfirmNewPin(e.target.value)}
                          placeholder="4-6 digits"
                          className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep('request');
                          setErrorMsg(null);
                        }}
                        className="py-2.5 px-3 rounded-xl border border-slate-600 text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Resend Code</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>Update PIN & Sign In</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>PT Gandhara Artha Persada</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Username & PIN Verification</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
