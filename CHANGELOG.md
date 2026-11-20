# Changelog

All notable changes to **NexusMatch Forge** are documented in this file.

## [1.4.2-beta] - 2026-11-20

### Targeted Recovery & Media Resilience Patch (Audit #3)
- **P1-01 (Conflict-Guarded Backup Restore)**: `restoreCardFromBackupVault()` now enforces snapshot conflict verification by default (`allowExternalChangeOverride = false`, comparing against `expectedSnapshotHash || computeCardSnapshotHash(backup.cardJson)`). If another process or tab modified the card after the snapshot, restoration stops with `EXTERNAL_CARD_MODIFIED` (`0` write requests) and presents a dedicated explicit force-override action in the Editor (`force-restore-card-backup`).
- **P1-02 (Bounded Emergency Inline Fallback on IndexedDB Failure)**: Added `assignEntityMediaWithFallback()` and `enforceEmergencyInlineBudget()` (`MAX_EMERGENCY_INLINE_ITEMS = 8`). In normal operation (`IndexedDB` healthy), `extensionSettings` stores `0` bytes of Base64. Only when `IndexedDB` fails (`open` denied or `QuotaExceededError`) are newly uploaded/generated portraits retained inline with an explicit warning toast and a strict item/byte ceiling so `settings.json` remains protected from bloat (`NMF-013`).
- **P1-03 (Lossless `character_book` Restore & `PARTIAL_RESTORE` + Server-Mutation Readback)**: Switched `restoreCardFromBackupVault()` JSON restoration to `POST /api/characters/merge-attributes` with `'__@@UNSET@@__'` deletion sentinels (avoiding `charaFormatData`'s `world -> character_book` overwrite), guarded `/edit` fallback when an embedded `character_book` exists, added `PARTIAL_RESTORE` and `INTEGRITY_RESTORE_FAILED` post-restore verification, and added pre-classification disk readback in `updateExistingCardInTavern()` to catch hidden server writes followed by `HTTP 500`.
- **P2-01 (Verified `clear-avatar` Placeholder Write)**: Clicking `clear-avatar` on an existing character now deterministically writes a clean monogram placeholder PNG via `/api/characters/edit-avatar` and verifies updated visual PNG chunk bytes (`stripPngCharaChunkBytes`) before clearing `avatarDirty`.

## [1.4.1-beta] - 2026-11-20

### Follow-Up Security & Data-Safety Hardening
- **P1-A (AU Rework Base Isolation)**: Replaced the shared `applyGeneratedToSessionCard()` helper with two strictly isolated constructors (`createCardStateFromGeneratedDraft()` for standalone cards and `applyReworkResultToTavernBase()` for AU Rework). AU Rework now layers parsed LLM results exclusively onto the target original character `A` (`baseState`) and computes `dirtyFields` by actual value comparison against `A`, eliminating any possibility of inheriting `system_prompt`, `post_history_instructions`, `name`, or `avatarId` from a previously edited card `B`.
- **P1-B (Fail-Closed Durable PNG Backup)**: Hardened `saveCardBackup(..., { requireDurable: true })` and `updateExistingCardInTavern()` with structural PNG chunk validation (`isValidNonEmptyPngBytes`: magic bytes, `IHDR` dimensions, intact chunk stream, `IEND`), mandatory `IndexedDB` transaction commit (`onabort`/`onerror` handling including `QuotaExceededError`), and immediate `IndexedDB` readback verification before issuing a single write `POST`. RAM-only fallback is never accepted as a pre-overwrite backup.
- **P1-C (Full Post-Save Invariant Verification)**: Added `verifyPostSaveIntegrity()` after overwrite to verify `fav`, `chat`, `create_date`, `talkativeness`, `depth_prompt`, embedded `character_book`, third-party `data.extensions`, unknown V2 fields, and every requested `dirtyField`. Any mismatch rejects with `INTEGRITY_CHECK_FAILED` while keeping `dirtyFields`, `sourceSnapshotHash`, and the verified Backup Vault intact for one-click recovery.
- **P1/P2-D (Partial-Save Detection, Guarded Auto-Rollback & 1-Click Vault Restore)**: Added explicit `PARTIAL_SAVE` handling across `/api/characters/edit-avatar` and `/api/characters/merge-attributes` with snapshot-guarded automatic rollback to the verified backup if step 2 fails, plus `restoreCardFromBackupVault()` and an in-editor Recovery Banner.
- **P2-E (Race-Free Base64 -> IndexedDB Migration)**: `migrateInlineSessionMediaToVault()` now captures an immutable upfront snapshot synchronously before the first `await` and clears `avatarDataUrl` only after confirmed `IndexedDB` write + readback (`isMediaDurablyPersisted`). Concurrent `saveSettings()` calls and mid-batch `QuotaExceededError` preserve un-migrated inline `Base64` images across browser reloads without data loss.
- **P2-F (Exact Fallback Status Codes)**: Aligned `/api/characters/merge-attributes` -> `/api/characters/edit` compatibility fallback strictly to `HTTP 404 / 405 / 501` (never falling back on `500` or indeterminate errors).
- **P2-G (DOM XSS Sink Hardening & Platform Matrix)**: Added `safeImgSrc()` whitelist (`data:image/png|jpeg|webp|gif;base64` and `blob:` only), escaped session `data-sid` attributes, enabled `{ escapeHtml: true }` on `toastr` notifications, expanded `tests/nmf_audit_suite.test.mjs` to 17 suites covering negative/fault-injection regressions and full `renderWindow()` `innerHTML` DOM sink checks, and clarified target platform support (Desktop + Android / Termux).

## [1.4.0-beta] - 2026-11-20

### Security & Card Data Integrity (Phase A)
- **NMF-001**: Replaced `/api/characters/import` (`preserved_name`) when updating existing characters with SillyTavern's safe editing endpoints (`/api/characters/edit-avatar` + `/api/characters/merge-attributes` with `/api/characters/edit` fallback). Updating an existing character now strictly preserves `chat` binding, `create_date`, `fav` status, `talkativeness`, `depth_prompt`, embedded `character_book`, and third-party `data.extensions`.
- **NMF-001 (Backup & Diff)**: Added automatic pre-overwrite PNG + V2 JSON Backup Vault (`IndexedDB`) with one-click backup download in the Editor, an interactive changed-fields Diff confirmation sheet, and external modification / deletion detection before writing.
- **NMF-002**: Added full character loading via `POST /api/characters/get` (plus `unshallowCharacter` context support) so cards are always loaded in full even when `performance.lazyLoadCharacters` is enabled.
- **NMF-003**: Separated `originalCardData` and `dirtyFields` in the Editor model so lossless Character Card V2 edits preserve unknown fields, `character_book`, and third-party `data.extensions`.
- **NMF-004**: Independent JSON imports now cleanly reset `sourceAvatarId`, `sourceLoadedFromTavern`, previous avatar links, and stale `imagePrompt` values so an imported JSON can never overwrite a previously loaded SillyTavern character.

### Generation Isolation & Concurrency (Phase B)
- **NMF-005**: Removed global `ctx.stopGeneration()` and `GENERATION_STOPPED` emissions from NexusMatch Forge's local Cancel button. Cancelling a task inside NexusMatch Forge never interrupts active SillyTavern chat streaming or other extensions.
- **NMF-006**: Added monotonic `runId` tracking (`state.activeRunId === runId`) and separated non-cancellable file-save operations from cancellable network tasks to prevent state/timer race conditions.
- **NMF-012**: Removed global `CHAT_COMPLETION_SETTINGS_READY` listener that previously mutated `include_reasoning` without request correlation.

### SillyImages & Image Provider Hardening (Phase C)
- **NMF-007**: Implemented strict connection profile snapshot isolation matching `0xl0cal/sillyimages` (`CONNECTION_FIELDS`). Empty `apiKey` or `endpoint` values in a selected profile are never inherited from another profile.
- **NMF-008**: Added full provider validation and request parity for `OpenAI-compatible`, `xAI`, `Gemini`, `OpenRouter` (`enable_base64_output`, `image_size`, URL & DataURL), `Electron Hub` (default endpoint), `Naistera` (negative prompts & bounded polling), `NovelAI` (direct V4.5/V5 generation with Opus Anlas protection), and `AUTOMATIC1111 / Forge`. Documented that SillyImages' in-chat reference libraries (`{{char}}` / `{{user}}` / Lorebook image refs) are not sent during standalone card creation.
- **NMF-009**: Restricted image extension auto-discovery to known adapter IDs (`inline_image_gen`, `sillyimages`, `slay_image_gen`, `inline_image_generation`) and enforced `enabled !== false` and `disabledExtensions` checks.
- **NMF-016**: Added unified per-request timeouts (`fetchWithTimeout`), HTTP status classification (`401/403`, `429`, `5xx`), image `Content-Type` / magic-byte verification, and a 20 MB download cap.

### Core API, Storage & Lifecycle (Phase D & E)
- **NMF-010**: Implemented true SillyTavern Core `jsonSchema` structured output payloads (`FULL_CARD_JSON_SCHEMA`, `TINDER_PREVIEW_JSON_SCHEMA`, `BLITZ_QUESTIONS_JSON_SCHEMA`) and balanced multi-object JSON extraction.
- **NMF-011**: Separated OpenAI Chat Completion preset assembly (preserving `assistant_prefill` even after post-history blocks) from Text Completion API execution (`textCompletionSettings`).
- **NMF-013**: Moved all Base64 portrait and candidate images out of `extensionSettings` into an isolated `IndexedDB` vault (`nmf_media_vault.js`) with automatic legacy migration and orphaned-image garbage collection.
- **NMF-014**: Added versioned settings schema (`settingsSchemaVersion: 2`) with deep crash-proof session normalization and pre-migration snapshots.
- **NMF-015**: Replaced all internal `/script.js`, `/scripts/world-info.js`, and `/scripts/reasoning.js` imports with public `SillyTavern.getContext()` APIs and `/api/settings/get`.
- **NMF-017**: Clarified documentation and labels that `World Sandbox` and `RPG GM Engine` are structured templates packaged inside standard `Character Card V2 (chara_card_v2)`.
- **NMF-018**: Scoped startup `MutationObserver` and disconnected it immediately once UI triggers are mounted.
- **NMF-019**: Cleaned up browser `history.pushState` / `history.back()` modal lifecycle on dialog close.
- **Release Readiness**: Added MIT `LICENSE`, `CHANGELOG.md`, SillyTavern compatibility notes (`>= 1.19.0`, verified on `1.19.1`), and a 26-scenario automated audit test suite (`tests/nmf_audit_suite.test.mjs`).

## [1.3.0-beta] - 2026-11-20
- Initial public Open Beta release with Swipe Deck, Blitz 10, Architect, Multiverse AU Rework, 13 geometric vector themes, and multilingual `{{language}}` support.
