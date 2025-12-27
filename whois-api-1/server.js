/**
 * WHOIS API Server 1 - Port 4001
 * Simple WHOIS lookup microservice with RDAP support for IP
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

const PORT = process.env.PORT || 4001;
const API_NAME = process.env.API_NAME || 'WHOIS-API-1';

/**
 * Execute WHOIS command
 */
function whoisLookup(domain) {
  return new Promise((resolve, reject) => {
    exec(`whois ${domain}`, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(new Error(`WHOIS lookup failed: ${error.message}`));
        return;
      }
      resolve(stdout || stderr);
    });
  });
}

function rdapLookup(ip, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const url = `https://rdap.org/ip/${ip}`;

    function makeRequest(requestUrl, redirectCount) {
      if (redirectCount > maxRedirects) {
        reject(new Error('Too many redirects'));
        return;
      }

      const options = {
        timeout: 30000,
        headers: {
          'User-Agent': 'WHOIS-Lookup-Service/1.0',
          'Accept': 'application/rdap+json, application/json'
        }
      };

      https.get(requestUrl, options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect without location header'));
            return;
          }
          console.log(`[RDAP] Following redirect to: ${redirectUrl}`);
          makeRequest(redirectUrl, redirectCount + 1);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`RDAP server returned status ${response.statusCode}`));
          return;
        }

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
    }

    makeRequest(url, 0);
  });
}

function formatRdapAsText(rdap) {
  const lines = [];

  if (rdap.startAddress) {
    lines.push(`Name            ${rdap.startAddress}`);
  }

  if (rdap.status && rdap.status.length > 0) {
    lines.push(`Status          ${rdap.status.join(', ')}`);
  }

  if (rdap.startAddress && rdap.endAddress) {
    lines.push(`CIDR            ${rdap.startAddress}-${rdap.endAddress}`);
  }

  if (rdap.type) {
    lines.push(`Net Type        ${rdap.type}`);
  }

  if (rdap.name) {
    lines.push(`Net Name        ${rdap.name}`);
  }

  if (rdap.handle) {
    const inetNum = rdap.handle.split(' - ')[0];
    lines.push(`INet Num        ${inetNum}`);
  }

  if (rdap.startAddress && rdap.endAddress) {
    lines.push(`Net Range       ${rdap.startAddress} - ${rdap.endAddress}`);
  }

  lines.push(`Whois Server    https://rdap.org`);

  if (rdap.events) {
    rdap.events.forEach(event => {
      if (event.eventAction === 'registration') {
        lines.push(`Creation Date   ${event.eventDate}`);
      }
    });
  }

  if (rdap.events) {
    rdap.events.forEach(event => {
      if (event.eventAction === 'last changed') {
        lines.push(`Updated Date    ${event.eventDate}`);
      }
    });
  }

  lines.push(`DNSSEC          unsigned`);

  lines.push('');
  lines.push('# Additional Information');
  lines.push('');

  if (rdap.country) {
    lines.push(`Country:        ${rdap.country}`);
  }

  if (rdap.parentHandle) {
    lines.push(`Parent:         ${rdap.parentHandle}`);
  }

  if (rdap.ipVersion) {
    lines.push(`IP Version:     ${rdap.ipVersion}`);
  }

  if (rdap.cidr0_cidrs && rdap.cidr0_cidrs.length > 0) {
    lines.push('');
    lines.push('CIDR Blocks:');
    rdap.cidr0_cidrs.forEach(cidr => {
      lines.push(`  ${cidr.v4prefix}/${cidr.length}`);
    });
  }

  lines.push('');

  if (rdap.entities) {
    rdap.entities.forEach(entity => {
      const roles = entity.roles || [];
      if (roles.includes('registrant')) {
        const vcard = entity.vcardArray?.[1] || [];
        let org = '', address = '';
        vcard.forEach(field => {
          if (field[0] === 'org') org = field[3];
          if (field[0] === 'fn' && !org) org = field[3];
          if (field[0] === 'adr' && field[1]?.label) address = field[1].label;
        });
        if (org) {
          lines.push(`Organization:   ${org}`);
        }
        if (address) {
          lines.push(`Address:        ${address.replace(/\n/g, '\n                ')}`);
        }
      }
    });
  }

  if (rdap.entities) {
    let hasContacts = false;
    rdap.entities.forEach(entity => {
      const roles = entity.roles || [];

      if (roles.includes('administrative') || roles.includes('technical')) {
        if (!hasContacts) {
          lines.push('');
          lines.push('# Contact Information');
          hasContacts = true;
        }

        const vcard = entity.vcardArray?.[1] || [];
        let name = '', phone = '', address = '';
        vcard.forEach(field => {
          if (field[0] === 'fn') name = field[3];
          if (field[0] === 'tel') phone = field[3];
          if (field[0] === 'adr' && field[1]?.label) address = field[1].label;
        });

        const roleType = roles.includes('administrative') ? 'Admin' : 'Tech';
        lines.push('');
        lines.push(`${roleType} Contact:  ${name}`);
        if (phone) lines.push(`Phone:          ${phone}`);
        if (address) lines.push(`Address:        ${address.replace(/\n/g, '\n                ')}`);
      }

      if (entity.entities) {
        entity.entities.forEach(subEntity => {
          const subRoles = subEntity.roles || [];
          const subVcard = subEntity.vcardArray?.[1] || [];

          if (subRoles.includes('abuse')) {
            if (!hasContacts) {
              lines.push('');
              lines.push('# Contact Information');
              hasContacts = true;
            }

            let name = '', email = '', address = '';
            subVcard.forEach(field => {
              if (field[0] === 'fn') name = field[3];
              if (field[0] === 'email') email = field[3];
              if (field[0] === 'adr' && field[1]?.label) address = field[1].label;
            });

            lines.push('');
            lines.push(`Abuse Contact:  ${name}`);
            if (email) lines.push(`Email:          ${email}`);
            if (address) lines.push(`Address:        ${address.replace(/\n/g, '\n                ')}`);
          }
        });
      }
    });
  }

  if (rdap.remarks && rdap.remarks.length > 0) {
    lines.push('');
    lines.push('# Remarks');
    rdap.remarks.forEach(remark => {
      if (remark.description) {
        remark.description.forEach(desc => {
          lines.push(`  ${desc}`);
        });
      }
    });
  }

  return lines.join('\n');
}

