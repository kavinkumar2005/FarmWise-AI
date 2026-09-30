import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as fs from "fs";

function loadEnv(): Record<string, string> {
  try {
    const raw = fs.readFileSync(".env.deploy", "utf-8");
    return Object.fromEntries(
      raw.split("\n")
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("#") && l.includes("="))
        .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const env = loadEnv();
const creds = {
  accessKeyId: env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
  sessionToken: env.AWS_SESSION_TOKEN
};

console.log("Checking AWS Credentials & Bedrock Connectivity...");
console.log("Region: ap-south-1");
console.log("AccessKeyId prefix:", creds.accessKeyId.slice(0, 8) + "...");

async function checkSTS() {
  const sts = new STSClient({ region: "ap-south-1", credentials: creds });
  try {
    const res = await sts.send(new GetCallerIdentityCommand({}));
    console.log("[STS] Authenticated successfully!");
    console.log("  Account:", res.Account);
    console.log("  Arn:", res.Arn);
    return true;
  } catch (err: any) {
    console.log("[STS Error]", err.name, ":", err.message);
    return false;
  }
}

async function checkBedrock() {
  const bedrock = new BedrockRuntimeClient({ region: "ap-south-1", credentials: creds });
  
  // Test 1: Amazon Titan Text Embeddings V2
  try {
    console.log("\nTesting Bedrock: amazon.titan-embed-text-v2:0 ...");
    const cmd = new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(JSON.stringify({ inputText: "Paddy crop tillering", dimensions: 1024, normalize: true }))
    });
    const res = await bedrock.send(cmd);
    const parsed = JSON.parse(Buffer.from(res.body).toString("utf-8"));
    console.log("[Bedrock Titan] SUCCESS! Vector generated, length:", parsed.embedding?.length);
  } catch (err: any) {
    console.log("[Bedrock Titan Error]", err.name, ":", err.message);
  }

  // Test 2: Mistral / Ministral model
  try {
    console.log("\nTesting Bedrock: mistral.ministral-8b-instruct or ministral-3b ...");
    const body = JSON.stringify({
      messages: [{ role: "user", content: "Hello, reply with one word: Ready" }],
      max_tokens: 20
    });
    const cmd = new InvokeModelCommand({
      modelId: "mistral.ministral-8b-instruct",
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(body)
    });
    const res = await bedrock.send(cmd);
    const parsed = JSON.parse(Buffer.from(res.body).toString("utf-8"));
    console.log("[Bedrock Ministral] SUCCESS! Response:", JSON.stringify(parsed).slice(0, 150));
  } catch (err: any) {
    console.log("[Bedrock Ministral Error]", err.name, ":", err.message);
  }
}

async function main() {
  const authenticated = await checkSTS();
  if (authenticated) {
    await checkBedrock();
  }
}

main().then(() => console.log("\nCheck finished.")).catch(e => console.error("Fatal:", e));
