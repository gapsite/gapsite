import React, { useState, useMemo } from 'react';
import {
  X,
  Gift,
  CheckCircle2,
  Calendar,
  CreditCard,
  Percent,
  Sparkles,
  AlertTriangle,
  Users,
  CheckSquare,
  Square,
  Building2,
  DollarSign,
} from 'lucide-react';
import { PayrollPayment, PaymentMethod } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatRupiah } from '../../utils/formatters';
import { hitungThrProrata, estimasiPph21, terbilangRupiah } from '../../utils/payrollCalculations';

interface BatchThrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (records: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>>) => void;
}

interface BatchEmployeeRow {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  nik: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  serviceMonths: number;
  baseSalary: number;
  multiplier: number;
  nominalThr: number;
  applyTax: boolean;
  pph21Amount: number;
  netThr: number;
  selected: boolean;
}

const HOLIDAY_CHOICES = [
  'Idul Fitri 1447 H / 2026 M',
  'Hari Raya Natal 2026',
  'Tahun Baru Masehi 2027',
  'Tahun Baru Imlek 2577',
  'Hari Raya Nyepi Caka 1948',
  'Hari Raya Waisak 2570',
];

export const BatchThrModal: React.FC<BatchThrModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
}) => {
  const {
    teamMembers,
    employeeSalaryConfigs,
    paymentChannels,
    currentUser,
  } = useProjects();

  const [holidayName, setHolidayName] = useState<string>(HOLIDAY_CHOICES[0]);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentChannelId, setPaymentChannelId] = useState<string>(
    paymentChannels && paymentChannels[0] ? paymentChannels[0].id : ''
  );
  const [defaultMultiplier, setDefaultMultiplier] = useState<number>(1);
  const [applyTaxToAll, setApplyTaxToAll] = useState<boolean>(false);
  const [markAsPaid, setMarkAsPaid] = useState<boolean>(true);

  // Initialize employee rows
  const [rows, setRows] = useState<BatchEmployeeRow[]>(() => {
    const currentYear = new Date().getFullYear();
    return teamMembers.map((m) => {
      // Find salary config
      const config = employeeSalaryConfigs.find(
        (c) => c.employeeId === m.id && c.year === currentYear
      );
      const baseSalary = config ? config.basicSalary : 7_500_000;

      // Join date
      let months = 12;
      const joinDateStr = (m as any).joinDate || m.registeredAt;
      if (joinDateStr) {
        const join = new Date(joinDateStr);
        const now = new Date();
        const diff = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
        months = Math.max(1, diff);
      }

      const thrCalc = hitungThrProrata(baseSalary, 0, months, 1);
      const initialTax = 0;

      return {
        employeeId: m.id,
        name: m.name,
        role: m.roleTitle || m.role,
        department: m.department || 'Konsultasi',
        nik: m.nik || '',
        bankName: m.bankName || 'BCA',
        bankAccountNumber: m.bankAccountNumber || '-',
        bankAccountHolder: m.bankAccountHolder || m.name,
        serviceMonths: months,
        baseSalary,
        multiplier: 1,
        nominalThr: thrCalc.nominalThr,
        applyTax: false,
        pph21Amount: initialTax,
        netThr: thrCalc.nominalThr - initialTax,
        selected: true,
      };
    });
  });

  // Recompute when defaultMultiplier or applyTaxToAll changes
  const handleApplyMultiplierToAll = (newMult: number) => {
    setDefaultMultiplier(newMult);
    setRows((prev) =>
      prev.map((r) => {
        const calc = hitungThrProrata(r.baseSalary, 0, r.serviceMonths, newMult);
        const tax = r.applyTax ? estimasiPph21(calc.nominalThr) : 0;
        return {
          ...r,
          multiplier: newMult,
          nominalThr: calc.nominalThr,
          pph21Amount: tax,
          netThr: calc.nominalThr - tax,
        };
      })
    );
  };

  const handleToggleTaxToAll = (apply: boolean) => {
    setApplyTaxToAll(apply);
    setRows((prev) =>
      prev.map((r) => {
        const tax = apply ? estimasiPph21(r.nominalThr) : 0;
        return {
          ...r,
          applyTax: apply,
          pph21Amount: tax,
          netThr: r.nominalThr - tax,
        };
      })
    );
  };

  const handleRowSelect = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const handleRowThrChange = (index: number, newNominal: number) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const tax = r.applyTax ? estimasiPph21(newNominal) : 0;
        return {
          ...r,
          nominalThr: newNominal,
          pph21Amount: tax,
          netThr: Math.max(0, newNominal - tax),
        };
      })
    );
  };

  // Selected Summary
  const selectedRows = rows.filter((r) => r.selected);
  const totalGrossDisbursed = useMemo(
    () => selectedRows.reduce((acc, r) => acc + r.nominalThr, 0),
    [selectedRows]
  );
  const totalTaxWithheld = useMemo(
    () => selectedRows.reduce((acc, r) => acc + r.pph21Amount, 0),
    [selectedRows]
  );
  const totalNetDisbursed = useMemo(
    () => selectedRows.reduce((acc, r) => acc + r.netThr, 0),
    [selectedRows]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRows.length === 0) {
      alert('Pilih minimal satu karyawan untuk pencairan THR.');
      return;
    }

    const payload: Array<Omit<PayrollPayment, 'id' | 'payrollNumber' | 'createdAt'>> =
      selectedRows.map((r) => ({
        employeeId: r.employeeId,
        employeeName: r.name,
        employeeNik: r.nik,
        roleTitle: r.role,
        department: r.department,
        bankName: r.bankName,
        bankAccountNumber: r.bankAccountNumber,
        bankAccountHolder: r.bankAccountHolder,
        period: `THR ${holidayName}`,
        paymentDate,
        paymentCategory: 'THR',

        basicSalary: r.baseSalary,
        positionAllowance: 0,
        transportAllowance: 0,
        mealAllowance: 0,
        projectBonus: 0,
        overtimeAmount: 0,
        otherAllowances: 0,
        thrAmount: r.nominalThr,
        serviceDurationMonths: r.serviceMonths,
        isProratedThr: r.serviceMonths < 12,
        holidayName,
        totalEarnings: r.nominalThr,

        bpjsKesehatan: 0,
        bpjsKetenagakerjaan: 0,
        pph21Amount: r.pph21Amount,
        cashAdvanceDeduction: 0,
        otherDeductions: 0,
        totalDeductions: r.pph21Amount,

        netSalary: r.netThr,

        paymentMethod,
        paymentChannelId: paymentChannelId || undefined,
        status: markAsPaid ? 'PAID' : 'PENDING',
        notes: `Pencairan Massal THR ${holidayName} (${r.serviceMonths >= 12 ? 'Penuh 100%' : `Prorata ${r.serviceMonths}/12 bln`})`,
        recordedBy: currentUser.name || currentUser.username || 'Finance Officer',
      }));

    onSaveBatch(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pencairan & Kalkulator THR Massal Karyawan
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Batch THR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Hitung otomatis hak THR seluruh tim konsultan sesuai masa kerja (Permenaker No. 6/2016) dan bukukan sekaligus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Parameter Pencairan Massal */}
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Parameter Umum Pencairan THR
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Hari Raya Keagamaan</label>
                <select
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {HOLIDAY_CHOICES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tanggal Pencairan</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Rekening Sumber Kas</label>
                <select
                  value={paymentChannelId}
                  onChange={(e) => setPaymentChannelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {paymentChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shortName || c.accountNumber || c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Standar Pengali (Multiplier)</label>
                <select
                  value={defaultMultiplier}
                  onChange={(e) => handleApplyMultiplierToAll(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1.0x (1 Bulan Gaji Pokok)</option>
                  <option value={1.25}>1.25x Gaji Pokok</option>
                  <option value={1.5}>1.5x Gaji Pokok</option>
                  <option value={2}>2.0x Gaji Pokok</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTaxToAll}
                    onChange={(e) => handleToggleTaxToAll(e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                  />
                  <span>Potong PPh 21 TER untuk Seluruh Karyawan</span>
                </label>

                <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markAsPaid}
                    onChange={(e) => setMarkAsPaid(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Langsung Tandai PAID & Bukukan ke Buku Kas</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                >
                  Pilih Semua ({rows.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                >
                  Batal Pilih
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Karyawan & Preview Kalkulasi */}
          <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-800/95 text-slate-300 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700 backdrop-blur-sm z-10">
                  <tr>
                    <th className="p-3 w-10 text-center">Pilih</th>
                    <th className="p-3">Karyawan & Jabatan</th>
                    <th className="p-3">Masa Kerja</th>
                    <th className="p-3">Gaji Acuan</th>
                    <th className="p-3">Rasio Hak THR</th>
                    <th className="p-3">Nominal THR (Bruto)</th>
                    <th className="p-3">PPh 21</th>
                    <th className="p-3 text-right">Net THP Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((row, idx) => {
                    const isProrata = row.serviceMonths < 12;
                    return (
                      <tr
                        key={row.employeeId}
                        className={`transition-colors ${
                          row.selected ? 'bg-slate-800/30 hover:bg-slate-800/50' : 'opacity-40 hover:opacity-75'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRowSelect(idx)}
                            className="text-amber-400 focus:outline-none"
                          >
                            {row.selected ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-white">{row.name}</div>
                          <div className="text-[11px] text-slate-400">{row.role} • {row.department}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {row.bankName} - {row.bankAccountNumber}
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isProrata
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {row.serviceMonths} Bulan
                          </span>
                        </td>

                        <td className="p-3 font-mono text-slate-300">
                          {formatRupiah(row.baseSalary)}
                        </td>

                        <td className="p-3">
                          <span className="text-[11px] font-mono text-slate-400">
                            {isProrata
                              ? `Prorata (${row.serviceMonths}/12 = ${(row.serviceMonths / 12 * 100).toFixed(0)}%)`
                              : '100% (Penuh)'}
                          </span>
                        </td>

                        <td className="p-3">
                          <input
                            type="number"
                            value={Number.isNaN(row.nominalThr) ? '' : (row.nominalThr ?? '')}
                            onChange={(e) => handleRowThrChange(idx, Number(e.target.value))}
                            disabled={!row.selected}
                            className="w-32 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-amber-300 font-mono font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </td>

                        <td className="p-3 font-mono text-rose-400">
                          {row.pph21Amount > 0 ? `- ${formatRupiah(row.pph21Amount)}` : 'Rp 0'}
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(row.netThr)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Total Dana Bersih THR yang Dicairkan ({selectedRows.length} Karyawan)
              </div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {formatRupiah(totalNetDisbursed)}
              </div>
              <div className="text-[11px] text-slate-400 italic">
                &ldquo;{terbilangRupiah(totalNetDisbursed)}&rdquo;
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Total Bruto THR:</span>
                <span className="text-white font-bold">{formatRupiah(totalGrossDisbursed)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Potongan PPh 21:</span>
                <span className="text-rose-400 font-bold">- {formatRupiah(totalTaxWithheld)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cairkan THR Massal ({selectedRows.length} Karyawan)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
