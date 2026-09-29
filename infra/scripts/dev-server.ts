import http from 'http';
import { handler } from '../services/api-gateway-handler/src/index.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  
  // Transform standard Node HTTP request into Lambda API Gateway proxy event
  const event = {
    rawPath: url.pathname,
    path: url.pathname,
    httpMethod: req.method,
    requestContext: {
      http: {
        method: req.method,
        path: url.pathname
      },
      requestId: 'dev-' + Math.random().toString(36).substring(7)
    },
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    headers: req.headers
  };

  try {
    const result = await handler(event);
    
    res.writeHead(result.statusCode, result.headers || {});
    res.end(result.body);
  } catch (err: any) {
    console.error('Handler error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` FarmwiseAI Local Dev API Gateway Simulation          `);
  console.log(` Running on: http://localhost:${PORT}                  `);
  console.log(` Health endpoint: http://localhost:${PORT}/health      `);
  console.log(` Region target: ap-south-1 (Mumbai)                   `);
  console.log(`======================================================\n`);
});
