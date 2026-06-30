'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus, 
  Loader2, 
  Trash2, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Key,
  Lock,
  ArrowRight,
  Database,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Asset {
  id: string;
  title: string;
  category: string;
}

interface Policy {
  id: string;
  name: string;
  targetRelationship: string;
  eventTrigger: string;
  maxRiskThreshold: string;
  requiresVerifier: boolean;
  timeDelayHours: number;
  durationHours: number;
  assets: { asset: Asset }[];
  isEnabled: boolean;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetRelationship, setTargetRelationship] = useState('SPOUSE');
  const [eventTrigger, setEventTrigger] = useState('MEDICAL_EMERGENCY');
  const [maxRiskThreshold, setMaxRiskThreshold] = useState('HIGH');
  const [requiresVerifier, setRequiresVerifier] = useState(true);
  const [timeDelayHours, setTimeDelayHours] = useState(0);
  const [durationHours, setDurationHours] = useState(24);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [policiesData, assetsData] = await Promise.all([
        api.get('/policies'),
        api.get('/assets')
      ]);

      if (policiesData.success) setPolicies(policiesData.data);
      if (assetsData.success) setAssets(assetsData.data);
    } catch (err) {
      setError('Failed to fetch rules from access policy controller');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAsset = (assetId: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId) 
        : [...prev, assetId]
    );
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0) {
      setError('Please bind at least one vault asset to this access rule');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.post('/policies', {
        name,
        description,
        targetRelationship,
        eventTrigger,
        maxRiskThreshold,
        requiresVerifier,
        timeDelayHours: Number(timeDelayHours),
        durationHours: Number(durationHours),
        assetIds: selectedAssetIds
      });

      if (!result.success) {
        setError(result.message || 'Failed to compile visual policy');
        return;
      }

      await fetchData();
      setName('');
      setDescription('');
      setTargetRelationship('SPOUSE');
      setEventTrigger('MEDICAL_EMERGENCY');
      setMaxRiskThreshold('HIGH');
      setRequiresVerifier(true);
      setTimeDelayHours(0);
      setDurationHours(24);
      setSelectedAssetIds([]);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Policy engine compilation dispatch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this access policy?')) return;
    try {
      await api.delete(`/policies/${policyId}`);
      await fetchData();
    } catch (err) {
      setError('Failed to revoke policy');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Emergency Access Policies</h1>
          <p className="text-xs text-neutral-400">Visually compile conditional access policies. Evaluated dynamically post step-up verification.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="glow-button flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20"
        >
          <Plus className="w-4 h-4" />
          Create Access Policy
        </button>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Querying Access Decision Engine...</span>
        </div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-white/10 text-neutral-500 space-y-4">
          <Sliders className="w-10 h-10 text-neutral-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No Policies Compiled</p>
            <p className="text-xs text-neutral-400 mt-1">Configure conditional rules outlining who receives break-glass access under what event conditions.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg transition-all"
          >
            Create Policy
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel relative overflow-hidden"
            >
              {/* Top Details */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    {policy.name}
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1 font-mono">ID: {policy.id}</p>
                </div>
                <button
                  onClick={() => handleDeletePolicy(policy.id)}
                  className="p-1.5 rounded-lg border border-white/5 text-neutral-500 hover:text-red-400 hover:border-red-500/20 transition-all hover:bg-red-950/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Rules Evaluation Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-black/40 border border-white/5 text-xs text-neutral-400 font-mono mb-4">
                <div>
                  <span className="text-[9px] text-neutral-600 block mb-1">IF RELATIONSHIP</span>
                  <span className="text-blue-400 font-semibold">{policy.targetRelationship}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-600 block mb-1">ON EVENT TRIGGER</span>
                  <span className="text-indigo-400 font-semibold">{policy.eventTrigger}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-600 block mb-1">APPROVAL DELAY</span>
                  <span className="text-white font-semibold">
                    {policy.timeDelayHours > 0 ? `${policy.timeDelayHours}h Delay` : 'Immediate'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-600 block mb-1">GRANT DURATION</span>
                  <span className="text-emerald-400 font-semibold">{policy.durationHours} Hours</span>
                </div>
              </div>

              {/* Associated Bound Assets list */}
              <div>
                <span className="text-[10px] font-semibold text-neutral-500 block mb-2 uppercase tracking-widest">Bound Assets Scope ({policy.assets.length})</span>
                <div className="flex flex-wrap gap-2">
                  {policy.assets.map((b) => (
                    <div
                      key={b.asset.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-white/5 text-[10px] text-neutral-300"
                    >
                      <Database className="w-3 h-3 text-neutral-500" />
                      {b.asset.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Visual Policy Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel bg-neutral-950 p-6 rounded-xl border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-500" />
                  Compile Conditional Access Policy
                </h2>
                <p className="text-xs text-neutral-400">Azure Conditional Access blocks compiled directly into decision mappings.</p>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreatePolicy} className="space-y-6">
                {/* Policy Identification */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Policy Reference Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Spouse Break-Glass Medical Scope"
                      required
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none"
                    />
                  </div>
                </div>

                {/* Conditional Rules Visual Matrix */}
                <div className="p-4 rounded-lg bg-black/50 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">Rule Conditions (IF)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-500 mb-2">Target Relationship Role</label>
                      <select
                        value={targetRelationship}
                        onChange={(e) => setTargetRelationship(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white outline-none"
                      >
                        <option value="SPOUSE">SPOUSE</option>
                        <option value="SIBLING">SIBLING</option>
                        <option value="CHILD">CHILD</option>
                        <option value="ATTORNEY">ATTORNEY</option>
                        <option value="TRUSTED_REPRESENTATIVE">TRUSTED_REPRESENTATIVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-500 mb-2">Trigger Incident Trigger</label>
                      <select
                        value={eventTrigger}
                        onChange={(e) => setEventTrigger(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white outline-none"
                      >
                        <option value="MEDICAL_EMERGENCY">MEDICAL_EMERGENCY</option>
                        <option value="INCAPACITATION">INCAPACITATION</option>
                        <option value="DECEASED">DECEASED</option>
                        <option value="DEVICE_LOCKOUT_ESCALATE">DEVICE_LOCKOUT_ESCALATE</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-500 mb-2">Max Protect Risk</label>
                      <select
                        value={maxRiskThreshold}
                        onChange={(e) => setMaxRiskThreshold(e.target.value)}
                        className="w-full px-2 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white outline-none"
                      >
                        <option value="LOW">Low Only</option>
                        <option value="MEDIUM">Medium or Less</option>
                        <option value="HIGH">High Allowed</option>
                        <option value="CRITICAL">Allow Critical Risk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-500 mb-2">Delay Buffer (Hours)</label>
                      <input
                        type="number"
                        min={0}
                        value={timeDelayHours}
                        onChange={(e) => setTimeDelayHours(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-500 mb-2">Valid Grant (Hours)</label>
                      <input
                        type="number"
                        min={1}
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="requiresVerifier"
                      checked={requiresVerifier}
                      onChange={(e) => setRequiresVerifier(e.target.checked)}
                      className="rounded border-white/10 bg-neutral-900 text-blue-600 focus:ring-0"
                    />
                    <label htmlFor="requiresVerifier" className="text-[10px] text-neutral-400 font-semibold cursor-pointer">
                      Mandate Out-of-band Verifier approval signatures
                    </label>
                  </div>
                </div>

                {/* Target Scope multi-select panel */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Select Protected Assets Scope (THEN GRANT)</label>
                  
                  {assets.length === 0 ? (
                    <div className="p-4 text-center rounded-lg border border-white/5 text-neutral-500 text-xs">
                      No assets found. Create assets inside Vault first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto p-2 border border-white/5 rounded-lg bg-neutral-950">
                      {assets.map((asset) => {
                        const isSelected = selectedAssetIds.includes(asset.id);
                        return (
                          <div
                            key={asset.id}
                            onClick={() => handleToggleAsset(asset.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                              isSelected
                                ? 'border-blue-500 bg-blue-950/20 text-white'
                                : 'border-white/5 bg-neutral-900/40 text-neutral-400 hover:border-white/10'
                            }`}
                          >
                            <span className="font-semibold truncate">{asset.title}</span>
                            <span className="text-[9px] opacity-60 uppercase">{asset.category}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedAssetIds.length === 0}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Compile Visual Policy Matrix'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
