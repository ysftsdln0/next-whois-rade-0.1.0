import { WhoisAnalyzeResult } from "@/lib/whois/types";
import { getLookupRawWhois, getLookupOptions } from "@/lib/whois/raw";
import { parseWhoisData } from "@/lib/whois/tld_parser";

export interface WhoisProvider {
  name: string;
  lookup(domain: string): Promise<WhoisAnalyzeResult>;
  isReady(): boolean;
  incrementUsage(): void;
}

class RateLimiter {
  private requests: number = 0;
  private startTime: number = Date.now();
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(): boolean {
    const now = Date.now();
    if (now - this.startTime > this.windowMs) {
      this.startTime = now;
      this.requests = 0;
    }
    return this.requests < this.limit;
  }

  increment() {
    this.requests++;
  }
}

export class DirectProvider implements WhoisProvider {
  name = "Direct";
  // Default to a high limit for direct connection, or configure as needed
  private rateLimiter = new RateLimiter(100, 60000); 

  async lookup(domain: string): Promise<WhoisAnalyzeResult> {
    const data = await getLookupRawWhois(domain, getLookupOptions(domain));
    return parseWhoisData(data, domain);
  }

  isReady(): boolean {
    return this.rateLimiter.check();
  }

  incrementUsage(): void {
    this.rateLimiter.increment();
  }
}

export type Logger = (message: string) => void;

export class ProviderManager {
  private providers: WhoisProvider[] = [];
  private currentIndex = 0;
  private logger: Logger;

  constructor(logger: Logger = console.log) {
    this.logger = logger;
    this.providers.push(new DirectProvider());
    // You can add more providers here
    // this.providers.push(new AnotherProvider());
  }

  addProvider(provider: WhoisProvider) {
    this.providers.push(provider);
  }

  private getNextProvider(triedProviders: Set<string>): WhoisProvider | null {
    const start = this.currentIndex;
    let looped = false;

    while (!looped || this.currentIndex !== start) {
      const provider = this.providers[this.currentIndex];
      
      // Move to next for next call
      this.currentIndex = (this.currentIndex + 1) % this.providers.length;

      if (triedProviders.has(provider.name)) {
        if (this.currentIndex === start) looped = true;
        continue;
      }

      if (provider.isReady()) {
        return provider;
      }
      
      if (this.currentIndex === start) looped = true;
    }

    return null;
  }

  async execute(domain: string): Promise<WhoisAnalyzeResult> {
    const triedProviders = new Set<string>();
    let lastError: Error | null = null;

    // Try up to the number of providers
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.getNextProvider(triedProviders);
      
      if (!provider) {
        if (triedProviders.size === 0) {
             throw new Error("No providers available (rate limited)");
        }
        break; // No more ready providers to try
      }

      try {
        provider.incrementUsage();
        triedProviders.add(provider.name);
        this.logger(`Using WHOIS provider: ${provider.name}`);
        return await provider.lookup(domain);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger(`Provider ${provider.name} failed: ${err.message}. Switching to next provider...`);
        lastError = err;
        // Continue to next provider
      }
    }

    throw lastError || new Error("All providers failed");
  }
}

export const providerManager = new ProviderManager();
