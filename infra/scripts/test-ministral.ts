import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import * as fs from "fs";

const raw = fs.readFileSync(".env.deploy", "utf-8");
const env = Object.fromEntries(
  raw.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const bedrock = new BedrockRuntimeClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN
  }
});

async function main() {
  console.log("Invoking Bedrock model: mistral.ministral-3-8b-instruct with messages format...");
  const body = JSON.stringify({
    messages: [
      { role: "user", content: "Reply in one short sentence: What is the primary crop in Tamil Nadu?" }
    ],
    max_tokens: 60,
    temperature: 0.3
  });
  const cmd = new InvokeModelCommand({
    modelId: "mistral.ministral-3-8b-instruct",
    contentType: "application/json",
    accept: "application/json",
    body: Buffer.from(body)
  });
  const res = await bedrock.send(cmd);
  const parsed = JSON.parse(Buffer.from(res.body).toString("utf-8"));
  console.log("[Bedrock Ministral 3 8B LIVE] SUCCESS!\nOutput:", JSON.stringify(parsed, null, 2));
}

main().catch(e => console.error("Error:", e.name, e.message));
