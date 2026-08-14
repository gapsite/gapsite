import React, { useState } from 'react';
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
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { FinancialStatsCards } from './FinancialStatsCards';
import { DailyCashFlowChart } from './DailyCashFlowChart';
import { FinancialLedgerTable } from './FinancialLedgerTable';
import { TransactionModal } from './TransactionModal';
import {
  FinancialTransaction,
  TransactionType,
  TransactionStatus,
} from '../../types';

interface FinancialManagementProps {
  onSelectProject?: (projectId: string) => void;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({
  onSelectProject,
}) => {
  const {
    transactions,
    projects,
    updateTransaction,
    deleteTransaction,
  } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
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
                  Track client consulting milestone retainers, surveyor audit disbursements & operational ledger
                </p>
              </div>
            </div>
          </div>

          {/* Quick Transaction Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
    </div>
  );
};
