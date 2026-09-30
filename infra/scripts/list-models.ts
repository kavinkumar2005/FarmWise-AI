import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";
import * as fs from "fs";

const raw = fs.readFileSync(".env.deploy", "utf-8");
const env = Object.fromEntries(
  raw.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const client = new BedrockClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN
  }
});

async function main() {
  const res = await client.send(new ListFoundationModelsCommand({}));
  const models = res.modelSummaries?.map(m => ({
    id: m.modelId,
    name: m.modelName,
    provider: m.providerName
  })) || [];
  
  console.log(`Found ${models.length} foundation models in ap-south-1:`);
  models.filter(m => m.provider?.toLowerCase().includes("mistral") || m.id?.includes("ministral") || m.id?.includes("titan")).forEach(m => {
    console.log(`- ${m.id} (${m.name}) by ${m.provider}`);
  });
}

main().catch(e => console.error("Error listing models:", e.name, e.message));
