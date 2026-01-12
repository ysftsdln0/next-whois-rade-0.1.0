'use client';

import { useState, useMemo } from 'react';
import type { WhoisResult as WhoisResultType } from '@/lib/types';

interface WhoisResultProps {
  result: WhoisResultType;
  queryType?: 'domain' | 'ip';
}

/**
 * WHOIS result display component
 * Shows lookup results in multiple formats
 */
export default function WhoisResult({ result, queryType = 'domain' }: WhoisResultProps) {
  // For IP queries, show raw data by default
  const [showRawData, setShowRawData] = useState(queryType === 'ip');

  /**
   * Format date string for display
   */
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Calculate domain age
   */
  const calculateDomainAge = (creationDate: string | undefined) => {
    if (!creationDate) return 'N/A';
    try {
      const created = new Date(creationDate);
      const now = new Date();
      const diff = now.getTime() - created.getTime();
      
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      
      const parts = [];
      if (years > 0) parts.push(`${years} Yıl`);
      if (months > 0) parts.push(`${months} Ay`);
      if (days > 0) parts.push(`${days} Gün`);
      
      return parts.join(', ') || '0 Gün';
    } catch {
      return 'N/A';
    }
  };

  /**
   * Calculate days until expiration
   */
  const calculateDaysUntilExpiry = (expirationDate: string | undefined) => {
    if (!expirationDate) return null;
    try {
      const expiry = new Date(expirationDate);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      return days > 0 ? days : 0;
    } catch {
      return null;
    }
  };

  /**
   * Check if WHOIS data is privacy protected
   * Disabled - show all information regardless of privacy status
   */
  const isPrivacyProtected = useMemo(() => {
    // Always return false to show all available information
    return false;
  }, [result.data]);

  /**
   * Group WHOIS data into sections
   */
  const dataGroups = useMemo(() => {
    const data = result.data;
    if (!data) return [];

    const registrantFields = [
      { label: 'İsim', value: data.registrantName },
      { label: 'Kuruluş', value: data.registrantOrganization },
      { label: 'Adres', value: data.registrantStreet },
      { label: 'Şehir', value: data.registrantCity },
      { label: 'İl', value: data.registrantState },
      { label: 'Posta Kodu', value: data.registrantPostalCode },
      { label: 'Ülke', value: data.registrantCountry },
      { label: 'E-posta', value: data.registrantEmail },
      { label: 'Telefon', value: data.registrantPhone },
    ];
        
    const daysUntilExpiry = calculateDaysUntilExpiry(data.expirationDate);
    
    return [
      {
        title: 'Domain',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
        fields: [
          { label: 'Domain Adı', value: data.domainName },
          { label: 'NIC Handle', value: (data as any).nicHandle },
          { label: 'Kayıt Firması', value: data.registrar },
          { label: 'Kayıt Firması URL', value: data.registrarUrl, isLink: true },
          { label: 'Kayıt Firması IANA ID', value: data.registrarIanaId },
          { label: 'DNSSEC', value: data.dnssec },
        ],
      },
      {
        title: 'Tarihler',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        fields: [
          { label: 'Oluşturulma', value: formatDate(data.creationDate) },
          { label: 'Güncelleme', value: formatDate(data.updatedDate) },
          { 
            label: 'Bitiş', 
            value: formatDate(data.expirationDate),
            extra: daysUntilExpiry !== null && daysUntilExpiry > 0 ? `${daysUntilExpiry} gün kaldı` : null
          },
        ],
      },
      {
        title: 'Kayıt Sahibi',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        fields: registrantFields,
      },
      {
        title: 'Name Servers (İsim Sunucuları)',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ),
        fields: data.nameServers?.map((ns, i) => ({ label: `Nameserver ${i + 1}`, value: ns })) || [],
      },
      {
        title: 'Durum',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        fields: data.status?.map((status, i) => {
          // Better labels for different status types
          let label = 'Durum';
          if (status.toLowerCase().includes('transfer')) {
            label = 'Transfer';
          } else if (status.toLowerCase().includes('frozen')) {
            label = 'Frozen';
          } else if (i > 0) {
            label = `Durum ${i + 1}`;
          }
          return { label, value: status };
        }) || [],
      },
      {
        title: 'Alan Adı Bilgileri',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        fields: [
          { label: 'DOMAIN NAME', value: data.domainName },
          { label: 'REGISTRAR', value: data.registrar },
          { label: 'UPDATED DATE', value: formatDate(data.updatedDate) },
          { label: 'DOMAIN YAŞI', value: calculateDomainAge(data.creationDate) },
        ],
      },
      {
        title: 'Kayıt Sahibi Bilgileri',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        fields: [
          { label: 'REGISTRANT NAME', value: data.registrantName },
          { label: 'ORGANIZATION', value: data.registrantOrganization },
        ],
      },
    ];
  }, [result.data, isPrivacyProtected]);

  return (
    <div className="bg-white rounded-2xl border-2 border-[#34495E] overflow-hidden">
      {/* Header with tabs */}
      <div className="border-b-2 border-[#34495E]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-5 gap-4">
          {/* Result info */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${result.data ? 'bg-emerald-500 shadow-glow-success' : 'bg-red-500 shadow-glow-error'}`} />
            <div>
              <h2 className="text-lg font-semibold text-[#34495E] font-mono">
                {result.domain}
              </h2>
              <p className="text-xs text-[#34495E]/70">
                {result.cached && <span className="text-amber-600">(Önbellekten) </span>}
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        {/* Formatted view - only for domain queries */}
        {result.data && queryType === 'domain' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
            {dataGroups.map((group, groupIndex) => {
              const hasData = group.fields.some(f => f.value && f.value !== 'N/A');
              if (!hasData) return null;

              // Count total visible cards
              const visibleCards = dataGroups.filter(g => 
                g.fields.some(f => f.value && f.value !== 'N/A')
              );
              const totalCards = visibleCards.length;
              const isLastCard = groupIndex === dataGroups.length - 1;
              
              // If odd number of cards and this is the last one, make it full width
              const shouldSpanFull = totalCards % 2 !== 0 && isLastCard;

              return (
                <div 
                  key={group.title}
                  className={`bg-white border-2 border-[#34495E] rounded-xl p-4 hover:border-[#34495E]/80 transition-colors ${
                    shouldSpanFull ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4 text-[#34495E]">
                    {group.icon}
                    <h3 className="text-xs uppercase tracking-wider font-medium">{group.title}</h3>
                  </div>
                  <dl className="space-y-2">
                    {group.fields.map((field, i) => {
                      if (!field.value || field.value === 'N/A') return null;
                      if ('isPrivacyProtected' in field && field.isPrivacyProtected) {
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <dd className="text-sm font-semibold text-gray-600 font-mono">
                              {field.value}
                            </dd>
                          </div>
                        )
                      }
                      
                      const fullWidth = 'fullWidth' in field && field.fullWidth;
                      
                      return (
                        <div key={i} className={fullWidth ? "" : "flex flex-col sm:flex-row sm:gap-4"}>
                          {field.label && (
                            <dt className="text-xs text-[#34495E]/60 sm:w-24 flex-shrink-0">
                              {field.label}
                            </dt>
                          )}
                          <dd className="text-sm text-[#34495E] break-all font-mono">
                            {field.value?.startsWith('http') || field.value?.startsWith('https') ? (
                              <a 
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#34495E]/80 hover:text-[#34495E] animated-underline"
                              >
                                {field.value}
                              </a>
                            ) : (
                              <>
                                {field.value}
                                {'extra' in field && field.extra && (
                                  <span className="ml-2 text-xs text-green-600 font-medium">
                                    ✓ {field.extra}
                                  </span>
                                )}
                              </>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              );
            })}
          </div>
        )}

        {/* Raw Data Button and Section */}
        {result.data?.rawData && (
          <div className="mt-6">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#34495E] text-white rounded-xl hover:bg-[#2c3e50] transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showRawData ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium">Detaylı WHOIS Bilgisi</span>
            </button>
            
            {showRawData && (
              <div className="mt-4 p-4 bg-[#34495E]/5 border-2 border-[#34495E] rounded-xl">
                <div className="space-y-3">
                  {result.data.rawData
                    .split('\n')
                    .filter(line => {
                      const trimmed = line.trim().toLowerCase();
                      const original = line.trim();
                      
                      // Skip empty lines
                      if (trimmed === '') return false;
                      
                      // For IP queries, show more data with minimal filtering
                      if (queryType === 'ip') {
                        // Only skip comments and basic metadata
                        if (trimmed.startsWith('%') || 
                            trimmed.startsWith('#') || 
                            trimmed.startsWith('>>>')) return false;
                        
                        // Skip legal text
                        if (trimmed.includes('terms of use') ||
                            trimmed.includes('copyright') ||
                            trimmed.includes('for more information')) return false;
                        
                        return true;
                      }
                      
                      // For domain queries, apply stricter filtering
                      // Skip comment and metadata lines
                      if (trimmed.startsWith('%') || 
                          trimmed.startsWith('#') || 
                          trimmed.startsWith('>>>')) return false;
                      
                      // Skip technical server information
                      if (trimmed.startsWith('refer:') ||
                          trimmed.startsWith('whois:') ||
                          trimmed.startsWith('source:') ||
                          trimmed.startsWith('changed:') ||
                          trimmed.startsWith('remarks:')) return false;
                      
                      // Skip DNSSEC and technical details
                      if (trimmed.startsWith('dnssec:') ||
                          trimmed.startsWith('ds-rdata:') ||
                          trimmed.startsWith('last update of') ||
                          trimmed.startsWith('>>> last update')) return false;
                      
                      // Skip contact details (admin, tech, billing)
                      if (trimmed.startsWith('contact:') ||
                          trimmed.startsWith('admin ') ||
                          trimmed.startsWith('tech ') ||
                          trimmed.startsWith('billing ') ||
                          trimmed.startsWith('name:') ||
                          trimmed.startsWith('phone:') ||
                          trimmed.startsWith('e-mail:') ||
                          trimmed.startsWith('email:') ||
                          trimmed.startsWith('fax-no:')) return false;
                      
                      // Skip IANA and registry organization details
                      if (trimmed.startsWith('organisation:') ||
                          trimmed.startsWith('address:') ||
                          original.includes('IANA') ||
                          original.includes('Registry Services')) return false;
                      
                      // Skip nameserver IP addresses
                      if (trimmed.startsWith('nserver:')) return false;
                      
                      // Skip domain if it's just a TLD (like "domain: COM")
                      if (trimmed.startsWith('domain:') && !trimmed.includes(result.domain.toLowerCase())) {
                        return false;
                      }
                      
                      // Skip legal and policy text
                      if (trimmed.includes('terms of use') ||
                          trimmed.includes('terms and conditions') ||
                          trimmed.includes('copyright') ||
                          trimmed.includes('agreement') ||
                          trimmed.includes('policy') ||
                          trimmed.includes('for more information') ||
                          trimmed.includes('please visit') ||
                          trimmed.includes('http://') ||
                          trimmed.includes('https://')) return false;
                      
                      // Skip status descriptions in parentheses
                      if (trimmed.includes('(') && trimmed.includes(')') && 
                          !trimmed.startsWith('domain')) return false;
                      
                      return true;
                    })
                    .map((line, index) => {
                      const parts = line.split(':');
                      if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join(':').trim();
                        
                        // Clean up the value
                        const cleanValue = value.replace(/\.+$/, ''); // Remove trailing dots
                        
                        return (
                          <div key={index} className="flex flex-col sm:flex-row gap-2 py-2 border-b border-[#34495E]/10 last:border-0">
                            <dt className="text-xs font-medium text-[#34495E]/70 sm:w-48 flex-shrink-0 capitalize">
                              {key}
                            </dt>
                            <dd className="text-sm text-[#34495E] font-mono break-words">
                              {cleanValue}
                            </dd>
                          </div>
                        );
                      }
                      return null;
                    })
                    .filter(Boolean)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No data message */}
        {!result.data && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#34495E]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#34495E]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {queryType === 'domain' ? (
              <>
                <p className="text-[#34495E]/70 mb-4">Bu domain için WHOIS verisi bulunamadı</p>
                <a 
                  href="https://radehosting.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#34495E] text-white rounded-lg hover:bg-[#2c3e50] transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Bu domaine sahip olmak ister misin?
                </a>
              </>
            ) : (
              <p className="text-[#34495E]/70">Bu IP adresi için WHOIS verisi bulunamadı</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
