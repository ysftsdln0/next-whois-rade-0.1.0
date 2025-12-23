/**
 * WHOIS API Server 2 - Port 4002
 * Simple WHOIS lookup microservice with different parsing strategy
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

const PORT = process.env.PORT || 4002;
const API_NAME = process.env.API_NAME || 'WHOIS-API-2';

/**
 * Execute WHOIS command with retry
 */
function whoisLookup(domain, retries = 2) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptsLeft) => {
      exec(`whois ${domain}`, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error && !stdout) {
          if (attemptsLeft > 0) {
            console.log(`[${API_NAME}] Retrying... (${attemptsLeft} attempts left)`);
            setTimeout(() => attempt(attemptsLeft - 1), 1000);
            return;
          }
          reject(new Error(`WHOIS lookup failed: ${error.message}`));
          return;
        }
        resolve(stdout || stderr);
      });
    };
    attempt(retries);
  });
}

/**
 * Query RDAP API for IP addresses
 */
function rdapLookup(ip) {
  return new Promise((resolve, reject) => {
    const url = `https://rdap.arin.net/registry/ip/${ip}`;

    https.get(url, { timeout: 30000 }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse RDAP response'));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`RDAP lookup failed: ${err.message}`));
    });
  });
}

/**
 * Parse RDAP response into our format
 */
function parseRdapResponse(rdap) {
  const result = {
    raw: JSON.stringify(rdap, null, 2),
    parsed: {},
    network: {},
    organization: {},
    abuse: {},
    tech: {},
    admin: {},
    dates: {},
    rdap: rdap
  };

  result.network = {
    handle: rdap.handle || '',
    name: rdap.name || '',
    startAddress: rdap.startAddress || '',
    endAddress: rdap.endAddress || '',
    ipVersion: rdap.ipVersion || '',
    type: rdap.type || '',
    parentHandle: rdap.parentHandle || '',
    status: rdap.status || [],
    cidr: rdap.cidr0_cidrs ? rdap.cidr0_cidrs.map(c => `${c.v4prefix}/${c.length}`).join(', ') : ''
  };

  if (rdap.events) {
    rdap.events.forEach(event => {
      if (event.eventAction === 'registration') {
        result.dates.registered = event.eventDate;
      } else if (event.eventAction === 'last changed') {
        result.dates.updated = event.eventDate;
      }
    });
  }

  if (rdap.entities) {
    rdap.entities.forEach(entity => {
      const roles = entity.roles || [];
      const vcard = entity.vcardArray?.[1] || [];

      let name = '', org = '', address = '', email = '', phone = '';
      vcard.forEach(field => {
        if (field[0] === 'fn') name = field[3];
        if (field[0] === 'org') org = field[3];
        if (field[0] === 'email') email = field[3];
        if (field[0] === 'tel') phone = field[3];
        if (field[0] === 'adr' && field[1]?.label) address = field[1].label;
      });

      const entityInfo = { handle: entity.handle || '', name, organization: org, address, email, phone };

      if (roles.includes('registrant')) {
        result.organization = { ...result.organization, ...entityInfo };
      }

      if (entity.entities) {
        entity.entities.forEach(subEntity => {
          const subRoles = subEntity.roles || [];
          const subVcard = subEntity.vcardArray?.[1] || [];

          let subName = '', subOrg = '', subAddress = '', subEmail = '', subPhone = '';
          subVcard.forEach(field => {
            if (field[0] === 'fn') subName = field[3];
            if (field[0] === 'org') subOrg = field[3];
            if (field[0] === 'email') subEmail = field[3];
            if (field[0] === 'tel') subPhone = field[3];
            if (field[0] === 'adr' && field[1]?.label) subAddress = field[1].label;
          });

          const subInfo = { handle: subEntity.handle || '', name: subName, organization: subOrg, address: subAddress, email: subEmail, phone: subPhone };

          if (subRoles.includes('abuse')) result.abuse = subInfo;
          if (subRoles.includes('technical')) result.tech = subInfo;
          if (subRoles.includes('administrative')) result.admin = subInfo;
        });
      }
    });
  }

  result.parsed = {
    ...result.network,
    orgName: result.organization.name || result.organization.organization,
    orgAddress: result.organization.address
  };

  return result;
}

