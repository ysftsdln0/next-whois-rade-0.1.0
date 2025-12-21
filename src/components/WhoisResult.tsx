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
  const [showRawData, setShowRawData] = useState(false);

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
   * Check if WHOIS data is privacy protected
   */
  const isPrivacyProtected = useMemo(() => {
    const whoisData = result?.data;
    if (!whoisData) return false;

    const privacyKeywords = [
      'redacted for privacy',
      'privacy',
      'whoisguard',
      'domains by proxy',
      'private registration',
      'contact privacy',
      'domain protection',
      'whois privacy',
      'proxy',
      'privacy service',
      'hidden upon user request'
    ];

    const fieldsToCheck = [
      whoisData.registrantName,
      whoisData.registrantOrganization,
      whoisData.registrantEmail,
    ].filter(Boolean).map(f => f!.toLowerCase());
    
    for (const field of fieldsToCheck) {
      if (privacyKeywords.some(keyword => field.includes(keyword))) {
        return true;
      }
    }

    if (whoisData.rawData) {
      const rawText = whoisData.rawData.toLowerCase();
      if (privacyKeywords.some(keyword => rawText.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }, [result.data]);

  /**
   * Group WHOIS data into sections
   */
  const dataGroups = useMemo(() => {
    const data = result.data;
    if (!data) return [];

    const registrantFields = isPrivacyProtected
      ? [{
        label: 'Durum',
        value: 'Kullanıcı talebiyle gizlenmiştir',
        isPrivacyProtected: true
      }]
      : [
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
          { label: 'Kayıt Firması', value: data.registrar },
          { label: 'Kayıt Firması URL', value: data.registrarUrl, isLink: true },
          { label: 'Kayıt Firması IANA ID', value: data.registrarIanaId },
          { label: 'DNSSEC', value: data.dnssec },
          ...(Array.isArray(data.nameServers) && data.nameServers.length > 0
            ? data.nameServers.map((ns, i) => ({ label: `Nameserver ${i + 1}`, value: ns }))
            : []),
        ],
      },
      {
        title: 'Tarihler',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        fields: isPrivacyProtected
          ? []
          : [
            { label: 'Oluşturulma', value: formatDate(data.creationDate) },
            { label: 'Güncelleme', value: formatDate(data.updatedDate) },
            { label: 'Bitiş', value: formatDate(data.expirationDate) },
          ],
        isPrivacyProtected: isPrivacyProtected,
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
        title: 'nameservers',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ),
        fields: data.nameServers?.map((ns, i) => ({ label: `NS ${i + 1}`, value: ns })) || [],
      },
      {
        title: 'Durum',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        fields: data.status?.map((status, i) => ({ label: `Durum ${i + 1}`, value: status })) || [],
      },
    ];
  }, [result.data, isPrivacyProtected]);

  /**
   * Parse vCard array to extract contact info
   */
  const parseVCard = (vcardArray: unknown[]): { name: string; org: string; address: string; email: string; phone: string } => {
    const result = { name: '', org: '', address: '', email: '', phone: '' };
    if (!Array.isArray(vcardArray) || vcardArray.length < 2) return result;

    const fields = vcardArray[1];
    if (!Array.isArray(fields)) return result;

    fields.forEach((field: unknown) => {
      if (!Array.isArray(field)) return;
      const [type, params, , value] = field;
      if (type === 'fn') result.name = String(value || '');
      if (type === 'org') result.org = String(value || '');
      if (type === 'email') result.email = String(value || '');
      if (type === 'tel') result.phone = String(value || '');
      if (type === 'adr' && params && typeof params === 'object' && 'label' in params) {
        result.address = String((params as Record<string, unknown>).label || '').replace(/\n/g, ', ');
      }
    });

    return result;
  };

  /**
   * Group IP WHOIS/RDAP data into sections - parses RDAP JSON directly
   */
  const ipDataGroups = useMemo(() => {
    const data = result.data;
    if (!data) return [];

    // Access the parsed data - check for both backend parsed and raw RDAP
    const parsed = data as unknown as Record<string, unknown>;

    // Check if we have RDAP data (from backend's rdap field or direct RDAP response)
    const rdap = (parsed.rdap as Record<string, unknown>) || parsed;

    // Network info from RDAP
    const netHandle = String(rdap.handle || parsed.handle || '');
    const netName = String(rdap.name || parsed.name || '');
    const startAddress = String(rdap.startAddress || '');
    const endAddress = String(rdap.endAddress || '');
    const ipVersion = String(rdap.ipVersion || '');
    const netType = String(rdap.type || '');
    const parentHandle = String(rdap.parentHandle || '');
    const port43 = String(rdap.port43 || '');

    // Parse status array
    const statusArr = rdap.status as string[] || [];
    const status = Array.isArray(statusArr) ? statusArr.join(', ') : '';

    // Parse CIDR from cidr0_cidrs
    const cidr0 = rdap.cidr0_cidrs as Array<{ v4prefix?: string; v6prefix?: string; length?: number }> || [];
    const cidr = cidr0.map(c => `${c.v4prefix || c.v6prefix}/${c.length}`).join(', ');

    // Parse events for dates
    const events = rdap.events as Array<{ eventAction: string; eventDate: string }> || [];
    let registrationDate = '';
    let lastChangedDate = '';
    events.forEach(event => {
      if (event.eventAction === 'registration') registrationDate = event.eventDate;
      if (event.eventAction === 'last changed') lastChangedDate = event.eventDate;
    });

    // Parse entities for contacts
    const entities = rdap.entities as Array<Record<string, unknown>> || [];
    let registrant = { name: '', org: '', address: '', email: '', phone: '', handle: '' };
    let abuseContact = { name: '', org: '', address: '', email: '', phone: '', handle: '' };
    let techContact = { name: '', org: '', address: '', email: '', phone: '', handle: '' };
    let adminContact = { name: '', org: '', address: '', email: '', phone: '', handle: '' };
    let remarks: string[] = [];

    entities.forEach(entity => {
      const roles = entity.roles as string[] || [];
      const vcard = parseVCard(entity.vcardArray as unknown[] || []);
      const entityHandle = String(entity.handle || '');

      // Parse remarks
      const entityRemarks = entity.remarks as Array<{ description: string[] }> || [];
      entityRemarks.forEach(r => {
        if (r.description) remarks.push(...r.description);
      });

      if (roles.includes('registrant')) {
        registrant = { ...vcard, handle: entityHandle };
      }

      // Parse nested entities for abuse, tech, admin
      const nestedEntities = entity.entities as Array<Record<string, unknown>> || [];
      nestedEntities.forEach(nested => {
        const nestedRoles = nested.roles as string[] || [];
        const nestedVcard = parseVCard(nested.vcardArray as unknown[] || []);
        const nestedHandle = String(nested.handle || '');

        if (nestedRoles.includes('abuse')) {
          abuseContact = { ...nestedVcard, handle: nestedHandle };
        }
        if (nestedRoles.includes('technical')) {
          techContact = { ...nestedVcard, handle: nestedHandle };
        }
        if (nestedRoles.includes('administrative')) {
          adminContact = { ...nestedVcard, handle: nestedHandle };
        }
      });
    });

    // Format date for display
    const formatRdapDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleString('tr-TR', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } catch { return dateStr; }
    };

    return [
      {
        title: 'Ağ Bilgisi',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
        fields: [
          { label: 'Ağ Adı', value: netName },
          { label: 'Handle', value: netHandle },
          { label: 'IP Başlangıç', value: startAddress },
          { label: 'IP Bitiş', value: endAddress },
          { label: 'IP Versiyon', value: ipVersion },
          { label: 'Ağ Türü', value: netType },
          { label: 'CIDR', value: cidr },
          { label: 'Üst Ağ', value: parentHandle },
          { label: 'Durum', value: status },
          { label: 'WHOIS Server', value: port43 },
        ],
      },
      {
        title: 'Kuruluş (Registrant)',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        fields: [
          { label: 'Kuruluş Adı', value: registrant.name || registrant.org },
          { label: 'Handle', value: registrant.handle },
          { label: 'Adres', value: registrant.address },
          { label: 'E-posta', value: registrant.email },
          { label: 'Telefon', value: registrant.phone },
        ],
      },
      {
        title: 'Suistimal İletişim (Abuse)',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        fields: [
          { label: 'Ad', value: abuseContact.name || abuseContact.org },
          { label: 'Handle', value: abuseContact.handle },
          { label: 'E-posta', value: abuseContact.email },
          { label: 'Telefon', value: abuseContact.phone },
          { label: 'Adres', value: abuseContact.address },
        ],
      },
      {
        title: 'Teknik İletişim',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        fields: [
          { label: 'Ad', value: techContact.name || techContact.org },
          { label: 'Handle', value: techContact.handle },
          { label: 'E-posta', value: techContact.email },
          { label: 'Telefon', value: techContact.phone },
        ],
      },
      {
        title: 'Yönetici İletişim',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        fields: [
          { label: 'Ad', value: adminContact.name || adminContact.org },
          { label: 'Handle', value: adminContact.handle },
          { label: 'E-posta', value: adminContact.email },
          { label: 'Telefon', value: adminContact.phone },
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
          { label: 'Kayıt Tarihi', value: formatRdapDate(registrationDate) },
          { label: 'Son Güncelleme', value: formatRdapDate(lastChangedDate) },
        ],
      },
      ...(remarks.length > 0 ? [{
        title: 'Notlar',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        ),
        fields: remarks.filter(r => r.trim()).slice(0, 5).map((r, i) => ({ label: `Not ${i + 1}`, value: r })),
      }] : []),
    ];
  }, [result.data]);

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
        {/* IP Query - Show raw RDAP JSON directly */}
        {queryType === 'ip' && result.data && (
          <div className="bg-[#34495E]/5 border-2 border-[#34495E] rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-[#34495E]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="text-xs uppercase tracking-wider font-medium">RDAP JSON Yanıtı</h3>
            </div>
            <pre className="text-xs text-[#34495E] font-mono whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto">
              {(() => {
                const parsed = result.data as unknown as Record<string, unknown>;
                // Get the RDAP data - either from 'rdap' field or the parsed data itself
                const rdapData = (parsed.rdap as Record<string, unknown>) || parsed;
                // Remove 'raw' field if it exists (it's usually the raw text version)
                const { raw, rawData, ...cleanData } = rdapData as Record<string, unknown>;
                return JSON.stringify(cleanData, null, 2);
              })()}
            </pre>
          </div>
        )}

        {/* Domain Query - Formatted view */}
        {queryType !== 'ip' && result.data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
            {dataGroups.map((group) => {
              const hasData = group.fields.some(f => f.value);
              // Always show Tarihler if privacy is enabled, even if fields are empty
              const isPrivacyGroup = 'isPrivacyProtected' in group && Boolean(group.isPrivacyProtected);
              if (!hasData && !(group.title === 'Tarihler' && isPrivacyGroup)) return null;

              return (
                <div
                  key={group.title}
                  className="bg-white border-2 border-[#34495E] rounded-xl p-4 hover:border-[#34495E]/80 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4 text-[#34495E]">
                    {group.icon}
                    <h3 className="text-xs uppercase tracking-wider font-medium">{group.title}</h3>
                  </div>
                  {/* Tarihler privacy message */}
                  {group.title === 'Tarihler' && isPrivacyGroup && (
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-600 font-mono">Kullanıcı talebiyle gizlenmiştir</span>
                    </div>
                  )}
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
                      return (
                        <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
                          <dt className="text-xs text-[#34495E]/60 sm:w-24 flex-shrink-0">
                            {field.label}
                          </dt>
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
                              field.value
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
                <pre className="text-xs text-[#34495E] font-mono whitespace-pre-wrap overflow-x-auto">
                  {result.data.rawData
                    .split('\n')
                    .filter(line => !line.trim().startsWith('%') && !line.trim().startsWith('#') && !line.trim().startsWith('>>>'))
                    .join('\n')
                    .trim()}
                </pre>
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
