<div align="center">

# NexusMatch Forge `[BETA v1.9.6]`

**An Interactive Swipe-Deck, Astral Gacha Summoner & Alchemy Card Fusion, Blitz Quiz, AU Multiverse Adapter, and Safe Character / World / RPG Card V2 Studio for SillyTavern — designed for both Android Mobile and Desktop.**

[**English Documentation**](README.md) · [**Русская документация (RU)**](README.ru.md) · [**Changelog**](CHANGELOG.md) · [**MIT License**](LICENSE)

</div>

---

> **[BETA STATUS & TARGET SILLYTAVERN PLATFORMS]**
> - **Minimum Supported SillyTavern Version:** `1.19.0` (**`1.19.1`** or newer strongly recommended).
> - **Target & Verified Platforms:** Desktop (Windows / Linux / macOS) and **Android (Termux + Mobile Chromium / WebView, verified on Android 16)**. SillyTavern is officially built for Desktop and Android (Termux); physical iOS Safari client testing has not been performed.

---

## Overview

**NexusMatch Forge** is a standalone SillyTavern extension built around a sharp technical geometry aesthetic with **13 handcrafted vector SVG themes** (matching [**Pocket Codex & Forge**](https://github.com/Gerodot535/st-pocket-codex)):

1. **Swipe Deck (`Tinder Mode`)** — swipe through AI-generated character or world previews (`1`, `3`, or `5` per batch), mark disliked tags/reasons, edit or restore rejected cards from the **Passed Archive**, and expand matches into complete V2 cards.
2. **Blitz 10 Questionnaire** — enter any concept and answer up to 10 tailored questions (skip or regenerate individual questions) to synthesize a card.
3. **Free Architect & Multiverse AU Adapter** — build cards from freeform notes with strict word-count targets and **8 content structures** (`19-Point Dossier`, `JED Hybrid`, `Behavioral Prose`, `XML Sheet`, `PList + Ali:Chat`, `Multi-Character Cast`, `World Sandbox`, `RPG GM Engine`), or adapt existing SillyTavern characters into an Alternate Universe (fully compatible with `performance.lazyLoadCharacters`).
4. **Lossless V2 Profile Editor (No AI Required)** — create, edit, import/export `.png` (`chara_card_v2`) and `.json` cards, manage alternate greetings, attach Lorebooks, or open **Pocket Codex & Forge** if installed.

> **Format Note (`World Sandbox` & `RPG GM Engine`):** Both modes are specialized narrator/GM content templates packaged inside the standard **Character Card V2 (`chara_card_v2`)** specification for universal SillyTavern compatibility (they are not separate non-standard file specs).

---

## Card Safety, Backups & Generation Isolation

- **Lossless Surgical Updates:** Updating an existing SillyTavern character uses `/api/characters/edit-avatar` and `/api/characters/merge-attributes` rather than the import endpoint. Untouched attributes — including `fav`, active `chat` binding, `create_date`, `talkativeness`, `depth_prompt`, embedded `character_book`, and third-party `data.extensions` — remain intact.
- **Pre-Overwrite Diff & Automatic Backup Vault:** Before updating an original card, NexusMatch Forge verifies the file on disk, displays a clear changed-fields Diff confirmation sheet, and saves the original PNG + V2 JSON into an `IndexedDB` Backup Vault (with one-click **Download Backup PNG** in the Editor).
- **IndexedDB Media Storage:** Candidate portraits and draft avatars are stored in `IndexedDB` rather than bloating `extensionSettings` / `settings.json`, with automatic cleanup of deleted entries.
- **Isolated Cancellation:** Cancelling a task inside NexusMatch Forge aborts only the local extension task and never calls global `stopGeneration()` on active SillyTavern chats.

---

## LLM Modes & SillyImages Compatibility

### Dual LLM Transport Modes
- **Full Active Preset (`Prefill` Mode):** For **Chat Completion (`openai`)**, assembles your active preset around the task slot (preserving `assistant_prefill` and reasoning blocks) alongside an editable **Correction Override Prompt**. For **Text Completion**, delegates cleanly to SillyTavern's active Context / Instruct templates.
- **Strict JSON Schema (`Core JSON Schema`):** Passes native `jsonSchema` definitions into SillyTavern Core's `generateRawData()` for structured output.

### SillyImages (`0xl0cal/sillyimages`) Integration
NexusMatch Forge reads `inline_image_gen` settings only when the extension is enabled, enforcing strict per-profile credential and endpoint isolation:
- **Supported Providers:** `OpenAI-compatible`, `xAI`, `Gemini`, `OpenRouter`, `Electron Hub`, `Naistera`, `NovelAI` (V4.5 / V5 with Opus Anlas protection), and `AUTOMATIC1111 / Forge`, plus native `/sd`.
- **Adapter Scope & Limitations:** SillyImages' in-chat reference libraries (`{{char}}`, `{{user}}`, chat context images, and Lorebook reference matchers) belong to SillyImages' chat message pipeline and are not transmitted during standalone card portrait generation in NexusMatch Forge.

---

## Installation in SillyTavern

1. Open **SillyTavern** (`>= 1.19.0`) -> **Extensions** panel -> **Install extension**.
2. Paste the repository URL:
   ```text
   https://github.com/Gerodot535/st-nexus-match-forge
   ```
3. Reload the browser page. Open **NexusMatch Forge** from the **Character Management** top bar or the **Extensions** settings panel.

---

## License

Released under the [**MIT License**](LICENSE). Created by [**Gerodot535**](https://github.com/Gerodot535).