/**
 * Enhanced WHOIS parser
 */
function parseWhoisResponse(raw) {
  const result = {
    raw: raw,
    parsed: {},
    registrant: {},
    admin: {},
    tech: {}
  };

  // Basic domain info
  const basicPatterns = {
    domainName: /Domain Name:\s*(.+)/i,
    registrar: /Registrar:\s*(.+)/i,
    registrarIanaId: /Registrar IANA ID:\s*(.+)/i,
    registrarUrl: /Registrar URL:\s*(.+)/i,
    registrarEmail: /Registrar Abuse Contact Email:\s*(.+)/i,
    registrarPhone: /Registrar Abuse Contact Phone:\s*(.+)/i,
    creationDate: /Creation Date:\s*(.+)/i,
    expirationDate: /Registry Expiry Date:\s*(.+)/i,
    updatedDate: /Updated Date:\s*(.+)/i,
    dnssec: /DNSSEC:\s*(.+)/i,
  };

  // Array patterns
  const arrayPatterns = {
    nameServers: /(Name Server|Nameserver|Host Name):\s*(.+)/gi,
    status: /Domain Status:\s*(.+)/gi,
  };

  // Parse basic patterns
  for (const [key, pattern] of Object.entries(basicPatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.parsed[key] = match[1].trim();
    }
  }

  // Parse array patterns
  for (const [key, pattern] of Object.entries(arrayPatterns)) {
    const matches = [];
    let match;
    while ((match = pattern.exec(raw)) !== null) {
      matches.push(key === 'nameServers' ? match[2].trim() : match[1].trim());
    }
    if (matches.length > 0) {
      result.parsed[key] = matches;
    }
  }

  // Registrant info
  const registrantPatterns = {
    name: /Registrant Name:\s*(.+)/i,
    organization: /Registrant Organization:\s*(.+)/i,
    country: /Registrant Country:\s*(.+)/i,
    state: /Registrant State\/Province:\s*(.+)/i,
    email: /Registrant Email:\s*(.+)/i,
  };

  for (const [key, pattern] of Object.entries(registrantPatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.registrant[key] = match[1].trim();
    }
  }

  return result;
}

/**
 * Parse raw WHOIS response for IP addresses (enhanced)
 */
