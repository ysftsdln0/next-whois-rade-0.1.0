/**
 * WHOIS API Server 1 - Port 4001
 * Simple WHOIS lookup microservice
 */

const http = require('http');
const { exec } = require('child_process');
const url = require('url');

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
    nameServers: /Name Server:\s*(.+)/gi,
    status: /Domain Status:\s*(.+)/gi,
    dnssec: /DNSSEC:\s*(.+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    if (key === 'nameServers' || key === 'status') {
      const matches = [];
      let match;
      while ((match = pattern.exec(raw)) !== null) {
        matches.push(match[1].trim());
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

  const parsedUrl = url.parse(req.url, true);
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
    const domain = parsedUrl.query.domain;

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
