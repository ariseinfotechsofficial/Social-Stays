/**
 * Database backup and restore, without needing MongoDB's command-line tools.
 *
 *   npm run backup                      → backups/2026-10-27T02-00/<collection>.json (keeps the newest 14)
 *   npm run restore -- backups/<folder> → replaces every collection with the backup (asks no questions: be sure)
 *
 * On a VPS, run the backup daily from cron and copy the backups folder (and UPLOADS_DIR) off the server.
 * Files are Extended JSON, so ids and dates restore exactly.
 */
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../db.js";

const EJSON = mongoose.mongo.BSON.EJSON;
const ROOT = path.resolve(process.env.BACKUP_DIR || "backups");
const KEEP = Number(process.env.BACKUP_KEEP || 14);

async function backup() {
  const stamp = new Date().toISOString().slice(0, 16).replace(":", "-");
  const dir = path.join(ROOT, stamp);
  await fs.mkdir(dir, { recursive: true });
  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const docs = await db.collection(c.name).find().toArray();
    await fs.writeFile(path.join(dir, `${c.name}.json`), EJSON.stringify(docs, undefined, 0, { relaxed: false }));
    console.info(`[backup] ${c.name}: ${docs.length}`);
  }
  const all = (await fs.readdir(ROOT)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP))) await fs.rm(path.join(ROOT, old), { recursive: true, force: true });
  console.info(`[backup] saved to ${dir}`);
}

async function restore(dir: string) {
  const db = mongoose.connection.db!;
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const name = f.replace(/\.json$/, "");
    const docs = EJSON.parse(await fs.readFile(path.join(dir, f), "utf8"), { relaxed: false }) as Record<string, unknown>[];
    await db.collection(name).deleteMany({});
    if (docs.length) await db.collection(name).insertMany(docs);
    console.info(`[restore] ${name}: ${docs.length}`);
  }
}

async function main() {
  await connectDb();
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "restore") {
    if (!arg) throw new Error("Usage: npm run restore -- backups/<folder>");
    await restore(path.resolve(arg));
  } else await backup();
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
