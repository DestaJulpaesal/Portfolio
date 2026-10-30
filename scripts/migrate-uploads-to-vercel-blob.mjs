import "dotenv/config";
import { put } from "@vercel/blob";
import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

const { Pool } = pg;
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || "uploads");
const contentTypes = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL to the Neon connection string before migrating uploads.");
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("Set BLOB_READ_WRITE_TOKEN before migrating uploads.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function collectUploadPaths(value, paths) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\/uploads\/([^?#\s"'<>]+)/g)) {
      const relativePath = decodeURIComponent(match[1]);
      if (relativePath && !relativePath.split("/").includes("..")) paths.add(relativePath);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUploadPaths(item, paths);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectUploadPaths(item, paths);
  }
}

function replaceUploadUrls(value, urlMap) {
  if (typeof value === "string") {
    let updated = value;
    for (const [relativePath, url] of urlMap) {
      updated = updated.replaceAll(`/uploads/${relativePath}`, url);
    }
    return updated;
  }
  if (Array.isArray(value)) return value.map((item) => replaceUploadUrls(item, urlMap));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceUploadUrls(item, urlMap)])
    );
  }
  return value;
}

async function main() {
  const projectResult = await pool.query("SELECT id, image FROM projects WHERE image IS NOT NULL");
  const contentResult = await pool.query("SELECT section, data FROM site_content");
  const paths = new Set();
  collectUploadPaths(projectResult.rows, paths);
  collectUploadPaths(contentResult.rows, paths);

  if (paths.size === 0) {
    console.info("No database references to /uploads/ were found; nothing to migrate.");
    return;
  }

  const urlMap = new Map();
  for (const relativePath of paths) {
    const sourcePath = path.resolve(uploadsDir, ...relativePath.split("/"));
    if (!sourcePath.startsWith(`${uploadsDir}${path.sep}`)) {
      throw new Error(`Upload path is outside UPLOADS_DIR: ${relativePath}`);
    }
    const body = await readFile(sourcePath);
    const contentType = contentTypes[path.extname(sourcePath).toLowerCase()];
    if (!contentType) throw new Error(`Unsupported upload file type: ${relativePath}`);
    const blob = await put(`uploads/${relativePath}`, body, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });
    urlMap.set(relativePath, blob.url);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const project of projectResult.rows) {
      const image = replaceUploadUrls(project.image, urlMap);
      if (image !== project.image) {
        await client.query("UPDATE projects SET image=$1, updated_at=now() WHERE id=$2", [
          image,
          project.id,
        ]);
      }
    }
    for (const section of contentResult.rows) {
      const data = replaceUploadUrls(section.data, urlMap);
      if (JSON.stringify(data) !== JSON.stringify(section.data)) {
        await client.query("UPDATE site_content SET data=$1, updated_at=now() WHERE section=$2", [
          JSON.stringify(data),
          section.section,
        ]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  console.info(`Migrated ${urlMap.size} referenced upload(s) to Vercel Blob and updated Neon.`);
}

try {
  await main();
} finally {
  await pool.end();
}
