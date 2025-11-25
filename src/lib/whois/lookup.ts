import { WhoisResult } from "@/lib/whois/types";
import { countDuration, toErrorMessage } from "@/lib/utils";
import { getJsonRedisValue, setJsonRedisValue, setJsonRedisValueWithTTL } from "@/lib/server/redis";
import { providerManager } from "@/lib/whois/providers";

// "Not Found" sonuçları için daha kısa cache süresi (1 saat)
const NOT_FOUND_CACHE_TTL = 3600;

export async function lookupWhois(domain: string): Promise<WhoisResult> {
  const startTime = Date.now();

  try {
    const result = await providerManager.execute(domain);
    const endTime = Date.now();

    return {
      status: true,
      time: countDuration(startTime, endTime),
      result: result,
    };
  } catch (e) {
    return {
      status: false,
      time: countDuration(startTime),
      error: toErrorMessage(e),
    };
  }
}

// ...existing code...
export async function lookupWhoisWithCache(
  domain: string,
): Promise<WhoisResult> {
  const normalizedDomain = domain.toLowerCase().trim();
  const key = `whois:${normalizedDomain}`;
  const cached = await getJsonRedisValue<WhoisResult>(key);
  if (cached) {
    return {
      ...cached,
      time: 0,
      cached: true,
    };
  }

  const result = await lookupWhois(normalizedDomain);
  
  // Başarılı sonuçları cache'le
  // "Not Found" hatalarını daha kısa süreyle cache'le (domain daha sonra kayıt edilebilir)
  // Geçici hataları (timeout, rate limit) cache'leme
  const isNotFoundError = result.error && 
    (result.error.toLowerCase().includes("not found") || 
     result.error.toLowerCase().includes("domain or tld not found"));
  
  const isTransientError = result.error && 
    (result.error.toLowerCase().includes("timeout") ||
     result.error.toLowerCase().includes("rate limit") ||
     result.error.toLowerCase().includes("connection") ||
     result.error.toLowerCase().includes("refused"));

  if (result.status) {
    // Başarılı sonuçları normal TTL ile cache'le
    await setJsonRedisValue<WhoisResult>(key, result);
  } else if (isNotFoundError && !isTransientError) {
    // "Not Found" hatalarını kısa süreyle cache'le
    await setJsonRedisValueWithTTL<WhoisResult>(key, result, NOT_FOUND_CACHE_TTL);
  }
  // Geçici hataları cache'leme

  return {
    ...result,
    cached: false,
  };
}
