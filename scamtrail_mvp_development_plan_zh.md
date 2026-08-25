# 诈迹 · ScamTrail MVP 开发计划

| 项目 | 内容 |
|---|---|
| 文档编号 | ST-PLAN-001 |
| 版本 | v1.0 |
| 日期 | 2026-08-24 |
| 状态 | 开发执行计划 |
| 依据 | ST-DEV-001 v0.10《诈迹 · ScamTrail：活案件诈骗情报与集体报案平台》 |
| 适用对象 | 产品负责人、工程、审核、隐私管理员、开源维护者 |

> 本计划把开发文档中的 M0–M5 拆成可执行、可验收的工作包。它不重新做产品决策。若与 ST-DEV-001 冲突，以开发文档为准。
>
> 本计划不是法律意见。上线前，隐私政策、授权文案、披露流程和数据保留须由所在司法辖区专业人士复核。

---

## 1. 一句话目标

在不公开原始证据、不开放自由评论、不自动给现实人物定罪的前提下，上线一套可投稿、可审核、可跨案连接、可反证、可按授权生成集体材料包的活案件平台。

对外承诺：

> 每个骗局，都会留下痕迹。Every scam leaves a trail.

工程实现继续使用 Report、Evidence、Observation、Claim、Indicator、Relationship、Case、Campaign、Collective Case。Trail 只是产品语言，不新增核心表。

---

## 2. 成功标准

MVP 成功不看“上线了多少骗子姓名”，而看下面能否同时成立。

### 2.1 产品闭环

1. 用户能用结构化表单提交经历或观察，并看懂每一项会不会公开。
2. 审核能把投稿变成 Observation / Claim / Case，而不是一篇文章。
3. 相同 Telegram、QQ、域名、钱包或文件 Hash 能生成匹配候选，经人工确认后让旧案件生长。
4. 公开页能跟随痕迹：首次发现、最近发现、关联痕迹、证据链路。
5. 针对单一 Claim 的申诉能改判，并传播到所有引用页。
6. 达到条件的 Campaign 只生成人工评估任务；材料包按授权最小化，不自动报案。

### 2.2 发布硬门禁

开发文档 §27.3，全部必须通过，缺一不可：

- 所有公开字段通过 PII 检查；
- 任一私人 Evidence 不可通过公共 URL 获取；
- 公开 Claim 能追溯到 Decision 与 Evidence；
- 申诉后能完整传播更新；
- 未授权报告无法进入披露包；
- P2 权限测试通过；
- 删除覆盖原件、派生件、缓存和索引；
- GitHub 公共快照不含 P1/P2；
- 安全审查与隐私政策完成；
- 真实浏览器完成桌面和移动端测试。

### 2.3 明确不做（MVP）

头像相似搜索、图像 Embedding、语音指纹、上链或 RFC 3161、警方门户、多机构协作、自动法律文书、图数据库、移动 App、自动汇率、自动发布 Campaign 聚类、自由评论区。

---

## 3. 约束与假设

### 3.1 已锁定（本计划不再讨论）

| 决策 | 来源 |
|---|---|
| 生产数据库是权威源，GitHub 是公共镜像 | ADR-002 |
| 无自由评论，只接受结构化 Report / Supplement / Dispute | ADR-003 |
| Case 是动态视图，不拥有事实 | ADR-001 |
| P2 仅站长 / 隐私管理员 | ADR-004 |
| 警方无后台，只收材料包 | ADR-005 |
| 不上链原始数据 | ADR-006 |
| 公开 Scam Persona，现实身份极高门槛 | ADR-007 |
| 阈值只创建候选，不自动报警 | ADR-008 |
| 名称：诈迹 · ScamTrail；Trail 不是新表 | ADR-009 |

### 3.2 本计划采用的执行假设

1. **团队形态**：MVP 期可由同一人兼任 GitHub Maintainer 与 Privacy Custodian，但权限域必须分开实现，不能因为是同一人就共用密钥或跳过审计。
2. **技术栈默认值**（文档允许替换，计划锁定以便开工）：
   - Web + API：Next.js（App Router）+ TypeScript
   - Worker：Node.js，文件解析在隔离容器中执行
   - 数据库：PostgreSQL
   - ORM：Drizzle（便于 HMAC、原始 SQL 与审计写入）
   - 对象存储：S3 兼容、版本化、服务端加密
   - 队列：Redis + BullMQ
   - 搜索：PostgreSQL FTS + `pg_trgm`
   - CI：GitHub Actions
3. **名称核验不阻塞编码**，但阻塞“对外正式发布”。核验失败只替换品牌字符串。
4. **法律复核是外部依赖**，不计入工程人周。
5. **种子数据**是发布依赖：公开站不能空着上线，至少 10 个高质量 Case，目标 10–30。

若要改栈（例如 API 改 NestJS、Worker 改 Python），只改本计划 §4，不改对象模型和阶段门禁。

---

## 4. 技术基线

### 4.1 仓库

