import "dotenv/config";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import multer from "multer";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadsDir = path.resolve(root, process.env.UPLOADS_DIR || "uploads");
const port = Number(process.env.PORT || 3001);
const cookieName = "portfolio_admin";
const sessionDurationMs = 8 * 60 * 60 * 1000;
const secureCookies = process.env.COOKIE_SECURE === undefined
  ? process.env.NODE_ENV === "production"
  : process.env.COOKIE_SECURE === "true";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validRoles = new Set(["owner", "editor"]);
const validStatuses = new Set(["live", "source-only", "in-progress", "archived"]);
const validSections = new Set(["profile", "about", "skills"]);
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || "portfolio",
        user: process.env.DB_USER || "portfolio",
        password: process.env.DB_PASSWORD,
      }
);
const app = express();
const loginAttempts = new Map();
const contactAttempts = new Map();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    callback(null, ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.mimetype));
  },
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET wajib diisi dengan minimal 32 karakter.");
}
if (!process.env.ADMIN_EMAIL || !emailPattern.test(process.env.ADMIN_EMAIL)) {
  throw new Error("ADMIN_EMAIL wajib diisi dengan alamat email yang valid.");
}
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
  throw new Error("ADMIN_PASSWORD wajib diisi dengan minimal 12 karakter.");
}

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const store of [loginAttempts, contactAttempts]) {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }
}, 15 * 60 * 1000);
rateLimitCleanup.unref();

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

function requireText(value, label, maxLength = 10000) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new HttpError(400, `${label} wajib diisi (maksimal ${maxLength} karakter).`);
  }
  return value.trim();
}

function optionalText(value, label, maxLength = 2000) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new HttpError(400, `${label} maksimal ${maxLength} karakter.`);
  }
  return value.trim() || null;
}

function textArray(value, label) {
  if (!Array.isArray(value) || value.length > 100 || value.some((entry) => typeof entry !== "string" || entry.length > 500)) {
    throw new HttpError(400, `${label} harus berupa daftar teks yang valid.`);
  }
  return value;
}

function parseId(req, res, next) {
  if (!validId.test(req.params.id)) return sendError(res, 400, "ID tidak valid.");
  next();
}

function sessionFromRequest(req) {
  const token = req.cookies?.[cookieName];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const session = sessionFromRequest(req);
  if (!session?.sub) return sendError(res, 401, "Silakan masuk untuk melanjutkan.");
  try {
    const { rows } = await pool.query(
      "SELECT id, email, role FROM admin_users WHERE id = $1",
      [session.sub]
    );
    if (!rows[0]) return sendError(res, 401, "Sesi admin sudah tidak berlaku.");
    req.admin = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function requireOwner(req, res, next) {
  if (req.admin.role !== "owner") return sendError(res, 403, "Hanya owner yang dapat melakukan tindakan ini.");
  next();
}

function rateLimit(store, limit, windowMs) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.expiresAt <= now) {
      store.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }
    if (entry.count >= limit) {
      res.set("Retry-After", String(Math.ceil((entry.expiresAt - now) / 1000)));
      return sendError(res, 429, "Terlalu banyak percobaan. Coba lagi beberapa saat.");
    }
    entry.count += 1;
    next();
  };
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get("/api/health", asyncRoute(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
}));

app.get("/api/auth/session", asyncRoute(async (req, res) => {
  const session = sessionFromRequest(req);
  if (!session?.sub) return res.json({ session: null });
  const { rows } = await pool.query(
    "SELECT id, email, role FROM admin_users WHERE id = $1",
    [session.sub]
  );
  const admin = rows[0];
  if (!admin) {
    res.clearCookie(cookieName, { httpOnly: true, sameSite: "strict", secure: secureCookies, path: "/" });
    return res.json({ session: null });
  }
  res.json({ session: { user: { id: admin.id, email: admin.email }, role: admin.role } });
}));

app.post("/api/auth/login", rateLimit(loginAttempts, 10, 15 * 60 * 1000), asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (req.body?.website || !emailPattern.test(email) || password.length > 200) {
    return sendError(res, 401, "Email atau password salah.");
  }
  const { rows } = await pool.query(
    "SELECT id, email, role, password_hash FROM admin_users WHERE lower(email) = $1",
    [email]
  );
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return sendError(res, 401, "Email atau password salah.");
  }
  const token = jwt.sign({ sub: admin.id }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookies,
    maxAge: sessionDurationMs,
    path: "/",
  });
  res.json({ session: { user: { id: admin.id, email: admin.email }, role: admin.role } });
}));

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookies,
    path: "/",
  });
  res.status(204).end();
});

