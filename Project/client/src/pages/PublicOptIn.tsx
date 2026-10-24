import React, { useEffect, useState } from 'react';
import { QrCode, Smartphone, ShieldCheck, CheckCircle2, Copy, Download, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';

export const PublicOptIn: React.FC = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const publicPageUrl = `${window.location.origin}/optin/saha-electronics`;

  useEffect(() => {
    generateQr();
  }, []);

  const generateQr = async () => {
    try {
      const url = await QRCode.toDataURL(publicPageUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff'
        }
      });
      setQrUrl(url);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      alert('Please check the consent box to proceed');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/public/optin/saha-electronics', {
        full_name: fullName,
        phone,
        consent
      });
      setSubmitted(true);
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <QrCode className="h-5 w-5 text-emerald-400" />
          <span>In-Store WhatsApp VIP Club & QR Standee</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Display this printable QR code on your store counter to collect verified marketing opt-ins from walk-in shoppers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Printable Counter QR Standee */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center text-center space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Counter Standee Preview
            </span>
            <h2 className="text-lg font-black text-white">
              Saha Electronics VIP Club
            </h2>
            <p className="text-xs text-slate-400">
              Scan to unlock spot festival exchange bonuses & 0% EMI alerts on WhatsApp!
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500">
            {qrUrl ? (
              <img src={qrUrl} alt="Store QR Code" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <p className="font-mono text-emerald-400">{publicPageUrl}</p>
            <p className="text-slate-500">142 Bipin Bihari Ganguly St, Bowbazar, Kolkata</p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => navigator.clipboard.writeText(publicPageUrl)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition border border-slate-700"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </button>

            {qrUrl && (
              <a
                href={qrUrl}
                download="saha_electronics_whatsapp_qr.png"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-emerald-600/30"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Print Standee</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Mobile Landing Page Live Preview */}
        <div className="bg-[#111b21] p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span>Customer Mobile View</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">/optin/saha-electronics</span>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <h3 className="font-bold text-white text-sm">
                  Get exclusive tech offers from Saha Electronics
                </h3>
                <p className="text-[11px] text-slate-400">
                  Receive festival discounts, exchange bonus vouchers, and EMI alerts directly on your WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Your Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Anirban Mukherjee"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">WhatsApp Mobile Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. 9830123456"
                  required
                />
              </div>

              {/* Mandatory explicit consent checkbox */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/30 flex items-start space-x-2.5">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="consentCheckbox" className="text-[11px] text-slate-300 leading-relaxed cursor-pointer">
                  I agree to receive personalized product offers, festival discounts, and order updates from <strong>Saha Electronics</strong> on WhatsApp. I can reply <strong>STOP</strong> at any time to opt out.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Join WhatsApp VIP Club'}
              </button>
            </form>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                You're in the Saha Electronics VIP Club!
              </h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Your WhatsApp marketing consent has been recorded securely in our compliance audit log.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFullName('');
                  setPhone('');
                }}
                className="text-xs text-emerald-400 hover:underline pt-2"
              >
                Test another submission
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
