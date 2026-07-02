'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Loader2, 
  Clock, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Request {
  id: string;
  status: 'SUBMITTED' | 'UNDER_VERIFIER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  urgencyReason: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  policy: { id: string; name: string; durationHours: number };
}

interface Connection {
  id: string;
  name: string;
  email: string;
  relationship: string;
  trustLevel: string;
  ownerUserId: string;
}

interface Policy {
  id: string;
  name: string;
  description: string;
}

export default function MyAccessRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Request Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');
  const [eligiblePolicies, setEligiblePolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [urgencyReason, setUrgencyReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequestsData = async () => {
    setIsLoading(true);
    try {
      const [reqsRes, connsRes] = await Promise.all([
        api.get('/trusted-connections/history'),
        api.get('/trusted-connections/connections')
      ]);

      if (reqsRes.success) {
        // Filter requests made by me
        const me = reqsRes.data.requests || [];
        setRequests(me);
      }
      if (connsRes.success) {
        // Connections where I am the contact (trustingOthers) are the owners I can request access from
        setConnections(connsRes.data.trustingOthers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsData();
  }, []);

  // Fetch policies when user selects an owner
  useEffect(() => {
    const loadPolicies = async () => {
      if (!selectedOwnerEmail) {
        setEligiblePolicies([]);
        setSelectedPolicyId('');
        return;
      }
      try {
        const res = await api.get(`/emergency/eligible-policies?ownerEmail=${selectedOwnerEmail}`);
        if (res.success) {
          setEligiblePolicies(res.data);
          if (res.data.length > 0) {
            setSelectedPolicyId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPolicies();
  }, [selectedOwnerEmail]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerEmail || !selectedPolicyId || !urgencyReason.trim()) {
      setModalError('All fields are required');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const owner = connections.find(c => c.email === selectedOwnerEmail);
    if (!owner) {
      setModalError('Selected owner connection is invalid');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await api.post('/emergency/request', {
        policyId: selectedPolicyId,
        ownerPingId: owner.ownerUserId,
        urgencyReason
      });

      if (result.success) {
        showToast('Emergency access request submitted', 'success');
        setIsModalOpen(false);
        setUrgencyReason('');
        setSelectedOwnerEmail('');
        await fetchRequestsData();
      } else {
        setModalError(result.message || 'Request failed validation');
      }
    } catch (err: any) {
      setModalError(err.message || 'Communication with legacy nodes failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending emergency request?')) return;
    try {
      // Rejecting an emergency request as the requester counts as cancellation
      const result = await api.post(`/emergency/${id}/reject`);
      if (result.success) {
        showToast('Access request cancelled successfully', 'success');
        await fetchRequestsData();
      }
    } catch (err) {
      showToast('Failed to cancel request', 'error');
    }
  };

  // Group requests
  const pendingRequests = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_VERIFIER_REVIEW');
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');
  const expiredRequests = requests.filter(r => r.status === 'EXPIRED');

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">My Access Claims</h1>
          <p className="text-xs text-neutral-400">Initiate and monitor break-glass emergency claims toward trusted connection vaults.</p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="glow-button flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20"
        >
          <Plus className="w-4 h-4" />
          Submit Access Claim
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Syncing Claims Ledger...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Pending Requests Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
              Pending Claims ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-[11px] text-neutral-500 italic bg-neutral-950/20 p-4 rounded-lg border border-white/5">No active pending access claims.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingRequests.map(r => (
                  <div key={r.id} className="p-5 rounded-xl border border-yellow-500/20 bg-neutral-950/30 glass-panel flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-bold text-yellow-400 uppercase bg-yellow-950/30 border border-yellow-500/10 px-2 py-0.5 rounded tracking-wider">
                          {r.status}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Target Owner: {r.owner.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-mono mb-2">{r.owner.email}</p>
                      <p className="text-[11px] text-neutral-400 mt-2 italic font-light">" {r.urgencyReason} "</p>
                    </div>

                    <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-between">
                      <span className="text-[9px] text-neutral-600 font-mono">Policy: {r.policy.name}</span>
                      <button
                        onClick={() => handleCancelRequest(r.id)}
                        className="py-1 px-3 border border-red-500/20 hover:bg-red-950/20 text-red-400 text-[10px] font-semibold rounded-lg transition-all"
                      >
                        Cancel Claim
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Approved Requests Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Approved Claims ({approvedRequests.length})
            </h3>
            {approvedRequests.length === 0 ? (
              <p className="text-[11px] text-neutral-500 italic bg-neutral-950/20 p-4 rounded-lg border border-white/5">No approved access claims.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {approvedRequests.map(r => (
                  <div key={r.id} className="p-5 rounded-xl border border-emerald-500/20 bg-neutral-950/30 glass-panel flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/10 px-2 py-0.5 rounded tracking-wider uppercase">
                          {r.status}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Target Owner: {r.owner.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-mono mb-2">{r.owner.email}</p>
                      <p className="text-[11px] text-neutral-400 mt-2 italic font-light">" {r.urgencyReason} "</p>
                    </div>

                    <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-between text-[9px] text-neutral-500">
                      <span className="font-mono">Policy: {r.policy.name}</span>
                      <span className="text-emerald-400 font-bold">Active Scope</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Rejected & Expired Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rejected */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                Declined Claims ({rejectedRequests.length})
              </h3>
              {rejectedRequests.length === 0 ? (
                <p className="text-[11px] text-neutral-600 italic bg-neutral-950/10 p-4 rounded-lg border border-white/2px">No declined claims.</p>
              ) : (
                <div className="space-y-3">
                  {rejectedRequests.map(r => (
                    <div key={r.id} className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400">{r.owner.name}</h4>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[200px]">{r.owner.email}</p>
                      </div>
                      <span className="text-[9px] bg-red-950/30 text-red-400 border border-red-500/10 px-2 py-0.5 rounded uppercase">
                        Declined
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expired */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                Expired Claims ({expiredRequests.length})
              </h3>
              {expiredRequests.length === 0 ? (
                <p className="text-[11px] text-neutral-600 italic bg-neutral-950/10 p-4 rounded-lg border border-white/2px">No expired claims.</p>
              ) : (
                <div className="space-y-3">
                  {expiredRequests.map(r => (
                    <div key={r.id} className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400">{r.owner.name}</h4>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[200px]">{r.owner.email}</p>
                      </div>
                      <span className="text-[9px] bg-neutral-900 border border-white/10 px-2 py-0.5 rounded text-neutral-500 uppercase">
                        Expired
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel bg-neutral-950 p-6 rounded-xl border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-blue-500" />
                  Initiate Break-Glass Claim
                </h2>
                <p className="text-xs text-neutral-400">
                  Claims trigger LDAP verification policies and time-delayed lock checks.
                </p>
              </div>

              {modalError && (
                <div className="mb-4 p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {connections.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  You do not have any verified connection profiles trusting you. You can only request access from users who have added you as emergency contact.
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Select Legacy Owner Profile</label>
                    <select
                      value={selectedOwnerEmail}
                      onChange={(e) => setSelectedOwnerEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="">-- Choose Trusted Profile --</option>
                      {connections.map(c => (
                        <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  {selectedOwnerEmail && eligiblePolicies.length === 0 ? (
                    <div className="p-3 bg-blue-950/10 border border-blue-500/10 rounded-lg text-[10px] text-blue-400">
                      Scanning directory... No access policy matches your verified connection role scope.
                    </div>
                  ) : selectedOwnerEmail && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-2">Select Active Policy Trigger</label>
                      <select
                        value={selectedPolicyId}
                        onChange={(e) => setSelectedPolicyId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                      >
                        {eligiblePolicies.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Urgency Reason / Evidence Details</label>
                    <textarea
                      value={urgencyReason}
                      onChange={(e) => setUrgencyReason(e.target.value)}
                      placeholder="Specify the reason or upload evidence details verifying medical or legal break-glass scope needs."
                      required
                      rows={3}
                      className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPolicyId}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Request
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-in toast notification portal */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold border ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-950/80 border-red-500/20 text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
