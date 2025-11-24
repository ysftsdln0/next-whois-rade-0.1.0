import { MAX_IP_WHOIS_FOLLOW, MAX_WHOIS_FOLLOW } from "@/lib/env";
import whois from "whois-raw";
import { WhoisResult } from "@/lib/whois/types";
import { parseWhoisData } from "@/lib/whois/tld_parser";
import { countDuration, extractDomain, toErrorMessage } from "@/lib/utils";
import { getJsonRedisValue, setJsonRedisValue } from "@/lib/server/redis";

export function getLookupOptions(domain: string) {
  const isDomain = !!extractDomain(domain);
  const options: any = {
    follow: isDomain ? MAX_WHOIS_FOLLOW : MAX_IP_WHOIS_FOLLOW,
  };

  if (domain.endsWith(".tr")) {
    options.server = "whois.trabis.gov.tr";
  }

  return options;
}

export function getLookupRawWhois(
  domain: string,
  options?: any,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      whois.lookup(domain, options, (err: Error, data: string) => {
        if (err) {
          // reject err like tld error
          reject(err);
        } else {
          resolve(data);
        }
      });
    } catch (e) {
      // reject err like connection error
      reject(e);
    }
  });
}
export async function lookupWhois(domain: string): Promise<WhoisResult> {
  const startTime = Date.now();

  try {
    const data = await getLookupRawWhois(domain, getLookupOptions(domain));
    const endTime = Date.now();
    const parsed = parseWhoisData(data, domain);

    return {
      status: true,
      time: countDuration(startTime, endTime),
      result: parsed,
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