function parseIpWhoisResponse(raw) {
  const result = {
    raw: raw,
    parsed: {},
    network: {},
    organization: {},
    abuse: {},
    tech: {},
    dates: {}
  };

  // Network information
  const networkPatterns = {
    netName: /NetName:\s*(.+)/i,
    netHandle: /NetHandle:\s*(.+)/i,
    netRange: /NetRange:\s*(.+)/i,
    cidr: /CIDR:\s*(.+)/i,
    netType: /NetType:\s*(.+)/i,
    originAS: /OriginAS:\s*(.+)/i,
    parent: /Parent:\s*(.+)/i,
    ref: /Ref:\s*(.+)/i,
  };

  // Organization information
  const orgPatterns = {
    orgName: /OrgName:\s*(.+)/i,
    orgId: /OrgId:\s*(.+)/i,
    address: /Address:\s*(.+)/gi,
    city: /City:\s*(.+)/i,
    stateProv: /StateProv:\s*(.+)/i,
    postalCode: /PostalCode:\s*(.+)/i,
    country: /Country:\s*(.+)/i,
  };

  // Abuse contact
  const abusePatterns = {
    abuseHandle: /OrgAbuseHandle:\s*(.+)/i,
    abuseName: /OrgAbuseName:\s*(.+)/i,
    abuseEmail: /OrgAbuseEmail:\s*(.+)/i,
    abusePhone: /OrgAbusePhone:\s*(.+)/i,
    abuseRef: /OrgAbuseRef:\s*(.+)/i,
  };

  // Tech contact
  const techPatterns = {
    techHandle: /OrgTechHandle:\s*(.+)/i,
    techName: /OrgTechName:\s*(.+)/i,
    techEmail: /OrgTechEmail:\s*(.+)/i,
    techPhone: /OrgTechPhone:\s*(.+)/i,
    techRef: /OrgTechRef:\s*(.+)/i,
  };

  // Date patterns
  const datePatterns = {
    regDate: /RegDate:\s*(.+)/i,
    updated: /Updated:\s*(.+)/i,
  };

  // Parse network info
  for (const [key, pattern] of Object.entries(networkPatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.network[key] = match[1].trim();
    }
  }

  // Parse organization info (handle multiple addresses)
  for (const [key, pattern] of Object.entries(orgPatterns)) {
    if (key === 'address') {
      const matches = [];
      let match;
      const regex = new RegExp(pattern.source, 'gi');
      while ((match = regex.exec(raw)) !== null) {
        matches.push(match[1].trim());
      }
      if (matches.length > 0) {
        result.organization[key] = matches.join(', ');
      }
    } else {
      const match = raw.match(pattern);
      if (match) {
        result.organization[key] = match[1].trim();
      }
    }
  }

  // Parse abuse contact
  for (const [key, pattern] of Object.entries(abusePatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.abuse[key] = match[1].trim();
    }
  }

  // Parse tech contact
  for (const [key, pattern] of Object.entries(techPatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.tech[key] = match[1].trim();
    }
  }

  // Parse dates
  for (const [key, pattern] of Object.entries(datePatterns)) {
    const match = raw.match(pattern);
    if (match) {
      result.dates[key] = match[1].trim();
    }
  }

  // Extract comments
  const commentPattern = /Comment:\s*(.+)/gi;
  const comments = [];
  let commentMatch;
  while ((commentMatch = commentPattern.exec(raw)) !== null) {
    comments.push(commentMatch[1].trim());
  }
  if (comments.length > 0) {
    result.parsed.comments = comments;
  }

  // Copy key fields to parsed for backward compatibility
  result.parsed = {
    ...result.parsed,
    ...result.network,
    ...result.organization,
  };

  return result;
}

/**
 * HTTP Request handler
 */
async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname;

  // Health check
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      api: API_NAME,
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // WHOIS lookup
  if (path === '/whois' || path === '/') {
    const domain = parsedUrl.searchParams.get('domain');
    const queryType = parsedUrl.searchParams.get('type') || 'domain';

    if (!domain) {
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: 'Domain parameter is required',
        api: API_NAME
      }));
      return;
    }

    try {
      console.log(`[${API_NAME}] Looking up ${queryType}: ${domain}`);
      const startTime = Date.now();

      let parsed;
      if (queryType === 'ip') {
        const rdapData = await rdapLookup(domain);
        parsed = parseRdapResponse(rdapData);
      } else {
        const rawWhois = await whoisLookup(domain);
        parsed = parseWhoisResponse(rawWhois);
      }

      const duration = Date.now() - startTime;

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        api: API_NAME,
        port: PORT,
        domain: domain,
        type: queryType,
        queryTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
        data: parsed
      }));

      console.log(`[${API_NAME}] Completed ${queryType} lookup for ${domain} in ${duration}ms`);
    } catch (error) {
      console.error(`[${API_NAME}] Error:`, error.message);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        api: API_NAME,
        port: PORT
      }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    error: 'Not found',
    api: API_NAME
  }));
}

const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${API_NAME} running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   WHOIS:  http://localhost:${PORT}/whois?domain=example.com`);
});

process.on('SIGTERM', () => {
  console.log(`[${API_NAME}] Shutting down...`);
  server.close(() => process.exit(0));
});
