/**
 * Domain Utilities
 * Helper functions for domain validation and parsing
 */

import whoisServers from './servers.json';

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
 * Common two-level TLDs (ccSLDs)
 */
const TWO_LEVEL_TLDS = [
  // Turkey
  'com.tr', 'net.tr', 'org.tr', 'edu.tr', 'gov.tr', 'biz.tr', 'info.tr', 'gen.tr', 'name.tr', 'av.tr', 'dr.tr', 'bbs.tr', 'k12.tr', 'pol.tr', 'bel.tr', 'web.tr', 'tel.tr', 'tv.tr',
  // United Kingdom
  'co.uk', 'org.uk', 'me.uk', 'net.uk', 'ltd.uk', 'plc.uk', 'ac.uk', 'gov.uk', 'sch.uk',
  // Australia
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au',
  // Brazil
  'com.br', 'net.br', 'org.br', 'edu.br', 'gov.br', 'mil.br',
  // Japan
  'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'ad.jp', 'go.jp', 'ed.jp',
  // India
  'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in', 'ac.in', 'edu.in', 'res.in', 'gov.in', 'mil.in',
  // South Africa
  'co.za', 'net.za', 'org.za', 'edu.za', 'gov.za', 'web.za',
  // New Zealand
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'school.nz', 'geek.nz', 'gen.nz', 'kiwi.nz',
  // South Korea
  'co.kr', 'or.kr', 'ne.kr', 'ac.kr', 're.kr', 'go.kr', 'mil.kr',
  // China
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn', 'mil.cn',
  // Russia
  'com.ru', 'net.ru', 'org.ru', 'pp.ru',
  // Indonesia
  'co.id', 'or.id', 'web.id', 'ac.id', 'sch.id', 'go.id', 'mil.id', 'net.id',
  // Thailand
  'co.th', 'in.th', 'ac.th', 'go.th', 'or.th', 'net.th', 'mi.th',
  // Hong Kong
  'com.hk', 'net.hk', 'org.hk', 'edu.hk', 'gov.hk', 'idv.hk',
  // Taiwan
  'com.tw', 'net.tw', 'org.tw', 'edu.tw', 'gov.tw', 'idv.tw',
  // Singapore
  'com.sg', 'net.sg', 'org.sg', 'edu.sg', 'gov.sg', 'per.sg',
  // Malaysia
  'com.my', 'net.my', 'org.my', 'edu.my', 'gov.my', 'mil.my', 'name.my',
  // Vietnam
  'com.vn', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn', 'biz.vn', 'info.vn', 'pro.vn', 'name.vn', 'health.vn',
  // Argentina
  'com.ar', 'net.ar', 'org.ar', 'edu.ar', 'gov.ar', 'mil.ar', 'int.ar', 'gob.ar', 'tur.ar',
  // Mexico
  'com.mx', 'net.mx', 'org.mx', 'edu.mx', 'gob.mx',
  // Spain
  'com.es', 'nom.es', 'org.es', 'gob.es', 'edu.es',
  // France
  'com.fr', 'asso.fr', 'nom.fr', 'gouv.fr',
  // Italy
  'co.it', 'gov.it', 'edu.it',
  // Germany
  'com.de',
  // Poland
  'com.pl', 'net.pl', 'org.pl', 'biz.pl', 'info.pl', 'edu.pl', 'gov.pl',
  // Ukraine
  'com.ua', 'net.ua', 'org.ua', 'edu.ua', 'gov.ua',
  // Czech Republic
  'co.cz',
  // Netherlands
  'co.nl',
  // Belgium
  'co.be',
  // Greece
  'com.gr', 'net.gr', 'org.gr', 'edu.gr', 'gov.gr',
  // Portugal
  'com.pt', 'net.pt', 'org.pt', 'edu.pt', 'gov.pt',
  // Egypt
  'com.eg', 'net.eg', 'org.eg', 'edu.eg', 'gov.eg', 'eun.eg', 'sci.eg',
  // UAE
  'co.ae', 'net.ae', 'org.ae', 'ac.ae', 'gov.ae', 'mil.ae', 'sch.ae',
  // Saudi Arabia
  'com.sa', 'net.sa', 'org.sa', 'edu.sa', 'gov.sa', 'med.sa', 'pub.sa', 'sch.sa',
  // Pakistan
  'com.pk', 'net.pk', 'org.pk', 'edu.pk', 'gov.pk', 'fam.pk', 'biz.pk', 'web.pk', 'gok.pk', 'gob.pk', 'gkp.pk', 'gop.pk', 'gos.pk',
  // Bangladesh
  'com.bd', 'net.bd', 'org.bd', 'edu.bd', 'gov.bd', 'ac.bd', 'mil.bd',
  // Philippines
  'com.ph', 'net.ph', 'org.ph', 'edu.ph', 'gov.ph', 'mil.ph', 'ngo.ph',
  // Nigeria
  'com.ng', 'net.ng', 'org.ng', 'edu.ng', 'gov.ng', 'name.ng', 'sch.ng', 'mil.ng', 'mobi.ng',
  // Colombia
  'com.co', 'net.co', 'org.co', 'edu.co', 'gov.co', 'mil.co', 'nom.co',
  // Chile
  'co.cl',
  // Peru
  'com.pe', 'net.pe', 'org.pe', 'edu.pe', 'gob.pe', 'nom.pe', 'mil.pe',
  // Venezuela
  'com.ve', 'net.ve', 'org.ve', 'edu.ve', 'gob.ve', 'mil.ve', 'info.ve', 'co.ve', 'web.ve',
  // Israel
  'co.il', 'net.il', 'org.il', 'ac.il', 'gov.il', 'muni.il', 'idf.il', 'k12.il',
];

/**
 * Extract TLD from domain name (supports two-level TLDs like .com.tr)
 */
export function extractTld(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  
  // Check for two-level TLD
  if (parts.length >= 2) {
    const twoLevelTld = parts.slice(-2).join('.');
    if (TWO_LEVEL_TLDS.includes(twoLevelTld)) {
      return twoLevelTld;
    }
  }
  
  return parts[parts.length - 1];
}

/**
 * Extract the effective TLD (for WHOIS server lookup)
 */
export function extractEffectiveTld(domain: string): string {
  return extractTld(domain);
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
 * Supports both single-level TLDs and two-level TLDs like .com.tr
 */
export function getWhoisServer(tld: string): string | null {
  const mapping = whoisServers as unknown as Record<string, string>;

  const normalizedTld = tld.toLowerCase();
  if (mapping[normalizedTld]) {
    return mapping[normalizedTld];
  }

  const parts = normalizedTld.split('.');
  if (parts.length > 1) {
    const countryTld = parts[parts.length - 1];
    if (mapping[countryTld]) {
      return mapping[countryTld];
    }
  }

  return null;
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
