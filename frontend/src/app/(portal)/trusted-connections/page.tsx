'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Loader2, 
  UserCheck, 
  UserX,
  Mail, 
  Check, 
  X as XIcon,
  Shield,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Invitation {
  id: string;
  ownerPingId: string;
  ownerName: string;
  ownerEmail: string;
  relationship: string;
  trustLevel: string;
  createdAt: string;
}

interface Connection {
  id: string;
  name: string;
  email: string;
  relationship: string;
  trustLevel: string;
  contactUserId?: string;
  ownerUserId?: string;
}

export default function TrustedConnectionsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [trustingOthers, setTrustingOthers] = useState<Connection[]>([]); // People who trust me
  const [trustedByOthers, setTrustedByOthers] = useState<Connection[]>([]); // People I trust
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConnectionsData = async () => {
    setIsLoading(true);
    try {
      const [invitesRes, connRes] = await Promise.all([
        api.get('/trusted-connections/invitations'),
        api.get('/trusted-connections/connections')
      ]);

      if (invitesRes.success) {
        setInvitations(invitesRes.data);
      }
      if (connRes.success) {
        setTrustingOthers(connRes.data.trustingOthers);
        setTrustedByOthers(connRes.data.trustedByOthers);
      }
    } catch (err) {
      setError('Failed to fetch connections network');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionsData();
  }, []);

  const handleAccept = async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await api.post(`/trusted-connections/invitations/${id}/accept`);
      if (result.success) {
        showToast('Trusted connection invitation accepted', 'success');
        await fetchConnectionsData();
      } else {
        showToast(result.message || 'Failed to accept invitation', 'error');
      }
    } catch (err) {
      showToast('Error accepting invitation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to decline this trusted connection invitation?')) return;
    setIsSubmitting(true);
    try {
      const result = await api.post(`/trusted-connections/invitations/${id}/reject`);
      if (result.success) {
        showToast('Invitation declined', 'success');
        await fetchConnectionsData();
      } else {
        showToast(result.message || 'Failed to decline invitation', 'error');
      }
    } catch (err) {
      showToast('Error declining invitation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Trusted Connections Directory</h1>
        <p className="text-xs text-neutral-400">Establish and authorize bilateral relationships for delegated emergency access.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Syncing Trust Directory Node Relationships...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Invitations Section */}
          {invitations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                <Shield className="w-3.5 h-3.5" />
                Connection Requests Awaiting Your Approval ({invitations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitations.map((inv) => (
                  <div 
                    key={inv.id}
                    className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{inv.ownerName}</h4>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{inv.ownerEmail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-neutral-900 border border-white/10 px-2 py-0.5 rounded text-neutral-300">
                          Role: {inv.relationship}
                        </span>
                        <span className="text-[9px] bg-neutral-900 border border-white/10 px-2 py-0.5 rounded text-neutral-300">
                          {inv.trustLevel === 'LEVEL_1_IMMEDIATE' ? 'Immediate Unlock' : 'Delayed Lockout Check'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAccept(inv.id)}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold flex items-center justify-center transition-all disabled:opacity-50"
                        title="Accept Invitation"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(inv.id)}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-red-400 transition-all disabled:opacity-50"
                        title="Decline Invitation"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trusted Connections Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incoming: People who trust me */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                People Who Trust Me ({trustingOthers.length})
              </h3>
              
              {trustingOthers.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-white/5 text-center text-xs text-neutral-500">
                  No verified connection profiles trust you yet. After you accept an invitation, it will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {trustingOthers.map((c) => (
                    <div 
                      key={c.id}
                      className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-900/10 border border-blue-500/20 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                          <p className="text-[10px] text-neutral-500 font-mono">{c.email}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold bg-blue-950/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-wider">
                          {c.relationship}
                        </span>
                        <span className="text-[8px] text-neutral-600 block mt-1">
                          {c.trustLevel === 'LEVEL_1_IMMEDIATE' ? 'Immediate Access' : 'Delayed Access'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing: People I trust */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                People I Trust ({trustedByOthers.length})
              </h3>

              {trustedByOthers.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-white/5 text-center text-xs text-neutral-500">
                  No outgoing active connections. Navigate to "Emergency Contacts" or "Financial Nominees" to invite trusted persons.
                </div>
              ) : (
                <div className="space-y-3">
                  {trustedByOthers.map((c) => (
                    <div 
                      key={c.id}
                      className="p-4 rounded-lg bg-neutral-950/40 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/10 border border-indigo-500/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                          <p className="text-[10px] text-neutral-500 font-mono">{c.email}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold bg-indigo-950/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-wider">
                          {c.relationship}
                        </span>
                        <span className="text-[8px] text-neutral-600 block mt-1">
                          {c.trustLevel === 'LEVEL_1_IMMEDIATE' ? 'Immediate Access' : 'Delayed Access'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
