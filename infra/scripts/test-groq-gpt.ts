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
  console.log("Testing Groq model: openai/gpt-oss-120b ...");
  const start = Date.now();
  
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "user", content: "Reply in one sentence: What is the main Kharif crop of Tamil Nadu?" }
    ],
    temperature: 0.3,
    max_tokens: 60
  });

  const duration = Date.now() - start;
  console.log(`\n[Groq GPT-OSS 120B LIVE] SUCCESS in ${duration}ms!`);
  console.log(completion.choices[0]?.message?.content);
  console.log("Completion time:", completion.usage?.completion_time);
}

main().catch(e => console.error("Error:", e.name, e.message));
