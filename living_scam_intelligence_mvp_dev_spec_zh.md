# 诈迹 · ScamTrail：活案件诈骗情报与集体报案平台

## MVP 产品与技术开发文档

| 项目 | 内容 |
|---|---|
| 产品名称 | 诈迹 · ScamTrail |
| 口号 | 每个骗局，都会留下痕迹。 / Every scam leaves a trail. |
| 文档编号 | ST-DEV-001（取代 PP-LCSI-DEV-001） |
| 版本 | v0.10 |
| 日期 | 2026-08-24 |
| 状态 | 开发基线草案 |
| 适用对象 | 产品经理、交互设计、前后端工程师、数据工程师、安全与隐私负责人、审核人员、开源维护者 |
| 文档性质 | PRD + SRS + 数据治理与审核规范 |

> 本文档将前期讨论统一为一套可开发的产品方案。它不是法律意见。正式上线前，涉及个人信息、跨境数据、诽谤风险、证据保存、执法披露和数据保留期限的部分，应由项目所在司法辖区的专业人士复核。
>
> 产品名称「诈迹 · ScamTrail」为当前选定名称。正式对外锁定前，须完成域名、GitHub organization、社交账号和主要司法辖区商标核验。此前讨论用名「偏偏骗骗你」仅作为历史草案名称保留，不再用于对外材料。

### 修订记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v0.9 | 2026-08-24 | 开发基线草案，文档编号 PP-LCSI-DEV-001 |
| v0.10 | 2026-08-24 | 产品名称定为诈迹 · ScamTrail；补入口号、Trail 产品语言、与现有数据模型的对应，以及定名核验项 |

---

## 1. 文档目的

本项目不是普通的“骗子黑名单”、新闻转载站或开放评论社区。它要建立一套能够长期生长、接受反证、聚合小额损失并形成可审计材料的诈骗情报基础设施。

系统的核心目标是：

1. 把每一名受害者或观察者的零散资料，转化为结构化、可核验的独立报告。
2. 把同一 Telegram、QQ、网站、机器人、头像、钱包、收款账户、话术或页面模板在不同案件中的重复出现连接起来。
3. 让旧案件在一年或更久以后仍能因新证据而更新，而不是发布后冻结。
4. 允许任何具体结论被更强的新证据维持、修改或撤回，并公开说明为什么改变。
5. 聚合大量“单笔只有几十元”的长期活动，形成 Campaign 和按司法辖区拆分的 Collective Case。
6. 在用户明确授权、接收机构身份已核验、披露范围已最小化的前提下，生成并提交集体案件材料包。
7. 代码、方法、Schema 和脱敏后的公共知识可开源；原始证据、受害者身份、完整聊天和内部调查资料必须受控。

### 1.1 一句话定位

> 不建立“谁是骗子”的名单，而建立“现有证据目前支持什么结论、这些结论如何随新证据变化”的活案件网络。
>
> 每个骗局，都会留下痕迹。Every scam leaves a trail.

### 1.2 三层产品结构

- **Case**：一个受害事件或独立观察发生了什么。
- **Campaign**：多个 Case 之间发现了哪些共同基础设施、套路和持续活动。
- **Collective Case**：按国家或司法辖区，将获得授权的 Campaign 子集整理成可提交材料包。

### 1.3 十二项已确定的产品决策

1. **代码开源不等于原始数据开放。**
2. **公开网站没有自由评论区。** 用户通过结构化报告参与。
3. **Case 是动态视图，不是静态文章。**
4. **证据、观察、主张和当前判断必须分层。**
5. **结论可逆，证据与决策历史不可被无痕改写。**
6. **每个 Claim 单独接受支持、反驳与申诉。**
7. **公开 Scam Persona 和数字基础设施，现实人物身份采用极高证明门槛。**
8. **隐私分类贯穿采集、处理、匹配、发布和披露全过程。**
9. **公开授权、内部核验授权、跨案匹配授权和警方披露授权互相独立。**
10. **小额损失仍是有价值的独立观察节点。**
11. **达到阈值只触发人工升级评估，不自动向警方发送数据。**
12. **MVP 不把原始数据上链；可选地对公开快照或证据回执做 Hash/Merkle 时间锚定。**

### 1.4 产品名称、口号与产品语言

#### 正式名称

| 项 | 写法 |
|---|---|
| 中文名 | 诈迹 |
| 英文名 | ScamTrail |
| 对外完整写法 | 诈迹 · ScamTrail |
| 口号（中） | 每个骗局，都会留下痕迹。 |
| 口号（英） | Every scam leaves a trail. |

这是当前最看好、并写入本开发基线的名称。中文「诈迹」只有两个字，用户看到后基本能理解成「诈骗留下的痕迹」，但又不是「骗子名单」。英文 ScamTrail 同样贴切：`Scam` 让用户马上知道产品做什么；`Trail` 表示痕迹、轨迹、证据路径。

#### 为什么这个名字适配已有数据模型

人会换，名字会换，网站会换，Telegram 会换——但骗局运行过程中会不断留下 Trail。本文件第 5 节和第 20 节已经设计出来的对象，本身就是不同形态的痕迹：

| 用户理解的一条 Trail | 系统对象 | 说明 |
|---|---|---|
| 一个 $20 的受害案例 | Report / Case | 小额损失仍是有价值的独立观察节点 |
| 一个 Telegram ID | Indicator / Entity | 账号可丢弃，标识一旦出现就可以被再次连接 |
| 一张被反复盗用的头像 | Indicator（文件 Hash / 感知 Hash 候选） | 只证明该图像被用于诈骗身份，不自动等于照片中的真人 |
| 一笔收款 | Payment + 关联 Indicator | 付款理由、方式、金额和收款标识都是痕迹 |
| 一年后另一案件再次出现同一 Telegram | Relationship + `last_observed_at` | 旧 Case 因新痕迹生长，而不是发布后冻结 |

Trail 是**产品语言**，不是一张新的核心表。工程实现继续使用 Report、Evidence、Observation、Claim、Indicator、Relationship、Case、Campaign、Collective Case。公开界面优先说「诈迹 / Trail」，方法论页提供与内部术语的对照。

#### 产品语言

名称可以直接变成界面和通知用语。以下为对外文案的默认对照；内部字段名保持英文蛇形命名。

| 英文 | 中文 | 主要出现位置 |
|---|---|---|
| Follow the trail. | 追踪诈迹。 | 首页主行动、搜索结果、品牌句 |
| New trail discovered | 发现新的关联痕迹 | 匹配确认后的通知、首页、知识时间线 |
| Trail first seen | 首次发现 | Indicator / Campaign / Entity 的 `first_observed_at` |
| Trail last seen | 最近发现 | Indicator / Campaign / Entity 的 `last_observed_at` |
| Connected trails | 关联痕迹 | Case、Campaign、Indicator 的关系区 |
| Evidence trail | 证据链路 | Case 证据矩阵、Claim 追溯、Disclosure Package 的 Evidence Manifest |

公开页面不要把 Trail 写成「骗子」或「已定罪对象」。正确语感是：这里有一条可跟随的痕迹；它现在被哪些证据支持，又可能被新证据改变。

#### 定名核验（尚未完成，不阻塞开发）

本轮公开检索发现：ScamTrail 曾被一个 2025 年播客单集使用，但未发现与本产品高度类似、以该名称运营的反诈骗平台。这不等于商标或域名可注册性确认。正式对外锁定前必须完成：

1. 域名；
2. GitHub organization；
3. 主要社交账号；
4. 主要司法辖区商标检索。

核验完成前，文档、仓库目录和对外稿件统一使用「诈迹 · ScamTrail」。若核验失败需要改名，数据模型与 Trail 产品语言可以保留，只替换品牌字符串。历史草案名称「偏偏骗骗你」不再出现在公开页面、GitHub 简介或提交者可见文案中。

---

## 2. 问题定义

### 2.1 传统反诈内容的缺口

传统内容通常以“破获多少案件、涉案金额多少、追回多少”为中心，不能回答用户真正需要的过程问题：

- 骗子如何第一次接触受害者？
- 多方角色如何分工？
- 受害者基于什么具体信号建立信任？
- 第一次付款的理由、方式和金额是什么？
- 为什么会连续付款？
- 哪一步出现了早期警示但被忽略？
- 受害者最终如何发现？
- 同一数字基础设施是否出现在别的案件？

### 2.2 “低客单价、集团化、高并发”的隐形危害

部分专业诈骗活动通过独立网站、Telegram 群、大量机器人和虚假群员建立可信环境，每名受害者只损失少量资金。单人往往不报案，导致活动看起来不存在。

平台必须同时显示：

- 独立报告人数；
- 经证据支持的人数；
- 经证据支持的累计损失；
- 用户声明但未充分核验的损失；
- 中位损失，而不只显示平均值；
- 首次和最近观察时间；
- 最近一段时间的新报告数；
- 共享基础设施数量和证据等级。

### 2.3 开放共建带来的攻击面

一旦平台有影响力，诈骗集团或恶意参与者可能：

