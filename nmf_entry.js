import { NMF_THEMES, NMF_ICONS, NMF_FULL_CSS } from './modules/nmf_themes_and_icons.js';
import {
    getUiLang,
    setUiLang,
    isEn,
    tx,
    getThemeDisplay,
    getThemeUnpackCopy,
    getThemedSacrificeFailMessage,
    getRarityLabel,
    THEME_LOADING_QUIPS_EN,
    localizeGenreTag,
    localizeOptionLabel,
    HELP_TOPICS_EN,
    applyEnglishDomTranslation,
} from './modules/nmf_i18n.js';
import {
    MAX_LIKED_CANDIDATES,
    MAX_PASSED_CANDIDATES,
    MAX_GACHA_COLLECTION,
    MAX_SAVED_VAULT,
    GACHA_CYCLE_LIMIT,
    DEFAULT_GACHA_COOLDOWN_MINUTES,
    SACRIFICE_FAIL_CHANCE_OPTIONS,
    GACHA_RESOLUTION_OPTIONS,
    GACHA_LUCK_OPTIONS,
    GACHA_TARGET_OPTIONS,
    CARD_SLOT_DEFS,
    LANGUAGE_PRESET_OPTIONS,
    STYLE_WRAP_OPTIONS,
    BLITZ_COUNT_OPTIONS,
    AU_QUESTION_COUNT_OPTIONS,
    IMAGE_REF_MODE_OPTIONS,
    TRANSPORT_MODE_GUIDES,
    CARD_FORMAT_HUMAN_GUIDES,
    CARD_FORMATS,
    GREETING_STYLES,
    GREETING_POVS,
    IMAGE_ASPECT_OPTIONS,
    IMAGE_CROP_OPTIONS,
    THEME_LOADING_QUIPS,
    WORD_BUDGETS,
    GREETING_BUDGETS,
    GENRE_PRESETS,
    RATING_OPTIONS,
    USER_GENDER_OPTIONS,
    TARGET_GENDER_OPTIONS,
    DEFAULT_PRESET_CORRECTION_PROMPT,
    getThemedSacrificeWarning,
    createDefaultGachaWishPrefs,
    normalizeGachaWishPrefs,
    createDefaultGachaWallet,
    normalizeGachaWallet,
    detectUserLocaleLanguage,
    stripAccidentalLanguageBraces,
    resolveUserLanguageSpec,
    resolveCardLanguageSpec,
    resolveOutputLanguageSpec,
    resolveGenderSummary,
    isWorldOrRpgMode,
    createBlankCardSlot,
    createDefaultSession,
    formatQuestionUserDecision,
    normalizeAndMigrateSettings,
    buildFullCardRequest,
    parseFullCardResponse,
    buildTinderPreviewRequest,
    parseTinderPreviewResponse,
    buildBlitzQuestionsRequest,
    parseBlitzQuestionsResponse,
    buildAuReworkQuestionsRequest,
    buildReworkCardRequest,
    parseGachaPlusTags,
    rollGachaCycleRarities,
    rollSacrificeOutcome,
    computeSacrificeWishGain,
    syncGachaWalletState,
    spendGachaWalletWishes,
    buildGachaSummonRequest,
    parseGachaSummonResponse,
    buildGachaFusionRequest,
    parseGachaFusionResponse,
    buildVisualPromptRefinementRequest,
    parseVisualPromptRefinementResponse,
    buildCardTranslationRequest,
    parseCardTranslationResponse,
    buildCleanBriefFromEntity,
    listBlitzSelectableCandidates,
    resolveBlitzSeedCandidate,
} from './modules/nmf_templates_and_prompts.js';
import {
    ALL_EDITABLE_CARD_FIELDS,
    markCardFieldDirty,
    createCardStateFromTavernChar,
    createCardStateFromImportedJson,
    createCardStateFromGeneratedDraft,
    applyReworkResultToTavernBase,
    computeCardDiff,
    buildV2CardObject,
    buildCardPngBlob,
    embedCharaChunkIntoPng,
    triggerDownload,
    dataUrlToPureBlob,
    importCardIntoTavern,
    fetchFullTavernCharacter,
    updateExistingCardInTavern,
    restoreCardFromBackupVault,
    fetchTavernRosterAndWorlds,
    urlToDataUrl,
    detectPocketCodex,
    openPocketCodexForge,
    detectImageExtensions,
    listImageExtensionBuckets,
    listSillyImagesReferenceCatalog,
    resolveAutoImageSourceSummary,
    computeLosslessCropGeometry,
    cropImageDataUrlLossless,
    generateCharacterPortrait,
    getTavernContext,
    runLlmGeneration,
    lastGenerationReasoning,
} from './modules/nmf_card_io_and_art.js';
import {
    base64ToBytes,
    isMediaDurablyPersisted,
    resolveEntityAvatarUrl,
    resolveOriginalEntityMediaUrl,
    resolveEntityDisplayUrl,
    saveMediaDataUrl,
    assignEntityMediaWithFallback,
    enforceEmergencyInlineBudget,
    hydrateSessionsMedia,
    migrateInlineSessionMediaToVault,
    waitForActiveMediaMigration,
    pruneOrphanedMedia,
    listCardBackups,
    getCardBackupById,
} from './modules/nmf_media_vault.js';

const EXT_KEY = 'st_nexus_match_forge';
let nextBusyRunId = 1;

export const REVEAL_ASSET_URLS = Object.freeze({
    match: (() => {
        try { return new URL('./assets/reveal_match.webp', import.meta.url).href; } catch { return ''; }
    })(),
    altar: (() => {
        try { return new URL('./assets/reveal_altar.webp', import.meta.url).href; } catch { return ''; }
    })(),
});

export const state = {
    activeTab: 'home', // home | swipe | matches | blitz | create | editor
    discoverSubMode: 'swipe', // swipe | gacha
    matchesSubTab: 'liked', // liked | gacha_collection | vault | passed
    gridSortMode: 'stars_desc', // stars_desc | art_first | newest | name_asc
    gridFilterMode: 'all', // all | s5 | s4plus | fused | with_art
    settingsOpenSection: '',
    homeOpenCards: {
        sessions: false,
        mandatory: false,
        themeLang: false,
        gacha: false,
    },
    sessionTitleDraft: '',
    intakeSheetOpen: false,
    pendingWishReveal: null, // { maxStars, isFusion } queued when minimized
    pendingMatchReveal: false, // queued when Swipe generation finishes while minimized
    matchRevealState: null, // { count, phase: 'sealed' | 'unpacked' }
    unseenArtIds: new Set(), // sealed fresh art IDs waiting for manual "Open Image" click
    justUnveiledArtIds: new Set(), // IDs currently playing smooth curtain-lift animation
    altarFusionBusy: false,
    altarDonorSnapshot: [], // [{ name, stars }] shown inside living Altar ritual while fusing
    lastSacrificeFailAlert: '', // Dramatic message shown when Sacrifice Fails
    homeMandatoryOpen: false,
    homeArtSpoilerOpen: false,
    candUploadTarget: null, // { pool, idx }
    artRefineOpenKey: '', // 'editor' | 'dossier' | 'lightbox'
    artRefineHint: '',
    cropSaving: false,
    gachaPrefsOpen: false,
    pendingSacrifice: null, // { id, name, stars, wishGain }
    viewingCandRef: null, // { pool: 'liked' | 'gacha_collection' | 'passed', idx: number }
    cropModalInfo: null, // { targetKind: 'editor' | 'cand', pool, idx, name, sourceDataUrl, displayUrl, imgW, imgH, aspectRatio, zoom, panX, panY, hasOriginalBackup }
    intakeStep: 'who', // who | vibe | style
    settingsModalOpen: false,
    guideModalOpen: false,
    translateModalOpen: false,
    translateTargetLang: '',
    helpPopoverKey: '',
    editorSubTab: 'main', // main | greet | meta
    sessionsDrawerOpen: false,
    themeDrawerOpen: false,
    settingsDrawerOpen: false,
    thoughtsDrawerOpen: false,
    swipeControlsOpen: false,
    manualBanDraft: '',
    wishRevealState: null, // { phase: 'comet'|'cards', maxStars: number, isFusion: boolean, timerId: any }
    editingCandRef: null, // { pool: 'queue'|'liked'|'passed'|'gacha_collection'|'gacha_reveal', idx: number }
    lightboxInfo: null, // { name, imageUrl, appearance, imagePrompt }
    overwriteConfirmInfo: null, // { targetAvatar, diff, externalWarning }
    lastOverwriteAlert: null, // { code, message, backupId, targetAvatar }
    recentBackups: [],
    busy: false,
    busyMinimized: false,
    artVisualizerMinimized: false,
    busyCancellable: true,
    busyCancelRequested: false,
    busyTaskType: 'llm',
    activeRunId: 0,
    busyAbort: null,
    busyTaskLabel: '',
    busyQuip: '',
    busyElapsedSec: 0,
    busyTimerId: null,
    loadingArtIds: new Set(),
    artAborts: new Map(), // candId -> AbortController
    artErrors: new Map(), // candId -> error message
    artStatuses: new Map(), // candId -> live status
    editorArtLoading: false,
    editorArtAbort: null,
    editorArtStatus: null,
    editorArtError: '',
    rosterChars: [],
    worldNames: [],
    historyEntryPushed: false,
    closingViaHistorySync: false,
};

export function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function safeImgSrc(url) {
    const clean = String(url ?? '').trim();
    if (!clean) return '';
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(clean)) {
        return clean;
    }
    if (/^data:image\/svg\+xml;charset=utf-8,[A-Za-z0-9%._~!'()*-]+$/i.test(clean)) {
        return clean;
    }
    if (/^blob:/i.test(clean)) {
        return clean;
    }
    return '';
}

function parseCleanQuote(q) {
    return String(q || '').trim().replace(/^[«"„'“”]+|[»"“”'.]+$/g, '').trim();
}

function countWords(str) {
    const t = String(str || '').trim();
    return t ? t.split(/\s+/).length : 0;
}

let fallbackStore = null;
let lastMigratedRef = null;

function getFallbackStore() {
    if (!fallbackStore) {
        fallbackStore = normalizeAndMigrateSettings(null).settings;
    }
    return fallbackStore;
}

const GACHA_WALLET_STORAGE_KEY = 'st_nmf_gacha_wallet_v2';

function reconcileGachaWalletFromLocalStorage(cfg) {
    if (!cfg || typeof cfg !== 'object') return false;
    if (!cfg.gachaWallet || typeof cfg.gachaWallet !== 'object') {
        cfg.gachaWallet = createDefaultGachaWallet();
    }
    try {
        if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return false;
        const raw = localStorage.getItem(GACHA_WALLET_STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(GACHA_WALLET_STORAGE_KEY, JSON.stringify(cfg.gachaWallet));
            return false;
        }
        const localW = normalizeGachaWallet(JSON.parse(raw));
        const cfgTs = Number(cfg.gachaWallet.updatedAt) || 0;
        const locTs = Number(localW.updatedAt) || 0;
        // If browser closed before ST debounced POST finished, localStorage holds the exact newer cooldown & wish balance!
        if (locTs > cfgTs || (localW.cooldownEndsAt > Date.now() && localW.cooldownEndsAt > (Number(cfg.gachaWallet.cooldownEndsAt) || 0))) {
            cfg.gachaWallet = {
                ...localW,
                firstSacrificeConfirmed: Boolean(cfg.gachaWallet.firstSacrificeConfirmed || localW.firstSacrificeConfirmed),
            };
            return true;
        }
    } catch {}
    return false;
}

function persistGachaWalletImmediately(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    if (!cfg.gachaWallet || typeof cfg.gachaWallet !== 'object') {
        cfg.gachaWallet = createDefaultGachaWallet();
    }
    cfg.gachaWallet.updatedAt = Date.now();
    try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
            localStorage.setItem(GACHA_WALLET_STORAGE_KEY, JSON.stringify(cfg.gachaWallet));
        }
    } catch {}
    saveSettings();
    const ctx = getTavernContext();
    if (typeof ctx?.saveSettings === 'function') {
        try { ctx.saveSettings(); } catch {}
    }
}

export function getSettings() {
    const ctx = getTavernContext();
    if (!ctx || !ctx.extensionSettings) {
        const fb = getFallbackStore();
        setUiLang(fb.uiLang || 'ru');
        return fb;
    }

    const codexTheme = ctx.extensionSettings?.st_pocket_codex?.theme || 'tavern';
    if (!ctx.extensionSettings[EXT_KEY] || lastMigratedRef !== ctx.extensionSettings[EXT_KEY]) {
        const { settings, migrated, recoveredFromCorruption } = normalizeAndMigrateSettings(
            ctx.extensionSettings[EXT_KEY],
            { defaultTheme: codexTheme }
        );
        const restoredFromLocal = reconcileGachaWalletFromLocalStorage(settings);
        ctx.extensionSettings[EXT_KEY] = settings;
        lastMigratedRef = settings;
        setUiLang(settings.uiLang || 'ru');

        if (recoveredFromCorruption) {
            notifyToast(
                tx(
                    'Часть старых настроек сессии была повреждена и безопасно восстановлена.',
                    'Some legacy session settings were corrupted and safely recovered.',
                ),
                true,
            );
        }
        // Asynchronously move any legacy inline Base64 images out of extensionSettings into IndexedDB (fixes NMF-013 & P2-E)
        migrateInlineSessionMediaToVault(settings.sessions, settings.savedVault || []).then((res) => {
            if ((migrated || restoredFromLocal || res?.changed) && typeof ctx?.saveSettingsDebounced === 'function') {
                stripResidualInlineImagesSync(settings);
                ctx.saveSettingsDebounced();
            }
        }).catch(() => {});
    } else {
        setUiLang(ctx.extensionSettings[EXT_KEY].uiLang || 'ru');
    }
    return ctx.extensionSettings[EXT_KEY];
}

// Strips inline avatarDataUrl when durably persisted in IndexedDB, while enforcing a strict cap on emergency inline fallbacks (harmonizes NMF-013, P2-E & P1-02)
function stripResidualInlineImagesSync(cfg) {
    if (!cfg || !Array.isArray(cfg.sessions)) return;
    enforceEmergencyInlineBudget(cfg.sessions, cfg.activeSessionId || '', {
        savedVault: cfg.savedVault || [],
    });
}

function isForgeDialogVisible() {
    if (typeof document === 'undefined') return true;
    const dlg = document.getElementById('nmf-dialog');
    if (dlg && !dlg.open) return false;
    if (document.hidden === true) return false;
    return true;
}

function resetTransientSessionModals() {
    if (state.wishRevealState?.timerId) clearTimeout(state.wishRevealState.timerId);
    state.wishRevealState = null;
    state.matchRevealState = null;
    state.viewingCandRef = null;
    state.editingCandRef = null;
    state.overwriteConfirmInfo = null;
    state.lastOverwriteAlert = null;
    if (!state.cropSaving) state.cropModalInfo = null;
    state.pendingSacrifice = null;
    state.sessionTitleDraft = '';
}

let pendingInputSaveTimer = null;

export function saveSettings() {
    if (pendingInputSaveTimer) {
        clearTimeout(pendingInputSaveTimer);
        pendingInputSaveTimer = null;
    }
    const cfg = getSettings();
    stripResidualInlineImagesSync(cfg);
    const ctx = getTavernContext();
    if (typeof ctx?.saveSettingsDebounced === 'function') {
        ctx.saveSettingsDebounced();
    }
}

function scheduleSaveSettings() {
    if (pendingInputSaveTimer) clearTimeout(pendingInputSaveTimer);
    pendingInputSaveTimer = setTimeout(() => {
        pendingInputSaveTimer = null;
        saveSettings();
    }, 260);
    if (typeof pendingInputSaveTimer?.unref === 'function') pendingInputSaveTimer.unref();
}

function syncSessionActiveSlot(sess, slotId = '') {
    if (!sess) return;
    if (!sess.cardSlots || typeof sess.cardSlots !== 'object') {
        sess.cardSlots = {
            swipe: createBlankCardSlot(),
            gacha: createBlankCardSlot(),
            blitz: createBlankCardSlot(),
            architect: createBlankCardSlot(),
            manual: sess.card || createBlankCardSlot(),
        };
    }
    const validIds = CARD_SLOT_DEFS.map((d) => d.id);
    if (slotId && validIds.includes(slotId)) {
        sess.activeCardSlot = slotId;
    } else if (!validIds.includes(sess.activeCardSlot)) {
        sess.activeCardSlot = 'manual';
    }
    if (!sess.cardSlots[sess.activeCardSlot]) {
        sess.cardSlots[sess.activeCardSlot] = createBlankCardSlot();
    }
    sess.card = sess.cardSlots[sess.activeCardSlot];
}

function assignCardIntoSessionSlot(sess, slotId, nextCardObj) {
    syncSessionActiveSlot(sess, slotId);
    sess.cardSlots[sess.activeCardSlot] = nextCardObj;
    sess.card = nextCardObj;
}

function getActiveSession() {
    const cfg = getSettings();
    const sess = cfg.sessions.find((s) => s.id === cfg.activeSessionId) || cfg.sessions[0];
    syncSessionActiveSlot(sess);
    return sess;
}

function getThemeColor() {
    const cfg = getSettings();
    const th = NMF_THEMES.find((t) => t.id === cfg.theme) || NMF_THEMES[1];
    return th.color || '#1de9b6';
}

function notifyToast(msg, isError = false) {
    if (typeof globalThis.window === 'undefined') return;
    const safeMsg = String(msg ?? '');
    if (isError) {
        if (window.toastr?.error) window.toastr.error(safeMsg, 'NexusMatch', { escapeHtml: true });
    } else if (window.toastr?.info) {
        window.toastr.info(safeMsg, 'NexusMatch', { timeOut: 2200, escapeHtml: true });
    }
}

function notifySuccessToast(msg) {
    if (typeof globalThis.window === 'undefined') return;
    if (window.toastr?.success) {
        window.toastr.success(String(msg ?? ''), 'NexusMatch', { escapeHtml: true });
    }
}

// Reads uploaded image file 100% losslessly without resizing or WebP/JPEG re-compression
async function readLosslessImageFileAsDataUrl(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result || ''));
        fr.onerror = rej;
        fr.readAsDataURL(file);
    });
}

async function refreshRosterData(signal = null) {
    try {
        const { characters, worlds } = await fetchTavernRosterAndWorlds({ signal });
        state.rosterChars = characters;
        state.worldNames = worlds;
    } catch (err) {
        if (!signal?.aborted) {
            console.warn('[NexusMatch Forge] Roster fetch warning:', err);
        }
    }
}

async function refreshBackupsList() {
    try {
        state.recentBackups = await listCardBackups();
    } catch {
        state.recentBackups = [];
    }
}

function ensureStylesMounted() {
    if (typeof document === 'undefined') return;
    let st = document.getElementById('nmf-core-style');
    if (!st) {
        st = document.createElement('style');
        st.id = 'nmf-core-style';
        document.head.appendChild(st);
    }
    st.textContent = NMF_FULL_CSS;
}

function ensureDialogMounted() {
    ensureStylesMounted();
    let dlg = document.getElementById('nmf-dialog');
    if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = 'nmf-dialog';
        dlg.setAttribute('translate', 'no');
        dlg.classList.add('notranslate');
        dlg.innerHTML = `<div id="nmf-window" class="nmf-theme-krakoa"></div>`;
        dlg.addEventListener('click', (e) => {
            if (e.target === dlg) closeForgeDialog();
        });
        dlg.addEventListener('close', () => {
            // Clean up pushed history entry if user closed dialog via Esc or UI button (fixes NMF-019)
            if (state.historyEntryPushed && !state.closingViaHistorySync) {
                state.historyEntryPushed = false;
                if (typeof history !== 'undefined' && history.state?.nmfModal === true) {
                    state.closingViaHistorySync = true;
                    try {
                        history.back();
                    } catch {
                        state.closingViaHistorySync = false;
                    }
                }
            }
        });
        document.body.appendChild(dlg);
        bindWindowDelegation(dlg.querySelector('#nmf-window'));
    }
    return dlg;
}

async function backfillMissingNaturalRatios(cfg) {
    if (typeof Image === 'undefined' || !cfg) return false;
    let updated = false;
    const visit = async (ent) => {
        if (!ent || typeof ent !== 'object' || Number(ent.artNaturalRatio) > 0) return;
        const url = resolveEntityDisplayUrl(ent);
        if (!url) return;
        const dims = await probeImageDimensionsFromDataUrl(url);
        if (dims.w && dims.h) {
            ent.artNaturalRatio = dims.w / dims.h;
            updated = true;
        }
    };
    const tasks = [];
    for (const s of (cfg.sessions || [])) {
        tasks.push(visit(s?.card));
        for (const p of ['queue', 'liked', 'passed']) {
            for (const c of (s?.tinder?.[p] || [])) tasks.push(visit(c));
        }
        for (const g of (s?.gacha?.collection || [])) tasks.push(visit(g));
    }
    for (const v of (cfg.savedVault || [])) tasks.push(visit(v));
    await Promise.all(tasks);
    if (updated) saveSettings();
    return updated;
}

export async function openForgeDialog(initialTab = '') {
    if (typeof document === 'undefined') return;
    const dlg = ensureDialogMounted();
    state.activeTab = initialTab || 'home';
    const cfg = getSettings();
    await waitForActiveMediaMigration().catch(() => {});
    await Promise.all([
        refreshRosterData(),
        hydrateSessionsMedia(cfg.sessions, [], cfg.savedVault || []),
        refreshBackupsList(),
    ]);
    await backfillMissingNaturalRatios(cfg).catch(() => {});
    renderWindow();
    if (!dlg.open) {
        dlg.showModal();
        if (!state.historyEntryPushed && typeof history !== 'undefined' && history.state?.nmfModal !== true) {
            history.pushState({ nmfModal: true }, '');
            state.historyEntryPushed = true;
        }
    }
}

export function closeForgeDialog() {
    if (typeof document === 'undefined') return;
    const dlg = document.getElementById('nmf-dialog');
    if (dlg?.open) dlg.close();
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('popstate', () => {
        if (state.closingViaHistorySync) {
            state.closingViaHistorySync = false;
            return;
        }
        const dlg = typeof document !== 'undefined' ? document.getElementById('nmf-dialog') : null;
        if (dlg?.open) {
            const rePush = () => {
                history.pushState({ nmfModal: true }, '');
                state.historyEntryPushed = true;
                renderWindow();
            };
            if (state.cropSaving) { return rePush(); }
            if (state.pendingSacrifice) { state.pendingSacrifice = null; return rePush(); }
            if (state.cropModalInfo) { state.cropModalInfo = null; return rePush(); }
            if (state.helpPopoverKey) { state.helpPopoverKey = ''; return rePush(); }
            if (state.lightboxInfo) { state.lightboxInfo = null; return rePush(); }
            if (state.viewingCandRef) { state.viewingCandRef = null; return rePush(); }
            if (state.matchRevealState) { state.matchRevealState = null; return rePush(); }
            if (state.wishRevealState) {
                if (state.wishRevealState.timerId) clearTimeout(state.wishRevealState.timerId);
                state.wishRevealState = null;
                return rePush();
            }
            if (state.overwriteConfirmInfo) { state.overwriteConfirmInfo = null; return rePush(); }
            if (state.editingCandRef) { state.editingCandRef = null; return rePush(); }
            if (state.translateModalOpen) { state.translateModalOpen = false; return rePush(); }
            if (state.settingsModalOpen) { state.settingsModalOpen = false; return rePush(); }
            if (state.guideModalOpen) { state.guideModalOpen = false; return rePush(); }
            if (state.gachaPrefsOpen) { state.gachaPrefsOpen = false; return rePush(); }
            if (state.intakeSheetOpen) { state.intakeSheetOpen = false; return rePush(); }
            state.historyEntryPushed = false;
            state.closingViaHistorySync = true;
            dlg.close();
            state.closingViaHistorySync = false;
        }
    });
}


const RARITY_COLOR_PALETTE = Object.freeze({
    1: { hex: '#94a3b8', glowClass: 'nmf-r1-glow', label: '1 ЗВ. · ИНЕЙ СУДЬБЫ' },
    2: { hex: '#34d399', glowClass: 'nmf-r2-glow', label: '2 ЗВ. · ИЗУМРУДНЫЙ ОТБЛЕСК' },
    3: { hex: '#38bdf8', glowClass: 'nmf-r3-glow', label: '3 ЗВ. · ЛАЗУРНАЯ КОМЕТА' },
    4: { hex: '#c084fc', glowClass: 'nmf-r4-glow', label: '4 ЗВ. · АМЕТИСТОВОЕ СИЯНИЕ' },
    5: { hex: '#f5c25b', glowClass: 'nmf-r5-glow', label: '5 ЗВ. · ЗОЛОТО СОЗВЕЗДИЯ' },
});

function resolvePuzzleTileSpec(entity, hasThumb = false) {
    if (!hasThumb) return { cls: 'nmf-tile-noart', style: '' };
    const ca = String(entity?.croppedAspect || '').trim();
    if (ca === '16:9') return { cls: 'nmf-tile-wide', style: '--tile-aspect:16/9;' };
    if (ca === '4:3') return { cls: 'nmf-tile-wide', style: '--tile-aspect:4/3;' };
    if (ca === '1:1') return { cls: 'nmf-tile-square', style: '--tile-aspect:1/1;' };
    if (ca === '3:4') return { cls: 'nmf-tile-tall', style: '--tile-aspect:3/4;' };
    if (ca === '2:3') return { cls: 'nmf-tile-tall', style: '--tile-aspect:2/3;' };

    const r = Number(entity?.artNaturalRatio) || 0;
    if (r >= 1.28) return { cls: 'nmf-tile-wide', style: `--tile-aspect:${r.toFixed(3)} / 1;` };
    if (r > 0 && r <= 0.86) return { cls: 'nmf-tile-tall', style: `--tile-aspect:${r.toFixed(3)} / 1;` };
    if (r > 0.86 && r < 1.28) return { cls: 'nmf-tile-square', style: '--tile-aspect:1/1;' };
    return { cls: '', style: '' };
}

function consumeFreshArtClass(entityKey) {
    const k = String(entityKey || '');
    if (!k || !state.justUnveiledArtIds.has(k)) return '';
    setTimeout(() => { state.justUnveiledArtIds.delete(k); }, 750);
    return ' nmf-art-just-opened';
}

function isArtWaitingToOpen(entityKey) {
    const k = String(entityKey || '');
    return Boolean(k && state.unseenArtIds.has(k));
}

function renderSealedArtVeilHtml(entityKey) {
    const k = String(entityKey || '');
    if (!k || !state.unseenArtIds.has(k)) return '';
    const cfg = getSettings();
    const copy = getThemeUnpackCopy(cfg.theme);
    return `
    <div class="nmf-art-veil-layer" data-veil-guard="1">
        <span style="color:var(--nmf-accent)">${NMF_ICONS.eyeOpen}</span>
        <div style="font-size:11px;font-weight:600;color:#cbd5e1">${esc(tx('Арт готов к показу', 'Artwork is ready'))}</div>
        <button type="button" class="nmf-art-open-btn" data-act="unveil-fresh-art" data-artkey="${esc(k)}">
            ${NMF_ICONS.eyeOpen} <span>${esc(copy.artBtn)}</span>
        </button>
    </div>`;
}

function probeImageDimensionsFromDataUrl(dataUrl) {
    if (!dataUrl || typeof Image === 'undefined') return Promise.resolve({ w: 0, h: 0 });
    return new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve({ w: im.naturalWidth || 0, h: im.naturalHeight || 0 });
        im.onerror = () => resolve({ w: 0, h: 0 });
        im.src = dataUrl;
    });
}

function resetSessionStoryIntake(sess) {
    if (!sess) return;
    const fresh = createDefaultSession(1).intake;
    // Preserve global-like formatting/word-budget choices while clearing all story fields!
    const keepFormat = sess.intake?.cardFormat || fresh.cardFormat;
    const keepWords = sess.intake?.wordBudgetId || fresh.wordBudgetId;
    const keepGreetWords = sess.intake?.greetingBudgetId || fresh.greetingBudgetId;
    const keepUserLang = sess.intake?.userLanguage || fresh.userLanguage;
    const keepCardLang = sess.intake?.cardLanguage || fresh.cardLanguage;
    sess.intake = {
        ...fresh,
        cardFormat: keepFormat,
        wordBudgetId: keepWords,
        greetingBudgetId: keepGreetWords,
        userLanguage: keepUserLang,
        cardLanguage: keepCardLang,
    };
}

function openMatchSignalReveal(count = 1) {
    state.matchRevealState = {
        count: Math.max(1, Number(count) || 1),
        phase: 'sealed',
    };
}

function renderMatchSignalRevealOverlay(sess) {
    const mr = state.matchRevealState;
    if (!mr) return '';
    const cfg = getSettings();
    const copy = getThemeUnpackCopy(cfg.theme);
    const topCand = sess.tinder?.queue?.[0];
    const bgStyle = REVEAL_ASSET_URLS.match
        ? `background-image:url('${esc(REVEAL_ASSET_URLS.match)}');`
        : '';

    return `
    <div class="nmf-unpack-stage-modal" style="${bgStyle}--seal-color:var(--nmf-accent);--seal-glow:rgba(240,198,116,0.28)">
        <div class="nmf-unpack-stage-scrim"></div>
        <div class="nmf-unpack-inner">
            <div style="display:flex;justify-content:flex-end">
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-match-reveal" title="${esc(tx('Закрыть', 'Close'))}">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sealed-center">
                <div style="font-family:var(--nmf-font-mono);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#e2e8f0">
                    ${esc(tx(`Найдено новых анкет: ${mr.count}`, `New Dossiers Found: ${mr.count}`))}
                </div>
                <div style="font-family:var(--nmf-font-title);font-size:19px;font-weight:700;color:#ffffff;max-width:340px;line-height:1.3">
                    ${esc(copy.stageMatchTitle)}
                </div>
                ${mr.phase === 'unpacked' && topCand ? `
                <div class="nmf-unpacked-card-enter" style="width:min(100%,320px);padding:16px;border-radius:10px;border:1.5px solid var(--nmf-accent);background:rgba(12,15,24,0.92);box-shadow:0 16px 40px rgba(0,0,0,0.65);display:flex;flex-direction:column;gap:8px">
                    <div style="font-family:var(--nmf-font-mono);font-size:10px;color:var(--nmf-accent)">${Number(topCand.compatibility) || 92}% MATCH</div>
                    <div style="font-family:var(--nmf-font-title);font-size:18px;font-weight:700;color:#fff">${esc(topCand.name)}</div>
                    <div style="font-size:12px;color:#cbd5e1">${esc(topCand.archetype || '')}</div>
                    <div style="font-size:12px;color:#94a3b8;line-height:1.42">${esc((topCand.pitch || '').slice(0, 140))}${(topCand.pitch || '').length > 140 ? '...' : ''}</div>
                    <button type="button" class="nmf-btn-primary" style="margin-top:6px;width:100%" data-act="close-match-reveal">
                        ${NMF_ICONS.heart} ${esc(tx('Перейти к свайпам', 'Proceed to Swipes'))}
                    </button>
                </div>` : `
                <div class="nmf-sealed-card-totem">
                    <div style="color:var(--nmf-accent);transform:scale(1.4)">${NMF_ICONS.heart}</div>
                    <div style="font-family:var(--nmf-font-mono);font-size:10px;letter-spacing:1.4px;color:#e2e8f0;text-transform:uppercase">NEXUSMATCH</div>
                </div>
                <button type="button" class="nmf-unpack-cta-btn" data-act="unpack-match-cards">
                    ${NMF_ICONS.unbox} <span>${esc(copy.matchBtn)}</span>
                </button>`}
            </div>
        </div>
    </div>`;
}


export function buildProceduralCoverDataUrl(entity = {}, { accentHex = '#e62e45', isError = false, errorText = '' } = {}) {
    const rawName = String(entity?.name || 'NEXUS').trim();
    const cleanWords = rawName.split(/[\s,'"-]+/).filter(Boolean);
    const monogram = ((cleanWords[0]?.[0] || 'N') + (cleanWords[1]?.[0] || '')).toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/gi, '') || 'NF';
    const safeAcc = /^#[0-9a-fA-F]{3,8}$/.test(accentHex) ? accentHex : '#e62e45';
    const strokeCol = isError ? '#ff5c77' : safeAcc;
    const subCol = isError ? '#ff8fa0' : '#94a3b8';
    const bgTop = isError ? '#240b12' : '#141824';
    const bgBot = isError ? '#0c0609' : '#080a11';
    const stars = Math.max(0, Math.min(5, Number(entity?.stars) || 0));
    const starLabel = stars > 0
        ? tx(`${stars} ЗВ. · КОЛЛЕКЦИОННАЯ КАРТА`, `${stars} ${stars === 1 ? 'STAR' : 'STARS'} · COLLECTIBLE CARD`)
        : tx('ДОСЬЕ ПЕРСОНАЖА', 'CHARACTER DOSSIER');
    const badgeTop = isError
        ? tx('СБОЙ РЕНДЕРА', 'RENDER INTERRUPTED')
        : starLabel;
    const badgeBot = isError
        ? tx('ПЕРЕСНИМИТЕ ИЛИ ЗАГРУЗИТЕ СВОЁ ФОТО', 'RETRY RENDER OR UPLOAD YOUR PHOTO')
        : tx('БЕЗ ИИ-АРТА · МОЖНО ЗАГРУЗИТЬ ФОТО', 'NO AI ART · UPLOAD PHOTO ANYTIME');
    const starDots = stars > 0
        ? Array.from({ length: stars }, (_, i) => {
            const cx = 300 - ((stars - 1) * 14) + i * 28;
            return `<polygon points="${cx},124 ${cx + 5},134 ${cx + 15},139 ${cx + 5},144 ${cx},154 ${cx - 5},144 ${cx - 15},139 ${cx - 5},134" fill="${strokeCol}" opacity="0.90"/>`;
        }).join('')
        : `<polygon points="300,126 308,138 300,150 292,138" fill="none" stroke="${strokeCol}" stroke-width="2" opacity="0.75"/>`;

    const centerSymbol = isError
        ? `<polygon points="300,225 362,332 238,332" fill="rgba(255,92,119,0.10)" stroke="#ff5c77" stroke-width="3"/>
           <line x1="300" y1="262" x2="300" y2="300" stroke="#ff8fa0" stroke-width="4" stroke-linecap="square"/>
           <rect x="297" y="311" width="6" height="6" fill="#ff8fa0"/>`
        : `<rect x="218" y="196" width="164" height="188" rx="10" fill="rgba(255,255,255,0.02)" stroke="${strokeCol}" stroke-width="2.2"/>
           <rect x="230" y="208" width="140" height="164" rx="6" fill="none" stroke="${strokeCol}" stroke-width="1" stroke-dasharray="5 5" opacity="0.55"/>
           <text x="300" y="308" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-weight="700" fill="#f1f5f9" letter-spacing="3">${monogram}</text>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${bgTop}"/>
                <stop offset="100%" stop-color="${bgBot}"/>
            </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#bg)"/>
        <rect x="24" y="24" width="552" height="552" rx="14" fill="none" stroke="${strokeCol}" stroke-width="1.5" opacity="0.36"/>
        <rect x="36" y="36" width="528" height="528" rx="10" fill="none" stroke="${strokeCol}" stroke-width="0.8" opacity="0.20"/>
        <line x1="90" y1="92" x2="510" y2="92" stroke="${strokeCol}" stroke-width="1" opacity="0.28"/>
        <text x="300" y="76" text-anchor="middle" font-family="sans-serif" font-size="13.5" font-weight="700" fill="${strokeCol}" letter-spacing="2.4">${badgeTop}</text>
        ${starDots}
        <circle cx="300" cy="290" r="122" fill="none" stroke="${strokeCol}" stroke-width="1" opacity="0.20"/>
        ${centerSymbol}
        <line x1="110" y1="432" x2="490" y2="432" stroke="${strokeCol}" stroke-width="1" opacity="0.28"/>
        <text x="300" y="460" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="${subCol}" letter-spacing="1.1">${badgeBot}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function renderOptionalArtSettingsBody(sess, cfg) {
    const buckets = listImageExtensionBuckets();
    const enabledBuckets = buckets.filter((b) => b.enabled);
    const activeBucket = (cfg.imageSource && cfg.imageSource !== 'auto' && cfg.imageSource !== 'iig' && cfg.imageSource !== 'st_sd' && cfg.imageSource !== 'off')
        ? buckets.find((b) => b.key === cfg.imageSource)
        : (enabledBuckets.find((b) => b.ready) || enabledBuckets[0] || null);
    const autoSummary = resolveAutoImageSourceSummary(cfg.imageSource, cfg.imageProfileId);
    const refCatalog = (cfg.imageSource !== 'off' && cfg.imageSource !== 'st_sd')
        ? listSillyImagesReferenceCatalog(cfg.imageSource)
        : [];
    const customRefUrl = safeImgSrc(resolveEntityDisplayUrl(sess.artRefCustom));

    return `
        <div class="nmf-warn-box" style="font-size:11px;border-color:var(--nmf-border-active);background:rgba(128,128,128,0.06)">
            ${NMF_ICONS.image}
            <span>${tx(
                '<strong>ИИ-генератор картинок необязателен.</strong> Без него на карточках стоит аккуратная обложка, а загрузить свой арт с телефона или ПК можно вручную в любом режиме.',
                '<strong>AI image generation is completely optional.</strong> Without it, cards use clean placeholder covers and you can upload your own images manually in every mode.',
            )}</span>
        </div>

        <div class="nmf-field">
            <label class="nmf-label"><span>${esc(tx('Источник генерации изображений', 'Image Generator Source'))}</span>${helpBtn('art_mechanism')}</label>
            <select class="nmf-select" data-cfg="imageSource">
                <option value="auto" ${(cfg.imageSource === 'auto' || cfg.imageSource === 'iig') ? 'selected' : ''}>${esc(tx('Авто', 'Auto'))} (${esc(autoSummary.label)})</option>
                ${buckets.map((b) => `<option value="${esc(b.key)}" ${cfg.imageSource === b.key ? 'selected' : ''} ${!b.enabled ? 'disabled' : ''}>${esc(b.key)} — ${esc(!b.enabled ? tx('отключено', 'disabled') : (b.ready ? (b.model || b.apiType) : tx('не готов', 'not ready')))}</option>`).join('')}
                <option value="st_sd" ${cfg.imageSource === 'st_sd' ? 'selected' : ''}>${esc(tx('Штатный /sd Таверны', 'Built-in SillyTavern /sd'))}</option>
                <option value="off" ${cfg.imageSource === 'off' ? 'selected' : ''}>${esc(tx('Выключено (только обложки + свои фото)', 'Off (Covers + Manual Photo Upload Only)'))}</option>
            </select>
        </div>

        ${cfg.imageSource !== 'off' ? `
        <div class="nmf-grid-2-compact">
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Базовый формат артов', 'Base Art Aspect'))}</label>
                <select class="nmf-select" data-cfg="imageAspectRatio">
                    ${IMAGE_ASPECT_OPTIONS.map((a) => `<option value="${a.id}" ${cfg.imageAspectRatio === a.id ? 'selected' : ''}>${esc(localizeOptionLabel('aspect', a.id, a.label))}</option>`).join('')}
                </select>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Фокус кадра', 'Portrait Focus'))}</label>
                <select class="nmf-select" data-cfg="imageCropFocus">
                    ${IMAGE_CROP_OPTIONS.map((c) => `<option value="${c.id}" ${cfg.imageCropFocus === c.id ? 'selected' : ''}>${esc(localizeOptionLabel('cropFocus', c.id, c.label))}</option>`).join('')}
                </select>
            </div>
        </div>` : ''}

        ${(activeBucket && activeBucket.enabled && cfg.imageSource !== 'st_sd' && cfg.imageSource !== 'off') ? `
        <div class="nmf-grid-2-compact">
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Профиль API', 'API Profile'))}</label>
                <select class="nmf-select" data-cfg="imageProfileId">
                    <option value="">${esc(tx('Активный', 'Active'))} (${esc(activeBucket.activeProfileName)})</option>
                    ${activeBucket.profiles.map((p) => `<option value="${esc(p.id)}" ${cfg.imageProfileId === p.id ? 'selected' : ''}>${esc(p.name)}${p.ready ? '' : tx(' [пусто]', ' [empty]')}</option>`).join('')}
                </select>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Стиль из SillyImages', 'SillyImages Style'))}</label>
                <select class="nmf-select" data-cfg="imageStyleId">
                    <option value="" ${!cfg.imageStyleId ? 'selected' : ''}>${esc(tx('Активный стиль', 'Active Style'))}</option>
                    <option value="__none__" ${cfg.imageStyleId === '__none__' ? 'selected' : ''}>${esc(tx('Без стиля', 'No Style'))}</option>
                    ${activeBucket.styles.map((s) => `<option value="${esc(s.id)}" ${cfg.imageStyleId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="nmf-grid-2-compact">
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Подача стиля', 'Style Placement'))}</label>
                <select class="nmf-select" data-cfg="styleWrapMode">
                    ${STYLE_WRAP_OPTIONS.map((sw) => `<option value="${sw.id}" ${(cfg.styleWrapMode || 'plain_prefix') === sw.id ? 'selected' : ''}>${esc(localizeOptionLabel('styleWrap', sw.id, sw.label))}</option>`).join('')}
                </select>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Негатив из SillyImages', 'Negative Preset'))}</label>
                <select class="nmf-select" data-cfg="imageNegativeId">
                    <option value="" ${!cfg.imageNegativeId ? 'selected' : ''}>${esc(tx('Активный в SillyImages', 'Active in SillyImages'))}</option>
                    <option value="__none__" ${cfg.imageNegativeId === '__none__' ? 'selected' : ''}>${esc(tx('Отключить пресет', 'Disable Preset'))}</option>
                    ${(activeBucket.negativePrompts || []).map((np) => `<option value="${esc(np.id)}" ${cfg.imageNegativeId === np.id ? 'selected' : ''}>${esc(np.name)}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="nmf-field">
            <label class="nmf-label">${esc(tx('Дополнительный негативный промпт (EN)', 'Extra Negative Prompt (EN)'))}</label>
            <input type="text" class="nmf-input" data-cfg-live="imageCustomNegative" value="${esc(cfg.imageCustomNegative || '')}" placeholder="text, watermark, blurry, cropped head, extra fingers..."/>
        </div>

        <div class="nmf-field">
            <label class="nmf-label"><span>${NMF_ICONS.refFrame} ${esc(tx('Референс внешности', 'Appearance Reference'))}</span></label>
            <select class="nmf-select" data-cfg="imageRefMode">
                ${IMAGE_REF_MODE_OPTIONS.map((rm) => `<option value="${rm.id}" ${(cfg.imageRefMode || 'off') === rm.id ? 'selected' : ''}>${esc(localizeOptionLabel('refMode', rm.id, rm.label))}</option>`).join('')}
            </select>
        </div>

        ${cfg.imageRefMode === 'pick_sillyimages' ? `
        <div class="nmf-field">
            <label class="nmf-label">${esc(tx('Запись из SillyImages', 'SillyImages Entry'))} (${refCatalog.length})</label>
            <select class="nmf-select" data-cfg="imagePickedRefUid">
                <option value="">${esc(tx('— Выберите референс внешности —', '— Select Appearance Reference —'))}</option>
                ${refCatalog.map((r) => `<option value="${esc(r.uid)}" ${cfg.imagePickedRefUid === r.uid ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}
            </select>
        </div>` : ''}

        ${cfg.imageRefMode === 'custom_photo' ? `
        <div class="nmf-panel-sub" style="display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;align-items:center;gap:8px">
                <div style="width:44px;height:44px;border:1px solid var(--nmf-border-active);border-radius:6px;background:var(--nmf-bg);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
                    ${customRefUrl ? `<img src="${esc(customRefUrl)}" style="width:100%;height:100%;object-fit:cover" alt="Ref"/>` : NMF_ICONS.refFrame}
                </div>
                <div class="nmf-btn-row" style="flex:1">
                    <label class="nmf-btn-secondary" style="height:28px;font-size:10.5px;cursor:pointer">
                        ${NMF_ICONS.upload} ${esc(tx('Загрузить реф', 'Upload Ref'))}
                        <input type="file" id="nmf-custom-ref-upload" accept="image/*" style="display:none"/>
                    </label>
                    ${resolveEntityAvatarUrl(sess.card) ? `<button type="button" class="nmf-btn-secondary" style="height:28px;font-size:10.5px" data-act="use-card-avatar-as-ref">${esc(tx('Из Профиля', 'From Profile'))}</button>` : ''}
                    ${customRefUrl ? `<button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:28px;font-size:10.5px" data-act="clear-custom-ref">${esc(tx('Сброс', 'Clear'))}</button>` : ''}
                </div>
            </div>
            <input type="text" class="nmf-input" data-artref-desc="1" value="${esc(sess.artRefCustom?.description || '')}" placeholder="${esc(tx('Пояснение к референсу (цвет глаз, причёска)...', 'Reference note (eye color, hairstyle)...'))}"/>
        </div>` : ''}` : ''}
    `;
}

function displaySessionTitle(rawTitle = '') {
    const clean = String(rawTitle || '').trim();
    const mRu = clean.match(/^Сессия\s+(\d+)$/i);
    if (mRu && isEn()) return `Session ${mRu[1]}`;
    const mEn = clean.match(/^Session\s+(\d+)$/i);
    if (mEn && !isEn()) return `Сессия ${mEn[1]}`;
    return clean;
}

function renderHomeTab(sess) {
    const cfg = getSettings();
    const it = sess.intake || {};
    const gc = sess.gacha || (sess.gacha = createDefaultSession(1).gacha);
    const curFmtId = it.cardFormat || 'dossier_19';
    const curFmt = CARD_FORMATS.find((f) => f.id === curFmtId) || CARD_FORMATS[0];
    const fmtGuideRu = CARD_FORMAT_HUMAN_GUIDES[curFmt.id] || CARD_FORMAT_HUMAN_GUIDES.dossier_19;
    const fmtShort = localizeOptionLabel('cardFormatShort', curFmt.id, fmtGuideRu.shortBtn || curFmt.name);
    const fmtFullTitle = localizeOptionLabel('cardFormatName', curFmt.id, curFmt.name);
    const fmtExplain = localizeOptionLabel('cardFormatExplain', curFmt.id, fmtGuideRu.explain);

    const curModeKey = cfg.transportMode === 'json_schema' ? 'json_schema' : 'prefill_user_msg';
    const trGuideRu = TRANSPORT_MODE_GUIDES[curModeKey] || TRANSPORT_MODE_GUIDES.prefill_user_msg;
    const trShort = localizeOptionLabel('transport', `${curModeKey}_short`, trGuideRu.shortLabel);
    const trBadge = localizeOptionLabel('transport', `${curModeKey}_badge`, trGuideRu.badge);
    const trExplain = localizeOptionLabel('transport', `${curModeKey}_explain`, trGuideRu.explain);

    const hasStoryFilled = Boolean(
        it.fandomName?.trim()
        || it.settingEra?.trim()
        || it.favFandomHero?.trim()
        || it.userRoleAndDesire?.trim()
        || it.tropesWanted?.trim()
        || (it.genres && it.genres.length),
    );

    const activeThemeDisp = getThemeDisplay(cfg.theme);
    const gachaResShort = (!gc.aspectRatio || gc.aspectRatio === 'sillyimages_default') ? 'SillyImages' : gc.aspectRatio;
    const luckObj = GACHA_LUCK_OPTIONS.find((l) => l.id === (cfg.gachaLuckMode || 'fair')) || GACHA_LUCK_OPTIONS[0];
    const luckLabel = isEn() ? luckObj.labelEn : luckObj.label;
    const dispSessTitle = displaySessionTitle(sess.title);

    const sessOpen = Boolean(state.homeOpenCards.sessions);
    const mandOpen = Boolean(state.homeOpenCards.mandatory);
    const themeOpen = Boolean(state.homeOpenCards.themeLang);
    const gachaOpen = Boolean(state.homeOpenCards.gacha);
    const sessNameVal = state.sessionTitleDraft || dispSessTitle || '';
    const intakeTagsSummary = [
        it.fandomName?.trim(),
        it.settingEra?.trim(),
        ...(it.genres || []).slice(0, 3).map((g) => localizeGenreTag(g)),
    ].filter(Boolean);

    return `
    <div class="nmf-home-stack">
        <!-- SESSION HEADER & INLINE SWITCHER ON HOME -->
        <div class="nmf-hcard ${sessOpen ? 'nmf-hcard-open' : ''}">
            <div class="nmf-hcard-head" data-act="toggle-home-card" data-hcard="sessions" role="button" tabindex="0" style="cursor:pointer">
                <div class="nmf-hcard-left">
                    <div class="nmf-hcard-icon">${NMF_ICONS.layers}</div>
                    <div class="nmf-hcard-info">
                        <div class="nmf-hcard-title">${esc(dispSessTitle)}${sess.frozen ? ` [${esc(tx('ПАУЗА', 'PAUSED'))}]` : ''}</div>
                        <div class="nmf-hcard-sub">${esc(tx(`Сессий: ${cfg.sessions.length} · переименование и переключение`, `Sessions: ${cfg.sessions.length} · rename & switch`))}</div>
                    </div>
                </div>
                <span class="nmf-hcard-btn ${sessOpen ? 'nmf-on' : ''}">
                    ${esc(sessOpen ? tx('Свернуть', 'Close') : tx('Сессии', 'Sessions'))}
                </span>
            </div>
            ${sessOpen ? `
            <div class="nmf-hcard-body">
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Название текущей сессии', 'Current Session Name'))}</label>
                    <div style="display:flex;gap:6px">
                        <input type="text" class="nmf-input" id="nmf-home-sess-title-input" maxlength="36" value="${esc(sessNameVal)}" placeholder="${esc(tx('Например: Тёмное фэнтези / Детектив...', 'e.g. Dark Fantasy / Noir Case...'))}"/>
                        <button type="button" class="nmf-hcard-btn" data-act="save-inline-session-title">${esc(tx('Сохранить', 'Save'))}</button>
                    </div>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Выбрать или переключить сессию', 'Select or Switch Session'))}</label>
                    <div class="nmf-sess-list-grid">
                        ${cfg.sessions.map((s) => {
                            const sCardsCount = (s.tinder?.liked?.length || 0) + (s.gacha?.collection?.length || 0);
                            const isCur = s.id === sess.id;
                            return `
                            <button type="button" class="nmf-sess-row-card ${isCur ? 'nmf-active' : ''}" data-act="switch-session" data-sid="${esc(s.id)}">
                                <span style="font-size:12px;font-weight:${isCur ? '700' : '600'};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                                    ${esc(displaySessionTitle(s.title))}${s.frozen ? ` [${esc(tx('ПАУЗА', 'PAUSED'))}]` : ''}
                                </span>
                                <span style="font-family:var(--nmf-font-mono);font-size:10px;color:${isCur ? 'var(--nmf-accent)' : 'var(--nmf-text-muted)'};flex-shrink:0">
                                    ${isCur ? esc(tx('Активна', 'Active')) : esc(tx(`Карт: ${sCardsCount}`, `Cards: ${sCardsCount}`))}
                                </span>
                            </button>`;
                        }).join('')}
                    </div>
                </div>

                <div class="nmf-btn-row">
                    <button type="button" class="nmf-btn-primary" style="flex:1;height:32px;font-size:11.5px" data-act="new-session">
                        ${NMF_ICONS.plus} ${esc(tx('Новая сессия', 'New Session'))}
                    </button>
                    <button type="button" class="nmf-btn-secondary" style="height:32px;font-size:11.5px" data-act="toggle-freeze">
                        ${sess.frozen ? NMF_ICONS.play : NMF_ICONS.pause} ${esc(sess.frozen ? tx('Снять паузу', 'Resume') : tx('Пауза', 'Pause'))}
                    </button>
                    ${cfg.sessions.length > 1 ? `
                    <button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:32px;font-size:11.5px" data-act="delete-session" title="${esc(tx('Удалить эту сессию', 'Delete Current Session'))}">
                        ${NMF_ICONS.trash}
                    </button>` : ''}
                </div>
            </div>` : ''}
        </div>

        <!-- ПУНКТ 1: БОЛЬШОЙ АКЦЕНТ НА АНКЕТЕ ЮЗЕРА + АНКЕТА ГАЧИ + ШАБЛОН И РЕЖИМ ИИ -->
        <div style="display:flex;flex-direction:column;gap:7px">
            <span class="nmf-section-kicker">${esc(tx('Пункт 1. Анкеты сессии и базовая настройка:', 'Point 1. Session Questionnaires & Core Setup:'))}</span>

            ${(() => {
                const gwp = normalizeGachaWishPrefs(gc.wishPrefs);
                const hasGachaPrefsFilled = Boolean(
                    gwp.fandomOrWorld.trim()
                    || gwp.wishesNote.trim()
                    || gwp.hardBans.trim()
                    || gwp.targetType !== 'oc'
                    || (gwp.userGender && gwp.userGender !== 'any')
                    || (gwp.targetGender && gwp.targetGender !== 'any'),
                );
                return `
            <div class="nmf-intake-spotlight">
                <!-- MAIN QUESTIONNAIRE (SWIPES, BLITZ, IDEA, AU) -->
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:800;color:var(--nmf-accent)">
                        ${NMF_ICONS.sliders} ${esc(tx('Главная Сюжетная Анкета Юзера', 'Main User Story Questionnaire'))}
                    </span>
                    <span style="font-family:var(--nmf-font-mono);font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid var(--nmf-accent);color:var(--nmf-accent)">
                        ${esc(hasStoryFilled ? tx('ЗАПОЛНЕНА', 'CONFIGURED') : tx('ОСНОВНЫЕ РЕЖИМЫ', 'CORE MODES'))}
                    </span>
                </div>

                <div style="font-size:11.5px;line-height:1.45;color:var(--nmf-text-muted);display:flex;flex-direction:column;gap:4px">
                    <div>
                        <strong style="color:var(--nmf-text)">${esc(tx('Для Свайпов (Тиндера):', 'For Swipes (Tinder):'))}</strong>
                        ${esc(tx(' рекомендуется начать именно с этой анкеты, чтобы кандидаты сразу попадали в ваш вкус.', ' recommended to start here so candidates immediately match your taste.'))}
                    </div>
                    <div>
                        <strong style="color:var(--nmf-text)">${esc(tx('Для Блиц-опроса и Задумки (Идеи):', 'For Blitz Quiz & Idea Mode:'))}</strong>
                        ${esc(tx(' заполнять необязательно, но она поможет тоньше настроить вайб, языки и усилит оба режима!', ' optional, but filling it out fine-tunes vibe & languages and boosts both modes!'))}
                    </div>
                </div>

                ${intakeTagsSummary.length > 0 ? `
                <div class="nmf-chip-wrap">
                    ${intakeTagsSummary.map((tg) => `<span class="nmf-mini-tag" style="border-color:var(--nmf-accent);color:var(--nmf-text)">${esc(tg)}</span>`).join('')}
                </div>` : ''}

                <div class="nmf-btn-row" style="margin-top:2px">
                    <button type="button" class="nmf-btn-primary" style="flex:1;height:38px;font-size:12.5px" data-act="open-intake-sheet">
                        ${NMF_ICONS.sliders} ${esc(hasStoryFilled ? tx('Изменить Главную Анкету', 'Edit Main Questionnaire') : tx('Заполнить Главную Анкету', 'Fill Out Main Questionnaire'))}
                    </button>
                    ${hasStoryFilled ? `
                    <button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:38px;font-size:11.5px" data-act="clear-session-intake" title="${esc(tx('Очистить Главную анкету', 'Clear Main Questionnaire'))}">
                        ${NMF_ICONS.trash} ${esc(tx('Очистить', 'Clear'))}
                    </button>` : ''}
                </div>

                <!-- ADDITIONAL GACHA QUESTIONNAIRE (STRICTLY ISOLATED FOR GACHA ONLY) -->
                <div style="margin-top:4px;padding-top:10px;border-top:1px dashed var(--nmf-border);display:flex;flex-direction:column;gap:6px">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                        <span style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--nmf-text)">
                            <span style="color:var(--nmf-accent)">${NMF_ICONS.primogem}</span>
                            <span>${esc(tx('Анкета для режима Гачи', 'Gacha Mode Questionnaire'))}</span>
                        </span>
                        <span style="font-family:var(--nmf-font-mono);font-size:9.5px;color:var(--nmf-text-muted)">
                            ${esc(hasGachaPrefsFilled ? tx('Настроена (только Гача)', 'Custom (Gacha Only)') : tx('Пустая · Макс. рандом', 'Empty · Max Random'))}
                        </span>
                    </div>
                    <div style="font-size:11px;line-height:1.4;color:var(--nmf-accent);font-weight:600">
                        ${esc(tx('*Если вы хотите поиграть и поколлекционировать карты.', '*If you want to play and collect cards.'))}
                    </div>
                    <div style="font-size:11px;line-height:1.4;color:var(--nmf-text-muted)">
                        ${esc(tx(
                            'Работает строго только для Гачи (не смешивается с Главной анкетой). Её можно оставить пустой — так в призыве будет больше рандомизации!',
                            'Applies strictly to Gacha only (never mixes with Main Questionnaire). Leave it blank for maximum randomization!',
                        ))}
                    </div>
                    <div class="nmf-btn-row">
                        <button type="button" class="nmf-btn-secondary" style="flex:1;height:33px;font-size:11.5px;border-color:var(--nmf-border-active)" data-act="open-gacha-prefs">
                            ${NMF_ICONS.primogem} ${esc(hasGachaPrefsFilled ? tx('Изменить Анкету Гачи', 'Edit Gacha Questionnaire') : tx('Открыть Анкету Гачи (по желанию)', 'Open Gacha Questionnaire (Optional)'))}
                        </button>
                        ${hasGachaPrefsFilled ? `
                        <button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:33px;font-size:11px" data-act="clear-gacha-prefs" title="${esc(tx('Очистить Анкету Гачи', 'Clear Gacha Questionnaire'))}">
                            ${NMF_ICONS.trash}
                        </button>` : ''}
                    </div>
                </div>
            </div>`;
            })()}

            <button type="button" class="nmf-home-mode-btn ${mandOpen ? 'nmf-active' : ''}" style="width:100%" data-act="toggle-home-card" data-hcard="mandatory">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">
                        ${NMF_ICONS.doc} ${esc(tx('*Обязательно: Шаблон и Режим ИИ', '*Required: Card Template & AI Mode'))}
                    </span>
                    <span style="font-family:var(--nmf-font-mono);font-size:10px;color:var(--nmf-text-muted)">${esc(mandOpen ? tx('Свернуть', 'Close') : tx('Открыть', 'Open'))}</span>
                </div>
                <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(trShort)} · ${esc(fmtShort)}</span>
            </button>

            ${mandOpen ? `
            <div class="nmf-hcard nmf-hcard-open">
                <div class="nmf-hcard-body" style="border-top:none">
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('1. Способ отправки запроса к ИИ', '1. AI Request Delivery Mode'))}</label>
                        <div class="nmf-seg-bar">
                            <button type="button" class="nmf-seg-btn ${curModeKey === 'prefill_user_msg' ? 'nmf-active' : ''}" data-act="pick-home-transport" data-mode="prefill_user_msg">
                                ${esc(tx('Через пресет Таверны', 'Via Tavern Preset'))}
                            </button>
                            <button type="button" class="nmf-seg-btn ${curModeKey === 'json_schema' ? 'nmf-active' : ''}" data-act="pick-home-transport" data-mode="json_schema">
                                ${esc(tx('Строгая JSON-схема', 'Strict JSON Schema'))}
                            </button>
                        </div>
                        <div style="padding:7px 9px;border-left:3px solid var(--nmf-accent);background:var(--nmf-bg);border-radius:5px;font-size:11.5px;line-height:1.44;color:var(--nmf-text)">
                            <div style="font-family:var(--nmf-font-mono);font-size:10px;color:var(--nmf-accent);margin-bottom:2px">${esc(trShort)} · ${esc(trBadge)}</div>
                            <div>${esc(trExplain)}</div>
                        </div>
                        ${curModeKey === 'prefill_user_msg' ? `
                        <details class="nmf-spoiler">
                            <summary><span>${esc(tx('Дополнительно: очистка чужого чата и коррекция', 'Advanced: Chat Macro Cleanup & Override'))}</span>${NMF_ICONS.chevronDown}</summary>
                            <div class="nmf-spoiler-body">
                                <div class="nmf-toggle-line" data-act="toggle-strip-active-char">
                                    <span style="font-size:11.5px;font-weight:600">${esc(tx('Вырезать поля открытого чара и Лорбука из пресета', 'Strip open character & Lorebook macros from preset'))}</span>
                                    <div class="nmf-switch ${cfg.stripActiveCharFromPreset !== false ? 'nmf-on' : ''}"></div>
                                </div>
                                <div class="nmf-field">
                                    <label class="nmf-label"><span>${esc(tx('Промпт коррекции пресета', 'Preset Override Prompt'))}</span><button type="button" class="nmf-chip" data-act="reset-correction-prompt">${esc(tx('Сброс', 'Reset'))}</button></label>
                                    <textarea class="nmf-textarea" style="min-height:52px;font-size:11px" data-cfg-live="presetCorrectionPrompt">${esc(cfg.presetCorrectionPrompt ?? '')}</textarea>
                                </div>
                            </div>
                        </details>` : ''}
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('2. Шаблон структуры карточки', '2. Character Card Structure Template'))}</label>
                        <div class="nmf-chip-wrap">
                            ${CARD_FORMATS.map((f) => {
                                const gRu = CARD_FORMAT_HUMAN_GUIDES[f.id] || { shortBtn: f.name };
                                const btnText = localizeOptionLabel('cardFormatShort', f.id, gRu.shortBtn);
                                return `<button type="button" class="nmf-chip ${curFmt.id === f.id ? 'nmf-on' : ''}" data-act="pick-home-format" data-fmt="${f.id}" ${sess.frozen ? 'disabled' : ''}>${esc(btnText)}</button>`;
                            }).join('')}
                        </div>
                        <div style="padding:8px 9px;border-left:3px solid var(--nmf-accent);background:var(--nmf-bg);border-radius:5px;font-size:11.5px;line-height:1.45;color:var(--nmf-text)">
                            <div style="font-weight:700;color:var(--nmf-accent);margin-bottom:2px">${esc(fmtFullTitle)}</div>
                            <div>${esc(fmtExplain)}</div>
                        </div>
                    </div>

                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('3. Объём анкеты', '3. Card Word Count'))}</label>
                            <select class="nmf-select" data-intake="wordBudgetId" ${sess.frozen ? 'disabled' : ''}>
                                ${WORD_BUDGETS.map((b) => `<option value="${b.id}" ${it.wordBudgetId === b.id ? 'selected' : ''}>${esc(localizeOptionLabel('wordBudget', b.id, b.label))}</option>`).join('')}
                            </select>
                            ${it.wordBudgetId === 'custom' ? `<input type="number" min="100" max="4000" class="nmf-input" style="margin-top:4px!important" data-intake="customWords" value="${Number(it.customWords) || 800}"/>` : ''}
                        </div>
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('4. Первое сообщение', '4. Opening Scene Length'))}</label>
                            <select class="nmf-select" data-intake="greetingBudgetId" ${sess.frozen ? 'disabled' : ''}>
                                ${GREETING_BUDGETS.map((b) => `<option value="${b.id}" ${it.greetingBudgetId === b.id ? 'selected' : ''}>${esc(localizeOptionLabel('greetingBudget', b.id, b.label))}</option>`).join('')}
                            </select>
                            ${it.greetingBudgetId === 'custom' ? `<input type="number" min="50" max="2000" class="nmf-input" style="margin-top:4px!important" data-intake="customGreetingWords" value="${Number(it.customGreetingWords) || 320}"/>` : ''}
                        </div>
                    </div>
                </div>
            </div>` : ''}
        </div>

        <!-- ПУНКТ 2: РЕЖИМЫ СОЗДАНИЯ КАРТОЧКИ (КАРТОЧКАМИ) -->
        <div style="display:flex;flex-direction:column;gap:6px">
            <span class="nmf-section-kicker">${esc(tx('Пункт 2. Выберите режим создания карточки:', 'Point 2. Choose Card Creation Mode:'))}</span>
            <div class="nmf-home-card-grid">
                <button type="button" class="nmf-home-mode-btn" data-act="launch-mode-from-home" data-mode="swipe">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">${NMF_ICONS.flame} ${esc(tx('Свайпы Тиндера', 'NexusMatch Swipes'))}</span>
                    <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(tx('ИИ предлагает анкеты по вашей Анкете — свайпайте в Мэтчи или Мимо.', 'Swipe candidate dossiers from your Questionnaire into Matches or Pass.'))}</span>
                </button>
                <button type="button" class="nmf-home-mode-btn" data-act="launch-mode-from-home" data-mode="gacha">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">${NMF_ICONS.primogem} ${esc(tx('Гача-Призыв', 'Gacha Summon'))}</span>
                    <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(tx('Впишите 3–10 тегов через «+» и выбейте героя от 1 до 5 звёзд.', 'Enter 3-10 tags via "+" and pull a 1-5 star collectible hero card.'))}</span>
                </button>
                <button type="button" class="nmf-home-mode-btn" data-act="launch-mode-from-home" data-mode="blitz">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">${NMF_ICONS.blitz} ${esc(tx('Блиц-Опрос', 'Blitz Quiz'))}</span>
                    <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(tx('Ответьте галочками на вопросы ИИ с нуля или по герою из Мэтчей.', 'Check answers on AI questions from scratch or for a saved hero.'))}</span>
                </button>
                <button type="button" class="nmf-home-mode-btn" data-act="launch-mode-from-home" data-mode="create">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">${NMF_ICONS.architect} ${esc(tx('Задумка / AU', 'Idea / AU Shift'))}</span>
                    <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(tx('Собрать из своего текста (+ Анкета) или перенести чара в другой мир.', 'Build from your text (+ Questionnaire) or shift a card to a new world.'))}</span>
                </button>
            </div>
        </div>

        <!-- ПУНКТ 3: ТЕМЫ И НАСТРОЙКИ ГАЧИ (ТОЧНО ТАКИМИ ЖЕ КАРТОЧКАМИ КАК НА СКРИНЕ) -->
        <div style="display:flex;flex-direction:column;gap:6px">
            <span class="nmf-section-kicker">${esc(tx('Пункт 3. Темы оформления и настройки Гачи:', 'Point 3. Visual Themes & Gacha Settings:'))}</span>
            <div class="nmf-home-card-grid">
                <button type="button" class="nmf-home-mode-btn ${themeOpen ? 'nmf-active' : ''}" data-act="toggle-home-card" data-hcard="themeLang">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">${NMF_ICONS.palette} ${esc(tx('Темы и Язык', 'Themes & Language'))}</span>
                    <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(activeThemeDisp.name)} · ${getUiLang() === 'en' ? 'English' : 'Русский'}. ${esc(tx('Нажмите, чтобы выбрать тему или язык.', 'Tap to switch theme or UI language.'))}</span>
                </button>
                <button type="button" class="nmf-home-mode-btn ${gachaOpen ? 'nmf-active' : ''}" data-act="toggle-home-card" data-hcard="gacha">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;color:var(--nmf-accent)">${NMF_ICONS.dice} ${esc(tx('Настройки Гачи', 'Gacha Settings'))}</span>
                    <span style="font-size:11px;color:var(--nmf-text-muted);line-height:1.35">${esc(luckLabel.split('(')[0].trim())} · ${esc(gachaResShort)}${cfg.gachaSacrificeFailEnabled ? ` · ${esc(tx(`Провал ${cfg.gachaSacrificeFailChance}%`, `Fail ${cfg.gachaSacrificeFailChance}%`))}` : ''}. ${esc(tx('Подкрутка, формат и Алтарь.', 'Luck, resolution & Altar risk.'))}</span>
                </button>
            </div>

            ${themeOpen ? `
            <div class="nmf-hcard nmf-hcard-open">
                <div class="nmf-hcard-body" style="border-top:none">
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Язык интерфейса приложения (переводит экран и обложки)', 'Application UI Language (Translates all screens & covers)'))}</label>
                        <div class="nmf-seg-bar">
                            <button type="button" class="nmf-seg-btn ${getUiLang() !== 'en' ? 'nmf-active' : ''}" data-act="set-ui-lang" data-lang="ru">Русский</button>
                            <button type="button" class="nmf-seg-btn ${getUiLang() === 'en' ? 'nmf-active' : ''}" data-act="set-ui-lang" data-lang="en">English</button>
                        </div>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Палитра и тематические надписи распаковки (13 тем)', 'Visual Palette & Unpack Inscriptions (13 Themes)'))}</label>
                        <div class="nmf-theme-cards-grid">
                            ${NMF_THEMES.map((t) => {
                                const td = getThemeDisplay(t.id);
                                return `
                                <button type="button" class="nmf-theme-card-opt ${cfg.theme === t.id ? 'nmf-active' : ''}" data-act="pick-theme" data-theme="${t.id}">
                                    <span class="nmf-theme-dot" style="background:${t.color}"></span>
                                    <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;font-weight:600">${esc(td.name)}</span>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>` : ''}

            ${gachaOpen ? `
            <div class="nmf-hcard nmf-hcard-open">
                <div class="nmf-hcard-body" style="border-top:none">
                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('Разрешение артов этой Гачи', 'Resolution for This Gacha'))}</label>
                            <select class="nmf-select" data-gacha="aspectRatio" ${sess.frozen ? 'disabled' : ''}>
                                ${GACHA_RESOLUTION_OPTIONS.map((opt) => `<option value="${opt.id}" ${(gc.aspectRatio || 'sillyimages_default') === opt.id ? 'selected' : ''}>${esc(isEn() ? opt.labelEn : opt.label)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('Подкрутка удачи в Баннере', 'Banner Luck / Rigging'))}</label>
                            <select class="nmf-select" data-cfg="gachaLuckMode">
                                ${GACHA_LUCK_OPTIONS.map((l) => `<option value="${l.id}" ${(cfg.gachaLuckMode || 'fair') === l.id ? 'selected' : ''}>${esc(isEn() ? l.labelEn : l.label)}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="nmf-toggle-line" data-act="toggle-sacrifice-fail-cfg">
                        <span style="font-size:11.5px;font-weight:600">${esc(tx('Включить риск провала Жертвы (Алтарь может поглотить карту без Молитв!)', 'Enable Sacrifice Failure Risk (Altar may consume card for 0 Prayers!)'))}</span>
                        <div class="nmf-switch ${cfg.gachaSacrificeFailEnabled ? 'nmf-on' : ''}"></div>
                    </div>

                    ${cfg.gachaSacrificeFailEnabled ? `
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Шанс провала ритуала Жертвы', 'Sacrifice Failure Chance'))}</label>
                        <div class="nmf-chip-wrap">
                            ${SACRIFICE_FAIL_CHANCE_OPTIONS.map((pct) => `
                                <button type="button" class="nmf-chip ${Number(cfg.gachaSacrificeFailChance || 25) === pct ? 'nmf-on' : ''}" data-act="set-sacrifice-fail-pct" data-pct="${pct}">${pct}%</button>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    <div class="nmf-toggle-line" data-act="toggle-gacha-timer-cfg">
                        <span style="font-size:11.5px;font-weight:600">${esc(tx('Глобальный таймер цикла Молитв (жертвы дают +Молитвы)', 'Global Prayer Cooldown Timer (sacrifices grant +Prayers)'))}</span>
                        <div class="nmf-switch ${cfg.gachaTimerEnabled !== false ? 'nmf-on' : ''}"></div>
                    </div>

                    ${cfg.gachaTimerEnabled !== false ? `
                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('Базовых молитв на цикл', 'Base Prayers per Cycle'))}</label>
                            <input type="number" min="3" max="50" class="nmf-input" data-cfg-num="gachaMaxPullsPerCycle" value="${Number(cfg.gachaMaxPullsPerCycle) || 10}"/>
                        </div>
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('Перезарядка (минут)', 'Cooldown (minutes)'))}</label>
                            <input type="number" min="5" max="1440" class="nmf-input" data-cfg-num="gachaCooldownMinutes" value="${Number(cfg.gachaCooldownMinutes) || 120}"/>
                        </div>
                    </div>` : ''}
                </div>
            </div>` : ''}
        </div>

        <!-- ПУНКТ 4: ГЕНЕРАТОР АРТОВ СТРОГО В СПОЙЛЕРЕ (НЕ КАРТОЧКА!) -->
        <div style="display:flex;flex-direction:column;gap:6px">
            <span class="nmf-section-kicker">${esc(tx('Пункт 4. Генератор Артов и Обложки:', 'Point 4. Artwork & Cover Generator:'))}</span>
            <details class="nmf-spoiler" ${state.homeArtSpoilerOpen ? 'open' : ''}>
                <summary>
                    <span style="display:inline-flex;align-items:center;gap:6px">
                        <span style="color:var(--nmf-accent)">${NMF_ICONS.image}</span>
                        <span>${esc(tx('* Необязательно, но будет красиво', '* Optional, but makes it pretty'))}</span>
                    </span>
                    ${NMF_ICONS.chevronDown}
                </summary>
                <div class="nmf-spoiler-body">
                    ${renderOptionalArtSettingsBody(sess, cfg)}
                </div>
            </details>
        </div>
    </div>`;
}

function renderPromptRefineBox(targetKey, disabled = false) {
    const isOpen = state.artRefineOpenKey === targetKey;
    return `
    <div style="display:flex;flex-direction:column;gap:5px;width:100%">
        <button type="button" class="nmf-btn-secondary" style="width:100%;height:28px;font-size:10.5px" data-act="toggle-art-refine" data-rkey="${esc(targetKey)}" ${disabled ? 'disabled' : ''}>
            ${NMF_ICONS.spark} Уточнить промпт внешности и сразу сделать Арт
        </button>
        ${isOpen ? `
        <div class="nmf-panel-sub" style="display:flex;gap:5px;padding:6px;border:1px solid var(--nmf-accent);border-radius:var(--nmf-radius)">
            <input type="text" class="nmf-input" data-art-refine-input="1" value="${esc(state.artRefineHint)}" placeholder="Что уточнить или поменять в кадре/внешности? (можно по-русски)..."/>
            <button type="button" class="nmf-btn-primary" style="height:36px;padding:0 10px;font-size:11px;flex-shrink:0" data-act="run-refine-prompt-and-art" data-rkey="${esc(targetKey)}" ${disabled ? 'disabled' : ''}>
                Промпт + Арт
            </button>
        </div>` : ''}
    </div>`;
}

function renderFilterSummaryBanner(sess) {
    const it = sess.intake;
    const effectiveOriginKey = it.cardFormat === 'rpg_gm_engine'
        ? 'rpg_gm'
        : (it.cardFormat === 'world_sandbox' ? 'world_sandbox' : it.originType);
    const originShort = {
        oc: 'Персонаж OC',
        canon: 'Канон',
        fandom_au: 'Фандом AU',
        fandom_oc: 'OC в Фандоме',
        duo_group: '2–3 Персонажа',
        artifact_object: 'Предмет / Реликвия',
        world_sandbox: 'Мир-Песочница',
        rpg_gm: 'РПГ-Мастер',
    }[effectiveOriginKey] || 'OC';
    const styleShort = {
        fanfic: 'Фанфик-проза',
        classic_rp: 'РП *звёздочки*',
        manhwa: 'Манхва-ритм',
        rpg_hud: 'РПГ-хроника',
        preserve: 'Стиль оригинала',
        custom: 'Свой стиль',
    }[it.greetingStyle || 'fanfic'] || 'Фанфик';
    const genreSample = (it.genres || []).slice(0, 2);
    const { userSpec, targetSpec } = resolveGenderSummary(it);
    const cardLangShort = resolveCardLanguageSpec(it).shortLabel;
    const userLangShort = resolveUserLanguageSpec(it).shortLabel;
    const langTagLabel = userLangShort === cardLangShort
        ? cardLangShort.slice(0, 16)
        : `${userLangShort.slice(0, 8)} -> ${cardLangShort.slice(0, 10)}`;
    const genderShort = (userSpec || targetSpec)
        ? `${userSpec ? `Я: ${userSpec.split(' ')[0].slice(0, 12)}` : 'Я: *'} -> ${targetSpec ? targetSpec.split(' ')[0].slice(0, 12) : '*'}`
        : '';

    return `
    <div class="nmf-filter-banner">
        <div class="nmf-filter-tags">
            <span class="nmf-mini-tag" style="border-color:var(--nmf-accent);color:var(--nmf-accent)">${esc(originShort)}</span>
            <span class="nmf-mini-tag">${esc(it.rating.toUpperCase())}</span>
            ${genderShort ? `<span class="nmf-mini-tag">${esc(genderShort)}</span>` : ''}
            <span class="nmf-mini-tag">${esc(langTagLabel)}</span>
            <span class="nmf-mini-tag">${esc(styleShort)}</span>
            ${it.settingEra ? `<span class="nmf-mini-tag">${esc(it.settingEra.slice(0, 20))}</span>` : ''}
            ${genreSample.map((g) => `<span class="nmf-mini-tag">${esc(g)}</span>`).join('')}
        </div>
        <button type="button" class="nmf-btn-secondary" style="height:26px;padding:0 8px;font-size:10.5px;flex-shrink:0" data-act="open-intake-sheet">
            ${NMF_ICONS.sliders} Анкета
        </button>
    </div>`;
}

function renderGachaFilterBanner(sess) {
    const it = sess.intake;
    const wp = normalizeGachaWishPrefs(sess.gacha?.wishPrefs, it);
    const targetShort = {
        oc: 'Гача: OC по тегам',
        fandom_oc: 'Гача: OC в фандоме',
        canon_au: 'Гача: Канон / AU',
        duo_group: 'Гача: 2–3 героя',
        artifact: 'Гача: Артефакт',
        world_rpg: 'Гача: Мир / РПГ',
    }[wp.targetType] || 'Гача: OC по тегам';
    const genderLabel = TARGET_GENDER_OPTIONS.find((g) => g.id === wp.targetGender)?.label?.split(' ')[0] || 'Любой';
    const cardLangShort = resolveCardLanguageSpec(it).shortLabel;
    const userLangShort = resolveUserLanguageSpec(it).shortLabel;
    const langTagLabel = userLangShort === cardLangShort
        ? cardLangShort.slice(0, 16)
        : `${userLangShort.slice(0, 8)} -> ${cardLangShort.slice(0, 10)}`;

    return `
    <div class="nmf-filter-banner">
        <div class="nmf-filter-tags">
            <span class="nmf-mini-tag" style="border-color:var(--nmf-accent);color:var(--nmf-accent)">${esc(targetShort)}</span>
            <span class="nmf-mini-tag">${esc((wp.rating || 'mature').toUpperCase())}</span>
            <span class="nmf-mini-tag">Пол: ${esc(wp.targetGender === 'custom' ? (wp.targetGenderCustom || 'Свой').slice(0, 12) : genderLabel)}</span>
            <span class="nmf-mini-tag">${esc(langTagLabel)}</span>
            ${wp.fandomOrWorld.trim() ? `<span class="nmf-mini-tag">${esc(wp.fandomOrWorld.trim().slice(0, 20))}</span>` : ''}
        </div>
        <button type="button" class="nmf-btn-secondary" style="height:26px;padding:0 8px;font-size:10.5px;flex-shrink:0" data-act="open-gacha-prefs">
            ${NMF_ICONS.sliders} Пожелания Гачи
        </button>
    </div>`;
}

function renderGachaPrefsSheetModal(sess) {
    if (!state.gachaPrefsOpen) return '';
    if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
    sess.gacha.wishPrefs = normalizeGachaWishPrefs(sess.gacha.wishPrefs);
    const wp = sess.gacha.wishPrefs;
    const ratingObj = RATING_OPTIONS.find((r) => r.id === wp.rating) || RATING_OPTIONS[1];

    return `
    <div class="nmf-sheet-backdrop" id="nmf-gacha-prefs-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent);display:flex;align-items:center;gap:6px">
                    ${NMF_ICONS.primogem} <span>${esc(tx('Анкета Призыва · Только для Гачи', 'Summon Questionnaire · Gacha Only'))}</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-gacha-prefs">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-panel">
                    <div class="nmf-warn-box" style="font-size:11.5px">
                        ${NMF_ICONS.primogem}
                        <span>${tx(
                            'Эта анкета работает <strong>строго только для Гачи</strong> и никогда не смешивается с Главной анкетой. <strong>Совет:</strong> вы можете оставить её пустой для максимальной рандомизации по вашим «+» тегам!',
                            'This sheet applies <strong>strictly to Gacha only</strong> and never mixes with your Main Questionnaire. <strong>Tip:</strong> leave fields blank for maximum randomization from your "+" tags!',
                        )}</span>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Кого призываем в Баннере?', 'Who are we summoning in the Banner?'))}</label>
                        <select class="nmf-select" data-gacha-pref="targetType" ${sess.frozen ? 'disabled' : ''}>
                            ${GACHA_TARGET_OPTIONS.map((opt) => `<option value="${esc(opt.id)}" ${wp.targetType === opt.id ? 'selected' : ''}>${esc(opt.label)}</option>`).join('')}
                        </select>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Вселенная / Сеттинг для Гачи (необязательно)', 'Universe / Setting for Gacha (Optional)'))}</label>
                        <input type="text" class="nmf-input" data-gacha-pref="fandomOrWorld" value="${esc(wp.fandomOrWorld || '')}" placeholder="${esc(tx('Пусто = любой мир чисто по вашим «+» тегам...', 'Blank = any setting purely from your "+" tags...'))}" ${sess.frozen ? 'disabled' : ''}/>
                    </div>

                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('Ваш пол (Игрок)', 'Your Gender (Player)'))}</label>
                            <select class="nmf-select" data-gacha-pref="userGender" ${sess.frozen ? 'disabled' : ''}>
                                ${USER_GENDER_OPTIONS.map((g) => `<option value="${g.id}" ${(wp.userGender || 'any') === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
                            </select>
                            ${wp.userGender === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-gacha-pref="userGenderCustom" value="${esc(wp.userGenderCustom || '')}" placeholder="${esc(tx('Свой вариант...', 'Type custom gender...'))}" ${sess.frozen ? 'disabled' : ''}/>` : ''}
                        </div>
                        <div class="nmf-field">
                            <label class="nmf-label">${esc(tx('Пол в Призыве', 'Summoned Gender'))}</label>
                            <select class="nmf-select" data-gacha-pref="targetGender" ${sess.frozen ? 'disabled' : ''}>
                                ${TARGET_GENDER_OPTIONS.map((g) => `<option value="${g.id}" ${(wp.targetGender || 'any') === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
                            </select>
                            ${wp.targetGender === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-gacha-pref="targetGenderCustom" value="${esc(wp.targetGenderCustom || '')}" placeholder="${esc(tx('Свой вариант...', 'Type custom gender...'))}" ${sess.frozen ? 'disabled' : ''}/>` : ''}
                        </div>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Рейтинг Гачи', 'Gacha Rating'))}</label>
                        <select class="nmf-select" data-gacha-pref="rating" ${sess.frozen ? 'disabled' : ''}>
                            ${RATING_OPTIONS.map((r) => `<option value="${r.id}" ${wp.rating === r.id ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}
                        </select>
                    </div>

                    ${ratingObj?.warn ? `
                    <div class="nmf-warn-box" style="font-size:11px">
                        ${NMF_ICONS.warn}
                        <span>${esc(ratingObj.warn)}</span>
                    </div>` : ''}

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Особые пожелания к призыву (необязательно)', 'Special Summon Wishes (Optional)'))}</label>
                        <textarea class="nmf-textarea" style="min-height:72px" data-gacha-pref="wishesNote" placeholder="${esc(tx('Оставьте пустым для большей рандомизации или укажите желаемый вайб...', 'Leave blank for higher randomization or add desired chemistry/vibe...'))}" ${sess.frozen ? 'disabled' : ''}>${esc(wp.wishesNote || '')}</textarea>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Запреты Баннера (чего точно НЕ должно выпасть)', 'Banner Hard Bans (strictly avoid)'))}</label>
                        <input type="text" class="nmf-input" data-gacha-pref="hardBans" value="${esc(wp.hardBans || '')}" placeholder="${esc(tx('Через запятую всё, что исключить в Гаче...', 'Comma-separated items to exclude in Gacha...'))}" ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                </div>
            </div>
            <div class="nmf-sheet-foot" style="justify-content:space-between;gap:8px">
                <button type="button" class="nmf-btn-secondary nmf-btn-danger" data-act="clear-gacha-prefs" ${sess.frozen ? 'disabled' : ''}>${esc(tx('Очистить (Макс. рандом)', 'Clear (Max Random)'))}</button>
                <button type="button" class="nmf-btn-primary" style="flex:1" data-act="close-gacha-prefs">${esc(tx('Сохранить', 'Save'))}</button>
            </div>
        </div>
    </div>`;
}



function resolveDisplayOrCoverSpec(entity, realDisplayUrl, isLoading, errText) {
    const cleanReal = safeImgSrc(realDisplayUrl);
    if (isLoading) {
        return { src: '', isReal: false, isCover: false, croppedCls: '', croppedStyle: '' };
    }
    if (cleanReal) {
        const ca = String(entity?.croppedAspect || '').trim();
        if (ca) {
            return {
                src: cleanReal,
                isReal: true,
                isCover: false,
                croppedCls: ' nmf-is-cropped',
                croppedStyle: `--cropped-ratio:${ca.replace(':', ' / ')};`,
            };
        }
        // Uncropped real art ALWAYS renders in its full natural frame (zero double-cropping!)
        return {
            src: cleanReal,
            isReal: true,
            isCover: false,
            croppedCls: ' nmf-natural-art',
            croppedStyle: '',
        };
    }
    const coverUrl = buildProceduralCoverDataUrl(entity, {
        accentHex: getThemeColor(),
        isError: Boolean(errText),
        errorText: errText || '',
    });
    return { src: coverUrl, isReal: false, isCover: true, croppedCls: '', croppedStyle: '' };
}

function renderCandidateDossierModal(sess) {
    const ref = state.viewingCandRef;
    if (!ref) return '';
    const cand = resolveEntityFromPoolRef(sess, ref.pool, ref.idx);
    if (!cand) {
        state.viewingCandRef = null;
        return '';
    }
    const cfg = getSettings();
    const canArt = detectImageExtensions().hasAny && cfg.imageSource !== 'off';
    const imgUrl = safeImgSrc(resolveEntityDisplayUrl(cand));
    const isLoading = state.loadingArtIds.has(cand.id);
    const artErrText = state.artErrors.get(cand.id) || '';
    const isGacha = ref.pool === 'gacha_collection';
    const isPassed = ref.pool === 'passed';
    const blitzRef = isGacha ? `gacha:${cand.id}` : `liked:${cand.id}`;

    return `
    <div class="nmf-sheet-backdrop" id="nmf-cand-dossier-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    Анкета персонажа · ${esc(cand.name)}
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-cand-dossier" title="Закрыть">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-swipe-card" style="border-color:var(--nmf-border-active)">
                    ${(() => {
                        const fSpec = resolveDisplayOrCoverSpec(cand, imgUrl, isLoading, artErrText);
                        const sealedArt = fSpec.isReal && isArtWaitingToOpen(cand.id);
                        return `
                    <div class="nmf-hero-visual ${fSpec.src ? 'nmf-has-photo' : 'nmf-rendering-stage'} ${(fSpec.isReal && !sealedArt) ? 'nmf-tappable-photo' : ''}${fSpec.croppedCls}" style="${fSpec.croppedStyle}${fSpec.src ? '' : 'min-height:210px'}" data-act="${(fSpec.isReal && !sealedArt) ? 'open-cand-lightbox' : ''}" data-pool="${esc(ref.pool)}" data-idx="${ref.idx}">
                        ${fSpec.src ? `<img class="nmf-hero-photo${fSpec.isReal ? consumeFreshArtClass(cand.id) : ''}" src="${esc(fSpec.src)}" alt="${esc(cand.name)}"/>` : `<div style="font-family:var(--nmf-font-mono);font-size:11px;color:var(--nmf-accent)">${esc(tx('РЕНДЕР АРТА...', 'RENDERING ART...'))}</div>`}
                        ${fSpec.isReal ? renderSealedArtVeilHtml(cand.id) : ''}
                        <div class="nmf-hero-topbadges">
                            ${isGacha
                                ? `<span class="nmf-star-pill">${renderStarsRowHtml(cand.stars)}</span>`
                                : `<span class="nmf-match-badge">${Number(cand.compatibility) || 92}% MATCH</span>`}
                            <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
                                <button type="button" class="nmf-art-chip-btn" data-act="trigger-cand-upload" data-pool="${esc(ref.pool)}" data-idx="${ref.idx}" title="Загрузить свой арт с устройства">${NMF_ICONS.upload} Своё фото</button>
                                ${fSpec.isReal ? `<button type="button" class="nmf-art-chip-btn" data-act="open-crop-cand" data-pool="${esc(ref.pool)}" data-idx="${ref.idx}" title="Кадрировать арт">${NMF_ICONS.crop} Кадрировать</button>` : ''}
                                ${canArt ? (isLoading
                                    ? `<button type="button" class="nmf-art-chip-btn" style="border-color:#ff6b86;color:#ff8fa0" data-act="stop-cand-art" data-id="${esc(cand.id)}">Стоп</button>`
                                    : `<button type="button" class="nmf-art-chip-btn" data-act="gen-dossier-art" data-pool="${esc(ref.pool)}" data-idx="${ref.idx}">${NMF_ICONS.image} ${fSpec.isReal ? 'Переснять' : 'Сделать арт'}</button>`) : ''}
                            </div>
                        </div>`;
                    })()}
                        <div class="nmf-hero-scrim">
                            ${cand.epithet ? `<div style="font-family:var(--nmf-font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:${cand.stars >= 5 ? '#f5c25b' : 'var(--nmf-accent-2)'}">${esc(cand.epithet)}</div>` : ''}
                            <div class="nmf-hero-name">${esc(cand.name)}</div>
                            <div class="nmf-hero-arch">${esc(cand.archetype)}</div>
                        </div>
                    </div>

                    <div class="nmf-profile-body">
                        ${(!isLoading && artErrText) ? `
                        <div class="nmf-warn-box" style="border-color:#ff5c77;font-size:11px">
                            ${NMF_ICONS.warn}
                            <span><strong>Сбой арта:</strong> ${esc(artErrText)}</span>
                        </div>` : ''}
                        ${cand.quote ? `<div class="nmf-profile-quote">«${esc(parseCleanQuote(cand.quote))}»</div>` : ''}
                        <div class="nmf-profile-bio" style="white-space:pre-line">${esc(cand.pitch || 'Описание пока не заполнено.')}</div>
                        ${cand.appearance ? `
                        <div class="nmf-panel-sub" style="display:flex;flex-direction:column;gap:4px">
                            <span class="nmf-label">Внешность и детали образа</span>
                            <div style="font-size:12.5px;line-height:1.48;color:var(--nmf-text-muted);white-space:pre-line">${esc(cand.appearance)}</div>
                        </div>` : ''}
                        <div class="nmf-chip-wrap">
                            ${(cand.tags || []).map((t) => `<span class="nmf-mini-tag">${esc(t)}</span>`).join('')}
                        </div>
                        ${canArt ? renderPromptRefineBox('dossier', state.busy || isLoading) : ''}
                    </div>
                </div>
            </div>
            <div class="nmf-sheet-foot" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
                <div class="nmf-btn-row">
                    <button type="button" class="nmf-btn-secondary" data-act="edit-cand" data-pool="${esc(ref.pool)}" data-idx="${ref.idx}">${NMF_ICONS.editSmall} Править</button>
                    ${(isGacha && cand.fusedFromNames?.length) ? `<button type="button" class="nmf-btn-secondary" data-act="regen-altar-char" data-id="${esc(cand.id)}" ${state.busy || sess.frozen ? 'disabled' : ''}>${NMF_ICONS.rework} ${esc(tx('Перегенерировать', 'Regenerate'))}</button>` : ''}
                    ${!isPassed ? `<button type="button" class="nmf-btn-secondary" data-act="send-cand-to-blitz" data-source="${isGacha ? 'gacha' : 'tinder'}" data-ref="${esc(blitzRef)}">${NMF_ICONS.blitz} В Блиц</button>` : ''}
                </div>
                <button type="button" class="nmf-btn-primary" style="flex:1;min-width:140px" data-act="expand-from-dossier" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    ${NMF_ICONS.spark} Собрать Карточку V2
                </button>
            </div>
        </div>
    </div>`;
}

async function openArtCropperForTarget(sess, targetKind, pool = '', idx = 0) {
    const cfg = getSettings();
    const entity = targetKind === 'editor' ? sess.card : resolveEntityFromPoolRef(sess, pool, idx);
    if (!entity) return;
    const masterUrl = resolveOriginalEntityMediaUrl(entity);
    if (!masterUrl) {
        notifyToast('У этой анкеты пока нет изображения для кадрирования.', true);
        return;
    }

    let imgW = 1024;
    let imgH = 1024;
    if (typeof Image !== 'undefined') {
        try {
            const dims = await new Promise((resolve) => {
                const im = new Image();
                im.onload = () => resolve({ w: im.naturalWidth || 1024, h: im.naturalHeight || 1024 });
                im.onerror = () => resolve({ w: 1024, h: 1024 });
                im.src = masterUrl;
            });
            imgW = dims.w;
            imgH = dims.h;
        } catch {}
    }

    const defaultRatio = (cfg.imageAspectRatio && cfg.imageAspectRatio !== 'native') ? cfg.imageAspectRatio : '1:1';
    state.cropModalInfo = {
        targetKind,
        pool,
        idx,
        name: entity.name || 'Персонаж',
        sourceDataUrl: masterUrl,
        displayUrl: safeImgSrc(masterUrl),
        imgW,
        imgH,
        aspectRatio: ['1:1', '3:4', '2:3', '4:3', '16:9'].includes(defaultRatio) ? defaultRatio : '1:1',
        zoom: 1,
        panX: 50,
        panY: cfg.imageCropFocus === 'center' ? 50 : 8,
        hasOriginalBackup: Boolean(entity.originalAvatarId),
    };
    renderWindow();
}

function syncLiveCropperDom() {
    if (typeof document === 'undefined' || !state.cropModalInfo) return;
    const ci = state.cropModalInfo;
    const geom = computeLosslessCropGeometry(ci.imgW, ci.imgH, ci);
    const vp = document.getElementById('nmf-crop-vp');
    const img = document.getElementById('nmf-crop-img');
    if (vp) vp.style.aspectRatio = ci.aspectRatio.replace(':', ' / ');
    if (img) {
        img.style.width = `${geom.cssWidthPct.toFixed(3)}%`;
        img.style.height = `${geom.cssHeightPct.toFixed(3)}%`;
        img.style.left = `${geom.cssLeftPct.toFixed(3)}%`;
        img.style.top = `${geom.cssTopPct.toFixed(3)}%`;
    }
    const zLbl = document.getElementById('nmf-crop-zoom-val');
    if (zLbl) zLbl.textContent = `${Math.round(ci.zoom * 100)}% (${geom.outW}×${geom.outH}px)`;
    const pxSlider = document.getElementById('nmf-crop-panx');
    if (pxSlider && Number(pxSlider.value) !== Math.round(ci.panX)) pxSlider.value = String(Math.round(ci.panX));
    const pySlider = document.getElementById('nmf-crop-pany');
    if (pySlider && Number(pySlider.value) !== Math.round(ci.panY)) pySlider.value = String(Math.round(ci.panY));
}

function attachCropperDragGestures(win) {
    const vp = win.querySelector('#nmf-crop-vp');
    if (!vp || !state.cropModalInfo) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    vp.addEventListener('pointerdown', (e) => {
        if (!state.cropModalInfo) return;
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        try { vp.setPointerCapture(e.pointerId); } catch {}
    });

    vp.addEventListener('pointermove', (e) => {
        if (!dragging || !state.cropModalInfo) return;
        const ci = state.cropModalInfo;
        const rect = vp.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const geom = computeLosslessCropGeometry(ci.imgW, ci.imgH, ci);
        if (geom.maxSX > 0.5) {
            const deltaPanX = -(dx / rect.width) * (geom.cropW / geom.maxSX) * 100;
            ci.panX = Math.max(0, Math.min(100, ci.panX + deltaPanX));
        }
        if (geom.maxSY > 0.5) {
            const deltaPanY = -(dy / rect.height) * (geom.cropH / geom.maxSY) * 100;
            ci.panY = Math.max(0, Math.min(100, ci.panY + deltaPanY));
        }
        syncLiveCropperDom();
    });

    const endDrag = () => { dragging = false; };
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);
}

function renderArtCropperModal() {
    const ci = state.cropModalInfo;
    if (!ci) return '';
    const geom = computeLosslessCropGeometry(ci.imgW, ci.imgH, ci);
    const ratios = ['1:1', '3:4', '2:3', '4:3', '16:9'];

    return `
    <div class="nmf-sheet-backdrop" id="nmf-cropper-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent);display:flex;align-items:center;gap:6px">
                    ${NMF_ICONS.crop} <span>Кадрирование арта · ${esc(ci.name)}</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-cropper">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-panel">
                    <div class="nmf-chip-wrap" style="justify-content:center">
                        ${ratios.map((r) => `
                            <button type="button" class="nmf-chip ${ci.aspectRatio === r ? 'nmf-on' : ''}" data-act="crop-set-ratio" data-ratio="${r}">${r}</button>
                        `).join('')}
                    </div>

                    <div class="nmf-crop-wrap">
                        <div class="nmf-crop-viewport" id="nmf-crop-vp" style="aspect-ratio:${ci.aspectRatio.replace(':', ' / ')}">
                            <img id="nmf-crop-img" src="${esc(ci.displayUrl)}" alt="Crop" style="width:${geom.cssWidthPct.toFixed(3)}%;height:${geom.cssHeightPct.toFixed(3)}%;left:${geom.cssLeftPct.toFixed(3)}%;top:${geom.cssTopPct.toFixed(3)}%"/>
                            <div class="nmf-crop-grid-overlay"></div>
                        </div>
                        <div style="font-size:11px;color:var(--nmf-text-muted);text-align:center">
                            Двигайте арт пальцем прямо внутри рамки или ползунками ниже (без потери качества!)
                        </div>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label"><span>Приближение (Zoom)</span><span id="nmf-crop-zoom-val">${Math.round(ci.zoom * 100)}% (${geom.outW}×${geom.outH}px)</span></label>
                        <input type="range" min="100" max="300" step="2" value="${Math.round(ci.zoom * 100)}" data-crop-range="zoom" style="width:100%;accent-color:var(--nmf-accent)"/>
                    </div>

                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field">
                            <label class="nmf-label">Верх / Низ</label>
                            <input type="range" id="nmf-crop-pany" min="0" max="100" step="1" value="${Math.round(ci.panY)}" data-crop-range="panY" style="width:100%;accent-color:var(--nmf-accent)"/>
                        </div>
                        <div class="nmf-field">
                            <label class="nmf-label">Лево / Право</label>
                            <input type="range" id="nmf-crop-panx" min="0" max="100" step="1" value="${Math.round(ci.panX)}" data-crop-range="panX" style="width:100%;accent-color:var(--nmf-accent)"/>
                        </div>
                    </div>

                    <div class="nmf-btn-row" style="justify-content:center">
                        <button type="button" class="nmf-chip" data-act="crop-preset-face">Фокус на лицо</button>
                        <button type="button" class="nmf-chip" data-act="crop-preset-center">По центру</button>
                        ${ci.hasOriginalBackup ? `<button type="button" class="nmf-chip" style="border-color:var(--nmf-accent);color:var(--nmf-accent)" data-act="restore-uncropped-art">Вернуть полный оригинал</button>` : ''}
                    </div>
                </div>
            </div>
            <div class="nmf-sheet-foot" style="justify-content:space-between;gap:8px">
                <button type="button" class="nmf-btn-secondary" data-act="close-cropper" ${state.cropSaving ? 'disabled' : ''}>Отмена</button>
                <button type="button" class="nmf-btn-primary" id="nmf-apply-crop-btn" style="flex:1" data-act="apply-art-crop" ${state.cropSaving ? 'disabled' : ''}>
                    ${NMF_ICONS.crop} ${state.cropSaving ? 'Сохраняем кадр без потери качества, подождите...' : 'Применить кадрирование'}
                </button>
            </div>
        </div>
    </div>`;
}

function renderSacrificeConfirmModal() {
    const pending = state.pendingSacrifice;
    if (!pending) return '';
    const cfg = getSettings();
    const lore = getThemedSacrificeWarning(cfg.theme, pending.name, pending.wishGain);

    return `
    <div class="nmf-sheet-backdrop" id="nmf-sacrifice-ritual-backdrop" style="align-items:center;justify-content:center;padding:16px">
        <div class="nmf-modal-card-panel" style="width:min(100%,410px);border:1.5px solid #e63950;border-top:3px solid #e63950;border-radius:var(--nmf-radius);box-shadow:0 22px 60px rgba(0,0,0,0.9);display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--nmf-border);padding-bottom:8px">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:#ff6b86;display:flex;align-items:center;gap:7px">
                    ${NMF_ICONS.sacrifice} <span>${esc(lore.title)}</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:26px;width:26px" data-act="cancel-sacrifice-ritual">${NMF_ICONS.close}</button>
            </div>

            <div style="font-size:13px;line-height:1.52;color:var(--nmf-text);font-style:italic;padding:8px 10px;background:rgba(230,57,80,0.08);border-left:3px solid #e63950;border-radius:4px">
                ${esc(lore.body)}
            </div>

            <div class="nmf-warn-box" style="border-color:#e63950;font-size:11.5px">
                ${NMF_ICONS.warn}
                <span>${tx(
                    `<strong>Необратимый ритуал (показывается только в первый раз):</strong> жертва навсегда удаляется из Таверны и Коллекции без архива «Мимо» и без возможности восстановления.${cfg.gachaSacrificeFailEnabled ? ` <strong>Внимание: включён риск провала Жертвы (${cfg.gachaSacrificeFailChance}%) — Алтарь может поглотить карту и дать 0 Молитв!</strong>` : ` Вы получите <strong>+${lore.wishGain} Молитв</strong> (${pending.stars} зв.).`}`,
                    `<strong>Irreversible ritual (shown only once):</strong> this card is permanently erased from Collection and Tavern with no archive or recovery.${cfg.gachaSacrificeFailEnabled ? ` <strong>Warning: Sacrifice Failure Risk (${cfg.gachaSacrificeFailChance}%) is active — the Altar may devour the card for 0 Prayers!</strong>` : ` You will receive <strong>+${lore.wishGain} Prayers</strong> (${pending.stars} stars).`}`,
                )}</span>
            </div>

            <div class="nmf-btn-row" style="justify-content:space-between;margin-top:2px">
                <button type="button" class="nmf-btn-secondary" data-act="cancel-sacrifice-ritual">${esc(tx('Пощадить', 'Spare'))}</button>
                <button type="button" class="nmf-btn-primary" style="flex:1;background:#e63950;color:#fff" data-act="confirm-sacrifice-ritual">
                    ${NMF_ICONS.sacrifice} ${esc(tx(`Принести жертву (+${lore.wishGain} Молитв)`, `Sacrifice (+${lore.wishGain} Prayers)`))}
                </button>
            </div>
        </div>
    </div>`;
}

const HELP_TOPICS = {
    languages: {
        title: 'Разделение языков и перевод',
        body: 'Поле 1 задаёт язык для ВАС: на нём пишутся превью карточек в Свайпах и Гаче, вопросы Блица/AU и заметки автора (Creator Notes).\n\nПоле 2 задаёт язык самой КАРТОЧКИ для ИИ (Description, Personality, Scenario, Первое сообщение). Например, можно ставить Поле 1 = Русский, а Поле 2 = English для экономии токенов, а затем в Профиле нажать «Перевод ИИ» и в любой момент прочитать или сохранить русскую версию!',
    },
    gacha_timer: {
        title: 'Честная Гача, Таймер, Молитвы и Жертвы',
        body: 'В Гаче действует честный рандомайзер от 1 до 5 звёзд (1 зв. — 38%, 2 зв. — 30%, 3 зв. — 20%, 4 зв. — 9.5%, 5 зв. — 2.5%, плюс гарант 4 зв.+ на 10-й крутке без редких дропов).\n\nНа цикл даётся 10 бесплатных Молитв. Когда они исчерпаны, включается глобальный 2-часовой таймер восстановления по реальному времени (не сбрасывается и не замирает при выходе из Таверны или смене сессии!).\n\nХотите крутить дальше прямо сейчас? Принесите ненужного героя в жертву: 1 зв. даёт +1 Молитву, 2 зв. — +2 Молитвы ... 5 зв. — +5 Молитв! Но помните: жертва стирается навсегда без возможности восстановления. Также у Гачи своя отдельная «Анкета Призыва (Пожелания Гачи)», чтобы теги не смешивались с Тиндером!',
    },
    isolation: {
        title: 'Изоляция режимов, Анкета Гачи и Пресет',
        body: '• У Тиндера — своя «Анкета предпочтений», а у Гачи — своя отдельная «Пожелания Гачи» (по умолчанию призывает новых OC строго по «+» тегам и блокирует повтор уже выпавших героев).\n• В «Блице» вы выбираете конкретного героя из Тиндера или Гачи (либо создаёте с нуля) без подмеса анти-тегов.\n• Вкладка «Создать» (Генератор и AU) на 100% изолирована от Тиндера и Гачи.\n• При отправке через ваш пресет расширение автоматически вырезает макросы открытого чата ({{description}}, {{personality}}, {{scenario}}, World Info).',
    },
    art_mechanism: {
        title: 'Гибкий Арт-Механизм, Стиль и Негативы',
        body: 'ИИ строит промпт аватарки по режиссёрской схеме SCENE -> CHARACTERS -> FIGURE / INTERACTION / OBJECT без привязки к стилю рисования (поддерживаются 1 герой, 2–3 героя в кадре, пустой Мир/пейзаж или Предмет/артефакт).\n\nВаш выбранный Стиль из SillyImages и Негативный промпт подключаются отдельно в окне Настроек, поэтому рисовка получается такой же чистой и точной, как в чате.',
    },
    vault_slots: {
        title: 'Слоты сессии и Хранилище',
        body: 'Внутри одной сессии 5 независимых слотов черновика (Свайпы, Гача, Блиц, Генератор, Ручной) — сборка карточки в Гаче не затрёт ваш черновик из Свайпов или Генератора.\n\nА кнопка «В Хранилище» сохраняет готовый текст карточки вместе с её артом в общую копилку между всеми сессиями!',
    },
};

function helpBtn(key) {
    return `<button type="button" class="nmf-help-q" data-act="open-help" data-help="${esc(key)}" title="Подробная подсказка">?</button>`;
}

function resolveLangPresetUiValue(rawVal) {
    const clean = stripAccidentalLanguageBraces(rawVal || '{{language}}') || '{{language}}';
    const match = LANGUAGE_PRESET_OPTIONS.find((o) => o.id !== '__custom__' && o.id.toLowerCase() === clean.toLowerCase());
    return match ? match.id : '__custom__';
}

function renderIntakeSheetModal(sess) {
    if (!state.intakeSheetOpen) return '';
    const it = sess.intake;
    const worldMode = isWorldOrRpgMode(it) || it.originType === 'artifact_object';
    const ratingObj = RATING_OPTIONS.find((r) => r.id === it.rating) || RATING_OPTIONS[0];
    const personaName = getTavernContext()?.name1 || '';
    const needsFandom = ['canon', 'fandom_au', 'fandom_oc'].includes(it.originType);
    const userLangPreset = resolveLangPresetUiValue(it.userLanguage);
    const cardLangPreset = resolveLangPresetUiValue(it.cardLanguage);

    let stepBody = '';
    if (state.intakeStep === 'who') {
        stepBody = `
            <div class="nmf-panel">
                <div class="nmf-field">
                    <label class="nmf-label"><span>Кого или что создаём?</span>${helpBtn('art_mechanism')}</label>
                    <select class="nmf-select" data-intake="originType" ${sess.frozen ? 'disabled' : ''}>
                        <option value="oc" ${it.originType === 'oc' ? 'selected' : ''}>Персонаж — Оригинальный герой (OC)</option>
                        <option value="canon" ${it.originType === 'canon' ? 'selected' : ''}>Персонаж — Канонный герой из фандома</option>
                        <option value="fandom_au" ${it.originType === 'fandom_au' ? 'selected' : ''}>Персонаж — Фандом в другой вселенной (AU)</option>
                        <option value="fandom_oc" ${it.originType === 'fandom_oc' ? 'selected' : ''}>Персонаж — Новый герой внутри фандома</option>
                        <option value="duo_group" ${it.originType === 'duo_group' ? 'selected' : ''}>Дуэт / Группа (2–3 персонажа в кадре и карточке)</option>
                        <option value="artifact_object" ${it.originType === 'artifact_object' ? 'selected' : ''}>Особый Предмет / Артефакт (РП вокруг объекта)</option>
                        <option value="world_sandbox" ${it.originType === 'world_sandbox' ? 'selected' : ''}>Мир / Сеттинг-песочница (без привязки к 1 лицу)</option>
                        <option value="rpg_gm" ${it.originType === 'rpg_gm' ? 'selected' : ''}>РПГ-Мастер / Система (Character Card V2)</option>
                    </select>
                </div>

                ${(needsFandom || worldMode) ? `
                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Вселенная-основа (или оставьте пустым для авторского мира)' : 'Название фандома'}</label>
                    <input type="text" class="nmf-input" data-intake="fandomName" value="${esc(it.fandomName)}" placeholder="Например: Cyberpunk 2077, Ведьмак, Jujutsu Kaisen..." ${sess.frozen ? 'disabled' : ''}/>
                </div>` : ''}

                <div class="nmf-grid-2-compact">
                    <div class="nmf-field">
                        <label class="nmf-label">Ваш пол (Игрок)</label>
                        <select class="nmf-select" data-intake="userGender" ${sess.frozen ? 'disabled' : ''}>
                            ${USER_GENDER_OPTIONS.map((g) => `<option value="${g.id}" ${(it.userGender || 'any') === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
                        </select>
                        ${it.userGender === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="userGenderCustom" value="${esc(it.userGenderCustom || '')}" placeholder="Свой вариант..." ${sess.frozen ? 'disabled' : ''}/>` : ''}
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">${worldMode ? 'Фокус НПС' : 'Пол персонажа'}</label>
                        <select class="nmf-select" data-intake="targetGender" ${sess.frozen ? 'disabled' : ''}>
                            ${TARGET_GENDER_OPTIONS.map((g) => `<option value="${g.id}" ${(it.targetGender || 'any') === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
                        </select>
                        ${it.targetGender === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="targetGenderCustom" value="${esc(it.targetGenderCustom || '')}" placeholder="Свой вариант..." ${sess.frozen ? 'disabled' : ''}/>` : ''}
                    </div>
                </div>

                <div class="nmf-grid-2-compact">
                    <div class="nmf-field">
                        <label class="nmf-label">Сеттинг / Эпоха</label>
                        <input type="text" class="nmf-input" data-intake="settingEra" value="${esc(it.settingEra)}" placeholder="Мегаполис / Нуар / Фэнтези..." ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Рейтинг</label>
                        <select class="nmf-select" data-intake="rating" ${sess.frozen ? 'disabled' : ''}>
                            ${RATING_OPTIONS.map((r) => `<option value="${r.id}" ${it.rating === r.id ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}
                        </select>
                    </div>
                </div>

                ${ratingObj.warn ? `
                <div class="nmf-warn-box">
                    ${NMF_ICONS.warn}
                    <span>${esc(ratingObj.warn)}</span>
                </div>` : ''}

                <details class="nmf-spoiler" ${(it.genres || []).length > 0 ? 'open' : ''}>
                    <summary><span>Жанры и направления (${(it.genres || []).length})</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body">
                        <div class="nmf-chip-wrap">
                            ${GENRE_PRESETS.map((g) => `
                                <button type="button" class="nmf-chip ${(it.genres || []).includes(g) ? 'nmf-on' : ''}" data-act="toggle-genre" data-genre="${esc(g)}">${esc(g)}</button>
                            `).join('')}
                        </div>
                        <input type="text" class="nmf-input" data-intake="customGenres" value="${esc(it.customGenres)}" placeholder="Свои жанры через запятую..." ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                </details>
            </div>
        `;
    } else if (state.intakeStep === 'vibe') {
        stepBody = `
            <div class="nmf-panel">
                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Ориентиры атмосферы (произведения / игры)' : 'Любимый типаж из фандомов (ориентир вайба)'}</label>
                    <input type="text" class="nmf-input" data-intake="favFandomHero" value="${esc(it.favFandomHero)}" placeholder="${worldMode ? 'Disco Elysium, Baldur\x27s Gate 3, Made in Abyss...' : 'Астарион, Годжо, Леон Кеннеди...'}" ${sess.frozen ? 'disabled' : ''}/>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Кем стартует игрок и какое приключение вы хотите?' : 'Какую историю и отношение к себе вы ищете?'}</label>
                    <textarea class="nmf-textarea" style="min-height:80px" data-intake="userRoleAndDesire" placeholder="${worldMode ? 'Роль игрока, опасность мира, свобода действий...' : 'Кем выступаете вы и какая химия должна быть между вами...'}" ${sess.frozen ? 'disabled' : ''}>${esc(it.userRoleAndDesire)}</textarea>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Желаемые механики, фракции или детали' : 'Гринфлаги / Любимые тропы'}</label>
                    <input type="text" class="nmf-input" data-intake="tropesWanted" value="${esc(it.tropesWanted)}" placeholder="${worldMode ? 'Гильдии, артефакты, интриги домов...' : 'Забота, телохранитель, сухая ирония, разница в статусе...'}" ${sess.frozen ? 'disabled' : ''}/>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">Общий стоп-лист сессии (чего точно НЕ делать)</label>
                    <input type="text" class="nmf-input" data-intake="hardBans" value="${esc(it.hardBans)}" placeholder="Через запятую всё, что сразу исключить..." ${sess.frozen ? 'disabled' : ''}/>
                </div>
            </div>
        `;
    } else {
        stepBody = `
            <div class="nmf-panel">
                <div class="nmf-field">
                    <label class="nmf-label"><span>Языки: для Вас и для Карточки</span>${helpBtn('languages')}</label>
                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field">
                            <span style="font-size:10.5px;color:var(--nmf-text-muted)">1. Превью, вопросы и заметки</span>
                            <select class="nmf-select" data-lang-preset="userLanguage" ${sess.frozen ? 'disabled' : ''}>
                                ${LANGUAGE_PRESET_OPTIONS.map((o) => `<option value="${esc(o.id)}" ${userLangPreset === o.id ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
                            </select>
                            ${userLangPreset === '__custom__' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="userLanguage" value="${esc(stripAccidentalLanguageBraces(it.userLanguage))}" placeholder="Например: Русский, 中文..."/>` : ''}
                        </div>
                        <div class="nmf-field">
                            <span style="font-size:10.5px;color:var(--nmf-text-muted)">2. Поля карточки и сцены ИИ</span>
                            <select class="nmf-select" data-lang-preset="cardLanguage" ${sess.frozen ? 'disabled' : ''}>
                                ${LANGUAGE_PRESET_OPTIONS.map((o) => `<option value="${esc(o.id)}" ${cardLangPreset === o.id ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
                            </select>
                            ${cardLangPreset === '__custom__' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="cardLanguage" value="${esc(stripAccidentalLanguageBraces(it.cardLanguage))}" placeholder="Например: English, Русский..."/>` : ''}
                        </div>
                    </div>
                </div>

                <div class="nmf-warn-box" style="font-size:11px">
                    ${NMF_ICONS.gear}
                    <span>Выбор <strong>Шаблона структуры карточки</strong>, объёма слов и режима отправки (Пресет / JSON) находится на <strong>Домашнем экране</strong> (иконка домика в шапке).</span>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">Стиль Первого сообщения</label>
                    <select class="nmf-select" data-intake="greetingStyle" ${sess.frozen ? 'disabled' : ''}>
                        ${GREETING_STYLES.map((s) => `<option value="${s.id}" ${(it.greetingStyle || 'fanfic') === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
                    </select>
                </div>

                <div class="nmf-grid-2-compact">
                    <div class="nmf-field">
                        <label class="nmf-label">Лицо (POV)</label>
                        <select class="nmf-select" data-intake="greetingPov" ${sess.frozen ? 'disabled' : ''}>
                            ${GREETING_POVS.map((p) => `<option value="${p.id}" ${(it.greetingPov || 'third') === p.id ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Имя игрока</label>
                        <select class="nmf-select" data-intake="playerNameMode" ${sess.frozen ? 'disabled' : ''}>
                            <option value="macro" ${(it.playerNameMode || 'macro') === 'macro' ? 'selected' : ''}>Макрос {{user}}</option>
                            <option value="persona" ${it.playerNameMode === 'persona' ? 'selected' : ''}>Персона${personaName ? ` (${esc(personaName)})` : ''}</option>
                        </select>
                    </div>
                </div>



                <details class="nmf-spoiler" ${it.greetingCustomRules ? 'open' : ''}>
                    <summary><span>Особые пожелания к разметке слога (опционально)</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body">
                        <textarea class="nmf-textarea" style="min-height:60px" data-intake="greetingCustomRules" placeholder="Например: прямая речь через тире, мысли курсивом..." ${sess.frozen ? 'disabled' : ''}>${esc(it.greetingCustomRules)}</textarea>
                    </div>
                </details>
            </div>
        `;
    }

    return `
    <div class="nmf-sheet-backdrop" id="nmf-intake-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent)">
                    Анкета предпочтений · ${esc(sess.title)}
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-intake-sheet">${NMF_ICONS.close}</button>
            </div>
            <div style="padding:8px 12px 0;background:var(--nmf-bg)">
                <div class="nmf-seg-bar nmf-seg-3">
                    <button type="button" class="nmf-seg-btn ${state.intakeStep === 'who' ? 'nmf-active' : ''}" data-act="intake-step" data-step="who">1. Мир и Герой</button>
                    <button type="button" class="nmf-seg-btn ${state.intakeStep === 'vibe' ? 'nmf-active' : ''}" data-act="intake-step" data-step="vibe">2. Вайб и Стоп</button>
                    <button type="button" class="nmf-seg-btn ${state.intakeStep === 'style' ? 'nmf-active' : ''}" data-act="intake-step" data-step="style">3. Языки и Слог</button>
                </div>
            </div>
            <div class="nmf-sheet-body">${stepBody}</div>
            <div class="nmf-sheet-foot" style="justify-content:space-between;gap:8px">
                <button type="button" class="nmf-btn-secondary nmf-btn-danger" data-act="clear-session-intake" ${sess.frozen ? 'disabled' : ''}>
                    Очистить анкету
                </button>
                <button type="button" class="nmf-btn-primary" style="flex:1" data-act="close-intake-sheet">
                    Готово
                </button>
            </div>
        </div>
    </div>`;
}

function renderSettingsSheetModal(sess) {
    if (!state.settingsModalOpen) return '';
    const cfg = getSettings();
    return `
    <div class="nmf-sheet-backdrop" id="nmf-settings-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent);display:flex;align-items:center;gap:6px">
                    ${NMF_ICONS.gear} <span>Дополнительные настройки</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-settings-modal">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-warn-box" style="font-size:11.5px">
                    ${NMF_ICONS.home}
                    <span>Шаблон Анкеты/Карточки, количество слов и выбор режима ИИ (Пресет или JSON) вынесены прямо на <strong>Домашний экран</strong> для быстрого доступа!</span>
                </div>

                <details class="nmf-spoiler">
                    <summary><span>1. Генератор Артов и Обложки (дубль со старта)</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body">
                        ${renderOptionalArtSettingsBody(sess, cfg)}
                    </div>
                </details>

                <details class="nmf-spoiler">
                    <summary><span>2. Правила Таймера Баннера Гачи</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body">
                        <div class="nmf-toggle-line" data-act="toggle-gacha-timer-cfg">
                            <span style="font-size:11.5px;font-weight:600">Включить глобальный таймер цикла Гачи (жертвы дают +Молитвы)</span>
                            <div class="nmf-switch ${cfg.gachaTimerEnabled !== false ? 'nmf-on' : ''}"></div>
                        </div>
                        <div class="nmf-grid-2-compact">
                            <div class="nmf-field">
                                <label class="nmf-label">Базовых молитв на цикл</label>
                                <input type="number" min="3" max="50" class="nmf-input" data-cfg-num="gachaMaxPullsPerCycle" value="${Number(cfg.gachaMaxPullsPerCycle) || 10}"/>
                            </div>
                            <div class="nmf-field">
                                <label class="nmf-label">Перезарядка (минут)</label>
                                <input type="number" min="5" max="1440" class="nmf-input" data-cfg-num="gachaCooldownMinutes" value="${Number(cfg.gachaCooldownMinutes) || 120}"/>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
            <div class="nmf-sheet-foot">
                <button type="button" class="nmf-btn-primary" style="width:100%" data-act="close-settings-modal">Готово</button>
            </div>
        </div>
    </div>`;
}

function renderGuideSheetModal() {
    if (!state.guideModalOpen) return '';
    const dict = isEn() ? HELP_TOPICS_EN : HELP_TOPICS;
    return `
    <div class="nmf-sheet-backdrop" id="nmf-guide-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent);display:flex;align-items:center;gap:6px">
                    ${NMF_ICONS.help} <span>${esc(tx('Гид по NexusMatch Forge', 'NexusMatch Forge Guide'))}</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-guide-modal">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                ${Object.values(dict).map((item, idx) => `
                <details class="nmf-spoiler" ${idx === 0 ? 'open' : ''}>
                    <summary><span>${idx + 1}. ${esc(item.title)}</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body" style="font-size:12.5px;line-height:1.5;color:var(--nmf-text-muted);white-space:pre-line">${esc(item.body)}</div>
                </details>`).join('')}
            </div>
            <div class="nmf-sheet-foot">
                <button type="button" class="nmf-btn-primary" style="width:100%" data-act="close-guide-modal">${esc(tx('Понятно', 'Got it'))}</button>
            </div>
        </div>
    </div>`;
}

function renderHelpPopoverModal() {
    const dict = isEn() ? HELP_TOPICS_EN : HELP_TOPICS;
    const topic = state.helpPopoverKey ? dict[state.helpPopoverKey] : null;
    if (!topic) return '';
    return `
    <div class="nmf-sheet-backdrop" id="nmf-help-pop-backdrop" style="align-items:center;padding:16px">
        <div class="nmf-modal-card-panel" style="width:min(100%,380px);border-radius:var(--nmf-radius);box-shadow:0 20px 50px rgba(0,0,0,0.8)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--nmf-border);padding-bottom:8px">
                <div style="font-family:var(--nmf-font-title);font-size:14.5px;font-weight:700;color:var(--nmf-accent)">${esc(topic.title)}</div>
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:26px;width:26px" data-act="close-help-pop">${NMF_ICONS.close}</button>
            </div>
            <div style="font-size:12.5px;line-height:1.52;color:var(--nmf-text);white-space:pre-line">${esc(topic.body)}</div>
            <button type="button" class="nmf-btn-secondary" style="width:100%;margin-top:4px" data-act="open-full-guide-from-help">${esc(tx('Открыть полный Гид', 'Open Full Guide'))}</button>
        </div>
    </div>`;
}

function renderTranslateModal(sess) {
    if (!state.translateModalOpen) return '';
    const c = sess.card;
    const tr = c.savedTranslation;
    const defaultTarget = stripAccidentalLanguageBraces(sess.intake?.userLanguage) === '{{language}}'
        ? detectUserLocaleLanguage()
        : (stripAccidentalLanguageBraces(sess.intake?.userLanguage) || 'Русский');
    const curTarget = state.translateTargetLang || tr?.lang || defaultTarget;
    const presetVal = resolveLangPresetUiValue(curTarget);

    return `
    <div class="nmf-sheet-backdrop" id="nmf-translate-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent);display:flex;align-items:center;gap:6px">
                    ${NMF_ICONS.translate} <span>ИИ-Перевод карточки · ${esc(c.name || 'Черновик')}</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-translate-modal">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-panel">
                    <div class="nmf-field">
                        <label class="nmf-label">На какой язык перевести карточку?</label>
                        <div class="nmf-grid-2-compact">
                            <select class="nmf-select" data-tr-preset="1">
                                ${LANGUAGE_PRESET_OPTIONS.filter((o) => !o.id.includes('Описание EN')).map((o) => `<option value="${esc(o.id)}" ${presetVal === o.id ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
                            </select>
                            <button type="button" class="nmf-btn-primary" style="height:36px" data-act="run-card-translation" ${state.busy ? 'disabled' : ''}>
                                ${NMF_ICONS.translate} Перевести
                            </button>
                        </div>
                        ${presetVal === '__custom__' ? `<input type="text" class="nmf-input" style="margin-top:5px!important" data-tr-custom="1" value="${esc(curTarget)}" placeholder="Впишите язык перевода..."/>` : ''}
                    </div>

                    ${tr ? `
                    <div class="nmf-warn-box" style="border-color:var(--nmf-accent);background:rgba(128,128,128,0.08)">
                        <span>Готов сохранённый перевод (<strong>${esc(tr.lang)}</strong>)! Сейчас он хранится отдельно и <strong>не затронул</strong> оригинал вашей карточки — выберите ниже: просто читать его здесь, заменить им карточку или сохранить переведённую копию в Хранилище.</span>
                    </div>

                    <div class="nmf-field">
                        <label class="nmf-label">Имя (${esc(tr.lang)})</label>
                        <input type="text" class="nmf-input" value="${esc(tr.name)}" readonly/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Описание (Description)</label>
                        <textarea class="nmf-textarea" style="min-height:130px" readonly>${esc(tr.description)}</textarea>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Первое сообщение (First Message)</label>
                        <textarea class="nmf-textarea" style="min-height:130px" readonly>${esc(tr.first_mes)}</textarea>
                    </div>
                    ${(tr.personality || tr.scenario || tr.mes_example || tr.creator_notes) ? `
                    <details class="nmf-spoiler">
                        <summary><span>Остальные переведённые поля (Характер, Сценарий, Заметки)</span>${NMF_ICONS.chevronDown}</summary>
                        <div class="nmf-spoiler-body">
                            ${tr.personality ? `<div class="nmf-field"><label class="nmf-label">Характер</label><textarea class="nmf-textarea" style="min-height:60px" readonly>${esc(tr.personality)}</textarea></div>` : ''}
                            ${tr.scenario ? `<div class="nmf-field"><label class="nmf-label">Сценарий</label><textarea class="nmf-textarea" style="min-height:60px" readonly>${esc(tr.scenario)}</textarea></div>` : ''}
                            ${tr.creator_notes ? `<div class="nmf-field"><label class="nmf-label">Заметки автора</label><textarea class="nmf-textarea" style="min-height:54px" readonly>${esc(tr.creator_notes)}</textarea></div>` : ''}
                        </div>
                    </details>` : ''}
                    ` : `
                    <div class="nmf-empty-deck" style="padding:20px">
                        ${NMF_ICONS.translate}
                        <div style="font-size:12.5px;color:var(--nmf-text-muted)">Нажмите «Перевести» выше — ИИ бережно переведёт всю карточку и сохранит перевод здесь для просмотра, не трогая английский оригинал без вашего решения.</div>
                    </div>`}
                </div>
            </div>
            ${tr ? `
            <div class="nmf-sheet-foot" style="flex-wrap:wrap;justify-content:space-between">
                <button type="button" class="nmf-btn-secondary" data-act="close-translate-modal">Оставить только для чтения</button>
                <div class="nmf-btn-row">
                    <button type="button" class="nmf-btn-secondary" data-act="save-translation-to-vault">${NMF_ICONS.vault} Копию в Хранилище</button>
                    <button type="button" class="nmf-btn-primary" data-act="apply-translation-to-card">Сделать карточкой (${esc(tr.lang)})</button>
                </div>
            </div>` : ''}
        </div>
    </div>`;
}

function resolveEntityFromPoolRef(sess, pool, idx) {
    if (!sess) return null;
    if (pool === 'gacha_collection') return sess.gacha?.collection?.[idx] || null;
    if (pool === 'gacha_reveal') return sess.gacha?.lastRevealBatch?.[idx] || null;
    return sess.tinder?.[pool]?.[idx] || null;
}

function renderCandidateEditModal(sess) {
    const ref = state.editingCandRef;
    if (!ref) return '';
    const cand = resolveEntityFromPoolRef(sess, ref.pool, ref.idx);
    if (!cand) {
        state.editingCandRef = null;
        return '';
    }

    return `
    <div class="nmf-sheet-backdrop" id="nmf-cand-edit-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:var(--nmf-accent)">
                    Редактирование превью · ${esc(cand.name)}
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-cand-edit">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-panel">
                    <div class="nmf-field">
                        <label class="nmf-label">Имя и возраст / Название мира</label>
                        <input type="text" class="nmf-input" id="nmf-ce-name" value="${esc(cand.name)}"/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Архетип / Подзаголовок</label>
                        <input type="text" class="nmf-input" id="nmf-ce-arch" value="${esc(cand.archetype || '')}"/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Описание / Завязка (можно переписать под себя)</label>
                        <textarea class="nmf-textarea" style="min-height:100px" id="nmf-ce-pitch">${esc(cand.pitch || '')}</textarea>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Внешность / Атмосфера</label>
                        <textarea class="nmf-textarea" style="min-height:72px" id="nmf-ce-looks">${esc(cand.appearance || '')}</textarea>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Цитата / Эпиграф</label>
                        <input type="text" class="nmf-input" id="nmf-ce-quote" value="${esc(cand.quote || '')}"/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Теги (через запятую)</label>
                        <input type="text" class="nmf-input" id="nmf-ce-tags" value="${esc((cand.tags || []).join(', '))}"/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Промпт для генерации арта (EN)</label>
                        <textarea class="nmf-textarea" style="min-height:66px" id="nmf-ce-img">${esc(cand.imagePrompt || '')}</textarea>
                    </div>
                </div>
            </div>
            <div class="nmf-sheet-foot" style="justify-content:space-between;flex-wrap:wrap">
                ${ref.pool === 'passed' ? `
                <button type="button" class="nmf-btn-secondary" data-act="save-cand-and-restore">
                    ${NMF_ICONS.undo} Сохранить и вернуть в Свайпы
                </button>` : '<span></span>'}
                <div class="nmf-btn-row">
                    <button type="button" class="nmf-btn-secondary" data-act="save-cand-edit">Сохранить</button>
                    <button type="button" class="nmf-btn-primary" data-act="save-cand-and-build">${NMF_ICONS.spark} Сразу собрать Чара</button>
                </div>
            </div>
        </div>
    </div>`;
}

// Pre-overwrite diff & backup confirmation sheet (fixes NMF-001 & Phase A diff requirement)
function renderOverwriteConfirmModal() {
    const info = state.overwriteConfirmInfo;
    if (!info) return '';
    const { targetAvatar, diff, externalWarning } = info;

    return `
    <div class="nmf-sheet-backdrop" id="nmf-overwrite-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:14.5px;font-weight:700;color:var(--nmf-accent)">
                    Безопасное обновление оригинала · ${esc(targetAvatar)}
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="cancel-overwrite-confirm">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                <div class="nmf-panel">
                    ${externalWarning ? `
                    <div class="nmf-warn-box" style="border-color:#ff5c77;margin-bottom:8px">
                        ${NMF_ICONS.warn}
                        <span><strong>Внимание:</strong> файл «${esc(targetAvatar)}» был изменён в SillyTavern после его открытия в редакторе. Подтвердите запись только если вы уверены.</span>
                    </div>` : ''}

                    <div class="nmf-field">
                        <label class="nmf-label" style="color:var(--nmf-accent)">Будут обновлены только выбранные поля (${diff.changedFields.length}):</label>
                        <div class="nmf-chip-wrap" style="margin-top:4px">
                            ${diff.changedFields.map((f) => `<span class="nmf-chip nmf-on">${esc(f)}</span>`).join('')}
                        </div>
                    </div>

                    <div class="nmf-field" style="margin-top:8px">
                        <label class="nmf-label">Останутся строго без изменений:</label>
                        <div class="nmf-chip-wrap" style="margin-top:4px">
                            ${diff.preservedProtected.map((p) => `<span class="nmf-chip">${esc(p)}</span>`).join('')}
                        </div>
                    </div>

                    <div class="nmf-warn-box" style="margin-top:8px;font-size:11px">
                        ${NMF_ICONS.save}
                        <span>Перед записью исходный PNG и полный V2 JSON автоматически сохраняются в локальный сейф резервных копий NexusMatch Forge.</span>
                    </div>
                </div>
            </div>
            <div class="nmf-sheet-foot" style="justify-content:flex-end">
                <div class="nmf-btn-row">
                    <button type="button" class="nmf-btn-secondary" data-act="cancel-overwrite-confirm">Отмена</button>
                    <button type="button" class="nmf-btn-primary" data-act="confirm-overwrite-execute" ${state.busy ? 'disabled' : ''}>
                        ${NMF_ICONS.save} Создать бэкап и обновить
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function renderPortraitLightboxModal() {
    const info = state.lightboxInfo;
    if (!info) return '';
    const safeSrc = safeImgSrc(info.displayUrl || info.imageUrl);
    const hasAppearance = Boolean(String(info.appearance || '').trim());
    const hasPrompt = Boolean(String(info.imagePrompt || '').trim());

    return `
    <div class="nmf-sheet-backdrop" id="nmf-lightbox-backdrop">
        <div class="nmf-sheet-panel">
            <div class="nmf-sheet-head">
                <div style="font-family:var(--nmf-font-title);font-size:14.5px;font-weight:700;color:var(--nmf-accent);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    Осмотр внешности и арта · ${esc(info.name || 'Персонаж')}
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-lightbox" title="Закрыть">${NMF_ICONS.close}</button>
            </div>
            <div class="nmf-sheet-body">
                ${safeSrc ? `
                <div class="nmf-lightbox-stage">
                    <img src="${esc(safeSrc)}" alt="${esc(info.name || 'Portrait')}"/>
                </div>` : `
                <div class="nmf-empty-deck" style="padding:18px">
                    ${NMF_ICONS.image}
                    <div style="font-size:12px;color:var(--nmf-text-muted)">Портрет ещё не сгенерирован, но вы можете сохранить описание внешности и промпт ниже.</div>
                </div>`}

                <div class="nmf-panel">
                    <div class="nmf-field">
                        <label class="nmf-label">Описание внешности (можно подправить перед сохранением)</label>
                        <textarea class="nmf-textarea" id="nmf-lightbox-appearance" style="min-height:74px" placeholder="Черты лица, телосложение, одежда, детали образа...">${esc(info.appearance || '')}</textarea>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Визуальный промпт арта (EN)</label>
                        <textarea class="nmf-textarea" id="nmf-lightbox-prompt" style="min-height:58px" placeholder="Английский промпт внешности для генератора...">${esc(info.imagePrompt || '')}</textarea>
                    </div>
                    ${(detectImageExtensions().hasAny && getSettings().imageSource !== 'off') ? renderPromptRefineBox('lightbox', state.busy) : ''}
                    <div class="nmf-btn-row">
                        ${safeSrc ? `
                        <button type="button" class="nmf-btn-primary" style="flex:1" data-act="lightbox-download-img">
                            ${NMF_ICONS.download} Скачать чистый Арт
                        </button>
` : ''}
                        <button type="button" class="nmf-btn-secondary" data-act="lightbox-copy-looks">
                            ${NMF_ICONS.copy} Копировать внешность
                        </button>
                        <button type="button" class="nmf-btn-secondary" data-act="lightbox-save-txt">
                            ${NMF_ICONS.doc} Внешность .TXT
                        </button>
                    </div>
                    ${(safeSrc || hasAppearance || hasPrompt) ? `
                    <button type="button" class="nmf-btn-secondary" style="width:100%" data-act="lightbox-apply-to-editor" title="Перенести только этот портрет и внешность в текущий Профиль без чужого сюжета">
                        ${NMF_ICONS.editor} Забрать только эту внешность и арт в Профиль
                    </button>` : ''}
                </div>
            </div>
        </div>
    </div>`;
}

function renderStarsRowHtml(stars = 3) {
    const count = Math.max(1, Math.min(5, Math.round(Number(stars) || 3)));
    return `<span class="nmf-star-row nmf-stars-${count}">${Array.from({ length: count }, () => NMF_ICONS.star).join('')}</span>`;
}

function formatRemainingMs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`;
    return `${m}м ${String(s).padStart(2, '0')}с`;
}

function syncGachaWallClockCooldown(_sess, cfg) {
    reconcileGachaWalletFromLocalStorage(cfg);
    const maxCap = Math.max(3, Math.min(50, Number(cfg.gachaMaxPullsPerCycle) || 10));
    const res = syncGachaWalletState(cfg.gachaWallet, {
        maxCap,
        timerEnabled: cfg.gachaTimerEnabled !== false,
        nowMs: Date.now(),
    });
    if (res.changed) {
        persistGachaWalletImmediately(cfg);
    }
    return res;
}

function renderGachaSummonSubScreen(sess) {
    const cfg = getSettings();
    const gc = sess.gacha || (sess.gacha = createDefaultSession(1).gacha);
    const walletInfo = syncGachaWallClockCooldown(sess, cfg);
    const { coolingDown, leftMs, maxCap, freeWishesLeft, bonusWishes, totalWishes } = walletInfo;
    const plusTags = parseGachaPlusTags(gc.tagsInput);
    const spentInCycle = Math.min(maxCap, Math.max(0, maxCap - freeWishesLeft));
    const validFormula = plusTags.length >= 3 && plusTags.length <= 10;
    const canPull1 = cfg.gachaTimerEnabled === false || totalWishes >= 1;
    const canPull3 = cfg.gachaTimerEnabled === false || totalWishes >= 3;
    const colCount = (gc.collection || []).length;
    const unpackCopy = getThemeUnpackCopy(cfg.theme);
    const luckObj = GACHA_LUCK_OPTIONS.find((l) => l.id === (cfg.gachaLuckMode || 'fair')) || GACHA_LUCK_OPTIONS[0];
    const luckShort = (isEn() ? luckObj.labelEn : luckObj.label).split('(')[0].trim();

    const pipCount = Math.min(15, maxCap);
    const pipsHtml = Array.from({ length: pipCount }, (_, i) => {
        const idx = i + 1;
        const filled = Math.round((freeWishesLeft / maxCap) * pipCount) >= idx;
        const isGold = idx === pipCount;
        return `<div class="nmf-pity-pip ${filled ? 'nmf-filled' : ''} ${isGold ? 'nmf-gold' : ''}"></div>`;
    }).join('');

    return `
    ${state.pendingWishReveal ? `
    <div class="nmf-hcard nmf-hcard-accent" style="border-color:#f5c25b">
        <div class="nmf-hcard-head">
            <div class="nmf-hcard-left">
                <div class="nmf-hcard-icon" style="color:#f5c25b;border-color:rgba(245,194,91,0.5)">${NMF_ICONS.unbox}</div>
                <div class="nmf-hcard-info">
                    <div class="nmf-hcard-title">${esc(unpackCopy.stageGachaTitle)}</div>
                    <div class="nmf-hcard-sub">${esc(tx('Запечатанный призыв ждёт вашей распаковки!', 'A sealed summon is ready to be unpacked!'))}</div>
                </div>
            </div>
            <button type="button" class="nmf-hcard-btn nmf-on" data-act="open-pending-wish-stage">
                ${NMF_ICONS.unbox} ${esc(unpackCopy.gachaBtn)}
            </button>
        </div>
    </div>` : ''}

    <div class="nmf-gacha-banner">
        <div class="nmf-gacha-head">
            <div>
                <div class="nmf-gacha-kicker">${NMF_ICONS.primogem} ${esc(tx('Баннер Призыва', 'Summon Banner'))} · ${esc(luckShort)} ${helpBtn('gacha_timer')}</div>
                <div class="nmf-gacha-title">${esc(tx('Молитва Тегов', 'Prayer of Tags'))}</div>
            </div>
            <div class="nmf-pity-box">
                <div class="nmf-pity-num">${esc(tx('Молитв', 'Prayers'))}: ${cfg.gachaTimerEnabled === false ? '∞' : totalWishes}</div>
                <div class="nmf-pity-sub">${cfg.gachaTimerEnabled === false
                    ? esc(tx(`Потрачено: ${spentInCycle}`, `Spent: ${spentInCycle}`))
                    : esc(tx(`Цикл: ${freeWishesLeft}/${maxCap}${bonusWishes > 0 ? ` · +${bonusWishes} жертв.` : ''}`, `Cycle: ${freeWishesLeft}/${maxCap}${bonusWishes > 0 ? ` · +${bonusWishes} bonus` : ''}`))}</div>
            </div>
        </div>

        <div class="nmf-pity-track">${pipsHtml}</div>

        ${coolingDown ? `
        <div class="nmf-warn-box" style="border-color:#f5c25b;background:rgba(245,194,91,0.10);flex-direction:column;gap:7px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;flex-wrap:wrap">
                <span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;color:#f5c25b">
                    ${NMF_ICONS.clock} ${esc(tx('Новые молитвы через:', 'Next Prayers in:'))} <span id="nmf-gacha-cd-live">${esc(formatRemainingMs(leftMs))}</span>
                </span>
                <span style="font-family:var(--nmf-font-mono);font-size:10.5px">${esc(tx('Жертвенных молитв:', 'Bonus Prayers:'))} <strong>${bonusWishes}</strong></span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">
                <span style="font-size:11px;color:var(--nmf-text-muted)">${esc(bonusWishes > 0
                    ? tx('Вы можете крутить Баннер прямо сейчас за жертвенные Молитвы!', 'You can pull right now using your Bonus Prayers!')
                    : tx('Базовый пул на перезарядке — принесите ненужную карту в жертву ради Молитв.', 'Base pool cooling down — sacrifice unwanted cards for Bonus Prayers.'))}</span>
                <button type="button" class="nmf-btn-secondary" style="height:30px;font-size:10.5px;flex-shrink:0" data-act="open-gacha-collection">
                    ${NMF_ICONS.sacrifice} ${esc(tx(`В Коллекцию (${colCount})`, `Collection (${colCount})`))}
                </button>
            </div>
        </div>` : ''}

        <div class="nmf-field">
            <label class="nmf-label">
                <span>${esc(tx('Формула призыва (3–10 тегов через «+» или запятую)', 'Summon Formula (3-10 tags separated by "+" or comma)'))}</span>
                <span id="nmf-gacha-tag-counter" style="color:${validFormula ? 'var(--nmf-accent)' : 'var(--nmf-accent-2)'}">${plusTags.length} / 10</span>
            </label>
            <textarea class="nmf-textarea" id="nmf-gacha-tags-textarea" style="min-height:64px" data-gacha="tagsInput" placeholder="${esc(tx('босс мафии + шрам на брови + холодный юмор + ночной дождь', 'mafia boss + brow scar + dry wit + midnight rain'))}" ${sess.frozen ? 'disabled' : ''}>${esc(gc.tagsInput || '')}</textarea>
        </div>

        <div class="nmf-chip-wrap" id="nmf-gacha-live-chips">
            ${plusTags.length > 0
                ? plusTags.map((t, idx) => `<span class="nmf-plus-tag-chip"><span style="color:var(--nmf-accent)">+</span>${esc(t)}<button type="button" style="background:none;border:none;color:var(--nmf-text-muted);cursor:pointer;padding:0 0 0 3px;font-weight:700" data-act="gacha-remove-tag" data-idx="${idx}" title="${esc(tx('Убрать тег', 'Remove tag'))}">×</button></span>`).join('')
                : `<button type="button" class="nmf-chip" data-act="gacha-preset-tags" data-tags="${esc(tx('босс синдиката + шрам + сухая ирония + ночной мегаполис', 'syndicate boss + scar + dry irony + midnight city'))}">${esc(tx('Пример: Мафия', 'Sample: Mafia'))}</button>
                   <button type="button" class="nmf-chip" data-act="gacha-preset-tags" data-tags="${esc(tx('паладин-отступник + серебряный клинок + клятва + пепел', 'renegade paladin + silver blade + broken oath + ash'))}">${esc(tx('Пример: Дарк-фэнтези', 'Sample: Dark Fantasy'))}</button>
                   <button type="button" class="nmf-chip" data-act="gacha-preset-tags" data-tags="${esc(tx('нейрохирург + бессонница + острый ум + закрытая клиника', 'neurosurgeon + insomnia + sharp mind + private clinic'))}">${esc(tx('Пример: Драма', 'Sample: Drama'))}</button>`}
        </div>

        <div class="nmf-field" style="margin-top:2px">
            <label class="nmf-label">${esc(tx('Разрешение артов для этой Гачи (не меняет настройки SillyImages)', 'Art Resolution for This Gacha (keeps SillyImages safe)'))}</label>
            <select class="nmf-select" data-gacha="aspectRatio" ${sess.frozen ? 'disabled' : ''}>
                ${GACHA_RESOLUTION_OPTIONS.map((opt) => `<option value="${opt.id}" ${(gc.aspectRatio || 'sillyimages_default') === opt.id ? 'selected' : ''}>${esc(isEn() ? opt.labelEn : opt.label)}</option>`).join('')}
            </select>
        </div>

        <div class="nmf-wish-actions">
            <button type="button" class="nmf-wish-btn" id="nmf-wish-btn-1" data-act="gacha-wish" data-count="1" data-canpull="${canPull1 ? '1' : '0'}" ${state.busy || sess.frozen || !validFormula || !canPull1 ? 'disabled' : ''}>
                ${NMF_ICONS.primogem} ${esc(tx('Молитва ×1', 'Pray ×1'))}
            </button>
            <button type="button" class="nmf-wish-btn nmf-wish-gold" id="nmf-wish-btn-3" data-act="gacha-wish" data-count="3" data-canpull="${canPull3 ? '1' : '0'}" ${state.busy || sess.frozen || !validFormula || !canPull3 ? 'disabled' : ''}>
                ${NMF_ICONS.spark} ${canPull3 ? esc(tx('Молитва ×3', 'Pray ×3')) : `${esc(tx('Молитва ×3', 'Pray ×3'))} (${totalWishes}/3)`}
            </button>
        </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <button type="button" class="nmf-btn-secondary" style="flex:1" data-act="open-gacha-collection">
            ${NMF_ICONS.alchemy} ${esc(tx(`Коллекция и Алтарь (${colCount})`, `Collection & Altar (${colCount})`))}
        </button>
        ${(gc.lastRevealBatch || []).length > 0 ? `
        <button type="button" class="nmf-btn-secondary" data-act="reopen-last-wish">
            ${NMF_ICONS.unbox} ${esc(tx(`Распаковка (${gc.lastRevealBatch.length})`, `Last Pull (${gc.lastRevealBatch.length})`))}
        </button>` : ''}
    </div>`;
}

function renderWishRevealOverlay(sess) {
    const rev = state.wishRevealState;
    if (!rev) return '';
    const batch = sess.gacha?.lastRevealBatch || [];
    if (!batch.length) {
        state.wishRevealState = null;
        return '';
    }
    const cfg = getSettings();
    const canArt = detectImageExtensions().hasAny && cfg.imageSource !== 'off';
    const maxS = Math.max(1, Math.min(5, Number(rev.maxStars) || 3));
    const pal = RARITY_COLOR_PALETTE[maxS] || RARITY_COLOR_PALETTE[3];
    const wishColor = pal.hex;
    const unpackCopy = getThemeUnpackCopy(cfg.theme);
    const altarBgStyle = REVEAL_ASSET_URLS.altar
        ? `background-image:url('${esc(REVEAL_ASSET_URLS.altar)}');`
        : '';

    if (rev.phase === 'comet') {
        return `
        <div class="nmf-unpack-stage-modal ${pal.glowClass}" style="${altarBgStyle}--seal-color:${wishColor};--seal-glow:${wishColor}66;--wish-color:${wishColor}">
            <div class="nmf-unpack-stage-scrim"></div>
            <div class="nmf-unpack-inner">
                <div style="display:flex;justify-content:flex-end;gap:6px">
                    <button type="button" class="nmf-chip" data-act="wish-skip-comet">${esc(tx('Пропустить', 'Skip'))}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-wish-reveal" title="${esc(tx('Закрыть', 'Close'))}">${NMF_ICONS.close}</button>
                </div>
                <div class="nmf-comet-flight" style="flex:1">
                    <div class="nmf-comet-beam"></div>
                    <div class="nmf-comet-burst">${rev.isFusion ? NMF_ICONS.alchemy : NMF_ICONS.primogem}</div>
                    <div style="margin-top:18px;font-family:var(--nmf-font-mono);font-size:11.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${wishColor}">
                        ${esc(rev.isFusion ? tx('СИНТЕЗ АЛТАРЯ ЗАВЕРШЁН', 'ALTAR SYNTHESIS COMPLETE') : getRarityLabel(maxS))}
                    </div>
                </div>
            </div>
        </div>`;
    }

    if (rev.phase === 'sealed') {
        return `
        <div class="nmf-unpack-stage-modal ${pal.glowClass}" style="${altarBgStyle}--seal-color:${wishColor};--seal-glow:${wishColor}55;--wish-color:${wishColor}">
            <div class="nmf-unpack-stage-scrim"></div>
            <div class="nmf-unpack-inner">
                <div style="display:flex;justify-content:flex-end">
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-wish-reveal" title="${esc(tx('Закрыть', 'Close'))}">${NMF_ICONS.close}</button>
                </div>
                <div class="nmf-sealed-center">
                    <div style="font-family:var(--nmf-font-mono);font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${wishColor}">
                        ${esc(rev.isFusion ? tx('СИНТЕЗ АЛТАРЯ ЗАВЕРШЁН', 'ALTAR SYNTHESIS COMPLETE') : getRarityLabel(maxS))}
                    </div>
                    <div style="font-family:var(--nmf-font-title);font-size:20px;font-weight:700;color:#ffffff;max-width:340px;line-height:1.28">
                        ${esc(unpackCopy.stageGachaTitle)}
                    </div>
                    <div class="nmf-sealed-card-totem">
                        <div style="color:${wishColor};transform:scale(1.5)">${rev.isFusion ? NMF_ICONS.alchemy : NMF_ICONS.primogem}</div>
                        <div style="display:inline-flex;gap:3px;color:${wishColor}">${renderStarsRowHtml(maxS)}</div>
                        <div style="font-family:var(--nmf-font-mono);font-size:10px;color:#e2e8f0;letter-spacing:1px">
                            ${batch.length > 1 ? esc(tx(`КАРТ В ПАКЕ: ${batch.length}`, `CARDS IN PACK: ${batch.length}`)) : esc(tx('ЗАПЕЧАТАННАЯ КАРТА', 'SEALED CARD'))}
                        </div>
                    </div>
                    <button type="button" class="nmf-unpack-cta-btn" data-act="unpack-wish-cards">
                        ${NMF_ICONS.unbox} <span>${esc(unpackCopy.gachaBtn)}</span>
                    </button>
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="nmf-unpack-stage-modal ${pal.glowClass}" style="${altarBgStyle}--seal-color:${wishColor};--wish-color:${wishColor}">
        <div class="nmf-unpack-stage-scrim"></div>
        <div class="nmf-unpack-inner">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
                <div style="font-family:var(--nmf-font-mono);font-size:11px;font-weight:700;letter-spacing:0.8px;color:${wishColor};text-transform:uppercase">
                    ${esc(rev.isFusion ? tx('Рождённый в Алтаре герой', 'Hero Born at the Altar') : tx(`Распаковано в Коллекцию (${batch.length})`, `Unpacked to Collection (${batch.length})`))}
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-wish-reveal" title="${esc(tx('Закрыть', 'Close'))}">${NMF_ICONS.close}</button>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px;flex:1">
                ${batch.map((item, idx) => {
                    const colItem = (sess.gacha?.collection || []).find((x) => x.id === item.id) || item;
                    const colIdx = (sess.gacha?.collection || []).findIndex((x) => x.id === item.id);
                    const imgUrl = safeImgSrc(resolveEntityDisplayUrl(colItem));
                    const isLoading = state.loadingArtIds.has(colItem.id);
                    const poolKey = colIdx >= 0 ? 'gacha_collection' : 'gacha_reveal';
                    const poolIdx = colIdx >= 0 ? colIdx : idx;
                    const fSpec = resolveDisplayOrCoverSpec(colItem, imgUrl, isLoading, state.artErrors.get(colItem.id) || '');
                    const sealedArt = fSpec.isReal && isArtWaitingToOpen(colItem.id);
                    return `
                    <div class="nmf-gacha-card nmf-unpacked-card-enter nmf-stars-${colItem.stars || 3}">
                        <div class="nmf-hero-visual ${fSpec.src ? 'nmf-has-photo' : 'nmf-rendering-stage'} ${(fSpec.isReal && !sealedArt) ? 'nmf-tappable-photo' : ''}${fSpec.croppedCls}" style="${fSpec.croppedStyle}${fSpec.src ? '' : 'min-height:190px'}" data-act="${(fSpec.isReal && !sealedArt) ? 'open-cand-lightbox' : ''}" data-pool="${poolKey}" data-idx="${poolIdx}">
                            ${fSpec.src ? `<img class="nmf-hero-photo${fSpec.isReal ? consumeFreshArtClass(colItem.id) : ''}" src="${esc(fSpec.src)}" alt="${esc(colItem.name)}"/>` : `<div style="font-family:var(--nmf-font-mono);font-size:11px;color:var(--nmf-accent)">${esc(tx('РЕНДЕР АРТА...', 'RENDERING ARTWORK...'))}</div>`}
                            ${fSpec.isReal ? renderSealedArtVeilHtml(colItem.id) : ''}
                            <div class="nmf-hero-topbadges">
                                <span class="nmf-star-pill">${renderStarsRowHtml(colItem.stars)}</span>
                                <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
                                    <button type="button" class="nmf-art-chip-btn" data-act="trigger-cand-upload" data-pool="${poolKey}" data-idx="${poolIdx}" title="${esc(tx('Загрузить свой арт', 'Upload custom photo'))}">${NMF_ICONS.upload} ${esc(tx('Своё фото', 'Photo'))}</button>
                                    ${fSpec.isReal ? `<button type="button" class="nmf-art-chip-btn" data-act="open-crop-cand" data-pool="${poolKey}" data-idx="${poolIdx}" title="${esc(tx('Кадрировать арт', 'Crop art'))}">${NMF_ICONS.crop} ${esc(tx('Кадр', 'Crop'))}</button>` : ''}
                                    ${canArt ? (isLoading
                                        ? `<button type="button" class="nmf-art-chip-btn" style="border-color:#ff6b86;color:#ff8fa0" data-act="stop-cand-art" data-id="${esc(colItem.id)}">${esc(tx('Стоп', 'Stop'))}</button>`
                                        : `<button type="button" class="nmf-art-chip-btn" data-act="gen-gacha-item-art" data-id="${esc(colItem.id)}">${NMF_ICONS.image} ${esc(fSpec.isReal ? tx('Перерисовать', 'Redraw') : tx('Сделать арт', 'Render Art'))}</button>`) : ''}
                                </div>
                            </div>
                            <div class="nmf-hero-scrim">
                                ${colItem.epithet ? `<div style="font-family:var(--nmf-font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:${colItem.stars >= 5 ? '#f5c25b' : 'var(--nmf-accent-2)'}">${esc(colItem.epithet)}</div>` : ''}
                                <div class="nmf-hero-name">${esc(colItem.name)}</div>
                                <div class="nmf-hero-arch">${esc(colItem.archetype)}</div>
                            </div>
                        </div>

                        <div class="nmf-profile-body">
                            ${canArt ? `
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                                <span style="font-size:11px;color:var(--nmf-text-muted)">${esc(tx('Формат арта этой карты:', 'Art format for this card:'))}</span>
                                <select class="nmf-select" style="width:auto;max-width:190px;height:28px;font-size:11px;padding:0 8px" data-gacha-card-aspect="${esc(colItem.id)}">
                                    <option value="" ${!colItem.gachaAspectOverride ? 'selected' : ''}>${esc(tx('По настройке Гачи', 'Use Gacha Setting'))}</option>
                                    ${GACHA_RESOLUTION_OPTIONS.map((opt) => `<option value="${opt.id}" ${colItem.gachaAspectOverride === opt.id ? 'selected' : ''}>${esc(isEn() ? opt.labelEn : opt.label)}</option>`).join('')}
                                </select>
                            </div>` : ''}
                            ${colItem.quote ? `<div class="nmf-profile-quote">«${esc(parseCleanQuote(colItem.quote))}»</div>` : ''}
                            <div class="nmf-profile-bio">${esc(colItem.pitch)}</div>
                            ${colItem.appearance ? `
                            <details class="nmf-spoiler">
                                <summary><span>${esc(tx('Детали внешности и образа', 'Appearance & Visual Details'))}</span>${NMF_ICONS.chevronDown}</summary>
                                <div class="nmf-spoiler-body" style="font-size:12px;color:var(--nmf-text-muted)">${esc(colItem.appearance)}</div>
                            </details>` : ''}
                            <div class="nmf-chip-wrap">
                                ${(colItem.tags || []).map((t) => `<span class="nmf-mini-tag">${esc(t)}</span>`).join('')}
                            </div>
                            <div class="nmf-btn-row" style="margin-top:2px;flex-wrap:wrap">
                                ${colItem.fusedFromNames?.length ? `
                                <button type="button" class="nmf-btn-secondary" data-act="regen-altar-char" data-id="${esc(colItem.id)}" ${state.busy || sess.frozen ? 'disabled' : ''} title="${esc(tx('Перегенерировать героя Алтаря заново', 'Regenerate this Altar-born hero'))}">
                                    ${NMF_ICONS.rework} ${esc(tx('Перегенерировать', 'Regenerate'))}
                                </button>` : ''}
                                <button type="button" class="nmf-btn-secondary" data-act="sacrifice-gacha-id" data-id="${esc(colItem.id)}" title="${esc(tx(`Пожертвовать карту ради +${computeSacrificeWishGain(colItem.stars)} Молитв`, `Sacrifice card for +${computeSacrificeWishGain(colItem.stars)} Prayers`))}">
                                    ${NMF_ICONS.sacrifice} +${computeSacrificeWishGain(colItem.stars)} ${esc(tx('молитв', 'prayers'))}
                                </button>
                                <button type="button" class="nmf-btn-primary" style="flex:1;min-width:150px" data-act="expand-gacha-id" data-id="${esc(colItem.id)}" ${state.busy ? 'disabled' : ''}>
                                    ${NMF_ICONS.spark} ${esc(tx('Собрать Карточку V2', 'Build Full V2 Card'))}
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div class="nmf-btn-row" style="margin-top:12px;justify-content:space-between">
                <button type="button" class="nmf-btn-secondary" style="flex:1" data-act="close-wish-reveal">${esc(tx('Назад к Баннеру', 'Back to Banner'))}</button>
                <button type="button" class="nmf-btn-primary" style="flex:1" data-act="open-gacha-collection">${NMF_ICONS.alchemy} ${esc(tx('В Коллекцию', 'Open Collection'))}</button>
            </div>
        </div>
    </div>`;
}

// 1. SWIPE DECK & GACHA WISH SCREEN
function renderSwipeTab(sess) {
    const modeSwitchBar = `
    <div class="nmf-seg-bar">
        <button type="button" class="nmf-seg-btn ${state.discoverSubMode !== 'gacha' ? 'nmf-active' : ''}" data-act="discover-sub" data-sub="swipe">
            ${NMF_ICONS.flame} Свайпы Тиндера
        </button>
        <button type="button" class="nmf-seg-btn ${state.discoverSubMode === 'gacha' ? 'nmf-active' : ''}" data-act="discover-sub" data-sub="gacha">
            ${NMF_ICONS.primogem} Гача-Призыв
        </button>
    </div>`;

    if (state.discoverSubMode === 'gacha') {
        return `
        ${modeSwitchBar}
        ${renderGachaSummonSubScreen(sess)}`;
    }

    const td = sess.tinder;
    const cfg = getSettings();
    const imgCaps = detectImageExtensions();
    const canArt = imgCaps.hasAny && cfg.imageSource !== 'off';
    const current = td.queue[0] || null;
    const currentAvatarUrl = resolveEntityDisplayUrl(current);
    const hasNext = td.queue.length > 1;
    const lastRejected = td.lastDislikedCandidate;
    const isArtLoading = current ? state.loadingArtIds.has(current.id) : false;
    const artErrText = current ? (state.artErrors.get(current.id) || '') : '';
    const worldMode = isWorldOrRpgMode(sess.intake);

    return `
    ${modeSwitchBar}

    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <input type="text" class="nmf-input" style="flex:1" data-tinder="promptHint" value="${esc(td.promptHint)}" placeholder="${worldMode ? 'Пожелание к миру/РПГ...' : 'Пожелание в ленту (например: постарше, босс)...'}" ${sess.frozen ? 'disabled' : ''}/>
        <button type="button" class="nmf-btn-primary" style="height:36px;padding:0 12px" data-act="gen-tinder" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.spark} Поиск
        </button>
    </div>

    <details class="nmf-spoiler" ${state.swipeControlsOpen ? 'open' : ''}>
        <summary><span>Параметры колоды (×${Number(td.batchSize) || 1}) и стоп-слова (${td.dislikedTags.length + td.dislikedNotes.length})</span>${NMF_ICONS.chevronDown}</summary>
        <div class="nmf-spoiler-body">
            <div class="nmf-grid-2">
                <div class="nmf-field">
                    <label class="nmf-label">Сколько анкет делать разом</label>
                    <select class="nmf-select" data-tinder="batchSize" ${sess.frozen ? 'disabled' : ''}>
                        <option value="1" ${Number(td.batchSize) === 1 ? 'selected' : ''}>По 1 анкете</option>
                        <option value="3" ${Number(td.batchSize) === 3 ? 'selected' : ''}>Пачкой по 3 анкеты</option>
                        <option value="5" ${Number(td.batchSize) === 5 ? 'selected' : ''}>Пачкой по 5 анкет сразу</option>
                    </select>
                </div>
                ${canArt ? `
                <div class="nmf-toggle-line" data-act="toggle-tinder-autoart">
                    <span style="font-size:12px;font-weight:700">Авто-подгрузка фото по очереди</span>
                    <div class="nmf-switch ${td.autoArt ? 'nmf-on' : ''}"></div>
                </div>` : ''}
            </div>

            <div class="nmf-field">
                <label class="nmf-label">Вписать вручную, чего НЕ предлагать в Свайпах</label>
                <div style="display:flex;gap:6px">
                    <input type="text" class="nmf-input" id="nmf-manual-ban-input" value="${esc(state.manualBanDraft)}" placeholder="Например: борода, тюрьма, грубость..."/>
                    <button type="button" class="nmf-btn-secondary" style="height:36px;flex-shrink:0" data-act="add-manual-ban">+ В бан</button>
                </div>
            </div>

            ${(td.dislikedTags.length > 0 || td.dislikedNotes.length > 0) ? `
            <div class="nmf-chip-wrap">
                ${td.dislikedTags.map((t, idx) => `<button type="button" class="nmf-chip nmf-ban" data-act="remove-antitag" data-idx="${idx}">${esc(t)} ×</button>`).join('')}
                ${td.dislikedNotes.map((n, idx) => `<button type="button" class="nmf-chip nmf-ban" data-act="remove-antinote" data-idx="${idx}">${esc(n)} ×</button>`).join('')}
            </div>` : ''}
        </div>
    </details>

    ${lastRejected ? `
    <div class="nmf-feedback-pop">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
            <span style="font-size:11.5px;font-weight:700;color:#ff8fa0">«${esc(lastRejected.name)}» в Архиве «Мимо». Отметить анти-теги:</span>
            <div style="display:flex;gap:4px">
                <button type="button" class="nmf-chip" data-act="undo-last-pass">${NMF_ICONS.undo} Вернуть</button>
                <button type="button" class="nmf-chip" data-act="dismiss-reject-pop">Скрыть</button>
            </div>
        </div>
        <div class="nmf-chip-wrap">
            ${(lastRejected.tags || []).map((tg) => `
                <button type="button" class="nmf-chip ${td.dislikedTags.includes(tg) ? 'nmf-ban' : ''}" data-act="quick-ban-tag" data-tag="${esc(tg)}">
                    - ${esc(tg)}
                </button>
            `).join('')}
        </div>
    </div>` : ''}

    ${current ? `
    <div class="nmf-deck-stage">
        ${hasNext ? `<div class="nmf-deck-backcard"></div>` : ''}
        <div class="nmf-swipe-card" id="nmf-active-swipe-card">
            <div class="nmf-stamp nmf-stamp-like" id="nmf-stamp-like">ЛАЙК</div>
            <div class="nmf-stamp nmf-stamp-nope" id="nmf-stamp-nope">МИМО</div>

            ${(() => {
                const fSpec = resolveDisplayOrCoverSpec(current, currentAvatarUrl, isArtLoading, artErrText);
                const sealedArt = fSpec.isReal && isArtWaitingToOpen(current.id);
                return `
            <div class="nmf-hero-visual ${fSpec.src ? 'nmf-has-photo' : 'nmf-rendering-stage'} ${(fSpec.isReal && !sealedArt) ? 'nmf-tappable-photo' : ''}${fSpec.croppedCls}" style="${fSpec.croppedStyle}${fSpec.src ? '' : 'min-height:210px'}" data-act="${(fSpec.isReal && !sealedArt) ? 'open-cand-lightbox' : ''}" data-pool="queue" data-idx="0">
                ${fSpec.src ? `<img class="nmf-hero-photo${fSpec.isReal ? consumeFreshArtClass(current.id) : ''}" src="${esc(fSpec.src)}" alt="Portrait"/>` : `<div style="font-family:var(--nmf-font-mono);font-size:11px;color:var(--nmf-accent)">${esc(tx('РЕНДЕР АРТА...', 'RENDERING ART...'))}</div>`}
                ${fSpec.isReal ? renderSealedArtVeilHtml(current.id) : ''}
                <div class="nmf-hero-topbadges">
                    <span class="nmf-match-badge">${Number(current.compatibility) || 91}% MATCH</span>
                    <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
                        <button type="button" class="nmf-art-chip-btn" data-act="send-cand-to-blitz" data-source="tinder" data-ref="queue:${esc(current.id)}" title="Раскрыть этого героя вопросами в Блице">${NMF_ICONS.blitz} В Блиц</button>
                        <button type="button" class="nmf-art-chip-btn" data-act="trigger-cand-upload" data-pool="queue" data-idx="0" title="Загрузить свой арт с устройства">${NMF_ICONS.upload} Своё</button>
                        ${fSpec.isReal ? `<button type="button" class="nmf-art-chip-btn" data-act="open-crop-cand" data-pool="queue" data-idx="0" title="Кадрировать арт">${NMF_ICONS.crop}</button>` : ''}
                        <button type="button" class="nmf-art-chip-btn" data-act="edit-cand" data-pool="queue" data-idx="0" title="Править превью">${NMF_ICONS.editSmall}</button>
                        ${canArt ? (isArtLoading
                            ? `<button type="button" class="nmf-art-chip-btn" style="border-color:#ff6b86;color:#ff8fa0" data-act="stop-cand-art" data-id="${esc(current.id)}">Стоп</button>`
                            : `<button type="button" class="nmf-art-chip-btn" data-act="gen-cand-art">${NMF_ICONS.image} ${fSpec.isReal ? 'Переснять' : 'Арт'}</button>`) : ''}
                    </div>
                </div>`;
            })()}
                <div class="nmf-hero-scrim">
                    <div class="nmf-hero-name">${esc(current.name)}</div>
                    <div class="nmf-hero-arch">${esc(current.archetype)}</div>
                </div>
            </div>

            <div class="nmf-profile-body">
                ${(!isArtLoading && artErrText) ? `
                <div class="nmf-warn-box" style="border-color:#ff5c77;font-size:11px">
                    ${NMF_ICONS.warn}
                    <span><strong>Сбой фото:</strong> ${esc(artErrText)}</span>
                </div>` : ''}
                ${current.quote ? `<div class="nmf-profile-quote">«${esc(parseCleanQuote(current.quote))}»</div>` : ''}
                <div class="nmf-profile-bio">${esc(current.pitch)}</div>
                ${current.appearance ? `
                <details class="nmf-spoiler">
                    <summary><span>Внешность / Визуал</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body" style="font-size:12px;color:var(--nmf-text-muted)">${esc(current.appearance)}</div>
                </details>` : ''}
                <div class="nmf-chip-wrap">
                    ${(current.tags || []).map((t) => `<span class="nmf-mini-tag">${esc(t)}</span>`).join('')}
                </div>
            </div>
        </div>
    </div>

    <div class="nmf-dating-dock">
        <button type="button" class="nmf-dock-btn nmf-dock-nope" data-act="tinder-dislike" ${sess.frozen ? 'disabled' : ''}>${NMF_ICONS.dislike} Мимо</button>
        <button type="button" class="nmf-dock-btn nmf-dock-super" data-act="tinder-expand-now" ${state.busy || sess.frozen ? 'disabled' : ''}>${NMF_ICONS.spark} Собрать</button>
        <button type="button" class="nmf-dock-btn nmf-dock-like" data-act="tinder-like" ${sess.frozen ? 'disabled' : ''}>${NMF_ICONS.heart} В Мэтчи</button>
    </div>` : `
    <div class="nmf-empty-deck">
        <div style="color:var(--nmf-accent)">${NMF_ICONS.flame}</div>
        <div style="font-family:var(--nmf-font-title);font-size:17px;font-weight:700">${worldMode ? 'Лента миров и РПГ готова' : 'Лента знакомств готова'}</div>
        <div class="nmf-btn-row" style="justify-content:center;margin-top:4px">
            <button type="button" class="nmf-btn-primary" data-act="gen-tinder" ${state.busy || sess.frozen ? 'disabled' : ''}>${NMF_ICONS.spark} Запустить подбор</button>
        </div>
    </div>`}`;
}

function filterAndSortGridEntries(items = [], { isGacha = false, isVault = false } = {}) {
    const sortMode = state.gridSortMode || (isGacha ? 'stars_desc' : 'art_first');
    const filterMode = state.gridFilterMode || 'all';

    const indexed = items.map((item, origIdx) => {
        const hasArt = Boolean(resolveEntityDisplayUrl(item));
        const pSpec = resolvePuzzleTileSpec(item, hasArt);
        const shapeRank = pSpec.cls === 'nmf-tile-wide' ? 0 : (pSpec.cls === 'nmf-tile-tall' ? 1 : (hasArt ? 2 : 3));
        return { item, origIdx, hasArt, shapeRank };
    });

    const filtered = indexed.filter(({ item, hasArt }) => {
        if (filterMode === 'with_art') return hasArt;
        if (isGacha) {
            const st = Number(item?.stars) || 3;
            if (filterMode === 's5') return st >= 5;
            if (filterMode === 's4plus') return st >= 4;
            if (filterMode === 'fused') return Boolean(item?.fusedFromNames?.length);
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (sortMode === 'stars_desc' && isGacha) {
            const sd = (Number(b.item?.stars) || 3) - (Number(a.item?.stars) || 3);
            if (sd !== 0) return sd;
            if (a.shapeRank !== b.shapeRank) return a.shapeRank - b.shapeRank;
            return a.origIdx - b.origIdx;
        }
        if (sortMode === 'art_first' || (sortMode === 'stars_desc' && !isGacha)) {
            if (a.hasArt !== b.hasArt) return a.hasArt ? -1 : 1;
            if (a.shapeRank !== b.shapeRank) return a.shapeRank - b.shapeRank;
            if (!isVault) {
                const cd = (Number(b.item?.compatibility) || 0) - (Number(a.item?.compatibility) || 0);
                if (cd !== 0) return cd;
            }
            return a.origIdx - b.origIdx;
        }
        if (sortMode === 'name_asc') {
            return String(a.item?.name || '').localeCompare(String(b.item?.name || ''), getUiLang() === 'en' ? 'en' : 'ru');
        }
        // 'newest' keeps natural chronological insertion order, pairing wide tiles cleanly
        return a.origIdx - b.origIdx;
    });

    return filtered;
}

function renderGridSortFilterBar({ isGacha = false, totalCount = 0, shownCount = 0 } = {}) {
    if (totalCount < 2) return '';
    const sortVal = state.gridSortMode || (isGacha ? 'stars_desc' : 'art_first');
    const flt = state.gridFilterMode || 'all';
    const validForTab = isGacha ? flt : (flt === 'with_art' ? 'with_art' : 'all');

    return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;padding:4px 0 2px">
        <div class="nmf-chip-wrap" style="gap:4px">
            <button type="button" class="nmf-chip ${validForTab === 'all' ? 'nmf-on' : ''}" data-act="set-grid-filter" data-flt="all">${esc(tx('Все', 'All'))} (${totalCount})</button>
            ${isGacha ? `
            <button type="button" class="nmf-chip ${validForTab === 's5' ? 'nmf-on' : ''}" data-act="set-grid-filter" data-flt="s5">${esc(tx('5 зв.', '5-Star'))}</button>
            <button type="button" class="nmf-chip ${validForTab === 's4plus' ? 'nmf-on' : ''}" data-act="set-grid-filter" data-flt="s4plus">${esc(tx('4+ зв.', '4+ Star'))}</button>
            <button type="button" class="nmf-chip ${validForTab === 'fused' ? 'nmf-on' : ''}" data-act="set-grid-filter" data-flt="fused">${esc(tx('Синтез', 'Fused'))}</button>` : ''}
            <button type="button" class="nmf-chip ${validForTab === 'with_art' ? 'nmf-on' : ''}" data-act="set-grid-filter" data-flt="with_art">${esc(tx('С артом', 'With Art'))}</button>
        </div>
        <select class="nmf-select" style="width:auto;max-width:168px;height:27px;font-size:10.5px;padding:0 7px" data-grid-sort="1">
            ${isGacha ? `<option value="stars_desc" ${sortVal === 'stars_desc' ? 'selected' : ''}>${esc(tx('По звёздам (5 -> 1)', 'By Stars (5 -> 1)'))}</option>` : ''}
            <option value="art_first" ${(sortVal === 'art_first' || (!isGacha && sortVal === 'stars_desc')) ? 'selected' : ''}>${esc(tx('С артом и по размеру', 'Art & Shape Grouped'))}</option>
            <option value="newest" ${sortVal === 'newest' ? 'selected' : ''}>${esc(tx('Сначала новые', 'Newest First'))}</option>
            <option value="name_asc" ${sortVal === 'name_asc' ? 'selected' : ''}>${esc(tx('По имени (А–Я)', 'By Name (A-Z)'))}</option>
        </select>
    </div>
    ${shownCount === 0 ? `<div style="padding:14px;text-align:center;font-size:12px;color:var(--nmf-text-muted);border:1px dashed var(--nmf-border);border-radius:6px">${esc(tx('По выбранному фильтру пока нет карточек.', 'No cards match the selected filter yet.'))}</div>` : ''}`;
}

// 2. MATCHES, GACHA COLLECTION (+ SACRIFICE & ALCHEMY), SAVED VAULT & PASSED ARCHIVE
function renderGachaCollectionView(sess) {
    const gc = sess.gacha || (sess.gacha = createDefaultSession(1).gacha);
    const col = gc.collection || [];
    const slotIds = Array.isArray(gc.fusionSlotIds) ? gc.fusionSlotIds : [];
    const donors = slotIds.map((id) => col.find((x) => x.id === id)).filter(Boolean);
    const cfg = getSettings();
    const canArt = detectImageExtensions().hasAny && cfg.imageSource !== 'off';
    const altarBgStyle = REVEAL_ASSET_URLS.altar
        ? `background-image:url('${esc(REVEAL_ASSET_URLS.altar)}');`
        : '';

    const slotsHtml = [0, 1, 2].map((slotIdx) => {
        const d = donors[slotIdx] || null;
        if (!d) {
            return `
            <div class="nmf-fusion-slot">
                <span style="color:var(--nmf-text-muted)">${NMF_ICONS.plus}</span>
                <span style="font-family:var(--nmf-font-mono);font-size:9.5px;color:var(--nmf-text-muted)">${esc(slotIdx < 2 ? tx(`Слот #${slotIdx + 1}`, `Slot #${slotIdx + 1}`) : tx('Слот #3 (опц.)', 'Slot #3 (opt.)'))}</span>
            </div>`;
        }
        const dThumb = safeImgSrc(resolveEntityDisplayUrl(d));
        return `
        <div class="nmf-fusion-slot nmf-filled">
            <button type="button" style="position:absolute;top:2px;right:4px;background:none;border:none;color:var(--nmf-text-muted);cursor:pointer;font-weight:700" data-act="gacha-toggle-fusion-slot" data-id="${esc(d.id)}" title="${esc(tx('Убрать из слота', 'Remove from slot'))}">×</button>
            ${dThumb ? `<img class="nmf-fusion-thumb" src="${esc(dThumb)}" alt="Donor"/>` : `<span style="color:var(--nmf-accent)">${NMF_ICONS.primogem}</span>`}
            <div style="font-size:10.5px;font-weight:700;line-height:1.15;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.name.split(',')[0])}</div>
        </div>`;
    }).join('');

    const walletInfo = syncGachaWallClockCooldown(sess, cfg);
    const isFusingNow = Boolean(state.altarFusionBusy);
    const activeDonorsForAnim = state.altarDonorSnapshot?.length ? state.altarDonorSnapshot : donors;

    return `
    ${state.lastSacrificeFailAlert ? `
    <div class="nmf-warn-box" style="border-color:#e63950;background:rgba(230,57,80,0.14);justify-content:space-between;align-items:center">
        <span style="color:#ffd5dc;font-weight:600">${esc(state.lastSacrificeFailAlert)}</span>
        <button type="button" class="nmf-chip nmf-ban" data-act="dismiss-sacrifice-fail">${esc(tx('Понятно', 'Dismiss'))}</button>
    </div>` : ''}

    <details class="nmf-spoiler" ${(donors.length > 0 || isFusingNow) ? 'open' : ''}>
        <summary><span>${NMF_ICONS.alchemy} ${esc(tx(`Алтарь Слияния (${donors.length}/3)`, `Altar of Fusion (${donors.length}/3)`))} · ${esc(tx('Молитв', 'Prayers'))}: ${cfg.gachaTimerEnabled === false ? '∞' : walletInfo.totalWishes}</span>${NMF_ICONS.chevronDown}</summary>
        <div class="nmf-spoiler-body" style="padding:0">
            <div class="nmf-altar-shrine ${isFusingNow ? 'nmf-altar-working' : ''}" style="${altarBgStyle}">
                <div class="nmf-altar-shrine-overlay">
                    ${isFusingNow ? `
                    <div class="nmf-altar-ritual-stage">
                        <div class="nmf-altar-ring-wrap">
                            <div class="nmf-altar-ring-outer"></div>
                            <div class="nmf-altar-ring-inner"></div>
                            <div class="nmf-altar-core-gem">${NMF_ICONS.alchemy}</div>
                        </div>
                        <div style="font-family:var(--nmf-font-title);font-size:15px;font-weight:700;color:#f5c25b">
                            ${esc(tx('Алтарь сплетает карточки воедино...', 'The Altar is weaving cards into a new soul...'))}
                        </div>
                        <div class="nmf-altar-donor-converge">
                            ${activeDonorsForAnim.map((dn) => `<span class="nmf-altar-donor-orb">${esc(String(dn.name || '').split(',')[0])}</span>`).join('')}
                        </div>
                        <button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:30px;font-size:11px" data-act="cancel-busy">
                            ${NMF_ICONS.close} ${esc(tx('Прервать ритуал', 'Abort Ritual'))}
                        </button>
                    </div>` : `
                    <div class="nmf-fusion-slots">${slotsHtml}</div>
                    ${donors.length >= 2 ? `
                    <input type="text" class="nmf-input" data-gacha="fusionHint" value="${esc(gc.fusionHint || '')}" placeholder="${esc(tx('Направление синтеза по желанию...', 'Optional fusion direction...'))}" ${sess.frozen ? 'disabled' : ''}/>
                    ${canArt && donors.some((d) => Boolean(resolveEntityAvatarUrl(d))) ? `
                    <div class="nmf-toggle-line" data-act="toggle-gacha-fusion-artrefs">
                        <span style="font-size:11.5px;font-weight:600">${esc(tx('Учесть портреты доноров при генерации арта', 'Blend donor portraits when generating art'))}</span>
                        <div class="nmf-switch ${gc.fusionArtRefs ? 'nmf-on' : ''}"></div>
                    </div>` : ''}` : ''}
                    <div class="nmf-btn-row">
                        ${donors.length > 0 ? `<button type="button" class="nmf-btn-secondary" data-act="gacha-clear-fusion">${esc(tx('Очистить', 'Clear'))}</button>` : ''}
                        <button type="button" class="nmf-btn-primary" style="flex:1" data-act="gacha-run-fusion" ${state.busy || sess.frozen || donors.length < 2 ? 'disabled' : ''}>
                            ${NMF_ICONS.alchemy} ${esc(donors.length >= 2 ? tx(`Синтезировать нового героя (${donors.length})`, `Synthesize New Hero (${donors.length})`) : tx('Отметьте 2–3 карты ниже', 'Select 2-3 cards below'))}
                        </button>
                    </div>`}
                </div>
            </div>
        </div>
    </details>

    ${col.length === 0 ? `
    <div class="nmf-empty-deck">
        <div style="color:var(--nmf-accent)">${NMF_ICONS.primogem}</div>
        <div style="font-family:var(--nmf-font-title);font-size:16px;font-weight:700">${esc(tx('Коллекция Гачи пока пуста', 'Gacha Collection is empty'))}</div>
        <button type="button" class="nmf-btn-primary" data-act="go-to-gacha-banner">${NMF_ICONS.primogem} ${esc(tx('Перейти к Баннеру Гачи', 'Go to Gacha Banner'))}</button>
    </div>` : (() => {
        const sortedCol = filterAndSortGridEntries(col, { isGacha: true });
        return `
    ${renderGridSortFilterBar({ isGacha: true, totalCount: col.length, shownCount: sortedCol.length })}
    <div class="nmf-mosaic-grid">
        ${sortedCol.map(({ item: c, origIdx: idx }) => {
            const thumbUrl = safeImgSrc(resolveEntityDisplayUrl(c));
            const isLoading = state.loadingArtIds.has(c.id);
            const fSpec = resolveDisplayOrCoverSpec(c, thumbUrl, isLoading, state.artErrors.get(c.id) || '');
            const pSpec = resolvePuzzleTileSpec(c, Boolean(thumbUrl));
            const tileCls = fSpec.isReal ? pSpec.cls : 'nmf-tile-square';
            const inSlot = slotIds.includes(c.id);
            const sacGain = computeSacrificeWishGain(c.stars);
            const sealedArt = fSpec.isReal && isArtWaitingToOpen(c.id);
            return `
        <div class="nmf-match-tile ${tileCls}" style="${fSpec.isReal ? pSpec.style : ''}border-color:${inSlot ? 'var(--nmf-accent)' : (c.stars >= 5 ? 'rgba(245,194,91,0.68)' : (c.stars === 4 ? 'rgba(192,132,252,0.55)' : 'var(--nmf-border)'))}">
            <div class="nmf-match-click-zone" data-act="${sealedArt ? '' : 'open-cand-dossier'}" data-pool="gacha_collection" data-idx="${idx}" title="${esc(tx('Открыть полную анкету персонажа', 'Open full character dossier'))}">
                <div class="nmf-match-thumb nmf-tappable-photo">
                    ${fSpec.src ? `<img class="${fSpec.isReal ? consumeFreshArtClass(c.id).trim() : ''}" src="${esc(fSpec.src)}" alt="Card"/>` : ''}
                    ${fSpec.isReal ? renderSealedArtVeilHtml(c.id) : ''}
                    <div style="position:absolute;top:6px;left:6px;right:6px;display:flex;justify-content:space-between;align-items:center;z-index:2">
                        <span class="nmf-star-pill">${renderStarsRowHtml(c.stars)}</span>
                        ${c.fusedFromNames?.length ? `<span style="font-family:var(--nmf-font-mono);font-size:8.5px;padding:2px 5px;border-radius:3px;background:rgba(5,8,14,0.84);border:1px solid var(--nmf-accent);color:var(--nmf-accent)">${esc(tx('СИНТЕЗ', 'FUSION'))}</span>` : ''}
                    </div>
                    <div class="nmf-match-thumb-ov">
                        <div style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;line-height:1.2">${esc(c.name)}</div>
                        <div style="font-family:var(--nmf-font-mono);font-size:9px;color:${c.stars >= 5 ? '#f5c25b' : 'var(--nmf-accent-2)'};margin-top:2px">${esc((c.epithet || c.archetype || '').slice(0, 34))}</div>
                    </div>
                </div>
                <div style="padding:8px 9px;font-size:11.5px;line-height:1.4;color:var(--nmf-text-muted)">
                    ${esc((c.pitch || '').slice(0, 96))}${(c.pitch || '').length > 96 ? '...' : ''}
                </div>
            </div>
            <div style="padding:0 8px 8px;display:flex;flex-direction:column;gap:4px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
                    <button type="button" class="nmf-btn-secondary ${inSlot ? 'nmf-active' : ''}" style="height:26px;font-size:10px;padding:0 4px;white-space:nowrap" data-act="gacha-toggle-fusion-slot" data-id="${esc(c.id)}">
                        ${esc(inSlot ? tx('Выбрано', 'Selected') : tx('+ Алтарь', '+ Altar'))}
                    </button>
                    <button type="button" class="nmf-btn-secondary" style="height:26px;font-size:10px;padding:0 4px;white-space:nowrap" data-act="send-cand-to-blitz" data-source="gacha" data-ref="gacha:${esc(c.id)}" title="${esc(tx('Раскрыть в Блице', 'Deepen in Blitz'))}">
                        ${esc(tx('В Блиц', 'To Blitz'))}
                    </button>
                </div>
                <button type="button" class="nmf-btn-primary" style="width:100%;height:27px;font-size:10px;padding:0 4px" data-act="expand-gacha" data-idx="${idx}" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    ${esc(tx('Собрать', 'Build'))}
                </button>
                <div style="display:flex;justify-content:space-between;gap:4px">
                    ${canArt ? (isLoading
                        ? `<button type="button" class="nmf-icon-btn" style="flex:1;height:26px;font-size:10px;padding:0 4px;border-color:#ff6b86;color:#ff8fa0" data-act="stop-cand-art" data-id="${esc(c.id)}">${esc(tx('Стоп', 'Stop'))}</button>`
                        : `<button type="button" class="nmf-icon-btn" style="flex:1;height:26px;font-size:10px;padding:0 4px" data-act="gen-gacha-item-art" data-id="${esc(c.id)}">${NMF_ICONS.image} ${esc(tx('Арт', 'Art'))}</button>`) : ''}
                    ${c.fusedFromNames?.length ? `<button type="button" class="nmf-icon-btn nmf-sq" style="height:26px;width:26px" data-act="regen-altar-char" data-id="${esc(c.id)}" ${state.busy || sess.frozen ? 'disabled' : ''} title="${esc(tx('Перегенерировать героя Алтаря', 'Regenerate Altar hero'))}">${NMF_ICONS.rework}</button>` : ''}
                    <button type="button" class="nmf-icon-btn" style="height:26px;padding:0 6px;font-size:10px" data-act="sacrifice-gacha-idx" data-idx="${idx}" title="${esc(tx(`Принести карту в жертву ради +${sacGain} Молитв`, `Sacrifice card for +${sacGain} Prayers`))}">
                        ${NMF_ICONS.sacrifice}+${sacGain}
                    </button>
                    <button type="button" class="nmf-icon-btn nmf-sq" style="height:26px;width:26px" data-act="edit-cand" data-pool="gacha_collection" data-idx="${idx}" title="${esc(tx('Править', 'Edit'))}">${NMF_ICONS.editSmall}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" style="height:26px;width:26px" data-act="del-gacha" data-idx="${idx}" title="${esc(tx('Удалить', 'Delete'))}">${NMF_ICONS.trash}</button>
                </div>
            </div>
        </div>`;
        }).join('')}
    </div>`;
    })()}`;
}

function renderSavedVaultView(sess) {
    const cfg = getSettings();
    const vault = cfg.savedVault || [];

    if (vault.length === 0) {
        return `
        <div class="nmf-empty-deck">
            <div style="color:var(--nmf-accent)">${NMF_ICONS.vault}</div>
            <div style="font-family:var(--nmf-font-title);font-size:16px;font-weight:700">Хранилище пока пусто</div>
            <div style="font-size:12px;color:var(--nmf-text-muted);max-width:320px">
                В «Профиле» нажмите «В Хранилище», чтобы отложить любую готовую карточку (текст + арт) и спокойно начать новую сессию!
            </div>
        </div>`;
    }

    const sortedVault = filterAndSortGridEntries(vault, { isGacha: false, isVault: true });

    return `
    ${renderGridSortFilterBar({ isGacha: false, totalCount: vault.length, shownCount: sortedVault.length })}
    <div class="nmf-mosaic-grid">
        ${sortedVault.map(({ item: v, origIdx: idx }) => {
            const thumbUrl = safeImgSrc(resolveEntityDisplayUrl(v));
            const fSpec = resolveDisplayOrCoverSpec(v, thumbUrl, false, '');
            const pSpec = resolvePuzzleTileSpec(v, Boolean(thumbUrl));
            const tileCls = fSpec.isReal ? pSpec.cls : 'nmf-tile-square';
            return `
            <div class="nmf-match-tile ${tileCls}" style="${fSpec.isReal ? pSpec.style : ''}">
                <div>
                    <div class="nmf-match-thumb nmf-tappable-photo" data-act="open-vault-lightbox" data-idx="${idx}">
                        ${fSpec.src ? `<img src="${esc(fSpec.src)}" alt="Vault"/>` : ''}
                        <div class="nmf-match-thumb-ov">
                            <div style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;line-height:1.2">${esc(v.name || 'Без имени')}</div>
                            <div style="font-family:var(--nmf-font-mono);font-size:9px;color:var(--nmf-accent);margin-top:2px">${countWords(v.description)} слов · ${v.savedTranslation ? `Перевод: ${esc(v.savedTranslation.lang)}` : 'Готова V2'}</div>
                        </div>
                    </div>
                    <div style="padding:8px 9px;font-size:11.5px;line-height:1.4;color:var(--nmf-text-muted)">
                        ${esc((v.description || v.first_mes || '').slice(0, 96))}...
                    </div>
                </div>
                <div style="padding:0 8px 8px;display:flex;gap:4px">
                    <button type="button" class="nmf-btn-primary" style="flex:1;height:28px;font-size:10px;padding:0 5px" data-act="load-vault-to-editor" data-idx="${idx}" ${sess.frozen ? 'disabled' : ''}>В Профиль</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="export-vault-png" data-idx="${idx}" title="Скачать PNG V2">${NMF_ICONS.download}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="del-vault-item" data-idx="${idx}" title="Удалить">${NMF_ICONS.trash}</button>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

function renderMatchesTab(sess) {
    const cfg = getSettings();
    const liked = sess.tinder.liked || [];
    const gachaCol = sess.gacha?.collection || [];
    const vault = cfg.savedVault || [];
    const passed = sess.tinder.passed || [];
    const sub = state.matchesSubTab;

    const topNav = `
    <div class="nmf-seg-bar" style="grid-template-columns:repeat(4,1fr)">
        <button type="button" class="nmf-seg-btn ${sub === 'liked' ? 'nmf-active' : ''}" style="font-size:10.5px;padding:0 3px" data-act="matches-sub" data-sub="liked">Мэтчи (${liked.length})</button>
        <button type="button" class="nmf-seg-btn ${sub === 'gacha_collection' ? 'nmf-active' : ''}" style="font-size:10.5px;padding:0 3px" data-act="matches-sub" data-sub="gacha_collection">Гача (${gachaCol.length})</button>
        <button type="button" class="nmf-seg-btn ${sub === 'vault' ? 'nmf-active' : ''}" style="font-size:10.5px;padding:0 3px" data-act="matches-sub" data-sub="vault">Хранилище (${vault.length})</button>
        <button type="button" class="nmf-seg-btn ${sub === 'passed' ? 'nmf-active' : ''}" style="font-size:10.5px;padding:0 3px" data-act="matches-sub" data-sub="passed">Мимо (${passed.length})</button>
    </div>`;

    if (sub === 'gacha_collection') return `${topNav}${renderGachaCollectionView(sess)}`;
    if (sub === 'vault') return `${topNav}${renderSavedVaultView(sess)}`;

    const isPassedView = sub === 'passed';
    const items = isPassedView ? passed : liked;
    const sortedItems = filterAndSortGridEntries(items, { isGacha: false });

    return `
    ${topNav}
    ${items.length === 0 ? `
    <div class="nmf-empty-deck">
        <div style="color:var(--nmf-accent)">${isPassedView ? NMF_ICONS.undo : NMF_ICONS.heart}</div>
        <div style="font-family:var(--nmf-font-title);font-size:16px;font-weight:700">${isPassedView ? 'В архиве «Мимо» пусто' : 'Пока нет сохранённых Мэтчей'}</div>
    </div>` : `
    ${renderGridSortFilterBar({ isGacha: false, totalCount: items.length, shownCount: sortedItems.length })}
    <div class="nmf-mosaic-grid">
        ${sortedItems.map(({ item: c, origIdx: idx }) => {
            const thumbUrl = safeImgSrc(resolveEntityDisplayUrl(c));
            const isLoading = state.loadingArtIds.has(c.id);
            const fSpec = resolveDisplayOrCoverSpec(c, thumbUrl, isLoading, state.artErrors.get(c.id) || '');
            const pSpec = resolvePuzzleTileSpec(c, Boolean(thumbUrl));
            const tileCls = fSpec.isReal ? pSpec.cls : 'nmf-tile-square';
            const sealedArt = fSpec.isReal && isArtWaitingToOpen(c.id);
            return `
        <div class="nmf-match-tile ${tileCls}" style="${fSpec.isReal ? pSpec.style : ''}">
            <div class="nmf-match-click-zone" data-act="${sealedArt ? '' : 'open-cand-dossier'}" data-pool="${isPassedView ? 'passed' : 'liked'}" data-idx="${idx}" title="${esc(tx('Открыть полную анкету персонажа', 'Open full character dossier'))}">
                <div class="nmf-match-thumb nmf-tappable-photo">
                    ${fSpec.src ? `<img class="${fSpec.isReal ? consumeFreshArtClass(c.id).trim() : ''}" src="${esc(fSpec.src)}" alt="Card"/>` : ''}
                    ${fSpec.isReal ? renderSealedArtVeilHtml(c.id) : ''}
                    <div class="nmf-match-thumb-ov">
                        <div style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;line-height:1.2">${esc(c.name)}</div>
                        <div style="font-family:var(--nmf-font-mono);font-size:9px;color:var(--nmf-accent-2);margin-top:2px">${esc((c.archetype || '').slice(0, 34))}</div>
                    </div>
                </div>
                <div style="padding:8px 9px;font-size:11.5px;line-height:1.4;color:var(--nmf-text-muted)">
                    ${esc((c.pitch || '').slice(0, 100))}${(c.pitch || '').length > 100 ? '...' : ''}
                </div>
            </div>
            <div style="padding:0 8px 8px;display:flex;flex-wrap:wrap;gap:4px">
                <button type="button" class="nmf-btn-primary" style="flex:1;height:28px;font-size:10px;padding:0 6px" data-act="${isPassedView ? 'expand-passed' : 'expand-liked'}" data-idx="${idx}" ${state.busy || sess.frozen ? 'disabled' : ''}>Собрать</button>
                ${!isPassedView ? `<button type="button" class="nmf-btn-secondary" style="height:28px;font-size:10px;padding:0 6px" data-act="send-cand-to-blitz" data-source="tinder" data-ref="liked:${esc(c.id)}" title="Раскрыть этого героя в Блице">В Блиц</button>` : ''}
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="edit-cand" data-pool="${isPassedView ? 'passed' : 'liked'}" data-idx="${idx}">${NMF_ICONS.editSmall}</button>
                ${isPassedView ? `<button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="restore-passed-to-deck" data-idx="${idx}">${NMF_ICONS.undo}</button>` : ''}
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="${isPassedView ? 'del-passed' : 'del-liked'}" data-idx="${idx}">${NMF_ICONS.trash}</button>
            </div>
        </div>`;
        }).join('')}
    </div>`}`;
}

// Shared clean Question Card renderer (checkable option rows that do NOT overwrite custom input!)
function renderCheckableQuestionCard(q, idx, { skipAct, regenAct, optAct, ansAttr, disabled = false }) {
    const picked = Array.isArray(q.selectedOptions) ? q.selectedOptions : [];
    const hasDecision = !q.skipped && (picked.length > 0 || Boolean(String(q.answer || '').trim()));
    return `
    <div class="nmf-q-card ${q.skipped ? 'nmf-q-skipped' : ''} ${hasDecision ? 'nmf-q-answered' : ''}">
        <div class="nmf-q-topbar">
            <span class="nmf-q-num">ВОПРОС #${idx + 1}${picked.length ? ` · ОТМЕЧЕНО: ${picked.length}` : ''}</span>
            <div class="nmf-btn-row">
                <button type="button" class="nmf-chip ${q.skipped ? 'nmf-on' : ''}" data-act="${skipAct}" data-idx="${idx}">${q.skipped ? 'Пропущен' : 'Скип'}</button>
                <button type="button" class="nmf-chip" data-act="${regenAct}" data-idx="${idx}" ${disabled ? 'disabled' : ''}>Другой</button>
            </div>
        </div>
        <div class="nmf-q-title">${esc(q.question)}</div>
        ${(!q.skipped && Array.isArray(q.options) && q.options.length > 0) ? `
        <div class="nmf-q-opt-list">
            ${q.options.map((opt, optIdx) => {
                const isChecked = picked.includes(opt);
                return `
                <button type="button" class="nmf-q-opt-item ${isChecked ? 'nmf-checked' : ''}" data-act="${optAct}" data-idx="${idx}" data-opt-idx="${optIdx}">
                    <span class="nmf-q-check-box">${isChecked ? NMF_ICONS.check : ''}</span>
                    <span style="flex:1">${esc(opt)}</span>
                </button>`;
            }).join('')}
        </div>` : ''}
        ${!q.skipped ? `<input type="text" class="nmf-input" ${ansAttr}="${idx}" value="${esc(q.answer)}" placeholder="Свой ответ или дополнение к отмеченным вариантам..." ${disabled ? 'disabled' : ''}/>` : ''}
    </div>`;
}

// 3. BLITZ QUIZ SCREEN (CLEAN QUESTION CARDS + REAL TINDER/GACHA CANDIDATE SELECTION)
function renderBlitzTab(sess) {
    const bz = sess.blitz;
    const qTargetCount = Number(bz.questionCount) || 10;
    const answeredCount = bz.questions.filter((q) => Boolean(formatQuestionUserDecision(q))).length;
    const worldMode = isWorldOrRpgMode(sess.intake);
    const candidatesList = listBlitzSelectableCandidates(sess);
    const seedHit = resolveBlitzSeedCandidate(sess);
    const seedEntity = seedHit?.entity || null;
    const seedThumb = seedEntity ? safeImgSrc(resolveEntityDisplayUrl(seedEntity)) : '';
    const sourceEnabled = (bz.useTinderContext !== false) || Boolean(bz.useGachaContext);
    const curSelRef = bz.selectedCandidateRef === '__none__' ? '__none__' : (seedHit?.ref || '__none__');

    return `
    <div class="nmf-panel">
        ${sourceEnabled ? `
        <div class="nmf-field">
            <label class="nmf-label">
                <span>Герой из Тиндера / Гачи для раскрытия в Блице</span>
                ${helpBtn('isolation')}
            </label>
            ${candidatesList.length > 0 ? `
            <select class="nmf-select" data-blitz-cand="1" ${sess.frozen ? 'disabled' : ''}>
                ${candidatesList.map((item) => `
                    <option value="${esc(item.ref)}" ${curSelRef === item.ref ? 'selected' : ''}>
                        [${esc(item.badge)}] ${esc(item.entity.name)}${item.entity.archetype || item.entity.epithet ? ` — ${esc((item.entity.archetype || item.entity.epithet).slice(0, 32))}` : ''}
                    </option>
                `).join('')}
                <option value="__none__" ${curSelRef === '__none__' ? 'selected' : ''}>— Без карточки (создать нового героя с нуля) —</option>
            </select>
            ${seedEntity ? `
            <div class="nmf-blitz-seed-card">
                <div class="nmf-blitz-seed-ava">
                    ${seedThumb ? `<img src="${esc(seedThumb)}" alt="${esc(seedEntity.name)}"/>` : NMF_ICONS.flame}
                </div>
                <div style="min-width:0">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                        <span style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;color:var(--nmf-text)">${esc(seedEntity.name)}</span>
                        <span style="font-family:var(--nmf-font-mono);font-size:9.5px;padding:1px 6px;border-radius:3px;border:1px solid var(--nmf-accent);color:var(--nmf-accent)">${esc(seedHit.badge)}</span>
                    </div>
                    <div style="font-size:11.5px;color:var(--nmf-text-muted);line-height:1.35;margin-top:2px">
                        ${esc((seedEntity.pitch || seedEntity.archetype || seedEntity.epithet || '').slice(0, 110))}${(seedEntity.pitch || '').length > 110 ? '...' : ''}
                    </div>
                </div>
            </div>` : ''}` : `
            <div class="nmf-warn-box" style="font-size:11.5px">
                ${NMF_ICONS.flame}
                <span>В выбранном источнике пока нет анкет — вопросы создадут героя с нуля, либо сначала подберите кандидата в «Свайпах» / «Гаче» и нажмите «В Блиц».</span>
            </div>`}
        </div>` : ''}

        <div class="nmf-field">
            <label class="nmf-label"><span>${seedEntity ? `Уточняющий фокус вопросов для «${esc(seedEntity.name)}» (по желанию)` : (worldMode ? 'Тема Блиц-конструктора мира / РПГ' : 'Тема Блиц-анкеты персонажа')}</span>${!sourceEnabled ? helpBtn('isolation') : ''}</label>
            <input type="text" class="nmf-input" data-blitz="topic" value="${esc(bz.topic)}" placeholder="${seedEntity ? `Оставьте пустым для полного раскрытия «${esc(seedEntity.name)}» или укажите акцент...` : (worldMode ? 'Например: Постапокалипсис с мутациями и фракциями...' : 'Например: Опасный мафиози, сосед по комнате, рыцарь...')}" ${sess.frozen ? 'disabled' : ''}/>
        </div>

        <details class="nmf-spoiler">
            <summary><span>Настройки Блица (${qTargetCount} вопр. · Тиндер: ${bz.useTinderContext !== false ? 'ДА' : 'НЕТ'} · Гача: ${bz.useGachaContext ? 'ДА' : 'НЕТ'})</span>${NMF_ICONS.chevronDown}</summary>
            <div class="nmf-spoiler-body">
                <div class="nmf-field">
                    <label class="nmf-label">Количество вопросов</label>
                    <div class="nmf-chip-wrap">
                        ${BLITZ_COUNT_OPTIONS.map((n) => `
                            <button type="button" class="nmf-chip ${qTargetCount === n ? 'nmf-on' : ''}" data-act="set-blitz-count" data-count="${n}" ${sess.frozen ? 'disabled' : ''}>${n} вопр.</button>
                        `).join('')}
                    </div>
                </div>
                <div class="nmf-toggle-line" data-act="toggle-blitz-choices">
                    <span style="font-size:12px;font-weight:600">Предлагать варианты ответов с галочками</span>
                    <div class="nmf-switch ${bz.includeChoices ? 'nmf-on' : ''}"></div>
                </div>
                <div class="nmf-toggle-line" data-act="toggle-blitz-tinder-ctx">
                    <span style="font-size:12px;font-weight:600">Брать анкету из Тиндера (по умолч. ДА)</span>
                    <div class="nmf-switch ${bz.useTinderContext !== false ? 'nmf-on' : ''}"></div>
                </div>
                <div class="nmf-toggle-line" data-act="toggle-blitz-gacha-ctx">
                    <span style="font-size:12px;font-weight:600">Брать анкету из Гачи (по умолч. НЕТ)</span>
                    <div class="nmf-switch ${bz.useGachaContext ? 'nmf-on' : ''}"></div>
                </div>
            </div>
        </details>

        <button type="button" class="nmf-btn-primary" data-act="gen-blitz-10" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.blitz} ${bz.questions.length ? `Пересоздать вопросы (${qTargetCount} шт.)` : (seedEntity ? `Задать вопросы по «${esc(seedEntity.name)}» (${qTargetCount} шт.)` : `Сгенерировать вопросы (${qTargetCount} шт.)`)}
        </button>
    </div>

    ${bz.questions.length > 0 ? `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 2px">
        <span class="nmf-label" style="color:var(--nmf-accent)">Отвечено вопросов: ${answeredCount} / ${bz.questions.length}</span>
    </div>
    ${bz.questions.map((q, idx) => renderCheckableQuestionCard(q, idx, {
        skipAct: 'blitz-skip',
        regenAct: 'blitz-regen-one',
        optAct: 'blitz-pick-opt',
        ansAttr: 'data-blitz-ans',
        disabled: state.busy || sess.frozen,
    })).join('')}

    <button type="button" class="nmf-btn-primary" style="width:100%" data-act="build-from-blitz" ${state.busy || sess.frozen ? 'disabled' : ''}>
        ${NMF_ICONS.spark} ${seedEntity ? `Собрать карточку «${esc(seedEntity.name)}» по ответам` : 'Собрать карточку в слот «Блиц»'}
    </button>` : ''}`;
}

// 4. CREATE FROM IDEA OR MULTIVERSE AU SHIFT (100% ISOLATED FROM TINDER & GACHA)
function renderCreateTab(sess) {
    const mode = sess.architect.subMode || 'idea';
    const rw = sess.rework;
    const worldMode = isWorldOrRpgMode(sess.intake);

    return `
    <div class="nmf-seg-bar">
        <button type="button" class="nmf-seg-btn ${mode === 'idea' ? 'nmf-active' : ''}" data-act="create-submode" data-sub="idea">
            ${NMF_ICONS.architect} Из задумки
        </button>
        <button type="button" class="nmf-seg-btn ${mode === 'rework' ? 'nmf-active' : ''}" data-act="create-submode" data-sub="rework">
            ${NMF_ICONS.rework} Чар в другой мир (AU)
        </button>
    </div>

    ${mode === 'idea' ? `
    <div class="nmf-panel">
        <div class="nmf-field">
            <label class="nmf-label"><span>Режим сборки из задумки</span>${helpBtn('isolation')}</label>
            <div class="nmf-seg-bar">
                <button type="button" class="nmf-seg-btn ${sess.architect.useIntake !== false ? 'nmf-active' : ''}" data-act="set-arch-intake" data-val="1">
                    Задумка + Анкета
                </button>
                <button type="button" class="nmf-seg-btn ${sess.architect.useIntake === false ? 'nmf-active' : ''}" data-act="set-arch-intake" data-val="0">
                    Только задумка
                </button>
            </div>
            <div style="margin-top:4px;font-size:11px;color:var(--nmf-text-muted)">
                ${esc(sess.architect.useIntake !== false
                    ? tx('Усиливается параметрами вашей Главной Анкеты со Стартового экрана (даже если она пустая, сборка сработает чисто).', 'Enhanced by your Main Questionnaire from the Start Screen (works cleanly even if left blank).')
                    : tx('Чистый лист: ИИ возьмёт 100% сюжета только из текста ниже (без фандомов и тропов Анкеты).', 'Clean slate: AI uses 100% only your text below (ignoring Main Questionnaire).'))}
            </div>
        </div>
        <div class="nmf-field">
            <label class="nmf-label">Шаблон структуры карточки</label>
            <select class="nmf-select" data-intake="cardFormat" ${sess.frozen ? 'disabled' : ''}>
                ${CARD_FORMATS.map((f) => `<option value="${f.id}" ${sess.intake.cardFormat === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
            </select>
        </div>
        <div class="nmf-field">
            <label class="nmf-label"><span>${worldMode && sess.architect.useIntake !== false ? 'Опишите мир, систему или артефакт' : 'Опишите задумку своими словами'}</span></label>
            <textarea class="nmf-textarea" style="min-height:145px" data-arch="freeConcept" placeholder="${sess.architect.useIntake !== false ? 'Добавьте ключевую задумку, внешность, характер и завязку — остальное дополнит Анкета сессии...' : 'Полное свободное описание героя или мира с нуля (без привязки к Анкете)...'}" ${sess.frozen ? 'disabled' : ''}>${esc(sess.architect.freeConcept)}</textarea>
        </div>
        <button type="button" class="nmf-btn-primary" style="width:100%" data-act="build-from-architect" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.spark} ${sess.architect.useIntake !== false ? 'Собрать (Задумка + Анкета)' : 'Собрать только по задумке'}
        </button>
    </div>` : `
    <div class="nmf-panel">
        <div class="nmf-field">
            <label class="nmf-label">
                <span>Исходная карточка из Таверны</span>
                <button type="button" class="nmf-chip" data-act="refresh-roster">Обновить</button>
            </label>
            <select class="nmf-select" data-rework="sourceAvatar" ${sess.frozen ? 'disabled' : ''}>
                <option value="">— Выберите карточку (${state.rosterChars.length}) —</option>
                ${state.rosterChars.map((c) => `<option value="${esc(c.avatar)}" ${rw.sourceAvatar === c.avatar ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
        </div>

        <div class="nmf-grid-2-compact">
            <div class="nmf-field">
                <label class="nmf-label">Новая вселенная / эпоха</label>
                <input type="text" class="nmf-input" data-rework="targetSettingEra" value="${esc(rw.targetSettingEra)}" placeholder="Мафия 1940-х / Киберпанк..." ${sess.frozen ? 'disabled' : ''}/>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">Атмосфера встречи</label>
                <input type="text" class="nmf-input" data-rework="moodTone" value="${esc(rw.moodTone)}" placeholder="Дождь, закрытый клуб..." ${sess.frozen ? 'disabled' : ''}/>
            </div>
        </div>

        <details class="nmf-spoiler">
            <summary><span>Режим переноса, завязка и уточняющий опрос AU</span>${NMF_ICONS.chevronDown}</summary>
            <div class="nmf-spoiler-body">
                <div class="nmf-field">
                    <label class="nmf-label">Режим адаптации</label>
                    <select class="nmf-select" data-rework="reworkMode" ${sess.frozen ? 'disabled' : ''}>
                        <option value="au_shift" ${rw.reworkMode === 'au_shift' ? 'selected' : ''}>Перевод всех реалий под новую эпоху + сохранить верстку</option>
                        <option value="full_rebuild" ${(rw.reworkMode === 'full_rebuild' || rw.reworkMode === 'full_rework') ? 'selected' : ''}>Полная пересборка под шаблон Анкеты</option>
                    </select>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Идея первой встречи (опционально)</label>
                    <textarea class="nmf-textarea" style="min-height:56px" data-rework="encounterIdea" placeholder="Короткая завязка первого сообщения..." ${sess.frozen ? 'disabled' : ''}>${esc(rw.encounterIdea)}</textarea>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
                    <div class="nmf-chip-wrap">
                        ${AU_QUESTION_COUNT_OPTIONS.map((n) => `
                            <button type="button" class="nmf-chip ${(Number(rw.questionCount) || 5) === n ? 'nmf-on' : ''}" data-act="set-au-q-count" data-count="${n}" ${sess.frozen ? 'disabled' : ''}>${n} вопр.</button>
                        `).join('')}
                    </div>
                    <button type="button" class="nmf-btn-secondary" style="height:30px;font-size:11px" data-act="gen-au-questions" ${state.busy || sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.blitz} Вопросы по переносу
                    </button>
                </div>
            </div>
        </details>

        ${Array.isArray(rw.questions) && rw.questions.length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:7px">
            <div style="display:flex;align-items:center;justify-content:space-between">
                <span class="nmf-label" style="color:var(--nmf-accent)">Решений AU: ${rw.questions.filter((q) => Boolean(formatQuestionUserDecision(q))).length} / ${rw.questions.length}</span>
                <button type="button" class="nmf-chip" data-act="clear-au-questions">Очистить опрос</button>
            </div>
            ${rw.questions.map((q, idx) => renderCheckableQuestionCard(q, idx, {
                skipAct: 'au-q-skip',
                regenAct: 'au-q-regen-one',
                optAct: 'au-q-pick-opt',
                ansAttr: 'data-au-ans',
                disabled: state.busy || sess.frozen,
            })).join('')}
        </div>` : ''}

        <div class="nmf-btn-row">
            <button type="button" class="nmf-btn-secondary" data-act="load-char-to-editor" ${state.busy || sess.frozen ? 'disabled' : ''}>Открыть в Профиле</button>
            <button type="button" class="nmf-btn-primary" style="flex:1" data-act="run-rework" ${state.busy || sess.frozen ? 'disabled' : ''}>${NMF_ICONS.rework} Перенести в новый мир</button>
        </div>
    </div>`}`;
}

// 5. PROFILE EDITOR (5 INDEPENDENT METHOD SLOTS + TRANSLATE AI + SAVE TO VAULT)
function renderEditorTab(sess) {
    syncSessionActiveSlot(sess);
    const c = sess.card;
    const cfg = getSettings();
    const canArt = detectImageExtensions().hasAny && cfg.imageSource !== 'off';
    const hasCodex = detectPocketCodex();
    const totalWords = countWords(c.description) + countWords(c.first_mes) + countWords(c.personality) + countWords(c.scenario) + countWords(c.system_prompt);
    const approxTokens = Math.round(totalWords * 1.38);
    const cssRatio = cfg.imageAspectRatio === 'native' ? '1 / 1' : (cfg.imageAspectRatio || '1:1').replace(':', ' / ');
    const canOverwriteOriginal = Boolean(c.sourceAvatarId && c.sourceLoadedFromTavern);
    const cardAvatarUrl = resolveEntityDisplayUrl(c);
    const latestBackupForCard = canOverwriteOriginal
        ? state.recentBackups.find((b) => b.avatarFileName === c.sourceAvatarId)
        : state.recentBackups[0] || null;

    const slotStripHtml = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <div class="nmf-slot-strip" style="flex:1">
            ${CARD_SLOT_DEFS.map((sl) => {
                const slotCard = sess.cardSlots?.[sl.id];
                const hasData = Boolean(slotCard && (slotCard.name || slotCard.description || slotCard.first_mes));
                return `
                <button type="button" class="nmf-slot-btn ${sess.activeCardSlot === sl.id ? 'nmf-active' : ''}" data-act="switch-card-slot" data-slot="${sl.id}">
                    <span>${esc(sl.label)}</span>
                    ${hasData ? `<span class="nmf-slot-dot" title="${esc(slotCard.name || 'Заполнено')}"></span>` : ''}
                </button>`;
            }).join('')}
        </div>
        ${helpBtn('vault_slots')}
    </div>`;

    let subBody = '';
    if (state.editorSubTab === 'main') {
        subBody = `
        <div class="nmf-panel">
            <div style="display:grid;grid-template-columns:104px minmax(0,1fr);gap:11px;align-items:start">
                ${(() => {
                    const edArtKey = sess.id + ':' + sess.activeCardSlot;
                    const edSpec = resolveDisplayOrCoverSpec(c, cardAvatarUrl, state.editorArtLoading, state.editorArtError);
                    const sealedEd = edSpec.isReal && isArtWaitingToOpen(edArtKey);
                    const hasManualCrop = Boolean(c.croppedAspect);
                    const boxStyle = (edSpec.isReal && !hasManualCrop)
                        ? 'position:relative;border:1px solid var(--nmf-border-active);border-radius:var(--nmf-radius);background:var(--nmf-bg);overflow:hidden;display:block'
                        : `position:relative;aspect-ratio:${hasManualCrop ? c.croppedAspect.replace(':', ' / ') : '1 / 1'};border:1px solid var(--nmf-border-active);border-radius:var(--nmf-radius);background:var(--nmf-bg);overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--nmf-text-muted);text-align:center`;
                    return `
                <div class="${(edSpec.isReal && !sealedEd) ? 'nmf-tappable-photo' : ''}" data-act="${(edSpec.isReal && !sealedEd) ? 'open-editor-lightbox' : ''}" style="${boxStyle}">
                    ${edSpec.src
                        ? `<img class="${edSpec.isReal ? consumeFreshArtClass(edArtKey).trim() : ''}" src="${esc(edSpec.src)}" style="${(edSpec.isReal && !hasManualCrop) ? 'width:100%;height:auto;display:block' : 'width:100%;height:100%;object-fit:cover;object-position:50% 50%'}" alt="Avatar"/>
                           ${edSpec.isReal ? renderSealedArtVeilHtml(edArtKey) : ''}
                           ${(edSpec.isReal && !sealedEd) ? `<span style="position:absolute;right:4px;bottom:4px;padding:2px 4px;border-radius:3px;background:rgba(5,7,12,0.82);border:1px solid var(--nmf-border-active);color:var(--nmf-accent);display:inline-flex">${NMF_ICONS.zoom}</span>` : ''}`
                        : `<span style="font-family:var(--nmf-font-mono);font-size:9.5px;color:var(--nmf-accent)">${esc(tx('Рендер...', 'Rendering...'))}</span>`}
                </div>`;
                })()}
                <div style="display:flex;flex-direction:column;gap:7px;min-width:0">
                    <div class="nmf-field">
                        <label class="nmf-label">Имя / Название карточки</label>
                        <input type="text" class="nmf-input" data-card="name" value="${esc(c.name)}" placeholder="Название карточки..." ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                    <div class="nmf-btn-row">
                        <label class="nmf-btn-secondary" style="height:29px;font-size:10.5px;cursor:pointer">
                            ${NMF_ICONS.upload} Фото
                            <input type="file" id="nmf-avatar-upload" accept="image/*" style="display:none" ${sess.frozen ? 'disabled' : ''}/>
                        </label>
                        ${cardAvatarUrl ? `<button type="button" class="nmf-btn-secondary" style="height:29px;font-size:10.5px" data-act="open-crop-editor" title="Интерактивно кадрировать арт карточки">${NMF_ICONS.crop} Кадр</button>` : ''}
                        <button type="button" class="nmf-btn-secondary" style="height:29px;font-size:10.5px" data-act="open-translate-modal" title="Перевести карточку на другой язык для чтения или сохранения">
                            ${NMF_ICONS.translate} ${c.savedTranslation ? `Перевод (${esc(c.savedTranslation.lang)})` : 'Перевод ИИ'}
                        </button>
                        ${cardAvatarUrl ? `<button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:29px;font-size:10.5px" data-act="clear-avatar">Сброс</button>` : ''}
                    </div>
                    ${canArt ? `
                    <div style="display:flex;gap:5px">
                        <input type="text" class="nmf-input" data-card="imagePrompt" value="${esc(c.imagePrompt)}" placeholder="SCENE: ... (промпт арта EN)" ${sess.frozen ? 'disabled' : ''}/>
                        ${state.editorArtLoading
                            ? `<button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:36px;flex-shrink:0" data-act="stop-editor-art">Стоп</button>`
                            : `<button type="button" class="nmf-btn-secondary" style="height:36px;flex-shrink:0" data-act="gen-editor-art">Арт</button>`}
                    </div>
                    ${renderPromptRefineBox('editor', state.busy || state.editorArtLoading || sess.frozen)}
                    ${(!state.editorArtLoading && state.editorArtError) ? `
                    <div class="nmf-warn-box" style="border-color:#ff5c77;font-size:10.5px;padding:6px 8px">
                        ${NMF_ICONS.warn}
                        <span><strong>Сбой арта:</strong> ${esc(state.editorArtError)}</span>
                    </div>` : ''}` : ''}
                </div>
            </div>

            <div class="nmf-field">
                <label class="nmf-label"><span>Описание (Description)</span><span>${countWords(c.description)} слов</span></label>
                <textarea class="nmf-textarea" style="min-height:185px" data-card="description" placeholder="Характер, внешность, законы мира, детали..." ${sess.frozen ? 'disabled' : ''}>${esc(c.description)}</textarea>
            </div>
        </div>`;
    } else if (state.editorSubTab === 'greet') {
        subBody = `
        <div class="nmf-panel">
            <div class="nmf-field">
                <label class="nmf-label"><span>Первое сообщение (First Message)</span><span>${countWords(c.first_mes)} слов</span></label>
                <textarea class="nmf-textarea" style="min-height:185px" data-card="first_mes" placeholder="Стартовая сцена..." ${sess.frozen ? 'disabled' : ''}>${esc(c.first_mes)}</textarea>
            </div>
            <details class="nmf-spoiler" ${(c.alternate_greetings || []).length > 0 ? 'open' : ''}>
                <summary><span>Дополнительные приветствия (${(c.alternate_greetings || []).length})</span>${NMF_ICONS.chevronDown}</summary>
                <div class="nmf-spoiler-body">
                    <button type="button" class="nmf-btn-secondary" style="height:30px;font-size:11px" data-act="add-alt-greeting">+ Добавить сцену</button>
                    ${(c.alternate_greetings || []).map((ag, idx) => `
                    <div style="display:flex;gap:6px;align-items:flex-start">
                        <textarea class="nmf-textarea" style="min-height:80px;flex:1" data-alt-idx="${idx}" placeholder="Вариант сцены #${idx + 2}...">${esc(ag)}</textarea>
                        <button type="button" class="nmf-icon-btn nmf-sq" data-act="del-alt-greeting" data-idx="${idx}">${NMF_ICONS.trash}</button>
                    </div>`).join('')}
                </div>
            </details>
        </div>`;
    } else {
        subBody = `
        <div class="nmf-panel">
            <div class="nmf-grid-2-compact">
                <div class="nmf-field">
                    <label class="nmf-label"><span>Лорбук</span><button type="button" class="nmf-chip" data-act="refresh-roster">Обн.</button></label>
                    <select class="nmf-select" data-card="world">
                        <option value="">— Без Лорбука —</option>
                        ${state.worldNames.map((w) => `<option value="${esc(w)}" ${c.world === w ? 'selected' : ''}>${esc(w)}</option>`).join('')}
                    </select>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Pocket Codex</label>
                    ${hasCodex
                        ? `<button type="button" class="nmf-btn-secondary" style="height:36px;width:100%" data-act="open-codex-forge">${NMF_ICONS.book} Кодекс</button>`
                        : `<div style="height:36px;display:flex;align-items:center;padding:0 8px;border:1px dashed var(--nmf-border);border-radius:var(--nmf-radius);font-size:11px;color:var(--nmf-text-muted)">Выберите слева</div>`}
                </div>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">Заметки для игрока (Creator Notes — на вашем языке)</label>
                <textarea class="nmf-textarea" style="min-height:60px" data-card="creator_notes">${esc(c.creator_notes)}</textarea>
            </div>
            <details class="nmf-spoiler" open>
                <summary><span>Характер, Сценарий, Теги и Примеры речи</span>${NMF_ICONS.chevronDown}</summary>
                <div class="nmf-spoiler-body">
                    <div class="nmf-grid-2">
                        <div class="nmf-field"><label class="nmf-label">Personality</label><textarea class="nmf-textarea" style="min-height:58px" data-card="personality">${esc(c.personality)}</textarea></div>
                        <div class="nmf-field"><label class="nmf-label">Scenario</label><textarea class="nmf-textarea" style="min-height:58px" data-card="scenario">${esc(c.scenario)}</textarea></div>
                    </div>
                    <div class="nmf-grid-2-compact">
                        <div class="nmf-field"><label class="nmf-label">Теги</label><input type="text" class="nmf-input" data-card="tags" value="${esc(c.tags)}"/></div>
                        <div class="nmf-field"><label class="nmf-label">Автор</label><input type="text" class="nmf-input" data-card="creator" value="${esc(c.creator)}"/></div>
                    </div>
                    <div class="nmf-field"><label class="nmf-label">Примеры диалогов (mes_example)</label><textarea class="nmf-textarea" style="min-height:58px" data-card="mes_example">${esc(c.mes_example)}</textarea></div>
                </div>
            </details>
            <details class="nmf-spoiler" ${(c.system_prompt || c.post_history_instructions) ? 'open' : ''}>
                <summary><span>System Prompt и Post-History (для РПГ / Миров)</span>${NMF_ICONS.chevronDown}</summary>
                <div class="nmf-spoiler-body">
                    <div class="nmf-field"><label class="nmf-label">System Prompt</label><textarea class="nmf-textarea" style="min-height:56px" data-card="system_prompt">${esc(c.system_prompt)}</textarea></div>
                    <div class="nmf-field"><label class="nmf-label">Post-History Instructions</label><textarea class="nmf-textarea" style="min-height:56px" data-card="post_history_instructions">${esc(c.post_history_instructions)}</textarea></div>
                </div>
            </details>
        </div>`;
    }

    return `
    ${slotStripHtml}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <span class="nmf-label" style="color:var(--nmf-accent)">Слот: ${esc(CARD_SLOT_DEFS.find((d) => d.id === sess.activeCardSlot)?.label || 'Профиль')}${canOverwriteOriginal ? ` · ${esc(c.sourceAvatarId)}` : ''}</span>
        <span style="font-family:var(--nmf-font-mono);font-size:10.5px;color:var(--nmf-text-muted)">${totalWords} слов (~${approxTokens} ток.)</span>
    </div>

    <div class="nmf-seg-bar nmf-seg-3">
        <button type="button" class="nmf-seg-btn ${state.editorSubTab === 'main' ? 'nmf-active' : ''}" data-act="editor-sub" data-sub="main">1. Описание</button>
        <button type="button" class="nmf-seg-btn ${state.editorSubTab === 'greet' ? 'nmf-active' : ''}" data-act="editor-sub" data-sub="greet">2. Сцена</button>
        <button type="button" class="nmf-seg-btn ${state.editorSubTab === 'meta' ? 'nmf-active' : ''}" data-act="editor-sub" data-sub="meta">3. Детали и Лор</button>
    </div>

    ${subBody}

    ${state.lastOverwriteAlert ? `
    <div class="nmf-warn-box" style="border-color:#ff5c77;flex-direction:column;align-items:stretch;gap:7px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
            <span><strong>[${esc(state.lastOverwriteAlert.code || 'SAVE_ERROR')}]</strong> ${esc(state.lastOverwriteAlert.message)}</span>
            <button type="button" class="nmf-chip" data-act="dismiss-overwrite-alert">Скрыть</button>
        </div>
        <div class="nmf-btn-row">
            ${state.lastOverwriteAlert.backupId ? (state.lastOverwriteAlert.restoreConflictWarning ? `
            <button type="button" class="nmf-btn-primary nmf-btn-danger" style="height:28px;font-size:11px" data-act="force-restore-card-backup" data-bid="${esc(state.lastOverwriteAlert.backupId)}" ${state.busy ? 'disabled' : ''}>Принудительно восстановить</button>` : `
            <button type="button" class="nmf-btn-primary" style="height:28px;font-size:11px" data-act="restore-card-backup" data-bid="${esc(state.lastOverwriteAlert.backupId)}" data-ehash="${esc(state.lastOverwriteAlert.observedSnapshotHash || '')}" ${state.busy ? 'disabled' : ''}>Восстановить из бэкапа</button>`) : ''}
            ${state.lastOverwriteAlert.backupId ? `<button type="button" class="nmf-btn-secondary" style="height:28px;font-size:11px" data-act="download-card-backup" data-bid="${esc(state.lastOverwriteAlert.backupId)}">${NMF_ICONS.download} Бэкап PNG</button>` : ''}
        </div>
    </div>` : ''}

    <div class="nmf-panel nmf-panel-sub">
        <div class="nmf-btn-row">
            <button type="button" class="nmf-btn-primary" style="flex:1" data-act="save-to-tavern-new" ${state.busy ? 'disabled' : ''}>
                ${NMF_ICONS.save} В Таверну (новая)
            </button>
            <button type="button" class="nmf-btn-secondary" data-act="save-card-to-vault" title="Отложить карточку с артом в общее Хранилище">
                ${NMF_ICONS.vault} В Хранилище
            </button>
            ${canOverwriteOriginal ? `<button type="button" class="nmf-btn-secondary" data-act="save-to-tavern-overwrite" ${state.busy ? 'disabled' : ''}>Обновить оригинал</button>` : ''}
        </div>
        <div class="nmf-btn-row" style="margin-top:2px">
            <button type="button" class="nmf-btn-secondary" style="flex:1;height:30px;font-size:11px" data-act="export-png">${NMF_ICONS.download} PNG</button>
            <button type="button" class="nmf-btn-secondary" style="flex:1;height:30px;font-size:11px" data-act="export-json">JSON</button>
            <label class="nmf-btn-secondary" style="flex:1;height:30px;font-size:11px;cursor:pointer">
                Импорт
                <input type="file" id="nmf-json-import" accept=".json,application/json" style="display:none"/>
            </label>
        </div>
        ${latestBackupForCard ? `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:4px;padding-top:6px;border-top:1px dashed var(--nmf-border);font-size:11px;color:var(--nmf-text-muted)">
            <span>Бэкап: <strong>${esc(latestBackupForCard.characterName || latestBackupForCard.avatarFileName)}</strong></span>
            <div style="display:flex;gap:5px">
                <button type="button" class="nmf-chip" data-act="restore-card-backup" data-bid="${esc(latestBackupForCard.id)}" data-ehash="${esc(c.sourceSnapshotHash || '')}">Откатить</button>
                <button type="button" class="nmf-chip" data-act="download-card-backup" data-bid="${esc(latestBackupForCard.id)}">${NMF_ICONS.download} PNG</button>
            </div>
        </div>` : ''}
    </div>`;
}

function getUnifiedActiveTask() {
    const cfg = getSettings();
    const quipPool = isEn()
        ? (THEME_LOADING_QUIPS_EN[cfg.theme] || THEME_LOADING_QUIPS_EN.tavern)
        : (THEME_LOADING_QUIPS[cfg.theme] || THEME_LOADING_QUIPS.tavern || THEME_LOADING_QUIPS.krakoa);

    if (state.busy) {
        if (state.altarFusionBusy) {
            // While Altar Fusion is running and user is viewing Collection, let the Altar block itself shine!
            const onAltarScreen = state.activeTab === 'matches' && state.matchesSubTab === 'gacha_collection';
            const sec = Number(state.busyElapsedSec) || 0;
            return {
                kind: 'busy',
                title: state.busyTaskLabel || tx('Синтез Алтаря', 'Altar Synthesis'),
                detail: tx('Алтарь объединяет карточки...', 'Altar is weaving cards...'),
                quip: state.busyQuip || quipPool[0],
                elapsedSec: sec,
                step: 2,
                minimized: Boolean(onAltarScreen || state.busyMinimized),
                cancellable: Boolean(state.busyCancellable),
                cancelRequested: Boolean(state.busyCancelRequested),
                stopAct: 'cancel-busy',
                minimizeAct: 'minimize-busy',
                expandAct: 'expand-busy',
            };
        }
        const sec = Number(state.busyElapsedSec) || 0;
        const step = sec < 2 ? 1 : (sec < 7 ? 2 : 3);
        const detail = state.busyTaskType === 'save'
            ? tx('Проверка целостности и запись на диск...', 'Verifying integrity and writing to disk...')
            : (state.busyTaskType === 'load'
                ? tx('Чтение полной анкеты из SillyTavern...', 'Reading full character card from SillyTavern...')
                : tx('Модель анализирует параметры и собирает ответ...', 'Model is analyzing parameters and crafting response...'));
        return {
            kind: 'busy',
            title: state.busyTaskLabel || tx('Синтез кузницы', 'Forge Synthesis'),
            detail,
            quip: state.busyQuip || quipPool[0],
            elapsedSec: sec,
            step,
            minimized: Boolean(state.busyMinimized),
            cancellable: Boolean(state.busyCancellable),
            cancelRequested: Boolean(state.busyCancelRequested),
            stopAct: 'cancel-busy',
            minimizeAct: 'minimize-busy',
            expandAct: 'expand-busy',
        };
    }

    if (state.editorArtLoading && state.editorArtStatus) {
        const st = state.editorArtStatus;
        const sec = Number(st.elapsedSec) || 0;
        const step = sec < 2 ? 1 : (/Декодирование|Обработка|Decoding/i.test(st.stage || '') ? 3 : 2);
        const qIdx = Math.floor(sec / 4) % quipPool.length;
        return {
            kind: 'editor-art',
            title: st.stage || tx('Рендер портрета [1/3]', 'Rendering portrait [1/3]'),
            detail: st.detail || tx('Отправка запроса в генератор изображений...', 'Sending request to image generator...'),
            quip: quipPool[qIdx],
            elapsedSec: sec,
            step,
            minimized: Boolean(state.artVisualizerMinimized),
            cancellable: true,
            cancelRequested: false,
            stopAct: 'stop-editor-art',
            minimizeAct: 'minimize-art-vis',
            expandAct: 'expand-art-vis',
        };
    }

    if (state.loadingArtIds.size > 0) {
        const [firstCandId] = state.loadingArtIds;
        const st = state.artStatuses.get(firstCandId);
        if (st) {
            const sec = Number(st.elapsedSec) || 0;
            const step = sec < 2 ? 1 : (/Декодирование|Обработка|Decoding/i.test(st.stage || '') ? 3 : 2);
            const qIdx = Math.floor(sec / 4) % quipPool.length;
            return {
                kind: 'cand-art',
                candId: firstCandId,
                title: st.stage || tx('Рендер портрета анкеты [1/3]', 'Rendering dossier portrait [1/3]'),
                detail: st.detail || tx('Отправка запроса в генератор изображений...', 'Sending request to image generator...'),
                quip: quipPool[qIdx],
                elapsedSec: sec,
                step,
                minimized: Boolean(st.minimizedByDefault ? !st.userExpanded : state.artVisualizerMinimized),
                cancellable: true,
                cancelRequested: false,
                stopAct: 'stop-cand-art',
                minimizeAct: 'minimize-art-vis',
                expandAct: 'expand-art-vis',
            };
        }
    }

    return null;
}

function renderLoadingOverlay() {
    const task = getUnifiedActiveTask();
    if (!task || task.minimized) return '';
    const secUnit = tx('с', 's');

    return `
    <div class="nmf-loading-overlay" id="nmf-unified-overlay">
        <div class="nmf-pc-win">
            <div class="nmf-pc-titlebar">
                <span class="nmf-pc-title-text">
                    <span id="nmf-live-stage">${esc(task.title)}</span> · <span id="nmf-live-timer">${task.elapsedSec}${secUnit}</span>
                </span>
                <div class="nmf-pc-win-btns">
                    <button type="button" class="nmf-pc-win-btn" data-act="${task.minimizeAct}" title="${esc(tx('Свернуть в фон', 'Minimize to background'))}">
                        ${NMF_ICONS.minus}
                    </button>
                    <button type="button" class="nmf-pc-win-btn nmf-pc-close" data-act="${task.stopAct}" title="${esc(task.cancellable ? tx('Отменить задачу', 'Cancel task') : tx('Идёт сохранение файла', 'Saving file'))}" ${!task.cancellable || task.cancelRequested ? 'disabled' : ''}>
                        ${NMF_ICONS.close}
                    </button>
                </div>
            </div>
            <div class="nmf-pc-body">
                <div class="nmf-single-spinner">
                    ${task.kind === 'busy' ? NMF_ICONS.spark : NMF_ICONS.image}
                </div>
                ${task.quip ? `<div class="nmf-loading-quip" id="nmf-live-quip">${esc(task.quip)}</div>` : ''}
            </div>
        </div>
    </div>`;
}

function renderBackgroundBusyStrip() {
    const cfg = getSettings();
    const copy = getThemeUnpackCopy(cfg.theme);
    const task = getUnifiedActiveTask();
    if (task && task.minimized) {
        return `
        <div class="nmf-telemetry-dock" id="nmf-unified-dock">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;font-size:11px;font-family:var(--nmf-font-mono)">
                <div class="nmf-diamond-ping"></div>
                <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    <strong style="color:var(--nmf-accent)" id="nmf-dock-stage">${esc(task.title)}</strong>
                    · <span id="nmf-mini-timer">${task.elapsedSec}</span>${esc(tx('с', 's'))}
                </span>
            </div>
            <div class="nmf-btn-row" style="flex-shrink:0">
                ${!state.altarFusionBusy ? `<button type="button" class="nmf-chip" data-act="${task.expandAct}">${esc(tx('Шторка', 'Expand'))}</button>` : ''}
                ${task.cancellable
                    ? `<button type="button" class="nmf-chip nmf-ban" data-act="${task.stopAct}" ${task.cancelRequested ? 'disabled' : ''}>${NMF_ICONS.close}</button>`
                    : `<span class="nmf-chip">${esc(tx('Запись', 'Saving'))}</span>`}
            </div>
            <div class="nmf-telemetry-dock-bar"></div>
        </div>`;
    }

    if (state.pendingWishReveal && !state.wishRevealState) {
        return `
        <div class="nmf-telemetry-dock" style="border-bottom-color:#f5c25b;background:rgba(245,194,91,0.10)">
            <div style="display:flex;align-items:center;gap:7px;min-width:0;font-size:11.5px;font-weight:700;color:#f5c25b">
                ${NMF_ICONS.primogem}
                <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(copy.stageGachaTitle)}</span>
            </div>
            <button type="button" class="nmf-hcard-btn nmf-on" style="height:27px;font-size:11px" data-act="open-pending-wish-stage">
                ${NMF_ICONS.unbox} ${esc(copy.gachaBtn)}
            </button>
        </div>`;
    }

    if (state.pendingMatchReveal && !state.matchRevealState) {
        return `
        <div class="nmf-telemetry-dock" style="border-bottom-color:var(--nmf-accent)">
            <div style="display:flex;align-items:center;gap:7px;min-width:0;font-size:11.5px;font-weight:700;color:var(--nmf-accent)">
                ${NMF_ICONS.heart}
                <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(copy.stageMatchTitle)}</span>
            </div>
            <button type="button" class="nmf-hcard-btn nmf-on" style="height:27px;font-size:11px" data-act="open-pending-match-stage">
                ${NMF_ICONS.unbox} ${esc(copy.matchBtn)}
            </button>
        </div>`;
    }

    return '';
}

function syncUnifiedVisualizerDom() {
    if (typeof document === 'undefined') return;
    const task = getUnifiedActiveTask();
    if (!task) return;
    const secUnit = tx('с', 's');
    const timerEl = document.getElementById('nmf-live-timer');
    if (timerEl) timerEl.textContent = `${task.elapsedSec}${secUnit}`;
    const stageEl = document.getElementById('nmf-live-stage');
    if (stageEl) stageEl.textContent = task.title;
    const quipEl = document.getElementById('nmf-live-quip');
    if (quipEl && task.quip) quipEl.textContent = task.quip;

    const miniTimer = document.getElementById('nmf-mini-timer');
    if (miniTimer) miniTimer.textContent = String(task.elapsedSec);
    const dockStage = document.getElementById('nmf-dock-stage');
    if (dockStage) dockStage.textContent = task.title;
}

function buildPortraitRefOptions(sess, cfg, matchContextText = '', explicitFusionDataUrls = null) {
    if (Array.isArray(explicitFusionDataUrls) && explicitFusionDataUrls.length > 0) {
        return {
            refMode: 'explicit',
            pickedRefUid: '',
            customRefDataUrls: explicitFusionDataUrls,
            customRefDesc: '',
            refMatchContext: matchContextText,
            fusionBlendRefs: true,
        };
    }
    const mode = cfg.imageRefMode || 'off';
    const customUrl = mode === 'custom_photo' ? resolveEntityAvatarUrl(sess?.artRefCustom) : '';
    return {
        refMode: mode,
        pickedRefUid: cfg.imagePickedRefUid || '',
        customRefDataUrls: customUrl ? [customUrl] : [],
        customRefDesc: String(sess?.artRefCustom?.description || '').trim(),
        refMatchContext: matchContextText,
        fusionBlendRefs: false,
    };
}

let gachaCooldownTickId = null;

function ensureLiveGachaCooldownTicker() {
    if (typeof document === 'undefined') return;
    if (gachaCooldownTickId) return;
    gachaCooldownTickId = setInterval(() => {
        const el = document.getElementById('nmf-gacha-cd-live');
        if (!el) return;
        const cfg = getSettings();
        const sess = getActiveSession();
        const { coolingDown, leftMs } = syncGachaWallClockCooldown(sess, cfg);
        if (!coolingDown) {
            renderWindow();
        } else {
            el.textContent = formatRemainingMs(leftMs);
        }
    }, 1000);
    if (typeof gachaCooldownTickId?.unref === 'function') gachaCooldownTickId.unref();
}

export function renderWindow() {
    if (typeof document === 'undefined') return;
    const win = document.getElementById('nmf-window');
    if (!win) return;
    ensureLiveGachaCooldownTicker();

    const prevBody = win.querySelector('.nmf-body');
    const prevScrollTop = prevBody ? prevBody.scrollTop : 0;
    const prevTab = win.dataset.renderedTab || '';

    const cfg = getSettings();
    const sess = getActiveSession();
    const activeTheme = NMF_THEMES.find((t) => t.id === cfg.theme) || NMF_THEMES[0];
    const activeThemeDisp = getThemeDisplay(activeTheme.id);

    const ratioClass = cfg.imageAspectRatio === 'native'
        ? ' nmf-ratio-native'
        : (cfg.imageAspectRatio === '16:9' ? ' nmf-ratio-wide' : '');
    win.className = `nmf-theme-${activeTheme.id}${ratioClass}`;
    win.dataset.renderedTab = state.activeTab;

    const ratioCss = cfg.imageAspectRatio === 'native' ? 'auto' : (cfg.imageAspectRatio || '1:1').replace(':', ' / ');
    const fitCss = (cfg.imageCropFocus === 'contain' || cfg.imageAspectRatio === 'native') ? 'contain' : 'cover';
    const posCss = cfg.imageCropFocus === 'top' ? '50% 6%' : '50% 50%';
    win.style.setProperty('--nmf-art-ratio', ratioCss);
    win.style.setProperty('--nmf-art-fit', fitCss);
    win.style.setProperty('--nmf-art-pos', posCss);

    // Auto-guide brand-new sessions through the Home Launchpad first!
    if (!sess.homeCompleted && state.activeTab !== 'home') {
        state.activeTab = 'home';
    }
    // NOTE: Never auto-consume state.pendingWishReveal or state.pendingMatchReveal here!
    // When loading was minimized into the top Shade (Шторка) or finished while RPing in Tavern,
    // the themed Unpack button stays pinned in the top Shade until the user explicitly clicks it!

    const screenHtml = {
        home: renderHomeTab,
        swipe: renderSwipeTab,
        matches: renderMatchesTab,
        blitz: renderBlitzTab,
        create: renderCreateTab,
        editor: renderEditorTab,
    }[state.activeTab]?.(sess) || renderHomeTab(sess);

    const savedTotalCount = (sess.tinder?.liked || []).length + (sess.gacha?.collection || []).length + (cfg.savedVault || []).length;

    win.innerHTML = `
        <div class="nmf-header">
            <div class="nmf-header-left">
                <div class="nmf-crest">${NMF_ICONS.crest}</div>
                <div class="nmf-title-wrap">
                    <div class="nmf-title-main">
                        <span>NEXUSMATCH</span>
                    </div>
                    <div class="nmf-title-sub">${esc(displaySessionTitle(sess.title))}${sess.frozen ? ` [${esc(tx('ПАУЗА', 'PAUSED'))}]` : ''} · ${esc(activeThemeDisp.name)}${cfg.imageRefMode && cfg.imageRefMode !== 'off' ? ` · ${esc(tx('РЕФ', 'REF'))}` : ''}</div>
                </div>
            </div>
            <div class="nmf-header-actions">
                ${lastGenerationReasoning ? `
                <button type="button" class="nmf-icon-btn ${state.thoughtsDrawerOpen ? 'nmf-active' : ''}" data-act="toggle-thoughts" title="${esc(tx('Мысли модели', 'Model Reasoning'))}">${esc(tx('Мысли', 'Thoughts'))}</button>` : ''}
                <button type="button" class="nmf-icon-btn" data-act="toggle-ui-lang" title="${esc(tx('Переключить язык приложения RU / EN', 'Switch App Language EN / RU'))}">${getUiLang() === 'en' ? 'EN' : 'RU'}</button>
                <button type="button" class="nmf-icon-btn nmf-sq ${state.activeTab === 'home' ? 'nmf-active' : ''}" data-act="open-home-tab" title="${esc(tx('Главный экран и настройки', 'Home Screen & Settings'))}">${NMF_ICONS.home}</button>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="open-guide-modal" title="${esc(tx('Справка и гайд', 'Guide & Help'))}">${NMF_ICONS.help}</button>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-modal" title="${esc(tx('Закрыть', 'Close'))}">${NMF_ICONS.close}</button>
            </div>
        </div>

        ${(lastGenerationReasoning && state.thoughtsDrawerOpen) ? `
        <div class="nmf-drawer nmf-open" style="max-height:210px;overflow-y:auto">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
                <span class="nmf-label" style="color:var(--nmf-accent)">${esc(tx('Мысли модели (Reasoning)', 'Model Reasoning'))}</span>
                <button type="button" class="nmf-chip" data-act="toggle-thoughts">${esc(tx('Скрыть', 'Hide'))}</button>
            </div>
            <div style="font-family:var(--nmf-font-mono);font-size:11.5px;line-height:1.48;white-space:pre-wrap;color:var(--nmf-text-muted);padding:8px;background:var(--nmf-bg);border:1px solid var(--nmf-border);border-radius:var(--nmf-radius)">${esc(lastGenerationReasoning)}</div>
        </div>` : ''}

        ${renderBackgroundBusyStrip()}

        <div class="nmf-body">
            ${screenHtml}
        </div>

        <div class="nmf-bottom-nav">
            <button type="button" class="nmf-nav-item ${state.activeTab === 'swipe' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="swipe">
                ${state.discoverSubMode === 'gacha' ? NMF_ICONS.primogem : NMF_ICONS.flame}<span>${esc(state.discoverSubMode === 'gacha' ? tx('Гача', 'Gacha') : tx('Свайпы', 'Swipes'))}</span>
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'matches' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="matches">
                ${NMF_ICONS.matches}<span>${esc(tx('Улов', 'Collection'))}</span>
                ${savedTotalCount > 0 ? `<span class="nmf-nav-badge">${savedTotalCount}</span>` : ''}
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'blitz' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="blitz">
                ${NMF_ICONS.blitz}<span>${esc(tx('Блиц', 'Blitz'))}</span>
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'create' ? 'nmf-active' : ''}" data-act="create-submode-nav" data-tab="create">
                ${NMF_ICONS.architect}<span>${esc(tx('Создать', 'Create'))}</span>
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'editor' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="editor">
                ${NMF_ICONS.editor}<span>${esc(tx('Профиль', 'Profile'))}</span>
            </button>
        </div>

        ${renderIntakeSheetModal(sess)}
        ${renderGachaPrefsSheetModal(sess)}
        ${renderSettingsSheetModal(sess)}
        ${renderGuideSheetModal()}
        ${renderTranslateModal(sess)}
        ${renderCandidateEditModal(sess)}
        ${renderOverwriteConfirmModal()}
        ${renderCandidateDossierModal(sess)}
        ${renderPortraitLightboxModal()}
        ${renderArtCropperModal()}
        ${renderHelpPopoverModal()}
        ${renderMatchSignalRevealOverlay(sess)}
        ${renderWishRevealOverlay(sess)}
        ${renderSacrificeConfirmModal()}
        <input type="file" id="nmf-cand-photo-upload" accept="image/*" style="display:none"/>
        ${renderLoadingOverlay()}
    `;

    if (isEn()) {
        applyEnglishDomTranslation(win);
    }

    if (prevTab === state.activeTab && prevScrollTop > 0) {
        const nextBody = win.querySelector('.nmf-body');
        if (nextBody) nextBody.scrollTop = prevScrollTop;
    }

    if (state.cropModalInfo) {
        attachCropperDragGestures(win);
    }
    if (state.discoverSubMode !== 'gacha') {
        attachSwipeCardGestures(win);
        maybeAutoTriggerCurrentCardArt();
    }
}

function maybeAutoTriggerCurrentCardArt() {
    if (state.activeTab !== 'swipe' || state.busy) return;
    const cfg = getSettings();
    const sess = getActiveSession();
    if (!sess || sess.frozen || !sess.tinder.autoArt) return;
    if (cfg.imageSource === 'off' || !detectImageExtensions().hasAny) return;
    const cur = sess.tinder.queue[0];
    if (!cur || resolveEntityAvatarUrl(cur) || state.loadingArtIds.has(cur.id) || state.artErrors.has(cur.id)) return;
    triggerCandidateArtInBackground(cur, false);
}

function syncCandArtStatusDom() {
    syncUnifiedVisualizerDom();
}

function syncEditorArtStatusDom() {
    syncUnifiedVisualizerDom();
}

async function triggerCandidateArtInBackground(cand, isManual = false, explicitFusionRefUrls = null) {
    if (!cand || state.loadingArtIds.has(cand.id)) return;
    const cfg = getSettings();
    const sess = getActiveSession();
    const prompt = cand.imagePrompt || `${cand.name}, ${cand.appearance || cand.archetype || 'portrait'}`;
    const isGachaCand = String(cand.id || '').startsWith('gacha_');
    const worldAnchorForRef = isGachaCand
        ? (sess?.gacha?.wishPrefs?.fandomOrWorld || '')
        : (sess?.intake?.fandomName || '');
    const refOpts = buildPortraitRefOptions(
        sess,
        cfg,
        `${cand.name || ''} ${(cand.tags || []).join(' ')} ${worldAnchorForRef}`,
        explicitFusionRefUrls,
    );
    const ctl = new AbortController();

    if (isManual) {
        state.artVisualizerMinimized = false;
    }

    const statusObj = {
        stage: 'Подготовка генерации',
        detail: 'Инициализация запроса...',
        attempt: 1,
        maxAttempts: 3,
        providerLabel: '',
        elapsedSec: 0,
        minimizedByDefault: !isManual,
        userExpanded: Boolean(isManual),
        timerId: null,
    };
    statusObj.timerId = setInterval(() => {
        statusObj.elapsedSec += 1;
        if (/^Генерация|^Повтор генерации/.test(statusObj.stage) && /^Отправка запроса/.test(statusObj.detail) && statusObj.elapsedSec >= 3) {
            statusObj.detail = statusObj.elapsedSec >= 10
                ? `Сервер рендерит кадр · запрос активен (${statusObj.elapsedSec}с)...`
                : `Запрос отправлен · ждём ответ сервера (${statusObj.elapsedSec}с)...`;
        }
        syncCandArtStatusDom(cand.id);
    }, 1000);

    state.artErrors.delete(cand.id);
    state.unseenArtIds.delete(String(cand.id));
    state.artStatuses.set(cand.id, statusObj);
    state.loadingArtIds.add(cand.id);
    state.artAborts.set(cand.id, ctl);
    renderWindow();

    try {
        const isGachaItem = String(cand.id || '').startsWith('gacha_');
        const effectiveAspect = isGachaItem
            ? (cand.gachaAspectOverride || sess?.gacha?.aspectRatio || 'sillyimages_default')
            : (cfg.imageAspectRatio || '1:1');
        const dataUrl = await generateCharacterPortrait(prompt, {
            imageSource: cfg.imageSource,
            imageProfileId: cfg.imageProfileId,
            imageStyleId: cfg.imageStyleId,
            styleWrapMode: cfg.styleWrapMode || 'plain_prefix',
            imageNegativeId: cfg.imageNegativeId || '',
            imageCustomNegative: cfg.imageCustomNegative || '',
            aspectRatio: effectiveAspect,
            ...refOpts,
            signal: ctl.signal,
            onStatus: (info) => {
                statusObj.stage = info.stage || statusObj.stage;
                statusObj.detail = info.detail || statusObj.detail;
                statusObj.attempt = info.attempt || statusObj.attempt;
                statusObj.maxAttempts = info.maxAttempts || statusObj.maxAttempts;
                if (info.providerLabel) statusObj.providerLabel = info.providerLabel;
                syncCandArtStatusDom(cand.id);
            },
        });
        if (ctl.signal.aborted) return;
        cand.originalAvatarId = '';
        cand.croppedAspect = '';
        const dims = await probeImageDimensionsFromDataUrl(dataUrl);
        if (dims.w && dims.h) cand.artNaturalRatio = dims.w / dims.h;
        state.unseenArtIds.add(String(cand.id));
        const mediaRes = await assignEntityMediaWithFallback(cand, dataUrl, cand.avatarId || '');
        state.artErrors.delete(cand.id);
        saveSettings();
        if (!mediaRes.durable) {
            notifyToast('IndexedDB недоступна: портрет сохранён во временном буфере настроек — рекомендуем экспортировать PNG.', true);
        }
    } catch (err) {
        const msg = ctl.signal.aborted ? 'Загрузка фото остановлена вами.' : (err?.message || String(err));
        state.artErrors.set(cand.id, msg);
        if (isManual && !ctl.signal.aborted) notifyToast(msg, true);
    } finally {
        if (statusObj.timerId) clearInterval(statusObj.timerId);
        state.artStatuses.delete(cand.id);
        state.loadingArtIds.delete(cand.id);
        state.artAborts.delete(cand.id);
        renderWindow();
    }
}

function attachSwipeCardGestures(win) {
    const cardEl = win.querySelector('#nmf-active-swipe-card');
    if (!cardEl || (state.busy && !state.busyMinimized)) return;
    const sess = getActiveSession();
    if (sess.frozen) return;

    const likeStamp = cardEl.querySelector('#nmf-stamp-like');
    const nopeStamp = cardEl.querySelector('#nmf-stamp-nope');

    let startX = 0;
    let startY = 0;
    let dx = 0;
    let tracking = false;
    let lockedHorizontal = null;

    cardEl.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button, input, textarea, select')) return;
        startX = e.clientX;
        startY = e.clientY;
        dx = 0;
        tracking = true;
        lockedHorizontal = null;
    });

    cardEl.addEventListener('pointermove', (e) => {
        if (!tracking) return;
        const curDx = e.clientX - startX;
        const curDy = e.clientY - startY;

        if (lockedHorizontal === null && (Math.abs(curDx) > 8 || Math.abs(curDy) > 8)) {
            lockedHorizontal = Math.abs(curDx) > Math.abs(curDy) * 1.15;
            if (lockedHorizontal) {
                cardEl.classList.add('nmf-dragging');
                try { cardEl.setPointerCapture(e.pointerId); } catch {}
            } else {
                tracking = false;
                return;
            }
        }
        if (!lockedHorizontal) return;

        dx = curDx;
        const rot = Math.max(-14, Math.min(14, dx * 0.06));
        cardEl.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;

        const ratio = Math.min(1, Math.abs(dx) / 90);
        if (likeStamp) likeStamp.style.opacity = dx > 15 ? String(ratio) : '0';
        if (nopeStamp) nopeStamp.style.opacity = dx < -15 ? String(ratio) : '0';
    });

    const finishGesture = () => {
        if (!tracking) return;
        tracking = false;
        cardEl.classList.remove('nmf-dragging');

        if (lockedHorizontal && dx > 85) {
            cardEl.style.transform = 'translateX(420px) rotate(16deg)';
            cardEl.style.opacity = '0';
            setTimeout(() => handleSwipeDecision('like'), 150);
        } else if (lockedHorizontal && dx < -85) {
            cardEl.style.transform = 'translateX(-420px) rotate(-16deg)';
            cardEl.style.opacity = '0';
            setTimeout(() => handleSwipeDecision('dislike'), 150);
        } else {
            cardEl.style.transform = '';
            if (likeStamp) likeStamp.style.opacity = '0';
            if (nopeStamp) nopeStamp.style.opacity = '0';
        }
    };

    cardEl.addEventListener('pointerup', finishGesture);
    cardEl.addEventListener('pointercancel', finishGesture);
}

function handleSwipeDecision(kind) {
    const cfg = getSettings();
    const sess = getActiveSession();
    const cur = sess.tinder.queue.shift();
    if (!cur) return;

    if (kind === 'dislike' && state.artAborts.has(cur.id)) {
        state.artAborts.get(cur.id)?.abort();
    }

    let evicted = false;
    if (kind === 'like') {
        sess.tinder.liked.unshift(cur);
        if (sess.tinder.liked.length > MAX_LIKED_CANDIDATES) {
            sess.tinder.liked.length = MAX_LIKED_CANDIDATES;
            evicted = true;
        }
        sess.tinder.lastDislikedCandidate = null;
        saveSettings();
        notifyToast(`«${cur.name}» добавлен в Мэтчи!`);
    } else {
        if (!Array.isArray(sess.tinder.passed)) sess.tinder.passed = [];
        sess.tinder.passed.unshift(cur);
        if (sess.tinder.passed.length > MAX_PASSED_CANDIDATES) {
            sess.tinder.passed.length = MAX_PASSED_CANDIDATES;
            evicted = true;
        }
        sess.tinder.lastDislikedCandidate = cur;
        saveSettings();
    }
    if (evicted) {
        pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []).catch(() => {});
    }
    renderWindow();
}

function openWishRevealAnimation(maxStars = 4, isFusion = false) {
    if (state.wishRevealState?.timerId) {
        clearTimeout(state.wishRevealState.timerId);
    }
    state.wishRevealState = {
        phase: 'sealed',
        maxStars: Math.max(1, Math.min(5, Math.round(Number(maxStars) || 3))),
        isFusion: Boolean(isFusion),
        timerId: null,
    };
}

function startWishCometAndFlip(maxStars = 4, isFusion = false) {
    if (state.wishRevealState?.timerId) {
        clearTimeout(state.wishRevealState.timerId);
    }
    const rev = {
        phase: 'comet',
        maxStars: Math.max(1, Math.min(5, Math.round(Number(maxStars) || 3))),
        isFusion: Boolean(isFusion),
        timerId: null,
    };
    rev.timerId = setTimeout(() => {
        if (state.wishRevealState === rev) {
            rev.phase = 'cards';
            rev.timerId = null;
            renderWindow();
        }
    }, 1150);
    if (typeof rev.timerId?.unref === 'function') rev.timerId.unref();
    state.wishRevealState = rev;
}

function resolveCardExportAspectRatio(card, cfg) {
    if (card?.croppedAspect) return 'native';
    const nat = Number(card?.artNaturalRatio) || 0;
    if (nat > 0 && Math.abs(nat - 1) > 0.04 && (!cfg?.imageAspectRatio || cfg.imageAspectRatio === '1:1')) {
        return 'native';
    }
    return cfg?.imageAspectRatio || '1:1';
}

function saveEditedCandidateFields(sess) {
    const ref = state.editingCandRef;
    if (!ref) return null;
    const cand = resolveEntityFromPoolRef(sess, ref.pool, ref.idx);
    if (!cand) return null;

    cand.name = document.getElementById('nmf-ce-name')?.value?.trim() || cand.name;
    cand.archetype = document.getElementById('nmf-ce-arch')?.value?.trim() || '';
    cand.pitch = document.getElementById('nmf-ce-pitch')?.value?.trim() || '';
    cand.appearance = document.getElementById('nmf-ce-looks')?.value?.trim() || '';
    cand.quote = document.getElementById('nmf-ce-quote')?.value?.trim() || '';
    cand.tags = String(document.getElementById('nmf-ce-tags')?.value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    cand.imagePrompt = document.getElementById('nmf-ce-img')?.value?.trim() || '';
    saveSettings();
    return cand;
}

// Local-only cancellation handler — never invokes global chat generation stop (fixes NMF-005 & NMF-006)
export function requestCancelBusyTask() {
    if (!state.busy) return false;
    if (!state.busyCancellable) {
        notifyToast('Операция записи файла уже идёт и не может быть прервана для сохранности карточки.');
        return false;
    }
    const ctl = state.busyAbort;
    if (state.busyTimerId) clearInterval(state.busyTimerId);
    state.busyTimerId = null;
    state.busyAbort = null;
    state.busy = false;
    state.busyMinimized = false;
    state.busyCancelRequested = true;
    state.busyCancellable = true;
    state.activeRunId = 0;
    try { ctl?.abort(new Error('Cancelled locally by NMF user')); } catch {}
    renderWindow();
    notifyToast('Задача отменена (Молитвы не списаны, активный чат Таверны не затронут).');
    return true;
}

// Concurrency-safe task runner with unique runId & task-scoped cancellation (fixes NMF-005 & NMF-006)
export async function withBusy(taskLabel, fn, { taskType = 'llm', cancellable = true } = {}) {
    if (state.busy) return false;

    const runId = nextBusyRunId++;
    const cfg = getSettings();
    const quipPool = THEME_LOADING_QUIPS[cfg.theme] || THEME_LOADING_QUIPS.krakoa;
    let quipIdx = Math.floor(Math.random() * quipPool.length);

    const abortCtl = new AbortController();
    state.activeRunId = runId;
    state.busy = true;
    state.busyMinimized = false;
    state.busyTaskType = taskType;
    state.busyCancellable = Boolean(cancellable);
    state.busyCancelRequested = false;
    state.busyAbort = abortCtl;
    state.busyTaskLabel = taskLabel;
    state.busyQuip = quipPool[quipIdx];
    state.busyElapsedSec = 0;
    renderWindow();

    const timerId = setInterval(() => {
        if (state.activeRunId !== runId) return;
        state.busyElapsedSec += 1;
        if (state.busyElapsedSec % 3 === 0) {
            quipIdx = (quipIdx + 1) % quipPool.length;
            state.busyQuip = quipPool[quipIdx];
        }
        syncUnifiedVisualizerDom();
    }, 1000);
    state.busyTimerId = timerId;

    try {
        await fn(abortCtl.signal, runId);
        if (state.activeRunId === runId && state.busyMinimized && !abortCtl.signal.aborted) {
            notifyToast(`Готово в фоне: ${taskLabel}!`);
        }
        return true;
    } catch (err) {
        if (abortCtl.signal.aborted || state.busyCancelRequested) {
            notifyToast('Задача NexusMatch Forge отменена (активный чат Таверны не затронут).');
        } else {
            console.error('[NexusMatch Forge]', err);
            notifyToast(err?.message || String(err), true);
        }
        return false;
    } finally {
        clearInterval(timerId);
        if (state.activeRunId === runId) {
            state.busyTimerId = null;
            state.busyAbort = null;
            state.busy = false;
            state.busyMinimized = false;
            state.busyCancelRequested = false;
            state.busyCancellable = true;
            state.activeRunId = 0;
            renderWindow();
        }
    }
}

async function executeOverwriteFlow(sess, cfg, allowExternalOverride = false) {
    const targetAvatar = sess.card.sourceAvatarId;
    if (!targetAvatar || !sess.card.sourceLoadedFromTavern) return;

    await withBusy('Безопасно обновляем карточку в SillyTavern', async () => {
        try {
            const avatarDataUrl = resolveEntityAvatarUrl(sess.card);
            const result = await updateExistingCardInTavern(sess.card, {
                avatarFileName: targetAvatar,
                avatarDataUrl,
                accentHex: getThemeColor(),
                aspectRatio: resolveCardExportAspectRatio(sess.card, cfg),
                cropFocus: cfg.imageCropFocus || 'top',
                allowExternalChangeOverride: allowExternalOverride,
            });
            state.overwriteConfirmInfo = null;
            state.lastOverwriteAlert = null;
            saveSettings();
            await Promise.all([refreshRosterData(), refreshBackupsList()]);
            if (result.noop) {
                notifyToast('Нет изменённых полей для записи.');
            } else {
                notifySuccessToast(`Карточка «${sess.card.name}» обновлена (бэкап проверен и сохранён)!`);
            }
        } catch (err) {
            if (err?.code === 'EXTERNAL_CARD_MODIFIED' && !allowExternalOverride) {
                const diff = computeCardDiff(sess.card);
                state.overwriteConfirmInfo = {
                    targetAvatar,
                    diff,
                    externalWarning: true,
                };
                return;
            }
            state.overwriteConfirmInfo = null;
            await refreshBackupsList().catch(() => {});
            state.lastOverwriteAlert = {
                code: String(err?.code || 'SAVE_ERROR'),
                message: String(err?.message || err),
                backupId: String(err?.backupId || ''),
                observedSnapshotHash: String(err?.observedSnapshotHash || sess.card.sourceSnapshotHash || ''),
                restoreConflictWarning: false,
                targetAvatar,
            };
            throw err;
        }
    }, { taskType: 'save', cancellable: false });
}

function bindWindowDelegation(win) {
    win.addEventListener('pointerdown', (e) => {
        // Prevent Android virtual-keyboard blur resize from swallowing taps on collapse/save buttons!
        const actEl = e.target?.closest?.('[data-act="toggle-home-card"], [data-act="save-inline-session-title"]');
        if (actEl && typeof document !== 'undefined' && document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
            e.preventDefault();
            document.activeElement.blur();
        }
    });

    win.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target?.id === 'nmf-manual-ban-input') {
            e.preventDefault();
            win.querySelector('[data-act="add-manual-ban"]')?.click();
        }
        if (e.key === 'Enter' && e.target?.id === 'nmf-home-sess-title-input') {
            e.preventDefault();
            win.querySelector('[data-act="save-inline-session-title"]')?.click();
        }
    });

    win.addEventListener('input', (e) => {
        const el = e.target;
        const sess = getActiveSession();
        if (!el || !sess) return;
        // Let <select> be handled exclusively by 'change' so conditional inputs (e.g. Custom Gender!) ALWAYS render!
        if (el.tagName === 'SELECT') return;

        if (el.id === 'nmf-home-sess-title-input') {
            state.sessionTitleDraft = el.value;
            return;
        }
        if (el.id === 'nmf-manual-ban-input') {
            state.manualBanDraft = el.value;
            return;
        }
        if (el.dataset.cfgLive) {
            const cfg = getSettings();
            cfg[el.dataset.cfgLive] = el.value;
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.cfgNum) {
            const cfg = getSettings();
            const n = Math.round(Number(el.value));
            if (Number.isFinite(n) && n > 0) {
                cfg[el.dataset.cfgNum] = n;
                scheduleSaveSettings();
            }
            return;
        }
        if (el.dataset.trCustom) {
            state.translateTargetLang = stripAccidentalLanguageBraces(el.value);
            return;
        }
        if (el.dataset.intake) {
            const k = el.dataset.intake;
            sess.intake[k] = el.type === 'number' ? Number(el.value) : el.value;
            if (k === 'originType') {
                if (el.value === 'world_sandbox') {
                    sess.intake.cardFormat = 'world_sandbox';
                } else if (el.value === 'rpg_gm') {
                    sess.intake.cardFormat = 'rpg_gm_engine';
                    sess.intake.greetingStyle = 'rpg_hud';
                    sess.intake.greetingPov = 'second_gm';
                } else if (el.value === 'duo_group') {
                    sess.intake.cardFormat = 'cast_hub';
                } else if (['world_sandbox', 'rpg_gm_engine'].includes(sess.intake.cardFormat)) {
                    sess.intake.cardFormat = 'dossier_19';
                }
            }
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.tinder) {
            const k = el.dataset.tinder;
            sess.tinder[k] = el.type === 'number' ? Number(el.value) : el.value;
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.blitz) {
            sess.blitz[el.dataset.blitz] = el.value;
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.blitzAns !== undefined) {
            const q = sess.blitz.questions[Number(el.dataset.blitzAns)];
            if (q) {
                q.answer = el.value;
                scheduleSaveSettings();
            }
            return;
        }
        if (el.dataset.arch) {
            sess.architect[el.dataset.arch] = el.value;
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.rework) {
            const prevAvatar = sess.rework.sourceAvatar;
            sess.rework[el.dataset.rework] = el.value;
            if (el.dataset.rework === 'sourceAvatar' && el.value !== prevAvatar) {
                sess.rework.questions = [];
                saveSettings();
                renderWindow();
                return;
            }
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.card) {
            const field = el.dataset.card;
            sess.card[field] = el.value;
            markCardFieldDirty(sess.card, field);
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.altIdx !== undefined) {
            const idx = Number(el.dataset.altIdx);
            if (Array.isArray(sess.card.alternate_greetings)) {
                sess.card.alternate_greetings[idx] = el.value;
                markCardFieldDirty(sess.card, 'alternate_greetings');
                scheduleSaveSettings();
            }
            return;
        }
        if (el.dataset.auAns !== undefined) {
            const idx = Number(el.dataset.auAns);
            if (Array.isArray(sess.rework?.questions) && sess.rework.questions[idx]) {
                sess.rework.questions[idx].answer = el.value;
                scheduleSaveSettings();
            }
            return;
        }
        if (el.dataset.cropRange && state.cropModalInfo) {
            const rk = el.dataset.cropRange;
            if (rk === 'zoom') state.cropModalInfo.zoom = Math.max(1, Math.min(3, Number(el.value) / 100));
            else if (rk === 'panX') state.cropModalInfo.panX = Math.max(0, Math.min(100, Number(el.value)));
            else if (rk === 'panY') state.cropModalInfo.panY = Math.max(0, Math.min(100, Number(el.value)));
            syncLiveCropperDom();
            return;
        }
        if (el.dataset.gachaPref) {
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            if (!sess.gacha.wishPrefs) sess.gacha.wishPrefs = createDefaultGachaWishPrefs(sess.intake);
            sess.gacha.wishPrefs[el.dataset.gachaPref] = el.value;
            scheduleSaveSettings();
            return;
        }
        if (el.dataset.artRefineInput) {
            state.artRefineHint = el.value;
            return;
        }
        if (el.dataset.gacha) {
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            const gk = el.dataset.gacha;
            sess.gacha[gk] = el.value;
            scheduleSaveSettings();
            if (gk === 'tagsInput') {
                const liveTags = parseGachaPlusTags(el.value);
                const valid = liveTags.length >= 3 && liveTags.length <= 10;
                const cntEl = document.getElementById('nmf-gacha-tag-counter');
                if (cntEl) {
                    cntEl.textContent = `${liveTags.length} / 10`;
                    cntEl.style.color = valid ? 'var(--nmf-accent)' : 'var(--nmf-accent-2)';
                }
                const chipsBox = document.getElementById('nmf-gacha-live-chips');
                if (chipsBox) {
                    chipsBox.innerHTML = liveTags.length > 0
                        ? liveTags.map((t, idx) => `<span class="nmf-plus-tag-chip"><span style="color:var(--nmf-accent)">+</span>${esc(t)}<button type="button" style="background:none;border:none;color:var(--nmf-text-muted);cursor:pointer;padding:0 0 0 3px;font-weight:700" data-act="gacha-remove-tag" data-idx="${idx}" title="Убрать тег">×</button></span>`).join('')
                        : `<button type="button" class="nmf-chip" data-act="gacha-preset-tags" data-tags="босс синдиката + шрам + сухая ирония + ночной мегаполис">Пример: Мафия</button>
                           <button type="button" class="nmf-chip" data-act="gacha-preset-tags" data-tags="паладин-отступник + серебряный клинок + клятва + пепел">Пример: Дарк-фэнтези</button>
                           <button type="button" class="nmf-chip" data-act="gacha-preset-tags" data-tags="нейрохирург + бессонница + острый ум + закрытая клиника">Пример: Драма</button>`;
                }
                const b1 = document.getElementById('nmf-wish-btn-1');
                if (b1) b1.disabled = Boolean(state.busy || sess.frozen || !valid || b1.dataset.canpull !== '1');
                const b3 = document.getElementById('nmf-wish-btn-3');
                if (b3) b3.disabled = Boolean(state.busy || sess.frozen || !valid || b3.dataset.canpull !== '1');
            }
            return;
        }
        if (el.dataset.artrefDesc) {
            if (!sess.artRefCustom) sess.artRefCustom = { avatarId: '', avatarDataUrl: '', description: '' };
            sess.artRefCustom.description = el.value;
            saveSettings();
            return;
        }
        if (el.id === 'nmf-lightbox-appearance' && state.lightboxInfo) {
            state.lightboxInfo.appearance = el.value;
            return;
        }
        if (el.id === 'nmf-lightbox-prompt' && state.lightboxInfo) {
            state.lightboxInfo.imagePrompt = el.value;
        }
    });

    win.addEventListener('change', async (e) => {
        const el = e.target;
        const cfg = getSettings();
        const sess = getActiveSession();

        if (el.dataset.card && sess) {
            const field = el.dataset.card;
            sess.card[field] = el.value;
            markCardFieldDirty(sess.card, field);
            saveSettings();
            if (el.tagName === 'SELECT') {
                renderWindow();
            }
            return;
        }
        if (el.dataset.intake && sess) {
            const k = el.dataset.intake;
            const nextVal = el.type === 'number' ? Number(el.value) : el.value;
            sess.intake[k] = nextVal;
            if (k === 'originType') {
                if (el.value === 'world_sandbox') sess.intake.cardFormat = 'world_sandbox';
                else if (el.value === 'rpg_gm') {
                    sess.intake.cardFormat = 'rpg_gm_engine';
                    sess.intake.greetingStyle = 'rpg_hud';
                    sess.intake.greetingPov = 'second_gm';
                } else if (['world_sandbox', 'rpg_gm_engine'].includes(sess.intake.cardFormat)) {
                    sess.intake.cardFormat = 'dossier_19';
                }
            }
            saveSettings();
            if (['originType', 'cardFormat', 'rating', 'wordBudgetId', 'greetingBudgetId', 'userGender', 'targetGender', 'userLanguage', 'cardLanguage', 'language'].includes(k)) {
                renderWindow();
            }
            return;
        }
        if (el.dataset.gacha && sess) {
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            sess.gacha[el.dataset.gacha] = el.value;
            saveSettings();
            if (el.tagName === 'SELECT') {
                renderWindow();
            }
            return;
        }
        if (el.dataset.gachaCardAspect && sess) {
            const cid = el.dataset.gachaCardAspect;
            const colItem = (sess.gacha?.collection || []).find((x) => x.id === cid);
            const revItem = (sess.gacha?.lastRevealBatch || []).find((x) => x.id === cid);
            if (colItem) colItem.gachaAspectOverride = el.value;
            if (revItem) revItem.gachaAspectOverride = el.value;
            saveSettings();
            return;
        }
        if (el.dataset.gachaPref && sess) {
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            if (!sess.gacha.wishPrefs) sess.gacha.wishPrefs = createDefaultGachaWishPrefs();
            const pk = el.dataset.gachaPref;
            sess.gacha.wishPrefs[pk] = el.value;
            saveSettings();
            if (['targetType', 'userGender', 'targetGender', 'rating'].includes(pk)) {
                renderWindow();
            }
            return;
        }
        if (el.dataset.gridSort) {
            state.gridSortMode = el.value;
            renderWindow();
            return;
        }
        if (el.dataset.blitzCand && sess) {
            sess.blitz.selectedCandidateRef = el.value;
            saveSettings();
            renderWindow();
            return;
        }
        if (el.dataset.langPreset && sess) {
            const field = el.dataset.langPreset;
            if (el.value === '__custom__') {
                sess.intake[field] = 'Свой язык';
            } else {
                sess.intake[field] = el.value;
            }
            saveSettings();
            renderWindow();
            return;
        }
        if (el.dataset.trPreset) {
            state.translateTargetLang = el.value === '__custom__' ? 'Свой язык' : el.value;
            renderWindow();
            return;
        }
        if (el.dataset.cfg) {
            cfg[el.dataset.cfg] = el.value;
            if (el.dataset.cfg === 'imageSource') {
                cfg.imageProfileId = '';
                cfg.imageStyleId = '';
            }
            saveSettings();
            renderWindow();
            syncExtSettingsPanel();
            return;
        }
        if (el.id === 'nmf-custom-ref-upload' && el.files?.[0] && sess) {
            try {
                if (!sess.artRefCustom) sess.artRefCustom = { avatarId: '', avatarDataUrl: '', description: '' };
                const rawRefDataUrl = await readLosslessImageFileAsDataUrl(el.files[0]);
                await assignEntityMediaWithFallback(sess.artRefCustom, rawRefDataUrl, sess.artRefCustom.avatarId || '');
                saveSettings();
                notifyToast('Референс внешности загружен.');
                renderWindow();
            } catch (err) {
                notifyToast('Не удалось загрузить референс: ' + err.message, true);
            } finally {
                el.value = '';
            }
            return;
        }
        if (el.id === 'nmf-cand-photo-upload' && el.files?.[0] && sess && state.candUploadTarget) {
            try {
                const { pool, idx } = state.candUploadTarget;
                const cand = resolveEntityFromPoolRef(sess, pool, idx);
                if (cand) {
                    const rawDataUrl = await readLosslessImageFileAsDataUrl(el.files[0]);
                    cand.originalAvatarId = '';
                    cand.croppedAspect = '';
                    const dims = await probeImageDimensionsFromDataUrl(rawDataUrl);
                    if (dims.w && dims.h) cand.artNaturalRatio = dims.w / dims.h;
                    state.artErrors.delete(cand.id);
                    state.unseenArtIds.delete(String(cand.id));
                    await assignEntityMediaWithFallback(cand, rawDataUrl, cand.avatarId || '');
                    saveSettings();
                    notifySuccessToast(tx(`Свой арт прикреплён к «${cand.name}»!`, `Custom art attached to "${cand.name}"!`));
                }
                renderWindow();
            } catch (err) {
                notifyToast('Не удалось прочитать файл: ' + err.message, true);
            } finally {
                state.candUploadTarget = null;
                el.value = '';
            }
            return;
        }
        if (el.id === 'nmf-avatar-upload' && el.files?.[0] && sess) {
            try {
                const rawLosslessDataUrl = await readLosslessImageFileAsDataUrl(el.files[0]);
                sess.card.originalAvatarId = '';
                sess.card.croppedAspect = '';
                const upDims = await probeImageDimensionsFromDataUrl(rawLosslessDataUrl);
                if (upDims.w && upDims.h) sess.card.artNaturalRatio = upDims.w / upDims.h;
                state.editorArtError = '';
                state.unseenArtIds.delete(sess.id + ':' + sess.activeCardSlot);
                const mediaRes = await assignEntityMediaWithFallback(sess.card, rawLosslessDataUrl, sess.card.avatarId || '');
                sess.card.avatarDirty = true;
                saveSettings();
                if (!mediaRes.durable) {
                    notifyToast('IndexedDB недоступна: фото удержано в резервном буфере — рекомендуем экспортировать PNG.', true);
                } else {
                    notifyToast('Изображение прикреплено.');
                }
                renderWindow();
            } catch (err) {
                notifyToast('Не удалось прочитать файл: ' + err.message, true);
            } finally {
                el.value = '';
            }
            return;
        }
        if (el.id === 'nmf-json-import' && el.files?.[0] && sess) {
            try {
                const txt = await el.files[0].text();
                const obj = JSON.parse(txt);
                // Strictly resets sourceAvatarId, previous avatar, and previous imagePrompt! (fixes NMF-004 & NMF-003)
                assignCardIntoSessionSlot(sess, 'manual', createCardStateFromImportedJson(obj));
                state.lastOverwriteAlert = null;
                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                saveSettings();
                notifyToast('JSON-карточка загружена как независимый черновик.');
                renderWindow();
            } catch (err) {
                notifyToast('Ошибка JSON: ' + err.message, true);
            } finally {
                el.value = '';
            }
        }
    });

    win.addEventListener('click', async (e) => {
        if (e.target?.id === 'nmf-intake-backdrop') {
            state.intakeSheetOpen = false;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-cand-edit-backdrop') {
            state.editingCandRef = null;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-overwrite-backdrop') {
            state.overwriteConfirmInfo = null;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-settings-backdrop') {
            state.settingsModalOpen = false;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-guide-backdrop') {
            state.guideModalOpen = false;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-translate-backdrop') {
            state.translateModalOpen = false;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-help-pop-backdrop') {
            state.helpPopoverKey = '';
            return renderWindow();
        }
        if (e.target?.id === 'nmf-cand-dossier-backdrop') {
            state.viewingCandRef = null;
            return renderWindow();
        }
        if (e.target?.id === 'nmf-cropper-backdrop') {
            if (!state.cropSaving) state.cropModalInfo = null;
            return renderWindow();
        }

        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const cfg = getSettings();
        const sess = getActiveSession();

        if (act === 'close-modal') return closeForgeDialog();
        if (act === 'open-home-tab') {
            state.activeTab = 'home';
            state.sessionTitleDraft = sess.title || '';
            return renderWindow();
        }
        if (act === 'toggle-home-card') {
            const key = String(btn.dataset.hcard || '');
            if (!state.homeOpenCards || typeof state.homeOpenCards !== 'object') {
                state.homeOpenCards = { sessions: false, mandatory: false, themeLang: false, gacha: false };
            }
            if (key) {
                const nextOpen = !Boolean(state.homeOpenCards[key]);
                if (key === 'themeLang' && nextOpen) state.homeOpenCards.gacha = false;
                if (key === 'gacha' && nextOpen) state.homeOpenCards.themeLang = false;
                state.homeOpenCards[key] = nextOpen;
                if (key === 'sessions' && nextOpen) {
                    state.sessionTitleDraft = sess.title || '';
                }
            }
            return renderWindow();
        }
        if (act === 'save-inline-session-title') {
            const inp = typeof document !== 'undefined' ? document.getElementById('nmf-home-sess-title-input') : null;
            const rawTitle = String((inp ? inp.value : state.sessionTitleDraft) || '').trim();
            if (rawTitle) {
                sess.title = rawTitle.slice(0, 36);
                state.sessionTitleDraft = sess.title;
                state.homeOpenCards.sessions = false;
                saveSettings();
                notifySuccessToast(tx(`Сессия переименована в «${sess.title}»!`, `Session renamed to "${sess.title}"!`));
            }
            return renderWindow();
        }
        if (act === 'set-ui-lang' || act === 'toggle-ui-lang') {
            const nextLang = act === 'set-ui-lang'
                ? (btn.dataset.lang === 'en' ? 'en' : 'ru')
                : (getUiLang() === 'en' ? 'ru' : 'en');
            cfg.uiLang = setUiLang(nextLang);
            saveSettings();
            syncExtSettingsPanel();
            return renderWindow();
        }
        if (act === 'toggle-sacrifice-fail-cfg') {
            cfg.gachaSacrificeFailEnabled = !cfg.gachaSacrificeFailEnabled;
            saveSettings();
            return renderWindow();
        }
        if (act === 'set-sacrifice-fail-pct') {
            const pct = Math.max(5, Math.min(90, Math.round(Number(btn.dataset.pct) || 25)));
            cfg.gachaSacrificeFailChance = pct;
            saveSettings();
            return renderWindow();
        }
        if (act === 'dismiss-sacrifice-fail') {
            state.lastSacrificeFailAlert = '';
            return renderWindow();
        }
        if (act === 'unveil-fresh-art') {
            e.stopPropagation();
            const k = String(btn.dataset.artkey || '');
            if (k) {
                state.unseenArtIds.delete(k);
                state.justUnveiledArtIds.add(k);
            }
            return renderWindow();
        }
        if (act === 'unpack-wish-cards') {
            if (state.wishRevealState) {
                startWishCometAndFlip(state.wishRevealState.maxStars || 4, Boolean(state.wishRevealState.isFusion));
            }
            return renderWindow();
        }
        if (act === 'set-grid-filter') {
            state.gridFilterMode = btn.dataset.flt || 'all';
            return renderWindow();
        }
        if (act === 'open-pending-wish-stage') {
            const pw = state.pendingWishReveal;
            state.pendingWishReveal = null;
            if (pw?.sessionId && cfg.sessions.some((s) => s.id === pw.sessionId) && cfg.activeSessionId !== pw.sessionId) {
                cfg.activeSessionId = pw.sessionId;
                saveSettings();
                await hydrateSessionsMedia(cfg.sessions, [], cfg.savedVault || []);
            }
            const targetSess = getActiveSession();
            targetSess.homeCompleted = true;
            if (pw?.isFusion) {
                state.activeTab = 'matches';
                state.matchesSubTab = 'gacha_collection';
            } else {
                state.activeTab = 'swipe';
                state.discoverSubMode = 'gacha';
            }
            const batch = targetSess.gacha?.lastRevealBatch || [];
            const maxSt = pw?.maxStars || (batch.length ? Math.max(...batch.map((x) => Number(x.stars) || 3)) : 4);
            startWishCometAndFlip(maxSt, Boolean(pw?.isFusion));
            return renderWindow();
        }
        if (act === 'unpack-match-cards') {
            if (state.matchRevealState) {
                state.matchRevealState.phase = 'unpacked';
            }
            return renderWindow();
        }
        if (act === 'open-pending-match-stage') {
            const pm = state.pendingMatchReveal;
            state.pendingMatchReveal = false;
            const cnt = typeof pm === 'object' ? (Number(pm.count) || 1) : (Number(pm) || 1);
            if (pm?.sessionId && cfg.sessions.some((s) => s.id === pm.sessionId) && cfg.activeSessionId !== pm.sessionId) {
                cfg.activeSessionId = pm.sessionId;
                saveSettings();
                await hydrateSessionsMedia(cfg.sessions, [], cfg.savedVault || []);
            }
            const targetSess = getActiveSession();
            targetSess.homeCompleted = true;
            state.activeTab = 'swipe';
            state.discoverSubMode = 'swipe';
            openMatchSignalReveal(cnt);
            if (state.matchRevealState) state.matchRevealState.phase = 'unpacked';
            return renderWindow();
        }
        if (act === 'toggle-home-mandatory') {
            state.homeOpenCards.mandatory = !state.homeOpenCards.mandatory;
            return renderWindow();
        }
        if (act === 'pick-home-transport') {
            cfg.transportMode = btn.dataset.mode === 'json_schema' ? 'json_schema' : 'prefill_user_msg';
            saveSettings();
            syncExtSettingsPanel();
            return renderWindow();
        }
        if (act === 'pick-home-format') {
            if (sess.frozen) return;
            sess.intake.cardFormat = btn.dataset.fmt || 'dossier_19';
            saveSettings();
            return renderWindow();
        }
        if (act === 'trigger-cand-upload') {
            state.candUploadTarget = { pool: btn.dataset.pool || 'queue', idx: Number(btn.dataset.idx) || 0 };
            win.querySelector('#nmf-cand-photo-upload')?.click();
            return;
        }
        if (act === 'open-settings-modal') {
            state.settingsOpenSection = '';
            state.settingsModalOpen = true;
            state.themeDrawerOpen = false;
            state.sessionsDrawerOpen = false;
            return renderWindow();
        }
        if (act === 'open-settings-template') {
            state.settingsOpenSection = 'template';
            state.settingsModalOpen = true;
            state.themeDrawerOpen = false;
            state.sessionsDrawerOpen = false;
            return renderWindow();
        }
        if (act === 'clear-session-intake') {
            if (sess.frozen) return;
            resetSessionStoryIntake(sess);
            saveSettings();
            notifySuccessToast('Сюжетная Анкета сессии очищена!');
            return renderWindow();
        }
        if (act === 'launch-mode-from-home') {
            sess.homeCompleted = true;
            const m = btn.dataset.mode || 'swipe';
            if (m === 'gacha') {
                state.activeTab = 'swipe';
                state.discoverSubMode = 'gacha';
            } else if (m === 'swipe') {
                state.activeTab = 'swipe';
                state.discoverSubMode = 'swipe';
            } else {
                state.activeTab = m;
            }
            saveSettings();
            return renderWindow();
        }
        if (act === 'close-match-reveal') {
            if (state.matchRevealState?.timerId) clearTimeout(state.matchRevealState.timerId);
            state.matchRevealState = null;
            return renderWindow();
        }
        if (act === 'toggle-art-refine') {
            const rk = String(btn.dataset.rkey || '');
            state.artRefineOpenKey = state.artRefineOpenKey === rk ? '' : rk;
            return renderWindow();
        }
        if (act === 'run-refine-prompt-and-art') {
            const rk = String(btn.dataset.rkey || 'editor');
            const hint = String(state.artRefineHint || '').trim();
            let targetEntity = sess.card;
            let candRef = null;
            if (rk === 'dossier' && state.viewingCandRef) {
                candRef = state.viewingCandRef;
                targetEntity = resolveEntityFromPoolRef(sess, candRef.pool, candRef.idx);
            } else if (rk === 'lightbox' && state.lightboxInfo?.targetKind === 'cand') {
                candRef = { pool: state.lightboxInfo.pool, idx: state.lightboxInfo.idx };
                targetEntity = resolveEntityFromPoolRef(sess, candRef.pool, candRef.idx);
            }
            if (!targetEntity) return;

            let updatedPrompt = '';
            const ok = await withBusy('Обновляем промпт внешности с вашим уточнением', async (signal) => {
                const req = buildVisualPromptRefinementRequest(targetEntity, hint, sess.intake, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const nextP = parseVisualPromptRefinementResponse(raw);
                if (!nextP) throw new Error('Модель вернула пустой промпт изображения.');
                updatedPrompt = nextP;
                targetEntity.imagePrompt = nextP;
                if (targetEntity === sess.card) markCardFieldDirty(sess.card, 'imagePrompt');
                if (state.lightboxInfo) state.lightboxInfo.imagePrompt = nextP;
                state.artRefineOpenKey = '';
                state.artRefineHint = '';
                saveSettings();
            }, { taskType: 'llm', cancellable: true });

            if (ok && updatedPrompt) {
                if (rk === 'lightbox') state.lightboxInfo = null;
                if (targetEntity === sess.card) {
                    win.querySelector('[data-act="gen-editor-art"]')?.click();
                } else {
                    triggerCandidateArtInBackground(targetEntity, true);
                }
            }
            return;
        }
        if (act === 'close-settings-modal') {
            state.settingsModalOpen = false;
            return renderWindow();
        }
        if (act === 'open-guide-modal') {
            state.guideModalOpen = true;
            return renderWindow();
        }
        if (act === 'close-guide-modal') {
            state.guideModalOpen = false;
            return renderWindow();
        }
        if (act === 'open-help') {
            state.helpPopoverKey = String(btn.dataset.help || '');
            return renderWindow();
        }
        if (act === 'close-help-pop') {
            state.helpPopoverKey = '';
            return renderWindow();
        }
        if (act === 'open-full-guide-from-help') {
            state.helpPopoverKey = '';
            state.guideModalOpen = true;
            return renderWindow();
        }
        if (act === 'toggle-strip-active-char') {
            cfg.stripActiveCharFromPreset = !(cfg.stripActiveCharFromPreset !== false);
            saveSettings();
            return renderWindow();
        }
        if (act === 'toggle-gacha-timer-cfg') {
            cfg.gachaTimerEnabled = !(cfg.gachaTimerEnabled !== false);
            saveSettings();
            return renderWindow();
        }
        if (act === 'switch-card-slot') {
            syncSessionActiveSlot(sess, btn.dataset.slot);
            state.lastOverwriteAlert = null;
            saveSettings();
            return renderWindow();
        }
        if (act === 'open-translate-modal') {
            state.translateModalOpen = true;
            return renderWindow();
        }
        if (act === 'close-translate-modal') {
            state.translateModalOpen = false;
            return renderWindow();
        }
        if (act === 'run-card-translation') {
            const c = sess.card;
            if (!c.description && !c.first_mes) {
                notifyToast('Сначала заполните или сгенерируйте карточку для перевода.', true);
                return;
            }
            const rawLang = state.translateTargetLang || sess.intake?.userLanguage || 'Русский';
            const targetLang = rawLang === '{{language}}' ? detectUserLocaleLanguage() : (stripAccidentalLanguageBraces(rawLang) || 'Русский');
            await withBusy(`Переводим карточку на ${targetLang}`, async (signal) => {
                const req = buildCardTranslationRequest(c, targetLang, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                c.savedTranslation = parseCardTranslationResponse(raw, c, targetLang, sess.intake.playerNameMode || 'macro');
                saveSettings();
                notifySuccessToast(`Перевод (${targetLang}) готов для просмотра!`);
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'apply-translation-to-card') {
            const tr = sess.card.savedTranslation;
            if (!tr) return;
            sess.card.name = tr.name || sess.card.name;
            sess.card.description = tr.description || sess.card.description;
            sess.card.personality = tr.personality || sess.card.personality;
            sess.card.scenario = tr.scenario || sess.card.scenario;
            sess.card.first_mes = tr.first_mes || sess.card.first_mes;
            if (Array.isArray(tr.alternate_greetings) && tr.alternate_greetings.length) {
                sess.card.alternate_greetings = [...tr.alternate_greetings];
            }
            if (tr.mes_example) sess.card.mes_example = tr.mes_example;
            if (tr.creator_notes) sess.card.creator_notes = tr.creator_notes;
            for (const f of ['name', 'description', 'personality', 'scenario', 'first_mes', 'alternate_greetings', 'mes_example', 'creator_notes']) {
                markCardFieldDirty(sess.card, f);
            }
            state.translateModalOpen = false;
            saveSettings();
            notifySuccessToast(`Карточка переведена на ${tr.lang}!`);
            return renderWindow();
        }
        if (act === 'save-translation-to-vault' || act === 'save-card-to-vault') {
            const useTr = act === 'save-translation-to-vault' && sess.card.savedTranslation;
            const srcCard = sess.card;
            if (!srcCard.name && !srcCard.description && !srcCard.first_mes) {
                notifyToast('Карточка пуста — нечего отправлять в Хранилище.', true);
                return;
            }
            if (!Array.isArray(cfg.savedVault)) cfg.savedVault = [];
            const clone = structuredClone(srcCard);
            clone.vaultId = `vault_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
            clone.originMethod = sess.activeCardSlot || 'manual';
            clone.savedAt = Date.now();
            clone.sourceAvatarId = '';
            clone.sourceLoadedFromTavern = false;
            clone.originalCardData = null;
            // Must allocate an independent media ID so future Profile edits/clears NEVER mutate this saved Vault card!
            clone.avatarId = '';
            clone.originalAvatarId = '';
            clone.avatarDataUrl = '';
            if (useTr) {
                const tr = srcCard.savedTranslation;
                clone.name = tr.name || clone.name;
                clone.description = tr.description || clone.description;
                clone.personality = tr.personality || clone.personality;
                clone.scenario = tr.scenario || clone.scenario;
                clone.first_mes = tr.first_mes || clone.first_mes;
                if (tr.alternate_greetings?.length) clone.alternate_greetings = [...tr.alternate_greetings];
                if (tr.mes_example) clone.mes_example = tr.mes_example;
                if (tr.creator_notes) clone.creator_notes = tr.creator_notes;
            }
            const curImg = resolveEntityAvatarUrl(srcCard);
            if (curImg) {
                await assignEntityMediaWithFallback(clone, curImg, '');
            }
            cfg.savedVault.unshift(clone);
            if (cfg.savedVault.length > MAX_SAVED_VAULT) {
                cfg.savedVault.length = MAX_SAVED_VAULT;
                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault);
            }
            if (useTr) state.translateModalOpen = false;
            saveSettings();
            notifySuccessToast(`«${clone.name || 'Карточка'}» сохранена в Хранилище!`);
            return renderWindow();
        }
        if (act === 'load-vault-to-editor') {
            const v = cfg.savedVault?.[Number(btn.dataset.idx)];
            if (!v) return;
            const copy = structuredClone(v);
            delete copy.vaultId;
            copy.avatarId = '';
            copy.originalAvatarId = '';
            copy.avatarDataUrl = '';
            const vImg = resolveEntityAvatarUrl(v);
            if (vImg) await assignEntityMediaWithFallback(copy, vImg, '');
            assignCardIntoSessionSlot(sess, 'manual', copy);
            state.activeTab = 'editor';
            state.editorSubTab = 'main';
            saveSettings();
            notifyToast(`«${copy.name}» открыта в слоте «Ручной»!`);
            return renderWindow();
        }
        if (act === 'open-vault-lightbox') {
            const v = cfg.savedVault?.[Number(btn.dataset.idx)];
            if (!v) return;
            state.lightboxInfo = {
                name: v.name || 'Хранилище',
                imageUrl: resolveEntityAvatarUrl(v),
                displayUrl: resolveEntityDisplayUrl(v),
                appearance: '',
                imagePrompt: String(v.imagePrompt || '').trim(),
            };
            return renderWindow();
        }
        if (act === 'export-vault-png') {
            const v = cfg.savedVault?.[Number(btn.dataset.idx)];
            if (!v) return;
            const blob = await buildCardPngBlob(v, getThemeColor(), {
                aspectRatio: resolveCardExportAspectRatio(v, cfg),
                cropFocus: cfg.imageCropFocus || 'top',
            }, resolveEntityAvatarUrl(v));
            const slug = (v.name || 'Character').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'Character';
            triggerDownload(blob, `${slug}.png`);
            notifySuccessToast(`«${slug}.png» скачан из Хранилища!`);
            return;
        }
        if (act === 'del-vault-item') {
            cfg.savedVault?.splice(Number(btn.dataset.idx), 1);
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
            saveSettings();
            return renderWindow();
        }
        if (act === 'minimize-busy') {
            state.busyMinimized = true;
            return renderWindow();
        }
        if (act === 'expand-busy') {
            state.busyMinimized = false;
            return renderWindow();
        }
        if (act === 'minimize-art-vis') {
            state.artVisualizerMinimized = true;
            for (const st of state.artStatuses.values()) {
                st.userExpanded = false;
                st.minimizedByDefault = true;
            }
            return renderWindow();
        }
        if (act === 'expand-art-vis') {
            state.artVisualizerMinimized = false;
            for (const st of state.artStatuses.values()) {
                st.userExpanded = true;
            }
            return renderWindow();
        }
        if (act === 'open-cand-dossier') {
            state.viewingCandRef = { pool: btn.dataset.pool || 'liked', idx: Number(btn.dataset.idx) || 0 };
            return renderWindow();
        }
        if (act === 'close-cand-dossier') {
            state.viewingCandRef = null;
            return renderWindow();
        }
        if (act === 'gen-dossier-art') {
            const cand = resolveEntityFromPoolRef(sess, btn.dataset.pool || 'liked', Number(btn.dataset.idx) || 0);
            if (cand) triggerCandidateArtInBackground(cand, true);
            return;
        }
        if (act === 'expand-from-dossier') {
            const ref = state.viewingCandRef;
            if (!ref) return;
            const cand = resolveEntityFromPoolRef(sess, ref.pool, ref.idx);
            state.viewingCandRef = null;
            if (cand) await expandCandidateIntoFullCard(sess, cand, cfg.transportMode, ref.pool === 'gacha_collection' ? 'gacha' : '');
            return;
        }
        if (act === 'open-crop-editor') {
            await openArtCropperForTarget(sess, 'editor');
            return;
        }
        if (act === 'open-crop-cand') {
            await openArtCropperForTarget(sess, 'cand', btn.dataset.pool || 'queue', Number(btn.dataset.idx) || 0);
            return;
        }
        if (act === 'open-crop-from-lightbox') {
            const lb = state.lightboxInfo;
            state.lightboxInfo = null;
            if (lb?.targetKind === 'cand') {
                await openArtCropperForTarget(sess, 'cand', lb.pool, lb.idx);
            } else {
                await openArtCropperForTarget(sess, 'editor');
            }
            return;
        }
        if (act === 'close-cropper') {
            state.cropModalInfo = null;
            return renderWindow();
        }
        if (act === 'crop-set-ratio') {
            if (state.cropModalInfo) {
                state.cropModalInfo.aspectRatio = btn.dataset.ratio || '1:1';
                renderWindow();
            }
            return;
        }
        if (act === 'crop-preset-face') {
            if (state.cropModalInfo) {
                state.cropModalInfo.zoom = 1.15;
                state.cropModalInfo.panX = 50;
                state.cropModalInfo.panY = 8;
                renderWindow();
            }
            return;
        }
        if (act === 'crop-preset-center') {
            if (state.cropModalInfo) {
                state.cropModalInfo.zoom = 1;
                state.cropModalInfo.panX = 50;
                state.cropModalInfo.panY = 50;
                renderWindow();
            }
            return;
        }
        if (act === 'restore-uncropped-art') {
            const ci = state.cropModalInfo;
            if (!ci) return;
            const entity = ci.targetKind === 'editor' ? sess.card : resolveEntityFromPoolRef(sess, ci.pool, ci.idx);
            if (entity && entity.originalAvatarId) {
                const origUrl = resolveOriginalEntityMediaUrl(entity);
                if (origUrl) {
                    await assignEntityMediaWithFallback(entity, origUrl, entity.avatarId || '');
                    entity.originalAvatarId = '';
                    entity.croppedAspect = '';
                    const rDims = await probeImageDimensionsFromDataUrl(origUrl);
                    if (rDims.w && rDims.h) entity.artNaturalRatio = rDims.w / rDims.h;
                    if (ci.targetKind === 'editor') entity.avatarDirty = true;
                    state.cropModalInfo = null;
                    await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                    saveSettings();
                    notifySuccessToast('Полный необрезанный оригинал арта восстановлен!');
                    return renderWindow();
                }
            }
            return;
        }
        if (act === 'apply-art-crop') {
            const ci = state.cropModalInfo;
            if (!ci || state.cropSaving) return;
            const entity = ci.targetKind === 'editor' ? sess.card : resolveEntityFromPoolRef(sess, ci.pool, ci.idx);
            if (!entity) return;
            state.cropSaving = true;
            const applyBtn = document.getElementById('nmf-apply-crop-btn');
            if (applyBtn) {
                applyBtn.disabled = true;
                applyBtn.textContent = 'Сохраняем кадр без потери качества, подождите...';
            }
            // Yield 1 paint frame so the user immediately sees the waiting indicator before 4K canvas encoding!
            await new Promise((r) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => setTimeout(r, 18)) : setTimeout(r, 18)));
            try {
                const geom = computeLosslessCropGeometry(ci.imgW, ci.imgH, ci);
                const croppedDataUrl = await cropImageDataUrlLossless(ci.sourceDataUrl, ci);
                if (!entity.originalAvatarId) {
                    const backupMasterUrl = resolveEntityAvatarUrl(entity) || ci.sourceDataUrl;
                    if (backupMasterUrl) {
                        const origId = await saveMediaDataUrl(backupMasterUrl);
                        if (origId) entity.originalAvatarId = origId;
                    }
                }
                const newCroppedId = (entity.avatarId && entity.avatarId !== entity.originalAvatarId) ? entity.avatarId : '';
                await assignEntityMediaWithFallback(entity, croppedDataUrl, newCroppedId);
                entity.croppedAspect = ci.aspectRatio || '1:1';
                entity.artNaturalRatio = geom.outW / Math.max(1, geom.outH);
                if (ci.targetKind === 'editor') entity.avatarDirty = true;
                state.cropSaving = false;
                state.cropModalInfo = null;
                saveSettings();
                notifySuccessToast('Кадрирование применено в полном разрешении (оригинал сохранён в запасе)!');
                return renderWindow();
            } catch (err) {
                state.cropSaving = false;
                renderWindow();
                notifyToast('Не удалось обрезать арт: ' + err.message, true);
                return;
            }
        }
        if (act === 'open-cand-lightbox') {
            const poolName = btn.dataset.pool || 'queue';
            const idx = Number(btn.dataset.idx) || 0;
            const cand = resolveEntityFromPoolRef(sess, poolName, idx);
            if (!cand) return;
            state.lightboxInfo = {
                targetKind: 'cand',
                pool: poolName,
                idx,
                name: cand.name || 'Анкета',
                imageUrl: resolveEntityAvatarUrl(cand),
                displayUrl: resolveEntityDisplayUrl(cand),
                appearance: String(cand.appearance || '').trim(),
                imagePrompt: String(cand.imagePrompt || '').trim(),
            };
            return renderWindow();
        }
        if (act === 'open-editor-lightbox') {
            state.lightboxInfo = {
                targetKind: 'editor',
                pool: '',
                idx: 0,
                name: sess.card.name || 'Профиль',
                imageUrl: resolveEntityAvatarUrl(sess.card),
                displayUrl: resolveEntityDisplayUrl(sess.card),
                appearance: '',
                imagePrompt: String(sess.card.imagePrompt || '').trim(),
            };
            return renderWindow();
        }
        if (act === 'close-lightbox') {
            state.lightboxInfo = null;
            return renderWindow();
        }
        if (act === 'lightbox-download-img') {
            if (!state.lightboxInfo?.imageUrl) return;
            try {
                const { blob, ext } = dataUrlToPureBlob(state.lightboxInfo.imageUrl);
                const slug = String(state.lightboxInfo.name || 'Artwork').trim().replace(/[\\/:*?"<>|]+/g, '_');
                triggerDownload(blob, `${slug}_art.${ext}`);
                notifySuccessToast(`Чистый арт «${slug}_art.${ext}» отправлен в Загрузки!`);
            } catch (err) {
                notifyToast('Не удалось скачать арт: ' + err.message, true);
            }
            return;
        }
        if (act === 'lightbox-copy-looks') {
            if (!state.lightboxInfo) return;
            const lines = [
                state.lightboxInfo.name ? `Имя / Образ: ${state.lightboxInfo.name}` : '',
                state.lightboxInfo.appearance ? `Внешность:\n${state.lightboxInfo.appearance}` : '',
                state.lightboxInfo.imagePrompt ? `Image Prompt (EN):\n${state.lightboxInfo.imagePrompt}` : '',
            ].filter(Boolean).join('\n\n');
            if (!lines) {
                notifyToast('Поле внешности пока пустое.', true);
                return;
            }
            try {
                await navigator.clipboard.writeText(lines);
                notifySuccessToast('Описание внешности и промпт скопированы в буфер!');
            } catch {
                notifyToast('Буфер недоступен — нажмите «Внешность .TXT» для сохранения файла.', true);
            }
            return;
        }
        if (act === 'lightbox-save-txt') {
            if (!state.lightboxInfo) return;
            const slug = String(state.lightboxInfo.name || 'Appearance').trim().replace(/[\\/:*?"<>|]+/g, '_');
            const bodyTxt = [
                `=== NEXUSMATCH FORGE // SAVED APPEARANCE ===`,
                `Образ: ${state.lightboxInfo.name || 'Без имени'}`,
                ``,
                `[ОПИСАНИЕ ВНЕШНОСТИ]`,
                state.lightboxInfo.appearance || '(не заполнено)',
                ``,
                `[IMAGE PROMPT (EN)]`,
                state.lightboxInfo.imagePrompt || '(не заполнено)',
                ``,
            ].join('\n');
            triggerDownload(new Blob([bodyTxt], { type: 'text/plain;charset=utf-8' }), `${slug}_appearance.txt`);
            notifySuccessToast(`Описание внешности «${slug}_appearance.txt» скачано!`);
            return;
        }
        if (act === 'lightbox-apply-to-editor') {
            if (!state.lightboxInfo) return;
            const info = state.lightboxInfo;
            if (info.imageUrl) {
                await assignEntityMediaWithFallback(sess.card, info.imageUrl, sess.card.avatarId || '');
                sess.card.avatarDirty = true;
            }
            if (info.imagePrompt) {
                sess.card.imagePrompt = info.imagePrompt;
                markCardFieldDirty(sess.card, 'imagePrompt');
            }
            if (info.appearance && !sess.card.description.includes(info.appearance)) {
                const block = `[Внешность / Образ]:\n${info.appearance.trim()}`;
                sess.card.description = sess.card.description.trim()
                    ? `${block}\n\n${sess.card.description.trim()}`
                    : block;
                markCardFieldDirty(sess.card, 'description');
            }
            state.lightboxInfo = null;
            state.activeTab = 'editor';
            state.editorSubTab = 'main';
            saveSettings();
            notifySuccessToast('Внешность и арт перенесены в ваш Профиль!');
            return renderWindow();
        }
        if (act === 'cancel-busy') {
            requestCancelBusyTask();
            return;
        }
        if (act === 'cancel-overwrite-confirm') {
            state.overwriteConfirmInfo = null;
            return renderWindow();
        }
        if (act === 'confirm-overwrite-execute') {
            const allowOverride = Boolean(state.overwriteConfirmInfo?.externalWarning);
            await executeOverwriteFlow(sess, cfg, allowOverride);
            return;
        }
        if (act === 'dismiss-overwrite-alert') {
            state.lastOverwriteAlert = null;
            return renderWindow();
        }
        if (act === 'restore-card-backup' || act === 'force-restore-card-backup') {
            const bid = btn.dataset.bid;
            if (!bid) return;
            const isForced = act === 'force-restore-card-backup';
            const expectedHash = isForced
                ? ''
                : String(btn.dataset.ehash || state.lastOverwriteAlert?.observedSnapshotHash || sess.card.sourceSnapshotHash || '');

            await withBusy('Восстанавливаем карточку из страховочного бэкапа', async () => {
                try {
                    const res = await restoreCardFromBackupVault(bid, {
                        allowExternalChangeOverride: isForced,
                        expectedSnapshotHash: expectedHash,
                    });
                    const restoredState = createCardStateFromTavernChar(res.restoredChar, { avatarId: '' });
                    try {
                        const srcDataUrl = await urlToDataUrl(`/characters/${encodeURIComponent(res.fileName)}`);
                        await assignEntityMediaWithFallback(restoredState, srcDataUrl);
                    } catch {
                        restoredState.avatarId = '';
                    }
                    assignCardIntoSessionSlot(sess, sess.activeCardSlot || 'manual', restoredState);
                    state.lastOverwriteAlert = null;
                    await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                    saveSettings();
                    await Promise.all([refreshRosterData(), refreshBackupsList()]);
                    notifySuccessToast(`Оригинал «${sess.card.name}» полностью восстановлен из бэкапа!`);
                } catch (err) {
                    if (err?.code === 'EXTERNAL_CARD_MODIFIED' && !isForced) {
                        state.lastOverwriteAlert = {
                            code: 'RESTORE_CONFLICT',
                            message: err.message,
                            backupId: bid,
                            observedSnapshotHash: String(err.currentSnapshotHash || ''),
                            restoreConflictWarning: true,
                            targetAvatar: sess.card.sourceAvatarId || '',
                        };
                        return;
                    }
                    state.lastOverwriteAlert = {
                        code: String(err?.code || 'RESTORE_ERROR'),
                        message: String(err?.message || err),
                        backupId: bid,
                        observedSnapshotHash: expectedHash,
                        restoreConflictWarning: false,
                        targetAvatar: sess.card.sourceAvatarId || '',
                    };
                    throw err;
                }
            }, { taskType: 'save', cancellable: false });
            return;
        }
        if (act === 'download-card-backup') {
            const bak = await getCardBackupById(btn.dataset.bid);
            if (!bak) {
                notifyToast('Резервная копия не найдена.', true);
                return;
            }
            if (bak.pngBase64) {
                const bytes = base64ToBytes(bak.pngBase64);
                triggerDownload(new Blob([bytes], { type: 'image/png' }), `BACKUP_${bak.avatarFileName || 'card.png'}`);
            } else if (bak.cardJson) {
                const v2Blob = new Blob([JSON.stringify(bak.cardJson, null, 2)], { type: 'application/json' });
                triggerDownload(v2Blob, `BACKUP_${(bak.avatarFileName || 'card').replace(/\.png$/i, '')}.json`);
            }
            return;
        }
        if (act === 'open-intake-sheet') {
            state.intakeSheetOpen = true;
            return renderWindow();
        }
        if (act === 'close-intake-sheet') {
            state.intakeSheetOpen = false;
            return renderWindow();
        }
        if (act === 'open-gacha-prefs') {
            state.gachaPrefsOpen = true;
            return renderWindow();
        }
        if (act === 'close-gacha-prefs') {
            state.gachaPrefsOpen = false;
            saveSettings();
            return renderWindow();
        }
        if (act === 'clear-gacha-prefs') {
            if (sess.frozen) return;
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            sess.gacha.wishPrefs = createDefaultGachaWishPrefs();
            saveSettings();
            notifySuccessToast(tx('Анкета Гачи очищена — включена максимальная рандомизация!', 'Gacha Questionnaire cleared — maximum randomization active!'));
            return renderWindow();
        }
        if (act === 'intake-step') {
            state.intakeStep = btn.dataset.step;
            return renderWindow();
        }
        if (act === 'matches-sub') {
            state.matchesSubTab = btn.dataset.sub;
            return renderWindow();
        }
        if (act === 'discover-sub') {
            state.discoverSubMode = btn.dataset.sub === 'gacha' ? 'gacha' : 'swipe';
            return renderWindow();
        }
        if (act === 'open-gacha-collection') {
            if (state.wishRevealState?.timerId) clearTimeout(state.wishRevealState.timerId);
            state.wishRevealState = null;
            state.activeTab = 'matches';
            state.matchesSubTab = 'gacha_collection';
            return renderWindow();
        }
        if (act === 'go-to-gacha-banner') {
            state.activeTab = 'swipe';
            state.discoverSubMode = 'gacha';
            return renderWindow();
        }
        if (act === 'reopen-last-wish') {
            const batch = sess.gacha?.lastRevealBatch || [];
            if (batch.length) {
                const maxSt = Math.max(...batch.map((x) => Number(x.stars) || 3));
                state.wishRevealState = { phase: 'sealed', maxStars: maxSt, isFusion: false, timerId: null };
                renderWindow();
            }
            return;
        }
        if (act === 'wish-skip-comet') {
            if (state.wishRevealState) {
                if (state.wishRevealState.timerId) clearTimeout(state.wishRevealState.timerId);
                state.wishRevealState.phase = 'cards';
                state.wishRevealState.timerId = null;
            }
            return renderWindow();
        }
        if (act === 'close-wish-reveal') {
            if (state.wishRevealState?.timerId) clearTimeout(state.wishRevealState.timerId);
            state.wishRevealState = null;
            return renderWindow();
        }
        if (act === 'gacha-preset-tags') {
            if (sess.frozen) return;
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            sess.gacha.tagsInput = String(btn.dataset.tags || '');
            saveSettings();
            return renderWindow();
        }
        if (act === 'gacha-remove-tag') {
            if (sess.frozen || !sess.gacha) return;
            const curTags = parseGachaPlusTags(sess.gacha.tagsInput);
            curTags.splice(Number(btn.dataset.idx), 1);
            sess.gacha.tagsInput = curTags.join(' + ');
            saveSettings();
            return renderWindow();
        }
        const executePermanentSacrifice = async (targetId) => {
            if (!sess.gacha) return;
            const idx = (sess.gacha.collection || []).findIndex((x) => x.id === targetId);
            if (idx < 0 || !sess.gacha.collection?.[idx]) return;
            const target = sess.gacha.collection[idx];
            const gain = computeSacrificeWishGain(target.stars);
            sess.gacha.collection.splice(idx, 1);
            sess.gacha.lastRevealBatch = (sess.gacha.lastRevealBatch || []).filter((x) => x.id !== target.id);
            sess.gacha.fusionSlotIds = (sess.gacha.fusionSlotIds || []).filter((id) => id !== target.id);
            if (sess.blitz?.selectedCandidateRef === `gacha:${target.id}`) {
                sess.blitz.selectedCandidateRef = '';
            }
            if (!cfg.gachaWallet) cfg.gachaWallet = createDefaultGachaWallet();

            const outcome = rollSacrificeOutcome({
                sacrificeFailEnabled: Boolean(cfg.gachaSacrificeFailEnabled),
                sacrificeFailChance: Number(cfg.gachaSacrificeFailChance) || 25,
            });

            if (!sess.gacha.lastRevealBatch.length && state.wishRevealState) {
                state.wishRevealState = null;
            }
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);

            if (outcome.failed) {
                const failMsg = getThemedSacrificeFailMessage(cfg.theme, target.name);
                state.lastSacrificeFailAlert = failMsg;
                persistGachaWalletImmediately(cfg);
                notifyToast(failMsg, true);
                return;
            }

            state.lastSacrificeFailAlert = '';
            cfg.gachaWallet.bonusWishes = Math.min(999, Math.max(0, Number(cfg.gachaWallet.bonusWishes) || 0) + gain);
            persistGachaWalletImmediately(cfg);
            const walletNow = syncGachaWallClockCooldown(sess, cfg);
            notifySuccessToast(
                tx(
                    `«${target.name}» (${target.stars} зв.) принесена в жертву навсегда: +${gain} Молитв (доступно: ${walletNow.totalWishes})!`,
                    `"${target.name}" (${target.stars} stars) sacrificed forever: +${gain} Prayers (available: ${walletNow.totalWishes})!`,
                ),
            );
        };

        if (act === 'cancel-sacrifice-ritual') {
            state.pendingSacrifice = null;
            return renderWindow();
        }
        if (act === 'confirm-sacrifice-ritual') {
            const pending = state.pendingSacrifice;
            state.pendingSacrifice = null;
            if (!pending) return renderWindow();
            if (!cfg.gachaWallet) cfg.gachaWallet = createDefaultGachaWallet();
            cfg.gachaWallet.firstSacrificeConfirmed = true;
            await executePermanentSacrifice(pending.id);
            return renderWindow();
        }
        if (act === 'sacrifice-gacha-idx' || act === 'sacrifice-gacha-id') {
            if (!sess.gacha) return;
            const idx = act === 'sacrifice-gacha-idx'
                ? Number(btn.dataset.idx)
                : (sess.gacha.collection || []).findIndex((x) => x.id === btn.dataset.id);
            if (idx < 0 || !sess.gacha.collection?.[idx]) return;
            const target = sess.gacha.collection[idx];
            const gain = computeSacrificeWishGain(target.stars);

            reconcileGachaWalletFromLocalStorage(cfg);
            if (!cfg.gachaWallet?.firstSacrificeConfirmed) {
                state.pendingSacrifice = {
                    id: target.id,
                    name: target.name || tx('Незнакомец', 'Stranger'),
                    stars: Number(target.stars) || 3,
                    wishGain: gain,
                };
                return renderWindow();
            }
            await executePermanentSacrifice(target.id);
            return renderWindow();
        }
        if (act === 'gacha-wish') {
            if (sess.frozen) return;
            if (!sess.gacha) sess.gacha = createDefaultSession(1).gacha;
            const walletInfo = syncGachaWallClockCooldown(sess, cfg);
            const { coolingDown, leftMs, maxCap, totalWishes } = walletInfo;
            const wantedCount = Number(btn.dataset.count) === 3 ? 3 : 1;

            if (cfg.gachaTimerEnabled !== false && totalWishes < wantedCount) {
                const msg = coolingDown
                    ? tx(
                        `Недостаточно Молитв (${totalWishes}/${wantedCount}). Пул восстановится через ${formatRemainingMs(leftMs)} — или принесите карту в жертву!`,
                        `Not enough Prayers (${totalWishes}/${wantedCount}). Pool recharges in ${formatRemainingMs(leftMs)} — or sacrifice a card!`,
                    )
                    : tx(
                        `Доступно Молитв: ${totalWishes} (нужно ${wantedCount}).`,
                        `Available Prayers: ${totalWishes} (${wantedCount} needed).`,
                    );
                notifyToast(msg, true);
                return renderWindow();
            }

            const liveTextarea = typeof document !== 'undefined' ? document.getElementById('nmf-gacha-tags-textarea') : null;
            if (liveTextarea) sess.gacha.tagsInput = liveTextarea.value;
            const plusTags = parseGachaPlusTags(sess.gacha.tagsInput);
            if (plusTags.length < 3 || plusTags.length > 10) {
                notifyToast(tx('Впишите от 3 до 10 тегов через знак «+» или запятую.', 'Enter 3 to 10 tags separated by "+" or comma.'), true);
                return;
            }
            const count = cfg.gachaTimerEnabled === false ? wantedCount : Math.min(wantedCount, totalWishes);

            // External cryptographic randomizer with optional user Luck Rigging!
            const roll = rollGachaCycleRarities(count, Number(cfg.gachaWallet?.freeSpentInCycle) || 0, undefined, {
                maxCycleLimit: maxCap,
                startPitySince4Plus: Number(cfg.gachaWallet?.pitySince4Plus) || 0,
                luckMode: cfg.gachaLuckMode || 'fair',
            });

            await withBusy(count > 1 ? tx(`Молитва Призыва ×${count}`, `Summon Prayer ×${count}`) : tx('Молитва Призыва ×1', 'Summon Prayer ×1'), async (signal) => {
                const req = buildGachaSummonRequest(sess, plusTags, roll.rarities, cfg.transportMode, {
                    savedVault: cfg.savedVault || [],
                });
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const drops = parseGachaSummonResponse(raw, roll.rarities, plusTags, sess.intake.playerNameMode || 'macro').slice(0, count);
                if (!drops.length) throw new Error(tx('Не удалось распознать выбитых героев.', 'Could not parse summoned characters.'));

                spendGachaWalletWishes(cfg.gachaWallet, drops.length, {
                    maxCap,
                    timerEnabled: cfg.gachaTimerEnabled !== false,
                    cooldownMinutes: Number(cfg.gachaCooldownMinutes) || 120,
                    nowMs: Date.now(),
                });
                cfg.gachaWallet.pitySince4Plus = roll.nextPitySince4Plus;
                sess.gacha.totalPulls = (Number(sess.gacha.totalPulls) || 0) + drops.length;

                for (const d of drops) {
                    const shortN = String(d.name || '').split(',')[0].trim();
                    if (shortN && !sess.gacha.recentNamesPool.includes(shortN)) {
                        sess.gacha.recentNamesPool.push(shortN);
                    }
                }
                sess.gacha.collection.unshift(...drops);
                if (sess.gacha.collection.length > MAX_GACHA_COLLECTION) {
                    sess.gacha.collection.length = MAX_GACHA_COLLECTION;
                    await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                }
                sess.gacha.lastRevealBatch = drops;
                persistGachaWalletImmediately(cfg);

                const maxSt = Math.max(...drops.map((x) => Number(x.stars) || 3));
                if (!isForgeDialogVisible() || state.busyMinimized || state.activeTab !== 'swipe' || state.discoverSubMode !== 'gacha') {
                    state.pendingWishReveal = { sessionId: sess.id, maxStars: maxSt, isFusion: false };
                } else {
                    openWishRevealAnimation(maxSt, false);
                }
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'gacha-toggle-fusion-slot') {
            if (!sess.gacha) return;
            const cid = String(btn.dataset.id || '');
            if (!Array.isArray(sess.gacha.fusionSlotIds)) sess.gacha.fusionSlotIds = [];
            const idx = sess.gacha.fusionSlotIds.indexOf(cid);
            if (idx >= 0) {
                sess.gacha.fusionSlotIds.splice(idx, 1);
            } else {
                if (sess.gacha.fusionSlotIds.length >= 3) {
                    notifyToast(tx('В Алтарь Слияния можно поместить максимум 3 карточки.', 'You can place at most 3 cards on the Altar.'), true);
                    return;
                }
                sess.gacha.fusionSlotIds.push(cid);
            }
            saveSettings();
            return renderWindow();
        }
        if (act === 'gacha-clear-fusion') {
            if (sess.gacha) {
                sess.gacha.fusionSlotIds = [];
                saveSettings();
            }
            return renderWindow();
        }
        if (act === 'toggle-gacha-fusion-artrefs') {
            if (sess.gacha) {
                sess.gacha.fusionArtRefs = !sess.gacha.fusionArtRefs;
                saveSettings();
            }
            return renderWindow();
        }
        if (act === 'gacha-run-fusion') {
            if (sess.frozen || !sess.gacha) return;
            const col = sess.gacha.collection || [];
            const donors = (sess.gacha.fusionSlotIds || []).map((id) => col.find((x) => x.id === id)).filter(Boolean);
            if (donors.length < 2) {
                notifyToast(tx('Выберите минимум 2 карточки из Коллекции для Слияния.', 'Select at least 2 cards from Collection for Fusion.'), true);
                return;
            }
            let synthesizedDrop = null;
            const donorRefUrls = sess.gacha.fusionArtRefs
                ? donors.map((d) => resolveEntityAvatarUrl(d)).filter(Boolean)
                : null;

            state.altarFusionBusy = true;
            state.altarDonorSnapshot = donors.map((d) => ({ name: d.name, stars: d.stars }));
            renderWindow();

            try {
                const ok = await withBusy(tx('Синтез Алтаря: рождение героя', 'Altar Synthesis: forging new hero'), async (signal) => {
                    const hintUsed = sess.gacha.fusionHint || '';
                    const req = buildGachaFusionRequest(sess, donors, hintUsed, cfg.transportMode);
                    const raw = await runLlmGeneration({
                        ...req,
                        transportMode: cfg.transportMode,
                        presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                        stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                        signal,
                    });
                    const born = parseGachaFusionResponse(raw, donors, sess.intake.playerNameMode || 'macro', hintUsed);
                    // True Altar Absorption: consume & permanently remove donor cards now that the new hero is born!
                    const consumedIds = new Set(donors.map((d) => d.id));
                    sess.gacha.collection = (sess.gacha.collection || []).filter((x) => !consumedIds.has(x.id));
                    sess.gacha.lastRevealBatch = (sess.gacha.lastRevealBatch || []).filter((x) => !consumedIds.has(x.id));
                    if (sess.blitz?.selectedCandidateRef && [...consumedIds].some((id) => sess.blitz.selectedCandidateRef === `gacha:${id}`)) {
                        sess.blitz.selectedCandidateRef = '';
                    }
                    sess.gacha.collection.unshift(born);
                    if (sess.gacha.collection.length > MAX_GACHA_COLLECTION) {
                        sess.gacha.collection.length = MAX_GACHA_COLLECTION;
                    }
                    await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                    sess.gacha.lastRevealBatch = [born];
                    sess.gacha.fusionSlotIds = [];
                    sess.gacha.fusionHint = '';
                    synthesizedDrop = born;
                    saveSettings();
                    const stillWatchingAltar = isForgeDialogVisible()
                        && !state.busyMinimized
                        && state.activeTab === 'matches'
                        && state.matchesSubTab === 'gacha_collection';
                    // User is watching the Altar right now -> immediately launch Comet + 3D Card Flip!
                    if (!stillWatchingAltar) {
                        state.pendingWishReveal = { sessionId: sess.id, maxStars: Number(born.stars) || 5, isFusion: true };
                    } else {
                        startWishCometAndFlip(Number(born.stars) || 5, true);
                    }
                }, { taskType: 'llm', cancellable: true });

                if (ok && synthesizedDrop && donorRefUrls && donorRefUrls.length > 0 && cfg.imageSource !== 'off' && detectImageExtensions().hasAny) {
                    // Run silently in background without stealing overlay focus from the Fusion reveal!
                    triggerCandidateArtInBackground(synthesizedDrop, false, donorRefUrls);
                }
            } finally {
                state.altarFusionBusy = false;
                state.altarDonorSnapshot = [];
                renderWindow();
            }
            return;
        }
        if (act === 'regen-altar-char') {
            if (sess.frozen || !sess.gacha) return;
            const cid = String(btn.dataset.id || '');
            const colIdx = (sess.gacha.collection || []).findIndex((x) => x.id === cid);
            const target = colIdx >= 0
                ? sess.gacha.collection[colIdx]
                : (sess.gacha.lastRevealBatch || []).find((x) => x.id === cid);
            if (!target || !target.fusedFromNames?.length) return;

            const savedDonors = Array.isArray(target.fusedFromDonors) && target.fusedFromDonors.length >= 2
                ? target.fusedFromDonors
                : target.fusedFromNames.map((nm) => ({
                    name: nm,
                    stars: target.stars || 4,
                    archetype: target.archetype || '',
                    pitch: '',
                    appearance: '',
                    tags: target.tags || [],
                }));
            const savedHint = [
                target.fusionHintUsed || '',
                `IMPORTANT: Create a COMPLETELY DIFFERENT character and concept from "${target.name}" while fusing these donor souls anew!`,
            ].filter(Boolean).join(' — ');

            await withBusy(tx('Перерождение героя на Алтаре', 'Reforging Altar hero'), async (signal) => {
                const req = buildGachaFusionRequest(sess, savedDonors, savedHint, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const reborn = parseGachaFusionResponse(raw, savedDonors, sess.intake.playerNameMode || 'macro', target.fusionHintUsed || '');
                reborn.id = target.id;
                reborn.stars = target.stars || reborn.stars;
                reborn.fusedFromNames = [...target.fusedFromNames];
                reborn.fusedFromDonors = savedDonors;
                reborn.fusionHintUsed = target.fusionHintUsed || '';

                state.unseenArtIds.delete(String(target.id));
                if (colIdx >= 0) sess.gacha.collection[colIdx] = reborn;
                const revIdx = (sess.gacha.lastRevealBatch || []).findIndex((x) => x.id === cid);
                if (revIdx >= 0) sess.gacha.lastRevealBatch[revIdx] = reborn;

                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                saveSettings();
                notifySuccessToast(tx(`Алтарь переродил героя: «${reborn.name}»!`, `Altar reforged hero: "${reborn.name}"!`));
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'gen-gacha-item-art') {
            const cid = String(btn.dataset.id || '');
            const item = (sess.gacha?.collection || []).find((x) => x.id === cid)
                || (sess.gacha?.lastRevealBatch || []).find((x) => x.id === cid);
            if (item) triggerCandidateArtInBackground(item, true);
            return;
        }
        if (act === 'expand-gacha') {
            const item = sess.gacha?.collection?.[Number(btn.dataset.idx)];
            if (item) {
                state.wishRevealState = null;
                await expandCandidateIntoFullCard(sess, item, cfg.transportMode);
            }
            return;
        }
        if (act === 'expand-gacha-id') {
            const cid = String(btn.dataset.id || '');
            const item = (sess.gacha?.collection || []).find((x) => x.id === cid)
                || (sess.gacha?.lastRevealBatch || []).find((x) => x.id === cid);
            if (item) {
                if (state.wishRevealState?.timerId) clearTimeout(state.wishRevealState.timerId);
                state.wishRevealState = null;
                await expandCandidateIntoFullCard(sess, item, cfg.transportMode);
            }
            return;
        }
        if (act === 'del-gacha') {
            const idx = Number(btn.dataset.idx);
            const removed = sess.gacha?.collection?.splice(idx, 1)?.[0];
            if (removed && Array.isArray(sess.gacha?.fusionSlotIds)) {
                sess.gacha.fusionSlotIds = sess.gacha.fusionSlotIds.filter((id) => id !== removed.id);
            }
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
            saveSettings();
            return renderWindow();
        }
        if (act === 'use-card-avatar-as-ref') {
            const curImg = resolveEntityAvatarUrl(sess.card);
            if (curImg) {
                if (!sess.artRefCustom) sess.artRefCustom = { avatarId: '', avatarDataUrl: '', description: '' };
                await assignEntityMediaWithFallback(sess.artRefCustom, curImg, sess.artRefCustom.avatarId || '');
                saveSettings();
                notifyToast('Аватар текущего Профиля установлен как референс внешности.');
                renderWindow();
            }
            return;
        }
        if (act === 'clear-custom-ref') {
            if (sess.artRefCustom) {
                sess.artRefCustom.avatarId = '';
                sess.artRefCustom.avatarDataUrl = '';
                sess.artRefCustom.description = '';
                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                saveSettings();
            }
            return renderWindow();
        }
        if (act === 'toggle-sessions-drawer') {
            state.sessionsDrawerOpen = !state.sessionsDrawerOpen;
            if (state.sessionsDrawerOpen) {
                state.themeDrawerOpen = false;
                state.settingsDrawerOpen = false;
                state.thoughtsDrawerOpen = false;
            }
            return renderWindow();
        }
        if (act === 'editor-sub') {
            state.editorSubTab = btn.dataset.sub;
            return renderWindow();
        }
        if (act === 'create-submode') {
            sess.architect.subMode = btn.dataset.sub;
            saveSettings();
            return renderWindow();
        }
        if (act === 'create-submode-nav' || act === 'switch-tab') {
            sess.homeCompleted = true;
            saveSettings();
            state.activeTab = btn.dataset.tab;
            return renderWindow();
        }
        if (act === 'toggle-swipe-opts') {
            state.swipeControlsOpen = !state.swipeControlsOpen;
            return renderWindow();
        }
        if (act === 'toggle-thoughts') {
            state.thoughtsDrawerOpen = !state.thoughtsDrawerOpen;
            if (state.thoughtsDrawerOpen) {
                state.themeDrawerOpen = false;
                state.settingsDrawerOpen = false;
                state.sessionsDrawerOpen = false;
            }
            return renderWindow();
        }
        if (act === 'toggle-themes') {
            state.themeDrawerOpen = !state.themeDrawerOpen;
            if (state.themeDrawerOpen) {
                state.settingsDrawerOpen = false;
                state.thoughtsDrawerOpen = false;
                state.sessionsDrawerOpen = false;
            }
            return renderWindow();
        }
        if (act === 'toggle-settings') {
            state.settingsDrawerOpen = !state.settingsDrawerOpen;
            if (state.settingsDrawerOpen) {
                state.themeDrawerOpen = false;
                state.thoughtsDrawerOpen = false;
                state.sessionsDrawerOpen = false;
            }
            return renderWindow();
        }
        if (act === 'pick-theme') {
            cfg.theme = btn.dataset.theme;
            saveSettings();
            syncExtSettingsPanel();
            return renderWindow();
        }
        if (act === 'reset-correction-prompt') {
            cfg.presetCorrectionPrompt = DEFAULT_PRESET_CORRECTION_PROMPT;
            saveSettings();
            notifyToast('Промпт коррекции сброшен к стандартному.');
            return renderWindow();
        }
        if (act === 'new-session') {
            resetTransientSessionModals();
            state.homeOpenCards.sessions = false;
            state.activeTab = 'home';
            state.sessionsDrawerOpen = false;
            const ns = createDefaultSession(cfg.sessions.length + 1);
            cfg.sessions.push(ns);
            cfg.activeSessionId = ns.id;
            saveSettings();
            return renderWindow();
        }
        if (act === 'switch-session') {
            resetTransientSessionModals();
            state.homeOpenCards.sessions = false;
            cfg.activeSessionId = btn.dataset.sid;
            saveSettings();
            await hydrateSessionsMedia(cfg.sessions, [], cfg.savedVault || []);
            return renderWindow();
        }
        if (act === 'toggle-freeze') {
            sess.frozen = !sess.frozen;
            saveSettings();
            return renderWindow();
        }
        if (act === 'rename-session') {
            const nextName = window.prompt('Новое название сессии:', sess.title);
            if (nextName && nextName.trim()) {
                sess.title = nextName.trim().slice(0, 32);
                saveSettings();
                renderWindow();
            }
            return;
        }
        if (act === 'delete-session') {
            if (cfg.sessions.length <= 1) return;
            if (state.busy || state.altarFusionBusy || state.editorArtLoading || state.loadingArtIds.size > 0) {
                notifyToast(tx('Сначала дождитесь завершения или отмените активную генерацию.', 'Wait for or cancel active generation before deleting a session.'), true);
                return;
            }
            if (!window.confirm(tx(`Удалить «${sess.title}»?`, `Delete "${sess.title}"?`))) return;
            resetTransientSessionModals();
            if (state.pendingWishReveal?.sessionId === sess.id) state.pendingWishReveal = null;
            if (state.pendingMatchReveal?.sessionId === sess.id) state.pendingMatchReveal = false;
            cfg.sessions = cfg.sessions.filter((s) => s.id !== sess.id);
            cfg.activeSessionId = cfg.sessions[0].id;
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
            saveSettings();
            return renderWindow();
        }
        if (act === 'toggle-genre') {
            if (sess.frozen) return;
            const g = btn.dataset.genre;
            const arr = Array.isArray(sess.intake.genres) ? sess.intake.genres : [];
            sess.intake.genres = arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g];
            saveSettings();
            return renderWindow();
        }
        if (act === 'toggle-tinder-autoart') {
            if (sess.frozen) return;
            sess.tinder.autoArt = !sess.tinder.autoArt;
            saveSettings();
            return renderWindow();
        }
        if (act === 'toggle-blitz-choices') {
            if (sess.frozen) return;
            sess.blitz.includeChoices = !sess.blitz.includeChoices;
            saveSettings();
            return renderWindow();
        }
        if (act === 'send-cand-to-blitz') {
            if (sess.frozen) return;
            state.viewingCandRef = null;
            const src = btn.dataset.source || 'tinder';
            const ref = btn.dataset.ref || '';
            if (src === 'gacha') {
                sess.blitz.useGachaContext = true;
            } else {
                sess.blitz.useTinderContext = true;
            }
            if (ref) {
                sess.blitz.selectedCandidateRef = ref;
            }
            const seedHit = resolveBlitzSeedCandidate(sess);
            state.activeTab = 'blitz';
            saveSettings();
            if (seedHit?.entity?.name) {
                notifySuccessToast(`«${seedHit.entity.name}» выбран для вопросов в Блице!`);
            }
            return renderWindow();
        }
        if (act === 'toggle-blitz-tinder-ctx') {
            if (sess.frozen) return;
            sess.blitz.useTinderContext = !(sess.blitz.useTinderContext !== false);
            saveSettings();
            return renderWindow();
        }
        if (act === 'toggle-blitz-gacha-ctx') {
            if (sess.frozen) return;
            sess.blitz.useGachaContext = !sess.blitz.useGachaContext;
            saveSettings();
            return renderWindow();
        }

        // MANUAL BAN & ARCHIVE CONTROLS
        if (act === 'add-manual-ban') {
            const rawTxt = state.manualBanDraft.trim();
            if (!rawTxt) return;
            const items = rawTxt.split(',').map((s) => s.trim()).filter(Boolean);
            for (const item of items) {
                if (!sess.tinder.dislikedNotes.includes(item)) {
                    sess.tinder.dislikedNotes.push(item);
                }
            }
            state.manualBanDraft = '';
            saveSettings();
            notifyToast('Добавлено в чёрный список подбора.');
            return renderWindow();
        }
        if (act === 'undo-last-pass') {
            const last = sess.tinder.passed?.shift();
            if (last) {
                sess.tinder.queue.unshift(last);
                sess.tinder.lastDislikedCandidate = null;
                saveSettings();
            }
            return renderWindow();
        }
        if (act === 'restore-passed-to-deck') {
            const idx = Number(btn.dataset.idx);
            const [cand] = sess.tinder.passed.splice(idx, 1);
            if (cand) {
                sess.tinder.queue.unshift(cand);
                if (sess.tinder.lastDislikedCandidate?.id === cand.id) sess.tinder.lastDislikedCandidate = null;
                state.activeTab = 'swipe';
                saveSettings();
                notifyToast(`«${cand.name}» возвращён в колоду Свайпов!`);
            }
            return renderWindow();
        }
        if (act === 'edit-cand') {
            state.viewingCandRef = null;
            state.editingCandRef = { pool: btn.dataset.pool, idx: Number(btn.dataset.idx) };
            return renderWindow();
        }
        if (act === 'close-cand-edit') {
            state.editingCandRef = null;
            return renderWindow();
        }
        if (act === 'save-cand-edit') {
            saveEditedCandidateFields(sess);
            state.editingCandRef = null;
            notifyToast('Изменения анкеты сохранены.');
            return renderWindow();
        }
        if (act === 'save-cand-and-restore') {
            const ref = state.editingCandRef;
            const cand = saveEditedCandidateFields(sess);
            if (cand && ref?.pool === 'passed') {
                sess.tinder.passed.splice(ref.idx, 1);
                sess.tinder.queue.unshift(cand);
                state.activeTab = 'swipe';
                saveSettings();
            }
            state.editingCandRef = null;
            return renderWindow();
        }
        if (act === 'save-cand-and-build') {
            const cand = saveEditedCandidateFields(sess);
            state.editingCandRef = null;
            if (cand) await expandCandidateIntoFullCard(sess, cand, cfg.transportMode);
            return;
        }
        if (act === 'dismiss-reject-pop') {
            sess.tinder.lastDislikedCandidate = null;
            saveSettings();
            return renderWindow();
        }
        if (act === 'quick-ban-tag') {
            const tg = btn.dataset.tag;
            const list = sess.tinder.dislikedTags;
            const idx = list.indexOf(tg);
            if (idx >= 0) list.splice(idx, 1);
            else list.push(tg);
            saveSettings();
            return renderWindow();
        }
        if (act === 'remove-antitag') {
            sess.tinder.dislikedTags.splice(Number(btn.dataset.idx), 1);
            saveSettings();
            return renderWindow();
        }
        if (act === 'remove-antinote') {
            sess.tinder.dislikedNotes.splice(Number(btn.dataset.idx), 1);
            saveSettings();
            return renderWindow();
        }
        if (act === 'refresh-roster') {
            await withBusy('Обновляем список карточек и Лорбуков', async (signal) => {
                await refreshRosterData(signal);
                notifyToast(`Карточек: ${state.rosterChars.length}, Лорбуков: ${state.worldNames.length}`);
            }, { taskType: 'roster', cancellable: true });
            return;
        }
        if (act === 'open-codex-forge') {
            if (!detectPocketCodex()) {
                notifyToast('Pocket Codex & Forge сейчас не активен.', true);
                return;
            }
            closeForgeDialog();
            openPocketCodexForge();
            return;
        }

        // SWIPE DECK ACTIONS
        if (act === 'gen-tinder') {
            if (state.manualBanDraft.trim()) {
                for (const item of state.manualBanDraft.split(',').map((s) => s.trim()).filter(Boolean)) {
                    if (!sess.tinder.dislikedNotes.includes(item)) sess.tinder.dislikedNotes.push(item);
                }
                state.manualBanDraft = '';
            }
            let addedCount = 0;
            await withBusy('Подбираем анкеты для вашей ленты', async (signal) => {
                const rawBatch = Number(sess.tinder.batchSize) || 1;
                const count = [1, 3, 5].includes(rawBatch) ? rawBatch : 1;
                const req = buildTinderPreviewRequest(sess, count, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const cands = parseTinderPreviewResponse(raw, sess.intake.playerNameMode || 'macro');
                if (!cands.length) throw new Error('Модель вернула пустую ленту. Попробуйте ещё раз.');
                sess.tinder.queue.push(...cands);
                sess.tinder.lastDislikedCandidate = null;
                addedCount = cands.length;
                saveSettings();
                if (!isForgeDialogVisible() || state.busyMinimized || state.activeTab !== 'swipe' || state.discoverSubMode === 'gacha') {
                    state.pendingMatchReveal = { sessionId: sess.id, count: addedCount };
                } else {
                    openMatchSignalReveal(addedCount);
                }
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'gen-cand-art') {
            const cur = sess.tinder.queue[0];
            if (cur) triggerCandidateArtInBackground(cur, true);
            return;
        }
        if (act === 'stop-cand-art') {
            const specificId = String(btn.dataset.id || '').trim();
            const idsToStop = specificId ? [specificId] : [...state.loadingArtIds];
            for (const cid of idsToStop) {
                const st = state.artStatuses.get(cid);
                if (st?.timerId) clearInterval(st.timerId);
                const ctl = state.artAborts.get(cid);
                state.artStatuses.delete(cid);
                state.loadingArtIds.delete(cid);
                state.artAborts.delete(cid);
                state.artErrors.delete(cid);
                try { ctl?.abort(new Error('Art cancelled by user')); } catch {}
            }
            notifyToast('Генерация арта остановлена.');
            return renderWindow();
        }
        if (act === 'tinder-dislike') return handleSwipeDecision('dislike');
        if (act === 'tinder-like') return handleSwipeDecision('like');
        if (act === 'tinder-expand-now') {
            const cur = sess.tinder.queue.shift();
            if (!cur) return;
            sess.tinder.liked.unshift(cur);
            if (sess.tinder.liked.length > MAX_LIKED_CANDIDATES) sess.tinder.liked.length = MAX_LIKED_CANDIDATES;
            await expandCandidateIntoFullCard(sess, cur, cfg.transportMode);
            return;
        }
        if (act === 'expand-liked') {
            const cand = sess.tinder.liked[Number(btn.dataset.idx)];
            if (cand) await expandCandidateIntoFullCard(sess, cand, cfg.transportMode);
            return;
        }
        if (act === 'expand-passed') {
            const cand = sess.tinder.passed[Number(btn.dataset.idx)];
            if (cand) await expandCandidateIntoFullCard(sess, cand, cfg.transportMode);
            return;
        }
        if (act === 'del-liked') {
            sess.tinder.liked.splice(Number(btn.dataset.idx), 1);
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
            saveSettings();
            return renderWindow();
        }
        if (act === 'del-passed') {
            sess.tinder.passed.splice(Number(btn.dataset.idx), 1);
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
            saveSettings();
            return renderWindow();
        }

        // BLITZ ACTIONS (SELECTABLE QUESTION COUNT)
        if (act === 'set-blitz-count') {
            if (sess.frozen) return;
            const cnt = Number(btn.dataset.count) || 10;
            sess.blitz.questionCount = Math.min(25, Math.max(3, cnt));
            saveSettings();
            return renderWindow();
        }
        if (act === 'gen-blitz-10') {
            const targetCnt = Math.min(25, Math.max(3, Number(sess.blitz.questionCount) || 10));
            await withBusy(`Готовим список из ${targetCnt} вопросов Блиц-теста`, async (signal) => {
                const req = buildBlitzQuestionsRequest(sess, -1, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const qs = parseBlitzQuestionsResponse(raw);
                if (!qs.length) throw new Error('Не удалось разобрать список вопросов.');
                sess.blitz.questions = qs.slice(0, targetCnt);
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'blitz-skip') {
            const q = sess.blitz.questions[Number(btn.dataset.idx)];
            if (q) {
                q.skipped = !q.skipped;
                saveSettings();
                renderWindow();
            }
            return;
        }
        if (act === 'blitz-pick-opt') {
            const q = sess.blitz.questions[Number(btn.dataset.idx)];
            const optVal = q?.options?.[Number(btn.dataset.optIdx)];
            if (q && optVal) {
                if (!Array.isArray(q.selectedOptions)) q.selectedOptions = [];
                const i = q.selectedOptions.indexOf(optVal);
                if (i >= 0) q.selectedOptions.splice(i, 1);
                else q.selectedOptions.push(optVal);
                saveSettings();
                renderWindow();
            }
            return;
        }
        if (act === 'blitz-regen-one') {
            const idx = Number(btn.dataset.idx);
            await withBusy(`Меняем вопрос #${idx + 1}`, async (signal) => {
                const req = buildBlitzQuestionsRequest(sess, idx, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const qs = parseBlitzQuestionsResponse(raw);
                if (!qs[0]) throw new Error('Не удалось получить новый вопрос.');
                sess.blitz.questions[idx] = qs[0];
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'build-from-blitz') {
            const seedHit = resolveBlitzSeedCandidate(sess);
            const seedEntity = seedHit?.entity || null;
            const answered = sess.blitz.questions
                .map((q, i) => {
                    const dec = formatQuestionUserDecision(q);
                    return dec ? `Q${i + 1}: ${q.question}\nA${i + 1}: ${dec}` : '';
                })
                .filter(Boolean)
                .join('\n\n');

            const brief = seedEntity
                ? [
                    `[BASE CHARACTER DOSSIER FROM ${seedHit.source === 'gacha' ? 'GACHA' : 'TINDER'} — MANDATORY SUBJECT, KEEP THIS EXACT PERSON, NAME & APPEARANCE]`,
                    buildCleanBriefFromEntity(seedEntity),
                    sess.blitz.topic ? `\n[ADDITIONAL FOCUS]: ${sess.blitz.topic}` : '',
                    answered ? `\n[USER BLITZ ANSWERS DEEPENING "${seedEntity.name}" — MANDATORY CANON]\n${answered}` : '',
                ].filter(Boolean).join('\n')
                : `Blitz Topic: ${sess.blitz.topic || 'Matchmaking'}\n\n${answered || 'Synthesize creatively from Topic & Intake.'}`;

            const busyLabel = seedEntity
                ? `Собираем полную карточку «${seedEntity.name}» по ответам Блица`
                : 'Собираем карточку в слот «Блиц»';

            await withBusy(busyLabel, async (signal) => {
                const blitzCtxMode = seedHit?.source === 'gacha' ? 'gacha' : 'blitz';
                const req = buildFullCardRequest(sess, brief, cfg.transportMode, { modeContext: blitzCtxMode });
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const parsed = parseFullCardResponse(
                    raw,
                    cfg.transportMode,
                    sess.intake.playerNameMode || 'macro',
                    { fallbackName: seedEntity?.name || '' },
                );
                const built = createCardStateFromGeneratedDraft(parsed, {
                    avatarId: '',
                    fallbackName: seedEntity?.name || '',
                    fallbackImagePrompt: seedEntity?.imagePrompt || '',
                });
                if (seedEntity) {
                    const seedMediaUrl = resolveEntityAvatarUrl(seedEntity);
                    if (seedMediaUrl) {
                        await assignEntityMediaWithFallback(built, seedMediaUrl, '');
                        built.avatarDirty = true;
                        if (seedEntity.croppedAspect) built.croppedAspect = seedEntity.croppedAspect;
                        if (seedEntity.artNaturalRatio) built.artNaturalRatio = seedEntity.artNaturalRatio;
                    }
                }
                const targetSlot = seedHit?.source === 'tinder'
                    ? 'swipe'
                    : (seedHit?.source === 'gacha' ? 'gacha' : 'blitz');
                assignCardIntoSessionSlot(sess, targetSlot, built);
                if (targetSlot !== 'blitz' && sess.cardSlots) {
                    const blitzClone = structuredClone(built);
                    blitzClone.avatarId = '';
                    blitzClone.originalAvatarId = '';
                    blitzClone.avatarDataUrl = '';
                    const bImg = resolveEntityAvatarUrl(built);
                    if (bImg) await assignEntityMediaWithFallback(blitzClone, bImg, '');
                    sess.cardSlots.blitz = blitzClone;
                }
                state.lastOverwriteAlert = null;
                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                state.activeTab = 'editor';
                state.editorSubTab = 'main';
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }

        // CREATE / AU REWORK ACTIONS (with FULL unshallowed character loading & strict A/B base isolation — fixes NMF-002 & P1-A!)
        if (act === 'set-arch-intake') {
            if (sess.frozen) return;
            sess.architect.useIntake = btn.dataset.val !== '0';
            saveSettings();
            return renderWindow();
        }
        if (act === 'build-from-architect') {
            const withIntake = sess.architect.useIntake !== false;
            await withBusy(withIntake ? 'Собираем карточку (Задумка + Анкета)' : 'Собираем карточку по чистой задумке', async (signal) => {
                const req = buildFullCardRequest(sess, sess.architect.freeConcept, cfg.transportMode, {
                    modeContext: 'architect',
                    useIntake: withIntake,
                });
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const parsed = parseFullCardResponse(raw, cfg.transportMode, sess.intake.playerNameMode || 'macro');
                assignCardIntoSessionSlot(sess, 'architect', createCardStateFromGeneratedDraft(parsed));
                state.lastOverwriteAlert = null;
                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                state.activeTab = 'editor';
                state.editorSubTab = 'main';
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }

        // AU REWORK QUIZ ACTIONS
        if (act === 'set-au-q-count') {
            if (sess.frozen) return;
            const cnt = Number(btn.dataset.count) || 5;
            sess.rework.questionCount = Math.min(20, Math.max(3, cnt));
            saveSettings();
            return renderWindow();
        }
        if (act === 'clear-au-questions') {
            sess.rework.questions = [];
            saveSettings();
            return renderWindow();
        }
        if (act === 'au-q-skip') {
            const q = sess.rework.questions?.[Number(btn.dataset.idx)];
            if (q) {
                q.skipped = !q.skipped;
                saveSettings();
                renderWindow();
            }
            return;
        }
        if (act === 'au-q-pick-opt') {
            const q = sess.rework.questions?.[Number(btn.dataset.idx)];
            const optVal = q?.options?.[Number(btn.dataset.optIdx)];
            if (q && optVal) {
                if (!Array.isArray(q.selectedOptions)) q.selectedOptions = [];
                const i = q.selectedOptions.indexOf(optVal);
                if (i >= 0) q.selectedOptions.splice(i, 1);
                else q.selectedOptions.push(optVal);
                saveSettings();
                renderWindow();
            }
            return;
        }
        if (act === 'gen-au-questions' || act === 'au-q-regen-one') {
            const chosenAvatar = String(sess.rework.sourceAvatar || '').trim();
            if (!chosenAvatar) {
                notifyToast('Сначала выберите исходную карточку персонажа.', true);
                return;
            }
            if (!String(sess.rework.targetSettingEra || sess.intake.settingEra || '').trim()) {
                notifyToast('Укажите новую вселенную / эпоху (например: Мафия 1940-х).', true);
                return;
            }
            const singleIdx = act === 'au-q-regen-one' ? Number(btn.dataset.idx) : -1;
            const targetCnt = Math.min(20, Math.max(3, Number(sess.rework.questionCount) || 5));
            const label = singleIdx >= 0
                ? `Меняем вопрос переноса #${singleIdx + 1}`
                : `Анализируем карточку и готовим ${targetCnt} вопр. по переносу`;

            await withBusy(label, async (signal) => {
                const { fullChar } = await fetchFullTavernCharacter(chosenAvatar, { signal });
                const baseState = createCardStateFromTavernChar(fullChar);
                const req = buildAuReworkQuestionsRequest(sess, baseState, singleIdx, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const qs = parseBlitzQuestionsResponse(raw);
                if (!qs.length) throw new Error('Не удалось получить вопросы по переносу.');
                if (!Array.isArray(sess.rework.questions)) sess.rework.questions = [];
                if (singleIdx >= 0 && qs[0]) {
                    sess.rework.questions[singleIdx] = qs[0];
                } else {
                    sess.rework.questions = qs.slice(0, targetCnt);
                }
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }

        if (act === 'load-char-to-editor' || act === 'run-rework') {
            const chosenAvatar = String(sess.rework.sourceAvatar || '').trim();
            if (!chosenAvatar) {
                notifyToast('Сначала выберите карточку из списка.', true);
                return;
            }

            if (act === 'load-char-to-editor') {
                await withBusy('Загружаем полную карточку из SillyTavern', async (signal) => {
                    const { fullChar } = await fetchFullTavernCharacter(chosenAvatar, { signal });
                    let previewAvatarId = '';
                    try {
                        const srcDataUrl = await urlToDataUrl(`/characters/${encodeURIComponent(chosenAvatar)}`, signal);
                        previewAvatarId = await saveMediaDataUrl(srcDataUrl);
                    } catch {
                        previewAvatarId = '';
                    }
                    assignCardIntoSessionSlot(sess, 'manual', createCardStateFromTavernChar(fullChar, { avatarId: previewAvatarId }));
                    state.lastOverwriteAlert = null;
                    await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                    state.activeTab = 'editor';
                    state.editorSubTab = 'main';
                    saveSettings();
                }, { taskType: 'load', cancellable: true });
                return;
            }

            await withBusy('Загружаем полную карточку и переносим в новую вселенную', async (signal) => {
                const { fullChar, rawCardObject, snapshotHash } = await fetchFullTavernCharacter(chosenAvatar, { signal });
                const baseState = createCardStateFromTavernChar(fullChar);
                let previewAvatarId = '';
                try {
                    const srcDataUrl = await urlToDataUrl(`/characters/${encodeURIComponent(chosenAvatar)}`, signal);
                    previewAvatarId = await saveMediaDataUrl(srcDataUrl);
                } catch {
                    previewAvatarId = '';
                }

                const req = buildReworkCardRequest(sess, {
                    name: baseState.name,
                    description: baseState.description,
                    personality: baseState.personality,
                    scenario: baseState.scenario,
                    first_mes: baseState.first_mes,
                    mes_example: baseState.mes_example,
                }, cfg.transportMode);

                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
                    signal,
                });
                const parsed = parseFullCardResponse(
                    raw,
                    cfg.transportMode,
                    sess.intake.playerNameMode || 'macro',
                    { fallbackName: baseState.name }
                );
                // Strictly applies parsed result onto baseState of chosen character A — NEVER reads previous sess.card B! (fixes P1-A)
                assignCardIntoSessionSlot(sess, 'architect', applyReworkResultToTavernBase(baseState, parsed, {
                    avatarId: previewAvatarId,
                    sourceAvatarId: chosenAvatar,
                    snapshotHash,
                    rawCardObject,
                }));
                state.lastOverwriteAlert = null;
                await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
                state.activeTab = 'editor';
                state.editorSubTab = 'main';
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }

        // PROFILE EDITOR ACTIONS
        if (act === 'clear-avatar') {
            sess.card.avatarId = '';
            sess.card.originalAvatarId = '';
            sess.card.croppedAspect = '';
            sess.card.artNaturalRatio = 0;
            sess.card.avatarDataUrl = '';
            delete sess.card._nmfEmergencyInlineTs;
            state.unseenArtIds.delete(sess.id + ':' + sess.activeCardSlot);
            sess.card.avatarDirty = true;
            state.editorArtError = '';
            await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
            saveSettings();
            return renderWindow();
        }
        if (act === 'stop-editor-art') {
            const ctl = state.editorArtAbort;
            if (state.editorArtStatus?.timerId) clearInterval(state.editorArtStatus.timerId);
            state.editorArtAbort = null;
            state.editorArtLoading = false;
            state.editorArtStatus = null;
            state.editorArtError = '';
            try { ctl?.abort(new Error('Editor art cancelled by user')); } catch {}
            notifyToast('Генерация арта остановлена.');
            return renderWindow();
        }
        if (act === 'gen-editor-art') {
            if (state.editorArtLoading) return;
            state.unseenArtIds.delete(sess.id + ':' + sess.activeCardSlot);
            const ctl = new AbortController();
            const edStatus = {
                stage: 'Подготовка генерации',
                detail: 'Инициализация запроса...',
                attempt: 1,
                maxAttempts: 3,
                providerLabel: '',
                elapsedSec: 0,
                timerId: null,
            };
            edStatus.timerId = setInterval(() => {
                edStatus.elapsedSec += 1;
                if (/^Генерация|^Повтор генерации/.test(edStatus.stage) && /^Отправка запроса/.test(edStatus.detail) && edStatus.elapsedSec >= 3) {
                    edStatus.detail = edStatus.elapsedSec >= 10
                        ? `Сервер рендерит кадр · запрос активен (${edStatus.elapsedSec}с)...`
                        : `Запрос отправлен · ждём ответ сервера (${edStatus.elapsedSec}с)...`;
                }
                syncEditorArtStatusDom();
            }, 1000);

            state.editorArtError = '';
            state.artVisualizerMinimized = false;
            state.editorArtStatus = edStatus;
            state.editorArtLoading = true;
            state.editorArtAbort = ctl;
            renderWindow();
            try {
                const p = sess.card.imagePrompt || `${sess.card.name}, detailed artwork`;
                const refOpts = buildPortraitRefOptions(
                    sess,
                    cfg,
                    `${sess.card.name || ''} ${sess.card.tags || ''} ${sess.intake?.fandomName || ''}`,
                );
                const dataUrl = await generateCharacterPortrait(p, {
                    imageSource: cfg.imageSource,
                    imageProfileId: cfg.imageProfileId,
                    imageStyleId: cfg.imageStyleId,
                    styleWrapMode: cfg.styleWrapMode || 'plain_prefix',
                    imageNegativeId: cfg.imageNegativeId || '',
                    imageCustomNegative: cfg.imageCustomNegative || '',
                    aspectRatio: cfg.imageAspectRatio || '1:1',
                    ...refOpts,
                    signal: ctl.signal,
                    onStatus: (info) => {
                        edStatus.stage = info.stage || edStatus.stage;
                        edStatus.detail = info.detail || edStatus.detail;
                        edStatus.attempt = info.attempt || edStatus.attempt;
                        edStatus.maxAttempts = info.maxAttempts || edStatus.maxAttempts;
                        if (info.providerLabel) edStatus.providerLabel = info.providerLabel;
                        syncEditorArtStatusDom();
                    },
                });
                if (ctl.signal.aborted) return;
                sess.card.originalAvatarId = '';
                sess.card.croppedAspect = '';
                const edDims = await probeImageDimensionsFromDataUrl(dataUrl);
                if (edDims.w && edDims.h) sess.card.artNaturalRatio = edDims.w / edDims.h;
                state.unseenArtIds.add(sess.id + ':' + sess.activeCardSlot);
                const mediaRes = await assignEntityMediaWithFallback(sess.card, dataUrl, sess.card.avatarId || '');
                sess.card.avatarDirty = true;
                markCardFieldDirty(sess.card, 'imagePrompt');
                state.editorArtError = '';
                saveSettings();
                if (!mediaRes.durable) {
                    notifyToast('IndexedDB недоступна: арт удержан в резервном буфере настроек — рекомендуем скачать PNG.', true);
                }
            } catch (err) {
                const msg = ctl.signal.aborted ? 'Генерация арта остановлена вами.' : (err?.message || String(err));
                state.editorArtError = msg;
                if (!ctl.signal.aborted) notifyToast(msg, true);
            } finally {
                if (edStatus.timerId) clearInterval(edStatus.timerId);
                state.editorArtStatus = null;
                state.editorArtLoading = false;
                state.editorArtAbort = null;
                renderWindow();
            }
            return;
        }
        if (act === 'add-alt-greeting') {
            if (!Array.isArray(sess.card.alternate_greetings)) sess.card.alternate_greetings = [];
            sess.card.alternate_greetings.push('');
            markCardFieldDirty(sess.card, 'alternate_greetings');
            saveSettings();
            return renderWindow();
        }
        if (act === 'del-alt-greeting') {
            sess.card.alternate_greetings.splice(Number(btn.dataset.idx), 1);
            markCardFieldDirty(sess.card, 'alternate_greetings');
            saveSettings();
            return renderWindow();
        }
        if (act === 'export-png') {
            try {
                const avatarUrl = resolveEntityAvatarUrl(sess.card);
                const blob = await buildCardPngBlob(sess.card, getThemeColor(), {
                    aspectRatio: resolveCardExportAspectRatio(sess.card, cfg),
                    cropFocus: cfg.imageCropFocus || 'top',
                }, avatarUrl);
                const slug = (sess.card.name || 'Character').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'Character';
                triggerDownload(blob, `${slug}.png`);
                notifySuccessToast(`Карточка «${slug}.png» отправлена в Загрузки!`);
            } catch (err) {
                notifyToast('Ошибка PNG: ' + err.message, true);
            }
            return;
        }
        if (act === 'export-json') {
            try {
                const v2 = buildV2CardObject(sess.card);
                const slug = String(v2.data?.name || v2.name || 'Character').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'Character';
                triggerDownload(new Blob([JSON.stringify(v2, null, 2)], { type: 'application/json' }), `${slug}.json`);
                notifySuccessToast(`Файл «${slug}.json» отправлен в Загрузки!`);
            } catch (err) {
                notifyToast('Ошибка JSON: ' + err.message, true);
            }
            return;
        }
        if (act === 'save-to-tavern-new') {
            await withBusy('Сохраняем новую карточку в SillyTavern', async () => {
                const avatarUrl = resolveEntityAvatarUrl(sess.card);
                await importCardIntoTavern(sess.card, {
                    avatarDataUrl: avatarUrl,
                    accentHex: getThemeColor(),
                    aspectRatio: resolveCardExportAspectRatio(sess.card, cfg),
                    cropFocus: cfg.imageCropFocus || 'top',
                });
                await refreshRosterData();
                notifySuccessToast(`«${sess.card.name}» добавлена как новая карточка в Таверну!`);
            }, { taskType: 'save', cancellable: false });
            return;
        }
        if (act === 'save-to-tavern-overwrite') {
            if (!sess.card.sourceAvatarId || !sess.card.sourceLoadedFromTavern) return;
            const diff = computeCardDiff(sess.card);
            if (!diff.hasChanges) {
                notifyToast('В карточке пока нет изменённых полей.');
                return;
            }
            state.overwriteConfirmInfo = {
                targetAvatar: sess.card.sourceAvatarId,
                diff,
                externalWarning: false,
            };
            renderWindow();
        }
    });
}

async function expandCandidateIntoFullCard(sess, cand, transportMode, slotTarget = '') {
    const cfg = getSettings();
    const isGachaItem = slotTarget === 'gacha' || String(cand?.id || '').startsWith('gacha_');
    const resolvedSlot = isGachaItem ? 'gacha' : (slotTarget || 'swipe');
    const brief = [
        `Expand this approved Character Concept into a complete SillyTavern V2 Card:`,
        buildCleanBriefFromEntity(cand),
    ].join('\n');

    await withBusy(`Собираем полную карточку «${cand.name}»`, async (signal) => {
        const req = buildFullCardRequest(sess, brief, transportMode, { modeContext: isGachaItem ? 'gacha' : 'swipe' });
        const raw = await runLlmGeneration({
            ...req,
            transportMode,
            presetCorrectionPrompt: cfg.presetCorrectionPrompt,
            stripActiveCharFromPreset: cfg.stripActiveCharFromPreset !== false,
            signal,
        });
        const parsed = parseFullCardResponse(raw, transportMode, sess.intake.playerNameMode || 'macro');
        const candMediaUrl = resolveEntityAvatarUrl(cand);
        const built = createCardStateFromGeneratedDraft(parsed, {
            avatarId: '',
            fallbackName: cand.name,
            fallbackImagePrompt: cand.imagePrompt || '',
        });
        if (candMediaUrl) {
            await assignEntityMediaWithFallback(built, candMediaUrl, '');
            built.avatarDirty = true;
            if (cand.croppedAspect) built.croppedAspect = cand.croppedAspect;
            if (cand.artNaturalRatio) built.artNaturalRatio = cand.artNaturalRatio;
        }
        assignCardIntoSessionSlot(sess, resolvedSlot, built);
        state.lastOverwriteAlert = null;
        await pruneOrphanedMedia(cfg.sessions, [], cfg.savedVault || []);
        state.activeTab = 'editor';
        state.editorSubTab = 'main';
        saveSettings();
    }, { taskType: 'llm', cancellable: true });
}

function mountRosterButton() {
    if (typeof document === 'undefined' || document.getElementById('nmf-roster-btn')) return true;
    const bar = document.getElementById('rm_button_bar');
    if (!bar) return false;

    const btn = document.createElement('div');
    btn.id = 'nmf-roster-btn';
    btn.className = 'menu_button interactable';
    btn.title = 'NexusMatch Forge — Создание персонажей, миров и РПГ';
    btn.setAttribute('tabindex', '0');
    btn.innerHTML = NMF_ICONS.rosterBtn;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openForgeDialog();
    });

    const createBtn = document.getElementById('rm_button_create');
    if (createBtn && createBtn.parentElement === bar) {
        createBtn.insertAdjacentElement('afterend', btn);
    } else {
        bar.prepend(btn);
    }
    return true;
}

function syncExtSettingsPanel() {
    if (typeof document === 'undefined') return;
    const themeSel = document.getElementById('nmf-ext-theme');
    const modeSel = document.getElementById('nmf-ext-transport');
    const openLbl = document.querySelector('#nmf-ext-open-btn span');
    const cfg = getSettings();
    if (themeSel) themeSel.value = cfg.theme;
    if (modeSel) modeSel.value = cfg.transportMode;
    if (openLbl) openLbl.textContent = tx('Открыть NexusMatch Forge', 'Open NexusMatch Forge');
}

function mountExtensionManagerPanel() {
    if (typeof document === 'undefined' || document.getElementById('nmf-ext-settings-block')) return true;
    const host = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (!host) return false;

    const cfg = getSettings();
    const wrap = document.createElement('div');
    wrap.id = 'nmf-ext-settings-block';
    wrap.className = 'inline-drawer';
    wrap.innerHTML = `
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>NexusMatch Forge [BETA]</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content" style="display:none;padding:8px 4px;">
            <div style="font-size:12px;opacity:0.85;margin-bottom:8px;">
                ${esc(tx(
                    'Студия свайпов, гача-коллекции, блиц-знакомств и создания персонажей, Миров и РПГ-карточек (V2).',
                    'Collectible card gacha, swipes, blitz quiz, and Character / World / RPG Card V2 studio.',
                ))}
            </div>
            <div id="nmf-ext-open-btn" class="menu_button interactable" style="width:100%;justify-content:center;gap:6px;margin-bottom:8px;">
                ${NMF_ICONS.rosterBtn} <span>${esc(tx('Открыть NexusMatch Forge', 'Open NexusMatch Forge'))}</span>
            </div>
            <label style="font-size:11.5px;display:block;margin-bottom:3px;">${esc(tx('Тема оформления:', 'Visual Theme:'))}</label>
            <select id="nmf-ext-theme" class="text_pole" style="margin-bottom:8px;">
                ${NMF_THEMES.map((t) => `<option value="${t.id}" ${cfg.theme === t.id ? 'selected' : ''}>${esc(getThemeDisplay(t.id).name)}</option>`).join('')}
            </select>
            <label style="font-size:11.5px;display:block;margin-bottom:3px;">${esc(tx('Режим отправки запросов к ИИ:', 'AI Delivery Mode:'))}</label>
            <select id="nmf-ext-transport" class="text_pole">
                <option value="prefill_user_msg" ${cfg.transportMode === 'prefill_user_msg' ? 'selected' : ''}>${esc(tx('Через активный пресет Таверны', 'Via Active Tavern Preset'))}</option>
                <option value="json_schema" ${cfg.transportMode === 'json_schema' ? 'selected' : ''}>${esc(tx('Строгая JSON-схема', 'Strict JSON Schema'))}</option>
            </select>
        </div>
    `;
    host.appendChild(wrap);

    wrap.querySelector('#nmf-ext-open-btn')?.addEventListener('click', () => openForgeDialog());
    wrap.querySelector('#nmf-ext-theme')?.addEventListener('change', (e) => {
        getSettings().theme = e.target.value;
        saveSettings();
    });
    wrap.querySelector('#nmf-ext-transport')?.addEventListener('change', (e) => {
        getSettings().transportMode = e.target.value;
        saveSettings();
    });
    return true;
}

// Scoped, self-disconnecting DOM lifecycle observer (fixes NMF-018)
let mountObserver = null;

function tryMountAllAndDisconnectIfReady() {
    const okRoster = mountRosterButton();
    const okExt = mountExtensionManagerPanel();
    if (okRoster && okExt && mountObserver) {
        mountObserver.disconnect();
        mountObserver = null;
    }
    return okRoster && okExt;
}

export function initNexusMatchForge() {
    if (typeof document === 'undefined') return;
    ensureStylesMounted();
    if (tryMountAllAndDisconnectIfReady()) return;

    const ctx = getTavernContext();
    const appReadyEv = ctx?.eventTypes?.APP_READY || ctx?.event_types?.APP_READY;
    if (appReadyEv && typeof ctx?.eventSource?.on === 'function') {
        ctx.eventSource.on(appReadyEv, () => {
            tryMountAllAndDisconnectIfReady();
        });
    }

    if (typeof MutationObserver !== 'undefined' && document.body && !mountObserver) {
        const targetContainer = document.getElementById('top-settings-holder') || document.body;
        mountObserver = new MutationObserver(() => {
            tryMountAllAndDisconnectIfReady();
        });
        mountObserver.observe(targetContainer, { childList: true, subtree: true });
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNexusMatchForge);
    } else {
        initNexusMatchForge();
    }
}
