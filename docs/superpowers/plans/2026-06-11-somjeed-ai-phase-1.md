# Somjeed AI Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-usable LINE bot that records income and expenses from receipt/slip images and typed Thai text, stores original images in Google Drive, appends confirmed ledger rows into Google Sheets, and sends a daily summary at 00:30 Asia/Bangkok.

**Architecture:** A TypeScript bot API receives LINE webhooks, verifies signature, immediately acknowledges the event, fetches image content from LINE when applicable, stores raw assets in Google Drive, and uses OpenAI Responses API with Structured Outputs to extract normalized ledger drafts. PostgreSQL is the source of truth for users, drafts, confirmations, jobs, and summary state; Google Sheets is a reporting/export projection, not the canonical database. Daily summaries run on a scheduler and push a Flex summary message to each opted-in user.

**Tech Stack:** Node.js 22, TypeScript, Fastify, `@line/bot-sdk`, OpenAI Responses API, Structured Outputs, Zod, Prisma, PostgreSQL, Google Sheets API, Google Drive API, `pg-boss`, Pino, Vitest, Supertest, Playwright (optional admin/UAT), Docker.

---

## Skill Notes

- I'm using the `writing-plans` skill to create the implementation plan.
- I used the `pdf` skill to extract the supplied PDF text and align this plan to the actual three flows in `C:\Users\menum\Downloads\Somjeed AI Phase 1 Flow.pdf`.
- I did not use desktop automation from `Computer Use` because the PDF had extractable text and no UI interaction was required in this turn.

## Product Scope Locked For Phase 1

### Included

- Flow 1: User sends receipt/slip image in LINE, AI extracts date, merchant, amount, document type, suggested category, user confirms, system saves record, image goes to Drive, row goes to Sheet.
- Flow 2: User types Thai free text such as `รายได้ 3,500 ขายหน้าร้าน`, AI extracts normalized ledger fields, user confirms or edits, system saves record.
- Flow 3: Nightly summary at `00:30 Asia/Bangkok` showing total income, total expense, and net for the current day.
- Category selection for at least:
  - Income: `ขายหน้าร้าน`, `รายรับอื่นๆ`
  - Expense: `ค่าวัตถุดิบ`, `ค่าโฆษณา`, `ค่าสินเชื่อ`
- Thai-first LINE UX.
- Auditability, retries, idempotency, and operator logs.

### Explicit Non-Goals

- OCR fine-tuning.
- Multi-branch accounting.
- Tax/VAT workflows.
- Approval chains.
- Inventory sync.
- Bank statement import.
- Full accounting dashboard beyond basic operational review.

## Recommended Delivery Shape

### Why this architecture

- LINE image content is transient, so the bot must fetch binary content from LINE immediately after receiving the webhook.
- Reply-token flows should stay fast; OCR/vision should run async and answer back with push/flex once parsing is ready.
- Google Sheets is convenient for the business team, but it is weak as a system of record for retries, dedupe, edits, and audit. Use PostgreSQL as source of truth and sync confirmed rows to Sheets.
- OpenAI Structured Outputs is the safest way to force normalized JSON for both image extraction and typed-text parsing.

### Core decisions

- Source of truth: PostgreSQL.
- Reporting/export sink: Google Sheets.
- Original image archive: Google Drive.
- AI API: OpenAI Responses API.
- Extraction format control: Structured Outputs with strict schemas.
- Background jobs: `pg-boss`.
- Scheduler: platform cron hitting a protected summary endpoint or a small runner command.
- Deployment target: one always-on container service plus managed Postgres.

## Proposed Repository Structure

