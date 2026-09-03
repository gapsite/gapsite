import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  PieChart,
  Layers,
  Sparkles,
  Landmark,
  Receipt,
  BarChart3,
  CreditCard,
  Users,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { FinancialStatsCards } from './FinancialStatsCards';
import { DailyCashFlowChart } from './DailyCashFlowChart';
import { FinancialLedgerTable } from './FinancialLedgerTable';
import { BankLoanManagement } from './BankLoanManagement';
import { TaxManagement } from './TaxManagement';
import { ReceivableManagement } from './ReceivableManagement';
import { PayrollManagement } from './PayrollManagement';
import { TransactionModal } from './TransactionModal';
import { CompanyCapitalModal } from './CompanyCapitalModal';
import {
  FinancialTransaction,
  TransactionType,
  TransactionStatus,
} from '../../types';
import { formatIDR } from '../../utils/formatters';

interface FinancialManagementProps {
  initialTab?: 'LEDGER' | 'RECEIVABLES' | 'BANK_LOANS' | 'TAX_MANAGEMENT' | 'PAYROLL' | 'ANALYTICS';
  onSelectProject?: (projectId: string) => void;
  onOpenReports?: () => void;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({
  initialTab = 'LEDGER',
  onSelectProject,
  onOpenReports,
}) => {
  const {
    transactions,
    projects,
    bankLoans,
    taxObligations,
    receivables,
    payrollRecords,
    updateTransaction,
    deleteTransaction,
  } = useProjects();

  const [activeTab, setActiveTab] = useState<'LEDGER' | 'RECEIVABLES' | 'BANK_LOANS' | 'TAX_MANAGEMENT' | 'PAYROLL' | 'ANALYTICS'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('INCOME');
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  const handleOpenNewTransaction = (type: TransactionType) => {
    setModalType(type);
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: FinancialTransaction) => {
    setModalType(tx.type);
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (id: string, newStatus: TransactionStatus) => {
    updateTransaction(id, { status: newStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                  Financial Management & Daily Cash Flow
                </h1>
                <p className="text-xs text-slate-400">
                  Track client consulting milestone retainers, surveyor audit disbursements, bank loans & operational ledger
                </p>
              </div>
            </div>
          </div>

          {/* Quick Transaction Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setIsCapitalModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Atur Modal Dasar & Modal Tambahan Perusahaan"
            >
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>Modal Perusahaan</span>
            </button>

            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                title="Buka Studio Output Laporan Keuangan"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Output Laporan Keuangan</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('PAYROLL')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Kelola & Bayar Gaji Karyawan"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Gaji Karyawan</span>
            </button>

            <button
              onClick={() => handleOpenNewTransaction('EXPENSE')}
              className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-all hover:scale-[1.02]"
            >
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              <span>Record Expense</span>
            </button>

            <button
              onClick={() => handleOpenNewTransaction('INCOME')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02]"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Record Income</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'LEDGER'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Buku Kas & Jurnal Harian</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIVABLES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'RECEIVABLES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-400" />
          <span>Piutang Usaha & Invoice Termin</span>
          {receivables && receivables.filter((r) => r.status !== 'LUNAS' && r.status !== 'BATAL' && (r.remainingAmountIDR || 0) > 0).length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'RECEIVABLES' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {receivables.filter((r) => r.status !== 'LUNAS' && r.status !== 'BATAL' && (r.remainingAmountIDR || 0) > 0).length} Aktif
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('BANK_LOANS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'BANK_LOANS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4 text-indigo-400" />
          <span>Debt & Bank Loan Management</span>
          {bankLoans && bankLoans.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'BANK_LOANS' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {bankLoans.length} Fasilitas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('TAX_MANAGEMENT')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'TAX_MANAGEMENT'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Pajak & Hutang PPN / PPh</span>
          {taxObligations && taxObligations.filter((t) => t.status !== 'PAID' && (t.remainingAmount > 0 || t.taxAmount > (t.paidAmount || 0))).length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'TAX_MANAGEMENT' ? 'bg-emerald-800 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {taxObligations.filter((t) => t.status !== 'PAID' && (t.remainingAmount > 0 || t.taxAmount > (t.paidAmount || 0))).length} Terhutang
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PAYROLL')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PAYROLL'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Gaji Karyawan & Payroll</span>
          {payrollRecords && payrollRecords.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'PAYROLL' ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {payrollRecords.length} Slip
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analitik & Arus Kas</span>
        </button>
      </div>

      {/* Tab 1: Ledger & Summary */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <FinancialStatsCards transactions={transactions} />

          {/* Interactive Cash Flow Analytics & Charts */}
          <DailyCashFlowChart transactions={transactions} projects={projects} />

          {/* Comprehensive Daily Transaction Ledger Table */}
          <FinancialLedgerTable
            transactions={transactions}
            projects={projects}
            onOpenNewTransaction={handleOpenNewTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
            onUpdateTransactionStatus={handleUpdateStatus}
            onSelectProject={onSelectProject}
          />
        </div>
      )}

      {/* Tab 2: Piutang Usaha & Invoice Termin Sub-Section */}
      {activeTab === 'RECEIVABLES' && (
        <ReceivableManagement />
      )}

      {/* Tab 3: Bank Loan Management Sub-Section */}
      {activeTab === 'BANK_LOANS' && (
        <BankLoanManagement />
      )}

      {/* Tab 4: Tax Management & Tax Liabilities (PPN / PPh) */}
      {activeTab === 'TAX_MANAGEMENT' && (
        <TaxManagement />
      )}

      {/* Tab 5: Employee Salary & Payroll Management */}
      {activeTab === 'PAYROLL' && (
        <PayrollManagement />
      )}

      {/* Tab 4: Detailed Analytics & Cashflow Chart */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <FinancialStatsCards transactions={transactions} />
          <DailyCashFlowChart transactions={transactions} projects={projects} />
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        initialType={modalType}
        editingTransaction={editingTransaction}
      />

      {/* Company Capital Settings Modal */}
      <CompanyCapitalModal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
      />
    </div>
  );
};