```text
scamtrail/
├── apps/web/          # 公开站 + 提交者中心 + 审核台
├── apps/api/          # 若与 web 分离；MVP 可先放在 web 的 server 层，M2 前再拆
├── apps/worker/       # Hash / 扫描 / 元数据 / 匹配候选
├── packages/schemas/
├── packages/taxonomy/
├── packages/redaction/
├── packages/public-data-client/
├── public-data/       # 仅脱敏快照，由生产导出，禁止手改当真
├── docs/
└── .github/
```

MVP 允许 `apps/api` 暂不独立，但公共读取、用户投稿、内部审核三类授权域从第一天就要分开。P2 路由单独鉴权，不能复用 Reviewer session。

### 4.2 运行时拓扑

```text
浏览器
  → Public Web / Submitter App
  → API（公共读 / 用户写 / 内部审 三域）
      → PostgreSQL
      → Redis（队列、限流）
      → 预签名 URL → Encrypted Object Storage
      → Worker 隔离容器（扫毒、Hash、元数据、HMAC 候选）
      → Audit 追加写
      → 定时 Exporter → GitHub public-data（只出 P0）
```

禁止：GitHub Pages 作为投稿或证据后端；PR 直接成为生产事实；原始文件走公共 CDN。

### 4.3 密钥分区

从 M1 第一天就要分槽，即使人都是你：

| 槽 | 内容 | 谁能用 |
|---|---|---|
| App secrets | 会话、OAuth、普通数据库 | 应用运行时 |
| Vault encryption | Evidence 对象加密键 | Worker + 受控下载路径 |
| HMAC pepper | 电话/邮箱/银行等私密匹配 | 仅 Private Match 路径 |
| P2 unwrap | 高敏字段解密 | 仅 `OWNER_PRIVACY` |
| GitHub export signing | 公共快照签名 | 仅导出任务 |

HMAC pepper 不进 GitHub，不与普通环境变量文件混放。密钥轮换预留 version 字段。

---

## 5. 硬门禁（每个阶段都要过）

这些规则贯穿全部编码，不是最后再补：

1. **投稿先隔离。** `SUBMITTED → QUARANTINED`，不能直接写公开生产图。
2. **AI 只出候选。** 不自动发布 Claim、不自动认定同一集团、不自动披露。
3. **匹配先 Candidate。** 精确标识也要人工确认才成为 Public Relationship。
4. **Review 与 Publish 分离。**
5. **公开措辞禁止自动升级。** 只能说“观察到相同 Telegram”，不能说“同一诈骗集团”。
6. **P0/P1/P2 字段级过滤。** 公共 API 白名单，默认拒绝。
7. **读 P1/P2 必须带目的码，并写 Audit。**
8. **Decision 追加写，不覆盖。**
9. **Trail 文案与内部字段对照。** `first_observed_at` 对外是 Trail first seen / 首次发现。

---

## 6. 总地图

```text
M0 治理与定义
  → M1 基础平台（能收、能存、能审计，不公开）
    → M2 知识与审核（能做成 Case 并公开发布）
      → M3 活案件与 Campaign（能连接痕迹并通知）
        → M4 争议与集体案件（能改判、能打包）
          → 发布门禁
            → 公开 MVP
              → M5 高级分析（发布后）
```

| 里程碑 | 用户可感知的结果 | 没有它就不能说完成 |
|---|---|---|
| M0 | 仓库、政策、Schema、威胁模型齐备 | 不能接收真实证据 |
| M1 | 能注册、能投稿、能拿到 Hash 回执 | 不能出现任何公开 Case |
| M2 | 第一批脱敏 Case 可浏览、可导出 | 不能宣称活案件 |
| M3 | 新报告能更新旧 Case / Campaign | 不能宣称跨案追踪 |
| M4 | 能申诉改判，能生成授权材料包 | 不能宣称集体报案能力 |
| 发布 | 种子数据 + 安全/隐私/浏览器验收 | 不能公开邀稿 |
| M5 | 相似图、模板、图谱、时间锚定 | 不在 MVP |

---

## 7. 关键路径与可并行工作

```text
关键路径：
政策/威胁模型 → Evidence Vault → Observation/Claim → 公开发布
→ 精确匹配 → 时间线/Campaign → 申诉传播 → 披露包 → 发布验收

可并行：
- 名称核验（域名 / GitHub org / 社交账号 / 商标）
- Taxonomy 与诈骗路径页文案
- 种子 Case 收集与脱敏预演
- 公开页视觉与 Trail 文案
- GitHub 贡献模板
- 审核操作手册
```

名称核验、种子收集、文案可以和 M1 编码同时进行。**真实受害者数据不得在 M0 政策完成前进入任何环境。** 开发期只用虚构夹具和自愿的历史公开资料。

---

## 8. M0 治理与定义

**目标：** 让后面写的每一行代码都有对象、状态、隐私等级和拒绝条件。  
**完成定义：** 开发文档 §33 清单中，除“名称资产核验”和“10–30 种子数据”外，工程所需文件齐备；仓库可运行空迁移。

名称核验与种子收集在 M0 启动，允许跨阶段完成，但必须在发布前关闭。

