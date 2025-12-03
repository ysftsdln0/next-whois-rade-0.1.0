/**
 * Domain Utilities
 * Helper functions for domain validation and parsing
 */

// Regular expression for validating domain names
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// IDN (Internationalized Domain Name) support
const IDN_REGEX = /^(?:xn--[a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/;

/**
 * Validate if a string is a valid domain name
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  const cleanDomain = domain.toLowerCase().trim();
  
  // Check length limits
  if (cleanDomain.length > 253) {
    return false;
  }

  // Check for standard domain or IDN
  return DOMAIN_REGEX.test(cleanDomain) || IDN_REGEX.test(cleanDomain);
}

/**
 * Clean and normalize domain name
 */
export function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase().trim();
  
  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//i, '');
  
  // Remove www prefix
  normalized = normalized.replace(/^www\./i, '');
  
  // Remove trailing slash and path
  normalized = normalized.split('/')[0];
  
  // Remove port if present
  normalized = normalized.split(':')[0];
  
  return normalized;
}

/**
 * Extract TLD from domain name
 */
export function extractTld(domain: string): string {
  const parts = domain.split('.');
  return parts[parts.length - 1];
}

/**
 * Extract SLD (Second Level Domain) from domain name
 */
export function extractSld(domain: string): string {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return domain;
}

/**
 * Check if domain has a common TLD
 */
export function hasCommonTld(domain: string): boolean {
  const commonTlds = [
    'com', 'net', 'org', 'io', 'co', 'info', 'biz', 'edu', 'gov', 'mil',
    'uk', 'de', 'fr', 'it', 'es', 'nl', 'be', 'at', 'ch', 'pl',
    'ru', 'cn', 'jp', 'kr', 'au', 'br', 'ca', 'mx', 'in', 'za',
    'app', 'dev', 'xyz', 'online', 'site', 'tech', 'store', 'blog',
  ];
  
  const tld = extractTld(domain);
  return commonTlds.includes(tld);
}

/**
 * Get WHOIS server for a TLD (common servers)
 */
export function getWhoisServer(tld: string): string | null {
  const whoisServers: Record<string, string> = {
    'com': 'whois.verisign-grs.com',
    'net': 'whois.verisign-grs.com',
    'org': 'whois.pir.org',
    'info': 'whois.afilias.net',
    'biz': 'whois.biz',
    'io': 'whois.nic.io',
    'co': 'whois.nic.co',
    'me': 'whois.nic.me',
    'tv': 'whois.nic.tv',
    'cc': 'ccwhois.verisign-grs.com',
    'us': 'whois.nic.us',
    'uk': 'whois.nic.uk',
    'de': 'whois.denic.de',
    'fr': 'whois.nic.fr',
    'it': 'whois.nic.it',
    'es': 'whois.nic.es',
    'nl': 'whois.domain-registry.nl',
    'be': 'whois.dns.be',
    'at': 'whois.nic.at',
    'ch': 'whois.nic.ch',
    'pl': 'whois.dns.pl',
    'ru': 'whois.tcinet.ru',
    'cn': 'whois.cnnic.cn',
    'jp': 'whois.jprs.jp',
    'kr': 'whois.kr',
    'au': 'whois.auda.org.au',
    'br': 'whois.registro.br',
    'ca': 'whois.cira.ca',
    'mx': 'whois.mx',
    'in': 'whois.registry.in',
    'app': 'whois.nic.google',
    'dev': 'whois.nic.google',
    'xyz': 'whois.nic.xyz',
    'online': 'whois.nic.online',
    'site': 'whois.nic.site',
    'tech': 'whois.nic.tech',
    'store': 'whois.nic.store',
    'blog': 'whois.nic.blog',
    'ai': 'whois.nic.ai',
    'cloud': 'whois.nic.cloud',
  };

  return whoisServers[tld.toLowerCase()] || null;
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if can't parse
    }
    return date.toISOString();
  } catch {
    return dateStr;
  }
}
