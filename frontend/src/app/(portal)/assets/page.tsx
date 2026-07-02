'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Key, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  FileText,
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Asset {
  id: string;
  title: string;
  description?: string;
  category: string;
  sensitivityRisk: string;
  encryptedPayload?: string;
  createdAt: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('BANKING');
  const [sensitivityRisk, setSensitivityRisk] = useState('MEDIUM');
  const [plaintextPayload, setPlaintextPayload] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asset Inspection States
  const [inspectingAsset, setInspectingAsset] = useState<Asset | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Edit / CRUD states
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setEditingAsset(null);
    setTitle('');
    setDescription('');
    setCategory('BANKING');
    setSensitivityRisk('MEDIUM');
    setPlaintextPayload('');
    setError(null);
  };

  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset);
    setTitle(asset.title);
    setDescription(asset.description || '');
    setCategory(asset.category);
    setSensitivityRisk(asset.sensitivityRisk);
    setPlaintextPayload(''); // Left empty by default for secure payload updates
    setError(null);
    setIsModalOpen(true);
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const result = await api.get('/assets');
      if (result.success) {
        setAssets(result.data);
      }
    } catch (err) {
      setError('Failed to load assets from secure storage gateway');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Asset title is required');
      return;
    }
    setIsFormSubmitting(true);
    setError(null);

    try {
      if (editingAsset) {
        // UPDATE MODE
        const result = await api.put(`/assets/${editingAsset.id}`, {
          title,
          description,
          category,
          sensitivityRisk,
          plaintextPayload: plaintextPayload || undefined
        });

        if (!result.success) {
          setError(result.message || 'Failed to update asset');
          return;
        }

        showToast('Asset updated successfully', 'success');
        await fetchAssets();
        setIsModalOpen(false);
        resetForm();
      } else {
        // CREATE MODE
        if (!plaintextPayload) {
          setError('Secure payload is required when protecting a new asset');
          setIsFormSubmitting(false);
          return;
        }

        const result = await api.post('/assets', {
          title,
          description,
          category,
          sensitivityRisk,
          plaintextPayload
        });

        if (!result.success) {
          setError(result.message || 'Failed to protect asset');
          return;
        }

        showToast('Asset protected successfully', 'success');
        await fetchAssets();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Communication with key orchestration server timed out');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleInspectAsset = async (asset: Asset) => {
    setInspectingAsset(asset);
    setDecryptedValue(null);
  };

  const handleDecryptPayload = async (assetId: string) => {
    setIsDecrypting(true);
    try {
      const result = await api.get(`/assets/${assetId}`);
      if (result.success && result.data.decryptedPayload) {
        setDecryptedValue(result.data.decryptedPayload);
      } else {
        setDecryptedValue('[No payload stored or access denied]');
      }
    } catch (err) {
      setDecryptedValue('Failed to request decryption key');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to permanently delete this protected asset?')) return;
    try {
      await api.delete(`/assets/${assetId}`);
      showToast('Asset archived successfully', 'success');
      setInspectingAsset(null);
      await fetchAssets();
    } catch (err) {
      setError('Failed to archive asset');
      showToast('Failed to archive asset', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Asset Vault</h1>
          <p className="text-xs text-neutral-400">Cryptographically protect, categorize, and govern your digital credentials.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="glow-button flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20"
        >
          <Plus className="w-4 h-4" />
          Add Vault Asset
        </button>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Synchronizing Secure Directories...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-white/10 text-neutral-500 space-y-4">
          <Database className="w-10 h-10 text-neutral-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No Protected Assets Found</p>
            <p className="text-xs text-neutral-400 mt-1">Get started by creating your first cryptographically locked legacy token.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg transition-all"
          >
            Create Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => handleInspectAsset(asset)}
              className="p-5 rounded-xl border border-white/5 bg-neutral-950/30 hover:border-blue-500/30 hover:bg-neutral-950/50 transition-all glass-panel cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 tracking-wider">
                    {asset.category}
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(asset);
                      }}
                      className="p-1 rounded text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                      title="Edit Asset"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <Lock className="w-3 h-3" />
                    <span>AES-256</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1.5 truncate">{asset.title}</h3>
                <p className="text-xs text-neutral-400 line-clamp-2 mb-4 font-light">
                  {asset.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-neutral-500">
                <span>Risk Index: <strong className={`font-semibold ${asset.sensitivityRisk === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'}`}>{asset.sensitivityRisk}</strong></span>
                <ChevronRight className="w-4.5 h-4.5 text-neutral-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel bg-neutral-950 p-6 rounded-xl border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editingAsset ? 'Edit Legacy Asset' : 'Protect Legacy Asset'}
                </h2>
                <p className="text-xs text-neutral-400">
                  {editingAsset ? 'Modify details. Updated secrets will be re-encrypted prior to database sync.' : 'Specify details. Secret payloads are encrypted prior to directory sync.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="BANKING">Banking & Finance</option>
                      <option value="INSURANCE">Insurance Policies</option>
                      <option value="MEDICAL">Medical Records</option>
                      <option value="INVESTMENTS">Investments</option>
                      <option value="CRYPTO">Cryptocurrency</option>
                      <option value="GOVERNMENT_IDS">Government IDs</option>
                      <option value="PASSWORDS">Passwords & Keys</option>
                      <option value="EMERGENCY_NOTES">Secure Notes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Sensitivity Risk</label>
                    <select
                      value={sensitivityRisk}
                      onChange={(e) => setSensitivityRisk(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="LOW">Low Sensitivity</option>
                      <option value="MEDIUM">Medium Sensitivity</option>
                      <option value="HIGH">High Sensitivity</option>
                      <option value="CRITICAL">Critical / Break-glass Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Asset Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. HDFC Main Savings Account"
                    required
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add non-sensitive context here (visible to emergency contacts to locate the asset)."
                    className="w-full h-20 px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Sensitive Secret (AES Encrypted)</label>
                  <textarea
                    value={plaintextPayload}
                    onChange={(e) => setPlaintextPayload(e.target.value)}
                    placeholder="e.g. Credentials, account numbers, private keys, or digital lockbox passcodes."
                    className="w-full h-24 px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isFormSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingAsset ? 'Save Updates' : 'Protect Asset'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Asset Inspector Slide-over */}
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
                  <span className="text-xs font-semibold text-neutral-400">Secure Payload (Ciphertext)</span>
                  
                  {decryptedValue ? (
                    <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono break-all relative">
                      <p className="text-[9px] text-emerald-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Decrypted Value (Owner Verified)
                      </p>
                      {decryptedValue}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-neutral-900/60 border border-white/5 text-xs font-mono text-neutral-500 break-all relative">
                      <p className="text-[9px] text-neutral-600 mb-2 uppercase tracking-widest font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        AES-256 Encrypted Payload
                      </p>
                      {inspectingAsset.encryptedPayload || 'No secure payload exists.'}
                    </div>
                  )}

                  {!decryptedValue && inspectingAsset.encryptedPayload && (
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
                          Decrypt Payload
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 flex gap-4">
                <button
                  onClick={() => {
                    setInspectingAsset(null);
                    handleEditClick(inspectingAsset);
                  }}
                  className="w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-blue-500/20 bg-blue-950/10 hover:bg-blue-950/30 text-blue-400 text-xs font-semibold transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit Asset
                </button>
                <button
                  onClick={() => handleDeleteAsset(inspectingAsset.id)}
                  className="w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Archive Asset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-in toast notification portal */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold border ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-950/80 border-red-500/20 text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