- 批量提交虚假案件；
- 冒充受害者伪造截图；
- 诬陷竞争对手或无辜者；
- 先贡献低风险内容建立信誉，再投毒关键身份；
- 用多个账号制造“独立佐证”；
- 向真实 Campaign 注入错误钱包、域名或号码；
- 通过申诉机制拖延真实警示；
- 上传恶意文件攻击审核人员；
- 研究公开检测规则后规避匹配。

因此，社区可以开放贡献，但不能开放事实裁决权；任何投稿必须先进入隔离区，不能直接写入公开生产数据。

---

## 3. 产品目标、非目标与成功标准

### 3.1 产品目标

- 为正在怀疑自己是否被骗的人提供可搜索的相似路径、Indicator 和 Campaign。
- 为受害者提供低门槛、结构化、明确隐私边界的投稿入口。
- 让每个报告成为可交叉比对的独立观察，而非评论文本。
- 生成有时间、金额、付款路径、信任因素和发现过程的完整 Case。
- 持续识别重复出现的 Telegram、QQ、域名、钱包、头像、机器人和话术。
- 为争议 Claim 提供可追踪的反证、复核和改判机制。
- 为达到条件的 Campaign 生成按司法辖区划分的 Collective Case。
- 形成可公开审计的知识更新历史，同时保护原始证据和身份资料。

### 3.2 明确不做

MVP 不做以下事情：

- 不开放未经审核的自由评论区；
- 不允许社区投票决定谁是骗子；
- 不自动将现实姓名标记为诈骗者；
- 不根据一张头像推断照片中的真人参与诈骗；
- 不向公众展示受害者身份、身份证、住址、完整银行资料或完整私聊；
- 不允许警方或其他第三方直接访问 Evidence Vault；
- 不自动向警方报案；
- 不把原始证据或个人信息写入区块链；
- 不把 AI 输出当成事实结论；
- 不把累计损失、警方处罚和案件破获数量作为案例页的主体内容。

### 3.3 成功指标

优先衡量质量而非数量：

- 已发布 Claim 中有证据支持的比例；
- Campaign 中独立提交者占比，防止重复投稿虚增；
- 精确 Indicator 匹配的人工确认率；
- 相似头像和文本候选的误报率；
- 申诉后完成维持、修改或撤回的比例；
- 所有公开字段均通过隐私检查的比例；
- 未经授权进入 Collective Case 材料包的记录数必须为 0；
- Evidence Vault 非授权访问事件必须为 0；
- 用户自述“搜索后及时停止付款”的有效反馈数；
- 公共数据每次修改均能追溯到 Decision Record 或发布事件。

---

## 4. 核心产品原则

### 4.1 Living Case：案件永远是活的

Case 不应被视为一篇已完成文章。新证据、新报告、新的跨案匹配、申诉、反证和纠错都可能改变它。

一个 Case 至少同时维护三条时间线：

1. **诈骗时间线**：现实中发生了什么。
2. **知识时间线**：平台何时获得、提取或验证了什么。
3. **结论时间线**：平台何时改变了哪些 Claim 的判断。

### 4.2 Evidence 不等于 Claim

- **Evidence**：用户上传的原文件、付款证明、网页存档、公开帖子、视频等。
- **Observation**：从 Evidence 中直接观察到的值，例如一个用户名、一个时间、一个金额。
- **Claim**：需要证据支持或反驳的具体主张。
- **Assessment**：平台当前对 Claim 的判断。
- **Decision**：导致 Assessment 变化的可审计记录。

例如：

- “截图中显示账号 @abc123”是 Observation。
- “@abc123 曾被用于本次诈骗”是 Claim。
- “照片中的张三控制 @abc123”是另一个 Claim，不能因为头像相同自动成立。

### 4.3 结论可逆，历史不可无痕删除

新证据可以让 Claim 从 `VERIFIED` 变为 `DISPUTED`、`MODIFIED` 或 `RETRACTED`。公开页面应显示当前结论，同时保留旧结论存在过、何时改变以及为什么改变。

隐私删除请求是例外：在适用政策或法律要求下，原始对象可以被安全删除，但必须产生最小化的删除审计记录。所谓“不可变”是指保留期间不允许原地替换，不意味着拒绝合法删除。

### 4.4 用户提交报告，不发表自由评论

公开 Campaign 页面只提供：

- “我也遇到了”；
- “我有新的相关证据”；
- “我想挑战某一项 Claim”；
- “我要更正公开信息”。

每次参与都生成结构化记录，经过审核后才影响公共视图。

### 4.5 Scam Persona 与现实身份分离

系统优先公开诈骗过程中出现的身份：显示名、Telegram 用户名、QQ 号、机器人、头像、网站、钱包等。

页面必须明确：

> 该身份或图片被观察到用于诈骗活动，不代表已确认背后的现实人物身份；照片中的真人可能也是身份盗用受害者。

### 4.6 小额报告不是“小案件”

一个 20 元报告可能提供新机器人、新收款指标或新网站，从而连接几百个既有报告。对用户来说，这就是一条 Trail：金额小，不等于痕迹无价值。平台必须鼓励“即使只损失 1 元或没有付款也可以提交”。

### 4.7 AI 只做助手

AI 可以用于：

- OCR、实体提取、语言归一化；
- PII 风险提示；
- 相似内容候选；
- 时间线草稿；
- 重复案例候选；
- 脱敏建议。

AI 不得自动完成：

- 现实人物身份归属；
- “同一集团”的最终认定；
- Claim 的发布或撤回；
- 向警方披露；
- 对申诉作最终裁决。

---

## 5. 核心术语与对象

| 对象 | 定义 | 是否公开 |
|---|---|---|
| Trail | 产品语言：骗局留下的、可被再次发现和连接的痕迹。不是独立核心表，由下方对象承载 | 视承载对象公开 |
| Report | 一名用户提交的一次结构化经历或观察 | 默认不直接公开 |
| Case | 一个独立受害事件或观察事件的动态视图 | 脱敏后公开 |
| Campaign | 多个 Case 之间的活动聚合视图 | 审核后公开 |
| Collective Case | 按司法辖区与授权范围生成的集体材料项目 | 仅公开摘要或不公开 |
| Evidence | 原始文件、存档、付款证明、聊天等 | 原件不公开 |
| Evidence Receipt | 文件 ID、Hash、接收时间、大小等回执 | 可公开最小字段 |
| Observation | 从证据直接提取的具体观察 | 视分类公开 |
| Claim | 一个可被支持、反驳、申诉的事实主张 | 审核后公开 |
| Assessment | 对 Claim 的当前判断 | 公开 |
| Decision Record | 判断改变的理由、证据与审核记录 | 脱敏后公开 |
| Dispute | 针对具体 Claim 的异议与反证 | 公开状态，证据受控 |
| Entity | 人格、组织、网站、群组、钱包等概念节点 | 视类型公开 |
| Indicator | 可用于匹配的标识，如 TG、QQ、域名、钱包、头像 Hash；公开页用 Trail first seen / last seen | 视风险公开 |
| Persona | 诈骗中展示的身份，不等同于现实人物 | 公开并附警示 |
| Relationship | 两个对象之间的观察或推断关系 | 按置信度公开 |
| Disclosure Package | 提交给核验机构的最小化材料包 | 不公开原件 |

![Living Case 知识模型](assets/knowledge_graph.png)

---

## 6. 用户角色与权限

### 6.1 角色

| 角色 | 能力 |
|---|---|
| Visitor | 浏览、搜索公开 Case、Campaign、Indicator、方法论和更正历史 |
| Submitter | 创建报告、上传证据、设置授权、查看自己的报告状态、补充资料、提出申诉 |
| Public Contributor | 通过 GitHub 改进代码、文档、分类、翻译、公开来源和纠错建议 |
| Research Contributor | 提交公开来源关联线索，但不能直接改变生产 Claim |
| Reviewer | 处理结构化报告、创建 Observation 和 Claim；MVP 默认只接触脱敏或 P1 资料 |
| Owner / Privacy Custodian | 站长；MVP 中唯一可管理 P2 高敏资料、批准公开、批准披露、管理密钥和权限 |
| Authorized Agency Recipient | 仅接收特定 Collective Case 的授权材料包，无后台或 Evidence Vault 权限 |

### 6.2 MVP 权限原则

- P2 高敏资料只有 `OWNER_PRIVACY` 角色可管理。
- 所有 P1/P2 查看、导出和删除均写入不可追加外修改的 Audit Log。
- Reviewer 不因拥有代码仓库权限而获得隐私数据权限。
- GitHub Maintainer 与 Privacy Custodian 是两个独立权限域，即使 MVP 中暂由同一人承担。
- 未来引入多人团队时，优先采用最小权限和按案件临时授权，不默认开放全库。
- 警方或其他机构永远不直接登录证据库；只接收经站长批准的材料包。

---

## 7. 开源与闭源边界

### 7.1 应开源的内容

