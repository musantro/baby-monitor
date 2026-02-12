import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8080);
const appName = "baby-monitor";
const appLastUpdate = String(process.env.APP_LAST_UPDATE ?? Date.now());
const apiPrefix = "/api/v1";

const exchangeState = {
  offer: null,
  answer: null,
  modified_at: null
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

function collectJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("payload-too-large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid-json"));
      }
    });
    req.on("error", reject);
  });
}

function safePathFromUrl(urlPathname) {
  const rawPath = decodeURIComponent(urlPathname);
  const normalized = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, "");
  const noLeadingSlash = normalized.startsWith(path.sep) ? normalized.slice(1) : normalized;
  return path.join(distDir, noLeadingSlash || "index.html");
}

function serveStatic(req, res, urlPathname) {
  const filePath = safePathFromUrl(urlPathname);
  const fallbackPath = path.join(distDir, "index.html");

  let finalPath = filePath;
  if (!fs.existsSync(finalPath) || fs.statSync(finalPath).isDirectory()) {
    finalPath = fallbackPath;
  }
  if (!fs.existsSync(finalPath)) {
    sendJson(res, 404, { error: "dist-not-found", detail: "Run `npm run build` before starting server." });
    return;
  }

  const ext = path.extname(finalPath);
  const contentType = contentTypes[ext] ?? "application/octet-stream";
  const cacheControl = finalPath.endsWith("service-worker.js")
    ? "no-store"
    : "public, max-age=300";

  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": cacheControl });
  fs.createReadStream(finalPath).pipe(res);
}

async function handleExchange(req, res, reqUrl) {
  if (req.method === "GET") {
    const type = reqUrl.searchParams.get("type");
    if (type !== "offer" && type !== "answer") {
      sendJson(res, 400, { error: "invalid_type", detail: "type must be `offer` or `answer`." });
      return;
    }
    sendJson(res, 200, exchangeState[type] ?? {});
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  let body;
  try {
    body = await collectJsonBody(req);
  } catch (error) {
    if (error.message === "payload-too-large") {
      sendJson(res, 413, { error: "payload_too_large" });
      return;
    }
    sendJson(res, 400, { error: "invalid_json" });
    return;
  }

  if (body?.type === null) {
    exchangeState.offer = null;
    exchangeState.answer = null;
    exchangeState.modified_at = new Date().toISOString();
    sendJson(res, 200, { status: "exchange-cleared" });
    return;
  }

  if (body?.type === "offer") {
    exchangeState.offer = body;
    exchangeState.answer = null;
    exchangeState.modified_at = new Date().toISOString();
    sendJson(res, 200, { status: "offer-stored" });
    return;
  }

  if (body?.type === "answer") {
    exchangeState.answer = body;
    exchangeState.modified_at = new Date().toISOString();
    sendJson(res, 200, { status: "answer-stored" });
    return;
  }

  sendJson(res, 400, { error: "invalid_type", detail: "Only `offer`, `answer`, or null are supported." });
}

function handleAppUpdate(res, req) {
  const clientLastUpdate = String(req.headers["x-last-update"] ?? "0");
  const isUpdated = clientLastUpdate !== appLastUpdate;
  sendJson(res, 200, {
    app_name: appName,
    is_updated: isUpdated,
    last_update: appLastUpdate
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${port}`}`);
  const pathname = reqUrl.pathname;

  if (pathname === `${apiPrefix}/exchange`) {
    await handleExchange(req, res, reqUrl);
    return;
  }

  if (pathname === `${apiPrefix}/version`) {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }
    handleAppUpdate(res, req);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res, pathname);
    return;
  }

  sendJson(res, 404, { error: "not_found" });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`baby-monitor server running at http://${host}:${port}`);
});
