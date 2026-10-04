import React, { useState } from 'react';
import { 
  X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
  ArrowRight, ArrowLeft, RefreshCw, ShieldCheck, Database, Check 
} from 'lucide-react';
import { api } from '../services/api';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CustomerImportModal: React.FC<CustomerImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [commitResult, setCommitResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      const res = await api.uploadFile('/customers/import/preview', uploadedFile);
      setHeaders(res.headers);
      setMapping(res.suggestedMapping);
      setSummary(res.summary);
      setCurrentStep(2); // Move to Preview / Mapping
    } catch (err: any) {
      alert('Failed to parse file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const res = await api.uploadFile('/customers/import/commit', file, { mapping });
      setCommitResult(res);
      setCurrentStep(8); // Move to final Summary
      onImportComplete();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    '1. Upload File',
    '2. Preview Data',
    '3. Map Columns',
    '4. Phone Normalization (+91)',
    '5. Deduplication',
    '6. Invalid Checks',
    '7. Consent Audit',
    '8. Final Summary'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Customer Database</h2>
              <p className="text-xs text-slate-400">
                Supports Excel (.xlsx) and CSV files with Indian phone normalization & consent validation.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto">
          {steps.map((st, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div 
                key={idx} 
                className={`flex items-center space-x-1.5 whitespace-nowrap px-2 py-1 rounded ${
                  isCurrent ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent ? 'bg-emerald-500 text-slate-950 font-bold' : isCompleted ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="h-2.5 w-2.5" /> : stepNum}
                </span>
                <span>{st.split('. ')[1]}</span>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Upload */}
          {currentStep === 1 && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl bg-slate-950/40 p-8 transition cursor-pointer relative">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Drop your Excel (.xlsx) or CSV file here
              </h3>
              <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
                Import customer purchase logs, invoices, or Google Sheet exports.
              </p>
              <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                Browse Files
              </div>
              <div className="mt-6 text-[11px] text-slate-500">
                Sample files available in <code className="text-slate-400">demo-data/saha_electronics_customers.xlsx</code>
              </div>
            </div>
          )}

          {/* STEP 2 to 7: Mapping, Phone Normalization, Validation Preview */}
          {currentStep >= 2 && currentStep <= 7 && summary && (
            <div className="space-y-6">
              {/* Validation KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Rows</span>
                  <span className="text-lg font-bold text-white">{summary.totalRows}</span>
                </div>
                <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400 block">Valid Contacts</span>
                  <span className="text-lg font-bold text-emerald-300">{summary.validCount}</span>
                </div>
                <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/30">
                  <span className="text-[11px] text-amber-400 block">Duplicates Detected</span>
                  <span className="text-lg font-bold text-amber-300">{summary.duplicateCount}</span>
                </div>
                <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-500/30">
                  <span className="text-[11px] text-rose-400 block">Invalid Numbers</span>
                  <span className="text-lg font-bold text-rose-300">{summary.invalidPhoneCount}</span>
                </div>
                <div className="bg-purple-950/30 p-3 rounded-xl border border-purple-500/30">
                  <span className="text-[11px] text-purple-400 block">No Marketing Consent</span>
                  <span className="text-lg font-bold text-purple-300">{summary.noConsentCount}</span>
                </div>
              </div>

              {/* Column Mapping Selector */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Map Spreadsheet Columns to ShopGrow Fields
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Full Name *</label>
                    <select
                      value={mapping.fullName || ''}
                      onChange={(e) => setMapping({ ...mapping, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Mobile / WhatsApp Number *</label>
                    <select
                      value={mapping.phone || ''}
                      onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Device Brand</label>
                    <select
                      value={mapping.brand || ''}
                      onChange={(e) => setMapping({ ...mapping, brand: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="">(None)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Model Purchased</label>
                    <select
                      value={mapping.model || ''}
                      onChange={(e) => setMapping({ ...mapping, model: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="">(None)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Purchase Date</label>
                    <select
                      value={mapping.purchaseDate || ''}
                      onChange={(e) => setMapping({ ...mapping, purchaseDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="">(None)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Explicit WhatsApp Consent Field *</label>
                    <select
                      value={mapping.consent || ''}
                      onChange={(e) => setMapping({ ...mapping, consent: e.target.value })}
                      className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-2 text-white"
                    >
                      <option value="">(No explicit consent column)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Parsed Sample Preview (First {summary.previewRows?.length || 0} rows)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Automatic Indian E.164 (+91) Normalization
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Original Phone</th>
                        <th className="p-2.5">Normalized (+91)</th>
                        <th className="p-2.5">WhatsApp Consent</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {summary.previewRows?.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-medium text-white">{row.original[mapping.fullName] || 'Customer'}</td>
                          <td className="p-2.5 font-mono text-slate-400">{row.original[mapping.phone]}</td>
                          <td className="p-2.5 font-mono text-emerald-400">{row.normalizedPhone || '—'}</td>
                          <td className="p-2.5">
                            {row.hasConsent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Opt-in Confirmed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                No Consent Audit
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {row.status === 'VALID' && (
                              <span className="text-[10px] text-emerald-400 font-bold">READY</span>
                            )}
                            {row.status === 'DUPLICATE' && (
                              <span className="text-[10px] text-amber-400 font-bold">DUPLICATE</span>
                            )}
                            {row.status === 'INVALID_PHONE' && (
                              <span className="text-[10px] text-rose-400 font-bold">INVALID PHONE</span>
                            )}
                            {row.status === 'NO_CONSENT_AUDIT' && (
                              <span className="text-[10px] text-purple-400 font-bold">SAVED (NO OUTBOUND)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Final Summary / Completed */}
          {currentStep === 8 && commitResult && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Customer Database Imported Successfully!
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Added <strong className="text-emerald-400 font-mono">{commitResult.importedCount}</strong> verified customer profiles to Saha Electronics.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs w-full max-w-md space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Uploaded:</span>
                  <span className="font-bold text-white font-mono">{commitResult.summary.totalRows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Successfully Imported:</span>
                  <span className="font-bold text-emerald-400 font-mono">{commitResult.importedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duplicates Skipped:</span>
                  <span className="font-bold text-amber-400 font-mono">{commitResult.summary.duplicateCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invalid Numbers Skipped:</span>
                  <span className="font-bold text-rose-400 font-mono">{commitResult.summary.invalidPhoneCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Without Marketing Consent:</span>
                  <span className="font-bold text-purple-400 font-mono">{commitResult.summary.noConsentCount} (Protected from campaigns)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition"
              >
                Close & View Customers
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {currentStep >= 2 && currentStep < 8 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back / Re-upload</span>
            </button>

            <button
              onClick={handleCommit}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Commit Import to Database</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
