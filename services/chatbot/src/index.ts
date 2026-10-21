import { AgriChatbot, ChatRequest } from '@farmwise/agent-core';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

const chatbot = new AgriChatbot();

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

    if (event.body) {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      if (typeof rawBody === 'string') {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          // Check for multipart form or urlencoded body
          const mMatch = rawBody.match(/name="message"[\r\n]+([^\r\n]+)/) || rawBody.match(/message=([^&]+)/);
          const sMatch = rawBody.match(/name="survey_number"[\r\n]+([^\r\n]+)/) || rawBody.match(/survey_number=([^&]+)/);
          payload = {
            message: mMatch ? decodeURIComponent(mMatch[1].trim()) : '',
            survey_number: sMatch ? decodeURIComponent(sMatch[1].trim()) : undefined
          };
        }
      } else {
        payload = rawBody;
      }
    }

    const message = payload.message || payload.query;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'Field "message" is required and cannot be empty.'
        })
      };
    }

    const request: ChatRequest = {
      message: message.trim(),
      history: payload.history || [],
      language: payload.language || undefined,
      parcelContext: payload.parcelContext || payload.context || undefined
    };

    const response = await chatbot.chat(request);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ...response,
        response: response.reply
      })
    };
  } catch (err: any) {
    console.error('Error in chatbot Lambda handler:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'ChatbotInternalError',
        message: err.message || 'An error occurred while processing the chat turn.'
      })
    };
  }
}
