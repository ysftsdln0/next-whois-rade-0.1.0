'use client';

import { useState } from 'react';

interface ApiEndpoint {
  name: string;
  url: string;
  port: number;
  healthy: boolean;
  lastCheck: string | null;
}

interface ApiStatus {
  totalApis: number;
  healthyApis: number;
  endpoints: ApiEndpoint[];
}

interface ApiStatusPanelProps {
  apiStatus: ApiStatus | null;
  onRefresh: () => void;
}

export default function ApiStatusPanel({ apiStatus, onRefresh }: ApiStatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!apiStatus) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">API durumu yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">
              Backend API Durumu
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Health indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            apiStatus.healthyApis === apiStatus.totalApis
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : apiStatus.healthyApis > 0
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              apiStatus.healthyApis === apiStatus.totalApis
                ? 'bg-emerald-500'
                : apiStatus.healthyApis > 0
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`} />
            {apiStatus.healthyApis}/{apiStatus.totalApis} Aktif
          </div>

          {/* Refresh button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            title="Yenile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Expand/collapse icon */}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {apiStatus.endpoints.map((endpoint) => (
              <div
                key={endpoint.name}
                className={`relative p-4 rounded-xl border transition-all hover-lift ${
                  endpoint.healthy
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-red-50 border-red-200 hover:border-red-300'
                }`}
              >
                {/* Status indicator */}
                <div className="absolute top-3 right-3">
                  <span className="relative flex h-2.5 w-2.5">
                    {endpoint.healthy && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      endpoint.healthy ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></span>
                  </span>
                </div>

                {/* API Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    endpoint.healthy 
                      ? 'bg-emerald-100' 
                      : 'bg-red-100'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      endpoint.healthy 
                        ? 'text-emerald-600' 
                        : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${
                      endpoint.healthy 
                        ? 'text-emerald-700' 
                        : 'text-red-700'
                    }`}>
                      {endpoint.name}
                    </h4>
                    <p className="text-xs font-mono text-gray-500">
                      :{endpoint.port}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-2xs font-medium ${
                    endpoint.healthy
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}>
                    {endpoint.healthy ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Aktif
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Çevrimdışı
                      </>
                    )}
                  </span>

                  {endpoint.lastCheck && (
                    <span className="text-2xs text-gray-500 font-mono">
                      {new Date(endpoint.lastCheck).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
