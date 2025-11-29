import { WhoisResult } from "./types";
import { lookupWhoisWithCache } from "./lookup";
import {
  getRandomApiEndpoint,
  isMainServer,
  hasApiEndpoints,
  getEndpointCount,
} from "../api-rotator";

// Loglama için renkli prefix
const LOG_PREFIX = "[Distributed Lookup]";

/**
 * Dağıtık WHOIS sorgusu yapar
 * 
 * Ana sunucuda (IS_MAIN_SERVER=true):
 *   - Rastgele bir API endpoint'i seçer
 *   - Sorguyu o endpoint'e yönlendirir
 *   - Başarısız olursa lokal sorgu yapar (fallback)
 * 
 * Alt sunucuda (IS_MAIN_SERVER=false veya tanımsız):
 *   - Doğrudan WHOIS sorgusu yapar
 */
export async function distributedWhoisLookup(
  domain: string
): Promise<WhoisResult> {
  console.log(`${LOG_PREFIX} ========================================`);
  console.log(`${LOG_PREFIX} Sorgu başlatıldı: ${domain}`);
  console.log(`${LOG_PREFIX} Ana sunucu mu: ${isMainServer()}`);
  console.log(`${LOG_PREFIX} API endpoint sayısı: ${getEndpointCount()}`);
  console.log(`${LOG_PREFIX} Endpoint'ler mevcut mu: ${hasApiEndpoints()}`);

  // Eğer ana sunucu ise ve API endpoint'leri tanımlı ise
  if (isMainServer() && hasApiEndpoints()) {
    const apiEndpoint = getRandomApiEndpoint();
    console.log(`${LOG_PREFIX} Seçilen API endpoint: ${apiEndpoint}`);

    if (apiEndpoint) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

        const requestUrl = `${apiEndpoint}/api/whois/${encodeURIComponent(domain)}`;
        console.log(`${LOG_PREFIX} İstek gönderiliyor: ${requestUrl}`);

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // İsteğe bağlı: Dahili API key
            ...(process.env.INTERNAL_API_KEY && {
              "X-API-Key": process.env.INTERNAL_API_KEY,
            }),
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        console.log(`${LOG_PREFIX} Yanıt alındı: HTTP ${response.status} (${duration}ms)`);

        if (response.ok) {
          const data = await response.json();
          console.log(`${LOG_PREFIX} ✅ Başarılı! Endpoint: ${apiEndpoint}`);
          console.log(`${LOG_PREFIX} ========================================`);
          return {
            ...data,
            // Hangi endpoint'ten geldiğini işaretle (debug için)
            _endpoint: apiEndpoint,
          };
        }

        // HTTP hatası - fallback'e geç
        console.warn(
          `${LOG_PREFIX} ⚠️ API endpoint ${apiEndpoint} returned ${response.status}, falling back to local lookup`
        );
      } catch (error: any) {
        // Network hatası veya timeout - fallback'e geç
        console.warn(
          `${LOG_PREFIX} ❌ API endpoint ${apiEndpoint} error: ${error.message}, falling back to local lookup`
        );
      }
    }
  } else {
    console.log(`${LOG_PREFIX} Lokal sorgu yapılacak (ana sunucu değil veya endpoint yok)`);
  }

  // Alt sunucu veya fallback: direkt sorgu
  console.log(`${LOG_PREFIX} 🔍 Lokal WHOIS sorgusu yapılıyor...`);
  const result = await lookupWhoisWithCache(domain);
  console.log(`${LOG_PREFIX} ✅ Lokal sorgu tamamlandı: ${result.status ? 'Başarılı' : 'Hata: ' + result.error}`);
  console.log(`${LOG_PREFIX} ========================================`);
  return result;
}

/**
 * Belirli bir endpoint üzerinden WHOIS sorgusu yapar
 * Test veya debug amaçlı kullanılabilir
 */
export async function lookupViaEndpoint(
  domain: string,
  endpoint: string
): Promise<WhoisResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${endpoint}/api/whois/${encodeURIComponent(domain)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.INTERNAL_API_KEY && {
            "X-API-Key": process.env.INTERNAL_API_KEY,
          }),
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    return {
      status: false,
      error: `Endpoint error: ${error.message}`,
      time: 0,
    };
  }
}
