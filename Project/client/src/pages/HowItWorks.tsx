import React, { useState } from 'react';
import { 
  Workflow, Play, CheckCircle2, ArrowRight, ShieldCheck, 
  Sparkles, Send, MessageSquare, ShoppingBag, Eye, 
  Smartphone, Database, Clock, Users, ChevronRight, ChevronLeft, 
  X, Layers, Activity, HelpCircle
} from 'lucide-react';

interface HowItWorksProps {
  onNavigateToTab?: (tab: string) => void;
  onLaunchDemoScenario?: (scenario: 'A' | 'B') => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({
  onNavigateToTab,
  onLaunchDemoScenario
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showStoryboard, setShowStoryboard] = useState<boolean>(false);
  const [storyboardSlide, setStoryboardSlide] = useState<number>(0);

  const pipelineStages = [
    {
      num: 1,
      title: 'Customer Import & POS Sync',
      icon: Database,
      badge: 'Zero-Drop Parser',
      description: 'Ingest raw customer spreadsheets (Excel/CSV) or sync POS billing software. Automatically maps dirty columns, standardizes E.164 phone numbers, and eliminates duplicate profiles.',
      safetyRule: 'Duplicate deduplication by phone number; non-mobile numbers flagged.'
    },
    {
      num: 2,
      title: 'Opt-in Consent Verification',
      icon: ShieldCheck,
      badge: 'TRAI / Meta Compliance',
      description: 'Verifies explicit WhatsApp marketing consent before any contact is permitted. Records immutable audit trails with timestamp and source (POS invoice, self-service check-in, or web opt-in).',
      safetyRule: 'Strict zero-tolerance: Contacts without whatsapp_opt_in = true are automatically quarantined.'
    },
    {
      num: 3,
      title: 'Smart & Cross-Category Segmentation',
      icon: Users,
      badge: 'Intent Engine',
      description: 'Targets customers based on purchase history or discovers cross-category opportunities (e.g. informing refrigerator buyers about a new flagship smartphone, or bed buyers about premium sofa arrivals).',
      safetyRule: '14-day anti-spam frequency cap enforced per recipient.'
    },
    {
      num: 4,
      title: 'Product Arrival & Offer Setup',
      icon: ShoppingBag,
      badge: 'Flexible Retail Catalog',
      description: 'Add new arrivals or promotional offers with rich attributes (materials, finish, warranty, cashback). Triggers the “Who should know about this?” discovery workflow.',
      safetyRule: 'Catalog specs locked as authoritative truth for AI copy.'
    },
    {
      num: 5,
      title: 'AI Copy Generation with Guardrails',
      icon: Sparkles,
      badge: 'Strict Grounding',
      description: 'Generates concise, localized WhatsApp templates in English, Bengali, Hindi, or Hinglish. Custom merchant instructions are followed strictly without hallucinating unverified specs or discounts.',
      safetyRule: 'Strict anti-hallucination guardrail: Prices and specifications must strictly match catalog.'
    },
    {
      num: 6,
      title: 'Merchant Review & Approval Gate',
      icon: Eye,
      badge: 'Human-in-the-Loop',
      description: 'No outbound campaign can be dispatched without explicit human sign-off. The merchant previews exact customer counts, exclusion reasons, message wording, and sample rendering.',
      safetyRule: 'No autonomous outbound messaging without shopkeeper approval.'
    },
    {
      num: 7,
      title: 'Frequency & Quiet Hours Shield',
      icon: Clock,
      badge: 'Anti-Spam Guard',
      description: 'Enforces statutory quiet hours (9:00 PM to 9:00 AM) and respects customer DNC (Do Not Contact) lists. Excludes customers contacted in the last 14 days to prevent opt-outs.',
      safetyRule: 'TRAI Quiet Hours strictly enforced in dispatch engine.'
    },
    {
      num: 8,
      title: 'WhatsApp Dispatch & Live Stepper',
      icon: Send,
      badge: 'Real & Mock Providers',
      description: 'Dispatches via WhatsApp Cloud API or local QA Mock Simulator. Visual 5-stage live stepper guides merchant from Preparing through Validating, Queued, Sending, to Delivered.',
      safetyRule: 'Full message queue audit logs with latency & delivery timestamps.'
    },
    {
      num: 9,
      title: 'Social Lead Capture & Messenger DM',
      icon: MessageSquare,
      badge: 'Multi-Channel Attribution',
      description: 'Captures Facebook and Instagram ad/post comments. Analyzes customer intent, auto-replies via Messenger DM with product details, and prompts for opt-in consent.',
      safetyRule: 'Facebook comments are NEVER treated as implicit WhatsApp consent.'
    },
    {
      num: 10,
      title: 'Store Visit Attribution & Repeat ROI',
      icon: Activity,
      badge: 'Closed-Loop Revenue',
      description: 'Tracks customer journey from first touchpoint (FB Ad, WhatsApp broadcast, or Walk-in) through in-store demo to POS billing. Attributes repeat revenue directly to campaigns.',
      safetyRule: 'Multi-touch and last-touch revenue attribution calculated accurately.'
    }
  ];

  const storyboardSlides = [
    {
      title: 'Step 1: The Local Retail Dilemma',
      subtitle: 'Valuable customer records sitting idle in paper registers and Excel sheets.',
      content: 'Local mobile and electronics shops serve thousands of buyers each year, but lack automated systems to bring them back when new models or complementary accessories arrive. ShopGrow AI ingests these databases instantly.',
      highlight: 'Turn existing customer database into predictable repeat revenue.'
    },
    {
      title: 'Step 2: Consent & Safety First',
      subtitle: 'TRAI-compliant WhatsApp opt-in verification and frequency capping.',
      content: 'ShopGrow checks every contact against the shop opt-in register and anti-spam rules. Customers contacted within 14 days or without verified consent are excluded automatically with clear reasons shown.',
      highlight: 'Zero risk of WhatsApp account bans or spam customer complaints.'
    },
    {
      title: 'Step 3: New Arrival Awareness & Cross-Category Targeting',
      subtitle: 'Target refrigerator buyers for a smartphone launch or bed buyers for sofa arrivals.',
      content: 'Traditional stores only send campaigns to identical product categories. ShopGrow AI supports 6 audience modes, including CROSS-CATEGORY AWARENESS, expanding relevant reach to all qualified loyal customers.',
      highlight: 'Discover high-intent buyers across related product categories.'
    },
    {
      title: 'Step 4: AI Copywriter with Merchant Guardrails',
      subtitle: 'Personalized WhatsApp messages crafted with zero hallucinated prices.',
      content: 'Shopkeepers can provide freeform notes like "Mention 24-month warranty and free home demo." AI generates grounded variants in English, Bengali, or Hindi, strictly preserving catalog specifications.',
      highlight: 'Human-in-the-loop: The merchant always reviews and approves before sending.'
    },
    {
      title: 'Step 5: Live 5-Stage Dispatch Engine',
      subtitle: 'Real-time visibility: Preparing → Validating → Queued → Sending → Completed.',
      content: 'When Send Campaign Now is clicked, the system runs consent checks, TRAI quiet hours validation, queues outbound packets, and dispatches via official WhatsApp API or Mock Simulator with live progress.',
      highlight: 'Clear visual status with failure reasons displayed if any recipient bounces.'
    },
    {
      title: 'Step 6: Facebook & Instagram Lead Capture',
      subtitle: 'From social media comments to CRM leads and Messenger DMs.',
      content: 'When a shopper comments "Price please?" on Facebook or Instagram, ShopGrow AI analyzes purchase intent, sends an instant automated Messenger DM, and captures them in the CRM with full source attribution.',
      highlight: 'Full funnel tracking: Social Post → DM → WhatsApp Consent → Store Visit.'
    },
    {
      title: 'Step 7: Unified Customer 360 Journey',
      subtitle: 'See every touchpoint from first Facebook ad to showroom sale.',
      content: 'The Customer 360 Drawer visualizes chronological touchpoints: Social comments, AI qualification score escalation, WhatsApp campaign broadcasts, showroom demo bookings, and final POS invoice revenue.',
      highlight: 'Complete source attribution from online click to in-store cash register.'
    },
    {
      title: 'Step 8: Cross-Shop Multi-Tenant Administration',
      subtitle: 'Super Admin oversight with complete data isolation for shop owners.',
      content: 'Shop owners operate in their private mobile-first workspace without administrative clutter. Super Admins can compare cross-shop revenue, generate one-click login invite links, or securely enter workspaces for support.',
      highlight: 'Enterprise-grade multi-tenancy built for retail franchises and SaaS scaling.'
    }
  ];

  const handleLaunchScenarioA = () => {
    if (onLaunchDemoScenario) {
      onLaunchDemoScenario('A');
    } else if (onNavigateToTab) {
      onNavigateToTab('campaigns');
    }
  };

  const handleLaunchScenarioB = () => {
    if (onLaunchDemoScenario) {
      onLaunchDemoScenario('B');
    } else if (onNavigateToTab) {
      onNavigateToTab('qa-center');
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Workflow className="h-3.5 w-3.5" />
            <span>Interactive Platform Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            How ShopGrow AI Turns Customer Databases into Repeat Sales
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Follow the 10-stage compliant automation pipeline from spreadsheet ingest and TRAI opt-in verification to AI-powered WhatsApp campaigns, social lead attribution, and confirmed in-store revenue.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStoryboard(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition active:scale-98"
            >
              <Eye className="h-4 w-4" />
              <span>Watch Interactive Storyboard Demo</span>
            </button>

            <button
              onClick={handleLaunchScenarioA}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-3 rounded-xl flex items-center space-x-2 transition"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span>Run Guided Demo: Hydraulic Bed Launch</span>
            </button>

            <button
              onClick={handleLaunchScenarioB}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-3 rounded-xl flex items-center space-x-2 transition"
            >
              <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
              <span>Run Guided Demo: Facebook Comment to WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guided Scenario Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Scenario A • Cross-Category Campaign
              </span>
              <span className="text-xs text-slate-500 font-mono">3-Minute Workflow</span>
            </div>
            <h3 className="text-base font-bold text-white">Hydraulic Storage Bed Arrival</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Demonstrates adding a high-ticket furniture piece, targeting past living room & dining buyers using <strong>Cross-Category Awareness</strong>, generating Bengali/English AI copy, and dispatching via the 5-stage stepper.
            </p>
          </div>
          <button
            onClick={handleLaunchScenarioA}
            className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 transition"
          >
            <span>Launch Hydraulic Bed Demo Flow</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                Scenario B • Social Lead Attribution
              </span>
              <span className="text-xs text-slate-500 font-mono">End-to-End Funnel</span>
            </div>
            <h3 className="text-base font-bold text-white">Facebook Ad Comment → Store Visit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Demonstrates simulating a customer comment on a Facebook smartphone ad, instant AI qualification (Lead Score 88), Messenger DM response, opt-in consent capture, and attributed showroom POS sale.
            </p>
          </div>
          <button
            onClick={handleLaunchScenarioB}
            className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 transition"
          >
            <span>Launch Facebook Lead Simulation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 10-Stage Visual Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              <span>10-Stage Retail Automation Pipeline</span>
            </h2>
            <p className="text-xs text-slate-400">
              Click any stage below to inspect its execution mechanics and safety guardrails.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Selected Stage: #{activeStep} of 10
          </span>
        </div>

        {/* Pipeline Stepper Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = activeStep === stage.num;
            return (
              <button
                key={stage.num}
                onClick={() => setActiveStep(stage.num)}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center space-y-1.5 transition ${
                  isSelected 
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold">#{stage.num}</span>
                <span className="text-[10px] text-center line-clamp-1">{stage.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        {(() => {
          const currentStage = pipelineStages.find(s => s.num === activeStep) || pipelineStages[0];
          const Icon = currentStage.icon;
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">Stage #{currentStage.num}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {currentStage.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{currentStage.title}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={activeStep <= 1}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={activeStep >= 10}
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="md:col-span-2 space-y-3">
                  <h4 className="font-semibold text-slate-200">How It Operates:</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{currentStage.description}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Safety & Anti-Spam Guardrail</span>
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {currentStage.safetyRule}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Storyboard Walkthrough Modal */}
      {showStoryboard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">ShopGrow AI Storyboard Demo</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Slide {storyboardSlide + 1} of {storyboardSlides.length}
                </span>
              </div>
              <button
                onClick={() => setShowStoryboard(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Slide Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  Phase {storyboardSlide + 1}
                </span>
                <h2 className="text-xl font-bold text-white">
                  {storyboardSlides[storyboardSlide].title}
                </h2>
                <p className="text-xs text-slate-400">
                  {storyboardSlides[storyboardSlide].subtitle}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {storyboardSlides[storyboardSlide].content}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{storyboardSlides[storyboardSlide].highlight}</span>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex space-x-1.5">
                {storyboardSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStoryboardSlide(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === storyboardSlide ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={storyboardSlide === 0}
                  onClick={() => setStoryboardSlide(prev => prev - 1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 transition"
                >
                  Previous
                </button>
                {storyboardSlide < storyboardSlides.length - 1 ? (
                  <button
                    onClick={() => setStoryboardSlide(prev => prev + 1)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition flex items-center space-x-1"
                  >
                    <span>Next Slide</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowStoryboard(false);
                      handleLaunchScenarioA();
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
                  >
                    Done & Try Live App
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
