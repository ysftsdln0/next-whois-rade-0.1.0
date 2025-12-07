'use client';

import { useState, FormEvent, useCallback } from 'react';

interface WhoisFormProps {
  onSubmit: (domain: string, force?: boolean) => Promise<void>;
  onClear: () => void;
  loading: boolean;
}

/**
 * WHOIS lookup form component
 * Provides domain input and search controls
 */
export default function WhoisForm({ onSubmit, onClear, loading }: WhoisFormProps) {
  const [domain, setDomain] = useState('');

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      await onSubmit(domain.trim(), false);
    }
  }, [domain, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Domain input with button */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-[#34495E]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="text"
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="ornek.com.tr veya example.com"
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
            disabled={loading || !domain.trim()}
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
