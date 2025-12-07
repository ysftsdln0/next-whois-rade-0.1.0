/**
 * Type declarations for modules without TypeScript definitions
 */

declare module 'whois-json' {
  interface WhoisResult {
    domainName?: string;
    domain?: string;
    registrar?: string;
    registrarUrl?: string;
    registrarURL?: string;
    registrarIanaId?: string;
    registrarIANAID?: string;
    creationDate?: string;
    createdDate?: string;
    created?: string;
    updatedDate?: string;
    updated?: string;
    lastUpdated?: string;
    expirationDate?: string;
    expiresDate?: string;
    expires?: string;
    registryExpiryDate?: string;
    registrantName?: string;
    registrantOrganization?: string;
    registrantStreet?: string;
    registrantCity?: string;
    registrantState?: string;
    registrantStateProvince?: string;
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
    nameServer?: string | string[];
    nameServer1?: string;
    nameServer2?: string;
    nameServer3?: string;
    nameServer4?: string;
    ns1?: string;
    ns2?: string;
    ns3?: string;
    ns4?: string;
    dnssec?: string;
    dnsSec?: string;
    DNSSEC?: string;
    domainStatus?: string | string[];
    status?: string | string[];
    [key: string]: unknown;
  }

  function whois(domain: string, options?: { follow?: number; timeout?: number }): Promise<WhoisResult>;
  
  export = whois;
}
