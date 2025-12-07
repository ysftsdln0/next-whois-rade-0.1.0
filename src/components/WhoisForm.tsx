'use client';

import { useState, FormEvent, useCallback } from 'react';

type QueryType = 'domain' | 'ip';

interface WhoisFormProps {
  onSubmit: (query: string, queryType: QueryType) => Promise<void>;
  onClear: () => void;
  loading: boolean;
}

/**
 * WHOIS lookup form component
 * Provides domain/IP input and search controls
 */
export default function WhoisForm({ onSubmit, onClear, loading }: WhoisFormProps) {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('domain');

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await onSubmit(query.trim(), queryType);
    }
  }, [query, queryType, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Query type selector */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setQueryType('domain')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            queryType === 'domain'
              ? 'bg-[#34495E] text-white'
              : 'bg-[#34495E]/10 text-[#34495E] hover:bg-[#34495E]/20'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Domain
          </span>
        </button>
        <button
          type="button"
          onClick={() => setQueryType('ip')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            queryType === 'ip'
              ? 'bg-[#34495E] text-white'
              : 'bg-[#34495E]/10 text-[#34495E] hover:bg-[#34495E]/20'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            IP Adresi
          </span>
        </button>
      </div>

      {/* Input with button */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-[#34495E]">
            {queryType === 'domain' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            )}
          </div>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={queryType === 'domain' ? "ornek.com.tr veya example.com" : "8.8.8.8 veya 192.168.1.1"}
            className="w-full pl-12 pr-32 py-4 bg-white border-2 border-[#34495E] rounded-xl 
                       text-[#34495E] placeholder-[#34495E]/60
                       focus:outline-none focus:border-[#34495E]
                       transition-all duration-200 font-mono"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-5 py-2 
                       bg-[#34495E] text-white text-sm font-medium rounded-lg
                       hover:bg-[#2c3e50] 
                       disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
                       focus:outline-none
                       transition-all duration-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Sorgulanıyor</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Sorgula</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
