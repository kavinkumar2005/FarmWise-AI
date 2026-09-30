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
  console.log("Invoking Bedrock model: amazon.titan-embed-image-v1 ...");
  // 1x1 transparent png in base64
  const dummyB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const cmd = new InvokeModelCommand({
    modelId: "amazon.titan-embed-image-v1",
    contentType: "application/json",
    accept: "application/json",
    body: Buffer.from(JSON.stringify({ inputImage: dummyB64 }))
  });
  const res = await bedrock.send(cmd);
  const parsed = JSON.parse(Buffer.from(res.body).toString("utf-8"));
  console.log("[Bedrock Titan Multimodal LIVE] SUCCESS! Vector length:", parsed.embedding?.length);
}

main().catch(e => console.error("Error:", e.name, e.message));