```text
somjeed-ai/
  apps/
    bot-api/
      src/
        app.ts
        server.ts
        config/
          env.ts
        modules/
          ai/
            receipt-extractor.ts
            text-entry-extractor.ts
            schemas.ts
            prompts.ts
          line/
            webhook.route.ts
            webhook.service.ts
            signature.ts
            flex-messages.ts
            postback-actions.ts
          ledger/
            ledger.service.ts
            category-catalog.ts
            ledger.mapper.ts
          conversation/
            session.service.ts
            pending-draft.service.ts
          google/
            drive.service.ts
            sheets.service.ts
            sheet-row.mapper.ts
          summary/
            summary.service.ts
            summary.flex.ts
          jobs/
            boss.ts
            handlers/
              process-image-message.job.ts
              sync-sheet-row.job.ts
              send-daily-summary.job.ts
          security/
            auth.ts
          observability/
            logger.ts
            metrics.ts
      tests/
        contract/
        integration/
        e2e/
  prisma/
    schema.prisma
    migrations/
  docs/
    architecture.md
    runbook.md
    qa-checklist.md
  docker/
    Dockerfile
  .env.example
  package.json
```

## Data Model

### `users`

- `id`
- `line_user_id`
- `display_name`
- `timezone` default `Asia/Bangkok`
- `summary_enabled`
- `summary_target_type` (`user`, `group`)
- `summary_target_id`
- `created_at`

### `source_documents`

- `id`
- `line_message_id`
- `line_event_id`
- `user_id`
- `mime_type`
- `sha256`
- `drive_file_id`
- `drive_web_view_link`
- `document_type`
- `raw_vision_json`
- `processing_status`
- `created_at`

### `ledger_drafts`

- `id`
- `user_id`
- `source_type` (`image`, `text`)
- `source_document_id` nullable
- `entry_type` (`income`, `expense`)
- `occurred_at`
- `merchant_name`
- `amount`
- `currency`
- `category_code`
- `description`
- `confidence_score`
- `needs_manual_amount`
- `needs_manual_date`
- `raw_model_json`
- `status` (`pending_confirmation`, `confirmed`, `edited`, `cancelled`, `expired`)
- `created_at`
- `confirmed_at`

### `ledger_entries`

- `id`
- `draft_id`
- `user_id`
- `entry_type`
- `occurred_at`
- `merchant_name`
- `amount`
- `category_code`
- `description`
- `drive_file_id` nullable
- `sheet_row_key`
- `created_at`

### `conversation_sessions`

- `id`
- `user_id`
- `state`
- `active_draft_id`
- `last_event_id`
- `expires_at`
- `updated_at`

### `job_runs`

- `id`
- `job_name`
- `dedupe_key`
- `status`
- `payload_json`
- `error_message`
- `attempt_count`
- `run_at`
- `finished_at`

## External Integrations

### LINE

- Messaging API webhook endpoint for inbound events.
- Fetch user image content via `GET /v2/bot/message/{messageId}/content`.
- Reply immediately for quick acknowledgement.
- Push message for async parse results and nightly summary.
- Flex Message for draft confirmation and daily summary.

### OpenAI

- Responses API for both:
  - image understanding from receipt/slip photos
  - free-text extraction from Thai messages
- Structured Outputs with separate JSON schemas:
  - `ReceiptDraftSchema`
  - `TextLedgerDraftSchema`

### Google

- Drive folder per environment, for example:
  - `somjeed-dev-receipts`
  - `somjeed-prod-receipts`
- One Google Sheet workbook with tabs:
  - `ledger_entries`
  - `daily_summary`
  - `category_catalog`
  - `audit_export` optional

## Message UX Design

### Image flow

1. User sends image.
2. Bot replies immediately: `กำลังอ่านสลิป/ใบเสร็จ...`
3. Worker fetches image from LINE and uploads to Drive.
4. Worker calls OpenAI vision extraction.
5. Bot pushes a Flex draft:
   - วันที่
   - ร้านค้า/ผู้รับเงิน
   - ยอดเงิน
   - ประเภท: รายรับ/รายจ่าย
   - หมวดหมู่
   - ปุ่ม `ยืนยัน`, `แก้ไข`, `ยกเลิก`
6. If confirmed, write `ledger_entries`, append Sheet row, send success message.
7. If edit, bot enters guided edit state for missing or wrong fields.

### Text flow

1. User types free text.
2. Bot sends extraction preview:
   - จำนวนเงิน
   - ประเภท
   - หมวดหมู่
   - รายละเอียด