app.get("/api/projects", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC"
  );
  res.json(rows);
}));

app.post("/api/projects", requireAuth, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const status = requireText(body.status, "Status", 32);
  if (!validStatuses.has(status)) return sendError(res, 400, "Status proyek tidak valid.");
  const values = [
    requireText(body.name, "Nama", 200),
    requireText(body.summary, "Ringkasan", 1000),
    typeof body.description === "string" ? body.description : "",
    textArray(body.features, "Fitur"),
    textArray(body.stack, "Stack"),
    optionalText(body.href, "URL demo"),
    optionalText(body.repo, "URL repositori"),
    status,
    optionalText(body.image, "URL gambar"),
    Number.isInteger(body.sort_order) ? body.sort_order : 0,
  ];
  const { rows } = await pool.query(
    `INSERT INTO projects (name, summary, description, features, stack, href, repo, status, image, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    values
  );
  res.status(201).json(rows[0]);
}));

app.put("/api/projects/:id", requireAuth, parseId, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const status = requireText(body.status, "Status", 32);
  if (!validStatuses.has(status)) return sendError(res, 400, "Status proyek tidak valid.");
  const values = [
    requireText(body.name, "Nama", 200),
    requireText(body.summary, "Ringkasan", 1000),
    typeof body.description === "string" ? body.description : "",
    textArray(body.features, "Fitur"),
    textArray(body.stack, "Stack"),
    optionalText(body.href, "URL demo"),
    optionalText(body.repo, "URL repositori"),
    status,
    optionalText(body.image, "URL gambar"),
    Number.isInteger(body.sort_order) ? body.sort_order : 0,
    req.params.id,
  ];
  const { rows } = await pool.query(
    `UPDATE projects SET name=$1, summary=$2, description=$3, features=$4, stack=$5,
     href=$6, repo=$7, status=$8, image=$9, sort_order=$10, updated_at=now()
     WHERE id=$11 RETURNING *`,
    values
  );
  if (!rows[0]) return sendError(res, 404, "Proyek tidak ditemukan.");
  res.json(rows[0]);
}));

app.delete("/api/projects/:id", requireAuth, parseId, asyncRoute(async (req, res) => {
  const result = await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
  if (!result.rowCount) return sendError(res, 404, "Proyek tidak ditemukan.");
  res.status(204).end();
}));

app.put("/api/projects/reorder", requireAuth, asyncRoute(async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length > 1000 || ids.some((id) => typeof id !== "string" || !validId.test(id))) {
    return sendError(res, 400, "Daftar urutan proyek tidak valid.");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [index, id] of ids.entries()) {
      await client.query("UPDATE projects SET sort_order=$1, updated_at=now() WHERE id=$2", [index, id]);
    }
    await client.query("COMMIT");
    res.status(204).end();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.get("/api/certifications", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM certifications ORDER BY sort_order ASC, created_at DESC"
  );
  res.json(rows);
}));

app.post("/api/certifications", requireAuth, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const values = [
    requireText(body.name, "Nama", 200),
    requireText(body.issuer, "Penerbit", 200),
    requireText(body.date, "Tanggal", 100),
    optionalText(body.url, "URL"),
    typeof body.description === "string" ? body.description : "",
    Number.isInteger(body.sort_order) ? body.sort_order : 0,
  ];
  const { rows } = await pool.query(
    `INSERT INTO certifications (name, issuer, date, url, description, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    values
  );
  res.status(201).json(rows[0]);
}));

app.put("/api/certifications/:id", requireAuth, parseId, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const values = [
    requireText(body.name, "Nama", 200),
    requireText(body.issuer, "Penerbit", 200),
    requireText(body.date, "Tanggal", 100),
    optionalText(body.url, "URL"),
    typeof body.description === "string" ? body.description : "",
    Number.isInteger(body.sort_order) ? body.sort_order : 0,
    req.params.id,
  ];
  const { rows } = await pool.query(
    `UPDATE certifications SET name=$1, issuer=$2, date=$3, url=$4, description=$5,
     sort_order=$6, updated_at=now() WHERE id=$7 RETURNING *`,
    values
  );
  if (!rows[0]) return sendError(res, 404, "Sertifikasi tidak ditemukan.");
  res.json(rows[0]);
}));

