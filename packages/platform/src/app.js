"use strict";

const {
  login,
  lookupSession,
} = require("./auth");
const {
  submitReport,
  defaultGrants,
  createHashReceipt,
  createAuditLog,
  readP2,
} = require("../../intake/src");

function parseCookie(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function parseBody(contentType, raw) {
  const text = raw == null ? "" : String(raw);
  if (!text) return {};
  if (contentType && contentType.includes("application/json")) {
    return JSON.parse(text);
  }
  const fields = {};
  for (const pair of text.split("&")) {
    if (!pair) continue;
    const [k, v = ""] = pair.split("=");
    fields[decodeURIComponent(k.replace(/\+/g, " "))] = decodeURIComponent(
      v.replace(/\+/g, " ")
    );
  }
  return fields;
}

function wantsJson(headers, body) {
  const accept = String((headers && headers.accept) || "");
  const ct = String((headers && (headers["content-type"] || headers.contentType)) || "");
  return accept.includes("application/json") || ct.includes("application/json") || (body && body.json === true);
}

function htmlPage(title, inner) {
  return `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1rem; color: #122; }
  h1 { font-size: 1.4rem; }
  .tag { color: #4a8991; }
  label { display: block; margin: 0.75rem 0 0.25rem; }
  input { width: 100%; padding: 0.5rem; }
  button { margin-top: 1rem; padding: 0.5rem 1rem; }
  .card { border: 1px solid #cfe; padding: 1rem; border-radius: 8px; }
</style>
<body>
  <p class="tag">诈迹 · ScamTrail</p>
  <p>每个骗局，都会留下痕迹。 Every scam leaves a trail.</p>
  ${inner}
</body>
</html>`;
}

function createApp(options = {}) {
  const users = options.users;
  const sessions = options.sessions || new Map();
  const audit = options.audit || createAuditLog();

  function currentUser(headers) {
    const cookies = parseCookie(headers && (headers.cookie || headers.Cookie));
    const session = lookupSession(cookies.st_session, sessions);
    return session ? session.user : null;
  }

  function handle(req) {
    const method = (req.method || "GET").toUpperCase();
    const url = new URL(req.url || "/", "http://local");
    const path = url.pathname;
    const headers = req.headers || {};
    let fields = {};
    try {
      fields = parseBody(headers["content-type"] || headers["Content-Type"], req.body);
    } catch {
      return { status: 400, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: false, error: "bad_json" }) };
    }

    if (method === "GET" && path === "/health") {
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true, service: "scamtrail-gray" }),
      };
    }

    if (method === "GET" && (path === "/" || path === "/login")) {
      const user = currentUser(headers);
      if (user && path === "/") {
        return { status: 302, headers: { location: "/app" }, body: "" };
      }
      return {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: htmlPage(
          "登录 · 诈迹",
          `<div class="card"><h1>登录</h1>
           <form method="post" action="/login">
             <label>Email</label><input name="email" type="email" required/>
             <label>Password</label><input name="password" type="password" required/>
             <button type="submit">Sign in</button>
           </form></div>`
        ),
      };
    }

    if (method === "POST" && path === "/login") {
      try {
        const result = login({
          email: fields.email,
          password: fields.password,
          users,
          sessions,
        });
        const cookie = `st_session=${encodeURIComponent(result.session.token)}; HttpOnly; Path=/; SameSite=Lax`;
        if (wantsJson(headers, fields)) {
          return {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie": cookie,
            },
            body: JSON.stringify({
              ok: true,
              signed_in: true,
              user: result.user,
              role: result.user.role,
              email: result.user.email,
            }),
          };
        }
        return {
          status: 302,
          headers: { location: "/app", "set-cookie": cookie },
          body: "",
        };
      } catch (err) {
        if (err.code === "INVALID_CREDENTIALS") {
          return {
            status: 401,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ok: false, signed_in: false, error: "INVALID_CREDENTIALS" }),
          };
        }
        throw err;
      }
    }

    if (method === "GET" && path === "/me") {
      const user = currentUser(headers);
      if (!user) {
        return {
          status: 401,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ok: false, signed_in: false, anonymous: true }),
        };
      }
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: true,
          signed_in: true,
          anonymous: false,
          user,
          role: user.role,
          email: user.email,
        }),
      };
    }

    if (method === "GET" && path === "/app") {
      const user = currentUser(headers);
      if (!user) {
        return { status: 302, headers: { location: "/login" }, body: "" };
      }
      return {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: htmlPage(
          "工作台 · 诈迹",
          `<div class="card"><h1>已登录</h1>
           <p>email: ${user.email}</p>
           <p>role: ${user.role}</p>
           <p>Follow the trail. 追踪诈迹。</p>
           <p>投稿进入隔离，不会自动公开。</p></div>`
        ),
      };
    }

    if (method === "POST" && path === "/api/reports/submit") {
      const user = currentUser(headers);
      if (!user) {
        return {
          status: 401,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ok: false, signed_in: false }),
        };
      }
      const submitted = submitReport({
        report: {
          id: fields.id || `RPT-${Date.now()}`,
          report_type: fields.report_type || "observation",
          status: "draft",
        },
        consents: fields.consents || defaultGrants(),
      });
      return {
        status: 202,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true, report: submitted, signed_in: true, user }),
      };
    }

    if (method === "POST" && path === "/api/evidence/receipt") {
      const user = currentUser(headers);
      if (!user) {
        return {
          status: 401,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ok: false, signed_in: false }),
        };
      }
      const bytes = Buffer.from(fields.bytes_utf8 || "synthetic evidence");
      const receipt = createHashReceipt({
        bytes,
        mimeType: fields.mime_type || "application/octet-stream",
        privacyClass: fields.privacy_class || "P2",
      });
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true, receipt, signed_in: true, user }),
      };
    }

    if (method === "POST" && path === "/api/p2/read") {
      const user = currentUser(headers);
      if (!user) {
        return {
          status: 401,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ok: false, signed_in: false }),
        };
      }
      try {
        const result = readP2({
          log: audit,
          role: user.role,
          purposeCode: fields.purpose_code,
          evidenceId: fields.evidence_id || "E-SYNTH",
          actorId: user.id,
        });
        return {
          status: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ok: true,
            ...result,
            signed_in: true,
            user,
            audit_count: audit.list().length,
          }),
        };
      } catch (err) {
        return {
          status: err.code === "P2_FORBIDDEN" ? 403 : 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ok: false, error: err.code, signed_in: true, user }),
        };
      }
    }

    return {
      status: 404,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "not_found" }),
    };
  }

  return { handle, sessions, audit };
}

module.exports = { createApp, parseCookie };
