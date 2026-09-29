export async function handler(event: any) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'FarmwiseAI Chatbot service initialized' })
  };
}
