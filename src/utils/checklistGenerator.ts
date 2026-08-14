import {
  ConsultingProject,
  DocumentType,
  EvaluatedMilestone,
  MilestoneStatus,
  MilestoneTemplate,
  ProjectStage,
  ServiceType,
  CertificationChecklistSummary,
} from '../types';

/**
 * Regulatory Master Templates for Indonesian Industrial Certification & Licensing
 * Based on:
 * - Permenperin No. 16/2011 & No. 43/2022 (TKDN Barang & Jasa)
 * - Permenperin No. 46/2022 (Bobot Manfaat Perusahaan)
 * - PP No. 5/2021 (OSS Risk-Based Approach, NIB, PB-UMKU)
 * - PP No. 22/2021 (Penyelenggaraan Perlindungan & Pengelolaan Lingkungan Hidup)
 * - BSN / Kemenperin (SNI Standar Nasional Indonesia)
 */
export const CERTIFICATION_MILESTONE_TEMPLATES: Record<ServiceType, MilestoneTemplate[]> = {
  TKDN_BARANG: [
    {
      id: 'tkdn-b-01',
      stage: 'INQUIRY',
      title: 'Corporate Legal & SIINas Account Verification',
      description:
        'Verify company NIB OSS-RBA, KBLI suitability for manufacturing, and active SIINas (Sistem Informasi Industri Nasional) account registration with Kemenperin.',
      regulatoryClause: 'Permenperin No. 16/2011 Pasal 3 & Permenperin No. 43/2022',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['NIB_OSS_DOCS', 'SIINAS_PROFILE'],
      optionalDocTypes: ['DEED_AHU_LEGAL', 'LEGAL_PERMIT'],
      estimatedDays: 3,
      weightPercentage: 10,
      helpTip: 'Ensure KBLI 5-digit corresponds precisely to the factory industrial production license.',
    },
    {
      id: 'tkdn-b-02',
      stage: 'INQUIRY',
      title: 'Consulting Engagement & Retainer Contract SPK',
      description:
        'Formalize client consulting engagement, scope definition, confidentiality NDA, and initial milestone billing.',
      regulatoryClause: 'Standard Consulting Service Agreement',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['OFFER_QUOTATION_LETTER', 'CLIENT_CONTRACT_SPK'],
      optionalDocTypes: ['NDAS_LEGAL_AGREEMENT', 'DOWN_PAYMENT_PROOF'],
      estimatedDays: 4,
      weightPercentage: 10,
      helpTip: 'Upload executed SPK and NDA signed with e-Meterai / authorized representative.',
    },
    {
      id: 'tkdn-b-03',
      stage: 'GAP_ANALYSIS',
      title: 'Bill of Materials (BOM) & Direct Raw Material Dossier',
      description:
        'Formulate comprehensive Bill of Materials (BOM) detailing local vs imported component sourcing, invoice pricing, and volume breakdown.',
      regulatoryClause: 'Permenperin No. 16/2011 Lampiran I (KDN Material)',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['BOM_EXCEL'],
      optionalDocTypes: ['SUPPLIER_TKDN_CERT'],
      estimatedDays: 7,
      weightPercentage: 15,
      helpTip: 'All direct materials must include unit cost, country of origin, and purchase invoice references.',
    },
    {
      id: 'tkdn-b-04',
      stage: 'DOC_PREPARATION',
      title: 'Direct Labor Payroll & Cost Accounting Structure',
      description:
        'Audit manufacturing direct labor payroll (WNI vs WNA ratio), production overhead, and factory cost allocation.',
      regulatoryClause: 'Permenperin No. 16/2011 Pasal 7 (Tenaga Kerja Langsung)',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['COST_ACCOUNTING'],
      optionalDocTypes: ['FACTORY_ASSET_REGISTRY'],
      estimatedDays: 6,
      weightPercentage: 15,
      helpTip: 'Include BPJS Ketenagakerjaan employee roster and monthly gross payroll ledger.',
    },
    {
      id: 'tkdn-b-05',
      stage: 'DOC_PREPARATION',
      title: 'Upstream Supplier TKDN Certificates Collection',
      description:
        'Collect valid Kemenperin TKDN certificates from tier-1 and tier-2 local material/component suppliers to maximize local content score.',
      regulatoryClause: 'Permenperin No. 43/2022 (Verifikasi Pemasok Dalam Negeri)',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['SUPPLIER_TKDN_CERT'],
      optionalDocTypes: ['BOM_EXCEL'],
      estimatedDays: 5,
      weightPercentage: 15,
      helpTip: 'Certificates must be active and registered on the Kemenperin SIINas public portal.',
    },
    {
      id: 'tkdn-b-06',
      stage: 'DOC_PREPARATION',
      title: 'Factory Machinery & Fixed Asset Registry',
      description:
        'Document factory manufacturing machines, tools, depreciation schedules, and domestic maintenance agreements.',
      regulatoryClause: 'Permenperin No. 16/2011 Pasal 8 (Biaya Tidak Langsung Pabrik)',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['FACTORY_ASSET_REGISTRY'],
      optionalDocTypes: ['LEGAL_PERMIT'],
      estimatedDays: 5,
      weightPercentage: 10,
      helpTip: 'Provide machine serial numbers, acquisition invoices, and factory layout diagrams.',
    },
    {
      id: 'tkdn-b-07',
      stage: 'FIELD_VERIFICATION',
      title: 'Official Surveyor Appointment & Fee Settlement',
      description:
        'Appointment of accredited surveyor body (PT Sucofindo / PT Surveyor Indonesia) and official audit fee settlement.',
      regulatoryClause: 'Permenperin No. 57/M-IND/PER/7/2014 & Juknis Verifikasi',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['SURVEYOR_FEE_RECEIPT'],
      optionalDocTypes: ['CLIENT_CONTRACT_SPK'],
      estimatedDays: 3,
      weightPercentage: 10,
      helpTip: 'Obtain surveyor proof of billing and audit assignment letter (Surat Tugas Auditor).',
    },
    {
      id: 'tkdn-b-08',
      stage: 'MINISTRY_REVIEW',
      title: 'Surveyor Site Audit Verification Report (BAV)',
      description:
        'Completion of on-site factory physical inspection, sampling, and issuance of Official Verification Report (Berita Acara Verifikasi).',
      regulatoryClause: 'BAV Surveyor Sucofindo / Surveyor Indonesia',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['SIINAS_PROFILE'],
      estimatedDays: 10,
      weightPercentage: 10,
      helpTip: 'Ensure BAV is signed by Lead Auditor, Client Plant Manager, and Senior Consultant.',
    },
    {
      id: 'tkdn-b-09',
      stage: 'CERTIFICATE_ISSUED',
      title: 'Final SIINas Endorsement & Kemenperin Certificate Release',
      description:
        'Directorate General of Chemical, Pharmaceutical, and Textile / Metal, Machinery & Transportation Industries endorsement and public SIINas TKDN Certificate issuance.',
      regulatoryClause: 'Sertifikat Tanda Sah TKDN Kemenperin RI',
      applicableServices: ['TKDN_BARANG'],
      requiredDocTypes: ['LEGAL_PERMIT', 'AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['INVOICE_BILLING'],
      estimatedDays: 7,
      weightPercentage: 5,
      helpTip: 'Verify certificate publication on http://tkdn.kemenperin.go.id.',
    },
  ],

  TKDN_JASA: [
    {
      id: 'tkdn-j-01',
      stage: 'INQUIRY',
      title: 'Service Scope & Corporate Licensing Dossier',
      description:
        'Verify service company legal standing, NIB OSS-RBA, business licenses (PB-UMKU), and tax compliance.',
      regulatoryClause: 'Permenperin No. 16/2011 Pasal 12 (TKDN Jasa Konstruksi & Non-Konstruksi)',
      applicableServices: ['TKDN_JASA'],
      requiredDocTypes: ['NIB_OSS_DOCS', 'SIINAS_PROFILE'],
      optionalDocTypes: ['DEED_AHU_LEGAL'],
      estimatedDays: 3,
      weightPercentage: 15,
      helpTip: 'Check KBLI alignment for specialized consulting, EPC, maintenance, or logistics services.',
    },
    {
      id: 'tkdn-j-02',
      stage: 'INQUIRY',
      title: 'Service Consulting SPK & Retainer Contract',
      description:
        'Formalize client service agreement, calculation methodology, and initial milestone retainers.',
      regulatoryClause: 'Standard Consulting Agreement',
      applicableServices: ['TKDN_JASA'],
      requiredDocTypes: ['OFFER_QUOTATION_LETTER', 'CLIENT_CONTRACT_SPK'],
      optionalDocTypes: ['DOWN_PAYMENT_PROOF'],
      estimatedDays: 4,
      weightPercentage: 10,
      helpTip: 'Include scope matrix of service packages to be audited.',
    },
    {
      id: 'tkdn-j-03',
      stage: 'DOC_PREPARATION',
      title: 'Manpower Nationality & Payroll Structure Audit',
      description:
        'Audit professional service personnel, engineering specialists, and Indonesian vs Expatriate salary disbursement.',
      regulatoryClause: 'Permenperin No. 16/2011 (Komponen Tenaga Kerja Jasa)',
      applicableServices: ['TKDN_JASA'],
      requiredDocTypes: ['COST_ACCOUNTING'],
      optionalDocTypes: ['BOM_EXCEL'],
      estimatedDays: 6,
      weightPercentage: 25,
      helpTip: 'Must include KTP, NPWP, BPJS, and Timesheet logs for project billing engineers.',
    },
    {
      id: 'tkdn-j-04',
      stage: 'DOC_PREPARATION',
      title: 'Service Equipment, Tools & Vessel Ownership Proof',
      description:
        'Document ownership or local charter contracts for service tools, measurement equipment, heavy machinery, or vessels.',
      regulatoryClause: 'Permenperin No. 16/2011 (Alat Kerja & Fasilitas Jasa)',
      applicableServices: ['TKDN_JASA'],
      requiredDocTypes: ['FACTORY_ASSET_REGISTRY'],
      optionalDocTypes: ['LEGAL_PERMIT'],
      estimatedDays: 5,
      weightPercentage: 20,
      helpTip: 'Domestic flag / domestic equipment ownership yields higher TKDN percentage.',
    },
    {
      id: 'tkdn-j-05',
      stage: 'FIELD_VERIFICATION',
      title: 'Surveyor Body Appointment & Field Verification',
      description:
        'Accredited surveyor engagement and on-site audit of service delivery facilities, project sites, and timesheets.',
      regulatoryClause: 'BAV Verifikasi TKDN Jasa',
      applicableServices: ['TKDN_JASA'],
      requiredDocTypes: ['SURVEYOR_FEE_RECEIPT', 'AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['SIINAS_PROFILE'],
      estimatedDays: 8,
      weightPercentage: 20,
      helpTip: 'Auditors will cross-verify service deliverables against project logbooks.',
    },
    {
      id: 'tkdn-j-06',
      stage: 'CERTIFICATE_ISSUED',
      title: 'SIINas Kemenperin Service TKDN Certificate',
      description:
        'Formal certificate publication on Kemenperin SIINas and issuance of Official TKDN Jasa Certificate.',
      regulatoryClause: 'Sertifikat TKDN Jasa Kemenperin RI',
      applicableServices: ['TKDN_JASA'],
      requiredDocTypes: ['LEGAL_PERMIT', 'AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['INVOICE_BILLING'],
      estimatedDays: 6,
      weightPercentage: 10,
      helpTip: 'Certificate is valid for procurement tender qualification.',
    },
  ],

  BMP_COMPANY: [
    {
      id: 'bmp-01',
      stage: 'INQUIRY',
      title: 'Corporate Standing & Domestic Ownership (PMDN) Audit',
      description:
        'Audit company ownership structure, Akta Notaris, SK AHU Kemenkumham, and PMDN investment percentage.',
      regulatoryClause: 'Permenperin No. 46/2022 (Pemberdayaan Usaha Mikro, Kecil & Menengah)',
      applicableServices: ['BMP_COMPANY'],
      requiredDocTypes: ['NIB_OSS_DOCS', 'DEED_AHU_LEGAL'],
      optionalDocTypes: ['SIINAS_PROFILE'],
      estimatedDays: 4,
      weightPercentage: 20,
      helpTip: '100% domestic shareholding grants maximum baseline corporate weight score.',
    },
    {
      id: 'bmp-02',
      stage: 'DOC_PREPARATION',
      title: 'Quality Management & Environmental Certifications (ISO)',
      description:
        'Upload active ISO 9001 (QMS), ISO 14001 (EMS), and ISO 45001 / SMK3 occupational safety certificates.',
      regulatoryClause: 'Permenperin No. 46/2022 Pasal 4 (Sertifikasi Sistem Manajemen Mutu)',
      applicableServices: ['BMP_COMPANY'],
      requiredDocTypes: ['ISO_QMS_CERT'],
      optionalDocTypes: ['LEGAL_PERMIT'],
      estimatedDays: 5,
      weightPercentage: 25,
      helpTip: 'ISO certificates must be issued by KAN (Komite Akreditasi Nasional) accredited bodies.',
    },
    {
      id: 'bmp-03',
      stage: 'DOC_PREPARATION',
      title: 'Local Community Development & Green Industry Audit',
      description:
        'Compile Corporate Social Responsibility (CSR) program disbursements, industrial waste management permits, and green industry initiatives.',
      regulatoryClause: 'Permenperin No. 46/2022 Pasal 6 (Pemberdayaan Lingkungan & CSR)',
      applicableServices: ['BMP_COMPANY'],
      requiredDocTypes: ['AMDAL_UKL_DOCUMENT'],
      optionalDocTypes: ['EXPENSE_PROOF_STRUK'],
      estimatedDays: 6,
      weightPercentage: 20,
      helpTip: 'Include proof of annual community CSR reports and hazardous waste (B3) transport manifests.',
    },
    {
      id: 'bmp-04',
      stage: 'FIELD_VERIFICATION',
      title: 'Surveyor BMP Assessment & SIINas Endorsement',
      description:
        'Independent surveyor calculation of company Bobot Manfaat score (up to max 15.00%).',
      regulatoryClause: 'BAV BMP Surveyor Indonesia / Sucofindo',
      applicableServices: ['BMP_COMPANY'],
      requiredDocTypes: ['SURVEYOR_FEE_RECEIPT', 'AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['SIINAS_PROFILE'],
      estimatedDays: 7,
      weightPercentage: 25,
      helpTip: 'BMP score combines with product TKDN to give total government tender preference.',
    },
    {
      id: 'bmp-05',
      stage: 'CERTIFICATE_ISSUED',
      title: 'Official BMP Certificate & Tender Certificate Issuance',
      description:
        'Final certificate release by Kemenperin validating company benefit rating.',
      regulatoryClause: 'Sertifikat Bobot Manfaat Perusahaan RI',
      applicableServices: ['BMP_COMPANY'],
      requiredDocTypes: ['LEGAL_PERMIT'],
      optionalDocTypes: ['AUDIT_VERIFICATION_REPORT'],
      estimatedDays: 5,
      weightPercentage: 10,
      helpTip: 'Valid for 3 years alongside product TKDN certifications.',
    },
  ],

  OSS_RBA_NIB: [
    {
      id: 'oss-01',
      stage: 'INQUIRY',
      title: 'KBLI Code Risk Mapping & AHU Notarial Legal Audit',
      description:
        'Analyze company 5-digit KBLI codes, determine risk level (Low, Medium-Low, Medium-High, High), and verify AHU Kemenkumham articles of association.',
      regulatoryClause: 'PP No. 5/2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko',
      applicableServices: ['OSS_RBA_NIB'],
      requiredDocTypes: ['DEED_AHU_LEGAL', 'OFFER_QUOTATION_LETTER'],
      optionalDocTypes: ['NDAS_LEGAL_AGREEMENT'],
      estimatedDays: 3,
      weightPercentage: 20,
      helpTip: 'Risk classification dictates whether basic NIB or full Standard Certificate / Verification is required.',
    },
    {
      id: 'oss-02',
      stage: 'DOC_PREPARATION',
      title: 'Basic Spatial Approval (PKKPR) & Environmental Commitment',
      description:
        'Process spatial zoning approval (Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang) and SPPL / UKL-UPL environmental declaration.',
      regulatoryClause: 'PP No. 5/2021 & Permen ATR/BPN No. 13/2021',
      applicableServices: ['OSS_RBA_NIB'],
      requiredDocTypes: ['AMDAL_UKL_DOCUMENT', 'LEGAL_PERMIT'],
      optionalDocTypes: ['NIB_OSS_DOCS'],
      estimatedDays: 7,
      weightPercentage: 30,
      helpTip: 'Must match spatial RDTR (Rencana Detail Tata Ruang) coordinates at the factory/office site.',
    },
    {
      id: 'oss-03',
      stage: 'FIELD_VERIFICATION',
      title: 'Sectoral Technical Standard Verification (PB-UMKU)',
      description:
        'Sectoral Ministry / Dinas technical requirement fulfillment for Perizinan Berusaha Untuk Menunjang Kegiatan Usaha.',
      regulatoryClause: 'Pertek Kementerian Teknis / Dinas PMPTSP',
      applicableServices: ['OSS_RBA_NIB'],
      requiredDocTypes: ['AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['FACTORY_ASSET_REGISTRY'],
      estimatedDays: 10,
      weightPercentage: 25,
      helpTip: 'Applies to medium-high and high risk sectors requiring physical plant inspection.',
    },
    {
      id: 'oss-04',
      stage: 'CERTIFICATE_ISSUED',
      title: 'Effective NIB & Verified Standard Certificate Release',
      description:
        'Issuance of fully effective Nomor Induk Berusaha (NIB), Sertifikat Standar Terverifikasi, and PB-UMKU license barcode.',
      regulatoryClause: 'NIB & Sertifikat Standar OSS-RBA RI',
      applicableServices: ['OSS_RBA_NIB'],
      requiredDocTypes: ['NIB_OSS_DOCS'],
      optionalDocTypes: ['LEGAL_PERMIT'],
      estimatedDays: 4,
      weightPercentage: 25,
      helpTip: 'Provides permanent operational and commercial legitimacy across Indonesia.',
    },
  ],

  SNI_CERTIFICATION: [
    {
      id: 'sni-01',
      stage: 'INQUIRY',
      title: 'SNI Standard Specification & Quality Manual Prep',
      description:
        'Identify applicable SNI standard (e.g. SNI ISO 9001 / product technical standard), formulate factory Quality Manual and SOPs.',
      regulatoryClause: 'BSN Standar Nasional Indonesia & Permenperin Terkait',
      applicableServices: ['SNI_CERTIFICATION'],
      requiredDocTypes: ['NIB_OSS_DOCS', 'OFFER_QUOTATION_LETTER'],
      optionalDocTypes: ['SIINAS_PROFILE'],
      estimatedDays: 5,
      weightPercentage: 15,
      helpTip: 'Quality manual must adhere strictly to ISO/IEC 17065 & product specific SNI criteria.',
    },
    {
      id: 'sni-02',
      stage: 'DOC_PREPARATION',
      title: 'Quality Management System (QMS) & Factory Testing Dossier',
      description:
        'Audit factory quality control equipment calibration, raw material incoming inspection records, and testing logs.',
      regulatoryClause: 'Sistem Manajemen Mutu SNI / ISO 9001:2015',
      applicableServices: ['SNI_CERTIFICATION'],
      requiredDocTypes: ['ISO_QMS_CERT', 'FACTORY_ASSET_REGISTRY'],
      optionalDocTypes: ['COST_ACCOUNTING'],
      estimatedDays: 8,
      weightPercentage: 25,
      helpTip: 'Ensure internal lab instruments hold valid calibration certificates from LK-KAN accredited labs.',
    },
    {
      id: 'sni-03',
      stage: 'FIELD_VERIFICATION',
      title: 'Accredited Laboratory Product Testing (LUK / B4T / Baristand)',
      description:
        'Submit official product specimens to KAN-accredited testing laboratory for destructive / safety / electrical compliance testing.',
      regulatoryClause: 'Laporan Hasil Uji (LHU) Laboratorium Terakreditasi KAN',
      applicableServices: ['SNI_CERTIFICATION'],
      requiredDocTypes: ['LAB_TEST_REPORT'],
      optionalDocTypes: ['EXPENSE_PROOF_STRUK'],
      estimatedDays: 14,
      weightPercentage: 30,
      helpTip: 'Test results must meet 100% of mandatory parameters outlined in the specific SNI standard.',
    },
    {
      id: 'sni-04',
      stage: 'MINISTRY_REVIEW',
      title: 'LSPro Factory Audit & Technical Panel Review',
      description:
        'On-site factory audit by Lembaga Sertifikasi Produk (LSPro) auditor team and technical panel evaluation.',
      regulatoryClause: 'Audit Stage 1 & Stage 2 LSPro',
      applicableServices: ['SNI_CERTIFICATION'],
      requiredDocTypes: ['SURVEYOR_FEE_RECEIPT', 'AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['SIINAS_PROFILE'],
      estimatedDays: 10,
      weightPercentage: 20,
      helpTip: 'Close any minor non-conformity (NCR) findings within 30 days of audit.',
    },
    {
      id: 'sni-05',
      stage: 'CERTIFICATE_ISSUED',
      title: 'Official SPPT-SNI Certificate & Marking License Release',
      description:
        'Issuance of Sertifikat Produk Penggunaan Tanda SNI (SPPT-SNI) and authorization for packaging SNI logo printing.',
      regulatoryClause: 'Sertifikat SPPT-SNI BSN / Kemenperin',
      applicableServices: ['SNI_CERTIFICATION'],
      requiredDocTypes: ['LEGAL_PERMIT'],
      optionalDocTypes: ['INVOICE_BILLING'],
      estimatedDays: 5,
      weightPercentage: 10,
      helpTip: 'SPPT-SNI is valid for 3-4 years with annual surveillance audits.',
    },
  ],

  AMDAL_UKL_UPL: [
    {
      id: 'env-01',
      stage: 'INQUIRY',
      title: 'Environmental Screening & Scoping (KBLI & Site Zoning)',
      description:
        'Determine environmental document criteria (AMDAL, UKL-UPL, or SPPL) based on factory scale, daily capacity, and spatial zoning.',
      regulatoryClause: 'PP No. 22/2021 Lampiran I (Daftar Rencana Usaha Wajib AMDAL/UKL-UPL)',
      applicableServices: ['AMDAL_UKL_UPL'],
      requiredDocTypes: ['NIB_OSS_DOCS', 'OFFER_QUOTATION_LETTER'],
      optionalDocTypes: ['DEED_AHU_LEGAL'],
      estimatedDays: 4,
      weightPercentage: 20,
      helpTip: 'Verify if production capacity exceeds Ministry of Environment thresholds for mandatory AMDAL.',
    },
    {
      id: 'env-02',
      stage: 'DOC_PREPARATION',
      title: 'Formulir UKL-UPL / ANDAL Study & Environmental Baseline Matrix',
      description:
        'Draft Environmental Management Plan (RKL) and Environmental Monitoring Plan (RPL), wastewater treatment plant (IPAL) engineering specs, and emission management.',
      regulatoryClause: 'Permen LHK No. 4/2021 tentang Pedoman Penyusunan Dokumen Lingkungan Hidup',
      applicableServices: ['AMDAL_UKL_UPL'],
      requiredDocTypes: ['AMDAL_UKL_DOCUMENT', 'FACTORY_ASSET_REGISTRY'],
      optionalDocTypes: ['COST_ACCOUNTING'],
      estimatedDays: 12,
      weightPercentage: 35,
      helpTip: 'Include baseline soil, air quality, ambient noise, and surface water lab test reports.',
    },
    {
      id: 'env-03',
      stage: 'FIELD_VERIFICATION',
      title: 'Technical Review Meeting with Dinas Lingkungan Hidup (DLH)',
      description:
        'Technical presentation, public consultation, and field inspection with DLH Regency/Provincial environmental appraisal committee.',
      regulatoryClause: 'Berita Acara Rapat Teknis Komisi Penilai Amdal / DLH',
      applicableServices: ['AMDAL_UKL_UPL'],
      requiredDocTypes: ['AUDIT_VERIFICATION_REPORT'],
      optionalDocTypes: ['EXPENSE_PROOF_STRUK'],
      estimatedDays: 10,
      weightPercentage: 25,
      helpTip: 'Submit revised environmental matrix based on DLH technical recommendations.',
    },
    {
      id: 'env-04',
      stage: 'CERTIFICATE_ISSUED',
      title: 'Persetujuan Lingkungan (PKPLH / SKKL) Issuance via Amdalnet',
      description:
        'Issuance of formal Environmental Approval decree (Pernyataan Kesanggupan Pengelolaan Lingkungan Hidup / SKKL) through the Amdalnet portal.',
      regulatoryClause: 'SK Persetujuan Lingkungan Hidup KLHK / DLH',
      applicableServices: ['AMDAL_UKL_UPL'],
      requiredDocTypes: ['LEGAL_PERMIT', 'AMDAL_UKL_DOCUMENT'],
      optionalDocTypes: ['INVOICE_BILLING'],
      estimatedDays: 6,
      weightPercentage: 20,
      helpTip: 'Mandatory prerequisite for high-risk industrial building permits (PBG) and final OSS licenses.',
    },
  ],
};

/**
 * Dynamic Milestone Evaluator
 * Evaluates the status of each milestone dynamically based on uploaded documents in project.documents
 */
export function evaluateProjectMilestones(
  project: ConsultingProject,
  customOverrides?: Record<string, { completed: boolean; signedBy?: string; timestamp?: string; notes?: string }>
): {
  milestones: EvaluatedMilestone[];
  summary: CertificationChecklistSummary;
} {
  const serviceType = project.serviceType || 'TKDN_BARANG';
  const baseTemplates = CERTIFICATION_MILESTONE_TEMPLATES[serviceType] || CERTIFICATION_MILESTONE_TEMPLATES.TKDN_BARANG;
  const projectDocs = project.documents || [];

  // Combine templates with any custom milestones stored on the project
  const allTemplates: MilestoneTemplate[] = [
    ...baseTemplates,
    ...(project.customMilestones || []).map((cm) => ({
      id: cm.id,
      stage: cm.stage,
      title: cm.title,
      description: cm.description,
      regulatoryClause: cm.regulatoryClause,
      applicableServices: [serviceType],
      requiredDocTypes: cm.requiredDocTypes || [],
      optionalDocTypes: cm.optionalDocTypes || [],
      weightPercentage: 10,
      estimatedDays: 5,
      helpTip: 'Custom project-specific regulatory milestone.',
    })),
  ];

  const evaluated: EvaluatedMilestone[] = allTemplates.map((template) => {
    // Find matching uploaded documents for required and optional document types
    const matchedDocs = projectDocs.filter((doc) => {
      const isReq = template.requiredDocTypes.includes(doc.type);
      const isOpt = template.optionalDocTypes ? template.optionalDocTypes.includes(doc.type) : false;
      return isReq || isOpt;
    });

    // Check which required document types have at least one uploaded document
    const fulfilledReqDocTypes = template.requiredDocTypes.filter((reqType) => {
      return projectDocs.some((doc) => doc.type === reqType);
    });

    const unfulfilledDocTypes = template.requiredDocTypes.filter((reqType) => {
      return !projectDocs.some((doc) => doc.type === reqType);
    });

    // Check if any matching doc has flagged discrepancies
    const hasDiscrepancy = matchedDocs.some((doc) => doc.status === 'FLAGGED_DISCREPANCY');

    // Check if consultant gave manual signoff override
    const manualSignoff = customOverrides?.[template.id] || project.manualMilestoneSignoffs?.[template.id];

    // Compute completion: all required doc types must be present OR manually signed off
    const allRequiredDocsUploaded =
      template.requiredDocTypes.length === 0 || fulfilledReqDocTypes.length === template.requiredDocTypes.length;

    const isCompleted = manualSignoff ? manualSignoff.completed : allRequiredDocsUploaded;

    let completionPercentage = 0;
    if (manualSignoff && manualSignoff.completed) {
      completionPercentage = 100;
    } else if (template.requiredDocTypes.length === 0) {
      completionPercentage = matchedDocs.length > 0 ? 100 : 0;
    } else {
      completionPercentage = Math.round((fulfilledReqDocTypes.length / template.requiredDocTypes.length) * 100);
    }

    // Determine status
    let status: MilestoneStatus = 'PENDING';
    if (isCompleted) {
      status = 'COMPLETED';
    } else if (hasDiscrepancy) {
      status = 'FLAGGED';
    } else if (fulfilledReqDocTypes.length > 0) {
      status = 'IN_PROGRESS';
    }

    // Find completion timestamp if available
    let completedAt: string | undefined = undefined;
    if (manualSignoff?.timestamp) {
      completedAt = manualSignoff.timestamp;
    } else if (isCompleted && matchedDocs.length > 0) {
      // Find latest upload date of matching docs
      const sortedDates = matchedDocs
        .map((d) => d.uploadDate)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      completedAt = sortedDates[0];
    }

    return {
      id: template.id,
      stage: template.stage,
      title: template.title,
      description: template.description,
      regulatoryClause: template.regulatoryClause,
      requiredDocTypes: template.requiredDocTypes,
      optionalDocTypes: template.optionalDocTypes,
      matchedDocuments: matchedDocs,
      status,
      isCompleted,
      completionPercentage,
      completedAt,
      unfulfilledDocTypes,
      manuallyCompleted: manualSignoff?.completed,
      manualNotes: manualSignoff?.notes,
      custom: template.id.startsWith('custom-'),
    };
  });

  // Calculate summary metrics
  const totalMilestones = evaluated.length;
  const completedMilestones = evaluated.filter((m) => m.isCompleted).length;
  const progressPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Total required document types across all milestones
  const allRequiredSet = new Set<DocumentType>();
  allTemplates.forEach((t) => t.requiredDocTypes.forEach((d) => allRequiredSet.add(d)));
  const totalRequiredDocTypes = allRequiredSet.size;

  const uploadedRequiredDocTypes = Array.from(allRequiredSet).filter((docType) =>
    projectDocs.some((d) => d.type === docType)
  ).length;

  const docFulfillmentPercentage =
    totalRequiredDocTypes > 0 ? Math.round((uploadedRequiredDocTypes / totalRequiredDocTypes) * 100) : 100;

  const flaggedIssuesCount = evaluated.filter((m) => m.status === 'FLAGGED').length;

  const summary: CertificationChecklistSummary = {
    totalMilestones,
    completedMilestones,
    progressPercentage,
    totalRequiredDocTypes,
    uploadedRequiredDocTypes,
    docFulfillmentPercentage,
    flaggedIssuesCount,
    allCompleted: completedMilestones === totalMilestones && totalMilestones > 0,
  };

  return {
    milestones: evaluated,
    summary,
  };
}

/**
 * Returns compliance readiness tier badge & description
 */
export function getComplianceReadinessBadge(progressPercentage: number): {
  label: string;
  badgeClass: string;
  textClass: string;
  description: string;
} {
  if (progressPercentage >= 100) {
    return {
      label: 'Surveyor & SIINas Ready (100%)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      textClass: 'text-emerald-700',
      description: 'All statutory dossier requirements and verification milestones are fully satisfied.',
    };
  }
  if (progressPercentage >= 75) {
    return {
      label: 'Field Audit Ready',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      textClass: 'text-blue-700',
      description: 'BOM, costing, and legal requirements met. Ready for surveyor on-site inspection.',
    };
  }
  if (progressPercentage >= 40) {
    return {
      label: 'Dossier Assembly in Progress',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      textClass: 'text-amber-700',
      description: 'Initial scoping and legal proofs collected; technical BOM and cost calculations pending.',
    };
  }
  return {
    label: 'Initial Scoping & Document Collection',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    textClass: 'text-slate-700',
    description: 'Awaiting essential client corporate licenses, NDA, and initial BOM submission.',
  };
}