- 前端、后端和数据处理代码；
- 公共 API 定义；
- Schema、Taxonomy、状态机与审核方法；
- 隐私脱敏规则的原则与可公开实现；
- 公开 Case、Campaign、Indicator 的脱敏数据快照；
- Decision Record 的公开版本；
- 公共数据变更日志；
- 测试、CI、部署与贡献规范；
- 透明度报告。

### 7.2 必须闭源或受控的内容

- 原始 Evidence；
- 受害者姓名、联系方式、地址、证件和完整银行资料；
- 完整聊天、邮件 Header、设备与定位信息；
- 未审核投稿和内部调查笔记；
- 可被穷举还原的私密标识；
- HMAC 密钥、加密密钥和反滥用机密规则；
- 未经发布的匹配候选；
- Collective Case 的联系人清单和完整材料包；
- 执法披露记录中的受限字段。

### 7.3 GitHub 的正确角色

GitHub 是：

- 代码库；
- 公共 Schema 和方法论库；
- 脱敏公共数据镜像；
- 可审计的公开修改历史；
- 公开来源、翻译、分类和纠错建议入口。

GitHub 不是：

- 受害者上传原始证据的入口；
- 生产数据库；
- 未审核指控发布区；
- 隐私 Evidence Vault；
- 社区投票裁决系统。

建议将公共数据从生产系统按版本导出到 GitHub，而不是允许 PR 直接成为生产事实。PR 只能形成待审核变更建议。仓库与 organization 名称优先使用 `scamtrail`；在 M0 名称核验完成前，不把旧草案名写入 README 或 GitHub 简介。

---

## 8. 信息架构与页面清单

### 8.1 公开页面

1. `/` 首页：搜索（Follow the trail / 追踪诈迹）、发现新的关联痕迹、活跃 Campaign、常见套路。
2. `/cases` Case 列表。
3. `/cases/:id` Case 详情。
4. `/campaigns` Campaign 列表。
5. `/campaigns/:id` Campaign 详情。
6. `/indicators/:id` Indicator 详情；公开文案使用 Trail first seen / last seen、Connected trails。
7. `/patterns/:slug` 诈骗手法与路径页。
8. `/search` 跨 Case、Campaign、Indicator 搜索。
9. `/submit` 结构化报告入口。
10. `/challenge/:claimId` 针对 Claim 的申诉入口。
11. `/methodology` 方法论、证据等级、术语、Trail 产品语言对照和限制。
12. `/transparency` 更正、撤回、披露统计与公开审计摘要。
13. `/privacy` 隐私、授权和数据保留政策。
14. `/contribute` GitHub 社区共建说明。

### 8.2 登录后的提交者页面

- `/my/reports` 我的报告；
- `/my/evidence` 我的 Evidence Vault 摘要；
- `/my/consents` 授权管理；
- `/my/access-log` 我的私人数据何时被访问；
- `/my/updates` 我的报告发现了哪些新关联（New trail discovered / 发现新的关联痕迹）；
- `/my/disputes` 我的申诉与处理结果。

### 8.3 内部管理页面

- Intake Queue；
- Evidence Detail；
- PII Classification；
- Observation Editor；
- Claim Graph；
- Match Candidates；
- Case Builder；
- Campaign Builder；
- Dispute Workbench；
- Decision Publisher；
- Collective Case Builder；
- Disclosure Package Builder；
- Audit Log；
- Retention / Deletion Queue。

---

## 9. 关键用户流程

### 9.1 搜索并判断风险

用户可输入：

- Telegram 用户名或群名；
- QQ 号；
- X 用户名；
- 域名或网址；
- 钱包地址；
- 机器人用户名；
- 诈骗 Persona 显示名；
- 话术关键词；
- 上传一张头像进行相似搜索（后续阶段）。

结果必须区分：

- 完全匹配；
- 规范化精确匹配；
- 高度相似候选；
- 仅与受保护 Indicator 匹配；
- 已人工确认的关联；
- 尚未确认的候选。

### 9.2 提交报告

用户先选择报告类型：

- 我实际损失了资金；
- 我与他们互动过，但没有付款；
- 我观察到了相关账号、网站或群组；
- 我是研究者，发现公开来源关联。

表单分为：

1. 经历基本信息；
2. 诈骗时间线；
3. 付款记录；
4. 为什么当时相信；
5. 如何发现；
6. 相关账号与基础设施；
7. 证据上传；
8. 公开预览；
9. 分项授权；
10. 提交确认。

在每个敏感字段旁明确显示：

- 是否会公开；
- 是否只用于内部核验；
- 是否用于跨案件匹配；
- 是否可能被纳入 Collective Case；
- 是否需要将来再次联系。

![投稿与入站处理流程](assets/submission_pipeline.png)

### 9.3 新证据让旧案件生长

当新报告出现相同 TG、QQ、域名、钱包、文件 Hash 或头像候选时：

1. 创建 Match Candidate；
2. 标记匹配类型和强度；
3. 检查提交者独立性与重复报告；
4. 人工确认是否建立 Relationship；
5. 向所有相关 Case 写入知识时间线事件；
6. 重新计算 Campaign 统计与活动状态；
7. 更新 Indicator 的首次/最近观察时间（公开文案：Trail first seen / Trail last seen）；
8. 向授权接收更新的提交者发送通知，默认文案为 “New trail discovered / 发现新的关联痕迹”。

### 9.4 针对 Claim 的申诉

申诉人必须选择具体 Claim，例如：

- “该账号属于我”；
- “照片中的人控制该账号”；
- “该电话号码与我有关”；
- “该公司参与诈骗”；
- “该钱包由某人控制”。

系统不要求申诉人否定整个诈骗事件。新证据可能只推翻身份归属，而不推翻受害者被骗、账号被使用等其他 Claim。

![Claim 申诉与可逆裁决流程](assets/dispute_flow.png)

### 9.5 Collective Case 与警方披露

大量独立小额报告通过共同基础设施聚合为 Campaign。达到升级候选条件后，系统只创建人工评估任务。站长决定是否建立按司法辖区划分的 Collective Case，并重新核对授权。

![低金额 Campaign 到集体案件材料包](assets/collective_flow.png)

---

## 10. 隐私分类与授权模型

### 10.1 三类隐私等级

#### P0 — Public

可以在审核和脱敏后公开：

- 大致日期；
- 国家/地区；
- 金额和付款方式；
- 诈骗路径和话术摘要；
- 已公开诈骗网站；
- 审核通过的诈骗 Persona、TG/QQ/机器人标识；
- 文件 Hash 与最小化证据回执；
- 公开 Claim、Assessment 和 Decision Record；
- 已脱敏聊天片段；
- 聚合统计。

#### P1 — Restricted

仅内部核验或按案件临时授权：

- 完整聊天；
- 完整电话号码、邮箱、账号标识；
- 付款截图；
- 邮件 Header；
- 原始文件元数据；
- 未公开社交账号；
- 完整钱包与收款标识（视风险）；
- 举报人的联系信息。

#### P2 — Highly Sensitive

MVP 中只有站长/隐私管理员可管理：

- 身份证、护照；
- 银行账户实名；
- 家庭住址；
- GPS；
- 设备序列号；
- 受害者真实身份；
- 私人账户登录记录；
- 法律文书中的高敏内容；
- 能直接识别未公开个人的资料。

### 10.2 字段级默认公开策略

| 字段 | 默认分类 | 公开策略 |
|---|---:|---|
| 损失金额 | P0 | 原币种公开；证据支持与自述分开统计 |
| 大致日期 | P0 | 可降低到日/月级，避免暴露具体行程 |
| 诈骗渠道 | P0 | 公开 |
| 诈骗话术 | P0/P1 | 摘要公开，完整聊天不公开 |
| 网站/域名 | P0 | 去武器化显示，如 `example[.]com` |
| TG/QQ/机器人 | P0/P1 | 审核后公开；必要时遮蔽部分字符 |
| 头像 | P0/P1 | 可公开被诈骗身份使用的派生图，不声称照片本人是骗子 |
| 钱包地址 | P0/P1 | 按风险和证据公开 |
| 银行账户 | P1/P2 | 默认不完整公开 |
| 付款截图 | P1/P2 | 不公开原件，只生成核验结论 |
| 完整聊天 | P1 | 不公开；可生成脱敏片段 |
| 姓名/电话/邮箱 | P1/P2 | 不公开 |
| 身份证件 | P2 | 不公开 |
| EXIF 设备/GPS | P1/P2 | 不公开原始值；仅用于核验 |
| 文件 Hash | P0 | 可公开，前提是不会间接暴露敏感内容 |

### 10.3 多维授权

授权不能只有“同意使用”一个总开关。建议至少记录：

```yaml
consent:
  internal_verification: true
  public_sanitized_case: true
  cross_case_matching: true
  aggregate_statistics: true
  collective_case:
    anonymous_count_and_amount: true
    redacted_evidence: false
    contact_me_if_escalated: true
    identity_and_contact_disclosure: false
  research_recontact: false
```

用户可在披露前撤回或修改授权。已经依法完成的披露无法保证从接收方撤回，提交前必须明确提示。

### 10.4 私密标识的跨案匹配

