# Changelog

All notable changes to **NexusMatch Forge** are documented in this file.

## [1.9.6-beta] - 2026-11-22

### Dual-Mode Card V2 Regeneration & Surgical Anti-Slop Editor, Donor Lorebook Toggle & Always-On Sacrifice Confirmation
- **Dual-Prompt Card Regeneration & Surgical Anti-Slop Editor (`buildSurgicalCardEditRequest`, `applySurgicalCardEditResult` & `buildFullCardRegenerateRequest`)**: Added a unified Regeneration & AI Edit panel directly inside **Create (`From Idea` & `AU Rework`)** and **Profile Editor** with two distinct prompts:
  1. **Surgical Fix (Preserve Integrity)** — rewrites ONLY the disliked point/section or purges AI slop while keeping the rest of the card verbatim (with optional hard field-scope locking and isolated Art-prompt toggle so visual tags never enter card prose).
  2. **Full Rewrite (With Feedback)** — regenerates the entire card fresh from scratch (including full AU transplant re-runs) while strictly honoring user corrections, plus instant 1-tap **Undo AI Edit**.
- **AU Donor Lorebook Inheritance Toggle (`inheritLorebook`)**: Added an explicit toggle in **Create -> AU Rework** (*OFF by default*) so adapted characters start clean in their new universe without dragging old-world Lorebooks (`world` & embedded `character_book`), unless opted in.
- **Always-On Irreversible Sacrifice Warning**: Sacrifice confirmation ritual modal now triggers on **every** card sacrifice attempt so no collectible card can ever be destroyed by an accidental tap.

## [1.9.5-beta] - 2026-11-22

### Altar Donor Absorption + Altar-Only Regenerate Button, Zero Double-Cropping & Live Tavern Stress-Audit Fixes
- **Altar Donor Absorption + Altar-Only Regenerate (`gacha-run-fusion` & `regen-altar-char`)**: Fusing 2–3 cards on the Altar now permanently consumes and removes the donor cards from Collection while storing their soul snapshot (`fusedFromDonors`) inside the born hero. Added a **Regenerate (`Перегенерировать`)** button **strictly on Altar-synthesized heroes only** (never on regular Gacha pulls, preserving Gacha excitement).
- **Zero Double-Cropping (`nmf-natural-art` & `backfillMissingNaturalRatios`)**: Uncropped real artworks now always render in their full natural proportions (`width: 100%; height: auto`) across Big Dossiers, Swipes, Gacha, and Profile Editor without secondary `1:1` container clipping, plus legacy cards automatically backfill `artNaturalRatio` on open.
- **Epoch-Guarded IndexedDB Vault (`nmf_media_vault.js`)**: Isolated `openVaultDb()`, `saveMediaDataUrl()`, and background `migrateInlineSessionMediaToVault()` by connection/vault epoch so stale background operations never pollute emergency inline fallbacks when IndexedDB is unavailable or hits quota limits.
- **Mobile Touch, `<select>` Bindings, Persistent Spoilers & Prompt Polish**: Wired AU character/mode `<select>` and Swipe batch `<select>` into `change` listeners with live DOM fallback, preserved open `<details>` spoilers across re-renders on touch devices, aligned all `EN` dropdown labels, and refined Blitz Gacha-toggle, AU Rework, 19-Point Dossier, and Card Translator prompts.

## [1.9.4-beta] - 2026-11-22

### Dense Auto-Packing Mosaic Grid (Zero Side Holes Around 16:9 Cards) & Full-Frame Big Dossier Portraits
- **Dense CSS Grid Packing (`.nmf-mosaic-grid`)**: Replaced `column-count: 2` with `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-flow: dense`, automatically pulling subsequent portrait/square cards up to fill any empty half-row beside odd portraits above `16:9` banners.
- **Full-Frame Aspect Ratio in Big Character Dossier (`resolveDisplayOrCoverSpec`)**: Opening a `16:9` or tall uncropped card in the Big Dossier modal now displays its true natural aspect ratio without clipping edges.

## [1.9.3-beta] - 2026-11-21

