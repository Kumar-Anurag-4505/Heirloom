'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Loader2, 
  Activity, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  timestamp: string;
  actorPingId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  pingProduct: string;
  detailsJson: any;
}

interface Request {
  id: string;
  status: string;
  urgencyReason: string;
  createdAt: string;
  owner: { name: string; email: string };
  requester: { name: string; email: string };
  policy: { name: string };
}

export default function AccessHistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/trusted-connections/history');
      if (res.success) {
        setLogs(res.data.auditLogs || []);
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      setError('Failed to fetch security audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Access History & Security Logs</h1>
        <p className="text-xs text-neutral-400">Review absolute chronological security audits of system interactions and access claims.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Consolidating Security Ledger timeline...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline Audit Logs List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
              Chronological Security Events ({logs.length})
            </h3>
            
            {logs.length === 0 ? (
              <p className="text-xs text-neutral-500 italic bg-neutral-950/20 p-6 border border-white/5 rounded-lg">No security audit logs recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div 
                    key={log.id}
                    className="p-4 rounded-lg bg-neutral-950/30 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center mt-0.5">
                        <History className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-[8px] bg-neutral-900 border border-white/10 px-1.5 py-0.2 rounded text-neutral-400 font-mono">
                            {log.pingProduct}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1 font-mono">{log.resource}</p>
                        <p className="text-[9px] text-neutral-500 font-mono mt-0.5">IP: {log.ipAddress} | {log.userAgent.slice(0, 40)}...</p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-center">
                      <span className="text-[9px] text-neutral-500 font-mono block">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[8px] text-neutral-600 font-mono mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side panel: Consolidated claims history summary */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/20 glass-panel space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-500" />
                Claims History
              </h3>

              {requests.length === 0 ? (
                <p className="text-xs text-neutral-600 italic">No access requests registered.</p>
              ) : (
                <div className="space-y-4">
                  {requests.slice(0, 5).map((req) => (
                    <div key={req.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white font-semibold">{req.policy.name}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          req.status === 'APPROVED' ? 'bg-green-950/30 text-green-400 border border-green-500/10' :
                          req.status === 'REJECTED' ? 'bg-red-950/30 text-red-400 border border-red-500/10' :
                          'bg-yellow-950/30 text-yellow-400 border border-yellow-500/10'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-500 mt-1">Claimant: {req.requester.name}</p>
                      <p className="text-[8px] text-neutral-600 font-mono mt-0.5">{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
