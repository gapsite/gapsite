import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Calculator,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Trash2,
  Edit2,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Layers,
  Sparkles,
  Info,
  X,
  CreditCard,
  RefreshCw,
  HelpCircle,
  Users,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { BankLoan, LoanInstallmentScheduleItem, LoanFacilityType } from '../../types';
import {
  calculateBankLoanSchedule,
  calculateLoansAggregateMetrics,
} from '../../utils/loanCalculations';

export const BankLoanManagement: React.FC = () => {
  const {
    bankLoans,
    addBankLoan,
    updateBankLoan,
    deleteBankLoan,
    recordLoanDisbursementToLedger,
    recordLoanInstallmentToLedger,
    paymentChannels,
    isMasterAdmin,
    hasPermission,
    currentUser,
    transactions,
  } = useProjects();

  const canManage =
    isMasterAdmin ||
    hasPermission('MANAGE_FINANCE') ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'FINANCE';

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; title: string; text: string } | null>(null);

  // Form State for Adding / Editing Bank Loan
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const [loanName, setLoanName] = useState('');
  const [facilityType, setFacilityType] = useState<LoanFacilityType>('NON_REVOLVING');
  const [bankName, setBankName] = useState('Bank Rakyat Indonesia (BRI)');
  const [accountNumber, setAccountNumber] = useState('');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(500000000);
  const [annualInterestRate, setAnnualInterestRate] = useState<number | ''>(9.5);
  const [tenureMonths, setTenureMonths] = useState<number | ''>(24);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentChannelId, setPaymentChannelId] = useState('BANK_TRANSFER_BRI');
  const [purpose, setPurpose] = useState('Modal Kerja & Operasional Sertifikasi TKDN');
  const [notes, setNotes] = useState('');

  // Selected Loan for Schedule & Payment Drawer
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<BankLoan | null>(null);

  // Status and Facility Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAID_OFF'>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<'ALL' | 'NON_REVOLVING' | 'REVOLVING' | 'OTHER'>('ALL');

  // Interactive Modals State
  const [loanToDisburse, setLoanToDisburse] = useState<BankLoan | null>(null);
  const [disburseChannelId, setDisburseChannelId] = useState<string>('BANK_TRANSFER_BRI');
  const [disburseDate, setDisburseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [disburseRef, setDisburseRef] = useState<string>('');
  const [disburseNotes, setDisburseNotes] = useState<string>('');

  const [installmentToPay, setInstallmentToPay] = useState<{ loan: BankLoan; item: LoanInstallmentScheduleItem } | null>(null);
  const [payChannelId, setPayChannelId] = useState<string>('BANK_TRANSFER_BRI');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  const [loanToDelete, setLoanToDelete] = useState<BankLoan | null>(null);

  // Live calculation preview for the form
  const liveFormCalculation = useMemo(() => {
    const p = typeof principalAmount === 'number' ? principalAmount : 0;
    const r = typeof annualInterestRate === 'number' ? annualInterestRate : 0;
    const t = typeof tenureMonths === 'number' ? tenureMonths : 1;
    return calculateBankLoanSchedule(p, r, t, startDate, facilityType);
  }, [principalAmount, annualInterestRate, tenureMonths, startDate, facilityType]);

  // Aggregate Metrics across all loans
  const metrics = useMemo(() => {
    return calculateLoansAggregateMetrics(bankLoans || []);
  }, [bankLoans]);

  const filteredLoans = useMemo(() => {
    return (bankLoans || []).filter((loan) => {
      if (statusFilter !== 'ALL' && loan.status !== statusFilter) return false;
      const fType = loan.facilityType || 'NON_REVOLVING';
      if (facilityFilter !== 'ALL' && fType !== facilityFilter) return false;
      return true;
    });
  }, [bankLoans, statusFilter, facilityFilter]);

  const handleOpenAddForm = () => {
    setEditingLoanId(null);
    setLoanName('');
    setFacilityType('NON_REVOLVING');
    setBankName('Bank Rakyat Indonesia (BRI)');
    setAccountNumber('');
    setPrincipalAmount(500000000);
    setAnnualInterestRate(9.5);
    setTenureMonths(24);
    setStartDate(new Date().toISOString().slice(0, 10));
    setPaymentChannelId(paymentChannels.find((c) => c.status === 'ACTIVE')?.id || 'BANK_TRANSFER_BRI');
    setPurpose('Modal Kerja & Operasional Sertifikasi TKDN');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (loan: BankLoan) => {
    setEditingLoanId(loan.id);
    setLoanName(loan.loanName);
    setFacilityType(loan.facilityType || 'NON_REVOLVING');
    setBankName(loan.bankName);
    setAccountNumber(loan.accountNumber || '');
    setPrincipalAmount(loan.principalAmount);
    setAnnualInterestRate(loan.annualInterestRate);
    setTenureMonths(loan.tenureMonths);
    setStartDate(loan.startDate);
    setPaymentChannelId(loan.paymentChannelId || 'BANK_TRANSFER_BRI');
    setPurpose(loan.purpose || '');
    setNotes(loan.notes || '');
    setIsFormOpen(true);
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setToastMessage({ type: 'error', title: 'Akses Ditolak', text: 'Anda tidak memiliki wewenang mengelola pinjaman bank.' });
      return;
    }

    if (!loanName.trim()) {
      setToastMessage({ type: 'error', title: 'Data Belum Lengkap', text: 'Mohon isi nama fasilitas / kredit pinjaman.' });
      return;
    }

    const p = typeof principalAmount === 'number' ? principalAmount : 0;
    const r = typeof annualInterestRate === 'number' ? annualInterestRate : 0;
    const t = typeof tenureMonths === 'number' ? tenureMonths : 1;

    if (p <= 0 || t <= 0) {
      setToastMessage({ type: 'error', title: 'Input Tidak Valid', text: 'Plafon pokok pinjaman dan tenor harus lebih besar dari 0.' });
      return;
    }

    if (editingLoanId) {
      const res = updateBankLoan(editingLoanId, {
        loanName: loanName.trim(),
        facilityType,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        principalAmount: p,
        annualInterestRate: r,
        tenureMonths: t,
        startDate,
        paymentChannelId,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setToastMessage({
        type: res.success ? 'success' : 'error',
        title: res.success ? 'Berhasil Diperbarui' : 'Gagal Menyimpan',
        text: res.message || 'Perubahan fasilitas pinjaman bank berhasil disimpan.',
      });
    } else {
      const res = addBankLoan({
        loanName: loanName.trim(),
        facilityType,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        principalAmount: p,
        annualInterestRate: r,
        tenureMonths: t,
        startDate,
        paymentChannelId,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
        isDisbursed: false,
        status: 'ACTIVE',
      });

      setToastMessage({
        type: res.success ? 'success' : 'error',
        title: res.success ? 'Berhasil Didaftarkan' : 'Gagal Mendaftarkan',
        text: res.message || 'Fasilitas pinjaman bank baru berhasil ditambahkan.',
      });
    }

    setIsFormOpen(false);
    setEditingLoanId(null);
  };

  const handleOpenDeleteModal = (loan: BankLoan) => {
    setLoanToDelete(loan);
  };

  const handleConfirmDeleteLoan = () => {
    if (!loanToDelete) return;
    const res = deleteBankLoan(loanToDelete.id);
    setToastMessage({
      type: res.success ? 'success' : 'error',
      title: res.success ? 'Data Dihapus' : 'Gagal Menghapus',
      text: res.message || 'Fasilitas pinjaman bank berhasil dihapus.',
    });
    if (selectedLoanForSchedule?.id === loanToDelete.id) {
      setSelectedLoanForSchedule(null);
    }
    setLoanToDelete(null);
  };

  const handleOpenDisburseModal = (loan: BankLoan) => {
    setLoanToDisburse(loan);
    setDisburseChannelId(loan.paymentChannelId || 'BANK_TRANSFER_BRI');
    setDisburseDate(loan.startDate || new Date().toISOString().slice(0, 10));
    setDisburseRef(`LOAN-DISB-${loan.bankName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`);
    setDisburseNotes(`Pencairan pokok fasilitas pinjaman modal kerja ${loan.loanName} (${loan.bankName})`);
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanToDisburse) return;

    const res = recordLoanDisbursementToLedger(loanToDisburse.id, {
      channelId: disburseChannelId,
      date: disburseDate,
      referenceNumber: disburseRef,
      notes: disburseNotes,
    });

    setToastMessage({
      type: res.success ? 'success' : 'error',
      title: res.success ? 'Pencairan Berhasil' : 'Pencairan Gagal',
      text: res.message || 'Pokok pinjaman bank berhasil dibukukan ke jurnal penerimaan kas.',
    });

    setLoanToDisburse(null);
  };

  const handleOpenPayInstallmentModal = (loan: BankLoan, item: LoanInstallmentScheduleItem) => {
    setInstallmentToPay({ loan, item });
    setPayChannelId(loan.paymentChannelId || 'BANK_TRANSFER_BRI');
    setPayDate(item.dueDate || new Date().toISOString().slice(0, 10));
    setPayRef(`ANGS-M${item.monthNumber}-${loan.bankName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`);
    setPayNotes(
      item.paymentType === 'INTEREST_ONLY'
        ? `Pembayaran bunga pinjaman ${loan.loanName} bulan ke-${item.monthNumber} (${loan.annualInterestRate}% p.a.)`
        : `Pembayaran angsuran pokok & bunga pinjaman ${loan.loanName} bulan ke-${item.monthNumber}`
    );
  };

  const handleConfirmPayInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installmentToPay) return;

    const { loan, item } = installmentToPay;
    const res = recordLoanInstallmentToLedger(loan.id, item.monthNumber, {
      channelId: payChannelId,
      date: payDate,
      referenceNumber: payRef,
      notes: payNotes,
    });

    setToastMessage({
      type: res.success ? 'success' : 'error',
      title: res.success ? 'Pembayaran Berhasil' : 'Pembayaran Gagal',
      text: res.message || `Angsuran bulan ke-${item.monthNumber} berhasil dicatat ke buku kas pengeluaran.`,
    });

    // Refresh schedule drawer with updated data
    const updatedLoan = bankLoans.find((l) => l.id === loan.id);
    if (updatedLoan) {
      setSelectedLoanForSchedule(updatedLoan);
    }

    setInstallmentToPay(null);
  };

  // Sync selected loan state if bankLoans updates
  const activeSelectedLoan = useMemo(() => {
    if (!selectedLoanForSchedule) return null;
    return bankLoans.find((l) => l.id === selectedLoanForSchedule.id) || selectedLoanForSchedule;
  }, [selectedLoanForSchedule, bankLoans]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/40 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
                  <span>Bank Loan Management & Amortization</span>
                  <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Kredit & Pembiayaan Bank
                  </span>
                </h2>
                <p className="text-xs text-indigo-200/80">
                  Input Pokok Pinjaman, Suku Bunga Tahunan (% p.a.), & Tenor. Otomatis hitung beban bunga bulanan dan sinkronisasi ke buku kas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-950/40 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tambah Fasilitas Pinjaman Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Outstanding Principal */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Sisa Pokok Pinjaman Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            Rp {(metrics.totalActivePrincipalOutstanding || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Total Plafon Awal:</span>
            <strong className="font-mono text-slate-700">
              Rp {(metrics.totalFacilityAmount || 0).toLocaleString('id-ID')}
            </strong>
          </div>
        </div>

        {/* Metric 2: Monthly Installment Obligation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Total Angsuran Bulanan</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            Rp {(metrics.totalMonthlyInstallmentObligation || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Beban Bunga / Bln:</span>
            <strong className="font-mono text-indigo-600">
              Rp {(metrics.totalMonthlyInterestObligation || 0).toLocaleString('id-ID')}
            </strong>
          </div>
        </div>

        {/* Metric 3: Total Principal Repaid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Pokok Pinjaman Terbayar</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            Rp {(metrics.totalPrincipalRepaid || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Akumulasi Bunga Dibayar:</span>
            <strong className="font-mono text-slate-700">
              Rp {(metrics.totalInterestPaid || 0).toLocaleString('id-ID')}
            </strong>
          </div>
        </div>

        {/* Metric 4: Active Loan Facilities Count */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Fasilitas Kredit Bank</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {metrics.activeLoansCount} <span className="text-xs font-sans text-slate-400 font-normal">Aktif</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{metrics.paidOffLoansCount} Fasilitas Lunas • Total {metrics.totalLoansCount} Terdaftar</span>
          </div>
        </div>
      </div>

      {/* Main Container: Loan List / Cards & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <Landmark className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800">Daftar Fasilitas Pinjaman & Kredit Bank</h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {filteredLoans.length} Fasilitas
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Facility Filter */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFacilityFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  facilityFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Skema
              </button>
              <button
                type="button"
                onClick={() => setFacilityFilter('NON_REVOLVING')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  facilityFilter === 'NON_REVOLVING'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Non-Revolving</span>
              </button>
              <button
                type="button"
                onClick={() => setFacilityFilter('REVOLVING')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  facilityFilter === 'REVOLVING'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Revolving</span>
              </button>
              <button
                type="button"
                onClick={() => setFacilityFilter('OTHER')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  facilityFilter === 'OTHER'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Lain-lain / Perorangan</span>
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({bankLoans.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif ({metrics.activeLoansCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID_OFF')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'PAID_OFF'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lunas ({metrics.paidOffLoansCount})
              </button>
            </div>
          </div>
        </div>

        {/* Loan List Body */}
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center border border-indigo-100">
              <Landmark className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Belum Ada Fasilitas Pinjaman Bank</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Daftarkan fasilitas pinjaman kredit bank perusahaan (BRI, BNI, Mandiri, BCA, dll). Tersedia 2 metode: <strong>Revolving (Rekening Koran/KMK)</strong> dan <strong>Non-Revolving (Term Loan)</strong>.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pinjaman Bank Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredLoans.map((loan) => {
              const totalP = loan.principalAmount || 0;
              const remaining = loan.remainingPrincipal ?? totalP;
              const paidP = loan.paidPrincipal || 0;
              const percentPaid = totalP > 0 ? Math.min(100, Math.round((paidP / totalP) * 100)) : 0;
              const isPaidOff = loan.status === 'PAID_OFF' || remaining <= 0;
              const isRevolving = loan.facilityType === 'REVOLVING';
              const isOther = loan.facilityType === 'OTHER';

              // Revolving interest & duration progress calculation
              const tenure = loan.tenureMonths || 1;
              const paidScheduleItems = (loan.schedule || []).filter((s) => s.isPaid);
              const paidMonths = paidScheduleItems.length;
              const monthlyInterest = loan.monthlyInterest || Math.round((totalP * ((loan.annualInterestRate || 0) / 100)) / 12);
              const totalInterest = loan.totalInterest || (monthlyInterest * tenure);
              const paidInterest = loan.paidInterest || paidScheduleItems.reduce((acc, s) => acc + (s.interestPayment || 0), 0);
              const remainingMonths = Math.max(0, tenure - paidMonths);
              const remainingInterest = Math.max(0, totalInterest - paidInterest);
              const percentInterest = tenure > 0 ? Math.min(100, Math.round((paidMonths / tenure) * 100)) : 0;

              // Find next unpaid installment
              const nextUnpaid = loan.schedule?.find((s) => !s.isPaid);

              return (
                <div key={loan.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {loan.bankName}
                        </span>

                        {/* Facility Type Badge */}
                        {isRevolving ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-purple-600" />
                            <span>Revolving (Rekening Koran / KMK)</span>
                          </span>
                        ) : isOther ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-600" />
                            <span>Lain-lain (Perorangan / Non-Bank)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-sky-600" />
                            <span>Non-Revolving (Term Loan)</span>
                          </span>
                        )}

                        <h4 className="text-base font-bold text-slate-900">{loan.loanName}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPaidOff
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {isPaidOff ? '✓ Lunas' : '● Aktif'}
                        </span>
                        {loan.isDisbursed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Tercairkan ke Kas
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Belum Dicairkan ke Kas
                          </span>
                        )}
                      </div>

                      {/* Financial Badges & Parameters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-500 block">Plafon Pokok</span>
                          <span className="text-xs font-bold font-mono text-slate-900">
                            Rp {loan.principalAmount.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-500 block">Bunga & Tenor</span>
                          <span className="text-xs font-bold font-mono text-indigo-700">
                            {loan.annualInterestRate}% p.a. • {loan.tenureMonths} Bln
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            {isRevolving ? 'Skema Pokok Rutin' : 'Angsuran Pokok / Bln'}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-800">
                            {isRevolving ? 'Fleksibel / Akhir Tenor' : `Rp ${(loan.monthlyPrincipal || 0).toLocaleString('id-ID')}`}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            {isRevolving ? 'Kewajiban Bunga / Bln' : 'Beban Bunga / Bln'}
                          </span>
                          <span className="text-xs font-bold font-mono text-rose-600">
                            Rp {(loan.monthlyInterest || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar of Repayment / Interest Accrual */}
                      {isRevolving ? (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-purple-700">
                                Progress Bunga Berjalan ({percentInterest}%):
                              </span>
                              <span className="font-mono text-slate-700 font-semibold">
                                {paidMonths} dari {tenure} Bulan
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="font-mono text-slate-700">
                                Rp {paidInterest.toLocaleString('id-ID')} / Rp {totalInterest.toLocaleString('id-ID')}
                              </span>
                            </span>
                            <span className="font-bold text-slate-700 font-mono">
                              Sisa Durasi Kredit: {remainingMonths} Bulan (Beban Bunga: Rp {remainingInterest.toLocaleString('id-ID')})
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentInterest}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span>
                              Progress Pelunasan Pokok ({percentPaid}%): Rp {paidP.toLocaleString('id-ID')} / Rp{' '}
                              {totalP.toLocaleString('id-ID')}
                            </span>
                            <span className="font-bold text-slate-700">
                              Sisa Pokok: Rp {remaining.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Schedule & Pay Drawer Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedLoanForSchedule(loan)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Jadwal Angsuran & Bayar</span>
                      </button>

                      {/* Disburse to Ledger Button if not yet disbursed */}
                      {!loan.isDisbursed && canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenDisburseModal(loan)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title="Catat pencairan pokok pinjaman ke buku kas penerimaan"
                        >
                          <ArrowDownRight className="w-4 h-4" />
                          <span>Cairkan ke Buku Kas</span>
                        </button>
                      )}

                      {/* Next Quick Payment if active */}
                      {nextUnpaid && canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenPayInstallmentModal(loan, nextUnpaid)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title={`Bayar angsuran bulan ke-${nextUnpaid.monthNumber} (${isRevolving ? 'Bunga saja' : 'Pokok + Bunga'})`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                          <span>
                            Bayar Angsuran Bln #{nextUnpaid.monthNumber} ({isRevolving ? 'Bunga' : 'P+B'})
                          </span>
                        </button>
                      )}

                      {/* Manage buttons */}
                      {canManage && (
                        <div className="flex items-center gap-1.5 self-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(loan)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Edit data pinjaman"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(loan)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Hapus fasilitas pinjaman"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT BANK LOAN MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingLoanId ? 'Edit Fasilitas Pinjaman Bank' : 'Tambah Fasilitas Pinjaman Bank Baru'}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Pilih metode fasilitas (Revolving vs Non-Revolving) & kalkulasi otomatis simulasi angsuran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveLoan} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 3-Option Facility Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
                  <span>Metode / Sifat Fasilitas Pinjaman <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-normal text-slate-500">Pilih skema amortisasi & kewajiban kas</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Non-Revolving Card */}
                  <div
                    onClick={() => setFacilityType('NON_REVOLVING')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      facilityType === 'NON_REVOLVING'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${facilityType === 'NON_REVOLVING' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">Non-Revolving (Term Loan)</div>
                          <div className="text-[10px] text-indigo-700 font-semibold">Cicilan Pokok + Bunga</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        facilityType === 'NON_REVOLVING' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}>
                        {facilityType === 'NON_REVOLVING' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      Angsuran bulanan merata mencakup pembayaran cicilan pokok pinjaman dan beban bunga berjalan selama tenor.
                    </p>
                  </div>

                  {/* Revolving Card */}
                  <div
                    onClick={() => setFacilityType('REVOLVING')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      facilityType === 'REVOLVING'
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${facilityType === 'REVOLVING' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">Revolving (KMK / Koran)</div>
                          <div className="text-[10px] text-purple-700 font-semibold">Beban Bunga Saja (Interest-Only)</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        facilityType === 'REVOLVING' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                      }`}>
                        {facilityType === 'REVOLVING' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      Kewajiban bulanan hanya Beban Bunga. Pokok fleksibel ditarik/dilunasi atau dilunasi penuh akhir masa fasilitas.
                    </p>
                  </div>

                  {/* Other / Individual Card */}
                  <div
                    onClick={() => setFacilityType('OTHER')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      facilityType === 'OTHER'
                        ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${facilityType === 'OTHER' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">Lain-lain / Perorangan</div>
                          <div className="text-[10px] text-amber-700 font-semibold">Perorangan / Non-Bank</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        facilityType === 'OTHER' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                      }`}>
                        {facilityType === 'OTHER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      Pinjaman dari perorangan, pemilik saham, direksi, atau non-bank. Fleksibel dengan bunga 0% (tanpa bunga) atau kustom.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Loan Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Nama Fasilitas / Produk Pinjaman <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loanName}
                    onChange={(e) => setLoanName(e.target.value)}
                    placeholder={
                      facilityType === 'OTHER'
                        ? 'Contoh: Pinjaman Pemegang Saham / Talangan Operasional Direksi'
                        : facilityType === 'REVOLVING'
                        ? 'Contoh: KMK Rekening Koran BRI - Modal Kerja TKDN'
                        : 'Contoh: Term Loan Investasi Mandiri - Sertifikasi'
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Bank / Creditor Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    {facilityType === 'OTHER' ? 'Nama Kreditur / Pemberi Pinjaman (Perorangan / Lembaga) *' : 'Nama Bank / Kreditur *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={
                      facilityType === 'OTHER'
                        ? 'Contoh: Bpk. Hendra Wijaya (Direksi / Pemegang Saham)'
                        : 'Contoh: Bank BRI / Bank Mandiri / Bank BNI'
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Account / Contract Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    {facilityType === 'OTHER' ? 'Nomor Rekening / Surat Perjanjian Utang' : 'Nomor Rekening / Kontrak Kredit'}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={
                      facilityType === 'OTHER'
                        ? 'Contoh: SP-UTANG/2026/001 atau 0123-4567-8901'
                        : 'Contoh: 0123-4567-8901-23'
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Principal Amount (Pokok Pinjaman) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Plafon Pokok Pinjaman (IDR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      required
                      min={1000000}
                      step={1000000}
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="500000000"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Annual Interest Rate (% p.a.) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
                    <span>Suku Bunga Tahunan (% p.a.) <span className="text-rose-500">*</span></span>
                    {facilityType === 'OTHER' && <span className="text-[10px] text-amber-700 font-normal">(Isi 0 jika pinjaman tanpa bunga)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step={0.1}
                      value={annualInterestRate}
                      onChange={(e) =>
                        setAnnualInterestRate(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder={facilityType === 'OTHER' ? '0' : '9.5'}
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 pr-9 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">% p.a.</span>
                  </div>
                </div>

                {/* Tenure (Months) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Tenor Fasilitas (Bulan) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={360}
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="24"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">Bulan</span>
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Tanggal Akad / Efektif Pinjaman <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Disbursement Payment Channel */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Rekening Saluran Kas Penerima & Pembayar Angsuran
                  </label>
                  <select
                    value={paymentChannelId}
                    onChange={(e) => setPaymentChannelId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {paymentChannels
                      .filter((c) => c.status === 'ACTIVE')
                      .map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} {ch.accountNumber ? `(${ch.accountNumber})` : ''} - {ch.accountHolder}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Purpose */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Tujuan Penggunaan Pinjaman</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder={
                      facilityType === 'OTHER'
                        ? 'Contoh: Pinjaman modal kerja talangan operasional sertifikasi TKDN dari pemegang saham'
                        : 'Contoh: Pembiayaan operasional proyek sertifikasi TKDN'
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className={`border rounded-xl p-4 space-y-3 ${
                facilityType === 'REVOLVING'
                  ? 'bg-purple-50/80 border-purple-200'
                  : facilityType === 'OTHER'
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-indigo-50/80 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Calculator className={`w-4 h-4 ${
                      facilityType === 'REVOLVING'
                        ? 'text-purple-600'
                        : facilityType === 'OTHER'
                        ? 'text-amber-600'
                        : 'text-indigo-600'
                    }`} />
                    <span>Simulasi Kalkulasi Angsuran ({
                      facilityType === 'REVOLVING'
                        ? 'Revolving'
                        : facilityType === 'OTHER'
                        ? 'Lain-lain / Perorangan'
                        : 'Non-Revolving'
                    }):</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    facilityType === 'REVOLVING'
                      ? 'bg-purple-200/80 text-purple-800'
                      : facilityType === 'OTHER'
                      ? 'bg-amber-200/80 text-amber-900'
                      : 'bg-indigo-200/80 text-indigo-800'
                  }`}>
                    {facilityType === 'REVOLVING'
                      ? 'Interest-Only Monthly'
                      : facilityType === 'OTHER'
                      ? (liveFormCalculation.annualInterestRate === 0 ? 'Bunga 0% (Tanpa Bunga)' : 'Bunga Kesepakatan')
                      : 'Amortized Monthly'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">
                      {facilityType === 'REVOLVING' ? 'Pokok Rutin / Bln' : 'Angsuran Pokok / Bln'}
                    </span>
                    <strong className="font-mono text-slate-900">
                      {facilityType === 'REVOLVING' ? 'Rp 0 (Fleksibel)' : `Rp ${(liveFormCalculation.monthlyPrincipal || 0).toLocaleString('id-ID')}`}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Beban Bunga / Bln</span>
                    <strong className="font-mono text-rose-600">
                      Rp {(liveFormCalculation.monthlyInterest || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">
                      {facilityType === 'REVOLVING' ? 'Kewajiban Rutin / Bln' : 'Total Angsuran / Bln'}
                    </span>
                    <strong className={`font-mono ${
                      facilityType === 'REVOLVING'
                        ? 'text-purple-700'
                        : facilityType === 'OTHER'
                        ? 'text-amber-700'
                        : 'text-indigo-700'
                    }`}>
                      Rp {(liveFormCalculation.monthlyInstallment || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Estimasi Bunga</span>
                    <strong className="font-mono text-slate-700">
                      Rp {(liveFormCalculation.totalInterest || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                {facilityType === 'REVOLVING' && (
                  <p className="text-[11px] text-purple-900 bg-purple-100/60 p-2 rounded-lg leading-relaxed">
                    ℹ️ <strong>Catatan Fasilitas Revolving:</strong> Setiap bulan perusahaan hanya dibebankan biaya bunga sebesar <strong>Rp {(liveFormCalculation.monthlyInterest || 0).toLocaleString('id-ID')}</strong>. Pokok pinjaman sebesar <strong>Rp {(liveFormCalculation.principalAmount || (typeof principalAmount === 'number' ? principalAmount : 0)).toLocaleString('id-ID')}</strong> dapat dilunasi sekaligus pada akhir bulan ke-{liveFormCalculation.tenureMonths || tenureMonths || 1} atau diperpanjang kembali.
                  </p>
                )}

                {facilityType === 'OTHER' && (
                  <p className="text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded-lg leading-relaxed">
                    ℹ️ <strong>Catatan Pinjaman Perorangan / Lain-lain:</strong>{' '}
                    {liveFormCalculation.annualInterestRate === 0 ? (
                      <span>
                        Fasilitas ini tercatat <strong>tanpa bunga (0% p.a.)</strong>. Total pengembalian hanya pokok sebesar{' '}
                        <strong>Rp {(liveFormCalculation.principalAmount || (typeof principalAmount === 'number' ? principalAmount : 0)).toLocaleString('id-ID')}</strong> dengan cicilan pokok{' '}
                        <strong>Rp {(liveFormCalculation.monthlyPrincipal || 0).toLocaleString('id-ID')} / bulan</strong> tanpa membebani kas dengan bunga.
                      </span>
                    ) : (
                      <span>
                        Fasilitas ini mengenakan bunga kesepakatan <strong>{liveFormCalculation.annualInterestRate}% p.a.</strong> dengan total estimasi beban bunga <strong>Rp {(liveFormCalculation.totalInterest || 0).toLocaleString('id-ID')}</strong>.
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingLoanId ? 'Simpan Perubahan' : 'Daftarkan Pinjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOAN AMORTIZATION SCHEDULE & INSTALLMENT PAYMENT DRAWER */}
      {/* ========================================================================= */}
      {activeSelectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2 flex-wrap">
                    <span>Jadwal Angsuran: {activeSelectedLoan.loanName}</span>
                    <span className="text-xs font-normal text-slate-400">({activeSelectedLoan.bankName})</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      activeSelectedLoan.facilityType === 'REVOLVING'
                        ? 'bg-purple-900 text-purple-200 border border-purple-700'
                        : activeSelectedLoan.facilityType === 'OTHER'
                        ? 'bg-amber-900 text-amber-200 border border-amber-700'
                        : 'bg-sky-900 text-sky-200 border border-sky-700'
                    }`}>
                      {activeSelectedLoan.facilityType === 'REVOLVING'
                        ? 'Revolving (KMK)'
                        : activeSelectedLoan.facilityType === 'OTHER'
                        ? 'Lain-lain / Perorangan'
                        : 'Non-Revolving (Term Loan)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Plafon: Rp {activeSelectedLoan.principalAmount.toLocaleString('id-ID')} • Bunga: {activeSelectedLoan.annualInterestRate}% p.a. • Tenor: {activeSelectedLoan.tenureMonths} Bulan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoanForSchedule(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Schedule Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center">Bln #</th>
                      <th className="py-2.5 px-3">Jatuh Tempo</th>
                      <th className="py-2.5 px-3 text-right">Saldo Awal</th>
                      <th className="py-2.5 px-3 text-right">Angsuran Pokok</th>
                      <th className="py-2.5 px-3 text-right text-rose-600">Beban Bunga</th>
                      <th className="py-2.5 px-3 text-right font-mono">Total Bayar</th>
                      <th className="py-2.5 px-3 text-right">Sisa Pokok</th>
                      <th className="py-2.5 px-3 text-center">Skema</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(activeSelectedLoan.schedule || []).map((item) => (
                      <tr
                        key={item.monthNumber}
                        className={item.isPaid ? 'bg-emerald-50/40 text-slate-700' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {item.monthNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-sans">{item.dueDate}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          Rp {item.beginningBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          Rp {item.principalPayment.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-600">
                          Rp {item.interestPayment.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                          Rp {item.totalPayment.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          Rp {item.endingBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.paymentType === 'INTEREST_ONLY'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : item.paymentType === 'BALLOON_PAYOFF'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : activeSelectedLoan.annualInterestRate === 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.paymentType === 'INTEREST_ONLY'
                              ? 'Bunga Saja'
                              : item.paymentType === 'BALLOON_PAYOFF'
                              ? 'Pelunasan Pokok'
                              : activeSelectedLoan.annualInterestRate === 0
                              ? 'Pokok (Bunga 0%)'
                              : 'Pokok + Bunga'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              Belum
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {item.isPaid ? (
                            <span className="text-[11px] text-slate-400 italic">Tercatat di kas</span>
                          ) : canManage ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenPayInstallmentModal(activeSelectedLoan, item)
                              }
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              Bayar & Catat Kas
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Saat tombol <strong>Bayar & Catat Kas</strong> diklik, sistem otomatis membukukan transaksi pengeluaran (Pengurangan Pokok & Beban Bunga Bank) ke Jurnal Keuangan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoanForSchedule(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DISBURSEMENT CONFIRMATION & LEDGER INTEGRATION MODAL */}
      {/* ========================================================================= */}
      {loanToDisburse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 text-emerald-200 flex items-center justify-center border border-emerald-400/30">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Cairkan Pokok Pinjaman ke Buku Kas</h3>
                  <p className="text-xs text-emerald-200">{loanToDisburse.loanName} ({loanToDisburse.bankName})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoanToDisburse(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <div className="text-slate-600 text-xs">Nominal Plafon Pokok yang Dicairkan:</div>
                <div className="text-xl font-bold font-mono text-emerald-800">
                  Rp {loanToDisburse.principalAmount.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-700">
                  Sistem akan otomatis mencatat jurnal <strong>PEMASUKAN KAS</strong> kategori <em>Pencairan Pokok Pinjaman Bank</em>.
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Rekening / Saluran Kas Penerima *</label>
                <select
                  value={disburseChannelId}
                  onChange={(e) => setDisburseChannelId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {paymentChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) {c.accountNumber ? `- ${c.accountNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    value={disburseDate}
                    onChange={(e) => setDisburseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Referensi</label>
                  <input
                    type="text"
                    value={disburseRef}
                    onChange={(e) => setDisburseRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLoanToDisburse(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Konfirmasi & Cairkan ke Buku Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSTALLMENT PAYMENT CONFIRMATION & LEDGER INTEGRATION MODAL */}
      {/* ========================================================================= */}
      {installmentToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-200 flex items-center justify-center border border-indigo-400/30">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Bayar & Catat Angsuran Bln #{installmentToPay.item.monthNumber}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {installmentToPay.loan.loanName} ({installmentToPay.loan.bankName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInstallmentToPay(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayInstallment} className="p-6 space-y-4 text-xs">
              {/* Payment Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  Rincian Pembayaran Angsuran:
                </div>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Angsuran Pokok (Liabilitas):</span>
                    <span className="font-bold">Rp {installmentToPay.item.principalPayment.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600">
                    <span>Beban Bunga Pinjaman:</span>
                    <span className="font-bold">Rp {installmentToPay.item.interestPayment.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-sm font-black text-indigo-900">
                    <span>Total Pembayaran Kas:</span>
                    <span>Rp {installmentToPay.item.totalPayment.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Rekening / Saluran Kas Sumber Pengeluaran *</label>
                <select
                  value={payChannelId}
                  onChange={(e) => setPayChannelId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {paymentChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) {c.accountNumber ? `- ${c.accountNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Pembayaran *</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Referensi / Bukti Transfer</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInstallmentToPay(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Catat Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {loanToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus Data Fasilitas Pinjaman?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <div><strong>Nama Fasilitas:</strong> {loanToDelete.loanName} ({loanToDelete.bankName})</div>
              <div><strong>Plafon:</strong> Rp {loanToDelete.principalAmount.toLocaleString('id-ID')}</div>
              <div className="text-[11px] text-slate-500 pt-1">
                Catatan: Mutasi dan jurnal kas yang sebelumnya sudah tercatat ke buku kas tidak akan terhapus otomatis.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLoan}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST FEEDBACK NOTIFICATION */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border max-w-sm ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500/50'
                : 'bg-rose-950 text-white border-rose-500/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-white leading-tight">{toastMessage.title}</h4>
              <p className="text-slate-300 mt-0.5">{toastMessage.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

