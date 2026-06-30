'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Loader2, 
  Trash2, 
  UserCheck, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Contact {
  id: string;
  contactName: string;
  contactEmail: string;
  relationship: string;
  trustLevel: string;
  verificationStatus: string;
  contactPingId?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [relationship, setRelationship] = useState('SPOUSE');
  const [trustLevel, setTrustLevel] = useState('LEVEL_1_IMMEDIATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/contacts', {
        headers: { 'Authorization': 'Bearer mock-pass' }
      });
      const result = await response.json();
      if (result.success) {
        setContacts(result.data);
      }
    } catch (err) {
      setError('Failed to fetch emergency contact directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-pass'
        },
        body: JSON.stringify({
          contactName,
          contactEmail,
          relationship,
          trustLevel
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Failed to register contact');
        return;
      }

      await fetchContacts();
      setContactName('');
      setContactEmail('');
      setRelationship('SPOUSE');
      setTrustLevel('LEVEL_1_IMMEDIATE');
      setIsModalOpen(false);
    } catch (err) {
      setError('Communication with authentication directory server failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateVerify = async (contactId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/contacts/${contactId}/verify`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer mock-pass' }
      });
      const result = await response.json();
      if (result.success) {
        await fetchContacts();
      }
    } catch (err) {
      setError('Failed to trigger LDAP sync simulation');
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this emergency contact?')) return;
    try {
      await fetch(`http://localhost:3001/api/v1/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer mock-pass' }
      });
      await fetchContacts();
    } catch (err) {
      setError('Failed to delete contact record');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Emergency Contacts & Nominees</h1>
          <p className="text-xs text-neutral-400">Establish trusted relationship records to delegate time-scoped emergency permissions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="glow-button flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-400/20"
        >
          <Plus className="w-4 h-4" />
          Add Trusted Contact
        </button>
      </div>

      {/* Main Content Layout */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-mono">Loading Trust Relationship Tree...</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-white/10 text-neutral-500 space-y-4">
          <Users className="w-10 h-10 text-neutral-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No Trusted Relationships Found</p>
            <p className="text-xs text-neutral-400 mt-1">Add your spouse, siblings, or attorney to configure visual conditional access rules.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg transition-all"
          >
            Add Contact
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
                    <p className="text-white font-medium mt-0.5">{contact.relationship}</p>
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

      {/* Add Contact Modal */}
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
                <h2 className="text-lg font-bold text-white tracking-tight">Register Trusted Contact</h2>
                <p className="text-xs text-neutral-400">Invites are linked directly inside directory services.</p>
              </div>

              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. priya@heirloom.io"
                    required
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Relationship</label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="SPOUSE">Spouse</option>
                      <option value="SIBLING">Sibling</option>
                      <option value="CHILD">Child</option>
                      <option value="ATTORNEY">Attorney / Counsel</option>
                      <option value="PHYSICIAN">Physician / Verifier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-2">Trust Level</label>
                    <select
                      value={trustLevel}
                      onChange={(e) => setTrustLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="LEVEL_1_IMMEDIATE">Immediate Unlock</option>
                      <option value="LEVEL_2_DELAYED">Delayed Lockout Check</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Relationship'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
