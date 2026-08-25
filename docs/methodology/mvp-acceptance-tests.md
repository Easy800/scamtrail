# MVP 验收测试大纲

Map ST-DEV-001 §29 onto runnable names. Fixtures are synthetic. No real victim files.

| Id | Spec scene | Test name | First milestone |
|---|---|---|---|
| AT-29.1 | 付款截图含姓名和完整卡号 | `privacy/payment-screenshot-pii` | M1 |
| AT-29.2 | 两报告同号未授权公开 | `match/hmac-protected-phone` | M3 |
| AT-29.3 | 一年后同 TG 与头像 | `living-case/new-trail-same-telegram` | M3 |
| AT-29.4 | 反证只推翻身份归属 | `dispute/identity-retract-keeps-scam-claims` | M4 |
| AT-29.5 | 美国报告达阈值 | `collective/us-threshold-candidate-no-auto-send` | M4 |

## AT-29.1 expect

Original → P2; public page amount/date/method only; public JSON has no name, PAN, or `storage_key`; owner read writes audit; Reviewer sees redacted preview.

## AT-29.2 expect

HMAC candidate; public text “存在一个相同受保护通信标识”; no phone; no Public Relationship without human confirm.

## AT-29.3 expect

Two match candidates; after confirm, both knowledge timelines grow; Trail last seen updates; Campaign recomputes; scam timeline unchanged.

## AT-29.4 expect

Only the identity Claim is challenged; scam-occurred and account-used stay; under-review banner; identity may become `RETRACTED`; pages sync.

## AT-29.5 expect

Candidate only, no send; US + consent filter; identity stays out without grant; cannot `mark-disclosed` before recipient verify; package hash recorded.

Shipped M0 already covers a slice of AT-29.1 at schema level: poisoned public Case with `victim_name` / `full_card_number` / `storage_key` must fail `validatePublicSnapshot`.
