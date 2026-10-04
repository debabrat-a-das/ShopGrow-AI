import React, { useState } from 'react';
import { 
  X, Send, RefreshCw, MessageSquare, Bot, AlertTriangle, 
  CheckCircle2, Sparkles, UserCheck, ShieldAlert, PhoneCall,
  Share2, Layers, Brain
} from 'lucide-react';
import { api } from '../services/api';

const FacebookIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

interface WhatsAppSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const WhatsAppSimulatorDrawer: React.FC<WhatsAppSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  // Simulator Mode: WhatsApp vs Social Leads
  const [activeMode, setActiveMode] = useState<'WHATSAPP' | 'SOCIAL'>('WHATSAPP');

  // WhatsApp state
  const [customerPhone, setCustomerPhone] = useState('+919830888111');
  const [messageText, setMessageText] = useState('Galaxy S24 er offer price koto?');

  // Social Leads state
  const [socialChannel, setSocialChannel] = useState<'FACEBOOK' | 'INSTAGRAM'>('FACEBOOK');
  const [authorName, setAuthorName] = useState('Rohan Mukherjee');
  const [commentText, setCommentText] = useState('Maharaja Teak Bed er price koto? 0% EMI option ache?');
  const [sourcePostId, setSourcePostId] = useState('fb_ad_teak_festival');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSimulateWhatsApp = async (customPhone?: string, customText?: string) => {
    setLoading(true);
    setResult(null);

    const phone = customPhone || customerPhone;
    const text = customText || messageText;

    try {
      const res = await api.post('/simulator/simulate-reply', {
        customerPhone: phone,
        messageText: text
      });
      setResult({ type: 'WHATSAPP', ...res.simulationResult });
      onRefreshData();
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSocialComment = async (customChannel?: any, customAuthor?: string, customComment?: string) => {
    setLoading(true);
    setResult(null);

    const ch = customChannel || socialChannel;
    const author = customAuthor || authorName;
    const comment = customComment || commentText;

    try {
      const res = await api.post('/social/simulate-comment', {
        channel: ch,
        authorName: author,
        commentText: comment,
        sourcePostId
      });
      setResult({ type: 'SOCIAL', ...res.result });
      onRefreshData();
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data to pristine initial state?')) return;
    setLoading(true);
    try {
      await api.post('/simulator/reset');
      setResult({ message: 'Demo shop re-seeded successfully!' });
      onRefreshData();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const whatsappScenarios = [
    {
      title: 'Memory 1: First Inbound (Unknown Name)',
      desc: 'First-time customer asks price without name. AI answers and politely asks name once.',
      phone: '+919830888111',
      text: 'Galaxy S24 er offer price koto?',
      badge: 'FIRST INQUIRY',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      title: 'Memory 2: Save Customer Name to CRM',
      desc: 'Customer states name: "Amar naam Suman Das". Saved to CRM profile; never asked again.',
      phone: '+919830888111',
      text: 'Amar naam Suman Das.',
      badge: 'SAVE NAME',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      title: 'Memory 3: Anaphora ("ওইটার অন্য colour আছে?")',
      desc: 'Customer refers to S24 using "ওইটার". AI resolves product context without asking which product.',
      phone: '+919830888111',
      text: 'ওইটার অন্য colour আছে? কাল আসবো দেখতে।',
      badge: 'NO REPEAT ASK',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      title: 'Memory 4: Location & Budget Memory',
      desc: 'Customer states location and budget. Saved into profile for future recommendations.',
      phone: '+919830888111',
      text: 'Ami Madhyamgram-e thaki, budget 35,000 - 40,000.',
      badge: 'BUDGET & LOC',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    {
      title: 'Memory 5: Identity Conflict Resolution',
      desc: 'Customer corrects name: "Ami Suman noi, ami Rajib". Profile updated in place without duplicate.',
      phone: '+919830888111',
      text: 'Ami Suman noi, ami Rajib.',
      badge: 'IDENTITY FIX',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      title: '6. Acceptance Criteria: Exchange + Visit (Hot Lead)',
      desc: 'Anirban asks to exchange old Galaxy M31 and says he will visit tomorrow.',
      phone: '+919830123456',
      text: 'Amar purono Galaxy M31 exchange hobe? Kal dokane aschi exchange korte.',
      badge: 'HOT LEAD TEST',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      title: '7. Opt-out / STOP Message (Safety Engine)',
      desc: 'Pooja sends STOP. Consent is revoked immediately.',
      phone: '+919830456789',
      text: 'STOP. Please do not send promotional messages.',
      badge: 'REVOKE CONSENT',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  ];

  const socialScenarios = [
    {
      title: '1. Facebook Ad Comment: Teak Bed Price & EMI',
      desc: 'Rohan comments on Facebook Ad for King Size Teak Bed inquiring about EMI.',
      channel: 'FACEBOOK',
      author: 'Rohan Mukherjee',
      text: 'Maharaja Teak Bed er price koto? 0% EMI option ache?',
      badge: 'FB AD LEAD',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    {
      title: '2. Instagram Reel Comment: Chesterfield L-Shape Sofa',
      desc: 'Sneha asks on Instagram post if showroom delivers to Salt Lake.',
      channel: 'INSTAGRAM',
      author: 'Sneha Sen',
      text: 'Do you deliver in Salt Lake? Can I see real customer showroom photos of the Chesterfield sofa?',
      badge: 'INSTAGRAM REEL',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    },
    {
      title: '3. FB Ad Comment: Mobile Exchange Inquiry',
      desc: 'Sourav comments on Facebook asking for exchange bonus on his old phone.',
      channel: 'FACEBOOK',
      author: 'Sourav Ganguly',
      text: 'Amar purono phone exchange korle extra bonus pabo? Dokan kothay?',
      badge: 'EXCHANGE QUERY',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Multi-Channel Simulator</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  Inbound Webhook Bus
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulate WhatsApp replies & Facebook/Instagram ad comments without real accounts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="px-5 pt-3 pb-0 bg-slate-900 flex space-x-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => { setActiveMode('WHATSAPP'); setResult(null); }}
            className={`pb-2.5 px-3 font-semibold flex items-center space-x-1.5 border-b-2 transition ${
              activeMode === 'WHATSAPP'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp Simulator</span>
          </button>

          <button
            onClick={() => { setActiveMode('SOCIAL'); setResult(null); }}
            className={`pb-2.5 px-3 font-semibold flex items-center space-x-1.5 border-b-2 transition ${
              activeMode === 'SOCIAL'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FacebookIcon className="h-3.5 w-3.5" />
            <span>Social Leads Simulator (FB/IG)</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeMode === 'WHATSAPP' ? (
            /* WhatsApp Section */
            <>
              {/* Quick Scenario Buttons */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  One-Click WhatsApp Acceptance Scenarios
                </div>
                <div className="space-y-2.5">
                  {whatsappScenarios.map((sc, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 transition cursor-pointer group"
                      onClick={() => {
                        setCustomerPhone(sc.phone);
                        setMessageText(sc.text);
                        handleSimulateWhatsApp(sc.phone, sc.text);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                          {sc.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                          {sc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{sc.desc}</p>
                      <div className="text-xs font-mono bg-slate-950/70 p-2 rounded text-emerald-300 border border-slate-800 truncate">
                        "{sc.text}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Message Sender */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Custom Inbound WhatsApp
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Customer E.164 Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="+919830123456"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Inbound Message Body</label>
                  <textarea
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Type customer reply..."
                  />
                </div>

                <button
                  onClick={() => handleSimulateWhatsApp()}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Emit WhatsApp Inbound Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Social Leads Section */
            <>
              {/* Quick Social Scenarios */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Simulate Social Ad Comments & DMs
                </div>
                <div className="space-y-2.5">
                  {socialScenarios.map((sc, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 transition cursor-pointer group"
                      onClick={() => {
                        setSocialChannel(sc.channel as any);
                        setAuthorName(sc.author);
                        setCommentText(sc.text);
                        handleSimulateSocialComment(sc.channel, sc.author, sc.text);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                          {sc.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                          {sc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{sc.desc}</p>
                      <div className="text-xs font-mono bg-slate-950/70 p-2 rounded text-blue-300 border border-slate-800 truncate">
                        "{sc.text}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Social Comment Sender */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Custom Social Ad Comment
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Platform Channel</label>
                    <select
                      value={socialChannel}
                      onChange={(e) => setSocialChannel(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="FACEBOOK">Facebook Post / Ad</option>
                      <option value="INSTAGRAM">Instagram Reel / Post</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Commenter Name</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      placeholder="e.g. Joydeep Saha"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Comment Text</label>
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="e.g. Delivery charge koto?"
                  />
                </div>

                <button
                  onClick={() => handleSimulateSocialComment()}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Emit Social Comment Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Simulation Output Result */}
          {result && (
            <div className="border-t border-slate-800 pt-5 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>AI Ingestion & Reply Output</span>
              </div>

              {result.type === 'SOCIAL' ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Channel / Author:</span>
                    <span className="font-bold text-white font-mono">{result.lead?.channel} • {result.lead?.author_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Classified Intent:</span>
                    <span className="font-bold font-mono text-emerald-400">{result.intent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interest Level:</span>
                    <span className="font-bold text-rose-400">{result.interestLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">WhatsApp Opt-in:</span>
                    <span className="font-bold text-amber-400">FALSE (Strict Consent Guard)</span>
                  </div>

                  {result.publicReply && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Public Post Reply:</span>
                      <p className="text-blue-300 italic bg-slate-900 p-2 rounded border border-blue-500/20">
                        "{result.publicReply}"
                      </p>
                    </div>
                  )}

                  {result.privateReply && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Private DM / VIP Invite Link:</span>
                      <p className="text-emerald-300 italic bg-slate-900 p-2 rounded border border-emerald-500/20">
                        "{result.privateReply}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Classified Intent:</span>
                    <span className="font-bold font-mono text-emerald-400">{result.intent || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interest Level:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      result.interestLevel === 'HOT' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {result.interestLevel || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lead Score:</span>
                    <span className="font-bold font-mono text-white">{result.leadScore ?? 'N/A'} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Needs Human Handoff:</span>
                    <span className={`font-bold ${result.needsHuman ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {result.needsHuman ? 'YES (Escalated)' : 'NO (AI Handled)'}
                    </span>
                  </div>

                  {result.dispatchedReply && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1 font-semibold">Grounded Outbound Auto-Reply:</span>
                      <p className="text-emerald-300 font-sans italic bg-slate-900 p-2.5 rounded border border-emerald-500/20">
                        "{result.dispatchedReply}"
                      </p>
                    </div>
                  )}

                  {/* Customer Memory Engine Inspector */}
                  {result.memoryContext && (
                    <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-900/90 -mx-4 -mb-4 p-4 rounded-b-xl border-t border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                          <Brain className="h-4 w-4" />
                          <span>Customer Memory (Ask Once → Save → Reuse)</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                          ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Customer Name:</span>
                          <span className="font-semibold text-white">
                            {result.memoryContext.is_name_known 
                              ? `✓ ${result.memoryContext.known_name}` 
                              : '❓ Unknown (Polite ask)'}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Active Product Context:</span>
                          <span className="font-semibold text-cyan-300 truncate block">
                            {result.memoryContext.last_discussed_product || 'None'}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Stored Location:</span>
                          <span className="font-semibold text-white">
                            {result.memoryContext.is_location_known 
                              ? `✓ ${result.memoryContext.known_location}` 
                              : 'Not set yet'}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Stored Budget:</span>
                          <span className="font-semibold text-white">
                            {result.memoryContext.is_budget_known 
                              ? `✓ ${result.memoryContext.known_budget}` 
                              : 'Not set yet'}
                          </span>
                        </div>
                      </div>

                      {result.memoryDelta?.anaphoricQueryDetected && (
                        <div className="text-[11px] bg-purple-500/10 text-purple-300 p-2 rounded border border-purple-500/20 flex items-center space-x-1.5">
                          <span>🔗</span>
                          <span>Anaphora Resolved: "ওইটার" linked to <strong>{result.memoryDelta.resolvedProductContext}</strong> without re-asking.</span>
                        </div>
                      )}

                      {result.memoryDelta?.isIdentityCorrection && (
                        <div className="text-[11px] bg-amber-500/10 text-amber-300 p-2 rounded border border-amber-500/20 flex items-center space-x-1.5">
                          <span>⚠️</span>
                          <span>Identity Conflict: Corrected name to <strong>{result.memoryDelta.extractedName}</strong> in place without duplicate record.</span>
                        </div>
                      )}

                      <div className="text-[10px] text-emerald-400/80 italic flex items-center space-x-1">
                        <span>🛡️</span>
                        <span>Zero repeated questions: Known profile attributes are reused automatically.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Demo Store</span>
          </button>
          <span className="text-[11px] text-slate-500">
            Real-time webhook bus
          </span>
        </div>
      </div>
    </div>
  );
};
