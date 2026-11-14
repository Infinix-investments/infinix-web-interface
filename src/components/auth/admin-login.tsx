'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showErrorToast('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    // Check stored credentials (default admin / admin)
    const storedUsername = localStorage.getItem('infinix_admin_user') || 'admin';
    const storedPassword = localStorage.getItem('infinix_admin_pass') || 'admin';

    setTimeout(() => {
      if (username.trim() === storedUsername && password === storedPassword) {
        localStorage.setItem('infinix_admin_auth', 'true');
        showSuccessToast('Master Admin authenticated successfully');
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        showErrorToast('Invalid username or password');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#080C14] p-4 text-slate-100 relative overflow-hidden select-none">
      {/* Background glowing ambient effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="p-8 rounded-2xl bg-[#0D131F]/90 border border-[#1E293B] shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-xl shadow-[#D4AF37]/15 bg-[#080C14] mb-4">
              <Image
                src="/icon.png"
                alt="INFINIX"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-2xl text-white">INFINIX</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
                Desk
              </span>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-1">
              Master Admin Authentication
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Restricted Access Portal</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#080C14] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#080C14] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white text-sm outline-none transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#B89628] hover:to-[#E5D48B] text-black font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Master Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-5 border-t border-[#1E293B] text-center">
            <p className="text-[11px] text-slate-500">
              Authorized personnel only. All access attempts are recorded to the institutional security audit log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
