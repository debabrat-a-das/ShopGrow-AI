import React, { useEffect, useState } from 'react';
import { 
  Sparkles, Send, CheckCircle2, AlertTriangle, ShieldCheck, 
  Users, Bot, Radio, ArrowRight, RefreshCw, FileText, Check, Clock,
  Package, Tag, Layers, CheckSquare, Square, Search, Filter,
  BarChart3, Eye, Phone, Calendar, ArrowUpRight, AlertCircle, XCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Offer, Campaign, Product, AudienceMode, CampaignDispatchState } from '../types';

interface CampaignStudioProps {
  preselectedOfferId?: string | null;
  preselectedProductId?: string | null;
  onCampaignDispatched: () => void;
}

export const CampaignStudio: React.FC<CampaignStudioProps> = ({
  preselectedOfferId,
  preselectedProductId,
  onCampaignDispatched
}) => {
  // Campaign Mode: Offer Promo vs New Product Arrival
  const [campaignMode, setCampaignMode] = useState<'OFFER' | 'PRODUCT'>(
    preselectedProductId ? 'PRODUCT' : 'OFFER'
  );

  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Audience Modes & Custom Instructions
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('AI_RECOMMENDED');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [recommendation, setRecommendation] = useState<any>(null);

  // Customer Table fine-tuning
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [showFullCustomerTable, setShowFullCustomerTable] = useState<boolean>(false);

  // AI Copy Generation
  const [variants, setVariants] = useState<any>(null);
  const [selectedVariantKey, setSelectedVariantKey] = useState<string>('banglish');
  const [messageTemplate, setMessageTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');

  // Approval & Multi-State Sending Stepper
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  const [dispatchState, setDispatchState] = useState<CampaignDispatchState>('IDLE');
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [bypassQuietHours, setBypassQuietHours] = useState<boolean>(true);

  // Detailed Campaign Result Modal
  const [isResultReportOpen, setIsResultReportOpen] = useState<boolean>(false);
  const [campaignReportData, setCampaignReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (preselectedProductId) {
      setCampaignMode('PRODUCT');
      setSelectedProductId(preselectedProductId);
      setAudienceMode('CROSS_CATEGORY');
      handleSelectProduct(preselectedProductId, 'CROSS_CATEGORY');
    } else if (preselectedOfferId) {
      setCampaignMode('OFFER');
      setSelectedOfferId(preselectedOfferId);
      handleSelectOffer(preselectedOfferId, audienceMode);
    }
  }, [preselectedOfferId, preselectedProductId]);

  const fetchData = async () => {
    try {
      const [offRes, prodRes] = await Promise.all([
        api.get('/offers').catch(() => []),
        api.get('/products').catch(() => [])
      ]);

      const activeOffers = (offRes || []).filter((o: Offer) => o.active_status);
      setOffers(activeOffers);
      setProducts(prodRes || []);

      if (!preselectedOfferId && !preselectedProductId) {
        if (activeOffers.length > 0) {
          setSelectedOfferId(activeOffers[0].id);
          handleSelectOffer(activeOffers[0].id, 'AI_RECOMMENDED');
        } else if (prodRes && prodRes.length > 0) {
          setCampaignMode('PRODUCT');
          setSelectedProductId(prodRes[0].id);
          handleSelectProduct(prodRes[0].id, 'CROSS_CATEGORY');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectOffer = async (offerId: string, mode: AudienceMode = audienceMode) => {
    setSelectedOfferId(offerId);
    setSelectedProductId('');
    setLoading(true);
    setDispatchResult(null);
    setCreatedCampaign(null);
    setDispatchState('IDLE');
    setDispatchError(null);

    try {
      // 1. Get Audience Recommendation with mode
      const recRes = await api.post('/campaigns/recommend-segment', { 
        offer_id: offerId,
        audience_mode: mode,
        custom_instruction: customInstruction
      });
      setRecommendation(recRes);

      // Pre-select all eligible customers
      const eligibleIds = (recRes.customerList || []).filter((c: any) => c.is_selected).map((c: any) => c.id);
      setSelectedCustomerIds(eligibleIds);

      // 2. Generate Copy Variants
      const copyRes = await api.post('/campaigns/generate-copy', { 
        offer_id: offerId,
        custom_instruction: customInstruction 
      });

      const resolvedVariants = copyRes?.variants || copyRes?.data?.variants;
      if (!resolvedVariants) {
        throw new Error(copyRes?.error || 'AI copy variants could not be generated for this offer.');
      }

      setVariants(resolvedVariants);
      const initialTemplate = resolvedVariants.banglish 
        || resolvedVariants.friendlyBengali 
        || resolvedVariants.professionalEnglish 
        || resolvedVariants.shortWhatsApp 
        || '';
      setMessageTemplate(initialTemplate);

      const brand = recRes?.offer?.brand || '';
      const model = recRes?.offer?.model || '';
      setCampaignName(brand || model ? `${brand} ${model} Upgrade Festival`.trim() : 'Special Offer Campaign');
    } catch (err: any) {
      alert('Failed to analyze offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (productId: string, mode: AudienceMode = audienceMode) => {
    setSelectedProductId(productId);
    setSelectedOfferId('');
    setLoading(true);
    setDispatchResult(null);
    setCreatedCampaign(null);
    setDispatchState('IDLE');
    setDispatchError(null);

    try {
      // 1. Get Product Audience Recommendation with mode
      const recRes = await api.post('/campaigns/recommend-segment', { 
        product_id: productId,
        audience_mode: mode,
        custom_instruction: customInstruction
      });
      setRecommendation(recRes);

      const eligibleIds = (recRes.customerList || []).filter((c: any) => c.is_selected).map((c: any) => c.id);
      setSelectedCustomerIds(eligibleIds);

      // 2. Generate Product Copy Variants
      const copyRes = await api.post('/campaigns/generate-copy-product', { 
        product_id: productId,
        custom_instruction: customInstruction 
      });

      const resolvedVariants = copyRes?.variants || copyRes?.data?.variants;
      if (!resolvedVariants) {
        throw new Error(copyRes?.error || 'AI copy variants could not be generated for this product.');
      }

      setVariants(resolvedVariants);
      const initialTemplate = resolvedVariants.banglish 
        || resolvedVariants.friendlyBengali 
        || resolvedVariants.professionalEnglish 
        || resolvedVariants.shortWhatsApp 
        || '';
      setMessageTemplate(initialTemplate);

      const brand = recRes?.product?.brand || '';
      const model = recRes?.product?.model || '';
      setCampaignName(brand || model ? `New Arrival: ${brand} ${model}`.trim() : 'New Product Arrival Campaign');
    } catch (err: any) {
      alert('Failed to analyze product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceModeChange = (mode: AudienceMode) => {
    setAudienceMode(mode);
    if (campaignMode === 'OFFER' && selectedOfferId) {
      handleSelectOffer(selectedOfferId, mode);
    } else if (campaignMode === 'PRODUCT' && selectedProductId) {
      handleSelectProduct(selectedProductId, mode);
    }
  };

  const handleRegenerateWithInstruction = () => {
    if (campaignMode === 'OFFER' && selectedOfferId) {
      handleSelectOffer(selectedOfferId, audienceMode);
    } else if (campaignMode === 'PRODUCT' && selectedProductId) {
      handleSelectProduct(selectedProductId, audienceMode);
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (!recommendation?.customerList) return;
    const allEligible = recommendation.customerList.filter((c: any) => c.whatsapp_opt_in && !c.do_not_contact).map((c: any) => c.id);
    if (selectedCustomerIds.length === allEligible.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(allEligible);
    }
  };

  const handleSelectVariant = (key: string) => {
    setSelectedVariantKey(key);
    if (variants && variants[key]) {
      setMessageTemplate(variants[key]);
    } else if (variants) {
      // Fallback if specific requested key is missing or undefined
      const fallback = variants.banglish || variants.friendlyBengali || variants.professionalEnglish || variants.shortWhatsApp || '';
      setMessageTemplate(fallback);
    }
  };

  const handleCreateAndApprove = async () => {
    if ((!selectedOfferId && !selectedProductId) || !messageTemplate) return;
    setLoading(true);

    try {
      const payload: any = {
        name: campaignName,
        message_template: messageTemplate,
        language: selectedVariantKey === 'friendlyBengali' ? 'bn' : 'en',
        target_segment_criteria: recommendation.criteria,
        audience_mode: audienceMode,
        custom_instruction: customInstruction
      };

      if (campaignMode === 'PRODUCT' && selectedProductId) {
        payload.product_id = selectedProductId;
        payload.campaign_type = 'NEW_PRODUCT_ARRIVAL';
      } else {
        payload.offer_id = selectedOfferId;
        payload.campaign_type = 'SEASONAL_OFFER';
      }

      const camp = await api.post('/campaigns', payload);

      // Approve as Shop Owner
      const approved = await api.post(`/campaigns/${camp.id}/approve`);
      setCreatedCampaign(approved.campaign);
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Live Multi-Stage Dispatch Stepper: Preparing -> Validating Audience -> Queued -> Sending -> Completed
  const handleDispatchCampaign = async () => {
    if (!createdCampaign) return;
    setLoading(true);
    setDispatchError(null);

    // Stage 1: PREPARING
    setDispatchState('PREPARING');
    await new Promise(r => setTimeout(r, 450));

    // Stage 2: VALIDATING AUDIENCE
    setDispatchState('VALIDATING_AUDIENCE');
    await new Promise(r => setTimeout(r, 550));

    // Stage 3: QUEUED
    setDispatchState('QUEUED');
    await new Promise(r => setTimeout(r, 400));

    // Stage 4: SENDING
    setDispatchState('SENDING');

    try {
      const res = await api.post(`/campaigns/${createdCampaign.id}/send`, {
        selected_customer_ids: selectedCustomerIds,
        bypassQuietHours
      });

      // Stage 5: COMPLETED
      setDispatchState('COMPLETED');
      setDispatchResult(res);
      onCampaignDispatched();
    } catch (err: any) {
      setDispatchState('FAILED');
      setDispatchError(err.message || 'Campaign dispatch failed during safety check or gateway transmission.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResults = async () => {
    if (!createdCampaign) return;
    setLoadingReport(true);
    setIsResultReportOpen(true);
    try {
      const report = await api.get(`/campaigns/${createdCampaign.id}/results`);
      setCampaignReportData(report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Filtered customer list for table review
  const filteredCustomers = (recommendation?.customerList || []).filter((c: any) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || 
      c.phone_e164?.includes(q) || 
      c.model?.toLowerCase().includes(q) ||
      c.product_category?.toLowerCase().includes(q);
  });

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <span>AI Campaign Studio</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
              V2.2 Multi-Audience Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create high-converting promotions or new arrival awareness with cross-category targeting, live customer selection, and safe Meta WhatsApp delivery.
          </p>
        </div>

        {createdCampaign && dispatchState === 'COMPLETED' && (
          <button
            onClick={handleOpenResults}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span>View Campaign Report</span>
          </button>
        )}
      </div>

      {/* Step 1: Select Mode & Item */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h2 className="text-sm font-bold text-white">Choose Campaign Type & Subject</h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setCampaignMode('OFFER');
                if (offers.length > 0) handleSelectOffer(offers[0].id);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                campaignMode === 'OFFER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Special Offer Promo</span>
            </button>

            <button
              onClick={() => {
                setCampaignMode('PRODUCT');
                if (products.length > 0) handleSelectProduct(products[0].id, 'CROSS_CATEGORY');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                campaignMode === 'PRODUCT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>New Product Arrival</span>
            </button>
          </div>
        </div>

        {/* Offers Grid */}
        {campaignMode === 'OFFER' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {offers.map(o => (
              <div
                key={o.id}
                onClick={() => handleSelectOffer(o.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedOfferId === o.id
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {o.brand}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ₹{Number(o.offer_price).toLocaleString('en-IN')}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white truncate">{o.title}</h3>
                <p className="text-[11px] text-slate-400 truncate">{o.model}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Products Grid for New Arrival */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {products.map(p => {
              const isSelected = selectedProductId === p.id;
              const hasAttrs = p.custom_attributes && Object.keys(p.custom_attributes).length > 0;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 uppercase">
                        {p.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        ₹{Number(p.mrp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white truncate">{p.brand} {p.model}</h3>
                    {hasAttrs && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(p.custom_attributes || {}).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Stock: {p.stock_quantity}</span>
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Awareness Launch</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Multiple Campaign Audience Modes */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="text-sm font-bold text-white">Select Campaign Audience Mode</h2>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Strict WhatsApp Consent Enforced</span>
          </span>
        </div>

        {/* 6 Audience Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div
            onClick={() => handleAudienceModeChange('AI_RECOMMENDED')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              audienceMode === 'AI_RECOMMENDED'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between mb-1">
              <span>🤖 AI Recommended</span>
              {audienceMode === 'AI_RECOMMENDED' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Intelligent blend of mature purchase age (12-24m), brand affinity, and high lifetime value.
            </p>
          </div>

          <div
            onClick={() => handleAudienceModeChange('CROSS_CATEGORY')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              audienceMode === 'CROSS_CATEGORY'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between mb-1">
              <span>🔄 Cross-Category Awareness</span>
              {audienceMode === 'CROSS_CATEGORY' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Target customers who bought different product categories (e.g. refrigerator buyers notified of phone launch).
            </p>
          </div>

          <div
            onClick={() => handleAudienceModeChange('SAME_CATEGORY')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              audienceMode === 'SAME_CATEGORY'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between mb-1">
              <span>🏷️ Same Category Customers</span>
              {audienceMode === 'SAME_CATEGORY' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Only notify buyers who purchased within the same product vertical and are ready for upgrade.
            </p>
          </div>

          <div
            onClick={() => handleAudienceModeChange('ALL_ELIGIBLE')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              audienceMode === 'ALL_ELIGIBLE'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between mb-1">
              <span>👥 All Eligible Customers</span>
              {audienceMode === 'ALL_ELIGIBLE' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Broadcast to all store contacts with explicit WhatsApp opt-in and valid contact frequency.
            </p>
          </div>

          <div
            onClick={() => handleAudienceModeChange('CUSTOM_SEGMENT')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              audienceMode === 'CUSTOM_SEGMENT'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between mb-1">
              <span>🎯 Custom Segment</span>
              {audienceMode === 'CUSTOM_SEGMENT' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              High-value patrons (CLV &gt; ₹15,000) and long-time repeat retail buyers.
            </p>
          </div>

          <div
            onClick={() => handleAudienceModeChange('MANUAL_SELECTION')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              audienceMode === 'MANUAL_SELECTION'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between mb-1">
              <span>✍️ Manual Customer Selection</span>
              {audienceMode === 'MANUAL_SELECTION' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Hand-pick exactly which verified customers to include from the interactive table below.
            </p>
          </div>
        </div>

        {/* Live Audience Breakdown Metric Row */}
        {recommendation && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block uppercase">Total DB</span>
                <span className="text-base font-bold text-white font-mono">{recommendation.breakdown.totalDatabase}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block uppercase">Eligible</span>
                <span className="text-base font-bold text-slate-200 font-mono">{recommendation.breakdown.eligibleCustomers}</span>
              </div>
              <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-500/30">
                <span className="text-rose-400 text-[10px] block uppercase">No Consent</span>
                <span className="text-base font-bold text-rose-300 font-mono">{recommendation.breakdown.excludedNoConsent}</span>
              </div>
              <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-500/30">
                <span className="text-rose-400 text-[10px] block uppercase">Opted Out</span>
                <span className="text-base font-bold text-rose-300 font-mono">{recommendation.breakdown.excludedOptedOut || 0}</span>
              </div>
              <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
                <span className="text-amber-400 text-[10px] block uppercase">In Cooldown</span>
                <span className="text-base font-bold text-amber-300 font-mono">{recommendation.breakdown.excludedFrequencyLimit || 0}</span>
              </div>
              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/50">
                <span className="text-emerald-400 text-[10px] block uppercase font-bold">Final Selected</span>
                <span className="text-base font-black text-white font-mono">{selectedCustomerIds.length}</span>
              </div>
            </div>

            {/* AI Explanation Card */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl flex items-start space-x-3 text-xs text-slate-300">
              <Bot className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300 block mb-0.5">Audience Logic:</span>
                <p className="leading-relaxed">{recommendation.reasoning}</p>
              </div>
            </div>

            {/* Fine-Tuning Customer Selection Table Toggle */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowFullCustomerTable(!showFullCustomerTable)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1.5"
                >
                  <span>{showFullCustomerTable ? 'Hide Customer Selection List' : 'Review & Fine-Tune Individual Customers'}</span>
                  <span>({selectedCustomerIds.length} selected)</span>
                </button>

                {showFullCustomerTable && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCustomers}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    >
                      {selectedCustomerIds.length > 0 ? 'Deselect All' : 'Select All Eligible'}
                    </button>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2 top-1.5" />
                    </div>
                  </div>
                )}
              </div>

              {showFullCustomerTable && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-10"></th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Past Purchase</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Consent & Safety</th>
                        <th className="p-2.5">Mode Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredCustomers.map((c: any) => {
                        const isChecked = selectedCustomerIds.includes(c.id);
                        const canCheck = c.whatsapp_opt_in && !c.do_not_contact;

                        return (
                          <tr key={c.id} className={`hover:bg-slate-900/50 ${!canCheck ? 'opacity-40' : ''}`}>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                disabled={!canCheck}
                                onClick={() => handleToggleCustomer(c.id)}
                                className="text-slate-400 hover:text-emerald-400 disabled:cursor-not-allowed"
                              >
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td className="p-2.5 font-medium text-white">{c.full_name}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-400">{c.phone_e164}</td>
                            <td className="p-2.5 text-[11px] text-slate-300">{c.model}</td>
                            <td className="p-2.5 text-[11px] text-slate-400">{c.product_category}</td>
                            <td className="p-2.5 text-[10px]">
                              {!c.whatsapp_opt_in ? (
                                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">No Consent</span>
                              ) : c.do_not_contact ? (
                                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Opted Out</span>
                              ) : c.in_cooldown ? (
                                <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Cooldown Active</span>
                              ) : (
                                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Safe To Send</span>
                              )}
                            </td>
                            <td className="p-2.5 text-[10px] text-slate-400 truncate max-w-[200px]" title={c.match_reason}>
                              {c.match_reason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Custom Campaign Note & AI Message Copy */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center space-x-2">
          <span className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
            3
          </span>
          <h2 className="text-sm font-bold text-white">Custom Merchant Notes & AI Copy Generation</h2>
        </div>

        {/* Custom Instruction Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Custom Campaign Note / Instruction for AI (Optional):
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. This is a premium phone at launch price. Inform customers who bought appliances earlier."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleRegenerateWithInstruction}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate AI Copy</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            AI Guardrail: AI strictly incorporates your note without inventing fake discounts, stock counts, or warranty facts.
          </p>
        </div>

        {/* Language Variants Selection */}
        {variants && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleSelectVariant('banglish')}
                className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                  selectedVariantKey === 'banglish'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Banglish (Bengali in English letters)
              </button>
              <button
                onClick={() => handleSelectVariant('friendlyBengali')}
                className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                  selectedVariantKey === 'friendlyBengali'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Friendly Bengali (বাংলা)
              </button>
              <button
                onClick={() => handleSelectVariant('professionalEnglish')}
                className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                  selectedVariantKey === 'professionalEnglish'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Professional English
              </button>
              <button
                onClick={() => handleSelectVariant('shortWhatsApp')}
                className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                  selectedVariantKey === 'shortWhatsApp'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Short WhatsApp Format
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Message Editor */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">
                    WhatsApp Message Copy (Shop Owner Editable)
                  </label>
                  <textarea
                    rows={9}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Live WhatsApp Bubble Preview */}
              <div className="bg-[#0b141a] p-4 rounded-2xl border border-slate-800 relative">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                  <span>WhatsApp Smartphone Preview</span>
                  <span className="text-emerald-400">Official Meta Cloud API</span>
                </div>

                <div className="bg-[#202c33] p-3.5 rounded-2xl rounded-tl-none text-xs text-white shadow-md max-w-sm space-y-2">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {messageTemplate}
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-mono">
                    12:45 PM • Delivered
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: V1 Human Approval & Live Dispatch Stepper */}
      {messageTemplate && (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2">
            <span className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              4
            </span>
            <h2 className="text-sm font-bold text-white">Campaign Safety Verification & Send Dispatch</h2>
          </div>

          {/* Safety Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Opt-in Confirmed ({selectedCustomerIds.length} recipients)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>14-Day Frequency Cooldown</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Quiet Hours Enforced (09:00 - 21:00 IST)</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <input
              type="checkbox"
              id="bypassQuiet"
              checked={bypassQuietHours}
              onChange={(e) => setBypassQuietHours(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <label htmlFor="bypassQuiet" className="cursor-pointer">
              Bypass Quiet Hours for Demo / Sandbox Testing (Current IST: 12:45 PM)
            </label>
          </div>

          {/* Approval Action */}
          {!createdCampaign ? (
            <div className="pt-2">
              <button
                onClick={handleCreateAndApprove}
                disabled={loading || selectedCustomerIds.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Shop Owner: Authorize & Approve Campaign ({selectedCustomerIds.length} Customers)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Campaign Approved:</strong> Ready for instant dispatch to {selectedCustomerIds.length} verified customers.
                  </span>
                </div>

                <button
                  onClick={handleDispatchCampaign}
                  disabled={loading || dispatchState === 'COMPLETED'}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {dispatchState === 'COMPLETED' ? 'Campaign Dispatched!' : 'SEND CAMPAIGN NOW'}
                  </span>
                </button>
              </div>

              {/* LIVE DISPATCH PROGRESS STEPPER */}
              {dispatchState !== 'IDLE' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Live Campaign Dispatch Stepper</span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Status: {dispatchState}
                    </span>
                  </div>

                  {/* 5-Step Visual Stepper */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-center text-[10px]">
                    <div className={`p-2 rounded-lg border ${
                      ['PREPARING', 'VALIDATING_AUDIENCE', 'QUEUED', 'SENDING', 'COMPLETED'].includes(dispatchState)
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      1. Preparing
                    </div>

                    <div className={`p-2 rounded-lg border ${
                      ['VALIDATING_AUDIENCE', 'QUEUED', 'SENDING', 'COMPLETED'].includes(dispatchState)
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      2. Validating
                    </div>

                    <div className={`p-2 rounded-lg border ${
                      ['QUEUED', 'SENDING', 'COMPLETED'].includes(dispatchState)
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      3. Queued
                    </div>

                    <div className={`p-2 rounded-lg border ${
                      ['SENDING', 'COMPLETED'].includes(dispatchState)
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      4. Sending
                    </div>

                    <div className={`p-2 rounded-lg border ${
                      dispatchState === 'COMPLETED'
                        ? 'bg-emerald-600 border-emerald-400 text-white font-bold'
                        : dispatchState === 'FAILED'
                        ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      5. Completed
                    </div>
                  </div>

                  {/* Dispatch Error Message */}
                  {dispatchError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 flex items-start space-x-2">
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block">Dispatch Blocked:</strong>
                        <span>{dispatchError}</span>
                      </div>
                    </div>
                  )}

                  {/* Dispatch Success Confirmation */}
                  {dispatchResult && dispatchState === 'COMPLETED' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{dispatchResult.message}</span>
                      </div>
                      <button
                        onClick={handleOpenResults}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition"
                      >
                        Inspect Full Results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed Campaign Result Report Modal */}
      {isResultReportOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <span>Campaign Performance & Delivery Audit</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {createdCampaign?.name} • Dispatched via Meta WhatsApp Cloud Gateway
                </p>
              </div>
              <button
                onClick={() => setIsResultReportOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            {loadingReport ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading live campaign delivery telemetry...
              </div>
            ) : campaignReportData ? (
              <div className="space-y-6 text-xs">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Audience</span>
                    <span className="text-lg font-bold text-white font-mono">{campaignReportData.metrics?.total_audience}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-emerald-400 block uppercase font-bold">Delivered</span>
                    <span className="text-lg font-bold text-emerald-300 font-mono">{campaignReportData.metrics?.delivered_count}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-purple-400 block uppercase font-bold">Read</span>
                    <span className="text-lg font-bold text-purple-300 font-mono">{campaignReportData.metrics?.read_count}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-amber-400 block uppercase font-bold">Hot Leads</span>
                    <span className="text-lg font-bold text-amber-300 font-mono">{campaignReportData.metrics?.hot_leads_count}</span>
                  </div>
                </div>

                {/* Second Metrics Row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Store Visits</span>
                    <span className="text-base font-bold text-white font-mono">{campaignReportData.metrics?.store_visits_count}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Confirmed Sales</span>
                    <span className="text-base font-bold text-white font-mono">{campaignReportData.metrics?.sales_count}</span>
                  </div>
                  <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-400 block uppercase font-bold">Attributed Revenue</span>
                    <span className="text-base font-black text-emerald-300 font-mono">
                      ₹{Number(campaignReportData.metrics?.attributed_revenue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Recipient Audit Log */}
                <div className="space-y-2">
                  <span className="font-bold text-white block">Recipient Delivery Logs:</span>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Delivered At</th>
                          <th className="p-2.5">Inbound Lead</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {campaignReportData.recipients?.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-2.5 font-medium text-white">{r.customer_name}</td>
                            <td className="p-2.5 font-mono text-slate-400">{r.phone_e164}</td>
                            <td className="p-2.5">
                              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">
                                {r.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {r.delivered_at ? new Date(r.delivered_at).toLocaleTimeString() : 'Pending'}
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {r.lead_score ? (
                                <span className="text-amber-400 font-bold">Score: {r.lead_score}</span>
                              ) : (
                                'Awaiting Reply'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
