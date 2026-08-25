"use strict";

const http = require("http");
const { createApp } = require("./app");
const { seedUserMap } = require("./seed-users");

function createServer(options = {}) {
  const app = options.app || createApp({ users: options.users || seedUserMap() });
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let result;
      try {
        result = app.handle({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: raw,
        });
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "server_error" }));
        return;
      }
      res.statusCode = result.status;
      for (const [k, v] of Object.entries(result.headers || {})) {
        res.setHeader(k, v);
      }
      res.end(result.body || "");
    });
  });
  return { server, app };
}

function main() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "0.0.0.0";
  const { server } = createServer();
  server.listen(port, host, () => {
    process.stdout.write(`scamtrail listening on ${host}:${port}\n`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { createServer, main };
