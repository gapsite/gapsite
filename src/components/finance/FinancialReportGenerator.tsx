import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Layers,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  FolderKanban,
  Wallet,
  Receipt,
  CreditCard,
  Building2,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  FileDown,
  Info,
  Award,
  BookOpen,
  Briefcase,
  BadgePercent,
  BarChart3,
  Sparkles,
  CheckCheck,
  Landmark,
  Scale,
  Coins,
  Plus,
  Settings2,
  Clock,
  UserCheck,
  PenTool,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { FinancialTransaction, ConsultingProject, TransactionType, PaymentChannelDefinition, Receivable } from '../../types';
import {
  formatIDR,
  formatIDRShort,
  getTransactionCategoryLabel,
  getPaymentMethodLabel,
  getTransactionStatusBadge,
} from '../../utils/formatters';
import { calculateReceivablesAgingSummary, getAgingBucket } from '../../utils/receivableCalculations';
import { TransactionModal } from './TransactionModal';
import { CompanyCapitalModal } from './CompanyCapitalModal';

export type FinancialReportType =
  | 'ASSETS'
  | 'LIABILITIES'
  | 'EQUITY'
  | 'PROFIT_AND_LOSS'
  | 'EXPENSES'
  | 'BALANCE_SHEET'
  | 'COMPREHENSIVE'
  | 'CASH_FLOW'
  | 'PROJECT_PROFITABILITY'
  | 'GENERAL_LEDGER'
  | 'BANK_LOANS'
  | 'TAX_AND_SETTLEMENT'
  | 'RECEIVABLES_AGING';

export type DatePeriodFilter =
  | 'ALL'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

interface FinancialReportGeneratorProps {
  onSelectProject?: (projectId: string) => void;
}

