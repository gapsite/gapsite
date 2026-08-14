import React from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { formatIDR } from '../utils/formatters';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { projects, dispositions } = useProjects();

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const headers = [
      'Project Code',
      'Client Name',
      'Product / Scope',
      'Company Type',
      'Service Type',
      'KBLI',
      'Stage',
      'Status',
      'Target TKDN %',
      'Verified / Projected TKDN %',
      'Contract Value (IDR)',
      'Surveyor Body',
      'Lead Consultant',
      'Start Date',
      'Target Completion Date',
    ];

    const rows = projects.map((p) => [
      `"${p.code}"`,
      `"${p.clientName}"`,
      `"${p.productOrServiceName}"`,
      `"${p.companyType}"`,
      `"${p.serviceType}"`,
      `"${p.kbliCode}"`,
      `"${p.stage}"`,
      `"${p.status}"`,
      p.targetTkdnPercentage,
      p.officialVerifiedTkdnPercentage || p.projectedTkdnPercentage,
      p.contractValueIDR,
      `"${p.surveyorBody}"`,
      `"${p.leadConsultantName}"`,
      `"${p.startDate}"`,
      `"${p.targetCompletionDate}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VERIX_TKDN_Projects_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ projects, dispositions, exportedAt: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VERIX_TKDN_CRM_Dossier_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Export Consulting Registry & Dossier</h3>
              <p className="text-xs text-slate-400">Download formatted reports for audits, client presentations, and SIINas compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Total Active Consulting Engagements:</span>
              <span className="font-mono text-emerald-700">{projects.length} Projects</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Total Open Job Dispositions:</span>
              <span className="font-mono text-amber-700">{dispositions.length} Tasks</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Total Managed Contract Value:</span>
              <span className="font-mono text-slate-900">
                {formatIDR(projects.reduce((acc, p) => acc + (p.contractValueIDR || 0), 0))}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* CSV Export Option */}
            <div
              onClick={handleExportCSV}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                    Export to Excel / CSV Spreadsheet (.csv)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Structured tabular export with KBLI codes, TKDN percentages, stage progression & contract values.
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
            </div>

            {/* JSON Export Option */}
            <div
              onClick={handleExportJSON}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                    Complete Database Dossier Backup (.json)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Full JSON dump including all client documents metadata, task checklists, and audit activity logs.
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-700" />
            </div>

            {/* Print / PDF Option */}
            <div
              onClick={handlePrint}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-800">
                    Print Executive Portfolio Report
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Formats current dashboard view for physical printing or Save as PDF.
                  </p>
                </div>
              </div>
              <Printer className="w-4 h-4 text-slate-400 group-hover:text-purple-700" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
