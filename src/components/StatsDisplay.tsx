'use client';

import { useState, useEffect } from 'react';

interface Stats {
  service: string;
  version: string;
  uptime: number;
  cache: {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
}

/**
 * Stats display component
 * Shows service statistics and cache information
 */
export default function StatsDisplay() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  /**
   * Fetch stats from API
   */
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear cache
   */
  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/whois?action=clear-cache', { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  /**
   * Format uptime
   */
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Fetch stats when panel is opened
  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setShowStats(!showStats)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white">Service Statistics</span>
        </div>
        <svg 
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${showStats ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Stats content */}
      {showStats && (
        <div className="px-5 pb-5 border-t border-white/5 animate-fade-in">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
              <span className="text-neutral-500 text-sm">Loading stats...</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {/* Service info */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-2xs text-neutral-500 uppercase tracking-wider mb-2">Service</p>
                <p className="text-lg font-semibold text-white">{stats.service}</p>
                <p className="text-xs font-mono text-neutral-500">v{stats.version}</p>
              </div>

              {/* Uptime */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-2xs text-neutral-500 uppercase tracking-wider mb-2">Uptime</p>
                <p className="text-lg font-semibold text-white font-mono">{formatUptime(stats.uptime)}</p>
              </div>

              {/* Cache hits */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-2xs text-neutral-500 uppercase tracking-wider mb-2">Hit Rate</p>
                <p className="text-lg font-semibold text-success font-mono">{stats.cache.hitRate}</p>
                <p className="text-xs text-neutral-500 font-mono">
                  {stats.cache.hits} / {stats.cache.hits + stats.cache.misses}
                </p>
              </div>

              {/* Cached items */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <p className="text-2xs text-neutral-500 uppercase tracking-wider mb-2">Cached</p>
                <p className="text-lg font-semibold text-white font-mono">{stats.cache.keys}</p>
                <button
                  onClick={handleClearCache}
                  className="text-xs text-error hover:text-red-400 transition-colors mt-1"
                >
                  Clear cache
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-neutral-500 py-8 text-sm">Failed to load stats</p>
          )}

          {/* Refresh button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="text-xs text-neutral-400 hover:text-white
                         flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
