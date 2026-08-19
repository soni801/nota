import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.NOTA_URL || "http://127.0.0.1:8787";
const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run seed -- <editions.json>");
  console.error("The file must be one edition object or an array of edition objects.");
  process.exit(1);
}

function ingestToken() {
  if (process.env.INGEST_TOKEN) return process.env.INGEST_TOKEN;
  try {
    const vars = readFileSync(join(root, ".dev.vars"), "utf8");
    const match = vars.match(/^INGEST_TOKEN=(.*)$/m);
    if (match) return match[1].trim();
  } catch {
    /* no .dev.vars */
  }
  throw new Error("INGEST_TOKEN is missing. Set it in .dev.vars or the environment.");
}

const raw = JSON.parse(readFileSync(resolve(inputPath), "utf8"));
const days = Array.isArray(raw) ? raw : [raw];
const token = ingestToken();

for (const day of days) {
  const res = await fetch(`${base}/api/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(day),
  });
  const body = await res.text();
  console.log(day.date, res.status, body);
  if (!res.ok) process.exit(1);
}

console.log(`Ingested ${days.length} edition(s) to ${base}`);
