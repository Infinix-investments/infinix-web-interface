'use client';

import React, { useState } from 'react';
import { MessageSquareText, Search, Star, RefreshCw, Filter, Calendar, User, Mail, Sparkles } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';

export function FeedbacksView() {
  const { userFeedbacks, refreshFeedbacks, stats } = useAdmin();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFeedbacks();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const categories = ['all', 'General', 'Investment', 'Withdrawal', 'App Issue', 'Feature Request'];

  const filteredFeedbacks = userFeedbacks.filter((item) => {
    if (filterCat !== 'all' && item.category !== filterCat) return false;
    if (filterRating !== 'all' && String(item.rating) !== filterRating) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.message.toLowerCase().includes(q) ||
        item.userEmail.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const avgRating =
    userFeedbacks.length > 0
      ? (userFeedbacks.reduce((sum, item) => sum + (item.rating || 0), 0) / userFeedbacks.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Top Banner / Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total User Feedbacks
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {userFeedbacks.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Across all investor categories
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <MessageSquareText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Average Rating
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-white">{avgRating}</span>
              <div className="flex items-center text-amber-400 text-sm">
                {'★'.repeat(Math.round(Number(avgRating)))}
              </div>
            </div>
            <p className="text-xs text-emerald-400 mt-0.5">
              Investor satisfaction score
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Live Feed Connection
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-base font-bold text-slate-200">MongoDB Synced</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time investor transmissions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-[#141C2E] hover:bg-[#1E293B] text-slate-300 hover:text-[#D4AF37] border border-[#1E293B] hover:border-[#D4AF37]/40 transition-all"
            title="Refresh User Feedbacks"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Investor Feedback & Experience Registry
              </h3>
              <p className="text-xs text-slate-400">
                Review ratings, comments, and direct insights submitted from the mobile & client desks
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback, name, email..."
              className="w-full bg-[#080C14] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>

        {/* Category & Star Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1E293B]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> CATEGORY:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterCat === cat
                    ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                    : 'bg-[#080C14] text-slate-400 border border-[#1E293B] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">RATING:</span>
            {['all', '5', '4', '3', '2', '1'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterRating === r
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-[#080C14] text-slate-400 border border-[#1E293B] hover:text-white'
                }`}
              >
                {r === 'all' ? 'All' : `${r} ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-3">
        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0D131F] border border-[#1E293B]">
            <div className="w-12 h-12 rounded-full bg-[#141C2E] text-slate-500 flex items-center justify-center mx-auto mb-3">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-300">No User Feedbacks Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || filterCat !== 'all' || filterRating !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'When investors submit feedback in their app, it will immediately show here.'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((item) => (
            <div
              key={item.id || item.feedbackId}
              className="p-5 rounded-2xl bg-[#0D131F] border border-[#1E293B] hover:border-[#D4AF37]/30 transition-all space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1E293B]/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                    {item.userName ? item.userName.slice(0, 2).toUpperCase() : 'IN'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.userName}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {item.userEmail}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-[#080C14] px-2.5 py-1 rounded-lg border border-[#1E293B]">
                    <span className="text-xs font-bold text-amber-400">{'★'.repeat(item.rating || 5)}</span>
                    <span className="text-[10px] font-semibold text-slate-400 ml-1">({item.rating}/5)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}{' '}
                      at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Content */}
              <div className="bg-[#080C14] p-4 rounded-xl border border-[#1E293B]">
                <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                  "{item.message}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
