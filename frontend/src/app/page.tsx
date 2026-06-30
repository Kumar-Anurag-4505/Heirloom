'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Key, Users, Activity, ArrowRight, Lock, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-black to-black selection:bg-blue-600/30 selection:text-blue-200">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 tracking-tight">
              Heirloom
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#matrix" className="hover:text-white transition-colors">Trust Matrix</a>
            <a href="#security" className="hover:text-white transition-colors">Security Architecture</a>
            <a href="#telemetry" className="hover:text-white transition-colors">Developer Telemetry</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/auth/register" className="glow-button px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center">
        <motion.div 
          className="text-center max-w-3xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/20 text-blue-400 text-xs font-semibold mb-6 shadow-inner">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Powered by Ping Identity Advanced Cloud</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
            The Trust Bridge for Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-white">
              Digital Legacy
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 mb-10 leading-relaxed font-light">
            Decide exactly <strong className="text-white font-medium">who</strong> can access your digital assets, 
            <strong className="text-white font-medium"> what</strong> they can access, under 
            <strong className="text-white font-medium"> which conditions</strong>, and for 
            <strong className="text-white font-medium"> how long</strong>—without ever sharing passwords.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/auth/register" className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20">
              Set Up Legacy Vault
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/emergency" className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-neutral-400" />
              Emergency Access Portal
            </Link>
          </div>
        </motion.div>

        {/* Dynamic Telemetry Visual Preview */}
        <motion.div 
          className="w-full max-w-5xl rounded-xl border border-white/5 bg-neutral-950/40 p-6 glass-panel relative overflow-hidden shadow-2xl shadow-blue-900/10 mb-24"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-neutral-500 ml-4">pingone-telemetry-feed.json</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 bg-blue-950/30 px-2.5 py-1 rounded-md border border-blue-500/20">
              <Activity className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              Live Telemetry Simulator Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-neutral-400">
            {/* Flow Card 1 */}
            <div className="p-4 rounded-lg bg-white/2px border border-white/5 bg-black/40">
              <div className="text-blue-400 font-semibold mb-2 flex items-center justify-between">
                <span>[PingAM Engine]</span>
                <span className="text-[10px] bg-blue-950 px-1.5 py-0.5 rounded text-blue-300">ACTIVE</span>
              </div>
              <p className="mb-1 text-white">✓ Journey: BreakGlassFlow</p>
              <p className="mb-1 text-neutral-500">→ Current Node: PushMfaCollector</p>
              <p className="text-[10px] text-green-500">Status: Waiting for verification...</p>
            </div>

            {/* Flow Card 2 */}
            <div className="p-4 rounded-lg bg-white/2px border border-white/5 bg-black/40">
              <div className="text-indigo-400 font-semibold mb-2 flex items-center justify-between">
                <span>[PingOne Protect]</span>
                <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300">EVALUATING</span>
              </div>
              <p className="mb-1 text-white">✓ Session Risk Evaluation</p>
              <p className="mb-1 text-neutral-500">→ Client IP: 198.51.100.42</p>
              <p className="text-[10px] text-yellow-500">Risk Score: 15 / LOW (Secure)</p>
            </div>

            {/* Flow Card 3 */}
            <div className="p-4 rounded-lg bg-white/2px border border-white/5 bg-black/40">
              <div className="text-emerald-400 font-semibold mb-2 flex items-center justify-between">
                <span>[PingIDM Service]</span>
                <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300">QUEUED</span>
              </div>
              <p className="mb-1 text-white">✓ Temporary Role Assign</p>
              <p className="mb-1 text-neutral-500">→ Target Role: LegacyAccessScope</p>
              <p className="text-[10px] text-neutral-500">Provision: Scheduled to expire in 24h</p>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid Section */}
        <section id="features" className="w-full py-16 border-t border-white/5">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Enterprise Legacy Governance</h2>
            <p className="text-neutral-400 font-light">Built on standard OAuth, ABAC policies, and real-time identity state machines.</p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Feature Card 1 */}
            <motion.div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 hover:border-blue-500/20 transition-all flex flex-col justify-between" variants={itemVariants}>
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Zero-Trust Vaults</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light mb-4">
                Sensitive assets are encrypted locally. Keys are unlocked only after active, verified Ping session tokens are presented.
              </p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 hover:border-indigo-500/20 transition-all flex flex-col justify-between" variants={itemVariants}>
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Conditional Legacy Access</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light mb-4">
                Define adaptive rules matching relationship ties, medical triggers, location verification, and custom approval conditions.
              </p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 hover:border-emerald-500/20 transition-all flex flex-col justify-between" variants={itemVariants}>
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Dual-Control Verification</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light mb-4">
                Prevent unauthorized lockouts. Emergency access requests trigger verifier approvals and owner validation alerts.
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-neutral-400">Heirloom Inc.</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Security Disclosures</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