export const FinancialReportGenerator: React.FC<FinancialReportGeneratorProps> = ({
  onSelectProject,
}) => {
  const {
    transactions,
    projects,
    teamMembers,
    currentUser,
    paymentChannels,
    activePaymentChannels,
    bankLoans,
    companyCapital,
    taxObligations,
    receivables,
  } = useProjects();

  // Active Report Type
  const [reportType, setReportType] = useState<FinancialReportType>('COMPREHENSIVE');

  // Filter States
  const [periodFilter, setPeriodFilter] = useState<DatePeriodFilter>('THIS_YEAR');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CLEARED_ONLY' | 'PENDING_OVERDUE'>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report Customization Options
  const [showLetterhead, setShowLetterhead] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [isSignatoryPanelOpen, setIsSignatoryPanelOpen] = useState<boolean>(false);
  const [documentNumber, setDocumentNumber] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `FIN-RPT/${year}/${month}/${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [reportNotes, setReportNotes] = useState<string>(
    'Laporan Keuangan Eksekutif Komprehensif ini disusun berdasarkan data mutasi kas & transaksi operasional resmi konsultasi GAP.CRM. Seluruh angka telah direkonsiliasi dan diverifikasi sesuai bukti pembayaran, faktur pajak, dan invoice terlampir.'
  );

  // ---------------------------------------------------------------------------
  // ROLE-RESTRICTED SIGNATORY OPTIONS:
  // - DIPERSIAPKAN: ONLY FINANCE ROLE
  // - DISETUJUI: ONLY DIRECTOR ROLE
  // ---------------------------------------------------------------------------
  const FINANCE_POSITION_OPTIONS = [
    'Finance & Treasury Officer',
    'Financial Controller / Billing Specialist',
    'Head of Finance & Accounting',
    'Chief Financial Officer (CFO)',
    'Senior Treasury Specialist',
    'Staff Akuntansi & Perpajakan',
    'Kasir & Staff Keuangan Operasional',
    'Custom (Kustom Jabatan...)',
  ];

  const DIRECTOR_POSITION_OPTIONS = [
    'Managing Partner / Director',
    'President Director & CEO',
    'Director of Consulting & Operations',
    'Director of Finance & Strategy',
    'Executive Director',
    'Chief Executive Officer (CEO)',
    'Managing Director & Master Admin',
    'Custom (Kustom Jabatan...)',
  ];

  // 1. Finance Role Only for Preparer (Dipersiapkan)
  const financeEligibleMembers = useMemo(() => {
    const list = (teamMembers || []).filter(
      (m) =>
        m.role === 'FINANCE_OFFICER' ||
        m.role === 'FINANCE' ||
        m.department?.toLowerCase().includes('finance') ||
        m.department?.toLowerCase().includes('invoicing') ||
        m.department?.toLowerCase().includes('keuangan') ||
        m.roleTitle?.toLowerCase().includes('finance') ||
        m.roleTitle?.toLowerCase().includes('controller') ||
        m.roleTitle?.toLowerCase().includes('treasury') ||
        m.roleTitle?.toLowerCase().includes('akuntan')
    );
    if (list.length === 0) {
      if (currentUser?.role === 'FINANCE_OFFICER' || currentUser?.role === 'FINANCE') {
        return [currentUser];
      }
      return [
        {
          id: 'fin-officer-1',
          name: 'Siti Nurhaliza, S.Ak',
          role: 'FINANCE_OFFICER' as const,
          roleTitle: 'Finance & Treasury Officer',
          department: 'Divisi Keuangan & Pembukuan',
          email: 'finance@gapsite.com',
          avatar: '',
          status: 'ACTIVE' as const,
        },
        {
          id: 'fin-officer-2',
          name: 'Dewi Rahmawati, S.E.',
          role: 'FINANCE_OFFICER' as const,
          roleTitle: 'Financial Controller & Billing Specialist',
          department: 'Finance & Invoicing',
          email: 'billing@gapsite.com',
          avatar: '',
          status: 'ACTIVE' as const,
        },
      ];
    }
    return list;
  }, [teamMembers, currentUser]);

  // 2. Director Role Only for Approver (Disetujui)
  const directorEligibleMembers = useMemo(() => {
    const list = (teamMembers || []).filter(
      (m) =>
        m.role === 'DIRECTOR' ||
        m.role === 'MASTER_ADMIN' ||
        m.role === 'SUPER_ADMIN' ||
        m.department?.toLowerCase().includes('board') ||
        m.department?.toLowerCase().includes('executive') ||
        m.department?.toLowerCase().includes('direksi') ||
        m.roleTitle?.toLowerCase().includes('director') ||
        m.roleTitle?.toLowerCase().includes('direktur') ||
        m.roleTitle?.toLowerCase().includes('partner') ||
        m.roleTitle?.toLowerCase().includes('ceo')
    );
    if (list.length === 0) {
      return [
        {
          id: 'dir-officer-1',
          name: 'Adryan Kelvianto',
          role: 'DIRECTOR' as const,
          roleTitle: 'Managing Partner / Director',
          department: 'Dewan Direksi & Manajemen Eksekutif',
          email: 'admin@gapsite.com',
          avatar: '',
          status: 'ACTIVE' as const,
        },
      ];
    }
    return list;
  }, [teamMembers]);

  // Preparer (Finance) State
  const [selectedPreparerId, setSelectedPreparerId] = useState<string>(() => {
    if (currentUser.role === 'FINANCE_OFFICER' || currentUser.role === 'FINANCE') {
      return currentUser.id;
    }
    return financeEligibleMembers[0]?.id || 'fin-officer-1';
  });
  const [preparerName, setPreparerName] = useState<string>(() => {
    if (currentUser.role === 'FINANCE_OFFICER' || currentUser.role === 'FINANCE') {
      return currentUser.name;
    }
    return financeEligibleMembers[0]?.name || 'Siti Nurhaliza, S.Ak';
  });
  const [preparerPosition, setPreparerPosition] = useState<string>('Finance & Treasury Officer');
  const [customPreparerPosition, setCustomPreparerPosition] = useState<string>('');
  const [isCustomPreparer, setIsCustomPreparer] = useState<boolean>(false);

  // Approver (Director) State
  const [selectedApproverId, setSelectedApproverId] = useState<string>(() => {
    const defaultDir = directorEligibleMembers.find((d) => d.role === 'MASTER_ADMIN' || d.role === 'DIRECTOR');
    return defaultDir?.id || directorEligibleMembers[0]?.id || 'dir-officer-1';
  });
  const [approverName, setApproverName] = useState<string>(() => {
    const defaultDir = directorEligibleMembers.find((d) => d.role === 'MASTER_ADMIN' || d.role === 'DIRECTOR');
    return defaultDir?.name || directorEligibleMembers[0]?.name || 'Adryan Kelvianto';
  });
  const [approverPosition, setApproverPosition] = useState<string>('Managing Partner / Director');
  const [customApproverPosition, setCustomApproverPosition] = useState<string>('');
  const [isCustomApprover, setIsCustomApprover] = useState<boolean>(false);

  const displayPreparerPosition = preparerPosition === 'Custom (Kustom Jabatan...)'
    ? (customPreparerPosition.trim() || 'Finance Officer')
    : preparerPosition;

  const displayApproverPosition = approverPosition === 'Custom (Kustom Jabatan...)'
    ? (customApproverPosition.trim() || 'Director')
    : approverPosition;

  // Copy brief feedback
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('EXPENSE');

  // Helper local date formatter to avoid UTC offset discrepancies
  const formatLocalDate = (year: number, monthZeroIndex: number, day: number): string => {
    const d = new Date(year, monthZeroIndex, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  };

  // Helper date ranges
  const dateBounds = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    if (periodFilter === 'THIS_MONTH') {
      const start = formatLocalDate(currentYear, currentMonth, 1);
      const end = formatLocalDate(currentYear, currentMonth + 1, 0);
      return { start, end, label: `Bulan Ini (${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})` };
    }

    if (periodFilter === 'LAST_MONTH') {
      const start = formatLocalDate(currentYear, currentMonth - 1, 1);
      const end = formatLocalDate(currentYear, currentMonth, 0);
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return { start, end, label: `Bulan Lalu (${lastMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})` };
    }

    if (periodFilter === 'THIS_QUARTER') {
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const start = formatLocalDate(currentYear, quarterStartMonth, 1);
      const end = formatLocalDate(currentYear, quarterStartMonth + 3, 0);
      const qNum = Math.floor(currentMonth / 3) + 1;
      return { start, end, label: `Kuartal ${qNum} (Q${qNum} ${currentYear})` };
    }

    if (periodFilter === 'THIS_YEAR') {
      const start = `${currentYear}-01-01`;
      const end = `${currentYear}-12-31`;
      return { start, end, label: `Tahun ${currentYear} (YTD)` };
    }

    if (periodFilter === 'CUSTOM' && (customStartDate || customEndDate)) {
      return {
        start: customStartDate || '1970-01-01',
        end: customEndDate || '2099-12-31',
        label: `Periode: ${customStartDate || 'Awal'} s/d ${customEndDate || 'Akhir'}`,
      };
    }

    return { start: '1970-01-01', end: '2099-12-31', label: 'Semua Periode Transaksi' };
  }, [periodFilter, customStartDate, customEndDate]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Date Range
      if (t.date < dateBounds.start || t.date > dateBounds.end) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter === 'CLEARED_ONLY' && t.status !== 'CLEARED') {
        return false;
      }
      if (statusFilter === 'PENDING_OVERDUE' && t.status === 'CLEARED') {
        return false;
      }

      // 3. Project Filter
      if (selectedProjectId !== 'ALL' && t.projectId !== selectedProjectId) {
        return false;
      }

      // 4. Accounting Category Filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
        return false;
      }

      // 5. Search Query (Transaction #, Description, Counterparty, Reference, Project Code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = t.transactionNumber?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesClient = t.clientOrVendorName?.toLowerCase().includes(q);
        const matchesRef = t.referenceNumber?.toLowerCase().includes(q);
        const matchesProject = t.projectCode?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesDesc && !matchesClient && !matchesRef && !matchesProject) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, dateBounds, statusFilter, selectedProjectId, categoryFilter, searchQuery]);

  // Filtered Receivables (Piutang Usaha) synchronized strictly with dateBounds, project, status, and search
  const filteredReceivables = useMemo(() => {
    return (receivables || []).filter((r) => {
      // 1. Date Range (issueDate or fallback to createdAt date)
      const rDate = r.issueDate || r.createdAt?.split('T')[0] || '';
      if (rDate && (rDate < dateBounds.start || rDate > dateBounds.end)) {
        return false;
      }

      // 2. Project Filter
      if (selectedProjectId !== 'ALL' && r.projectId && r.projectId !== selectedProjectId) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'CLEARED_ONLY' && r.status !== 'LUNAS') {
        return false;
      }
      if (statusFilter === 'PENDING_OVERDUE' && r.status === 'LUNAS') {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = r.invoiceNumber?.toLowerCase().includes(q);
        const matchesClient = r.clientName?.toLowerCase().includes(q);
        const matchesProject = r.projectCode?.toLowerCase().includes(q);
        const matchesTitle = r.title?.toLowerCase().includes(q);
        const matchesDesc = r.description?.toLowerCase().includes(q);
        if (!matchesNum && !matchesClient && !matchesProject && !matchesTitle && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.issueDate || a.createdAt).getTime() - new Date(b.issueDate || b.createdAt).getTime());
  }, [receivables, dateBounds, selectedProjectId, statusFilter, searchQuery]);

  // Filtered Tax Obligations (Kewajiban Pajak) synchronized with dateBounds, project, status, and search
  const filteredTaxObligations = useMemo(() => {
    return (taxObligations || []).filter((t) => {
      // 1. Date Range (dueDate, paidAt, or fallback to createdAt date)
      const tDate = t.dueDate || t.paidAt?.split('T')[0] || t.createdAt?.split('T')[0] || '';
      if (tDate && (tDate < dateBounds.start || tDate > dateBounds.end)) {
        return false;
      }

      // 2. Project Filter
      if (selectedProjectId !== 'ALL' && t.projectId && t.projectId !== selectedProjectId) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'CLEARED_ONLY' && t.status !== 'PAID') {
        return false;
      }
      if (statusFilter === 'PENDING_OVERDUE' && t.status === 'PAID') {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesTaxPeriod = t.taxPeriod?.toLowerCase().includes(q);
        const matchesCounterparty = t.counterpartyName?.toLowerCase().includes(q);
        const matchesProject = t.projectCode?.toLowerCase().includes(q);
        const matchesBilling = t.billingCode?.toLowerCase().includes(q);
        const matchesNtpn = t.ntpnNumber?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTaxPeriod && !matchesCounterparty && !matchesProject && !matchesBilling && !matchesNtpn) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.dueDate || a.createdAt).getTime() - new Date(b.dueDate || b.createdAt).getTime());
  }, [taxObligations, dateBounds, selectedProjectId, statusFilter, searchQuery]);

  // Filtered Bank Loans synchronized with dateBounds and search
  const filteredBankLoans = useMemo(() => {
    return (bankLoans || []).filter((l) => {
      // 1. Date filter (if loan was initiated after the selected period end date)
      const lStart = l.startDate || l.createdAt?.split('T')[0] || '';
      if (lStart && dateBounds.end && lStart > dateBounds.end) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = l.loanName?.toLowerCase().includes(q);
        const matchesBank = l.bankName?.toLowerCase().includes(q);
        const matchesNum = l.loanNumber?.toLowerCase().includes(q);
        const matchesAcc = l.accountNumber?.toLowerCase().includes(q);
        if (!matchesName && !matchesBank && !matchesNum && !matchesAcc) {
          return false;
        }
      }

      return true;
    });
  }, [bankLoans, dateBounds, searchQuery]);

  // Financial KPI Metrics
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let clearedIncome = 0;
    let pendingIncome = 0;

    let totalExpense = 0;
    let clearedExpense = 0;
    let pendingExpense = 0;

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    const projectFinancials: Record<
      string,
      {
        projectId: string;
        projectCode: string;
        clientName: string;
        contractValue: number;
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
        transactionCount: number;
      }
    > = {};

    // Filter projects matching selected project and search query
    const relevantProjects = projects.filter((p) => {
      if (selectedProjectId !== 'ALL' && p.id !== selectedProjectId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = p.code?.toLowerCase().includes(q);
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesClient = p.clientName?.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesClient) return false;
      }
      return true;
    });

    // Initialize projects for profitability report
    relevantProjects.forEach((p) => {
      projectFinancials[p.id] = {
        projectId: p.id,
        projectCode: p.code,
        clientName: p.clientName,
        contractValue: p.contractValueIDR || 0,
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        transactionCount: 0,
      };
    });

    // Process transactions
    filteredTransactions.forEach((t) => {
      if (t.type === 'INCOME') {
        totalIncome += t.amountIDR;
        if (t.status === 'CLEARED') {
          clearedIncome += t.amountIDR;
        } else {
          pendingIncome += t.amountIDR;
        }
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amountIDR;

        if (t.projectId && projectFinancials[t.projectId]) {
          projectFinancials[t.projectId].totalIncome += t.amountIDR;
          projectFinancials[t.projectId].transactionCount += 1;
        }
      } else if (t.type === 'EXPENSE') {
        totalExpense += t.amountIDR;
        if (t.status === 'CLEARED') {
          clearedExpense += t.amountIDR;
        } else {
          pendingExpense += t.amountIDR;
        }
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amountIDR;

        if (t.projectId && projectFinancials[t.projectId]) {
          projectFinancials[t.projectId].totalExpense += t.amountIDR;
          projectFinancials[t.projectId].transactionCount += 1;
        }
      }
    });

    // Calculate net profits for projects
    Object.values(projectFinancials).forEach((pf) => {
      pf.netProfit = pf.totalIncome - pf.totalExpense;
    });

    // When filtering by specific date period, only keep projects that have financial activity or are explicitly selected
    const activeProjectFinancialsList = Object.values(projectFinancials).filter((pf) => {
      if (selectedProjectId !== 'ALL') return true;
      if (periodFilter === 'ALL') return true;
      return pf.transactionCount > 0 || pf.totalIncome > 0 || pf.totalExpense > 0;
    });

    // Direct Cost vs Overhead categorization
    const directCategories = new Set([
      'FEE_SURVEYOR_SUCOFINDO_SI',
      'PENGUJIAN_LAB_TEKNIS',
      'LEGALITAS_OSS_NOTARIS',
      'SITE_SURVEY_INSPEKSI',
      'PERJALANAN_DINAS_AUDIT',
      'PENGADAAN_ALAT_UJI',
    ]);

    let directExpenseTotal = 0;
    let overheadExpenseTotal = 0;

    Object.entries(expenseByCategory).forEach(([cat, val]) => {
      if (directCategories.has(cat)) {
        directExpenseTotal += val;
      } else {
        overheadExpenseTotal += val;
      }
    });

    const grossProfit = totalIncome - directExpenseTotal;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
    const taxExpense = expenseByCategory['TAX_PPH_PPN'] || 0;
    const netProfit = totalIncome - totalExpense;
    const ebit = totalIncome - (totalExpense - taxExpense);
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
    const taxRatio = totalIncome > 0 ? (taxExpense / totalIncome) * 100 : 0;
    const clearedSettlementRate =
      totalIncome + totalExpense > 0
        ? ((clearedIncome + clearedExpense) / (totalIncome + totalExpense)) * 100
        : 100;

    // Service Breakdown
    const serviceTypeBreakdown: Record<
      string,
      {
        serviceType: string;
        projectCount: number;
        contractValue: number;
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
      }
    > = {};

    relevantProjects.forEach((p) => {
      const pf = projectFinancials[p.id];
      if (!pf) return;
      if (periodFilter !== 'ALL' && selectedProjectId === 'ALL' && pf.transactionCount === 0) {
        return;
      }

      const st = p.serviceType || 'KONSULTASI_UMUM';
      if (!serviceTypeBreakdown[st]) {
        serviceTypeBreakdown[st] = {
          serviceType: st,
          projectCount: 0,
          contractValue: 0,
          totalIncome: 0,
          totalExpense: 0,
          netProfit: 0,
        };
      }
      serviceTypeBreakdown[st].projectCount += 1;
      serviceTypeBreakdown[st].contractValue += p.contractValueIDR || 0;
      serviceTypeBreakdown[st].totalIncome += pf.totalIncome;
      serviceTypeBreakdown[st].totalExpense += pf.totalExpense;
      serviceTypeBreakdown[st].netProfit += pf.netProfit;
    });

    // Bank Loans Management & Liability Breakdown (strictly filtered)
    const loansList = filteredBankLoans;
    const activeLoans = loansList.filter((l) => l.status === 'ACTIVE');
    const totalLoanFacility = loansList.reduce((acc, l) => acc + (l.principalAmount || 0), 0);
    const totalRemainingPrincipal = activeLoans.reduce((acc, l) => acc + (l.remainingPrincipal ?? l.principalAmount), 0);
    const totalMonthlyPrincipal = activeLoans.reduce((acc, l) => acc + (l.monthlyPrincipal || 0), 0);
    const totalMonthlyInterest = activeLoans.reduce((acc, l) => acc + (l.monthlyInterest || 0), 0);
    const totalPaidPrincipal = loansList.reduce((acc, l) => acc + (l.paidPrincipal || 0), 0);
    const totalPaidInterest = loansList.reduce((acc, l) => acc + (l.paidInterest || 0), 0);

    // Loan-specific transactions from filteredTransactions
    const loanDisbursementTrxs = filteredTransactions.filter((t) => t.category === 'BANK_LOAN_DISBURSEMENT');
    const loanPrincipalTrxs = filteredTransactions.filter((t) => t.category === 'BANK_LOAN_PRINCIPAL');
    const loanInterestTrxs = filteredTransactions.filter((t) => t.category === 'BANK_LOAN_INTEREST');
    const loanFeeTrxs = filteredTransactions.filter((t) => t.category === 'BANK_LOAN_FEES');

    const totalDisbursedFromTrxs = loanDisbursementTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
    const totalPrincipalPaidFromTrxs = loanPrincipalTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
    const totalInterestPaidFromTrxs = loanInterestTrxs.reduce((acc, t) => acc + t.amountIDR, 0);

    // Company Capital Settings (Modal Dasar, Modal Disetor, Modal Tambahan)
    const authorizedCapital = companyCapital?.authorizedCapital || 5000000000;
    const paidInCapital = companyCapital?.paidInCapital || 1250000000;
    const additionalCapital = companyCapital?.additionalCapital || 250000000;
    const retainedEarningsOpening = companyCapital?.retainedEarningsOpening || 0;
    const capitalNotes = companyCapital?.notes || 'Berdasarkan Akta Pendirian Perusahaan & SK Kemenkumham RI.';
    const totalPaidAndAdditional = paidInCapital + additionalCapital;

    // Equity according to Corporate Accounting Standards:
    // Total Equity = (Paid-in Capital + Additional Capital) + Retained Earnings + Current Net Profit/Loss
    const totalEquity = totalPaidAndAdditional + retainedEarningsOpening + netProfit;

    // 5 Fundamental Accounting Elements (Aset, Liabilitas, Ekuitas, Pendapatan, Beban)
    // Cash & Bank includes Initial Capital + Operating Cash Flow + Loan Disbursements - Loan Repayments
    const netClearedCash = clearedIncome - clearedExpense;
    const cashAndBankAsset = Math.max(0, totalPaidAndAdditional + retainedEarningsOpening + netClearedCash + (totalDisbursedFromTrxs - totalPrincipalPaidFromTrxs));

    // Real-time Accounts Receivable (Piutang Usaha) calculation with strict date/search/status filtering
    let current0to30 = { count: 0, amount: 0 };
    let aging31to60 = { count: 0, amount: 0 };
    let aging61to90 = { count: 0, amount: 0 };
    let agingOver90 = { count: 0, amount: 0 };
    let totalOutstanding = 0;
    let totalSettled = 0;
    let totalInvoiced = 0;
    let activeReceivablesCount = 0;

    filteredReceivables.forEach((r) => {
      if (r.status === 'BATAL') return;
      const total = r.totalAmountIDR || 0;
      const paid = r.paidAmountIDR || 0;
      const remaining = r.remainingAmountIDR !== undefined ? r.remainingAmountIDR : Math.max(0, total - paid);

      totalInvoiced += total;
      totalSettled += paid;

      if (remaining > 0 && r.status !== 'LUNAS') {
        totalOutstanding += remaining;
        activeReceivablesCount += 1;
        const bucket = getAgingBucket(r);
        if (bucket === '0_30') {
          current0to30.count += 1;
          current0to30.amount += remaining;
        } else if (bucket === '31_60') {
          aging31to60.count += 1;
          aging31to60.amount += remaining;
        } else if (bucket === '61_90') {
          aging61to90.count += 1;
          aging61to90.amount += remaining;
        } else if (bucket === 'OVER_90') {
          agingOver90.count += 1;
          agingOver90.amount += remaining;
        }
      }
    });

    const receivablesSettlementRate = totalInvoiced > 0 ? (totalSettled / totalInvoiced) * 100 : 0;
    const receivablesAgingSummary = {
      current0to30,
      aging31to60,
      aging61to90,
      agingOver90,
      totalOutstanding,
      totalSettled,
      totalInvoiced,
      settlementRate: receivablesSettlementRate,
      activeCount: activeReceivablesCount,
    };

    const activeReceivablesList = filteredReceivables.filter(
      (r) => r.status !== 'BATAL' && r.status !== 'LUNAS' && (r.remainingAmountIDR === undefined || r.remainingAmountIDR > 0)
    );
    const totalReceivablesOutstanding = receivablesAgingSummary.totalOutstanding;
    // Prefer dedicated AR ledger when available; fallback to pending ledger income
    const receivablesAsset = totalReceivablesOutstanding > 0 ? totalReceivablesOutstanding : pendingIncome;

    // Payment Channel Summaries with robust 1-to-1 matching and true ending balance (no duplicate counting)
    const channelsList = paymentChannels && paymentChannels.length > 0 ? paymentChannels : activePaymentChannels;

    const resolveTransactionToChannelId = (
      t: FinancialTransaction,
      channels: PaymentChannelDefinition[]
    ): string => {
      if (!t.paymentMethod) return 'UNASSIGNED_OTHER';
      const pm = String(t.paymentMethod).trim();
      if (!pm) return 'UNASSIGNED_OTHER';

      // 1. Exact ID match (case-sensitive)
      const exactIdMatch = channels.find((ch) => ch.id === pm);
      if (exactIdMatch) return exactIdMatch.id;

      // 2. Case-insensitive ID match
      const caseIdMatch = channels.find((ch) => ch.id.toLowerCase() === pm.toLowerCase());
      if (caseIdMatch) return caseIdMatch.id;

      const pmLower = pm.toLowerCase();

      // 3. Exact full name match (case-insensitive)
      const exactNameMatch = channels.find((ch) => ch.name && ch.name.trim().toLowerCase() === pmLower);
      if (exactNameMatch) return exactNameMatch.id;

      // 4. Exact shortName match (case-insensitive)
      const exactShortMatch = channels.find((ch) => ch.shortName && ch.shortName.trim().toLowerCase() === pmLower);
      if (exactShortMatch) return exactShortMatch.id;

      // 5. Exact digits account number match (only when >= 6 digits)
      const pmDigits = pm.replace(/[^0-9]/g, '');
      if (pmDigits.length >= 6) {
        const accMatch = channels.find((ch) => {
          const chDigits = (ch.accountNumber || '').replace(/[^0-9]/g, '');
          return chDigits.length >= 6 && chDigits === pmDigits;
        });
        if (accMatch) return accMatch.id;
      }

      return 'UNASSIGNED_OTHER';
    };

    // Group transactions uniquely per channel ID so each transaction belongs to AT MOST ONE channel
    const channelTransactionsMap = new Map<string, FinancialTransaction[]>();
    channelsList.forEach((ch) => {
      channelTransactionsMap.set(ch.id, []);
    });

    const unassignedTrxs: FinancialTransaction[] = [];

    filteredTransactions.forEach((t) => {
      const assignedId = resolveTransactionToChannelId(t, channelsList);
      if (channelTransactionsMap.has(assignedId)) {
        channelTransactionsMap.get(assignedId)!.push(t);
      } else {
        unassignedTrxs.push(t);
      }
    });

    const channelRawStats = channelsList.map((ch) => {
      const trxs = channelTransactionsMap.get(ch.id) || [];
      const incomeTrxs = trxs.filter((t) => t.type === 'INCOME');
      const expenseTrxs = trxs.filter((t) => t.type === 'EXPENSE');

      const income = incomeTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
      const clearedIncome = incomeTrxs.filter((t) => t.status === 'CLEARED').reduce((acc, t) => acc + t.amountIDR, 0);

      const expense = expenseTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
      const clearedExpense = expenseTrxs.filter((t) => t.status === 'CLEARED').reduce((acc, t) => acc + t.amountIDR, 0);

      const netCashFlow = clearedIncome - clearedExpense;
      const totalNet = income - expense;

      return {
        ch,
        trxs,
        count: trxs.length,
        incomeTrxsCount: incomeTrxs.length,
        expenseTrxsCount: expenseTrxs.length,
        income,
        clearedIncome,
        expense,
        clearedExpense,
        netCashFlow,
        totalNet,
      };
    });

    // Base capital from equity (Modal Disetor & Tambahan + Saldo Ditahan + Pinjaman Bersih)
    const totalBaseCapital = totalPaidAndAdditional + retainedEarningsOpening + (totalDisbursedFromTrxs - totalPrincipalPaidFromTrxs);

    // Primary operating bank account (BCA or default channel)
    const defaultChannelIndex = channelRawStats.findIndex((c) => c.ch.isDefault || c.ch.id === 'BANK_TRANSFER_BCA');
    const primaryIndex = defaultChannelIndex >= 0 ? defaultChannelIndex : 0;

    const channelSummary = channelRawStats.map((item, idx) => {
      // Allocate the base capital to primary account; other accounts track their operational cash flow
      const baseShare = idx === primaryIndex ? totalBaseCapital : 0;
      const balance = baseShare + item.netCashFlow;

      return {
        id: item.ch.id,
        name: item.ch.name,
        shortName: item.ch.shortName || item.ch.name,
        accountNumber: item.ch.accountNumber || '-',
        accountHolder: item.ch.accountHolder || 'PT GAP CONSULTING INDONESIA',
        category: item.ch.category || 'BANK_TRANSFER',
        income: item.income,
        clearedIncome: item.clearedIncome,
        expense: item.expense,
        clearedExpense: item.clearedExpense,
        netCashFlow: item.netCashFlow,
        totalNet: item.totalNet,
        net: balance,
        balance,
        count: item.count,
        incomeCount: item.incomeTrxsCount,
        expenseCount: item.expenseTrxsCount,
        badgeColor: item.ch.badgeColor,
      };
    });

    if (unassignedTrxs.length > 0) {
      const uIncomeTrxs = unassignedTrxs.filter((t) => t.type === 'INCOME');
      const uExpenseTrxs = unassignedTrxs.filter((t) => t.type === 'EXPENSE');
      const uIncome = uIncomeTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
      const uClearedIncome = uIncomeTrxs.filter((t) => t.status === 'CLEARED').reduce((acc, t) => acc + t.amountIDR, 0);
      const uExpense = uExpenseTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
      const uClearedExpense = uExpenseTrxs.filter((t) => t.status === 'CLEARED').reduce((acc, t) => acc + t.amountIDR, 0);
      const uNet = uClearedIncome - uClearedExpense;

      channelSummary.push({
        id: 'UNASSIGNED_OTHER',
        name: 'Transaksi Kas / Saluran Lainnya',
        shortName: 'Lainnya',
        accountNumber: 'Non-Rekening Khusus',
        accountHolder: 'Operasional',
        category: 'OTHER',
        income: uIncome,
        clearedIncome: uClearedIncome,
        expense: uExpense,
        clearedExpense: uClearedExpense,
        netCashFlow: uNet,
        totalNet: uIncome - uExpense,
        net: uNet,
        balance: uNet,
        count: unassignedTrxs.length,
        incomeCount: uIncomeTrxs.length,
        expenseCount: uExpenseTrxs.length,
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      });
    }

    // Fixed Assets & Equipment (Belanja Modal Aset / Inventaris)
    // 1. Transaction list for the filtered report period:
    const fixedAssetTrxs = filteredTransactions.filter(
      (t) =>
        t.type === 'EXPENSE' &&
        (t.category === 'PENGADAAN_ASET' ||
          t.category === 'PENGADAAN_ALAT_UJI' ||
          t.category === 'INVENTARIS_ASET' ||
          t.category === 'EQUIPMENT' ||
          t.category === 'SOFTWARE_CLOUD' ||
          t.category?.toLowerCase().includes('aset') ||
          t.category?.toLowerCase().includes('peralatan') ||
          t.category?.toLowerCase().includes('inventaris') ||
          t.category?.toLowerCase().includes('alat uji'))
    );

    // 2. Cumulative balance sheet asset base up to dateBounds.end
    const cumulativeAssetTrxs = transactions.filter(
      (t) =>
        t.type === 'EXPENSE' &&
        t.date <= dateBounds.end &&
        (t.category === 'PENGADAAN_ASET' ||
          t.category === 'PENGADAAN_ALAT_UJI' ||
          t.category === 'INVENTARIS_ASET' ||
          t.category === 'EQUIPMENT' ||
          t.category === 'SOFTWARE_CLOUD' ||
          t.category?.toLowerCase().includes('aset') ||
          t.category?.toLowerCase().includes('peralatan') ||
          t.category?.toLowerCase().includes('inventaris') ||
          t.category?.toLowerCase().includes('alat uji'))
    );
    const fixedAssetsGross = cumulativeAssetTrxs.reduce((acc, t) => acc + t.amountIDR, 0);

    const depreciationTrxs = filteredTransactions.filter(
      (t) =>
        t.type === 'EXPENSE' &&
        (t.category === 'PENYUSUTAN_ASET' ||
          t.category?.toLowerCase().includes('penyusutan') ||
          t.category?.toLowerCase().includes('depreciation'))
    );

    const cumulativeDepreciationTrxs = transactions.filter(
      (t) =>
        t.type === 'EXPENSE' &&
        t.date <= dateBounds.end &&
        (t.category === 'PENYUSUTAN_ASET' ||
          t.category?.toLowerCase().includes('penyusutan') ||
          t.category?.toLowerCase().includes('depreciation'))
    );
    const depreciationTotal = cumulativeDepreciationTrxs.reduce((acc, t) => acc + t.amountIDR, 0);
    const fixedAssets = Math.max(0, fixedAssetsGross - depreciationTotal);
    const totalAssets = cashAndBankAsset + receivablesAsset + fixedAssets;

    // Liabilities Breakdown (strictly synchronized with filteredTaxObligations)
    const activeTaxObligationsList = filteredTaxObligations.filter((t) => {
      const isUnpaid = t.status !== 'PAID' && ((t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount) > 0);
      return isUnpaid;
    });

    const ppnLiability = activeTaxObligationsList
      .filter((t) => t.taxType === 'PPN')
      .reduce((acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount), 0);

    const pph21Liability = activeTaxObligationsList
      .filter((t) => t.taxType === 'PPH_21')
      .reduce((acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount), 0);

    const pph23Liability = activeTaxObligationsList
      .filter((t) => t.taxType === 'PPH_23')
      .reduce((acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount), 0);

    const pph42Liability = activeTaxObligationsList
      .filter((t) => t.taxType === 'PPH_4_2')
      .reduce((acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount), 0);

    const pphFinalOrBadanLiability = activeTaxObligationsList
      .filter((t) => t.taxType === 'PPH_FINAL_UMKM' || t.taxType === 'PPH_25_29' || t.taxType === 'OTHER_TAX')
      .reduce((acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount), 0);

    const pendingTaxTrxs = filteredTransactions.filter(
      (t) =>
        t.type === 'EXPENSE' &&
        t.status === 'PENDING' &&
        (t.category === 'TAX_PPH_PPN' || t.category?.toLowerCase().includes('pajak'))
    );
    const pendingTaxTrxAmount = pendingTaxTrxs.reduce((acc, t) => acc + t.amountIDR, 0);

    const totalTaxObligationsLiability = activeTaxObligationsList.reduce(
      (acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.taxAmount),
      0
    );

    // Synchronize tax liability (primary source: dedicated taxObligations, fallback/addition: pending ledger trxs)
    const taxLiability = totalTaxObligationsLiability > 0 ? totalTaxObligationsLiability : pendingTaxTrxAmount;
    const payablesLiability = Math.max(0, pendingExpense - pendingTaxTrxAmount);
    const longTermBankLoans = totalRemainingPrincipal;
    const totalLiabilities = payablesLiability + taxLiability + longTermBankLoans;

    const totalPasiva = totalLiabilities + totalEquity;
    const balanceDiff = Math.abs(totalAssets - totalPasiva);
    const isBalanced = balanceDiff === 0;

    return {
      totalIncome,
      clearedIncome,
      pendingIncome,
      totalExpense,
      clearedExpense,
      pendingExpense,
      directExpenseTotal,
      overheadExpenseTotal,
      grossProfit,
      grossMargin,
      taxExpense,
      ebit,
      taxRatio,
      netProfit,
      profitMargin,
      expenseRatio,
      clearedSettlementRate,
      incomeByCategory,
      expenseByCategory,
      serviceTypeBreakdown: Object.values(serviceTypeBreakdown).sort((a, b) => b.totalIncome - a.totalIncome),
      channelSummary,
      projectFinancials: activeProjectFinancialsList.sort((a, b) => b.netProfit - a.netProfit),
      // 5 Core Accounting Pillars
      cashAndBankAsset,
      receivablesAsset,
      receivablesAgingSummary,
      activeReceivablesList,
      totalReceivablesOutstanding,
      fixedAssetsGross,
      depreciationTotal,
      fixedAssets,
      fixedAssetTrxs,
      depreciationTrxs,
      totalAssets,
      payablesLiability,
      taxLiability,
      ppnLiability,
      pph21Liability,
      pph23Liability,
      pph42Liability,
      pphFinalOrBadanLiability,
      activeTaxObligationsList,
      totalTaxObligationsLiability,
      longTermBankLoans,
      totalLiabilities,
      totalEquity,
      totalPasiva,
      balanceDiff,
      isBalanced,
      // Company Capital Breakdown
      authorizedCapital,
      paidInCapital,
      additionalCapital,
      retainedEarningsOpening,
      capitalNotes,
      totalPaidAndAdditional,
      // Bank Loan Specific Breakdown
      loansList,
      activeLoans,
      totalLoanFacility,
      totalRemainingPrincipal,
      totalMonthlyPrincipal,
      totalMonthlyInterest,
      totalPaidPrincipal,
      totalPaidInterest,
      loanDisbursementTrxs,
      loanPrincipalTrxs,
      loanInterestTrxs,
      loanFeeTrxs,
      totalDisbursedFromTrxs,
      totalPrincipalPaidFromTrxs,
      totalInterestPaidFromTrxs,
    };
  }, [
    filteredTransactions,
    filteredReceivables,
    filteredTaxObligations,
    filteredBankLoans,
    transactions,
    projects,
    paymentChannels,
    activePaymentChannels,
    companyCapital,
    dateBounds,
    periodFilter,
    selectedProjectId,
    searchQuery,
  ]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (reportType === 'COMPREHENSIVE') {
      filename = `Laporan_Keuangan_Komprehensif_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Seksi / Bagian', 'Pos / Item Keuangan', 'Rincian / Uraian', 'Nominal (IDR)', 'Persentase / Catatan'];

      // Ringkasan Eksekutif
      rows.push(['RINGKASAN EKSEKUTIF', 'Total Harta / Aset (Aktiva)', 'Aset Lancar + Aset Tetap Bersih', String(metrics.totalAssets), '100.0% Aset']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Total Liabilitas (Kewajiban)', 'Utang Usaha + Pajak + Utang Bank', String(metrics.totalLiabilities), metrics.totalAssets > 0 ? ((metrics.totalLiabilities / metrics.totalAssets) * 100).toFixed(1) + '% dari Aset' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Total Ekuitas (Modal Bersih)', 'Modal Disetor + Laba Bersih', String(metrics.totalEquity), metrics.totalAssets > 0 ? ((metrics.totalEquity / metrics.totalAssets) * 100).toFixed(1) + '% dari Aset' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Total Pendapatan (Gross Inflow)', 'Semua Pendapatan Periode Berjalan', String(metrics.totalIncome), '100.0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Realisasi Kas Masuk (Cleared Inflow)', 'Kas Diterima Lunas', String(metrics.clearedIncome), metrics.totalIncome > 0 ? ((metrics.clearedIncome / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Outstanding Piutang (Pending Inflow)', 'Menunggu Pelunasan Klien', String(metrics.pendingIncome), metrics.totalIncome > 0 ? ((metrics.pendingIncome / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Beban Langsung Proyek (Direct Costs / HPP)', 'Biaya Surveyor, Lab & Notaris', String(metrics.directExpenseTotal), metrics.totalIncome > 0 ? ((metrics.directExpenseTotal / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Laba Kotor Operasional (Gross Profit)', 'Gross Profit Margin', String(metrics.grossProfit), `${metrics.grossMargin.toFixed(1)}%`]);
      rows.push(['RINGKASAN EKSEKUTIF', 'Beban Operasional & Overhead (OPEX)', 'OPEX Kantor & Administrasi', String(metrics.overheadExpenseTotal), metrics.totalIncome > 0 ? ((metrics.overheadExpenseTotal / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Beban Setoran Pajak (PPh & PPN)', 'Tax Settlement', String(metrics.taxExpense), metrics.totalIncome > 0 ? ((metrics.taxExpense / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%']);
      rows.push(['RINGKASAN EKSEKUTIF', 'Laba Bersih Konsolidasi (Net Profit)', 'Net Profit Margin', String(metrics.netProfit), `${metrics.profitMargin.toFixed(1)}%`]);
      rows.push(['', '', '', '', '']);

      // 1. POSISI ASET (HARTA / AKTIVA)
      rows.push(['1. POSISI ASET', '--- I. ASET LANCAR ---', '', '', '']);
      metrics.channelSummary.forEach((ch) => {
        rows.push(['1. POSISI ASET', 'Aset Lancar - Kas & Bank', `"${ch.name} (${ch.accountNumber})"`, String(Math.max(0, ch.net)), `${ch.count} Mutasi`]);
      });
      rows.push(['1. POSISI ASET', 'Subtotal Kas & Bank', 'Total Likuiditas Bank', String(metrics.cashAndBankAsset), 'Likuiditas Riil']);
      rows.push(['1. POSISI ASET', 'Piutang Usaha Konsultasi', 'Tagihan Milestone Klien', String(metrics.receivablesAsset), 'Pending Inflow']);
      rows.push(['1. POSISI ASET', 'TOTAL ASET LANCAR', 'Kas + Bank + Piutang', String(metrics.cashAndBankAsset + metrics.receivablesAsset), 'Aktiva Lancar']);
      rows.push(['1. POSISI ASET', '--- II. ASET TIDAK LANCAR (ASET TETAP) ---', '', '', '']);
      rows.push(['1. POSISI ASET', 'Peralatan Komputasi & Fasilitas Lab', 'Nilai Perolehan Inventaris', String(metrics.fixedAssetsGross), 'Gross']);
      rows.push(['1. POSISI ASET', 'Akumulasi Penyusutan Aset Tetap', 'Depreciation Allowance', `-${metrics.depreciationTotal}`, 'Contra Asset']);
      rows.push(['1. POSISI ASET', 'TOTAL ASET TIDAK LANCAR (NET)', 'Nilai Buku Bersih', String(metrics.fixedAssets), 'Net Book Value']);
      rows.push(['1. POSISI ASET', 'TOTAL KESELURUHAN ASET (AKTIVA)', 'Aset Lancar + Aset Tetap', String(metrics.totalAssets), '100% Aktiva']);
      rows.push(['', '', '', '', '']);

      // 2. POSISI LIABILITAS (KEWAJIBAN / UTANG)
      rows.push(['2. LIABILITAS', '--- I. LIABILITAS JANGKA PENDEK ---', '', '', '']);
      rows.push(['2. LIABILITAS', 'Utang Usaha & Biaya Jasa Surveyor LVI', 'Pending Belum Terbayar', String(metrics.payablesLiability), 'Current']);
      rows.push(['2. LIABILITAS', 'Utang Pajak PPN 11% Terutang (Kurang Bayar)', 'Kewajiban SPT Masa PPN', String(metrics.ppnLiability), 'Tax Payable']);
      rows.push(['2. LIABILITAS', 'Utang PPh Pasal 21 Terutang', 'PPh 21 Honor & Gaji', String(metrics.pph21Liability), 'Tax Payable']);
      rows.push(['2. LIABILITAS', 'Utang PPh Pasal 23 Terutang', 'PPh 23 Jasa Surveyor/Konsultan', String(metrics.pph23Liability), 'Tax Payable']);
      rows.push(['2. LIABILITAS', 'Utang PPh Final 4(2) & PPh Badan', 'PPh Final Sewa/UMKM/Badan', String(metrics.pph42Liability + metrics.pphFinalOrBadanLiability), 'Tax Payable']);
      rows.push(['2. LIABILITAS', 'Subtotal Seluruh Liabilitas Hutang Pajak', 'Total Pajak Terhutang', String(metrics.taxLiability), 'Total Tax Payable']);
      rows.push(['2. LIABILITAS', 'TOTAL LIABILITAS JANGKA PENDEK', 'Kewajiban Lancar', String(metrics.payablesLiability + metrics.taxLiability), 'Current']);
      rows.push(['2. LIABILITAS', '--- II. LIABILITAS JANGKA PANJANG ---', '', '', '']);
      rows.push(['2. LIABILITAS', 'Sisa Pokok Pinjaman Bank (Bank Loans)', 'Kewajiban Pokok Kredit', String(metrics.longTermBankLoans), 'Long Term']);
      rows.push(['2. LIABILITAS', 'TOTAL KESELURUHAN LIABILITAS', 'Kewajiban Pendek + Panjang', String(metrics.totalLiabilities), 'Total Utang']);
      rows.push(['', '', '', '', '']);

      // 3. POSISI EKUITAS (MODAL)
      rows.push(['3. EKUITAS (MODAL)', '--- RINCIAN STRUKTUR MODAL & EKUITAS ---', '', '', '']);
      rows.push(['3. EKUITAS (MODAL)', 'Modal Dasar Perusahaan (Authorized Capital)', 'Plafon Akta Notaris', String(metrics.authorizedCapital), 'Nominal']);
      rows.push(['3. EKUITAS (MODAL)', 'Modal Ditempatkan & Disetor Penuh', 'Paid-in Capital Pendiri', String(metrics.paidInCapital), 'Paid-in']);
      rows.push(['3. EKUITAS (MODAL)', 'Modal Tambahan (Additional Paid-in Capital / Agio)', 'Setoran Tambahan Modal', String(metrics.additionalCapital), 'Additional']);
      rows.push(['3. EKUITAS (MODAL)', 'Total Modal Disetor & Tambahan', 'Subtotal Modal Disetor', String(metrics.totalPaidAndAdditional), 'Capital Subtotal']);
      rows.push(['3. EKUITAS (MODAL)', 'Saldo Laba Ditahan (Retained Earnings)', 'Saldo Laba Periode Lalu', String(metrics.retainedEarningsOpening), 'Retained']);
      rows.push(['3. EKUITAS (MODAL)', 'Laba Bersih Periode Berjalan', 'Current Net Income YTD', String(metrics.netProfit), 'Current Profit']);
      rows.push(['3. EKUITAS (MODAL)', 'TOTAL EKUITAS BERSIH', 'Aset - Liabilitas', String(metrics.totalEquity), 'Net Equity']);
      rows.push(['3. EKUITAS (MODAL)', 'Validasi Persamaan Dasar Akuntansi', 'Aset = Liabilitas + Ekuitas', `Aset: ${formatIDR(metrics.totalAssets)} = Pasiva: ${formatIDR(metrics.totalLiabilities + metrics.totalEquity)}`, 'BALANCED']);
      rows.push(['', '', '', '', '']);

      // 4. PENDAPATAN (INCOME)
      rows.push(['4. PENDAPATAN', '--- RINCIAN PENDAPATAN PER KATEGORI ---', '', '', '']);
      Object.entries(metrics.incomeByCategory).forEach(([cat, val]) => {
        const numVal = Number(val) || 0;
        const pct = metrics.totalIncome > 0 ? ((numVal / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%';
        rows.push(['4. PENDAPATAN', `"${getTransactionCategoryLabel(cat)}"`, 'Pendapatan Operasional', String(numVal), pct]);
      });
      rows.push(['4. PENDAPATAN', 'TOTAL PENDAPATAN KOTOR (GROSS REVENUE)', 'Semua Pendapatan', String(metrics.totalIncome), '100%']);
      rows.push(['', '', '', '', '']);

      // 5. BEBAN & BIAYA (EXPENSES)
      rows.push(['5. BEBAN & BIAYA', '--- RINCIAN BEBAN PENGELUARAN ---', '', '', '']);
      Object.entries(metrics.expenseByCategory).forEach(([cat, val]) => {
        const numVal = Number(val) || 0;
        const pct = metrics.totalExpense > 0 ? ((numVal / metrics.totalExpense) * 100).toFixed(1) + '%' : '0%';
        rows.push(['5. BEBAN & BIAYA', `"${getTransactionCategoryLabel(cat)}"`, 'Beban Operasional/HPP', String(numVal), pct]);
      });
      rows.push(['5. BEBAN & BIAYA', 'TOTAL SELURUH BEBAN PENGELUARAN', 'Total Expenses', String(metrics.totalExpense), '100%']);
      rows.push(['5. BEBAN & BIAYA', 'LABA BERSIH KONSOLIDASI (NET PROFIT)', 'Net Operating Profit', String(metrics.netProfit), `${metrics.profitMargin.toFixed(1)}%`]);
      rows.push(['', '', '', '', '']);

      // 6. FASILITAS PINJAMAN BANK
      if (metrics.loansList.length > 0) {
        rows.push(['6. PINJAMAN BANK', 'Nama Bank | No. Fasilitas', 'Metode', 'Plafon Awal', 'Bunga p.a.', 'Tenor', 'Cicilan Pokok/Bln', 'Beban Bunga/Bln', 'Total Angsuran/Bln', 'Sisa Pokok', 'Status']);
        metrics.loansList.forEach((loan) => {
          const facLabel = loan.facilityType === 'REVOLVING' ? 'Revolving (KMK)' : 'Non-Revolving';
          rows.push([
            '6. PINJAMAN BANK',
            `"${loan.bankName} - ${loan.loanNumber}"`,
            facLabel,
            String(loan.principalAmount),
            `${loan.annualInterestRate}%`,
            `${loan.tenureMonths} Bln`,
            String(loan.monthlyPrincipal),
            String(loan.monthlyInterest),
            String(loan.monthlyInstallment),
            String(loan.remainingPrincipal ?? loan.principalAmount),
            loan.status,
          ]);
        });
        rows.push(['', '', '', '', '', '', '', '', '', '', '']);
      }

      // 7. Portofolio Proyek
      rows.push(['7. KINERJA PROYEK', 'Kode Proyek | Klien', 'Nilai Kontrak (IDR)', 'Pendapatan Diterima (IDR)', 'Beban (IDR)', 'Laba Bersih (IDR)', 'Margin (%)']);
      metrics.projectFinancials.forEach((pf) => {
        const pct = pf.totalIncome > 0 ? ((pf.netProfit / pf.totalIncome) * 100).toFixed(1) + '%' : '0%';
        rows.push(['7. PROYEK', `"${pf.projectCode} - ${pf.clientName}"`, String(pf.contractValue), String(pf.totalIncome), String(pf.totalExpense), String(pf.netProfit), pct]);
      });
    } else if (reportType === 'ASSETS') {
      filename = `Laporan_Posisi_Aset_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Kelompok Aset', 'Komponen / Rekening', 'Nominal (IDR)', 'Keterangan'];
      rows.push(['I. ASET LANCAR', '--- Kas & Saluran Bank ---', '', '']);
      metrics.channelSummary.forEach((ch) => {
        rows.push(['Aset Lancar - Kas/Bank', `"${ch.name} (${ch.accountNumber})"`, String(Math.max(0, ch.net)), `${ch.count} transaksi`]);
      });
      rows.push(['Aset Lancar - Kas/Bank', 'Subtotal Kas & Bank', String(metrics.cashAndBankAsset), 'Total Likuiditas Bank']);
      rows.push(['Aset Lancar - Piutang', 'Piutang Usaha Konsultasi (Pending Invoices)', String(metrics.receivablesAsset), 'Menunggu pelunasan klien']);
      rows.push(['TOTAL ASET LANCAR', 'Total Aktiva Lancar', String(metrics.cashAndBankAsset + metrics.receivablesAsset), 'Kas + Piutang']);
      rows.push(['', '', '', '']);
      rows.push(['II. ASET TIDAK LANCAR', 'Peralatan Komputasi & Fasilitas Lab', String(metrics.fixedAssets), 'Nilai Perolehan Inventaris']);
      rows.push(['TOTAL ASET TETAP', 'Total Aktiva Tetap', String(metrics.fixedAssets), 'Aset Tak Lancar Bersih']);
      rows.push(['', '', '', '']);
      rows.push(['TOTAL KESELURUHAN ASET', 'Aktiva Lancar + Aktiva Tetap', String(metrics.totalAssets), 'Total Harta']);
    } else if (reportType === 'LIABILITIES') {
      filename = `Laporan_Liabilitas_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Kelompok Kewajiban', 'Komponen Kewajiban', 'Nominal (IDR)', 'Status'];
      rows.push(['I. LIABILITAS JANGKA PENDEK', 'Utang Usaha & Biaya Jasa Surveyor LVI', String(metrics.payablesLiability), 'Pending Belum Terbayar']);
      rows.push(['I. LIABILITAS JANGKA PENDEK', 'Utang Pajak PPh 23 / PPN 11% Terutang', String(metrics.taxLiability), 'Kewajiban Masa']);
      rows.push(['II. LIABILITAS JANGKA PANJANG', 'Sisa Pokok Pinjaman Bank (Bank Loans)', String(metrics.longTermBankLoans), 'Pinjaman Aktif']);
      rows.push(['TOTAL LIABILITAS', 'Total Seluruh Kewajiban', String(metrics.totalLiabilities), 'Semua Utang']);
    } else if (reportType === 'BANK_LOANS') {
      filename = `Laporan_Pinjaman_Bank_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Nama Bank / Kreditur',
        'Nomor Fasilitas',
        'Metode Fasilitas',
        'Plafon Pokok (IDR)',
        'Suku Bunga (% p.a.)',
        'Tenor (Bulan)',
        'Cicilan Pokok / Bulan (IDR)',
        'Beban Bunga / Bulan (IDR)',
        'Total Angsuran / Bulan (IDR)',
        'Sisa Pokok (IDR)',
        'Bunga Terbayar (IDR)',
        'Status',
      ];
      metrics.loansList.forEach((loan) => {
        const facLabel = loan.facilityType === 'REVOLVING' ? 'Revolving (KMK)' : 'Non-Revolving (Term Loan)';
        rows.push([
          `"${loan.bankName}"`,
          `"${loan.loanNumber}"`,
          `"${facLabel}"`,
          String(loan.principalAmount),
          `${loan.annualInterestRate}%`,
          String(loan.tenureMonths),
          String(loan.monthlyPrincipal),
          String(loan.monthlyInterest),
          String(loan.monthlyInstallment),
          String(loan.remainingPrincipal ?? loan.principalAmount),
          String(loan.paidInterest || 0),
          loan.status,
        ]);
      });
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
      rows.push(['TOTAL REKAPITULASI PINJAMAN', '', '', String(metrics.totalLoanFacility), '', '', String(metrics.totalMonthlyPrincipal), String(metrics.totalMonthlyInterest), String(metrics.totalMonthlyPrincipal + metrics.totalMonthlyInterest), String(metrics.totalRemainingPrincipal), String(metrics.totalPaidInterest), '']);
    } else if (reportType === 'RECEIVABLES_AGING') {
      filename = `Laporan_Piutang_dan_Aging_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'No. Invoice / Tagihan',
        'Kode Proyek',
        'Nama Klien / Perusahaan',
        'Termin / Milestone',
        'Tanggal Terbit',
        'Jatuh Tempo',
        'Umur Piutang (Hari)',
        'Status Aging',
        'Nilai Tagihan (IDR)',
        'Terbayar (IDR)',
        'Sisa Piutang (IDR)',
        'Status Pelunasan',
      ];
      (receivables || []).forEach((r) => {
        const remaining = r.remainingAmountIDR !== undefined ? r.remainingAmountIDR : Math.max(0, r.totalAmountIDR - (r.paidAmountIDR || 0));
        const due = new Date(r.dueDate).getTime();
        const now = new Date().getTime();
        const daysDiff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        let agingLabel = '0-30 Hari (Lancar)';
        if (r.status === 'LUNAS') {
          agingLabel = 'Lunas';
        } else if (daysDiff > 90) {
          agingLabel = '> 90 Hari (Macet)';
        } else if (daysDiff > 60) {
          agingLabel = '61 - 90 Hari (Diragukan)';
        } else if (daysDiff > 30) {
          agingLabel = '31 - 60 Hari (Kurang Lancar)';
        } else if (daysDiff > 0) {
          agingLabel = '1 - 30 Hari (Perhatian Khusus)';
        }

        rows.push([
          `"${r.invoiceNumber}"`,
          `"${r.projectCode || '-'}"`,
          `"${r.clientName}"`,
          `"${r.milestoneTermin || r.title || '-'}"`,
          r.issueDate,
          r.dueDate,
          String(Math.max(0, daysDiff)),
          `"${agingLabel}"`,
          String(r.totalAmountIDR),
          String(r.paidAmountIDR || 0),
          String(remaining),
          r.status,
        ]);
      });
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
      rows.push(['TOTAL IKHTISAR PIUTANG USAHA', '', '', '', '', '', '', '', String(metrics.receivablesAgingSummary.totalInvoiced), String(metrics.receivablesAgingSummary.totalSettled), String(metrics.receivablesAgingSummary.totalOutstanding), `${metrics.receivablesAgingSummary.settlementRate.toFixed(1)}% Terbayar`]);
    } else if (reportType === 'EQUITY') {
      filename = `Laporan_Ekuitas_Modal_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Komponen Ekuitas', 'Keterangan', 'Nominal (IDR)'];
      rows.push(['Modal Disetor Pendiri', 'Modal Awal Ditempatkan', String(Math.max(0, metrics.totalEquity - metrics.netProfit))]);
      rows.push(['Saldo Laba Ditahan', 'Retained Earnings Lalu', '0']);
      rows.push(['Laba Bersih Tahun Berjalan', 'Current Net Profit YTD', String(metrics.netProfit)]);
      rows.push(['TOTAL EKUITAS BERSIH', 'Aset - Liabilitas', String(metrics.totalEquity)]);
    } else if (reportType === 'EXPENSES') {
      filename = `Laporan_Rincian_Beban_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Kelompok Beban', 'Kategori Pengeluaran', 'Nominal (IDR)', 'Porsi (%)'];
      Object.entries(metrics.expenseByCategory).forEach(([cat, val]) => {
        const numVal = Number(val) || 0;
        const pct = metrics.totalExpense > 0 ? ((numVal / metrics.totalExpense) * 100).toFixed(1) + '%' : '0%';
        rows.push(['Beban Operasional', `"${getTransactionCategoryLabel(cat)}"`, String(numVal), pct]);
      });
      rows.push(['TOTAL SELURUH BEBAN', 'Semua Pengeluaran Periode Ini', String(metrics.totalExpense), '100%']);
    } else if (reportType === 'BALANCE_SHEET') {
      filename = `Laporan_Neraca_Keuangan_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Sisi Neraca', 'Pos Akuntansi', 'Nominal (IDR)'];
      rows.push(['AKTIVA (ASET)', 'Kas & Rekening Operasional Bank', String(metrics.cashAndBankAsset)]);
      rows.push(['AKTIVA (ASET)', 'Piutang Usaha Konsultasi', String(metrics.receivablesAsset)]);
      rows.push(['AKTIVA (ASET)', 'Aset Tetap & Peralatan', String(metrics.fixedAssets)]);
      rows.push(['TOTAL AKTIVA (ASET)', 'Total Harta', String(metrics.totalAssets)]);
      rows.push(['', '', '']);
      rows.push(['PASIVA (LIABILITAS)', 'Utang Usaha & Surveyor Pending', String(metrics.payablesLiability)]);
      rows.push(['PASIVA (LIABILITAS)', 'Utang Pajak PPh/PPN Terutang', String(metrics.taxLiability)]);
      rows.push(['PASIVA (LIABILITAS)', 'Utang Pokok Pinjaman Bank', String(metrics.longTermBankLoans)]);
      rows.push(['PASIVA (EKUITAS)', 'Modal Disetor & Cadangan', String(Math.max(0, metrics.totalEquity - metrics.netProfit))]);
      rows.push(['PASIVA (EKUITAS)', 'Laba Bersih Tahun Berjalan', String(metrics.netProfit)]);
      rows.push(['TOTAL PASIVA (LIABILITAS + EKUITAS)', 'Total Kewajiban + Modal', String(metrics.totalLiabilities + metrics.totalEquity)]);
    } else if (reportType === 'PROFIT_AND_LOSS') {
      filename = `Laporan_Laba_Rugi_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Komponen Laporan', 'Kategori / Pos Akun', 'Nominal (IDR)', 'Kontribusi (%)'];
      
      // Income section
      rows.push(['I. PENDAPATAN OPERASIONAL', '', '', '']);
      Object.entries(metrics.incomeByCategory).forEach(([cat, val]) => {
        const numVal = Number(val) || 0;
        const pct = metrics.totalIncome > 0 ? ((numVal / metrics.totalIncome) * 100).toFixed(1) + '%' : '0%';
        rows.push(['Pendapatan', `"${getTransactionCategoryLabel(cat)}"`, String(numVal), pct]);
      });
      rows.push(['TOTAL PENDAPATAN', 'Semua Pendapatan', String(metrics.totalIncome), '100%']);
      rows.push(['', '', '', '']);

      // Expense section
      rows.push(['II. BEBAN OPERASIONAL & AUDIT', '', '', '']);
      Object.entries(metrics.expenseByCategory).forEach(([cat, val]) => {
        const numVal = Number(val) || 0;
        const pct = metrics.totalExpense > 0 ? ((numVal / metrics.totalExpense) * 100).toFixed(1) + '%' : '0%';
        rows.push(['Beban', `"${getTransactionCategoryLabel(cat)}"`, String(numVal), pct]);
      });
      rows.push(['TOTAL BEBAN', 'Semua Beban Operasional', String(metrics.totalExpense), '100%']);
      rows.push(['', '', '', '']);

      // Net Income
      rows.push(['III. LABA / (RUGI) BERSIH', 'Net Operating Profit', String(metrics.netProfit), `${metrics.profitMargin.toFixed(1)}%`]);
    } else if (reportType === 'PROJECT_PROFITABILITY') {
      filename = `Laporan_Kinerja_Finansial_Proyek_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Kode Proyek',
        'Nama Klien',
        'Nilai Kontrak (IDR)',
        'Total Pendapatan Diterima (IDR)',
        'Total Beban Operasional (IDR)',
        'Laba Bersih Proyek (IDR)',
        'Margin Laba (%)',
        'Jumlah Transaksi',
      ];
      rows = metrics.projectFinancials.map((pf) => [
        `"${pf.projectCode}"`,
        `"${pf.clientName}"`,
        String(pf.contractValue),
        String(pf.totalIncome),
        String(pf.totalExpense),
        String(pf.netProfit),
        pf.totalIncome > 0 ? ((pf.netProfit / pf.totalIncome) * 100).toFixed(1) + '%' : '0%',
        String(pf.transactionCount),
      ]);
    } else {
      // General Ledger / All Transactions Export
      filename = `Laporan_Jurnal_Buku_Besar_GAP_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'No. Transaksi',
        'Tanggal',
        'Tipe',
        'Kategori',
        'Keterangan',
        'Kode Proyek',
        'Klien / Vendor / Pihak',
        'Metode Pembayaran',
        'No. Referensi / Invoice',
        'Status',
        'Nominal Masuk (IDR)',
        'Nominal Keluar (IDR)',
      ];

      rows = filteredTransactions.map((t) => [
        `"${t.transactionNumber}"`,
        `"${t.date}"`,
        `"${t.type}"`,
        `"${getTransactionCategoryLabel(t.category)}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.projectCode || '-'}"`,
        `"${t.clientOrVendorName || '-'}"`,
        `"${getPaymentMethodLabel(t.paymentMethod, paymentChannels)}"`,
        `"${t.referenceNumber || '-'}"`,
        `"${t.status}"`,
        t.type === 'INCOME' ? String(t.amountIDR) : '0',
        t.type === 'EXPENSE' ? String(t.amountIDR) : '0',
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy Executive Brief to Clipboard
  const handleCopySummary = () => {
    const text = `=== RINGKASAN EKSEKUTIF LAPORAN KEUANGAN KOMPREHENSIF ===
Dokumen: ${documentNumber}
Periode: ${dateBounds.label}
Status: ${statusFilter === 'ALL' ? 'Semua Status' : statusFilter === 'CLEARED_ONLY' ? 'Hanya Lunas (Cleared)' : 'Pending & Overdue'}
Total Transaksi: ${filteredTransactions.length}

• Total Pendapatan Kotor (Gross Inflow): ${formatIDR(metrics.totalIncome)}
  - Realisasi Kas Masuk (Cleared): ${formatIDR(metrics.clearedIncome)}
  - Outstanding Piutang (Pending): ${formatIDR(metrics.pendingIncome)}
• Total Beban Operasional (Outflow): ${formatIDR(metrics.totalExpense)}
  - Biaya Langsung Proyek (HPP/Survey/Uji): ${formatIDR(metrics.directExpenseTotal)}
  - Beban Operasional Kantor & Overhead: ${formatIDR(metrics.overheadExpenseTotal)}
  - Setoran Pajak (PPh & PPN): ${formatIDR(metrics.taxExpense)}
• Laba Kotor Operasional (Gross Profit): ${formatIDR(metrics.grossProfit)} (${metrics.grossMargin.toFixed(1)}%)
• Laba Bersih Konsolidasi (Net Profit): ${formatIDR(metrics.netProfit)} (${metrics.profitMargin.toFixed(1)}%)
• Tingkat Realisasi Kas (Collection Rate): ${metrics.clearedSettlementRate.toFixed(1)}%

Disusun Oleh: ${currentUser.name} (${currentUser.roleTitle})
Otorisasi: Managing Director GAP.CRM
Sistem: GAP.CRM Financial Comprehensive Reporting Engine (Audit Ready)`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & REPORT CONTROLS (Hidden when printing) */}
      <div className="print:hidden space-y-4">
        {/* Executive Banner & Title */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Output Laporan Keuangan
                </h1>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  Finance Studio
                </span>
                <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  Siap Dilaporkan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generator laporan keuangan resmi, laba rugi, arus kas, laporan komprehensif eksekutif, dan profitabilitas proyek bersumber dari data mutasi kas aktif.
              </p>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
              title="Salin Ringkasan Eksekutif ke Clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
              title="Unduh format spreadsheet CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsCapitalModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-300"
              title="Atur Nominal Modal Dasar, Modal Disetor, dan Modal Tambahan"
            >
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span>Atur Modal &amp; Ekuitas</span>
            </button>

            <button
              onClick={() => {
                setModalInitialType('EXPENSE');
                setIsTransactionModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Input Transaksi Baru / Catat Pengadaan Aset"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Catat Mutasi / Aset</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              title="Cetak Laporan / Simpan sebagai PDF Resmi Siap Dilaporkan"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Cetak / Export PDF</span>
            </button>
          </div>
        </div>

        {/* 2. REPORT TYPE NAVIGATION PILLS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setReportType('COMPREHENSIVE')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'COMPREHENSIVE'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Laporan Komprehensif</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
              reportType === 'COMPREHENSIVE'
                ? 'bg-slate-950 text-emerald-300'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              Master
            </span>
          </button>

          {/* 5 PILAR AKUNTANSI UTAMA */}
          <button
            onClick={() => setReportType('ASSETS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'ASSETS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Aset (Harta/Aktiva)</span>
          </button>

          <button
            onClick={() => setReportType('LIABILITIES')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'LIABILITIES'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>2. Liabilitas (Kewajiban/Utang)</span>
          </button>

          <button
            onClick={() => setReportType('EQUITY')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'EQUITY'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>3. Ekuitas (Modal)</span>
          </button>

          <button
            onClick={() => setReportType('PROFIT_AND_LOSS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'PROFIT_AND_LOSS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>4. Pendapatan (Income)</span>
          </button>

          <button
            onClick={() => setReportType('EXPENSES')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'EXPENSES'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>5. Beban (Expense)</span>
          </button>

          <button
            onClick={() => setReportType('BALANCE_SHEET')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'BALANCE_SHEET'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Neraca (Balance Sheet)</span>
          </button>

          <button
            onClick={() => setReportType('RECEIVABLES_AGING')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'RECEIVABLES_AGING'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Piutang &amp; Aging AR</span>
            {metrics.receivablesAgingSummary && metrics.receivablesAgingSummary.activeCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                reportType === 'RECEIVABLES_AGING'
                  ? 'bg-slate-950 text-emerald-300'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {metrics.receivablesAgingSummary.activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setReportType('BANK_LOANS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'BANK_LOANS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Pinjaman Bank (Loans)</span>
            {metrics.loansList.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                reportType === 'BANK_LOANS'
                  ? 'bg-slate-950 text-emerald-300'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {metrics.loansList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setReportType('CASH_FLOW')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'CASH_FLOW'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Arus Kas (Cash Flow)</span>
          </button>

          <button
            onClick={() => setReportType('PROJECT_PROFITABILITY')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'PROJECT_PROFITABILITY'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Margin Proyek</span>
          </button>

          <button
            onClick={() => setReportType('GENERAL_LEDGER')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'GENERAL_LEDGER'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Buku Besar</span>
          </button>

          <button
            onClick={() => setReportType('TAX_AND_SETTLEMENT')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === 'TAX_AND_SETTLEMENT'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pajak & Settlement</span>
          </button>
        </div>

        {/* 3. INTERACTIVE FILTER & CUSTOMIZATION TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Group: Periode & Status */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Periode:</span>
              </div>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as DatePeriodFilter)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Waktu</option>
                <option value="THIS_MONTH">Bulan Ini</option>
                <option value="LAST_MONTH">Bulan Lalu</option>
                <option value="THIS_QUARTER">Kuartal Berjalan</option>
                <option value="THIS_YEAR">Tahun Berjalan (YTD)</option>
                <option value="CUSTOM">Rentang Tanggal Khusus...</option>
              </select>

              {periodFilter === 'CUSTOM' && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs bg-transparent border-0 text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs bg-transparent border-0 text-slate-800 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-2">
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status Mutasi</option>
                <option value="CLEARED_ONLY">Hanya Lunas (Cleared)</option>
                <option value="PENDING_OVERDUE">Pending & Tertunggak</option>
              </select>

              {/* Project Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-2">
                <span>Proyek:</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-[200px] truncate"
              >
                <option value="ALL">Semua Proyek Konsultasi</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.clientName}
                  </option>
                ))}
              </select>

              {/* Accounting Category Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-2">
                <span>Kategori:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-[210px] truncate"
                title="Filter by Accounting Category"
              >
                <option value="ALL">Semua Kategori Akuntansi</option>
                <optgroup label="── Beban Operasional & Proyek (Expenses) ──">
                  <option value="SURVEYOR_AUDIT_FEES">LVI & AUDIT OFFICIAL FEE</option>
                  <option value="TAX_PPH_PPN">PAJAK PPN 11%</option>
                  <option value="GAJI_KARYAWAN">GAJI KARYAWAN</option>
                  <option value="INTERNET">INTERNET</option>
                  <option value="LISTRIK">LISTRIK</option>
                  <option value="OPERATIONAL_OFFICE">OPERASIONAL KANTOR</option>
                  <option value="MAKAN_MINUM">MAKAN & MINUM</option>
                  <option value="TRANSPORTASI">TRANSPORTASI</option>
                  <option value="BANK_INTEREST">BANK INTEREST</option>
                  <option value="SEWA_KANTOR">SEWA KANTOR</option>
                  <option value="OFFICE_UTILITIES_EXPENSE">OFFICE & UTILITIES EXPENSE</option>
                  <option value="MISCELLANEOUS_EXPENSE">MISCELLANEOUS EXPENSE</option>
                  <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                  <option value="AKOMODASI">AKOMODASI</option>
                  <option value="UANG_RAPAT">UANG RAPAT</option>
                  <option value="LAIN_LAIN">LAIN - LAIN</option>
                </optgroup>
                <optgroup label="── Pendapatan (Income) ──">
                  <option value="CLIENT_CONSULTING_FEE">CLIENT CONSULTING FEE</option>
                  <option value="TKDN_MILESTONE_PAYMENT">TKDN MILESTONE PAYMENT (TERMIN)</option>
                  <option value="SURVEYOR_FACILITATION">LVI FACILITATION FEE</option>
                  <option value="LEGAL_RETAINER">LEGAL & OSS RETAINER</option>
                  <option value="SUCCESS_FEE">CERTIFICATION SUCCESS FEE</option>
                  <option value="TRAINING_WORKSHOP">TRAINING & WORKSHOP FEE</option>
                  <option value="OTHER_INCOME">OTHER OPERATING INCOME</option>
                </optgroup>
              </select>

              {/* Reset filter button */}
              {(periodFilter !== 'THIS_YEAR' || statusFilter !== 'ALL' || selectedProjectId !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setPeriodFilter('THIS_YEAR');
                    setStatusFilter('ALL');
                    setSelectedProjectId('ALL');
                    setCategoryFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 ml-1"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Search Query */}
            <div className="relative w-full lg:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no. trx, uraian, pihak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Additional Print Options Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Format Cetak:
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLetterhead}
                    onChange={(e) => setShowLetterhead(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Kop Surat Resmi</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Lembar Tanda Tangan Pejabat</span>
                </label>

                {showSignatures && (
                  <button
                    type="button"
                    onClick={() => setIsSignatoryPanelOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSignatoryPanelOpen
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title="Atur Opsi Penandatangan Laporan (Finance & Director Roles)"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Opsi Penandatangan ({financeEligibleMembers.length} Finance, {directorEligibleMembers.length} Director)</span>
                    {isSignatoryPanelOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                )}

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Catatan / Opini Keuangan</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">No. Dokumen:</span>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-48 text-right focus:outline-hidden"
                />
              </div>
            </div>

            {/* Expandable Role-Restricted Signatory Configuration Panel */}
            {showSignatures && isSignatoryPanelOpen && (
              <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Pengaturan Otorisasi &amp; Pejabat Penandatangan Dokumen
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      Role Enforced
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Dipersiapkan: <strong>Hanya Role Finance</strong> | Disetujui: <strong>Hanya Role Director</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* LEFT: DIPERSIAPKAN (FINANCE ONLY) */}
                  <div className="bg-white rounded-lg border border-emerald-200 p-3 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        1. Dipersiapkan &amp; Diverifikasi Oleh
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                        Khusus Role Finance
                      </span>
                    </div>

                    {/* Person Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pilih Pejabat / Staf Finance:
                      </label>
                      <select
                        value={isCustomPreparer ? 'CUSTOM' : selectedPreparerId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setIsCustomPreparer(true);
                          } else {
                            setIsCustomPreparer(false);
                            setSelectedPreparerId(val);
                            const found = financeEligibleMembers.find((m) => m.id === val);
                            if (found) {
                              setPreparerName(found.name);
                              if (found.roleTitle) {
                                setPreparerPosition(found.roleTitle);
                              }
                            }
                          }
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        <optgroup label="── Anggota Tim dengan Akses / Role Finance ──">
                          {financeEligibleMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.roleTitle || 'Finance Officer'})
                            </option>
                          ))}
                        </optgroup>
                        <option value="CUSTOM">+ Kustom Nama Personil Finance...</option>
                      </select>
                    </div>

                    {/* Custom Name Input if selected */}
                    {isCustomPreparer && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Nama Personil Finance:
                        </label>
                        <input
                          type="text"
                          value={preparerName}
                          onChange={(e) => setPreparerName(e.target.value)}
                          placeholder="Masukkan nama staf finance..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    )}

                    {/* Position Title Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Jabatan Finance:
                      </label>
                      <select
                        value={preparerPosition}
                        onChange={(e) => setPreparerPosition(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        {FINANCE_POSITION_OPTIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Position Input if custom selected */}
                    {preparerPosition === 'Custom (Kustom Jabatan...)' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tulis Nama Jabatan Khusus Finance:
                        </label>
                        <input
                          type="text"
                          value={customPreparerPosition}
                          onChange={(e) => setCustomPreparerPosition(e.target.value)}
                          placeholder="cth. Head of Treasury &amp; Risk..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    )}

                    <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-100">
                      <strong>Preview:</strong> {preparerName} — <span className="font-semibold">{displayPreparerPosition}</span>
                    </div>
                  </div>

                  {/* RIGHT: DISETUJUI (DIRECTOR ONLY) */}
                  <div className="bg-white rounded-lg border border-purple-200 p-3 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        2. Disetujui &amp; Disahkan Oleh
                      </span>
                      <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold uppercase">
                        Khusus Role Director
                      </span>
                    </div>

                    {/* Person Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pilih Dewan Direksi / Managing Director:
                      </label>
                      <select
                        value={isCustomApprover ? 'CUSTOM' : selectedApproverId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setIsCustomApprover(true);
                          } else {
                            setIsCustomApprover(false);
                            setSelectedApproverId(val);
                            const found = directorEligibleMembers.find((m) => m.id === val);
                            if (found) {
                              setApproverName(found.name);
                              if (found.roleTitle) {
                                setApproverPosition(found.roleTitle);
                              }
                            }
                          }
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      >
                        <optgroup label="── Anggota Tim dengan Hak Direksi (Director / Master Admin) ──">
                          {directorEligibleMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.roleTitle || 'Director'})
                            </option>
                          ))}
                        </optgroup>
                        <option value="CUSTOM">+ Kustom Nama Direktur...</option>
                      </select>
                    </div>

                    {/* Custom Name Input if selected */}
                    {isCustomApprover && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Nama Direktur:
                        </label>
                        <input
                          type="text"
                          value={approverName}
                          onChange={(e) => setApproverName(e.target.value)}
                          placeholder="Masukkan nama direktur..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* Position Title Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Jabatan Director:
                      </label>
                      <select
                        value={approverPosition}
                        onChange={(e) => setApproverPosition(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      >
                        {DIRECTOR_POSITION_OPTIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Position Input if custom selected */}
                    {approverPosition === 'Custom (Kustom Jabatan...)' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tulis Nama Jabatan Khusus Director:
                        </label>
                        <input
                          type="text"
                          value={customApproverPosition}
                          onChange={(e) => setCustomApproverPosition(e.target.value)}
                          placeholder="cth. President Commissioner &amp; CEO..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    <div className="text-[11px] text-purple-900 bg-purple-50/70 p-2 rounded border border-purple-100">
                      <strong>Preview:</strong> {approverName} — <span className="font-semibold">{displayApproverPosition}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. EXECUTIVE FINANCIAL KPIS RIBBON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Pendapatan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Pendapatan (Inflow)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                {formatIDR(metrics.totalIncome)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Cleared: {formatIDRShort(metrics.clearedIncome)}</span>
              <span className="text-amber-600">Pending: {formatIDRShort(metrics.pendingIncome)}</span>
            </div>
          </div>

          {/* Card 2: Total Beban */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Beban (Outflow)
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                {formatIDR(metrics.totalExpense)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Cleared: {formatIDRShort(metrics.clearedExpense)}</span>
              <span className="text-slate-400">{metrics.expenseRatio.toFixed(1)}% dari Omset</span>
            </div>
          </div>

          {/* Card 3: Laba Bersih */}
          <div className={`rounded-2xl border p-4 shadow-xs ${
            metrics.netProfit >= 0
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-rose-50/50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Laba Bersih Operasional
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                metrics.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-lg font-extrabold font-mono tracking-tight ${
                metrics.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                {formatIDR(metrics.netProfit)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Margin: {metrics.profitMargin.toFixed(1)}%
              </span>
              <span className="text-slate-500">{metrics.netProfit >= 0 ? 'Surplus Kas' : 'Defisit Kas'}</span>
            </div>
          </div>

          {/* Card 4: Realisasi Kas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Realisasi & Settlement
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                {metrics.clearedSettlementRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">Lunas</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{filteredTransactions.length} Total Mutasi</span>
              <span>{filteredTransactions.filter((t) => t.status === 'CLEARED').length} Cleared</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FORMAL REPORT PAPER SHEET (Pristine Printable Layout) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Official Header / Letterhead */}
        {showLetterhead && (
          <div className="border-b-2 border-slate-800 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                  <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
                    GAP<span className="text-emerald-600">.CRM</span> CONSULTING
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Statutory TKDN Verification, SNI & Regulatory Advisory Group
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded inline-block">
                  NO: {documentNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Tanggal Terbit: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-slate-500">
                  Klasifikasi: <span className="font-semibold text-emerald-700">Official Financial Record</span>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <h3 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                {reportType === 'COMPREHENSIVE' && 'LAPORAN KEUANGAN EKSEKUTIF KOMPREHENSIF (COMPREHENSIVE FINANCIAL DOSSIER)'}
                {reportType === 'ASSETS' && 'LAPORAN POSISI ASET & AKTIVA USAHA (ASSETS STATEMENT)'}
                {reportType === 'LIABILITIES' && 'LAPORAN LIABILITAS & KEWAJIBAN USAHA (LIABILITIES STATEMENT)'}
                {reportType === 'BANK_LOANS' && 'LAPORAN MANAJEMEN PINJAMAN BANK & AMORTISASI BUNGA (BANK LOANS & FINANCING STATEMENT)'}
                {reportType === 'EQUITY' && 'LAPORAN PERUBAHAN EKUITAS & MODAL USAHA (EQUITY STATEMENT)'}
                {reportType === 'PROFIT_AND_LOSS' && 'LAPORAN PENDAPATAN & LABA RUGI KOMPREHENSIF (INCOME STATEMENT)'}
                {reportType === 'EXPENSES' && 'LAPORAN RINCIAN BEBAN & BIAYA OPERASIONAL (EXPENSES REPORT)'}
                {reportType === 'BALANCE_SHEET' && 'LAPORAN NERACA POSISI KEUANGAN (BALANCE SHEET)'}
                {reportType === 'CASH_FLOW' && 'LAPORAN ARUS KAS OPERASIONAL & PENDANAAN (CASH FLOW STATEMENT)'}
                {reportType === 'PROJECT_PROFITABILITY' && 'LAPORAN ANALISIS MARGIN & KINERJA FINANSIAL PROYEK'}
                {reportType === 'GENERAL_LEDGER' && 'LAPORAN BUKU BESAR & MUTASI KAS HARIAN (GENERAL LEDGER)'}
                {reportType === 'TAX_AND_SETTLEMENT' && 'LAPORAN REKONSILIASI PAJAK PPH/PPN & AGING PIUTANG'}
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                {dateBounds.label} | Mata Uang: Indonesian Rupiah (IDR)
              </p>
              {reportType === 'COMPREHENSIVE' && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold tracking-wider font-mono">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  STATUS DOKUMEN: SIAP DILAPORKAN & DIVALIDASI SISTEM (READY TO REPORT)
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 0: LAPORAN KEUANGAN KOMPREHENSIF (COMPREHENSIVE MASTER REPORT)      */}
        {/* ========================================================================= */}
        {reportType === 'COMPREHENSIVE' && (
          <div className="space-y-8">
            {/* 0. EXECUTIVE DASHBOARD DIAGNOSTIC SUMMARY */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                      Laporan Keuangan Komprehensif Terpadu (Master Financial Dossier)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Konsolidasi terintegrasi 5 pilar akuntansi: 1. Aset (Harta), 2. Liabilitas (Kewajiban), 3. Ekuitas (Modal), 4. Pendapatan (Income), dan 5. Beban (Expenses).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-bold">
                    Audit Status: 5-Pillar Balanced &amp; Verified
                  </span>
                </div>
              </div>

              {/* 6 Core Accounting KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-400" />
                    <span>1. Total Aset</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-1 truncate">
                    {formatIDR(metrics.totalAssets)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Kas: {formatIDRShort(metrics.cashAndBankAsset)}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-rose-400" />
                    <span>2. Liabilitas</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-rose-400 mt-1 truncate">
                    {formatIDR(metrics.totalLiabilities)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Bank: {formatIDRShort(metrics.longTermBankLoans)}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-cyan-400" />
                      <span>3. Ekuitas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCapitalModalOpen(true)}
                      className="text-[9px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Atur
                    </button>
                  </div>
                  <div className="text-sm font-bold font-mono text-cyan-400 mt-1 truncate">
                    {formatIDR(metrics.totalEquity)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Disetor: {formatIDRShort(metrics.totalPaidAndAdditional)}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>4. Pendapatan</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-300 mt-1 truncate">
                    {formatIDR(metrics.totalIncome)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Cleared: {formatIDRShort(metrics.clearedIncome)}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-amber-400" />
                    <span>5. Beban / Biaya</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-1 truncate">
                    {formatIDR(metrics.totalExpense)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    HPP: {formatIDRShort(metrics.directExpenseTotal)}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  metrics.netProfit >= 0
                    ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-600/70 text-rose-200'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Laba Bersih</span>
                    <span className="font-mono text-[9px]">{metrics.profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="text-sm font-black font-mono mt-1 truncate">
                    {formatIDR(metrics.netProfit)}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                    Net Margin: {metrics.profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Diagnostic Ratios */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
                <div>
                  Gross Profit Margin: <strong className="text-white font-mono">{metrics.grossMargin.toFixed(1)}%</strong>
                </div>
                <div>
                  OPEX Ratio: <strong className="text-white font-mono">{metrics.totalIncome > 0 ? ((metrics.overheadExpenseTotal / metrics.totalIncome) * 100).toFixed(1) : 0}%</strong>
                </div>
                <div>
                  Rasio Liabilitas / Aset: <strong className="text-white font-mono">{metrics.totalAssets > 0 ? ((metrics.totalLiabilities / metrics.totalAssets) * 100).toFixed(1) : 0}%</strong>
                </div>
                <div>
                  Realisasi Kas: <strong className="text-emerald-400 font-mono">{metrics.clearedSettlementRate.toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* SUBMENU 1: LAPORAN POSISI ASET & HARTA */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>1. POSISI ASET &amp; HARTA USAHA (ASSETS STATEMENT)</span>
                </div>
                <span className="font-mono text-emerald-400 text-sm">{formatIDR(metrics.totalAssets)}</span>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Harta / Aset</div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-1">{formatIDR(metrics.totalAssets)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Aktiva Lancar + Tetap</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kas &amp; Setara Kas</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(metrics.cashAndBankAsset)}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Likuiditas Riil di Rekening</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Piutang Usaha Konsultasi</div>
                  <div className="text-base font-bold font-mono text-amber-600 mt-1">{formatIDR(metrics.receivablesAsset)}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Pending Invoice Klien</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aset Tetap &amp; Peralatan</div>
                  <div className="text-base font-bold font-mono text-slate-700 mt-1">{formatIDR(metrics.fixedAssets)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Nilai Buku Inventaris &amp; Alat Uji</div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-t-lg font-bold text-xs flex items-center justify-between border border-slate-200">
                    <span>I. ASET LANCAR (CURRENT ASSETS)</span>
                    <span className="font-mono text-slate-900">{formatIDR(metrics.cashAndBankAsset + metrics.receivablesAsset)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-t-0 border-slate-200 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3 text-left">A. Saluran Rekening Bank Operasional</th>
                          <th className="py-2.5 px-3 text-center">Mutasi</th>
                          <th className="py-2.5 px-3 text-right">Kas Masuk</th>
                          <th className="py-2.5 px-3 text-right">Kas Keluar</th>
                          <th className="py-2.5 px-3 text-right">Net Arus Kas</th>
                          <th className="py-2.5 px-3 text-right">Saldo Kas Berjalan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.channelSummary.map((ch, idx) => (
                          <tr key={ch.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2 px-3 text-slate-700 border-b border-slate-200">
                              <div className="font-semibold text-slate-900">{ch.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Rek: <strong className="text-slate-700">{ch.accountNumber}</strong> • {ch.accountHolder}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center border-b border-slate-200 font-sans">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {ch.count} Mutasi
                              </span>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                +{ch.incomeCount} / -{ch.expenseCount}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200">
                              {ch.clearedIncome > 0 ? formatIDR(ch.clearedIncome) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700 border-b border-slate-200">
                              {ch.clearedExpense > 0 ? `(${formatIDR(ch.clearedExpense)})` : '-'}
                            </td>
                            <td className={`py-2 px-3 text-right font-mono font-semibold border-b border-slate-200 ${
                              ch.netCashFlow > 0 ? 'text-emerald-700' : ch.netCashFlow < 0 ? 'text-rose-700' : 'text-slate-500'
                            }`}>
                              {ch.netCashFlow !== 0 ? (ch.netCashFlow > 0 ? `+${formatIDR(ch.netCashFlow)}` : `(${formatIDR(Math.abs(ch.netCashFlow))})`) : 'Rp 0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-b border-slate-200">
                              {ch.balance >= 0 ? formatIDR(ch.balance) : `(${formatIDR(Math.abs(ch.balance))})`}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50/70 font-bold border-b border-slate-200 text-slate-900">
                          <td className="py-2.5 px-3 uppercase text-emerald-950 font-bold">Subtotal Kas &amp; Saluran Bank</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {filteredTransactions.length} Mutasi
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                            {formatIDR(metrics.clearedIncome)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-800">
                            ({formatIDR(metrics.clearedExpense)})
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono ${
                            (metrics.clearedIncome - metrics.clearedExpense) >= 0 ? 'text-emerald-800' : 'text-rose-800'
                          }`}>
                            {(metrics.clearedIncome - metrics.clearedExpense) >= 0 
                              ? `+${formatIDR(metrics.clearedIncome - metrics.clearedExpense)}` 
                              : `(${formatIDR(Math.abs(metrics.clearedIncome - metrics.clearedExpense))})`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-950 font-extrabold">
                            {formatIDR(metrics.cashAndBankAsset)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <table className="w-full text-xs border border-t-0 border-slate-200 border-collapse mt-3">
                    <tbody>
                      <tr className="bg-slate-50 font-bold border-b border-slate-200">
                        <td colSpan={2} className="py-1.5 px-3 text-slate-700">B. Piutang Usaha &amp; Akrual Tagihan Klien (Accounts Receivable)</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          Piutang Termin Milestone &amp; Tagihan Invoice Berjalan
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-amber-600 border-b border-slate-200">
                          {formatIDR(metrics.receivablesAsset)}
                        </td>
                      </tr>
                      <tr className="bg-emerald-100/70 font-bold border-t-2 border-emerald-500">
                        <td className="py-2.5 px-3 text-emerald-950 uppercase">TOTAL ASET LANCAR</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-950">{formatIDR(metrics.cashAndBankAsset + metrics.receivablesAsset)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-t-lg font-bold text-xs flex items-center justify-between border border-slate-200">
                    <span>II. ASET TIDAK LANCAR / ASET TETAP (NON-CURRENT ASSETS)</span>
                    <span className="font-mono text-slate-900">{formatIDR(metrics.fixedAssets)}</span>
                  </div>
                  <table className="w-full text-xs border border-t-0 border-slate-200 border-collapse">
                    <tbody>
                      {metrics.fixedAssetTrxs && metrics.fixedAssetTrxs.length > 0 ? (
                        metrics.fixedAssetTrxs.map((trx, idx) => (
                          <tr key={trx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                              <div className="flex items-center justify-between">
                                <span>{trx.description || getTransactionCategoryLabel(trx.category)}</span>
                                <span className="text-[11px] text-slate-400 font-mono">Tgl: {trx.date} | {trx.clientOrVendorName || 'Inventaris'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 border-b border-slate-200 w-48">
                              {formatIDR(trx.amountIDR)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-white">
                          <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                            Peralatan Komputasi, Server &amp; Fasilitas Lab Uji Teknis TKDN
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 border-b border-slate-200 w-48">
                            {formatIDR(metrics.fixedAssetsGross)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          Akumulasi Penyusutan Aset Tetap
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-500 border-b border-slate-200">
                          ({formatIDR(metrics.depreciationTotal)})
                        </td>
                      </tr>
                      <tr className="bg-emerald-100/70 font-bold border-t-2 border-emerald-500">
                        <td className="py-2.5 px-3 text-emerald-950 uppercase">TOTAL ASET TIDAK LANCAR (NET)</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-950">{formatIDR(metrics.fixedAssets)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SUBMENU 2: LAPORAN LIABILITAS & KEWAJIBAN */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span>2. LIABILITAS &amp; KEWAJIBAN USAHA (LIABILITIES STATEMENT)</span>
                </div>
                <span className="font-mono text-rose-400 text-sm">{formatIDR(metrics.totalLiabilities)}</span>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Liabilitas</div>
                  <div className="text-base font-bold font-mono text-rose-600 mt-1">{formatIDR(metrics.totalLiabilities)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Kewajiban Pendek + Panjang</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Utang Usaha &amp; Surveyor</div>
                  <div className="text-base font-bold font-mono text-amber-600 mt-1">{formatIDR(metrics.payablesLiability)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pending Biaya Surveyor LVI</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimasi Utang Pajak</div>
                  <div className="text-base font-bold font-mono text-rose-600 mt-1">{formatIDR(metrics.taxLiability)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">PPh 23 &amp; PPN 11% Terutang</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pokok Pinjaman Bank</div>
                  <div className="text-base font-bold font-mono text-rose-700 mt-1">{formatIDR(metrics.longTermBankLoans)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{metrics.activeLoans.length} Fasilitas Kredit Aktif</div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-t-lg font-bold text-xs flex items-center justify-between border border-slate-200">
                    <span>I. LIABILITAS JANGKA PENDEK (CURRENT LIABILITIES)</span>
                    <span className="font-mono text-rose-700">{formatIDR(metrics.payablesLiability + metrics.taxLiability)}</span>
                  </div>
                    <table className="w-full text-xs border border-t-0 border-slate-200 border-collapse">
                    <tbody>
                      <tr className="bg-white">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          Utang Usaha &amp; Biaya Jasa Surveyor LVI / Lembaga Uji Terutang
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 border-b border-slate-200 w-48">
                          {formatIDR(metrics.payablesLiability)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          <span className="font-semibold">Utang Pajak PPN 11% (PPN Kurang Bayar Masa Pajak)</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200">
                          {formatIDR(metrics.ppnLiability)}
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          <span className="font-semibold">Utang PPh Pasal 21 (Honor Asesor, Tim Ahli &amp; Karyawan)</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-indigo-700 border-b border-slate-200">
                          {formatIDR(metrics.pph21Liability)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          <span className="font-semibold">Utang PPh Pasal 23 (Jasa Surveyor, Laboratorium &amp; Konsultansi)</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-purple-700 border-b border-slate-200">
                          {formatIDR(metrics.pph23Liability)}
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          <span className="font-semibold">Utang PPh Final Pasal 4(2) &amp; PPh Final UMKM / PPh Badan</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-amber-700 border-b border-slate-200">
                          {formatIDR(metrics.pph42Liability + metrics.pphFinalOrBadanLiability)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-medium">
                        <td className="py-2 px-3 text-slate-900 border-b border-slate-200 pl-8 font-bold">
                          Subtotal Seluruh Liabilitas Hutang Pajak Terhutang
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 border-b border-slate-200">
                          {formatIDR(metrics.taxLiability)}
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                          Beban Akrual Operasional &amp; Gaji Terutang
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-500 border-b border-slate-200">
                          Rp 0
                        </td>
                      </tr>
                      <tr className="bg-rose-100/70 font-bold border-t-2 border-rose-500">
                        <td className="py-2.5 px-3 text-rose-950 uppercase">TOTAL LIABILITAS JANGKA PENDEK</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-950">{formatIDR(metrics.payablesLiability + metrics.taxLiability)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-t-lg font-bold text-xs flex items-center justify-between border border-slate-200">
                    <span>II. LIABILITAS JANGKA PANJANG (LONG-TERM LIABILITIES)</span>
                    <span className="font-mono text-rose-700">{formatIDR(metrics.longTermBankLoans)}</span>
                  </div>
                  <table className="w-full text-xs border border-t-0 border-slate-200 border-collapse">
                    <tbody>
                      {metrics.loansList.length === 0 ? (
                        <tr className="bg-white">
                          <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                            Utang Pokok Pinjaman Bank &amp; Pembiayaan Modal Kerja
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-500 border-b border-slate-200 w-48">
                            Rp 0
                          </td>
                        </tr>
                      ) : (
                        metrics.loansList.map((loan) => (
                          <tr key={loan.id} className="bg-white">
                            <td className="py-2 px-3 text-slate-700 border-b border-slate-200 pl-6">
                              Pinjaman {loan.bankName} (No. Rek: {loan.loanNumber}) - Plafon: {formatIDR(loan.principalAmount)} ({loan.annualInterestRate}% p.a. | {loan.facilityType === 'REVOLVING' ? 'Revolving' : 'Non-Revolving'})
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700 border-b border-slate-200 w-48">
                              {formatIDR(loan.remainingPrincipal ?? loan.principalAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-rose-100/70 font-bold border-t-2 border-rose-500">
                        <td className="py-2.5 px-3 text-rose-950 uppercase">TOTAL LIABILITAS JANGKA PANJANG (POKOK PINJAMAN BANK)</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-950">{formatIDR(metrics.longTermBankLoans)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SUBMENU 3: LAPORAN EKUITAS & MODAL */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <span>3. EKUITAS &amp; STRUKTUR PERMODALAN USAHA (EQUITY STATEMENT)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCapitalModalOpen(true)}
                    className="text-[11px] font-normal lowercase text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>[atur modal]</span>
                  </button>
                  <span className="font-mono text-cyan-400 text-sm">{formatIDR(metrics.totalEquity)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Ekuitas / Modal Bersih</div>
                  <div className="text-base font-bold font-mono text-emerald-600 mt-1">{formatIDR(metrics.totalEquity)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Total Aset - Total Liabilitas</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modal Disetor Penuh</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(metrics.paidInCapital)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Plafon Saham Disetor</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modal Tambahan / Agio</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(metrics.additionalCapital)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Setoran Tambahan Usaha</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Laba / (Rugi) Bersih YTD</div>
                  <div className={`text-base font-bold font-mono mt-1 ${
                    metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>{formatIDR(metrics.netProfit)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Surplus / Defisit Operasional YTD</div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <table className="w-full text-xs border border-slate-200 border-collapse">
                  <tbody>
                    <tr className="bg-slate-50/70 border-b border-slate-200">
                      <td className="py-2.5 px-4 text-slate-600 font-medium">
                        Modal Dasar Perusahaan (Authorized Capital - Maksimal sesuai Akta Notaris)
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-600 w-48">
                        {formatIDR(metrics.authorizedCapital)}
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-slate-200">
                      <td className="py-2.5 px-4 text-slate-800 font-medium pl-6">
                        1. Modal Ditempatkan &amp; Disetor Penuh (Paid-in Capital)
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatIDR(metrics.paidInCapital)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <td className="py-2.5 px-4 text-slate-800 font-medium pl-6">
                        2. Modal Tambahan / Tambahan Modal Disetor (Additional Paid-in Capital)
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatIDR(metrics.additionalCapital)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-bold border-b border-slate-200">
                      <td className="py-2 px-4 text-slate-700 pl-8">
                        Subtotal Modal Disetor &amp; Tambahan Modal
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-slate-800">
                        {formatIDR(metrics.totalPaidAndAdditional)}
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-slate-200">
                      <td className="py-2.5 px-4 text-slate-700 font-medium pl-6">
                        3. Saldo Laba Ditahan Periode Sebelumnya (Retained Earnings)
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700">
                        {formatIDR(metrics.retainedEarningsOpening)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <td className="py-2.5 px-4 text-slate-700 font-medium pl-6">
                        4. Laba / (Rugi) Bersih Periode Berjalan (Current Net Profit YTD)
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-semibold ${
                        metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatIDR(metrics.netProfit)}
                      </td>
                    </tr>
                    <tr className={`font-bold border-t-2 ${
                      metrics.totalEquity >= 0
                        ? 'bg-emerald-100/70 border-emerald-500 text-emerald-950'
                        : 'bg-rose-100/70 border-rose-500 text-rose-950'
                    }`}>
                      <td className="py-3 px-4 uppercase tracking-wider">
                        TOTAL EKUITAS AKHIR PERIODE (TOTAL EQUITY)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        {formatIDR(metrics.totalEquity)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {metrics.capitalNotes && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span><strong>Dasar Hukum / Akta:</strong> {metrics.capitalNotes}</span>
                    <button
                      type="button"
                      onClick={() => setIsCapitalModalOpen(true)}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer shrink-0 ml-2"
                    >
                      Ubah Dokumen Legalitas
                    </button>
                  </div>
                )}

                <div className={`rounded-xl p-4 border shadow-sm ${
                  metrics.isBalanced
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-amber-950 text-amber-100 border-amber-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className={`w-4 h-4 ${metrics.isBalanced ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <h5 className="text-xs font-bold uppercase tracking-wider">
                      Validasi Persamaan Dasar Akuntansi: Aset = Liabilitas + Ekuitas
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Aset (Aktiva)</div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-1">{formatIDR(metrics.totalAssets)}</div>
                    </div>
                    <div className="flex items-center justify-center font-extrabold text-slate-400 text-base">
                      {metrics.isBalanced ? '=' : '≠'}
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Pasiva (Liabilitas + Ekuitas)</div>
                      <div className={`text-xs font-mono font-bold mt-1 ${
                        metrics.isBalanced ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        {formatIDR(metrics.totalPasiva)}
                      </div>
                    </div>
                  </div>
                  {metrics.isBalanced ? (
                    <div className="mt-2 text-center text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Neraca Keuangan Valid &amp; Seimbang (Selisih Rp 0)</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-center text-[11px] text-amber-300 font-semibold flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Neraca Belum Seimbang (Selisih: {formatIDR(metrics.balanceDiff)})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMENU 4: LAPORAN PENDAPATAN OPERASIONAL */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>4. PENDAPATAN OPERASIONAL &amp; KONSULTASI (INCOME STATEMENT)</span>
                </div>
                <span className="font-mono text-emerald-400 text-sm">{formatIDR(metrics.totalIncome)}</span>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Pendapatan Kotor</div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-1">{formatIDR(metrics.totalIncome)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Gross Revenue Periode Ini</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kas Masuk Terealisasi</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(metrics.clearedIncome)}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Cleared Inflows</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding Piutang</div>
                  <div className="text-base font-bold font-mono text-amber-600 mt-1">{formatIDR(metrics.pendingIncome)}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Pending Tagihan Klien</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tingkat Realisasi Kas</div>
                  <div className="text-base font-bold font-mono text-cyan-700 mt-1">
                    {metrics.totalIncome > 0 ? ((metrics.clearedIncome / metrics.totalIncome) * 100).toFixed(1) : 100}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Collection Settlement Rate</div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <table className="w-full text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4 text-left">Kategori Akuntansi Pendapatan</th>
                      <th className="py-2.5 px-4 text-right w-48">Nominal (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.incomeByCategory).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-slate-400 italic">
                          Tidak ada transaksi pendapatan pada periode yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(metrics.incomeByCategory).map(([cat, amount], idx) => {
                        const numAmount = Number(amount) || 0;
                        const pct = metrics.totalIncome > 0 ? (numAmount / metrics.totalIncome) * 100 : 0;
                        return (
                          <tr key={cat} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{getTransactionCategoryLabel(cat)}</span>
                                <span className="text-[11px] text-slate-400 font-mono">Porsi: {pct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200 w-48">
                              {formatIDR(numAmount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    <tr className="bg-emerald-100/80 font-bold border-t-2 border-emerald-500">
                      <td className="py-3 px-4 text-emerald-950 uppercase tracking-wider">
                        TOTAL PENDAPATAN KOTOR (GROSS REVENUE)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 text-sm">
                        {formatIDR(metrics.totalIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SUBMENU 5: LAPORAN RINCIAN BEBAN & BIAYA */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>5. RINCIAN BEBAN &amp; BIAYA PENGELUARAN (EXPENSES STATEMENT)</span>
                </div>
                <span className="font-mono text-rose-400 text-sm">({formatIDR(metrics.totalExpense)})</span>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Seluruh Beban</div>
                  <div className="text-base font-bold font-mono text-rose-600 mt-1">{formatIDR(metrics.totalExpense)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Cleared: {formatIDRShort(metrics.clearedExpense)}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Beban Pokok (HPP)</div>
                  <div className="text-base font-bold font-mono text-amber-600 mt-1">{formatIDR(metrics.directExpenseTotal)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fee Surveyor &amp; Pengujian Lab</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overhead &amp; OPEX</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(metrics.overheadExpenseTotal)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Operasional Kantor &amp; Tim</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Setoran Pajak (PPh/PPN)</div>
                  <div className="text-base font-bold font-mono text-indigo-600 mt-1">{formatIDR(metrics.taxExpense)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Kewajiban Kas Negara</div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <table className="w-full text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4 text-left">Kategori Akuntansi Beban Pengeluaran</th>
                      <th className="py-2.5 px-4 text-right w-48">Nominal (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.expenseByCategory).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-slate-400 italic">
                          Tidak ada transaksi beban pengeluaran pada periode yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(metrics.expenseByCategory).map(([cat, amount], idx) => {
                        const numAmount = Number(amount) || 0;
                        const pct = metrics.totalExpense > 0 ? (numAmount / metrics.totalExpense) * 100 : 0;
                        return (
                          <tr key={cat} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{getTransactionCategoryLabel(cat)}</span>
                                <span className="text-[11px] text-slate-400 font-mono">Porsi: {pct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700 border-b border-slate-200 w-48">
                              ({formatIDR(numAmount)})
                            </td>
                          </tr>
                        );
                      })
                    )}
                    <tr className="bg-rose-100/80 font-bold border-t-2 border-rose-500">
                      <td className="py-3 px-4 text-rose-950 uppercase tracking-wider">
                        TOTAL SELURUH BEBAN PENGELUARAN (TOTAL EXPENSES)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-950 text-sm">
                        ({formatIDR(metrics.totalExpense)})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEKSI 6: KONSOLIDASI LABA RUGI KOMPREHENSIF */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgePercent className="w-4 h-4 text-cyan-400" />
                  <span>6. KONSOLIDASI LABA RUGI KOMPREHENSIF (CONSOLIDATED P&amp;L)</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">{metrics.profitMargin.toFixed(1)}% Net Margin</span>
              </div>
              <div className="p-4 space-y-4">
                <table className="w-full text-xs border border-slate-200 border-collapse">
                  <tbody>
                    <tr className="bg-emerald-50/40 font-semibold">
                      <td className="py-2.5 px-4 text-slate-900">Total Pendapatan Operasional (Gross Revenue)</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800 w-48">{formatIDR(metrics.totalIncome)}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-8 text-slate-700">Dikurangi: Beban Pokok Layanan (HPP / Direct Costs Surveyor &amp; Lab)</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">({formatIDR(metrics.directExpenseTotal)})</td>
                    </tr>
                    <tr className="bg-cyan-50/70 font-bold border-y border-cyan-200">
                      <td className="py-2.5 px-4 text-cyan-950">LABA KOTOR OPERASIONAL (GROSS PROFIT)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-cyan-950">{formatIDR(metrics.grossProfit)} ({metrics.grossMargin.toFixed(1)}%)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-8 text-slate-700">Dikurangi: Beban Operasional Umum &amp; Overhead (OPEX)</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">({formatIDR(metrics.overheadExpenseTotal - metrics.taxExpense - metrics.totalInterestPaidFromTrxs)})</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-8 text-slate-700">Dikurangi: Beban Bunga Pinjaman Bank (Interest Expense)</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">({formatIDR(metrics.totalInterestPaidFromTrxs)})</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-8 text-slate-700">Dikurangi: Beban Pajak Penghasilan &amp; PPN (Tax Expense)</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">({formatIDR(metrics.taxExpense)})</td>
                    </tr>
                    <tr className={`font-black text-sm border-t-2 ${
                      metrics.netProfit >= 0
                        ? 'bg-emerald-100/90 text-emerald-950 border-emerald-600'
                        : 'bg-rose-100/90 text-rose-950 border-rose-600'
                    }`}>
                      <td className="py-3 px-4 uppercase tracking-wider">LABA / (RUGI) BERSIH KOMPREHENSIF (NET INCOME)</td>
                      <td className="py-3 px-4 text-right font-mono">{formatIDR(metrics.netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEKSI 7: MANAJEMEN PINJAMAN BANK */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>7. FASILITAS PINJAMAN BANK, BEBAN BUNGA &amp; SISA POKOK</span>
                </div>
                <span>{metrics.loansList.length} Fasilitas Kredit Terdaftar</span>
              </div>
              <div className="border border-t-0 border-slate-200 rounded-b-lg overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3 text-left">Nama Bank &amp; No. Fasilitas</th>
                      <th className="py-2.5 px-3 text-center">Metode Fasilitas</th>
                      <th className="py-2.5 px-3 text-right">Plafon Pokok Awal</th>
                      <th className="py-2.5 px-3 text-center">Bunga (% p.a.)</th>
                      <th className="py-2.5 px-3 text-center">Tenor</th>
                      <th className="py-2.5 px-3 text-right">Cicilan Pokok / Bln</th>
                      <th className="py-2.5 px-3 text-right">Beban Bunga / Bln</th>
                      <th className="py-2.5 px-3 text-right">Total Angsuran / Bln</th>
                      <th className="py-2.5 px-3 text-right">Sisa Pokok</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {metrics.loansList.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-400 italic font-sans">
                          Tidak ada fasilitas pinjaman bank aktif yang tercatat pada sistem.
                        </td>
                      </tr>
                    ) : (
                      metrics.loansList.map((loan) => {
                        const rem = loan.remainingPrincipal ?? loan.principalAmount;
                        return (
                          <tr key={loan.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-sans">
                              <span className="font-bold text-slate-900 block">{loan.bankName}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{loan.loanNumber}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                loan.facilityType === 'REVOLVING'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-sky-100 text-sky-800 border border-sky-200'
                              }`}>
                                {loan.facilityType === 'REVOLVING' ? 'Revolving (KMK)' : 'Non-Revolving'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-900 font-medium">
                              {formatIDR(loan.principalAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">
                              {loan.annualInterestRate}%
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-sans text-[11px]">
                              {loan.tenureMonths} Bln
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">
                              {formatIDR(loan.monthlyPrincipal)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                              {formatIDR(loan.monthlyInterest)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                              {formatIDR(loan.monthlyInstallment)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-700 font-bold">
                              {formatIDR(rem)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                loan.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : loan.status === 'PAID_OFF'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {loan.status === 'ACTIVE' ? 'Aktif Berjalan' : loan.status === 'PAID_OFF' ? 'Lunas' : 'Default'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {metrics.loansList.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 font-mono text-slate-900">
                        <td colSpan={2} className="py-2.5 px-3 font-sans uppercase">Total Rekapitulasi Pinjaman</td>
                        <td className="py-2.5 px-3 text-right">{formatIDR(metrics.totalLoanFacility)}</td>
                        <td colSpan={2} className="py-2.5 px-3 text-center font-sans text-slate-500 text-[11px]">-</td>
                        <td className="py-2.5 px-3 text-right">{formatIDR(metrics.totalMonthlyPrincipal)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-700">{formatIDR(metrics.totalMonthlyInterest)}</td>
                        <td className="py-2.5 px-3 text-right font-black">{formatIDR(metrics.totalMonthlyPrincipal + metrics.totalMonthlyInterest)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-800 font-black">{formatIDR(metrics.totalRemainingPrincipal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* SEKSI 8: MATRIKS KINERJA FINANSIAL PORTOFOLIO PROYEK */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-emerald-400" />
                  <span>8. MATRIKS KINERJA FINANSIAL PORTOFOLIO PROYEK KONSULTASI</span>
                </div>
                <span>{metrics.projectFinancials.length} Proyek Terdata</span>
              </div>
              <div className="border border-t-0 border-slate-200 rounded-b-lg overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3 text-left">Kode Proyek</th>
                      <th className="py-2.5 px-3 text-left">Klien / Lembaga</th>
                      <th className="py-2.5 px-3 text-right">Nilai Kontrak</th>
                      <th className="py-2.5 px-3 text-right">Pendapatan Masuk</th>
                      <th className="py-2.5 px-3 text-right">Beban Proyek</th>
                      <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                      <th className="py-2.5 px-3 text-center">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {metrics.projectFinancials.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic font-sans">
                          Belum ada data finansial per proyek yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      metrics.projectFinancials.map((pf) => {
                        const margin = pf.totalIncome > 0 ? (pf.netProfit / pf.totalIncome) * 100 : 0;
                        return (
                          <tr
                            key={pf.projectId}
                            onClick={() => onSelectProject && onSelectProject(pf.projectId)}
                            className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 font-bold text-emerald-800">{pf.projectCode}</td>
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 truncate max-w-[160px]">
                              {pf.clientName}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">{formatIDRShort(pf.contractValue)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatIDRShort(pf.totalIncome)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-rose-700">{formatIDRShort(pf.totalExpense)}</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${
                              pf.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'
                            }`}>
                              {formatIDRShort(pf.netProfit)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                margin >= 30
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : margin >= 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold font-mono">
                      <td colSpan={2} className="py-2.5 px-3 uppercase font-sans text-xs">
                        TOTAL REKAPITULASI PROYEK
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatIDR(metrics.projectFinancials.reduce((a, b) => a + b.contractValue, 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">
                        {formatIDR(metrics.totalIncome)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400">
                        {formatIDR(metrics.totalExpense)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-300">
                        {formatIDR(metrics.netProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans text-xs">
                        {metrics.profitMargin.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: LAPORAN POSISI ASET (ASSETS STATEMENT)                            */}
        {/* ========================================================================= */}
        {reportType === 'ASSETS' && (
          <div className="space-y-6">
            {/* Asset Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Harta / Aset</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  {formatIDR(metrics.totalAssets)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Aktiva Lancar + Tetap</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kas & Setara Kas</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {formatIDR(metrics.cashAndBankAsset)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Likuiditas Riil di Rekening</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Piutang Usaha Konsultasi</div>
                <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                  {formatIDR(metrics.receivablesAsset)}
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">Pending Invoice Klien</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aset Tetap & Peralatan</div>
                <div className="text-lg font-bold font-mono text-slate-700 mt-1">
                  {formatIDR(metrics.fixedAssets)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Nilai Buku Inventaris</div>
              </div>
            </div>

            {/* Section 1: Aset Lancar */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>I. ASET LANCAR (CURRENT ASSETS)</span>
                </div>
                <span>Nominal (IDR)</span>
              </div>
              <div className="overflow-x-auto border-x border-b border-slate-200">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4 text-left">A. Saluran Rekening Operasional Bank</th>
                      <th className="py-2.5 px-3 text-center">Mutasi</th>
                      <th className="py-2.5 px-3 text-right">Kas Masuk</th>
                      <th className="py-2.5 px-3 text-right">Kas Keluar</th>
                      <th className="py-2.5 px-3 text-right">Net Arus Kas</th>
                      <th className="py-2.5 px-4 text-right">Saldo Kas Berjalan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.channelSummary.map((ch, idx) => (
                      <tr key={ch.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                          <div className="font-semibold text-slate-900">{ch.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Rek: <strong className="text-slate-700">{ch.accountNumber}</strong> • {ch.accountHolder}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center border-b border-slate-200 font-sans">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {ch.count} Mutasi
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            +{ch.incomeCount} / -{ch.expenseCount}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200">
                          {ch.clearedIncome > 0 ? formatIDR(ch.clearedIncome) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 border-b border-slate-200">
                          {ch.clearedExpense > 0 ? `(${formatIDR(ch.clearedExpense)})` : '-'}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-semibold border-b border-slate-200 ${
                          ch.netCashFlow > 0 ? 'text-emerald-700' : ch.netCashFlow < 0 ? 'text-rose-700' : 'text-slate-500'
                        }`}>
                          {ch.netCashFlow !== 0 ? (ch.netCashFlow > 0 ? `+${formatIDR(ch.netCashFlow)}` : `(${formatIDR(Math.abs(ch.netCashFlow))})`) : 'Rp 0'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 border-b border-slate-200">
                          {ch.balance >= 0 ? formatIDR(ch.balance) : `(${formatIDR(Math.abs(ch.balance))})`}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/70 font-bold border-b-2 border-emerald-500 text-slate-900">
                      <td className="py-2.5 px-4 uppercase text-emerald-950 font-bold">Subtotal Kas &amp; Saluran Bank</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {filteredTransactions.length} Mutasi
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        {formatIDR(metrics.clearedIncome)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-800">
                        ({formatIDR(metrics.clearedExpense)})
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono ${
                        (metrics.clearedIncome - metrics.clearedExpense) >= 0 ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {(metrics.clearedIncome - metrics.clearedExpense) >= 0 
                          ? `+${formatIDR(metrics.clearedIncome - metrics.clearedExpense)}` 
                          : `(${formatIDR(Math.abs(metrics.clearedIncome - metrics.clearedExpense))})`}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-950 text-sm font-extrabold">
                        {formatIDR(metrics.cashAndBankAsset)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <table className="w-full text-xs border-collapse mt-3">
                <tbody>
                  <tr className="bg-slate-100/80 font-bold border-b border-slate-200">
                    <td colSpan={2} className="py-2 px-4 text-slate-800">
                      B. PIUTANG USAHA &amp; AKRUAL KLIEN (ACCOUNTS RECEIVABLE)
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                      Piutang Termin Milestone & Tagihan Invoice Berjalan
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-600 border-b border-slate-200">
                      {formatIDR(metrics.receivablesAsset)}
                    </td>
                  </tr>

                  <tr className="bg-emerald-100/70 font-bold border-t-2 border-emerald-500">
                    <td className="py-3 px-4 text-emerald-950 uppercase tracking-wider">
                      TOTAL ASET LANCAR
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-950 text-sm">
                      {formatIDR(metrics.cashAndBankAsset + metrics.receivablesAsset)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Aset Tidak Lancar */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span>II. ASET TIDAK LANCAR / ASET TETAP (NON-CURRENT ASSETS)</span>
                </div>
                <span>Nominal (IDR)</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {metrics.fixedAssetTrxs && metrics.fixedAssetTrxs.length > 0 ? (
                    metrics.fixedAssetTrxs.map((trx, idx) => (
                      <tr key={trx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <span>{trx.description || getTransactionCategoryLabel(trx.category)}</span>
                            <span className="text-[11px] text-slate-400 font-mono">Tgl: {trx.date} | {trx.clientOrVendorName || 'Inventaris'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 border-b border-slate-200 w-48">
                          {formatIDR(trx.amountIDR)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white">
                      <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                        Peralatan Komputasi, Server & Fasilitas Lab Uji
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 border-b border-slate-200 w-48">
                        {formatIDR(metrics.fixedAssetsGross)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                      Akumulasi Penyusutan Aset Tetap
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-500 border-b border-slate-200">
                      ({formatIDR(metrics.depreciationTotal)})
                    </td>
                  </tr>
                  <tr className="bg-emerald-100/70 font-bold border-t-2 border-emerald-500">
                    <td className="py-3 px-4 text-emerald-950 uppercase tracking-wider">
                      TOTAL ASET TIDAK LANCAR (NET)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-950 text-sm">
                      {formatIDR(metrics.fixedAssets)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Asset Input Helper Guide */}
              <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-4 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Cara Input Data Aset Tetap:</strong>{' '}
                    <span>Catat pengeluaran belanja modal dengan kategori <em>PENGADAAN ASET TETAP & PERALATAN</em> atau <em>PENGADAAN ALAT UJI TEKNIS TKDN</em>.</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalInitialType('EXPENSE');
                    setIsTransactionModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Aset Baru</span>
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-xl border-2 bg-emerald-50 border-emerald-500 text-emerald-950 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wide">
                  TOTAL KESELURUHAN ASET / AKTIVA (TOTAL ASSETS)
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Posisi Aset Lancar + Aset Tetap Resmi Konsultasi GAP.CRM
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold font-mono tracking-tight">
                  {formatIDR(metrics.totalAssets)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LAPORAN LIABILITAS (LIABILITIES STATEMENT)                        */}
        {/* ========================================================================= */}
        {reportType === 'LIABILITIES' && (
          <div className="space-y-6">
            {/* Liability Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Liabilitas / Kewajiban</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                  {formatIDR(metrics.totalLiabilities)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kewajiban Jangka Pendek + Panjang</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Utang Usaha & Jasa Surveyor</div>
                <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                  {formatIDR(metrics.payablesLiability)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pending Biaya Surveyor & Lab</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimasi Utang Pajak PPh/PPN</div>
                <div className="text-lg font-bold font-mono text-rose-600 mt-1">
                  {formatIDR(metrics.taxLiability)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kewajiban Setoran Pajak Masa</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pokok Pinjaman Bank</div>
                <div className="text-lg font-bold font-mono text-rose-700 mt-1">
                  {formatIDR(metrics.longTermBankLoans)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{metrics.activeLoans.length} Fasilitas Kredit Aktif</div>
              </div>
            </div>

            {/* Section 1: Liabilitas Jangka Pendek */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span>I. LIABILITAS JANGKA PENDEK (CURRENT LIABILITIES)</span>
                </div>
                <span>Nominal (IDR)</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                      Utang Usaha & Biaya Jasa Surveyor LVI / Lembaga Uji Terutang
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-600 border-b border-slate-200 w-48">
                      {formatIDR(metrics.payablesLiability)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                      Utang Pajak PPh 23 / PPN 11% Terutang (Tax Payable)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-600 border-b border-slate-200">
                      {formatIDR(metrics.taxLiability)}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                      Beban Akrual Operasional & Gaji Terutang
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-500 border-b border-slate-200">
                      Rp 0
                    </td>
                  </tr>
                  <tr className="bg-rose-100/70 font-bold border-t-2 border-rose-500">
                    <td className="py-3 px-4 text-rose-950 uppercase tracking-wider">
                      TOTAL LIABILITAS JANGKA PENDEK
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-950 text-sm">
                      {formatIDR(metrics.payablesLiability + metrics.taxLiability)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Liabilitas Jangka Panjang */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-rose-400" />
                  <span>II. LIABILITAS JANGKA PANJANG (LONG-TERM LIABILITIES)</span>
                </div>
                <span>Nominal (IDR)</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {metrics.loansList.length === 0 ? (
                    <tr className="bg-white">
                      <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                        Utang Pokok Pinjaman Bank & Pembiayaan Modal Kerja
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-500 border-b border-slate-200 w-48">
                        Rp 0
                      </td>
                    </tr>
                  ) : (
                    metrics.loansList.map((loan) => (
                      <tr key={loan.id} className="bg-white">
                        <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                          Pinjaman {loan.bankName} (No. Rek: {loan.loanNumber}) - Plafon: {formatIDR(loan.principalAmount)} ({loan.annualInterestRate}% p.a.)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700 border-b border-slate-200 w-48">
                          {formatIDR(loan.remainingPrincipal ?? loan.principalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-rose-100/70 font-bold border-t-2 border-rose-500">
                    <td className="py-3 px-4 text-rose-950 uppercase tracking-wider">
                      TOTAL LIABILITAS JANGKA PANJANG (POKOK PINJAMAN BANK)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-950 text-sm">
                      {formatIDR(metrics.longTermBankLoans)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-xl border-2 bg-rose-50 border-rose-400 text-rose-950 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wide">
                  TOTAL KESELURUHAN LIABILITAS / KEWAJIBAN (TOTAL LIABILITIES)
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Rasio Liabilitas terhadap Total Aset: <strong className="font-mono">{metrics.totalAssets > 0 ? ((metrics.totalLiabilities / metrics.totalAssets) * 100).toFixed(1) : 0}%</strong> (Sangat Sehat & Terkendali)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold font-mono tracking-tight text-rose-700">
                  {formatIDR(metrics.totalLiabilities)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2B: LAPORAN MANAJEMEN PINJAMAN BANK (BANK LOANS STATEMENT)          */}
        {/* ========================================================================= */}
        {reportType === 'BANK_LOANS' && (
          <div className="space-y-6">
            {/* Bank Loans Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Plafon Pinjaman</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  {formatIDR(metrics.totalLoanFacility)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{metrics.loansList.length} Fasilitas Pinjaman Terdaftar</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sisa Pokok Pinjaman (Outstanding)</div>
                <div className="text-lg font-bold font-mono text-rose-600 mt-1">
                  {formatIDR(metrics.totalRemainingPrincipal)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kewajiban Pokok di Neraca</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Beban Bunga Bulanan</div>
                <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                  {formatIDR(metrics.totalMonthlyInterest)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Beban Pembiayaan Operasional / Bln</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Angsuran Bulanan</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {formatIDR(metrics.totalMonthlyPrincipal + metrics.totalMonthlyInterest)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Pokok ({formatIDR(metrics.totalMonthlyPrincipal)}) + Bunga</div>
              </div>
            </div>

            {/* Accounting Rule Callout */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-blue-900 uppercase tracking-wide">
                  Formulasi Standar Akuntansi Pemisahan Pokok vs Beban Bunga Pinjaman Bank:
                </div>
                <p className="text-blue-800 leading-relaxed">
                  <strong>1. Pencairan Pinjaman (Disbursement):</strong> Menambah Kas/Bank (Aset) dan menambah Utang Bank (Liabilitas Jangka Panjang).<br />
                  <strong>2. Pembayaran Pokok Pinjaman (Principal Payment):</strong> Mengurangi Kas/Bank dan mengurangi Utang Pokok Pinjaman di Neraca (tidak masuk Laba Rugi).<br />
                  <strong>3. Pembayaran Bunga Pinjaman (Interest Expense):</strong> Dicatat sebagai Beban Keuangan / Bunga Operasional pada Laporan Laba Rugi (P&amp;L).
                </p>
              </div>
            </div>

            {/* Section 1: Daftar Fasilitas Pinjaman Bank */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>DAFTAR FASILITAS PINJAMAN BANK & SKEMA AMORTISASI</span>
                </div>
                <span>{metrics.loansList.length} Fasilitas</span>
              </div>
              <div className="border border-t-0 border-slate-200 rounded-b-lg overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3 text-left">Nama Bank & No. Fasilitas</th>
                      <th className="py-2.5 px-3 text-center">Metode Fasilitas</th>
                      <th className="py-2.5 px-3 text-right">Plafon Pokok Awal</th>
                      <th className="py-2.5 px-3 text-center">Bunga / Thn</th>
                      <th className="py-2.5 px-3 text-center">Tenor</th>
                      <th className="py-2.5 px-3 text-right">Cicilan Pokok / Bln</th>
                      <th className="py-2.5 px-3 text-right">Beban Bunga / Bln</th>
                      <th className="py-2.5 px-3 text-right">Total Angsuran / Bln</th>
                      <th className="py-2.5 px-3 text-right">Sisa Pokok</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {metrics.loansList.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 italic font-sans">
                          Belum ada fasilitas pinjaman bank yang dicatat. Buka menu <strong>Keuangan &amp; Arus Kas &gt; Pinjaman Bank</strong> untuk mendaftarkan fasilitas pinjaman.
                        </td>
                      </tr>
                    ) : (
                      metrics.loansList.map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-bold text-slate-900 block">{loan.bankName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{loan.loanNumber}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              loan.facilityType === 'REVOLVING'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                            }`}>
                              {loan.facilityType === 'REVOLVING' ? 'Revolving (KMK)' : 'Non-Revolving'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 font-medium">
                            {formatIDR(loan.principalAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">
                            {loan.annualInterestRate}%
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-sans text-[11px]">
                            {loan.tenureMonths} Bln
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {formatIDR(loan.monthlyPrincipal)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                            {formatIDR(loan.monthlyInterest)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                            {formatIDR(loan.monthlyInstallment)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-700 font-bold">
                            {formatIDR(loan.remainingPrincipal ?? loan.principalAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              loan.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : loan.status === 'PAID_OFF'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {loan.status === 'ACTIVE' ? 'Aktif' : loan.status === 'PAID_OFF' ? 'Lunas' : 'Default'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {metrics.loansList.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 font-mono text-slate-900">
                        <td colSpan={2} className="py-2.5 px-3 font-sans uppercase">Total Akumulasi</td>
                        <td className="py-2.5 px-3 text-right">{formatIDR(metrics.totalLoanFacility)}</td>
                        <td colSpan={2} className="py-2.5 px-3 text-center font-sans text-slate-500 text-[11px]">-</td>
                        <td className="py-2.5 px-3 text-right">{formatIDR(metrics.totalMonthlyPrincipal)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-700">{formatIDR(metrics.totalMonthlyInterest)}</td>
                        <td className="py-2.5 px-3 text-right font-black">{formatIDR(metrics.totalMonthlyPrincipal + metrics.totalMonthlyInterest)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-800 font-black">{formatIDR(metrics.totalRemainingPrincipal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Section 2: Mutasi Jurnal Pinjaman Bank Periode Ini */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>TRANSAKSI MUTASI PINJAMAN BANK TERKAIT (DISBURSEMENTS &amp; INSTALLMENTS)</span>
                </div>
                <span>
                  {metrics.loanDisbursementTrxs.length + metrics.loanPrincipalTrxs.length + metrics.loanInterestTrxs.length + metrics.loanFeeTrxs.length} Transaksi
                </span>
              </div>
              <div className="border border-t-0 border-slate-200 rounded-b-lg overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3 text-left">No. Transaksi</th>
                      <th className="py-2.5 px-3 text-left">Tanggal</th>
                      <th className="py-2.5 px-3 text-left">Kategori Pembiayaan</th>
                      <th className="py-2.5 px-3 text-left">Keterangan / Referensi</th>
                      <th className="py-2.5 px-3 text-left">Bank / Saluran</th>
                      <th className="py-2.5 px-3 text-right">Pencairan (Inflow)</th>
                      <th className="py-2.5 px-3 text-right">Pembayaran Pokok / Bunga</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {metrics.loanDisbursementTrxs.length === 0 &&
                    metrics.loanPrincipalTrxs.length === 0 &&
                    metrics.loanInterestTrxs.length === 0 &&
                    metrics.loanFeeTrxs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400 italic font-sans">
                          Belum ada transaksi mutasi pinjaman bank (pencairan/pembayaran cicilan) pada filter periode ini.
                        </td>
                      </tr>
                    ) : (
                      [
                        ...metrics.loanDisbursementTrxs,
                        ...metrics.loanPrincipalTrxs,
                        ...metrics.loanInterestTrxs,
                        ...metrics.loanFeeTrxs,
                      ]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-sans font-bold text-slate-800">{t.transactionNumber}</td>
                            <td className="py-2 px-3 text-slate-600">{t.date}</td>
                            <td className="py-2 px-3 font-sans font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                t.category === 'BANK_LOAN_DISBURSEMENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.category === 'BANK_LOAN_PRINCIPAL'
                                  ? 'bg-blue-100 text-blue-800'
                                  : t.category === 'BANK_LOAN_INTEREST'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {getTransactionCategoryLabel(t.category)}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-700 max-w-[220px] truncate">{t.description}</td>
                            <td className="py-2 px-3 font-sans text-slate-600">{getPaymentMethodLabel(t.paymentMethod, paymentChannels)}</td>
                            <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                              {t.type === 'INCOME' ? formatIDR(t.amountIDR) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-rose-700 font-semibold">
                              {t.type === 'EXPENSE' ? formatIDR(t.amountIDR) : '-'}
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'CLEARED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: LAPORAN EKUITAS (EQUITY STATEMENT)                                */}
        {/* ========================================================================= */}
        {reportType === 'EQUITY' && (
          <div className="space-y-6">
            {/* Capital Header Action Banner */}
            <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Struktur Permodalan & Ekuitas Perusahaan
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      Akta Resmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modal Dasar: <span className="text-slate-200 font-mono font-semibold">{formatIDR(metrics.authorizedCapital)}</span> • Modal Disetor: <span className="text-slate-200 font-mono font-semibold">{formatIDR(metrics.paidInCapital)}</span> • Modal Tambahan: <span className="text-slate-200 font-mono font-semibold">{formatIDR(metrics.additionalCapital)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCapitalModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
              >
                <Settings2 className="w-4 h-4" />
                <span>Ubah Modal Dasar & Tambahan</span>
              </button>
            </div>

            {/* Equity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ekuitas / Modal Bersih</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  {formatIDR(metrics.totalEquity)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Total Aset - Total Liabilitas</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modal Disetor Penuh</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {formatIDR(metrics.paidInCapital)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Plafon Modal Saham Disetor</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Modal Tambahan / Agio</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {formatIDR(metrics.additionalCapital)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Setoran Tambahan Modal Usaha</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Laba / (Rugi) Bersih YTD</div>
                <div className={`text-lg font-bold font-mono mt-1 ${
                  metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatIDR(metrics.netProfit)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Surplus / Defisit Operasional YTD</div>
              </div>
            </div>

            {/* Detail Ekuitas */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>RINCIAN STRUKTUR MODAL & PERUBAHAN EKUITAS USAHA</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCapitalModalOpen(true)}
                    className="text-[11px] font-normal lowercase text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>[edit modal]</span>
                  </button>
                  <span>Nominal (IDR)</span>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <td className="py-2.5 px-4 text-slate-600 font-medium">
                      Modal Dasar Perusahaan (Authorized Capital - Maksimal sesuai Akta)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-600 w-48">
                      {formatIDR(metrics.authorizedCapital)}
                    </td>
                  </tr>
                  <tr className="bg-white border-b border-slate-200">
                    <td className="py-2.5 px-4 text-slate-800 font-medium">
                      1. Modal Ditempatkan &amp; Disetor Penuh (Paid-in Capital)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatIDR(metrics.paidInCapital)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <td className="py-2.5 px-4 text-slate-800 font-medium">
                      2. Modal Tambahan / Tambahan Modal Disetor (Additional Paid-in Capital)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatIDR(metrics.additionalCapital)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-b border-slate-200">
                    <td className="py-2 px-4 text-slate-700 pl-6">
                      Subtotal Modal Disetor &amp; Tambahan Modal
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-800">
                      {formatIDR(metrics.totalPaidAndAdditional)}
                    </td>
                  </tr>
                  <tr className="bg-white border-b border-slate-200">
                    <td className="py-2.5 px-4 text-slate-700 font-medium">
                      3. Saldo Laba Ditahan Periode Sebelumnya (Retained Earnings)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700">
                      {formatIDR(metrics.retainedEarningsOpening)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <td className="py-2.5 px-4 text-slate-700 font-medium">
                      4. Laba / (Rugi) Bersih Periode Berjalan (Current Net Profit YTD)
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-semibold ${
                      metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {formatIDR(metrics.netProfit)}
                    </td>
                  </tr>
                  <tr className={`font-bold border-t-2 ${
                    metrics.totalEquity >= 0
                      ? 'bg-emerald-100/70 border-emerald-500 text-emerald-950'
                      : 'bg-rose-100/70 border-rose-500 text-rose-950'
                  }`}>
                    <td className="py-3 px-4 uppercase tracking-wider">
                      TOTAL EKUITAS AKHIR PERIODE (TOTAL EQUITY)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {formatIDR(metrics.totalEquity)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Validasi Persamaan Dasar Akuntansi */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Validasi Persamaan Dasar Akuntansi (Accounting Balance Check)
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Aset (Harta)</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">{formatIDR(metrics.totalAssets)}</div>
                </div>
                <div className="flex items-center justify-center font-extrabold text-slate-400 text-lg">
                  =
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Liabilitas + Ekuitas</div>
                  <div className="text-sm font-mono font-bold text-cyan-400 mt-1">{formatIDR(metrics.totalLiabilities + metrics.totalEquity)}</div>
                </div>
              </div>
              <div className="mt-3 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <CheckCheck className="w-4 h-4" />
                <span>Status Keseimbangan Neraca: SEIMBANG & VALID (Selisih: Rp 0)</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: LAPORAN BEBAN & BIAYA (EXPENSES STATEMENT)                        */}
        {/* ========================================================================= */}
        {reportType === 'EXPENSES' && (
          <div className="space-y-6">
            {/* Expense Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Seluruh Beban</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                  {formatIDR(metrics.totalExpense)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cleared: {formatIDRShort(metrics.clearedExpense)}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Beban Pokok (HPP)</div>
                <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                  {formatIDR(metrics.directExpenseTotal)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fee Surveyor & Pengujian Lab</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overhead & OPEX</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {formatIDR(metrics.overheadExpenseTotal)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Operasional & Administrasi</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Setoran Pajak</div>
                <div className="text-lg font-bold font-mono text-indigo-600 mt-1">
                  {formatIDR(metrics.taxExpense)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">PPh 23 & PPN 11%</div>
              </div>
            </div>

            {/* Expense Table */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>RINCIAN BEBAN BERDASARKAN KATEGORI AKUNTANSI</span>
                </div>
                <span>Nominal & Persentase</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {Object.entries(metrics.expenseByCategory).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-slate-400 italic">
                        Tidak ada transaksi beban pengeluaran pada periode yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(metrics.expenseByCategory).map(([cat, amount], idx) => {
                      const numAmount = Number(amount) || 0;
                      const pct = metrics.totalExpense > 0 ? (numAmount / metrics.totalExpense) * 100 : 0;
                      return (
                        <tr key={cat} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{getTransactionCategoryLabel(cat)}</span>
                              <span className="text-[11px] text-slate-400 font-mono">Porsi: {pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700 border-b border-slate-200 w-48">
                            {formatIDR(numAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-rose-100/80 font-bold border-t-2 border-rose-500">
                    <td className="py-3 px-4 text-rose-950 uppercase tracking-wider">
                      TOTAL SELURUH BEBAN PENGELUARAN (TOTAL EXPENSES)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-950 text-sm">
                      {formatIDR(metrics.totalExpense)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: LAPORAN NERACA LENGKAP (BALANCE SHEET 2-COLUMN VIEW)              */}
        {/* ========================================================================= */}
        {reportType === 'BALANCE_SHEET' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SISI KIRI: ASET (AKTIVA) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>SISI AKTIVA (ASET)</span>
                  </div>
                  <span>Nominal (IDR)</span>
                </div>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={2} className="py-2 px-4 text-slate-800">I. ASET LANCAR</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-6 text-slate-700">Kas & Rekening Operasional Bank</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">{formatIDR(metrics.cashAndBankAsset)}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-4 pl-6 text-slate-700">Piutang Usaha Konsultasi</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-amber-600">{formatIDR(metrics.receivablesAsset)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={2} className="py-2 px-4 text-slate-800">II. ASET TIDAK LANCAR</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-6 text-slate-700">Aset Tetap & Peralatan Komputer</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">{formatIDR(metrics.fixedAssets)}</td>
                    </tr>
                    <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-500">
                      <td className="py-3 px-4 text-emerald-950 uppercase">TOTAL AKTIVA / ASET</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 text-sm">{formatIDR(metrics.totalAssets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SISI KANAN: PASIVA (LIABILITAS & EKUITAS) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span>SISI PASIVA (LIABILITAS & EKUITAS)</span>
                  </div>
                  <span>Nominal (IDR)</span>
                </div>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={2} className="py-2 px-4 text-slate-800">I. LIABILITAS (KEWAJIBAN)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-6 text-slate-700">Utang Usaha & Surveyor Pending</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-rose-600">{formatIDR(metrics.payablesLiability)}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-4 pl-6 text-slate-700">Utang Pajak PPN 11% (Kurang Bayar)</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-emerald-700">{formatIDR(metrics.ppnLiability)}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-6 text-slate-700">Utang Pajak PPh (PPh 21, 23, 4(2), Final)</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-indigo-700">
                        {formatIDR(metrics.pph21Liability + metrics.pph23Liability + metrics.pph42Liability + metrics.pphFinalOrBadanLiability)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-4 pl-6 text-slate-700 font-semibold">Total Seluruh Hutang Pajak Terhutang</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-rose-600">{formatIDR(metrics.taxLiability)}</td>
                    </tr>
                    {metrics.longTermBankLoans > 0 && (
                      <tr className="bg-white">
                        <td className="py-2 px-4 pl-6 text-slate-700">Utang Pokok Pinjaman Bank (Jangka Panjang)</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-rose-600">{formatIDR(metrics.longTermBankLoans)}</td>
                      </tr>
                    )}
                    <tr className="bg-rose-50/70 font-semibold border-b border-slate-200">
                      <td className="py-2 px-4 text-slate-800 pl-6">Subtotal Liabilitas / Kewajiban</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-rose-700">{formatIDR(metrics.totalLiabilities)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="py-2 px-4 text-slate-800 flex items-center justify-between">
                        <span>II. EKUITAS (MODAL)</span>
                        <button
                          type="button"
                          onClick={() => setIsCapitalModalOpen(true)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                        >
                          [atur modal]
                        </button>
                      </td>
                      <td className={`py-2 px-4 text-right font-mono font-bold ${
                        metrics.totalEquity >= 0 ? 'text-slate-900' : 'text-rose-600'
                      }`}>
                        {formatIDR(metrics.totalEquity)}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-6 text-slate-700">1. Modal Ditempatkan &amp; Disetor Penuh</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">{formatIDR(metrics.paidInCapital)}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-4 pl-6 text-slate-700">2. Modal Tambahan / Tambahan Modal Disetor</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">{formatIDR(metrics.additionalCapital)}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-4 pl-6 text-slate-700">3. Saldo Laba Ditahan (Retained Earnings)</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-700">{formatIDR(metrics.retainedEarningsOpening)}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-2 px-4 pl-6 text-slate-700">4. Laba / (Rugi) Bersih Periode Berjalan</td>
                      <td className={`py-2 px-4 text-right font-mono font-semibold ${
                        metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatIDR(metrics.netProfit)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50 font-semibold border-b border-slate-200">
                      <td className="py-2 px-4 text-slate-800 pl-6">Subtotal Ekuitas Akhir</td>
                      <td className={`py-2 px-4 text-right font-mono font-bold ${
                        metrics.totalEquity >= 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}>
                        {formatIDR(metrics.totalEquity)}
                      </td>
                    </tr>
                    <tr className="bg-cyan-50 font-bold border-t-2 border-cyan-500">
                      <td className="py-3 px-4 text-cyan-950 uppercase">TOTAL PASIVA (LIABILITAS + EKUITAS)</td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-950 text-sm">{formatIDR(metrics.totalLiabilities + metrics.totalEquity)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Balance Check */}
            {metrics.isBalanced ? (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/80 flex items-center justify-between text-xs text-emerald-950 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Neraca Keuangan Seimbang (Balanced). Total Aktiva = Total Pasiva = {formatIDR(metrics.totalAssets)}</span>
                </div>
                <span className="font-mono bg-emerald-200/70 text-emerald-900 px-2.5 py-1 rounded">Selisih: Rp 0</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950 font-semibold">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    Neraca Keuangan Belum Seimbang (Unbalanced). Total Aktiva ({formatIDR(metrics.totalAssets)}) ≠ Total Pasiva ({formatIDR(metrics.totalPasiva)})
                  </span>
                </div>
                <span className="font-mono bg-amber-200 text-amber-950 px-2.5 py-1 rounded shrink-0">
                  Selisih: {formatIDR(metrics.balanceDiff)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: LAPORAN LABA RUGI / PENDAPATAN (INCOME STATEMENT)                 */}
        {/* ========================================================================= */}
        {reportType === 'PROFIT_AND_LOSS' && (
          <div className="space-y-6">
            {/* Section 1: Pendapatan Operasional */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span>I. PENDAPATAN OPERASIONAL & KONSULTASI</span>
                <span>Nominal (IDR)</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {Object.entries(metrics.incomeByCategory).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-slate-400 italic">
                        Tidak ada transaksi pendapatan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(metrics.incomeByCategory).map(([cat, amount], idx) => {
                      const numAmount = Number(amount) || 0;
                      const pct = metrics.totalIncome > 0 ? (numAmount / metrics.totalIncome) * 100 : 0;
                      return (
                        <tr key={cat} className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <span>{getTransactionCategoryLabel(cat)}</span>
                              <span className="text-[11px] text-slate-400 font-mono">({pct.toFixed(1)}%)</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 border-b border-slate-200 w-48">
                            {formatIDR(numAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {/* Total Pendapatan Row */}
                  <tr className="bg-emerald-50/80 font-bold border-t-2 border-emerald-500">
                    <td className="py-3 px-4 text-emerald-950 uppercase tracking-wider">
                      TOTAL PENDAPATAN KOTOR (GROSS REVENUE)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-950 text-sm">
                      {formatIDR(metrics.totalIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Beban Operasional */}
            <div>
              <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span>II. BEBAN OPERASIONAL, AUDIT & LEGALITAS</span>
                <span>Nominal (IDR)</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {Object.entries(metrics.expenseByCategory).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-slate-400 italic">
                        Tidak ada transaksi beban pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(metrics.expenseByCategory).map(([cat, amount], idx) => {
                      const numAmount = Number(amount) || 0;
                      const pct = metrics.totalExpense > 0 ? (numAmount / metrics.totalExpense) * 100 : 0;
                      return (
                        <tr key={cat} className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-2.5 px-4 text-slate-700 font-medium border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <span>{getTransactionCategoryLabel(cat)}</span>
                              <span className="text-[11px] text-slate-400 font-mono">({pct.toFixed(1)}%)</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700 border-b border-slate-200 w-48">
                            ({formatIDR(numAmount)})
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {/* Total Beban Row */}
                  <tr className="bg-rose-50/80 font-bold border-t-2 border-rose-500">
                    <td className="py-3 px-4 text-rose-950 uppercase tracking-wider">
                      TOTAL BEBAN OPERASIONAL (TOTAL EXPENSES)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-950 text-sm">
                      ({formatIDR(metrics.totalExpense)})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Laba Bersih Operasional */}
            <div className={`p-4 rounded-xl border-2 ${
              metrics.netProfit >= 0
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-rose-50 border-rose-500 text-rose-950'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-wide">
                    III. LABA / (RUGI) BERSIH OPERASIONAL (NET OPERATING INCOME)
                  </h4>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Net Profit Margin: <span className="font-bold">{metrics.profitMargin.toFixed(2)}%</span> | Realisasi Kas Cleared: {metrics.clearedSettlementRate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold font-mono tracking-tight">
                    {formatIDR(metrics.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LAPORAN ARUS KAS (CASH FLOW STATEMENT)                            */}
        {/* ========================================================================= */}
        {reportType === 'CASH_FLOW' && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-3 px-4 text-left font-bold uppercase tracking-wider">Aktivitas Arus Kas (Direct Method)</th>
                    <th className="py-3 px-4 text-right font-bold uppercase tracking-wider w-48">Jumlah (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Inflows */}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="py-2 px-4 text-slate-800">
                      A. ARUS KAS MASUK DARI OPERASIONAL (CASH INFLOWS)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-slate-700 border-b border-slate-200">
                      Penerimaan Kas dari Klien (Cleared Consulting & Milestone Inflows)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200">
                      {formatIDR(metrics.clearedIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-slate-500 border-b border-slate-200">
                      Pending / Piutang Belum Cair (Unsettled Inflow)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400 border-b border-slate-200">
                      {formatIDR(metrics.pendingIncome)}
                    </td>
                  </tr>

                  {/* Outflows */}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="py-2 px-4 text-slate-800">
                      B. ARUS KAS KELUAR UNTUK OPERASIONAL (CASH OUTFLOWS)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-slate-700 border-b border-slate-200">
                      Pembayaran Kas Operasional, Honor Konsultan, Biaya LVI & Audit (Cleared Outflows)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-700 border-b border-slate-200">
                      ({formatIDR(metrics.clearedExpense)})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-slate-500 border-b border-slate-200">
                      Beban Tertunggak / Pending Settlement
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400 border-b border-slate-200">
                      ({formatIDR(metrics.pendingExpense)})
                    </td>
                  </tr>

                  {/* Net Cash Flow */}
                  <tr className="bg-emerald-50/90 font-bold border-t-2 border-emerald-600 text-sm">
                    <td className="py-3 px-4 text-emerald-950 uppercase">
                      KENAIKAN / (PENURUNAN) KAS BERSIH TEREALISASI
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-950">
                      {formatIDR(metrics.clearedIncome - metrics.clearedExpense)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Breakdown per Akun Pembayaran */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Rekapitulasi Mutasi Berdasarkan Metode / Rekening Pembayaran
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  const channelsList = (paymentChannels && paymentChannels.length > 0)
                    ? paymentChannels
                    : (activePaymentChannels && activePaymentChannels.length > 0 ? activePaymentChannels : []);
                  
                  // Also include any custom/legacy paymentMethod from filteredTransactions not in channelsList
                  const knownIds = new Set(channelsList.map((c) => c.id));
                  const extraMethods: string[] = Array.from(
                    new Set(
                      filteredTransactions
                        .map((t) => t.paymentMethod)
                        .filter((pm): pm is string => Boolean(pm) && !knownIds.has(pm))
                    )
                  );

                  const allDisplayItems = [
                    ...channelsList,
                    ...extraMethods.map((m) => ({
                      id: m,
                      name: getPaymentMethodLabel(m, paymentChannels),
                      accountNumber: '',
                      category: 'OTHER' as const,
                      status: 'ACTIVE' as const,
                    })),
                  ];

                  if (allDisplayItems.length === 0) {
                    return (
                      <div className="col-span-full py-4 text-center text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        Belum ada metode/rekening pembayaran yang terkonfigurasi.
                      </div>
                    );
                  }

                  return allDisplayItems.map((channel) => {
                    const methodTrxs = filteredTransactions.filter((t) => t.paymentMethod === channel.id);
                    const incomeVal = methodTrxs.filter((t) => t.type === 'INCOME').reduce((acc, t) => acc + t.amountIDR, 0);
                    const expenseVal = methodTrxs.filter((t) => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amountIDR, 0);

                    return (
                      <div key={channel.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-slate-800 truncate" title={channel.name}>
                            {channel.name}
                          </div>
                          {channel.accountNumber && (
                            <div className="text-[10px] font-mono text-slate-400 truncate mb-1">
                              {channel.accountNumber}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                            <span>Masuk:</span>
                            <span className="font-mono text-emerald-700 font-semibold">{formatIDRShort(incomeVal)}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>Keluar:</span>
                            <span className="font-mono text-rose-700 font-semibold">{formatIDRShort(expenseVal)}</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-900 border-t border-slate-200 mt-1.5 pt-1 flex justify-between">
                            <span>Net:</span>
                            <span className="font-mono">{formatIDRShort(incomeVal - expenseVal)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: MARGIN & PROFITABILITAS PER PROYEK                                */}
        {/* ========================================================================= */}
        {reportType === 'PROJECT_PROFITABILITY' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-3 px-3 text-left font-bold uppercase tracking-wider">Kode Proyek</th>
                    <th className="py-3 px-3 text-left font-bold uppercase tracking-wider">Klien</th>
                    <th className="py-3 px-3 text-right font-bold uppercase tracking-wider">Nilai Kontrak</th>
                    <th className="py-3 px-3 text-right font-bold uppercase tracking-wider">Pendapatan Masuk</th>
                    <th className="py-3 px-3 text-right font-bold uppercase tracking-wider">Beban Proyek</th>
                    <th className="py-3 px-3 text-right font-bold uppercase tracking-wider">Laba Bersih</th>
                    <th className="py-3 px-3 text-center font-bold uppercase tracking-wider">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.projectFinancials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                        Belum ada data finansial per proyek yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    metrics.projectFinancials.map((pf, idx) => {
                      const margin = pf.totalIncome > 0 ? (pf.netProfit / pf.totalIncome) * 100 : 0;
                      return (
                        <tr
                          key={pf.projectId}
                          onClick={() => onSelectProject && onSelectProject(pf.projectId)}
                          className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 border-b border-slate-200">
                            {pf.projectCode}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 border-b border-slate-200 truncate max-w-[160px]">
                            {pf.clientName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 border-b border-slate-200">
                            {formatIDRShort(pf.contractValue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200">
                            {formatIDRShort(pf.totalIncome)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 border-b border-slate-200">
                            {formatIDRShort(pf.totalExpense)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold border-b border-slate-200 ${
                            pf.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'
                          }`}>
                            {formatIDRShort(pf.netProfit)}
                          </td>
                          <td className="py-2.5 px-3 text-center border-b border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              margin >= 30
                                ? 'bg-emerald-100 text-emerald-800'
                                : margin >= 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={2} className="py-3 px-3 uppercase tracking-wider">
                      TOTAL REKAPITULASI PROYEK
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatIDR(metrics.projectFinancials.reduce((a, b) => a + b.contractValue, 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {formatIDR(metrics.totalIncome)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">
                      {formatIDR(metrics.totalExpense)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-300">
                      {formatIDR(metrics.netProfit)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {metrics.profitMargin.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: BUKU BESAR & JURNAL MUTASI (GENERAL LEDGER)                        */}
        {/* ========================================================================= */}
        {reportType === 'GENERAL_LEDGER' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider">Tanggal</th>
                    <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider">No. Mutasi / Ref</th>
                    <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider">Kategori & Keterangan</th>
                    <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider">Proyek / Pihak</th>
                    <th className="py-2.5 px-3 text-right font-bold uppercase tracking-wider">Debet (Masuk)</th>
                    <th className="py-2.5 px-3 text-right font-bold uppercase tracking-wider">Kredit (Keluar)</th>
                    <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                        Tidak ada catatan transaksi pada filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t, idx) => {
                      return (
                        <tr key={t.id} className={idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                          <td className="py-2.5 px-3 font-mono text-slate-700 border-b border-slate-200 whitespace-nowrap">
                            {t.date}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 border-b border-slate-200">
                            <div>{t.transactionNumber}</div>
                            {t.referenceNumber && (
                              <div className="text-[10px] text-slate-400 font-normal">Ref: {t.referenceNumber}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 border-b border-slate-200">
                            <div className="font-semibold text-slate-900">{getTransactionCategoryLabel(t.category)}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{t.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 border-b border-slate-200">
                            {t.projectCode && (
                              <span className="font-mono font-bold text-emerald-800 mr-1.5">{t.projectCode}</span>
                            )}
                            <span className="text-[11px] text-slate-600">{t.clientOrVendorName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 border-b border-slate-200">
                            {t.type === 'INCOME' ? formatIDR(t.amountIDR) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 border-b border-slate-200">
                            {t.type === 'EXPENSE' ? formatIDR(t.amountIDR) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center border-b border-slate-200">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              t.status === 'CLEARED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={4} className="py-3 px-3 uppercase tracking-wider">
                      TOTAL MUTASI ({filteredTransactions.length} Rekord)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {formatIDR(metrics.totalIncome)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">
                      {formatIDR(metrics.totalExpense)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-300">
                      Net: {formatIDR(metrics.netProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: REKONSILIASI PAJAK & SETTLEMENT                                   */}
        {/* ========================================================================= */}
        {reportType === 'TAX_AND_SETTLEMENT' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pajak Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  Alokasi Pajak (PPh 23, PPN, PPh 21)
                </h4>
                <div className="mt-3 text-2xl font-extrabold font-mono text-slate-900">
                  {formatIDR(metrics.expenseByCategory['TAX_PPH_PPN'] || 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total beban pajak yang disetorkan ke kas negara untuk periode berjalan.
                </p>
              </div>

              {/* Piutang / Pending Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-amber-50/60 border-amber-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Outstanding Piutang (Pending Inflow)
                </h4>
                <div className="mt-3 text-2xl font-extrabold font-mono text-amber-950">
                  {formatIDR(metrics.pendingIncome)}
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Tagihan invoice milestone konsultasi yang menunggu pelunasan dari klien.
                </p>
              </div>
            </div>

            {/* Pending Invoices / Transactions List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Daftar Tagihan & Kewajiban Finansial Menunggu Penyelesaian (Pending / Overdue)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="py-2 px-3 text-left">No. Trx</th>
                      <th className="py-2 px-3 text-left">Jatuh Tempo / Tanggal</th>
                      <th className="py-2 px-3 text-left">Klien / Vendor</th>
                      <th className="py-2 px-3 text-left">Uraian</th>
                      <th className="py-2 px-3 text-right">Nominal (IDR)</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.filter((t) => t.status !== 'CLEARED').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                          Semua mutasi finansial pada filter ini telah berstatus Lunas (Cleared).
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions
                        .filter((t) => t.status !== 'CLEARED')
                        .map((t, idx) => (
                          <tr key={t.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-800">{t.transactionNumber}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{t.date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{t.clientOrVendorName}</td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">{t.description}</td>
                            <td className={`py-2 px-3 text-right font-mono font-bold ${
                              t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {formatIDR(t.amountIDR)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: LAPORAN PIUTANG USAHA & AGING SCHEDULE (ACCOUNTS RECEIVABLE)       */}
        {/* ========================================================================= */}
        {reportType === 'RECEIVABLES_AGING' && (
          <div className="space-y-6">
            {/* Header Title for Print / Screen */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Laporan Piutang Usaha &amp; Analisis Umur Piutang (AR Aging Schedule)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Rekapitulasi tagihan invoice termin milestone, jadwal jatuh tempo, dan status kolektibilitas klien
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-bold">
                  {metrics.receivablesAgingSummary.activeCount} Invoice Aktif
                </span>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Faktur / Tagihan</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">{formatIDR(metrics.receivablesAgingSummary.totalInvoiced)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{filteredReceivables.length} Total Invoice Terbit</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Kas Diterima (Lunas)</div>
                <div className="text-base font-bold font-mono text-emerald-600 mt-1">{formatIDR(metrics.receivablesAgingSummary.totalSettled)}</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">{metrics.receivablesAgingSummary.settlementRate.toFixed(1)}% Terkoleksi</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sisa Piutang Berjalan (AR)</div>
                <div className="text-base font-bold font-mono text-amber-600 mt-1">{formatIDR(metrics.receivablesAgingSummary.totalOutstanding)}</div>
                <div className="text-[10px] text-amber-700 mt-0.5">{metrics.receivablesAgingSummary.activeCount} Invoice Belum Lunas</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kolektibilitas / Pelunasan</div>
                <div className="text-base font-bold font-mono text-indigo-600 mt-1">{metrics.receivablesAgingSummary.settlementRate.toFixed(1)}%</div>
                <div className="text-[10px] text-indigo-700 mt-0.5">Efisiensi Penagihan Termin</div>
              </div>
            </div>

            {/* 4-Bucket Aging Schedule Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 text-slate-800 px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                <span>Distribusi Umur Piutang (Aging Buckets)</span>
                <span className="font-mono text-slate-600 text-[11px]">Berdasarkan Tanggal Jatuh Tempo Invoice</span>
              </div>
              <div className="p-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">0 - 30 Hari (Lancar)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {metrics.receivablesAgingSummary.current0to30.count} inv
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-1.5">
                    {formatIDR(metrics.receivablesAgingSummary.current0to30.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Belum jatuh tempo / jatuh tempo &lt; 30 hr</div>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800">31 - 60 Hari (Perhatian)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {metrics.receivablesAgingSummary.aging31to60.count} inv
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-700 mt-1.5">
                    {formatIDR(metrics.receivablesAgingSummary.aging31to60.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Lewat tempo 1 - 2 bulan</div>
                </div>

                <div className="bg-white border border-orange-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-800">61 - 90 Hari (Kurang Lancar)</span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {metrics.receivablesAgingSummary.aging61to90.count} inv
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono text-orange-700 mt-1.5">
                    {formatIDR(metrics.receivablesAgingSummary.aging61to90.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Perlu follow-up intensif</div>
                </div>

                <div className="bg-white border border-rose-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800">&gt; 90 Hari (Macet / Overdue)</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {metrics.receivablesAgingSummary.agingOver90.count} inv
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono text-rose-700 mt-1.5">
                    {formatIDR(metrics.receivablesAgingSummary.agingOver90.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Eskalasi bagian legal / direksi</div>
                </div>
              </div>
            </div>

            {/* Detailed Receivables List Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Daftar Rincian Invoice &amp; Sisa Piutang Berjalan
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="py-2.5 px-3 text-left">No. Invoice</th>
                      <th className="py-2.5 px-3 text-left">Klien &amp; Proyek</th>
                      <th className="py-2.5 px-3 text-left">Termin / Milestone</th>
                      <th className="py-2.5 px-3 text-left">Jatuh Tempo</th>
                      <th className="py-2.5 px-3 text-right">Nilai Tagihan</th>
                      <th className="py-2.5 px-3 text-right">Terbayar</th>
                      <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!filteredReceivables || filteredReceivables.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                          Tidak ada data piutang / invoice termin pada periode atau filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredReceivables.map((r, idx) => {
                        const remaining = r.remainingAmountIDR !== undefined ? r.remainingAmountIDR : Math.max(0, r.totalAmountIDR - (r.paidAmountIDR || 0));
                        const isOverdue = r.status === 'JATUH_TEMPO' || (r.status !== 'LUNAS' && r.status !== 'BATAL' && new Date(r.dueDate) < new Date());
                        return (
                          <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{r.invoiceNumber}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-900 block">{r.clientName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{r.projectCode || '-'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-medium">{r.milestoneTermin || r.title || 'Termin Pembayaran'}</span>
                              {r.poNumber && <span className="text-[10px] text-slate-400 block">PO: {r.poNumber}</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>{r.dueDate}</span>
                              <span className="text-[10px] text-slate-400 block">Terbit: {r.issueDate}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                              {formatIDR(r.totalAmountIDR)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                              {formatIDR(r.paidAmountIDR || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                              {formatIDR(remaining)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                r.status === 'LUNAS'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : r.status === 'SEBAGIAN'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : r.status === 'JATUH_TEMPO' || isOverdue
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold font-mono">
                      <td colSpan={4} className="py-2.5 px-3 uppercase text-xs font-sans">
                        TOTAL REKAPITULASI PIUTANG USAHA
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatIDR(metrics.receivablesAgingSummary.totalInvoiced)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">
                        {formatIDR(metrics.receivablesAgingSummary.totalSettled)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {formatIDR(metrics.receivablesAgingSummary.totalOutstanding)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs font-sans text-emerald-300">
                        {metrics.receivablesAgingSummary.settlementRate.toFixed(1)}% Lunas
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. AUDITOR NOTES & OPINION (Optional) */}
        {showNotes && (
          <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              Catatan & Keterangan Laporan Keuangan:
            </div>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={2}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 print:border-none print:p-0 print:bg-transparent"
            />
          </div>
        )}

        {/* 7. FORMAL SIGNATURE APPROVAL BLOCK (For PDF / Print Verification) */}
        {showSignatures && (
          <div className="mt-12 pt-8 border-t-2 border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* 1. Preparer (Role: Finance Only) */}
            <div className="text-center p-3.5 rounded-xl border border-transparent hover:border-emerald-200 transition-all bg-emerald-50/20 print:bg-transparent print:border-none print:p-0">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <p className="text-slate-500 font-medium">Dipersiapkan &amp; Diverifikasi Oleh,</p>
                <span className="print:hidden text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Role: Finance
                </span>
              </div>

              {/* Position Title: Screen Interactive Selector */}
              <div className="print:hidden my-1.5 flex flex-col items-center gap-1">
                <select
                  value={preparerPosition}
                  onChange={(e) => setPreparerPosition(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-center focus:outline-hidden focus:ring-1 focus:ring-emerald-500 max-w-[280px]"
                  title="Pilih Nama Jabatan Finance"
                >
                  {FINANCE_POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                {preparerPosition === 'Custom (Kustom Jabatan...)' && (
                  <input
                    type="text"
                    value={customPreparerPosition}
                    onChange={(e) => setCustomPreparerPosition(e.target.value)}
                    placeholder="Tulis jabatan finance..."
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-0.5 text-center focus:outline-hidden w-60"
                  />
                )}
              </div>

              {/* Position Title: Print Output */}
              <p className="hidden print:block font-bold text-slate-800 mt-1">{displayPreparerPosition}</p>

              {/* Official Stamp */}
              <div className="h-16 flex items-center justify-center my-1">
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 uppercase font-bold tracking-wider shadow-2xs">
                  ✓ VERIFIED ON-SYSTEM • FINANCE
                </span>
              </div>

              {/* Signatory Name: Screen Interactive Selector */}
              <div className="print:hidden my-1 flex flex-col items-center gap-1">
                <select
                  value={isCustomPreparer ? 'CUSTOM' : selectedPreparerId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setIsCustomPreparer(true);
                    } else {
                      setIsCustomPreparer(false);
                      setSelectedPreparerId(val);
                      const found = financeEligibleMembers.find((m) => m.id === val);
                      if (found) {
                        setPreparerName(found.name);
                        if (found.roleTitle) {
                          setPreparerPosition(found.roleTitle);
                        }
                      }
                    }
                  }}
                  className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-center focus:outline-hidden max-w-[280px]"
                  title="Pilih Staf Finance Penandatangan"
                >
                  <optgroup label="── Anggota Tim Role Finance ──">
                    {financeEligibleMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roleTitle || 'Finance'})
                      </option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">+ Kustom Nama Personil...</option>
                </select>
                {isCustomPreparer && (
                  <input
                    type="text"
                    value={preparerName}
                    onChange={(e) => setPreparerName(e.target.value)}
                    placeholder="Ketik nama staf finance..."
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-0.5 text-center focus:outline-hidden w-60"
                  />
                )}
              </div>

              {/* Signatory Name: Print Line */}
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-900 text-sm">
                {preparerName}
              </div>
              <div className="text-[11px] text-slate-500">{displayPreparerPosition} • Divisi Keuangan &amp; Akuntansi</div>
            </div>

            {/* 2. Approver (Role: Director Only) */}
            <div className="text-center p-3.5 rounded-xl border border-transparent hover:border-purple-200 transition-all bg-purple-50/20 print:bg-transparent print:border-none print:p-0">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <p className="text-slate-500 font-medium">Disetujui &amp; Disahkan Oleh,</p>
                <span className="print:hidden text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Role: Director
                </span>
              </div>

              {/* Position Title: Screen Interactive Selector */}
              <div className="print:hidden my-1.5 flex flex-col items-center gap-1">
                <select
                  value={approverPosition}
                  onChange={(e) => setApproverPosition(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-center focus:outline-hidden focus:ring-1 focus:ring-purple-500 max-w-[280px]"
                  title="Pilih Nama Jabatan Director"
                >
                  {DIRECTOR_POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                {approverPosition === 'Custom (Kustom Jabatan...)' && (
                  <input
                    type="text"
                    value={customApproverPosition}
                    onChange={(e) => setCustomApproverPosition(e.target.value)}
                    placeholder="Tulis jabatan direktur..."
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-0.5 text-center focus:outline-hidden w-60"
                  />
                )}
              </div>

              {/* Position Title: Print Output */}
              <p className="hidden print:block font-bold text-slate-800 mt-1">{displayApproverPosition}</p>

              {/* Official Stamp */}
              <div className="h-16 flex items-center justify-center my-1">
                <span className="text-[10px] font-mono text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-300 uppercase font-bold tracking-wider shadow-2xs">
                  ✓ GAP.CRM AUTHORIZED • BOARD
                </span>
              </div>

              {/* Signatory Name: Screen Interactive Selector */}
              <div className="print:hidden my-1 flex flex-col items-center gap-1">
                <select
                  value={isCustomApprover ? 'CUSTOM' : selectedApproverId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setIsCustomApprover(true);
                    } else {
                      setIsCustomApprover(false);
                      setSelectedApproverId(val);
                      const found = directorEligibleMembers.find((m) => m.id === val);
                      if (found) {
                        setApproverName(found.name);
                        if (found.roleTitle) {
                          setApproverPosition(found.roleTitle);
                        }
                      }
                    }
                  }}
                  className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-center focus:outline-hidden max-w-[280px]"
                  title="Pilih Direktur Penandatangan"
                >
                  <optgroup label="── Anggota Tim Role Director ──">
                    {directorEligibleMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roleTitle || 'Director'})
                      </option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">+ Kustom Nama Direktur...</option>
                </select>
                {isCustomApprover && (
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="Ketik nama direktur..."
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-0.5 text-center focus:outline-hidden w-60"
                  />
                )}
              </div>

              {/* Signatory Name: Print Line */}
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-900 text-sm">
                {approverName}
              </div>
              <div className="text-[11px] text-slate-500">{displayApproverPosition} • Dewan Direksi</div>
            </div>
          </div>
        )}

        {/* Paper Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>GAP.CRM Financial Suite | Auto-generated Report</span>
          <span>Halaman 1 dari 1</span>
          <span>ID: {documentNumber}</span>
        </div>
      </div>

      {/* Quick Add Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          initialType={modalInitialType}
        />
      )}

      {/* Company Capital (Modal Dasar & Tambahan) Settings Modal */}
      <CompanyCapitalModal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
      />
    </div>
  );
};