### Pure SillyImages/User Art Style (Zero Style Stripping), Default 25% Sacrifice Failure, Sorted/Filtered Card Grids & Altar Synthesis Comet Reveal
- **Pure SillyImages / User Style Rule (`nmf_templates_and_prompts.js` & `nmf_card_io_and_art.js`)**: Removed all hardcoded style example lists (`anime`, `oil painting`, `photorealistic`, `3D`, etc.) from prompts and removed the regex that stripped user-written style words. Art style now comes strictly from `SillyImages` or explicit user words, while both `SillyImages` negative presets and user custom negatives apply cleanly across all providers (including `NovelAI Medium` and `Naistera`).
- **Default 25% Sacrifice Failure Risk**: Enabled `gachaSacrificeFailEnabled: true` (`25%`) by default on fresh installs and `v7` settings migration (can be toggled anytime in Point 3).
- **Organized Card Grids (`filterAndSortGridEntries` & `renderGridSortFilterBar`)**: Added quick filter chips (`All`, `5-Star`, `4+ Star`, `Fused`, `With Art`) and sort options (`By Stars 5 -> 1`, `Art & Shape Grouped`, `Newest`, `By Name A-Z`) across Gacha Collection, Matches, Vault, and Passed so tiles line up cleanly without visual clutter.
- **Altar Synthesis Reveal Fix**: Completing Fusion while watching the Altar now immediately launches the Comet flight -> 3D Card Flip reveal, while switching tabs or minimizing pins the themed Unpack button into the top Shade.

## [1.9.2-beta] - 2026-11-21

### Always Launch on Start Screen, Dual Isolated Questionnaires in Point 1 (With Mode Guidance & High-Random Blank Gacha), and Clean Inner Tabs
- **Start-First Launch (`openForgeDialog`)**: Opening NexusMatch Forge now always greets the user on the **Start / Home Screen (`home`)**, while redundant Questionnaire ribbons and buttons have been removed from inner tabs (`Swipes`, `Gacha`, `Blitz`, `Create`).
- **Dual Questionnaire Guidance in Point 1 (`renderHomeTab`)**:
  - **Main User Story Questionnaire**: Clear guidance that starting here is recommended for **Swipes (Tinder)**, while for **Blitz Quiz** and **Idea Mode** it is optional yet fine-tunes and strengthens both modes.
  - **Additional Gacha Mode Questionnaire**: Added right inside the Point 1 Questionnaire card with `*Если вы хотите поиграть и поколлекционировать карты.` (`*If you want to play and collect cards.`), clarifying that leaving it blank maximizes Gacha randomization.
- **100% Zero Questionnaire Mixing (`nmf_templates_and_prompts.js` & `nmf_entry.js`)**: Removed `fallbackIntake` inheritance from Gacha Wishes (`userGender`, `targetGender`, `rating`, `fandomOrWorld`, `wishesNote`, `hardBans` are 100% independent), removed `gachaContextLine` from Main Intake, and routed Gacha-seeded Blitz builds/questions and Gacha art reference matching strictly through Gacha Wishes.

## [1.9.1-beta] - 2026-11-21

### 4-Point Home Screen Layout (Strong User Questionnaire Spotlight + Point 3 Theme/Gacha Cards + Point 4 Art Spoiler)
- **4-Point Home Structure (`renderHomeTab`)**: Replaced step labels with clean numbered **Points (`Пункт 1`..`Пункт 4` / `Point 1`..`Point 4`)**:
  - **Point 1**: Strong visual spotlight on **User Story Questionnaire (`Сюжетная Анкета Юзера`)** + `*Required: Card Template & AI Mode`.
  - **Point 2**: 2x2 Creation Mode cards (`NexusMatch Swipes`, `Gacha Summon`, `Blitz Quiz`, `Idea / AU`).
  - **Point 3**: **Themes & Language** and **Gacha Settings** styled in the exact same accent-striped `.nmf-home-mode-btn` card grid.
  - **Point 4**: **Artwork & Cover Generator** placed strictly inside a collapsible **Spoiler** (`* Необязательно, но будет красиво` / `* Optional, but makes it pretty`) rather than a card.

