import React from 'react';
import {
  TrendingUp,
  Award,
  AlertCircle,
  FileCheck2,
  CalendarCheck,
  Coins,
  CheckCircle,
  Clock,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { formatIDRShort } from '../utils/formatters';

export const KpiMetrics: React.FC = () => {
  const { projects, dispositions, transactions } = useProjects();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.stage !== 'CERTIFICATE_ISSUED' && p.stage !== 'CLOSED');
  const certifiedProjects = projects.filter((p) => p.stage === 'CERTIFICATE_ISSUED');
  
  const totalPipelineValue = projects.reduce((acc, p) => acc + (p.contractValueIDR || 0), 0);
  
  // Real-time financial calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amountIDR, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountIDR, 0);
  const netProfit = totalIncome - totalExpense;

  const avgTkdn =
    projects.length > 0
      ? (
          projects.reduce((acc, p) => acc + (p.officialVerifiedTkdnPercentage || p.projectedTkdnPercentage || 0), 0) /
          projects.length
        ).toFixed(1)
      : '0';

  const pendingDispositions = dispositions.filter(
    (d) => d.status === 'PENDING' || d.status === 'IN_PROGRESS' || d.status === 'UNDER_REVIEW'
  );
  
  const urgentDispositions = dispositions.filter(
    (d) => d.priority === 'URGENT' && d.status !== 'COMPLETED'
  );

  const upcomingAudits = projects.filter((p) => p.surveyorAuditDate && p.stage === 'FIELD_VERIFICATION');

  const atRiskProjects = projects.filter((p) => p.status === 'AT_RISK' || p.status === 'DELAYED');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* 1. Total Active Projects */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Active Projects</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {activeProjects.length}
          </span>
          <span className="text-[11px] font-medium text-slate-600">/ {totalProjects} total</span>
        </div>
        <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {certifiedProjects.length} certified & signed
        </p>
      </div>

      {/* 2. Total Consulting Pipeline Value */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Pipeline Value</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {formatIDRShort(totalPipelineValue)}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 font-medium">
          Active engagements
        </p>
      </div>

      {/* 3. Net Cash Flow & Profit */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Net Operating Flow</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-2xl font-black tracking-tight font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {netProfit >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(netProfit))}
          </span>
        </div>
        <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          +{formatIDRShort(totalIncome)} inflow
        </p>
      </div>

      {/* 4. Average TKDN Score */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Avg TKDN Score</span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black tracking-tight text-teal-700 font-mono">
            {avgTkdn}%
          </span>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
            KDN
          </span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 font-medium">
          Target vs realized
        </p>
      </div>

      {/* 5. Active Job Dispositions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Open Dispositions</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {pendingDispositions.length}
          </span>
          {urgentDispositions.length > 0 && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {urgentDispositions.length} urgent
            </span>
          )}
        </div>
        <p className="text-[11px] text-amber-700 mt-1 font-medium">
          Assigned team members
        </p>
      </div>

      {/* 6. LVI Site Audits */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">LVI Site Audits</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {upcomingAudits.length}
          </span>
        </div>
        <p className="text-[11px] text-indigo-700 mt-1 font-medium">
          Sucofindo / SI scheduled
        </p>
      </div>
    </div>
  );
};