电话、邮箱、银行账号等取值空间较小，不能只用普通 SHA-256 保存匹配键，否则容易被穷举。

建议：

- 原始值加密保存；
- 规范化后生成 `HMAC-SHA256(normalized_value, secret_pepper)` 作为私密匹配键；
- 公共页面只显示遮蔽值或“存在相同受保护标识”；
- HMAC 密钥不进入 GitHub，不与应用普通环境变量混放；
- 密钥轮换需要版本字段。

---

## 11. 时间模型：必须区分“发生时间”和“我们知道的时间”

每个事件或证据至少支持以下时间字段：

| 时间 | 含义 | 可信度说明 |
|---|---|---|
| `event_time` | 诈骗行为实际发生时间 | 可能来自受害者陈述 |
| `displayed_time` | 截图或聊天界面显示时间 | 可被界面或设备时区影响 |
| `file_claimed_created_at` | 文件元数据声称的创建时间 | 可修改，不等于事实 |
| `file_claimed_captured_at` | EXIF 等声称的拍摄时间 | 可修改，不等于事实 |
| `earliest_verifiable_at` | 第一次可由独立来源验证其存在的时间 | 比单独 EXIF 更强 |
| `submitted_at` | 用户提交时间 | 服务器记录 |
| `ingested_at` | 系统接收并进入 Evidence Vault 的时间 | 服务器记录 |
| `hashed_at` | 生成 Evidence Receipt 的时间 | 服务器记录 |
| `published_at` | 首次进入公共视图的时间 | 系统记录 |
| `recorded_at` | 平台写入某项知识的时间 | 系统时间 |
| `valid_from / valid_to` | 某个 Assessment 在知识层有效的区间 | 用于版本化 |

技术上建议采用双时间或近似双时间模型：

- **Valid time**：主张所描述的现实时间；
- **System time**：平台何时记录或改变该知识。

这样可以回答：“2026 年 6 月时网站相信什么？”以及“现在为什么改变了？”

---

## 12. 证据处理与完整性

### 12.1 上传后的固定流程

1. 校验文件类型、大小和扩展名；
2. 在隔离环境中执行病毒和恶意内容扫描；
3. 生成 Evidence ID；
4. 计算 SHA-256；
5. 记录服务器接收时间与文件大小；
6. 将原件加密写入 Evidence Vault；
7. 提取文件元数据；
8. 提取 OCR、可识别 Indicator 和相似性特征；
9. 检测 PII，确定 P0/P1/P2；
10. 生成脱敏或缩略派生件；
11. 创建 Evidence Receipt；
12. 进入人工审核队列。

### 12.2 原件与派生件

- 原件在保留期间不允许原地编辑。
- 脱敏图片、OCR 文本和预览文件必须是新的 Evidence Derivative。
- 每个派生件记录 `derived_from`、处理步骤、工具版本、时间和操作者。
- 原件删除时，派生件按依赖关系重新评估是否也应删除。

### 12.3 元数据措辞要求

平台只能说：

> 文件元数据显示 `DateTimeOriginal = ...`。

不能仅凭 EXIF 说：

> 照片确定拍摄于该时间。

元数据是 Observation，真实性仍需其他 Evidence 支持。

### 12.4 可选时间锚定

MVP 使用 Evidence Receipt、服务器时间、审计日志和签名发布快照即可。后续可选：

- RFC 3161 时间戳；
- 每日 Evidence Receipt Merkle Root；
- 公共数据版本的签名 Release；
- 只锚定 Root Hash，不上链原始文件、个人信息或完整 Indicator。

---

## 13. 交叉比对与关联引擎

### 13.1 匹配层级

| 匹配类型 | 例子 | 默认强度 | 是否自动公开关系 |
|---|---|---:|---|
| 精确稳定标识 | 钱包地址、TG numeric ID、QQ 号 | 强 | 否，先自动建候选再复核 |
| 规范化精确标识 | 大小写、空格、URL 参数归一化后的相同值 | 强 | 否 |
| 文件精确匹配 | SHA-256 相同 | 强 | 否 |
| 私密 HMAC 匹配 | 相同电话/银行标识但公开值隐藏 | 强 | 仅公开“存在受保护共同标识” |
| 头像感知 Hash | pHash 距离接近 | 中 | 不自动 |
| 图像 Embedding | 视觉相似 | 中/弱 | 不自动 |
| 文本模板 | 相同话术、页面标题、客服脚本 | 中/弱 | 不自动 |
| 同名或相似显示名 | “David Chen”等 | 弱 | 不创建操作者归属 |

### 13.2 独立性检查

相同内容只有在来源真正独立时才增强 Claim。系统需记录：

- 提交者账户和设备风险信号；
- 是否为同一文件重复上传；
- 是否引用同一公开来源；
- 是否由同一推荐链接引导投稿；
- 是否存在批量账号或协调行为；
- 是否是同一受害者重复提交。

独立性影响证据权重，但不对公众暴露用户身份。

### 13.3 关系措辞

允许公开：

> 两个独立 Case 中观察到相同 Telegram 用户名。

谨慎公开：

> 两个 Case 可能属于同一 Campaign，依据是一个精确标识和两个相似基础设施。

禁止自动公开：

> 两个案件由同一个现实人物或同一个诈骗集团操控。

除非存在足够的归属证据和人工 Decision。

---

## 14. Claim、证据关系与判断状态

### 14.1 Claim 必须足够原子化

错误示例：

> 张三通过 Telegram 骗了受害者 5000 元，并属于某集团。

正确拆分：

1. 受害者支付了 5000 元；
2. 付款发生在某日期；
3. 沟通账号为 `@abc123`；
4. `@abc123` 在本事件中被用于诱导付款；
5. 账号显示名为张三；
6. 头像来自张三公开照片；
7. 张三本人控制该账号；
8. 该账号与 Campaign X 有关联。

其中第 1–6 条可能有证据，第 7 条可能未知，第 8 条可能只是候选。

### 14.2 证据关系

`claim_evidence` 至少支持：

- `SUPPORTS`；
- `CONTRADICTS`；
- `CONTEXTUALIZES`；
- `SUPERSEDES`；
- `DUPLICATES`。

### 14.3 Claim 状态

建议状态：

- `UNVERIFIED`：仅有未经核验陈述；
- `REPORTED`：第一方报告已记录；
- `SUPPORTED`：有部分原始资料；
- `CORROBORATED`：多个独立证据相互印证；
- `VERIFIED`：当前证据链较强；
- `DISPUTED`：有正式反证或申诉；
- `UNDER_REVIEW`：正在复核；
- `MODIFIED`：主张范围或措辞被改变；
- `RETRACTED`：当前不再支持原主张；
- `SUPERSEDED`：被新的 Claim 替代；
- `MERGED`：与另一 Claim 合并；
- `DUPLICATE`：重复记录；
- `INVALIDATED`：证据被证明无效或不相关。

状态不是数值信誉分，不能简单相加决定现实身份。

### 14.4 Decision Record

每次重要判断必须记录：

- 前一状态；
- 新状态；
- 公开理由；
- 内部完整理由；
- 支持证据；
- 反对证据；
- 影响的 Case、Campaign、Indicator；
- 审核者；
- 决定时间；
- 是否需要通知提交者或申诉人。

---

## 15. Case 模型与页面规格

### 15.1 Case 不是数据所有者

Case 只引用 Evidence、Observation、Claim、Indicator、Payment 和 Decision。相同 Indicator 不应在多个 Case 中复制为互不关联的文本值。

### 15.2 Case 页面模块

1. 顶部摘要：诈骗类型、时间、持续时长、付款次数、支持损失、入口和发现方式。
2. 当前状态：是否存在争议、最近更新时间、关联 Campaign。
3. 诈骗时间线。
4. 多方角色：广告账号、机器人、电话销售、群管理员、账户经理、假客服、收款标识等。
5. 付款路径：每笔或可得范围内的分段记录。
6. 信任是如何建立的。
7. 受害者为什么继续付款。
8. 如何发现被骗。
9. 如果当时知道哪些信号，可能在哪一步停止。
10. Indicator 列表与关联 Case。
11. 证据矩阵 / Evidence trail：哪些 Claim 有什么类型的证据。
12. 知识时间线。
13. 结论时间线。
14. 申诉与更正入口。

### 15.3 Case 卡片示例

> **AI 投资诈骗｜持续约 52 天｜36 次付款**  
> 入口：Deepfake 广告 → 电话 → Telegram  
> 首次付款：小额试投  
> 信任强化：真实返还一小笔资金并允许早期提现  
> 最终暴露：全额提现时要求继续缴费并失联  
> **关键误区：成功提过一次钱，不代表平台真实。**

---

## 16. Campaign 模型与页面规格

### 16.1 Campaign 的定义

Campaign 是一组 Case 与基础设施关联的当前工作假设。它不是对幕后现实组织的自动定罪。

### 16.2 Campaign 统计必须分层

