/**
 * FarmwiseAI AWS Infrastructure Provisioning Script
 * Provisions S3 buckets and DynamoDB tables for Team 06 in ap-south-1
 * Usage: npx tsx infra/scripts/provision-aws.ts
 */
import { S3Client, CreateBucketCommand, PutBucketEncryptionCommand, PutPublicAccessBlockCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import * as fs from "fs";

function loadEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      fs.readFileSync(".env.deploy", "utf-8")
        .split("\n").map(l => l.trim())
        .filter(l => l && !l.startsWith("#") && l.includes("="))
        .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const env = loadEnv();
const creds = {
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  sessionToken: env.AWS_SESSION_TOKEN
};
const region = "ap-south-1";
const prefix = env.RESOURCE_PREFIX || "fai-tce-team06";

const s3 = new S3Client({ region, credentials: creds });
const ddb = new DynamoDBClient({ region, credentials: creds });

const buckets = [`${prefix}-uploads`, `${prefix}-geodata`, `${prefix}-advisory`, `${prefix}-reports`];
const tables = [`${prefix}-runs`, `${prefix}-parcels`, `${prefix}-landrecords`, `${prefix}-refimages`, `${prefix}-advisory-chunks`, `${prefix}-chats`, `${prefix}-cache`];

async function ensureBucket(name: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: name }));
    console.log(`[S3] ✓ Already exists: ${name}`);
  } catch (e: any) {
    if (e.$metadata?.httpStatusCode === 404 || e.name === "NotFound" || e.name === "NoSuchBucket") {
      await s3.send(new CreateBucketCommand({ Bucket: name, CreateBucketConfiguration: { LocationConstraint: region } }));
      // Best-effort encryption — may not be permitted by event role IAM policy
      try {
        await s3.send(new PutBucketEncryptionCommand({
          Bucket: name,
          ServerSideEncryptionConfiguration: { Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }] }
        }));
      } catch (encErr: any) { console.log(`[S3] ⚠  Encryption skipped (${encErr.name}): ${encErr.message?.slice(0, 80)}`); }
      // Best-effort public access block
      try {
        await s3.send(new PutPublicAccessBlockCommand({
          Bucket: name,
          PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true }
        }));
      } catch (pubErr: any) { console.log(`[S3] ⚠  PublicAccessBlock skipped (${pubErr.name}): ${pubErr.message?.slice(0, 80)}`); }
      console.log(`[S3] ✅ Created: ${name}`);
    } else {
      console.log(`[S3] ⚠ ${name}: ${e.name} — ${e.message?.slice(0, 100)}`);
    }
  }
}

async function ensureTable(name: string) {
  try {
    await ddb.send(new DescribeTableCommand({ TableName: name }));
    console.log(`[DDB] ✓ Already exists: ${name}`);
  } catch (e: any) {
    if (e.name === "ResourceNotFoundException") {
      await ddb.send(new CreateTableCommand({
        TableName: name,
        AttributeDefinitions: [{ AttributeName: "PK", AttributeType: "S" }, { AttributeName: "SK", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "PK", KeyType: "HASH" }, { AttributeName: "SK", KeyType: "RANGE" }],
        BillingMode: "PAY_PER_REQUEST"
      }));
      console.log(`[DDB] ✅ Created (PAY_PER_REQUEST): ${name}`);
    } else {
      console.log(`[DDB] ⚠ ${name}: ${e.name} — ${e.message?.slice(0, 100)}`);
    }
  }
}

async function main() {
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(` FarmwiseAI AWS Infrastructure Provisioning`);
  console.log(` Team: ${prefix} | Region: ${region}`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  if (!creds.accessKeyId || !creds.secretAccessKey) {
    console.error("❌ ERROR: AWS credentials not found in .env.deploy");
    process.exit(1);
  }

  console.log("── S3 Buckets ──────────────────────────────────────────");
  for (const b of buckets) await ensureBucket(b);

  console.log("\n── DynamoDB Tables ─────────────────────────────────────");
  for (const t of tables) await ensureTable(t);

  console.log("\n✅ Provisioning complete.");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