### 8.1 工程可开工文件

按依赖顺序做，不要平行空转：

| 序号 | 交付物 | 完成标准 | 依据 |
|---:|---|---|---|
| M0.1 | 数据词典 | 每个表/字段有类型、空值、隐私等级、是否公开、是否可搜索 | §10、§20 |
| M0.2 | JSON Schema | Report、Evidence Receipt、Claim、Case、Campaign、Decision 的权威形状 | §20、§34 |
| M0.3 | 隐私分类矩阵 | 每个投稿字段 → P0/P1/P2，含默认公开策略 | §10.2 |
| M0.4 | Consent 文案与版本 | 分项授权 YAML 有对应人话；有 `policy_version` | §10.3 |
| M0.5 | Claim 证据等级 | `UNVERIFIED`…`INVALIDATED` 何时可用、谁能改 | §14 |
| M0.6 | 编辑与发布政策 | Review / Publish 分离；禁止自动定罪措辞 | §4、§13.3 |
| M0.7 | 申诉与改判政策 | 只能打 Claim；身份撤回不等于案件撤回 | §17 |
| M0.8 | Collective Case 披露政策 | 阈值只出候选；材料包结构；接收方核验 | §18 |
| M0.9 | 删除与保留方案 | 原件/派生件/索引/Tombstone；已披露不能承诺召回 | §24.5 |
| M0.10 | Threat Model | 至少覆盖投毒、诬陷、恶意文件、PII 泄露、冒充执法、GitHub 误用 | §2.3、§31 |
| M0.11 | OpenAPI 草案 | 公共读 / 用户写 / 内部审 / 披露 四组 | §22 |
| M0.12 | 安全事件响应 | 漏洞私钥报告渠道；密钥泄露步骤 | §23.4、§24 |
| M0.13 | GitHub 贡献指南 | 明确禁止上传身份证、聊天、付款截图 | §23 |
| M0.14 | 许可证决定 | 代码 / 文档 / 公共数据分开；Vault 不授权 | §23.5 |
| M0.15 | MVP 验收测试大纲 | 把 §29 五条场景写成可跑的测试名 | §29、§30 |

### 8.2 仓库与环境

- [ ] 建立 `scamtrail` 仓库；`main` 保护、禁止 force push
- [ ] 初始化 monorepo、CI（lint / typecheck / test 空过）
- [ ] `CODEOWNERS` 覆盖 Schema、public-data、安全目录
- [ ] Issue 模板：public-source / correction / taxonomy / security
- [ ] 安全漏洞走私密渠道，不走公开 Issue
- [ ] 开发 / 预发 / 生产三套环境；生产密钥不进开发机明文文件
- [ ] 选择对象存储与 Postgres 托管，但暂不接入真实 P2 数据

### 8.3 名称资产（可并行，发布前必须有结论）

- [ ] 域名候选与注册
- [ ] GitHub organization
- [ ] X / Telegram / 邮件等对外账号
- [ ] 主要司法辖区商标检索
- [ ] 核验记录写入 `docs/governance/naming.md`：通过 / 放弃 / 接受风险

未完成前，README、页面标题、提交者可见文案统一用「诈迹 · ScamTrail」，不用历史草案名。

### 8.4 Taxonomy 初稿

先冻结 MVP 够用的稳定枚举，后续只增不改语义：

- 报告类型（损失 / 互动未付款 / 观察 / 公开研究）
- 入口渠道、沟通渠道、付款方式
- 诈骗类型（投资、激活费、冒充客服等）
- 国家 / 司法辖区
- Indicator 类型（tg_username、tg_id、qq、domain、wallet、bot、image_sha256、phone_hmac…）
- 关系类型与匹配方法

### 8.5 M0 出口检查

- 数据词典与 Schema 能解释 §34 的示例 JSON/YAML
- 威胁模型有“投稿隔离、Publish 人工、P2 单人、警方无后台”四条对应控制
- 空数据库可迁移；CI 绿
- 没有真实受害者文件出现在仓库或对象存储

---

## 9. M1 基础平台

**目标：** 系统能安全地收下一条报告，而公众什么也看不到。  
**垂直切片：** 注册 → 填表 → 分项授权 → 上传截图 → 隔离扫描 → Hash 回执 → 审核队列里能打开脱敏预览。

### 9.1 数据表（第一波）

`users`、`reports`、`payments`、`consents`、`evidence_objects`、`evidence_derivatives`、`evidence_metadata`、`audit_events`

此刻不要建 Campaign / Dispute / Collective Case。Observation 和 Claim 可建空表，但 M1 不写业务。

### 9.2 认证与权限

- [ ] 邮箱注册 / 登录；提交者 MFA 可选，管理员 MFA 强制
- [ ] 角色：Visitor / Submitter / Reviewer / `OWNER_PRIVACY`
- [ ] GitHub 登录不得自动授予 Reviewer 或 P2
- [ ] Session 绑定与异常登录记录
- [ ] 内部 API 与公共 API 分授权域

### 9.3 投稿表单 `/submit`

按文档 10 步，可保存草稿、可断点续传：

