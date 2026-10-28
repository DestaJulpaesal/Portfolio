import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const {
  projects,
  certifications,
  defaultProfileData,
  defaultAboutData,
  defaultSkillsData,
} = await import("../src/data/content.ts");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_LOCAL_PORT || 5433),
  database: process.env.DB_NAME || "portfolio",
  user: process.env.DB_USER || "portfolio",
  password: process.env.DB_PASSWORD,
});

const client = await pool.connect();
try {
  await client.query("BEGIN");

  const projectCount = await client.query("SELECT count(*)::int AS count FROM projects");
  if (projectCount.rows[0].count === 0) {
    for (const [sortOrder, project] of projects.entries()) {
      await client.query(
        `INSERT INTO projects
          (name, summary, description, features, stack, href, repo, status, image, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          project.name,
          project.summary,
          project.description,
          project.features,
          project.stack,
          project.href ?? null,
          project.repo ?? null,
          project.status,
          project.image ?? null,
          sortOrder,
        ]
      );
    }
    console.info(`Added ${projects.length} default projects.`);
  } else {
    console.info(`Skipped projects: database already has ${projectCount.rows[0].count} row(s).`);
  }

  const certificationCount = await client.query(
    "SELECT count(*)::int AS count FROM certifications"
  );
  if (certificationCount.rows[0].count === 0) {
    for (const [sortOrder, certification] of certifications.entries()) {
      await client.query(
        `INSERT INTO certifications (name, issuer, date, url, description, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          certification.name,
          certification.issuer,
          certification.date,
          certification.url ?? null,
          certification.description,
          sortOrder,
        ]
      );
    }
    console.info(`Added ${certifications.length} default certifications.`);
  } else {
    console.info(
      `Skipped certifications: database already has ${certificationCount.rows[0].count} row(s).`
    );
  }

  const contentCount = await client.query("SELECT count(*)::int AS count FROM site_content");
  if (contentCount.rows[0].count === 0) {
    const defaults = {
      profile: defaultProfileData(),
      about: defaultAboutData(),
      skills: defaultSkillsData(),
    };
    for (const [section, data] of Object.entries(defaults)) {
      await client.query(
        "INSERT INTO site_content (section, data) VALUES ($1, $2)",
        [section, JSON.stringify(data)]
      );
    }
    console.info("Added default profile, about, and skills content.");
  } else {
    console.info(`Skipped site content: database already has ${contentCount.rows[0].count} row(s).`);
  }

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
