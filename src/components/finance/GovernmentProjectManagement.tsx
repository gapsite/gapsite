import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  X,
  CreditCard,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  Receipt,
  ArrowUpRight,
  ExternalLink,
  SlidersHorizontal,
  Settings,
  Percent,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  GovernmentProject,
  GovMilestone,
  GovernmentInstitutionType,
  GovernmentFundingSource,
  GovernmentPaymentMechanism,
  GovMilestoneStatus,
} from '../../types';
import { formatIDR } from '../../utils/formatters';
import { InstitutionTypeManagerModal } from './InstitutionTypeManagerModal';
import { generateGovMilestoneId } from '../../utils/idGenerator';
import { TermDistributionSchemeManagerModal } from './TermDistributionSchemeManagerModal';

interface GovernmentProjectManagementProps {
  onSelectProject?: (projectId: string) => void;
  onOpenReports?: () => void;
}

export const GovernmentProjectManagement: React.FC<GovernmentProjectManagementProps> = ({
  onSelectProject,
  onOpenReports,
}) => {
  const {
    governmentProjects,
    addGovernmentProject,
    updateGovernmentProject,
    deleteGovernmentProject,
    generateMilestoneInvoiceToReceivables,
    recordGovMilestonePaymentSp2d,
    addGovMilestone,
    updateGovMilestone,
    deleteGovMilestone,
    resetGovernmentProjectsToDefault,
    paymentChannels,
    projects,
    receivables,
    taxObligations,
    institutionTypes,
    activeInstitutionTypes,
    termDistributionSchemes,
    activeTermDistributionSchemes,
    getInstitutionTypeDefinition,
    getTermDistributionScheme,
  } = useProjects();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fundingFilter, setFundingFilter] = useState<string>('ALL');
  const [institutionFilter, setInstitutionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({
    'gov-sample-1': true,
    'gov-sample-2': true,
  });

  // Settings & Configuration Modals state
  const [isInstitutionTypeModalOpen, setIsInstitutionTypeModalOpen] = useState(false);
  const [isTermSchemeModalOpen, setIsTermSchemeModalOpen] = useState(false);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<GovernmentProject | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedMilestoneForInvoice, setSelectedMilestoneForInvoice] = useState<{
    project: GovernmentProject;
    milestone: GovMilestone;
  } | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    bapNumber: '',
    bastNumber: '',
    notes: '',
  });

  const [isSp2dModalOpen, setIsSp2dModalOpen] = useState(false);
  const [selectedMilestoneForSp2d, setSelectedMilestoneForSp2d] = useState<{
    project: GovernmentProject;
    milestone: GovMilestone;
  } | null>(null);
  const [sp2dForm, setSp2dForm] = useState({
    sp2dNumber: '',
    sp2dDisbursementDate: new Date().toISOString().slice(0, 10),
    paymentChannelId: '',
    spmNumber: '',
    ntpnPpn: '',
    bupotPphNumber: '',
    notes: '',
  });

  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [activeProjectIdForMilestone, setActiveProjectIdForMilestone] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    percentage: 20,
    grossAmountIDR: 0,
    pphType: 'PPH_22' as 'PPH_22' | 'PPH_23',
    pphRatePercent: 1.5,
    ppnRatePercent: 11,
    targetDate: new Date().toISOString().slice(0, 10),
    bapNumber: '',
    bastNumber: '',
  });

  // Toggle Project Milestone Accordion
  const toggleProjectExpand = (id: string) => {
    setExpandedProjectIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return governmentProjects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.projectName.toLowerCase().includes(q) ||
        p.governmentAgency.toLowerCase().includes(q) ||
        p.contractNumber.toLowerCase().includes(q) ||
        (p.ppkName && p.ppkName.toLowerCase().includes(q)) ||
        (p.satkerCode && p.satkerCode.toLowerCase().includes(q));

      const matchesFunding = fundingFilter === 'ALL' || p.sourceOfFunds === fundingFilter;
      const matchesInstitution = institutionFilter === 'ALL' || p.institutionType === institutionFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesFunding && matchesInstitution && matchesStatus;
    });
  }, [governmentProjects, searchQuery, fundingFilter, institutionFilter, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalContractValue = 0;
    let totalBilled = 0;
    let totalDisbursedCash = 0;
    let totalOutstanding = 0;
    let totalPphTax = 0;
    let totalPpnWapu = 0;
    let pendingSp2dCount = 0;

    governmentProjects.forEach((p) => {
      totalContractValue += p.totalContractValueIDR || 0;
      totalBilled += p.totalBilledAmountIDR || 0;
      totalDisbursedCash += p.totalReceivedAmountIDR || 0;
      totalOutstanding += p.totalOutstandingAmountIDR || 0;

      (p.milestones || []).forEach((m) => {
        if (m.status === 'SP2D_CAIR') {
          totalPphTax += m.pphAmountIDR || 0;
          totalPpnWapu += m.ppnAmountIDR || 0;
        } else if (m.status === 'INVOICE_TERBIT' || m.status === 'PROSES_SPM_KPPN') {
          pendingSp2dCount += 1;
        }
      });
    });

    return {
      totalContractValue,
      totalBilled,
      totalDisbursedCash,
      totalOutstanding,
      totalPphTax,
      totalPpnWapu,
      pendingSp2dCount,
      projectCount: governmentProjects.length,
    };
  }, [governmentProjects]);

  // Handle Open Invoice Modal
  const handleOpenInvoiceModal = (project: GovernmentProject, milestone: GovMilestone) => {
    setSelectedMilestoneForInvoice({ project, milestone });
    const nowStr = new Date().toISOString().slice(0, 10);
    const dueDateCalc = new Date();
    dueDateCalc.setDate(dueDateCalc.getDate() + 30);

    setInvoiceForm({
      invoiceNumber: milestone.invoiceNumber || `INV/GOV/${project.fiscalYear}/${project.id.slice(-4)}/T${milestone.termNumber}`,
      issueDate: nowStr,
      dueDate: milestone.targetDate || dueDateCalc.toISOString().slice(0, 10),
      bapNumber: milestone.bapNumber || '',
      bastNumber: milestone.bastNumber || '',
      notes: `Tagihan Termin ${milestone.termNumber} (${milestone.title}) - ${project.projectName}`,
    });
    setIsInvoiceModalOpen(true);
  };

  // Submit Invoice
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForInvoice) return;

    const res = generateMilestoneInvoiceToReceivables(
      selectedMilestoneForInvoice.project.id,
      selectedMilestoneForInvoice.milestone.id,
      {
        invoiceNumber: invoiceForm.invoiceNumber,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        bapNumber: invoiceForm.bapNumber,
        bastNumber: invoiceForm.bastNumber,
        notes: invoiceForm.notes,
      }
    );

    if (res.success) {
      alert(res.message || 'Invoice termin berhasil diterbitkan ke Buku Piutang Usaha!');
      setIsInvoiceModalOpen(false);
      setSelectedMilestoneForInvoice(null);
    } else {
      alert(res.message || 'Gagal menerbitkan invoice.');
    }
  };

  // Handle Open SP2D Disbursement Modal
  const handleOpenSp2dModal = (project: GovernmentProject, milestone: GovMilestone) => {
    setSelectedMilestoneForSp2d({ project, milestone });
    const defaultChannel = paymentChannels && paymentChannels.length > 0 ? paymentChannels[0].id : '';

    setSp2dForm({
      sp2dNumber: milestone.sp2dNumber || `SP2D-${Date.now().toString().slice(-6)}`,
      sp2dDisbursementDate: new Date().toISOString().slice(0, 10),
      paymentChannelId: defaultChannel,
      spmNumber: milestone.spmNumber || '',
      ntpnPpn: milestone.ntpnPpn || '',
      bupotPphNumber: milestone.bupotPphNumber || '',
      notes: `Pencairan SP2D Termin ${milestone.termNumber}: ${project.projectName}`,
    });
    setIsSp2dModalOpen(true);
  };

  // Submit SP2D Disbursement
  const handleSubmitSp2d = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForSp2d) return;

    if (!sp2dForm.sp2dNumber.trim()) {
      alert('Mohon isi Nomor SP2D.');
      return;
    }

    const res = recordGovMilestonePaymentSp2d(
      selectedMilestoneForSp2d.project.id,
      selectedMilestoneForSp2d.milestone.id,
      {
        sp2dNumber: sp2dForm.sp2dNumber.trim(),
        sp2dDisbursementDate: sp2dForm.sp2dDisbursementDate,
        paymentChannelId: sp2dForm.paymentChannelId,
        spmNumber: sp2dForm.spmNumber,
        ntpnPpn: sp2dForm.ntpnPpn,
        bupotPphNumber: sp2dForm.bupotPphNumber,
        notes: sp2dForm.notes,
        syncToCashLedger: true,
        syncToTaxObligations: true,
      }
    );

    if (res.success) {
      alert(res.message || 'Pencairan SP2D berhasil dicatat ke Kas, Piutang, dan Pajak!');
      setIsSp2dModalOpen(false);
      setSelectedMilestoneForSp2d(null);
    } else {
      alert(res.message || 'Gagal mencatat pencairan SP2D.');
    }
  };

  // Handle SPM Processed status
  const handleMarkSpmProcess = (project: GovernmentProject, milestone: GovMilestone) => {
    const spmPrompt = window.prompt(
      'Masukkan Nomor Surat Perintah Membayar (SPM) Satker ke KPPN:',
      milestone.spmNumber || `SPM/KEMEN/${project.fiscalYear}/${milestone.termNumber}`
    );
    if (spmPrompt !== null) {
      updateGovMilestone(project.id, milestone.id, {
        status: 'PROSES_SPM_KPPN',
        spmNumber: spmPrompt.trim(),
      });
      alert(`Status Termin ${milestone.termNumber} diubah ke PROSES_SPM_KPPN.`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No SPK',
      'Nama Pengadaan',
      'Instansi / Kementerian',
      'Sumber Dana',
      'Tahun Anggaran',
      'Nilai Kontrak Bruto (IDR)',
      'Total Terbit Invoice (IDR)',
      'Total SP2D Cair Kas (IDR)',
      'Sisa Piutang (IDR)',
      'PPK',
      'Status Kontrak',
    ];

    const rows = governmentProjects.map((p) => [
      `"${p.contractNumber}"`,
      `"${p.projectName}"`,
      `"${p.governmentAgency}"`,
      p.sourceOfFunds,
      p.fiscalYear,
      p.totalContractValueIDR,
      p.totalBilledAmountIDR,
      p.totalReceivedAmountIDR,
      p.totalOutstandingAmountIDR,
      `"${p.ppkName || '-'}"`,
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Proyek_Pemerintah_APBN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Helper
  const getMilestoneStatusBadge = (status: GovMilestoneStatus) => {
    switch (status) {
      case 'BELUM_DITAGIH':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Belum Ditagih
          </span>
        );
      case 'INVOICE_TERBIT':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Invoice Masuk Piutang
          </span>
        );
      case 'PROSES_SPM_KPPN':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Proses SPM KPPN
          </span>
        );
      case 'SP2D_CAIR':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            SP2D Cair (Lunas)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Integration Explanation */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-blue-900/60 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                APBN • APBD • BUMN PROCUREMENT
              </span>
              <span className="text-xs text-slate-400">
                Sistem Pengadaan & Kas Negara Terintegrasi
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Landmark className="w-7 h-7 text-blue-400" />
              <span>Pendapatan Proyek Pemerintah & Realisasi SP2D</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Modul tata kelola kontrak pengadaan pemerintah yang terhubung otomatis 4 arah: 
              <span className="text-blue-300 font-semibold"> Buku Piutang Usaha</span> saat invoice/termin terbit, 
              <span className="text-emerald-300 font-semibold"> Buku Kas & Bank</span> saat SP2D KPPN/Kasda cair, 
              <span className="text-amber-300 font-semibold"> Modul Pajak</span> (PPh 22/23 & PPN WAPU dipungut Satker), dan 
              <span className="text-teal-300 font-semibold"> Laporan Keuangan (Laba Rugi & Neraca)</span> secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsInstitutionTypeModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:border-blue-500/50"
              title="Kelola Master Tipe Instansi (Kementerian, BUMN, Pemda, dll.)"
            >
              <Landmark className="w-4 h-4 text-blue-400" />
              <span>Tipe Instansi ({institutionTypes.length})</span>
            </button>

            <button
              onClick={() => setIsTermSchemeModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:border-indigo-500/50"
              title="Kelola Skema Pembagian Termin (3 Termin, 2 Termin, Custom %)"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Skema Termin ({termDistributionSchemes.length})</span>
            </button>

            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-950/40 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Kontrak Pemerintah Baru</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              title="Export Rekap SP2D & Kontrak ke CSV"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset data proyek pemerintah ke template simulasi standar?')) {
                  resetGovernmentProjectsToDefault();
                }
              }}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset ke Contoh Standar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Kontrak Bruto */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="h-9 flex items-start justify-between gap-1.5 text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">Nilai Kontrak Bruto</span>
              <Landmark className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-slate-900 mt-1">
              {formatIDR(stats.totalContractValue)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
            <span className="font-semibold text-blue-600">{stats.projectCount} Paket Kontrak</span>
          </div>
        </div>

        {/* Card 2: Tagihan Diterbitkan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="h-9 flex items-start justify-between gap-1.5 text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">Tagihan Terbit</span>
              <Receipt className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-indigo-700 mt-1">
              {formatIDR(stats.totalBilled)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
            <span>Masuk ke Piutang Usaha</span>
          </div>
        </div>

        {/* Card 3: SP2D Cair Masuk Kas */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="h-9 flex items-start justify-between gap-1.5 text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">SP2D Cair (Kas Masuk)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-emerald-800 mt-1">
              {formatIDR(stats.totalDisbursedCash)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-1.5">
            <span>Kas Bersih Landing Bank</span>
          </div>
        </div>

        {/* Card 4: Sisa Piutang / Belum Cair */}
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="h-9 flex items-start justify-between gap-1.5 text-amber-800">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">Sisa Piutang SP2D</span>
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-amber-800 mt-1">
              {formatIDR(stats.totalOutstanding)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold mt-1.5">
            <span>{stats.pendingSp2dCount} Termin Mengantri</span>
          </div>
        </div>

        {/* Card 5: Akumulasi Kredit PPh */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="h-9 flex items-start justify-between gap-1.5 text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">Kredit PPh 22/23</span>
              <DollarSign className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-rose-700 mt-1">
              {formatIDR(stats.totalPphTax)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
            <span>Bukti Potong Satker KPPN</span>
          </div>
        </div>

        {/* Card 6: PPN WAPU Dipungut */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="h-9 flex items-start justify-between gap-1.5 text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">PPN WAPU (FP 020)</span>
              <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-teal-700 mt-1">
              {formatIDR(stats.totalPpnWapu)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
            <span>Disetor Satker ke Kas Negara</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama proyek pengadaan, kementerian/dinas, nomor SPK, PPK, atau Satker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sumber Dana */}
          <select
            value={fundingFilter}
            onChange={(e) => setFundingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Semua Sumber Dana</option>
            <option value="APBN">APBN (Kementerian/Lembaga)</option>
            <option value="APBD">APBD (Pemerintah Daerah)</option>
            <option value="BUMN">BUMN / BUMD</option>
          </select>

          {/* Instansi */}
          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Semua Tipe Instansi ({institutionTypes.length})</option>
            {institutionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Aktif</option>
            <option value="SELESAI">Selesai</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada paket proyek pemerintah yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan sesuaikan kata kunci pencarian atau filter sumber dana, atau tambahkan kontrak pengadaan APBN/BUMN baru.
            </p>
            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan Kontrak Pengadaan Baru</span>
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = Boolean(expandedProjectIds[project.id]);
            const realizationPercent =
              project.totalContractValueIDR > 0
                ? Math.min(100, Math.round((project.totalReceivedAmountIDR / project.totalContractValueIDR) * 100))
                : 0;

            const billedPercent =
              project.totalContractValueIDR > 0
                ? Math.min(100, Math.round((project.totalBilledAmountIDR / project.totalContractValueIDR) * 100))
                : 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-150"
              >
                {/* Project Card Header */}
                <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                        {project.sourceOfFunds} TA {project.fiscalYear}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                        {project.institutionType.replace(/_/g, ' ')}
                      </span>
                      {project.status === 'AKTIF' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {project.status}
                        </span>
                      )}
                      {project.satkerCode && (
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          Kode: {project.satkerCode}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {project.projectName}
                      </h3>
                      <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{project.governmentAgency}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-500">SPK No: {project.contractNumber}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        PPK: <strong className="text-slate-700">{project.ppkName || '-'}</strong>
                        {project.ppkNip && <span className="font-mono text-slate-400"> ({project.ppkNip})</span>}
                      </span>
                      <span>
                        Mekanisme: <strong className="text-slate-700">{project.paymentMechanism}</strong>
                      </span>
                      <span>
                        Jadwal: <strong className="text-slate-700">{project.startDate} s/d {project.endDate}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <div className="text-left sm:text-right space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Nilai Kontrak Bruto
                      </div>
                      <div className="text-base sm:text-lg font-black font-mono text-slate-900">
                        {formatIDR(project.totalContractValueIDR)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold font-mono">
                        Cair Kas: {formatIDR(project.totalReceivedAmountIDR)} ({realizationPercent}%)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveProjectIdForMilestone(project.id);
                          const remainingGross = Math.max(0, project.totalContractValueIDR - project.milestones.reduce((acc, m) => acc + m.grossAmountIDR, 0));
                          const remainingPercent = project.totalContractValueIDR > 0 ? Math.round((remainingGross / project.totalContractValueIDR) * 100) : 0;
                          
                          setMilestoneForm({
                            title: `Termin ${project.milestones.length + 1}`,
                            percentage: remainingPercent > 0 ? remainingPercent : 20,
                            grossAmountIDR: remainingGross,
                            pphType: project.institutionType === 'KEMENTERIAN' || project.institutionType === 'LEMBAGA' || project.institutionType === 'DINAS_PEMDA' ? 'PPH_22' : 'PPH_23',
                            pphRatePercent: project.whtRatePph || 1.5,
                            ppnRatePercent: project.vatWapuRate || 11,
                            targetDate: new Date().toISOString().slice(0, 10),
                            bapNumber: '',
                            bastNumber: '',
                          });
                          setIsAddMilestoneModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Tambah Termin Baru"
                      >
                        + Termin
                      </button>

                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsProjectModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kontrak"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus kontrak pengadaan "${project.projectName}"? Semua histori termin akan dihapus.`)) {
                            deleteGovernmentProject(project.id);
                          }
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kontrak"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleProjectExpand(project.id)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title={isExpanded ? 'Sembunyikan Termin' : 'Tampilkan Detail Termin'}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar of Realization */}
                <div className="px-5 py-2 bg-slate-100/70 flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                  <span className="shrink-0 font-bold">Progres Penyerapan:</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${realizationPercent}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`SP2D Cair: ${realizationPercent}%`}
                    />
                    <div
                      style={{ width: `${Math.max(0, billedPercent - realizationPercent)}%` }}
                      className="bg-indigo-400 h-full transition-all"
                      title={`Tagihan Terbit Piutang: ${billedPercent}%`}
                    />
                  </div>
                  <span className="shrink-0 text-emerald-700 font-bold">
                    {realizationPercent}% Cair ({project.milestones.filter((m) => m.status === 'SP2D_CAIR').length}/{project.milestones.length} Termin)
                  </span>
                </div>

                {/* Expanded Milestones Table */}
                {isExpanded && (
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Rincian Termin & Integrasi SP2D Kas Negara
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Total {project.milestones.length} Termin Terjadwal
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-2.5 px-3">Termin #</th>
                            <th className="py-2.5 px-3">Uraian / Deskripsi Termin</th>
                            <th className="py-2.5 px-3 text-right">Nilai Bruto</th>
                            <th className="py-2.5 px-3 text-right">Pot. PPh ({project.institutionType === 'BUMN' ? 'PPh 23' : 'PPh 22'})</th>
                            <th className="py-2.5 px-3 text-right">PPN WAPU (11%)</th>
                            <th className="py-2.5 px-3 text-right font-black text-emerald-800">Kas Bersih (Netto)</th>
                            <th className="py-2.5 px-3 text-center">Status Termin</th>
                            <th className="py-2.5 px-3 text-center">Aksi & Integrasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {project.milestones.map((milestone) => (
                            <tr key={milestone.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                #{milestone.termNumber}
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {milestone.targetDate}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{milestone.title}</div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  {milestone.bapNumber && (
                                    <span className="font-mono bg-slate-100 px-1 rounded">
                                      BAP: {milestone.bapNumber}
                                    </span>
                                  )}
                                  {milestone.bastNumber && (
                                    <span className="font-mono bg-slate-100 px-1 rounded">
                                      BAST: {milestone.bastNumber}
                                    </span>
                                  )}
                                  {milestone.invoiceNumber && (
                                    <span className="font-mono bg-indigo-50 text-indigo-700 px-1 rounded font-bold">
                                      Inv: {milestone.invoiceNumber}
                                    </span>
                                  )}
                                  {milestone.sp2dNumber && (
                                    <span className="font-mono bg-emerald-50 text-emerald-700 px-1 rounded font-bold">
                                      SP2D: {milestone.sp2dNumber}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                                {formatIDR(milestone.grossAmountIDR)}
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-rose-700">
                                -{formatIDR(milestone.pphAmountIDR)}
                                <div className="text-[9px] text-slate-400">
                                  {milestone.pphType} {milestone.pphRatePercent}%
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-teal-700">
                                {formatIDR(milestone.ppnAmountIDR)}
                                <div className="text-[9px] text-slate-400">
                                  {milestone.ntpnPpn ? 'NTPN Terbit' : 'WAPU'}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">
                                {formatIDR(milestone.netDisbursementIDR)}
                              </td>

                              <td className="py-3 px-3 text-center">
                                {getMilestoneStatusBadge(milestone.status)}
                                {milestone.sp2dDisbursementDate && (
                                  <div className="text-[9px] text-emerald-700 font-mono mt-0.5 font-bold">
                                    Cair: {milestone.sp2dDisbursementDate}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {milestone.status === 'BELUM_DITAGIH' && (
                                    <button
                                      onClick={() => handleOpenInvoiceModal(project, milestone)}
                                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                      title="Terbitkan Tagihan & Sinkronkan ke Piutang Usaha"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Terbitkan Invoice</span>
                                    </button>
                                  )}

                                  {milestone.status === 'INVOICE_TERBIT' && (
                                    <>
                                      <button
                                        onClick={() => handleMarkSpmProcess(project, milestone)}
                                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-bold cursor-pointer"
                                        title="Ubah Status ke Proses SPM KPPN"
                                      >
                                        Ajukan SPM
                                      </button>
                                      <button
                                        onClick={() => handleOpenSp2dModal(project, milestone)}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                        title="Catat Pencairan SP2D KPPN ke Kas"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Catat SP2D Cair</span>
                                      </button>
                                    </>
                                  )}

                                  {milestone.status === 'PROSES_SPM_KPPN' && (
                                    <button
                                      onClick={() => handleOpenSp2dModal(project, milestone)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer animate-pulse"
                                      title="Catat Pencairan SP2D KPPN ke Kas"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Catat SP2D Cair</span>
                                    </button>
                                  )}

                                  {milestone.status === 'SP2D_CAIR' && (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Terintegrasi Kas & Pajak</span>
                                    </div>
                                  )}

                                  {/* Delete milestone option */}
                                  {milestone.status !== 'SP2D_CAIR' && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Hapus termin #${milestone.termNumber}?`)) {
                                          deleteGovMilestone(project.id, milestone.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                      title="Hapus Termin"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER / EDIT GOVERNMENT PROJECT CONTRACT */}
      {/* ========================================================================= */}
      {isProjectModalOpen && (
        <GovProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          initialData={editingProject}
          onSave={(data) => {
            if (editingProject) {
              updateGovernmentProject(editingProject.id, data);
            } else {
              addGovernmentProject(data);
            }
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          onOpenInstitutionTypeManager={() => setIsInstitutionTypeModalOpen(true)}
          onOpenTermSchemeManager={() => setIsTermSchemeModalOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: TIPE INSTANSI PEMERINTAH & BUMN (EDITABLE & REAL-TIME SYNC) */}
      {/* ========================================================================= */}
      {isInstitutionTypeModalOpen && (
        <InstitutionTypeManagerModal
          isOpen={isInstitutionTypeModalOpen}
          onClose={() => setIsInstitutionTypeModalOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: SKEMA PEMBAGIAN TERMIN (EDITABLE & REAL-TIME SYNC) */}
      {/* ========================================================================= */}
      {isTermSchemeModalOpen && (
        <TermDistributionSchemeManagerModal
          isOpen={isTermSchemeModalOpen}
          onClose={() => setIsTermSchemeModalOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ISSUE INVOICE TO RECEIVABLES */}
      {/* ========================================================================= */}
      {isInvoiceModalOpen && selectedMilestoneForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Integrasi Buku Piutang Usaha
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  <span>Terbitkan Invoice Tagihan Termin #{selectedMilestoneForInvoice.milestone.termNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-4 text-xs">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-indigo-950 text-sm">
                  {selectedMilestoneForInvoice.project.projectName}
                </div>
                <div className="text-slate-600">
                  Instansi: <strong>{selectedMilestoneForInvoice.project.governmentAgency}</strong>
                </div>
                <div className="text-slate-600">
                  Nilai Bruto Termin: <strong className="font-mono text-indigo-700">{formatIDR(selectedMilestoneForInvoice.milestone.grossAmountIDR)}</strong>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
                  Invoice ini akan otomatis tercatat pada <strong>Piutang Usaha</strong> dan siap ditagihkan ke Satker/KPPN.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Invoice Tagihan *</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Terbit *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.issueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor BAP (Berita Acara Pembayaran)</label>
                  <input
                    type="text"
                    placeholder="e.g. BAP/02/KEMENPERIN/2026"
                    value={invoiceForm.bapNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, bapNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor BAST (Serah Terima Pekerjaan)</label>
                  <input
                    type="text"
                    placeholder="e.g. BAST/02/KEMENPERIN/2026"
                    value={invoiceForm.bastNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, bastNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Jatuh Tempo Pembayaran</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Catatan & Keterangan</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Terbitkan & Masuk ke Piutang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD SP2D DISBURSEMENT (CASH & TAX RECONCILIATION) */}
      {/* ========================================================================= */}
      {isSp2dModalOpen && selectedMilestoneForSp2d && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  Sinkronisasi Kas Negara (SP2D Cair)
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Catat Pencairan SP2D Termin #{selectedMilestoneForSp2d.milestone.termNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsSp2dModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSp2d} className="p-6 space-y-4 text-xs">
              {/* Financial Summary Box */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-slate-300 text-xs">
                  <span>Bruto Tagihan Termin:</span>
                  <span className="font-mono font-bold text-white">
                    {formatIDR(selectedMilestoneForSp2d.milestone.grossAmountIDR)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-300 text-xs border-t border-slate-800 pt-1.5">
                  <span>
                    Potongan PPh {selectedMilestoneForSp2d.milestone.pphType} ({selectedMilestoneForSp2d.milestone.pphRatePercent}%):
                  </span>
                  <span className="font-mono font-bold">
                    -{formatIDR(selectedMilestoneForSp2d.milestone.pphAmountIDR)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-teal-300 text-xs border-t border-slate-800 pt-1.5">
                  <span>
                    PPN WAPU (11% - Dipungut Kasda/KPPN):
                  </span>
                  <span className="font-mono font-bold">
                    {formatIDR(selectedMilestoneForSp2d.milestone.ppnAmountIDR)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-300 font-bold text-sm border-t border-slate-700 pt-2">
                  <span>Uang Masuk Rekening Kas Bersih:</span>
                  <span className="font-mono text-base text-emerald-400">
                    {formatIDR(selectedMilestoneForSp2d.milestone.netDisbursementIDR)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor SP2D KPPN / Kasda *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 26019280100412"
                    value={sp2dForm.sp2dNumber}
                    onChange={(e) => setSp2dForm({ ...sp2dForm, sp2dNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Dana Masuk (Cair) *</label>
                  <input
                    type="date"
                    required
                    value={sp2dForm.sp2dDisbursementDate}
                    onChange={(e) => setSp2dForm({ ...sp2dForm, sp2dDisbursementDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rekening Kas & Bank Penampung Dana *</label>
                <select
                  required
                  value={sp2dForm.paymentChannelId}
                  onChange={(e) => setSp2dForm({ ...sp2dForm, paymentChannelId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- Pilih Rekening Bank Perusahaan --</option>
                  {paymentChannels && paymentChannels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.accountNumber || '-'}) - {ch.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Bukti Potong PPh (e-Bupot)</label>
                  <input
                    type="text"
                    placeholder="e.g. BUPOT-26-02-00419"
                    value={sp2dForm.bupotPphNumber}
                    onChange={(e) => setSp2dForm({ ...sp2dForm, bupotPphNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NTPN Setoran PPN WAPU</label>
                  <input
                    type="text"
                    placeholder="e.g. 782910AKB812"
                    value={sp2dForm.ntpnPpn}
                    onChange={(e) => setSp2dForm({ ...sp2dForm, ntpnPpn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nomor SPM Satker</label>
                <input
                  type="text"
                  placeholder="e.g. SPM/001/412981/2026"
                  value={sp2dForm.spmNumber}
                  onChange={(e) => setSp2dForm({ ...sp2dForm, spmNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Catatan Penerimaan</label>
                <textarea
                  rows={2}
                  value={sp2dForm.notes}
                  onChange={(e) => setSp2dForm({ ...sp2dForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSp2dModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bukukan ke Kas, Piutang & Pajak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD SINGLE MILESTONE TO AN EXISTING PROJECT */}
      {/* ========================================================================= */}
      {isAddMilestoneModalOpen && activeProjectIdForMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Tambah Termin Pengadaan</span>
              </h3>
              <button
                onClick={() => setIsAddMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addGovMilestone(activeProjectIdForMilestone, {
                  termNumber: 1, // auto assigned
                  title: milestoneForm.title,
                  percentage: Number(milestoneForm.percentage) || 0,
                  grossAmountIDR: Number(milestoneForm.grossAmountIDR) || 0,
                  pphType: milestoneForm.pphType,
                  pphRatePercent: Number(milestoneForm.pphRatePercent) || 1.5,
                  pphAmountIDR: 0,
                  ppnRatePercent: Number(milestoneForm.ppnRatePercent) || 11,
                  ppnAmountIDR: 0,
                  netDisbursementIDR: 0,
                  status: 'BELUM_DITAGIH',
                  targetDate: milestoneForm.targetDate,
                  bapNumber: milestoneForm.bapNumber,
                  bastNumber: milestoneForm.bastNumber,
                });
                setIsAddMilestoneModalOpen(false);
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama / Uraian Termin *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Termin II - Laporan Antara & BAP 50%"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nominal Bruto (IDR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={milestoneForm.grossAmountIDR || ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, grossAmountIDR: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Bobot Persentase (%)</label>
                  <input
                    type="number"
                    value={milestoneForm.percentage || ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tarif PPh (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={milestoneForm.pphRatePercent}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, pphRatePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Tanggal</label>
                  <input
                    type="date"
                    value={milestoneForm.targetDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Termin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SUB-COMPONENT: GOV PROJECT REGISTRATION & EDIT MODAL
// =============================================================================

interface GovProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: GovernmentProject | null;
  onSave: (data: Omit<GovernmentProject, 'id' | 'createdAt' | 'createdBy' | 'totalBilledAmountIDR' | 'totalReceivedAmountIDR' | 'totalOutstandingAmountIDR'>) => void;
  onOpenInstitutionTypeManager?: () => void;
  onOpenTermSchemeManager?: () => void;
}

const GovProjectModal: React.FC<GovProjectModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  onOpenInstitutionTypeManager,
  onOpenTermSchemeManager,
}) => {
  const {
    activeInstitutionTypes,
    activeTermDistributionSchemes,
    getInstitutionTypeDefinition,
    getTermDistributionScheme,
  } = useProjects();

  const [formData, setFormData] = useState({
    contractNumber: initialData?.contractNumber || '',
    projectName: initialData?.projectName || '',
    institutionType: (initialData?.institutionType || (activeInstitutionTypes[0]?.id || 'KEMENTERIAN')) as GovernmentInstitutionType,
    governmentAgency: initialData?.governmentAgency || '',
    satkerCode: initialData?.satkerCode || '',
    fiscalYear: initialData?.fiscalYear || 2026,
    sourceOfFunds: (initialData?.sourceOfFunds || (activeInstitutionTypes[0]?.defaultFundingSource || 'APBN')) as GovernmentFundingSource,
    ppkName: initialData?.ppkName || '',
    ppkNip: initialData?.ppkNip || '',
    treasurerName: initialData?.treasurerName || '',
    agencyAddress: initialData?.agencyAddress || '',
    totalContractValueIDR: initialData?.totalContractValueIDR || 0,
    paymentMechanism: (initialData?.paymentMechanism || 'TERMIN') as GovernmentPaymentMechanism,
    whtRatePph: initialData?.whtRatePph ?? (activeInstitutionTypes[0]?.defaultPphRate ?? 1.5),
    vatWapuRate: initialData?.vatWapuRate ?? (activeInstitutionTypes[0]?.defaultPpnRate ?? 11),
    startDate: initialData?.startDate || new Date().toISOString().slice(0, 10),
    endDate: initialData?.endDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    status: (initialData?.status || 'AKTIF') as 'AKTIF' | 'SELESAI' | 'BATAL' | 'DRAFT',
    notes: initialData?.notes || '',
  });

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(() => {
    return activeTermDistributionSchemes[0]?.id || 'SCHEME_3_TERMIN_20_40_40';
  });

  const handleInstitutionTypeChange = (newTypeId: string) => {
    const def = getInstitutionTypeDefinition(newTypeId);
    setFormData((prev) => ({
      ...prev,
      institutionType: newTypeId as GovernmentInstitutionType,
      sourceOfFunds: (def?.defaultFundingSource || prev.sourceOfFunds) as GovernmentFundingSource,
      whtRatePph: def?.defaultPphRate ?? prev.whtRatePph,
      vatWapuRate: def?.defaultPpnRate ?? prev.vatWapuRate,
    }));
  };

  const selectedInstitutionDef = useMemo(() => {
    return getInstitutionTypeDefinition(formData.institutionType);
  }, [formData.institutionType, getInstitutionTypeDefinition]);

  const selectedScheme = useMemo(() => {
    return getTermDistributionScheme(selectedSchemeId) || activeTermDistributionSchemes[0];
  }, [selectedSchemeId, activeTermDistributionSchemes, getTermDistributionScheme]);

  // Formulated live milestone breakdown calculation
  const calculatedTermBreakdown = useMemo(() => {
    if (!selectedScheme || !selectedScheme.terms || formData.totalContractValueIDR <= 0) {
      return [];
    }

    const total = formData.totalContractValueIDR;
    const terms = selectedScheme.terms;
    let allocatedGross = 0;

    return terms.map((t, idx) => {
      const isLast = idx === terms.length - 1;
      const gross = isLast ? Math.max(0, total - allocatedGross) : Math.round((total * t.percentage) / 100);
      allocatedGross += gross;

      const pphRate = Number(formData.whtRatePph) || 0;
      const pphAmount = Math.round((gross * pphRate) / 100);
      const ppnRate = Number(formData.vatWapuRate) || 0;
      const ppnAmount = Math.round((gross * ppnRate) / 100);
      const netDisbursement = Math.round(gross - pphAmount);

      return {
        termNumber: t.termNumber || idx + 1,
        title: t.title,
        percentage: t.percentage,
        gross,
        pphAmount,
        ppnAmount,
        netDisbursement,
      };
    });
  }, [selectedScheme, formData.totalContractValueIDR, formData.whtRatePph, formData.vatWapuRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName.trim() || !formData.contractNumber.trim() || !formData.governmentAgency.trim()) {
      alert('Mohon lengkapi Nama Proyek, Nomor SPK, dan Nama Instansi.');
      return;
    }

    if (formData.totalContractValueIDR <= 0) {
      alert('Nilai Kontrak Bruto harus lebih besar dari Rp 0.');
      return;
    }

    let milestones: GovMilestone[] = [];

    if (initialData?.milestones && initialData.milestones.length > 0) {
      milestones = initialData.milestones;
    } else {
      const terms = selectedScheme?.terms || [
        { termNumber: 1, title: 'Termin I - Uang Muka', percentage: 20 },
        { termNumber: 2, title: 'Termin II - Pelaksanaan', percentage: 40 },
        { termNumber: 3, title: 'Termin III - BAST 100%', percentage: 40 },
      ];
      const total = formData.totalContractValueIDR;
      let allocatedGross = 0;

      const start = new Date(formData.startDate).getTime();
      const end = new Date(formData.endDate).getTime();
      const duration = Math.max(1, end - start);

      milestones = terms.map((t, idx) => {
        const isLast = idx === terms.length - 1;
        const gross = isLast ? Math.max(0, total - allocatedGross) : Math.round((total * t.percentage) / 100);
        allocatedGross += gross;

        const pphRate = Number(formData.whtRatePph) || 0;
        const pphType = selectedInstitutionDef?.defaultPphType || (formData.institutionType === 'BUMN' ? 'PPH_23' : 'PPH_22');
        const pphAmount = Math.round((gross * pphRate) / 100);
        const ppnRate = Number(formData.vatWapuRate) || 0;
        const ppnAmount = Math.round((gross * ppnRate) / 100);
        const net = Math.round(gross - pphAmount);

        let targetDate = formData.endDate;
        if (terms.length === 1) {
          targetDate = formData.endDate;
        } else if (idx === 0) {
          targetDate = formData.startDate;
        } else if (isLast) {
          targetDate = formData.endDate;
        } else {
          const stepRatio = (idx + 1) / terms.length;
          targetDate = new Date(start + duration * stepRatio).toISOString().slice(0, 10);
        }

        return {
          id: generateGovMilestoneId('gov', idx + 1),
          projectId: '',
          termNumber: t.termNumber || idx + 1,
          title: t.title,
          percentage: t.percentage,
          grossAmountIDR: gross,
          pphType,
          pphRatePercent: pphRate,
          pphAmountIDR: pphAmount,
          ppnRatePercent: ppnRate,
          ppnAmountIDR: ppnAmount,
          netDisbursementIDR: net,
          status: 'BELUM_DITAGIH' as GovMilestoneStatus,
          targetDate,
          notes: t.description || '',
          createdAt: new Date().toISOString(),
        };
      });
    }

    onSave({
      ...formData,
      milestones,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
              Formulir Kontrak Pengadaan
            </span>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Landmark className="w-5 h-5 text-blue-400" />
              <span>{initialData ? 'Edit Kontrak Proyek Pemerintah' : 'Daftarkan Kontrak APBN / BUMN Baru'}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Nama Paket Pengadaan / Konsultansi *</label>
            <input
              type="text"
              required
              placeholder="e.g. Fasilitasi Sertifikasi & Verifikasi TKDN Industri Elektronika TA 2026"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nomor SPK / Kontrak Dinas *</label>
              <input
                type="text"
                required
                placeholder="e.g. 027/SPK-TKDN/KEMENPERIN/2026"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Instansi / Kementerian / Satker *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kementerian Perindustrian RI (Ditjen ILMATE)"
                value={formData.governmentAgency}
                onChange={(e) => setFormData({ ...formData, governmentAgency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Sumber Dana</label>
              <select
                value={formData.sourceOfFunds}
                onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="APBN">APBN (KPPN)</option>
                <option value="APBD">APBD (Kasda)</option>
                <option value="BUMN">BUMN / BUMD</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Tipe Instansi *</label>
                {onOpenInstitutionTypeManager && (
                  <button
                    type="button"
                    onClick={onOpenInstitutionTypeManager}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Tambah / Ubah Tipe Instansi"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Kelola ({activeInstitutionTypes.length})</span>
                  </button>
                )}
              </div>
              <select
                value={formData.institutionType}
                onChange={(e) => handleInstitutionTypeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {activeInstitutionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.defaultFundingSource} • {t.defaultPphType.replace('_', ' ')} {t.defaultPphRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tahun Anggaran</label>
              <input
                type="number"
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
              />
            </div>
          </div>

          {selectedInstitutionDef && (
            <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl leading-relaxed flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-800">{selectedInstitutionDef.name}</span>: {selectedInstitutionDef.description || 'Instansi pengadaan pemerintah terdaftar.'}
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Default: {selectedInstitutionDef.defaultFundingSource} • {selectedInstitutionDef.defaultPphType.replace('_', ' ')} ({selectedInstitutionDef.defaultPphRate}%) • PPN WAPU ({selectedInstitutionDef.defaultPpnRate}%)
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nilai Kontrak Bruto (IDR) *</label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 750000000"
                value={formData.totalContractValueIDR || ''}
                onChange={(e) => setFormData({ ...formData, totalContractValueIDR: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-blue-700"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tarif Pot. PPh (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.whtRatePph}
                onChange={(e) => setFormData({ ...formData, whtRatePph: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tarif PPN WAPU (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.vatWapuRate}
                onChange={(e) => setFormData({ ...formData, vatWapuRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nama Pejabat Pembuat Komitmen (PPK)</label>
              <input
                type="text"
                placeholder="e.g. Dr. Ir. Hendra Wicaksono, M.Si"
                value={formData.ppkName}
                onChange={(e) => setFormData({ ...formData, ppkName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">NIP PPK</label>
              <input
                type="text"
                placeholder="e.g. 197805122003121002"
                value={formData.ppkNip}
                onChange={(e) => setFormData({ ...formData, ppkNip: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tanggal Mulai SPK</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tanggal Akhir Pelaksanaan (Deadline BAST)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {!initialData && (
            <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-blue-950 text-xs">Skema Pembagian Termin Otomatis</span>
                </div>
                {onOpenTermSchemeManager && (
                  <button
                    type="button"
                    onClick={onOpenTermSchemeManager}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Tambah / Ubah Skema Pembagian Termin"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Kelola Skema ({activeTermDistributionSchemes.length})</span>
                  </button>
                )}
              </div>

              <select
                value={selectedSchemeId}
                onChange={(e) => setSelectedSchemeId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-hidden focus:border-blue-500"
              >
                {activeTermDistributionSchemes.map((scheme) => (
                  <option key={scheme.id} value={scheme.id}>
                    {scheme.name} — {scheme.termCount} Termin ({scheme.terms.map((t) => `${t.percentage}%`).join(' • ')})
                  </option>
                ))}
              </select>

              {/* Real-time Calculation Breakdown Preview */}
              {calculatedTermBreakdown.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Simulasi Formulasi Termin Kontrak</span>
                    <span className="text-blue-700 font-mono">
                      Total: {formatIDR(formData.totalContractValueIDR)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {calculatedTermBreakdown.map((item) => (
                      <div
                        key={item.termNumber}
                        className="bg-white/95 border border-blue-100 rounded-xl p-2.5 text-[11px] shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 truncate">{item.title}</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[10px]">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Bruto:</span>
                          <span className="font-mono font-semibold text-slate-800">{formatIDR(item.gross)}</span>
                        </div>
                        <div className="flex justify-between text-amber-700">
                          <span>Pot. PPh ({formData.whtRatePph}%):</span>
                          <span className="font-mono font-medium">-{formatIDR(item.pphAmount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-100 pt-1">
                          <span>Kas Bersih SP2D:</span>
                          <span className="font-mono">{formatIDR(item.netDisbursement)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Catatan Khusus Kontrak</label>
            <textarea
              rows={2}
              placeholder="Catatan penyerapan anggaran Kemenkeu, mekanisme Bank Garansi, atau instruksi KPA..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Simpan Kontrak
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
