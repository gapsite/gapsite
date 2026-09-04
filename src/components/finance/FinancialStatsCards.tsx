import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  CalendarCheck,
} from 'lucide-react';
import { FinancialTransaction } from '../../types';
import { formatIDRShort } from '../../utils/formatters';

interface FinancialStatsCardsProps {
  transactions: FinancialTransaction[];
  selectedDateRangeLabel?: string;
}

export const FinancialStatsCards: React.FC<FinancialStatsCardsProps> = ({
  transactions,
  selectedDateRangeLabel = 'All Time',
}) => {
  // All transactions tally
  const incomeTransactions = transactions.filter((t) => t.type === 'INCOME');
  const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amountIDR, 0);
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amountIDR, 0);

  const netCashFlow = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(1) : '0';

  // Today's daily statistics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayIncome = todayTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amountIDR, 0);
  const todayExpense = todayTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amountIDR, 0);
  const todayNet = todayIncome - todayExpense;

  return (
    <div className="space-y-4 mb-6">
      {/* Primary KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Inflow / Income */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Inflow / Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 relative">
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {formatIDRShort(totalIncome)}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Rp {(totalIncome || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {incomeTransactions.length} Transaksi Masuk
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Tercatat Langsung</span>
          </div>
        </div>

        {/* 2. Total Outflow / Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Disbursements
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 relative">
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {formatIDRShort(totalExpense)}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Rp {(totalExpense || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {expenseTransactions.length} Transaksi Keluar
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Tercatat Langsung</span>
          </div>
        </div>

        {/* 3. Net Operating Cash Flow */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs hover:shadow-md transition-shadow relative overflow-hidden ${
          netCashFlow >= 0
            ? 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white border-slate-800'
            : 'bg-gradient-to-br from-rose-950 to-slate-900 text-white border-rose-900'
        }`}>
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Net Cash Flow / Profit
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              netCashFlow >= 0
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
            }`}>
              {profitMargin}% Margin
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {netCashFlow >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(netCashFlow))}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Rp {(Math.abs(netCashFlow) || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span>Saldo Kas Bersih:</span>
            <span className="font-mono font-bold text-emerald-300">
              {netCashFlow >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(netCashFlow))}
            </span>
          </div>
        </div>

        {/* 4. Rekap Transaksi Arus Kas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              Aktivitas Buku Kas
            </span>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Realtime
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Total Entri Transaksi:
              </span>
              <span className="font-mono font-bold text-slate-800">
                {transactions.length} Entri
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Aktivitas Hari Ini:
              </span>
              <span className="font-mono font-bold text-indigo-700">
                {todayTransactions.length} Transaksi
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Arus Kas Hari Ini:</span>
            <span className={`font-mono font-bold ${todayNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {todayNet >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(todayNet))}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Ledger Ribbon Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl px-4 py-3 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Daily Operations & Cash Flow Snapshot
              </h4>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                {todayStr}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Active ledger scope: <span className="text-emerald-400 font-semibold">{selectedDateRangeLabel}</span> ({transactions.length} total transaction entries recorded)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Today's Inflow</span>
            <span className="font-bold text-emerald-400">+{formatIDRShort(todayIncome)}</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Today's Outflow</span>
            <span className="font-bold text-rose-400">-{formatIDRShort(todayExpense)}</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Today's Net</span>
            <span className={`font-bold ${todayNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {todayNet >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(todayNet))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
