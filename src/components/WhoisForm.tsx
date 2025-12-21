'use client';

import { useState, FormEvent, useCallback } from 'react';

interface WhoisFormProps {
  onSubmit: (query: string) => Promise<void>;
  onClear: () => void;
  loading: boolean;
}

export default function WhoisForm({ onSubmit, onClear, loading }: WhoisFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        await onSubmit(query.trim());
      }
    },
    [query, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#34495E]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ornek.com.tr / 8.8.8.8"
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#34495E] rounded-xl 
                       text-[#34495E] placeholder-[#34495E]/60
                       focus:outline-none focus:border-[#34495E]
                       transition-all duration-200 font-mono"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-4 h-[56px]
                     bg-[#34495E] text-white text-sm font-medium rounded-xl
                     hover:bg-[#2c3e50] 
                     disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
                     focus:outline-none
                     transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
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
    </form>
  );
}
