import {
  buildGovernmentReportHTML,
  FinalResult,
  GovernmentReportOptions
} from '@farmwise/agent-core';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

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
    let payload: any = event;

    // Handle API Gateway HTTP proxy event body
    if (event.body) {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    }

    const result = payload.result as FinalResult;
    if (!result || !result.runId || !result.parcel) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'Missing or invalid "result" payload required for government report generation.'
        })
      };
    }

    const options: GovernmentReportOptions = {
      language: payload.language || 'ta',
      persona: payload.persona || 'farmer',
      includePrintStyles: true
    };

    const report = await buildGovernmentReportHTML(result, options);

    if (payload.format === 'html' || event.queryStringParameters?.format === 'html') {
      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/html; charset=utf-8'
        },
        body: report.html
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'SUCCESS',
        advisoryId: report.advisoryId,
        sha256: report.sha256,
        verificationUrl: report.verificationUrl,
        generatedAt: report.generatedAt,
        qrDataUrl: report.qrDataUrl,
        qrSvg: report.qrSvg,
        html: report.html
      })
    };
  } catch (err: any) {
    console.error('Error generating official government report in Lambda:', err);
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'ReportGenerationError',
        message: err.message || 'An unexpected error occurred while compiling the report.'
      })
    };
  }
}
