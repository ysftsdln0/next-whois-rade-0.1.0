import { WhoisResult } from "@/lib/whois/types";
import { countDuration, toErrorMessage } from "@/lib/utils";
import { getJsonRedisValue, setJsonRedisValue } from "@/lib/server/redis";
import { providerManager } from "@/lib/whois/providers";

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
  const key = `whois:${domain}`;
  const cached = await getJsonRedisValue<WhoisResult>(key);
  if (cached) {
    return {
      ...cached,
      time: 0,
      cached: true,
    };
  }

  const result = await lookupWhois(domain);
  
  // Cache if successful OR if it's a "Not Found" error
  // We don't want to cache transient errors like connection timeouts or rate limits
  const shouldCache = result.status || (result.error && result.error.toLowerCase().includes("not found"));

  if (shouldCache) {
    await setJsonRedisValue<WhoisResult>(key, result);
  }

  return {
    ...result,
    cached: false,
  };
}
