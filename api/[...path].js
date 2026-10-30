import { app, initializeDatabase } from "../server/index.js";

await initializeDatabase();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  const url = req.url || "/";
  const queryIndex = url.indexOf("?");
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
  if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    req.url = `/api${pathname === "/" ? "" : pathname}${queryIndex === -1 ? "" : url.slice(queryIndex)}`;
  }
  return app(req, res);
}
