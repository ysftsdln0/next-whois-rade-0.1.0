/**
 * WHOIS Service Types
 * Defines all TypeScript interfaces for the WHOIS service
 */

// WHOIS data structure returned by providers
export interface WhoisData {
  domainName?: string;
  registrar?: string;
  registrarUrl?: string;
  registrarIanaId?: string;
  creationDate?: string;
  updatedDate?: string;
  expirationDate?: string;
  registrantName?: string;
  registrantOrganization?: string;
  registrantStreet?: string;
  registrantCity?: string;
  registrantState?: string;
  registrantPostalCode?: string;
  registrantCountry?: string;
  registrantEmail?: string;
  registrantPhone?: string;
  adminName?: string;
  adminOrganization?: string;
  adminEmail?: string;
  adminPhone?: string;
  techName?: string;
  techOrganization?: string;
  techEmail?: string;
  techPhone?: string;
  nameServers?: string[];
  dnssec?: string;
  status?: string[];
  rawData?: string;
  // Allow additional properties for IP RDAP data
  [key: string]: unknown;
}

// Provider response structure
export interface ProviderResponse {
  provider: string;
  success: boolean;
  data?: WhoisData;
  error?: string;
  responseTime: number;
}

// Aggregated WHOIS result
export interface WhoisResult {
  domain: string;
  timestamp: string;
  cached: boolean;
  data: WhoisData | null;
  providers: ProviderResponse[];
  errors: string[];
}

// Provider configuration
export interface ProviderConfig {
  enabled: boolean;
  priority: number;
  apiKey?: string;
  description: string;
}

// Service configuration
export interface ServiceConfig {
  whois: {
    providers: Record<string, ProviderConfig>;
    timeout: number;
    retries: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxKeys: number;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    format: string;
  };
  server: {
    port: number;
    host: string;
  };
}

// API request structure
export interface WhoisRequest {
  domain: string;
  force?: boolean; // Force refresh, bypass cache
}

// API response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