1. 报告类型
2. 经历基本信息
3. 诈骗时间线
4. 付款记录
5. 为什么当时相信
6. 如何发现
7. 相关账号与基础设施
8. 证据上传
9. 公开预览（只显示将公开的字段）
10. 分项授权 + 提交确认

每个敏感字段旁固定五问：是否公开 / 是否内部核验 / 是否跨案匹配 / 是否可能进 Collective Case / 是否需要再联系。

文案原则：小额也是 Trail；即使只损失 1 元或没付款也可以提交。

### 9.4 Evidence Vault

上传固定流水，缺一步就不能进审核：

1. 类型、大小、扩展名校验
2. 隔离容器病毒 / 恶意内容扫描
3. Evidence ID
4. SHA-256
5. 服务器接收时间与大小
6. 原件加密写入对象存储
7. 元数据提取（EXIF 只作为 Observation 候选，不得写成“确定拍摄于”）
8. PII 启发式分类 → 人工可改
9. 脱敏预览 / 缩略派生件（新对象，带 `derived_from`）
10. Evidence Receipt
11. 进入 Intake Queue

原件保留期间禁止原地编辑。解析失败不影响 Hash 回执。原始下载默认关闭。

### 9.5 Consent

- [ ] 按文档 YAML 分项存储，带 `policy_version`
- [ ] 用户可在披露前撤回或修改
- [ ] 提交前明确：已依法完成的披露无法保证从接收方撤回
- [ ] 默认不把身份和完整证据交给任何第三方

### 9.6 Audit

- [ ] P1/P2 查看、导出、删除追加写，不能改旧记录
- [ ] 字段：访问者、对象、目的码、时间、预览或导出、会话、结果、关联案件
- [ ] 提交者可在 `/my/access-log` 看到自己资料的简化访问历史
- [ ] 日志本身不写原始敏感值

### 9.7 提交者中心（M1 最小集）

- `/my/reports`
- `/my/evidence`（回执、状态，无原件直链）
- `/my/consents`

### 9.8 审核台（M1 最小集）

- Intake Queue
- Evidence Detail（Reviewer 默认脱敏预览；P2 仅站长）
- Audit Log 只读

### 9.9 页面与 API

| 页面 | M1 |
|---|---|
| `/submit` | 必须 |
| `/privacy` | 必须上政策草稿 |
| `/contribute` | 必须有“不要在 GitHub 上传证据” |
| `/` | 可先静态说明 + 搜索框禁用或仅 UI |
| 公共 Case | 不做 |

API：用户投稿组全部；内部 `GET /intake`、`POST /evidence/{id}/classify`；无公共读生产数据。

### 9.10 M1 测试

- 单元：规范化（先实现账号/域名/钱包/电话，即使匹配引擎在 M3 才用）
- 集成：上传 → 扫描 → Hash 回执 → 加密落盘 → 派生件
- 安全：恶意 PDF/Office/压缩包；预签名 URL 过期与重放；路径遍历
- 隐私：付款截图含姓名和卡号 → 原件 P2，公共字段不出现
- 权限：Reviewer 打不开 P2 原件；站长打开必有审计

### 9.11 M1 出口检查

- 报告状态机能走到 `QUARANTINED / TRIAGE / NEEDS_INFORMATION`
- 没有任何公共 URL 能取到原件
- 删除草稿可清对象存储（未进入争议的私人资料）
- 站长之外无人能列 P2 对象

---

## 10. M2 知识与审核

**目标：** 审核能把一条隔离报告做成可发布的 Case；公众能读脱敏结果；GitHub 能收到镜像。  
**垂直切片：** 审核拆 Claim → 写 Decision → Publish → `/cases/:id` 可见 → `public-data/cases/` 出现对应快照。

### 10.1 数据表（第二波）

`observations`、`entities`、`entity_identifiers`、`claims`、`claim_evidence`、`cases`、`case_claims`、`case_entities`、`case_reports`、`decisions`

### 10.2 审核工作台

- [ ] PII Classification 人工确认
- [ ] Observation Editor：从证据提取值，区分 raw / normalized / hmac
- [ ] Claim 必须原子化；提供拆分检查清单（文档 §14.1 的反例要做成 UI 提示）
- [ ] `claim_evidence`：`SUPPORTS / CONTRADICTS / CONTEXTUALIZES / SUPERSEDES / DUPLICATES`
- [ ] Case Builder：Case 只引用，不复制 Indicator 文本
- [ ] Decision Publisher：前态、新态、公开理由、内部理由、证据、影响对象

身份类 Claim 默认不发布。头像相关必须带固定警示：

> 该身份或图片被观察到用于诈骗活动，不代表已确认背后的现实人物身份；照片中的真人可能也是身份盗用受害者。

### 10.3 精确匹配（M2 先做候选，M3 再长成活案件）

M2 必须能对 **精确稳定标识** 和 **规范化精确标识** 建 Match Candidate：钱包、TG numeric ID、QQ、文件 SHA-256、归一化域名。  
M2 结束时可以先不自动回写多个 Case 的知识时间线，但候选表和人工确认入口要有，避免 M3 返工。

