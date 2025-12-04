'use client';

import { useState, useMemo } from 'react';
import type { WhoisResult as WhoisResultType } from '@/lib/types';
import JsonDisplay from './JsonDisplay';

interface WhoisResultProps {
  result: WhoisResultType;
}

type ViewMode = 'formatted' | 'json' | 'providers';

/**
 * WHOIS result display component
 * Shows lookup results in multiple formats
 */
export default function WhoisResult({ result }: WhoisResultProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [copiedJson, setCopiedJson] = useState(false);

  /**
   * Copy JSON to clipboard
   */
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Download JSON file
   */
  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whois-${result.domain}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Format date string for display
   */
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Group WHOIS data into sections
   */
  const dataGroups = useMemo(() => {
    const data = result.data;
    if (!data) return [];

    return [
      {
        title: 'Domain',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
        fields: [
          { label: 'Domain Name', value: data.domainName },
          { label: 'Registrar', value: data.registrar },
          { label: 'Registrar URL', value: data.registrarUrl, isLink: true },
          { label: 'Registrar IANA ID', value: data.registrarIanaId },
          { label: 'DNSSEC', value: data.dnssec },
        ],
      },
      {
        title: 'Dates',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        fields: [
          { label: 'Created', value: formatDate(data.creationDate) },
          { label: 'Updated', value: formatDate(data.updatedDate) },
          { label: 'Expires', value: formatDate(data.expirationDate) },
        ],
      },
      {
        title: 'Registrant',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        fields: [
          { label: 'Name', value: data.registrantName },
          { label: 'Organization', value: data.registrantOrganization },
          { label: 'Street', value: data.registrantStreet },
          { label: 'City', value: data.registrantCity },
          { label: 'State', value: data.registrantState },
          { label: 'Postal Code', value: data.registrantPostalCode },
          { label: 'Country', value: data.registrantCountry },
          { label: 'Email', value: data.registrantEmail },
          { label: 'Phone', value: data.registrantPhone },
        ],
      },
      {
        title: 'Name Servers',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ),
        fields: data.nameServers?.map((ns, i) => ({ label: `NS ${i + 1}`, value: ns })) || [],
      },
      {
        title: 'Status',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        fields: data.status?.map((status, i) => ({ label: `Status ${i + 1}`, value: status })) || [],
      },
    ];
  }, [result.data]);

  // Check for successful providers
  const successfulProviders = result.providers.filter(p => p.success);
  const failedProviders = result.providers.filter(p => !p.success);

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Header with tabs */}
      <div className="border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-5 gap-4">
          {/* Result info */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${result.data ? 'bg-success shadow-glow-success' : 'bg-error shadow-glow-error'}`} />
            <div>
              <h2 className="text-lg font-semibold text-white font-mono">
                {result.domain}
              </h2>
              <p className="text-xs text-neutral-500">
                {result.cached && <span className="text-warning">(Cached) </span>}
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* View mode tabs */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-black/50 p-1 border border-white/5">
              {(['formatted', 'json', 'providers'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                    ${viewMode === mode 
                      ? 'bg-white/10 text-white' 
                      : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyJson}
                className="p-2 text-neutral-500 hover:text-white 
                           hover:bg-white/5 rounded-lg transition-all duration-200"
                title="Copy JSON"
              >
                {copiedJson ? (
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleDownloadJson}
                className="p-2 text-neutral-500 hover:text-white 
                           hover:bg-white/5 rounded-lg transition-all duration-200"
                title="Download JSON"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        {/* Formatted view */}
        {viewMode === 'formatted' && result.data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
            {dataGroups.map((group) => {
              const hasData = group.fields.some(f => f.value);
              if (!hasData) return null;

              return (
                <div 
                  key={group.title}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4 text-neutral-400">
                    {group.icon}
                    <h3 className="text-xs uppercase tracking-wider font-medium">{group.title}</h3>
                  </div>
                  <dl className="space-y-2">
                    {group.fields.map((field, i) => {
                      if (!field.value || field.value === 'N/A') return null;
                      return (
                        <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
                          <dt className="text-xs text-neutral-500 sm:w-24 flex-shrink-0">
                            {field.label}
                          </dt>
                          <dd className="text-sm text-white break-all font-mono">
                            {field.isLink ? (
                              <a 
                                href={field.value.startsWith('http') ? field.value : `https://${field.value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-300 hover:text-white animated-underline"
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

        {/* No data message for formatted view */}
        {viewMode === 'formatted' && !result.data && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-neutral-500">No WHOIS data available for this domain</p>
          </div>
        )}

        {/* JSON view */}
        {viewMode === 'json' && (
          <JsonDisplay data={result} />
        )}

        {/* Providers view */}
        {viewMode === 'providers' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-success">
                ✓ {successfulProviders.length} successful
              </span>
              <span className="text-error">
                ✗ {failedProviders.length} failed
              </span>
            </div>

            {/* Provider details */}
            <div className="space-y-3">
              {result.providers.map((provider, i) => (
                <div 
                  key={i}
                  className={`p-4 rounded-xl border transition-colors ${
                    provider.success 
                      ? 'bg-success/5 border-success/20 hover:border-success/30' 
                      : 'bg-error/5 border-error/20 hover:border-error/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${provider.success ? 'bg-success' : 'bg-error'}`} />
                      <span className="font-medium text-white">{provider.provider}</span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                      {provider.responseTime}ms
                    </span>
                  </div>
                  {provider.error && (
                    <p className="text-xs text-error/80">{provider.error}</p>
                  )}
                  {provider.success && provider.data && (
                    <p className="text-xs text-success/80">
                      Retrieved data for {provider.data.domainName || result.domain}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
