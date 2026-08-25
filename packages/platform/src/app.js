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
const { seedIntakeFixtures, summarizeCampaigns } = require("./seed-fixtures");

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

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlPage(title, inner) {
  return `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<style>
  :root { --ink:#1b2422; --muted:#5c6b68; --line:#d7e3df; --paper:#f7f4ee; --card:#fff; --accent:#1f5c4e; --warn:#8a3b12; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:"Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", serif; background:var(--paper); color:var(--ink); }
  header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; padding:1.25rem 1.5rem; border-bottom:1px solid var(--line); background:#fff; }
  header strong { display:block; letter-spacing:.04em; }
  header span { color:var(--muted); font-size:.92rem; }
  main { max-width: 72rem; margin: 0 auto; padding: 1.25rem 1.5rem 3rem; }
  h1 { font-size: 1.35rem; margin: 0 0 .35rem; }
  h2 { font-size: 1.05rem; margin: 0 0 .75rem; }
  p, li, label, th, td { font-family: "Source Sans 3", "PingFang SC", sans-serif; }
  .sub { color:var(--muted); margin:0 0 1.25rem; }
  .grid { display:grid; grid-template-columns: 1.1fr .9fr; gap: 1rem; }
  @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  .card { background:var(--card); border:1px solid var(--line); padding:1rem 1.1rem 1.15rem; }
  label { display:block; margin:.7rem 0 .25rem; font-size:.88rem; color:var(--muted); }
  input, select, textarea { width:100%; padding:.55rem .6rem; border:1px solid var(--line); background:#fff; font: inherit; }
  textarea { min-height: 6rem; }
  button, .btn { display:inline-block; margin-top:.9rem; padding:.55rem .9rem; border:0; background:var(--accent); color:#fff; cursor:pointer; text-decoration:none; font: inherit; }
  .ghost { background:transparent; color:var(--accent); border:1px solid var(--accent); }
  .flash { border:1px solid #badac9; background:#eef7f2; padding:.7rem .85rem; margin-bottom:1rem; }
  .err { border-color:#e4b4a2; background:#fff1ea; color:var(--warn); }
  table { width:100%; border-collapse: collapse; font-size:.9rem; }
  th, td { text-align:left; padding:.45rem .3rem; border-bottom:1px solid var(--line); vertical-align:top; }
  .mono { font-family: ui-monospace, Menlo, monospace; font-size:.82rem; word-break:break-all; }
  nav a { margin-right:.8rem; }
  .warn { font-size:.88rem; color:var(--warn); }
  .chips { display:flex; flex-wrap:wrap; gap:.5rem; }
  .chip { border:1px solid var(--line); padding:.45rem .65rem; background:#fbfaf6; font-size:.88rem; }
</style>
<body>
  ${inner}
</body>
</html>`;
}

function shell(user, inner) {
  const who = user
    ? `<span>${esc(user.email)} · ${esc(user.role)}</span>
       <form method="post" action="/logout" style="margin:0"><button class="ghost" type="submit">退出</button></form>`
    : `<a class="btn ghost" href="/login">登录</a>`;
  return `<header>
    <div>
      <strong>诈迹 · ScamTrail</strong>
      <span>每个骗局，都会留下痕迹。 Follow the trail.</span>
    </div>
    <div style="display:flex;gap:.75rem;align-items:center">${who}</div>
  </header>
  <main>${inner}</main>`;
}

