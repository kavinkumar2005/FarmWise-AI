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
  console.log("Testing Groq model: qwen/qwen3.8-27b ...");
  const start = Date.now();
  
  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    messages: [
      { role: "system", content: "You are an agricultural intelligence expert." },
      { role: "user", content: "In 2 concise bullet points, what are the best practices for drip irrigation in cotton in Tamil Nadu?" }
    ],
    temperature: 0.3,
    max_tokens: 150
  });

  const duration = Date.now() - start;
  console.log(`\n[Groq Qwen 3.8 27B LIVE] SUCCESS in ${duration}ms!`);
  console.log(completion.choices[0]?.message?.content);
  console.log("\nUsage:", completion.usage);
}

main().catch(e => console.error("Error:", e.name, e.message));
