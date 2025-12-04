'use client';

import { useState } from 'react';

interface ProviderInfo {
  name: string;
  key: string;
  enabled: boolean;
  description: string;
  type: 'free' | 'paid';
  website?: string;
}

const providers: ProviderInfo[] = [
  {
    name: 'Native WHOIS',
    key: 'native',
    enabled: true,
    description: 'Doğrudan WHOIS protokolü üzerinden sorgulama yapar. Ücretsiz ve API anahtarı gerektirmez.',
    type: 'free',
  },
  {
    name: 'WhoisXML API',
    key: 'whoisxml',
    enabled: false,
    description: 'Ticari WHOIS API servisi. Daha detaylı ve güvenilir sonuçlar için API anahtarı gerektirir.',
    type: 'paid',
    website: 'https://whoisxmlapi.com',
  },
  {
    name: 'JSON WHOIS API',
    key: 'jsonwhois',
    enabled: false,
    description: 'Alternatif ticari WHOIS API servisi. JSON formatında sonuç döndürür.',
    type: 'paid',
    website: 'https://jsonwhois.com',
  },
];

/**
 * API Provider Info component
 * Shows which WHOIS APIs are being used
 */
export default function ApiProviderInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const enabledCount = providers.filter(p => p.enabled).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium text-slate-700 dark:text-slate-300">API Sağlayıcıları</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
            {enabledCount} aktif
          </span>
        </div>
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-700">
          {/* Info banner */}
          <div className="mt-4 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Tüm aktif API&apos;ler <strong>paralel</strong> olarak sorgulanır. İlk başarılı sonuç kullanılır ve veriler birleştirilir.
              </p>
            </div>
          </div>

          {/* Provider list */}
          <div className="space-y-3">
            {providers.map((provider) => (
              <div 
                key={provider.key}
                className={`p-4 rounded-xl border ${
                  provider.enabled 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-slate-400'}`} />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">
                          {provider.name}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          provider.type === 'free' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                            : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        }`}>
                          {provider.type === 'free' ? 'Ücretsiz' : 'Ücretli'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {provider.description}
                      </p>
                      {provider.website && (
                        <a 
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block"
                        >
                          {provider.website} ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    provider.enabled 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}>
                    {provider.enabled ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* How to enable more providers */}
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              💡 Daha fazla API nasıl eklenir?
            </h5>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <code className="bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-xs">config.json</code> dosyasını düzenleyerek 
              ücretli API&apos;leri aktifleştirebilirsiniz. API anahtarınızı ilgili provider&apos;ın <code className="bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-xs">apiKey</code> alanına ekleyin.
            </p>
          </div>

          {/* API Endpoint info */}
          <div className="mt-4 p-3 bg-slate-900 dark:bg-slate-950 rounded-lg">
            <h5 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              API Endpoint
            </h5>
            <div className="space-y-2">
              <code className="block text-xs text-green-400 bg-slate-800 p-2 rounded overflow-x-auto">
                GET /api/whois?domain=example.com
              </code>
              <code className="block text-xs text-blue-400 bg-slate-800 p-2 rounded overflow-x-auto">
                POST /api/whois {`{ "domain": "example.com" }`}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
