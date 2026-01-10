// native whois sorgulama sağlayıcısı - doğrudan whois protokolü ile iletişim kurar

import { lookup } from 'whois';
import { log } from '../logger';
import { parseDate, extractTld, getWhoisServer } from '../domain-utils';
import type { WhoisData, ProviderResponse } from '../types';

// whois metin çıktısını yapısal veriye dönüştürür
function parseWhoisText(rawData: string, domain: string): WhoisData {
  const data: WhoisData = { domainName: domain, rawData };
  const nameServers: string[] = [];
  const statuses: string[] = [];

  const lines = rawData.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('%') || trimmedLine.startsWith('#')) continue;

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmedLine.substring(colonIndex + 1).trim();
    if (!value) continue;

    // alan eşleştirme (türkçe ve ingilizce destekli)
    switch (key) {
      case 'domain name':
      case 'domain':
      case 'alan adı':
        data.domainName = value.toLowerCase();
        break;
      case 'registrar':
      case 'registrar name':
      case 'sponsoring registrar':
      case 'kayıt operatörü':
        data.registrar = value;
        break;
      case 'registrar url':
      case 'registrar-url':
        data.registrarUrl = value;
        break;
      case 'registrar iana id':
        data.registrarIanaId = value;
        break;
      case 'creation date':
      case 'created':
      case 'created date':
      case 'registration date':
      case 'created on':
      case 'domain created':
      case 'registered':
      case 'registered on':
      case 'kayıt tarihi':
        data.creationDate = parseDate(value);
        break;
      case 'updated date':
      case 'last updated':
      case 'last modified':
      case 'changed':
      case 'modified':
      case 'güncellenme tarihi':
        data.updatedDate = parseDate(value);
        break;
      case 'expiration date':
      case 'registry expiry date':
      case 'registrar registration expiration date':
      case 'expires':
      case 'expire date':
      case 'expires on':
      case 'expiry date':
      case 'renewal date':
      case 'paid-till':
      case 'bitiş tarihi':
        data.expirationDate = parseDate(value);
        break;
      case 'registrant name':
      case 'registrant':
      case 'owner':
      case 'holder':
      case 'kayıt sahibi':
        data.registrantName = value;
        break;
      case 'registrant organization':
      case 'registrant org':
      case 'organization':
      case 'org':
      case 'kuruluş':
        data.registrantOrganization = value;
        break;
      case 'registrant street':
      case 'registrant address':
      case 'address':
      case 'adres':
        data.registrantStreet = value;
        break;
      case 'registrant city':
      case 'city':
      case 'şehir':
        data.registrantCity = value;
        break;
      case 'registrant state/province':
      case 'registrant state':
      case 'state':
      case 'province':
        data.registrantState = value;
        break;
      case 'registrant postal code':
      case 'postal code':
      case 'posta kodu':
        data.registrantPostalCode = value;
        break;
      case 'registrant country':
      case 'country':
      case 'ülke':
        data.registrantCountry = value;
        break;
      case 'registrant email':
      case 'e-mail':
      case 'email':
        data.registrantEmail = value;
        break;
      case 'registrant phone':
      case 'phone':
      case 'telefon':
        data.registrantPhone = value;
        break;
      case 'admin name':
      case 'admin contact':
      case 'administrative contact':
        data.adminName = value;
        break;
      case 'admin organization':
        data.adminOrganization = value;
        break;
      case 'admin email':
        data.adminEmail = value;
        break;
      case 'admin phone':
        data.adminPhone = value;
        break;
      case 'tech name':
      case 'tech contact':
      case 'technical contact':
        data.techName = value;
        break;
      case 'tech organization':
        data.techOrganization = value;
        break;
      case 'tech email':
        data.techEmail = value;
        break;
      case 'tech phone':
        data.techPhone = value;
        break;
      case 'name server':
      case 'nameserver':
      case 'nserver':
      case 'ns':
      case 'dns':
      case 'host name':
      case 'isim sunucusu':
      case 'nameservers':
      case 'name servers':
        // Nameserver değerini parçala - boşluk veya tab ile ayrılmış ilk kısmı al
        const nsValue = value.toLowerCase().split(/[\s\t]+/)[0];
        if (nsValue && !nameServers.includes(nsValue)) {
          nameServers.push(nsValue);
        }
        break;
      case 'dnssec':
        data.dnssec = value;
        break;
      case 'domain status':
      case 'status':
      case 'durum':
        const statusValue = value.split(' ')[0];
        if (statusValue && !statuses.includes(statusValue)) {
          statuses.push(statusValue);
        }
        break;
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
      const nsRegex = /(?:nserver|name\s*server|nameserver|ns):\s*([a-z0-9][\w\-\.]+\.[a-z]{2,})/gi;
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

// whois sorgusu yapar (timeout ve sunucu belirtilebilir)
function whoisLookup(domain: string, timeout: number, server?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WHOIS sorgu zaman aşımı')), timeout);

    const options: { follow: number; timeout: number; server?: string } = { follow: 3, timeout };
    if (server) options.server = server;

    lookup(domain, options, (err, data) => {
      clearTimeout(timer);
      if (err) {
        reject(err);
      } else if (typeof data === 'string') {
        resolve(data);
      } else if (Array.isArray(data)) {
        resolve(data.map(r => r.data).join('\n'));
      } else {
        resolve('');
      }
    });
  });
}

// native whois sorgulama ana fonksiyonu
export async function queryNativeWhois(domain: string, timeout: number = 10000): Promise<ProviderResponse> {
  const startTime = Date.now();

  try {
    const tld = extractTld(domain);
    const whoisServer = getWhoisServer(tld);

    log.debug('native whois sorgusu', { domain, tld, whoisServer });

    const rawData = await whoisLookup(domain, timeout, whoisServer || undefined);
    const responseTime = Date.now() - startTime;

    if (!rawData || rawData.trim().length === 0) {
      return { provider: 'native', success: false, error: 'boş whois yanıtı', responseTime };
    }

    const lowerData = rawData.toLowerCase();
    if (lowerData.includes('no match') ||
      lowerData.includes('not found') ||
      lowerData.includes('no entries found') ||
      lowerData.includes('no data found')) {
      return { provider: 'native', success: false, error: 'domain whois veritabanında bulunamadı', responseTime };
    }

    const data = parseWhoisText(rawData, domain);

    if (!data.registrar && !data.creationDate && !data.nameServers) {
      if (rawData.length > 100) {
        data.rawData = rawData;
        return { provider: 'native', success: true, data, responseTime };
      }
      return { provider: 'native', success: false, error: 'whois yanıtı kullanışlı veri içermiyor', responseTime };
    }

    log.debug('native whois sorgusu başarılı', { domain, responseTime });
    return { provider: 'native', success: true, data, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'bilinmeyen hata';

    log.error('native whois sorgusu başarısız', { domain, error: errorMessage, responseTime });
    return { provider: 'native', success: false, error: errorMessage, responseTime };
  }
}

export default queryNativeWhois;
