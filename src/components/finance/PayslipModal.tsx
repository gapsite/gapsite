import React, { useRef } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  CreditCard,
  Receipt,
  ShieldCheck,
  Download,
  Share2,
  Landmark,
  Briefcase,
  Award,
  FileCheck,
} from 'lucide-react';
import { PayrollPayment } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatIDR } from '../../utils/formatters';
import { terbilangRupiah } from '../../utils/payrollCalculations';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: PayrollPayment | null;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  payroll,
}) => {
  const { paymentChannels, companyLetterhead } = useProjects();
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payroll) return null;

  const sourceChannel = paymentChannels?.find((c) => c.id === payroll.paymentMethod);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `
=== SLIP GAJI KARYAWAN ===
PT GAP CONSULTING INDONESIA
No. Slip: ${payroll.payrollNumber}
Periode: ${payroll.period}
Tanggal Bayar: ${payroll.paymentDate}

Nama Pegawai: ${payroll.employeeName}
Jabatan: ${payroll.roleTitle}
Departemen: ${payroll.department}

--- PENERIMAAN ---
Gaji Pokok: ${formatIDR(payroll.basicSalary)}
Tunjangan Jabatan: ${formatIDR(payroll.positionAllowance)}
Tunjangan Transport: ${formatIDR(payroll.transportAllowance)}
Tunjangan Makan: ${formatIDR(payroll.mealAllowance)}
Bonus/Insentif Proyek: ${formatIDR(payroll.projectBonus)}
Upah Lembur: ${formatIDR(payroll.overtimeAmount)}
Tunjangan Lainnya: ${formatIDR(payroll.otherAllowances)}
TOTAL PENGHASILAN BRUTO: ${formatIDR(payroll.totalEarnings)}

--- PEMOTONGAN ---
BPJS Kesehatan (1%): ${formatIDR(payroll.bpjsKesehatan)}
BPJS Ketenagakerjaan (2%): ${formatIDR(payroll.bpjsKetenagakerjaan)}
PPh Pasal 21: ${formatIDR(payroll.pph21Amount)}
Kasbon: ${formatIDR(payroll.cashAdvanceDeduction)}
Potongan Lainnya: ${formatIDR(payroll.otherDeductions)}
TOTAL POTONGAN: ${formatIDR(payroll.totalDeductions)}

--- GAJI BERSIH (TAKE HOME PAY) ---
${formatIDR(payroll.netSalary)}
Terbilang: ${terbilangRupiah(payroll.netSalary)}

Rekening Tujuan: ${payroll.bankName || 'Bank Transfer'} - ${payroll.bankAccountNumber || '-'} a/n ${payroll.bankAccountHolder || payroll.employeeName}
Status: LUNAS / TERBAYAR
No. Transaksi Kas: ${payroll.transactionId || '-'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Toolbar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Pratinjau Slip Gaji Karyawan
              </h3>
              <p className="text-[11px] text-slate-400">
                {payroll.payrollNumber} • {payroll.period}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Salin Rincian ke Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div ref={printAreaRef} className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          {/* Header Kop Surat Perusahaan */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {companyLetterhead.logoUrl ? (
                    <img
                      src={companyLetterhead.logoUrl}
                      alt={companyLetterhead.companyName}
                      className="h-10 w-auto max-w-[150px] object-contain rounded shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-black text-sm tracking-wider shrink-0 shadow-xs">
                      {companyLetterhead.shortName?.slice(0, 3) || 'GAP'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase font-mono leading-tight">
                      {companyLetterhead.companyName}
                    </h1>
                    {companyLetterhead.tagline && (
                      <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                        {companyLetterhead.tagline}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight pt-1">
                  {companyLetterhead.address || 'Alamat Kantor'}
                  <br />
                  {companyLetterhead.taxId && <span>{companyLetterhead.taxId} • </span>}
                  {companyLetterhead.email && <span>Email: {companyLetterhead.email} • </span>}
                  {companyLetterhead.phone && <span>Telp: {companyLetterhead.phone}</span>}
                </p>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider font-mono">
                  SLIP GAJI KARYAWAN
                </div>
                <p className="text-xs font-mono font-bold text-slate-900 mt-1.5">
                  {payroll.payrollNumber}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Periode: <span className="font-semibold text-slate-800">{payroll.period}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Identitas Karyawan & Pembayaran */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-1">
                <span className="text-slate-500 font-medium">Nama Karyawan:</span>
                <span className="font-bold text-slate-900">{payroll.employeeName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1">
                <span className="text-slate-500 font-medium">Tanggal Bayar:</span>
                <span className="font-mono font-semibold text-slate-800">{payroll.paymentDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1">
                <span className="text-slate-500 font-medium">Jabatan / Posisi:</span>
                <span className="font-semibold text-slate-800">{payroll.roleTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1">
                <span className="text-slate-500 font-medium">Rekening Sumber (PT GAP):</span>
                <span className="font-semibold text-emerald-800 font-mono text-[11px] text-right">
                  {sourceChannel
                    ? `${sourceChannel.shortName || sourceChannel.name} • ${sourceChannel.accountNumber || 'Kas'}`
                    : payroll.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1">
                <span className="text-slate-500 font-medium">Rekening Tujuan Karyawan:</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px] text-right">
                  {payroll.bankName
                    ? `${payroll.bankName} • ${payroll.bankAccountNumber || '-'}`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1 sm:border-b-0 sm:pb-0">
                <span className="text-slate-500 font-medium">Departemen:</span>
                <span className="font-semibold text-slate-800">{payroll.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status Pembayaran:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  {payroll.status === 'PAID' ? 'LUNAS / DITRANSFER' : payroll.status}
                </span>
              </div>
            </div>
          </div>

          {/* Rincian Komponen Gaji: Penerimaan vs Pemotongan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sisi Kiri: Penerimaan / Penghasilan */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-mono">
                  A. PENERIMAAN (PENGHASILAN)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                  IDR
                </span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Gaji Pokok</span>
                  <span className="font-mono font-medium">{formatIDR(payroll.basicSalary)}</span>
                </div>
                {payroll.positionAllowance > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Tunjangan Jabatan</span>
                    <span className="font-mono font-medium">{formatIDR(payroll.positionAllowance)}</span>
                  </div>
                )}
                {payroll.transportAllowance > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Tunjangan Transport & Operasional</span>
                    <span className="font-mono font-medium">{formatIDR(payroll.transportAllowance)}</span>
                  </div>
                )}
                {payroll.mealAllowance > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Tunjangan Makan</span>
                    <span className="font-mono font-medium">{formatIDR(payroll.mealAllowance)}</span>
                  </div>
                )}
                {payroll.projectBonus > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Bonus / Insentif Proyek TKDN</span>
                    <span className="font-mono font-medium text-emerald-700 font-semibold">
                      {formatIDR(payroll.projectBonus)}
                    </span>
                  </div>
                )}
                {payroll.overtimeAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Upah Lembur</span>
                    <span className="font-mono font-medium">{formatIDR(payroll.overtimeAmount)}</span>
                  </div>
                )}
                {payroll.otherAllowances > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Tunjangan Lainnya</span>
                    <span className="font-mono font-medium">{formatIDR(payroll.otherAllowances)}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>TOTAL PENGHASILAN (BRUTO)</span>
                <span className="font-mono text-emerald-800">{formatIDR(payroll.totalEarnings)}</span>
              </div>
            </div>

            {/* Sisi Kanan: Pemotongan */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-rose-50/80 px-4 py-2.5 border-b border-rose-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 font-mono">
                  B. PEMOTONGAN
                </span>
                <span className="text-[10px] text-rose-700 font-semibold font-mono">
                  IDR
                </span>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>BPJS Kesehatan (1%)</span>
                  <span className="font-mono font-medium text-rose-700">
                    {formatIDR(payroll.bpjsKesehatan || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>BPJS Ketenagakerjaan (2%)</span>
                  <span className="font-mono font-medium text-rose-700">
                    {formatIDR(payroll.bpjsKetenagakerjaan || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Pajak Penghasilan (PPh 21)</span>
                  <span className="font-mono font-medium text-rose-700">
                    {formatIDR(payroll.pph21Amount || 0)}
                  </span>
                </div>
                {payroll.cashAdvanceDeduction > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Potongan Kasbon / Pinjaman</span>
                    <span className="font-mono font-medium text-rose-700">
                      {formatIDR(payroll.cashAdvanceDeduction)}
                    </span>
                  </div>
                )}
                {payroll.otherDeductions > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Potongan Lainnya / Absensi</span>
                    <span className="font-mono font-medium text-rose-700">
                      {formatIDR(payroll.otherDeductions)}
                    </span>
                  </div>
                )}
                {payroll.totalDeductions === 0 && (
                  <div className="text-[11px] text-slate-400 italic py-2 text-center">
                    Tidak ada potongan pada periode ini
                  </div>
                )}
              </div>
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>TOTAL PEMOTONGAN</span>
                <span className="font-mono text-rose-800">
                  {payroll.totalDeductions > 0 ? `(${formatIDR(payroll.totalDeductions)})` : formatIDR(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Grand Total: Take Home Pay (Gaji Bersih Diterima) */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl p-5 border-2 border-emerald-500 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-mono">
                  GAJI BERSIH DITERIMA (TAKE HOME PAY)
                </p>
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  Terbilang:{' '}
                  <span className="font-semibold text-slate-900 not-italic">
                    "{terbilangRupiah(payroll.netSalary)}"
                  </span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 tracking-tight">
                  {formatIDR(payroll.netSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Rekening Tujuan & Status Sinkronisasi Buku Kas */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-700">
              <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Ditransfer ke:{' '}
                <strong className="text-slate-900">{payroll.bankName || 'Bank'}</strong> No.{' '}
                <strong className="font-mono text-slate-900">{payroll.bankAccountNumber || '-'}</strong> a/n{' '}
                <strong className="text-slate-900">{payroll.bankAccountHolder || payroll.employeeName}</strong>
              </span>
            </div>
            {payroll.transactionId && (
              <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded font-mono text-[10px] font-semibold shrink-0">
                <Receipt className="w-3 h-3 text-emerald-600" />
                <span>Terintegrasi Buku Kas: {payroll.transactionId}</span>
              </div>
            )}
          </div>

          {payroll.notes && (
            <div className="text-xs bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-amber-900">
              <strong className="font-semibold">Catatan Penggajian:</strong> {payroll.notes}
            </div>
          )}

          {/* Bagian Tanda Tangan Resmi */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-14">
                <div>
                  <p className="text-slate-500 font-medium">Jakarta, {payroll.paymentDate}</p>
                  <p className="font-bold text-slate-900">Pihak Perusahaan (Finance & HRD)</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline underline-offset-4">
                    {companyLetterhead.authorizedSignatoryName || payroll.recordedBy || 'Finance Controller'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">{companyLetterhead.companyName}</p>
                </div>
              </div>

              <div className="space-y-14">
                <div>
                  <p className="text-slate-500 font-medium">Diterima oleh Karyawan</p>
                  <p className="font-bold text-slate-900">Pegawai Yang Bersangkutan</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline underline-offset-4">
                    {payroll.employeeName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">{payroll.roleTitle}</p>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-center text-slate-400 pt-6 italic">
              Dokumen ini diterbitkan secara otomatis oleh Sistem Keuangan & ERP {companyLetterhead.companyName} dan berlaku sah.
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on Print) */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Terhubung langsung dengan Laporan Arus Kas & Laba Rugi
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Slip Gaji</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
