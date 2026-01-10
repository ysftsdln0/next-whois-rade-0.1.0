// tredis provider .tr

import { log } from '../logger';
import { parseDate } from '../domain-utils';
import type { WhoisData, ProviderResponse } from '../types';
import * as net from 'net';

function parseTredisResponse(rawData: string, domain: string): WhoisData {
  const data: WhoisData = { domainName: domain, rawData };
  const nameServers: string[] = [];
  const statuses: string[] = [];

  const lines = rawData.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('**') || trimmedLine.startsWith('%')) continue;

    let colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) {
      colonIndex = trimmedLine.indexOf('.');
      if (colonIndex === -1 || colonIndex > 30) continue;
    }

    const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmedLine.substring(colonIndex + 1).trim();
    if (!value) continue;

    // alan eşleştirme
    switch (key) {
      case 'domain name':
      case 'domain':
      case 'alan adı':
        data.domainName = value.toLowerCase();
        break;
      case 'registrar':
      case 'registrar name':
      case 'kayıt firması':
      case 'kayıt operatörü':
      case 'organization':
      case 'kuruluş':
      case 'registrant organization':
        if (!data.registrar) data.registrar = value;
        if (!data.registrantOrganization) data.registrantOrganization = value;
        break;
      case 'registrant':
      case 'registrant name':
      case 'kayıt sahibi':
      case 'sahibi':
      case 'holder':
        data.registrantName = value;
        break;
      case 'created on':
      case 'created':
      case 'creation date':
      case 'kayıt tarihi':
      case 'registered':
      case 'registration date':
        data.creationDate = parseDate(value);
        break;
      case 'expires on':
      case 'expires':
      case 'expiration date':
      case 'bitiş tarihi':
      case 'expiry date':
      case 'renewal date':
        data.expirationDate = parseDate(value);
        break;
      case 'last modified':
      case 'last updated':
      case 'updated date':
      case 'modified':
      case 'güncellenme tarihi':
        data.updatedDate = parseDate(value);
        break;
      case 'address':
      case 'adres':
      case 'registrant address':
        data.registrantStreet = value;
        break;
      case 'city':
      case 'şehir':
      case 'il':
        data.registrantCity = value;
        break;
      case 'country':
      case 'ülke':
        data.registrantCountry = value;
        break;
      case 'phone':
      case 'tel':
      case 'telefon':
        data.registrantPhone = value;
        break;
      case 'e-mail':
      case 'email':
        data.registrantEmail = value;
        break;
      case 'name server':
      case 'nameserver':
      case 'nserver':
      case 'ns':
      case 'dns':
      case 'isim sunucusu':
      case 'host name':
      case 'nameservers':
      case 'name servers':
        // Nameserver değerini parçala - boşluk veya tab ile ayrılmış ilk kısmı al
        const ns = value.toLowerCase().split(/[\s\t]+/)[0];
        if (ns && !nameServers.includes(ns)) nameServers.push(ns);
        break;
      case 'status':
      case 'domain status':
      case 'durum':
        const statusValue = value.split(' ')[0];
        if (statusValue && !statuses.includes(statusValue)) statuses.push(statusValue);
        break;
      case 'admin':
      case 'admin name':
      case 'administrative contact':
      case 'yönetici':
        data.adminName = value;
        break;
      case 'tech':
      case 'tech name':
      case 'technical contact':
      case 'teknik yetkili':
        data.techName = value;
        break;
      case 'billing':
      case 'billing name':
      case 'fatura yetkili':
        if (!data.adminName) data.adminName = value;
        break;
    }
  }

  // ** formatındaki bölümleri kontrol et
  const sectionMatches = rawData.match(/\*\*\s*([^*]+)\s*\*\*/g);
  if (sectionMatches) {
    for (const match of sectionMatches) {
      const content = match.replace(/\*\*/g, '').trim().toLowerCase();
      if (content.includes('aktif') || content.includes('active')) {
        if (!statuses.includes('active')) statuses.push('active');
      }
    }
  }

  // Eğer nameserver bulunamadıysa, özel formatları dene
  if (nameServers.length === 0) {
    // "** Domain Servers:" bölümünü ara (Trabis formatı)
    const domainServersMatch = rawData.match(/\*\*\s*Domain Servers:\s*\n([\s\S]*?)(?=\n\*\*|\n\n|$)/i);
    if (domainServersMatch) {
      const serversSection = domainServersMatch[1];
      const serverLines = serversSection.split('\n');
      for (const line of serverLines) {
        const trimmed = line.trim();
        // Domain pattern'i kontrol et
        if (trimmed && /^[a-z0-9][\w\-\.]+\.[a-z]{2,}$/i.test(trimmed.split(/\s+/)[0])) {
          const ns = trimmed.split(/\s+/)[0].toLowerCase();
          if (!nameServers.includes(ns)) {
            nameServers.push(ns);
          }
        }
      }
    }
    
    // Hala bulunamadıysa, genel regex ile dene
    if (nameServers.length === 0) {
      const nsRegex = /(?:nserver|name\s*server|nameserver|ns|isim\s*sunucusu):\s*([a-z0-9][\w\-\.]+\.[a-z]{2,})/gi;
      let match;
      while ((match = nsRegex.exec(rawData)) !== null) {
        const ns = match[1].toLowerCase().trim();
        if (ns && !nameServers.includes(ns)) {
          nameServers.push(ns);
        }
      }
    }
  }

  if (nameServers.length > 0) data.nameServers = nameServers;
  if (statuses.length > 0) data.status = statuses;

  return data;
}

