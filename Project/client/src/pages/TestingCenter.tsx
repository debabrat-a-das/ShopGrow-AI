import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Play, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  XCircle, MessageSquare, Bot, UserCheck, ShieldAlert, Sparkles, 
  Share2, Layers, FileText, Check, ArrowRight, 
  Trash2, ShieldCheck, HelpCircle, Smartphone, ExternalLink, IndianRupee, Flame, Gift
} from 'lucide-react';
import { api } from '../services/api';
import { SystemTraceEvent, Shop, Customer, LeadIntent } from '../types';

interface TestingCenterProps {
  currentShopId: string;
  onSwitchShop: (shopId: string, shopName: string) => void;
  onNavigateToDashboard: () => void;
}

export const TestingCenter: React.FC<TestingCenterProps> = ({
  currentShopId,
  onSwitchShop,
  onNavigateToDashboard
}) => {
  const [activeTab, setActiveTab] = useState<string>('whatsapp-sim');
  const [shops, setShops] = useState<Shop[]>([]);
  const [eventLogs, setEventLogs] = useState<SystemTraceEvent[]>([]);
  const [outboundLogs, setOutboundLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // WhatsApp Customer Simulator State
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('+919830123456');
  const [selectedCustomerName, setSelectedCustomerName] = useState('Anirban Roy');
  const [customerInputMessage, setCustomerInputMessage] = useState('Price koto? Kal asbo.');
  const [whatsappSimulationResult, setWhatsappSimulationResult] = useState<any>(null);
  const [conversationThread, setConversationThread] = useState<any[]>([]);

  // Facebook & Instagram Simulator State
  const [socialChannel, setSocialChannel] = useState<'FACEBOOK' | 'INSTAGRAM'>('FACEBOOK');
  const [socialAuthor, setSocialAuthor] = useState('Rahul Das');
  const [socialPostTitle, setSocialPostTitle] = useState('New Royal Teak Hydraulic Bed Collection');
  const [socialCommentText, setSocialCommentText] = useState('Price please! EMI available?');
  const [socialSimulationResult, setSocialSimulationResult] = useState<any>(null);

  // Meta Lead Form Simulator State
  const [leadFormName, setLeadFormName] = useState('Suman Ghosh');
  const [leadFormPhone, setLeadFormPhone] = useState('+919830991122');
  const [leadFormProduct, setLeadFormProduct] = useState('Teak King Size Bed');
  const [leadFormBudget, setLeadFormBudget] = useState('50000');
  const [leadFormConsent, setLeadFormConsent] = useState(false);
  const [leadFormResult, setLeadFormResult] = useState<any>(null);

  // AI Intent Lab State
  const [labQuery, setLabQuery] = useState('Amar purono mobile exchange hobe? Kal dokane aschi.');
  const [labResult, setLabResult] = useState<any>(null);

  // Automated Test Suite State
  const [testSuiteResults, setTestSuiteResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Demo Scenarios State
  const [scenarioResults, setScenarioResults] = useState<any>(null);
  const [runningScenario, setRunningScenario] = useState(false);

  // Occasion Simulator State (Section 41)
  const [occasionCustomerId, setOccasionCustomerId] = useState<string>('');
  const [occasionCustomerList, setOccasionCustomerList] = useState<Customer[]>([]);
  const [occasionType, setOccasionType] = useState<string>('BIRTHDAY');
  const [fakeBirthday, setFakeBirthday] = useState<boolean>(true);
  const [fakeAnniversary, setFakeAnniversary] = useState<boolean>(false);
  const [fakePurchaseAnniversary, setFakePurchaseAnniversary] = useState<boolean>(false);
  const [fakeOfferEnabled, setFakeOfferEnabled] = useState<boolean>(true);
  const [occasionSimResult, setOccasionSimResult] = useState<any>(null);
  const [runningOccasionSim, setRunningOccasionSim] = useState<boolean>(false);

  // One-Click Complete Demo State (Section 42)
  const [completeDemoResult, setCompleteDemoResult] = useState<any>(null);
  const [runningCompleteDemo, setRunningCompleteDemo] = useState<boolean>(false);

  useEffect(() => {
    fetchTestingData();
  }, [currentShopId]);

  const fetchTestingData = async () => {
    try {
      const [shopsRes, eventsRes, outboundRes, custRes] = await Promise.all([
        api.get('/super-admin/shops').catch(() => []),
        api.get('/testing/event-logs').catch(() => []),
        api.get('/testing/outbound-messages').catch(() => []),
        api.get('/customers').catch(() => ({ customers: [] }))
      ]);
      setShops(shopsRes || []);
      setEventLogs(eventsRes || []);
      setOutboundLogs(outboundRes || []);
      const custs = custRes.customers || [];
      setOccasionCustomerList(custs);
      if (custs.length > 0 && !occasionCustomerId) {
        setOccasionCustomerId(custs[0].id);
      }
    } catch (err) {
      console.error('Failed to load testing data:', err);
    }
  };

  const handleRunOccasionSimulation = async () => {
    setRunningOccasionSim(true);
    try {
      const res = await api.post('/testing/simulate-occasion', {
        shopId: currentShopId,
        customerId: occasionCustomerId,
        occasionType,
        fakeBirthday,
        fakeAnniversary,
        fakePurchaseAnniversary,
        enableSpecialOffer: fakeOfferEnabled
      });
      setOccasionSimResult(res);
      fetchTestingData();
    } catch (err: any) {
      alert('Occasion Simulation Error: ' + err.message);
    } finally {
      setRunningOccasionSim(false);
    }
  };

  const handleRunCompleteDemo = async () => {
    setRunningCompleteDemo(true);
    try {
      const res = await api.post('/testing/run-complete-shopgrow-demo');
      setCompleteDemoResult(res);
      fetchTestingData();
    } catch (err: any) {
      alert('Complete Demo Error: ' + err.message);
    } finally {
      setRunningCompleteDemo(false);
    }
  };

  // WhatsApp Customer Simulator Handlers
  const handleSendAsCustomer = async (overrideText?: string) => {
    const textToSend = overrideText || customerInputMessage;
    if (!textToSend.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/simulator/simulate-reply', {
        customerPhone: selectedCustomerPhone,
        messageText: textToSend
      });
      setWhatsappSimulationResult(res.simulationResult);

      // Add to preview thread
      setConversationThread(prev => [
        ...prev,
        { id: Date.now(), sender: 'CUSTOMER', text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...(res.simulationResult?.dispatchedReply ? [{
          id: Date.now() + 1,
          sender: 'SHOP_AI',
          text: res.simulationResult.dispatchedReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }] : [])
      ]);

      setCustomerInputMessage('');
      fetchTestingData();
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Social Comment Simulator Handler
  const handlePostSocialComment = async (overrideText?: string) => {
    const textToSend = overrideText || socialCommentText;
    if (!textToSend.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/social/simulate-comment', {
        channel: socialChannel,
        authorName: socialAuthor,
        commentText: textToSend,
        sourcePostId: 'ad_post_qa_sandbox'
      });
      setSocialSimulationResult(res.result);
      fetchTestingData();
    } catch (err: any) {
      alert('Social simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Meta Lead Form Handler
  const handleSubmitLeadForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/testing/simulate-lead-form', {
        shopId: currentShopId,
        name: leadFormName,
        phone: leadFormPhone,
        product: leadFormProduct,
        budget: leadFormBudget,
        whatsapp_opt_in: leadFormConsent
      });
      setLeadFormResult(res);
      fetchTestingData();
    } catch (err: any) {
      alert('Lead form error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // AI Intent Lab Handler
  const handleTestLabIntent = async (overrideQuery?: string) => {
    const q = overrideQuery || labQuery;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/testing/ai-intent-lab', {
        text: q,
        shopId: currentShopId
      });
      setLabResult(res);
      fetchTestingData();
    } catch (err: any) {
      alert('Intent lab error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Automated Test Suite Runner Handler
  const handleRunAutomatedTests = async () => {
    setRunningTests(true);
    try {
      const res = await api.post('/testing/run-automated-tests');
      setTestSuiteResults(res);
      fetchTestingData();
    } catch (err: any) {
      alert('Test runner error: ' + err.message);
    } finally {
      setRunningTests(false);
    }
  };

  // Demo Scenarios Runner Handlers
  const handleRunScenario = async (scenario: 'A' | 'B' | 'MEMORY' | 'D') => {
    setRunningScenario(true);
    try {
      const endpoint = scenario === 'A' 
        ? '/testing/run-scenario-a' 
        : scenario === 'B' 
        ? '/testing/run-scenario-b' 
        : scenario === 'D'
        ? '/testing/run-scenario-d'
        : '/testing/run-scenario-memory';
      const res = await api.post(endpoint);
      setScenarioResults(res);
      fetchTestingData();
    } catch (err: any) {
      alert('Scenario error: ' + err.message);
    } finally {
      setRunningScenario(false);
    }
  };

  // Reset Test Data Handler
  const handleResetTestData = async () => {
    if (!window.confirm('Clear simulated test leads, mock messages, and event traces? (Production shop data is NEVER touched)')) return;
    try {
      await api.post('/testing/reset-test-data');
      alert('Test simulations reset successfully!');
      fetchTestingData();
      setConversationThread([]);
      setWhatsappSimulationResult(null);
      setSocialSimulationResult(null);
    } catch (err: any) {
      alert('Reset error: ' + err.message);
    }
  };

  const navTabs = [
    { id: 'whatsapp-sim', label: 'WhatsApp Simulator', icon: MessageSquare },
    { id: 'social-sim', label: 'Facebook & Instagram', icon: Share2 },
    { id: 'lead-form', label: 'Meta Lead Form', icon: FileText },
    { id: 'occasion-sim', label: 'Occasion Simulator', icon: Gift },
    { id: 'intent-lab', label: 'AI Intent Lab', icon: Bot },
    { id: 'event-inspector', label: 'Event Inspector', icon: ShieldAlert, badge: eventLogs.length },
    { id: 'outbound-log', label: 'Outbound Inspector', icon: Send, badge: outboundLogs.length },
    { id: 'automated-tests', label: 'Automated Test Suite', icon: FlaskConical },
    { id: 'scenarios', label: 'Demo Scenarios', icon: Play }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Sandbox Safety Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">QA Sandbox & Multi-Role Simulation Laboratory</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                🟡 TEST / MOCK MODE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate customer replies, Facebook comments, lead forms, and consent events without real SIM cards or external Meta API quota.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTestingData}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetTestData}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center space-x-1.5 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Test Data</span>
          </button>
        </div>
      </div>

      {/* Testing Center Tab Navigation */}
      <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs select-none">
        {navTabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white text-emerald-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WHATSAPP CUSTOMER SIMULATOR (TWO-SIDED SPLIT SCREEN) */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp-sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-150">
          {/* LEFT: SHOP SIDE */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col h-[560px]">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Shop View (Saha Electronics / Royal Teak)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Meta Cloud API (Mock)</span>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]">
              {/* Mock Outbound Campaign Pitch */}
              <div className="flex justify-end">
                <div className="max-w-xs p-3 rounded-2xl rounded-tr-none bg-[#005c4b] text-white text-xs space-y-1 shadow-md">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">Store Campaign Broadcast</div>
                  <p className="leading-relaxed">
                    Namaskar {selectedCustomerName}! Royal Teak & Home Decor-e brand new Teak Hydraulic Storage Bed launch hoyeche. Special 0% EMI & free delivery available!
                  </p>
                  <div className="text-right text-[10px] text-slate-300">10:30 AM • Delivered ✓✓</div>
                </div>
              </div>

              {conversationThread.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-xs p-3 rounded-2xl text-xs space-y-1 shadow-md ${
                    msg.sender === 'CUSTOMER'
                      ? 'bg-[#202c33] text-white rounded-tl-none'
                      : 'bg-[#005c4b] text-white rounded-tr-none'
                  }`}>
                    <div className="text-[10px] font-bold text-emerald-300">
                      {msg.sender === 'CUSTOMER' ? selectedCustomerName : 'Shop AI Assistant'}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="text-right text-[10px] text-slate-400 font-mono">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status / Output Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
              <span>Status: <strong className="text-emerald-400">AI Answering Active</strong></span>
              <button
                onClick={() => setConversationThread([])}
                className="text-slate-500 hover:text-white text-[11px]"
              >
                Clear Thread Preview
              </button>
            </div>
          </div>

          {/* RIGHT: CUSTOMER SIMULATOR SIDE */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Customer Smartphone Simulator</h3>
              </div>
              <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full font-mono text-emerald-400">
                Play As Customer
              </span>
            </div>

            {/* Customer Select */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Simulated Customer</label>
                <select
                  value={selectedCustomerPhone}
                  onChange={(e) => {
                    setSelectedCustomerPhone(e.target.value);
                    if (e.target.value === '+919830123456') setSelectedCustomerName('Anirban Roy');
                    else if (e.target.value === '+919830882233') setSelectedCustomerName('Soumya Mukherjee');
                    else setSelectedCustomerName('Priya Sengupta');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="+919830123456">Anirban Roy (+919830123456) - Mobile</option>
                  <option value="+919830882233">Soumya Mukherjee (+919830882233) - Sofa</option>
                  <option value="+919830884455">Priya Sengupta (+919830884455) - Bed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Customer E.164 Phone</label>
                <input
                  type="text"
                  value={selectedCustomerPhone}
                  onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Quick-Message Buttons */}
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-2 uppercase tracking-wider">
                One-Click Customer Quick Queries:
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { text: 'Price koto?', label: 'PRICE?' },
                  { text: '0% EMI option ache?', label: 'EMI AVAILABLE?' },
                  { text: 'Purono bed exchange hobe?', label: 'EXCHANGE?' },
                  { text: 'Catalogue details pathan please', label: 'CATALOGUE' },
                  { text: 'Showroom location kothay?', label: 'LOCATION?' },
                  { text: 'Kal shondhye 7 tay dokane aschi!', label: 'I WILL VISIT TOMORROW' },
                  { text: 'STOP. Please do not send messages.', label: 'STOP (OPT-OUT)' }
                ].map(q => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setCustomerInputMessage(q.text);
                      handleSendAsCustomer(q.text);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      q.label.includes('STOP')
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : q.label.includes('VISIT')
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Text Box */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-medium block">
                Type Any Custom Inbound Message (Bengali, Banglish, English):
              </label>
              <textarea
                rows={3}
                value={customerInputMessage}
                onChange={(e) => setCustomerInputMessage(e.target.value)}
                placeholder="Type customer reply..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              <button
                onClick={() => handleSendAsCustomer()}
                disabled={loading || !customerInputMessage.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>SEND AS CUSTOMER (Trigger Webhook)</span>
              </button>
            </div>

            {/* Simulation Pipeline Inspection Result */}
            {whatsappSimulationResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2 text-xs animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Webhook Pipeline Processed</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Lead Score: {whatsappSimulationResult.leadScore || 50}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Classified Intent: <strong className="text-emerald-300 font-mono">{whatsappSimulationResult.intent}</strong></div>
                  <div>Interest Level: <strong className="text-rose-400 font-mono">{whatsappSimulationResult.interestLevel}</strong></div>
                  <div>Needs Human: <strong className={whatsappSimulationResult.needsHuman ? 'text-amber-400' : 'text-slate-400'}>{whatsappSimulationResult.needsHuman ? 'YES' : 'NO'}</strong></div>
                  <div>Dispatched Outbound: <strong className="text-white font-mono">SENT ✓✓</strong></div>
                </div>

                {whatsappSimulationResult.dispatchedReply && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1 text-[10px] uppercase">Grounded Auto-Reply Generated:</span>
                    <p className="text-emerald-300 italic bg-slate-900/90 p-2.5 rounded-lg border border-emerald-500/20">
                      "{whatsappSimulationResult.dispatchedReply}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FACEBOOK & INSTAGRAM SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'social-sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-150">
          {/* LEFT: FAKE SOCIAL POST & COMMENT BOX */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 className="h-4 w-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Fake Social Media Ad & Comment Post</h3>
              </div>
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setSocialChannel('FACEBOOK')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    socialChannel === 'FACEBOOK' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Facebook Ad
                </button>
                <button
                  onClick={() => setSocialChannel('INSTAGRAM')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    socialChannel === 'INSTAGRAM' ? 'bg-pink-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Instagram Post
                </button>
              </div>
            </div>

            {/* Fake Social Ad Card Preview */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                  R
                </div>
                <div>
                  <div className="font-bold text-white">Royal Teak & Home Decor</div>
                  <div className="text-[10px] text-slate-500">Sponsored Ad • Kolkata</div>
                </div>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                ✨ Upgrade your bedroom with handcrafted solid teakwood elegance! Hydraulic lift-up storage, 10-year warranty, and festive spot discounts.
                <br />
                <span className="text-blue-400 font-semibold">👉 Comment PRICE for exclusive VIP showroom discount coupon!</span>
              </p>
            </div>

            {/* Customer Comment Input */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={socialAuthor}
                    onChange={(e) => setSocialAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Source Post / Ad</label>
                  <input
                    type="text"
                    value={socialPostTitle}
                    onChange={(e) => setSocialPostTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Customer Comment</label>
                <textarea
                  rows={2}
                  value={socialCommentText}
                  onChange={(e) => setSocialCommentText(e.target.value)}
                  placeholder="e.g. Price please! Salt Lake delivery available?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              {/* Quick comments */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Price please!',
                  'Catalogue details pathan',
                  'Location kothay?',
                  '0% EMI option ache?',
                  'Call me 9830011223'
                ].map(text => (
                  <button
                    key={text}
                    onClick={() => {
                      setSocialCommentText(text);
                      handlePostSocialComment(text);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePostSocialComment()}
                disabled={loading || !socialCommentText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition"
              >
                <Share2 className="h-4 w-4" />
                <span>POST TEST COMMENT (Ingest via Social Lead Engine)</span>
              </button>
            </div>
          </div>

          {/* RIGHT: SOCIAL LEAD ENGINE EXECUTION INSPECTOR */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Bot className="h-4 w-4 text-emerald-400" />
                <span>Social Lead Engine Live Pipeline Output</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Demonstrates AI intent classification, public reply generation, and strict WhatsApp consent isolation.
              </p>
            </div>

            {socialSimulationResult ? (
              <div className="space-y-4 text-xs animate-in zoom-in-95 duration-150">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px]">
                  <div>Intent: <strong className="text-emerald-400">{socialSimulationResult.socialLead.intent}</strong></div>
                  <div>Interest: <strong className="text-rose-400">{socialSimulationResult.socialLead.interest_level}</strong></div>
                  <div>Lead Created: <strong className="text-emerald-400">YES (CRM Profile)</strong></div>
                  <div>WhatsApp Consent: <strong className="text-amber-400">FALSE (Strict Guard)</strong></div>
                </div>

                {/* Consent Warning */}
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start space-x-2 text-amber-200 text-xs">
                  <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <strong>Consent Isolation Enforced:</strong> Commenting on Facebook NEVER authorizes WhatsApp promotional campaigns.
                    The lead is safely kept with <code>whatsapp_opt_in = false</code>.
                  </div>
                </div>

                {/* Public Reply */}
                {socialSimulationResult.publicReply && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-400">1. Generated Public Post Reply:</span>
                    <p className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-blue-200 italic">
                      "{socialSimulationResult.publicReply}"
                    </p>
                  </div>
                )}

                {/* Private DM / VIP Invite */}
                {socialSimulationResult.privateReply && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">2. Generated Private DM (With VIP Opt-In Link):</span>
                    <p className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl text-emerald-200 italic leading-relaxed">
                      "{socialSimulationResult.privateReply}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <Share2 className="h-8 w-8 text-slate-700 mx-auto" />
                <p>Post a test comment on the left to inspect Social Lead Engine ingestion.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: META LEAD FORM SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'lead-form' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-150">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>Simulate Meta Instant Lead Form Submission</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Test how lead form records are created and how the optional WhatsApp marketing checkbox is handled.
              </p>
            </div>

            <form onSubmit={handleSubmitLeadForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Lead Full Name</label>
                  <input
                    type="text"
                    required
                    value={leadFormName}
                    onChange={(e) => setLeadFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mobile (10 digits / +91)</label>
                  <input
                    type="text"
                    required
                    value={leadFormPhone}
                    onChange={(e) => setLeadFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Interested Product</label>
                  <input
                    type="text"
                    value={leadFormProduct}
                    onChange={(e) => setLeadFormProduct(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Budget (₹)</label>
                  <input
                    type="text"
                    value={leadFormBudget}
                    onChange={(e) => setLeadFormBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Explicit WhatsApp Consent Checkbox */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadFormConsent}
                    onChange={(e) => setLeadFormConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <div className="text-xs leading-relaxed text-slate-300">
                    <strong className="text-white block">Explicit WhatsApp Marketing Consent:</strong>
                    "I agree to receive promotional offers, catalogs, and notifications on WhatsApp from this store."
                  </div>
                </label>
                <div className="text-[11px] text-slate-500 pl-6">
                  {leadFormConsent 
                    ? '🟢 Consent granted: Lead will be marked whatsapp_opt_in = true.'
                    : '🟡 No consent: Lead created in CRM, but WhatsApp marketing will be strictly blocked.'}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-purple-600/25 transition"
              >
                Submit Meta Lead Form
              </button>
            </form>
          </div>

          {/* Lead Form Ingestion Output */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-white">Lead Form CRM Processing Result</h3>
            {leadFormResult ? (
              <div className="space-y-3 text-xs animate-in zoom-in-95 duration-150">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300">
                  {leadFormResult.message}
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
                  <div>Customer ID: <span className="text-slate-300">{leadFormResult.customer.id}</span></div>
                  <div>Phone E.164: <span className="text-emerald-400">{leadFormResult.customer.phone_e164}</span></div>
                  <div>Source: <span className="text-purple-400">{leadFormResult.customer.source}</span></div>
                  <div>WhatsApp Opt-in: <span className={leadFormResult.whatsapp_consent_granted ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{String(leadFormResult.whatsapp_consent_granted)}</span></div>
                  <div>Lead Status: <span className="text-white">{leadFormResult.lead.status}</span></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                Submit a lead form to inspect consent handling.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: OCCASION SIMULATOR (Section 41) */}
      {/* ========================================================================= */}
      {activeTab === 'occasion-sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-150">
          {/* LEFT: SIMULATION CONTROLS */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Gift className="h-4 w-4 text-pink-400" />
                <span>Occasion Engine Sandbox Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate calendar event triggers, strict backend offer governance, idempotency duplicate prevention, and consent blocking.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Test Customer</label>
                <select
                  value={occasionCustomerId}
                  onChange={(e) => setOccasionCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {occasionCustomerList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone_e164}) {c.whatsapp_opt_in ? '— Consent Active' : '— No Consent (DNC)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Occasion Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BIRTHDAY', 'WEDDING_ANNIVERSARY', 'PURCHASE_ANNIVERSARY'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOccasionType(type)}
                      className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                        occasionType === type
                          ? 'bg-pink-600/20 text-pink-300 border-pink-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {type === 'BIRTHDAY' ? '🎂 Birthday' : type === 'WEDDING_ANNIVERSARY' ? '💍 Wedding' : '📱 Purchase'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Simulation Overrides
                </span>
                
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fakeBirthday}
                    onChange={(e) => setFakeBirthday(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Set Fake Birthday = Today</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fakeAnniversary}
                    onChange={(e) => setFakeAnniversary(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Set Fake Wedding Anniversary = Today</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fakePurchaseAnniversary}
                    onChange={(e) => setFakePurchaseAnniversary(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Set Fake Purchase Date = 1 Year Ago Exact</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer pt-1 border-t border-slate-800">
                  <input
                    type="checkbox"
                    checked={fakeOfferEnabled}
                    onChange={(e) => setFakeOfferEnabled(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-emerald-300 font-bold block">Backend Special Offer Attached</span>
                    <span className="text-[10px] text-slate-400">If unchecked, sends personal warm greeting only with 0% coupon hallucination.</span>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={handleRunOccasionSimulation}
                disabled={runningOccasionSim}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-pink-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {runningOccasionSim ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>RUN OCCASION ENGINE TEST</span>
              </button>
            </div>
          </div>

          {/* RIGHT: SIMULATION EXECUTION TRACE */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Bot className="h-4 w-4 text-pink-400" />
                <span>Occasion Engine Live Pipeline Execution Trace</span>
              </h3>
              {occasionSimResult && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  occasionSimResult.overall_status === 'PASSED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {occasionSimResult.overall_status}
                </span>
              )}
            </div>

            {occasionSimResult ? (
              <div className="space-y-4 text-xs animate-in zoom-in-95 duration-150">
                {/* Generated Message Box */}
                {occasionSimResult.message_preview && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-pink-400">Compiled Outbound Greeting:</span>
                    <p className="p-3 bg-slate-950 border border-pink-500/30 rounded-xl text-pink-200 italic font-sans whitespace-pre-wrap leading-relaxed">
                      "{occasionSimResult.message_preview}"
                    </p>
                  </div>
                )}

                {/* Step Trace */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pipeline Assertions:</span>
                  {occasionSimResult.steps?.map((st: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2.5">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          st.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                          st.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{st.step}</span>
                          <span className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed block mt-0.5">{st.details}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        st.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        st.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <Gift className="h-8 w-8 text-slate-700 mx-auto" />
                <p>Select a customer on the left and click "RUN OCCASION ENGINE TEST" to trace the execution pipeline.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI INTENT LABORATORY */}
      {/* ========================================================================= */}
      {activeTab === 'intent-lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-150">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Bot className="h-4 w-4 text-emerald-400" />
                <span>AI Intent & Anti-Hallucination Laboratory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Input any customer query to test intent classification, lead scoring delta, and grounded reply generation.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Customer Query Text</label>
                <textarea
                  rows={3}
                  value={labQuery}
                  onChange={(e) => setLabQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sample Lab Prompts */}
              <div>
                <span className="text-slate-400 block mb-1.5 uppercase font-bold text-[10px]">Test Queries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Price koto?',
                    'Kal 11 tay dokane aschi exchange korte',
                    'Dokan kothay? Aj open ache?',
                    '0% EMI option ache?',
                    'STOP. Unsubscribe me please.',
                    'Radiation value koto? Earphone ache box e?'
                  ].map(sample => (
                    <button
                      key={sample}
                      onClick={() => {
                        setLabQuery(sample);
                        handleTestLabIntent(sample);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleTestLabIntent()}
                disabled={loading || !labQuery.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition"
              >
                Run AI Intent Evaluation
              </button>
            </div>
          </div>

          {/* AI Lab Structured Output */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-white">AI Classification Structured Output</h3>
            {labResult ? (
              <div className="space-y-3 text-xs animate-in zoom-in-95 duration-150">
                <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px]">
                  <div>Intent: <strong className="text-emerald-400">{labResult.intent}</strong></div>
                  <div>Interest Level: <strong className="text-rose-400">{labResult.interestLevel}</strong></div>
                  <div>Score Delta: <strong className="text-white">+{labResult.leadScoreDelta}</strong></div>
                  <div>Needs Human: <strong className={labResult.needsHuman ? 'text-amber-400' : 'text-slate-400'}>{labResult.needsHuman ? 'YES' : 'NO'}</strong></div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recommended CRM Action:</span>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
                    {labResult.recommendedAction}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Grounded Outbound Auto-Reply:</span>
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 italic">
                    "{labResult.aiReply}"
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                Click any test query on the left to evaluate AI intent.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EVENT INSPECTOR (REAL-TIME PIPELINE TRACE) */}
      {/* ========================================================================= */}
      {activeTab === 'event-inspector' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3 animate-in fade-in duration-150">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-purple-400" />
                <span>Event Inspector & Pipeline Trace Log</span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time chronological trace of comment ingestion, intent classification, lead creation, consent checks, and outbound deliveries.
              </p>
            </div>
            <button onClick={fetchTestingData} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Event Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-[11px]">
                {eventLogs.map((ev, idx) => (
                  <tr key={ev.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {ev.source}
                      </span>
                    </td>
                    <td className="p-3 text-white font-sans font-semibold">
                      {ev.name}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        ev.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-sm truncate">
                      {ev.payload ? JSON.stringify(ev.payload) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: OUTBOUND INSPECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'outbound-log' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3 animate-in fade-in duration-150">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Send className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp Outbound Message Inspector</span>
              </h3>
              <p className="text-xs text-slate-400">
                Audits all messages dispatched by ShopGrow AI with simulated Meta delivery receipts and mock provider badges.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">{outboundLogs.length} Outbound Messages</span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3">Recipient & Store</th>
                  <th className="p-3">Provider Mode</th>
                  <th className="p-3">Delivery Status</th>
                  <th className="p-3">Message Body</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-[11px]">
                {outboundLogs.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono">
                      <div className="text-white font-bold">{m.recipient_phone}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{m.shop_name}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold">
                        MOCK — NOT ACTUALLY SENT
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {m.status} ✓✓
                      </span>
                    </td>
                    <td className="p-3 text-slate-200 max-w-md whitespace-pre-wrap leading-relaxed">
                      {m.body}
                    </td>
                    <td className="p-3 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: AUTOMATED TEST SUITE (RUN ALL TESTS) */}
      {/* ========================================================================= */}
      {activeTab === 'automated-tests' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-6 shadow-xl animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <FlaskConical className="h-5 w-5 text-purple-400" />
                <span>ShopGrow AI 25-Check Automated Test Suite</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Executes end-to-end verification across tenant isolation, normalization, AI classification, customer memory, Meta Social idempotency, multi-turn deduplication, and sales attribution.
              </p>
            </div>

            <button
              onClick={handleRunAutomatedTests}
              disabled={runningTests}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {runningTests ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              <span>RUN ALL 25 TESTS</span>
            </button>
          </div>

          {/* Scorecard */}
          {testSuiteResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Total Tests</span>
                  <span className="text-xl font-bold font-mono text-white">{testSuiteResults.total}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-slate-400 block mb-1">Passed</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{testSuiteResults.passed}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30">
                  <span className="text-slate-400 block mb-1">Failed</span>
                  <span className="text-xl font-bold font-mono text-rose-400">{testSuiteResults.failed}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30">
                  <span className="text-slate-400 block mb-1">Warnings</span>
                  <span className="text-xl font-bold font-mono text-amber-400">{testSuiteResults.warnings}</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3 w-12">#</th>
                      <th className="p-3">Test Case Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assertion Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-[11px]">
                    {testSuiteResults.results?.map((test: any) => (
                      <tr key={test.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-slate-500">{test.id}</td>
                        <td className="p-3 font-bold text-white">{test.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            {test.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            test.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            test.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {test.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 leading-relaxed">{test.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: DEMO SCENARIOS (RUN FULL DEMO) */}
      {/* ========================================================================= */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start animate-in fade-in duration-150">
          {/* Scenario A Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Scenario A: Furniture Journey</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Teak Bed → Mock Campaign → Price/Visit → Hot Lead → Sale</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                SCENARIO A
              </span>
            </div>

            <button
              onClick={() => handleRunScenario('A')}
              disabled={runningScenario}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition"
            >
              <Play className="h-4 w-4" />
              <span>RUN SCENARIO A</span>
            </button>
          </div>

          {/* Scenario B Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Scenario B: Facebook Ad to Consent</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Comment → AI Ingest → Marketing Blocked → Separate Opt-In</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                SCENARIO B
              </span>
            </div>

            <button
              onClick={() => handleRunScenario('B')}
              disabled={runningScenario}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition"
            >
              <Play className="h-4 w-4" />
              <span>RUN SCENARIO B</span>
            </button>
          </div>

          {/* Scenario Memory Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Scenario C: Customer Memory</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Ask Once → Save → Reuse | Anaphora "ওইটার" | Zero Repeat</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                SCENARIO C
              </span>
            </div>

            <button
              onClick={() => handleRunScenario('MEMORY')}
              disabled={runningScenario}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2 transition"
            >
              <Play className="h-4 w-4" />
              <span>RUN SCENARIO C</span>
            </button>
          </div>

          {/* Scenario D Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Scenario D: Meta Social Lead-to-Sale</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Comment → Idempotency Reject → Open Lead Dedup → Attributed Sale</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                SCENARIO D
              </span>
            </div>

            <button
              onClick={() => handleRunScenario('D')}
              disabled={runningScenario}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-cyan-600/25 flex items-center justify-center space-x-2 transition"
            >
              <Play className="h-4 w-4" />
              <span>RUN SCENARIO D</span>
            </button>
          </div>

          {/* Master 20-Step Complete Demo Banner (Section 42) */}
          <div className="col-span-full bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/80 rounded-2xl border border-purple-500/30 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">One-Click Complete ShopGrow AI Platform Verification</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Executes the full 20-step lifecycle across: Multi-Tenant Shop → Customer Ingest → Product Catalog → Mock WhatsApp → Inbound Reply → AI Intent & Lead Scoring → Store Visit → Confirmed Sale → Facebook Comment & Consent Guard → Social Attribution → Calendar Occasion Detection → Backend Coupon (BDAY10) → Reply & Coupon Redemption → Occasion Attributed Sale.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunCompleteDemo}
                disabled={runningCompleteDemo}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition shrink-0 disabled:opacity-50"
              >
                {runningCompleteDemo ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>RUN COMPLETE SHOPGROW DEMO</span>
              </button>
            </div>

            {/* 20-Step Results Scorecard */}
            {completeDemoResult && (
              <div className="space-y-4 animate-in zoom-in-95 duration-150">
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">Total Lifecycle Steps</span>
                    <span className="text-xl font-bold font-mono text-white">{completeDemoResult.steps?.length || 20}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
                    <span className="text-slate-400 block mb-1">Passed (PASS)</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{completeDemoResult.passed_count}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30">
                    <span className="text-slate-400 block mb-1">Failed (FAIL)</span>
                    <span className="text-xl font-bold font-mono text-rose-400">{completeDemoResult.failed_count}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30">
                    <span className="text-slate-400 block mb-1">Warnings (WARNING)</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{completeDemoResult.warning_count}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {completeDemoResult.steps?.map((st: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2.5">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          st.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' :
                          st.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{st.step}</span>
                          <span className="text-[11px] text-slate-300 block mt-0.5">{st.details}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        st.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        st.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scenario Execution Trace Card */}
          {scenarioResults && (
            <div className="col-span-full bg-slate-900/90 rounded-2xl border border-emerald-500/40 p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">{scenarioResults.title}</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {scenarioResults.overall_status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {scenarioResults.steps?.map((st: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{st.step}</div>
                        <div className="text-[11px] text-slate-400">{st.details}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      st.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