- 独立报告数；
- 经证据支持的报告数；
- 仅观察未付款人数；
- 经证据支持的损失；
- 自述但未充分核验的损失；
- 中位损失；
- 按国家/地区分布；
- 首次和最近观察（Trail first seen / 首次发现，Trail last seen / 最近发现）；
- 最近 24 小时、7 天、30 天的新报告；
- 关联网站、TG 群、机器人、头像、钱包和受保护标识数；
- 关联强度与争议状态。

### 16.3 活动状态措辞

建议显示：

- `ACTIVE`：配置窗口内仍有新观察；
- `RECENTLY_OBSERVED`：近期出现过；
- `NO_RECENT_OBSERVATION`：一段时间未发现新报告；
- `DISPUTED`：Campaign 聚类本身存在争议；
- `MERGED`：并入其他 Campaign。

不得仅因没有新报告就写“诈骗集团已消失”。

### 16.4 Campaign 页面核心模块

- “你不是唯一一个”的人数和损失聚合；
- 最近活动；
- 共享基础设施图；
- 常见受害路径；
- 支持与尚未确认的关联；
- 受保护共同标识提示；
- 最近新发现的链接（Connected trails / 关联痕迹）；
- 相关 Case；
- “我也遇到了”和“我有新证据”结构化入口。

---

## 17. 申诉、反证与公开改判

### 17.1 申诉目标

申诉只能指向一个或多个具体 Claim。一个 Case 可以保持“诈骗发生”成立，同时撤回“某现实人物是操作者”的错误归属。

### 17.2 新旧证据比较维度

- 是否为原始文件；
- 是否来自独立来源；
- 是否有更早的可独立验证时间；
- 是否存在修改或导出痕迹；
- 是否能解释原有证据；
- 是否支持身份盗用、账号转让、号码重新分配等替代解释；
- 是否与其他 Evidence 一致；
- 是否由协调提交者重复制造。

“时间更早”很重要，但不是自动胜诉。EXIF 更早不等于真实更早；公开可验证的早期发布、原始设备文件和独立来源组合更有说服力。

### 17.3 审核期间的公开显示

Claim 进入正式争议后，公共页面应即时显示：

> Previously verified — under review / 该主张此前已核验，目前因新反证正在复核。

完成后可以：

- `UPHELD`；
- `MODIFIED`；
- `PARTIALLY_RETRACTED`；
- `RETRACTED`；
- `IDENTITY_MISATTRIBUTION`；
- `DUPLICATE_OR_COORDINATED_SUBMISSION`。

### 17.4 传播更新

Decision 完成后必须：

- 更新所有引用该 Claim 的 Case；
- 更新相关 Campaign 的人数与关联强度；
- 更新 Indicator 页面；
- 重新计算搜索索引；
- 记录公共变更；
- 通知有权限的相关提交者；
- 检查是否需要撤回或更新已生成但尚未披露的 Collective Case 包。

---

## 18. Collective Case 与披露机制

### 18.1 建立条件

不设置单一金额阈值。系统应根据以下维度产生升级候选：

- 同一司法辖区的独立报告人数；
- 经证据支持的损失；
- 活动是否仍在持续；
- 共享基础设施是否足够强；
- 付款证据比例；
- 受害路径是否高度重复；
- 是否涉及弱势群体或持续性风险；
- 已获得何种授权；
- 是否存在可操作的接收机构。

达到阈值只创建人工评估任务。

### 18.2 用户授权层级

用户可以选择：

1. 不加入集体案件；
2. 仅匿名计入人数和金额；
3. 允许提交脱敏证据；
4. 达到条件时联系我重新决定；
5. 允许提供身份和联系方式。

默认不把身份和完整证据交给任何第三方。

### 18.3 材料包结构

1. Executive Summary；
2. Campaign 方法与限制；
3. 司法辖区内的匿名受害者表；
4. 经支持和自述损失的分开统计；
5. 诈骗路径与角色分工；
6. 共享基础设施图；
7. Evidence Manifest：ID、Hash、类型、权限，不默认含原件；
8. 授权矩阵；
9. 仅在授权时加入的脱敏附件；
10. 仅在进一步授权时加入的联系人清单；
11. 已知争议和不确定性；
12. Package Version、Hash 和生成时间。

### 18.4 核验接收机构

在披露前：

- 通过独立官方渠道核验机构与人员身份；
- 要求案件编号或正式接收依据；
- 确认所需范围；
- 禁止通过来路不明的私聊账号交付；
- 由站长确认授权覆盖；
- 生成一次性、最小化、可审计的材料包；
- 接收方不获得后台账号或全库权限。

### 18.5 披露审计

必须记录：

- 接收机构；
- 经核验的接收人；
- Collective Case ID；
- 披露目的与依据；
- 包含字段和 Evidence ID；
- 排除字段；
- Package Hash；
- 发送方式和时间；
- 是否通知用户；
- 后续回执与状态。

---

## 19. 参考系统架构

![系统总体架构](assets/architecture.png)

### 19.1 推荐组件

1. **Public Web App**：公开浏览、搜索和投稿表单。
2. **API / Application Service**：认证、报告、授权、审核、Claim、Campaign、Dispute。
3. **PostgreSQL**：结构化知识、权限、状态机和审计索引。
4. **Encrypted Object Storage**：Evidence 原件与派生件。
5. **Worker / Queue**：病毒扫描、Hash、元数据、OCR、相似特征、脱敏任务。
6. **Search Service**：MVP 可使用 PostgreSQL FTS + `pg_trgm`；后续再引入专门搜索。
7. **Private Match Service**：规范化、HMAC 和相似性候选。
8. **Public Snapshot Exporter**：输出脱敏 JSON/YAML 到 GitHub。
9. **Audit Service**：记录隐私访问、Decision、披露和删除。
10. **Notification Service**：补充资料、关联更新、申诉、重新授权提醒。

### 19.2 参考技术栈

技术选择可替换，以下作为默认参考：

- Web：Next.js + TypeScript；
- API：Next.js Server 或 NestJS；
- Worker：Python 或 Node.js，隔离执行文件解析；
- 数据库：PostgreSQL；
- 相似搜索：`pg_trgm`，后续可选 `pgvector`；
- 对象存储：S3 兼容、版本化、服务端加密；
- 队列：Redis/BullMQ 或云队列；
- CI/CD：GitHub Actions；
- 公共部署：可选择 GitHub Pages 仅承载静态公共快照，或使用支持服务端功能的平台；
- 私有服务：不得仅依赖 GitHub Pages，因为投稿、证据和权限需要安全后端。

### 19.3 关键架构结论

早期“全部数据用 GitHub YAML 驱动静态站”的方案不足以支持：

- 原始证据上传；
- 隐私分级；
- 用户授权；
- 动态匹配；
- 申诉；
- 审计；
- Collective Case。

因此，生产数据库和 Evidence Vault 必须是权威源；GitHub 保存公共镜像和社区建议。

---

## 20. 数据模型

### 20.1 核心表

#### `users`

- `id`
- `role`
- `status`
- `email_ciphertext`
- `email_match_hmac`
- `created_at`
- `last_login_at`
- `mfa_enabled`

#### `reports`

- `id`
- `submitter_id`
- `report_type`
- `status`
- `country_code`
- `region_generalized`
- `incident_started_at`
- `incident_ended_at`
- `narrative_private`
- `submitted_at`
- `source_channel`
- `duplicate_of_report_id`

#### `payments`

- `id`
- `report_id`
- `sequence`
- `occurred_at`
- `currency`
- `amount_declared`
- `amount_supported`
- `method`
- `claimed_reason`
- `recipient_indicator_id`
- `evidence_status`

#### `evidence_objects`

- `id`
- `report_id`
- `storage_key`
- `sha256`
- `size_bytes`
- `mime_type`
- `privacy_class`
- `submitted_at`
- `ingested_at`
- `hashed_at`
- `malware_status`
- `retention_status`
- `deleted_at`

#### `evidence_derivatives`

- `id`
- `source_evidence_id`
- `operation`
- `tool_version`
- `storage_key`
- `sha256`
- `privacy_class`
- `created_at`

#### `evidence_metadata`

- `id`
- `evidence_id`
- `key`
- `value_ciphertext_or_json`
- `source_type`
- `confidence_note`
- `privacy_class`

#### `observations`

- `id`
- `evidence_id`
- `type`
- `raw_value_ciphertext`
- `normalized_public_value`
- `private_match_hmac`
- `event_time`
- `displayed_time`
- `earliest_verifiable_at`
- `privacy_class`
- `review_status`

#### `entities`

- `id`
- `type`
- `public_label`
- `status`
- `identity_warning`
- `first_observed_at`  # 公开文案：Trail first seen / 首次发现
- `last_observed_at`   # 公开文案：Trail last seen / 最近发现

#### `entity_identifiers`

- `id`
- `entity_id`
- `identifier_type`
- `public_value`
- `private_value_ciphertext`
- `match_hmac`
- `valid_from`
- `valid_to`
- `privacy_class`

#### `claims`

- `id`
- `subject_entity_id`
- `predicate`
- `object_entity_id_or_value`
- `public_statement`
- `private_statement`
- `status`
- `confidence_tier`
- `visibility`
- `valid_from`
- `valid_to`
- `recorded_at`
- `superseded_by_claim_id`

