import { BedrockClient } from "../../packages/agent-core/src/models/bedrock-client.js";

async function test() {
  const client = new BedrockClient();
  
  console.log("1. Testing BedrockClient.invoke() with mistral.ministral-3-8b-instruct ...");
  const res = await client.invoke({
    modelId: "mistral.ministral-3-8b-instruct",
    prompt: "Provide 2 bullet points for paddy fertilizer application in Tamil Nadu."
  });
  console.log("Invoke Result:\n", res.text);
  console.log("Cost USD:", res.estimatedCostUSD, "Latency ms:", res.latencyMs);

  console.log("\n2. Testing BedrockClient.embedText() with Titan Text Embed V2 ...");
  const vec = await client.embedText("Paddy stem borer IPM");
  console.log("Embedding vector length:", vec.length);
}

test().catch(e => console.error("Error:", e));
