import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, Upload, Plus, ShieldCheck, 
  ShieldAlert, ChevronRight, Eye, Phone, Tag, Megaphone 
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { SendToAllCustomersModal } from '../components/SendToAllCustomersModal';

interface CustomerDatabaseProps {
  onOpenImport: () => void;
  onViewCustomer: (customerId: string) => void;
  currentShopId?: string;
}

export const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({
  onOpenImport,
  onViewCustomer,
  currentShopId
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('ALL');
  const [minPurchaseMonths, setMinPurchaseMonths] = useState('ALL');
  const [consent, setConsent] = useState('ALL');
  const [leadStatus, setLeadStatus] = useState('ALL');
  const [isSendAllOpen, setIsSendAllOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, brand, minPurchaseMonths, consent, leadStatus]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (brand !== 'ALL') params.brand = brand;
      if (minPurchaseMonths !== 'ALL') params.minPurchaseMonths = minPurchaseMonths;
      if (consent !== 'ALL') params.consent = consent;
      if (leadStatus !== 'ALL') params.leadStatus = leadStatus;

      const res = await api.get('/customers', params);
      setCustomers(res.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <span>Customer Database</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              {customers.length} records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cleaned and normalized customer profiles with verified WhatsApp marketing consent.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-send-to-all-customers"
            onClick={() => setIsSendAllOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition transform active:scale-95 border border-indigo-400/30"
            title="Launch broad announcement, new launch, or festival offer to all eligible customers"
          >
            <Megaphone className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>📣 SEND TO ALL CUSTOMERS</span>
          </button>

          <button
            onClick={onOpenImport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition"
          >
            <Upload className="h-4 w-4" />
            <span>Import Customers (CSV/XLSX)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="Search by name, phone, or model..."
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Brands</option>
              <option value="Samsung">Samsung</option>
              <option value="Apple">Apple</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="OnePlus">OnePlus</option>
              <option value="LG">LG</option>
              <option value="Voltas">Voltas</option>
            </select>
          </div>

          {/* Purchase Age Filter */}
          <div>
            <select
              value={minPurchaseMonths}
              onChange={(e) => setMinPurchaseMonths(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Any Purchase Date</option>
              <option value="12">Purchased &gt; 12 Mo Ago</option>
              <option value="18">Purchased &gt; 18 Mo Ago (Upgrade)</option>
              <option value="24">Purchased &gt; 24 Mo Ago</option>
            </select>
          </div>

          {/* Consent Filter */}
          <div>
            <select
              value={consent}
              onChange={(e) => setConsent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Consent Status</option>
              <option value="true">Marketing Consent = Yes</option>
              <option value="false">No Consent / DNC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Records Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">WhatsApp Number (+91)</th>
                <th className="p-3.5">Device / Model</th>
                <th className="p-3.5">Purchase Details</th>
                <th className="p-3.5">Marketing Consent</th>
                <th className="p-3.5">Lead Stage</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onViewCustomer(c.id)}
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span>{c.full_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{c.location || 'Kolkata'}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-slate-300 font-medium">{c.phone_e164}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-200">{c.brand} {c.model}</div>
                      <div className="text-[10px] text-slate-500">{c.product_category}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-300 font-mono">₹{Number(c.purchase_value || 0).toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-500">{c.purchase_date}</div>
                    </td>
                    <td className="p-3.5">
                      {c.whatsapp_opt_in ? (
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">Consent Confirmed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-rose-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">No Consent (Protected)</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.lead_status === 'ENGAGED' || c.lead_status === 'STORE_VISIT'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : c.lead_status === 'CONVERTED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.lead_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCustomer(c.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="View Customer 360"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No matching customers found. Try clearing filters or importing your spreadsheet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SendToAllCustomersModal
        isOpen={isSendAllOpen}
        onClose={() => setIsSendAllOpen(false)}
        onCampaignSent={fetchCustomers}
        currentShopId={currentShopId}
      />
    </div>
  );
};
