'use client';

import { useState, useCallback, useEffect } from 'react';
import WhoisForm from '@/components/WhoisForm';
import WhoisResult from '@/components/WhoisResult';
import StatsDisplay from '@/components/StatsDisplay';
import ApiStatusPanel from '@/components/ApiStatusPanel';
import type { WhoisResult as WhoisResultType } from '@/lib/types';

// API v2 Response type
interface ApiV2Response {
  success: boolean;
  domain?: string;
  usedApi: {
    name: string;
    port: number;
  };
  queryTime?: string;
  fromCache?: boolean;
  data?: {
    raw?: string;
    parsed?: Record<string, unknown>;
    dates?: Record<string, string>;
    contacts?: Record<string, Record<string, string>>;
  };
  error?: string;
  timestamp: string;
}

// API Status type
interface ApiStatus {
  totalApis: number;
  healthyApis: number;
  endpoints: Array<{
    name: string;
    url: string;
    port: number;
    healthy: boolean;
    lastCheck: string | null;
  }>;
}

/**
 * Main page component
 * Provides the UI for WHOIS lookups
 */
export default function Home() {
  const [result, setResult] = useState<WhoisResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedApi, setUsedApi] = useState<{ name: string; port: number } | null>(null);
  const [queryTime, setQueryTime] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  /**
   * Fetch API status
   */
  const fetchApiStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/v2/status');
      const data = await response.json();
      if (data.success) {
        setApiStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch API status:', err);
    }
  }, []);

  // Fetch API status on mount and periodically
  useEffect(() => {
    fetchApiStatus();
    const interval = setInterval(fetchApiStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchApiStatus]);

  /**
   * Handle WHOIS lookup form submission
   */
  const handleLookup = useCallback(async (domain: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setUsedApi(null);
    setQueryTime(null);

    try {
      const response = await fetch(`/api/v2/whois?domain=${encodeURIComponent(domain)}`);
      const data: ApiV2Response = await response.json();

      if (data.success && data.data) {
        // Set which API was used
        setUsedApi(data.usedApi);
        setQueryTime(data.queryTime || null);

        // Convert to WhoisResult format
        const whoisResult: WhoisResultType = {
          domain: data.domain || domain,
          timestamp: new Date().toISOString(),
          cached: data.fromCache || false,
          providers: [{
            provider: data.usedApi.name,
            success: true,
            responseTime: parseInt(data.queryTime || '0'),
            data: {
              domainName: data.data.parsed?.domainName as string || domain,
              registrar: data.data.parsed?.registrar as string,
              registrarUrl: data.data.parsed?.registrarUrl as string,
              creationDate: data.data.dates?.created || data.data.parsed?.creationDate as string,
              expirationDate: data.data.dates?.expires || data.data.parsed?.expirationDate as string,
              updatedDate: data.data.dates?.updated || data.data.parsed?.updatedDate as string,
              nameServers: data.data.parsed?.nameServers as string[],
              status: data.data.parsed?.status as string[],
              dnssec: data.data.parsed?.dnssec as string,
              rawData: data.data.raw,
            }
          }],
          data: {
            domainName: data.data.parsed?.domainName as string || domain,
            registrar: data.data.parsed?.registrar as string,
            registrarUrl: data.data.parsed?.registrarUrl as string,
            creationDate: data.data.dates?.created || data.data.parsed?.creationDate as string,
            expirationDate: data.data.dates?.expires || data.data.parsed?.expirationDate as string,
            updatedDate: data.data.dates?.updated || data.data.parsed?.updatedDate as string,
            nameServers: data.data.parsed?.nameServers as string[],
            status: data.data.parsed?.status as string[],
            dnssec: data.data.parsed?.dnssec as string,
            rawData: data.data.raw,
          },
          errors: [],
        };
        setResult(whoisResult);
      } else {
        setError(data.error || 'Failed to lookup domain');
        setUsedApi(data.usedApi);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
      // Refresh API status after query
      fetchApiStatus();
    }
  }, [fetchApiStatus]);

  /**
   * Clear current results
   */
  const handleClear = useCallback(() => {
    setResult(null);
    setError(null);
    setUsedApi(null);
    setQueryTime(null);
  }, []);

  return (
    <div className="min-h-screen grid-bg">
      {/* Ambient light effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-white/[0.01] rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              {/* Logo glow effect */}
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-150" />
              <div className="relative w-16 h-16 md:w-20 md:h-20 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg 
                  className="w-8 h-8 md:w-10 md:h-10 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
                  />
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              WHOIS
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-xl mx-auto font-light">
            Domain Intelligence — Fast, reliable, minimal
          </p>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </header>

        {/* Main content */}
        <div className="space-y-8">
          {/* Search form */}
          <WhoisForm 
            onSubmit={handleLookup} 
            onClear={handleClear}
            loading={loading} 
          />

          {/* Error message */}
          {error && (
            <div className="animate-fade-in glass-card rounded-2xl p-5 border border-red-500/20 glow-error">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-white/20 animate-spin-slow" />
              </div>
              <p className="text-neutral-500 mt-6 text-sm tracking-wide">Querying domain...</p>
            </div>
          )}

          {/* Used API indicator */}
          {usedApi && !loading && (
            <div className="animate-fade-in glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xs uppercase tracking-wider text-neutral-500 mb-0.5">API Used</p>
                    <p className="text-white font-medium">
                      {usedApi.name} <span className="text-neutral-500 font-normal">:{usedApi.port}</span>
                    </p>
                  </div>
                </div>
                {queryTime && (
                  <div className="text-right">
                    <p className="text-2xs uppercase tracking-wider text-neutral-500 mb-0.5">Response</p>
                    <p className="text-white font-mono text-sm">{queryTime}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="animate-scale-in">
              <WhoisResult result={result} />
            </div>
          )}

          {/* API Status Panel */}
          <div className="pt-4">
            <ApiStatusPanel apiStatus={apiStatus} onRefresh={fetchApiStatus} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5">
          <div className="text-center space-y-3">
            <p className="text-neutral-600 text-sm">
              WHOIS Intelligence • Powered by 3 Backend APIs
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5">
              <span className="text-neutral-500 text-xs">Endpoint:</span>
              <code className="text-white/70 text-xs font-mono">GET /api/v2/whois?domain=</code>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
