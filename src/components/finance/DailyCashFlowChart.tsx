import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { FinancialTransaction, ConsultingProject } from '../../types';
import { formatIDRShort, getTransactionCategoryLabel } from '../../utils/formatters';

interface DailyCashFlowChartProps {
  transactions: FinancialTransaction[];
  projects: ConsultingProject[];
}

export const DailyCashFlowChart: React.FC<DailyCashFlowChartProps> = ({
  transactions,
  projects,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'timeline' | 'categories' | 'profitability'>('timeline');
  const [timelineMode, setTimelineMode] = useState<'daily' | 'monthly'>('daily');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // 1. Prepare Daily Timeline Data
  const dailyTimelineData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number; net: number; count: number }>();
    
    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach((t) => {
      const d = t.date;
      const existing = map.get(d) || { date: d, income: 0, expense: 0, net: 0, count: 0 };
      if (t.type === 'INCOME') {
        existing.income += t.amountIDR;
      } else {
        existing.expense += t.amountIDR;
      }
      existing.net = existing.income - existing.expense;
      existing.count += 1;
      map.set(d, existing);
    });

    return Array.from(map.values());
  }, [transactions]);

  // 2. Prepare Monthly Timeline Data
  const monthlyTimelineData = useMemo(() => {
    const map = new Map<string, { month: string; monthLabel: string; income: number; expense: number; net: number; count: number }>();

    transactions.forEach((t) => {
      const ym = t.date.slice(0, 7); // "YYYY-MM"
      const dateObj = new Date(t.date);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const existing = map.get(ym) || { month: ym, monthLabel: label, income: 0, expense: 0, net: 0, count: 0 };
      if (t.type === 'INCOME') {
        existing.income += t.amountIDR;
      } else {
        existing.expense += t.amountIDR;
      }
      existing.net = existing.income - existing.expense;
      existing.count += 1;
      map.set(ym, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // 3. Prepare Category Breakdowns
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let totalExp = 0;
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        totalExp += t.amountIDR;
        map.set(t.category, (map.get(t.category) || 0) + t.amountIDR);
      });

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        label: getTransactionCategoryLabel(category),
        amount,
        percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const incomeCategoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let totalInc = 0;
    transactions
      .filter((t) => t.type === 'INCOME')
      .forEach((t) => {
        totalInc += t.amountIDR;
        map.set(t.category, (map.get(t.category) || 0) + t.amountIDR);
      });

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        label: getTransactionCategoryLabel(category),
        amount,
        percentage: totalInc > 0 ? (amount / totalInc) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // 4. Prepare Project Profitability Matrix
  const projectProfitability = useMemo(() => {
    return projects.map((p) => {
      const projectTrx = transactions.filter((t) => t.projectId === p.id);
      const income = projectTrx
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amountIDR, 0);
      const expense = projectTrx
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amountIDR, 0);
      const net = income - expense;
      const margin = income > 0 ? (net / income) * 100 : 0;
      const contractValue = p.contractValueIDR || 0;
      const billedPercentage = contractValue > 0 ? Math.min(100, (income / contractValue) * 100) : 0;

      return {
        project: p,
        income,
        expense,
        net,
        margin,
        contractValue,
        billedPercentage,
        txCount: projectTrx.length,
      };
    }).sort((a, b) => b.income - a.income);
  }, [projects, transactions]);

  // Max value calculation for bar scaling
  const currentTimelineList = timelineMode === 'daily' ? dailyTimelineData : monthlyTimelineData;
  const maxBarValue = Math.max(
    ...currentTimelineList.map((d) => Math.max(d.income, d.expense)),
    1000000
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Financial Analytics & Cash Flow Intelligence
          </h3>
          <p className="text-xs text-slate-500">
            Real-time daily ledger aggregates, category cost distribution & project margins
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveChartTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cash Flow Timeline</span>
          </button>

          <button
            onClick={() => setActiveChartTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'categories'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Cost & Revenue Breakdown</span>
          </button>

          <button
            onClick={() => setActiveChartTab('profitability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'profitability'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Project Margins</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Timeline Bar Chart */}
      {activeChartTab === 'timeline' && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                Income (Inflow)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                Expenses (Outflow)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 hidden sm:flex">
                <span className="w-3 h-0.5 bg-slate-900 rounded" />
                Net Balance
              </span>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setTimelineMode('daily')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timelineMode === 'daily' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Daily Entries
              </button>
              <button
                onClick={() => setTimelineMode('monthly')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timelineMode === 'monthly' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Monthly Rollup
              </button>
            </div>
          </div>

          {currentTimelineList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No financial records found to plot. Add daily income or expenses below.
            </div>
          ) : (
            <div className="relative pt-6 pb-2">
              {/* Chart Visual Bars */}
              <div className="h-56 flex items-end gap-3 sm:gap-6 overflow-x-auto pb-4 pt-4 px-2 scrollbar-thin">
                {currentTimelineList.map((item, idx) => {
                  const incomeHeight = (item.income / maxBarValue) * 100;
                  const expenseHeight = (item.expense / maxBarValue) * 100;
                  const label = (item as any).monthLabel || item.date;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredPoint(item)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="flex-1 min-w-[56px] max-w-[80px] flex flex-col items-center group cursor-pointer"
                    >
                      {/* Bar Columns */}
                      <div className="w-full h-40 flex items-end justify-center gap-1.5 relative">
                        {/* Income Bar */}
                        <div
                          style={{ height: `${Math.max(4, incomeHeight)}%` }}
                          className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                        >
                          {item.income > 0 && (
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded shadow-xs whitespace-nowrap z-10 transition-opacity">
                              +{formatIDRShort(item.income)}
                            </span>
                          )}
                        </div>

                        {/* Expense Bar */}
                        <div
                          style={{ height: `${Math.max(4, expenseHeight)}%` }}
                          className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                        >
                          {item.expense > 0 && (
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-rose-700 bg-rose-50 px-1 rounded shadow-xs whitespace-nowrap z-10 transition-opacity">
                              -{formatIDRShort(item.expense)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date Axis Label */}
                      <div className="mt-2 text-center">
                        <span className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-slate-900 block truncate max-w-[65px]">
                          {timelineMode === 'daily' ? item.date.slice(5) : (item as any).monthLabel}
                        </span>
                        <span className={`text-[9px] font-mono font-bold block ${
                          item.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.net >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(item.net))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover Floating Details Card */}
              {hoveredPoint && (
                <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-100 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold text-slate-200">
                      {(hoveredPoint as any).monthLabel || hoveredPoint.date}
                    </span>
                    <span className="text-slate-400">({hoveredPoint.count} entries)</span>
                  </div>
                  <div className="flex items-center gap-6 font-mono">
                    <span className="text-emerald-400">
                      Income: <strong>+Rp {hoveredPoint.income.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-rose-400">
                      Expense: <strong>-Rp {hoveredPoint.expense.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className={`font-bold ${hoveredPoint.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      Net: {hoveredPoint.net >= 0 ? '+' : '-'}Rp {Math.abs(hoveredPoint.net).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Category Breakdown */}
      {activeChartTab === 'categories' && (
        <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses Distribution */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-rose-700">
                <ArrowDownRight className="w-4 h-4" />
                Disbursement & Expense Allocation
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Total: {formatIDRShort(expenseCategoryBreakdown.reduce((s, c) => s + c.amount, 0))}
              </span>
            </h4>
            <div className="space-y-2.5">
              {expenseCategoryBreakdown.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {c.amount.toLocaleString('id-ID')} ({c.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.percentage}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Stream Distribution */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <ArrowUpRight className="w-4 h-4" />
                Revenue & Inflow Streams
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Total: {formatIDRShort(incomeCategoryBreakdown.reduce((s, c) => s + c.amount, 0))}
              </span>
            </h4>
            <div className="space-y-2.5">
              {incomeCategoryBreakdown.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {c.amount.toLocaleString('id-ID')} ({c.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Project Margins Matrix */}
      {activeChartTab === 'profitability' && (
        <div className="pt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="py-2.5 px-3">Project & Client</th>
                <th className="py-2.5 px-3">Contract Value</th>
                <th className="py-2.5 px-3">Billed / Inflow</th>
                <th className="py-2.5 px-3">Direct Outflow</th>
                <th className="py-2.5 px-3">Net Realized</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {projectProfitability.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.project.clientName}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      <span className="text-emerald-700 font-semibold">{item.project.code}</span>
                      <span>•</span>
                      <span>{item.project.productOrServiceName.slice(0, 32)}...</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {formatIDRShort(item.contractValue)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    +{formatIDRShort(item.income)}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {item.billedPercentage.toFixed(0)}% Billed
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-rose-700">
                    -{formatIDRShort(item.expense)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={item.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {item.net >= 0 ? '+' : '-'}{formatIDRShort(Math.abs(item.net))}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] border ${
                      item.margin >= 40
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.margin >= 20
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
