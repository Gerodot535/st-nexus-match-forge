<div align="center">

# NexusMatch Forge `[BETA v2.1.25]`

**An Interactive Swipe-Deck, Astral Gacha Summoner & Soul Alchemy Altar, Vision Photo-to-Card & Concept Art Labs, Blitz Quiz, AU Multiverse Adapter, and Lossless Character / World / RPG Card V2 Studio for SillyTavern — crafted for Android Mobile and Desktop.**

[**English Documentation**](README.md) · [**Русская документация (RU)**](README.ru.md) · [**Changelog**](CHANGELOG.md) · [**MIT License**](LICENSE)

</div>

---

> **[BETA STATUS & TARGET SILLYTAVERN PLATFORMS]**
> - **Minimum Supported SillyTavern Version:** `1.19.0` (**`1.19.1`** or newer strongly recommended).
> - **Target & Verified Platforms:** Desktop (Windows / Linux / macOS) and **Android (Termux + Mobile Chromium / WebView, verified on Android 16)**. SillyTavern is officially built for Desktop and Android (Termux); physical iOS Safari client testing has not been performed.

---

## Overview

**NexusMatch Forge** (`v2.1.25-beta` · *Atelier & Card Studio* design) is a standalone SillyTavern extension featuring **13 muted editorial palettes** (*Calm / Kit* + *Gustave Doré*, unified with [**Pocket Codex & Forge**](https://github.com/Gerodot535/st-pocket-codex)), 3-pillar `Studio · Collection · Editor` navigation, and anchor-free prompt architecture:

1. **Saved Format Profiles, Templates & Anti-Slop Engine** — unified top Studio drawer with savable format profiles (LLM transport mode, **8 token-clean `## Heading` templates** plus custom user templates and AI template extraction from any existing card, word budgets, per-field & greeting languages, `+1 Alt`, author notes, and an editable **Anti-Slop** preset inherited across all 12 prompt generators).
2. **Single-Page Story Questionnaire & Story Dynamic Modes** — clean 4-field questionnaire (`Setting, Era & Genres`, `Story Premise & Role`, `Traits, Archetype & Tropes`, `Unified Hard Bans`) paired with **Story Dynamic Modes**:
   - **6 Built-in Modes:** `Plot & Natural Flow` *(neutral default — zero forced instant flirting)*, `Pure Plot (Zero Romance)`, `Conflict / Rivalry / Tension`, `Slow Burn (Guarded Start)`, `Enemies to Lovers`, and `Romance / Attraction / Flirt`.
   - **`+ Combination` & `+ Custom`:** blend multiple dynamic modes simultaneously or create your own named custom modes with custom prompts (editable via the pencil button and shared across both questionnaires). All standalone questionnaire-free modes automatically enforce the neutral `Plot & Natural Flow` standard while keeping `CARD_FORMATS` templates completely intact.
3. **Swipe Deck (`Match Mode`)** — smooth 60fps card swipes for characters, worlds, or RPG campaigns (`1`, `3`, or `5` per batch), disliked-tag filtering, optional same-name canon/character variations, **Passed Archive** recovery, and full V2 card synthesis inheriting portrait & visual traits.
4. **Astral Gacha & Soul Alchemy Altar** — 100% isolated **Gacha Questionnaire** (with its own independent Story Dynamic selector), `+` tag formula summoning, interactive card reveal, and the **Soul Alchemy Altar** transmuting 2–3 donor cards into a brand-new original character.
5. **Blitz Questionnaire (4 Mutually Exclusive Cores)** — answer tailored AI questions driven by one clean source at a time: `Main Story Questionnaire`, `Gacha Questionnaire`, `Specific Character Seed`, or `Blank Slate from Scratch`.
6. **Vision Photo-to-Card Lab & Concept Art Lab** — synthesize V2 cards from lossless reference artwork via multimodal Vision, or design single-image Reference Concept Sheets and multi-frame Concept Series with editable narrative captions.
7. **Free Idea Architect, Multiverse AU Adapter & Lossless V2 Editor** — build cards from freeform concepts, transplant existing SillyTavern characters into Alternate Universes (compatible with `performance.lazyLoadCharacters`), edit V2 cards manually without AI, export `.png` (`chara_card_v2`) / `.json`, or send character lore straight to **Pocket Codex & Forge** via the **Codex** button.

> **Format Note (`World Sandbox` & `RPG GM Engine`):** Both modes are specialized narrator/GM content templates packaged inside the standard **Character Card V2 (`chara_card_v2`)** specification for universal SillyTavern compatibility.

---

## Card Safety, Backups & Generation Isolation

- **Lossless Surgical Updates:** Updating an existing SillyTavern character uses `/api/characters/edit-avatar` and `/api/characters/merge-attributes` rather than the import endpoint. Untouched attributes — including `fav`, active `chat` binding, `create_date`, `talkativeness`, `depth_prompt`, embedded `character_book`, and third-party `data.extensions` — remain intact.
- **Pre-Overwrite Diff & Automatic Backup Vault:** Before updating an original card, NexusMatch Forge verifies the file on disk, displays a clear changed-fields Diff confirmation sheet, and saves the original PNG + V2 JSON into an `IndexedDB` Backup Vault (with one-click **Download Backup PNG** in the Editor).
- **Zero-Compression IndexedDB Media Storage:** Candidate portraits, references, and draft avatars are stored losslessly in `IndexedDB` rather than bloating `extensionSettings` / `settings.json`.
- **Isolated Cancellation & Non-Mutating Streaming Control:** Cancelling a task inside NexusMatch Forge aborts only the local extension task without altering your active SillyTavern preset or stopping chat generation.

---

## LLM Modes & Art Studio (`SillyImages`)

### Dual LLM Transport Modes
- **Full Active Preset (`Prefill` Mode):** For **Chat Completion (`openai`)**, assembles your active preset around the task slot (preserving `assistant_prefill` and reasoning blocks) alongside an editable **Correction Override Prompt**. For **Text Completion**, delegates cleanly to SillyTavern's active Context / Instruct templates.
- **Strict JSON Schema (`Core JSON Schema`):** Passes native `jsonSchema` definitions into SillyTavern Core's `generateRawData()` for structured output.

### Art Studio & SillyImages (`0xl0cal/sillyimages`) Integration
NexusMatch Forge reads `inline_image_gen` settings only when the extension is enabled, enforcing strict per-profile credential and endpoint isolation:
- **Supported SillyImages Providers:** `OpenAI-compatible`, `xAI`, `Gemini`, `OpenRouter`, `Electron Hub`, `Naistera`, `NovelAI` (V4.5 / V5 with Opus Anlas protection), and `AUTOMATIC1111 / Forge`.
- **Reference & Style Controls:** Supports SillyImages style and negative presets, auto/manual reference matching from SillyImages libraries or custom uploaded reference photos, and an optional visual-only fandom prompt shield for strict image providers.

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
