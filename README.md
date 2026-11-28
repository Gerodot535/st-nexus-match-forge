<div align="center">

# NexusMatch Forge `[Public Beta v1]`

**An Interactive Swipe-Deck, Astral Gacha Summoner & Soul Alchemy Altar, Vision Photo-to-Card & Concept Art Labs, Blitz Quiz, AU Multiverse Adapter with Greeting Sculptor, and Lossless Character / World / RPG Card V2 Studio for SillyTavern — crafted for Android Mobile and Desktop.**

[**English Documentation**](README.md) · [**Русская документация (RU)**](README.ru.md) · [**Illustrated Visual Guide (RU)**](https://gerodot535.github.io/nexus-match-forge.html) · [**Author Telegram**](https://t.me/AIdegenerate1) · [**Changelog**](CHANGELOG.md) · [**MIT License**](LICENSE)

</div>

---

> **[WHY PUBLIC BETA V1 (`v1.0.0-beta.1`) & SUPPORTED PLATFORMS]**
> - **Why Open Public Beta:** `NexusMatch Forge` is a large multi-module studio combining 12 AI generators, 27 LLM Chat Completion sources, 9+ image backends, and dozens of user-configurable variables. A solo developer physically cannot test every possible provider and setting combination alone in the wild — so this initial public release ships as **Public Beta v1**. Community feedback and issue reports are warmly welcomed!
> - **Minimum SillyTavern Version:** `1.19.0` (**`1.19.1`** or newer recommended).
> - **Tested Platforms:** Desktop browsers (Windows / Linux / macOS) and **Android (Termux + Mobile Chromium / WebView, verified on Android 16)**. Remote iOS Safari clients have not been hardware-tested.

---

## Overview

**NexusMatch Forge** (`Public Beta v1` · `v1.0.0-beta.1` · *Atelier & Card Studio* design) is a standalone SillyTavern extension featuring **13 muted editorial palettes** (*Calm / Kit* + *Gustave Doré*), 3-pillar `Studio · Collection · Editor` navigation, and an anchor-free prompt architecture:

1. **Format Profiles, 8 Editable Card Templates & Anti-Slop** — unified top Studio drawer with saved configuration profiles: LLM transport mode, **8 clean `## Heading` templates** (all directly editable with one-click reset) plus custom user templates, AI-powered template extraction from any existing Tavern card, word-budget presets, independent card/greeting language controls, `+1 Alt`, custom literary voice, and an editable **Anti-Slop** preset shared across all generators.
2. **Main Story Questionnaire & Story Dynamic Modes** — single-sheet intake (`Setting, Era & Genres`, `Plot & Your Role`, `Traits, Archetype & Tropes`, `Unified Stop-List`) paired with **Story Dynamic** controls:
   - **6 Directly Editable Base Modes:** `Plot & Natural Flow` *(neutral default — zero forced romance on sight)*, `Pure Plot / No Romance`, `Conflict / Rivalry / Tension`, `Slow Burn`, `Enemies to Lovers`, and `Romance / Attraction / Flirt`.
   - **`+ Combination` & `+ Custom`:** blend multiple dynamics together or create custom dynamic presets with your own label and prompt. All standalone modes without an intake form automatically default to neutral `Plot & Natural Flow`.
3. **Swipe Deck (`Match Mode`)** — smooth 60fps card swipes for characters, NPC-free worlds, or Game-Master RPG campaigns (`1`, `3`, or `5` per batch), disliked-tag learning on pass, optional same-name/canon variations, **Passed Archive** recovery, and full V2 card synthesis inheriting portrait & visual traits.
4. **Astral Gacha & Soul Alchemy Altar** — 100% isolated **Gacha Questionnaire** (with its own independent Story Dynamic selector), `+` tag prayer summoning, interactive `1★–5★` card reveal, and the **Soul Alchemy Altar** transmuting 2–3 donor cards (including any existing SillyTavern character) into a brand-new original character.
5. **Blitz Questionnaire (4 Mutually Exclusive Cores)** — answer tailored AI multiple-choice questions driven cleanly by one chosen source: `Main Story Questionnaire`, `Gacha Questionnaire`, `Specific Character`, or `From Scratch`.
6. **Photo-to-Card Lab (Vision) & Concept Art Bureau** — synthesize full V2 cards from any uploaded artwork via multimodal AI Vision (or text hints when using text-only models, preserving your uncompressed original artwork), plus unified character reference sheets and detail concept-art series with editable literary captions.
7. **Free-Form Idea, AU Multiverse Transfer with Greeting Sculptor & Lossless V2 Editor** — build from free-form notes, adapt existing SillyTavern characters into alternate eras/universes without touching the original bot or its chat history, craft multi-scene opening greetings (`Greeting Sculptor`), translate cards across languages with AI, run soft AI edits with instant undo, and export lossless `.png` (`chara_card_v2`) / `.json`.

> **Note on World Sandbox & RPG GM Engine Formats:** Both modes package specialized narrator / Game Master structures inside a standard **Character Card V2 (`chara_card_v2`)** container so they launch in SillyTavern just like any regular card.

---

## Card Safety, Chat Integrity & Backup Vault

- **Non-Destructive Tavern Updates:** **Update in Tavern** uses SillyTavern's native `/api/characters/edit-avatar` and `/api/characters/merge-attributes` endpoints rather than re-importing, preserving `fav`, active `chat` bindings, `create_date`, `talkativeness`, `depth_prompt`, embedded `character_book`, and third-party `data.extensions` metadata.
- **Pre-Overwrite Diff & Automatic Backup Vault:** Before updating an existing card, `NexusMatch Forge` re-reads the live file on disk, displays a changed-fields Diff sheet, and backs up the original PNG + V2 JSON into a local `IndexedDB` vault (with one-click **Download Backup PNG** in the Editor).
- **Lossless `IndexedDB` Media Storage:** Candidate portraits, reference images, and shelved cards live in an isolated browser `IndexedDB` database rather than bloating SillyTavern's `settings.json`.
- **Isolated Cancellation & Non-Mutating Streaming Control:** Cancelling a task inside `NexusMatch Forge` aborts only the local extension request without altering your active SillyTavern preset or interrupting chat generation.

---

## LLM Modes & Art Studio (`SillyImages`)

### Dual LLM Transport Modes
- **Full Active Preset (`Prefill` Mode):** For **Chat Completion** (supporting all **27 SillyTavern 1.19+ sources**: `OpenAI / GPT`, `xAI Grok`, `Claude`, `DeepSeek`, `Google Gemini`, `OpenRouter`, `Chutes`, `NanoGPT`, `Electron Hub`, `SiliconFlow`, `Z.ai`, `MiniMax`, `Custom`, etc.), assembles your active preset around the task slot with active-chat macro scrubbing, `assistant_prefill` preservation, `<think>` / reasoning extraction, and an editable **Correction Override Prompt**. For **Text Completion**, delegates cleanly to SillyTavern's active Context / Instruct templates.
- **Strict JSON Schema (`Core JSON Schema`):** Passes strict `jsonSchema` definitions into SillyTavern Core's `generateRawData()` for token-lean structured output.

### Art Studio & SillyImages (`0xl0cal/sillyimages` v3.0+) Integration
Image generation is completely optional: without an image generator, `NexusMatch Forge` applies a clean monogram cover, stores an English `image_prompt` for later use, and lets you upload custom artwork anytime. When `SillyImages` is enabled, `NexusMatch Forge` reads its profiles without copying API keys:
- **Dynamic Aspect Ratio Inheritance & Provider Parity:** Inherits profile aspect ratios/sizes from `SillyImages` across `OpenAI / GPT Image / DALL-E`, `OpenRouter` (10/14 ratios), `xAI Grok Imagine` (13 ratios + `auto`), `Gemini / Nano Banana 2` (up to 14 ratios), `Electron Hub`, `Naistera`, `NovelAI` (V4.5 / V5 with Opus Anlas protection), `Pollinations`, and `AUTOMATIC1111 / Forge`.
- **Reference & Canon-Shield Controls:** Supports `SillyImages` style and negative presets, up to 14 visual references with thumbnails from `SillyImages` libraries or custom uploaded photos, and an optional visual-only fandom prompt shield for strict image providers.

---

## Installation in SillyTavern

1. Open **SillyTavern** (`>= 1.19.0`) -> **Extensions** panel -> **Install extension**.
2. Paste the repository URL:
   ```text
   https://github.com/Gerodot535/st-nexus-match-forge
   ```
3. Reload the browser page. Open **NexusMatch Forge** from the **Character Management** top bar or the **Extensions** settings panel.

---

## Credits & Community Inspiration

**NexusMatch Forge** is written entirely from scratch on an original architecture, with warm appreciation and community shout-outs to fellow SillyTavern creators:

- **External Image Generation Engine:** [**SillyImages (`0xl0cal/sillyimages`)**](https://github.com/0xl0cal/sillyimages) by **local & astera** — the standalone image generation extension whose profiles, style presets, and reference libraries `NexusMatch Forge` integrates with cleanly without copying credentials.
- **Parallel-World (AU) & UI Inspiration:** [**Another Universe**](https://github.com/mangkoodkung/another-universe-en) by **POPUKO (`majesty.pop`)** and its Russian fork [**another-shinoverse**](https://github.com/Shino4ka/another-shinoverse) by **Shino (`Shino4ka`, [Atelier](https://shino4ka.github.io/nai-atelier/))** — for the poetic idea of reimagining beloved characters across alternate worlds and clean UI presentation as an early point of inspiration *(while `NexusMatch Forge`'s UI and AU Transfer are built from scratch and work differently, synthesizing standalone Character Card V2 files with a multi-greeting Sculptor)*.
- **Fellow Character Card Pioneers in SillyTavern:** [**SillyTavern-Character-Creator**](https://github.com/bmen25124/SillyTavern-Character-Creator) by **bmen25124** and [**SillyTavern-CharCardStudio**](https://github.com/MMKAVERAPPA/SillyTavern-CharCardStudio) by **MMKAVERAPPA** — with respect to earlier LLM-assisted card creation tools in the ecosystem.
- **Mini Shout-Out for Cozy Gacha Roleplay Vibes:** the Lorebook-based gacha bot by **Mooni** ([author channel post](https://t.me/c/2273797548/43)) — a friendly nod to summoning excitement *(while `NexusMatch Forge`'s Astral Gacha & Soul Alchemy Altar operate completely differently: with zero pre-written Lorebook roster, procedurally forging brand-new original Character Card V2 files from scratch on every summon)*.

---

## About the Author & License

Hi, I'm **Gerodot (`Gerodot535`)** — a SillyTavern roleplayer and enthusiast crafting and playing directly from an Android smartphone (Termux), believing that great stories thrive on complete freedom of genres, characters, and worlds without forced templates. Alongside my personal RP preset, **NexusMatch Forge** is my first public SillyTavern extension — built so complex under-the-hood mechanics feel quiet, calm, and effortless on the surface. Feedback on the open beta is always welcome!

- **Author Telegram Channel:** [**t.me/AIdegenerate1**](https://t.me/AIdegenerate1)
- **GitHub & Showcase Site:** [**github.com/Gerodot535**](https://github.com/Gerodot535) · [**gerodot535.github.io**](https://gerodot535.github.io/)
- **License:** Released under the [**MIT License**](LICENSE).
