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
  const whoisServers: Record<string, string> = {
    // Generic TLDs
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
    
    // Turkey - Two-level TLDs
    'com.tr': 'whois.nic.tr',
    'net.tr': 'whois.nic.tr',
    'org.tr': 'whois.nic.tr',
    'edu.tr': 'whois.nic.tr',
    'gov.tr': 'whois.nic.tr',
    'biz.tr': 'whois.nic.tr',
    'info.tr': 'whois.nic.tr',
    'gen.tr': 'whois.nic.tr',
    'name.tr': 'whois.nic.tr',
    'web.tr': 'whois.nic.tr',
    'tv.tr': 'whois.nic.tr',
    'tel.tr': 'whois.nic.tr',
    'av.tr': 'whois.nic.tr',
    'dr.tr': 'whois.nic.tr',
    'bbs.tr': 'whois.nic.tr',
    'k12.tr': 'whois.nic.tr',
    'pol.tr': 'whois.nic.tr',
    'bel.tr': 'whois.nic.tr',
    'tr': 'whois.nic.tr',
    
    // UK - Two-level TLDs
    'co.uk': 'whois.nic.uk',
    'org.uk': 'whois.nic.uk',
    'me.uk': 'whois.nic.uk',
    'net.uk': 'whois.nic.uk',
    'ltd.uk': 'whois.nic.uk',
    'plc.uk': 'whois.nic.uk',
    'ac.uk': 'whois.nic.uk',
    'gov.uk': 'whois.nic.uk',
    'sch.uk': 'whois.nic.uk',
    
    // Australia - Two-level TLDs
    'com.au': 'whois.auda.org.au',
    'net.au': 'whois.auda.org.au',
    'org.au': 'whois.auda.org.au',
    'edu.au': 'whois.auda.org.au',
    'gov.au': 'whois.auda.org.au',
    'asn.au': 'whois.auda.org.au',
    'id.au': 'whois.auda.org.au',
    
    // Brazil - Two-level TLDs
    'com.br': 'whois.registro.br',
    'net.br': 'whois.registro.br',
    'org.br': 'whois.registro.br',
    'edu.br': 'whois.registro.br',
    'gov.br': 'whois.registro.br',
    'mil.br': 'whois.registro.br',
    
    // Japan - Two-level TLDs
    'co.jp': 'whois.jprs.jp',
    'or.jp': 'whois.jprs.jp',
    'ne.jp': 'whois.jprs.jp',
    'ac.jp': 'whois.jprs.jp',
    'ad.jp': 'whois.jprs.jp',
    'go.jp': 'whois.jprs.jp',
    'ed.jp': 'whois.jprs.jp',
    
    // South Korea - Two-level TLDs
    'co.kr': 'whois.kr',
    'or.kr': 'whois.kr',
    'ne.kr': 'whois.kr',
    'ac.kr': 'whois.kr',
    're.kr': 'whois.kr',
    'go.kr': 'whois.kr',
    'mil.kr': 'whois.kr',
    
    // India - Two-level TLDs
    'co.in': 'whois.registry.in',
    'net.in': 'whois.registry.in',
    'org.in': 'whois.registry.in',
    'firm.in': 'whois.registry.in',
    'gen.in': 'whois.registry.in',
    'ind.in': 'whois.registry.in',
    'ac.in': 'whois.registry.in',
    'edu.in': 'whois.registry.in',
    'res.in': 'whois.registry.in',
    'gov.in': 'whois.registry.in',
    'mil.in': 'whois.registry.in',
    
    // China - Two-level TLDs
    'com.cn': 'whois.cnnic.cn',
    'net.cn': 'whois.cnnic.cn',
    'org.cn': 'whois.cnnic.cn',
    'gov.cn': 'whois.cnnic.cn',
    'edu.cn': 'whois.cnnic.cn',
    'ac.cn': 'whois.cnnic.cn',
    'mil.cn': 'whois.cnnic.cn',
    
    // New Zealand - Two-level TLDs
    'co.nz': 'whois.srs.net.nz',
    'net.nz': 'whois.srs.net.nz',
    'org.nz': 'whois.srs.net.nz',
    'govt.nz': 'whois.srs.net.nz',
    'ac.nz': 'whois.srs.net.nz',
    'school.nz': 'whois.srs.net.nz',
    'geek.nz': 'whois.srs.net.nz',
    'gen.nz': 'whois.srs.net.nz',
    'kiwi.nz': 'whois.srs.net.nz',
    
    // South Africa - Two-level TLDs
    'co.za': 'whois.registry.net.za',
    'net.za': 'whois.registry.net.za',
    'org.za': 'whois.registry.net.za',
    'edu.za': 'whois.registry.net.za',
    'gov.za': 'whois.registry.net.za',
    'web.za': 'whois.registry.net.za',
    
    // Hong Kong - Two-level TLDs
    'com.hk': 'whois.hkirc.hk',
    'net.hk': 'whois.hkirc.hk',
    'org.hk': 'whois.hkirc.hk',
    'edu.hk': 'whois.hkirc.hk',
    'gov.hk': 'whois.hkirc.hk',
    'idv.hk': 'whois.hkirc.hk',
    
    // Taiwan - Two-level TLDs
    'com.tw': 'whois.twnic.net.tw',
    'net.tw': 'whois.twnic.net.tw',
    'org.tw': 'whois.twnic.net.tw',
    'edu.tw': 'whois.twnic.net.tw',
    'gov.tw': 'whois.twnic.net.tw',
    'idv.tw': 'whois.twnic.net.tw',
    
    // Singapore - Two-level TLDs
    'com.sg': 'whois.sgnic.sg',
    'net.sg': 'whois.sgnic.sg',
    'org.sg': 'whois.sgnic.sg',
    'edu.sg': 'whois.sgnic.sg',
    'gov.sg': 'whois.sgnic.sg',
    'per.sg': 'whois.sgnic.sg',
    
    // Malaysia - Two-level TLDs
    'com.my': 'whois.mynic.my',
    'net.my': 'whois.mynic.my',
    'org.my': 'whois.mynic.my',
    'edu.my': 'whois.mynic.my',
    'gov.my': 'whois.mynic.my',
    'mil.my': 'whois.mynic.my',
    'name.my': 'whois.mynic.my',
    
    // Israel - Two-level TLDs
    'co.il': 'whois.isoc.org.il',
    'net.il': 'whois.isoc.org.il',
    'org.il': 'whois.isoc.org.il',
    'ac.il': 'whois.isoc.org.il',
    'gov.il': 'whois.isoc.org.il',
    'muni.il': 'whois.isoc.org.il',
    'idf.il': 'whois.isoc.org.il',
    'k12.il': 'whois.isoc.org.il',
    
    // Greece - Two-level TLDs
    'com.gr': 'grweb.ics.forth.gr',
    'net.gr': 'grweb.ics.forth.gr',
    'org.gr': 'grweb.ics.forth.gr',
    'edu.gr': 'grweb.ics.forth.gr',
    'gov.gr': 'grweb.ics.forth.gr',
    
    // Colombia - Two-level TLDs
    'com.co': 'whois.nic.co',
    'net.co': 'whois.nic.co',
    'org.co': 'whois.nic.co',
    'edu.co': 'whois.nic.co',
    'gov.co': 'whois.nic.co',
    'mil.co': 'whois.nic.co',
    'nom.co': 'whois.nic.co',
    
    // Argentina - Two-level TLDs
    'com.ar': 'whois.nic.ar',
    'net.ar': 'whois.nic.ar',
    'org.ar': 'whois.nic.ar',
    'edu.ar': 'whois.nic.ar',
    'gov.ar': 'whois.nic.ar',
    'mil.ar': 'whois.nic.ar',
    'int.ar': 'whois.nic.ar',
    'gob.ar': 'whois.nic.ar',
    'tur.ar': 'whois.nic.ar',
    
    // Mexico - Two-level TLDs
    'com.mx': 'whois.mx',
    'net.mx': 'whois.mx',
    'org.mx': 'whois.mx',
    'edu.mx': 'whois.mx',
    'gob.mx': 'whois.mx',
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
    
    // Additional gTLDs
    'mobi': 'whois.afilias.net',
    'pro': 'whois.afilias.net',
    'name': 'whois.nic.name',
    'travel': 'whois.nic.travel',
    'aero': 'whois.aero',
    'coop': 'whois.nic.coop',
    'museum': 'whois.nic.museum',
    'jobs': 'whois.nic.jobs',
    'tel': 'whois.nic.tel',
    'asia': 'whois.nic.asia',
    'cat': 'whois.nic.cat',
    'post': 'whois.dotpostregistry.net',
    'xxx': 'whois.nic.xxx',
    'club': 'whois.nic.club',
    'website': 'whois.nic.website',
    'space': 'whois.nic.space',
    'top': 'whois.nic.top',
    'icu': 'whois.nic.icu',
    'vip': 'whois.nic.vip',
    'work': 'whois.nic.work',
    'life': 'whois.nic.life',
    'world': 'whois.nic.world',
    'today': 'whois.nic.today',
    'live': 'whois.nic.live',
    'news': 'whois.nic.news',
    'click': 'whois.nic.click',
    'link': 'whois.uniregistry.net',
    'fun': 'whois.nic.fun',
    'shop': 'whois.nic.shop',
    'design': 'whois.nic.design',
    'digital': 'whois.nic.digital',
    'studio': 'whois.nic.studio',
    'media': 'whois.nic.media',
    'network': 'whois.nic.network',
    'agency': 'whois.nic.agency',
    'company': 'whois.nic.company',
    'solutions': 'whois.nic.solutions',
    'services': 'whois.nic.services',
    'support': 'whois.nic.support',
    'center': 'whois.nic.center',
    'zone': 'whois.nic.zone',
    
    // Additional ccTLDs
    'id': 'whois.pandi.or.id',
    'th': 'whois.thnic.co.th',
    'ph': 'whois.dot.ph',
    'vn': 'whois.vnnic.vn',
    'pk': 'whois.pknic.net.pk',
    'bd': 'whois.btcl.com.bd',
    'lk': 'whois.nic.lk',
    'np': 'whois.mos.com.np',
    'mm': 'whois.registry.gov.mm',
    'kh': 'whois.trc.gov.kh',
    'la': 'whois.nic.la',
    'nz': 'whois.srs.net.nz',
    'za': 'whois.registry.net.za',
    'ke': 'whois.kenic.or.ke',
    'ng': 'whois.nic.net.ng',
    'gh': 'whois.nic.gh',
    'eg': 'whois.ripe.net',
    'ae': 'whois.aeda.net.ae',
    'sa': 'whois.nic.sa',
    'qa': 'whois.registry.qa',
    'kw': 'whois.nic.kw',
    'bh': 'whois.nic.bh',
    'om': 'whois.registry.om',
    'jo': 'whois.nic.jo',
    'lb': 'whois.lbdr.org.lb',
    'ps': 'whois.pnina.ps',
    'iq': 'whois.cmc.iq',
    'ir': 'whois.nic.ir',
    'il': 'whois.isoc.org.il',
    'ua': 'whois.ua',
    'by': 'whois.cctld.by',
    'kz': 'whois.nic.kz',
    'uz': 'whois.cctld.uz',
    'tm': 'whois.nic.tm',
    'az': 'whois.az',
    'ge': 'whois.nic.ge',
    'am': 'whois.amnic.net',
    'gr': 'grweb.ics.forth.gr',
    'cy': 'whois.nic.cy',
    'bg': 'whois.register.bg',
    'ro': 'whois.rotld.ro',
    'hu': 'whois.nic.hu',
    'cz': 'whois.nic.cz',
    'sk': 'whois.sk-nic.sk',
    'si': 'whois.register.si',
    'hr': 'whois.dns.hr',
    'ba': 'whois.nic.ba',
    'rs': 'whois.rnids.rs',
    'mk': 'whois.marnet.mk',
    'al': 'whois.nic.al',
    'mt': 'whois.nic.org.mt',
    'ee': 'whois.tld.ee',
    'lv': 'whois.nic.lv',
    'lt': 'whois.domreg.lt',
    'fi': 'whois.fi',
    'se': 'whois.iis.se',
    'no': 'whois.norid.no',
    'dk': 'whois.dk-hostmaster.dk',
    'is': 'whois.isnic.is',
    'ie': 'whois.iedr.ie',
    'lu': 'whois.dns.lu',
    'li': 'whois.nic.li',
    'pt': 'whois.dns.pt',
    've': 'whois.nic.ve',
    'pe': 'kero.yachay.pe',
    'cl': 'whois.nic.cl',
    'ar': 'whois.nic.ar',
    'uy': 'whois.nic.org.uy',
    'py': 'whois.nic.py',
    'bo': 'whois.nic.bo',
    'ec': 'whois.nic.ec',
    'cu': 'whois.nic.cu',
    'ht': 'whois.nic.ht',
    'do': 'whois.nic.do',
    'pr': 'whois.nic.pr',
    'jm': 'whois.nic.jm',
    'tt': 'whois.nic.tt',
    'pa': 'whois.nic.pa',
    'cr': 'whois.nic.cr',
    'gt': 'whois.gt',
    'sv': 'whois.svnet.org.sv',
    'hn': 'whois.nic.hn',
    'ni': 'whois.nic.ni',
  };

  // First try to find the TLD directly (handles both single and two-level TLDs)
  const normalizedTld = tld.toLowerCase();
  if (whoisServers[normalizedTld]) {
    return whoisServers[normalizedTld];
  }
  
  // If two-level TLD not found, try the country code TLD only
  const parts = normalizedTld.split('.');
  if (parts.length > 1) {
    const countryTld = parts[parts.length - 1];
    if (whoisServers[countryTld]) {
      return whoisServers[countryTld];
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
