import React, { useState } from 'react';
import {
  X,
  Building2,
  Plus,
  ShieldCheck,
  Calendar,
  Coins,
  FileSpreadsheet,
  Tag,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  ServiceType,
  CompanyType,
  ProjectStage,
  Priority,
  SurveyorBody,
} from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { addProject, teamMembers, currentUser } = useProjects();

  const [clientName, setClientName] = useState('');
  const [productOrServiceName, setProductOrServiceName] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('PMDN');
  const [industry, setIndustry] = useState('Renewable Energy & Solar PV');
  const [kbliCode, setKbliCode] = useState('27101 - Industri Generator Listrik');
  const [serviceType, setServiceType] = useState<ServiceType>('TKDN_BARANG');
  const [stage, setStage] = useState<ProjectStage>('INQUIRY');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [targetTkdnPercentage, setTargetTkdnPercentage] = useState<number>(45.0);
  const [projectedTkdnPercentage, setProjectedTkdnPercentage] = useState<number>(46.5);
  const [contractValueIDR, setContractValueIDR] = useState<number>(250000000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Default target date: 90 days
  const defaultTarget = new Date();
  defaultTarget.setDate(defaultTarget.getDate() + 90);
  const [targetCompletionDate, setTargetCompletionDate] = useState(
    defaultTarget.toISOString().slice(0, 10)
  );

  const [leadConsultantId, setLeadConsultantId] = useState(currentUser.id);
  const [surveyorBody, setSurveyorBody] = useState<SurveyorBody>('PT Sucofindo');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('PLN Tender, Kemenperin');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !productOrServiceName.trim()) {
      alert('Please provide client name and product scope.');
      return;
    }

    const assignedConsultant = teamMembers.find((m) => m.id === leadConsultantId) || teamMembers[0];

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    addProject({
      clientName: clientName.trim(),
      productOrServiceName: productOrServiceName.trim(),
      companyType,
      industry,
      kbliCode,
      serviceType,
      stage,
      status: 'ON_TRACK',
      priority,
      targetTkdnPercentage: Number(targetTkdnPercentage) || 40,
      projectedTkdnPercentage: Number(projectedTkdnPercentage) || 40,
      contractValueIDR: Number(contractValueIDR) || 0,
      startDate,
      targetCompletionDate,
      leadConsultantId: assignedConsultant.id,
      leadConsultantName: assignedConsultant.name,
      surveyorBody,
      description: description.trim() || `TKDN consulting engagement for ${productOrServiceName.trim()}`,
      tags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Initialize Consulting Engagement
              </h3>
              <p className="text-xs text-slate-400">
                Register a new client licensing, SIINas profile, or TKDN certification project
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Client Entity & Product Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Legal Entity Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. PT Nusantara Solar Teknologi"
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Structure
              </label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value as CompanyType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              >
                <option value="PMDN">PMDN (Penanaman Modal Dalam Negeri)</option>
                <option value="PMA">PMA (Penanaman Modal Asing)</option>
                <option value="BUMN">BUMN / BUMD</option>
                <option value="UMKM">UMKM (Industri Kecil Menengah)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product / Scope Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productOrServiceName}
              onChange={(e) => setProductOrServiceName(e.target.value)}
              placeholder="e.g. Inverter On-Grid 100kW & String Combiner Box"
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          {/* Service Type, KBLI, and Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Consulting Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              >
                <option value="TKDN_BARANG">TKDN Barang (Goods)</option>
                <option value="TKDN_JASA">TKDN Jasa (Services)</option>
                <option value="BMP_COMPANY">Bobot Manfaat Perusahaan (BMP)</option>
                <option value="OSS_RBA_NIB">OSS-RBA Licensing & PB-UMKU</option>
                <option value="SNI_CERTIFICATION">SNI Certification</option>
                <option value="AMDAL_UKL_UPL">AMDAL / UKL-UPL Permit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                KBLI Classification
              </label>
              <input
                type="text"
                value={kbliCode}
                onChange={(e) => setKbliCode(e.target.value)}
                placeholder="e.g. 27101 - Industri Mesin Listrik"
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Heavy Steel, Medical, Solar"
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              />
            </div>
          </div>

          {/* TKDN Target & Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target TKDN %
              </label>
              <input
                type="number"
                step="0.1"
                value={targetTkdnPercentage}
                onChange={(e) => setTargetTkdnPercentage(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Projected TKDN %
              </label>
              <input
                type="number"
                step="0.1"
                value={projectedTkdnPercentage}
                onChange={(e) => setProjectedTkdnPercentage(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-bold font-mono text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contract Value (IDR)
              </label>
              <input
                type="number"
                value={contractValueIDR}
                onChange={(e) => setContractValueIDR(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-bold font-mono"
              />
            </div>
          </div>

          {/* Surveyor Body & Lead Consultant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Surveyor Inspection Body
              </label>
              <select
                value={surveyorBody}
                onChange={(e) => setSurveyorBody(e.target.value as SurveyorBody)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              >
                <option value="PT Sucofindo">PT Sucofindo</option>
                <option value="PT Surveyor Indonesia">PT Surveyor Indonesia</option>
                <option value="PT Superintending Company">PT Superintending Company</option>
                <option value="Kemenperin SIINas Direct">Kemenperin SIINas Direct</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lead Consulting Partner
              </label>
              <select
                value={leadConsultantId}
                onChange={(e) => setLeadConsultantId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Engagement Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Certification Date
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
              />
            </div>
          </div>

          {/* Description & Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Consulting Engagement Summary & Objectives
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Assist client in preparing BOM cost sheets, factory inspection readiness, and SIINas verification for mandatory PLN tender eligibility..."
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keywords / Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. PLN Tender, Permenperin 05/2021, Solar Energy"
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
            >
              <Plus className="w-4 h-4" />
              <span>Initialize Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
