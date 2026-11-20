import { NMF_THEMES, NMF_LANGUAGES, NMF_ICONS, NMF_FULL_CSS } from './modules/nmf_themes_and_icons.js';
import {
    MAX_LIKED_CANDIDATES,
    MAX_PASSED_CANDIDATES,
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
    detectUserLocaleLanguage,
    resolveOutputLanguageSpec,
    resolveGenderSummary,
    isWorldOrRpgMode,
    createDefaultSession,
    normalizeAndMigrateSettings,
    buildFullCardRequest,
    parseFullCardResponse,
    buildTinderPreviewRequest,
    parseTinderPreviewResponse,
    buildBlitzQuestionsRequest,
    parseBlitzQuestionsResponse,
    buildReworkCardRequest,
} from './modules/nmf_templates_and_prompts.js';
import {
    ALL_EDITABLE_CARD_FIELDS,
    markCardFieldDirty,
    createCardStateFromTavernChar,
    createCardStateFromImportedJson,
    computeCardDiff,
    buildV2CardObject,
    buildCardPngBlob,
    embedCharaChunkIntoPng,
    triggerDownload,
    importCardIntoTavern,
    fetchFullTavernCharacter,
    updateExistingCardInTavern,
    fetchTavernRosterAndWorlds,
    urlToDataUrl,
    detectPocketCodex,
    openPocketCodexForge,
    detectImageExtensions,
    listImageExtensionBuckets,
    resolveAutoImageSourceSummary,
    generateCharacterPortrait,
    getTavernContext,
    runLlmGeneration,
    lastGenerationReasoning,
} from './modules/nmf_card_io_and_art.js';
import {
    base64ToBytes,
    resolveEntityAvatarUrl,
    saveMediaDataUrl,
    hydrateSessionsMedia,
    migrateInlineSessionMediaToVault,
    pruneOrphanedMedia,
    listCardBackups,
    getCardBackupById,
} from './modules/nmf_media_vault.js';

const EXT_KEY = 'st_nexus_match_forge';
let nextBusyRunId = 1;

export const state = {
    activeTab: 'swipe', // swipe | matches | blitz | create | editor
    matchesSubTab: 'liked', // liked | passed
    intakeSheetOpen: false,
    intakeStep: 'who', // who | vibe | style
    editorSubTab: 'main', // main | greet | meta
    themeDrawerOpen: false,
    settingsDrawerOpen: false,
    thoughtsDrawerOpen: false,
    swipeControlsOpen: false,
    manualBanDraft: '',
    editingCandRef: null, // { pool: 'queue'|'liked'|'passed', idx: number }
    overwriteConfirmInfo: null, // { targetAvatar, diff, allowExternalOverride }
    recentBackups: [],
    busy: false,
    busyMinimized: false,
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

export function getSettings() {
    const ctx = getTavernContext();
    if (!ctx || !ctx.extensionSettings) return getFallbackStore();

    const codexTheme = ctx.extensionSettings?.st_pocket_codex?.theme || 'krakoa';
    if (!ctx.extensionSettings[EXT_KEY] || lastMigratedRef !== ctx.extensionSettings[EXT_KEY]) {
        const { settings, migrated, recoveredFromCorruption } = normalizeAndMigrateSettings(
            ctx.extensionSettings[EXT_KEY],
            { defaultTheme: codexTheme }
        );
        ctx.extensionSettings[EXT_KEY] = settings;
        lastMigratedRef = settings;

        if (recoveredFromCorruption) {
            notifyToast('Часть старых настроек сессии была повреждена и безопасно восстановлена.', true);
        }
        // Asynchronously move any legacy inline Base64 images out of extensionSettings into IndexedDB
        migrateInlineSessionMediaToVault(settings.sessions).then((moved) => {
            if ((migrated || moved) && typeof ctx?.saveSettingsDebounced === 'function') {
                ctx.saveSettingsDebounced();
            }
        }).catch(() => {});
    }
    return ctx.extensionSettings[EXT_KEY];
}

function stripResidualInlineImagesSync(cfg) {
    if (!cfg || !Array.isArray(cfg.sessions)) return;
    for (const s of cfg.sessions) {
        if (s?.card?.avatarDataUrl) s.card.avatarDataUrl = '';
        for (const pool of ['queue', 'liked', 'passed']) {
            const arr = s?.tinder?.[pool];
            if (!Array.isArray(arr)) continue;
            for (const c of arr) {
                if (c?.avatarDataUrl) c.avatarDataUrl = '';
            }
        }
        if (s?.tinder?.lastDislikedCandidate?.avatarDataUrl) {
            s.tinder.lastDislikedCandidate.avatarDataUrl = '';
        }
    }
}

function saveSettings() {
    const cfg = getSettings();
    stripResidualInlineImagesSync(cfg);
    const ctx = getTavernContext();
    if (typeof ctx?.saveSettingsDebounced === 'function') {
        ctx.saveSettingsDebounced();
    }
}

function getActiveSession() {
    const cfg = getSettings();
    return cfg.sessions.find((s) => s.id === cfg.activeSessionId) || cfg.sessions[0];
}

function getThemeColor() {
    const cfg = getSettings();
    const th = NMF_THEMES.find((t) => t.id === cfg.theme) || NMF_THEMES[1];
    return th.color || '#1de9b6';
}

function notifyToast(msg, isError = false) {
    if (typeof globalThis.window === 'undefined') return;
    if (isError) {
        if (window.toastr?.error) window.toastr.error(msg, 'NexusMatch');
    } else if (window.toastr?.info) {
        window.toastr.info(msg, 'NexusMatch', { timeOut: 2200 });
    }
}

async function compressImageFileToDataUrl(file, maxSide = 896) {
    const rawUrl = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result || ''));
        fr.onerror = rej;
        fr.readAsDataURL(file);
    });
    try {
        const img = await new Promise((res, rej) => {
            const el = new Image();
            el.onload = () => res(el);
            el.onerror = rej;
            el.src = rawUrl;
        });
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/webp', 0.9);
    } catch {
        return rawUrl;
    }
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

export async function openForgeDialog(initialTab = '') {
    if (typeof document === 'undefined') return;
    const dlg = ensureDialogMounted();
    if (initialTab) state.activeTab = initialTab;
    const cfg = getSettings();
    await Promise.all([
        refreshRosterData(),
        hydrateSessionsMedia(cfg.sessions),
        refreshBackupsList(),
    ]);
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
            if (state.overwriteConfirmInfo) {
                state.overwriteConfirmInfo = null;
                history.pushState({ nmfModal: true }, '');
                state.historyEntryPushed = true;
                renderWindow();
                return;
            }
            if (state.editingCandRef) {
                state.editingCandRef = null;
                history.pushState({ nmfModal: true }, '');
                state.historyEntryPushed = true;
                renderWindow();
                return;
            }
            if (state.intakeSheetOpen) {
                state.intakeSheetOpen = false;
                history.pushState({ nmfModal: true }, '');
                state.historyEntryPushed = true;
                renderWindow();
                return;
            }
            state.historyEntryPushed = false;
            state.closingViaHistorySync = true;
            dlg.close();
            state.closingViaHistorySync = false;
        }
    });
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
    const langShort = resolveOutputLanguageSpec(it).shortLabel;
    const genderShort = (userSpec || targetSpec)
        ? `${userSpec ? `Я: ${userSpec.split(' ')[0].slice(0, 12)}` : 'Я: *'} -> ${targetSpec ? targetSpec.split(' ')[0].slice(0, 12) : '*'}`
        : '';

    return `
    <div class="nmf-filter-banner">
        <div class="nmf-filter-tags">
            <span class="nmf-mini-tag" style="border-color:var(--nmf-accent);color:var(--nmf-accent)">${esc(originShort)}</span>
            <span class="nmf-mini-tag">${esc(it.rating.toUpperCase())}</span>
            ${genderShort ? `<span class="nmf-mini-tag">${esc(genderShort)}</span>` : ''}
            <span class="nmf-mini-tag">${esc(langShort.slice(0, 18))}</span>
            <span class="nmf-mini-tag">${esc(styleShort)}</span>
            ${it.settingEra ? `<span class="nmf-mini-tag">${esc(it.settingEra.slice(0, 20))}</span>` : ''}
            ${genreSample.map((g) => `<span class="nmf-mini-tag">${esc(g)}</span>`).join('')}
        </div>
        <button type="button" class="nmf-btn-secondary" style="height:28px;padding:0 9px;font-size:11px;flex-shrink:0" data-act="open-intake-sheet">
            ${NMF_ICONS.sliders} Анкета
        </button>
    </div>`;
}

