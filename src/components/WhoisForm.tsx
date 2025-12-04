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
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      await onSubmit(domain.trim(), forceRefresh);
    }
  }, [domain, forceRefresh, onSubmit]);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    setDomain('');
    setForceRefresh(false);
    onClear();
  }, [onClear]);

  return (
    <div className={`glass-card rounded-2xl p-6 md:p-8 transition-all duration-300 ${isFocused ? 'glow border-white/10' : 'border-white/5'} border`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain input */}
        <div>
          <label htmlFor="domain" className="block text-2xs uppercase tracking-wider text-neutral-500 mb-3">
            Domaın Adı
          </label>
          <div className="relative group">
            {/* Input glow effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isFocused ? 'opacity-100' : ''}`} />
            
            <div className="relative flex items-center">
              <div className="absolute left-4 text-neutral-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <input
                type="text"
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="ornek.com.tr veya example.com"
                className="w-full pl-12 pr-12 py-4 bg-black/50 border border-white/10 rounded-xl 
                           text-white placeholder-neutral-600
                           focus:outline-none focus:border-white/20 focus:bg-black/70
                           transition-all duration-200 font-mono"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
              {domain && (
                <button
                  type="button"
                  onClick={() => setDomain('')}
                  className="absolute right-4 text-neutral-500 hover:text-white transition-colors"
                  title="Temizle"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border border-white/10 bg-white/[0.02] 
                              peer-checked:bg-white/10 peer-checked:border-white/20
                              transition-all duration-200" />
              <svg 
                className={`absolute inset-0 w-5 h-5 text-white p-1 transition-opacity duration-200 ${forceRefresh ? 'opacity-100' : 'opacity-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
              Cache&apos;i atla
            </span>
          </label>
        </div>

        {/* Submit buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="flex-1 md:flex-none px-8 py-3.5 
                       bg-white text-black font-medium rounded-xl
                       hover:bg-neutral-200 
                       disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black
                       transition-all duration-200 flex items-center justify-center gap-2
                       shadow-glow-lg hover:shadow-glow"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Sorgulanıyor...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Sorgula</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-3.5 
                       bg-white/[0.03] border border-white/10 
                       text-neutral-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20
                       font-medium rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black
                       transition-all duration-200"
          >
            Temizle
          </button>
        </div>
      </form>
    </div>
  );
}
