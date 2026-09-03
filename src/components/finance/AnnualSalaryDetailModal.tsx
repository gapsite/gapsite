import React from 'react';
import {
  X,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  ShieldCheck,
  User,
  Plus,
  Edit2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { EmployeeAnnualSalaryConfig } from '../../types';
import { formatIDR } from '../../utils/formatters';
import { calculateAnnualSalaryBreakdown } from '../../data/salaryConfigsData';

interface AnnualSalaryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmployeeAnnualSalaryConfig | null;
  onEdit?: (config: EmployeeAnnualSalaryConfig) => void;
  onCreatePayroll?: (config: EmployeeAnnualSalaryConfig) => void;
}

export const AnnualSalaryDetailModal: React.FC<AnnualSalaryDetailModalProps> = ({
  isOpen,
  onClose,
  config,
  onEdit,
  onCreatePayroll,
}) => {
  if (!isOpen || !config) return null;

  const breakdown = calculateAnnualSalaryBreakdown(config);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="salary-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div
        id="salary-detail-modal-container"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Rincian Penetapan Remunerasi Tahunan</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Tahun {config.year}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {config.skNumber || 'Surat Keputusan Standar Remunerasi Karyawan'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cetak Salinan SK"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Employee Badge Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                {config.employeeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{config.employeeName}</h3>
                <p className="text-xs font-semibold text-emerald-700">{config.roleTitle || config.role}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                  <span>Dept: {config.department || '-'}</span>
                  <span>•</span>
                  <span>Role: {config.role}</span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-start sm:items-end gap-1">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  config.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : config.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
              >
                STATUS: {config.status}
              </span>
              <span className="text-[11px] text-slate-500">
                Berlaku Efektif: <strong>{config.effectiveDate || `${config.year}-01-01`}</strong>
              </span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Komponen Bulanan */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Rincian Penghasilan Bulanan</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-mono font-bold text-slate-900">{formatIDR(config.basicSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Jabatan:</span>
                  <span className="font-mono text-slate-900">{formatIDR(config.positionAllowance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Transportasi:</span>
                  <span className="font-mono text-slate-900">{formatIDR(config.transportAllowance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Makan:</span>
                  <span className="font-mono text-slate-900">{formatIDR(config.mealAllowance)}</span>
                </div>
                {Boolean(config.communicationAllowance) && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tunjangan Komunikasi:</span>
                    <span className="font-mono text-slate-900">{formatIDR(config.communicationAllowance || 0)}</span>
                  </div>
                )}
                {Boolean(config.fixedAllowance) && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tunjangan Tetap Lainnya:</span>
                    <span className="font-mono text-slate-900">{formatIDR(config.fixedAllowance || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 bg-emerald-50 px-2 rounded-lg font-bold">
                  <span className="text-emerald-900">Total Penghasilan Bruto / Bln:</span>
                  <span className="font-mono text-emerald-900">{formatIDR(breakdown.monthlyGrossSalary)}</span>
                </div>
              </div>

              {/* Potongan simulasi */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono block">
                  Simulasi Potongan Resmi Bulanan:
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>BPJS Kesehatan (1%):</span>
                  <span className="font-mono">{formatIDR(breakdown.monthlyBpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>BPJS Ketenagakerjaan (2%):</span>
                  <span className="font-mono">{formatIDR(breakdown.monthlyBpjsTk)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimasi PPh 21 (Skema TER):</span>
                  <span className="font-mono">{formatIDR(breakdown.monthlyPph21Estimate)}</span>
                </div>
                <div className="flex justify-between py-1.5 bg-slate-100 px-2 rounded-lg font-bold text-slate-800">
                  <span>Estimasi THP Bersih (Take Home Pay):</span>
                  <span className="font-mono text-emerald-700">{formatIDR(breakdown.monthlyNetSalaryEstimate)}</span>
                </div>
              </div>
            </div>

            {/* Right: Komponen & Proyeksi Tahunan */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Proyeksi Biaya Anggaran Tahunan ({config.year})</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Akumulasi Gaji Pokok (12x):</span>
                  <span className="font-mono text-slate-900">{formatIDR(breakdown.annualBasicSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Akumulasi Tunjangan (12x):</span>
                  <span className="font-mono text-slate-900">{formatIDR(breakdown.annualAllowances)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Hari Raya (THR):</span>
                  <span className="font-mono text-slate-900">
                    {formatIDR(breakdown.annualThr)} ({config.thrMonths || 1}x Gaji Pokok)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Estimasi Bonus / Insentif:</span>
                  <span className="font-mono text-slate-900">{formatIDR(breakdown.annualBonusEstimate)}</span>
                </div>
                <div className="flex justify-between py-2 bg-amber-50 px-2.5 rounded-lg font-bold">
                  <span className="text-amber-950">Total Anggaran Bruto Tahunan:</span>
                  <span className="font-mono text-amber-900 text-sm">{formatIDR(breakdown.totalAnnualGrossCost)}</span>
                </div>
              </div>

              {/* Legal Notes */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase font-mono block">
                  Dasar Hukum &amp; Catatan SK:
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed italic">
                  "{config.notes || 'Standar penetapan remunerasi disahkan oleh jajaran pimpinan dan dewan direksi PT Verix Consultindo.'}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                  <span>Ditetapkan oleh: {config.updatedBy || 'Master Admin'}</span>
                  <span>Update: {new Date(config.updatedAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Terintegrasi langsung dengan menu Pembayaran Gaji Karyawan</span>
          </div>

          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(config);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Penetapan</span>
              </button>
            )}

            {onCreatePayroll && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreatePayroll(config);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Slip Gaji ({config.year})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