app.delete("/api/certifications/:id", requireAuth, parseId, asyncRoute(async (req, res) => {
  const result = await pool.query("DELETE FROM certifications WHERE id=$1", [req.params.id]);
  if (!result.rowCount) return sendError(res, 404, "Sertifikasi tidak ditemukan.");
  res.status(204).end();
}));

app.put("/api/certifications/reorder", requireAuth, asyncRoute(async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length > 1000 || ids.some((id) => typeof id !== "string" || !validId.test(id))) {
    return sendError(res, 400, "Daftar urutan sertifikasi tidak valid.");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [index, id] of ids.entries()) {
      await client.query("UPDATE certifications SET sort_order=$1, updated_at=now() WHERE id=$2", [index, id]);
    }
    await client.query("COMMIT");
    res.status(204).end();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.post("/api/messages", rateLimit(contactAttempts, 5, 60 * 60 * 1000), asyncRoute(async (req, res) => {
  const body = req.body || {};
  if (body.website) return res.status(204).end();
  const name = requireText(body.name, "Nama", 120);
  const email = requireText(body.email, "Email", 254).toLowerCase();
  const subject = optionalText(body.subject, "Subjek", 200);
  const message = requireText(body.message, "Pesan", 5000);
  if (!emailPattern.test(email)) return sendError(res, 400, "Alamat email tidak valid.");
  await pool.query(
    "INSERT INTO messages (name,email,subject,message) VALUES ($1,$2,$3,$4)",
    [name, email, subject, message]
  );
  res.status(201).json({ status: "ok" });
}));

app.get("/api/messages", requireAuth, asyncRoute(async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
  res.json(rows);
}));

app.patch("/api/messages/:id/read", requireAuth, parseId, asyncRoute(async (req, res) => {
  if (typeof req.body?.is_read !== "boolean") return sendError(res, 400, "Status baca tidak valid.");
  const { rows } = await pool.query(
    "UPDATE messages SET is_read=$1, read_at=$2 WHERE id=$3 RETURNING *",
    [req.body.is_read, req.body.is_read ? new Date() : null, req.params.id]
  );
  if (!rows[0]) return sendError(res, 404, "Pesan tidak ditemukan.");
  res.json(rows[0]);
}));

app.delete("/api/messages/:id", requireAuth, parseId, asyncRoute(async (req, res) => {
  const result = await pool.query("DELETE FROM messages WHERE id=$1", [req.params.id]);
  if (!result.rowCount) return sendError(res, 404, "Pesan tidak ditemukan.");
  res.status(204).end();
}));

app.get("/api/site-content/:section", asyncRoute(async (req, res) => {
  if (!validSections.has(req.params.section)) return sendError(res, 400, "Section tidak valid.");
  const { rows } = await pool.query(
    "SELECT data FROM site_content WHERE section=$1",
    [req.params.section]
  );
  res.json(rows[0]?.data ?? null);
}));

app.put("/api/site-content/:section", requireAuth, asyncRoute(async (req, res) => {
  if (!validSections.has(req.params.section)) return sendError(res, 400, "Section tidak valid.");
  if (req.body?.data === undefined) return sendError(res, 400, "Data konten wajib diisi.");
  const { rows } = await pool.query(
    `INSERT INTO site_content (section, data) VALUES ($1, $2)
     ON CONFLICT (section) DO UPDATE SET data=EXCLUDED.data, updated_at=now()
     RETURNING data`,
    [req.params.section, JSON.stringify(req.body.data)]
  );
  res.json(rows[0].data);
}));

app.get("/api/admin-users", requireAuth, requireOwner, asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, email, role, created_at FROM admin_users ORDER BY created_at ASC"
  );
  res.json(rows);
}));

