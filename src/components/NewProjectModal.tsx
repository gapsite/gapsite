import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  Plus,
  ShieldCheck,
  Calendar,
  Award,
  Code2,
  Layers,
  FileCheck,
  CheckCircle2,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  ServiceType,
  CompanyType,
  ProjectStage,
  Priority,
  SurveyorBody,
  EngagementCategory,
  ConsultingServiceConfig,
} from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { addProject, teamMembers, currentUser, activeConsultingServices } = useProjects();

  // Engagement Category (1. TKDN, 2. Izin Perusahaan, 3. Software Dev, 4. Lain-lain)
  const [engagementCategory, setEngagementCategory] = useState<EngagementCategory>('TKDN_CERTIFICATION');

  const [clientName, setClientName] = useState('');
  const [productOrServiceName, setProductOrServiceName] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('PMDN');
  const [industry, setIndustry] = useState('Renewable Energy & Solar PV');
  const [kbliCode, setKbliCode] = useState('27101 - Industri Generator Listrik');
  const [serviceType, setServiceType] = useState<ServiceType>(
    activeConsultingServices[0]?.id || 'TKDN_BARANG'
  );
  const [stage, setStage] = useState<ProjectStage>('INQUIRY');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [targetTkdnPercentage, setTargetTkdnPercentage] = useState<number>(45.0);
  const [projectedTkdnPercentage, setProjectedTkdnPercentage] = useState<number>(46.5);
  const [contractValueIDR, setContractValueIDR] = useState<number>(
    activeConsultingServices[0]?.basePriceIDR || 250000000
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Default target date: 90 days
  const defaultTarget = new Date();
  defaultTarget.setDate(defaultTarget.getDate() + 90);
  const [targetCompletionDate, setTargetCompletionDate] = useState(
    defaultTarget.toISOString().slice(0, 10)
  );

  const [leadConsultantId, setLeadConsultantId] = useState(currentUser.id);
  const [surveyorBody, setSurveyorBody] = useState<SurveyorBody>('PT Surveyor Indonesia');
  const [licensingAuthority, setLicensingAuthority] = useState('Kementerian Investasi / BKPM (OSS-RBA)');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('PLN Tender, Kemenperin');

  // Helper to find the best active service matching the chosen engagement category
  const findBestServiceForCategory = (
    category: EngagementCategory,
    servicesList: ConsultingServiceConfig[]
  ): ConsultingServiceConfig | null => {
    if (!servicesList || servicesList.length === 0) return null;

    if (category === 'TKDN_CERTIFICATION') {
      const match = servicesList.find(
        (s) =>
          s.id.toUpperCase().includes('TKDN') ||
          s.id.toUpperCase().includes('BMP') ||
          s.name.toUpperCase().includes('TKDN') ||
          s.name.toUpperCase().includes('BMP') ||
          s.category.toLowerCase().includes('manufaktur') ||
          s.category.toLowerCase().includes('industri')
      );
      return match || servicesList[0];
    }

    if (category === 'COMPANY_LICENSING') {
      const match = servicesList.find(
        (s) =>
          s.id.toUpperCase().includes('OSS') ||
          s.id.toUpperCase().includes('NIB') ||
          s.id.toUpperCase().includes('IZIN') ||
          s.id.toUpperCase().includes('LEGAL') ||
          s.id.toUpperCase().includes('PERIZINAN') ||
          s.id.toUpperCase().includes('SNI') ||
          s.id.toUpperCase().includes('AMDAL') ||
          s.name.toLowerCase().includes('izin') ||
          s.name.toLowerCase().includes('perizinan') ||
          s.name.toLowerCase().includes('legalitas') ||
          s.name.toLowerCase().includes('sertifikat') ||
          s.category.toLowerCase().includes('perizinan') ||
          s.category.toLowerCase().includes('legalitas') ||
          s.category.toLowerCase().includes('standarisasi')
      );
      return match || servicesList[0];
    }

    if (category === 'SOFTWARE_DEV') {
      const match = servicesList.find(
        (s) =>
          s.id.toUpperCase().includes('SOFTWARE') ||
          s.id.toUpperCase().includes('DEV') ||
          s.id.toUpperCase().includes('APP') ||
          s.id.toUpperCase().includes('CLOUD') ||
          s.id.toUpperCase().includes('IT') ||
          s.name.toLowerCase().includes('software') ||
          s.name.toLowerCase().includes('aplikasi') ||
          s.category.toLowerCase().includes('software') ||
          s.category.toLowerCase().includes('it')
      );
      return match || servicesList[0];
    }

    // OTHER_SERVICES
    const match = servicesList.find(
      (s) =>
        s.id.toUpperCase().includes('ADVISORY') ||
        s.id.toUpperCase().includes('OTHER') ||
        s.name.toLowerCase().includes('advisory') ||
        s.name.toLowerCase().includes('konsultasi') ||
        s.category.toLowerCase().includes('advisory') ||
        s.category.toLowerCase().includes('jasa')
    );
    return match || servicesList[0];
  };

  // Group active services by their category for optgroup rendering
  const groupedActiveServices = useMemo(() => {
    return activeConsultingServices.reduce((acc, svc) => {
      const cat = svc.category || 'Layanan Konsultasi';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(svc);
      return acc;
    }, {} as Record<string, ConsultingServiceConfig[]>);
  }, [activeConsultingServices]);

  // Sync serviceType with current catalog when opening or when catalog changes
  useEffect(() => {
    if (!isOpen) return;

    if (activeConsultingServices.length > 0) {
      const currentExists = activeConsultingServices.some((s) => s.id === serviceType);
      if (!currentExists || !serviceType) {
        const bestMatch = findBestServiceForCategory(engagementCategory, activeConsultingServices);
        if (bestMatch) {
          setServiceType(bestMatch.id);
          if (bestMatch.basePriceIDR) setContractValueIDR(bestMatch.basePriceIDR);
          if (bestMatch.defaultSurveyor) {
            if (engagementCategory === 'COMPANY_LICENSING') {
              setLicensingAuthority(bestMatch.defaultSurveyor);
            } else {
              setSurveyorBody(bestMatch.defaultSurveyor as any);
            }
          }
        }
      }
    }
  }, [isOpen, activeConsultingServices]);

  if (!isOpen) return null;

  // Handle Category Switching and set smart contextual defaults
  const handleCategoryChange = (category: EngagementCategory) => {
    setEngagementCategory(category);
    const bestService = findBestServiceForCategory(category, activeConsultingServices);

    if (category === 'TKDN_CERTIFICATION') {
      if (bestService) {
        setServiceType(bestService.id);
        if (bestService.basePriceIDR) setContractValueIDR(bestService.basePriceIDR);
        if (bestService.defaultSurveyor) setSurveyorBody(bestService.defaultSurveyor as any);
      } else {
        setContractValueIDR(85000000);
      }
      setTargetTkdnPercentage(45.0);
      setProjectedTkdnPercentage(46.5);
      setSurveyorBody('PT Surveyor Indonesia');
      setIndustry('Renewable Energy & Solar PV');
      setKbliCode('27101 - Industri Generator Listrik');
      setTagInput('PLN Tender, Kemenperin, TKDN');
    } else if (category === 'COMPANY_LICENSING') {
      if (bestService) {
        setServiceType(bestService.id);
        if (bestService.basePriceIDR) setContractValueIDR(bestService.basePriceIDR);
        if (bestService.defaultSurveyor) setLicensingAuthority(bestService.defaultSurveyor);
      } else {
        setContractValueIDR(35000000);
      }
      setTargetTkdnPercentage(0);
      setProjectedTkdnPercentage(0);
      setLicensingAuthority('Kementerian Investasi / BKPM (OSS-RBA)');
      setIndustry('Manufaktur & Perdagangan');
      setKbliCode('46591 - Perdagangan Besar Mesin & Peralatan');
      setTagInput('OSS RBA, NIB, Kemenkumham, Izin Usaha');
    } else if (category === 'SOFTWARE_DEV') {
      if (bestService) {
        setServiceType(bestService.id);
        if (bestService.basePriceIDR) setContractValueIDR(bestService.basePriceIDR);
      } else {
        setContractValueIDR(150000000);
      }
      setTargetTkdnPercentage(0);
      setProjectedTkdnPercentage(0);
      setSurveyorBody('PT Surveyor Indonesia');
      setIndustry('Financial Technology & Enterprise');
      setKbliCode('62019 - Aktivitas Pemrograman Komputer Lainnya');
      setTagInput('Software, Web App, React, Cloud, Database');
    } else if (category === 'OTHER_SERVICES') {
      if (bestService) {
        setServiceType(bestService.id);
        if (bestService.basePriceIDR) setContractValueIDR(bestService.basePriceIDR);
        if (bestService.defaultSurveyor) setSurveyorBody(bestService.defaultSurveyor as any);
      } else {
        setContractValueIDR(50000000);
      }
      setTargetTkdnPercentage(0);
      setProjectedTkdnPercentage(0);
      setSurveyorBody('PT Surveyor Indonesia');
      setIndustry('Jasa Konsultasi Bisnis');
      setKbliCode('70209 - Aktivitas Konsultasi Manajemen Lainnya');
      setTagInput('Advisory, Konsultasi, Layanan Khusus');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !productOrServiceName.trim()) {
      alert('Mohon isi nama perusahaan / klien dan ruang lingkup pekerjaan.');
      return;
    }

    const assignedConsultant = teamMembers.find((m) => m.id === leadConsultantId) || teamMembers[0];

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const isTkdnEngagement = engagementCategory === 'TKDN_CERTIFICATION';

    addProject({
      clientName: clientName.trim(),
      productOrServiceName: productOrServiceName.trim(),
      companyType,
      projectCategory: engagementCategory,
      industry,
      kbliCode,
      serviceType,
      stage,
      status: 'ON_TRACK',
      priority,
      targetTkdnPercentage: isTkdnEngagement ? (Number(targetTkdnPercentage) || 0) : 0,
      projectedTkdnPercentage: isTkdnEngagement ? (Number(projectedTkdnPercentage) || 0) : 0,
      contractValueIDR: Number(contractValueIDR) || 0,
      startDate,
      targetCompletionDate,
      leadConsultantId: assignedConsultant.id,
      leadConsultantName: assignedConsultant.name,
      surveyorBody: engagementCategory === 'COMPANY_LICENSING' 
        ? (licensingAuthority as any) 
        : engagementCategory === 'SOFTWARE_DEV' 
        ? ('Internal Engineering' as any)
        : surveyorBody,
      description: description.trim() || `${
        engagementCategory === 'TKDN_CERTIFICATION' ? 'TKDN Certification' :
        engagementCategory === 'COMPANY_LICENSING' ? 'Pengurusan Izin Perusahaan' :
        engagementCategory === 'SOFTWARE_DEV' ? 'Software Development' : 'Layanan Konsultasi'
      } for ${productOrServiceName.trim()}`,
      tags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
              engagementCategory === 'TKDN_CERTIFICATION' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' :
              engagementCategory === 'COMPANY_LICENSING' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' :
              engagementCategory === 'SOFTWARE_DEV' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' :
              'bg-amber-500/20 border border-amber-500/30 text-amber-400'
            }`}>
              {engagementCategory === 'TKDN_CERTIFICATION' && <Award className="w-5 h-5" />}
              {engagementCategory === 'COMPANY_LICENSING' && <Building2 className="w-5 h-5" />}
              {engagementCategory === 'SOFTWARE_DEV' && <Code2 className="w-5 h-5" />}
              {engagementCategory === 'OTHER_SERVICES' && <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {engagementCategory === 'TKDN_CERTIFICATION' && 'Inisiasi Pengurusan Sertifikasi TKDN'}
                {engagementCategory === 'COMPANY_LICENSING' && 'Inisiasi Pengurusan Izin Perusahaan'}
                {engagementCategory === 'SOFTWARE_DEV' && 'Inisiasi Project Software Development'}
                {engagementCategory === 'OTHER_SERVICES' && 'Inisiasi Project & Layanan Lain - Lain'}
              </h3>
              <p className="text-xs text-slate-400">
                Pilih jenis pengurusan di awal, form dan kolom otomatis menyesuaikan secara dinamis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* STEP 1: PILIHAN UTAMA PENGURUSAN / ENGAGEMENT CATEGORY PICKER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                PILIH JENIS PENGURUSAN PROJECT <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                4 Kategori Pengurusan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Option 1: TKDN */}
              <button
                type="button"
                onClick={() => handleCategoryChange('TKDN_CERTIFICATION')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  engagementCategory === 'TKDN_CERTIFICATION'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${
                      engagementCategory === 'TKDN_CERTIFICATION' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Award className="w-4 h-4" />
                    </div>
                    {engagementCategory === 'TKDN_CERTIFICATION' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    1. Pengurusan Sertifikasi TKDN
                  </h4>
                  <p className="text-[10.5px] text-slate-600 mt-1 leading-snug">
                    Sertifikasi TKDN Barang, Jasa, BMP & LVI
                  </p>
                </div>
              </button>

              {/* Option 2: Izin Perusahaan */}
              <button
                type="button"
                onClick={() => handleCategoryChange('COMPANY_LICENSING')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  engagementCategory === 'COMPANY_LICENSING'
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${
                      engagementCategory === 'COMPANY_LICENSING' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    {engagementCategory === 'COMPANY_LICENSING' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    2. Pengurusan Izin Perusahaan
                  </h4>
                  <p className="text-[10.5px] text-slate-600 mt-1 leading-snug">
                    NIB OSS-RBA, AMDAL, SNI & PB-UMKU
                  </p>
                </div>
              </button>

              {/* Option 3: Software Development */}
              <button
                type="button"
                onClick={() => handleCategoryChange('SOFTWARE_DEV')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  engagementCategory === 'SOFTWARE_DEV'
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${
                      engagementCategory === 'SOFTWARE_DEV' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Code2 className="w-4 h-4" />
                    </div>
                    {engagementCategory === 'SOFTWARE_DEV' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    3. Software Development
                  </h4>
                  <p className="text-[10.5px] text-slate-600 mt-1 leading-snug">
                    Web App, Mobile, ERP/CRM & Cloud
                  </p>
                </div>
              </button>

              {/* Option 4: Lain-Lain */}
              <button
                type="button"
                onClick={() => handleCategoryChange('OTHER_SERVICES')}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  engagementCategory === 'OTHER_SERVICES'
                    ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${
                      engagementCategory === 'OTHER_SERVICES' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    {engagementCategory === 'OTHER_SERVICES' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    4. Lain - Lain
                  </h4>
                  <p className="text-[10.5px] text-slate-600 mt-1 leading-snug">
                    Studi Kelayakan, Audit & Advisory
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-2" />

          {/* Client Entity & Structure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {engagementCategory === 'SOFTWARE_DEV' ? 'Client / Company Name' : 'Client Legal Entity Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={
                  engagementCategory === 'SOFTWARE_DEV'
                    ? 'e.g. PT Mitra Digital Finansial'
                    : engagementCategory === 'COMPANY_LICENSING'
                    ? 'e.g. PT Artha Mandiri Perkasa'
                    : 'e.g. PT Nusantara Solar Teknologi'
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
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
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
              >
                <option value="PMDN">PMDN (Penanaman Modal Dalam Negeri)</option>
                <option value="PMA">PMA (Penanaman Modal Asing)</option>
                <option value="BUMN">BUMN / BUMD</option>
                <option value="UMKM">UMKM (Industri Kecil Menengah / Startup)</option>
              </select>
            </div>
          </div>

          {/* Product / Scope Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {engagementCategory === 'TKDN_CERTIFICATION' && 'Product / Scope Description *'}
              {engagementCategory === 'COMPANY_LICENSING' && 'Nama / Ruang Lingkup Izin yang Diurus *'}
              {engagementCategory === 'SOFTWARE_DEV' && 'Nama Aplikasi / Ruang Lingkup Software *'}
              {engagementCategory === 'OTHER_SERVICES' && 'Deskripsi Pekerjaan / Layanan Khusus *'}
            </label>
            <input
              type="text"
              value={productOrServiceName}
              onChange={(e) => setProductOrServiceName(e.target.value)}
              placeholder={
                engagementCategory === 'TKDN_CERTIFICATION'
                  ? 'e.g. Inverter On-Grid 100kW & String Combiner Box'
                  : engagementCategory === 'COMPANY_LICENSING'
                  ? 'e.g. Pengurusan NIB Berbasis Risiko Tinggi, Izin Operasional Pabrik & PB-UMKU'
                  : engagementCategory === 'SOFTWARE_DEV'
                  ? 'e.g. Platform Web ERP Finance, Inventory Management & Cloud POS'
                  : 'e.g. Studi Kelayakan Bisnis & Pendampingan Audit Kepatuhan Manajemen'
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          {/* Service Type, KBLI, and Industry */}
          <div className={`grid grid-cols-1 ${engagementCategory === 'OTHER_SERVICES' ? '' : 'sm:grid-cols-3'} gap-3`}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {engagementCategory === 'SOFTWARE_DEV' ? 'Software / Service Type' : 'Consulting Service Type'}
              </label>
              <select
                value={serviceType}
                onChange={(e) => {
                  const newType = e.target.value as ServiceType;
                  setServiceType(newType);
                  const matchedService = activeConsultingServices.find((s) => s.id === newType);
                  if (matchedService) {
                    if (matchedService.defaultSurveyor) {
                      if (engagementCategory === 'COMPANY_LICENSING') {
                        setLicensingAuthority(matchedService.defaultSurveyor);
                      } else {
                        setSurveyorBody(matchedService.defaultSurveyor as any);
                      }
                    }
                    if (matchedService.basePriceIDR) {
                      setContractValueIDR(matchedService.basePriceIDR);
                    }
                  }
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {activeConsultingServices.length === 0 ? (
                  <option value="">(Belum ada layanan aktif di Services Catalog)</option>
                ) : (
                  (Object.entries(groupedActiveServices) as [string, ConsultingServiceConfig[]][]).map(([catName, svcs]) => (
                    <optgroup key={catName} label={`📁 ${catName}`}>
                      {svcs.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} {svc.code ? `[${svc.code}]` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
            </div>

            {engagementCategory !== 'OTHER_SERVICES' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    KBLI Classification
                  </label>
                  <input
                    type="text"
                    value={kbliCode}
                    onChange={(e) => setKbliCode(e.target.value)}
                    placeholder={
                      engagementCategory === 'SOFTWARE_DEV'
                        ? 'e.g. 62019 - Pemrograman Komputer'
                        : 'e.g. 27101 - Industri Mesin Listrik'
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Industry Sector / Domain
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder={
                      engagementCategory === 'SOFTWARE_DEV'
                        ? 'e.g. Fintech, E-Commerce, Logistics'
                        : 'e.g. Heavy Steel, Medical, Solar'
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
                  />
                </div>
              </>
            )}
          </div>

          {/* TKDN Target & Financials SECTION */}
          {engagementCategory === 'TKDN_CERTIFICATION' ? (
            /* MENU 1: TKDN CERTIFICATION (Keep Target TKDN %, Initial Projected TKDN %, and Contract Value IDR) */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Target TKDN % <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={targetTkdnPercentage}
                    onChange={(e) => setTargetTkdnPercentage(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-emerald-300 text-slate-900 rounded-lg px-3 py-2 font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Initial Projected TKDN %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={projectedTkdnPercentage}
                    onChange={(e) => setProjectedTkdnPercentage(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-emerald-300 text-emerald-800 rounded-lg px-3 py-2 font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-emerald-600">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Contract Value (IDR)
                </label>
                <input
                  type="number"
                  value={contractValueIDR}
                  onChange={(e) => setContractValueIDR(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            /* MENU 2, 3, 4: Only Contract Value IDR */
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Contract Value (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={contractValueIDR}
                  onChange={(e) => setContractValueIDR(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 font-bold font-mono focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 50000000"
                />
              </div>
            </div>
          )}

          {/* LVI Body / Authority & Lead Consultant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {engagementCategory === 'TKDN_CERTIFICATION' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned LVI (Lembaga Verifikasi Independen)
                </label>
                <select
                  value={surveyorBody}
                  onChange={(e) => setSurveyorBody(e.target.value as SurveyorBody)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
                >
                  <option value="PT Surveyor Indonesia">1. PT Surveyor Indonesia</option>
                  <option value="PT Sucofindo (Persero)">2. PT Sucofindo (Persero)</option>
                  <option value="PT Biro Klasifikasi Indonesia">3. PT Biro Klasifikasi Indonesia</option>
                  <option value="PT Anindya Wiraputra Consult">4. PT Anindya Wiraputra Consult</option>
                  <option value="Badan Standarisasi dan Kebijakan Jasa Industri">5. Badan Standarisasi dan Kebijakan Jasa Industri</option>
                </select>
              </div>
            )}

            {engagementCategory === 'COMPANY_LICENSING' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instansi / Lembaga Penerbit Izin
                </label>
                <select
                  value={licensingAuthority}
                  onChange={(e) => setLicensingAuthority(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
                >
                  <option value="Kementerian Investasi / BKPM (OSS-RBA)">1. Kementerian Investasi / BKPM (OSS-RBA)</option>
                  <option value="Kementerian Perindustrian RI">2. Kementerian Perindustrian RI (SIINas)</option>
                  <option value="Kementerian Lingkungan Hidup (KLHK)">3. Kementerian Lingkungan Hidup (KLHK)</option>
                  <option value="Badan Standarisasi Nasional (BSN / LSPro)">4. Badan Standarisasi Nasional (BSN / LSPro)</option>
                  <option value="Dinas PMPTSP Daerah">5. Dinas Penanaman Modal & PTSP Daerah</option>
                  <option value="BPOM / Kementerian Kesehatan">6. BPOM / Kementerian Kesehatan</option>
                  <option value="PT Surveyor Indonesia / Sucofindo">7. PT Surveyor Indonesia / Sucofindo</option>
                </select>
              </div>
            )}

            <div className={engagementCategory === 'SOFTWARE_DEV' || engagementCategory === 'OTHER_SERVICES' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {engagementCategory === 'SOFTWARE_DEV' ? 'Lead Project Manager / Tech Lead' : 'Lead Consulting Partner'}
              </label>
              <select
                value={leadConsultantId}
                onChange={(e) => setLeadConsultantId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.roleTitle || m.role}
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
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {engagementCategory === 'TKDN_CERTIFICATION' && 'Target Certification Date'}
                {engagementCategory === 'COMPANY_LICENSING' && 'Target Terbit Izin / Penyelesaian'}
                {engagementCategory === 'SOFTWARE_DEV' && 'Target Launch / Go-Live Date'}
                {engagementCategory === 'OTHER_SERVICES' && 'Target Penyelesaian Project'}
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
              />
            </div>
          </div>

          {/* Description & Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {engagementCategory === 'SOFTWARE_DEV'
                ? 'Software Scope Summary & Tech Specifications'
                : 'Consulting Engagement Summary & Objectives'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                engagementCategory === 'TKDN_CERTIFICATION'
                  ? 'e.g. Assist client in preparing BOM cost sheets, factory inspection readiness, and SIINas verification for mandatory PLN tender eligibility...'
                  : engagementCategory === 'COMPANY_LICENSING'
                  ? 'e.g. Pengurusan izin usaha OSS-RBA, pemenuhan persyaratan standar teknis PB-UMKU, dan sertifikasi kepatuhan regulasi...'
                  : engagementCategory === 'SOFTWARE_DEV'
                  ? 'e.g. Pengembangan sistem web ERP berbasis React & Node.js, database PostgreSQL, integrasi API perbankan, dan deployment cloud VPS...'
                  : 'e.g. Ruang lingkup konsultasi khusus, deliverable laporan audit/analisis, dan jadwal pendampingan klien...'
              }
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
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                engagementCategory === 'TKDN_CERTIFICATION' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20' :
                engagementCategory === 'COMPANY_LICENSING' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-700/20' :
                engagementCategory === 'SOFTWARE_DEV' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-700/20' :
                'bg-amber-600 hover:bg-amber-500 shadow-amber-700/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {engagementCategory === 'TKDN_CERTIFICATION' && 'Initialize TKDN Project'}
                {engagementCategory === 'COMPANY_LICENSING' && 'Initialize Licensing Project'}
                {engagementCategory === 'SOFTWARE_DEV' && 'Initialize Software Project'}
                {engagementCategory === 'OTHER_SERVICES' && 'Initialize Consulting Project'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
