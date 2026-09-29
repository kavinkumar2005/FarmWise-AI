import { HealthResponseSchema, OrchestrationPipeline, FarmerRequestSchema } from '@farmwise/agent-core';
import { handler as reportHandler } from '../../report-generator/src/index.js';
import { handler as chatHandler } from '../../chatbot/src/index.js';
import teamConfig from '../../../config/team.json';
import modelsConfig from '../../../config/models.config.json';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

const pipeline = new OrchestrationPipeline();

export async function handleHealth() {
  const modelsCount = Object.keys(modelsConfig.models || {}).length;

  const healthData = {
    status: 'healthy' as const,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    region: 'ap-south-1' as const,
    teamId: process.env.TEAM_ID || teamConfig.teamId || '01',
    environment: process.env.NODE_ENV || 'production',
    services: {
      s3: 'configured',
      dynamodb: 'configured',
      bedrock: 'configured',
      apiGateway: 'active'
    },
    modelsConfigured: modelsCount
  };

  const validated = HealthResponseSchema.parse(healthData);
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(validated)
  };
}

export async function handleOrchestrate(event: any) {
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;

    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});
    const request = FarmerRequestSchema.parse(body);

    const result = await pipeline.execute(request);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result)
    };
  } catch (err: any) {
    console.error('Orchestration error in api-gateway:', err);
    return {
      statusCode: err.name === 'ZodError' ? 400 : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: err.name || 'OrchestrationError',
        message: err.message,
        details: err.issues || undefined
      })
    };
  }
}

export async function handler(event: any) {
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const path = event.rawPath || event.path || '/';

  // Structured logging (no personal data)
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    path,
    requestId: event.requestContext?.requestId || 'local-req'
  }));

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Route: /health or /api/health
  if (path === '/health' || path === '/api/health' || path.endsWith('/health')) {
    return handleHealth();
  }

  // Route: /orchestrate or /api/orchestrate
  if (
    (method === 'POST') &&
    (path === '/orchestrate' || path === '/api/orchestrate' || path.endsWith('/orchestrate'))
  ) {
    return handleOrchestrate(event);
  }

  // Route: /report or /api/report
  if (
    (method === 'POST') &&
    (path === '/report' || path === '/api/report' || path.endsWith('/report'))
  ) {
    return reportHandler(event);
  }

  // Route: /chat or /api/chat
  if (
    (method === 'POST') &&
    (path === '/chat' || path === '/api/chat' || path.endsWith('/chat'))
  ) {
    return chatHandler(event);
  }

  // Fallback 404
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: 'Not Found',
      message: `Route ${method} ${path} is not recognized on FarmwiseAI API Gateway.`
    })
  };
}
