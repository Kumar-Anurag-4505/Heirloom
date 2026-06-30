'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Loader2, 
  Trash2, 
  Check, 
  X as XIcon, 
  FileText, 
  Smartphone, 
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyRequest {
  id: string;
  status: string;
  urgencyReason: string;
  evidenceDocument?: string;
  createdAt: string;
  policy: { name: string; durationHours: number };
  requester: { name: string; email: string };
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/emergency/requests', {
        headers: { 'Authorization': 'Bearer mock-pass' }
      });
      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (err) {
      setError('Failed to query access requests directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/emergency/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer mock-pass' }
      });
      const result = await response.json();
      if (result.success) {
        await fetchRequests();
      } else {
        setError(result.message || `Failed to ${action} request`);
      }
    } catch (err) {
      setError(`Access gateway dispatch error during ${action}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Bar */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Inbound Emergency Access Claims</h1>
        <p className="text-xs text-neutral-400">Review, assess evidence, and authorize emergency break-glass access requests.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Querying Access Directories...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-white/10 text-neutral-500 space-y-4">
          <ShieldAlert className="w-10 h-10 text-neutral-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No Pending Claims</p>
            <p className="text-xs text-neutral-400 mt-1">When emergency contacts trigger break-glass requests, they will pop up here for approval.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Headers */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-red-400" />
                      Access Claim from {req.requester.name}
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-mono mt-1">Requester: {req.requester.email}</p>
                  </div>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    req.status === 'APPROVED'
                      ? 'bg-green-950/40 text-green-400 border-green-500/20'
                      : req.status === 'REJECTED'
                        ? 'bg-red-950/40 text-red-400 border-red-500/20'
                        : 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20 animate-pulse'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Scope Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-black/40 border border-white/5 text-xs text-neutral-400 font-mono">
                  <div>
                    <span className="text-[9px] text-neutral-600 block mb-1">BOUND POLICY</span>
                    <span className="text-white font-medium">{req.policy.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-600 block mb-1">ACCESSIBLE TERM</span>
                    <span className="text-white font-medium">{req.policy.durationHours} Hours</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-600 block mb-1">EVIDENCE ATTACHED</span>
                    {req.evidenceDocument ? (
                      <a
                        href={req.evidenceDocument}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 font-medium hover:underline flex items-center gap-1"
                      >
                        View Proof File
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-neutral-500">None uploaded yet</span>
                    )}
                  </div>
                </div>

                {/* Urgency Description */}
                <div>
                  <span className="text-[10px] font-semibold text-neutral-500 block mb-1">URGENCY DESCRIPTION</span>
                  <p className="text-xs text-neutral-300 leading-relaxed font-light">
                    {req.urgencyReason}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {req.status !== 'APPROVED' && req.status !== 'REJECTED' && (
                <div className="flex items-center justify-end space-x-3 border-t border-white/5 pt-4 mt-6">
                  <button
                    onClick={() => handleAction(req.id, 'reject')}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-xs font-semibold transition-all"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    Deny
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'approve')}
                    className="flex items-center gap-1 py-1.5 px-4 rounded-lg border border-green-500/25 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-all shadow-lg shadow-green-500/10"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve & Grant Scopes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
