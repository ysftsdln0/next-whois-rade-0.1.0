/**
 * TREDIS Provider
 * Specialized provider for .tr domain queries via TREDIS (whois.nic.tr)
 * TREDIS is the official Turkish domain registry system
 */

import { log } from '../logger';
import { parseDate } from '../domain-utils';
import type { WhoisData, ProviderResponse } from '../types';
import * as net from 'net';

/**
 * Parse TREDIS WHOIS response into structured data
 * TREDIS has a specific format for .tr domains
 */
function parseTredisResponse(rawData: string, domain: string): WhoisData {
  const data: WhoisData = {
    domainName: domain,
  };

  // Store raw data
  data.rawData = rawData;

  const lines = rawData.split('\n');
  const nameServers: string[] = [];
  const statuses: string[] = [];

  // TREDIS specific field mapping
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('**') || trimmedLine.startsWith('%')) {
      continue;
    }

    // Parse key: value or key. value pairs (TREDIS uses both formats)
    let colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) {
      colonIndex = trimmedLine.indexOf('.');
      if (colonIndex === -1 || colonIndex > 30) continue; // Skip if no separator or too far
    }

    const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmedLine.substring(colonIndex + 1).trim();

    if (!value) continue;

    // Map TREDIS specific fields
    switch (key) {
      // Domain name variations
      case 'domain name':
      case 'domain':
      case 'alan adı':
        data.domainName = value.toLowerCase();
        break;

      // Registrar/Registrant organization
      case 'registrar':
      case 'registrar name':
      case 'kayıt firması':
      case 'kayıt operatörü':
      case 'organization':
      case 'kuruluş':
      case 'registrant organization':
        if (!data.registrar) {
          data.registrar = value;
        }
        if (!data.registrantOrganization) {
          data.registrantOrganization = value;
        }
        break;

      // Registrant name
      case 'registrant':
      case 'registrant name':
      case 'kayıt sahibi':
      case 'sahibi':
      case 'holder':
        data.registrantName = value;
        break;

      // Creation date
      case 'created on':
      case 'created':
      case 'creation date':
      case 'kayıt tarihi':
      case 'registered':
      case 'registration date':
        data.creationDate = parseDate(value);
        break;

      // Expiration date
      case 'expires on':
      case 'expires':
      case 'expiration date':
      case 'bitiş tarihi':
      case 'expiry date':
      case 'renewal date':
        data.expirationDate = parseDate(value);
        break;

      // Last updated
      case 'last modified':
      case 'last updated':
      case 'updated date':
      case 'modified':
      case 'güncellenme tarihi':
        data.updatedDate = parseDate(value);
        break;

      // Address
      case 'address':
      case 'adres':
      case 'registrant address':
        data.registrantStreet = value;
        break;

      // City
      case 'city':
      case 'şehir':
      case 'il':
        data.registrantCity = value;
        break;

      // Country
      case 'country':
      case 'ülke':
        data.registrantCountry = value;
        break;

      // Phone
      case 'phone':
      case 'tel':
      case 'telefon':
        data.registrantPhone = value;
        break;

      // Email
      case 'e-mail':
      case 'email':
        data.registrantEmail = value;
        break;

      // Name servers
      case 'name server':
      case 'nameserver':
      case 'nserver':
      case 'ns':
      case 'dns':
      case 'isim sunucusu':
      case 'host name':
        const ns = value.toLowerCase().split(/\s+/)[0]; // Take first part only
        if (ns && !nameServers.includes(ns)) {
          nameServers.push(ns);
        }
        break;

      // Status
      case 'status':
      case 'domain status':
      case 'durum':
        const statusValue = value.split(' ')[0];
        if (statusValue && !statuses.includes(statusValue)) {
          statuses.push(statusValue);
        }
        break;

      // Admin contact
      case 'admin':
      case 'admin name':
      case 'administrative contact':
      case 'yönetici':
        data.adminName = value;
        break;

      // Tech contact
      case 'tech':
      case 'tech name':
      case 'technical contact':
      case 'teknik yetkili':
        data.techName = value;
        break;

      // Billing contact
      case 'billing':
      case 'billing name':
      case 'fatura yetkili':
        // Store in admin if not set
        if (!data.adminName) {
          data.adminName = value;
        }
        break;
    }
  }

  // Also check for ** formatted sections (TREDIS specific)
  const sectionMatches = rawData.match(/\*\*\s*([^*]+)\s*\*\*/g);
  if (sectionMatches) {
    for (const match of sectionMatches) {
      const content = match.replace(/\*\*/g, '').trim().toLowerCase();
      if (content.includes('aktif') || content.includes('active')) {
        if (!statuses.includes('active')) {
          statuses.push('active');
        }
      }
    }
  }

  if (nameServers.length > 0) {
    data.nameServers = nameServers;
  }

  if (statuses.length > 0) {
    data.status = statuses;
  }

  return data;
}

