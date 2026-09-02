import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  User,
  Mail,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  Wallet,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import {
  Receivable,
  ReceivableCategory,
  ReceivableStatus,
} from '../../types';
import {
  RECEIVABLE_CATEGORIES,
  generateNextInvoiceNumber,
} from '../../utils/receivableCalculations';
import { formatIDR } from '../../utils/formatters';

interface ReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReceivable?: Receivable | null;
}

export const ReceivableModal: React.FC<ReceivableModalProps> = ({
  isOpen,
  onClose,
  editingReceivable,
}) => {
  const {
    projects,
    receivables,
    activePaymentChannels,
    addReceivable,
    updateReceivable,
    currentUser,
  } = useProjects();

  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ReceivableCategory>('TERMIN_KONSULTASI_TKDN');
  const [clientName, setClientName] = useState<string>('');
  const [clientContactPerson, setClientContactPerson] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [milestoneTitle, setMilestoneTitle] = useState<string>('Termin 1 (Uang Muka 30%)');
  const [totalAmountIDR, setTotalAmountIDR] = useState<number>(0);
  const [taxIncluded, setTaxIncluded] = useState<boolean>(false);
  const [taxAmountIDR, setTaxAmountIDR] = useState<number>(0);
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Initial payment during creation (for new receivables only)
  const [hasInitialPayment, setHasInitialPayment] = useState<boolean>(false);
  const [initialPaidAmountIDR, setInitialPaidAmountIDR] = useState<number>(0);
  const [paymentChannelId, setPaymentChannelId] = useState<string>('BANK_TRANSFER_BRI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notesPayment, setNotesPayment] = useState<string>('');
  const [syncToCashLedger, setSyncToCashLedger] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto calculate due date when issueDate or paymentTermsDays change
  useEffect(() => {
    if (issueDate && paymentTermsDays >= 0) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + Number(paymentTermsDays));
      setDueDate(d.toISOString().slice(0, 10));
    }
  }, [issueDate, paymentTermsDays]);

  // Handle initial data or editing state
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (editingReceivable) {
        setInvoiceNumber(editingReceivable.invoiceNumber);
        setTitle(editingReceivable.title);
        setCategory(editingReceivable.category);
        setClientName(editingReceivable.clientName);
        setClientContactPerson(editingReceivable.clientContactPerson || '');
        setClientEmail(editingReceivable.clientEmail || '');
        setClientPhone(editingReceivable.clientPhone || '');
        setClientAddress(editingReceivable.clientAddress || '');
        setSelectedProjectId(editingReceivable.projectId || '');
        setMilestoneTitle(editingReceivable.milestoneTitle || '');
        setTotalAmountIDR(editingReceivable.totalAmountIDR || 0);
        setTaxIncluded(editingReceivable.taxIncluded || false);
        setTaxAmountIDR(editingReceivable.taxAmountIDR || 0);
        setIssueDate(editingReceivable.issueDate || new Date().toISOString().slice(0, 10));
        setPaymentTermsDays(editingReceivable.paymentTermsDays || 30);
        setDueDate(editingReceivable.dueDate || '');
        setNotes(editingReceivable.notes || '');
        setHasInitialPayment(false);
        setInitialPaidAmountIDR(0);
      } else {
        // New Receivable
        const autoInv = generateNextInvoiceNumber(receivables);
        setInvoiceNumber(autoInv);
        setTitle('');
        setCategory('TERMIN_KONSULTASI_TKDN');
        setClientName('');
        setClientContactPerson('');
        setClientEmail('');
        setClientPhone('');
        setClientAddress('');
        setSelectedProjectId('');
        setMilestoneTitle('Termin 1 (Uang Muka 30%)');
        setTotalAmountIDR(0);
        setTaxIncluded(false);
        setTaxAmountIDR(0);
        const todayStr = new Date().toISOString().slice(0, 10);
        setIssueDate(todayStr);
        setPaymentTermsDays(30);
        const dueD = new Date();
        dueD.setDate(dueD.getDate() + 30);
        setDueDate(dueD.toISOString().slice(0, 10));
        setNotes('');
        setHasInitialPayment(false);
        setInitialPaidAmountIDR(0);
        setPaymentChannelId(activePaymentChannels[0]?.id || 'BANK_TRANSFER_BRI');
        setReferenceNumber('');
        setNotesPayment('');
        setSyncToCashLedger(true);
      }
    }
  }, [isOpen, editingReceivable, receivables, activePaymentChannels]);

  // When project changes, auto fill client name
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;
    const proj = projects.find((p) => p.id === projId);
    if (proj) {
      setClientName(proj.clientName || '');
      setTitle(`Termin Konsultasi TKDN - ${proj.title || proj.name}`);
      if (proj.contractValueIDR && totalAmountIDR === 0) {
        // Suggest 30% DP
        setTotalAmountIDR(Math.round(proj.contractValueIDR * 0.3));
      }
    }
  };

  const handleTaxToggle = (checked: boolean) => {
    setTaxIncluded(checked);
    if (checked && totalAmountIDR > 0) {
      setTaxAmountIDR(Math.round(totalAmountIDR * 0.11));
    } else {
      setTaxAmountIDR(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!invoiceNumber.trim()) {
      setErrorMsg('Nomor Invoice wajib diisi.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Judul atau perihal tagihan piutang wajib diisi.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMsg('Nama Klien / Perusahaan penerima tagihan wajib diisi.');
      return;
    }
    if (totalAmountIDR <= 0) {
      setErrorMsg('Nominal total tagihan piutang harus lebih besar dari Rp 0.');
      return;
    }
    if (!issueDate) {
      setErrorMsg('Tanggal terbit tagihan wajib diisi.');
      return;
    }
    if (!dueDate) {
      setErrorMsg('Tanggal jatuh tempo wajib diisi.');
      return;
    }

    if (hasInitialPayment && initialPaidAmountIDR > totalAmountIDR) {
      setErrorMsg('Nominal pembayaran awal tidak boleh melebihi total tagihan.');
      return;
    }

    setIsSubmitting(true);

    const selectedProj = projects.find((p) => p.id === selectedProjectId);

    if (editingReceivable) {
      const res = updateReceivable(editingReceivable.id, {
        invoiceNumber: invoiceNumber.trim(),
        title: title.trim(),
        category,
        clientName: clientName.trim(),
        clientContactPerson: clientContactPerson.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        projectId: selectedProjectId || undefined,
        projectCode: selectedProj?.code || editingReceivable.projectCode,
        milestoneTitle: milestoneTitle.trim() || undefined,
        totalAmountIDR,
        taxIncluded,
        taxAmountIDR: taxIncluded ? taxAmountIDR : 0,
        issueDate,
        dueDate,
        paymentTermsDays,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Gagal memperbarui data piutang.');
      }
    } else {
      const res = addReceivable({
        invoiceNumber: invoiceNumber.trim(),
        title: title.trim(),
        category,
        clientName: clientName.trim(),
        clientContactPerson: clientContactPerson.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        projectId: selectedProjectId || undefined,
        projectCode: selectedProj?.code,
        milestoneTitle: milestoneTitle.trim() || undefined,
        totalAmountIDR,
        taxIncluded,
        taxAmountIDR: taxIncluded ? taxAmountIDR : 0,
        issueDate,
        dueDate,
        paymentTermsDays,
        notes: notes.trim() || undefined,
        initialPaidAmountIDR: hasInitialPayment ? initialPaidAmountIDR : 0,
        paymentChannelId: hasInitialPayment ? paymentChannelId : undefined,
        referenceNumber: hasInitialPayment ? referenceNumber : undefined,
        notesPayment: hasInitialPayment ? notesPayment : undefined,
        syncToCashLedger: hasInitialPayment ? syncToCashLedger : false,
      });

      setIsSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Gagal menambahkan data piutang.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                {editingReceivable ? 'Edit Faktur / Tagihan Piutang' : 'Catat Tagihan Piutang Baru (Invoice)'}
              </h3>
              <p className="text-xs text-slate-400">
                Integrasi real-time piutang usaha klien ke Buku Kas, Arus Kas & Neraca Keuangan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas Faktur & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Nomor Invoice / Faktur *</span>
                </label>
                {!editingReceivable && (
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber(generateNextInvoiceNumber(receivables))}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Number
                  </button>
                )}
              </div>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="misal: INV/2026/08/TKDN-001"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Kategori Piutang *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReceivableCategory)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
              >
                {RECEIVABLE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Hubungkan ke Proyek Konsultasi & Perihal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Hubungkan ke Proyek (Opsional)</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
              >
                <option value="">-- Tanpa Proyek Spesifik (Non-Project) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title || p.name} - {p.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Tahapan Milestone / Termin</span>
              </label>
              <input
                type="text"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="contoh: Termin 1 (DP 30%), Termin 2 (Audit LVI 40%)"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Deskripsi / Perihal Tagihan *</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="misal: Tagihan Termin 1 - Pendampingan Sertifikasi TKDN PT Sinar Perkasa"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
              required
            />
          </div>

          {/* Section 3: Data Klien */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Informasi Klien / Penerima Faktur</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Nama Perusahaan / Klien *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="PT Manufaktur Baja Indonesia"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Contact Person (PIC Klien)
                </label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={(e) => setClientContactPerson(e.target.value)}
                  placeholder="Bpk. Hendra Gunawan (Finance Manager)"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Email Klien (Untuk Notifikasi/Penagihan)
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="finance@klienperusahaan.co.id"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Nilai Finansial & Jatuh Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nilai Total Tagihan (IDR) *</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={totalAmountIDR || ''}
                onChange={(e) => setTotalAmountIDR(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-emerald-600 dark:text-emerald-400"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {totalAmountIDR > 0 ? formatIDR(totalAmountIDR) : 'Rp 0'}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tanggal Terbit Tagihan *</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Syarat TOP / Jatuh Tempo *</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                  className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                >
                  <option value={7}>7 Hari</option>
                  <option value={14}>14 Hari</option>
                  <option value={30}>30 Hari</option>
                  <option value={45}>45 Hari</option>
                  <option value={60}>60 Hari</option>
                  <option value={90}>90 Hari</option>
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 5: PPN Setting */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxIncluded}
                onChange={(e) => handleTaxToggle(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Termasuk PPN 11% Faktur Pajak Keluaran
              </span>
            </label>
            {taxIncluded && (
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                PPN: {formatIDR(taxAmountIDR)}
              </span>
            )}
          </div>

          {/* Section 6: Pembayaran Awal / DP (Khusus Buat Piutang Baru) */}
          {!editingReceivable && (
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInitialPayment}
                    onChange={(e) => {
                      setHasInitialPayment(e.target.checked);
                      if (e.target.checked && initialPaidAmountIDR === 0 && totalAmountIDR > 0) {
                        setInitialPaidAmountIDR(totalAmountIDR);
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Catat Pembayaran Awal / DP Masuk Saat Ini Juga
                  </span>
                </label>
                {hasInitialPayment && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                    Otomatis Sinkron Buku Kas
                  </span>
                )}
              </div>

              {hasInitialPayment && (
                <div className="space-y-3 pt-2 border-t border-indigo-200 dark:border-indigo-900/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Nominal Diterima Saat Ini (IDR) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalAmountIDR}
                        step="1000"
                        value={initialPaidAmountIDR || ''}
                        onChange={(e) => setInitialPaidAmountIDR(Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-emerald-600 dark:text-emerald-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Saluran Kas / Bank Penerima *
                      </label>
                      <select
                        value={paymentChannelId}
                        onChange={(e) => setPaymentChannelId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                      >
                        {activePaymentChannels.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.name} ({ch.accountNumber || 'Kas'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        No. Referensi / Bukti Transfer
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="misal: TRF-BRI-998822"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncToCashLedger}
                          onChange={(e) => setSyncToCashLedger(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Posting ke Buku Kas & Jurnal Transaksi
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 7: Catatan Khusus */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>Catatan / Instruksi Pembayaran Rekening Klien</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mohon transfer ke Rekening BRI PT GAP Consulting Indonesia No. 0206-01-002980-30-5 dengan menyertakan nomor invoice."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingReceivable ? 'Simpan Perubahan' : 'Terbitkan Invoice Piutang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
