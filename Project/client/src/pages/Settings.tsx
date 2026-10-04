import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, Store, Radio, Clock, ShieldCheck, HelpCircle, Save, CheckCircle2,
  Share2, RefreshCw, Unlink, ExternalLink, Zap, AlertCircle, CheckCircle, Smartphone,
  Layers, MessageSquare, Megaphone, FileSpreadsheet, Eye, Palette, Image as ImageIcon,
  Upload, RotateCcw, Trash2, Sliders, Info, X
} from 'lucide-react';
import { api } from '../services/api';
import { 
  MetaSocialIntegrationSettings, MetaIntegrationCard, MetaSocialChannel,
  ShopBranding, BrandingBackgroundType, BrandingDisplayOption, BrandingOverlayType
} from '../types';

export const Settings: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // URL tab check
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as any) || 'whatsapp';
  
  const [activeTab, setActiveTab] = useState<'profile' | 'whatsapp' | 'meta-social' | 'limits' | 'faqs' | 'branding'>(initialTab);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Branding state (Default White / Clean Light Theme: #FFFFFF)
  const [bgType, setBgType] = useState<BrandingBackgroundType>('DEFAULT_WHITE');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [bgImageUrl, setBgImageUrl] = useState<string>('');
  const [bgDisplay, setBgDisplay] = useState<BrandingDisplayOption>('cover');
  const [overlayType, setOverlayType] = useState<BrandingOverlayType>('NONE');
  const [overlayStrength, setOverlayStrength] = useState<number>(20);
  const [brandingSaving, setBrandingSaving] = useState<boolean>(false);

  // Meta Social state & Details Modal
  const [metaSettings, setMetaSettings] = useState<MetaSocialIntegrationSettings | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [channelTestResults, setChannelTestResults] = useState<Record<string, any>>({});
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<MetaIntegrationCard | null>(null);

  // Form states
  const [provider, setProvider] = useState('MOCK');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const [dailyLimit, setDailyLimit] = useState(500);
  const [frequencyDays, setFrequencyDays] = useState(14);
  const [quietStart, setQuietStart] = useState('21:00:00');
  const [quietEnd, setQuietEnd] = useState('09:00:00');

  useEffect(() => {
    fetchSettings();
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const res = await api.get('/settings/branding');
      if (res && res.success && res.branding) {
        setBgType(res.branding.bg_type || 'DEFAULT_WHITE');
        setBgColor(res.branding.bg_color || '#FFFFFF');
        setBgImageUrl(res.branding.bg_image_url || '');
        setBgDisplay(res.branding.bg_display || 'cover');
        setOverlayType(res.branding.overlay_type || 'NONE');
        setOverlayStrength(res.branding.overlay_strength || 20);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingSaving(true);
    try {
      await api.post('/settings/branding', {
        bg_type: bgType,
        bg_color: bgColor,
        bg_image_url: bgImageUrl,
        bg_display: bgDisplay,
        overlay_type: overlayType,
        overlay_strength: overlayStrength
      });
      triggerSaved();
      // Dispatch custom event to notify App.tsx to update workspace background live
      window.dispatchEvent(new Event('shop-branding-updated'));
    } catch (err: any) {
      alert('Failed to save branding: ' + err.message);
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleResetBranding = async () => {
    setBgType('DEFAULT_WHITE');
    setBgColor('#FFFFFF');
    setBgImageUrl('');
    setBgDisplay('cover');
    setOverlayType('NONE');
    setOverlayStrength(0);
    try {
      await api.post('/settings/branding', {
        bg_type: 'DEFAULT_WHITE',
        bg_color: '#FFFFFF',
        bg_image_url: '',
        bg_display: 'cover',
        overlay_type: 'NONE',
        overlay_strength: 0
      });
      triggerSaved();
      window.dispatchEvent(new Event('shop-branding-updated'));
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      alert('Only JPG, JPEG, PNG, or WEBP image files are allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBgImageUrl(event.target.result as string);
        setBgType('CUSTOM_IMAGE');
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setData(res);
      if (res.integration) {
        setProvider(res.integration.provider || 'MOCK');
        setPhoneNumberId(res.integration.phone_number_id || '');
        setWabaId(res.integration.waba_id || '');
        setAccessToken(res.integration.access_token || '');
        setWebhookSecret(res.integration.webhook_secret || '');
      }
      if (res.settings) {
        setDailyLimit(res.settings.daily_campaign_limit || 500);
        setFrequencyDays(res.settings.contact_frequency_days || 14);
        setQuietStart(res.settings.quiet_hours_start || '21:00:00');
        setQuietEnd(res.settings.quiet_hours_end || '09:00:00');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaSettings = async () => {
    setMetaLoading(true);
    try {
      const res = await api.get('/meta-integrations');
      if (res && res.success) {
        setMetaSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load Meta integrations:', err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'meta-social') {
      fetchMetaSettings();
    }
  }, [activeTab]);

  const handleTestMetaConnection = async (channel: MetaSocialChannel) => {
    setTestingChannel(channel);
    try {
      const res = await api.post(`/meta-integrations/${channel}/test`, {});
      if (res && res.success) {
        setChannelTestResults(prev => ({ ...prev, [channel]: res.data }));
      }
      fetchMetaSettings();
    } catch (err: any) {
      setChannelTestResults(prev => ({
        ...prev,
        [channel]: { success: false, message: 'Test failed: ' + err.message }
      }));
    } finally {
      setTestingChannel(null);
    }
  };

  const handleDisconnectMeta = async (channel: MetaSocialChannel) => {
    try {
      await api.post(`/meta-integrations/${channel}/disconnect`, {});
      setChannelTestResults(prev => {
        const copy = { ...prev };
        delete copy[channel];
        return copy;
      });
      fetchMetaSettings();
      triggerSaved();
    } catch (err: any) {
      alert('Failed to disconnect: ' + err.message);
    }
  };

  const handleReconnectMeta = async (channel: MetaSocialChannel, mode: 'MOCK_MODE' | 'LIVE_CONNECTED' = 'MOCK_MODE') => {
    try {
      await api.post(`/meta-integrations/${channel}/reconnect`, { mode });
      fetchMetaSettings();
      triggerSaved();
    } catch (err: any) {
      alert('Failed to reconnect: ' + err.message);
    }
  };

  const handleConnectWithMeta = async (channel: MetaSocialChannel) => {
    try {
      await api.get(`/meta-integrations/oauth-start/${channel}`);
      handleReconnectMeta(channel, 'LIVE_CONNECTED');
    } catch (err: any) {
      alert('OAuth initialization failed: ' + err.message);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/whatsapp', {
        provider,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        access_token: accessToken,
        webhook_secret: webhookSecret
      });
      triggerSaved();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/limits', {
        daily_campaign_limit: dailyLimit,
        contact_frequency_days: frequencyDays,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd
      });
      triggerSaved();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    }
  };

  const triggerSaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    fetchSettings();
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading shop settings...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <SettingsIcon className="h-5 w-5 text-emerald-400" />
          <span>Shop & Platform Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure Meta WhatsApp Cloud API credentials, campaign safety guardrails, and store FAQs.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          WhatsApp Integration
        </button>
        <button
          onClick={() => setActiveTab('meta-social')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'meta-social'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Meta Social (FB & IG)</span>
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'branding'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Branding & Background</span>
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === 'limits'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Campaign Limits & Quiet Hours
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === 'faqs'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          AI Grounding Knowledge Bank (FAQs)
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Shop Profile & Team
        </button>
      </div>

      {/* WhatsApp Integration Tab */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveWhatsApp} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Radio className="h-4 w-4 text-emerald-400" />
                <span>Meta WhatsApp Business Platform / Cloud API</span>
              </h2>
              <p className="text-slate-400 mt-0.5">
                Switch between Interactive Mock Provider (for demo without Meta API setup) and Live Meta Cloud API.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Status: {data.integration?.status}
            </span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Provider Engine</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-2 ${
                provider === 'MOCK' ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="MOCK"
                  checked={provider === 'MOCK'}
                  onChange={() => setProvider('MOCK')}
                  className="hidden"
                />
                <span className="font-bold">Mock WhatsApp Provider</span>
                <span className="text-[10px] text-slate-500 block">(Instant local testing)</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-2 ${
                provider === 'META_CLOUD_API' ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="META_CLOUD_API"
                  checked={provider === 'META_CLOUD_API'}
                  onChange={() => setProvider('META_CLOUD_API')}
                  className="hidden"
                />
                <span className="font-bold">Live Meta Cloud API</span>
                <span className="text-[10px] text-slate-500 block">(Official production)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Meta Phone Number ID</label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                placeholder="e.g. 109823485764832"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">WhatsApp Business Account ID (WABA ID)</label>
              <input
                type="text"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                placeholder="e.g. 928374619283746"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">System User Permanent Access Token</label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              placeholder="EAAG..."
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Webhook Verify Token / Secret</label>
            <input
              type="text"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              placeholder="shopgrow_whsec_saha_2026"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Configure this in your Meta App Dashboard under WhatsApp &gt; Configuration &gt; Webhook Callback URL: <code className="text-emerald-400">{window.location.origin}/api/webhooks/whatsapp</code>
            </span>
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Save className="h-4 w-4" />
            <span>Save WhatsApp Configuration</span>
          </button>
        </form>
      )}

      {/* Meta Social Integration Tab */}
      {activeTab === 'meta-social' && (
        <div className="space-y-6 text-xs">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 p-5 rounded-2xl border border-blue-500/20 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Share2 className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-bold text-white">Meta Social & Business Graph Architecture</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Graph API v19.0 Active
                </span>
              </div>
              <p className="text-slate-400 text-xs max-w-2xl">
                Connect Facebook Pages, Instagram Professional Accounts, Meta Ad Accounts, and Lead Forms.
                Inbound comments & lead ads are automatically ingested, scored by AI, and protected by strict idempotency deduplication.
              </p>
            </div>
            <button
              onClick={fetchMetaSettings}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center space-x-1.5 border border-slate-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${metaLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* 5 Connection Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { 
                key: 'facebook_page', 
                card: metaSettings?.facebook_page, 
                badgeColor: 'text-blue-400', 
                border: 'border-blue-500/30',
                iconSvg: (
                  <svg className="h-5 w-5 fill-blue-400" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )
              },
              { 
                key: 'instagram_account', 
                card: metaSettings?.instagram_account, 
                badgeColor: 'text-pink-400', 
                border: 'border-pink-500/30',
                iconSvg: (
                  <svg className="h-5 w-5 text-pink-400 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                )
              },
              { 
                key: 'meta_ad_account', 
                card: metaSettings?.meta_ad_account, 
                badgeColor: 'text-emerald-400', 
                border: 'border-emerald-500/30',
                iconSvg: <Megaphone className="h-5 w-5 text-emerald-400" />
              },
              { 
                key: 'meta_lead_forms', 
                card: metaSettings?.meta_lead_forms, 
                badgeColor: 'text-purple-400', 
                border: 'border-purple-500/30',
                iconSvg: <FileSpreadsheet className="h-5 w-5 text-purple-400" />
              },
              { 
                key: 'messenger', 
                card: metaSettings?.messenger, 
                badgeColor: 'text-cyan-400', 
                border: 'border-cyan-500/30',
                iconSvg: <MessageSquare className="h-5 w-5 text-cyan-400" />
              },
            ].map(({ key, card, badgeColor, border, iconSvg }) => {
              if (!card) return null;
              const isConnected = card.status === 'LIVE_CONNECTED';
              const isMock = card.status === 'MOCK_MODE';
              const isTesting = testingChannel === card.channel;
              const testResult = channelTestResults[card.channel];

              return (
                <div key={card.channel} className={`bg-slate-900/95 p-5 rounded-2xl border ${border} space-y-4 shadow-xl flex flex-col justify-between`}>
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                          {iconSvg}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{card.title}</h3>
                          <p className="text-[11px] text-slate-400">{card.description}</p>
                        </div>
                      </div>
                      <div>
                        {isConnected && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                            LIVE_CONNECTED
                          </span>
                        )}
                        {isMock && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                            MOCK META — NOT LIVE
                          </span>
                        )}
                        {!isConnected && !isMock && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                            NOT CONNECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Connected Account:</span>
                        <span className="font-semibold text-white truncate max-w-[200px] text-right">
                          {card.account_name || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Account ID:</span>
                        <span className="font-mono text-slate-300 text-[10px]">{card.account_id || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Token Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          card.token_status === 'VALID' ? 'bg-emerald-500/20 text-emerald-300' :
                          card.token_status === 'MOCK_VALID' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {card.token_status === 'MOCK_VALID' ? 'MOCK_TOKEN' : card.token_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Webhook Status:</span>
                        <span className="flex items-center space-x-1 font-semibold">
                          <span className={`w-2 h-2 rounded-full ${card.webhook_status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className={card.webhook_status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}>
                            {card.webhook_status}
                          </span>
                        </span>
                      </div>
                      {card.last_event_at && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Last Event Ingested:</span>
                          <span className="text-slate-400 text-[10px]">{new Date(card.last_event_at).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Permissions list */}
                    {card.permissions && card.permissions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Granted Scopes</span>
                        <div className="flex flex-wrap gap-1">
                          {card.permissions.map(p => (
                            <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Health Test Result Banner */}
                    {testResult && (
                      <div className={`p-2.5 rounded-xl border text-[11px] flex items-start space-x-2 ${
                        testResult.success 
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                          : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                      }`}>
                        {testResult.success ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />}
                        <div className="space-y-0.5">
                          <p className="font-semibold">{testResult.message}</p>
                          {testResult.latency_ms !== undefined && (
                            <span className="text-[10px] text-slate-400">Response Latency: {testResult.latency_ms}ms</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Exact Requested UI */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTestMetaConnection(card.channel)}
                        disabled={isTesting}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center space-x-1.5 transition text-[11px] disabled:opacity-50"
                      >
                        <Zap className={`h-3 w-3 text-amber-400 ${isTesting ? 'animate-bounce' : ''}`} />
                        <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCardForDetails(card)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white font-medium flex items-center space-x-1 transition text-[11px] border border-slate-700/60"
                      >
                        <Eye className="h-3 w-3 text-slate-400" />
                        <span>View Page Details</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {card.status !== 'NOT_CONNECTED' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReconnectMeta(card.channel, card.status === 'LIVE_CONNECTED' ? 'LIVE_CONNECTED' : 'MOCK_MODE')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition text-[11px] border border-slate-700"
                          >
                            Reconnect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDisconnectMeta(card.channel)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium flex items-center space-x-1 transition text-[11px] border border-rose-500/20"
                          >
                            <Unlink className="h-3 w-3" />
                            <span>Disconnect</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleReconnectMeta(card.channel, 'MOCK_MODE')}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium transition text-[11px] border border-amber-500/30"
                          >
                            Mock Connect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConnectWithMeta(card.channel)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1 transition text-[11px] shadow-md shadow-blue-500/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>
                              {card.channel === 'FACEBOOK_PAGE' && 'Connect Facebook Page'}
                              {card.channel === 'INSTAGRAM' && 'Connect Instagram'}
                              {card.channel === 'AD_ACCOUNT' && 'Connect Ad Account'}
                              {card.channel !== 'FACEBOOK_PAGE' && card.channel !== 'INSTAGRAM' && card.channel !== 'AD_ACCOUNT' && 'Connect with Meta'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign Limits Tab */}
      {activeTab === 'limits' && (
        <form onSubmit={handleSaveLimits} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Anti-Spam & Contact Frequency Rules</span>
            </h2>
            <p className="text-slate-400 mt-0.5">
              Strict rules to prevent over-messaging customers and protect your WhatsApp phone number quality rating.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Daily Outbound Campaign Limit</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Maximum messages permitted per day for this shop.</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Customer Contact Frequency Cooldown (Days)</label>
              <input
                type="number"
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Never message the same customer again within X days.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Quiet Hours Start (Evening)</label>
              <input
                type="text"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">e.g. 21:00:00 (9:00 PM IST)</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Quiet Hours End (Morning)</label>
              <input
                type="text"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">e.g. 09:00:00 (9:00 AM IST)</span>
            </div>
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Save className="h-4 w-4" />
            <span>Save Safety Guardrails</span>
          </button>
        </form>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              <span>Grounded Knowledge Base (Anti-Hallucination FAQs)</span>
            </h2>
            <p className="text-slate-400 mt-0.5">
              The AI conversation agent is strictly confined to these verified store facts.
            </p>
          </div>

          <div className="space-y-3">
            {data.settings?.faqs?.map((faq: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400">Q: {faq.q}</div>
                <div className="text-slate-300">A: {faq.a}</div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 border border-purple-500/30 rounded-xl text-purple-300 space-y-1">
            <span className="font-bold block">Strict AI Safety Policy:</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {data.settings?.ai_guardrails}
            </p>
          </div>
        </div>
      )}

      {/* Shop Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Store className="h-4 w-4 text-emerald-400" />
              <span>Shop Profile & Team Members</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-white block mb-1">Store Details</span>
              <div><span className="text-slate-500">Name:</span> <span className="text-white font-medium">{data.shop?.name}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="text-white font-mono">{data.shop?.phone}</span></div>
              <div><span className="text-slate-500">Address:</span> <span className="text-white">{data.shop?.address}, {data.shop?.city}</span></div>
              <div><span className="text-slate-500">Hours:</span> <span className="text-emerald-400">{data.shop?.business_hours}</span></div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-white block mb-1">Assigned Team Roles</span>
              {data.team?.map((member: any) => (
                <div key={member.id} className="flex justify-between items-center py-1 border-b border-slate-900 last:border-0">
                  <div>
                    <span className="font-medium text-white">{member.full_name}</span>
                    <span className="text-slate-500 text-[10px] block">{member.email}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Branding & Theme Customization Tab (White Clean Default + Custom Options) */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Palette className="h-4 w-4 text-purple-400" />
                <span>Shop Workspace Branding & Background Customization</span>
              </h2>
              <p className="text-slate-400 mt-0.5">
                Default application background is clean white (#FFFFFF). Customize your own shop workspace. Tenant-isolated: changes never affect other shops.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetBranding}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center space-x-1.5 transition text-[11px] border border-slate-700"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Default White</span>
            </button>
          </div>

          {/* Readability Guarantee Banner */}
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 flex items-start space-x-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
            <div className="space-y-0.5 text-[11px]">
              <span className="font-bold text-white">Dashboard Readability Guarantee:</span>
              <p className="text-slate-300">
                All business-critical dashboard cards, tables, forms, and buttons are designed with high-contrast surfaces. Your data and KPIs will remain crisp, legible, and easy to read even with photographic backgrounds.
              </p>
            </div>
          </div>

          {/* Background Mode Selection */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Background Style Option
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                onClick={() => setBgType('DEFAULT_WHITE')}
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-2 transition ${
                  bgType === 'DEFAULT_WHITE'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Default White Theme</span>
                  <div className="w-5 h-5 rounded-full border border-slate-300 bg-white shadow-sm" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Clean, modern minimalist light theme (#FFFFFF). Recommended default.
                </p>
              </label>

              <label
                onClick={() => setBgType('CUSTOM_COLOR')}
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-2 transition ${
                  bgType === 'CUSTOM_COLOR'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Custom Brand Color</span>
                  <div 
                    className="w-5 h-5 rounded-full border border-slate-600 shadow-sm" 
                    style={{ backgroundColor: bgColor || '#FFFFFF' }} 
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Select a bespoke solid or pastel brand color code for this shop.
                </p>
              </label>

              <label
                onClick={() => setBgType('CUSTOM_IMAGE')}
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-2 transition ${
                  bgType === 'CUSTOM_IMAGE'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Custom Image Wallpaper</span>
                  <ImageIcon className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload showroom photography, store banner, or patterned wallpaper.
                </p>
              </label>
            </div>
          </div>

          {/* Conditional Options: Custom Color */}
          {bgType === 'CUSTOM_COLOR' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-slate-300 font-semibold text-[11px]">Select Workspace Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-16 bg-transparent cursor-pointer rounded-lg border border-slate-700 p-0.5"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs w-32"
                />
                <span className="text-[11px] text-slate-400">Hexadecimal color code</span>
              </div>

              {/* Quick Swatches */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Quick Presets</span>
                <div className="flex items-center space-x-2">
                  {[
                    { name: 'Pure White', hex: '#FFFFFF' },
                    { name: 'Warm Cream', hex: '#FFFBEB' },
                    { name: 'Soft Gray', hex: '#F1F5F9' },
                    { name: 'Mint Ice', hex: '#F0FDF4' },
                    { name: 'Sky Calm', hex: '#F0F9FF' },
                    { name: 'Deep Midnight', hex: '#0B0F19' }
                  ].map(swatch => (
                    <button
                      type="button"
                      key={swatch.hex}
                      onClick={() => setBgColor(swatch.hex)}
                      className="px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] flex items-center space-x-1.5 hover:border-slate-600 transition"
                      style={{ backgroundColor: swatch.hex === '#FFFFFF' ? '#F8FAFC' : swatch.hex, color: swatch.hex === '#0B0F19' ? '#FFF' : '#000' }}
                    >
                      <span className="font-semibold">{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conditional Options: Custom Image */}
          {bgType === 'CUSTOM_IMAGE' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold text-[11px]">Upload Image (JPG, JPEG, PNG, WEBP)</label>
                <div className="flex items-center space-x-3">
                  <label className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer flex items-center space-x-2 transition shadow-md shadow-purple-600/20">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                  {bgImageUrl && (
                    <button
                      type="button"
                      onClick={() => setBgImageUrl('')}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold flex items-center space-x-1.5 transition border border-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Direct URL input fallback */}
              <div className="space-y-1">
                <label className="block text-slate-400 text-[10px]">Or Provide Image URL</label>
                <input
                  type="url"
                  value={bgImageUrl}
                  onChange={(e) => setBgImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs"
                />
              </div>

              {/* Preset Image Options */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Showcase Presets</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgImageUrl('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition"
                  >
                    <div className="font-bold text-amber-300">Royal Teak Showroom</div>
                    <div className="text-[10px] text-slate-400">Warm luxury teak furniture lounge</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgImageUrl('https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition"
                  >
                    <div className="font-bold text-blue-300">Saha Electronics Studio</div>
                    <div className="text-[10px] text-slate-400">Clean high-tech gadgets & smartphones</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgImageUrl('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition"
                  >
                    <div className="font-bold text-emerald-300">Minimalist Studio</div>
                    <div className="text-[10px] text-slate-400">Subtle texture & neutral elegance</div>
                  </button>
                </div>
              </div>

              {/* Display & Overlay Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-900">
                {/* Display Mode */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-[11px]">Display Mode</label>
                  <select
                    value={bgDisplay}
                    onChange={(e) => setBgDisplay(e.target.value as BrandingDisplayOption)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-medium"
                  >
                    <option value="cover">Cover (Fill Screen)</option>
                    <option value="contain">Contain (Fit Screen)</option>
                    <option value="center">Center Wallpaper</option>
                    <option value="top">Top Aligned</option>
                    <option value="no-repeat">No Repeat</option>
                  </select>
                </div>

                {/* Overlay Type */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-[11px]">Readability Overlay</label>
                  <select
                    value={overlayType}
                    onChange={(e) => setOverlayType(e.target.value as BrandingOverlayType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-medium"
                  >
                    <option value="NONE">None (Raw Image)</option>
                    <option value="LIGHT">Light Overlay (White Wash)</option>
                    <option value="DARK">Dark Overlay (Slate Wash)</option>
                  </select>
                </div>

                {/* Overlay Strength */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-medium text-[11px]">Overlay Strength</label>
                    <span className="font-mono text-purple-400 text-[10px]">{overlayStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={overlayStrength}
                    onChange={(e) => setOverlayStrength(Number(e.target.value))}
                    disabled={overlayType === 'NONE'}
                    className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Live Workspace Preview</span>
            <div 
              className="h-32 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: bgType === 'CUSTOM_COLOR' ? bgColor : bgType === 'DEFAULT_WHITE' ? '#FFFFFF' : '#0B0F19',
                backgroundImage: bgType === 'CUSTOM_IMAGE' && bgImageUrl ? `url(${bgImageUrl})` : undefined,
                backgroundSize: bgDisplay === 'contain' ? 'contain' : 'cover',
                backgroundPosition: bgDisplay === 'top' ? 'top' : 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {bgType === 'CUSTOM_IMAGE' && overlayType !== 'NONE' && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: overlayType === 'LIGHT' ? '#FFFFFF' : '#000000',
                    opacity: overlayStrength / 100
                  }}
                />
              )}
              {/* Elevated Card Surface Preview */}
              <div className="relative z-10 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-3 shadow-lg flex items-center space-x-3 text-white">
                <Store className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">{data.shop?.name || 'Saha Electronics'}</div>
                  <div className="text-[10px] text-slate-400">High-Contrast Surface • 100% Legibility Guaranteed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="submit"
              disabled={brandingSaving}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{brandingSaving ? 'Saving...' : 'Save Branding Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* View Page Details Modal */}
      {selectedCardForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedCardForDetails.title} Details</h3>
                  <p className="text-[11px] text-slate-400">{selectedCardForDetails.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account / Page Name:</span>
                  <span className="font-bold text-white">{selectedCardForDetails.account_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account / Page ID:</span>
                  <span className="font-mono text-emerald-400">{selectedCardForDetails.account_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Real Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedCardForDetails.status === 'LIVE_CONNECTED' ? 'bg-emerald-500/20 text-emerald-300' :
                    selectedCardForDetails.status === 'MOCK_MODE' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    {selectedCardForDetails.status === 'MOCK_MODE' ? 'MOCK META — NOT LIVE' : selectedCardForDetails.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Token Status:</span>
                  <span className="font-mono text-slate-300">{selectedCardForDetails.token_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Webhook Status:</span>
                  <span className="font-semibold text-emerald-400">{selectedCardForDetails.webhook_status}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 text-[11px]">Webhook Endpoint:</span>
                <code className="block p-2 bg-slate-950 rounded-lg text-[10px] text-purple-300 font-mono break-all">
                  {window.location.origin}/api/webhooks/meta
                </code>
              </div>

              {selectedCardForDetails.permissions && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400 text-[11px]">Approved Scopes:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCardForDetails.permissions.map(p => (
                      <span key={p} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCardForDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
