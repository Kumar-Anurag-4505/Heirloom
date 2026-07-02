'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Loader2, 
  Database, 
  Clock, 
  Lock, 
  Eye, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface SharedAsset {
  id: string;
  title: string;
  description?: string;
  category: string;
  sensitivityRisk: string;
  grantId: string;
  expiresAt: string;
  ciphertext?: string;
  policyName: string;
}

interface OwnerGroup {
  owner: { id: string; name: string; email: string };
  assets: SharedAsset[];
}

export default function SharedAssetsPage() {
  const [ownerGroups, setOwnerGroups] = useState<OwnerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspect drawer states
  const [inspectingAsset, setInspectingAsset] = useState<SharedAsset | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const fetchSharedAssets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/trusted-connections/shared-assets');
      if (res.success) {
        setOwnerGroups(res.data);
      }
    } catch (err) {
      setError('Failed to fetch emergency vault shared assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedAssets();
  }, []);

  const handleInspectAsset = (asset: SharedAsset) => {
    setInspectingAsset(asset);
    setDecryptedValue(null);
  };

  const handleDecryptPayload = async (assetId: string) => {
    setIsDecrypting(true);
    try {
      const res = await api.get(`/trusted-connections/shared-assets/${assetId}/decrypt`);
      if (res.success && res.data.decryptedPayload) {
        setDecryptedValue(res.data.decryptedPayload);
      } else {
        setDecryptedValue('[Payload blank or access policy limits exceeded]');
      }
    } catch (err: any) {
      setDecryptedValue(err.message || 'Verification rejected or token expired');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Shared Legacy Assets</h1>
        <p className="text-xs text-neutral-400">View resources securely shared with you under verified, active emergency access grants.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Evaluating Active Access Decision Trees...</span>
        </div>
      ) : ownerGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-white/10 text-neutral-500 space-y-4">
          <FolderLock className="w-10 h-10 text-neutral-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No Shared Assets Found</p>
            <p className="text-xs text-neutral-400 mt-1">Once emergency grants are approved for you, shared legacy records will be visible here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {ownerGroups.map((group) => (
            <div key={group.owner.id} className="space-y-4 border border-white/5 bg-neutral-950/20 p-6 rounded-xl glass-panel">
              {/* Owner Profile Headers */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Shared by: {group.owner.name}</h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{group.owner.email}</p>
                </div>
                <span className="text-[9px] bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-wider font-semibold">
                  Legacy Owner
                </span>
              </div>

              {/* Grid Layout of shared assets under this owner */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => handleInspectAsset(asset)}
                    className="p-5 rounded-lg border border-white/5 bg-neutral-950/40 hover:border-blue-500/30 hover:bg-neutral-950/60 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-bold bg-blue-950/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 tracking-wider">
                          {asset.category}
                        </span>
                        <span className="text-[9px] text-yellow-400 font-bold bg-yellow-950/20 border border-yellow-500/10 px-2 py-0.5 rounded uppercase">
                          {asset.sensitivityRisk}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1.5 truncate">{asset.title}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-4 font-light">
                        {asset.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        Exp: {new Date(asset.expiresAt).toLocaleDateString()}
                      </span>
                      <span className="text-[8px] font-mono text-neutral-600">Policy: {asset.policyName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared Asset Details Inspection Drawer */}
      <AnimatePresence>
        {inspectingAsset && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-neutral-950 border-l border-white/10 p-8 flex flex-col justify-between relative shadow-2xl"
            >
              <button
                onClick={() => setInspectingAsset(null)}
                className="absolute top-6 right-6 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 tracking-wider">
                    {inspectingAsset.category}
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight mt-3">{inspectingAsset.title}</h2>
                  <p className="text-[10px] text-neutral-500 mt-1 font-mono">ID: {inspectingAsset.id}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-neutral-400">Context Description</span>
                  <p className="text-xs text-neutral-300 bg-neutral-900/40 p-3 rounded-lg border border-white/5 leading-relaxed font-light">
                    {inspectingAsset.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-neutral-400 font-mono text-neutral-400">Scoped Security Payload</span>
                  
                  {decryptedValue ? (
                    <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono break-all relative">
                      <p className="text-[9px] text-emerald-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Decrypted Payload (MFA Approved)
                      </p>
                      {decryptedValue}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-neutral-900/60 border border-white/5 text-xs font-mono text-neutral-500 break-all relative">
                      <p className="text-[9px] text-neutral-600 mb-2 uppercase tracking-widest font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        AES-256 Encrypted Payload
                      </p>
                      {inspectingAsset.ciphertext || 'No secure payload exists.'}
                    </div>
                  )}

                  {!decryptedValue && (
                    <button
                      onClick={() => handleDecryptPayload(inspectingAsset.id)}
                      disabled={isDecrypting}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-blue-500/20 bg-blue-950/20 hover:bg-blue-950/50 text-blue-400 text-xs font-semibold transition-all"
                    >
                      {isDecrypting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Request Decrypted Payload
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-neutral-900/30 border border-white/5 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block tracking-wider">Access Scope Parameters</span>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Granted Under Policy:</span>
                    <span className="text-white font-medium">{inspectingAsset.policyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Access Expiration:</span>
                    <span className="text-red-400 font-medium">{new Date(inspectingAsset.expiresAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 flex gap-4">
                <button
                  onClick={() => setInspectingAsset(null)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-white/10 hover:bg-white/5 text-neutral-400 text-xs font-semibold transition-all"
                >
                  Close Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