私密 HMAC 匹配的计算路径 M2 接通，**公开表达**放到 M3。

### 10.4 公共页面

- `/cases`、`/cases/:id`
- `/methodology`（证据等级、术语、Trail 对照、限制）
- `/`：搜索可用，但结果只含已发布对象
- Case 页模块按 §15.2，M2 至少交付：摘要、当前状态、诈骗时间线、付款路径、Indicator 列表、证据矩阵（Evidence trail）、申诉入口可先链到说明页

公开文案用 Trail 语言，内部路由仍是 `/cases`、`/indicators`。

### 10.5 公共 API 与导出

- `GET /api/public/cases`
- `GET /api/public/cases/{id}`
- `GET /api/public/methodology`
- `GET /api/public/changes`
- Exporter：字段白名单；无 P1/P2；无原件路径；生成版本 Hash
- GitHub 工作流校验 public-data Schema，拒绝敏感字段名

### 10.6 种子数据（M2 开始写入预发）

用 3–5 个虚构或已公开来源的 Case 打通发布管道。真实新投稿仍走隔离。目标不是数量，而是 Claim 拆得干净。

### 10.7 M2 测试

- Report → Observation → Claim → Decision → 公开 Case
- 公共 API 白名单
- 导出物 grep 不到姓名、卡号、邮箱、电话明文、存储 key
- EXIF 不出现在公共头像
- Decision 可追溯；公开页不展示内部理由全文

### 10.8 M2 出口检查

- 存在至少 1 条端到端发布的 Case
- 公开 Claim 都能点到 Decision 与 Evidence Receipt
- `public-data` 的一次导出可被独立校验
- Reviewer 不能跳过 Decision 直接改公开字段

---

## 11. M3 活案件与 Campaign

**目标：** 新痕迹能让旧案件生长；用户能跟随 Connected trails。  
**垂直切片：** 一年后的新报告带同一 TG → 两个 Match Candidate → 人工确认精确匹配 → 两案知识时间线同时增加 → Indicator 更新 Trail last seen → Campaign 统计重算 → 授权提交者收到 “New trail discovered / 发现新的关联痕迹”。诈骗时间线不被改写。

### 11.1 数据表（第三波）

`relationships`、`campaigns`、`campaign_cases`、`campaign_entities`

补齐 `first_observed_at` / `last_observed_at` 的公开别名。

### 11.2 匹配引擎

| 类型 | M3 |
|---|---|
| 精确稳定标识 | 必须，候选后复核 |
| 规范化精确 | 必须 |
| 文件 SHA-256 | 必须 |
| 私密 HMAC | 必须；公开只说“存在受保护共同标识” |
| 头像 pHash / Embedding | 不做，只留接口注释 |
| 文本模板 | 不做 |
| 同名显示名 | 弱信号，不创建操作者归属 |

独立性检查最小集：同一账户/设备风险、同一文件 Hash、同一公开来源、同一推荐链、同一受害者重复提交。独立性只影响权重，不向公众暴露用户。

### 11.3 时间线

每个 Case 三条时间线：

1. 诈骗时间线：只描述发生了什么，不因新知识改写
2. 知识时间线：平台何时知道
3. 结论时间线：Claim 判断何时变

双时间：`event_time` 与 `recorded_at` / `valid_from` 必须能回答“2026 年 6 月时网站相信什么”。

### 11.4 Campaign

- 工作假设，不是对幕后组织定罪
- 统计分层：独立报告、证据支持、仅观察、支持损失、自述损失、中位损失、司法辖区、首次/最近发现、近 24h/7d/30d、基础设施计数、争议状态
- 状态用 `ACTIVE / RECENTLY_OBSERVED / NO_RECENT_OBSERVATION / DISPUTED / MERGED`
- 禁止“诈骗集团已消失”

### 11.5 页面

- `/campaigns`、`/campaigns/:id`
- `/indicators/:id`（Trail first seen / last seen、Connected trails）
- `/search` 区分完全匹配、规范化匹配、仅受保护匹配、已确认、未确认候选
- `/patterns/:slug` 可用静态手法页，不依赖图数据库
- `/my/updates`
- 首页：Follow the trail 搜索 + 发现新的关联痕迹 + 活跃 Campaign

内部：Match Candidates、Campaign Builder。

### 11.6 通知

- 新关联、需要补充资料、授权变更
- 默认文案：New trail discovered / 发现新的关联痕迹
- 不在通知里写 P1/P2 原值

### 11.7 M3 测试

完整跑 §29.2 和 §29.3。另加：

- HMAC 两报告同号不同权，公共页无号码
- 确认关系后旧 Case 诈骗时间线字节级不改（可用快照比对）
- Campaign 聚合不手写死数
- 搜索索引不含私人原值

### 11.8 M3 出口检查

- 精确匹配闭环在预发可演示
- 受保护标识没有一次明文泄漏（API、页面、日志、导出、通知）
- Indicator 页同时展示首次发现与最近发现
- 新关联默认是 Candidate

