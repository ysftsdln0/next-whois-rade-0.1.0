'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import WhoisForm from '@/components/WhoisForm';
import WhoisResult from '@/components/WhoisResult';
import { BackgroundPaths } from '@/components/ui/background-paths';
import type { WhoisResult as WhoisResultType } from '@/lib/types';

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
 * Parse additional information from raw WHOIS data
 */
function parseAdditionalInfoFromRaw(rawData: string): {
  dates?: { created?: string; updated?: string; expires?: string };
  registrar?: string;
  registrantOrganization?: string;
  registrantName?: string;
  registrantEmail?: string;
  registrantPhone?: string;
  registrantAddress?: string;
  nicHandle?: string;
  status?: string[];
  nameServers?: string[];
} {
  const info: Record<string, any> = {
    dates: {}
  };
  
  // Date patterns
  const datePatterns = [
    // Created patterns
    { key: 'created', regex: /Created\s+(?:on|Date)?\s*:?\s*([^\n]+)/i },
    { key: 'created', regex: /Creation\s+Date\s*:?\s*([^\n]+)/i },
    { key: 'created', regex: /created\s*:\s*([^\n]+)/i },
    { key: 'created', regex: /Registered\s+on\s*:?\s*([^\n]+)/i },
    { key: 'created', regex: /Registration\s+Date\s*:?\s*([^\n]+)/i },
    
    // Updated patterns
    { key: 'updated', regex: /Updated\s+(?:on|Date)?\s*:?\s*([^\n]+)/i },
    { key: 'updated', regex: /Last\s+Updated?\s*(?:on|Date)?\s*:?\s*([^\n]+)/i },
    { key: 'updated', regex: /Modified\s+(?:on|Date)?\s*:?\s*([^\n]+)/i },
    
    // Expires patterns
    { key: 'expires', regex: /Expir(?:es|y|ation)\s+(?:on|Date)?\s*:?\s*([^\n]+)/i },
    { key: 'expires', regex: /Registry\s+Expiry\s+Date\s*:?\s*([^\n]+)/i },
  ];
  
  for (const pattern of datePatterns) {
    if (!info.dates[pattern.key]) {
      const match = rawData.match(pattern.regex);
      if (match && match[1]) {
        const dateStr = match[1].trim().replace(/\.+$/, ''); // Remove trailing dots
        info.dates[pattern.key] = dateStr;
      }
    }
  }
  
  // NIC Handle
  const nicHandleMatch = rawData.match(/NIC\s+Handle\s*:?\s*([^\n]+)/i);
  if (nicHandleMatch) {
    info.nicHandle = nicHandleMatch[1].trim();
  }
  
  // Registrar
  const registrarMatch = rawData.match(/Registrar\s*:?\s*([^\n]+)/i);
  if (registrarMatch) {
    info.registrar = registrarMatch[1].trim();
  }
  
  // Parse Registrant section - look for "** Registrant:" section
  const registrantSection = rawData.match(/\*\*\s*Registrant:([^\*]+)/i);
  if (registrantSection) {
    const section = registrantSection[1];
    
    // Check if section contains privacy keywords
    const hasPrivacy = /hidden\s+upon\s+user\s+request|privacy|redacted/i.test(section);
    
    if (!hasPrivacy) {
      // Organization Name
      const orgMatch = section.match(/Organization\s+Name\s*:?\s*([^\n]+)/i);
      if (orgMatch) {
        info.registrantOrganization = orgMatch[1].trim();
      }
      
      // Address
      const addrMatch = section.match(/Address\s*:?\s*([^\n]+)/i);
      if (addrMatch) {
        info.registrantAddress = addrMatch[1].trim();
      }
    }
  }
  
  // Alternative: Try standard Registrant fields
  if (!info.registrantOrganization) {
    const orgMatch = rawData.match(/(?:Registrant\s+)?Organization(?:\s+Name)?\s*:?\s*([^\n]+)/i);
    if (orgMatch && !orgMatch[1].toLowerCase().includes('privacy') && !orgMatch[1].toLowerCase().includes('hidden')) {
      info.registrantOrganization = orgMatch[1].trim();
    }
  }
  
  // Registrant Name
  const nameMatch = rawData.match(/Registrant\s+(?:Name|Contact)?\s*:?\s*([^\n]+)/i);
  if (nameMatch && !nameMatch[1].toLowerCase().includes('privacy') && !nameMatch[1].toLowerCase().includes('hidden')) {
    info.registrantName = nameMatch[1].trim();
  }
  
  // Registrant Email
  const emailMatch = rawData.match(/(?:Registrant\s+)?Email\s*:?\s*([^\n]+)/i);
  if (emailMatch && !emailMatch[1].toLowerCase().includes('privacy') && !emailMatch[1].toLowerCase().includes('hidden')) {
    info.registrantEmail = emailMatch[1].trim();
  }
  
  // Registrant Phone
  const phoneMatch = rawData.match(/(?:Registrant\s+)?Phone\s*:?\s*([^\n]+)/i);
  if (phoneMatch && !phoneMatch[1].toLowerCase().includes('privacy')) {
    info.registrantPhone = phoneMatch[1].trim();
  }
  
  // Domain Status - collect all status lines
  const statuses: string[] = [];
  
  // Domain Status line
  const domainStatusMatch = rawData.match(/Domain\s+Status\s*:?\s*([^\n]+)/i);
  if (domainStatusMatch) {
    statuses.push(domainStatusMatch[1].trim());
  }
  
  // Frozen Status
  const frozenStatusMatch = rawData.match(/Frozen\s+Status\s*:?\s*([^\n]+)/i);
  if (frozenStatusMatch && frozenStatusMatch[1].trim()) {
    statuses.push(`Frozen: ${frozenStatusMatch[1].trim()}`);
  }
  
  // Transfer Status
  const transferStatusMatch = rawData.match(/Transfer\s+Status\s*:?\s*([^\n]+)/i);
  if (transferStatusMatch && transferStatusMatch[1].trim()) {
    statuses.push(`Transfer: ${transferStatusMatch[1].trim()}`);
  }
  
  // EPP Status codes (for gTLDs)
  const eppStatusMatches = rawData.matchAll(/(?:Status|Domain Status)\s*:?\s*(client\w+|server\w+|ok|pending\w+|auto\w+|inactive)/gi);
  for (const match of eppStatusMatches) {
    const status = match[1].trim();
    if (status && !statuses.includes(status)) {
      statuses.push(status);
    }
  }
  
  if (statuses.length > 0) {
    info.status = statuses;
  }
  
  // Parse Name Servers
  const nameServers: string[] = [];
  
  // "** Domain Servers:" format (Trabis .tr)
  const domainServersMatch = rawData.match(/\*\*\s*Domain Servers:\s*\n([\s\S]*?)(?=\n\*\*|\n\n|$)/i);
  if (domainServersMatch) {
    const serversSection = domainServersMatch[1];
    const serverLines = serversSection.split('\n');
    for (const line of serverLines) {
      const trimmed = line.trim();
      if (trimmed && /^[a-z0-9][\w\-\.]+\.[a-z]{2,}$/i.test(trimmed.split(/\s+/)[0])) {
        const ns = trimmed.split(/\s+/)[0].toLowerCase();
        if (!nameServers.includes(ns)) {
          nameServers.push(ns);
        }
      }
    }
  }
  
  // Standard "Name Server:" or "Nameserver:" format
  if (nameServers.length === 0) {
    const nsMatches = rawData.matchAll(/(?:Name\s+Server|Nameserver|Host\s+Name|nserver)\s*:?\s*([a-z0-9][\w\-\.]+\.[a-z]{2,})/gi);
    for (const match of nsMatches) {
      const ns = match[1].toLowerCase().trim();
      if (ns && !nameServers.includes(ns)) {
        nameServers.push(ns);
      }
    }
  }
  
  if (nameServers.length > 0) {
    info.nameServers = nameServers;
  }
  
  return info;
}

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

  useEffect(() => {
    setMounted(true);
  }, []);
  const detectQueryType = (query: string): 'domain' | 'ip' => {
    const trimmed = query.trim();
    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::1)|(::)|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{1,4}))$/;

    if (ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed)) {
      return 'ip';
    }
    return 'domain';
  };
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

          // Debug: Log the parsed data to check nameServers
          console.log('[DEBUG] Parsed data:', data.data.parsed);
          console.log('[DEBUG] NameServers:', data.data.parsed?.nameServers);

          const rawData = data.data.raw || '';
          const parsed = data.data.parsed || {};
          const isNotFound =
            rawData.toLowerCase().includes('no match') ||
            rawData.toLowerCase().includes('not found') ||
            rawData.toLowerCase().includes('no entries found') ||
            Object.keys(parsed).length === 0;

          // Parse additional information from raw data if not available in parsed data
          const rawInfo = parseAdditionalInfoFromRaw(rawData);
          const creationDate = data.data.dates?.created || 
                              (data.data.parsed?.creationDate as string) || 
                              rawInfo.dates?.created;
          const expirationDate = data.data.dates?.expires || 
                                (data.data.parsed?.expirationDate as string) || 
                                rawInfo.dates?.expires;
          const updatedDate = data.data.dates?.updated || 
                             (data.data.parsed?.updatedDate as string) || 
                             rawInfo.dates?.updated;
          const registrar = (data.data.parsed?.registrar as string) || rawInfo.registrar;
          const status = (data.data.parsed?.status as string[]) || rawInfo.status;
          const registrantOrganization = (data.data.parsed?.registrantOrganization as string) || rawInfo.registrantOrganization;
          const registrantName = (data.data.parsed?.registrantName as string) || rawInfo.registrantName;
          const nicHandle = (data.data.parsed as any)?.nicHandle || rawInfo.nicHandle;
          const nameServers = (data.data.parsed?.nameServers as string[]) || rawInfo.nameServers;

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
                  : inferredType === 'ip'
                    ? {
                      ...(data.data.parsed as unknown as Record<string, unknown>),
                      rawData: data.data.raw,
                    }
                    : {
                      domainName:
                        (data.data.parsed?.domainName as string) || query,
                      nicHandle,
                      registrar,
                      registrarUrl: data.data.parsed
                        ?.registrarUrl as string,
                      registrarIanaId: data.data.parsed
                        ?.registrarIanaId as string,
                      creationDate,
                      expirationDate,
                      updatedDate,
                      nameServers,
                      status,
                      dnssec: data.data.parsed?.dnssec as string,
                      registrantName,
                      registrantOrganization,
                      registrantEmail: data.data.parsed?.registrantEmail as string,
                      registrantPhone: data.data.parsed?.registrantPhone as string,
                      registrantStreet: data.data.parsed?.registrantStreet as string,
                      registrantCity: data.data.parsed?.registrantCity as string,
                      registrantState: data.data.parsed?.registrantState as string,
                      registrantPostalCode: data.data.parsed?.registrantPostalCode as string,
                      registrantCountry: data.data.parsed?.registrantCountry as string,
                      rawData: data.data.raw,
                    },
              },
            ],
            data: isNotFound
              ? null
              : inferredType === 'ip'
                ? {
                  ...(data.data.parsed as unknown as Record<string, unknown>),
                  rawData: data.data.raw,
                }
                : {
                  domainName:
                    (data.data.parsed?.domainName as string) || query,
                  nicHandle,
                  registrar,
                  registrarUrl: data.data.parsed
                    ?.registrarUrl as string,
                  registrarIanaId: data.data.parsed
                    ?.registrarIanaId as string,
                  creationDate,
                  expirationDate,
                  updatedDate,
                  nameServers: data.data.parsed
                    ?.nameServers as string[],
                  status,
                  dnssec: data.data.parsed?.dnssec as string,
                  registrantName,
                  registrantOrganization,
                  registrantEmail: data.data.parsed?.registrantEmail as string,
                  registrantPhone: data.data.parsed?.registrantPhone as string,
                  registrantStreet: data.data.parsed?.registrantStreet as string,
                  registrantCity: data.data.parsed?.registrantCity as string,
                  registrantState: data.data.parsed?.registrantState as string,
                  registrantPostalCode: data.data.parsed?.registrantPostalCode as string,
                  registrantCountry: data.data.parsed?.registrantCountry as string,
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
  const handleClear = useCallback(() => {
    setResult(null);
    setError(null);
    setUsedApi(null);
    setQueryTime(null);
    setShowCaptcha(false);
    setPendingQuery(null);
    recaptchaRef.current?.reset();
  }, []);
  const handleCaptchaChange = useCallback(async (token: string | null) => {
    if (token && pendingQuery) {
      setShowCaptcha(false);
      setError(null);
      await handleLookup(pendingQuery.query, token);
      setPendingQuery(null);
      recaptchaRef.current?.reset();
    }
  }, [pendingQuery, handleLookup]);
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
        <div className="h-[25vh] flex flex-col items-center justify-end flex-shrink-0 pb-6">
          <div className="w-full container mx-auto px-4 max-w-5xl">
            <header className="text-center mb-6 md:mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3 md:gap-4">
                <span className="text-[#34495E]">
                  WHOIS
                </span>
              </h1>
            </header>
            <WhoisForm
              onSubmit={handleLookup}
              onClear={handleClear}
              loading={loading}
            />
          </div>
        </div>

        <div className="flex-1 w-full container mx-auto px-4 max-w-5xl pt-6 pb-24">
          <div className="space-y-6 w-full">
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
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#34495E]/20 border-t-[#34495E] animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-[#34495E]/30 animate-spin-slow" />
                </div>
                <p className="text-[#34495E] mt-6 text-sm tracking-wide">Domain sorgulanıyor...</p>
              </div>
            )}
            {result && !loading && (
              <div className="animate-scale-in ">
                <WhoisResult result={result} queryType={currentQueryType} />
              </div>
            )}
          </div>
        </div>
      </div>
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
