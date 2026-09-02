import React, { useState } from 'react';
import {
  X,
  Calculator,
  Award,
  Sparkles,
  TrendingUp,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Factory,
  FlaskConical,
  Building2,
  Cpu,
  Layers,
  FileCheck,
  Percent,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { formatIDR } from '../utils/formatters';

interface TkdnCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SectorPreset = 'GENERAL_MANUFACTURING' | 'ELECTRONICS' | 'HEAVY_MACHINERY' | 'PHARMA';

export const TkdnCalculatorModal: React.FC<TkdnCalculatorModalProps> = ({ isOpen, onClose }) => {
  const { calculateTkdnScore } = useProjects();

  // State for formula inputs (in IDR)
  const [materialKdn, setMaterialKdn] = useState<number>(450000000);
  const [materialKln, setMaterialKln] = useState<number>(350000000);
  const [laborWni, setLaborWni] = useState<number>(120000000);
  const [laborWna, setLaborWna] = useState<number>(0);
  const [overheadKdn, setOverheadKdn] = useState<number>(80000000);
  const [overheadKln, setOverheadKln] = useState<number>(30000000);

  // Permenperin 35/2025 Strategic Incentive State
  const [hasDomesticFactory, setHasDomesticFactory] = useState<boolean>(true);
  const [rdBonus, setRdBonus] = useState<number>(5.0); // R&D Bonus (0 to 20%)
  const [bmpScore, setBmpScore] = useState<number>(8.5); // BMP 15 criteria (0 to 15%)
  const [showBmpChecklist, setShowBmpChecklist] = useState<boolean>(false);

  // BMP 15 criteria toggles under Permenperin 35/2025
  const [bmpChecklist, setBmpChecklist] = useState<{ [key: string]: boolean }>({
    k3_iso45001: true,
    iso9001_qms: true,
    iso14001_env: true,
    umkm_partnership: true,
    bpjs_employment: true,
    local_worker_training: true,
    csr_community: true,
    waste_management_ipal: true,
    rd_lab_facility: false,
    green_industry_standard: false,
    indi_4_transformation: false,
    renewable_energy_use: false,
    local_supply_chain_cert: false,
    occupational_health: true,
    new_facility_investment: false,
  });

  if (!isOpen) return null;

  // Calculate using Permenperin 35/2025 formula engine
  const result = calculateTkdnScore({
    directMaterialKDN: materialKdn,
    directMaterialKLN: materialKln,
    directLaborWNI: laborWni,
    directLaborWNA: laborWna,
    factoryOverheadDomestic: overheadKdn,
    factoryOverheadImported: overheadKln,
    hasDomesticFactory,
    rdDomesticBonusPercentage: rdBonus,
    bmpScore,
  });

  const combinedScore = result.combinedScoreWithBmp;

  // Sector Presets
  const applyPreset = (preset: SectorPreset) => {
    switch (preset) {
      case 'GENERAL_MANUFACTURING':
        setMaterialKdn(550000000);
        setMaterialKln(250000000);
        setLaborWni(140000000);
        setLaborWna(0);
        setOverheadKdn(95000000);
        setOverheadKln(20000000);
        setHasDomesticFactory(true);
        setRdBonus(4.0);
        setBmpScore(8.5);
        break;
      case 'ELECTRONICS':
        setMaterialKdn(320000000);
        setMaterialKln(480000000);
        setLaborWni(110000000);
        setLaborWna(15000000);
        setOverheadKdn(70000000);
        setOverheadKln(50000000);
        setHasDomesticFactory(true);
        setRdBonus(12.0); // High R&D incentive for electronics
        setBmpScore(9.0);
        break;
      case 'HEAVY_MACHINERY':
        setMaterialKdn(600000000);
        setMaterialKln(400000000);
        setLaborWni(180000000);
        setLaborWna(20000000);
        setOverheadKdn(150000000);
        setOverheadKln(60000000);
        setHasDomesticFactory(true);
        setRdBonus(6.0);
        setBmpScore(10.5);
        break;
      case 'PHARMA':
        setMaterialKdn(380000000);
        setMaterialKln(320000000);
        setLaborWni(130000000);
        setLaborWna(0);
        setOverheadKdn(110000000);
        setOverheadKln(40000000);
        setHasDomesticFactory(true);
        setRdBonus(15.0); // Clinical trials & local R&D bonus
        setBmpScore(12.0);
        break;
    }
  };

  const handleReset = () => {
    setMaterialKdn(450000000);
    setMaterialKln(350000000);
    setLaborWni(120000000);
    setLaborWna(0);
    setOverheadKdn(80000000);
    setOverheadKln(30000000);
    setHasDomesticFactory(true);
    setRdBonus(5.0);
    setBmpScore(8.5);
  };

  const toggleBmpItem = (key: string) => {
    const next = { ...bmpChecklist, [key]: !bmpChecklist[key] };
    setBmpChecklist(next);
    const count = Object.values(next).filter(Boolean).length;
    // 15 criteria mapped up to 15.0%
    const computedBmp = Number(Math.min(15.0, count * 1.0).toFixed(1));
    setBmpScore(computedBmp);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  TKDN Estimator & Calculator
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded font-mono font-bold">
                  Permenperin No. 35/2025
                </span>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-700/80 px-2 py-0.5 rounded font-medium">
                  Masa Berlaku 5 Tahun
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Formula Pembobotan Faktor (Bahan 75%, Tenaga Kerja 10%, Overhead 15%) & Insentif Litbang / Pabrik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Banner */}
        <div className="bg-slate-100/90 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preset Sektor Industri:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('GENERAL_MANUFACTURING')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors"
            >
              🏭 Fabrikasi & Manufaktur
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ELECTRONICS')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors"
            >
              💻 Elektronika & Digital
            </button>
            <button
              type="button"
              onClick={() => applyPreset('HEAVY_MACHINERY')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors"
            >
              🚜 Alat Berat & Mesin
            </button>
            <button
              type="button"
              onClick={() => applyPreset('PHARMA')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors"
            >
              💊 Farmasi & Alkes
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Form Inputs & Permenperin 35/2025 Factors */}
          <div className="lg:col-span-7 space-y-5">
            {/* Regulatory Weighting Notice */}
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Ketentuan Formula Permenperin 35/2025:</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Perhitungan TKDN Barang menggunakan metode pembobotan terstandarisasi: <strong>Bahan Baku (Bobot 75%)</strong>, <strong>Tenaga Kerja Langsung (Bobot 10%)</strong>, dan <strong>Overhead Pabrik & Mesin (Bobot 15%)</strong>.
                </p>
              </div>
            </div>

            {/* 1. Direct Material Section (Bobot 75%) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    1. Bahan Baku Langsung (Direct Material)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {result.materialTkdn}% KDN
                  </span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Bobot Permenperin: <strong>75%</strong> (+{result.materialWeightedScore}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Bahan Baku Dalam Negeri (KDN) IDR
                  </label>
                  <input
                    type="number"
                    value={materialKdn}
                    onChange={(e) => setMaterialKdn(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{formatIDR(materialKdn)}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Bahan Baku Impor (KLN) IDR
                  </label>
                  <input
                    type="number"
                    value={materialKln}
                    onChange={(e) => setMaterialKln(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{formatIDR(materialKln)}</p>
                </div>
              </div>
            </div>

            {/* 2. Direct Labor Section (Bobot 10%) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Tenaga Kerja Langsung (Direct Labor)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {result.laborTkdn}% WNI
                  </span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Bobot Permenperin: <strong>10%</strong> (+{result.laborWeightedScore}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-800 mb-1">
                    Tenaga Kerja WNI (Payroll) IDR
                  </label>
                  <input
                    type="number"
                    value={laborWni}
                    onChange={(e) => setLaborWni(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{formatIDR(laborWni)}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tenaga Kerja Asing (WNA) IDR
                  </label>
                  <input
                    type="number"
                    value={laborWna}
                    onChange={(e) => setLaborWna(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{formatIDR(laborWna)}</p>
                </div>
              </div>
            </div>

            {/* 3. Factory Overhead Section (Bobot 15%) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Overhead Pabrik & Mesin (Factory Overhead)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-teal-700">
                    {result.overheadTkdn}% KDN
                  </span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    Bobot Permenperin: <strong>15%</strong> (+{result.overheadWeightedScore}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-teal-800 mb-1">
                    Overhead Domestik (Depresiasi, Utilitas) IDR
                  </label>
                  <input
                    type="number"
                    value={overheadKdn}
                    onChange={(e) => setOverheadKdn(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{formatIDR(overheadKdn)}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Amortisasi Mesin/Software Impor IDR
                  </label>
                  <input
                    type="number"
                    value={overheadKln}
                    onChange={(e) => setOverheadKln(Number(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{formatIDR(overheadKln)}</p>
                </div>
              </div>
            </div>

            {/* 4. Strategic Incentives: Factory Baseline & R&D Bonus */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Insentif Strategis Permenperin 35/2025
              </span>

              {/* Toggle Domestic Factory Floor 25% */}
              <div className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-indigo-200">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">
                    Fasilitas Pabrik di Indonesia & Tenaga Kerja WNI ≥ 50%
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mendapatkan jaminan insentif nilai TKDN dasar minimal <strong>25.00%</strong>.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={hasDomesticFactory}
                    onChange={(e) => setHasDomesticFactory(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* R&D Domestic Incentive Slider (0 to 20%) */}
              <div className="p-2.5 bg-white rounded-lg border border-indigo-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                    Insentif Penelitian & Pengembangan (Litbang) Lokal
                  </span>
                  <span className="font-mono text-indigo-700 text-sm">+{rdBonus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={rdBonus}
                  onChange={(e) => setRdBonus(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Bonus tambahan nilai TKDN hingga 20% bagi perusahaan yang melakukan litbang, paten, pusat desain, atau riset terapan di Indonesia.
                </p>
              </div>
            </div>

            {/* 5. Bobot Manfaat Perusahaan (BMP) 15 Criteria */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-700" />
                  Bobot Manfaat Perusahaan (BMP) - 15 Kriteria
                </span>
                <span className="text-xs font-mono font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                  +{bmpScore}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Skor BMP Kumulatif:</span>
                <button
                  type="button"
                  onClick={() => setShowBmpChecklist(!showBmpChecklist)}
                  className="text-amber-800 font-bold hover:underline text-[11px]"
                >
                  {showBmpChecklist ? 'Sembunyikan 15 Kriteria' : 'Buka Checklist 15 Kriteria'}
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={bmpScore}
                onChange={(e) => setBmpScore(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />

              {showBmpChecklist && (
                <div className="p-3 bg-white rounded-lg border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {[
                    { key: 'k3_iso45001', label: '1. Sertifikasi K3 / ISO 45001' },
                    { key: 'iso9001_qms', label: '2. Sistem Mutu ISO 9001' },
                    { key: 'iso14001_env', label: '3. Lingkungan Hidup ISO 14001' },
                    { key: 'umkm_partnership', label: '4. Kemitraan Rantai Pasok UMKM' },
                    { key: 'bpjs_employment', label: '5. Jaminan BPJS Ketenagakerjaan' },
                    { key: 'local_worker_training', label: '6. Pelatihan Kompetensi WNI' },
                    { key: 'csr_community', label: '7. CSR & Pemberdayaan Komunitas' },
                    { key: 'waste_management_ipal', label: '8. Fasilitas IPAL Ramah Lingkungan' },
                    { key: 'rd_lab_facility', label: '9. Fasilitas Laboratorium Litbang' },
                    { key: 'green_industry_standard', label: '10. Standar Industri Hijau' },
                    { key: 'indi_4_transformation', label: '11. Transformasi Digital INDI 4.0' },
                    { key: 'renewable_energy_use', label: '12. Pemanfaatan Energi Terbarukan' },
                    { key: 'local_supply_chain_cert', label: '13. Sertifikasi TKDN Pemasok Lokal' },
                    { key: 'occupational_health', label: '14. Kesehatan & Keselamatan Kerja' },
                    { key: 'new_facility_investment', label: '15. Investasi Perluasan Fasilitas' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={!!bmpChecklist[item.key]}
                        onChange={() => toggleBmpItem(item.key)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calculated Score & Statutory Procurement Evaluator */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Gauge Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-4 text-center border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                  TKDN Permenperin 35/2025
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                  Sertifikat 5 Thn
                </span>
              </div>

              <div className="py-2">
                <div className="text-5xl font-black font-mono tracking-tight text-emerald-400 flex items-center justify-center gap-1">
                  <span>{result.tkdnPercentage}%</span>
                </div>
                <div className="text-xs text-slate-300 mt-1.5 font-medium">
                  Tingkat Komponen Dalam Negeri (Barang)
                </div>
                {result.isFactoryIncentiveApplied && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/90 text-amber-300 border border-amber-700/80 rounded-lg text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Insentif Lantai Pabrik 25% Diterapkan</span>
                  </div>
                )}
              </div>

              {/* Formula decomposition stack */}
              <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 text-xs space-y-1 text-left font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Produksi Dasar (75/10/15):</span>
                  <span className="font-bold text-white">{result.baseProductionTkdn}%</span>
                </div>
                {result.rdBonusPercentage > 0 && (
                  <div className="flex justify-between text-indigo-300">
                    <span>+ Bonus Litbang Domestik:</span>
                    <span className="font-bold">+{result.rdBonusPercentage}%</span>
                  </div>
                )}
                {bmpScore > 0 && (
                  <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-700">
                    <span>+ Bobot Manfaat Perusahaan (BMP):</span>
                    <span className="font-bold">+{bmpScore}%</span>
                  </div>
                )}
                <div className="flex justify-between text-teal-300 font-black text-sm pt-1.5 border-t border-slate-700">
                  <span>Nilai Gabungan (TKDN + BMP):</span>
                  <span>{combinedScore}%</span>
                </div>
              </div>

              {/* Financial Cost Ratio summary */}
              <div className="pt-2 border-t border-slate-700/80 text-left space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total KDN Domestik:</span>
                  <span className="font-mono font-bold text-white">{formatIDR(result.kdnTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Biaya Pokok Produksi:</span>
                  <span className="font-mono font-bold text-white">{formatIDR(result.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Tender Procurement Checker */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Kualifikasi Pengadaan Pemerintah (LKPP)
              </h4>

              {/* Requirement 1: 25% threshold */}
              <div
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                  result.meetsBasicTender
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {result.meetsBasicTender ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold">Ambang Batas Tender APBN/BUMN (≥ 25%)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {result.meetsBasicTender
                      ? 'Lolos: Memenuhi syarat minimal keikutsertaan tender instansi pemerintah dan BUMN.'
                      : 'Belum Lolos: Nilai TKDN minimal 25% diperlukan untuk tender instansi pemerintah.'}
                  </p>
                </div>
              </div>

              {/* Requirement 2: 40% priority */}
              <div
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                  result.meetsEkatalogPriority
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {result.meetsEkatalogPriority ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold">Kewajiban Penggunaan e-Katalog LKPP (≥ 40%)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {result.meetsEkatalogPriority
                      ? 'Prioritas Wajib Beli: Produk wajib dibeli instansi pemerintah pada e-Katalog nasional.'
                      : `Kekurangan ${Number((40 - combinedScore).toFixed(1))}% untuk mencapai ambang prioritas wajib beli (40%).`}
                  </p>
                </div>
              </div>

              {/* Requirement 3: 60% high domestic */}
              <div
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                  result.meetsHighDomestic
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {result.meetsHighDomestic ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold">Kategori Produk Unggulan Dalam Negeri (≥ 60%)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {result.meetsHighDomestic
                      ? 'Unggulan Tinggi: Mendapat preferensi harga maksimum dalam evaluasi pengadaan barang.'
                      : 'Standar Normal: Preferensi harga parsial sesuai capaian TKDN.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Reset */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Nilai Simulasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            Perhitungan mematuhi Peraturan Menteri Perindustrian No. 35 Tahun 2025 tentang Ketentuan dan Tata Cara Sertifikasi TKDN & BMP.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            Tutup Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
