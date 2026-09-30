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
  const models = await groq.models.list();
  console.log(`Found ${models.data.length} models accessible on this Groq key:`);
  models.data.forEach(m => console.log(`- ${m.id} (owned by ${m.owned_by})`));
}

main().catch(e => console.error("Error:", e.name, e.message));
