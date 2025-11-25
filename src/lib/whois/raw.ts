import { MAX_IP_WHOIS_FOLLOW, MAX_WHOIS_FOLLOW } from "@/lib/env";
import whois from "whois-raw";
import { extractDomain } from "@/lib/utils";

export interface LookupOptions {
  follow?: number;
  server?: string;
  timeout?: number;
}

export function getLookupOptions(domain: string): LookupOptions {
  const isDomain = !!extractDomain(domain);
  const options: LookupOptions = {
    follow: isDomain ? MAX_WHOIS_FOLLOW : MAX_IP_WHOIS_FOLLOW,
    timeout: 10000, // 10 saniye timeout
  };

  if (domain.endsWith(".tr")) {
    options.server = "whois.trabis.gov.tr";
  }

  return options;
}

export function getLookupRawWhois(
  domain: string,
  options?: LookupOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      whois.lookup(domain, options, (err: Error | null, data: string) => {
        if (err) {
          reject(new Error(`WHOIS lookup failed: ${err.message}`));
        } else if (!data || data.trim().length === 0) {
          reject(new Error("Empty WHOIS response received"));
        } else {
          resolve(data);
        }
      });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      reject(new Error(`WHOIS connection error: ${error.message}`));
    }
  });
}