## [1.9.0-beta] - 2026-11-21

### Uniform Neutral Home Cards, Full Bilingual UI (RU / EN + Dynamic SVG Covers), Click-Triggered Sealed Unpack Stages (39 Themed Labels + Custom Art), Per-Gacha Safe Resolution, Luck Rigging, Sacrifice Failure Risk, Living Altar Ritual & Custom Gender Fix
- **Uniform Neutral Home Cards (`renderHomeTab`)**: Unified header buttons and consolidated all settings onto the Home Screen as cohesive cards: **Sessions & Switching** (inline rename, switch, create, pause), **`*Required` Template & AI Mode**, **Theme & App Language (`RU / EN`)**, **Story Questionnaire**, **Gacha, Luck & Altar Rules**, **Creation Modes**, and the bottom art spoiler **`* Необязательно, но будет красиво` (`* Optional, but makes it pretty`)** with the redundant Aspect Ratio warning removed while keeping Collection & Vault mosaic tiles intact.
- **Full Bilingual Localization (`modules/nmf_i18n.js`) + Dynamic Placeholder Covers**: Complete `RU / EN` switch translating every tab, modal, guide, tooltip, and dynamically updating all inscriptions inside procedural SVG covers (`5 STARS · COLLECTIBLE CARD`, `NO AI ART · UPLOAD PHOTO ANYTIME`, `RENDER INTERRUPTED`).
- **Click-Triggered Sealed Unpack & Reveal Stages (`assets/reveal_match.webp` & `assets/reveal_altar.webp`)**: Added two painterly reveal backdrops (velvet spotlight stage for NexusMatch and starfall altar for Prayers) with **39 unique themed button inscriptions** (13 themes × Match, Gacha `Unpack Card`, and Fresh Art `Open Image`) so animations play reliably on user click without straining the mobile browser.
- **Per-Gacha Safe Resolution, Luck Rigging, Sacrifice Failure & Living Altar**: Added read-only provider-safe resolution selection per Gacha (and per Gacha card) without mutating `SillyImages`, Gacha Luck Rigging (`fair`, `soft`, `high`, `jackpot`), optional **Sacrifice Failure Risk** (`15%–50%` chance for the Altar to consume the card for `0` Prayers), live animated Altar of Fusion block during synthesis, and fixed custom gender input (`Своё...` / `Custom...`) immediately appearing on `<select>` change.

## [1.8.1-beta] - 2026-11-21

### Guided Home Screen (*Mandatory Format & AI Mode + Optional Art Spoiler), Procedural Cover Lifecycle, Manual Upload Everywhere, Zero-Bar Cropping & Zero "Prefill"/"4K" Labels
- **Guided Home Screen Setup (`renderHomeTab`)**: Placed **`*Обязательно для стабильной работы`** directly on the Session Home Screen with interactive buttons and instant beginner-friendly explanations for AI Send Mode (`Через пресет Таверны` vs `Строгая JSON-схема`), all 8 Card/Dossier Templates, and Word Counts — removing them completely from the Settings gear menu.
- **Optional Art Spoiler on Home Screen + Manual Upload in All Modes**: Added an optional collapsible Art Generator section on the Home Screen clarifying that AI art is optional, plus **`Своё фото`** manual image upload buttons across Swipe Deck, Gacha Wish Reveal, Big Character Dossiers (Matches/Gacha/Passed), and Profile Editor.
- **Procedural Vector Cover Lifecycle (`buildProceduralCoverDataUrl`)**: Cards without AI art now display a sharp theme-tinted geometric monogram cover; during active rendering the cover disappears cleanly; on generation failure an emergency error cover appears (like SillyImages) and automatically vanishes once a valid image is generated or uploaded.
- **Zero-Bar Cropped Portraits & Clean Wording**: Removed `max-height: 540px` + `object-fit: contain` pillarboxing on cropped portraits (`.nmf-is-cropped`), removed "4K" wording from the crop save button, and removed all "Prefill" mentions from UI labels.

## [1.8.0-beta] - 2026-11-21

