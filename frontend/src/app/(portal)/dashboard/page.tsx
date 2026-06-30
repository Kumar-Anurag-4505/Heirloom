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
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [totalAssets, setTotalAssets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/v1/assets', {
          headers: { 'Authorization': 'Bearer mock-pass' } // for basic fetch
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setTotalAssets(result.data.length);
        }
      } catch (err) {
        // Fallback to static mock for display
        setTotalAssets(4);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Welcome back, Rahul</h1>
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
            <h2 className="text-2xl font-bold text-white mb-1">{isLoading ? '...' : totalAssets}</h2>
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
            <h2 className="text-2xl font-bold text-white mb-1">2 Active</h2>
            <p className="text-[10px] text-neutral-500">1 conditional trigger set</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-4">
            <span className="text-xs font-semibold">Emergency Contacts</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">1 Verified</h2>
            <p className="text-[10px] text-neutral-500">Priya Sharma (Spouse)</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-4">
            <span className="text-xs font-semibold">Protect Security Score</span>
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">98 / 100</h2>
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
                <span className="text-white font-medium">50%</span>
              </div>
              <div className="w-full h-2 rounded bg-neutral-900 overflow-hidden">
                <div className="h-full bg-blue-500 rounded" style={{ width: '50%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Medium Risk Assets (Insurance, Documents)</span>
                <span className="text-white font-medium">35%</span>
              </div>
              <div className="w-full h-2 rounded bg-neutral-900 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded" style={{ width: '35%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Low Risk Assets (Social Profiles, Notes)</span>
                <span className="text-white font-medium">15%</span>
              </div>
              <div className="w-full h-2 rounded bg-neutral-900 overflow-hidden">
                <div className="h-full bg-neutral-700 rounded" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Security Feed) */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/20 glass-panel space-y-6">
          <h3 className="text-sm font-semibold text-white">Recent Security Logs</h3>
          
          <div className="space-y-4 font-mono text-[10px] text-neutral-400">
            {/* Log Item 1 */}
            <div className="flex items-start space-x-2.5 border-b border-white/5 pb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white text-[11px]">User Session Initialized</p>
                <p className="text-neutral-500">PingAM Node Verification Success</p>
                <p className="text-[9px] text-neutral-600">IP: 127.0.0.1 | 5m ago</p>
              </div>
            </div>

            {/* Log Item 2 */}
            <div className="flex items-start space-x-2.5 border-b border-white/5 pb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white text-[11px]">Directory Synced (PingDS)</p>
                <p className="text-neutral-500">User Identity schema synced</p>
                <p className="text-[9px] text-neutral-600">User: rahul@heirloom.io | 10m ago</p>
              </div>
            </div>

            {/* Log Item 3 */}
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white text-[11px]">Protect Risk Score Sync</p>
                <p className="text-neutral-500">Device trust profile verified</p>
                <p className="text-[9px] text-neutral-600">Score: 15 / LOW | 10m ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
