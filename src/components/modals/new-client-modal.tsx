'use client';

import React, { useState } from 'react';
import { X, UserPlus, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

interface NewClientModalProps {
  onClose: () => void;
}

export function NewClientModal({ onClose }: NewClientModalProps) {
  const { addNewClient } = useAdmin();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [bankAccount, setBankAccount] = useState('HDFC Bank ••••4412');
  const [autoAssign14M, setAutoAssign14M] = useState(true);
  const [capital, setCapital] = useState(1000000);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please provide first name, last name, and email address.');
      return;
    }

    const res = addNewClient({
      firstName,
      lastName,
      email,
      phone,
      bankAccount,
      autoAssign14MPlan: autoAssign14M,
      allocatedAmount: capital,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0D131F] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Onboard New Investor
              </h3>
              <p className="text-xs text-slate-400">
                Register verified client and allocate contractual wealth tranche
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vikram"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="e.g. Singhania"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. vikram@familyoffice.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Bank Account
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
          </div>

          {/* Auto Assign Plan Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1E293B] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAssign14M}
                onChange={(e) => setAutoAssign14M(e.target.checked)}
                className="accent-[#D4AF37] w-4 h-4 rounded"
              />
              <span className="font-bold text-white text-xs">
                Auto-allocate 14-Month 15% Return Accelerator
              </span>
            </label>

            {autoAssign14M && (
              <div className="pt-2 pl-6 space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Allocated Capital:
                </label>
                <div className="flex gap-2">
                  {[1000000, 2500000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapital(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        capital === amt
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                          : 'bg-[#0D131F] text-slate-400 border-[#1E293B]'
                      }`}
                    >
                      {amt.toLocaleString('en-US')} USDT
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#080C14] border border-[#1E293B] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20"
            >
              Enroll Investor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

