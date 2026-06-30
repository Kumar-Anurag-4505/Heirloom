'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShieldAlert, 
  Loader2, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Database,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Asset {
  id: string;
  title: string;
  description?: string;
  category: string;
  sensitivityRisk: string;
  decryptedPayload?: string;
  createdAt: string;
}

export default function TemporaryVaultPage() {
  const params = useParams();
  const token = params.token as string;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payload Reveal States
  const [revealedAssetIds, setRevealedAssetIds] = useState<string[]>([]);

  const fetchVault = async () => {
    try {
      const result = await api.get(`/emergency/vault/${token}`);
      
      if (!result.success) {
        setError(result.message || 'Access Scope Expired or Revoked.');
        setIsLoading(false);
        return;
      }

      setAssets(result.data.assets);
      setExpiresAt(result.data.expiresAt);
    } catch (err: any) {
      setError(err.message || 'Connection to security gateway failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, [token]);

  // Timer Countdown loop
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const difference = new Date(expiresAt).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft('Expired');
        setError('Your temporary emergency access grant has expired.');
        setAssets([]);
        return;
      }

      const hours = Math.floor(difference / (3600 * 1000));
      const minutes = Math.floor((difference % (3600 * 1000)) / (60 * 1000));
      const seconds = Math.floor((difference % (60 * 1000)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const toggleRevealPayload = (assetId: string) => {
    setRevealedAssetIds(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId) 
        : [...prev, assetId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Alert Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Temporary Emergency Vault</h1>
              <p className="text-xs text-neutral-400">All access claims are cryptographically logged for governance audits.</p>
            </div>
          </div>

          {/* Countdown Clock Widget */}
          {expiresAt && timeLeft !== 'Expired' && (
            <div className="flex items-center gap-3 px-4 py-2 bg-red-950/20 border border-red-500/20 rounded-xl">
              <Clock className="w-4.5 h-4.5 text-red-400 animate-pulse" />
              <div className="font-mono text-sm font-bold text-red-400">
                TIME REMAINING: {timeLeft}
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="p-6 rounded-xl bg-red-950/10 border border-red-500/20 text-center text-red-400 text-sm flex flex-col items-center gap-4">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h3 className="font-bold text-white mb-1">Access Revoked</h3>
              <p className="text-xs text-neutral-400 font-light">{error}</p>
            </div>
          </div>
        ) : (
          // Scoped Asset Lists
          <div className="space-y-6">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Unlocked Scopes ({assets.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets.map((asset) => {
                const isRevealed = revealedAssetIds.includes(asset.id);
                
                return (
                  <div
                    key={asset.id}
                    className="p-5 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-bold bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 tracking-wider">
                          {asset.category}
                        </span>
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                          <Lock className="w-3.5 h-3.5" />
                          Time Scoped
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white mb-2">{asset.title}</h3>
                      <p className="text-xs text-neutral-400 mb-6 font-light leading-relaxed">
                        {asset.description || 'No description context details provided.'}
                      </p>
                    </div>

                    {/* Scoped Payloads Decrypted Stream */}
                    {asset.decryptedPayload && (
                      <div className="space-y-3 border-t border-white/5 pt-4">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span className="font-semibold">Sensitive Target Vault Code</span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPayload(asset.id)}
                            className="text-blue-400 hover:text-white"
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {isRevealed ? (
                          <div className="p-3 rounded bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs break-all">
                            {asset.decryptedPayload}
                          </div>
                        ) : (
                          <div className="p-3 rounded bg-neutral-900/60 border border-white/5 text-neutral-600 font-mono text-xs select-none">
                            ••••••••••••••••••••••••
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
