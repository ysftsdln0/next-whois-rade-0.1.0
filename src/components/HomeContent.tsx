'use client';

import { useState, useCallback, useEffect } from 'react';
import WhoisForm from '@/components/WhoisForm';
import WhoisResult from '@/components/WhoisResult';
import { BackgroundPaths } from '@/components/ui/background-paths';
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

/**
 * Home page content component
 * Provides the UI for WHOIS lookups
 */
export default function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<WhoisResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedApi, setUsedApi] = useState<{ name: string; port: number } | null>(null);
  const [queryTime, setQueryTime] = useState<string | null>(null);

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

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
    }
  }, []);

  /**
   * Clear current results
   */
  const handleClear = useCallback(() => {
    setResult(null);
    setError(null);
    setUsedApi(null);
    setQueryTime(null);
  }, []);

  // Show loading state until mounted on client
  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
          <p className="text-gray-500 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <BackgroundPaths>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-full container mx-auto px-4 py-12 md:py-20 max-w-5xl">
          {/* Header */}
          <header className="text-center mb-16 md:mb-20">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3 md:gap-4">
              <span className="text-[#34495E]">
                WHOIS
              </span>
            </h1>
          </header>

          {/* Main content */}
          <div className="space-y-8 w-full">
            {/* Search form */}
            <WhoisForm 
              onSubmit={handleLookup} 
              onClear={handleClear}
              loading={loading} 
            />

            {/* Error message */}
            {error && (
              <div className="animate-fade-in glass-card rounded-2xl p-5 border border-red-200 glow-error">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#34495E]/20 border-t-[#34495E] animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-[#34495E]/30 animate-spin-slow" />
                </div>
                <p className="text-[#34495E] mt-6 text-sm tracking-wide">Domain sorgulanıyor...</p>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="animate-scale-in ">
                <WhoisResult result={result} />
              </div>
            )}
          </div>
        </div>
      </div>

    {/* Footer */}
    <footer className="fixed bottom-0 left-0 right-0 py-6 bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
        <a href="https://who.gen.tr" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 font-bold">
          who.gen.tr
        </a>
        sizin çok işinize yarasın diye 
        <a href="https://radehosting.com" target="_blank" rel="noopener noreferrer">
          <img 
            src="/rade-logo.png" 
            alt="RADE" 
            className="h-4 w-auto inline-block"
          />
        </a>
        tarafından hazırlandı.
        </p>
      </div>
    </footer>
    </BackgroundPaths>
  );
}
