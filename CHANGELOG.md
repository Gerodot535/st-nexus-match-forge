# Changelog

All notable changes to **NexusMatch Forge** are documented in this file.

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