app.post("/api/admin-users", requireAuth, requireOwner, asyncRoute(async (req, res) => {
  const email = requireText(req.body?.email, "Email", 254).toLowerCase();
  const password = requireText(req.body?.password, "Password", 200);
  const role = requireText(req.body?.role, "Role", 10);
  if (!emailPattern.test(email)) return sendError(res, 400, "Alamat email tidak valid.");
  if (password.length < 12) return sendError(res, 400, "Password harus minimal 12 karakter.");
  if (!validRoles.has(role)) return sendError(res, 400, "Role tidak valid.");
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO admin_users (email,password_hash,role) VALUES ($1,$2,$3)
     RETURNING id,email,role,created_at`,
    [email, passwordHash, role]
  );
  res.status(201).json(rows[0]);
}));

app.patch("/api/admin-users/:id/role", requireAuth, requireOwner, parseId, asyncRoute(async (req, res) => {
  const role = requireText(req.body?.role, "Role", 10);
  if (!validRoles.has(role)) return sendError(res, 400, "Role tidak valid.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: owners } = await client.query(
      "SELECT id FROM admin_users WHERE role='owner' FOR UPDATE"
    );
    const { rows: target } = await client.query(
      "SELECT id,role FROM admin_users WHERE id=$1",
      [req.params.id]
    );
    if (!target[0]) {
      await client.query("ROLLBACK");
      return sendError(res, 404, "Admin tidak ditemukan.");
    }
    if (target[0].role === "owner" && role !== "owner" && owners.length <= 1) {
      await client.query("ROLLBACK");
      return sendError(res, 409, "Tidak bisa menurunkan owner terakhir.");
    }
    const { rows } = await client.query(
      "UPDATE admin_users SET role=$1 WHERE id=$2 RETURNING id,email,role,created_at",
      [role, req.params.id]
    );
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.delete("/api/admin-users/:id", requireAuth, requireOwner, parseId, asyncRoute(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: owners } = await client.query(
      "SELECT id FROM admin_users WHERE role='owner' FOR UPDATE"
    );
    const { rows: target } = await client.query(
      "SELECT id,role FROM admin_users WHERE id=$1",
      [req.params.id]
    );
    if (!target[0]) {
      await client.query("ROLLBACK");
      return sendError(res, 404, "Admin tidak ditemukan.");
    }
    if (target[0].role === "owner" && owners.length <= 1) {
      await client.query("ROLLBACK");
      return sendError(res, 409, "Tidak bisa menghapus owner terakhir.");
    }
    await client.query("DELETE FROM admin_users WHERE id=$1", [req.params.id]);
    await client.query("COMMIT");
    res.status(204).end();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.post("/api/uploads", requireAuth, upload.single("file"), asyncRoute(async (req, res) => {
  if (!req.file) return sendError(res, 400, "Pilih file gambar PNG, JPG, WebP, GIF, atau AVIF (maksimal 5 MB).");
  const folder = ["projects", "certifications", "profile"].includes(req.body?.folder)
    ? req.body.folder
    : "projects";
  const extension = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  }[req.file.mimetype];
  const filename = `${randomUUID()}${extension}`;
  const folderPath = path.join(uploadsDir, folder);
  await mkdir(folderPath, { recursive: true });
  await writeFile(path.join(folderPath, filename), req.file.buffer, { flag: "wx" });
  res.status(201).json({ url: `/uploads/${folder}/${filename}` });
}));

await pool.query(await readFile(path.join(root, "server", "schema.sql"), "utf8"));
await mkdir(uploadsDir, { recursive: true });
const adminCount = await pool.query("SELECT count(*)::int AS count FROM admin_users");
if (adminCount.rows[0].count === 0) {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await pool.query(
    "INSERT INTO admin_users (email,password_hash,role) VALUES ($1,$2,'owner')",
    [process.env.ADMIN_EMAIL.trim().toLowerCase(), passwordHash]
  );
  console.info("Initial owner account created from ADMIN_EMAIL.");
}

const distDir = path.join(root, "dist");
app.use("/uploads", express.static(uploadsDir, { maxAge: "1d", immutable: true }));
app.use(express.static(distDir));
app.get(/^(?!\/api\/).*/, asyncRoute(async (_req, res, next) => {
  try {
    res.sendFile(path.join(distDir, "index.html"));
  } catch {
    next();
  }
}));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return sendError(res, error.code === "LIMIT_FILE_SIZE" ? 413 : 400, "Upload gagal: file harus berupa gambar dan maksimal 5 MB.");
  }
  if (error?.code === "23505") return sendError(res, 409, "Data dengan nilai tersebut sudah ada.");
  if (error instanceof HttpError) return sendError(res, error.status, error.message);
  if (error?.status === 400) return sendError(res, 400, "Format permintaan tidak valid.");
  if (error?.status === 413) return sendError(res, 413, "Ukuran permintaan terlalu besar.");
  console.error("API error:", error);
  sendError(res, 500, "Terjadi kesalahan server.");
});

const server = app.listen(port, "0.0.0.0", () => {
  console.info(`Portfolio API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    clearInterval(rateLimitCleanup);
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
