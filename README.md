<div align="center">

# NexusMatch Forge `[BETA v1.3.0]`

**An Interactive Swipe-Deck, Blitz Quiz, AU Multiverse Adapter, and Character / World / RPG Card V2 Studio for SillyTavern — designed for both Mobile and Desktop.**

[**English Documentation**](README.md) · [**Русская документация (RU)**](README.ru.md)

</div>

---

> **[BETA NOTICE]**
> **NexusMatch Forge** is currently in **Open Beta** (just like its companion project, [**Pocket Codex & Forge**](https://github.com/Gerodot535/st-pocket-codex)). While all core workflows are fully functional, minor rough edges or prompt/UI adjustments may still occur across updates. Bug reports and feedback are warmly welcome!

---

## Overview

**NexusMatch Forge** is a standalone SillyTavern extension built around a sharp technical geometry aesthetic with **13 handcrafted vector SVG themes**. It turns Character, World Sandbox, and RPG System V2 card creation into an intuitive, multi-session studio:

1. **Swipe Deck (`Tinder Mode`)** — swipe through AI-generated character or world previews (`1`, `3`, or `5` at a time), mark disliked tags/reasons to refine future pitches automatically, browse or edit rejected cards in the **Passed Archive**, and expand any match into a complete V2 card.
2. **Blitz 10 Questionnaire** — enter any concept and answer up to 10 tailored questions (skip or regenerate individual questions on the fly) to synthesize a nuanced card.
3. **Free Architect & Multiverse AU Adapter** — build cards from freeform notes with strict word-count targets and **8 card structures** (`19-Point Dossier`, `JED Hybrid`, `Behavioral Prose`, `XML Sheet`, `PList + Ali:Chat`, `Multi-Character Cast`, `World Sandbox`, `RPG GM Engine`), or transplant any existing SillyTavern character into an Alternate Universe while preserving the original author's prose and formatting style.
4. **Manual V2 Profile Editor (No AI Required)** — create, edit, import/export `.png` (`chara_card_v2`) and `.json` cards, manage alternate greetings, attach Lorebooks, or open **Pocket Codex & Forge** directly if installed.

---

## Key Features

- **Independent Multi-Session Workspace:** Create, rename, pause/freeze, and switch between multiple independent card-building sessions without losing progress.
- **Dual LLM Transport Modes:**
  - **Full Active Preset (`Prefill` Mode):** Sends your entire active SillyTavern preset around the task slot so custom thinking blocks, proxies, and prefills work naturally, paired with an editable **Correction Override Prompt** to prevent roleplay trackers from breaking card formatting.
  - **Strict JSON Schema (Token-Saver Mode):** Lightweight direct structured generation without preset overhead.
- **Multilingual & `{{language}}` Macro Support:** Automatically adapts to your SillyTavern / device locale (`English`, `Русский`, `简体中文`, `繁體中文`, `日本語`, `한국어`, `Español`, `Deutsch`, `Português`), supports a token-saving **Hybrid Mode** (`English` definitions + local-language opening scene), or custom language directives.
- **Flexible Identity & Match Preferences:** Choose player (`{{user}}` or active Persona) and target character gender/identity (`Male`, `Female`, `Any`, or **Custom** freeform input).
- **Optional Art Generation with Live Attempt Monitor:** Works seamlessly in pure text mode or connects to **Inline Image Generation** (`sillyimages` / forks) and SillyTavern `/sd`, featuring a real-time status HUD (`Attempt 1/3`, retry countdowns, provider/model readout, self-healing aspect-ratio fallback, and smart face-aware `1:1` / native cropping).

---

## Installation in SillyTavern

1. Open **SillyTavern** -> **Extensions** panel (stacked blocks icon) -> **Install extension**.
2. Paste the repository URL:
   ```text
   https://github.com/Gerodot535/st-nexus-match-forge
   ```
3. Click **Install for all users** (or **Install just for me**) and reload the page.
4. Open **NexusMatch Forge** via the geometric hexagon `+` button in the **Character Management** top bar or from the **Extensions** settings drawer.

---

## License & Credits

Created by [**Gerodot535**](https://github.com/Gerodot535). Free for personal and community SillyTavern use.
