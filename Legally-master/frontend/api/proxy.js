export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract path and query parameters from request URL
  const targetPath = req.url; // e.g. /api/lawyers?city=pune
  const targetUrl = `http://16.171.12.83:3000${targetPath}`;

  try {
    const options = {
      method: req.method,
      headers: {}
    };

    // Forward relevant headers from client
    const headersToForward = ['content-type', 'authorization', 'accept'];
    for (const h of headersToForward) {
      if (req.headers[h]) {
        options.headers[h] = req.headers[h];
      }
    }

    // Include request body if applicable
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    res.status(response.status);
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('content-type', contentType);
    }

    res.send(data);
  } catch (error) {
    console.error('Serverless Proxy Error:', error);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
}