### Session Home Launchpad, Collapsed Settings Menu (#1 Card Template), Live Tag Chips, 4K Async Crop Feedback, Visual Prompt Refiner + Auto-Art, Puzzle Mosaic Grid & Deferred Reveal Animations
- **Session Home Launchpad & Clear Intake (`nmf_entry.js`, `nmf_templates_and_prompts.js`)**: Added a guided **Home Screen (`Старт`)** automatically greeting every new session (plus a header Home icon), featuring an upfront notice that Card Templates moved to Settings #1, a 1-tap **Очистить анкету** button, and clear mode launch cards.
- **Clean Collapsed Settings Menu (#1 Card Template)**: All Settings sections now open collapsed as a clean accordion menu, with **1. Шаблон Анкеты / Карточки и Объём Текста** placed first (and also selectable directly inside `Создать -> Из задумки`).
- **Live Gacha Tag Chips & End-to-End Tag Audit**: Fixed `tagsInput` previously re-rendering chips only when tag count changed (leaving partial letters like `+ С`); chips now update on every keystroke, support `+` and comma separators, auto-commit typed Tinder stop-words, and block Chrome auto-translate (`translate="no"`).
- **4K Cropper Progress Indicator & Async `toBlob`**: Clicking `Применить кадрирование` now immediately shows `Сохраняем кадр в 4K без сжатия, подождите...` and encodes asynchronously via `canvas.toBlob`.
- **Visual Prompt Refinement -> Auto-Art (`buildVisualPromptRefinementRequest`)**: Added 1-click prompt refinement with custom direction in Profile, Big Dossiers, and Lightbox that immediately launches Art generation.
- **Puzzle / Bento Mosaic Grid & Deferred 5-Rarity / Match / Art Reveal Animations**: Implemented adaptive `.nmf-mosaic-grid` (`16:9`/`4:3` wide banners, `1:1` squares, `2:3`/`3:4` tall portraits), 5 distinct Gacha rarity glow colors, unique Match Signal reveal, fresh-art materialization animation, and queued reveals after minimizing (`—`).

## [1.7.3-beta] - 2026-11-21

### Instant 0ms Gacha & Art Cancellation, Big Match/Gacha Dossier View, Non-Destructive Touch Art Cropper & «Idea + Intake» Mode
- **Instant 0ms Cancellation for Gacha Pulls, Gacha/Match Art & Editor Art (`nmf_entry.js`, `nmf_card_io_and_art.js`)**: Fixed `stop-cand-art` previously inspecting only `tinder.queue[0]` instead of active Gacha/Match art tasks, kept `fetchWithTimeout` abort signal active across multi-MB JSON/image body downloads, wrapped `generateCharacterPortrait` in immediate abort-race rejection, added immediate UI state teardown in `requestCancelBusyTask` / `stop-cand-art` / `stop-editor-art`, and added a direct close button on the Gacha comet screen.
- **Big Character Dossier Modal on Tapping Match / Gacha / Passed Tiles (`renderCandidateDossierModal`)**: Tapping any tile in `Улов` now opens the full uncut character dossier (portrait, stars/match badge, full pitch, quote, appearance, tags, art controls, cropper, `В Блиц`, and `Собрать Карточку V2`).
- **Interactive Lossless Touch Art Cropper (`renderArtCropperModal`, `computeLosslessCropGeometry`)**: Added drag-and-zoom WYSIWYG cropping (`1:1`, `3:4`, `2:3`, `4:3`, `16:9`) in both Big Dossiers and the Profile Card Editor at 100% native source pixel density while preserving the full uncropped master in `originalAvatarId` for non-destructive re-cropping or 1-tap restoration.
- **«Задумка + Анкета» / «Только задумка» Switcher**: Added explicit mode selection on `Создать -> Из задумки` (`architect.useIntake`) to either combine free concept text with the Session Intake or build strictly from scratch.

## [1.7.2-beta] - 2026-11-21

### True Gacha Wish Economy (Sacrifice -> Prayers, Never Timer Reset), Global Unresettable Cooldown, 13-Theme First-Sacrifice Ritual & Dedicated Gacha Wish Questionnaire
- **Sacrifice Grants Real Wishes (`+1..+5 Молитв`), Zero Timer Resets (`nmf_templates_and_prompts.js`, `nmf_entry.js`)**: Removed timer-reset charges completely. Sacrificing a Gacha card now directly grants `+1` to `+5` bonus **Wishes (`Молитвы`)** matching its star rating, usable immediately even while the 2-hour base 10-wish cycle timer continues counting down honestly. Legacy earned sacrifice charges from `v1.7.0` are migrated directly into `bonusWishes`.
- **Global Dual-Persisted Gacha Wallet (`st_nmf_gacha_wallet_v2`)**: Promoted the Gacha prayer balance and 2-hour `cooldownEndsAt` timestamp to global extension state mirrored synchronously in `localStorage`, preventing timer resets when switching/creating sessions, refreshing, or closing the browser before debounced saves flush.
- **13-Theme Sinister First-Sacrifice Warning Modal (`THEMED_SACRIFICE_WARNINGS`)**: Added a one-time dramatic ritual confirmation modal written uniquely in the lore and tone of each of the 13 Forge themes, warning that sacrificed heroes are permanently erased without archive or backup.
- **Dedicated Gacha Wish Questionnaire (`wishPrefs`) & Cross-Pool Anti-Clone Guard**: Added a standalone **Пожелания Гачи** intake sheet (`targetType = 'oc'` by default, optional Gacha setting, gender, rating, wish notes, bans) completely isolated from Tinder's Intake across summon, fusion, Blitz, and full V2 expansion, plus `collectSessionKnownCharacterNames()` blocking duplicates of heroes already in Tinder Matches/Queue, Gacha Collection, Draft Slots, or Saved Vault.
- **Full Android Back-Gesture (`popstate`) Stack**: Connected all 11 modal sheets and overlays to `popstate` so swiping Back closes only the open sheet instead of exiting NexusMatch Forge.

## [1.7.1-beta] - 2026-11-21

### Real Tinder/Gacha -> Blitz Character Flow, Zero-Lag `blob:` Media Rendering, Full-Sheet Mobile Frames & Aspect-Aware Portrait Grid
- **Direct Tinder/Gacha Character Selection in Blitz (`nmf_templates_and_prompts.js`, `nmf_entry.js`)**: Replaced the misleading Tinder anti-tag injection in Blitz with direct character selection (`listBlitzSelectableCandidates`, `resolveBlitzSeedCandidate`, `selectedCandidateRef`, plus one-tap `В Блиц` buttons on Swipe, Matches, and Gacha Collection cards). Blitz questions now target the exact chosen hero by name with a live portrait mini-preview, and `build-from-blitz` expands that exact character with automatic portrait/appearance transfer into a unified slot without splitting characters.
- **Zero-Lag Clicks & Typing (`nmf_media_vault.js`, `nmf_entry.js`, `nmf_themes_and_icons.js`)**: Added `resolveEntityDisplayUrl()` caching short `blob:` Object URLs (`36` chars instead of multi-megabyte lossless Base64 strings) across all DOM `<img src>` renders, debounced `input` settings persistence (`scheduleSaveSettings`), removed all GPU-heavy `backdrop-filter: blur(...)` layers, and added `contain: layout paint style` + `touch-action: manipulation`.
- **Single-Frame Full Mobile Modals**: Removed stacked `95dvh` + `90%`/`92%` sheet heights on mobile so `Анкета`, `Настройки`, `Гид`, `Перевод` and `Лайтбокс` open cleanly without double top borders.
- **Aspect-Aware Portrait Grid, Face-Safe `50% 6%` Framing & Format Warning**: Locked `.nmf-match-thumb img` and `.nmf-hero-photo` dimensions with `!important` against global SillyTavern CSS (`width: auto` right-side gap bug), anchored top portrait focus at `50% 6%` so heads/ears are never cropped, implemented true uncropped native aspect flow (`Авто — Под размер самого арта`) and 1-column `16:9` layout, highlighted checked Blitz answer options, and restored the explicit format/layout warning banner in Settings.

## [1.7.0-beta] - 2026-11-21

### Flexible `<ART_MECHANISM>` + Negatives, Honest 1-5 Star Gacha Scale & Wall-Clock Timer, AI Card Translator, Saved Vault, Method Slots & Checkable Blitz UI
- **Flexible Avatar `<ART_MECHANISM>` & Negative Prompts (`nmf_templates_and_prompts.js`, `nmf_card_io_and_art.js`)**: Replaced generic art prompt instructions with a medium-neutral director system (`SCENE -> CHARACTERS IN THE IMAGE -> FIGURE / INTERACTION / OBJECT`) supporting 1 character, `2–3` interacting characters (`duo_group`), World vistas, and standalone Artifacts/Relics (`artifact_object`), plus style injection modes (`plain_prefix`, `[STYLE: ...]`, `suffix`) and `SillyImages` + custom Negative Prompt integration.
- **Preset Active-Chat Macro Sanitizer**: Added `stripActiveChatMacrosFromPresetBlock()` (`stripActiveCharFromPreset = true` by default) to strip `{{description}}`, `{{personality}}`, `{{scenario}}`, `{{worldInfoBefore}}`, `{{worldInfoAfter}}`, `{{mesExamples}}`, and persona/lorebook macros from custom preset blocks so active chat cards never leak into Forge generations.
- **Language Presets + AI Card Translator (`nmf_entry.js`)**: Previews (Swipe & Gacha), Blitz/AU questions, and human-facing `creator_notes` use the User Language, while AI card fields use the Card Language; accidental `{{Русский}}` braces are unwrapped automatically; added one-click **AI Card Translator** allowing view-only translation storage (`savedTranslation`), copying translated cards to the Vault, or applying translation to the card.
- **Honest External 1–5 Star Randomizer, 2h Wall-Clock Cooldown & Card Sacrifice**: External cryptographic RNG (`1` to `5` stars) fires before prompt assembly and scales the character's domain/wealth/power within the user's exact requested role and appearance (`1-star` small street-gang boss up to `5-star` global syndicate emperor). Added persistent `Date.now()` 2-hour cycle cooldown (never freezes when closing SillyTavern), `1` default reset charge, and **Card Sacrifice** (`N` stars = `+N` reset charges).
- **Method Isolation, 5 Session Draft Slots & Global Saved Vault**: Isolated Free Generator/AU from Tinder & Gacha, added toggles in Blitz (`Tinder = ON`, `Gacha = OFF` by default), separated each session into 5 independent draft slots (`Swipe | Gacha | Blitz | Generator | Manual`), and added a cross-session **Saved Vault (`Хранилище`)**.
- **Clean Mobile UI, Modal Windows, Spoilers & Guide (`?`)**: Converted Settings and Guide into full modal sheets, organized secondary controls into clean `<details>` spoilers with `6px` Codex-grade geometry, fixed portrait headroom (`center 12%`), added contextual `?` help popovers, and redesigned Blitz/AU questions with multi-select checkable option rows.

## [1.6.0-beta] - 2026-11-21

### Astral Gacha Summon & Alchemy Fusion, Minimalist PC Loader, Open-Canvas UI, Dual Manual Languages & SillyImages v3.0 Appearance References
- **Minimalist PC-Window Loader (`nmf_themes_and_icons.js`, `nmf_entry.js`)**: Replaced the multi-step telemetry dashboard with a clean PC-style dialog featuring a single geometric loader crystal and top-right minimize (`-`) and cancel (`X`) window controls.
- **Open-Canvas Visual Declutter**: Removed nested heavy border-boxes around forms, added a compact header session dropdown, and streamlined filter ribbons so screens breathe naturally on mobile (`412x915`) while preserving sharp technical geometry across all 13 themes.
- **Dual Manual Language Inputs (`nmf_templates_and_prompts.js`, `nmf_entry.js`)**: Replaced the single language dropdown with two plain manual text inputs supporting `{{language}}`: (1) User-facing AI language for Blitz/AU quizzes and prompts, and (2) Card, preview, and opening-scene language, with automatic migration from `v1.5.0` sessions.
- **Astral Gacha Mode, Separate Collection & Alchemy Soul Fusion**: Added a Gacha Wish mode (`3–10` `+`-separated tags, animated comet reveal, 10-pull cycle counter with guaranteed 5-star drop on pull 10 and one-click session pool reset) storing drops in a dedicated **Gacha Collection** (separate from Swipe Matches) with an **Alchemy Fusion Altar** (`2–3` donor cards synthesized from scratch into a brand-new original character).
- **Strict Card Meta-Purity Guard**: Removed word-count hints inside output tag placeholders and added `CARD_META_PURITY_RULE` + `sanitizeCardMetaPollution()` so word counts, star ratings, and rarity labels never leak into Character Card V2 fields.
- **SillyImages v3.0.0-beta.1 Compatibility & Optional Appearance References (`nmf_card_io_and_art.js`)**: Added read-only support for `SillyImages v3.0` reference `lorebooks` and `characterReferenceLibrary` plus custom lossless reference photo upload (`off` by default, user-selectable per session/settings) across Gemini (`3.1-flash-image` / `3-pro-image` / `2.5-flash-image`), OpenRouter, OpenAI / Electron Hub (`/v1/images/edits`), xAI Imagine (`resolution`/`quality` + `/edits`), and Naistera (`reference_objects`).

## [1.5.0-beta] - 2026-11-20

### Interactive Portrait Lightbox, AU Blitz Quiz, Selectable Question Counts & Unified Visualizer
- **Modal-Safe PNG / JSON / Art Downloads (`nmf_card_io_and_art.js`, `nmf_entry.js`)**: Fixed `triggerDownload()` failing on Android Chrome when `<dialog>` is opened via `showModal()` (where `document.body` outside the dialog is top-layer `inert`). Download anchors now mount directly inside the active `<dialog>` with a 60-second `Blob` URL retention window and toast confirmation.
- **Tap-to-Zoom Portrait Lightbox & Appearance Saver**: Tapping any portrait in Swipe Deck, Matches, Passed Archive, or Profile Editor opens a full-resolution lightbox allowing one-tap download of pure uncompressed artwork, copying/saving `.txt` of appearance + visual prompt, or transferring only the look + portrait into the Profile Editor.
- **Zero-Anachronism AU Rework + Interactive AU Adaptation Quiz**: Overhauled `buildReworkCardRequest()` to enforce complete translation of old-world props, titles, magic, factions, and medieval weapons into authentic target-era equivalents while preserving formatting structure and character soul, and added `buildAuReworkQuestionsRequest()` so users can answer `3–12` clarifying AU adaptation questions directly on the Rework screen.
- **Selectable Blitz Question Count**: Added selectable question counts (`5 / 7 / 10 / 12 / 15 / 20`) on the Blitz tab.
- **Single Unified Forge Telemetry Visualizer**: Removed the duplicate portrait-thumbnail spinner and secondary `.nmf-editor-art-strip` table box, unifying both LLM tasks and Art generation into a single sharp-geometric Prism Telemetry Visualizer with expandable HUD and slim docked strip.

## [1.4.3-beta] - 2026-11-20

### Zero-Compression Lossless Artwork Pipeline
- **Lossless File Upload (`nmf_entry.js`)**: Removed `compressImageFileToDataUrl()` (`896px` WebP downscaling). Uploaded portraits are now read 100% losslessly at their exact original resolution and bit depth.
- **Bit-Exact 2K/4K PNG Pass-Through & Zero-Downscale Crop (`nmf_card_io_and_art.js`)**: Removed fixed `640px–768px` / `1280px` canvas downscaling caps in `ensurePngBytes()`. Matching PNG inputs bypass `<canvas>` completely (bit-for-bit preservation), and cropped or converted images render at 100% native source pixel density (`MAX_IMAGE_DOWNLOAD_BYTES` raised to `60 MB`; `2K`/`4K` `imageSize` preserved across `native` aspect mode).

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
