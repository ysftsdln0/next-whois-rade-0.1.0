import { MAX_IP_WHOIS_FOLLOW, MAX_WHOIS_FOLLOW } from "@/lib/env";
import whois from "whois-raw";
import { extractDomain } from "@/lib/utils";

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
