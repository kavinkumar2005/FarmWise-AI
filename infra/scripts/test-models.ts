import * as fs from 'fs';
const raw = fs.readFileSync('.env.deploy', 'utf-8');
const env: Record<string,string> = Object.fromEntries(
  raw.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')&&l.includes('='))
     .map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]})
);

import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

async function testGemini() {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const resp = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [{ role: 'user', parts: [{ text: 'In one sentence: What crop is grown in Tamil Nadu paddy fields?' }] }]
  });
  console.log('[GEMINI LIVE] ✅', resp.text?.trim().slice(0, 150));
}

async function testClaude() {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 80,
    messages: [{ role: 'user', content: 'In one sentence: What is the main Kharif crop of Tamil Nadu?' }]
  });
  const text = (msg.content as any[]).filter(b=>b.type==='text').map((b:any)=>b.text).join('');
  console.log('[CLAUDE LIVE] ✅', text.trim().slice(0, 150));
}

async function main() {
  console.log('Testing live model connections...');
  await Promise.all([
    testGemini().catch(e => console.log('[GEMINI] ❌', e.name, '-', e.message?.slice(0,120))),
    testClaude().catch(e => console.log('[CLAUDE] ❌', e.name, '-', e.message?.slice(0,120)))
  ]);
  console.log('Done.');
}
main();