---

## 12. M4 争议与集体案件

**目标：** 结论可逆；集体材料可提交且可审计。  
**垂直切片 A：** 只挑战“照片中的人控制该账号” → 公开立即显示 under review → 改判 RETRACTED → 诈骗发生与账号被使用仍在 → 所有引用页更新。  
**垂直切片 B：** 美国报告触达内部阈值 → 只出候选 → 按 Consent 分层装包 → 未授权身份不进包 → 接收方核验前不能标已披露 → 记录 Package Hash。

### 12.1 数据表（第四波）

`disputes`、`collective_cases`、`disclosure_packages`

### 12.2 申诉

- `/challenge/:claimId` 必须选具体 Claim
- 不要求否定整个诈骗事件
- 争议期公开：`Previously verified — under review / 该主张此前已核验，目前因新反证正在复核。`
- 结果：`UPHELD / MODIFIED / PARTIALLY_RETRACTED / RETRACTED / IDENTITY_MISATTRIBUTION / DUPLICATE_OR_COORDINATED_SUBMISSION`
- 传播清单：Case、Campaign 人数与强度、Indicator、搜索索引、公共变更、提交者通知、未披露包是否作废

内部：Dispute Workbench。

### 12.3 Collective Case

状态机按 §21.5 实现，禁止跳过 `RECIPIENT_VERIFIED`。

阈值维度（配置化，不写死单一金额）：

- 同司法辖区独立人数
- 经证据支持的损失
- 是否仍活跃
- 共享基础设施强度
- 付款证据比例
- 路径是否高度重复
- 弱势群体 / 持续风险
- 已获授权种类
- 是否存在可操作接收机构

材料包 12 段按 §18.3。联系人清单只有进一步授权才加入。

接收方核验：独立官方渠道、案件编号或接收依据、禁止来路不明私聊交付、一次性最小化包、无后台账号。

### 12.4 页面与 API

- `/transparency`：更正、撤回、披露统计（无个案隐私）
- `/my/disputes`
- 内部：Collective Case Builder、Disclosure Package Builder
- §22.3 与 §22.5 全部 API
- 披露与删除二次确认

### 12.5 用户可见的报案状态

全站固定一句，避免用户以为已经报案：

> 记录不等于向警方报案。只有经你授权、接收机构核验、站长批准的材料包被标记为已披露后，才进入披露状态。

### 12.6 M4 测试

完整跑 §29.4、§29.5。另加：

- 撤回 Consent 后不再进入新包；旧披露不假装能召回
- 未授权报告加入包的测试必须失败
- Decision 传播漏页视为发布阻断缺陷
- 披露审计含接收机构、范围、排除字段、Hash、是否通知用户

### 12.7 M4 出口检查

- 身份 Claim 可单独撤回
- 披露路径没有“一键发送全部证据”
- 阈值任务可创建、可废弃、不可自动外发
- 透明度页能统计撤回与披露次数，不暴露受害者

至此功能范围等于开发文档 §27.1。随后进入发布门禁，而不是直接公开邀稿。

---

## 13. 发布准备

M4 功能完成 ≠ 可以公开。本阶段专门过 §27.3。

### 13.1 内容

- [ ] 10–30 个高质量 Case，Claim 原子、措辞谨慎、有 Evidence trail
- [ ] 至少 1 个 Campaign 展示分层统计
- [ ] 至少 1 条已发布 Decision 更正史（可用种子演练）
- [ ] `/methodology` 与 `/privacy` 终稿

### 13.2 安全与隐私

- [ ] P2 越权、会话劫持、SSRF、XSS、CSRF、备份泄漏、Actions Secret 泄漏
- [ ] 公共 API / 搜索 / 日志 / 导出 四处 PII 扫描
- [ ] 删除后缓存和索引复查
- [ ] 密钥轮换演练一次
- [ ] 备份恢复演练一次
- [ ] 法律对隐私政策、授权、披露、保留期的复核结论归档

### 13.3 产品与可访问性

- [ ] 桌面 + 移动真实浏览器走完：搜索、投稿、授权、申诉入口
- [ ] 公开页 WCAG 2.2 AA 目标：键盘、错误可读、状态不只靠颜色
- [ ] Trail 文案六条全部出现在真实页面，而不是只在文档里
- [ ] 名称核验完成，或书面接受风险

### 13.4 开源

- [ ] README 只描述方法与公共数据，不诱导把证据发到 Issue
- [ ] 第一次签名 Release + public-data Hash
- [ ] 透明度报告模板可出空表

### 13.5 发布出口

发布负责人（站长）书面确认 §27.3 十二条全部勾选。未勾选不得把投稿入口指向生产。

---

## 14. M5 发布之后（不排进 MVP 工期）

只在发布后按需启动，且每项仍受“AI 只出候选、人工 Publish”约束：

- 头像 pHash / 图像 Embedding
- 文本模板相似
- 风险评分（不得变成现实身份分数）
- 图谱可视化（必须有文本替代）
- RFC 3161 或每日 Merkle Root 锚定（只锚 Hash）
- 多语言、多审核人、按案件临时授权

