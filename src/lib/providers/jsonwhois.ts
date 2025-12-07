/**
 * JSON WHOIS API Provider
 * Alternative commercial API for WHOIS lookups
 * Website: https://jsonwhois.com/
 */

import axios from 'axios';
import { log } from '../logger';
import { parseDate } from '../domain-utils';
import type { WhoisData, ProviderResponse } from '../types';

const API_URL = 'https://jsonwhois.com/api/v1/whois';

interface JsonWhoisResponse {
  status?: string;
  domain?: string;
  created?: string;
  updated?: string;
  expires?: string;
  registrar?: {
    name?: string;
    url?: string;
    email?: string;
    phone?: string;
  };
  registrant?: {
    name?: string;
    organization?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  admin?: {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
  };
  tech?: {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
  };
  nameservers?: string[];
  dnssec?: string;
  error?: string;
}

/**
 * Parse JSON WHOIS API response into structured data
 */
function parseJsonWhoisResponse(response: JsonWhoisResponse): WhoisData | null {
  if (response.error) return null;

  const data: WhoisData = {
    domainName: response.domain || '',
  };

  // Registrar information
  if (response.registrar) {
    if (response.registrar.name) data.registrar = response.registrar.name;
    if (response.registrar.url) data.registrarUrl = response.registrar.url;
  }

  // Dates
  if (response.created) data.creationDate = parseDate(response.created);
  if (response.updated) data.updatedDate = parseDate(response.updated);
  if (response.expires) data.expirationDate = parseDate(response.expires);

  // Registrant contact
  const registrant = response.registrant;
  if (registrant) {
    if (registrant.name) data.registrantName = registrant.name;
    if (registrant.organization) data.registrantOrganization = registrant.organization;
    if (registrant.address) data.registrantStreet = registrant.address;
    if (registrant.city) data.registrantCity = registrant.city;
    if (registrant.state) data.registrantState = registrant.state;
    if (registrant.zip) data.registrantPostalCode = registrant.zip;
    if (registrant.country) data.registrantCountry = registrant.country;
    if (registrant.email) data.registrantEmail = registrant.email;
    if (registrant.phone) data.registrantPhone = registrant.phone;
  }

  // Admin contact
  const admin = response.admin;
  if (admin) {
    if (admin.name) data.adminName = admin.name;
    if (admin.organization) data.adminOrganization = admin.organization;
    if (admin.email) data.adminEmail = admin.email;
    if (admin.phone) data.adminPhone = admin.phone;
  }

  // Tech contact
  const tech = response.tech;
  if (tech) {
    if (tech.name) data.techName = tech.name;
    if (tech.organization) data.techOrganization = tech.organization;
    if (tech.email) data.techEmail = tech.email;
    if (tech.phone) data.techPhone = tech.phone;
  }

  // Name servers
  if (response.nameservers && response.nameservers.length > 0) {
    data.nameServers = response.nameservers;
  }

  // DNSSEC
  if (response.dnssec) {
    data.dnssec = response.dnssec;
  }

  // Status
  if (response.status) {
    data.status = [response.status];
  }

  return data;
}

/**
 * Query JSON WHOIS API
 */
export async function queryJsonWhois(
  domain: string,
  apiKey: string,
  timeout: number = 10000
): Promise<ProviderResponse> {
  const startTime = Date.now();

  if (!apiKey) {
    return {
      provider: 'jsonwhois',
      success: false,
      error: 'API key not configured',
      responseTime: 0,
    };
  }

  try {
    log.debug('Querying JSON WHOIS API', { domain });

    const response = await axios.get<JsonWhoisResponse>(API_URL, {
      params: {
        domain,
      },
      headers: {
        Authorization: `Token token=${apiKey}`,
      },
      timeout,
    });

    const responseTime = Date.now() - startTime;

    // Check for API error
    if (response.data.error) {
      return {
        provider: 'jsonwhois',
        success: false,
        error: response.data.error,
        responseTime,
      };
    }

    const data = parseJsonWhoisResponse(response.data);

    if (!data) {
      return {
        provider: 'jsonwhois',
        success: false,
        error: 'Failed to parse API response',
        responseTime,
      };
    }

    log.debug('JSON WHOIS API query successful', { domain, responseTime });

    return {
      provider: 'jsonwhois',
      success: true,
      data,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : error instanceof Error
      ? error.message
      : 'Unknown error';

    log.error('JSON WHOIS API query failed', { domain, error: errorMessage, responseTime });

    return {
      provider: 'jsonwhois',
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}

export default queryJsonWhois;
