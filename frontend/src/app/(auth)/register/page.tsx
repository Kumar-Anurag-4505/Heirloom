'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Registration failed');
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError('Connection to security gateway timed out');
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
            Unified Identity Governance.
          </h2>
          <p className="text-neutral-400 font-light leading-relaxed">
            Create your account to establish your secure identity profile in our central PingDS Directory.
          </p>
        </div>

        <div className="text-xs text-neutral-500 font-mono z-10">
          PingDS Directory Services // Identity Replication Active
        </div>
      </div>

      {/* Main Form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isSuccess ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-600/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Account Created!</h1>
                <p className="text-sm text-neutral-400">
                  Your identity has been synchronized. Redirecting to security gateway...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Create your account</h1>
                  <p className="text-sm text-neutral-400">Initialize your digital legacy platform credentials.</p>
                </div>

                {error && (
                  <div className="p-3.5 mb-6 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg text-sm text-white placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Email Address</label>
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
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg text-sm text-white placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
                  >
                    {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Register Identity'}
                  </button>
                </form>

                <div className="mt-8 text-center text-xs text-neutral-500">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-blue-400 hover:underline">
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
