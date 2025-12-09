/**
 * WHOIS Service
 * Main service that orchestrates WHOIS lookups across multiple providers
 */

import { log } from './logger';
import { isValidDomain, normalizeDomain } from './domain-utils';
import { queryNativeWhois, queryWhoisXml, queryJsonWhois, queryTredis, isTrDomain } from './providers';
import type { WhoisData, WhoisResult, ProviderResponse, ProviderConfig } from './types';

// Default configuration
const DEFAULT_CONFIG = {
  providers: {
    tredis: { enabled: true, priority: 0, description: 'TREDIS - Turkish Domain Registry (.tr)' },
    native: { enabled: true, priority: 1, description: 'Native WHOIS protocol' },
    whoisxml: { enabled: false, priority: 2, apiKey: '', description: 'WhoisXML API' },
    jsonwhois: { enabled: false, priority: 3, apiKey: '', description: 'JSON WHOIS API' },
  },
  timeout: 15000,
  retries: 2,
};

interface WhoisServiceConfig {
  providers: Record<string, ProviderConfig>;
  timeout: number;
  retries: number;
}

/**
 * Merge WHOIS data from multiple providers
 * Later providers fill in missing fields
 */
function mergeWhoisData(responses: ProviderResponse[]): WhoisData | null {
  const successfulResponses = responses.filter(r => r.success && r.data);
  
  if (successfulResponses.length === 0) {
    return null;
  }

  // Sort by priority (assuming responses are ordered by priority)
  const merged: WhoisData = { domainName: '' };

  for (const response of successfulResponses) {
    const data = response.data!;
    
    // Merge each field, only if not already set
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== '' && value !== null) {
        const mergedKey = key as keyof WhoisData;
        if (!(key in merged) || merged[mergedKey] === undefined || merged[mergedKey] === '') {
          // Use type assertion through unknown for dynamic key assignment
          (merged as unknown as Record<string, unknown>)[key] = value;
        }
      }
    }

    // Special handling for arrays - merge them
    if (data.nameServers && data.nameServers.length > 0) {
      merged.nameServers = Array.from(new Set([...(merged.nameServers || []), ...data.nameServers]));
    }
    if (data.status && data.status.length > 0) {
      merged.status = Array.from(new Set([...(merged.status || []), ...data.status]));
    }
  }

  return merged;
}

/**
 * Query a single provider with retry logic
 */
async function queryProvider(
  provider: string,
  domain: string,
  config: WhoisServiceConfig,
  apiKey?: string
): Promise<ProviderResponse> {
  const maxRetries = config.retries;
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let response: ProviderResponse;

      switch (provider) {
        case 'tredis':
          response = await queryTredis(domain, config.timeout);
          break;
        case 'native':
          response = await queryNativeWhois(domain, config.timeout);
          break;
        case 'whoisxml':
          response = await queryWhoisXml(domain, apiKey || '', config.timeout);
          break;
        case 'jsonwhois':
          response = await queryJsonWhois(domain, apiKey || '', config.timeout);
          break;
        default:
          return {
            provider,
            success: false,
            error: `Unknown provider: ${provider}`,
            responseTime: 0,
          };
      }

      if (response.success) {
        return response;
      }

      lastError = response.error || 'Unknown error';
      
      // Don't retry on certain errors
      if (lastError.includes('not configured') || lastError.includes('API key')) {
        return response;
      }

      log.debug(`Provider ${provider} attempt ${attempt} failed`, { domain, error: lastError });
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      log.debug(`Provider ${provider} attempt ${attempt} threw error`, { domain, error: lastError });
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return {
    provider,
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
    responseTime: 0,
  };
}

/**
 * Main WHOIS lookup function
 * Queries multiple providers in parallel and aggregates results
 */
export async function lookupWhois(
  domain: string,
  options?: {
    force?: boolean;
    config?: Partial<WhoisServiceConfig>;
  }
): Promise<WhoisResult> {
  const config = { ...DEFAULT_CONFIG, ...options?.config };
  const timestamp = new Date().toISOString();

  // Normalize domain
  const normalizedDomain = normalizeDomain(domain);

  // Validate domain
  if (!isValidDomain(normalizedDomain)) {
    log.warn('Invalid domain provided', { domain, normalizedDomain });
    return {
      domain: normalizedDomain,
      timestamp,
      cached: false,
      data: null,
      providers: [],
      errors: ['Invalid domain name'],
    };
  }

  log.info('Starting WHOIS lookup', { domain: normalizedDomain });

  // Get enabled providers sorted by priority
  const enabledProviders = Object.entries(config.providers)
    .filter(([, cfg]) => cfg.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([name, cfg]) => ({ name, ...cfg }));

  if (enabledProviders.length === 0) {
    log.error('No providers enabled');
    return {
      domain: normalizedDomain,
      timestamp,
      cached: false,
      data: null,
      providers: [],
      errors: ['No WHOIS providers enabled'],
    };
  }

  // Query all enabled providers in parallel
  const providerPromises = enabledProviders.map(provider =>
    queryProvider(provider.name, normalizedDomain, config, 'apiKey' in provider ? provider.apiKey : undefined)
  );

  const responses = await Promise.all(providerPromises);

  // Collect errors
  const errors = responses
    .filter(r => !r.success)
    .map(r => `${r.provider}: ${r.error}`);

  // Merge data from successful responses
  const mergedData = mergeWhoisData(responses);

  const result: WhoisResult = {
    domain: normalizedDomain,
    timestamp,
    cached: false,
    data: mergedData,
    providers: responses,
    errors,
  };

  if (mergedData) {
    log.info('WHOIS lookup completed', { 
      domain: normalizedDomain,
      successfulProviders: responses.filter(r => r.success).map(r => r.provider),
    });
  } else {
    log.warn('WHOIS lookup failed - no data from any provider', { 
      domain: normalizedDomain,
      errors,
    });
  }

  return result;
}

export default lookupWhois;