3. User confirms or edits.
4. On confirm, persist and sync Sheet.

### Daily summary flow

1. Scheduler runs at `00:30 Asia/Bangkok`.
2. Query confirmed entries for the target date.
3. Calculate:
   - total income
   - total expense
   - net
4. Push Flex summary message.
5. Persist summary delivery log.

## Category Strategy

### Phase 1 category catalog

- `income_storefront` -> `รายรับหน้าร้าน`
- `income_other` -> `รายรับอื่นๆ`
- `expense_ingredients` -> `ค่าวัตถุดิบ`
- `expense_ads` -> `ค่าโฆษณา`
- `expense_loan` -> `ค่าสินเชื่อ`
- `expense_other` -> `รายจ่ายอื่นๆ`

### Rules

- AI suggests category.
- User always has the final say.
- Unknown merchant or ambiguous text defaults to a safe category plus `needs_review=false` only if amount and type are reliable.
- If amount is missing or unreadable, bot must ask user to enter it manually before confirmation.

## Failure Handling Rules

- If LINE image fetch fails, mark job failed and push a retry-friendly message.
- If OpenAI extraction is low confidence, show draft with warning and ask for manual review.
- If Google Drive upload succeeds but Sheets append fails, keep the canonical ledger row and retry Sheet sync from a job queue.
- If duplicate webhook event arrives, ignore via `line_event_id` or message hash dedupe.
- If user never confirms within 24 hours, expire the draft.

## Security Rules

- Verify LINE webhook signature before processing.
- Keep OpenAI, LINE, Google credentials in environment variables or secret manager only.
- Restrict Google service account access to one Drive folder and one Sheet.
- Store only needed PII.
- Log model outputs carefully; redact secrets and access tokens.
- Protect cron/summary endpoint with internal auth.

## Observability Rules

- Structured logs with request ID, LINE event ID, message ID, user ID, job ID.
- Error budget metrics:
  - webhook verification failures
  - image fetch failures
  - model extraction failures
  - Sheet sync failures
  - summary push failures
- Basic admin runbook for replaying failed jobs.

## Acceptance Criteria

### Flow 1

- Sending a real receipt photo results in a confirmation draft with amount, merchant, and date when visible.
- User can confirm without leaving LINE.
- Confirmed row appears in Postgres and Google Sheets.
- Original image exists in Drive with a traceable file ID.

### Flow 2

- Text such as `รายได้ 3,500 ขายหน้าร้าน` parses correctly.
- Text such as `รายจ่าย ซื้อของแมคโคร 3,500` parses correctly.
- User can correct category or description before saving.

### Flow 3

- Daily summary sends at `00:30 Asia/Bangkok`.
- Summary numbers match confirmed entries for that date.
- Failures retry and are visible in logs.

## Delivery Phases

### Task 1: Foundation and Environment Bootstrapping

**Files:**
- Create: `somjeed-ai/package.json`
- Create: `somjeed-ai/apps/bot-api/src/server.ts`
- Create: `somjeed-ai/apps/bot-api/src/app.ts`
- Create: `somjeed-ai/apps/bot-api/src/config/env.ts`
- Create: `somjeed-ai/.env.example`
- Create: `somjeed-ai/docker/Dockerfile`

- [ ] Initialize Node.js 22 + TypeScript workspace and install Fastify, Prisma, `@line/bot-sdk`, OpenAI SDK, Google APIs, `pg-boss`, Zod, Pino, Vitest, Supertest.
- [ ] Define `.env.example` with exact keys: `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `OPENAI_API_KEY`, `DATABASE_URL`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SHEET_ID`, `APP_BASE_URL`, `CRON_SHARED_SECRET`, `TZ`.
- [ ] Add `TZ=Asia/Bangkok` to local and deployment environments.
- [ ] Add `GET /health` and `GET /ready` endpoints.
- [ ] Add Docker image build and local `docker compose` support if the team wants containerized local dev.

### Task 2: Database Schema and Idempotency Layer

