'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Loader2, 
  Trash2, 
  UserCheck, 
  Mail, 
  X,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Contact {
  id: string;
  contactName: string;
  contactEmail: string;
  relationship: string;
  trustLevel: string;
  verificationStatus: string;
  contactPingId?: string;
}

export default function NomineesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [trustLevel, setTrustLevel] = useState('LEVEL_1_IMMEDIATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit / CRUD states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setEditingContact(null);
    setContactName('');
    setContactEmail('');
    setTrustLevel('LEVEL_1_IMMEDIATE');
    setError(null);
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setContactName(contact.contactName);
    setContactEmail(contact.contactEmail);
    setTrustLevel(contact.trustLevel);
    setError(null);
    setIsModalOpen(true);
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const result = await api.get('/contacts');
      if (result.success) {
        // Filter nominee relationships
        const nominees = result.data.filter((c: Contact) => c.relationship === 'FINANCIAL_NOMINEE');
        setContacts(nominees);
      }
    } catch (err) {
      setError('Failed to fetch financial nominee directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) {
      setError('Nominee name and email are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingContact) {
        // UPDATE MODE
        const result = await api.put(`/contacts/${editingContact.id}`, {
          contactName,
          contactEmail,
          relationship: 'FINANCIAL_NOMINEE',
          trustLevel,
          verificationStatus: editingContact.verificationStatus
        });

        if (!result.success) {
          setError(result.message || 'Failed to update nominee');
          return;
        }

        showToast('Nominee connection updated successfully', 'success');
        await fetchContacts();
        setIsModalOpen(false);
        resetForm();
      } else {
        // CREATE MODE
        const result = await api.post('/contacts', {
          contactName,
          contactEmail,
          relationship: 'FINANCIAL_NOMINEE',
          trustLevel
        });

        if (!result.success) {
          setError(result.message || 'Failed to register nominee');
          return;
        }

        showToast('Nominee verification invitation sent', 'success');
        await fetchContacts();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Communication with directory server failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateVerify = async (contactId: string) => {
    try {
      const result = await api.put(`/contacts/${contactId}/verify`);
      if (result.success) {
        showToast('LDAP sync completed successfully', 'success');
        await fetchContacts();
      }
    } catch (err) {
      setError('Failed to trigger LDAP sync simulation');
      showToast('Failed to trigger LDAP sync simulation', 'error');
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this financial nominee connection?')) return;
    try {
      await api.delete(`/contacts/${contactId}`);
      showToast('Nominee removed successfully', 'success');
      await fetchContacts();
    } catch (err) {
      setError('Failed to delete nominee record');
      showToast('Failed to delete nominee record', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Financial Nominees</h1>
          <p className="text-xs text-neutral-400">Designate legal nominees for time-delayed bank and investment trust transfers.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="glow-button flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20"
        >
          <Plus className="w-4 h-4" />
          Add Financial Nominee
        </button>
      </div>

      {/* Main Content Layout */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Loading Nominee Registries...</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-white/10 text-neutral-500 space-y-4">
          <Users className="w-10 h-10 text-neutral-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No Financial Nominees Registered</p>
            <p className="text-xs text-neutral-400 mt-1">Specify legal nominees to establish secure directory transfers for inheritance assets.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg transition-all"
          >
            Add Nominee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-6 rounded-xl border border-white/5 bg-neutral-950/30 glass-panel flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900/10 border border-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{contact.contactName}</h3>
                      <p className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {contact.contactEmail}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    contact.verificationStatus === 'VERIFIED'
                      ? 'bg-green-950/40 text-green-400 border-green-500/20'
                      : 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20 animate-pulse'
                  }`}>
                    {contact.verificationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-4">
                  <div>
                    <p className="text-neutral-500 text-[10px]">Relationship Scope</p>
                    <p className="text-white font-medium mt-0.5">FINANCIAL NOMINEE</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-[10px]">Access Trust Level</p>
                    <p className="text-white font-medium mt-0.5">
                      {contact.trustLevel === 'LEVEL_1_IMMEDIATE' ? 'Level 1: Immediate' : 'Level 2: Delayed Check'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6 text-xs text-neutral-500">
                <span className="font-mono text-[9px] text-neutral-600 truncate max-w-[180px]">
                  {contact.contactPingId ? `Sync ID: ${contact.contactPingId}` : 'Directory Sync: Pending'}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClick(contact)}
                    className="p-2 rounded-lg border border-white/5 text-neutral-500 hover:text-blue-400 hover:border-blue-500/20 transition-all hover:bg-blue-950/10"
                    title="Edit Nominee"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {contact.verificationStatus === 'PENDING' && (
                    <button
                      onClick={() => handleSimulateVerify(contact.id)}
                      className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-yellow-500/20 bg-yellow-950/20 hover:bg-yellow-950/50 text-yellow-400 text-[10px] font-bold transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Verify Sync
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 rounded-lg border border-white/5 text-neutral-500 hover:text-red-400 hover:border-red-500/20 transition-all hover:bg-red-950/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Nominee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel bg-neutral-950 p-6 rounded-xl border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editingContact ? 'Edit Nominee Connection' : 'Register Financial Nominee'}
                </h2>
                <p className="text-xs text-neutral-400">
                  {editingContact ? 'Modify relationship parameters and sync options.' : 'Invites are mapped to directory user identities.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Nominee Full Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    required
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Nominee Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. sarah@cyberdyne.com"
                    required
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Access Trust Level</label>
                  <select
                    value={trustLevel}
                    onChange={(e) => setTrustLevel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                  >
                    <option value="LEVEL_1_IMMEDIATE">Immediate Access Grant</option>
                    <option value="LEVEL_2_DELAYED">Delayed Lockout Verification Check</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingContact ? 'Save Updates' : 'Send Invite'
                  )}
                </button>
              </form>
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