M5 开始前先补：多人审核的最小权限模型，降低单一站长风险。

---

## 15. 页面 × 里程碑

| 页面 | M1 | M2 | M3 | M4 | 发布 |
|---|---|---|---|---|---|
| `/submit` | 完成 | | | | 浏览器验收 |
| `/privacy` | 草稿 | | | | 终稿 |
| `/contribute` | 完成 | | | | |
| `/my/reports` `/my/evidence` `/my/consents` `/my/access-log` | 完成 | | | | |
| `/cases` `/cases/:id` | | 完成 | | | |
| `/methodology` | | 初稿 | Trail 对照补全 | | 终稿 |
| `/` 搜索 | UI | 可用 | 新关联 + Campaign | | |
| `/campaigns` `/indicators/:id` `/search` `/patterns/:slug` `/my/updates` | | | 完成 | | |
| `/challenge/:claimId` `/my/disputes` `/transparency` | | 入口说明 | | 完成 | |
| Intake / Evidence / Audit | 完成 | | | | |
| Observation / Claim / Case / Decision | | 完成 | | | |
| Match / Campaign Builder | | 候选雏形 | 完成 | | |
| Dispute / Collective / Disclosure | | | | 完成 | |

---

## 16. API × 里程碑

| 组 | 里程碑 |
|---|---|
| 用户投稿全部 | M1 |
| 内部 intake + classify | M1 |
| 内部 observations / claims / cases / decisions | M2 |
| 公共 cases / methodology / changes | M2 |
| 内部 relationships / campaigns | M3 |
| 公共 campaigns / indicators / search | M3 |
| 申诉 | M4 |
| Collective Case / recipients / packages | M4 |

安全要求从 M1 就生效：预签名上传、幂等键、公共限流、管理 MFA、P1/P2 目的码、P2 仅站长。

---

## 17. 测试计划（怎么排进日常）

每个里程碑结束，不只是“功能能点”。最低要求：

| 层 | 何时开始 | 谁维护 |
|---|---|---|
| 单元测试 | M0 Schema 冻结后立即，随规范化函数增长 | 工程 |
| 集成测试 | M1 上传流水线起 | 工程 |
| 隐私回归 | 每做公共页面或导出就跑 | 工程 + 隐私管理员 |
| 安全测试 | M1 文件处理起；发布前全套 | 工程 |
| 场景验收 §29 | M2 起逐条自动化或脚本化 | 工程 + 审核 |
| 审核一致性 | M2 有种子后，用固定卷宗盲评 | 审核（可一人分两次做） |
| 浏览器验收 | 每个公开页合并前 | 产品 + 工程 |

发布前必须有一份固定夹具包：含卡号的付款图、两份同号未公开电话、隔年同 TG、可推翻身份的更早照片、一组美国小额报告。这五包对应 §29.1–§29.5，缺包不准宣称该条通过。

---

## 18. 种子数据计划

种子不是演示文案，是审核方法的第一批真约束。

1. **M0–M1：** 只收集公开来源线索和虚构夹具，不进生产 Vault。
2. **M2：** 3–5 条打通发布。优先选“小额 + 清晰 TG/网站 + 无现实人名”的路径，贴合产品语言。
3. **M3：** 增加到能形成 1–2 个 Campaign 的规模，让统计分层有意义。
4. **发布：** 10–30 条。每条必须有：原子 Claim、证据矩阵、隐私检查记录、可引用的 Decision。
5. **禁止：** 为凑数复制同一文件当独立受害者；公开页写未核验的现实姓名。

---

## 19. 风险如何变成开发任务

| 文档风险 | 计划中的具体工作 |
|---|---|
| 虚假举报与诬陷 | M2 Claim 原子化 UI；身份默认不发布；M4 申诉 |
| 数据投毒 | M1 隔离；M3 独立性字段；信誉只排序不判真伪 |
| 隐私泄露 | M0 矩阵；M1 Vault；全程白名单测试 |
| 恶意文件 | M1 隔离扫描 + 安全预览，审核员禁直接打开原件 |
| 错误头像归属 | M2 固定警示文案；M5 之前不做相似搜索 |
| 号码再分配 | Indicator `valid_from/to`；公开首次/最近发现 |
| 单一站长 | MFA、审计、备份；M5 前设计第二人临时授权 |
| 冒充警方 | M4 接收方核验清单，无“后台只读账号”这种需求 |
| 误以为已报案 | 全局状态文案，M1 投稿确认页就要出现 |
| AI 过度推断 | 提取结果表记录模型版本与人工接受/拒绝 |
| 上链不可删 | 不排期 |
| 被诉或下架 | 方法公开、备份、法律复核作为发布门禁 |

---

## 20. 工期估算

以下为 **一名全职全栈 + 审核/产品由同一人或另一人兼职** 的粗估，用于排期，不是承诺。法律复核、商标检索、种子收集的外部等待另计。