#### `claim_evidence`

- `claim_id`
- `evidence_id`
- `relation_type`
- `strength`
- `independence_group_id`
- `reviewer_note`

#### `relationships`

- `id`
- `source_entity_id`
- `target_entity_id`
- `relationship_type`
- `match_method`
- `similarity_score`
- `status`
- `confidence_tier`
- `public_visibility`
- `basis_claim_id`
- `first_observed_at`
- `last_observed_at`

#### `cases`

- `id`
- `public_slug`
- `title`
- `status`
- `country_code`
- `incident_started_at`
- `incident_ended_at`
- `published_at`
- `last_knowledge_update_at`

#### `case_claims`, `case_entities`, `case_reports`

连接 Case 与底层知识对象，不复制原始事实。

#### `campaigns`

- `id`
- `public_slug`
- `title`
- `status`
- `first_observed_at`  # Trail first seen
- `last_observed_at`   # Trail last seen
- `published_at`
- `link_confidence`
- `disputed_at`

#### `campaign_cases`, `campaign_entities`

记录聚类成员与关联理由。

#### `disputes`

- `id`
- `claim_id`
- `challenger_id`
- `status`
- `summary_private`
- `public_notice`
- `submitted_at`
- `resolved_at`

#### `decisions`

- `id`
- `claim_id`
- `previous_status`
- `new_status`
- `public_reason`
- `private_reason`
- `decided_by`
- `decided_at`

#### `consents`

- `id`
- `user_id`
- `report_id`
- `policy_version`
- `purpose`
- `granted`
- `granted_at`
- `revoked_at`

#### `collective_cases`

- `id`
- `campaign_id`
- `jurisdiction`
- `status`
- `threshold_snapshot_json`
- `created_at`
- `approved_by`

#### `disclosure_packages`

- `id`
- `collective_case_id`
- `version`
- `package_hash`
- `recipient_verified_id`
- `scope_manifest_json`
- `generated_at`
- `disclosed_at`

#### `audit_events`

- `id`
- `actor_id`
- `action`
- `target_type`
- `target_id`
- `reason_code`
- `metadata_json`
- `created_at`
- `integrity_hash`

### 20.2 数据关系原则

- Evidence 可以支持或反驳多个 Claim。
- Claim 可以出现在多个 Case。
- Indicator 只保存一份稳定实体，多个 Case 引用它。
- Campaign 聚合 Case，但关联本身必须有 Claim 或 Relationship 依据。
- Decision 采用追加写，不覆盖旧 Decision。
- 公共统计从当前有效数据计算，不手工写死。

---

## 21. 状态机

### 21.1 Report

```text
DRAFT
  → SUBMITTED
  → QUARANTINED
  → TRIAGE
  → NEEDS_INFORMATION | STRUCTURED
  → PARTIALLY_VERIFIED | VERIFIED
  → PUBLISHED | NOT_PUBLISHED | WITHDRAWN
```

### 21.2 Evidence

```text
UPLOADED
  → QUARANTINED
  → SAFE | REJECTED_MALWARE
  → HASHED
  → EXTRACTED
  → CLASSIFIED
  → REVIEWED
  → RETAINED | DELETION_REQUESTED | DELETED_TOMBSTONE
```

### 21.3 Claim

```text
UNVERIFIED → REPORTED → SUPPORTED → CORROBORATED → VERIFIED
                                ↘ DISPUTED → UNDER_REVIEW
                                               ↘ UPHELD
                                               ↘ MODIFIED
                                               ↘ RETRACTED
```

### 21.4 Campaign

```text
SUSPECTED → EMERGING → ACTIVE → RECENTLY_OBSERVED → NO_RECENT_OBSERVATION
                    ↘ DISPUTED
                    ↘ MERGED
```

### 21.5 Collective Case

```text
MONITORING
  → THRESHOLD_CANDIDATE
  → OWNER_REVIEW
  → CONSENT_COLLECTION
  → PACKAGE_DRAFT
  → PACKAGE_READY
  → RECIPIENT_VERIFIED
  → DISCLOSED
  → FOLLOW_UP
```

---

## 22. API 轮廓

### 22.1 公共读取

- `GET /api/public/cases`
- `GET /api/public/cases/{id}`
- `GET /api/public/campaigns`
- `GET /api/public/campaigns/{id}`
- `GET /api/public/indicators/{id}`
- `GET /api/public/search?q=`
- `GET /api/public/methodology`
- `GET /api/public/changes`

### 22.2 用户投稿

- `POST /api/reports`
- `PATCH /api/reports/{id}`
- `POST /api/reports/{id}/payments`
- `POST /api/reports/{id}/evidence/init`
- `POST /api/reports/{id}/evidence/complete`
- `PUT /api/reports/{id}/consents`
- `POST /api/reports/{id}/submit`
- `POST /api/reports/{id}/supplements`
- `GET /api/me/reports/{id}`
- `GET /api/me/reports/{id}/access-log`

### 22.3 申诉

- `POST /api/claims/{claimId}/disputes`
- `POST /api/disputes/{id}/evidence/init`
- `GET /api/me/disputes/{id}`

### 22.4 内部审核

- `GET /api/internal/intake`
- `POST /api/internal/evidence/{id}/classify`
- `POST /api/internal/observations`
- `POST /api/internal/claims`
- `POST /api/internal/claims/{id}/assessment`
- `POST /api/internal/relationships`
- `POST /api/internal/cases`
- `POST /api/internal/campaigns`
- `POST /api/internal/decisions`

### 22.5 Collective Case

- `POST /api/internal/collective-cases`
- `POST /api/internal/collective-cases/{id}/consent-snapshot`
- `POST /api/internal/collective-cases/{id}/packages`
- `POST /api/internal/recipients/verify`
- `POST /api/internal/disclosure-packages/{id}/approve`
- `POST /api/internal/disclosure-packages/{id}/mark-disclosed`

### 22.6 API 安全要求

- 公共和内部 API 分离授权域；
- P2 API 只允许站长角色；
- 文件上传使用短时预签名 URL；
- 所有读取 P1/P2 的请求必须提供目的码；
- 关键写入需要幂等键；
- 公开接口限流；
- 管理接口强制 MFA；
- 所有披露和删除操作需要二次确认及审计。

---

## 23. GitHub 仓库与社区共建

### 23.1 推荐仓库结构

```text
scamtrail/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── schemas/
│   ├── taxonomy/
│   ├── public-data-client/
│   └── redaction/
├── public-data/
│   ├── cases/
│   ├── campaigns/
│   ├── indicators/
│   └── releases/
├── docs/
│   ├── methodology/
│   ├── governance/
│   ├── privacy/
│   └── architecture/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── public-source.yml
│   │   ├── correction.yml
│   │   ├── taxonomy.yml
│   │   └── security.yml
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── validate-public-data.yml
│   │   ├── deploy.yml
│   │   └── signed-release.yml
│   └── CODEOWNERS
├── CONTRIBUTING.md
├── DATA_POLICY.md
├── EDITORIAL_POLICY.md
├── PRIVACY.md
├── SECURITY.md
└── README.md
```

### 23.2 GitHub 可接受的贡献

- 代码；
- 测试；
- UI 和可访问性；
- 分类与术语；
- 翻译；
- 公开来源补充；
- 已发布字段的纠错建议；
- 公共数据验证器；
- 公开脱敏算法改进。

### 23.3 不通过 GitHub 接收

- 身份证；
- 付款截图；
- 完整聊天；
- 私人手机号或邮箱；
- 未公开现实人物指控；
- 原始受害者证据。

GitHub Issue 应明确警告用户不要上传个人信息，并将受害者导向安全投稿入口。

### 23.4 分支和发布治理

- `main` 受保护；
- 生产代码和公共数据变更必须经 PR；
- CODEOWNERS 覆盖 Schema、公共数据和安全目录；
- 公共数据发布由生产导出任务生成；
- PR 不直接决定 Claim 真伪；
- Release 生成签名清单和公开数据 Hash；
- 禁止 Force Push；
- 安全漏洞走私密报告渠道。

### 23.5 许可证建议

需法律复核。可作为起点：

- 代码：AGPL-3.0-or-later（强调托管修改回馈）或 Apache-2.0（强调采用）；
- 文档：CC BY-SA 4.0；
- 脱敏公共数据：ODC-BY 或 CC BY 4.0，前提是已彻底排除私人原始资料；
- Evidence Vault 与内部数据：不开放授权。

“开源代码”和“开放数据”应使用不同许可证与政策文件。

---

## 24. 安全、隐私与反投毒要求

### 24.1 文件安全

- 上传文件在隔离容器中处理；
- 禁止直接在审核人员设备上打开未知文件；
- 扫描压缩包、宏、脚本和双扩展名；
- 对图片、PDF、视频生成安全预览；
- 限制文件类型和解析器；
- 解析失败不影响原件 Hash 回执；
- 原始下载默认关闭。

### 24.2 数据安全