function renderIntakeSheetModal(sess) {
    if (!state.intakeSheetOpen) return '';
    const it = sess.intake;
    const worldMode = isWorldOrRpgMode(it);
    const ratingObj = RATING_OPTIONS.find((r) => r.id === it.rating) || RATING_OPTIONS[0];
    const personaName = getTavernContext()?.name1 || '';
    const needsFandom = ['canon', 'fandom_au', 'fandom_oc'].includes(it.originType);

    let stepBody = '';
    if (state.intakeStep === 'who') {
        stepBody = `
            <div class="nmf-panel">
                <div class="nmf-field">
                    <label class="nmf-label">Кого или что создаём?</label>
                    <select class="nmf-select" data-intake="originType" ${sess.frozen ? 'disabled' : ''}>
                        <option value="oc" ${it.originType === 'oc' ? 'selected' : ''}>Персонаж — Оригинальный герой (OC)</option>
                        <option value="canon" ${it.originType === 'canon' ? 'selected' : ''}>Персонаж — Канонный герой из фандома</option>
                        <option value="fandom_au" ${it.originType === 'fandom_au' ? 'selected' : ''}>Персонаж — Фандом в другой вселенной (AU)</option>
                        <option value="fandom_oc" ${it.originType === 'fandom_oc' ? 'selected' : ''}>Персонаж — Новый герой внутри фандома</option>
                        <option value="world_sandbox" ${it.originType === 'world_sandbox' ? 'selected' : ''}>Мир / Сеттинг-песочница (Шаблон в Character Card V2)</option>
                        <option value="rpg_gm" ${it.originType === 'rpg_gm' ? 'selected' : ''}>РПГ-Мастер / Система (Шаблон в Character Card V2)</option>
                    </select>
                </div>

                ${(needsFandom || worldMode) ? `
                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Вселенная-основа (или оставьте пустым для авторского мира)' : 'Название фандома'}</label>
                    <input type="text" class="nmf-input" data-intake="fandomName" value="${esc(it.fandomName)}" placeholder="Например: Cyberpunk 2077, Ведьмак, Jujutsu Kaisen..." ${sess.frozen ? 'disabled' : ''}/>
                </div>` : ''}

                <div class="nmf-grid-2">
                    <div class="nmf-field">
                        <label class="nmf-label">Ваш пол (кем играет Юзер)</label>
                        <select class="nmf-select" data-intake="userGender" ${sess.frozen ? 'disabled' : ''}>
                            ${USER_GENDER_OPTIONS.map((g) => `<option value="${g.id}" ${(it.userGender || 'any') === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
                        </select>
                        ${it.userGender === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="userGenderCustom" value="${esc(it.userGenderCustom || '')}" placeholder="Впишите свой вариант..." ${sess.frozen ? 'disabled' : ''}/>` : ''}
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">${worldMode ? 'Фокус пола НПС в мире' : 'Кого вы ищете?'}</label>
                        <select class="nmf-select" data-intake="targetGender" ${sess.frozen ? 'disabled' : ''}>
                            ${TARGET_GENDER_OPTIONS.map((g) => `<option value="${g.id}" ${(it.targetGender || 'any') === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
                        </select>
                        ${it.targetGender === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="targetGenderCustom" value="${esc(it.targetGenderCustom || '')}" placeholder="Впишите кого угодно..." ${sess.frozen ? 'disabled' : ''}/>` : ''}
                    </div>
                </div>

                <div class="nmf-grid-2">
                    <div class="nmf-field">
                        <label class="nmf-label">Сеттинг или эпоха</label>
                        <input type="text" class="nmf-input" data-intake="settingEra" value="${esc(it.settingEra)}" placeholder="Мегаполис / Тёмное фэнтези / Космос..." ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Рейтинг контента</label>
                        <select class="nmf-select" data-intake="rating" ${sess.frozen ? 'disabled' : ''}>
                            ${RATING_OPTIONS.map((r) => `<option value="${r.id}" ${it.rating === r.id ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}
                        </select>
                    </div>
                </div>

                ${ratingObj.warn ? `<div class="nmf-warn-box">${NMF_ICONS.warn}<span>${esc(ratingObj.warn)}</span></div>` : ''}

                <div class="nmf-field">
                    <label class="nmf-label">Жанры (нажмите на теги или впишите свои)</label>
                    <div class="nmf-chip-wrap">
                        ${GENRE_PRESETS.map((g) => {
                            const on = (it.genres || []).includes(g);
                            return `<button type="button" class="nmf-chip ${on ? 'nmf-on' : ''}" data-act="toggle-genre" data-genre="${esc(g)}" ${sess.frozen ? 'disabled' : ''}>${esc(g)}</button>`;
                        }).join('')}
                    </div>
                    <input type="text" class="nmf-input" style="margin-top:5px!important" data-intake="customGenres" value="${esc(it.customGenres)}" placeholder="Дополнительные жанры через запятую..." ${sess.frozen ? 'disabled' : ''}/>
                </div>
            </div>
        `;
    } else if (state.intakeStep === 'vibe') {
        stepBody = `
            <div class="nmf-panel">
                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Любимые произведения / РПГ для ориентира атмосферы' : 'Любимый типаж из фандомов (ориентир вайба)'}</label>
                    <input type="text" class="nmf-input" data-intake="favFandomHero" value="${esc(it.favFandomHero)}" placeholder="${worldMode ? 'Например: Disco Elysium, Baldur\'s Gate 3, Made in Abyss...' : 'Например: Астарион, Годжо, Леон Кеннеди...'}" ${sess.frozen ? 'disabled' : ''}/>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Кем стартует игрок и какое приключение вы хотите?' : 'Какую историю и отношение к себе вы ищете?'}</label>
                    <textarea class="nmf-textarea" style="min-height:84px" data-intake="userRoleAndDesire" placeholder="${worldMode ? 'Начальная роль игрока, уровень опасности мира, свобода действий...' : 'Кем выступаете вы и какая химия должна быть между вами...'}" ${sess.frozen ? 'disabled' : ''}>${esc(it.userRoleAndDesire)}</textarea>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">${worldMode ? 'Желаемые механики, фракции или фишки мира' : 'Гринфлаги / Любимые тропы'}</label>
                    <input type="text" class="nmf-input" data-intake="tropesWanted" value="${esc(it.tropesWanted)}" placeholder="${worldMode ? 'Гильдии, прокачка рангов, интриги домов, выживание...' : 'Одержимость, забота, телохранитель, разница в статусе...'}" ${sess.frozen ? 'disabled' : ''}/>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">Стоп-лист / Чего точно НЕ предлагать (вручную)</label>
                    <input type="text" class="nmf-input" data-intake="hardBans" value="${esc(it.hardBans)}" placeholder="Впишите через запятую всё, что сразу исключить..." ${sess.frozen ? 'disabled' : ''}/>
                </div>
            </div>
        `;
    } else {
        stepBody = `
            <div class="nmf-panel">
                <div class="nmf-field">
                    <label class="nmf-label">Стиль и оформление Первого сообщения</label>
                    <select class="nmf-select" data-intake="greetingStyle" ${sess.frozen ? 'disabled' : ''}>
                        ${GREETING_STYLES.map((s) => `<option value="${s.id}" ${(it.greetingStyle || 'fanfic') === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
                    </select>
                </div>

                <div class="nmf-grid-2">
                    <div class="nmf-field">
                        <label class="nmf-label">Лицо повествования</label>
                        <select class="nmf-select" data-intake="greetingPov" ${sess.frozen ? 'disabled' : ''}>
                            ${GREETING_POVS.map((p) => `<option value="${p.id}" ${(it.greetingPov || 'third') === p.id ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Как называть игрока</label>
                        <select class="nmf-select" data-intake="playerNameMode" ${sess.frozen ? 'disabled' : ''}>
                            <option value="macro" ${(it.playerNameMode || 'macro') === 'macro' ? 'selected' : ''}>Универсальный {{user}}</option>
                            <option value="persona" ${it.playerNameMode === 'persona' ? 'selected' : ''}>Имя Персоны${personaName ? ` (${esc(personaName)})` : ''}</option>
                        </select>
                    </div>
                </div>

                <div class="nmf-field">
                    <label class="nmf-label">Особые пожелания к разметке или слогу (по желанию)</label>
                    <textarea class="nmf-textarea" style="min-height:66px" data-intake="greetingCustomRules" placeholder="Например: прямая речь через тире, мысли курсивом, в конце компактный статус локации..." ${sess.frozen ? 'disabled' : ''}>${esc(it.greetingCustomRules)}</textarea>
                </div>

                <div class="nmf-grid-2">
                    <div class="nmf-field">
                        <label class="nmf-label">Структура карточки</label>
                        <select class="nmf-select" data-intake="cardFormat" ${sess.frozen ? 'disabled' : ''}>
                            ${CARD_FORMATS.map((f) => `<option value="${f.id}" ${it.cardFormat === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Язык карточки</label>
                        <select class="nmf-select" data-intake="language" ${sess.frozen ? 'disabled' : ''}>
                            ${NMF_LANGUAGES.map((l) => `<option value="${esc(l.id)}" ${it.language === l.id ? 'selected' : ''}>${esc(l.label)}</option>`).join('')}
                        </select>
                        ${it.language === 'custom' ? `<input type="text" class="nmf-input" style="margin-top:4px!important" data-intake="customLanguage" value="${esc(it.customLanguage || '')}" placeholder="Язык или макрос {{language}}..." ${sess.frozen ? 'disabled' : ''}/>` : ''}
                        ${(it.language === '{{language}}' || it.language === 'hybrid_en_local') ? `<div style="font-family:var(--nmf-font-mono);font-size:10px;color:var(--nmf-text-muted);margin-top:3px">Макрос {{language}} сейчас: ${esc(detectUserLocaleLanguage())}</div>` : ''}
                    </div>
                </div>

                <div class="nmf-grid-2">
                    <div class="nmf-field">
                        <label class="nmf-label">Длина описания</label>
                        <select class="nmf-select" data-intake="wordBudgetId" ${sess.frozen ? 'disabled' : ''}>
                            ${WORD_BUDGETS.map((b) => `<option value="${b.id}" ${it.wordBudgetId === b.id ? 'selected' : ''}>${esc(b.label)}</option>`).join('')}
                        </select>
                        ${it.wordBudgetId === 'custom' ? `<input type="number" min="100" max="4000" class="nmf-input" style="margin-top:4px!important" data-intake="customWords" value="${Number(it.customWords) || 800}"/>` : ''}
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">Длина 1-го сообщения</label>
                        <select class="nmf-select" data-intake="greetingBudgetId" ${sess.frozen ? 'disabled' : ''}>
                            ${GREETING_BUDGETS.map((b) => `<option value="${b.id}" ${it.greetingBudgetId === b.id ? 'selected' : ''}>${esc(b.label)}</option>`).join('')}
                        </select>
                        ${it.greetingBudgetId === 'custom' ? `<input type="number" min="50" max="2000" class="nmf-input" style="margin-top:4px!important" data-intake="customGreetingWords" value="${Number(it.customGreetingWords) || 320}"/>` : ''}
                    </div>
                </div>
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
                    <button type="button" class="nmf-seg-btn ${state.intakeStep === 'who' ? 'nmf-active' : ''}" data-act="intake-step" data-step="who">1. Формат и Мир</button>
                    <button type="button" class="nmf-seg-btn ${state.intakeStep === 'vibe' ? 'nmf-active' : ''}" data-act="intake-step" data-step="vibe">2. Вайб и Стоп</button>
                    <button type="button" class="nmf-seg-btn ${state.intakeStep === 'style' ? 'nmf-active' : ''}" data-act="intake-step" data-step="style">3. Стиль Сцены</button>
                </div>
            </div>
            <div class="nmf-sheet-body">${stepBody}</div>
            <div class="nmf-sheet-foot">
                <button type="button" class="nmf-btn-primary" style="width:100%" data-act="close-intake-sheet">
                    Сохранить и вернуться
                </button>
            </div>
        </div>
    </div>`;
}

function renderCandidateEditModal(sess) {
    const ref = state.editingCandRef;
    if (!ref) return '';
    const list = sess.tinder?.[ref.pool];
    const cand = Array.isArray(list) ? list[ref.idx] : null;
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

// 1. SWIPE DECK SCREEN
function renderSwipeTab(sess) {
    const td = sess.tinder;
    const cfg = getSettings();
    const imgCaps = detectImageExtensions();
    const canArt = imgCaps.hasAny && cfg.imageSource !== 'off';
    const current = td.queue[0] || null;
    const currentAvatarUrl = resolveEntityAvatarUrl(current);
    const hasNext = td.queue.length > 1;
    const lastRejected = td.lastDislikedCandidate;
    const isArtLoading = current ? state.loadingArtIds.has(current.id) : false;
    const artStat = current ? state.artStatuses.get(current.id) : null;
    const artErrText = current ? (state.artErrors.get(current.id) || '') : '';
    const worldMode = isWorldOrRpgMode(sess.intake);

    return `
    ${renderFilterSummaryBanner(sess)}

    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
        <input type="text" class="nmf-input" style="flex:1" data-tinder="promptHint" value="${esc(td.promptHint)}" placeholder="${worldMode ? 'Пожелание к миру/РПГ...' : 'Пожелание в ленту (например: постарше, босс)...'}" ${sess.frozen ? 'disabled' : ''}/>
        <button type="button" class="nmf-icon-btn ${state.swipeControlsOpen ? 'nmf-active' : ''}" style="height:36px" data-act="toggle-swipe-opts" title="Настройки колоды и стоп-слов">
            ×${Number(td.batchSize) || 1}
        </button>
        <button type="button" class="nmf-btn-primary" style="height:36px;padding:0 11px" data-act="gen-tinder" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.spark} Поиск
        </button>
    </div>

    ${state.swipeControlsOpen ? `
    <div class="nmf-panel nmf-panel-sub">
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
                <span style="font-size:12px;font-weight:700">Поочерёдная авто-подгрузка фото</span>
                <div class="nmf-switch ${td.autoArt ? 'nmf-on' : ''}"></div>
            </div>` : ''}
        </div>

        <div class="nmf-field">
            <label class="nmf-label">Вписать вручную, чего НЕ предлагать дальше</label>
            <div style="display:flex;gap:6px">
                <input type="text" class="nmf-input" id="nmf-manual-ban-input" value="${esc(state.manualBanDraft)}" placeholder="Например: борода, тюрьма, грубость..."/>
                <button type="button" class="nmf-btn-secondary" style="height:36px;flex-shrink:0" data-act="add-manual-ban">+ В бан</button>
            </div>
        </div>

        ${(td.dislikedTags.length > 0 || td.dislikedNotes.length > 0) ? `
        <div class="nmf-field">
            <label class="nmf-label">Активный чёрный список (клик — убрать)</label>
            <div class="nmf-chip-wrap">
                ${td.dislikedTags.map((t, idx) => `<button type="button" class="nmf-chip nmf-ban" data-act="remove-antitag" data-idx="${idx}">${esc(t)} ×</button>`).join('')}
                ${td.dislikedNotes.map((n, idx) => `<button type="button" class="nmf-chip nmf-ban" data-act="remove-antinote" data-idx="${idx}">${esc(n)} ×</button>`).join('')}
            </div>
        </div>` : ''}
    </div>` : ''}

    ${lastRejected ? `
    <div class="nmf-feedback-pop">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
            <span style="font-size:11.5px;font-weight:700;color:#ff8fa0">Мимо «${esc(lastRejected.name)}»</span>
            <div class="nmf-btn-row">
                <button type="button" class="nmf-chip" data-act="undo-last-pass" title="Случайно смахнули? Вернуть карточку обратно!">${NMF_ICONS.undo} Вернуть</button>
                <button type="button" class="nmf-chip" data-act="dismiss-reject-pop">Скрыть</button>
            </div>
        </div>
        <div class="nmf-chip-wrap">
            ${(lastRejected.tags || []).map((tg) => {
                const banned = td.dislikedTags.includes(tg);
                return `<button type="button" class="nmf-chip ${banned ? 'nmf-ban' : ''}" data-act="quick-ban-tag" data-tag="${esc(tg)}">${banned ? 'В бане: ' : '+ '}${esc(tg)}</button>`;
            }).join('')}
        </div>
        <div style="display:flex;gap:6px">
            <input type="text" class="nmf-input" id="nmf-manual-ban-input" value="${esc(state.manualBanDraft)}" placeholder="Или впишите ручкой, что именно не предлагать..."/>
            <button type="button" class="nmf-btn-secondary" style="height:36px;flex-shrink:0" data-act="add-manual-ban">+ Учесть</button>
        </div>
    </div>` : ''}

    ${current ? `
    <div class="nmf-deck-stage">
        ${hasNext ? `<div class="nmf-deck-backcard"></div>` : ''}
        <div class="nmf-swipe-card" id="nmf-active-swipe-card">
            <div class="nmf-stamp nmf-stamp-like" id="nmf-stamp-like">LIKE</div>
            <div class="nmf-stamp nmf-stamp-nope" id="nmf-stamp-nope">PASS</div>

            <div class="nmf-hero-visual ${(currentAvatarUrl || isArtLoading) ? 'nmf-has-photo' : ''}">
                ${currentAvatarUrl ? `<img class="nmf-hero-photo" src="${esc(currentAvatarUrl)}" alt="Profile"/>` : ''}
                ${isArtLoading ? `
                <div class="nmf-photo-loading" style="${currentAvatarUrl ? 'background:rgba(8,11,18,0.72);backdrop-filter:blur(3px)' : ''}">
                    <div class="nmf-art-status-hud">
                        <div class="nmf-art-status-head">
                            <span data-art-stage="${esc(current.id)}">${esc(artStat?.stage || 'Генерация [Попытка 1/3]')}</span>
                            <span data-art-timer="${esc(current.id)}">${Number(artStat?.elapsedSec) || 0}с</span>
                        </div>
                        <div class="nmf-art-pulse-track"><div class="nmf-art-pulse-bar"></div></div>
                        <div class="nmf-art-status-detail" data-art-detail="${esc(current.id)}">${esc(artStat?.detail || `Отправка запроса (${cfg.imageAspectRatio})...`)}</div>
                        ${artStat?.providerLabel ? `<div class="nmf-art-status-sub" data-art-prov="${esc(current.id)}">Движок: ${esc(artStat.providerLabel)}</div>` : `<div class="nmf-art-status-sub" data-art-prov="${esc(current.id)}">Формат: ${esc(cfg.imageAspectRatio)}</div>`}
                    </div>
                    <button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:26px;font-size:10.5px;padding:0 9px;position:relative;z-index:5" data-act="stop-cand-art">Стоп фото</button>
                </div>` : ''}
                <div class="nmf-hero-topbadges">
                    <span class="nmf-match-badge">MATCH ${Number(current.compatibility) || 91}%</span>
                    <div style="display:flex;gap:5px">
                        <button type="button" class="nmf-art-chip-btn" data-act="edit-cand" data-pool="queue" data-idx="0" title="Изменить текст/промпт этой анкеты">
                            ${NMF_ICONS.editSmall} Править
                        </button>
                        ${canArt ? (isArtLoading
                            ? `<button type="button" class="nmf-art-chip-btn" style="border-color:#ff6b86;color:#ff8fa0" data-act="stop-cand-art">Стоп</button>`
                            : `<button type="button" class="nmf-art-chip-btn" data-act="gen-cand-art">${NMF_ICONS.image} ${currentAvatarUrl ? 'Переснять' : 'Фото'}</button>`
                        ) : ''}
                    </div>
                </div>
                <div class="nmf-hero-scrim">
                    <div class="nmf-hero-name">${esc(current.name)}</div>
                    ${current.archetype ? `<div class="nmf-hero-arch">${esc(current.archetype)}</div>` : ''}
                </div>
            </div>

            <div class="nmf-profile-body">
                ${artErrText ? `
                <div class="nmf-warn-box" style="border-color:#ff5c77;font-size:11px">
                    ${NMF_ICONS.warn}
                    <span><strong>Фото не загрузилось (повтор остановлен):</strong> ${esc(artErrText)}</span>
                </div>` : ''}
                ${current.quote ? `<div class="nmf-profile-quote">«${esc(parseCleanQuote(current.quote))}»</div>` : ''}
                <div class="nmf-profile-bio">${esc(current.pitch)}</div>
                ${current.appearance ? `<div class="nmf-profile-looks"><strong>${worldMode ? 'Атмосфера мира' : 'Внешность'}:</strong> ${esc(current.appearance)}</div>` : ''}
                <div class="nmf-chip-wrap">
                    ${(current.tags || []).map((tg) => `<span class="nmf-chip">${esc(tg)}</span>`).join('')}
                </div>
                <div style="text-align:center;font-family:var(--nmf-font-mono);font-size:10px;color:var(--nmf-text-muted)">
                    Свайп влево (в архив Мимо) · Свайп вправо (в Мэтчи) · В очереди ещё: ${td.queue.length - 1}
                </div>
            </div>
        </div>
    </div>

    <div class="nmf-dating-dock">
        <button type="button" class="nmf-dock-btn nmf-dock-nope" data-act="tinder-dislike" ${sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.dislike} Мимо
        </button>
        <button type="button" class="nmf-dock-btn nmf-dock-super" data-act="tinder-expand-now" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.spark} Собрать
        </button>
        <button type="button" class="nmf-dock-btn nmf-dock-like" data-act="tinder-like" ${sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.heart} В Мэтчи
        </button>
    </div>` : `
    <div class="nmf-empty-deck">
        <div style="color:var(--nmf-accent)">${NMF_ICONS.flame}</div>
        <div style="font-family:var(--nmf-font-title);font-size:17px;font-weight:700">${worldMode ? 'Лента миров и РПГ готова к поиску' : 'Лента знакомств готова к поиску'}</div>
        <div style="font-size:12.5px;color:var(--nmf-text-muted);max-width:330px;line-height:1.45">
            Все смахнутые в «Мимо» анкеты бережно сохраняются во вкладке «Мэтчи -> Архив Мимо», откуда их всегда можно вернуть и отредактировать.
        </div>
        <div class="nmf-btn-row" style="justify-content:center;margin-top:4px">
            <button type="button" class="nmf-btn-secondary" data-act="open-intake-sheet">${NMF_ICONS.sliders} Анкета</button>
            <button type="button" class="nmf-btn-primary" data-act="gen-tinder" ${state.busy || sess.frozen ? 'disabled' : ''}>${NMF_ICONS.spark} Запустить подбор</button>
        </div>
    </div>`}`;
}

// 2. MATCHES & PASSED ARCHIVE SCREEN
function renderMatchesTab(sess) {
    const liked = sess.tinder.liked || [];
    const passed = sess.tinder.passed || [];
    const isPassedView = state.matchesSubTab === 'passed';
    const items = isPassedView ? passed : liked;

    return `
    <div class="nmf-seg-bar">
        <button type="button" class="nmf-seg-btn ${!isPassedView ? 'nmf-active' : ''}" data-act="matches-sub" data-sub="liked">
            ${NMF_ICONS.heart} Избранные Мэтчи (${liked.length})
        </button>
        <button type="button" class="nmf-seg-btn ${isPassedView ? 'nmf-active' : ''}" data-act="matches-sub" data-sub="passed">
            ${NMF_ICONS.undo} Архив «Мимо» (${passed.length})
        </button>
    </div>

    ${items.length === 0 ? `
    <div class="nmf-empty-deck">
        <div style="color:var(--nmf-accent)">${isPassedView ? NMF_ICONS.undo : NMF_ICONS.heart}</div>
        <div style="font-family:var(--nmf-font-title);font-size:16px;font-weight:700">
            ${isPassedView ? 'В архиве «Мимо» пока пусто' : 'Пока нет сохранённых Мэтчей'}
        </div>
        <div style="font-size:12px;color:var(--nmf-text-muted)">
            ${isPassedView
                ? 'Сюда попадают все отклонённые анкеты — вы сможете в любой момент найти любую из них, переписать детали под себя, вернуть в колоду или собрать карточку.'
                : 'Свайпайте понравившиеся анкеты вправо на вкладке «Свайпы».'}
        </div>
    </div>` : `
    <div class="nmf-matches-grid">
        ${items.map((c, idx) => {
            const thumbUrl = resolveEntityAvatarUrl(c);
            return `
        <div class="nmf-match-tile">
            <div>
                <div class="nmf-match-thumb">
                    ${thumbUrl ? `<img src="${esc(thumbUrl)}" alt="Card"/>` : ''}
                    <div class="nmf-match-thumb-ov">
                        <div style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;line-height:1.2">${esc(c.name)}</div>
                        <div style="font-family:var(--nmf-font-mono);font-size:9px;color:var(--nmf-accent-2);margin-top:2px">${esc((c.archetype || '').slice(0, 34))}</div>
                    </div>
                </div>
                <div style="padding:8px 9px;font-size:11.5px;line-height:1.4;color:var(--nmf-text-muted)">
                    ${esc((c.pitch || '').slice(0, 105))}${(c.pitch || '').length > 105 ? '...' : ''}
                </div>
            </div>
            <div style="padding:0 8px 8px;display:flex;flex-wrap:wrap;gap:4px">
                <button type="button" class="nmf-btn-primary" style="flex:1;height:28px;font-size:10px;padding:0 6px" data-act="${isPassedView ? 'expand-passed' : 'expand-liked'}" data-idx="${idx}" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    Собрать
                </button>
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="edit-cand" data-pool="${isPassedView ? 'passed' : 'liked'}" data-idx="${idx}" title="Редактировать текст и промпт">
                    ${NMF_ICONS.editSmall}
                </button>
                ${isPassedView ? `
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="restore-passed-to-deck" data-idx="${idx}" title="Вернуть обратно в Свайпы">
                    ${NMF_ICONS.undo}
                </button>` : ''}
                <button type="button" class="nmf-icon-btn nmf-sq" style="height:28px;width:28px" data-act="${isPassedView ? 'del-passed' : 'del-liked'}" data-idx="${idx}" title="Удалить навсегда">
                    ${NMF_ICONS.trash}
                </button>
            </div>
        </div>`;
        }).join('')}
    </div>`}`;
}

// 3. BLITZ 10 QUIZ SCREEN
function renderBlitzTab(sess) {
    const bz = sess.blitz;
    const answeredCount = bz.questions.filter((q) => !q.skipped && String(q.answer || '').trim()).length;
    const worldMode = isWorldOrRpgMode(sess.intake);

    return `
    ${renderFilterSummaryBanner(sess)}
    <div class="nmf-panel">
        <div class="nmf-field">
            <label class="nmf-label">${worldMode ? 'Тема для Блиц-конструктора мира / РПГ (10 вопросов)' : 'Тема для Блиц-теста на совместимость (10 вопросов)'}</label>
            <input type="text" class="nmf-input" data-blitz="topic" value="${esc(bz.topic)}" placeholder="${worldMode ? 'Например: Постапокалипсис с мутациями и фракциями...' : 'Например: Опасный мафиози, сосед по комнате, рыцарь...'}" ${sess.frozen ? 'disabled' : ''}/>
        </div>

        <div class="nmf-toggle-line" data-act="toggle-blitz-choices">
            <span style="font-size:12px;font-weight:700">Подсказывать быстрые кнопки-варианты ответов</span>
            <div class="nmf-switch ${bz.includeChoices ? 'nmf-on' : ''}"></div>
        </div>

        <button type="button" class="nmf-btn-primary" data-act="gen-blitz-10" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.blitz} ${bz.questions.length ? 'Пересоздать все 10 вопросов' : 'Запустить Блиц из 10 вопросов'}
        </button>
    </div>

    ${bz.questions.length > 0 ? `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 2px">
        <span class="nmf-label" style="color:var(--nmf-accent)">Ответов: ${answeredCount} / ${bz.questions.length}</span>
    </div>
    ${bz.questions.map((q, idx) => `
    <div class="nmf-q-card ${q.skipped ? 'nmf-q-skipped' : ''}">
        <div class="nmf-q-head">
            <div class="nmf-q-title">${idx + 1}. ${esc(q.question)}</div>
            <div class="nmf-btn-row" style="flex-shrink:0">
                <button type="button" class="nmf-chip ${q.skipped ? 'nmf-on' : ''}" data-act="blitz-skip" data-idx="${idx}">${q.skipped ? 'Пропущен' : 'Скип'}</button>
                <button type="button" class="nmf-chip" data-act="blitz-regen-one" data-idx="${idx}" ${state.busy || sess.frozen ? 'disabled' : ''}>Другой</button>
            </div>
        </div>
        ${(!q.skipped && Array.isArray(q.options) && q.options.length > 0) ? `
        <div class="nmf-chip-wrap">
            ${q.options.map((opt) => `<button type="button" class="nmf-chip ${q.answer === opt ? 'nmf-on' : ''}" data-act="blitz-pick-opt" data-idx="${idx}" data-opt="${esc(opt)}">${esc(opt)}</button>`).join('')}
        </div>` : ''}
        ${!q.skipped ? `<input type="text" class="nmf-input" data-blitz-ans="${idx}" value="${esc(q.answer)}" placeholder="Ваш ответ..." ${sess.frozen ? 'disabled' : ''}/>` : ''}
    </div>`).join('')}

    <button type="button" class="nmf-btn-primary" style="width:100%" data-act="build-from-blitz" ${state.busy || sess.frozen ? 'disabled' : ''}>
        ${NMF_ICONS.spark} Собрать готовую карточку по ответам
    </button>` : ''}`;
}

// 4. CREATE FROM IDEA OR MULTIVERSE AU SHIFT
function renderCreateTab(sess) {
    const mode = sess.architect.subMode || 'idea';
    const rw = sess.rework;
    const worldMode = isWorldOrRpgMode(sess.intake);

    return `
    ${renderFilterSummaryBanner(sess)}
    <div class="nmf-seg-bar">
        <button type="button" class="nmf-seg-btn ${mode === 'idea' ? 'nmf-active' : ''}" data-act="create-submode" data-sub="idea">
            ${NMF_ICONS.architect} Из своей задумки
        </button>
        <button type="button" class="nmf-seg-btn ${mode === 'rework' ? 'nmf-active' : ''}" data-act="create-submode" data-sub="rework">
            ${NMF_ICONS.rework} Чар в другой мир (AU)
        </button>
    </div>

    ${mode === 'idea' ? `
    <div class="nmf-panel">
        <div class="nmf-field">
            <label class="nmf-label">${worldMode ? 'Опишите мир, систему, фракции и стартовую точку' : 'Опишите героя и завязку своими словами'}</label>
            <textarea class="nmf-textarea" style="min-height:150px" data-arch="freeConcept" placeholder="${worldMode ? 'Опишите законы мира, магию/технологии, ключевые группировки, механики квестов и с чего начинается путь игрока...' : 'Напишите всё, что крутится в голове: внешность, характер, кем он вам приходится и с какой сцены начать...'}" ${sess.frozen ? 'disabled' : ''}>${esc(sess.architect.freeConcept)}</textarea>
        </div>
        <button type="button" class="nmf-btn-primary" style="width:100%" data-act="build-from-architect" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.spark} ${worldMode ? 'Собрать карточку Мира / РПГ' : 'Собрать карточку персонажа'}
        </button>
    </div>` : `
    <div class="nmf-panel">
        <div class="nmf-field">
            <label class="nmf-label">
                <span>Выберите карточку из вашей Таверны</span>
                <button type="button" class="nmf-chip" data-act="refresh-roster">Обновить</button>
            </label>
            <select class="nmf-select" data-rework="sourceAvatar" ${sess.frozen ? 'disabled' : ''}>
                <option value="">— Выберите карточку (${state.rosterChars.length}) —</option>
                ${state.rosterChars.map((c) => `<option value="${esc(c.avatar)}" ${rw.sourceAvatar === c.avatar ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
        </div>

        <div class="nmf-field">
            <label class="nmf-label">Как переносим?</label>
            <select class="nmf-select" data-rework="reworkMode" ${sess.frozen ? 'disabled' : ''}>
                <option value="au_shift" ${rw.reworkMode === 'au_shift' ? 'selected' : ''}>В другую эпоху / сеттинг (бережно сохранить стиль и оформление оригинала)</option>
                <option value="full_rebuild" ${(rw.reworkMode === 'full_rebuild' || rw.reworkMode === 'full_rework') ? 'selected' : ''}>Полная пересборка под выбранный шаблон Анкеты</option>
            </select>
        </div>

        <div class="nmf-grid-2">
            <div class="nmf-field">
                <label class="nmf-label">Новая вселенная / эпоха</label>
                <input type="text" class="nmf-input" data-rework="targetSettingEra" value="${esc(rw.targetSettingEra)}" placeholder="Киберпанк / Мафия / Университет..." ${sess.frozen ? 'disabled' : ''}/>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">Атмосфера встречи</label>
                <input type="text" class="nmf-input" data-rework="moodTone" value="${esc(rw.moodTone)}" placeholder="Случайное столкновение, искра, дождь..." ${sess.frozen ? 'disabled' : ''}/>
            </div>
        </div>

        <div class="nmf-field">
            <label class="nmf-label">Как вы встречаетесь в этом мире (по желанию)</label>
            <textarea class="nmf-textarea" style="min-height:68px" data-rework="encounterIdea" placeholder="Короткая идея для первого сообщения..." ${sess.frozen ? 'disabled' : ''}>${esc(rw.encounterIdea)}</textarea>
        </div>

        <div class="nmf-btn-row">
            <button type="button" class="nmf-btn-primary" style="flex:1" data-act="run-rework" ${state.busy || sess.frozen ? 'disabled' : ''}>
                ${NMF_ICONS.rework} Перенести в новый мир
            </button>
            <button type="button" class="nmf-btn-secondary" data-act="load-char-to-editor" ${state.busy || sess.frozen ? 'disabled' : ''}>
                Открыть без ИИ
            </button>
        </div>
    </div>`}`;
}

// 5. STREAMLINED PROFILE EDITOR
function renderEditorTab(sess) {
    const c = sess.card;
    const cfg = getSettings();
    const cardAvatarUrl = resolveEntityAvatarUrl(c);
    const totalWords = countWords(c.description) + countWords(c.personality) + countWords(c.scenario) + countWords(c.first_mes);
    const approxTokens = Math.round(totalWords * 1.45);
    const hasCodex = detectPocketCodex();
    const imgCaps = detectImageExtensions();
    const canArt = imgCaps.hasAny && cfg.imageSource !== 'off';
    const cssRatio = cfg.imageAspectRatio === 'native' ? '1 / 1' : (cfg.imageAspectRatio || '1:1').replace(':', ' / ');
    const canOverwriteOriginal = Boolean(c.sourceAvatarId && c.sourceLoadedFromTavern);
    const latestBackupForCard = canOverwriteOriginal
        ? state.recentBackups.find((b) => b.avatarFileName === c.sourceAvatarId)
        : state.recentBackups[0] || null;

    let subBody = '';
    if (state.editorSubTab === 'main') {
        const edStat = state.editorArtStatus;
        subBody = `
        <div class="nmf-panel">
            <div style="display:grid;grid-template-columns:104px minmax(0,1fr);gap:11px;align-items:start">
                <div style="position:relative;aspect-ratio:${cssRatio};border:1px solid var(--nmf-border-active);background:var(--nmf-bg);overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--nmf-text-muted);text-align:center">
                    ${cardAvatarUrl
                        ? `<img src="${esc(cardAvatarUrl)}" style="width:100%;height:100%;object-fit:var(--nmf-art-fit,cover);object-position:var(--nmf-art-pos,center 18%)" alt="Avatar"/>`
                        : ''}
                    ${state.editorArtLoading
                        ? `<div class="nmf-photo-loading" style="padding:6px;gap:5px;${cardAvatarUrl ? 'background:rgba(8,11,18,0.75)' : ''}"><div class="nmf-photo-spinner"></div><span id="nmf-editor-art-badge" style="font-family:var(--nmf-font-mono);font-size:9.5px;color:var(--nmf-accent)">${esc(`${edStat?.attempt || 1}/${edStat?.maxAttempts || 3} · ${edStat?.elapsedSec || 0}с`)}</span></div>`
                        : (!cardAvatarUrl ? `${NMF_ICONS.image}<span>${esc(cfg.imageAspectRatio)}</span>` : '')}
                </div>
                <div style="display:flex;flex-direction:column;gap:7px;min-width:0">
                    <div class="nmf-field">
                        <label class="nmf-label">Имя персонажа / Название Мира</label>
                        <input type="text" class="nmf-input" data-card="name" value="${esc(c.name)}" placeholder="Название карточки..." ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                    <div class="nmf-btn-row">
                        <label class="nmf-btn-secondary" style="height:30px;font-size:11px;cursor:pointer">
                            ${NMF_ICONS.upload} Своё фото
                            <input type="file" id="nmf-avatar-upload" accept="image/*" style="display:none" ${sess.frozen ? 'disabled' : ''}/>
                        </label>
                        ${cardAvatarUrl ? `<button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:30px;font-size:11px" data-act="clear-avatar">Убрать</button>` : ''}
                    </div>
                    ${canArt ? `
                    <div style="display:flex;gap:5px">
                        <input type="text" class="nmf-input" data-card="imagePrompt" value="${esc(c.imagePrompt)}" placeholder="Промпт арта (EN)..." ${sess.frozen ? 'disabled' : ''}/>
                        ${state.editorArtLoading
                            ? `<button type="button" class="nmf-btn-secondary nmf-btn-danger" style="height:36px;flex-shrink:0" data-act="stop-editor-art">Стоп</button>`
                            : `<button type="button" class="nmf-btn-secondary" style="height:36px;flex-shrink:0" data-act="gen-editor-art">Арт</button>`}
                    </div>
                    ${state.editorArtLoading ? `
                    <div class="nmf-editor-art-strip">
                        <div class="nmf-art-status-head">
                            <span id="nmf-editor-art-stage">${esc(edStat?.stage || 'Генерация [Попытка 1/3]')}</span>
                            <span id="nmf-editor-art-timer">${Number(edStat?.elapsedSec) || 0}с</span>
                        </div>
                        <div class="nmf-art-pulse-track"><div class="nmf-art-pulse-bar"></div></div>
                        <div class="nmf-art-status-detail" id="nmf-editor-art-detail">${esc(edStat?.detail || 'Отправка запроса генерации...')}</div>
                    </div>` : ''}
                    ${(!state.editorArtLoading && state.editorArtError) ? `
                    <div class="nmf-warn-box" style="border-color:#ff5c77;font-size:10.5px;padding:6px 8px">
                        ${NMF_ICONS.warn}
                        <span><strong>Сбой генерации арта:</strong> ${esc(state.editorArtError)}</span>
                    </div>` : ''}` : ''}
                </div>
            </div>

            <div class="nmf-field">
                <label class="nmf-label"><span>Описание (Description)</span><span>${countWords(c.description)} слов</span></label>
                <textarea class="nmf-textarea" style="min-height:190px" data-card="description" placeholder="Характер, внешность, законы мира, фракции..." ${sess.frozen ? 'disabled' : ''}>${esc(c.description)}</textarea>
            </div>
        </div>`;
    } else if (state.editorSubTab === 'greet') {
        subBody = `
        <div class="nmf-panel">
            <div class="nmf-field">
                <label class="nmf-label"><span>Первое сообщение (First Message)</span><span>${countWords(c.first_mes)} слов</span></label>
                <textarea class="nmf-textarea" style="min-height:185px" data-card="first_mes" placeholder="Стартовая сцена..." ${sess.frozen ? 'disabled' : ''}>${esc(c.first_mes)}</textarea>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">
                    <span>Дополнительные приветствия (${(c.alternate_greetings || []).length})</span>
                    <button type="button" class="nmf-chip" data-act="add-alt-greeting">+ Добавить сцену</button>
                </label>
                ${(c.alternate_greetings || []).map((ag, idx) => `
                <div style="display:flex;gap:6px;align-items:flex-start;margin-top:5px">
                    <textarea class="nmf-textarea" style="min-height:80px;flex:1" data-alt-idx="${idx}" placeholder="Вариант сцены #${idx + 2}...">${esc(ag)}</textarea>
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="del-alt-greeting" data-idx="${idx}">${NMF_ICONS.trash}</button>
                </div>`).join('')}
            </div>
        </div>`;
    } else {
        subBody = `
        <div class="nmf-panel">
            <div class="nmf-grid-2">
                <div class="nmf-field">
                    <label class="nmf-label"><span>Привязать Лорбук</span><button type="button" class="nmf-chip" data-act="refresh-roster">Обновить</button></label>
                    <select class="nmf-select" data-card="world">
                        <option value="">— Без Лорбука —</option>
                        ${state.worldNames.map((w) => `<option value="${esc(w)}" ${c.world === w ? 'selected' : ''}>${esc(w)}</option>`).join('')}
                    </select>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Кузница Лорбуков</label>
                    ${hasCodex
                        ? `<button type="button" class="nmf-btn-secondary" style="height:36px;width:100%" data-act="open-codex-forge">${NMF_ICONS.book} Открыть Кодекс</button>`
                        : `<div style="height:36px;display:flex;align-items:center;padding:0 8px;border:1px dashed var(--nmf-border);font-size:11px;color:var(--nmf-text-muted)">Выберите готовый Лорбук слева</div>`}
                </div>
            </div>
            <div class="nmf-grid-2">
                <div class="nmf-field">
                    <label class="nmf-label">Характер / Правила Мастера (Personality)</label>
                    <textarea class="nmf-textarea" style="min-height:64px" data-card="personality">${esc(c.personality)}</textarea>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Сценарий (Scenario)</label>
                    <textarea class="nmf-textarea" style="min-height:64px" data-card="scenario">${esc(c.scenario)}</textarea>
                </div>
            </div>
            <div class="nmf-grid-2">
                <div class="nmf-field">
                    <label class="nmf-label">System Prompt (важно для РПГ/Миров)</label>
                    <textarea class="nmf-textarea" style="min-height:60px" data-card="system_prompt">${esc(c.system_prompt)}</textarea>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Post-History Instructions</label>
                    <textarea class="nmf-textarea" style="min-height:60px" data-card="post_history_instructions">${esc(c.post_history_instructions)}</textarea>
                </div>
            </div>
            <div class="nmf-grid-2">
                <div class="nmf-field">
                    <label class="nmf-label">Теги (через запятую)</label>
                    <input type="text" class="nmf-input" data-card="tags" value="${esc(c.tags)}"/>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Автор (Creator)</label>
                    <input type="text" class="nmf-input" data-card="creator" value="${esc(c.creator)}"/>
                </div>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">Примеры речи / ходов (mes_example)</label>
                <textarea class="nmf-textarea" style="min-height:64px" data-card="mes_example">${esc(c.mes_example)}</textarea>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">Заметки для игрока (Creator Notes)</label>
                <textarea class="nmf-textarea" style="min-height:56px" data-card="creator_notes">${esc(c.creator_notes)}</textarea>
            </div>
        </div>`;
    }

    return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <span class="nmf-label" style="color:var(--nmf-accent)">Профиль Карточки${canOverwriteOriginal ? ` · Источник: ${esc(c.sourceAvatarId)}` : ''}</span>
        <span style="font-family:var(--nmf-font-mono);font-size:10.5px;color:var(--nmf-text-muted)">${totalWords} слов (~${approxTokens} ток.) · Арт ${esc(cfg.imageAspectRatio)}</span>
    </div>

    <div class="nmf-seg-bar nmf-seg-3">
        <button type="button" class="nmf-seg-btn ${state.editorSubTab === 'main' ? 'nmf-active' : ''}" data-act="editor-sub" data-sub="main">1. Описание</button>
        <button type="button" class="nmf-seg-btn ${state.editorSubTab === 'greet' ? 'nmf-active' : ''}" data-act="editor-sub" data-sub="greet">2. Сцена</button>
        <button type="button" class="nmf-seg-btn ${state.editorSubTab === 'meta' ? 'nmf-active' : ''}" data-act="editor-sub" data-sub="meta">3. РПГ / Лор</button>
    </div>

    ${subBody}

    <div class="nmf-panel nmf-panel-sub">
        <div class="nmf-btn-row">
            <button type="button" class="nmf-btn-primary" style="flex:1" data-act="save-to-tavern-new" ${state.busy ? 'disabled' : ''}>
                ${NMF_ICONS.save} В Таверну (новая)
            </button>
            ${canOverwriteOriginal ? `
            <button type="button" class="nmf-btn-secondary" data-act="save-to-tavern-overwrite" ${state.busy ? 'disabled' : ''}>
                Обновить оригинал
            </button>` : ''}
            <button type="button" class="nmf-btn-secondary" data-act="export-png">${NMF_ICONS.download} PNG</button>
            <button type="button" class="nmf-btn-secondary" data-act="export-json">JSON</button>
            <label class="nmf-btn-secondary" style="cursor:pointer">
                Импорт
                <input type="file" id="nmf-json-import" accept=".json,application/json" style="display:none"/>
            </label>
        </div>
        ${latestBackupForCard ? `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;padding-top:6px;border-top:1px dashed var(--nmf-border);font-size:11px;color:var(--nmf-text-muted)">
            <span>Резервная копия в сейфе: <strong>${esc(latestBackupForCard.characterName || latestBackupForCard.avatarFileName)}</strong></span>
            <button type="button" class="nmf-chip" data-act="download-card-backup" data-bid="${esc(latestBackupForCard.id)}">${NMF_ICONS.download} Скачать бэкап PNG</button>
        </div>` : ''}
    </div>`;
}

function renderLoadingOverlay() {
    if (!state.busy || state.busyMinimized) return '';
    return `
    <div class="nmf-loading-overlay">
        <div class="nmf-radar-box">
            <div class="nmf-radar-ring"></div>
            <div class="nmf-radar-ring"></div>
            ${NMF_ICONS.heart}
        </div>
        <div class="nmf-loading-task">${esc(state.busyTaskLabel || 'Подбираем идеальное совпадение')}</div>
        <div class="nmf-loading-quip" id="nmf-live-quip">«${esc(state.busyQuip)}»</div>
        <div class="nmf-loading-timer" id="nmf-live-timer">Прошло: ${state.busyElapsedSec} сек.</div>
        <div class="nmf-btn-row" style="justify-content:center;margin-top:8px">
            <button type="button" class="nmf-btn-primary" data-act="minimize-busy">
                Свернуть в фон
            </button>
            ${state.busyCancellable ? `
            <button type="button" class="nmf-btn-secondary nmf-btn-danger" data-act="cancel-busy" ${state.busyCancelRequested ? 'disabled' : ''}>
                ${state.busyCancelRequested ? 'Отмена...' : 'Отменить задачу'}
            </button>` : `
            <span class="nmf-chip" style="opacity:0.85">Запись файла (не прерывать)</span>`}
        </div>
    </div>`;
}

function renderBackgroundBusyStrip() {
    if (!state.busy || !state.busyMinimized) return '';
    return `
    <div style="padding:6px 12px;background:rgba(29,233,182,0.10);border-bottom:1px solid var(--nmf-accent);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;font-size:11.5px">
            <div class="nmf-photo-spinner" style="width:14px;height:14px;border-width:2px"></div>
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                <strong>В фоне:</strong> ${esc(state.busyTaskLabel)} (<span id="nmf-mini-timer">${state.busyElapsedSec}</span> с)
            </span>
        </div>
        <div class="nmf-btn-row" style="flex-shrink:0">
            <button type="button" class="nmf-chip" data-act="expand-busy">Развернуть</button>
            ${state.busyCancellable
                ? `<button type="button" class="nmf-chip nmf-ban" data-act="cancel-busy" ${state.busyCancelRequested ? 'disabled' : ''}>Стоп</button>`
                : `<span class="nmf-chip">Запись</span>`}
        </div>
    </div>`;
}

export function renderWindow() {
    if (typeof document === 'undefined') return;
    const win = document.getElementById('nmf-window');
    if (!win) return;
    const prevBody = win.querySelector('.nmf-body');
    const prevScrollTop = prevBody ? prevBody.scrollTop : 0;
    const prevTab = win.dataset.renderedTab || '';

    const cfg = getSettings();
    const sess = getActiveSession();
    const activeTheme = NMF_THEMES.find((t) => t.id === cfg.theme) || NMF_THEMES[1];
    const buckets = listImageExtensionBuckets();
    const enabledBuckets = buckets.filter((b) => b.enabled);
    const activeBucket = (cfg.imageSource && cfg.imageSource !== 'auto' && cfg.imageSource !== 'iig' && cfg.imageSource !== 'st_sd' && cfg.imageSource !== 'off')
        ? buckets.find((b) => b.key === cfg.imageSource)
        : (enabledBuckets.find((b) => b.ready) || enabledBuckets[0] || null);
    const autoSummary = resolveAutoImageSourceSummary(cfg.imageSource, cfg.imageProfileId);

    win.className = `nmf-theme-${activeTheme.id}`;
    win.dataset.renderedTab = state.activeTab;

    const ratioCss = cfg.imageAspectRatio === 'native' ? '1 / 1' : (cfg.imageAspectRatio || '1:1').replace(':', ' / ');
    const fitCss = (cfg.imageCropFocus === 'contain' || cfg.imageAspectRatio === 'native') ? 'contain' : 'cover';
    const posCss = cfg.imageCropFocus === 'top' ? 'center 18%' : 'center center';
    win.style.setProperty('--nmf-art-ratio', ratioCss);
    win.style.setProperty('--nmf-art-fit', fitCss);
    win.style.setProperty('--nmf-art-pos', posCss);

    const screenHtml = {
        swipe: renderSwipeTab,
        matches: renderMatchesTab,
        blitz: renderBlitzTab,
        create: renderCreateTab,
        editor: renderEditorTab,
    }[state.activeTab]?.(sess) || renderSwipeTab(sess);

    const likedCount = (sess.tinder?.liked || []).length;
    const aspectMismatch = cfg.imageAspectRatio !== 'native' && activeBucket && activeBucket.extAspectRatio && activeBucket.extAspectRatio !== cfg.imageAspectRatio;

    win.innerHTML = `
        <div class="nmf-header">
            <div class="nmf-header-left">
                <div class="nmf-crest">${NMF_ICONS.crest}</div>
                <div class="nmf-title-wrap">
                    <div class="nmf-title-main">NEXUSMATCH</div>
                    <div class="nmf-title-sub">${esc(activeTheme.name)}</div>
                </div>
            </div>
            <div class="nmf-header-actions">
                ${lastGenerationReasoning ? `
                <button type="button" class="nmf-icon-btn ${state.thoughtsDrawerOpen ? 'nmf-active' : ''}" data-act="toggle-thoughts" title="Показать думалку (мысли модели)">
                    Мысли
                </button>` : ''}
                <button type="button" class="nmf-icon-btn nmf-intake-trigger" data-act="open-intake-sheet" title="Анкета предпочтений">
                    ${NMF_ICONS.sliders} Анкета
                </button>
                <button type="button" class="nmf-icon-btn nmf-sq ${state.themeDrawerOpen ? 'nmf-active' : ''}" data-act="toggle-themes" title="Темы оформления">${NMF_ICONS.palette}</button>
                <button type="button" class="nmf-icon-btn nmf-sq ${state.settingsDrawerOpen ? 'nmf-active' : ''}" data-act="toggle-settings" title="Настройки отправки и обрезки фото">${NMF_ICONS.gear}</button>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="close-modal" title="Закрыть">${NMF_ICONS.close}</button>
            </div>
        </div>

        ${(lastGenerationReasoning && state.thoughtsDrawerOpen) ? `
        <div class="nmf-drawer nmf-open" style="max-height:210px;overflow-y:auto">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
                <span class="nmf-label" style="color:var(--nmf-accent)">Думалка модели (Reasoning / Thoughts)</span>
                <button type="button" class="nmf-chip" data-act="toggle-thoughts">Скрыть</button>
            </div>
            <div style="font-family:var(--nmf-font-mono);font-size:11.5px;line-height:1.48;white-space:pre-wrap;color:var(--nmf-text-muted);padding:8px;background:var(--nmf-bg);border:1px solid var(--nmf-border)">${esc(lastGenerationReasoning)}</div>
        </div>` : ''}

        <div class="nmf-drawer ${state.themeDrawerOpen ? 'nmf-open' : ''}">
            <div class="nmf-theme-strip">
                ${NMF_THEMES.map((t) => `
                    <button type="button" class="nmf-theme-chip ${cfg.theme === t.id ? 'nmf-active' : ''}" data-act="pick-theme" data-theme="${t.id}">
                        <span class="nmf-theme-swatch" style="background:${t.color}"></span>
                        <span>${esc(t.name)}</span>
                    </button>
                `).join('')}
            </div>
        </div>

        <div class="nmf-drawer ${state.settingsDrawerOpen ? 'nmf-open' : ''}">
            <div class="nmf-grid-2">
                <div class="nmf-field">
                    <label class="nmf-label">Способ отправки к ИИ</label>
                    <select class="nmf-select" data-cfg="transportMode">
                        <option value="prefill_user_msg" ${cfg.transportMode === 'prefill_user_msg' ? 'selected' : ''}>Полный активный пресет (Prefill)</option>
                        <option value="json_schema" ${cfg.transportMode === 'json_schema' ? 'selected' : ''}>Строгая JSON-схема (Core JSON Schema)</option>
                    </select>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Расширение генерации артов</label>
                    <select class="nmf-select" data-cfg="imageSource">
                        <option value="auto" ${(cfg.imageSource === 'auto' || cfg.imageSource === 'iig') ? 'selected' : ''}>Авто (${esc(autoSummary.label)})</option>
                        ${buckets.map((b) => `<option value="${esc(b.key)}" ${cfg.imageSource === b.key ? 'selected' : ''} ${!b.enabled ? 'disabled' : ''}>${esc(b.key)} — ${esc(!b.enabled ? 'отключено в ST' : (b.ready ? (b.model || b.apiType) : 'не готов'))}</option>`).join('')}
                        <option value="st_sd" ${cfg.imageSource === 'st_sd' ? 'selected' : ''}>Штатный /sd Таверны</option>
                        <option value="off" ${cfg.imageSource === 'off' ? 'selected' : ''}>Выключено</option>
                    </select>
                </div>
            </div>

            ${cfg.transportMode === 'prefill_user_msg' ? `
            <div class="nmf-warn-box" style="margin-top:8px;font-size:11px">
                ${NMF_ICONS.warn}
                <span><strong>Внимание:</strong> для Chat Completion отправляется активный пресет целиком, для Text Completion — штатный Context/Instruct шаблон ST. Если ролевые блоки пресета сбивают структуру, скорректируйте Промпт коррекции ниже или включите «Строгую JSON-схему».</span>
            </div>
            <div class="nmf-field" style="margin-top:7px">
                <label class="nmf-label">
                    <span>Промпт коррекции (поверх полного пресета)</span>
                    <button type="button" class="nmf-chip" data-act="reset-correction-prompt">По умолчанию</button>
                </label>
                <textarea class="nmf-textarea" style="min-height:54px;font-size:11px" data-cfg-live="presetCorrectionPrompt" placeholder="Инструкция для подавления ролевых трекеров пресета на время сборки карточки...">${esc(cfg.presetCorrectionPrompt ?? '')}</textarea>
            </div>` : ''}

            ${cfg.imageSource !== 'off' ? `
            <div class="nmf-grid-2" style="margin-top:8px">
                <div class="nmf-field">
                    <label class="nmf-label">Формат артов (по умолчанию 1:1)</label>
                    <select class="nmf-select" data-cfg="imageAspectRatio">
                        ${IMAGE_ASPECT_OPTIONS.map((a) => `<option value="${a.id}" ${cfg.imageAspectRatio === a.id ? 'selected' : ''}>${esc(a.label)}</option>`).join('')}
                    </select>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Обрезка / Кадрирование PNG</label>
                    <select class="nmf-select" data-cfg="imageCropFocus">
                        ${IMAGE_CROP_OPTIONS.map((c) => `<option value="${c.id}" ${cfg.imageCropFocus === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}
                    </select>
                </div>
            </div>` : ''}

            ${(activeBucket && activeBucket.enabled && cfg.imageSource !== 'st_sd' && cfg.imageSource !== 'off') ? `
            <div class="nmf-grid-2" style="margin-top:8px">
                <div class="nmf-field">
                    <label class="nmf-label">Профиль (${esc(activeBucket.key)})</label>
                    <select class="nmf-select" data-cfg="imageProfileId">
                        <option value="">Активный профиль (${esc(activeBucket.activeProfileName)})</option>
                        ${activeBucket.profiles.map((p) => `<option value="${esc(p.id)}" ${cfg.imageProfileId === p.id ? 'selected' : ''}>${esc(p.name)}${p.ready ? '' : ' [не заполнен]'}</option>`).join('')}
                    </select>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">Стиль рисовки</label>
                    <select class="nmf-select" data-cfg="imageStyleId">
                        <option value="" ${!cfg.imageStyleId ? 'selected' : ''}>Активный стиль</option>
                        <option value="__none__" ${cfg.imageStyleId === '__none__' ? 'selected' : ''}>Без стиля</option>
                        ${activeBucket.styles.map((s) => `<option value="${esc(s.id)}" ${cfg.imageStyleId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            ${autoSummary.ready === false && autoSummary.reason ? `
            <div class="nmf-warn-box" style="margin-top:8px;border-color:#ff5c77;font-size:11px">
                ${NMF_ICONS.warn}
                <span>Профиль не готов: ${esc(autoSummary.reason)}</span>
            </div>` : ''}
            <div class="nmf-warn-box" style="margin-top:8px;font-size:11px">
                ${NMF_ICONS.warn}
                <span>Поддерживаются изолированные профили SillyImages (OpenAI, xAI, Gemini, OpenRouter, Electron Hub, Naistera, NovelAI, A1111). Чат-библиотеки референсов ({{char}} / {{user}} / Lorebook refs) относятся к внутреннему пайплайну чата SillyImages и при создании новых карточек не передаются.${aspectMismatch ? ` Текущий формат в ${esc(activeBucket.key)}: ${esc(activeBucket.extAspectRatio)}.` : ''}</span>
            </div>` : ''}
        </div>

        <div class="nmf-sessions-bar">
            <button type="button" class="nmf-sess-tab" data-act="new-session">${NMF_ICONS.plus} Новая</button>
            ${cfg.sessions.map((s) => `
                <button type="button" class="nmf-sess-tab ${s.id === sess.id ? 'nmf-active' : ''} ${s.frozen ? 'nmf-frozen' : ''}" data-act="switch-session" data-sid="${s.id}">
                    <span>${esc(s.title)}</span>
                    ${s.frozen ? `<span class="nmf-sess-state">ПАУЗА</span>` : ''}
                </button>
            `).join('')}
            <button type="button" class="nmf-sess-tab" data-act="toggle-freeze">${sess.frozen ? NMF_ICONS.play : NMF_ICONS.pause}</button>
            <button type="button" class="nmf-sess-tab" data-act="rename-session">Имя</button>
            ${cfg.sessions.length > 1 ? `<button type="button" class="nmf-sess-tab" data-act="delete-session">${NMF_ICONS.trash}</button>` : ''}
        </div>

        ${renderBackgroundBusyStrip()}

        <div class="nmf-body">
            ${screenHtml}
        </div>

        <div class="nmf-bottom-nav">
            <button type="button" class="nmf-nav-item ${state.activeTab === 'swipe' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="swipe">
                ${NMF_ICONS.flame}<span>Свайпы</span>
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'matches' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="matches">
                ${NMF_ICONS.matches}<span>Мэтчи</span>
                ${likedCount > 0 ? `<span class="nmf-nav-badge">${likedCount}</span>` : ''}
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'blitz' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="blitz">
                ${NMF_ICONS.blitz}<span>Блиц 10</span>
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'create' ? 'nmf-active' : ''}" data-act="create-submode-nav" data-tab="create">
                ${NMF_ICONS.architect}<span>Создать</span>
            </button>
            <button type="button" class="nmf-nav-item ${state.activeTab === 'editor' ? 'nmf-active' : ''}" data-act="switch-tab" data-tab="editor">
                ${NMF_ICONS.editor}<span>Профиль</span>
            </button>
        </div>

        ${renderIntakeSheetModal(sess)}
        ${renderCandidateEditModal(sess)}
        ${renderOverwriteConfirmModal()}
        ${renderLoadingOverlay()}
    `;

    if (prevTab === state.activeTab && prevScrollTop > 0) {
        const nextBody = win.querySelector('.nmf-body');
        if (nextBody) nextBody.scrollTop = prevScrollTop;
    }

    attachSwipeCardGestures(win);
    maybeAutoTriggerCurrentCardArt();
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

function syncCandArtStatusDom(candId) {
    if (typeof document === 'undefined' || typeof CSS === 'undefined') return;
    const st = state.artStatuses.get(candId);
    if (!st) return;
    const stageEl = document.querySelector(`[data-art-stage="${CSS.escape(candId)}"]`);
    const timerEl = document.querySelector(`[data-art-timer="${CSS.escape(candId)}"]`);
    const detailEl = document.querySelector(`[data-art-detail="${CSS.escape(candId)}"]`);
    const provEl = document.querySelector(`[data-art-prov="${CSS.escape(candId)}"]`);
    if (stageEl) stageEl.textContent = st.stage;
    if (timerEl) timerEl.textContent = `${st.elapsedSec}с`;
    if (detailEl) detailEl.textContent = st.detail;
    if (provEl && st.providerLabel) provEl.textContent = `Движок: ${st.providerLabel}`;
}

function syncEditorArtStatusDom() {
    if (typeof document === 'undefined') return;
    const st = state.editorArtStatus;
    if (!st) return;
    const badgeEl = document.getElementById('nmf-editor-art-badge');
    const stageEl = document.getElementById('nmf-editor-art-stage');
    const timerEl = document.getElementById('nmf-editor-art-timer');
    const detailEl = document.getElementById('nmf-editor-art-detail');
    if (badgeEl) badgeEl.textContent = `${st.attempt || 1}/${st.maxAttempts || 3} · ${st.elapsedSec}с`;
    if (stageEl) stageEl.textContent = st.stage;
    if (timerEl) timerEl.textContent = `${st.elapsedSec}с`;
    if (detailEl) detailEl.textContent = st.detail;
}

async function triggerCandidateArtInBackground(cand, isManual = false) {
    if (!cand || state.loadingArtIds.has(cand.id)) return;
    const cfg = getSettings();
    const prompt = cand.imagePrompt || `${cand.name}, ${cand.appearance || cand.archetype || 'portrait'}`;
    const ctl = new AbortController();

    const statusObj = {
        stage: 'Подготовка генерации',
        detail: 'Инициализация запроса...',
        attempt: 1,
        maxAttempts: 3,
        providerLabel: '',
        elapsedSec: 0,
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
    state.artStatuses.set(cand.id, statusObj);
    state.loadingArtIds.add(cand.id);
    state.artAborts.set(cand.id, ctl);
    renderWindow();

    try {
        const dataUrl = await generateCharacterPortrait(prompt, {
            imageSource: cfg.imageSource,
            imageProfileId: cfg.imageProfileId,
            imageStyleId: cfg.imageStyleId,
            aspectRatio: cfg.imageAspectRatio || '1:1',
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
        cand.avatarId = await saveMediaDataUrl(dataUrl, cand.avatarId || '');
        cand.avatarDataUrl = '';
        state.artErrors.delete(cand.id);
        saveSettings();
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
        pruneOrphanedMedia(cfg.sessions).catch(() => {});
    }
    renderWindow();
}

function saveEditedCandidateFields(sess) {
    const ref = state.editingCandRef;
    if (!ref) return null;
    const list = sess.tinder?.[ref.pool];
    const cand = Array.isArray(list) ? list[ref.idx] : null;
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

function applyGeneratedToSessionCard(sess, parsed, extra = {}) {
    const isLinkedTavernCard = Boolean(extra.sourceAvatarId && extra.sourceLoadedFromTavern);
    sess.card = {
        ...sess.card,
        name: parsed.name || sess.card.name || 'Новая Карточка',
        description: parsed.description || '',
        personality: parsed.personality || '',
        scenario: parsed.scenario || '',
        first_mes: parsed.first_mes || '',
        alternate_greetings: Array.isArray(parsed.alternate_greetings) ? parsed.alternate_greetings : [],
        mes_example: parsed.mes_example || '',
        system_prompt: parsed.system_prompt || (isLinkedTavernCard ? sess.card.system_prompt : '') || '',
        post_history_instructions: parsed.post_history_instructions || (isLinkedTavernCard ? sess.card.post_history_instructions : '') || '',
        creator_notes: parsed.creator_notes || '',
        tags: parsed.tags || '',
        imagePrompt: parsed.imagePrompt || '',
        avatarDataUrl: '',
        sourceAvatarId: '',
        sourceLoadedFromTavern: false,
        sourceSnapshotHash: '',
        originalCardData: null,
        avatarDirty: false,
        dirtyFields: [
            'name',
            'description',
            'personality',
            'scenario',
            'first_mes',
            'alternate_greetings',
            'mes_example',
            'system_prompt',
            'post_history_instructions',
            'creator_notes',
            'tags',
            'imagePrompt',
        ],
        ...extra,
    };
}

// Local-only cancellation handler — never invokes global chat generation stop (fixes NMF-005 & NMF-006)
export function requestCancelBusyTask() {
    if (!state.busy) return false;
    if (!state.busyCancellable) {
        notifyToast('Операция записи файла уже идёт и не может быть прервана для сохранности карточки.');
        return false;
    }
    if (state.busyCancelRequested) return true;
    state.busyCancelRequested = true;
    state.busyAbort?.abort(new Error('Cancelled locally by NMF user'));
    renderWindow();
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
        if (typeof document !== 'undefined') {
            const timerEl = document.getElementById('nmf-live-timer');
            if (timerEl) timerEl.textContent = `Прошло: ${state.busyElapsedSec} сек.`;
            const miniEl = document.getElementById('nmf-mini-timer');
            if (miniEl) miniEl.textContent = String(state.busyElapsedSec);
        }

        if (state.busyElapsedSec % 3 === 0) {
            quipIdx = (quipIdx + 1) % quipPool.length;
            state.busyQuip = quipPool[quipIdx];
            if (typeof document !== 'undefined') {
                const quipEl = document.getElementById('nmf-live-quip');
                if (quipEl) quipEl.textContent = `«${state.busyQuip}»`;
            }
        }
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
                aspectRatio: cfg.imageAspectRatio || '1:1',
                cropFocus: cfg.imageCropFocus || 'top',
                allowExternalChangeOverride: allowExternalOverride,
            });
            state.overwriteConfirmInfo = null;
            saveSettings();
            await Promise.all([refreshRosterData(), refreshBackupsList()]);
            if (result.noop) {
                notifyToast('Нет изменённых полей для записи.');
            } else if (globalThis.window?.toastr?.success) {
                window.toastr.success(`Карточка «${sess.card.name}» обновлена (бэкап сохранён)!`, 'NexusMatch');
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
            throw err;
        }
    }, { taskType: 'save', cancellable: false });
}

function bindWindowDelegation(win) {
    win.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target?.id === 'nmf-manual-ban-input') {
            e.preventDefault();
            win.querySelector('[data-act="add-manual-ban"]')?.click();
        }
    });

    win.addEventListener('input', (e) => {
        const el = e.target;
        const sess = getActiveSession();
        if (!el || !sess) return;

        if (el.id === 'nmf-manual-ban-input') {
            state.manualBanDraft = el.value;
            return;
        }
        if (el.dataset.cfgLive) {
            const cfg = getSettings();
            cfg[el.dataset.cfgLive] = el.value;
            saveSettings();
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
                } else if (['world_sandbox', 'rpg_gm_engine'].includes(sess.intake.cardFormat)) {
                    sess.intake.cardFormat = 'dossier_19';
                }
            }
            saveSettings();
            return;
        }
        if (el.dataset.tinder) {
            const k = el.dataset.tinder;
            sess.tinder[k] = el.type === 'number' ? Number(el.value) : el.value;
            saveSettings();
            return;
        }
        if (el.dataset.blitz) {
            sess.blitz[el.dataset.blitz] = el.value;
            saveSettings();
            return;
        }
        if (el.dataset.blitzAns !== undefined) {
            const q = sess.blitz.questions[Number(el.dataset.blitzAns)];
            if (q) {
                q.answer = el.value;
                saveSettings();
            }
            return;
        }
        if (el.dataset.arch) {
            sess.architect[el.dataset.arch] = el.value;
            saveSettings();
            return;
        }
        if (el.dataset.rework) {
            sess.rework[el.dataset.rework] = el.value;
            saveSettings();
            return;
        }
        if (el.dataset.card) {
            const field = el.dataset.card;
            sess.card[field] = el.value;
            markCardFieldDirty(sess.card, field);
            saveSettings();
            return;
        }
        if (el.dataset.altIdx !== undefined) {
            const idx = Number(el.dataset.altIdx);
            if (Array.isArray(sess.card.alternate_greetings)) {
                sess.card.alternate_greetings[idx] = el.value;
                markCardFieldDirty(sess.card, 'alternate_greetings');
                saveSettings();
            }
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
            if (sess.intake[k] !== nextVal) {
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
                if (['originType', 'cardFormat', 'rating', 'wordBudgetId', 'greetingBudgetId', 'userGender', 'targetGender', 'language'].includes(k)) {
                    renderWindow();
                }
            }
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
        if (el.id === 'nmf-avatar-upload' && el.files?.[0] && sess) {
            try {
                const compressed = await compressImageFileToDataUrl(el.files[0], 896);
                sess.card.avatarId = await saveMediaDataUrl(compressed, sess.card.avatarId || '');
                sess.card.avatarDataUrl = '';
                sess.card.avatarDirty = true;
                saveSettings();
                notifyToast('Изображение прикреплено.');
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
                sess.card = createCardStateFromImportedJson(obj);
                await pruneOrphanedMedia(cfg.sessions);
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

        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const cfg = getSettings();
        const sess = getActiveSession();

        if (act === 'close-modal') return closeForgeDialog();
        if (act === 'minimize-busy') {
            state.busyMinimized = true;
            return renderWindow();
        }
        if (act === 'expand-busy') {
            state.busyMinimized = false;
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
        if (act === 'intake-step') {
            state.intakeStep = btn.dataset.step;
            return renderWindow();
        }
        if (act === 'matches-sub') {
            state.matchesSubTab = btn.dataset.sub;
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
            }
            return renderWindow();
        }
        if (act === 'toggle-themes') {
            state.themeDrawerOpen = !state.themeDrawerOpen;
            if (state.themeDrawerOpen) {
                state.settingsDrawerOpen = false;
                state.thoughtsDrawerOpen = false;
            }
            return renderWindow();
        }
        if (act === 'toggle-settings') {
            state.settingsDrawerOpen = !state.settingsDrawerOpen;
            if (state.settingsDrawerOpen) {
                state.themeDrawerOpen = false;
                state.thoughtsDrawerOpen = false;
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
            const ns = createDefaultSession(cfg.sessions.length + 1);
            cfg.sessions.push(ns);
            cfg.activeSessionId = ns.id;
            saveSettings();
            return renderWindow();
        }
        if (act === 'switch-session') {
            cfg.activeSessionId = btn.dataset.sid;
            saveSettings();
            await hydrateSessionsMedia(cfg.sessions);
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
            if (!window.confirm(`Удалить «${sess.title}»?`)) return;
            cfg.sessions = cfg.sessions.filter((s) => s.id !== sess.id);
            cfg.activeSessionId = cfg.sessions[0].id;
            await pruneOrphanedMedia(cfg.sessions);
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
            await withBusy('Подбираем анкеты для вашей ленты', async (signal) => {
                const rawBatch = Number(sess.tinder.batchSize) || 1;
                const count = [1, 3, 5].includes(rawBatch) ? rawBatch : 1;
                const req = buildTinderPreviewRequest(sess, count, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    signal,
                });
                const cands = parseTinderPreviewResponse(raw, sess.intake.playerNameMode || 'macro');
                if (!cands.length) throw new Error('Модель вернула пустую ленту. Попробуйте ещё раз.');
                sess.tinder.queue.push(...cands);
                sess.tinder.lastDislikedCandidate = null;
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }
        if (act === 'gen-cand-art') {
            const cur = sess.tinder.queue[0];
            if (cur) triggerCandidateArtInBackground(cur, true);
            return;
        }
        if (act === 'stop-cand-art') {
            const cur = sess.tinder.queue[0];
            if (cur && state.artAborts.has(cur.id)) {
                state.artAborts.get(cur.id)?.abort();
            }
            return;
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
            await pruneOrphanedMedia(cfg.sessions);
            saveSettings();
            return renderWindow();
        }
        if (act === 'del-passed') {
            sess.tinder.passed.splice(Number(btn.dataset.idx), 1);
            await pruneOrphanedMedia(cfg.sessions);
            saveSettings();
            return renderWindow();
        }

        // BLITZ 10 ACTIONS
        if (act === 'gen-blitz-10') {
            await withBusy('Готовим 10 вопросов Блиц-теста', async (signal) => {
                const req = buildBlitzQuestionsRequest(sess, -1, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    signal,
                });
                const qs = parseBlitzQuestionsResponse(raw);
                if (!qs.length) throw new Error('Не удалось разобрать список вопросов.');
                sess.blitz.questions = qs.slice(0, 10);
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
            if (q) {
                q.answer = btn.dataset.opt;
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
            const answered = sess.blitz.questions
                .filter((q) => !q.skipped && String(q.answer || '').trim())
                .map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer.trim()}`)
                .join('\n\n');
            const brief = `Blitz Topic: ${sess.blitz.topic || 'Matchmaking'}\n\n${answered || 'Synthesize creatively from Topic & Intake.'}`;
            await withBusy('Собираем карточку по вашим ответам', async (signal) => {
                const req = buildFullCardRequest(sess, brief, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    signal,
                });
                const parsed = parseFullCardResponse(raw, cfg.transportMode, sess.intake.playerNameMode || 'macro');
                applyGeneratedToSessionCard(sess, parsed, {
                    avatarId: '',
                    sourceAvatarId: '',
                    sourceLoadedFromTavern: false,
                });
                await pruneOrphanedMedia(cfg.sessions);
                state.activeTab = 'editor';
                state.editorSubTab = 'main';
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }

        // CREATE / AU REWORK ACTIONS (with FULL unshallowed character loading — fixes NMF-002!)
        if (act === 'build-from-architect') {
            await withBusy('Собираем карточку по вашей задумке', async (signal) => {
                const req = buildFullCardRequest(sess, sess.architect.freeConcept, cfg.transportMode);
                const raw = await runLlmGeneration({
                    ...req,
                    transportMode: cfg.transportMode,
                    presetCorrectionPrompt: cfg.presetCorrectionPrompt,
                    signal,
                });
                const parsed = parseFullCardResponse(raw, cfg.transportMode, sess.intake.playerNameMode || 'macro');
                applyGeneratedToSessionCard(sess, parsed, {
                    avatarId: '',
                    sourceAvatarId: '',
                    sourceLoadedFromTavern: false,
                });
                await pruneOrphanedMedia(cfg.sessions);
                state.activeTab = 'editor';
                state.editorSubTab = 'main';
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
                        previewAvatarId = await saveMediaDataUrl(srcDataUrl, sess.card.avatarId || '');
                    } catch {
                        previewAvatarId = '';
                    }
                    sess.card = createCardStateFromTavernChar(fullChar, { avatarId: previewAvatarId });
                    await pruneOrphanedMedia(cfg.sessions);
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
                    previewAvatarId = await saveMediaDataUrl(srcDataUrl, sess.card.avatarId || '');
                } catch {
                    previewAvatarId = sess.card.avatarId || '';
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
                    signal,
                });
                const parsed = parseFullCardResponse(raw, cfg.transportMode, sess.intake.playerNameMode || 'macro');
                applyGeneratedToSessionCard(sess, parsed, {
                    avatarId: previewAvatarId,
                    avatarDirty: false,
                    sourceAvatarId: chosenAvatar,
                    sourceLoadedFromTavern: true,
                    sourceSnapshotHash: snapshotHash,
                    originalCardData: structuredClone(rawCardObject),
                    world: baseState.world,
                    creator: baseState.creator,
                    character_version: baseState.character_version,
                });
                await pruneOrphanedMedia(cfg.sessions);
                state.activeTab = 'editor';
                state.editorSubTab = 'main';
                saveSettings();
            }, { taskType: 'llm', cancellable: true });
            return;
        }

        // PROFILE EDITOR ACTIONS
        if (act === 'clear-avatar') {
            sess.card.avatarId = '';
            sess.card.avatarDataUrl = '';
            sess.card.avatarDirty = true;
            state.editorArtError = '';
            await pruneOrphanedMedia(cfg.sessions);
            saveSettings();
            return renderWindow();
        }
        if (act === 'stop-editor-art') {
            state.editorArtAbort?.abort();
            return;
        }
        if (act === 'gen-editor-art') {
            if (state.editorArtLoading) return;
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
            state.editorArtStatus = edStatus;
            state.editorArtLoading = true;
            state.editorArtAbort = ctl;
            renderWindow();
            try {
                const p = sess.card.imagePrompt || `${sess.card.name}, detailed artwork`;
                const dataUrl = await generateCharacterPortrait(p, {
                    imageSource: cfg.imageSource,
                    imageProfileId: cfg.imageProfileId,
                    imageStyleId: cfg.imageStyleId,
                    aspectRatio: cfg.imageAspectRatio || '1:1',
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
                sess.card.avatarId = await saveMediaDataUrl(dataUrl, sess.card.avatarId || '');
                sess.card.avatarDataUrl = '';
                sess.card.avatarDirty = true;
                markCardFieldDirty(sess.card, 'imagePrompt');
                state.editorArtError = '';
                saveSettings();
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
                    aspectRatio: cfg.imageAspectRatio || '1:1',
                    cropFocus: cfg.imageCropFocus || 'top',
                }, avatarUrl);
                const slug = (sess.card.name || 'Character').trim().replace(/[\\/:*?"<>|]+/g, '_');
                triggerDownload(blob, `${slug}.png`);
            } catch (err) {
                notifyToast('Ошибка PNG: ' + err.message, true);
            }
            return;
        }
        if (act === 'export-json') {
            const v2 = buildV2CardObject(sess.card);
            const slug = ((v2.data?.name || v2.name || 'Character')).replace(/[\\/:*?"<>|]+/g, '_');
            triggerDownload(new Blob([JSON.stringify(v2, null, 2)], { type: 'application/json' }), `${slug}.json`);
            return;
        }
        if (act === 'save-to-tavern-new') {
            await withBusy('Сохраняем новую карточку в SillyTavern', async () => {
                const avatarUrl = resolveEntityAvatarUrl(sess.card);
                await importCardIntoTavern(sess.card, {
                    avatarDataUrl: avatarUrl,
                    accentHex: getThemeColor(),
                    aspectRatio: cfg.imageAspectRatio || '1:1',
                    cropFocus: cfg.imageCropFocus || 'top',
                });
                await refreshRosterData();
                if (globalThis.window?.toastr?.success) {
                    window.toastr.success(`«${sess.card.name}» добавлена как новая карточка в Таверну!`, 'NexusMatch');
                }
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

async function expandCandidateIntoFullCard(sess, cand, transportMode) {
    const cfg = getSettings();
    const brief = [
        `Expand this approved Swipe Preview into a complete SillyTavern V2 Card:`,
        `Name / Title: ${cand.name}`,
        `Archetype / Concept: ${cand.archetype || ''}`,
        `Pitch / Premise: ${cand.pitch || ''}`,
        `Visuals / Atmosphere: ${cand.appearance || ''}`,
        `Quote / Epigraph: "${cand.quote || ''}"`,
        `Tags: ${(cand.tags || []).join(', ')}`,
    ].join('\n');

    await withBusy(`Собираем полную карточку «${cand.name}»`, async (signal) => {
        const req = buildFullCardRequest(sess, brief, transportMode);
        const raw = await runLlmGeneration({
            ...req,
            transportMode,
            presetCorrectionPrompt: cfg.presetCorrectionPrompt,
            signal,
        });
        const parsed = parseFullCardResponse(raw, transportMode, sess.intake.playerNameMode || 'macro');
        const candMediaUrl = resolveEntityAvatarUrl(cand);
        const newCardAvatarId = candMediaUrl ? await saveMediaDataUrl(candMediaUrl) : '';
        applyGeneratedToSessionCard(sess, parsed, {
            avatarId: newCardAvatarId,
            avatarDirty: Boolean(newCardAvatarId),
            imagePrompt: parsed.imagePrompt || cand.imagePrompt || '',
            sourceAvatarId: '',
            sourceLoadedFromTavern: false,
        });
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
    const cfg = getSettings();
    if (themeSel) themeSel.value = cfg.theme;
    if (modeSel) modeSel.value = cfg.transportMode;
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
                Студия свайпов, блиц-знакомств, создания персонажей, Миров и РПГ-карточек (V2).
            </div>
            <div id="nmf-ext-open-btn" class="menu_button interactable" style="width:100%;justify-content:center;gap:6px;margin-bottom:8px;">
                ${NMF_ICONS.rosterBtn} <span>Открыть NexusMatch Forge</span>
            </div>
            <label style="font-size:11.5px;display:block;margin-bottom:3px;">Тема оформления:</label>
            <select id="nmf-ext-theme" class="text_pole" style="margin-bottom:8px;">
                ${NMF_THEMES.map((t) => `<option value="${t.id}" ${cfg.theme === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
            </select>
            <label style="font-size:11.5px;display:block;margin-bottom:3px;">Режим отправки запросов к ИИ:</label>
            <select id="nmf-ext-transport" class="text_pole">
                <option value="prefill_user_msg" ${cfg.transportMode === 'prefill_user_msg' ? 'selected' : ''}>Полный активный пресет (Prefill)</option>
                <option value="json_schema" ${cfg.transportMode === 'json_schema' ? 'selected' : ''}>Строгая JSON-схема (Core JSON Schema)</option>
            </select>
            <div style="font-size:11px;opacity:0.78;margin-top:6px;line-height:1.38;">
                При отправке полного пресета ролевые блоки могут сбить формат карточки — при необходимости поправьте Промпт коррекции внутри настроек окна Форджа или переключитесь на JSON-схему.
            </div>
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
