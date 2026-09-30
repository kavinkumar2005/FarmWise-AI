import Groq from "groq-sdk";
import * as fs from "fs";

const raw = fs.readFileSync(".env.deploy", "utf-8");
const env = Object.fromEntries(
  raw.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

async function main() {
  console.log("Testing Groq Cloud API with Llama 3.3 70B Versatile...");
  const start = Date.now();
  
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are an agricultural intelligence expert for Tamil Nadu farming." },
      { role: "user", content: "In 2 concise bullet points, what are the best practices for drip irrigation in cotton?" }
    ],
    temperature: 0.3,
    max_tokens: 120
  });

  const duration = Date.now() - start;
  const reply = completion.choices[0]?.message?.content;
  const usage = completion.usage;

  console.log(`\n[Groq Llama 3.3 70B LIVE] Response in ${duration}ms:`);
  console.log(reply);
  console.log(`\nTokens: ${usage?.prompt_tokens} in / ${usage?.completion_tokens} out (${usage?.total_tokens} total)`);
  console.log("Model:", completion.model);
}

main().catch(e => console.error("Groq Test Error:", e.name, e.message));
