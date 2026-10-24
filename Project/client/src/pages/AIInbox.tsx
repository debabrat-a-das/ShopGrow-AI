import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MessageSquare, UserCheck, Bot, CheckCircle2, 
  Send, RefreshCw, AlertCircle, Flame, 
  IndianRupee, Share2, Check, Sparkles, ShieldAlert,
  Globe, CheckCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Conversation, Message, LeadChannel } from '../types';

interface AIInboxProps {
  initialTab?: string;
  initialCustomerPhone?: string;
  onRecordSale: (customer: any) => void;
  onViewCustomer: (customerId: string) => void;
}

// Mini SVG Brand Icons for pristine channel fidelity
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const AIInbox: React.FC<AIInboxProps> = ({
  initialTab = 'all',
  initialCustomerPhone,
  onRecordSale,
  onViewCustomer
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [currentStatusTab, setCurrentStatusTab] = useState<string>(initialTab);
  const [currentChannelFilter, setCurrentChannelFilter] = useState<string>('ALL');
  const [activeThread, setActiveThread] = useState<any>(null);
  const [manualReply, setManualReply] = useState<string>('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [currentStatusTab]);

  useEffect(() => {
    if (selectedConvId) {
      fetchThread(selectedConvId);
      setInviteSent(false);
    }
  }, [selectedConvId]);

  const fetchConversations = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/conversations', { tab: currentStatusTab });
      const convList: Conversation[] = Array.isArray(res)
        ? res
        : (Array.isArray(res?.conversations) ? res.conversations : []);
      setConversations(convList);

      if (convList.length > 0) {
        if (initialCustomerPhone) {
          const match = convList.find((c: Conversation) => c.customer_phone === initialCustomerPhone);
          if (match) {
            setSelectedConvId(match.id);
            return;
          }
        }
        if (!selectedConvId || !convList.some((c: Conversation) => c.id === selectedConvId)) {
          setSelectedConvId(convList[0].id);
        }
      } else {
        setSelectedConvId('');
        setActiveThread(null);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchThread = async (id: string) => {
    setLoadingThread(true);
    try {
      const res = await api.get(`/conversations/${id}`);
      if (res && res.conversation) {
        setActiveThread({
          conversation: res.conversation,
          messages: Array.isArray(res.messages) ? res.messages : [],
          customer: res.customer || null,
          lead: res.lead || null,
          shop: res.shop || null,
          offers: Array.isArray(res.offers) ? res.offers : []
        });
      } else if (res && (res.id || res.customer_name)) {
        setActiveThread({
          conversation: res,
          messages: Array.isArray(res.messages) ? res.messages : [],
          customer: res.customer || null,
          lead: null,
          shop: null,
          offers: []
        });
      } else {
        const fallbackConv = (Array.isArray(conversations) ? conversations : []).find(c => c.id === id);
        if (fallbackConv) {
          setActiveThread({
            conversation: fallbackConv,
            messages: [],
            customer: null,
            lead: null,
            shop: null,
            offers: []
          });
        } else {
          setActiveThread(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversation thread:', err);
      setActiveThread(null);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSendReply = async (replyText?: string, isAi?: boolean) => {
    const textToSend = replyText || manualReply;
    if (!selectedConvId || !textToSend.trim()) return;

    setSending(true);
    try {
      await api.post(`/conversations/${selectedConvId}/reply`, {
        text: textToSend,
        isAiGenerated: !!isAi
      });
      setManualReply('');
      fetchThread(selectedConvId);
      fetchConversations();
    } catch (err: any) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedConvId || !activeThread?.conversation) return;
    try {
      await api.post(`/conversations/${selectedConvId}/takeover`, {
        is_human_takeover: !activeThread.conversation.is_human_takeover
      });
      fetchThread(selectedConvId);
      fetchConversations();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleResolve = async () => {
    if (!selectedConvId) return;
    try {
      await api.post(`/conversations/${selectedConvId}/resolve`);
      fetchThread(selectedConvId);
      fetchConversations();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleSendWhatsAppInvite = () => {
    if (!activeThread?.customer) return;
    const shopSlug = 'saha-electronics';
    const link = `${window.location.origin}/optin/${shopSlug}`;
    const inviteText = `Namaskar! To receive official showroom discounts, catalogs, and 0% EMI offers directly on WhatsApp, please tap here to activate your VIP Club membership: ${link}`;
    handleSendReply(inviteText, false);
    setInviteSent(true);
  };

  const statusTabs = [
    { id: 'all', label: 'All Inquiries' },
    { id: 'hot_leads', label: 'Hot Leads', icon: Flame, badgeColor: 'text-rose-400' },
    { id: 'needs_human', label: 'Needs Human', icon: AlertCircle, badgeColor: 'text-amber-400' },
    { id: 'ai_handled', label: 'AI Handled', icon: Bot, badgeColor: 'text-emerald-400' },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2 }
  ];

  const channelTabs: Array<{ id: string; label: string; icon: any; color: string }> = [
    { id: 'ALL', label: 'All Channels', icon: MessageSquare, color: 'text-slate-400' },
    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
    { id: 'FACEBOOK', label: 'Facebook', icon: FacebookIcon, color: 'text-blue-400' },
    { id: 'INSTAGRAM', label: 'Instagram', icon: InstagramIcon, color: 'text-pink-400' },
    { id: 'WEBSITE', label: 'Web Chat', icon: Globe, color: 'text-teal-400' }
  ];

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filteredConversations = safeConversations.filter(conv => {
    if (!conv) return false;
    if (currentChannelFilter === 'ALL') return true;
    return (conv.channel || 'WHATSAPP') === currentChannelFilter;
  });

  const getChannelBadge = (ch?: LeadChannel) => {
    switch (ch) {
      case 'FACEBOOK':
        return { label: 'Facebook', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: FacebookIcon };
      case 'INSTAGRAM':
        return { label: 'Instagram', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: InstagramIcon };
      case 'WEBSITE':
        return { label: 'Web Chat', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: Globe };
      default:
        return { label: 'WhatsApp', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: MessageSquare };
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Top Filter Tabs Bar: Status & Channel Selectors */}
      <div className="min-h-[3.5rem] py-2 px-3 sm:px-6 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0 overflow-x-auto">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          {statusTabs.map(t => {
            const Icon = t.icon;
            const isActive = currentStatusTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentStatusTab(t.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${t.badgeColor || ''}`} />}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {channelTabs.map(ch => {
            const Icon = ch.icon;
            const isSelected = currentChannelFilter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setCurrentChannelFilter(ch.id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition font-medium ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`h-3 w-3 ${ch.color}`} />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Pane Inbox View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 ${selectedConvId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>{filteredConversations.length} Conversations</span>
            <button onClick={fetchConversations} className="hover:text-white transition" title="Refresh conversations">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
            {loadingList ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Loading conversations...
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map(conv => {
                const isSelected = selectedConvId === conv.id;
                const isHot = conv.interest_level === 'HOT' || (conv.lead_score ?? 0) >= 70;
                const chBadge = getChannelBadge(conv.channel);
                const ChIcon = chBadge.icon;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-800/90 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate max-w-[170px]">
                        <ChIcon className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="font-bold text-xs text-white truncate">
                          {conv.customer_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate max-w-[200px]">
                        {conv.interested_product || 'General inquiry'}
                      </span>
                      {isHot && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                          HOT {conv.lead_score || 80}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${chBadge.bg}`}>
                        {chBadge.label}
                      </span>
                      {conv.is_human_takeover ? (
                        <span className="text-purple-400 font-semibold flex items-center space-x-1">
                          <UserCheck className="h-3 w-3" />
                          <span>Staff</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <Bot className="h-3 w-3" />
                          <span>AI Active</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No conversations in this channel or filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className={`flex-1 flex flex-col bg-slate-900 overflow-hidden min-w-0 ${selectedConvId ? "flex" : "hidden md:flex"}`}>
          {activeThread && activeThread.conversation ? (
            <>
              {/* Thread Header */}
              <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConvId('')}
                    className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex items-center space-x-1 shrink-0"
                    aria-label="Back to conversation list"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs font-semibold">Back</span>
                  </button>

                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    {activeThread.conversation.customer_name?.[0] || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-bold text-sm text-white">
                        {activeThread.conversation.customer_name || 'Customer'}
                      </h2>
                      <span className="text-xs font-mono text-slate-400">
                        {activeThread.conversation.customer_phone || ''}
                      </span>
                      {/* Channel Badge */}
                      {(() => {
                        const b = getChannelBadge(activeThread.conversation.channel);
                        const I = b.icon;
                        return (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center space-x-1 ${b.bg}`}>
                            <I className="h-2.5 w-2.5" />
                            <span>{b.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs">
                      <span className="text-slate-400">Interested in:</span>
                      <span className="text-emerald-400 font-semibold">{activeThread.conversation.interested_product || 'Store Inquiry'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Controls */}
                <div className="flex items-center space-x-2 text-xs">
                  {/* Human takeover toggle */}
                  <button
                    onClick={handleToggleTakeover}
                    className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition ${
                      activeThread.conversation.is_human_takeover
                        ? 'bg-purple-950/50 text-purple-300 border-purple-500/40 hover:bg-purple-900'
                        : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                    }`}
                  >
                    {activeThread.conversation.is_human_takeover ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Human Takeover Active</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-3.5 w-3.5" />
                        <span>AI Auto-Answering</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onRecordSale(activeThread.customer)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1 transition"
                  >
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span>Confirm Sale</span>
                  </button>

                  <button
                    onClick={handleResolve}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Toggle resolved state"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Strict WhatsApp Consent Notice for Social Inquiries */}
              {activeThread.customer && !activeThread.customer.whatsapp_opt_in && (
                <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Consent Isolation Guard:</strong> This lead inquired via social channels. WhatsApp marketing consent is NOT granted until they join voluntarily.
                    </span>
                  </div>

                  <button
                    onClick={handleSendWhatsAppInvite}
                    disabled={inviteSent}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1 transition disabled:opacity-50"
                  >
                    {inviteSent ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Invite Sent</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3 w-3" />
                        <span>Send WhatsApp VIP Invite Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Recommended Action Bar */}
              <div className="bg-emerald-950/30 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>AI Recommendation:</strong> {activeThread.conversation.recommended_action || 'Assist customer with product specs and store visit details.'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-slate-400">
                    Lead Score: <strong className="text-rose-400 font-mono text-sm">{activeThread.conversation.lead_score ?? 80}</strong>/100
                  </span>
                </div>
              </div>

              {/* Chat Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]">
                {(activeThread.messages || []).map((msg: Message) => {
                  const isOutbound = msg.direction === 'OUTBOUND';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] sm:max-w-md p-3 rounded-2xl text-xs space-y-1 shadow-md break-words ${
                          isOutbound
                            ? 'bg-[#005c4b] text-white rounded-tr-none'
                            : 'bg-[#202c33] text-slate-100 rounded-tl-none'
                        }`}
                      >
                        {isOutbound && msg.ai_generated && (
                          <div className="flex items-center space-x-1 text-[10px] text-emerald-300 font-semibold mb-1">
                            <Bot className="h-3 w-3" />
                            <span>ShopGrow AI Assistant</span>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </div>

                        <div className="flex items-center justify-end space-x-1 text-[10px] text-slate-400">
                          <span>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {isOutbound && (
                            <CheckCheck className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Message Input Bar */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 shrink-0">
                {/* AI Suggested Response Shortcut */}
                {((activeThread.conversation.lead_score ?? 0) >= 70) && !activeThread.conversation.is_human_takeover && (
                  <div className="bg-slate-900 p-2 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-lg">
                      💡 Suggested: "Namaskar! Kal 11am-8pm ashun amader showroom-e. Live demo & instant delivery ready!"
                    </span>
                    <button
                      onClick={() => handleSendReply("Namaskar! Kal 11am-8pm ashun amader showroom-e. Live demo & instant delivery ready!", true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0"
                    >
                      Use & Send
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualReply}
                    onChange={e => setManualReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type official WhatsApp reply to customer..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleSendReply()}
                    disabled={sending || !manualReply.trim()}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <MessageSquare className="h-12 w-12 text-slate-700 stroke-[1.5]" />
              <div className="space-y-1">
                <p className="font-semibold text-sm text-slate-300">Select an Inquiry to Start Conversation</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click any conversation from the list to view real-time chat history, AI recommendations, and customer profiles.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};