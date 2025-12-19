'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
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
  captchaRequired?: boolean;
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
  const [currentQueryType, setCurrentQueryType] = useState<'domain' | 'ip'>('domain');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<{ query: string } | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Detect whether the query is an IP address or a domain
   */
  const detectQueryType = (query: string): 'domain' | 'ip' => {
    const trimmed = query.trim();
    // Simple IPv4 check
    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
    // Simple IPv6 check
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::1)|(::)|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{1,4}))$/;

    if (ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed)) {
      return 'ip';
    }
    return 'domain';
  };

  /**
   * Handle WHOIS/IP lookup form submission
   */
  const handleLookup = useCallback(
    async (query: string, captchaToken?: string) => {
      const inferredType = detectQueryType(query);
      setLoading(true);
      setCurrentQueryType(inferredType);
      setError(null);
      setResult(null);
      setUsedApi(null);
      setQueryTime(null);

      try {
        let endpoint =
          inferredType === 'ip'
            ? `/api/v2/whois?domain=${encodeURIComponent(query)}&type=ip`
            : `/api/v2/whois?domain=${encodeURIComponent(query)}`;

        if (captchaToken) {
          endpoint += `&captchaToken=${encodeURIComponent(captchaToken)}`;
        }

        const response = await fetch(endpoint);
        const data: ApiV2Response = await response.json();

        if (data.captchaRequired) {
          setPendingQuery({ query });
          setShowCaptcha(true);
          setError(data.error || 'Captcha doğrulaması gerekli');
          setLoading(false);
          return;
        }

        if (data.success && data.data) {
          // Set which API was used
          setUsedApi(data.usedApi);
          setQueryTime(data.queryTime || null);

          // Check if domain/IP was actually found (not just raw data with "No match")
          const rawData = data.data.raw || '';
          const parsed = data.data.parsed || {};
          const isNotFound =
            rawData.toLowerCase().includes('no match') ||
            rawData.toLowerCase().includes('not found') ||
            rawData.toLowerCase().includes('no entries found') ||
            Object.keys(parsed).length === 0;

          // Convert to WhoisResult format
          const whoisResult: WhoisResultType = {
            domain: data.domain || query,
            timestamp: new Date().toISOString(),
            cached: data.fromCache || false,
            providers: [
              {
                provider: data.usedApi.name,
                success: !isNotFound,
                responseTime: parseInt(data.queryTime || '0', 10),
                data: isNotFound
                  ? undefined
                  : {
                    domainName:
                      (data.data.parsed?.domainName as string) || query,
                    registrar: data.data.parsed
                      ?.registrar as string,
                    registrarUrl: data.data.parsed
                      ?.registrarUrl as string,
                    creationDate:
                      data.data.dates?.created ||
                      (data.data.parsed?.creationDate as string),
                    expirationDate:
                      data.data.dates?.expires ||
                      (data.data.parsed?.expirationDate as string),
                    updatedDate:
                      data.data.dates?.updated ||
                      (data.data.parsed?.updatedDate as string),
                    nameServers: data.data.parsed
                      ?.nameServers as string[],
                    status: data.data.parsed?.status as string[],
                    dnssec: data.data.parsed?.dnssec as string,
                    rawData: data.data.raw,
                  },
              },
            ],
            data: isNotFound
              ? null
              : {
                domainName:
                  (data.data.parsed?.domainName as string) || query,
                registrar: data.data.parsed?.registrar as string,
                registrarUrl: data.data.parsed
                  ?.registrarUrl as string,
                creationDate:
                  data.data.dates?.created ||
                  (data.data.parsed?.creationDate as string),
                expirationDate:
                  data.data.dates?.expires ||
                  (data.data.parsed?.expirationDate as string),
                updatedDate:
                  data.data.dates?.updated ||
                  (data.data.parsed?.updatedDate as string),
                nameServers: data.data.parsed
                  ?.nameServers as string[],
                status: data.data.parsed?.status as string[],
                dnssec: data.data.parsed?.dnssec as string,
                rawData: data.data.raw,
              },
            errors: [],
          };
          setResult(whoisResult);
        } else {
          setError(data.error || 'Sorgu başarısız oldu');
          setUsedApi(data.usedApi);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ağ hatası oluştu');
      } finally {
        setLoading(false);
      }
    },
    [detectQueryType]
  );

  /**
   * Clear current results
   */
  const handleClear = useCallback(() => {
    setResult(null);
    setError(null);
    setUsedApi(null);
    setQueryTime(null);
    setShowCaptcha(false);
    setPendingQuery(null);
    recaptchaRef.current?.reset();
  }, []);

  /**
   * Handle captcha verification
   */
  const handleCaptchaChange = useCallback(async (token: string | null) => {
    if (token && pendingQuery) {
      setShowCaptcha(false);
      setError(null);
      // Retry the query with the captcha token
      await handleLookup(pendingQuery.query, token);
      setPendingQuery(null);
      recaptchaRef.current?.reset();
    }
  }, [pendingQuery, handleLookup]);

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
      <div className="min-h-screen flex flex-col">
        {/* Fixed height section for header and form - always stays at the same position */}
        <div className="h-[25vh] flex flex-col items-center justify-end flex-shrink-0 pb-6">
          <div className="w-full container mx-auto px-4 max-w-5xl">
            {/* Header */}
            <header className="text-center mb-6 md:mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3 md:gap-4">
                <span className="text-[#34495E]">
                  WHOIS
                </span>
              </h1>
            </header>

            {/* Search form */}
            <WhoisForm
              onSubmit={handleLookup}
              onClear={handleClear}
              loading={loading}
            />
          </div>
        </div>

        {/* Results section - grows as needed */}
        <div className="flex-1 w-full container mx-auto px-4 max-w-5xl pt-6 pb-24">
          <div className="space-y-6 w-full">
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

            {/* reCAPTCHA widget */}
            {showCaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
              <div className="animate-fade-in flex flex-col items-center gap-4 py-6">
                <p className="text-[#34495E] text-sm">Devam etmek için robot olmadığınızı doğrulayın:</p>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  theme="light"
                  size="normal"
                />
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
                <WhoisResult result={result} queryType={currentQueryType} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-6 bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-gray-500 text-sm flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <a href="https://who.gen.tr" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 font-bold">
              who.gen.tr
            </a>
            <span>sizin çok işinize yarasın diye</span>
            <a href="https://radehosting.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <img
                src="/rade-logo.png"
                alt="RADE"
                className="h-4 w-auto inline-block"
              />
            </a>
            <span>tarafından hazırlandı.</span>
          </div>
        </div>
      </footer>
    </BackgroundPaths>
  );
}