function parseRdapResponse(rdap) {
  const result = {
    raw: formatRdapAsText(rdap), // Use formatted text instead of JSON
    parsed: {},
    network: {},
    organization: {},
    abuse: {},
    tech: {},
    admin: {},
    dates: {},
    rdap: rdap // Include original RDAP data
  };

  // Network info
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

  // Parse events for dates
  if (rdap.events) {
    rdap.events.forEach(event => {
      if (event.eventAction === 'registration') {
        result.dates.registered = event.eventDate;
      } else if (event.eventAction === 'last changed') {
        result.dates.updated = event.eventDate;
      }
    });
  }

  // Parse entities
  if (rdap.entities) {
    rdap.entities.forEach(entity => {
      const roles = entity.roles || [];
      const vcard = entity.vcardArray?.[1] || [];

      // Extract info from vCard
      let name = '', org = '', address = '', email = '', phone = '';
      vcard.forEach(field => {
        if (field[0] === 'fn') name = field[3];
        if (field[0] === 'org') org = field[3];
        if (field[0] === 'email') email = field[3];
        if (field[0] === 'tel') phone = field[3];
        if (field[0] === 'adr' && field[1]?.label) address = field[1].label;
      });

      const entityInfo = {
        handle: entity.handle || '',
        name: name,
        organization: org,
        address: address,
        email: email,
        phone: phone
      };

      if (roles.includes('registrant')) {
        result.organization = { ...result.organization, ...entityInfo };
      }

      // Parse nested entities (abuse, tech, admin)
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

          const subInfo = {
            handle: subEntity.handle || '',
            name: subName,
            organization: subOrg,
            address: subAddress,
            email: subEmail,
            phone: subPhone
          };

          if (subRoles.includes('abuse')) {
            result.abuse = subInfo;
          }
          if (subRoles.includes('technical')) {
            result.tech = subInfo;
          }
          if (subRoles.includes('administrative')) {
            result.admin = subInfo;
          }
        });
      }
    });
  }

  // Copy key fields to parsed for backward compatibility
  result.parsed = {
    ...result.network,
    orgName: result.organization.name || result.organization.organization,
    orgAddress: result.organization.address
  };

  return result;
}

/**
 * Parse raw WHOIS response
 */
function parseWhoisResponse(raw) {
  const result = {
    raw: raw,
    parsed: {}
  };

  const patterns = {
    domainName: /Domain Name:\s*(.+)/i,
    registrar: /Registrar:\s*(.+)/i,
    registrarUrl: /Registrar URL:\s*(.+)/i,
    creationDate: /Creation Date:\s*(.+)/i,
    expirationDate: /Registry Expiry Date:\s*(.+)/i,
    updatedDate: /Updated Date:\s*(.+)/i,
    nameServers: /(Name Server|Nameserver|Host Name):\s*(.+)/gi,
    status: /Domain Status:\s*(.+)/gi,
    dnssec: /DNSSEC:\s*(.+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    if (key === 'nameServers' || key === 'status') {
      const matches = [];
      let match;
      while ((match = pattern.exec(raw)) !== null) {
        matches.push(match[2].trim());
      }
      if (matches.length > 0) {
        result.parsed[key] = matches;
      }
    } else {
      const match = raw.match(pattern);
      if (match) {
        result.parsed[key] = match[1].trim();
      }
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
  // CORS headers
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
        // Use RDAP API for IP lookups
        const rdapData = await rdapLookup(domain);
        parsed = parseRdapResponse(rdapData);
      } else {
        // Use traditional WHOIS for domains
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

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    error: 'Not found',
    api: API_NAME
  }));
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ${API_NAME} running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   WHOIS:  http://localhost:${PORT}/whois?domain=example.com`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${API_NAME}] Shutting down...`);
  server.close(() => process.exit(0));
});
