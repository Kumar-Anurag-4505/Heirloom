'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  UploadCloud, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function RequestTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evidence Form Field
  const [documentUrl, setDocumentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      const result = await api.get(`/emergency/${requestId}`);
      if (result.success) {
        setRequest(result.data);
      }
    } catch (err) {
      setError('Connection to security gateway timed out');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
    // Auto polling check every 5 seconds to mock real-time verification sync
    const interval = setInterval(fetchRequestDetails, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);

    try {
      const result = await api.post(`/emergency/${requestId}/evidence`, { documentUrl });

      if (!result.success) {
        setError(result.message || 'Failed to link evidence document');
        return;
      }

      await fetchRequestDetails();
      setDocumentUrl('');
    } catch (err) {
      setError('Connection with verifier storage server failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const steps = [
    { name: 'Request Submitted', key: 'SUBMITTED' },
    { name: 'Evidence Verification', key: 'UNDER_VERIFIER_REVIEW' },
    { name: 'Access Authorization', key: 'APPROVED' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === request?.status) !== -1 
    ? steps.findIndex(s => s.key === request?.status)
    : request?.status === 'APPROVED' ? 2 : 0;

  return (
    <div className="min-h-screen bg-black py-16 px-6 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-lg font-bold text-white tracking-tight">Access Claim Status</h1>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">ID: {requestId}</span>
        </div>

        {/* Live Timeline Gauge */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 bg-neutral-950/30">
          <h3 className="text-xs font-semibold text-white mb-6 uppercase tracking-wider">Break-Glass Progress</h3>
          
          <div className="relative pl-6 space-y-6 border-l border-white/10">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div key={step.name} className="relative">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                    isPast 
                      ? 'bg-green-950 border-green-500 text-green-400' 
                      : isCurrent 
                        ? 'bg-red-950 border-red-500 text-red-400 animate-pulse' 
                        : 'bg-neutral-900 border-white/5 text-neutral-600'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </span>

                  <div>
                    <h4 className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-neutral-400'}`}>{step.name}</h4>
                    {isCurrent && (
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {step.key === 'SUBMITTED' && 'Please upload supporting verification proof documents below.'}
                        {step.key === 'UNDER_VERIFIER_REVIEW' && 'A trusted administrator / physician is reviewing your evidence.'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conditional Action Panels */}
        {request.status === 'SUBMITTED' && (
          <div className="glass-panel p-6 rounded-xl border border-white/5 bg-neutral-950/30">
            <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <UploadCloud className="w-4.5 h-4.5 text-red-400" />
              Upload Supporting Evidence
            </h3>
            <p className="text-[11px] text-neutral-400 mb-6 font-light">
              Submit proof documents (e.g. physician certificates or legal identity forms) to verify your claim.
            </p>

            <form onSubmit={handleUploadEvidence} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 mb-2">Evidence Document URL / Reference</label>
                <input
                  type="text"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="e.g. https://storage.hospital.org/verma-med-cert.pdf"
                  required
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 focus:border-red-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {isUploading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Link Evidence Document'}
              </button>
            </form>
          </div>
        )}

        {request.status === 'UNDER_VERIFIER_REVIEW' && (
          <div className="p-4 rounded-xl bg-yellow-950/20 border border-yellow-500/25 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-white">Verifier Assessment Pending</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Your uploaded evidence document has been registered. You can simulate the verifier approval by logging in as the Owner or Verifier to accept this request.
              </p>
            </div>
          </div>
        )}

        {request.status === 'APPROVED' && (
          <div className="p-4 rounded-xl bg-green-950/20 border border-green-500/25 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Emergency Request Approved</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Identity verification checks satisfied. Secure temporary session scopes have been provisioned.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push(`/dashboard`)} // Simulates navigating to temp dashboard in M5
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-600 hover:bg-green-500 text-xs font-semibold text-white rounded-lg transition-all"
            >
              Access Temporary Vault
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
