'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  Database,
  ArrowUpRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface DashboardSummary {
  totalAssets: number;
  activePolicies: number;
  verifiedContacts: number;
  primaryContactLabel: string;
  securityScore: number;
  assetDistribution: {
    critical: number;
    medium: number;
    low: number;
  };
}

interface AuditLog {
  id: string;
  timestamp: string;
  actorPingId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  riskScore?: number;
  pingProduct: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [summaryRes, logsRes] = await Promise.all([
          api.get<DashboardSummary>('/dashboard/summary'),
          api.get<AuditLog[]>('/audit/me')
        ]);
        
        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }
        if (logsRes.success) {
          setLogs(logsRes.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to sync with security endpoints');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-neutral-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-mono">Assembling Governance Analytics...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-950/10 text-center max-w-xl mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-white">Database Core Sync Alert</p>
        <p className="text-xs text-neutral-400">{error || 'Could not compile metrics.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-xs text-neutral-400">All identity nodes healthy. Your legacy credentials are fully protected.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-4">
            <span className="text-xs font-semibold">Protected Assets</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{summary.totalAssets}</h2>
            <p className="text-[10px] text-neutral-500">AES-256 Vault-encrypted entries</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-4">
            <span className="text-xs font-semibold">Legacy Policies</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{summary.activePolicies} Active</h2>
            <p className="text-[10px] text-neutral-500">Conditional access triggers</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-4">
            <span className="text-xs font-semibold">Emergency Contacts</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{summary.verifiedContacts} Verified</h2>
            <p className="text-[10px] text-neutral-500 truncate max-w-full">{summary.primaryContactLabel}</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-4">
            <span className="text-xs font-semibold">Security Score</span>
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{summary.securityScore} / 100</h2>
            <p className="text-[10px] text-green-400">Risk Assessment: Low Risk</p>
          </div>
        </div>
      </div>

      {/* Split Cards Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Stats / Categorized View) */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-white/5 bg-neutral-950/20 glass-panel">
          <h3 className="text-sm font-semibold text-white mb-6">Asset Distribution by Sensitivity</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Critical Risk Assets (Banking, Passwords)</span>
                <span className="text-white font-medium">{summary.assetDistribution.critical}%</span>
              </div>
              <div className="w-full h-2 rounded bg-neutral-900 overflow-hidden">
                <div className="h-full bg-blue-500 rounded" style={{ width: `${summary.assetDistribution.critical}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Medium Risk Assets (Insurance, Documents)</span>
                <span className="text-white font-medium">{summary.assetDistribution.medium}%</span>
              </div>
              <div className="w-full h-2 rounded bg-neutral-900 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded" style={{ width: `${summary.assetDistribution.medium}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Low Risk Assets (Social Profiles, Notes)</span>
                <span className="text-white font-medium">{summary.assetDistribution.low}%</span>
              </div>
              <div className="w-full h-2 rounded bg-neutral-900 overflow-hidden">
                <div className="h-full bg-neutral-700 rounded" style={{ width: `${summary.assetDistribution.low}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Security Feed) */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/20 glass-panel flex flex-col space-y-6 overflow-hidden">
          <h3 className="text-sm font-semibold text-white">Recent Security Logs</h3>
          
          <div className="space-y-4 font-mono text-[10px] text-neutral-400 overflow-y-auto max-h-[220px] pr-2">
            {logs.length === 0 ? (
              <div className="text-center text-neutral-600 py-10 font-sans text-xs">
                No recent security audits recorded
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2.5 border-b border-white/5 pb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-white text-[11px] font-sans font-semibold tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-neutral-500 truncate max-w-full">{log.resource}</p>
                    <p className="text-[9px] text-neutral-600">{log.pingProduct} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
