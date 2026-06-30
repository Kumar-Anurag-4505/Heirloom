'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityCenterPage() {
  const activeSessions = [
    { id: '1', ip: '127.0.0.1', device: 'Chrome / macOS (Current)', location: 'Mumbai, India', risk: 'LOW' },
    { id: '2', ip: '198.51.100.42', device: 'Safari / iPhone 15', location: 'Delhi, India', risk: 'MEDIUM' }
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Security Center</h1>
        <p className="text-xs text-neutral-400">Manage directory credentials, configure authenticator keys, and audit active sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Security Configuration Tools) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MFA Config Card */}
          <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4.5 h-4.5 text-blue-400" />
              Multi-Factor Authentication (PingID)
            </h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              MFA verification is required on all login queries from untrusted locations or during emergency step-up authorization sweeps.
            </p>

            <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5 text-xs">
              <div className="flex items-center space-x-3">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-white font-semibold">WebAuthn Biometrics / Touch ID</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Primary verified security key</p>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-green-950/40 text-green-400 border border-green-500/20 px-2 py-0.5 rounded uppercase">Active</span>
            </div>
          </div>

          {/* Active Logins Table */}
          <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel">
            <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-indigo-400" />
              Active Identity Sessions (PingAM)
            </h3>

            <div className="space-y-4 text-xs">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5"
                >
                  <div>
                    <p className="text-white font-semibold">{session.device}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">IP: {session.ip} | Location: {session.location}</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      session.risk === 'LOW' 
                        ? 'bg-green-950/40 text-green-400 border-green-500/20' 
                        : 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {session.risk} Risk
                    </span>
                    <button className="p-1.5 rounded border border-white/5 text-neutral-500 hover:text-red-400 hover:border-red-500/20 transition-all hover:bg-red-950/10">
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Threat Assessment Indicator) */}
        <div className="p-6 rounded-xl border border-white/5 bg-neutral-950/20 glass-panel flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-500" />
              PingOne Protect Shield
            </h3>
            
            <div className="text-center py-8">
              <h2 className="text-4xl font-extrabold text-white mb-2">98</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Global Security Index</p>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Continuous geolocation mapping, velocity verification, and device fingerprint evaluation indicate that your account is fully secure.
            </p>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-neutral-500 font-mono">
            Last evaluated: Just now
          </div>
        </div>
      </div>
    </div>
  );
}