/**
 * Query TREDIS WHOIS server directly via socket
 * This provides more reliable results for .tr domains
 */
async function queryTredisSocket(domain: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let data = '';
    
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error('TREDIS query timeout'));
    }, timeout);

    client.connect(43, 'whois.nic.tr', () => {
      // Send domain query with newline
      client.write(`${domain}\r\n`);
    });

    client.on('data', (chunk) => {
      data += chunk.toString('utf8');
    });

    client.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    client.on('close', () => {
      clearTimeout(timer);
      if (data) {
        resolve(data);
      }
    });
  });
}

/**
 * Check if domain is a .tr domain
 */
export function isTrDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();
  return lowerDomain.endsWith('.tr');
}

/**
 * Query TREDIS for .tr domain information
 */
export async function queryTredis(domain: string, timeout: number = 15000): Promise<ProviderResponse> {
  const startTime = Date.now();

  try {
    // Validate it's a .tr domain
    if (!isTrDomain(domain)) {
      return {
        provider: 'tredis',
        success: false,
        error: 'TREDIS only supports .tr domains',
        responseTime: Date.now() - startTime,
      };
    }

    log.debug('Querying TREDIS', { domain });

    const rawData = await queryTredisSocket(domain, timeout);
    const responseTime = Date.now() - startTime;

    if (!rawData || rawData.trim().length === 0) {
      return {
        provider: 'tredis',
        success: false,
        error: 'Empty TREDIS response',
        responseTime,
      };
    }

    // Check for "not found" type responses
    const lowerData = rawData.toLowerCase();
    if (
      lowerData.includes('no match') ||
      lowerData.includes('not found') ||
      lowerData.includes('no entries') ||
      lowerData.includes('bulunamadı') ||
      lowerData.includes('kayıtlı değil') ||
      lowerData.includes('no data found')
    ) {
      return {
        provider: 'tredis',
        success: false,
        error: 'Domain bulunamadı (Domain not found in TREDIS)',
        responseTime,
      };
    }

    const data = parseTredisResponse(rawData, domain);

    // Check if we got meaningful data
    if (!data.registrar && !data.registrantName && !data.creationDate && !data.nameServers) {
      // Still return raw data if we couldn't parse structured fields
      if (rawData.length > 50) {
        data.rawData = rawData;
        log.debug('TREDIS returned raw data only', { domain, responseTime });
        return {
          provider: 'tredis',
          success: true,
          data,
          responseTime,
        };
      }

      return {
        provider: 'tredis',
        success: false,
        error: 'TREDIS response contains no useful data',
        responseTime,
      };
    }

    log.debug('TREDIS query successful', { domain, responseTime });

    return {
      provider: 'tredis',
      success: true,
      data,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log.error('TREDIS query failed', { domain, error: errorMessage, responseTime });

    return {
      provider: 'tredis',
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}

export default queryTredis;
