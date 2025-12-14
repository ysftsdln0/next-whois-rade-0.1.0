/**
 * WHOIS API Server 2 - Port 4002
 * Simple WHOIS lookup microservice with different parsing strategy
 */

const http = require('http');
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
    nameServers: /Name Server:\s*(.+)/gi,
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
      matches.push(match[1].trim());
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
      console.log(`[${API_NAME}] Looking up: ${domain}`);
      const startTime = Date.now();
      const rawWhois = await whoisLookup(domain);
      const duration = Date.now() - startTime;
      
      const parsed = parseWhoisResponse(rawWhois);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        api: API_NAME,
        port: PORT,
        domain: domain,
        queryTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
        data: parsed
      }));
      
      console.log(`[${API_NAME}] Completed lookup for ${domain} in ${duration}ms`);
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
