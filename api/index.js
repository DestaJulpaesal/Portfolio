import { app, initializeDatabase } from "../server/index.js";

await initializeDatabase();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  const url = new URL(req.url || "/api", "http://localhost");
  const route = url.searchParams.get("__route");
  if (route !== null) {
    url.searchParams.delete("__route");
    url.pathname = `/api${route ? `/${route}` : ""}`;
    req.url = `${url.pathname}${url.search}`;
  }
  return app(req, res);
}
