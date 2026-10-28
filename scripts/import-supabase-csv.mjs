import "dotenv/config";
import { parse } from "csv-parse/sync";
import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const { Pool } = pg;
const folder = process.argv[2];
if (!folder) {
  throw new Error("Usage: node scripts/import-supabase-csv.mjs <folder-containing-table-csv-files>");
}

const pool = new Pool({
  host: process.env.IMPORT_DB_HOST || "127.0.0.1",
  port: Number(process.env.IMPORT_DB_PORT || 5433),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const tables = {
  projects: {
    columns: [
      "id", "name", "summary", "description", "features", "stack", "href", "repo",
      "status", "image", "sort_order", "created_at", "updated_at",
    ],
    arrays: new Set(["features", "stack"]),
    defaults: { description: "", features: [], stack: [], sort_order: 0 },
  },
  certifications: {
    columns: [
      "id", "name", "issuer", "date", "url", "description", "sort_order", "created_at", "updated_at",
    ],
    defaults: { description: "", sort_order: 0 },
  },
  messages: {
    columns: ["id", "name", "email", "subject", "message", "is_read", "created_at", "read_at"],
    defaults: { is_read: false },
  },
  site_content: {
    columns: ["section", "data", "updated_at"],
    json: new Set(["data"]),
  },
};

function parsePgArray(value, column) {
  if (!value) return [];
  if (value.startsWith("[")) {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error(`${column} must contain a string array.`);
    }
    return parsed;
  }
  if (!value.startsWith("{") || !value.endsWith("}")) {
    throw new Error(`${column} is not a PostgreSQL array.`);
  }
  const items = [];
  let item = "";
  let quoted = false;
  let escaped = false;
  for (const char of value.slice(1, -1)) {
    if (escaped) {
      item += char;
      escaped = false;
    } else if (char === "\\" && quoted) {
      escaped = true;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      items.push(item);
      item = "";
    } else {
      item += char;
    }
  }
  if (item || value !== "{}") items.push(item);
  return items;
}

function normalizeValue(table, column, value, config) {
  if (value === undefined || value === "") return config.defaults?.[column] ?? null;
  if (config.arrays?.has(column)) return parsePgArray(value, column);
  if (config.json?.has(column)) return JSON.parse(value);
  if (column === "sort_order") {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new Error(`${table}.${column} is not an integer.`);
    return parsed;
  }
  if (column === "is_read") return value === true || value === "true";
  return value;
}

const fileNames = await readdir(folder);
const available = Object.keys(tables)
  .map((table) => ({ table, file: fileNames.find((name) => name.toLowerCase() === `${table}.csv`) }))
  .filter((entry) => entry.file);
if (available.length === 0) {
  throw new Error("No matching CSV files found. Expected projects.csv, certifications.csv, messages.csv, or site_content.csv.");
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const { table, file } of available) {
    const config = tables[table];
    const records = parse(await readFile(path.join(folder, file), "utf8"), {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: false,
    });
    const availableColumns = config.columns.filter((column) =>
      records.length === 0 || Object.hasOwn(records[0], column)
    );
    if (records.length > 0 && !availableColumns.includes(table === "site_content" ? "section" : "id")) {
      throw new Error(`${file} must include an ${table === "site_content" ? "section" : "id"} column.`);
    }
    const columns = availableColumns;
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const updates = columns
      .filter((column) => column !== "id")
      .map((column) => `${column}=EXCLUDED.${column}`)
      .join(", ");
    const conflictKey = table === "site_content" ? "section" : "id";
    const conflictAction = updates
      ? `DO UPDATE SET ${updates}`
      : "DO NOTHING";
    const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
      ON CONFLICT (${conflictKey}) ${conflictAction}`;
    for (const record of records) {
      const values = columns.map((column) =>
        normalizeValue(table, column, record[column], config)
      );
      await client.query(sql, values);
    }
    console.info(`Imported ${records.length} ${table} row(s) from ${file}.`);
  }
  await client.query("COMMIT");
  console.info("CSV import complete. Admin passwords are not imported; create/login with ADMIN_EMAIL and ADMIN_PASSWORD.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
