/**
 * WhoisXML API Provider
 * Commercial API for reliable WHOIS lookups
 * Website: https://whoisxmlapi.com/
 */

import axios from 'axios';
import { log } from '../logger';
import { parseDate } from '../domain-utils';
import type { WhoisData, ProviderResponse } from '../types';

const API_URL = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';

interface WhoisXmlResponse {
  WhoisRecord?: {
    domainName?: string;
    registrarName?: string;
    registrarIANAID?: string;
    createdDate?: string;
    updatedDate?: string;
    expiresDate?: string;
    registrant?: {
      name?: string;
      organization?: string;
      street1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      email?: string;
      telephone?: string;
    };
    administrativeContact?: {
      name?: string;
      organization?: string;
      email?: string;
      telephone?: string;
    };
    technicalContact?: {
      name?: string;
      organization?: string;
      email?: string;
      telephone?: string;
    };
    nameServers?: {
      hostNames?: string[];
    };
    status?: string;
    domainAvailability?: string;
    contactEmail?: string;
  };
  ErrorMessage?: {
    errorCode?: string;
    msg?: string;
  };
}

/**
 * Parse WhoisXML API response into structured data
 */
function parseWhoisXmlResponse(response: WhoisXmlResponse): WhoisData | null {
  const record = response.WhoisRecord;
  if (!record) return null;

  const data: WhoisData = {
    domainName: record.domainName || '',
  };

  // Registrar information
  if (record.registrarName) data.registrar = record.registrarName;
  if (record.registrarIANAID) data.registrarIanaId = record.registrarIANAID;

  // Dates
  if (record.createdDate) data.creationDate = parseDate(record.createdDate);
  if (record.updatedDate) data.updatedDate = parseDate(record.updatedDate);
  if (record.expiresDate) data.expirationDate = parseDate(record.expiresDate);

  // Registrant contact
  const registrant = record.registrant;
  if (registrant) {
    if (registrant.name) data.registrantName = registrant.name;
    if (registrant.organization) data.registrantOrganization = registrant.organization;
    if (registrant.street1) data.registrantStreet = registrant.street1;
    if (registrant.city) data.registrantCity = registrant.city;
    if (registrant.state) data.registrantState = registrant.state;
    if (registrant.postalCode) data.registrantPostalCode = registrant.postalCode;
    if (registrant.country) data.registrantCountry = registrant.country;
    if (registrant.email) data.registrantEmail = registrant.email;
    if (registrant.telephone) data.registrantPhone = registrant.telephone;
  }

  // Admin contact
  const admin = record.administrativeContact;
  if (admin) {
    if (admin.name) data.adminName = admin.name;
    if (admin.organization) data.adminOrganization = admin.organization;
    if (admin.email) data.adminEmail = admin.email;
    if (admin.telephone) data.adminPhone = admin.telephone;
  }

  // Tech contact
  const tech = record.technicalContact;
  if (tech) {
    if (tech.name) data.techName = tech.name;
    if (tech.organization) data.techOrganization = tech.organization;
    if (tech.email) data.techEmail = tech.email;
    if (tech.telephone) data.techPhone = tech.telephone;
  }

  // Name servers
  if (record.nameServers?.hostNames) {
    data.nameServers = record.nameServers.hostNames;
  }

  // Status
  if (record.status) {
    data.status = [record.status];
  }

  return data;
}

/**
 * Query WhoisXML API
 */
export async function queryWhoisXml(
  domain: string,
  apiKey: string,
  timeout: number = 10000
): Promise<ProviderResponse> {
  const startTime = Date.now();

  if (!apiKey) {
    return {
      provider: 'whoisxml',
      success: false,
      error: 'API key not configured',
      responseTime: 0,
    };
  }

  try {
    log.debug('Querying WhoisXML API', { domain });

    const response = await axios.get<WhoisXmlResponse>(API_URL, {
      params: {
        apiKey,
        domainName: domain,
        outputFormat: 'JSON',
      },
      timeout,
    });

    const responseTime = Date.now() - startTime;

    // Check for API error
    if (response.data.ErrorMessage) {
      return {
        provider: 'whoisxml',
        success: false,
        error: response.data.ErrorMessage.msg || 'API error',
        responseTime,
      };
    }

    const data = parseWhoisXmlResponse(response.data);

    if (!data) {
      return {
        provider: 'whoisxml',
        success: false,
        error: 'Failed to parse API response',
        responseTime,
      };
    }

    log.debug('WhoisXML API query successful', { domain, responseTime });

    return {
      provider: 'whoisxml',
      success: true,
      data,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error
      ? error.message
      : 'Unknown error';

    log.error('WhoisXML API query failed', { domain, error: errorMessage, responseTime });

    return {
      provider: 'whoisxml',
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}

export default queryWhoisXml;
