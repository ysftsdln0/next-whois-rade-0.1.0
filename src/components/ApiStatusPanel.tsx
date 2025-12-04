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
      <div className="glass-card rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
          <span className="text-neutral-500 text-sm">Loading API status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-white text-sm">
              Backend APIs
            </h3>
            <p className="text-xs text-neutral-500">
              Load balanced WHOIS services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Health indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            apiStatus.healthyApis === apiStatus.totalApis
              ? 'bg-success/10 text-success border-success/20'
              : apiStatus.healthyApis > 0
              ? 'bg-warning/10 text-warning border-warning/20'
              : 'bg-error/10 text-error border-error/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              apiStatus.healthyApis === apiStatus.totalApis
                ? 'bg-success'
                : apiStatus.healthyApis > 0
                ? 'bg-warning'
                : 'bg-error'
            }`} />
            {apiStatus.healthyApis}/{apiStatus.totalApis} Online
          </div>

          {/* Refresh button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Expand/collapse icon */}
          <svg 
            className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
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
                    ? 'bg-success/5 border-success/10 hover:border-success/20'
                    : 'bg-error/5 border-error/10 hover:border-error/20'
                }`}
              >
                {/* Status indicator */}
                <div className="absolute top-3 right-3">
                  <span className="relative flex h-2.5 w-2.5">
                    {endpoint.healthy && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      endpoint.healthy ? 'bg-success' : 'bg-error'
                    }`}></span>
                  </span>
                </div>

                {/* API Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    endpoint.healthy 
                      ? 'bg-success/10' 
                      : 'bg-error/10'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      endpoint.healthy 
                        ? 'text-success' 
                        : 'text-error'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${
                      endpoint.healthy 
                        ? 'text-success' 
                        : 'text-error'
                    }`}>
                      {endpoint.name}
                    </h4>
                    <p className="text-xs font-mono text-neutral-500">
                      :{endpoint.port}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-2xs font-medium ${
                    endpoint.healthy
                      ? 'text-success'
                      : 'text-error'
                  }`}>
                    {endpoint.healthy ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Active
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Offline
                      </>
                    )}
                  </span>

                  {endpoint.lastCheck && (
                    <span className="text-2xs text-neutral-600 font-mono">
                      {new Date(endpoint.lastCheck).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="mt-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Queries are distributed across healthy APIs for load balancing and failover protection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
