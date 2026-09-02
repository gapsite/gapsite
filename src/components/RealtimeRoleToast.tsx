import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';

export const RealtimeRoleToast: React.FC = () => {
  const { realtimeRoleToast, dismissRealtimeRoleToast, currentUser } = useProjects();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (realtimeRoleToast?.show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissRealtimeRoleToast, 300);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [realtimeRoleToast, dismissRealtimeRoleToast]);

  if (!realtimeRoleToast?.show && !visible) return null;

  return (
    <div
      id="realtime-role-toast-notification"
      className={`fixed top-4 right-4 z-[9999] max-w-md w-full sm:w-[420px] transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-500/20 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-6 h-6 text-white animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Real-time RBAC Update
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-auto">Tanpa Refresh</span>
            </div>

            <h4 className="text-sm font-bold text-white leading-tight">
              Peran Anda Telah Diperbarui Langsung
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Otorisasi oleh <span className="font-semibold text-amber-300">{realtimeRoleToast?.updatedBy || 'admin.master'}</span>:
            </p>

            <div className="mt-2.5 p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2">
              {realtimeRoleToast?.oldRole && (
                <>
                  <span className="text-[11px] font-medium text-slate-400 line-through truncate max-w-[120px]">
                    {realtimeRoleToast.oldRole}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </>
              )}
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {realtimeRoleToast?.roleTitle || currentUser.roleTitle || currentUser.role}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Hak akses & modul menu telah disesuaikan secara instan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setVisible(false);
              setTimeout(dismissRealtimeRoleToast, 300);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
