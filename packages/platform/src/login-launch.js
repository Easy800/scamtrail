"use strict";

const http = require("http");
const { createServer } = require("./server");
const { seedUserMap, OWNER_EMAIL, OWNER_PASSWORD } = require("./seed-users");

function request(port, { method, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        method,
        path,
        headers: headers || {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function launchOnce() {
  const users = seedUserMap();
  const { server } = createServer({ users });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  try {
    const loginBody = JSON.stringify({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
    const loginRes = await request(port, {
      method: "POST",
      path: "/login",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "content-length": Buffer.byteLength(loginBody),
      },
      body: loginBody,
    });
    const setCookie = loginRes.headers["set-cookie"] || [];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : String(setCookie);
    const meRes = await request(port, {
      method: "GET",
      path: "/me",
      headers: { cookie: cookieHeader, accept: "application/json" },
    });
    const me = JSON.parse(meRes.body);
    if (!me.signed_in || me.anonymous || !me.email || !me.role) {
      throw new Error(`not signed in: ${meRes.body}`);
    }
    console.log("SIGNED_IN_BODY");
    console.log(meRes.body);
    return me;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  launchOnce().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exit(1);
  });
}

module.exports = { launchOnce };
