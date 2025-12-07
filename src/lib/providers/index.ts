/**
 * WHOIS Providers Index
 * Exports all WHOIS provider functions
 */

export { queryNativeWhois } from './native';
export { queryWhoisXml } from './whoisxml';
export { queryJsonWhois } from './jsonwhois';
export { queryTredis, isTrDomain } from './tredis';