| 阶段 | 人周 | 备注 |
|---|---:|---|
| M0 | 2–3 | 文件多，编码少；决定许可证和托管 |
| M1 | 4–6 | Vault 与文件安全是最容易低估的部分 |
| M2 | 5–7 | Claim/Decision 模型与审核 UI 最耗时 |
| M3 | 4–6 | 匹配与时间线传播 |
| M4 | 4–6 | 申诉传播 + 披露包 |
| 发布准备 | 2–3 | 安全、浏览器、种子、政策终稿 |
| **合计** | **21–31 人周** | 全职约 5–8 个月；兼职则更长 |
| M5 | 未估 | 发布后单独立项 |

建议的日历策略：不要按“全部做完再见面”。M1、M2、M3、M4 各自有可演示切片。对外公开邀稿只发生在发布出口之后。

---

## 21. 建议的开工顺序（第一、二周）

不写业务功能，只把后续工作从沙滩上抬起来。

**第 1 周**

1. 建 `scamtrail` 仓库与 CI 空管线
2. 从 §20 抽出数据词典初稿（表、字段、隐私列）
3. 从 §10.2 做成隐私分类表（投稿表单字段级）
4. 写 2 页 Threat Model：资产、攻击者、控制
5. 选定托管：Postgres、对象存储、应用、Worker 隔离
6. 启动名称核验清单（域名和 GitHub org 先查）

**第 2 周**

1. Consent 人话文案第一版（与 YAML 键一一对应）
2. JSON Schema：Report、Evidence Receipt、Consent
3. 数据库迁移：第一波表
4. 对象存储桶策略：私有、加密、无公共 ACL
5. 编辑政策草稿：禁止自动定罪的例句 / 禁句
6. 准备 §29.1 的付款截图夹具（虚构数据）

第 2 周末的完成标准：本地能起空应用，迁移成功，尚未接受任何真实文件。

---

## 22. 阶段完成看板

复制到项目看板即可。未勾选不得进入下一阶段的生产数据。

### M0

- [x] 数据词典
- [x] JSON Schema
- [x] OpenAPI 草案
- [x] 隐私分类矩阵
- [x] Consent 文案和版本机制
- [x] 编辑与发布政策
- [x] Claim 证据等级规范
- [x] 申诉与改判政策
- [x] Collective Case 披露政策
- [x] Threat Model
- [x] GitHub 贡献指南
- [x] 安全事件响应方案
- [x] 数据删除与保留方案
- [x] MVP 验收测试大纲
- [x] 仓库与 CI
- [x] 许可证决定
- [x] 名称核验已启动

### M1

- [ ] 认证与角色
- [ ] 投稿表单与草稿
- [ ] Consent
- [ ] Evidence Vault 全流水
- [ ] Hash 回执
- [ ] Audit
- [ ] Reviewer 看不到 P2 原件
- [ ] §29.1 夹具通过

### M2

- [ ] Observation / Claim / Decision
- [ ] Case Builder 与公共 Case 页
- [ ] 公共 API 白名单
- [ ] public-data 导出
- [ ] 至少 1 条端到端 Case
- [ ] 精确匹配候选表

### M3

- [ ] HMAC 与精确匹配闭环
- [ ] 三条时间线
- [ ] Campaign 分层统计
- [ ] Indicator 页 Trail 文案
- [ ] New trail discovered 通知
- [ ] §29.2、§29.3 通过

### M4

- [ ] Claim 申诉与传播
- [ ] Collective Case 候选
- [ ] Disclosure Package
- [ ] 接收方核验
- [ ] §29.4、§29.5 通过

### 发布

- [ ] 10–30 种子 Case
- [ ] §27.3 十二条
- [ ] 名称核验结论
- [ ] 法律复核结论
- [ ] 桌面与移动浏览器验收
- [ ] 签名公共 Release

---

## 23. 与开发文档的对应

| 计划章节 | 开发文档 |
|---|---|
| 目标与不做 | §1、§3、§27 |
| 名称与 Trail 文案 | §1.4、ADR-009 |
| 技术基线 | §7、§19、§23 |
| 硬门禁 | §4、§12、§13、§24、§25 |
| M0 | §28 M0、§33 |
| M1 | §9.2、§10、§12、§21.1–21.2 |
| M2 | §14、§15、§22.1、§22.4 |
| M3 | §9.3、§13、§16、§11 |
| M4 | §9.4、§17、§18、§21.5 |
| 测试 | §29、§30 |
| 发布 | §27.3 |
| 延后 | §27.2、§28 M5 |

---

## 24. 使用方式

1. 本文件是执行计划；ST-DEV-001 是需求与规范。改对象模型先改开发文档和 ADR，再改本计划。
2. 每个里程碑只以该阶段出口检查为准，不以“代码量”或“页面数量”为准。
3. 公开邀稿是发布出口之后的运营动作，不是 M2 公共 Case 页的自动后果。M2 可以小范围预发，不开放匿名上传到生产。
4. 若资源只够做更小的第一版：最晚可对外的最小诚实产品是 **M3 出口**（能跟随痕迹），但不得宣传集体报案。集体报案能力属于 M4，未完成就不要在首页承诺。
