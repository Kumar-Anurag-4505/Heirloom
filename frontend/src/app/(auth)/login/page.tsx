'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Eye, EyeOff, Loader2, KeyRound, AlertCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA Flow States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempSessionId, setTempSessionId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [riskScore, setRiskScore] = useState<number | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'mock-pass' })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      if (result.data?.mfaRequired) {
        // Step-up authentication trigger
        setMfaRequired(true);
        setTempSessionId(result.data.tempSessionId);
        setRiskScore(result.data.riskScore);
      } else {
        // Successful login without MFA
        router.push('/portal/dashboard');
      }
    } catch (err) {
      setError('Connection to security gateway failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempSessionId, code: mfaCode })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'MFA Code validation failed');
        return;
      }

      // MFA successfully completed
      router.push('/portal/dashboard');
    } catch (err) {
      setError('MFA gateway verification timeout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Visual Branding Bar */}
      <div className="hidden lg:flex w-1/2 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-black p-12 flex-col justify-between border-r border-white/5 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
        
        <div className="flex items-center space-x-3 z-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Heirloom</span>
        </div>

        <div className="z-10 max-w-md">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Securing access across generations.
          </h2>
          <p className="text-neutral-400 font-light leading-relaxed">
            Every authorization is governed dynamically by enterprise authentication nodes, adaptive risk evaluation, and immutable audit structures.
          </p>
        </div>

        <div className="text-xs text-neutral-500 font-mono z-10">
          PingIdentity Advanced Identity Cloud Service // Active Endpoint
        </div>
      </div>

      {/* Main Form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!mfaRequired ? (
              // Login Step
              <motion.div
                key="login-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Sign in to Heirloom</h1>
                  <p className="text-sm text-neutral-400">Enter your credentials to access your secure legacy dashboard.</p>
                </div>

                {error && (
                  <div className="p-3.5 mb-6 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Identity Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@heirloom.io"
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg text-sm text-white placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg text-sm text-white placeholder-neutral-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
                  >
                    {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Continue'}
                  </button>
                </form>

                <div className="mt-8 text-center text-xs text-neutral-500">
                  New to Heirloom?{' '}
                  <Link href="/auth/register" className="text-blue-400 hover:underline">
                    Create directory account
                  </Link>
                </div>
              </motion.div>
            ) : (
              // Adaptive MFA Verification Step
              <motion.div
                key="mfa-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="w-10 h-10 rounded-lg bg-yellow-600/10 border border-yellow-500/20 flex items-center justify-center mb-4">
                    <Smartphone className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Step-Up Authentication</h1>
                  <p className="text-sm text-neutral-400">
                    PingOne Protect assessed your session risk score as <strong className="text-yellow-400 font-semibold">{riskScore}</strong>. Multi-Factor verification is required.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 mb-6 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleMfaSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      required
                      className="w-full text-center tracking-widest text-lg font-bold py-3 bg-neutral-900 border border-white/10 focus:border-yellow-500 rounded-lg text-white placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || mfaCode.length < 6}
                    className="w-full py-2.5 px-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 disabled:cursor-not-allowed text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Verify MFA Session'}
                  </button>
                </form>

                <div className="mt-6 flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Demo Code: <code className="text-white bg-neutral-800 px-1 py-0.5 rounded">123456</code></span>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaRequired(false);
                      setMfaCode('');
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    Back to login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
