import { OrchestrationPipeline, FarmerRequestSchema } from '@farmwise/agent-core';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

const pipeline = new OrchestrationPipeline();

export async function handler(event: any) {
  const method = (event.requestContext?.http?.method || event.httpMethod || 'POST').toUpperCase();

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

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
    console.error('Orchestration error:', err);
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