- 传输 TLS；
- 数据库和对象存储加密；
- P2 使用独立密钥和权限域；
- 短时签名 URL；
- 管理员 MFA；
- Session 绑定与异常登录检测；
- 备份加密并测试恢复；
- 日志不记录原始敏感值；
- Secret 不进入仓库。

### 24.3 数据投毒防御

- 投稿先隔离；
- 账号信誉只决定审核优先级，不决定真伪；
- 提交者独立性聚类；
- 文件 Hash 去重；
- 公共来源引用链去重；
- 高风险现实身份 Claim 默认不发布；
- 重要身份 Claim 需要更高证据门槛；
- 批量协调提交触发人工复核；
- 新关联默认是 Candidate，不立即成为 Public Relationship；
- Review 和 Publish 分离为两个动作；
- 任何核心维护者也不能无审计修改 Claim。

### 24.4 访问审计

每次 P1/P2 查看至少记录：

- 访问者；
- Evidence / Report；
- 目的码；
- 时间；
- 是否预览或导出；
- 会话；
- 结果；
- 关联 Case/Dispute/Collective Case。

提交者可查看与自己资料有关的简化访问历史。

### 24.5 删除与保留

- 用户可请求删除未进入必要争议或已披露流程的私人资料；
- 删除必须覆盖对象存储、派生件、缓存和索引；
- 保留最小化 Tombstone 记录删除事实；
- 已公开 Claim 需要重新评估是否仍有其他独立 Evidence；
- 已披露资料不能承诺从第三方召回；
- 不同司法辖区的保留期限作为配置，而非写死在代码中。

---

## 25. AI 与自动化边界

### 25.1 可以自动化

- 文件类型检测；
- Hash；
- OCR；
- EXIF/PDF/视频元数据提取；
- 域名、账号、钱包、金额和时间候选；
- 文本语言检测与翻译草稿；
- PII 候选；
- 头像相似候选；
- 重复报告候选；
- Case 时间线草稿；
- 公共摘要草稿。

### 25.2 必须人工确认

- 是否是同一 Campaign；
- 是否公开一个 Indicator；
- 现实身份归属；
- Claim 状态；
- 申诉结果；
- 公共措辞；
- Collective Case 激活；
- 警方接收方核验；
- 私人证据披露。

### 25.3 AI 审计

自动提取结果必须记录：

- 模型或工具版本；
- 输入 Evidence ID；
- 输出候选；
- 置信度；
- 人工接受、修改或拒绝结果；
- 最终进入哪个 Observation 或 Claim。

---

## 26. 非功能要求

### 26.1 性能

- 公共详情页的核心内容目标在常规网络下快速首屏显示；
- 搜索结果支持分页和类型筛选；
- 大型关系图按需加载；
- Evidence 原件绝不通过公共 CDN 暴露；
- Campaign 聚合统计预计算或增量更新。

### 26.2 可用性

- 投稿支持保存草稿；
- 上传中断可恢复；
- 复杂字段提供示例；
- 在上传前明确隐私提示；
- Case 和 Campaign 页面避免法律术语堆叠；
- 争议和不确定性使用清晰、人类可理解的语言。

### 26.3 可访问性

- 键盘可操作；
- 表单错误可被屏幕阅读器识别；
- 图谱提供文本替代；
- 不仅用颜色表达状态；
- 公开页面目标达到 WCAG 2.2 AA。

### 26.4 国际化

- 原始语言与译文分开保存；
- 金额保留原币种；
- 统一转换值必须记录汇率来源与日期，MVP 可不做自动换算；
- 时间保存 UTC，并记录原始时区或未知；
- 国家、平台、付款方式和诈骗类型使用稳定 Taxonomy。

### 26.5 可审计性

- 任何公共 Claim 必须能追溯到 Decision；
- 任何 Decision 必须能追溯到 Evidence；
- 任何 P1/P2 披露必须能追溯到 Consent 和 Disclosure Package；
- 任何删除必须能追溯到请求和执行记录。

---

## 27. MVP 范围

### 27.1 必须具备

1. 公开 Case、Campaign、Indicator 浏览与搜索；
2. 无自由评论的结构化报告表单；
3. 分项隐私提示和授权；
4. Evidence 加密存储、Hash 回执、病毒扫描和基础元数据提取；
5. P0/P1/P2 分类；
6. Report、Case、Campaign、Indicator、Claim、Decision 基础模型；
7. 精确标识匹配和私密 HMAC 匹配；
8. 人工审核台；
9. 知识时间线和结论时间线；
10. Claim 申诉与改判；
11. Campaign 聚合统计；
12. Collective Case 候选与人工材料包生成；
13. P2 仅站长管理；
14. 隐私访问和披露审计；
15. 公共数据导出至 GitHub；
16. 开源贡献、数据政策、编辑政策和安全政策。

### 27.2 可以延后

- 头像相似搜索；
- 图像 Embedding；
- 语音指纹；
- 区块链或 RFC 3161 时间锚定；
- 警方专用门户；
- 多机构协作；
- 自动生成完整法律文书；
- 复杂图数据库；
- 移动 App；
- 自动汇率换算；
- 自动 Campaign 聚类发布。

### 27.3 MVP 发布门槛

- 所有公开字段通过 PII 检查；
- 任一私人 Evidence 不可通过公共 URL 获取；
- 公开 Claim 有 Decision 与 Evidence 追溯；
- 申诉后能完整传播更新；
- 未授权报告无法进入披露包；
- P2 权限测试通过；
- 删除流程覆盖原件、派生件和索引；
- GitHub 公共快照不含 P1/P2 字段；
- 安全审查与隐私政策完成；
- 使用真实浏览器完成桌面和移动端测试。

---

## 28. 分阶段实施建议

### M0：治理与定义

- 完成术语、Taxonomy、隐私政策、编辑政策、申诉政策；
- 完成产品名称资产核验：域名、GitHub organization、社交账号、主要司法辖区商标；核验通过前统一使用「诈迹 · ScamTrail」；
- 确定许可证；
- 完成数据模型和威胁模型；
- 建立公共仓库和安全报告渠道。

### M1：基础平台

- 认证；
- Report 表单；
- Consent；
- Evidence Vault；
- Hash、扫描、元数据；
- Audit Log。

### M2：知识与审核

- Observation、Claim、Decision；
- Case Builder；
- 精确匹配；
- 公共 Case 页面；
- 公共数据导出。

### M3：活案件与 Campaign

- Indicator 页面；
- 知识/结论时间线；
- Campaign 聚合；
- 新关联通知；
- 受保护共同标识。

### M4：争议与集体案件

- Claim 申诉；
- 临时争议提示；
- 改判传播；
- Collective Case；
- Consent Snapshot；
- Disclosure Package；
- 接收方核验与披露审计。

### M5：高级分析

- pHash、图像相似；
- 文本模板；
- 风险评分；
- 图谱可视化；
- 时间锚定；
- 多语言和多审核人。

---

## 29. 验收标准示例

### 29.1 隐私

**场景：付款截图含姓名和完整卡号**

- 上传后原件进入 P2；
- 公共页面只显示金额、日期和付款方式；
- 公开 JSON 不含姓名、卡号或原始文件路径；
- 站长查看原件产生审计记录；
- Reviewer 默认只能看到脱敏预览。

### 29.2 私密跨案匹配

**场景：两个报告提交相同电话号码，但都未授权公开**

- 系统通过 HMAC 产生精确候选；
- 公共页面可显示“存在一个相同受保护通信标识”；
- 不显示号码；
- 未经人工审核不能建立 Public Relationship。

### 29.3 活案件更新

**场景：一年后新 Case 出现相同 TG 用户名和头像**

- 系统建立两个 Match Candidate；
- 人工确认 TG 精确匹配、头像相似匹配；
- 两个 Case 同时新增知识时间线事件；
- Indicator 更新最近观察时间（Trail last seen）；
- Campaign 统计重新计算；
- 原有诈骗时间线不被改写。

### 29.4 反证推翻身份归属

**场景：反方提交更早公开照片和原始文件**

- 只挑战“照片中的人控制诈骗账号”的 Claim；
- Case 的“诈骗发生”和“账号被用于诈骗”仍保持；
- 争议期间公开临时提示；
- Decision 可将身份 Claim 改为 `RETRACTED`；
- 新 Claim “照片更可能被盗用”可被建立；
- 所有关联页面同步更正。

### 29.5 Collective Case

**场景：美国报告累计达到内部升级候选条件**

- 系统创建候选，不自动发送；
- 仅纳入国家为美国且符合授权的报告；
- 匿名统计、脱敏证据、联系人分别按 Consent 选择；
- 未授权身份资料不进入包；
- 接收机构核验前无法标记为已披露；
- 披露后记录 Package Hash 和字段清单。

---

## 30. 测试策略

### 30.1 单元测试

- 账号、域名、钱包、电话规范化；
- HMAC 匹配；
- Consent 判定；
- P0/P1/P2 过滤；
- Campaign 聚合；
- Claim 状态转换；
- Decision 传播；
- 删除依赖关系。

### 30.2 集成测试