**Files:**
- Create: `somjeed-ai/prisma/schema.prisma`
- Create: `somjeed-ai/prisma/migrations/*`
- Create: `somjeed-ai/apps/bot-api/src/modules/ledger/ledger.service.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/conversation/session.service.ts`

- [ ] Define Prisma models for `users`, `source_documents`, `ledger_drafts`, `ledger_entries`, `conversation_sessions`, `job_runs`.
- [ ] Add unique constraints for `line_user_id`, `line_event_id`, `line_message_id`, and job dedupe keys.
- [ ] Add repository/service methods for create-draft, confirm-draft, cancel-draft, expire-draft, and append-summary-log.
- [ ] Run migration locally against dev Postgres and verify schema generation.

### Task 3: LINE Webhook Ingress

**Files:**
- Create: `somjeed-ai/apps/bot-api/src/modules/line/webhook.route.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/line/webhook.service.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/line/signature.ts`

- [ ] Implement raw-body safe webhook endpoint for LINE signature verification.
- [ ] Parse text, image, postback, and follow events.
- [ ] Persist minimal event audit row before branching.
- [ ] For image events, enqueue `process-image-message` and reply with a short acknowledgement message.
- [ ] For text events, run text extraction path or edit-state handler.

### Task 4: OpenAI Extraction Layer

**Files:**
- Create: `somjeed-ai/apps/bot-api/src/modules/ai/schemas.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/ai/prompts.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/ai/receipt-extractor.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/ai/text-entry-extractor.ts`

- [ ] Define `ReceiptDraftSchema` with fields: `entryType`, `occurredAt`, `merchantName`, `amount`, `currency`, `documentType`, `suggestedCategoryCode`, `description`, `confidenceScore`, `needsManualAmount`, `needsManualDate`.
- [ ] Define `TextLedgerDraftSchema` with fields: `entryType`, `amount`, `suggestedCategoryCode`, `description`, `occurredAt`, `confidenceScore`.
- [ ] Build Thai-focused prompts with few-shot examples from the PDF examples.
- [ ] Use Responses API with Structured Outputs so the app gets strict JSON back.
- [ ] Add fallback handling when the model cannot read amount or date confidently.

### Task 5: Google Drive and Google Sheets Sync

**Files:**
- Create: `somjeed-ai/apps/bot-api/src/modules/google/drive.service.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/google/sheets.service.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/google/sheet-row.mapper.ts`

- [ ] Upload original image to Drive and return `drive_file_id`.
- [ ] Map confirmed ledger entries into a stable row schema:
  - `created_at`
  - `occurred_at`
  - `line_user_id`
  - `entry_type`
  - `category`
  - `merchant_name`
  - `amount`
  - `description`
  - `drive_file_id`
  - `source_type`
  - `draft_id`
- [ ] Append rows into the `ledger_entries` tab.
- [ ] Add retryable job for Sheet sync failures so confirmation does not get lost.

### Task 6: Confirmation, Edit, and Cancel UX

**Files:**
- Create: `somjeed-ai/apps/bot-api/src/modules/line/flex-messages.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/line/postback-actions.ts`
- Modify: `somjeed-ai/apps/bot-api/src/modules/conversation/session.service.ts`

- [ ] Build Flex confirmation cards for image and text drafts.
- [ ] Encode `confirm`, `edit`, `cancel`, and `choose-category` actions as postback data.
- [ ] Add edit-state prompts for missing amount, wrong category, wrong merchant, and wrong date.
- [ ] Expire stale sessions after 24 hours.
- [ ] Send success message after both DB commit and Sheet sync enqueue succeed.

### Task 7: Background Jobs and Scheduler

**Files:**
- Create: `somjeed-ai/apps/bot-api/src/modules/jobs/boss.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/jobs/handlers/process-image-message.job.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/jobs/handlers/sync-sheet-row.job.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/jobs/handlers/send-daily-summary.job.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/summary/summary.service.ts`
- Create: `somjeed-ai/apps/bot-api/src/modules/summary/summary.flex.ts`

- [ ] Fetch LINE image content inside the image job before the content expires.
- [ ] Upload to Drive, call vision extraction, save draft, and push confirmation Flex.
- [ ] Compute daily totals from confirmed rows only.
- [ ] Schedule summary run at `00:30 Asia/Bangkok`.
- [ ] Log each summary send attempt and retry transient failures.

