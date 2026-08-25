"use strict";

const { submitReport, defaultGrants, createHashReceipt } = require("../../intake/src");

/**
 * Gray-only synthetic intake inspired by public regulator/news writeups.
 * No victim legal names, phones, emails, PANs, or storage keys.
 */
const RAW = [
  {
    id: "RPT-SEED-0001",
    report_type: "loss",
    country_code: "US",
    title: "Telegram 小额激活费",
    entry_channel: "social_bot",
    communication_channels: ["telegram"],
    amount_declared: 52,
    currency: "USD",
    indicators: ["telegram:@alpha888", "bot:kyc-activate"],
    campaign_label: "激活费 / 假 KYC",
    public_source: "https://www.kaspersky.com/blog/phishing-and-scam-in-telegram-2025/54090/",
    narrative_private:
      "公开模式：机器人称空投代币，KYC 实为先存一笔加密货币。灰度合成，非真实受害者档案。",
  },
  {
    id: "RPT-SEED-0002",
    report_type: "loss",
    country_code: "US",
    title: "Telegram 交易助理 + 提现税",
    entry_channel: "telegram",
    communication_channels: ["telegram"],
    amount_declared: 133095,
    currency: "USD",
    indicators: ["domain:echelonmark[.]com", "persona:Viviane", "platform:FT-ALPH"],
    campaign_label: "假交易平台 / 提现税",
    public_source: "https://dfpi.ca.gov/consumers/crypto/crypto-scam-tracker/",
    narrative_private:
      "来源：加州 DFPI Crypto Scam Tracker 公开投诉。Telegram 自称交易助理，提现索 20% tax/release fee 后失联。",
  },
  {
    id: "RPT-SEED-0003",
    report_type: "loss",
    country_code: "US",
    title: "VIP 组 + 监管罚金",
    entry_channel: "telegram",
    communication_channels: ["telegram"],
    amount_declared: 30000,
    currency: "USD",
    indicators: ["domain:cryptoaiml[.]vip"],
    campaign_label: "假交易平台 / 提现税",
    public_source: "https://dfpi.ca.gov/consumers/crypto/crypto-scam-tracker/",
    narrative_private:
      "DFPI 公开叙述：先小额入金进 VIP，再以监管诉讼/恶意操纵为由索罚金，网站随后失效。",
  },
  {
    id: "RPT-SEED-0004",
    report_type: "loss",
    country_code: "US",
    title: "先允许小额提现再锁仓",
    entry_channel: "telegram",
    communication_channels: ["telegram"],
    amount_declared: 18400,
    currency: "USD",
    indicators: ["domain:twaaos[.]com"],
    campaign_label: "假交易平台 / 提现税",
    public_source: "https://dfpi.ca.gov/consumers/crypto/crypto-scam-tracker/",
    narrative_private:
      "DFPI：小额交易可提现建立信任，大额提现被锁，索 10% mining fee。",
  },
  {
    id: "RPT-SEED-0005",
    report_type: "loss",
    country_code: "US",
    title: "群组代管 + KYC 加费",
    entry_channel: "telegram",
    communication_channels: ["telegram"],
    amount_declared: 42000,
    currency: "USD",
    indicators: ["domain:jgyfgroup[.]co", "persona:Bill"],
    campaign_label: "杀猪盘 / 代管账户",
    public_source: "https://dfpi.ca.gov/consumers/crypto/crypto-scam-tracker/",
    narrative_private:
      "DFPI：群组让 Bill 代管账户，提现先服务费再 KYC 费。Persona 名来自公开投诉，不是已定罪现实身份。",
  },
  {
    id: "RPT-SEED-0006",
    report_type: "loss",
    country_code: "US",
    title: "约会 App 转 Telegram 后投 USDT",
    entry_channel: "ad",
    communication_channels: ["telegram"],
    amount_declared: 8700,
    currency: "USD",
    indicators: ["telegram:investment-desk", "asset:USDT"],
    campaign_label: "杀猪盘 / 约会转场",
    public_source: "https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-investment-fraud",
    narrative_private:
      "FBI 公开模式：社交/约会接触后改到 Telegram/WhatsApp，引导假交易平台，常用 USDT。",
  },
  {
    id: "RPT-SEED-0007",
    report_type: "observation",
    country_code: "US",
    title: "Deepfake 视频后转 Telegram",
    entry_channel: "ad",
    communication_channels: ["telegram"],
    amount_declared: 0,
    currency: "USD",
    indicators: ["telegram:@mentor-live", "tactic:deepfake_call"],
    campaign_label: "AI 换脸 / 约会转场",
    public_source: "https://www.netskope.com/blog/undercover-investigations-how-ai-is-supercharging-romance-scams",
    narrative_private:
      "公开调查：多数会要求改到 WhatsApp/Telegram；部分用 AI 文案和 deepfake 视频。本条为观察、未付款。",
  },
  {
    id: "RPT-SEED-0008",
    report_type: "interaction_no_payment",
    country_code: "US",
    title: "要求再缴激活费才能提现",
    entry_channel: "social_bot",
    communication_channels: ["telegram"],
    amount_declared: 0,
    currency: "USD",
    indicators: ["bot:grid-activate", "asset:TON"],
    campaign_label: "激活费 / 假 KYC",
    public_source: "https://www.kaspersky.com/blog/phishing-and-scam-in-telegram-2025/54090/",
    narrative_private:
      "公开模式：提现前要求钱包保持最低 TON「激活」余额。互动后未再付款。",
  },
  {
    id: "RPT-SEED-0009",
    report_type: "loss",
    country_code: "US",
    title: "被骗后又遇到追回公司",
    entry_channel: "telegram",
    communication_channels: ["telegram", "phone"],
    amount_declared: 2500,
    currency: "USD",
    indicators: ["persona:recovery-agent", "tactic:secondary_recovery"],
    campaign_label: "二次收割 / 假追回",
    public_source: "https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-investment-fraud",
    narrative_private:
      "公开警示：杀猪盘之后常有假 recovery 再收费。本条金额为灰度合成。",
  },
  {
    id: "RPT-SEED-0010",
    report_type: "public_research",
    country_code: "US",
    title: "EDNC 公开扣押通报（研究）",
    entry_channel: "website",
    communication_channels: ["telegram"],
    amount_declared: 0,
    currency: "USD",
    indicators: ["asset:USDT", "jurisdiction:US-EDNC"],
    campaign_label: "杀猪盘 / 约会转场",
    public_source:
      "https://www.justice.gov/usao-ednc/pr/department-justice-agents-seize-85-million-cryptocurrency-and-disrupt-investment-fraud",
    narrative_private:
      "公开来源：北卡东区检方通报扣押与 pig-butchering 相关的 USDT。研究者投稿，无受害人身份。",
  },
];