- 证据上传到 Hash 回执；
- 派生件与原件关系；
- Report 到 Case 发布；
- 新匹配更新多个 Case；
- Dispute 到 Decision；
- Collective Case 到 Package；
- GitHub 公共数据导出。

### 30.3 安全测试

- 恶意 PDF/Office/压缩包；
- 越权访问 P2；
- 预签名 URL 重放；
- 文件路径遍历；
- 日志 PII 泄露；
- 批量账号投毒；
- CSRF/XSS/SSRF；
- 管理员会话劫持；
- 备份泄露；
- GitHub Actions Secret 泄露。

### 30.4 隐私测试

- 公共 API 字段白名单；
- 搜索索引不含私人原值；
- 删除后缓存清除；
- 用户撤回 Consent 后不再进入新包；
- 受保护匹配只显示抽象关系；
- 公共头像不会带出原始 EXIF。

### 30.5 审核一致性测试

建立一组固定案例，由不同审核者独立处理，比较：

- Claim 拆分是否一致；
- 证据关系是否一致；
- 身份措辞是否谨慎；
- Campaign 关联是否过度推断；
- 申诉结果是否可解释。

---

## 31. 风险清单

| 风险 | 后果 | 核心缓解措施 |
|---|---|---|
| 虚假举报与诬陷 | 伤害无辜者、法律风险 | Claim 原子化、高身份门槛、隔离审核、申诉与撤回 |
| 骗子数据投毒 | 错误关联、系统失信 | 独立性检测、Hash 去重、人工 Publish、信誉不等于真相 |
| 受害者隐私泄露 | 二次伤害 | P0/P1/P2、Evidence Vault、字段级授权、审计 |
| 恶意文件 | 攻击审核人员 | 隔离扫描、安全预览、禁直接打开 |
| 错误头像归属 | 身份盗用受害者被误伤 | Persona/Person 分离、相似仅作候选、强制警示 |
| 号码重新分配 | 老用户被错误关联 | 有效期、首次/最近观察、支持异议与拆分 |
| 单一站长风险 | 账号泄露或误操作 | MFA、加密、审计、备份、未来职责分离 |
| 警方冒充或过度索取 | 非法披露 | 独立核验、最小化材料包、无后台访问 |
| 用户误以为平台已报案 | 错失正式渠道 | 明确状态：记录不等于报案；披露状态可查 |
| AI 过度推断 | 错误定性 | AI 只产生候选，人工 Decision |
| 不可删除上链数据 | 隐私与纠错冲突 | 不上链原始数据，仅可选 Root Hash |
| 项目被诉或下架 | 运营中断 | 方法公开、证据链、谨慎措辞、法律复核、备份 |

---

## 32. 关键决策记录（ADR）

### ADR-001：Case 为动态视图

**决定**：Case 不拥有不可复制的事实，引用底层 Evidence、Claim 和 Indicator。  
**理由**：支持跨案更新、反向生长和全局更正。

### ADR-002：生产数据库为权威源，GitHub 为公共镜像

**决定**：公共数据从生产系统导出。  
**理由**：GitHub 无法承担隐私、授权、动态审核和 Evidence Vault。

### ADR-003：不设自由评论区

**决定**：所有参与通过结构化 Report、Supplement 或 Dispute。  
**理由**：防止人肉、灌水、投毒和隐私泄露。

### ADR-004：P2 仅站长管理

**决定**：MVP 中只有站长/隐私管理员拥有 P2 管理权。  
**理由**：符合当前治理边界；同时用审计和最小权限控制单点风险。

### ADR-005：警方无后台访问

**决定**：只交付特定材料包。  
**理由**：最小化披露、保持授权边界和审计能力。

### ADR-006：MVP 不上链原始数据

**决定**：仅保留本地 Hash、审计和签名公共快照；后续可锚定 Merkle Root。  
**理由**：不可删除与纠错、隐私要求冲突。

### ADR-007：现实身份不是默认公开对象

**决定**：公开 Scam Persona 与基础设施，现实人身份需要极高证明。  
**理由**：账号和照片经常被盗用。

### ADR-008：集体案件人工激活

**决定**：阈值只创建候选任务，不自动报警。  
**理由**：需要核验、授权、司法辖区和接收方判断。

### ADR-009：产品名称为诈迹 · ScamTrail

**决定**：对外中文名「诈迹」，英文名 ScamTrail，完整写法「诈迹 · ScamTrail」。口号为「每个骗局，都会留下痕迹。 / Every scam leaves a trail.」。Trail 是产品语言，不新增核心表。  
**理由**：名称直接对应「人、账号、网站会换，痕迹会留下」的数据模型；避免「骗子名单」语感；可形成 Follow the trail / 追踪诈迹 等界面语言。  
**未决**：域名、GitHub organization、社交账号和主要司法辖区商标核验。核验失败时只替换品牌字符串，不改对象模型。  
**取代**：历史草案名称「偏偏骗骗你」不再用于对外材料。

---

## 33. 开发交付清单

开发团队在进入实现前，应确认以下文件已经形成：

- [x] 产品与技术开发文档（含名称：诈迹 · ScamTrail）；
- [x] MVP 开发计划（ST-PLAN-001）；
- [ ] 名称资产核验：域名、GitHub organization、社交账号、主要司法辖区商标；
- [ ] 数据词典；
- [ ] JSON Schema；
- [ ] OpenAPI 草案；
- [ ] 隐私分类矩阵；
- [ ] Consent 文案和版本机制；
- [ ] 编辑与发布政策；
- [ ] Claim 证据等级规范；
- [ ] 申诉与改判政策；
- [ ] Collective Case 披露政策；
- [ ] Threat Model；
- [ ] GitHub 贡献指南；
- [ ] 安全事件响应方案；
- [ ] 数据删除与保留方案；
- [ ] MVP 验收测试；
- [ ] 初始 10–30 个高质量 Case 种子数据。

---

## 34. 附录：示例公共对象

### 34.1 Public Case Snapshot

```yaml
id: CASE-2026-000127
title: "Telegram 小额激活费诈骗"
status: active_knowledge
incident:
  country: US
  started_at: 2026-07-03
  ended_at: 2026-07-03
loss:
  currency: USD
  declared: 52
  supported: 52
entry_channel: social_bot
communication_channels:
  - telegram
payment_methods:
  - card
trust_factors:
  - large_group_social_proof
  - low_initial_amount
  - fake_verification_process
discovery:
  - repeated_fee_request
  - account_blocked
campaign_id: CAMPAIGN-00042
public_claims:
  - CLM-1001
  - CLM-1002
last_knowledge_update_at: 2026-08-24T06:20:00Z
```

### 34.2 Public Campaign Snapshot

```yaml
id: CAMPAIGN-00042
title: "AI 返佣与激活费活动"
status: active
first_observed_at: 2025-11-03
last_observed_at: 2026-08-23
reports:
  independent: 327
  evidence_supported: 184
losses:
  supported_usd: 8742
  declared_additional_usd: 4193
  median_usd: 47
jurisdictions:
  US: 96
  CA: 27
infrastructure:
  telegram_groups: 7
  bots: 31
  domains: 9
  payment_indicators: 18
warning: >
  这些指标被多个独立案件共同观察到，但不代表已确认幕后现实人物或组织身份。
```

### 34.3 Claim 与反证

```yaml
claim:
  id: CLM-1002
  statement: "头像中的现实人物控制 Telegram 账号 @alpha888"
  status: retracted
  previous_status: verified
  current_assessment: >
    新提交的独立证据更有力地支持照片被盗用，现有证据不足以归属给照片中的现实人物。
  supporting_evidence:
    - E-OLD-01
  contradicting_evidence:
    - E-NEW-09
    - E-NEW-10
  decision_id: DEC-2027-0048
```

### 34.4 私密相同 Indicator 的公共表达

```yaml
relationship:
  cases:
    - CASE-2026-000127
    - CASE-2026-000981
  type: shared_protected_communication_identifier
  match_method: hmac_exact
  confidence: high
  public_value: null
  public_message: "两个案件存在一个经审核的相同受保护通信标识。"
```

---

## 35. 结论

诈迹 · ScamTrail 的公共承诺先落在一句话上：

> 每个骗局，都会留下痕迹。Every scam leaves a trail.

长期价值不来自“发布了多少骗子姓名”，而来自把痕迹连成可跟随、可反证、可审计的路径：

```text
独立小额经历（一条 Trail）
  → 结构化 Report
  → 私有 Evidence 与公开 Claim 分离
  → 跨案件 Indicator 匹配（Connected trails）
  → Case 和 Campaign 持续生长
  → 新证据支持或推翻旧判断
  → 公开可审计的 Decision
  → 按授权形成 Collective Case
  → 最小化提交给经核验的有权机构
  → 后续结果继续反哺知识网络
```

项目最重要的公共承诺应是：

> 每一笔小额损失都值得记录；每一个结论都必须说明证据；每一个错误都必须允许被纠正；每一份私人资料都只能在用户理解并授权的范围内使用。
>
> Follow the trail. 追踪诈迹。