// tredis sunucusuna soket ile bağlanır
async function queryTredisSocket(domain: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let data = '';
    
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error('tredis sorgu zaman aşımı'));
    }, timeout);

    client.connect(43, 'whois.trabis.tr', () => {
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
      if (data) resolve(data);
    });
  });
}

// .tr domain kontrolü
export function isTrDomain(domain: string): boolean {
  return domain.toLowerCase().endsWith('.tr');
}

// tredis sorgulama ana fonksiyonu
export async function queryTredis(domain: string, timeout: number = 15000): Promise<ProviderResponse> {
  const startTime = Date.now();

  try {
    if (!isTrDomain(domain)) {
      return { provider: 'tredis', success: false, error: 'tredis sadece .tr domainleri destekler', responseTime: Date.now() - startTime };
    }

    log.debug('tredis sorgusu', { domain });

    const rawData = await queryTredisSocket(domain, timeout);
    const responseTime = Date.now() - startTime;

    if (!rawData || rawData.trim().length === 0) {
      return { provider: 'tredis', success: false, error: 'boş tredis yanıtı', responseTime };
    }

    const lowerData = rawData.toLowerCase();
    if (lowerData.includes('no match') || lowerData.includes('not found') || 
        lowerData.includes('no entries') || lowerData.includes('bulunamadı') || 
        lowerData.includes('kayıtlı değil') || lowerData.includes('no data found')) {
      return { provider: 'tredis', success: false, error: 'domain tredis veritabanında bulunamadı', responseTime };
    }

    const data = parseTredisResponse(rawData, domain);

    if (!data.registrar && !data.registrantName && !data.creationDate && !data.nameServers) {
      if (rawData.length > 50) {
        data.rawData = rawData;
        return { provider: 'tredis', success: true, data, responseTime };
      }
      return { provider: 'tredis', success: false, error: 'tredis yanıtı kullanışlı veri içermiyor', responseTime };
    }

    log.debug('tredis sorgusu başarılı', { domain, responseTime });
    return { provider: 'tredis', success: true, data, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'bilinmeyen hata';
    
    log.error('tredis sorgusu başarısız', { domain, error: errorMessage, responseTime });
    return { provider: 'tredis', success: false, error: errorMessage, responseTime };
  }
}

export default queryTredis;