function seedIntakeFixtures() {
  const consents = defaultGrants();
  const reports = RAW.map((row) =>
    submitReport({
      report: {
        ...row,
        status: "draft",
      },
      consents,
    })
  );
  const receipts = reports.map((row) =>
    createHashReceipt({
      bytes: Buffer.from(
        `${row.id}|${row.title}|${(row.indicators || []).join(",")}|${row.public_source}`
      ),
      mimeType: "text/plain",
      privacyClass: row.report_type === "loss" ? "P2" : "P1",
      receivedAt: row.submitted_at,
    })
  );
  return { reports, receipts, campaigns: summarizeCampaigns(reports) };
}

function summarizeCampaigns(reports) {
  const map = new Map();
  for (const row of reports) {
    const key = row.campaign_label || "未聚类";
    if (!map.has(key)) {
      map.set(key, {
        label: key,
        count: 0,
        loss: 0,
        last_seen: row.submitted_at,
      });
    }
    const agg = map.get(key);
    agg.count += 1;
    if (row.report_type === "loss") agg.loss += Number(row.amount_declared) || 0;
    if (String(row.submitted_at) > String(agg.last_seen)) agg.last_seen = row.submitted_at;
  }
  return [...map.values()];
}

module.exports = { seedIntakeFixtures, summarizeCampaigns, RAW };
