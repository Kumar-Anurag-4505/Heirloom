'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2, ArrowRight, AlertTriangle, UserCheck, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function EmergencyLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Simulation Step States
  const [step, setStep] = useState<1 | 2>(1);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields for Step 2
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');

  const handleVerifyOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get(`/emergency/eligible-policies?ownerEmail=${ownerEmail}`);
      
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setPolicies(result.data);
        setSelectedPolicyId(result.data[0].id);
        setStep(2);
      } else {
        setError('No eligible legacy policies found for this owner relation.');
      }
    } catch (err: any) {
      setError(err.message || 'Target owner verification connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please authenticate prior to submitting a legacy claim request');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const targetPolicy = policies.find(p => p.id === selectedPolicyId);
      const ownerPingId = targetPolicy?.ownerPingId;

      if (!ownerPingId) {
        setError('Target owner session identifier unresolved');
        return;
      }

      const result = await api.post('/emergency/request', {
        policyId: selectedPolicyId,
        ownerPingId,
        requesterPingId: user.id,
        urgencyReason
      });

      if (!result.success) {
        setError(result.message || 'Failed to submit request');
        return;
      }

      router.push(`/emergency/request/${result.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Access gateway submission timed out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black">
      <div className="w-full max-w-md">
        
        {/* Brand Banner */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Heirloom Break-Glass</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-6 rounded-xl border border-white/5 bg-neutral-950/30"
        >
          {error && (
            <div className="p-3 mb-6 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            // Step 1: Verification
            <form onSubmit={handleVerifyOwner} className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight mb-1">Verify Legacy Owner</h2>
                <p className="text-xs text-neutral-400">Specify details of the legacy account owner you are requesting access to.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Target Owner Email</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="e.g. rahul@heirloom.io"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 focus:border-red-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Your Verified Email</label>
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="e.g. priya@heirloom.io"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 focus:border-red-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup Access Policies'}
              </button>
            </form>
          ) : (
            // Step 2: Request Form
            <form onSubmit={handleRequestSubmit} className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight mb-1">Submit Break-Glass Request</h2>
                <p className="text-xs text-neutral-400">Select policy rules. Requests require verifier evidence check.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Conditional Access Policy</label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white outline-none"
                >
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (IF {p.targetRelationship} ON {p.eventTrigger})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Urgency Reason / Case notes</label>
                <textarea
                  value={urgencyReason}
                  onChange={(e) => setUrgencyReason(e.target.value)}
                  placeholder="Please state details regarding the emergency scenario (e.g. hospital admission or device lockouts)."
                  required
                  minLength={10}
                  className="w-full h-24 px-3 py-2 bg-neutral-900 border border-white/10 focus:border-red-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 rounded-lg transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/10"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Claim'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
