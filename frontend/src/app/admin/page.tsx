'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Users, 
  Loader2, 
  ArrowLeft,
  Search,
  Filter,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLog {
  id: string;
  timestamp: string;
  actorPingId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  pingProduct: string;
  detailsJson: Record<string, any>;
}

export default function AdminConsolePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [metricsRes, logsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/admin/metrics', { headers: { 'Authorization': 'Bearer mock-pass' } }),
        fetch('http://localhost:3001/api/v1/admin/logs', { headers: { 'Authorization': 'Bearer mock-pass' } })
      ]);

      const metricsResult = await metricsRes.json();
      const logsResult = await logsRes.json();

      if (metricsResult.success) setMetrics(metricsResult.data);
      if (logsResult.success) setLogs(logsResult.data);
    } catch (err) {
      setError('Failed to fetch platform metrics from administrative controllers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/10 via-black to-black">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-neutral-500 hover:text-white transition-all text-xs font-semibold">
              <ArrowLeft className="w-4 h-4" />
              BACK TO PORTAL
            </Link>
            <span className="text-neutral-800">|</span>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <h1 className="text-md font-bold text-white tracking-tight">Platform Admin Console</h1>
            </div>
          </div>
          <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 font-mono font-bold">ROOT ENVIRONMENT</span>
        </div>

        {/* Admin KPI Grids */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel">
              <p className="text-neutral-500 text-[10px] uppercase font-semibold mb-2">Total Directory Users</p>
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {metrics.totalUsers}
              </h2>
              <p className="text-[9px] text-neutral-600">Synced to core PingDS identity repo</p>
            </div>

            <div className="p-5 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel">
              <p className="text-neutral-500 text-[10px] uppercase font-semibold mb-2">Total Protected Assets</p>
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                {metrics.totalAssets}
              </h2>
              <p className="text-[9px] text-neutral-600">AES-256 encrypted payloads</p>
            </div>

            <div className="p-5 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel">
              <p className="text-neutral-500 text-[10px] uppercase font-semibold mb-2">Active Emergency Grants</p>
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                {metrics.activeGrants}
              </h2>
              <p className="text-[9px] text-neutral-600">Active break-glass session scopes</p>
            </div>

            <div className="p-5 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel">
              <p className="text-neutral-500 text-[10px] uppercase font-semibold mb-2">Ping Cloud Ecosystem</p>
              <h2 className="text-2xl font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" />
                {metrics.pingServicesStatus}
              </h2>
              <p className="text-[9px] text-neutral-600">All identity gateways healthy</p>
            </div>

          </div>
        )}

        {/* compliance master audit log datatable */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/20 glass-panel space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Compliance Master Audit Trail</h3>
            <span className="text-[10px] text-neutral-500 font-mono">Showing last 50 platform events</span>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-lg bg-black/40">
            <table className="w-full text-left font-mono text-[10px] text-neutral-400">
              <thead className="bg-neutral-950 text-white uppercase text-[9px] border-b border-white/5">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor ID</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Resource Target</th>
                  <th className="p-3">Ping Gate</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-neutral-600">No compliance logs compiled yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/2px">
                      <td className="p-3 text-neutral-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 text-white truncate max-w-[120px]">{log.actorPingId}</td>
                      <td className="p-3 font-bold text-neutral-300">{log.action}</td>
                      <td className="p-3 text-neutral-400 truncate max-w-[150px]">{log.resource}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/5 text-[9px] text-neutral-500 font-semibold">
                          {log.pingProduct}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-500">{log.ipAddress}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
