import React, { useState } from 'react';
import { Server, X, CheckCircle2, AlertCircle, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface ConnectBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const ConnectBackendModal: React.FC<ConnectBackendModalProps> = ({
  isOpen,
  onClose,
  onConnected
}) => {
  const [url, setUrl] = useState<string>(() => api.getRawBaseUrl() || '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleTestAndConnect = async (targetUrl?: string) => {
    const testUrl = (targetUrl !== undefined ? targetUrl : url).trim();
    setStatus('testing');
    setMessage('Testing connection to backend /health endpoint...');

    try {
      const ok = await api.pingBackend(testUrl);
      if (ok) {
        api.setCustomBaseUrl(testUrl);
        setStatus('success');
        setMessage('Successfully connected to live backend server!');
        setTimeout(() => {
          onConnected();
          onClose();
        }, 1200);
      } else {
        setStatus('failed');
        setMessage('Could not connect. Ensure your backend Web Service is running and HTTPS is enabled.');
      }
    } catch (err: any) {
      setStatus('failed');
      setMessage(err.message || 'Connection failed.');
    }
  };

  const handleReset = () => {
    api.setCustomBaseUrl('');
    setUrl('');
    setStatus('idle');
    setMessage('Reset to offline demo mode with seeded store data.');
    onConnected();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connect Live Backend</h3>
            <p className="text-xs text-slate-400">Sync real-time customer and campaign data</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          GitHub Pages is a static host. To enable live database reads, WhatsApp messaging, and AI replies, connect your deployed Render backend web service.
        </p>

        <div className="space-y-3 mb-5">
          <label className="block text-xs font-medium text-slate-300">
            Backend API Public URL:
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="url"
              placeholder="https://shopgrow-ai.onrender.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {status === 'testing' && (
            <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{message}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{message}</span>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex items-center space-x-2 text-xs text-rose-300 bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{message}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleTestAndConnect()}
            disabled={status === 'testing'}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 active:scale-98"
          >
            {status === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
            <span>Test & Connect Backend</span>
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-200 transition text-[11px]"
            >
              Reset to Demo Mode
            </button>
            <a
              href="https://dashboard.render.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 text-[11px]"
            >
              <span>Open Render Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};