function dashboardPage(user, state) {
  const reports = state.reports || [];
  const receipts = state.receipts || [];
  const flash = state.flash
    ? `<div class="flash">${esc(state.flash)}</div>`
    : "";
  const err = state.error
    ? `<div class="flash err">${esc(state.error)}</div>`
    : "";
  const campaigns = state.campaigns || summarizeCampaigns(reports);
  const campaignCards = campaigns
    .map(
      (c) => `<div class="chip"><b>${esc(c.label)}</b><br/>${esc(c.count)} 条 · 自述损失 ${esc(c.loss)} USD</div>`
    )
    .join("");
  const reportRows = reports.length
    ? reports
        .map(
          (row) => `<tr>
            <td class="mono">${esc(row.id)}</td>
            <td>${esc(row.title || row.report_type)}</td>
            <td>${esc(row.country_code || "")}</td>
            <td>${esc(row.amount_declared != null ? row.currency + " " + row.amount_declared : "—")}</td>
            <td>${esc((row.indicators || []).join(" · "))}</td>
            <td>${esc(row.status)}</td>
            <td>${row.public_source ? `<a href="${esc(row.public_source)}" target="_blank" rel="noopener">来源</a>` : "—"}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7">还没有投稿。提交后会进入隔离，不会公开。</td></tr>`;
  const receiptRows = receipts.length
    ? receipts
        .map(
          (row) => `<tr>
            <td class="mono">${esc(row.id)}</td>
            <td class="mono">${esc(row.sha256)}</td>
            <td>${esc(row.size_bytes)}</td>
            <td>${esc(row.privacy_class)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4">还没有证据回执。</td></tr>`;
  const p2 =
    user.role === "owner_privacy"
      ? `<div class="card">
          <h2>P2 查阅（仅站长）</h2>
          <p class="sub">Reviewer 会被拒绝。每次查阅写入审计。</p>
          <form method="post" action="/app/p2">
            <label>Evidence ID</label>
            <input name="evidence_id" placeholder="E-… 或回执 ID" required/>
            <label>目的码 purpose_code</label>
            <input name="purpose_code" value="internal_verification" required/>
            <button type="submit">记录一次 P2 查阅</button>
          </form>
        </div>`
      : `<div class="card">
          <h2>审核说明</h2>
          <p>当前角色是 <b>${esc(user.role)}</b>。P2 原件只有 owner_privacy 可打开。你提交的报告会停在隔离区。</p>
        </div>`;
  return htmlPage(
    "工作台 · 诈迹",
    shell(
      user,
      `${flash}${err}
      <h1>工作台</h1>
      <p class="sub">记录不等于报案。下列种子来自 FTC/FBI/DFPI/Kaspersky 等<strong>公开通报的路径</strong>，已去掉受害人姓名、电话、邮箱和卡号。投稿仍先隔离。</p>
      <div class="card" style="margin-bottom:1rem">
        <h2>关联痕迹（工作假设，不是定罪）</h2>
        <div class="chips">${campaignCards || "<span class='sub'>暂无</span>"}</div>
      </div>
      <div class="grid">
        <div class="card">
          <h2>提交报告</h2>
          <form method="post" action="/app/submit">
            <label>报告类型</label>
            <select name="report_type">
              <option value="loss">我实际损失了资金</option>
              <option value="interaction_no_payment">互动过但未付款</option>
              <option value="observation" selected>观察到相关账号/网站/群</option>
              <option value="public_research">公开来源研究</option>
            </select>
            <label>国家/地区（粗粒度）</label>
            <input name="country_code" value="US" maxlength="8"/>
            <label>发生了什么（仅内部，不会进公开页）</label>
            <textarea name="narrative_private" placeholder="时间线、入口、付款方式。不要在 GitHub 上传原件。"></textarea>
            <p class="warn">提交即按默认授权：可内部核验、可脱敏公开、可跨案匹配；身份与完整证据默认不外给。</p>
            <button type="submit">提交并进入隔离</button>
          </form>
        </div>
        <div class="card">
          <h2>证据 Hash 回执</h2>
          <p class="sub">灰度环境用文字生成回执，不把原件放到公共路径。回执不含 storage_key。</p>
          <form method="post" action="/app/receipt">
            <label>证据说明 / 合成内容</label>
            <textarea name="bytes_utf8" placeholder="例如：付款截图说明（合成夹具，勿贴真实卡号）">synthetic payment screenshot fixture</textarea>
            <label>MIME</label>
            <input name="mime_type" value="text/plain"/>
            <label>隐私分级</label>
            <select name="privacy_class">
              <option value="P2" selected>P2 高敏</option>
              <option value="P1">P1 受限</option>
              <option value="P0">P0 可公开字段</option>
            </select>
            <button type="submit">生成回执</button>
          </form>
        </div>
      </div>
      <div class="grid" style="margin-top:1rem">
        <div class="card">
          <h2>隔离中的报告</h2>
          <table>
            <thead><tr><th>ID</th><th>标题</th><th>地区</th><th>自述金额</th><th>痕迹</th><th>状态</th><th>公开来源</th></tr></thead>
            <tbody>${reportRows}</tbody>
          </table>
        </div>
        <div class="card">
          <h2>证据回执</h2>
          <table>
            <thead><tr><th>ID</th><th>SHA-256</th><th>字节</th><th>分级</th></tr></thead>
            <tbody>${receiptRows}</tbody>
          </table>
        </div>
      </div>
      <div style="margin-top:1rem">${p2}</div>`
    )
  );
}

function createApp(options = {}) {
  const users = options.users;
  const sessions = options.sessions || new Map();
  const audit = options.audit || createAuditLog();
  const seeded =
    options.reports || options.receipts
      ? { reports: options.reports || [], receipts: options.receipts || [] }
      : seedIntakeFixtures();
  const reports = seeded.reports;
  const receipts = seeded.receipts;

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
          shell(
            null,
            `<div class="card" style="max-width:28rem">
           <h1>登录工作台</h1>
           <p class="sub">灰度账号见部署说明。登录后可提交隔离报告并生成证据回执。</p>
           <form method="post" action="/login">
             <label>Email</label><input name="email" type="email" required value="owner@scamtrail.local"/>
             <label>Password</label><input name="password" type="password" required/>
             <button type="submit">进入工作台</button>
           </form></div>`
          )
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
        body: dashboardPage(user, {
          reports,
          receipts,
          flash: url.searchParams.get("flash"),
          error: url.searchParams.get("error"),
        }),
      };
    }

    if (method === "POST" && path === "/logout") {
      return {
        status: 302,
        headers: {
          location: "/login",
          "set-cookie": "st_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
        },
        body: "",
      };
    }

    if (method === "POST" && path === "/app/submit") {
      const user = currentUser(headers);
      if (!user) {
        return { status: 302, headers: { location: "/login" }, body: "" };
      }
      try {
        const submitted = submitReport({
          report: {
            id: `RPT-${Date.now()}`,
            report_type: fields.report_type || "observation",
            status: "draft",
            country_code: fields.country_code,
            narrative_private: fields.narrative_private,
          },
          consents: defaultGrants(),
        });
        reports.unshift(submitted);
        return {
          status: 302,
          headers: {
            location: `/app?flash=${encodeURIComponent("已提交 " + submitted.id + "，状态 quarantined")}`,
          },
          body: "",
        };
      } catch (err) {
        return {
          status: 302,
          headers: {
            location: `/app?error=${encodeURIComponent(err.code || err.message)}`,
          },
          body: "",
        };
      }
    }

    if (method === "POST" && path === "/app/receipt") {
      const user = currentUser(headers);
      if (!user) {
        return { status: 302, headers: { location: "/login" }, body: "" };
      }
      const receipt = createHashReceipt({
        bytes: Buffer.from(fields.bytes_utf8 || "synthetic evidence"),
        mimeType: fields.mime_type || "text/plain",
        privacyClass: fields.privacy_class || "P2",
      });
      receipts.unshift(receipt);
      return {
        status: 302,
        headers: {
          location: `/app?flash=${encodeURIComponent("回执 " + receipt.id + " 已生成")}`,
        },
        body: "",
      };
    }

    if (method === "POST" && path === "/app/p2") {
      const user = currentUser(headers);
      if (!user) {
        return { status: 302, headers: { location: "/login" }, body: "" };
      }
      try {
        readP2({
          log: audit,
          role: user.role,
          purposeCode: fields.purpose_code,
          evidenceId: fields.evidence_id,
          actorId: user.id,
        });
        return {
          status: 302,
          headers: {
            location: `/app?flash=${encodeURIComponent("P2 查阅已写入审计，共 " + audit.list().length + " 条")}`,
          },
          body: "",
        };
      } catch (err) {
        return {
          status: 302,
          headers: {
            location: `/app?error=${encodeURIComponent(err.code || err.message)}`,
          },
          body: "",
        };
      }
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

  return { handle, sessions, audit, reports, receipts };
}

module.exports = { createApp, parseCookie };
