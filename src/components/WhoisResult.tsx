'use client';

import { useState, useMemo } from 'react';
import type { WhoisResult as WhoisResultType } from '@/lib/types';

interface WhoisResultProps {
  result: WhoisResultType;
  queryType?: 'domain' | 'ip';
}

export default function WhoisResult({ result, queryType = 'domain' }: WhoisResultProps) {
  const [showRawData, setShowRawData] = useState(false);
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
  const rdapToText = (rdapData: Record<string, unknown>): string => {
    const lines: string[] = [];

    const netName = String(rdapData.name || '');
    const handle = String(rdapData.handle || '');
    const startAddress = String(rdapData.startAddress || '');
    const endAddress = String(rdapData.endAddress || '');
    const ipVersion = String(rdapData.ipVersion || '');
    const type = String(rdapData.type || '');
    const parentHandle = String(rdapData.parentHandle || '');

    const cidr0 = rdapData.cidr0_cidrs as Array<{ v4prefix?: string; v6prefix?: string; length?: number }> || [];
    const cidr = cidr0.map(c => `${c.v4prefix || c.v6prefix}/${c.length}`).join(', ');

    const events = rdapData.events as Array<{ eventAction: string; eventDate: string }> || [];
    let regDate = '';
    let updateDate = '';
    events.forEach(e => {
      if (e.eventAction === 'registration') regDate = e.eventDate;
      if (e.eventAction === 'last changed') updateDate = e.eventDate;
    });

    const links = rdapData.links as Array<{ rel?: string; href?: string }> || [];
    const selfLink = links.find(l => l.rel === 'self');

    if (netName) lines.push(`NetName:        ${netName}`);
    if (handle) lines.push(`NetHandle:      ${handle}`);
    if (startAddress && endAddress) lines.push(`NetRange:       ${startAddress} - ${endAddress}`);
    if (cidr) lines.push(`CIDR:           ${cidr}`);
    if (type) lines.push(`NetType:        ${type}`);
    if (parentHandle) lines.push(`Parent:         ${parentHandle}`);
    if (ipVersion) lines.push(`IPVersion:      ${ipVersion}`);

    const entities = rdapData.entities as Array<Record<string, unknown>> || [];
    entities.forEach(entity => {
      const roles = entity.roles as string[] || [];
      const vcard = parseVCard(entity.vcardArray as unknown[] || []);
      const entityHandle = String(entity.handle || '');

      if (roles.includes('registrant')) {
        lines.push('');
        lines.push('Organization:   ' + (vcard.org || vcard.name));
        if (entityHandle) lines.push(`OrgHandle:      ${entityHandle}`);
        if (vcard.address) lines.push(`Address:        ${vcard.address}`);
        if (vcard.email) lines.push(`Email:          ${vcard.email}`);
        if (vcard.phone) lines.push(`Phone:          ${vcard.phone}`);
      }

      const nestedEntities = entity.entities as Array<Record<string, unknown>> || [];
      nestedEntities.forEach(nested => {
        const nestedRoles = nested.roles as string[] || [];
        const nestedVcard = parseVCard(nested.vcardArray as unknown[] || []);
        const nestedHandle = String(nested.handle || '');

        if (nestedRoles.includes('abuse')) {
          lines.push('');
          lines.push('Abuse Contact:  ' + (nestedVcard.org || nestedVcard.name));
          if (nestedHandle) lines.push(`AbuseHandle:    ${nestedHandle}`);
          if (nestedVcard.email) lines.push(`AbuseEmail:     ${nestedVcard.email}`);
          if (nestedVcard.phone) lines.push(`AbusePhone:     ${nestedVcard.phone}`);
        }

        if (nestedRoles.includes('technical')) {
          lines.push('');
          lines.push('Tech Contact:   ' + (nestedVcard.org || nestedVcard.name));
          if (nestedHandle) lines.push(`TechHandle:     ${nestedHandle}`);
          if (nestedVcard.email) lines.push(`TechEmail:      ${nestedVcard.email}`);
          if (nestedVcard.phone) lines.push(`TechPhone:      ${nestedVcard.phone}`);
        }
      });
    });

    lines.push('');
    if (regDate) lines.push(`RegDate:        ${new Date(regDate).toISOString().split('T')[0]}`);
    if (updateDate) lines.push(`Updated:        ${new Date(updateDate).toISOString().split('T')[0]}`);
    if (selfLink?.href) lines.push(`Ref:            ${selfLink.href}`);

    return lines.join('\n');
  };
  const ipDataGroups = useMemo(() => {
    const data = result.data;
    if (!data) return [];

    const parsed = data as unknown as Record<string, unknown>;

    const rdap = (parsed.rdap as Record<string, unknown>) || parsed;

    const netHandle = String(rdap.handle || parsed.handle || rdap.netHandle || '');
    const netName = String(rdap.name || parsed.name || rdap.netName || '');
    const startAddress = String(rdap.startAddress || parsed.startAddress || '');
    const endAddress = String(rdap.endAddress || parsed.endAddress || '');
    const ipVersion = String(rdap.ipVersion || parsed.ipVersion || '');
    const netType = String(rdap.type || parsed.type || rdap.netType || '');
    const parentHandle = String(rdap.parentHandle || parsed.parentHandle || '');
    const port43 = String(rdap.port43 || parsed.port43 || '');

    const cidr0 = (rdap.cidr0_cidrs || parsed.cidr0_cidrs) as Array<{ v4prefix?: string; v6prefix?: string; length?: number }> || [];
    const cidr = cidr0.map(c => `${c.v4prefix || c.v6prefix}/${c.length}`).join(', ');

    const events = (rdap.events || parsed.events) as Array<{ eventAction: string; eventDate: string }> || [];
    let registrationDate = '';
    let lastChangedDate = '';
    events.forEach(event => {
      if (event.eventAction === 'registration') registrationDate = event.eventDate;
      if (event.eventAction === 'last changed') lastChangedDate = event.eventDate;
    });

    const entities = (rdap.entities || parsed.entities) as Array<Record<string, unknown>> || [];
    let organization = '';
    let orgHandle = '';
    let originAS = '';

    entities.forEach(entity => {
      const roles = entity.roles as string[] || [];
      const vcard = parseVCard(entity.vcardArray as unknown[] || []);
      const entityHandle = String(entity.handle || '');

      if (roles.includes('registrant')) {
        organization = vcard.org || vcard.name;
        orgHandle = entityHandle;
      }
    });

    const formatRdapDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
      } catch { return dateStr; }
    };

    const netRange = startAddress && endAddress ? `${startAddress} - ${endAddress}` : '';

    const parentDisplay = parentHandle ? `${netName} (${parentHandle})` : '';

    const links = rdap.links as Array<{ rel?: string; href?: string }> || [];
    const selfLink = links.find(l => l.rel === 'self');
    const refUrl = selfLink?.href || '';

    return [
      {
        title: 'IP WHOIS Bilgisi',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
        fields: [
          { label: 'NetRange', value: netRange },
          { label: 'CIDR', value: cidr },
          { label: 'NetName', value: netName },
          { label: 'NetHandle', value: netHandle },
          { label: 'Parent', value: parentDisplay },
          { label: 'NetType', value: netType },
          { label: 'OriginAS', value: originAS || '' },
          { label: 'Organization', value: organization ? `${organization} (${orgHandle})` : '' },
          { label: 'RegDate', value: formatRdapDate(registrationDate) },
          { label: 'Updated', value: formatRdapDate(lastChangedDate) },
        ],
      },
    ];
  }, [result.data]);
  return (
    <div className="bg-white rounded-2xl border-2 border-[#34495E] overflow-hidden">
      <div className="border-b-2 border-[#34495E]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-5 gap-4">
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

      <div className="p-5 md:p-6">
        {queryType === 'ip' && result.data?.rawData && (
          <div className="bg-[#34495E]/5 border-2 border-[#34495E] rounded-xl p-4">
            <pre className="text-xs text-[#34495E] font-mono whitespace-pre-wrap overflow-x-auto">
              {(() => {
                try {
                  const parsed = typeof result.data.rawData === 'string'
                    ? JSON.parse(result.data.rawData)
                    : result.data.rawData;
                  return rdapToText(parsed as Record<string, unknown>);
                } catch {
                  return result.data.rawData;
                }
              })()}
            </pre>
          </div>
        )}

        {queryType !== 'ip' && result.data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
            {dataGroups.map((group) => {
              const hasData = group.fields.some(f => f.value);
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

        {queryType !== 'ip' && result.data?.rawData && (
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