### Task 8: Test Matrix

**Files:**
- Create: `somjeed-ai/apps/bot-api/tests/integration/line-webhook.test.ts`
- Create: `somjeed-ai/apps/bot-api/tests/integration/receipt-extractor.test.ts`
- Create: `somjeed-ai/apps/bot-api/tests/integration/text-entry-extractor.test.ts`
- Create: `somjeed-ai/apps/bot-api/tests/integration/google-sync.test.ts`
- Create: `somjeed-ai/apps/bot-api/tests/e2e/daily-summary.test.ts`
- Create: `somjeed-ai/docs/qa-checklist.md`

- [ ] Add signature verification tests for valid and invalid LINE requests.
- [ ] Add receipt fixture tests for at least 5 Thai receipts/slips with varied quality.
- [ ] Add text parsing tests for at least 10 Thai message patterns.
- [ ] Add idempotency tests for duplicate webhook delivery.
- [ ] Add Sheet row mapping tests so exported columns never drift.
- [ ] Add daily summary math test for mixed income and expense entries.

### Task 9: Deployment and Runbook

**Files:**
- Create: `somjeed-ai/docs/architecture.md`
- Create: `somjeed-ai/docs/runbook.md`
- Modify: `somjeed-ai/.env.example`

- [ ] Document exact credential setup for LINE, OpenAI, Google service account, Drive folder sharing, and Sheet access.
- [ ] Document webhook setup and how to verify the public URL in LINE Developers Console.
- [ ] Document cron setup for `00:30 Asia/Bangkok`.
- [ ] Document manual recovery steps for failed OCR, failed sync, and duplicate jobs.
- [ ] Document production smoke test script.

## UAT Checklist

- Use 3 real receipt images:
  - clear printed receipt
  - blurry receipt
  - transfer slip
- Use 5 text commands:
  - `รายได้ 3500 ขายหน้าร้าน`
  - `รายจ่าย ซื้อของแมคโคร 3500`
  - `รายจ่ายค่าโฆษณา 1200`
  - `รายได้ 800 เดลิเวอรี่`
  - `รายจ่าย 450 ค่าน้ำแข็ง`
- Verify:
  - confirmation message is correct
  - edit path works
  - cancel path does not save
  - Drive file exists
  - Sheet row exists
  - summary math is correct

## Recommended Timeline

- Day 1: foundation, env, DB schema
- Day 2: LINE webhook + raw-body signature verification
- Day 3: OpenAI text extraction + confirmation flow
- Day 4: image fetch + Drive upload + vision extraction
- Day 5: Sheets projection + category handling
- Day 6: daily summary + scheduler
- Day 7: tests, UAT, production hardening

## Critical Implementation Notes

- Do not block the webhook on OCR; acknowledge early and push later.
- Do not use Google Sheets as the only database.
- Do not trust AI category selection without a user confirmation path.
- Do not wait until late in the project to test real LINE image events; image content expiry makes local fake tests insufficient.
- Do not log raw secrets or full service-account JSON.

## Primary Source Notes Used For This Plan

- OpenAI Responses API supports text and image inputs and function/tool-based workflows.
- OpenAI Structured Outputs enforces response JSON schema.
- LINE Messaging API supports webhook-driven events, fetching user-uploaded content by message ID, reply messages, push messages, and Flex messages.
- Google Sheets supports append-based write flows and has per-minute quotas, so Sheet writes should be efficient and retryable.
- Google Drive supports file upload flows appropriate for receipt image archival.

## Go/No-Go Gate For Production

- No production cutover until all three flows are verified end-to-end with a real LINE client and real Google integrations.
- No production cutover if duplicate webhooks can create duplicate ledger rows.
- No production cutover if summary totals do not reconcile against confirmed entries.

Plan complete and saved to `docs/superpowers/plans/2026-06-11-somjeed-ai-phase-1.md`. Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `executing-plans`, batch execution with checkpoints.
