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
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { formatIDR } from '../utils/formatters';

interface TkdnCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TkdnCalculatorModal: React.FC<TkdnCalculatorModalProps> = ({ isOpen, onClose }) => {
  const { calculateTkdnScore } = useProjects();

  // State for formula inputs (in IDR)
  const [materialKdn, setMaterialKdn] = useState<number>(450000000);
  const [materialKln, setMaterialKln] = useState<number>(350000000);
  const [laborWni, setLaborWni] = useState<number>(120000000);
  const [laborWna, setLaborWna] = useState<number>(0);
  const [overheadKdn, setOverheadKdn] = useState<number>(80000000);
  const [overheadKln, setOverheadKln] = useState<number>(30000000);
  const [bmpScore, setBmpScore] = useState<number>(8.5); // Bobot Manfaat Perusahaan (Max 15%)

  if (!isOpen) return null;

  const result = calculateTkdnScore({
    directMaterialKDN: materialKdn,
    directMaterialKLN: materialKln,
    directLaborWNI: laborWni,
    directLaborWNA: laborWna,
    factoryOverheadDomestic: overheadKdn,
    factoryOverheadImported: overheadKln,
  });

  const combinedScore = Number((result.tkdnPercentage + bmpScore).toFixed(2));

  // Determine eligibility
  const meetsBasicTender = result.tkdnPercentage >= 25.0;
  const meetsEkatalogPriority = combinedScore >= 40.0;
  const meetsHighDomestic = result.tkdnPercentage >= 60.0;

  const handleReset = () => {
    setMaterialKdn(450000000);
    setMaterialKln(350000000);
    setLaborWni(120000000);
    setLaborWna(0);
    setOverheadKdn(80000000);
    setOverheadKln(30000000);
    setBmpScore(8.5);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  TKDN Smart Formula & Permenperin Simulator
                </h3>
                <span className="text-[10px] bg-teal-900 text-teal-300 border border-teal-700 px-2 py-0.5 rounded font-mono font-bold">
                  Permenperin 05/2021
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate Direct Material, Direct Labor, Overhead KDN/KLN ratios & LKPP tender thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Direct Material Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  1. Direct Material (Bahan Baku Langsung)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {result.materialTkdn}% KDN
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Domestic Material (KDN) IDR
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
                    Imported Material (KLN) IDR
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

            {/* 2. Direct Labor Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  2. Direct Labor (Tenaga Kerja Langsung)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {result.laborTkdn}% WNI
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-800 mb-1">
                    Indonesian Workers (WNI Payroll) IDR
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
                    Expatriate Workers (WNA Payroll) IDR
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

            {/* 3. Factory Overhead Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  3. Factory Overhead (Biaya Overhead Pabrik)
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {result.overheadTkdn}% KDN
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-teal-800 mb-1">
                    Domestic Overhead (Deprec., Utilities) IDR
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
                    Imported Machinery Amortization IDR
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

            {/* 4. Bobot Manfaat Perusahaan (BMP) Add-On Slider */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                  Bobot Manfaat Perusahaan (BMP) Bonus
                </span>
                <span className="text-xs font-mono font-black text-amber-900">
                  +{bmpScore}%
                </span>
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
              <p className="text-[11px] text-amber-800">
                Evaluated from corporate ISO 14001, OHSAS, local worker health insurance & CSR investments (Max 15.0%).
              </p>
            </div>
          </div>

          {/* Right Column: Calculated Score & Statutory Procurement Evaluator */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Gauge Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg space-y-4 text-center border border-slate-700">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Calculated TKDN Score
              </span>
              
              <div className="py-2">
                <div className="text-5xl font-black font-mono tracking-tight text-emerald-400">
                  {result.tkdnPercentage}%
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Base Production Domestic Component
                </div>
              </div>

              {bmpScore > 0 && (
                <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 text-xs flex items-center justify-between">
                  <span className="text-slate-300">Combined (TKDN + BMP):</span>
                  <span className="text-base font-black font-mono text-teal-300">
                    {combinedScore}%
                  </span>
                </div>
              )}

              {/* Financial Cost Ratio summary */}
              <div className="pt-3 border-t border-slate-700/80 text-left space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total KDN Domestic Cost:</span>
                  <span className="font-mono font-bold text-white">{formatIDR(result.kdnTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Cost of Production:</span>
                  <span className="font-mono font-bold text-white">{formatIDR(result.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Tender Procurement Checker */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Statutory Tender Eligibility
              </h4>

              {/* Requirement 1 */}
              <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                meetsBasicTender ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                {meetsBasicTender ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold">APBN/BUMN Minimum Tender Threshold (25%)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {meetsBasicTender
                      ? 'Eligible: Meets baseline domestic component requirements for government tenders.'
                      : 'Ineligible: Product must achieve at least 25% TKDN to participate.'}
                  </p>
                </div>
              </div>

              {/* Requirement 2 */}
              <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                meetsEkatalogPriority ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {meetsEkatalogPriority ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-bold">e-Katalog LKPP Mandatory Domestic Preference (40%)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {meetsEkatalogPriority
                      ? 'Priority Eligible: Mandatory purchase priority for state budget procurement.'
                      : 'Gap Identified: Requires + ' + (40 - combinedScore).toFixed(1) + '% domestic optimization.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Reset */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sample Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Calculations strictly adhere to Ministry of Industry (Kemenperin) standardized domestic cost formula.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
