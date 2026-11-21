import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    SETTINGS_SCHEMA_VERSION,
    FULL_CARD_JSON_SCHEMA,
    TINDER_PREVIEW_JSON_SCHEMA,
    BLITZ_QUESTIONS_JSON_SCHEMA,
    GACHA_CYCLE_LIMIT,
    createDefaultSession,
    normalizeAndMigrateSettings,
    resolveUserLanguageSpec,
    resolveCardLanguageSpec,
    sanitizeCardMetaPollution,
    parseGachaPlusTags,
    rollGachaCycleRarities,
    computeSacrificeResetGain,
    computeSacrificeWishGain,
    THEMED_SACRIFICE_WARNINGS,
    getThemedSacrificeWarning,
    createDefaultGachaWallet,
    syncGachaWalletState,
    spendGachaWalletWishes,
    collectSessionKnownCharacterNames,
    buildFlexibleAvatarArtMechanismRule,
    buildVisualPromptRefinementRequest,
    parseVisualPromptRefinementResponse,
    buildCardTranslationRequest,
    parseCardTranslationResponse,
    buildGachaSummonRequest,
    parseGachaSummonResponse,
    buildGachaFusionRequest,
    parseGachaFusionResponse,
    buildCleanBriefFromEntity,
    listBlitzSelectableCandidates,
    resolveBlitzSeedCandidate,
    extractJsonLoose,
    buildFullCardRequest,
    parseFullCardResponse,
    buildTinderPreviewRequest,
    parseTinderPreviewResponse,
    buildBlitzQuestionsRequest,
    parseBlitzQuestionsResponse,
    buildAuReworkQuestionsRequest,
    buildReworkCardRequest,
} from '../modules/nmf_templates_and_prompts.js';

import {
    setTestTavernContext,
    markCardFieldDirty,
    createCardStateFromTavernChar,
    createCardStateFromImportedJson,
    createCardStateFromGeneratedDraft,
    applyReworkResultToTavernBase,
    computeCardDiff,
    buildSurgicalMergePayload,
    buildV2CardObject,
    ensurePngBytes,
    embedCharaChunkIntoPng,
    extractCharaJsonFromPng,
    stripPngCharaChunkBytes,
    triggerDownload,
    dataUrlToPureBlob,
    importCardIntoTavern,
    fetchFullTavernCharacter,
    updateExistingCardInTavern,
    restoreCardFromBackupVault,
    verifyPostSaveIntegrity,
    resolveIsolatedImageConfig,
    validateResolvedImageConfig,
    listImageExtensionBuckets,
    listSillyImagesReferenceCatalog,
    matchSillyImagesReferencesByText,
    computeLosslessCropGeometry,
    generateCharacterPortrait,
    stripActiveChatMacrosFromPresetBlock,
    buildPresetAlignedMessages,
    runLlmGeneration,
    detectPocketCodex,
} from '../modules/nmf_card_io_and_art.js';

import {
    saveMediaDataUrl,
    assignEntityMediaWithFallback,
    enforceEmergencyInlineBudget,
    MAX_EMERGENCY_INLINE_ITEMS,
    isMediaDurablyPersisted,
    resolveEntityAvatarUrl,
    resolveEntityDisplayUrl,
    hydrateSessionsMedia,
    migrateInlineSessionMediaToVault,
    pruneOrphanedMedia,
    listCardBackups,
    clearMemoryVaultForTests,
} from '../modules/nmf_media_vault.js';

import {
    state,
    esc,
    safeImgSrc,
    getSettings,
    saveSettings,
    buildProceduralCoverDataUrl,
    renderWindow,
    withBusy,
    requestCancelBusyTask,
} from '../nmf_entry.js';

// Spec-accurate async IndexedDB simulator supporting latency, open failures, QuotaExceededError & readback corruption
function createMockIndexedDb({
    latencyMs = 0,
    failOpen = false,
    quotaFailAfterWrites = Infinity,
    corruptReadback = false,
    backingMap = new Map(),
} = {}) {
    let writeCount = 0;

    const schedule = (fn) => {
        if (latencyMs > 0) setTimeout(fn, latencyMs);
        else queueMicrotask(fn);
    };

    return {
        backingMap,
        open(dbName) {
            const req = { result: null, error: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
            schedule(() => {
                if (failOpen) {
                    req.error = new Error('Mock IndexedDB open denied (Private Browsing)');
                    req.onerror?.();
                    return;
                }
                if (!backingMap.has(dbName)) {
                    backingMap.set(dbName, new Map());
                }
                const storesMap = backingMap.get(dbName);
                const db = {
                    objectStoreNames: {
                        contains: (name) => storesMap.has(name),
                    },
                    createObjectStore(name) {
                        if (!storesMap.has(name)) storesMap.set(name, new Map());
                        return { createIndex() {} };
                    },
                    close() {},
                    transaction(storeName) {
                        if (!storesMap.has(storeName)) storesMap.set(storeName, new Map());
                        const store = storesMap.get(storeName);
                        const tx = { error: null, oncomplete: null, onabort: null, onerror: null };
                        tx.objectStore = () => ({
                            put(record) {
                                const opReq = { result: null, error: null, onsuccess: null, onerror: null };
                                schedule(() => {
                                    writeCount += 1;
                                    if (writeCount > quotaFailAfterWrites) {
                                        const qErr = new Error('QuotaExceededError');
                                        qErr.name = 'QuotaExceededError';
                                        opReq.error = qErr;
                                        tx.error = qErr;
                                        opReq.onerror?.();
                                        tx.onabort?.();
                                        return;
                                    }
                                    store.set(String(record.id), structuredClone(record));
                                    opReq.result = record.id;
                                    opReq.onsuccess?.();
                                    tx.oncomplete?.();
                                });
                                return opReq;
                            },
                            get(id) {
                                const opReq = { result: null, error: null, onsuccess: null, onerror: null };
                                schedule(() => {
                                    const found = store.get(String(id)) || null;
                                    if (found && corruptReadback) {
                                        const broken = structuredClone(found);
                                        if (broken.pngBase64) broken.pngBase64 = 'CORRUPTED_PNG_BASE64';
                                        if (broken.dataUrl) broken.dataUrl = 'CORRUPTED_DATA_URL';
                                        opReq.result = broken;
                                    } else {
                                        opReq.result = found ? structuredClone(found) : null;
                                    }
                                    opReq.onsuccess?.();
                                    tx.oncomplete?.();
                                });
                                return opReq;
                            },
                            delete(id) {
                                const opReq = { result: true, error: null, onsuccess: null, onerror: null };
                                schedule(() => {
                                    store.delete(String(id));
                                    opReq.onsuccess?.();
                                    tx.oncomplete?.();
                                });
                                return opReq;
                            },
                            getAllKeys() {
                                const opReq = { result: [], error: null, onsuccess: null, onerror: null };
                                schedule(() => {
                                    opReq.result = [...store.keys()];
                                    opReq.onsuccess?.();
                                    tx.oncomplete?.();
                                });
                                return opReq;
                            },
                            getAll() {
                                const opReq = { result: [], error: null, onsuccess: null, onerror: null };
                                schedule(() => {
                                    opReq.result = [...store.values()].map((v) => structuredClone(v));
                                    opReq.onsuccess?.();
                                    tx.oncomplete?.();
                                });
                                return opReq;
                            },
                        });
                        return tx;
                    },
                };
                req.result = db;
                req.onupgradeneeded?.();
                req.onsuccess?.();
            });
            return req;
        },
    };
}

// Install healthy IndexedDB by default for standard tests
globalThis.indexedDB = createMockIndexedDb();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function processUnsetSentinelsLikeTavern(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    for (const k of Object.keys(obj)) {
        if (obj[k] === '__@@UNSET@@__') {
            delete obj[k];
        } else if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            processUnsetSentinelsLikeTavern(obj[k]);
        }
    }
    return obj;
}

function deepMergeLikeTavern(target, source) {
    const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    const out = Object.assign({}, target);
    if (isObj(target) && isObj(source)) {
        for (const k of Object.keys(source)) {
            if (isObj(source[k])) {
                out[k] = k in target ? deepMergeLikeTavern(target[k], source[k]) : structuredClone(source[k]);
            } else {
                out[k] = structuredClone(source[k]);
            }
        }
    }
    return out;
}

// Realistic SillyTavern 1.19.1 in-memory server simulator (reproducing unsetPrivateFields on /import & shallow /all!)
async function createMockTavernHarness({ lazyLoadCharacters = false } = {}) {
    const basePng = await ensurePngBytes('', 'Mock', '#1de9b6');
    const diskCards = new Map();
    const requestLog = [];

    const seedRichCard = (avatarFile = 'Seraphina.png') => {
        const cardJson = {
            name: 'Seraphina',
            description: 'Original rich description of Seraphina.',
            personality: 'Sharp, observant, loyal.',
            scenario: 'Old cathedral library at midnight.',
            first_mes: 'She turns a page without looking up.',
            mes_example: '<START>\n{{user}}: Hi\n{{char}}: Quiet.',
            creatorcomment: 'Original author note.',
            avatar: 'none',
            chat: 'Seraphina - 2026-10-11@19h30m00s',
            create_date: '2026-10-10@12h00m00s',
            talkativeness: 0.8,
            fav: true,
            tags: ['gothic', 'scholar'],
            custom_root_field: 'keep_root_value',
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                name: 'Seraphina',
                description: 'Original rich description of Seraphina.',
                personality: 'Sharp, observant, loyal.',
                scenario: 'Old cathedral library at midnight.',
                first_mes: 'She turns a page without looking up.',
                mes_example: '<START>\n{{user}}: Hi\n{{char}}: Quiet.',
                creator_notes: 'Original author note.',
                system_prompt: 'Original sys prompt.',
                post_history_instructions: 'Original PHI.',
                alternate_greetings: ['Alt scene 1', 'Alt scene 2'],
                tags: ['gothic', 'scholar'],
                creator: 'OriginalAuthor',
                character_version: '2.4',
                custom_v2_field: { nested: 777 },
                character_book: {
                    name: 'Embedded Grimoire',
                    entries: [{ id: 1, keys: ['rune'], content: 'Ancient rune lore.' }],
                },
                extensions: {
                    talkativeness: 0.8,
                    fav: true,
                    world: 'CathedralWorld',
                    depth_prompt: { prompt: 'Remember the silver key.', depth: 2, role: 'user' },
                    third_party_tracker: { affection: 45, flags: ['met_in_rain'] },
                },
            },
        };
        const pngWithChara = embedCharaChunkIntoPng(basePng, cardJson);
        diskCards.set(avatarFile, { pngBytes: pngWithChara, cardJson: structuredClone(cardJson) });
        return cardJson;
    };

    const fetchHandler = async (url, init = {}) => {
        const u = String(url);
        requestLog.push({ url: u, method: init.method || 'GET', headers: init.headers || {}, body: init.body });

        if (u.startsWith('/characters/')) {
            const name = decodeURIComponent(u.slice('/characters/'.length));
            const entry = diskCards.get(name);
            if (!entry) return new Response('Not found', { status: 404 });
            return new Response(entry.pngBytes, {
                status: 200,
                headers: { 'content-type': 'image/png', 'content-length': String(entry.pngBytes.byteLength) },
            });
        }

        if (u === '/api/settings/get') {
            return new Response(JSON.stringify({ world_names: ['CathedralWorld', 'CyberRealm'] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (u === '/api/characters/all') {
            const list = [...diskCards.entries()].map(([avatar, rec]) => {
                if (lazyLoadCharacters) {
                    // Exact SillyTavern shallow character representation (strips heavy text fields!)
                    return {
                        name: rec.cardJson.name,
                        avatar,
                        fav: rec.cardJson.fav,
                        chat: rec.cardJson.chat,
                        shallow: true,
                        data: {
                            name: rec.cardJson.data.name,
                            tags: rec.cardJson.data.tags,
                            extensions: { fav: rec.cardJson.fav },
                        },
                    };
                }
                return {
                    ...structuredClone(rec.cardJson),
                    avatar,
                    json_data: JSON.stringify(rec.cardJson),
                };
            });
            return new Response(JSON.stringify(list), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        if (u === '/api/characters/get') {
            const reqBody = JSON.parse(init.body || '{}');
            const rec = diskCards.get(reqBody.avatar_url);
            if (!rec) return new Response('Not found', { status: 404 });
            return new Response(JSON.stringify({
                ...structuredClone(rec.cardJson),
                avatar: reqBody.avatar_url,
                json_data: JSON.stringify(rec.cardJson),
            }), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        if (u === '/api/characters/import') {
            // Reproduces SillyTavern's destructive unsetPrivateFields() if ever misused for overwriting!
            const fd = init.body;
            const file = fd.get('avatar');
            const preserved = fd.get('preserved_name');
            const bytes = new Uint8Array(await file.arrayBuffer());
            const parsed = extractCharaJsonFromPng(bytes);
            parsed.fav = false;
            if (parsed.data?.extensions) parsed.data.extensions.fav = false;
            parsed.chat = `${parsed.name} - RESET_CHAT_TIMESTAMP`;
            parsed.create_date = 'RESET_CREATE_DATE';
            const outName = preserved ? `${preserved}.png` : file.name;
            diskCards.set(outName, { pngBytes: embedCharaChunkIntoPng(bytes, parsed), cardJson: parsed });
            return new Response(JSON.stringify({ file_name: outName.replace(/\.png$/i, '') }), { status: 200 });
        }

        if (u === '/api/characters/edit-avatar') {
            const fd = init.body;
            const avatarUrl = fd.get('avatar_url');
            const file = fd.get('avatar');
            const existing = diskCards.get(avatarUrl);
            if (!existing || !file) return new Response('Bad request', { status: 400 });
            const newImgBytes = new Uint8Array(await file.arrayBuffer());
            const mergedPng = embedCharaChunkIntoPng(newImgBytes, existing.cardJson);
            diskCards.set(avatarUrl, { pngBytes: mergedPng, cardJson: existing.cardJson });
            return new Response('OK', { status: 200 });
        }

        if (u === '/api/characters/merge-attributes') {
            const update = JSON.parse(init.body || '{}');
            const existing = diskCards.get(update.avatar);
            if (!existing) return new Response('Not found', { status: 400 });
            const cleanUpdate = structuredClone(update);
            delete cleanUpdate.json_data;
            const merged = processUnsetSentinelsLikeTavern(deepMergeLikeTavern(existing.cardJson, cleanUpdate));
            const mergedPng = embedCharaChunkIntoPng(existing.pngBytes, merged);
            diskCards.set(update.avatar, { pngBytes: mergedPng, cardJson: merged });
            return new Response('OK', { status: 200 });
        }

        if (u === '/api/characters/edit') {
            const fd = init.body;
            const avatarUrl = fd.get('avatar_url');
            const existing = diskCards.get(avatarUrl);
            if (!existing) return new Response('Not found', { status: 400 });
            const baseJson = fd.get('json_data') ? JSON.parse(fd.get('json_data')) : structuredClone(existing.cardJson);
            delete baseJson.json_data;
            if (!baseJson.data) baseJson.data = {};
            if (!baseJson.data.extensions) baseJson.data.extensions = {};

            baseJson.name = String(fd.get('ch_name') ?? baseJson.name ?? '');
            baseJson.data.name = baseJson.name;
            baseJson.description = String(fd.get('description') ?? baseJson.description ?? '');
            baseJson.data.description = baseJson.description;
            baseJson.personality = String(fd.get('personality') ?? baseJson.personality ?? '');
            baseJson.data.personality = baseJson.personality;
            baseJson.scenario = String(fd.get('scenario') ?? baseJson.scenario ?? '');
            baseJson.data.scenario = baseJson.scenario;
            baseJson.first_mes = String(fd.get('first_mes') ?? baseJson.first_mes ?? '');
            baseJson.data.first_mes = baseJson.first_mes;
            baseJson.mes_example = String(fd.get('mes_example') ?? baseJson.mes_example ?? '');
            baseJson.data.mes_example = baseJson.mes_example;
            baseJson.creatorcomment = String(fd.get('creator_notes') ?? baseJson.creatorcomment ?? '');
            baseJson.data.creator_notes = baseJson.creatorcomment;
            baseJson.data.system_prompt = String(fd.get('system_prompt') ?? baseJson.data.system_prompt ?? '');
            baseJson.data.post_history_instructions = String(fd.get('post_history_instructions') ?? baseJson.data.post_history_instructions ?? '');
            baseJson.fav = fd.get('fav') === 'true';
            baseJson.data.extensions.fav = baseJson.fav;
            if (fd.get('talkativeness') !== null) {
                const tk = Number(fd.get('talkativeness'));
                baseJson.talkativeness = tk;
                baseJson.data.extensions.talkativeness = tk;
            }
            // Reproduces SillyTavern charaFormatData quirk: non-empty form 'world' overwrites data.character_book from external world file!
            const formWorld = String(fd.get('world') ?? '').trim();
            if (formWorld) {
                baseJson.data.extensions.world = formWorld;
                baseJson.data.character_book = {
                    name: `${formWorld}_OVERWRITTEN_BY_CHARA_FORMAT_DATA`,
                    entries: [{ id: 999, keys: ['overwritten'], content: 'External world replaced embedded book!' }],
                };
            }
            if (fd.get('chat') !== null) baseJson.chat = String(fd.get('chat'));
            if (fd.get('create_date') !== null) baseJson.create_date = String(fd.get('create_date'));
            if (fd.get('extensions')) {
                baseJson.data.extensions = deepMergeLikeTavern(baseJson.data.extensions, JSON.parse(fd.get('extensions')));
            }

            const uploadedAvatar = fd.get('avatar');
            const imgSource = uploadedAvatar ? new Uint8Array(await uploadedAvatar.arrayBuffer()) : existing.pngBytes;
            const mergedPng = embedCharaChunkIntoPng(imgSource, baseJson);
            diskCards.set(avatarUrl, { pngBytes: mergedPng, cardJson: baseJson });
            return new Response('OK', { status: 200 });
        }

        throw new Error(`Unexpected fetch URL in mock harness: ${u}`);
    };

    return { diskCards, seedRichCard, fetchHandler, requestLog, basePng };
}

test('Static Audit Hygiene: no internal /script*.js imports, no stopGeneration(), no CHAT_COMPLETION_SETTINGS_READY, no emojis, no 999px', () => {
    const jsFiles = [
        'nmf_entry.js',
        'modules/nmf_card_io_and_art.js',
        'modules/nmf_templates_and_prompts.js',
        'modules/nmf_i18n.js',
        'modules/nmf_themes_and_icons.js',
        'modules/nmf_media_vault.js',
    ];
    const emojiRe = /[\p{Extended_Pictographic}]/gu;

    for (const rel of jsFiles) {
        const src = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
        assert.equal(src.includes("import('/script.js')"), false, `Forbidden internal /script.js import in ${rel}`);
        assert.equal(src.includes("import('/scripts/world-info.js')"), false, `Forbidden /scripts/world-info.js import in ${rel}`);
        assert.equal(src.includes("import('/scripts/reasoning.js')"), false, `Forbidden /scripts/reasoning.js import in ${rel}`);
        assert.equal(src.includes('stopGeneration('), false, `Forbidden global stopGeneration() in ${rel}`);
        assert.equal(src.includes('CHAT_COMPLETION_SETTINGS_READY'), false, `Forbidden global CHAT_COMPLETION_SETTINGS_READY hook in ${rel}`);
        assert.equal(src.includes('preserved_name'), false, `Forbidden import preserved_name overwrite in ${rel}`);
        assert.equal(src.includes('999px'), false, `Forbidden pill border-radius 999px in ${rel}`);
        assert.equal(emojiRe.test(src), false, `Forbidden emoji in code file ${rel}`);
    }
    assert.equal(fs.existsSync(path.join(REPO_ROOT, 'LICENSE')), true, 'LICENSE file must exist');
    assert.equal(fs.existsSync(path.join(REPO_ROOT, 'CHANGELOG.md')), true, 'CHANGELOG.md must exist');
});

test('Scenario #1 & #21 (NMF-014): Clean init and crash-proof migration of broken/partial Beta sessions', () => {
    // Clean install
    const fresh = normalizeAndMigrateSettings(undefined, { defaultTheme: 'cyber' });
    assert.equal(fresh.settings.settingsSchemaVersion, SETTINGS_SCHEMA_VERSION);
    assert.equal(fresh.settings.theme, 'cyber');
    assert.equal(fresh.settings.sessions.length, 1);

    // Broken v1.3.0 config: session missing intake completely + partial tinder/architect + null entry
    const legacyBroken = {
        theme: 'velvet',
        sessions: [
            null,
            {
                id: 'sess_legacy_1',
                title: 'Старый черновик',
                intake: null, // Used to crash at s.intake.greetingStyle!
                tinder: { liked: [{ name: 'Raven', tags: 'dark, magic' }] },
                card: { name: 'Raven', description: 'Legacy text' },
            },
        ],
    };
    const migrated = normalizeAndMigrateSettings(legacyBroken);
    assert.equal(migrated.migrated, true);
    assert.ok(migrated.settings._preMigrationBackup, 'Must keep pre-migration snapshot');
    assert.equal(migrated.settings.sessions.length, 1);
    const s = migrated.settings.sessions[0];
    assert.equal(s.id, 'sess_legacy_1');
    assert.equal(s.intake.greetingStyle, 'fanfic');
    assert.equal(s.tinder.liked[0].name, 'Raven');
    assert.deepEqual(s.tinder.liked[0].tags, ['dark', 'magic']);
    assert.equal(Array.isArray(s.tinder.passed), true);
});

test('Scenario #2 & #3 (NMF-002): Full character load matches 100% with lazyLoadCharacters = false AND true', async () => {
    const origFetch = globalThis.fetch;
    try {
        for (const lazy of [false, true]) {
            const harness = await createMockTavernHarness({ lazyLoadCharacters: lazy });
            harness.seedRichCard('Seraphina.png');
            globalThis.fetch = harness.fetchHandler;

            let unshallowCalled = false;
            setTestTavernContext({
                characters: [{ avatar: 'Seraphina.png', name: 'Seraphina', shallow: lazy }],
                unshallowCharacter: async () => { unshallowCalled = true; },
                getRequestHeaders: () => ({ 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const editorState = createCardStateFromTavernChar(fullChar);

            assert.equal(unshallowCalled, true);
            assert.equal(editorState.name, 'Seraphina');
            assert.equal(editorState.description, 'Original rich description of Seraphina.');
            assert.equal(editorState.personality, 'Sharp, observant, loyal.');
            assert.equal(editorState.first_mes, 'She turns a page without looking up.');
            assert.deepEqual(editorState.alternate_greetings, ['Alt scene 1', 'Alt scene 2']);
            assert.ok(editorState.originalCardData.data.character_book, 'character_book must be loaded even in lazy mode');
        }
    } finally {
        globalThis.fetch = origFetch;
        setTestTavernContext(null);
    }
});

test('Scenarios #4, #5, #6, #7, #8 (NMF-001 & NMF-003): Updating original card preserves fav, chat, create_date, character_book, depth_prompt, talkativeness & unknown extensions + creates backup', async () => {
    const origFetch = globalThis.fetch;
    clearMemoryVaultForTests();
    try {
        const harness = await createMockTavernHarness({ lazyLoadCharacters: true });
        const initialJson = harness.seedRichCard('Seraphina.png');
        globalThis.fetch = harness.fetchHandler;
        setTestTavernContext({
            name1: 'Player',
            getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            getOneCharacter: async () => {},
        });

        const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
        const card = createCardStateFromTavernChar(fullChar);

        // Edit ONLY description + upload new PNG avatar
        card.description = 'Updated Gothic Cathedral description.';
        markCardFieldDirty(card, 'description');
        card.avatarDirty = true;
        const newPngBytes = await ensurePngBytes('', 'SR', '#ff4466');
        const newAvatarDataUrl = 'data:image/png;base64,' + Buffer.from(newPngBytes).toString('base64');

        const diff = computeCardDiff(card);
        assert.equal(diff.hasChanges, true);
        assert.equal(diff.changedFields.length, 2);

        const res = await updateExistingCardInTavern(card, {
            avatarFileName: 'Seraphina.png',
            avatarDataUrl: newAvatarDataUrl,
        });

        assert.equal(res.noop, false);
        assert.equal(harness.requestLog.some((r) => r.url === '/api/characters/import'), false, 'MUST NEVER call /api/characters/import for overwrite');
        assert.equal(harness.requestLog.some((r) => r.url === '/api/characters/edit-avatar'), true);
        assert.equal(harness.requestLog.some((r) => r.url === '/api/characters/merge-attributes'), true);

        const saved = harness.diskCards.get('Seraphina.png').cardJson;
        assert.equal(saved.description, 'Updated Gothic Cathedral description.');
        assert.equal(saved.data.description, 'Updated Gothic Cathedral description.');
        // Protected fields must match 100%
        assert.equal(saved.fav, true, 'Scenario #4: fav=true preserved');
        assert.equal(saved.data.extensions.fav, true, 'Scenario #4: extensions.fav=true preserved');
        assert.equal(saved.chat, initialJson.chat, 'Scenario #5: active chat binding preserved');
        assert.equal(saved.create_date, initialJson.create_date, 'create_date preserved');
        assert.equal(saved.talkativeness, 0.8, 'talkativeness preserved');
        assert.deepEqual(saved.data.character_book, initialJson.data.character_book, 'Scenario #6: character_book preserved');
        assert.deepEqual(saved.data.extensions.third_party_tracker, initialJson.data.extensions.third_party_tracker, 'Scenario #7: unknown extensions preserved');
        assert.equal(saved.custom_root_field, 'keep_root_value', 'Scenario #7: unknown root field preserved');
        assert.deepEqual(saved.data.custom_v2_field, { nested: 777 }, 'Scenario #7: unknown V2 field preserved');
        assert.deepEqual(saved.data.extensions.depth_prompt, initialJson.data.extensions.depth_prompt, 'Scenario #8: depth_prompt preserved');

        // Backup must exist in vault
        const backups = await listCardBackups('Seraphina.png');
        assert.equal(backups.length, 1);
        assert.equal(backups[0].cardJson.description, 'Original rich description of Seraphina.');
    } finally {
        globalThis.fetch = origFetch;
        setTestTavernContext(null);
    }
});

test('Scenario #9 (NMF-004): Importing JSON B after loading Character A clears sourceAvatarId, avatar, and imagePrompt', async () => {
    const harness = await createMockTavernHarness();
    const charA = harness.seedRichCard('CharA.png');
    let cardState = createCardStateFromTavernChar({ ...charA, avatar: 'CharA.png', json_data: JSON.stringify(charA) }, { avatarId: 'nmf_img_oldA' });
    cardState.imagePrompt = 'old portrait prompt from A';
    assert.equal(cardState.sourceAvatarId, 'CharA.png');
    assert.equal(cardState.sourceLoadedFromTavern, true);

    // Import independent JSON of Character B
    const jsonB = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
            name: 'Viktor',
            description: 'Cybernetic detective.',
            character_book: { name: 'CityLore', entries: [{ keys: ['neon'], content: 'Rainy sector 9' }] },
            extensions: { custom_ext: 'keep_b' },
        },
    };
    cardState = createCardStateFromImportedJson(jsonB);
    assert.equal(cardState.sourceAvatarId, '', 'sourceAvatarId from A must be cleared');
    assert.equal(cardState.sourceLoadedFromTavern, false, 'Overwrite button must not be enabled');
    assert.equal(cardState.avatarId, '', 'Avatar from A must not bleed into B');
    assert.equal(cardState.imagePrompt, '', 'Image prompt from A must not bleed into B');

    // Editing only description on JSON B keeps B's character_book & custom_ext lossless
    cardState.description = 'Updated detective bio.';
    markCardFieldDirty(cardState, 'description');
    const exportedB = buildV2CardObject(cardState);
    assert.equal(exportedB.data.description, 'Updated detective bio.');
    assert.deepEqual(exportedB.data.character_book, jsonB.data.character_book);
    assert.equal(exportedB.data.extensions.custom_ext, 'keep_b');
});

test('Scenarios #10, #11, #12, #13 (NMF-005, NMF-006, NMF-012): Local cancellation never stops ST chat or other extensions, save cannot falsely cancel, and rapid launches have no race conditions', async () => {
    let globalStopCalled = 0;
    let mainChatAborted = false;
    let otherExtAborted = false;
    const listeners = new Map();

    setTestTavernContext({
        mainApi: 'openai',
        extensionSettings: {},
        stopGeneration: () => {
            globalStopCalled += 1;
            mainChatAborted = true;
            otherExtAborted = true;
        },
        eventSource: {
            on: (ev, fn) => listeners.set(ev, fn),
            removeListener: (ev) => listeners.delete(ev),
        },
        generateRawData: () => new Promise((resolve) => {
            setTimeout(() => resolve({ choices: [{ message: { content: '{"name":"Late"}' } }] }), 120);
        }),
    });

    try {
        // #10 & #11: Start NMF LLM generation and cancel locally while main chat & other extension are active
        const task1Promise = withBusy('LLM Task', async (signal) => {
            await runLlmGeneration({ system: 'sys', user: 'usr', transportMode: 'json_schema', signal });
        }, { taskType: 'llm', cancellable: true });

        await new Promise((r) => setTimeout(r, 15));
        assert.equal(listeners.size, 0, 'NMF-012: must not register global CHAT_COMPLETION_SETTINGS_READY listener');
        const cancelled = requestCancelBusyTask();
        assert.equal(cancelled, true);
        await task1Promise;

        assert.equal(globalStopCalled, 0, 'Scenario #10/#11: ctx.stopGeneration() must NEVER be called');
        assert.equal(mainChatAborted, false, 'Scenario #10: main chat continues running');
        assert.equal(otherExtAborted, false, 'Scenario #11: background extension continues running');
        assert.equal(state.busy, false);

        // #12: Cancel during non-cancellable Save task must refuse cancellation and keep busy until save finishes
        let finishSave;
        const savePromise = withBusy('Saving PNG', () => new Promise((res) => { finishSave = res; }), {
            taskType: 'save',
            cancellable: false,
        });
        await new Promise((r) => setTimeout(r, 10));
        assert.equal(requestCancelBusyTask(), false, 'Scenario #12: save task refuses false cancel');
        assert.equal(state.busy, true, 'Scenario #12: busy remains true while save is still writing');

        // #13: Rapid second launch attempt while first task is still active is blocked cleanly
        const secondAttemptWhileBusy = await withBusy('Second overlapping task', async () => {}, { taskType: 'llm' });
        assert.equal(secondAttemptWhileBusy, false, 'Scenario #13: overlapping task blocked cleanly');

        finishSave();
        await savePromise;
        assert.equal(state.busy, false);

        // Now a fresh launch works normally with clean timer/state
        let secondRan = false;
        await withBusy('Clean second task', async () => { secondRan = true; }, { taskType: 'llm' });
        assert.equal(secondRan, true);
        assert.equal(state.busy, false);
    } finally {
        setTestTavernContext(null);
    }
});

test('Scenarios #14, #15, #16, #17, #18, #19 (NMF-007, NMF-008, NMF-009, NMF-016): SillyImages profile key isolation, enabled check, NovelAI, Electron Hub default endpoint, OpenRouter URL+Base64, and timeout', async () => {
    const origFetch = globalThis.fetch;
    const pngBytes = await ensurePngBytes('', 'OR', '#00ffcc');
    const validPngB64 = Buffer.from(pngBytes).toString('base64');

    try {
        // #14: Two profiles — Profile A has SECRET_KEY_A, Profile B has empty apiKey '' and custom endpoint
        const mockIig = {
            enabled: true,
            apiType: 'openai',
            endpoint: 'https://proxy-a.example.com',
            apiKey: 'SECRET_KEY_A',
            model: 'gpt-image-1',
            activeConnectionProfileId: 'prof_a',
            connectionProfiles: [
                {
                    id: 'prof_a',
                    name: 'Profile A',
                    apiType: 'openai',
                    endpoint: 'https://proxy-a.example.com',
                    apiKey: 'SECRET_KEY_A',
                    model: 'gpt-image-1',
                },
                {
                    id: 'prof_b_no_key',
                    name: 'Profile B',
                    apiType: 'openai',
                    endpoint: 'https://untrusted-b.example.com',
                    apiKey: '',
                    model: 'flux-dev',
                },
                {
                    id: 'prof_eh_default',
                    name: 'Electron Hub Empty Endpoint',
                    apiType: 'electronhub',
                    endpoint: '',
                    apiKey: 'EH_KEY_ONLY',
                    model: 'flux-1-kontext-pro',
                },
                {
                    id: 'prof_nai_bad_model',
                    name: 'NovelAI Invalid',
                    apiType: 'novelai',
                    endpoint: '',
                    apiKey: 'NAI_KEY',
                    model: 'not-a-real-nai-model',
                },
                {
                    id: 'prof_nai_valid',
                    name: 'NovelAI V5',
                    apiType: 'novelai',
                    endpoint: '',
                    apiKey: 'NAI_KEY',
                    model: 'nai-diffusion-5-full',
                    novelaiNeverSpendAnlas: true,
                },
                {
                    id: 'prof_or',
                    name: 'OpenRouter',
                    apiType: 'openrouter',
                    endpoint: '',
                    apiKey: 'OR_KEY',
                    model: 'google/gemini-3-pro-image',
                },
            ],
        };

        const isolatedB = resolveIsolatedImageConfig(mockIig, 'prof_b_no_key');
        assert.equal(isolatedB.apiKey, '', 'NMF-007: Profile B MUST NOT inherit SECRET_KEY_A');
        assert.equal(validateResolvedImageConfig(isolatedB).ready, false, 'Profile B without required key must be marked not ready');

        let networkHitCount = 0;
        setTestTavernContext({ extensionSettings: { inline_image_gen: mockIig } });
        globalThis.fetch = async () => {
            networkHitCount += 1;
            throw new Error('Should not be called');
        };
        await assert.rejects(
            () => generateCharacterPortrait('portrait', { imageSource: 'inline_image_gen', imageProfileId: 'prof_b_no_key', maxAttempts: 1 }),
            /API-ключ/,
        );
        assert.equal(networkHitCount, 0, 'Scenario #14: Zero network requests sent when Profile B key is empty');

        // #15: SillyImages disabled (enabled: false OR in disabledExtensions)
        setTestTavernContext({
            extensionSettings: {
                inline_image_gen: { ...mockIig, enabled: false },
            },
        });
        assert.equal(listImageExtensionBuckets()[0].enabled, false);
        await assert.rejects(
            () => generateCharacterPortrait('portrait', { imageSource: 'auto', maxAttempts: 1 }),
            /Не найдено включённое|выключено/,
        );

        setTestTavernContext({
            extensionSettings: {
                disabledExtensions: ['third-party/sillyimages'],
                inline_image_gen: mockIig,
            },
        });
        assert.equal(listImageExtensionBuckets()[0].enabled, false, 'Scenario #15: disabledExtensions respected');

        // Re-enable for #16, #17, #18, #19
        setTestTavernContext({ extensionSettings: { inline_image_gen: mockIig } });

        // #16: NovelAI invalid model rejected before fetch; valid model checks Opus subscription & generates
        await assert.rejects(
            () => generateCharacterPortrait('anime knight', { imageProfileId: 'prof_nai_bad_model', maxAttempts: 1 }),
            /NovelAI выберите поддерживаемую модель/,
        );

        const seenCalls = [];
        globalThis.fetch = async (url, init = {}) => {
            seenCalls.push({ url: String(url), auth: init.headers?.Authorization || '' });
            if (String(url) === 'https://image.novelai.net/user/subscription') {
                return new Response(JSON.stringify({
                    active: true,
                    tier: 3,
                    expiresAt: Math.floor(Date.now() / 1000) + 86400,
                    usage: { isNegative: false, percent: 80 },
                }), { status: 200 });
            }
            if (String(url) === 'https://image.novelai.net/ai/generate-image') {
                return new Response(JSON.stringify({ images: [{ image: validPngB64 }] }), { status: 200 });
            }
            if (String(url) === 'https://api.electronhub.ai/v1/images/generations') {
                return new Response(JSON.stringify({ data: [{ b64_json: validPngB64 }] }), { status: 200 });
            }
            if (String(url) === 'https://openrouter.ai/api/v1/chat/completions') {
                return new Response(JSON.stringify({
                    choices: [{ message: { images: [{ image_url: { url: 'https://cdn.example.com/out.png' } }] } }],
                }), { status: 200 });
            }
            if (String(url) === 'https://cdn.example.com/out.png') {
                return new Response(pngBytes, { status: 200, headers: { 'content-type': 'image/png' } });
            }
            throw new Error('Unexpected URL ' + url);
        };

        const naiOut = await generateCharacterPortrait('silver hair mage', { imageProfileId: 'prof_nai_valid', maxAttempts: 1 });
        assert.equal(naiOut.startsWith('data:image/png;base64,'), true, 'Scenario #16: NovelAI valid generation works');
        assert.equal(seenCalls.some((c) => c.url === 'https://image.novelai.net/user/subscription' && c.auth === 'Bearer NAI_KEY'), true);

        // #17: Electron Hub with empty endpoint uses https://api.electronhub.ai and EH_KEY_ONLY (never SECRET_KEY_A!)
        const ehOut = await generateCharacterPortrait('cyber samurai', { imageProfileId: 'prof_eh_default', maxAttempts: 1 });
        assert.equal(ehOut.startsWith('data:image/png;base64,'), true);
        const ehCall = seenCalls.find((c) => c.url === 'https://api.electronhub.ai/v1/images/generations');
        assert.ok(ehCall, 'Scenario #17: Electron Hub default endpoint used');
        assert.equal(ehCall.auth, 'Bearer EH_KEY_ONLY', 'Scenario #14/#17: only Electron Hub profile key sent');

        // #18: OpenRouter URL response + Base64 conversion
        const orOut = await generateCharacterPortrait('starship captain', { imageProfileId: 'prof_or', maxAttempts: 1 });
        assert.equal(orOut.startsWith('data:image/png;base64,'), true, 'Scenario #18: OpenRouter URL fetched and converted to Data URL');

        // #19: Slow endpoint times out cleanly instead of hanging forever
        globalThis.fetch = (_url, init = {}) => new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
        await assert.rejects(
            () => generateCharacterPortrait('slow test', { imageProfileId: 'prof_eh_default', timeoutMs: 300, maxAttempts: 1 }),
            /Превышено время ожидания/,
        );
    } finally {
        globalThis.fetch = origFetch;
        setTestTavernContext(null);
    }
});

test('Scenario #20 (NMF-013): 55+ Base64 images stay in Vault — extensionSettings JSON has ZERO Base64 bloat & prunes orphans', async () => {
    clearMemoryVaultForTests();
    const sess = createDefaultSession(1);
    const fake10KbDataUrl = 'data:image/png;base64,' + 'A'.repeat(12000);

    for (let i = 0; i < 55; i++) {
        sess.tinder.liked.push({
            id: `cand_${i}`,
            name: `Hero ${i}`,
            avatarDataUrl: fake10KbDataUrl,
            avatarId: '',
        });
    }
    sess.card.avatarDataUrl = fake10KbDataUrl;

    const moved = await migrateInlineSessionMediaToVault([sess]);
    assert.equal(moved.changed, true);
    assert.equal(moved.complete, true);

    const serializedSettings = JSON.stringify({ sessions: [sess] });
    assert.equal(serializedSettings.includes('data:image/'), false, 'Scenario #20: ZERO Base64 images left in extensionSettings');
    assert.ok(serializedSettings.length < 15000, `Serialized settings must stay tiny, got ${serializedSettings.length} bytes`);
    assert.equal(resolveEntityAvatarUrl(sess.tinder.liked[0]), fake10KbDataUrl, 'Image still resolves cleanly from Vault');

    // Deleting candidates prunes unused media from vault
    const removedId = sess.tinder.liked[0].avatarId;
    sess.tinder.liked = [];
    sess.card.avatarId = '';
    const prunedCount = await pruneOrphanedMedia([sess]);
    assert.ok(prunedCount >= 55);
    assert.equal(resolveEntityAvatarUrl({ avatarId: removedId }), '');
});

test('NMF-010 & NMF-011: Native JsonSchema passed to generateRawData, robust parser edge cases, and Chat vs Text Completion preset handling', async () => {
    const sess = createDefaultSession(1);
    const fullReq = buildFullCardRequest(sess, 'Alchemist', 'json_schema');
    assert.deepEqual(fullReq.jsonSchema, FULL_CARD_JSON_SCHEMA);
    assert.deepEqual(buildTinderPreviewRequest(sess, 3, 'json_schema').jsonSchema, TINDER_PREVIEW_JSON_SCHEMA);
    assert.deepEqual(buildBlitzQuestionsRequest(sess, -1, 'json_schema').jsonSchema, BLITZ_QUESTIONS_JSON_SCHEMA);

    // NMF-010 parser edge cases: extra text, multiple JSON objects, missing required field, wrong type, truncated JSON
    const multiMsg = 'Note: {"unrelated":123}\nHere is the card:\n```json\n{"name":"Lyra","description":" Mage ","alternate_greetings":["Hi"],"tags":["magic"]}\n```\nTrailing text.';
    const parsedCard = parseFullCardResponse(multiMsg, 'json_schema');
    assert.equal(parsedCard.name, 'Lyra');
    assert.equal(parsedCard.description, 'Mage');

    assert.throws(() => parseFullCardResponse('{"description":"missing name field"}', 'json_schema'), /обязательные поля/);
    assert.throws(() => parseFullCardResponse('["array_instead_of_object"]', 'json_schema'), /обязательные поля/);
    assert.throws(() => parseFullCardResponse('{"name":"Truncated","description":"half...', 'json_schema'), /обрезан или повреждён/);
    assert.ok(extractJsonLoose({ name: 'NativeObject', description: 'From Core jsonSchema' }));

    // NMF-011: assistant_prefill preserved even when post-history blocks exist after chatHistory
    const mockChatCtx = {
        chatCompletionSettings: {
            assistant_prefill: 'Understood, outputting V2 card:',
            prompts: [
                { identifier: 'main', role: 'system', content: 'Main Sys' },
                { identifier: 'jailbreak', role: 'system', content: 'Post History Rule' },
            ],
            prompt_order: [{
                character_id: 100001,
                order: [
                    { identifier: 'main', enabled: true },
                    { identifier: 'chatHistory', enabled: true },
                    { identifier: 'jailbreak', enabled: true },
                ],
            }],
        },
    };
    const aligned = buildPresetAlignedMessages(mockChatCtx, 'Build card', '', 'Override');
    assert.equal(aligned[aligned.length - 1].role, 'assistant');
    assert.equal(aligned[aligned.length - 1].content, 'Understood, outputting V2 card:');

    // Text Completion mode passes string prompt + textCompletionSettings.start_reply_with without OpenAI message array
    let capturedParams = null;
    setTestTavernContext({
        mainApi: 'textgenerationwebui',
        textCompletionSettings: { start_reply_with: '{' },
        generateRawData: async (params) => {
            capturedParams = params;
            return { results: [{ text: '{"name":"TC Hero","description":"Built via Text Completion"}' }] };
        },
        extractMessageFromData: (d) => d.results[0].text,
    });
    try {
        const out = await runLlmGeneration({
            system: 'TC Sys',
            user: 'TC User',
            jsonSchema: FULL_CARD_JSON_SCHEMA,
            transportMode: 'prefill_user_msg',
            presetCorrectionPrompt: 'Fix',
        });
        assert.equal(typeof capturedParams.prompt, 'string', 'Text Completion must send string prompt, not OpenAI chat array');
        assert.equal(capturedParams.prefill, '{');
        assert.equal(capturedParams.jsonSchema, null, 'jsonSchema only sent on openai chat completion');
        assert.equal(parseFullCardResponse(out, 'json_schema').name, 'TC Hero');
    } finally {
        setTestTavernContext(null);
    }
});

test('Scenarios #23, #24, #25, #26: Pocket Codex optional check, HTML/<style> XSS escaping, and PNG V2 round-trip', async () => {
    // #24: No DOM -> Pocket Codex cleanly reported as false without throwing
    assert.equal(detectPocketCodex(), false);

    // #25: Malicious HTML, <style>, <script>, quotes, single quotes escaped safely
    const payload = `<style>body{display:none}</style><img src=x onerror="alert('xss')"><script>evil()</script>`;
    const escaped = esc(payload);
    assert.equal(escaped.includes('<style>'), false);
    assert.equal(escaped.includes('<script>'), false);
    assert.equal(escaped.includes('"'), false);
    assert.equal(escaped.includes("'"), false);
    assert.ok(escaped.includes('&lt;style&gt;'));

    // #26: PNG round-trip preserves full Unicode V2 metadata & character_book
    const cardState = createCardStateFromImportedJson({
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
            name: 'Аврора — Хранительница',
            description: 'Проверка кириллицы и метаданных.',
            tags: ['ru', 'test'],
            character_book: { name: 'Книга Мира', entries: [{ keys: ['ключ'], content: 'Текст записи' }] },
            extensions: { custom_plugin: { active: true } },
        },
    });
    const v2 = buildV2CardObject(cardState);
    const rawPng = await ensurePngBytes('', 'АХ', '#1de9b6');
    const embeddedPng = embedCharaChunkIntoPng(rawPng, v2);
    const decodedV2 = extractCharaJsonFromPng(embeddedPng);

    assert.equal(decodedV2.spec, 'chara_card_v2');
    assert.equal(decodedV2.data.name, 'Аврора — Хранительница');
    assert.deepEqual(decodedV2.data.character_book, v2.data.character_book);
    assert.deepEqual(decodedV2.data.extensions.custom_plugin, { active: true });
});

// ============================================================================
// FOLLOW-UP AUDIT REGRESSION SUITES (P1-A, P1-B, P1-C, P1/P2-D, P2-E, P2-F, P2-G)
// ============================================================================

test('Follow-up P1-A Regression: AU Rework never leaks system_prompt, PHI, or name from previous session card B into original A across JSON & indexed formats', async () => {
    const origFetch = globalThis.fetch;
    globalThis.indexedDB = createMockIndexedDb();
    clearMemoryVaultForTests();
    try {
        const harness = await createMockTavernHarness({ lazyLoadCharacters: true });

        // Original A1: has non-empty system_prompt & PHI
        harness.seedRichCard('Original_A1.png');
        const cardA1 = harness.diskCards.get('Original_A1.png').cardJson;
        cardA1.name = 'Lady_A1';
        cardA1.data.name = 'Lady_A1';
        cardA1.data.system_prompt = 'FROM_A1_SYS';
        cardA1.data.post_history_instructions = 'FROM_A1_PHI';
        harness.diskCards.get('Original_A1.png').pngBytes = embedCharaChunkIntoPng(harness.basePng, cardA1);

        // Original A2: has intentionally EMPTY system_prompt & PHI
        harness.seedRichCard('Original_A2.png');
        const cardA2 = harness.diskCards.get('Original_A2.png').cardJson;
        cardA2.name = 'Lord_A2';
        cardA2.data.name = 'Lord_A2';
        cardA2.data.system_prompt = '';
        cardA2.data.post_history_instructions = '';
        harness.diskCards.get('Original_A2.png').pngBytes = embedCharaChunkIntoPng(harness.basePng, cardA2);

        globalThis.fetch = harness.fetchHandler;
        setTestTavernContext({
            getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
        });

        // Session starts with poisoned card B in editor
        const sess = createDefaultSession(1);
        sess.card = {
            ...sess.card,
            name: 'POISON_NAME_FROM_B',
            system_prompt: 'FROM_B_POISON_SYS',
            post_history_instructions: 'FROM_B_POISON_PHI',
            creator_notes: 'NOTES_FROM_B',
            avatarId: 'nmf_img_from_b',
        };

        const rawFormats = [
            {
                mode: 'json_schema',
                makeRaw: () => JSON.stringify({
                    name: '',
                    description: 'Cyberpunk neon adaptation of the character.',
                    personality: 'Sharp and streetwise.',
                    scenario: 'Rainy Neo-Tokyo rooftop.',
                    first_mes: 'Rain drips off the neon sign.',
                    alternate_greetings: [],
                    mes_example: '',
                    system_prompt: '',
                    post_history_instructions: '',
                    creator_notes: '',
                    tags: [],
                    image_prompt: '',
                }),
            },
            {
                mode: 'prefill_user_msg',
                makeRaw: () => [
                    '[[NMF_NAME]]\n[[/NMF_NAME]]',
                    '[[NMF_DESC]]\nSteampunk brass airship adaptation.\n[[/NMF_DESC]]',
                    '[[NMF_PERSONALITY]]\nInventive.\n[[/NMF_PERSONALITY]]',
                    '[[NMF_SCENARIO]]\nSky dock.\n[[/NMF_SCENARIO]]',
                    '[[NMF_FIRST_MES]]\nGears click softly.\n[[/NMF_FIRST_MES]]',
                    '[[NMF_SYS_PROMPT]]\n[[/NMF_SYS_PROMPT]]',
                    '[[NMF_POST_HISTORY]]\n[[/NMF_POST_HISTORY]]',
                ].join('\n'),
            },
        ];

        // Matrix: 2 originals (non-empty vs empty prompts) x 2 transport formats + consecutive reworks in same session
        for (const targetAvatar of ['Original_A1.png', 'Original_A2.png']) {
            for (const fmt of rawFormats) {
                // Re-poison sess.card with B right before rework to simulate user editing B then reworking A
                sess.card.name = 'POISON_NAME_FROM_B';
                sess.card.system_prompt = 'FROM_B_POISON_SYS';
                sess.card.post_history_instructions = 'FROM_B_POISON_PHI';

                const { fullChar, rawCardObject, snapshotHash } = await fetchFullTavernCharacter(targetAvatar);
                const baseState = createCardStateFromTavernChar(fullChar);
                const expectedName = targetAvatar === 'Original_A1.png' ? 'Lady_A1' : 'Lord_A2';
                const parsed = parseFullCardResponse(fmt.makeRaw(), fmt.mode, 'macro', { fallbackName: baseState.name });

                sess.card = applyReworkResultToTavernBase(baseState, parsed, {
                    sourceAvatarId: targetAvatar,
                    snapshotHash,
                    rawCardObject,
                });

                const expectedSys = targetAvatar === 'Original_A1.png' ? 'FROM_A1_SYS' : '';
                const expectedPhi = targetAvatar === 'Original_A1.png' ? 'FROM_A1_PHI' : '';

                assert.equal(sess.card.name, expectedName, `${targetAvatar}/${fmt.mode}: name must come from A, never B`);
                assert.equal(sess.card.system_prompt, expectedSys, `${targetAvatar}/${fmt.mode}: system_prompt must match A, never B`);
                assert.equal(sess.card.post_history_instructions, expectedPhi, `${targetAvatar}/${fmt.mode}: PHI must match A, never B`);
                assert.equal(sess.card.dirtyFields.includes('system_prompt'), false, 'Unchanged system_prompt must NOT be marked dirty');
                assert.equal(sess.card.dirtyFields.includes('post_history_instructions'), false, 'Unchanged PHI must NOT be marked dirty');
                assert.equal(sess.card.dirtyFields.includes('name'), false, 'Unchanged name must NOT be marked dirty');

                const mergePayload = buildSurgicalMergePayload(targetAvatar, sess.card);
                const payloadStr = JSON.stringify(mergePayload);
                assert.equal(payloadStr.includes('FROM_B'), false, 'Merge payload must contain ZERO bytes from B');

                // Also verify standalone creation never inherits from sess.card
                const freshDraft = createCardStateFromGeneratedDraft(parsed);
                assert.equal(freshDraft.system_prompt, '');
                assert.equal(freshDraft.post_history_instructions, '');
                assert.equal(freshDraft.sourceAvatarId, '');
                assert.equal(freshDraft.sourceLoadedFromTavern, false);
            }
        }
    } finally {
        globalThis.fetch = origFetch;
        setTestTavernContext(null);
    }
});

test('Follow-up P1-B Regression: Fail-closed PNG backup blocks overwrite on 404/500/corrupt PNG, IDB open fail, QuotaExceededError, and readback corruption', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    try {
        const failureCases = [
            { label: 'fetch /characters -> 404', charStatus: 404, idbOpts: {} },
            { label: 'fetch /characters -> 500', charStatus: 500, idbOpts: {} },
            { label: 'fetch /characters -> 0-byte PNG', zeroPng: true, idbOpts: {} },
            { label: 'fetch /characters -> corrupt non-PNG bytes', corruptPng: true, idbOpts: {} },
            { label: 'indexedDB.open fails', idbOpts: { failOpen: true } },
            { label: 'indexedDB.put QuotaExceededError', idbOpts: { quotaFailAfterWrites: 0 } },
            { label: 'indexedDB readback corrupted', idbOpts: { corruptReadback: true } },
        ];

        for (const tc of failureCases) {
            globalThis.indexedDB = createMockIndexedDb(tc.idbOpts);
            clearMemoryVaultForTests();

            const harness = await createMockTavernHarness();
            harness.seedRichCard('Seraphina.png');

            globalThis.fetch = async (url, init = {}) => {
                const u = String(url);
                if (u === '/characters/Seraphina.png') {
                    harness.requestLog.push({ url: u, method: init.method || 'GET' });
                    if (tc.charStatus) return new Response('Fail', { status: tc.charStatus });
                    if (tc.zeroPng) return new Response(new Uint8Array(0), { status: 200, headers: { 'content-type': 'image/png' } });
                    if (tc.corruptPng) return new Response(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { status: 200, headers: { 'content-type': 'image/png' } });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Attempted overwrite without durable backup';
            markCardFieldDirty(card, 'description');

            harness.requestLog.length = 0;
            await assert.rejects(
                () => updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' }),
                (err) => {
                    assert.match(String(err.code || ''), /^BACKUP_/);
                    return true;
                },
                `Case [${tc.label}] must reject with BACKUP_* error`
            );

            const writeCalls = harness.requestLog.filter((r) =>
                ['/api/characters/edit-avatar', '/api/characters/merge-attributes', '/api/characters/edit', '/api/characters/import'].includes(r.url)
            );
            assert.equal(writeCalls.length, 0, `Case [${tc.label}] must issue ZERO write POSTs`);
            assert.deepEqual(card.dirtyFields, ['description'], `Case [${tc.label}] must preserve pending dirtyFields`);
        }
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        clearMemoryVaultForTests({ closeDb: true });
        setTestTavernContext(null);
    }
});

test('Follow-up P1-C Regression: Post-save integrity verifier catches silent mutation of fav, chat, character_book, extensions, or unapplied dirty field', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();
    try {
        const sabotageModes = [
            {
                name: 'fav flipped to false',
                mutateAfterSave: (raw) => {
                    raw.fav = false;
                    raw.data.extensions.fav = false;
                },
            },
            {
                name: 'chat binding changed',
                mutateAfterSave: (raw) => {
                    raw.chat = 'Wrong_Chat_ID';
                },
            },
            {
                name: 'character_book vanished',
                mutateAfterSave: (raw) => {
                    delete raw.data.character_book;
                },
            },
            {
                name: 'unknown extension mutated',
                mutateAfterSave: (raw) => {
                    raw.data.extensions.third_party_tracker = { affection: -999 };
                },
            },
            {
                name: 'dirty description silently ignored',
                mutateAfterSave: (raw) => {
                    raw.description = 'Original rich description of Seraphina.';
                    raw.data.description = 'Original rich description of Seraphina.';
                },
            },
        ];

        for (const mode of sabotageModes) {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            harness.seedRichCard('Seraphina.png');

            let mergeHappened = false;
            globalThis.fetch = async (url, init = {}) => {
                const res = await harness.fetchHandler(url, init);
                if (String(url) === '/api/characters/merge-attributes') {
                    mergeHappened = true;
                }
                if (String(url) === '/api/characters/get' && mergeHappened) {
                    const body = await res.json();
                    const corrupted = JSON.parse(body.json_data);
                    mode.mutateAfterSave(corrupted);
                    return new Response(JSON.stringify({
                        ...corrupted,
                        avatar: 'Seraphina.png',
                        json_data: JSON.stringify(corrupted),
                    }), { status: 200, headers: { 'content-type': 'application/json' } });
                }
                return res;
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar, snapshotHash } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Updated verified description.';
            markCardFieldDirty(card, 'description');

            await assert.rejects(
                () => updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' }),
                (err) => {
                    assert.equal(err.code, 'INTEGRITY_CHECK_FAILED');
                    assert.ok(Array.isArray(err.mismatches) && err.mismatches.length >= 1);
                    assert.ok(err.backupId, 'Must attach backupId for 1-click recovery');
                    return true;
                },
                `Sabotage [${mode.name}] must fail with INTEGRITY_CHECK_FAILED`
            );

            // Pending dirty state & original baseline must remain untouched on failure
            assert.deepEqual(card.dirtyFields, ['description']);
            assert.equal(card.sourceSnapshotHash, snapshotHash);
        }
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        setTestTavernContext(null);
    }
});

test('Follow-up P1/P2-D Regression: PARTIAL_SAVE bidirectional failure (/edit-avatar -> 200 + /merge -> 500 AND reverse) + guarded rollback & manual backup restore', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();
    try {
        // 1. Forward failure: /edit-avatar -> 200, /merge-attributes -> 500 => auto-rolls back avatar pixels to exact backup
        {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            harness.seedRichCard('Seraphina.png');
            const origBytesCopy = new Uint8Array(harness.diskCards.get('Seraphina.png').pngBytes);

            const altPngBytes = await ensurePngBytes('', 'NEW', '#ff3366');
            const altDataUrl = 'data:image/png;base64,' + Buffer.from(altPngBytes).toString('base64');

            globalThis.fetch = async (url, init = {}) => {
                if (String(url) === '/api/characters/merge-attributes') {
                    harness.requestLog.push({ url: String(url), method: 'POST' });
                    return new Response('Internal Server Error', { status: 500 });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Text change that fails on step 2';
            markCardFieldDirty(card, 'description');
            card.avatarDirty = true;

            let caughtErr = null;
            await assert.rejects(async () => {
                try {
                    await updateExistingCardInTavern(card, {
                        avatarFileName: 'Seraphina.png',
                        avatarDataUrl: altDataUrl,
                        writeOrder: 'avatar-first',
                    });
                } catch (e) {
                    caughtErr = e;
                    throw e;
                }
            });

            assert.equal(caughtErr.code, 'PARTIAL_SAVE');
            assert.equal(caughtErr.rolledBack, true);
            assert.equal(caughtErr.avatarApplied, false);
            assert.equal(caughtErr.fieldsApplied, false);
            assert.ok(caughtErr.backupId);
            assert.equal(card.avatarDirty, true, 'avatarDirty preserved for retry');
            assert.deepEqual(card.dirtyFields, ['description']);
            assert.deepEqual(harness.diskCards.get('Seraphina.png').pngBytes, origBytesCopy, 'Disk PNG rolled back byte-for-byte');
        }

        // 2. Reverse failure: /merge-attributes -> 200, /edit-avatar -> 500 => auto-rolls back JSON fields to exact backup
        {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            const origJson = structuredClone(harness.seedRichCard('Seraphina.png'));
            const altPngBytes = await ensurePngBytes('', 'NEW', '#33ccff');
            const altDataUrl = 'data:image/png;base64,' + Buffer.from(altPngBytes).toString('base64');

            globalThis.fetch = async (url, init = {}) => {
                if (String(url) === '/api/characters/edit-avatar') {
                    harness.requestLog.push({ url: String(url), method: 'POST' });
                    return new Response('Disk Full on Avatar Write', { status: 500 });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Temporary applied text that must roll back';
            markCardFieldDirty(card, 'description');
            card.avatarDirty = true;

            let caughtErr = null;
            await assert.rejects(async () => {
                try {
                    await updateExistingCardInTavern(card, {
                        avatarFileName: 'Seraphina.png',
                        avatarDataUrl: altDataUrl,
                        writeOrder: 'fields-first',
                    });
                } catch (e) {
                    caughtErr = e;
                    throw e;
                }
            });

            assert.equal(caughtErr.code, 'PARTIAL_SAVE');
            assert.equal(caughtErr.rolledBack, true);
            assert.equal(harness.diskCards.get('Seraphina.png').cardJson.description, origJson.description);
            assert.equal(harness.diskCards.get('Seraphina.png').cardJson.fav, true);
            assert.deepEqual(harness.diskCards.get('Seraphina.png').cardJson.data.character_book, origJson.data.character_book);

            // Also verify manual 1-click restoreCardFromBackupVault when server returns healthy again
            globalThis.fetch = harness.fetchHandler;
            const restored = await restoreCardFromBackupVault(caughtErr.backupId, { allowExternalChangeOverride: true });
            assert.equal(restored.restoredChar.description, origJson.description);
            assert.equal(restored.restoredChar.fav, true);
        }
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        setTestTavernContext(null);
    }
});

test('Follow-up P2-E Regression: 56 Base64 images survive concurrent saveSettings() during delayed migration AND mid-batch IDB QuotaExceededError across reload', async () => {
    const origIdb = globalThis.indexedDB;
    const sharedBacking = new Map();
    // Simulate slow IndexedDB (2ms/op) that throws QuotaExceededError after 25 writes!
    globalThis.indexedDB = createMockIndexedDb({
        latencyMs: 2,
        quotaFailAfterWrites: 25,
        backingMap: sharedBacking,
    });
    clearMemoryVaultForTests();

    try {
        const sess = createDefaultSession(1);
        const expectedPayloads = new Map();

        const cardPayload = 'data:image/png;base64,' + Buffer.from('CARD_MAIN_IMAGE_0').toString('base64');
        sess.card.avatarDataUrl = cardPayload;
        expectedPayloads.set('main_card', cardPayload);

        for (let i = 0; i < 55; i++) {
            const uniqueUrl = 'data:image/png;base64,' + Buffer.from(`HERO_PORTRAIT_${i}_DATA`).toString('base64');
            sess.tinder.liked.push({
                id: `cand_${i}`,
                name: `Hero ${i}`,
                avatarDataUrl: uniqueUrl,
                avatarId: '',
            });
            expectedPayloads.set(`cand_${i}`, uniqueUrl);
        }

        const extStore = {
            st_nexus_match_forge: {
                settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
                theme: 'krakoa',
                activeSessionId: sess.id,
                sessions: [sess],
            },
        };
        setTestTavernContext({
            extensionSettings: extStore,
            saveSettingsDebounced: () => {},
        });

        // Start async migration and fire saveSettings() mid-flight (simulating user changing theme during migration!)
        const migPromise = migrateInlineSessionMediaToVault(extStore.st_nexus_match_forge.sessions);
        await new Promise((r) => setTimeout(r, 12));
        extStore.st_nexus_match_forge.theme = 'velvet';
        saveSettings();

        const migResult = await migPromise;
        saveSettings();

        assert.equal(migResult.migratedCount, 25, 'Exactly 25 images persisted before quota limit');
        assert.equal(migResult.failedCount, 31, 'Remaining 31 images hit quota limit');
        assert.equal(migResult.complete, false, 'Incomplete migration must NOT report complete=true');

        // Simulate FULL browser page reload: serialize extensionSettings JSON, wipe all RAM caches, reopen IndexedDB
        const savedDiskSettingsJson = JSON.stringify(extStore.st_nexus_match_forge);
        clearMemoryVaultForTests({ closeDb: true });
        globalThis.indexedDB = createMockIndexedDb({ backingMap: sharedBacking });

        const reloadedSettings = JSON.parse(savedDiskSettingsJson);
        const reloadedSess = reloadedSettings.sessions[0];
        await hydrateSessionsMedia(reloadedSettings.sessions);

        assert.equal(resolveEntityAvatarUrl(reloadedSess.card), expectedPayloads.get('main_card'), 'Main card image survived reload');
        for (let i = 0; i < 55; i++) {
            const actual = resolveEntityAvatarUrl(reloadedSess.tinder.liked[i]);
            assert.equal(actual, expectedPayloads.get(`cand_${i}`), `Candidate #${i} image survived reload without loss`);
        }
    } finally {
        globalThis.indexedDB = origIdb;
        setTestTavernContext(null);
        clearMemoryVaultForTests();
    }
});

test('Follow-up P2-F Regression: /api/characters/merge-attributes falls back to /edit on 404, 405, and 501, but NEVER falls back on 500', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();
    try {
        for (const code of [404, 405, 501]) {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            const initial = structuredClone(harness.seedRichCard('Seraphina.png'));

            globalThis.fetch = async (url, init = {}) => {
                if (String(url) === '/api/characters/merge-attributes') {
                    harness.requestLog.push({ url: String(url), method: 'POST', status: code });
                    return new Response('Unsupported route', { status: code });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = `Saved via fallback after HTTP ${code}`;
            markCardFieldDirty(card, 'description');

            const res = await updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' });
            assert.equal(res.updatedChar.description, `Saved via fallback after HTTP ${code}`);
            assert.equal(res.updatedChar.fav, true);
            assert.equal(res.updatedChar.chat, initial.chat);
            assert.deepEqual(res.updatedChar.data.character_book, initial.data.character_book);
            assert.ok(harness.requestLog.some((r) => r.url === '/api/characters/edit'), `HTTP ${code} must trigger /edit fallback`);
        }

        // Verify HTTP 500 NEVER triggers /edit fallback
        {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            harness.seedRichCard('Seraphina.png');
            globalThis.fetch = async (url, init = {}) => {
                if (String(url) === '/api/characters/merge-attributes') {
                    harness.requestLog.push({ url: String(url), method: 'POST', status: 500 });
                    return new Response('Server Crash', { status: 500 });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Must not fallback on 500';
            markCardFieldDirty(card, 'description');

            await assert.rejects(() => updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' }), /HTTP 500/);
            assert.equal(harness.requestLog.some((r) => r.url === '/api/characters/edit'), false, 'HTTP 500 must NEVER fallback to /edit');
        }
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        setTestTavernContext(null);
    }
});

test('Follow-up P2-G Regression: Full renderWindow() innerHTML DOM sink audit against XSS/<style>/SVG-dataURL payloads & external edit conflict resolution', async () => {
    const origDoc = globalThis.document;
    const origCss = globalThis.CSS;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();

    const winContainer = {
        className: '',
        innerHTML: '',
        dataset: {},
        style: { setProperty() {} },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
    };

    globalThis.CSS = { escape: (s) => String(s) };
    globalThis.document = {
        getElementById: (id) => (id === 'nmf-window' ? winContainer : null),
    };

    try {
        const xssVector = `"><style>body{display:none}</style><img src=x onerror="window.__xss=1"><script>evil()</script>`;
        const sess = createDefaultSession(1);
        sess.id = `sess_${xssVector}`;
        sess.title = `Title ${xssVector}`;
        sess.intake.settingEra = xssVector;
        sess.intake.genres = [xssVector];
        sess.card.name = xssVector;
        sess.card.description = xssVector;
        sess.card.creator_notes = xssVector;
        sess.card.tags = xssVector;
        sess.card.world = xssVector;
        sess.card.sourceAvatarId = `evil_${xssVector}.png`;
        sess.card.sourceLoadedFromTavern = true;
        sess.card.avatarDataUrl = 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+';
        sess.tinder.queue.push({
            id: `cand_${xssVector}`,
            name: xssVector,
            archetype: xssVector,
            pitch: xssVector,
            appearance: xssVector,
            quote: xssVector,
            tags: [xssVector],
            avatarDataUrl: 'javascript:alert(1)',
        });

        setTestTavernContext({
            extensionSettings: {
                st_nexus_match_forge: {
                    settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
                    theme: 'krakoa',
                    transportMode: 'prefill_user_msg',
                    imageSource: 'auto',
                    imageAspectRatio: '1:1',
                    imageCropFocus: 'top',
                    presetCorrectionPrompt: xssVector,
                    activeSessionId: sess.id,
                    sessions: [sess],
                },
                sillyimages: {
                    enabled: true,
                    apiType: 'openai',
                    endpoint: 'https://api.example.com/v1',
                    apiKey: 'sk-test',
                    model: xssVector,
                    profiles: [{ id: xssVector, name: xssVector }],
                    styles: [{ id: xssVector, name: xssVector, prompt: 'art' }],
                },
            },
        });

        assert.equal(safeImgSrc('javascript:alert(1)'), '');
        assert.equal(safeImgSrc('data:image/svg+xml;base64,PHN2Zz4='), '');

        state.settingsDrawerOpen = true;
        state.intakeSheetOpen = true;
        state.lastOverwriteAlert = { code: xssVector, message: xssVector, backupId: xssVector, targetAvatar: xssVector };

        for (const tab of ['swipe', 'matches', 'blitz', 'create', 'editor']) {
            state.activeTab = tab;
            renderWindow();
            const html = winContainer.innerHTML;
            assert.equal(html.includes('<script>evil()</script>'), false, `Raw <script> leaked in tab ${tab}`);
            assert.equal(html.includes('<style>body{display:none}</style>'), false, `Raw <style> leaked in tab ${tab}`);
            assert.equal(html.includes('onerror="window.__xss=1"'), false, `Raw onerror handler leaked in tab ${tab}`);
            assert.equal(html.includes('javascript:alert(1)'), false, `javascript: src leaked in tab ${tab}`);
            assert.equal(html.includes('data:image/svg+xml'), false, `SVG data URL leaked in tab ${tab}`);
        }

        // Also verify external card modification conflict blocks blind overwrite unless explicitly confirmed
        const origFetch = globalThis.fetch;
        try {
            const harness = await createMockTavernHarness();
            harness.seedRichCard('ConflictChar.png');
            globalThis.fetch = harness.fetchHandler;
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('ConflictChar.png');
            const editorCard = createCardStateFromTavernChar(fullChar);
            editorCard.description = 'My local edit';
            markCardFieldDirty(editorCard, 'description');

            // Simulate concurrent modification in SillyTavern after loading into editor
            harness.diskCards.get('ConflictChar.png').cardJson.scenario = 'Changed externally in ST!';
            harness.diskCards.get('ConflictChar.png').cardJson.data.scenario = 'Changed externally in ST!';

            await assert.rejects(
                () => updateExistingCardInTavern(editorCard, { avatarFileName: 'ConflictChar.png' }),
                (err) => err.code === 'EXTERNAL_CARD_MODIFIED'
            );

            // With explicit user confirmation (allowExternalChangeOverride: true), merges cleanly without losing external scenario!
            const confirmed = await updateExistingCardInTavern(editorCard, {
                avatarFileName: 'ConflictChar.png',
                allowExternalChangeOverride: true,
            });
            assert.equal(confirmed.updatedChar.description, 'My local edit');
            assert.equal(confirmed.updatedChar.scenario, 'Changed externally in ST!');
        } finally {
            globalThis.fetch = origFetch;
        }
    } finally {
        state.settingsDrawerOpen = false;
        state.intakeSheetOpen = false;
        state.lastOverwriteAlert = null;
        globalThis.document = origDoc;
        globalThis.CSS = origCss;
        globalThis.indexedDB = origIdb;
        setTestTavernContext(null);
    }
});

// ============================================================================
// AUDIT #3 REGRESSION SUITES (P1-01, P1-02, P1-03, P2-01 + Mutated-Then-500)
// ============================================================================

test('Audit #3 P1-01 Regression: Restore from Backup Vault enforces snapshot conflict check by default (0 writes on external edit) until explicit force override', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();
    clearMemoryVaultForTests({ closeDb: true });

    try {
        const harness = await createMockTavernHarness();
        harness.seedRichCard('Seraphina.png');
        globalThis.fetch = harness.fetchHandler;
        setTestTavernContext({
            getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
        });

        const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
        const card = createCardStateFromTavernChar(fullChar);
        card.description = 'First saved update creating Backup A.';
        markCardFieldDirty(card, 'description');

        const saveRes = await updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' });
        const backupId = saveRes.backup.id;
        const postSaveHash = card.sourceSnapshotHash;

        // External process / second tab modifies chat AND third-party extension AFTER backup A
        const diskJson = harness.diskCards.get('Seraphina.png').cardJson;
        diskJson.chat = 'Seraphina - NEW_EXTERNAL_CHAT_2026';
        diskJson.data.extensions.third_party_tracker = { affection: 99, flags: ['new_external_progress'] };

        harness.requestLog.length = 0;

        // Default restore (even WITHOUT expectedSnapshotHash, or WITH postSaveHash) MUST block with 0 writes!
        for (const hashArg of [postSaveHash, '']) {
            await assert.rejects(
                () => restoreCardFromBackupVault(backupId, { expectedSnapshotHash: hashArg, allowExternalChangeOverride: false }),
                (err) => {
                    assert.equal(err.code, 'EXTERNAL_CARD_MODIFIED');
                    assert.ok(Array.isArray(err.changedFields) && err.changedFields.includes('chat'));
                    return true;
                }
            );
        }

        const writeAttempts = harness.requestLog.filter((r) =>
            ['/api/characters/edit-avatar', '/api/characters/merge-attributes', '/api/characters/edit'].includes(r.url)
        );
        assert.equal(writeAttempts.length, 0, 'P1-01: ZERO write POSTs before user explicitly resolves conflict');
        assert.equal(harness.diskCards.get('Seraphina.png').cardJson.chat, 'Seraphina - NEW_EXTERNAL_CHAT_2026');

        // Explicit force restore after user confirmation restores original Backup A cleanly
        const forced = await restoreCardFromBackupVault(backupId, { allowExternalChangeOverride: true });
        assert.equal(forced.restoredChar.description, 'Original rich description of Seraphina.');
        assert.equal(forced.restoredChar.chat, 'Seraphina - 2026-10-11@19h30m00s');
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        clearMemoryVaultForTests({ closeDb: true });
        setTestTavernContext(null);
    }
});

test('Audit #3 P1-02 Regression: Newly uploaded/generated portraits survive reload when IndexedDB fails (open denied / QuotaExceededError) while enforcing strict emergency cap', async () => {
    const origIdb = globalThis.indexedDB;
    try {
        for (const mode of [
            { name: 'indexedDB.open denied', opts: { failOpen: true } },
            { name: 'QuotaExceededError on write', opts: { quotaFailAfterWrites: 0 } },
        ]) {
            globalThis.indexedDB = createMockIndexedDb(mode.opts);
            clearMemoryVaultForTests({ closeDb: true });

            const sess = createDefaultSession(1);
            const editorPortraitUrl = 'data:image/png;base64,' + Buffer.from(`NEW_EDITOR_ART_${mode.name}`).toString('base64');
            const candPortraitUrl = 'data:image/png;base64,' + Buffer.from(`NEW_CAND_ART_${mode.name}`).toString('base64');

            sess.tinder.queue.push({ id: 'cand_new_1', name: 'Nova', avatarId: '', avatarDataUrl: '' });

            const edRes = await assignEntityMediaWithFallback(sess.card, editorPortraitUrl);
            const cdRes = await assignEntityMediaWithFallback(sess.tinder.queue[0], candPortraitUrl);

            assert.equal(edRes.durable, false);
            assert.equal(edRes.keptInlineFallback, true);
            assert.equal(cdRes.durable, false);
            assert.equal(cdRes.keptInlineFallback, true);

            const extStore = {
                st_nexus_match_forge: {
                    settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
                    theme: 'krakoa',
                    activeSessionId: sess.id,
                    sessions: [sess],
                },
            };
            setTestTavernContext({
                extensionSettings: extStore,
                saveSettingsDebounced: () => {},
            });

            saveSettings();

            // Simulate full browser reload (wipe RAM completely, keep only serialized settings.json)
            const diskJson = JSON.stringify(extStore.st_nexus_match_forge);
            clearMemoryVaultForTests({ closeDb: true });

            const reloaded = JSON.parse(diskJson);
            assert.equal(resolveEntityAvatarUrl(reloaded.sessions[0].card), editorPortraitUrl, `${mode.name}: Editor portrait survived reload`);
            assert.equal(resolveEntityAvatarUrl(reloaded.sessions[0].tinder.queue[0]), candPortraitUrl, `${mode.name}: Candidate portrait survived reload`);
        }

        // Verify strict emergency cap prevents unbounded settings.json bloat if user generates 15 portraits with broken IDB
        globalThis.indexedDB = createMockIndexedDb({ failOpen: true });
        clearMemoryVaultForTests({ closeDb: true });
        const capSess = createDefaultSession(1);
        await assignEntityMediaWithFallback(capSess.card, 'data:image/png;base64,MAIN_EDITOR');
        for (let i = 0; i < 14; i++) {
            const c = { id: `c_${i}`, name: `C${i}`, avatarId: '', avatarDataUrl: '' };
            await assignEntityMediaWithFallback(c, `data:image/png;base64,CAND_${i}`);
            capSess.tinder.liked.push(c);
        }
        const budget = enforceEmergencyInlineBudget([capSess], capSess.id);
        assert.equal(budget.keptCount, MAX_EMERGENCY_INLINE_ITEMS, 'Emergency inline buffer strictly capped');
        assert.ok(budget.evictedCount >= 7, 'Excess emergency items evicted to protect settings.json');
        assert.equal(resolveEntityAvatarUrl(capSess.card), 'data:image/png;base64,MAIN_EDITOR', 'Active editor card prioritized first');
    } finally {
        globalThis.indexedDB = origIdb;
        clearMemoryVaultForTests({ closeDb: true });
        setTestTavernContext(null);
    }
});

test('Audit #3 P1-03 & Mutated-Then-500 Regression: Restore preserves embedded character_book distinct from world, removes extra keys, surfaces PARTIAL_RESTORE, and detects hidden server mutation on HTTP 500', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();
    clearMemoryVaultForTests({ closeDb: true });

    try {
        // 1. Embedded character_book distinct from external 'world' on BOTH /merge-attributes AND legacy 404 -> /edit fallback!
        for (const forceEditFallback of [false, true]) {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            const seeded = structuredClone(harness.seedRichCard('Seraphina.png'));
            // Explicitly ensure character_book differs from 'CathedralWorld'
            harness.diskCards.get('Seraphina.png').cardJson.data.character_book = {
                name: 'PRIVATE_EMBEDDED_BOOK_DO_NOT_OVERWRITE',
                entries: [{ id: 42, keys: ['secret'], content: 'Unique embedded lore.' }],
            };
            seeded.data.character_book = structuredClone(harness.diskCards.get('Seraphina.png').cardJson.data.character_book);

            globalThis.fetch = async (url, init = {}) => {
                if (forceEditFallback && String(url) === '/api/characters/merge-attributes') {
                    return new Response('Missing route', { status: 404 });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Modified description + temporary extension key';
            markCardFieldDirty(card, 'description');

            const upd = await updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' });
            // Inject an extra extension key that did NOT exist in backup
            harness.diskCards.get('Seraphina.png').cardJson.data.extensions.temp_added_plugin = { foo: 'bar' };

            const restored = await restoreCardFromBackupVault(upd.backup.id, { allowExternalChangeOverride: true });
            assert.deepEqual(
                restored.rawCardObject.data.character_book,
                seeded.data.character_book,
                `character_book must match backup 100% (fallback=${forceEditFallback})`
            );
            assert.equal(restored.rawCardObject.data.extensions.world, 'CathedralWorld');
            if (!forceEditFallback) {
                assert.equal(
                    'temp_added_plugin' in restored.rawCardObject.data.extensions,
                    false,
                    '__@@UNSET@@__ sentinel removes keys absent from backup'
                );
            }
        }

        // 2. PARTIAL_RESTORE when /edit-avatar -> 200 and JSON restore -> 500
        {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            harness.seedRichCard('Seraphina.png');
            globalThis.fetch = harness.fetchHandler;
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Trigger backup';
            markCardFieldDirty(card, 'description');
            const upd = await updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' });

            globalThis.fetch = async (url, init = {}) => {
                if (String(url) === '/api/characters/merge-attributes') {
                    return new Response('Server failed during restore merge', { status: 500 });
                }
                return harness.fetchHandler(url, init);
            };

            await assert.rejects(
                () => restoreCardFromBackupVault(upd.backup.id, { expectedSnapshotHash: card.sourceSnapshotHash }),
                (err) => {
                    assert.equal(err.code, 'PARTIAL_RESTORE');
                    assert.equal(err.avatarRestored, true);
                    assert.equal(err.fieldsRestored, false);
                    return true;
                }
            );
        }

        // 3. Fault injection: server mutates disk on step 1, THEN returns HTTP 500 -> readback detects mutation & rolls back!
        {
            clearMemoryVaultForTests({ closeDb: false });
            const harness = await createMockTavernHarness();
            const origSeeded = structuredClone(harness.seedRichCard('Seraphina.png'));
            let failOnceAfterMutating = true;

            globalThis.fetch = async (url, init = {}) => {
                if (String(url) === '/api/characters/merge-attributes' && failOnceAfterMutating) {
                    failOnceAfterMutating = false;
                    await harness.fetchHandler(url, init); // Mutate disk first!
                    return new Response('Connection reset after disk write', { status: 500 });
                }
                return harness.fetchHandler(url, init);
            };
            setTestTavernContext({
                getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
            });

            const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
            const card = createCardStateFromTavernChar(fullChar);
            card.description = 'Mutated before 500';
            markCardFieldDirty(card, 'description');

            await assert.rejects(
                () => updateExistingCardInTavern(card, { avatarFileName: 'Seraphina.png' }),
                (err) => {
                    assert.equal(err.code, 'PARTIAL_SAVE');
                    assert.equal(err.rolledBack, true);
                    return true;
                }
            );
            assert.equal(harness.diskCards.get('Seraphina.png').cardJson.description, origSeeded.description);
        }
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        clearMemoryVaultForTests({ closeDb: true });
        setTestTavernContext(null);
    }
});

test('Audit #3 P2-01 Regression: clear-avatar writes verified monogram placeholder PNG (alone & with description) and detects silent server no-op', async () => {
    const origFetch = globalThis.fetch;
    const origIdb = globalThis.indexedDB;
    globalThis.indexedDB = createMockIndexedDb();
    clearMemoryVaultForTests({ closeDb: true });

    try {
        const harness = await createMockTavernHarness();
        harness.seedRichCard('Seraphina.png');
        // Seed distinct colorful custom PNG bytes on original card
        const customPhotoPng = await ensurePngBytes('', 'CUSTOM_OLD_PHOTO', '#ff0055');
        harness.diskCards.get('Seraphina.png').pngBytes = embedCharaChunkIntoPng(
            customPhotoPng,
            harness.diskCards.get('Seraphina.png').cardJson
        );
        const origVisual = stripPngCharaChunkBytes(harness.diskCards.get('Seraphina.png').pngBytes);

        globalThis.fetch = harness.fetchHandler;
        setTestTavernContext({
            getRequestHeaders: ({ omitContentType } = {}) => (omitContentType ? {} : { 'Content-Type': 'application/json' }),
        });

        // 1. Standalone clear-avatar ONLY
        const { fullChar } = await fetchFullTavernCharacter('Seraphina.png');
        const card = createCardStateFromTavernChar(fullChar, { avatarId: 'nmf_img_old' });
        card.avatarId = '';
        card.avatarDataUrl = '';
        card.avatarDirty = true;

        const resAlone = await updateExistingCardInTavern(card, {
            avatarFileName: 'Seraphina.png',
            avatarDataUrl: '',
            accentHex: '#1de9b6',
        });
        assert.equal(resAlone.noop, false);
        assert.equal(card.avatarDirty, false);
        const afterVisual1 = stripPngCharaChunkBytes(harness.diskCards.get('Seraphina.png').pngBytes);
        assert.notDeepEqual(afterVisual1, origVisual, 'clear-avatar alone must replace PNG pixels with clean placeholder');

        // 2. clear-avatar + description together
        harness.diskCards.get('Seraphina.png').pngBytes = embedCharaChunkIntoPng(
            customPhotoPng,
            harness.diskCards.get('Seraphina.png').cardJson
        );
        const { fullChar: fc2 } = await fetchFullTavernCharacter('Seraphina.png');
        const card2 = createCardStateFromTavernChar(fc2, { avatarId: 'nmf_img_old2' });
        card2.avatarId = '';
        card2.avatarDataUrl = '';
        card2.avatarDirty = true;
        card2.description = 'Cleared avatar + updated bio';
        markCardFieldDirty(card2, 'description');

        await updateExistingCardInTavern(card2, {
            avatarFileName: 'Seraphina.png',
            avatarDataUrl: '',
            accentHex: '#1de9b6',
        });
        const afterVisual2 = stripPngCharaChunkBytes(harness.diskCards.get('Seraphina.png').pngBytes);
        assert.notDeepEqual(afterVisual2, origVisual, 'clear-avatar + description must update PNG pixels');
        assert.equal(harness.diskCards.get('Seraphina.png').cardJson.description, 'Cleared avatar + updated bio');

        // 3. Server silently ignores /edit-avatar (returns 200 without updating PNG) -> caught as INTEGRITY_CHECK_FAILED!
        harness.diskCards.get('Seraphina.png').pngBytes = embedCharaChunkIntoPng(
            customPhotoPng,
            harness.diskCards.get('Seraphina.png').cardJson
        );
        globalThis.fetch = async (url, init = {}) => {
            if (String(url) === '/api/characters/edit-avatar') {
                return new Response('Silent no-op', { status: 200 });
            }
            return harness.fetchHandler(url, init);
        };

        const { fullChar: fc3 } = await fetchFullTavernCharacter('Seraphina.png');
        const card3 = createCardStateFromTavernChar(fc3);
        card3.avatarId = '';
        card3.avatarDataUrl = '';
        card3.avatarDirty = true;

        await assert.rejects(
            () => updateExistingCardInTavern(card3, { avatarFileName: 'Seraphina.png', avatarDataUrl: '', accentHex: '#1de9b6' }),
            (err) => err.code === 'INTEGRITY_CHECK_FAILED'
        );
        assert.equal(card3.avatarDirty, true, 'avatarDirty must NOT clear when server failed to apply new PNG');
    } finally {
        globalThis.fetch = origFetch;
        globalThis.indexedDB = origIdb;
        clearMemoryVaultForTests({ closeDb: true });
        setTestTavernContext(null);
    }
});

test('Lossless 4K Pipeline: Zero image compression, no WebP/896px downscaling in code, and bit-exact 4K PNG pass-through', async () => {
    const entrySrc = fs.readFileSync(path.join(REPO_ROOT, 'nmf_entry.js'), 'utf8');
    assert.equal(entrySrc.includes('image/webp'), false, 'Extension must NEVER re-encode user photos to lossy WebP');
    assert.equal(entrySrc.includes('compressImageFileToDataUrl'), false, 'Legacy 896px downscaler must be completely removed');

    // Construct a structurally valid 3072x4096 (4K portrait, 3:4) PNG header + IDAT + IEND and verify bit-for-bit pass-through
    const pngBase = await ensurePngBytes('', '4K_PROBE', '#1de9b6');
    const hiResPng = new Uint8Array(pngBase);
    // Patch IHDR width = 3072 (0x00000C00), height = 4096 (0x00001000) and recompute IHDR CRC isn't needed by structural check,
    // verify exact byte equality on both 'native' and matching '3:4' aspect ratio!
    hiResPng[16] = 0x00; hiResPng[17] = 0x00; hiResPng[18] = 0x0c; hiResPng[19] = 0x00;
    hiResPng[20] = 0x00; hiResPng[21] = 0x00; hiResPng[22] = 0x10; hiResPng[23] = 0x00;
    const hiResDataUrl = 'data:image/png;base64,' + Buffer.from(hiResPng).toString('base64');

    const outNative = await ensurePngBytes(hiResDataUrl, 'Hero', '#1de9b6', { aspectRatio: 'native' });
    const outMatching34 = await ensurePngBytes(hiResDataUrl, 'Hero', '#1de9b6', { aspectRatio: '3:4', cropFocus: 'top' });

    assert.deepEqual(outNative, hiResPng, 'Native mode preserves 100% bit-identical 3072x4096 PNG bytes');
    assert.deepEqual(outMatching34, hiResPng, 'Matching 3:4 mode bypasses canvas and preserves 100% bit-identical 3072x4096 PNG bytes');
});

test('v1.5.0 UX Upgrade: Modal-safe triggerDownload inside <dialog>, pure art blob, selectable Blitz count, Zero-Anachronism AU Quiz, and single unified visualizer', async () => {
    // 1. Selectable Blitz count (e.g. 15 questions instead of hardcoded 10)
    const sess = createDefaultSession(1);
    sess.blitz.questionCount = 15;
    const blitzReq = buildBlitzQuestionsRequest(sess, -1, 'prefill_user_msg');
    assert.ok(blitzReq.user.includes('Generate 15 '), 'Blitz request must honor selected questionCount = 15');

    // 2. AU Adaptation Quiz + Zero-Anachronism Rework prompt with user answers (King -> 1940s Mafia)
    sess.rework.targetSettingEra = '1940s Chicago Mafia';
    sess.rework.questionCount = 7;
    const kingSource = {
        name: 'King Aldric',
        description: 'Medieval king surrounded by forest druids and wielding a runed battle-axe.',
        personality: 'Cold, commanding, loyal to his inner circle.',
        scenario: 'Throne room war council.',
    };
    const auQReq = buildAuReworkQuestionsRequest(sess, kingSource, -1, 'prefill_user_msg');
    assert.ok(auQReq.user.includes('Generate 7 sharp, concrete AU adaptation question(s)'));
    assert.ok(auQReq.user.includes('1940s Chicago Mafia'));

    sess.rework.questions = [
        {
            id: 'auq_1',
            question: 'Во что превратим совет друидов и боевой топор?',
            options: [],
            answer: 'Друиды — теневые консильери и подкупленные судьи; топор — гравированный Томми-ган в футляре от скрипки.',
            skipped: false,
        },
    ];
    const rwReq = buildReworkCardRequest(sess, kingSource, 'prefill_user_msg');
    assert.ok(rwReq.user.includes('ZERO ANACHRONISMS & TOTAL WORLD TRANSLATION LAW'));
    assert.ok(rwReq.user.includes('Томми-ган в футляре от скрипки'));

    // 3. Pure artwork blob extraction for Lightbox download
    const samplePng = await ensurePngBytes('', 'ART', '#e62e45');
    const sampleUrl = 'data:image/png;base64,' + Buffer.from(samplePng).toString('base64');
    const pure = dataUrlToPureBlob(sampleUrl);
    assert.equal(pure.ext, 'png');
    assert.equal(pure.blob.size, samplePng.byteLength);

    // 4. Modal-safe triggerDownload appends inside #nmf-dialog (not inert document.body)
    const origDoc = globalThis.document;
    let appendedInsideDialog = false;
    let clickedAnchor = false;
    try {
        const mockDialog = {
            appendChild: (el) => {
                appendedInsideDialog = el.download === 'Gojo.png';
            },
        };
        globalThis.document = {
            getElementById: (id) => (id === 'nmf-dialog' ? mockDialog : null),
            querySelector: () => mockDialog,
            body: { appendChild: () => { throw new Error('Must NOT append to inert document.body when #nmf-dialog exists!'); } },
            createElement: () => ({
                style: {},
                click: () => { clickedAnchor = true; },
                remove: () => {},
            }),
        };
        const ok = triggerDownload(pure.blob, 'Gojo.png');
        assert.equal(ok, true);
        assert.equal(appendedInsideDialog, true);
        assert.equal(clickedAnchor, true);
    } finally {
        globalThis.document = origDoc;
    }
});

test('v1.7.0 Dual Languages (User Preview/Notes vs AI Card) & Strict Card Meta-Purity', () => {
    const migrated = normalizeAndMigrateSettings({
        settingsSchemaVersion: 2,
        sessions: [
            {
                id: 's_legacy',
                title: 'Legacy',
                intake: { userLanguage: '{{Русский}}', cardLanguage: '{{English}}' },
            },
        ],
    });
    const mIntake = migrated.settings.sessions[0].intake;
    // Accidental braces around plain language names are unwrapped automatically!
    assert.equal(mIntake.userLanguage, 'Русский');
    assert.equal(mIntake.cardLanguage, 'English');

    const sess = createDefaultSession(1);
    sess.intake.userLanguage = 'Русский';
    sess.intake.cardLanguage = 'English';

    assert.equal(resolveUserLanguageSpec(sess.intake).shortLabel, 'Русский');
    assert.equal(resolveCardLanguageSpec(sess.intake).shortLabel, 'English');

    const blitzReq = buildBlitzQuestionsRequest(sess, -1, 'prefill_user_msg');
    assert.ok(blitzReq.user.includes('Русский'), 'Blitz questions must use userLanguage');

    // Swipe previews are read by the user -> Русский, while AI card fields -> English, and Creator Notes -> Русский!
    const swipeReq = buildTinderPreviewRequest(sess, 1, 'prefill_user_msg');
    assert.ok(swipeReq.user.includes('Preview Display Language (for name, archetype, pitch, looks, quote, tags — read by the user): Русский'));

    const fullReq = buildFullCardRequest(sess, 'Test hero', 'prefill_user_msg');
    assert.ok(fullReq.user.includes('Target Output Language for AI Card Fields (Description, Personality, Scenario, First Message, Dialogue): English'));
    assert.ok(fullReq.user.includes('Target Language for Human-Facing Creator Notes & Summaries: Русский'));
    assert.equal(fullReq.user.includes('[[NMF_DESC]]Full Description[[/NMF_DESC]]'), true);
    assert.ok(fullReq.user.includes('META-PURITY LAW'));

    const pollutedLlmOutput = [
        '[[NMF_NAME]]Kaelen Vance [5\u2605 SSR][[/NMF_NAME]]',
        '[[NMF_DESC]]Ruthless syndicate strategist under neon rain.\n(Word count: 612 words)\nRarity: SSR[[/NMF_DESC]]',
        '[[NMF_PERSONALITY]]Cold humor, observant (45 words)[[/NMF_PERSONALITY]]',
        '[[NMF_SCENARIO]]Midnight docks.[[/NMF_SCENARIO]]',
        '[[NMF_FIRST_MES]]He flips a silver lighter in the rain. [~280 words][[/NMF_FIRST_MES]]',
        '[[NMF_TAGS]]mafia, scar, 5\u2605, SSR, 600 words, rain[[/NMF_TAGS]]',
        '[[NMF_IMG_PROMPT]]SCENE: Chest-up three-quarter portrait...[[/NMF_IMG_PROMPT]]',
    ].join('\n');

    const parsed = parseFullCardResponse(pollutedLlmOutput, 'prefill_user_msg', 'macro');
    assert.equal(parsed.name, 'Kaelen Vance');
    assert.equal(parsed.description.includes('Word count'), false);
    assert.equal(parsed.description.includes('Rarity:'), false);
    assert.equal(parsed.personality.includes('45 words'), false);
    assert.equal(parsed.first_mes.includes('280 words'), false);
    assert.equal(parsed.tags, 'mafia, scar, rain');
    assert.equal(sanitizeCardMetaPollution('Stars shone in the night sky.'), 'Stars shone in the night sky.');
});

test('v1.7.0 Honest 1-5 Star External Randomizer (Preserving Role & Looks), Sacrifice & Alchemy Fusion', () => {
    const tags = parseGachaPlusTags('босс мафии + шрам + холодный юмор + дождь');
    assert.deepEqual(tags, ['босс мафии', 'шрам', 'холодный юмор', 'дождь']);

    // Honest 1-5 distribution: high rng (0.95) -> 1 star, mid (0.20) -> 3 stars, ultra-low (0.01) -> 5 stars
    const seq = [0.95, 0.20, 0.01];
    let i = 0;
    const roll = rollGachaCycleRarities(3, 0, () => seq[i++], { maxCycleLimit: 10, startPitySince4Plus: 0 });
    assert.deepEqual(roll.rarities, [1, 3, 5]);
    assert.equal(roll.nextCycleCount, 3);

    // 10th consecutive pull without 4+ guarantees 4+ star
    const pityRoll = rollGachaCycleRarities(1, 9, () => 0.99, { maxCycleLimit: 10, startPitySince4Plus: 9 });
    assert.equal(pityRoll.rarities[0] >= 4, true);
    assert.equal(pityRoll.hitCycleCap, true);

    // Sacrifice charges: 1 star -> +1 reset, 2 stars -> +2 resets, 5 stars -> +5 resets
    assert.equal(computeSacrificeResetGain(1), 1);
    assert.equal(computeSacrificeResetGain(2), 2);
    assert.equal(computeSacrificeResetGain(5), 5);

    const sess = createDefaultSession(1);
    const sumReq = buildGachaSummonRequest(sess, tags, [1, 5], 'prefill_user_msg');
    assert.ok(sumReq.user.includes('NEVER downgrade their appearance or strip their requested title!'));
    assert.ok(sumReq.user.includes('APEX / HYPER-OP SCALE'));

    const rawDrops = [
        '[[NMF_DROP]]',
        '[[NMF_D_NAME]]Рико Веронезе, 26[[/NMF_D_NAME]]',
        '[[NMF_D_EPITHET]]Босс Тупиковой Аллеи[[/NMF_D_EPITHET]]',
        '[[NMF_D_ARCHETYPE]]Главарь мелкой уличной банды из 4 человек[[/NMF_D_ARCHETYPE]]',
        '[[NMF_D_PITCH]]Бедный, но дерзкий босс крошечной шайки с холодным юмором.[[/NMF_D_PITCH]]',
        '[[NMF_D_LOOKS]]Острый взгляд, шрам на брови и плащ под дождём.[[/NMF_D_LOOKS]]',
        '[[NMF_D_QUOTE]]В этом переулке главный всё ещё я.[[/NMF_D_QUOTE]]',
        '[[NMF_D_TAGS]]мафия, шрам, дождь[[/NMF_D_TAGS]]',
        '[[NMF_D_IMG]]SCENE: Three-quarter portrait...[[/NMF_D_IMG]]',
        '[[/NMF_DROP]]',
        '[[NMF_DROP]]',
        '[[NMF_D_NAME]]Данте Моретти, 36[[/NMF_D_NAME]]',
        '[[NMF_D_EPITHET]]Император Дождливых Доков[[/NMF_D_EPITHET]]',
        '[[NMF_D_ARCHETYPE]]Абсолютный владыка международного синдиката[[/NMF_D_ARCHETYPE]]',
        '[[NMF_D_PITCH]]Вершит судьбы целых городов одним росчерком пера.[[/NMF_D_PITCH]]',
        '[[NMF_D_LOOKS]]Высокий брюнет со шрамом через бровь.[[/NMF_D_LOOKS]]',
        '[[NMF_D_QUOTE]]Зонт тебе не поможет.[[/NMF_D_QUOTE]]',
        '[[NMF_D_TAGS]]синдикат, власть, дождь[[/NMF_D_TAGS]]',
        '[[NMF_D_IMG]]SCENE: Low-angle waist-up portrait...[[/NMF_D_IMG]]',
        '[[/NMF_DROP]]',
    ].join('\n');

    const drops = parseGachaSummonResponse(rawDrops, [1, 5], tags, 'macro');
    assert.equal(drops[0].stars, 1);
    assert.equal(drops[1].stars, 5);

    const fused = parseGachaFusionResponse(
        '[[NMF_DROP]][[NMF_D_NAME]]Юлиан Кроу, 31[[/NMF_D_NAME]][[NMF_D_EPITHET]]Арбитр Полуночи[[/NMF_D_EPITHET]][[NMF_D_ARCHETYPE]]Теневой посредник[[/NMF_D_ARCHETYPE]][[NMF_D_PITCH]]Новая цельная личность.[[/NMF_D_PITCH]][[NMF_D_LOOKS]]Серебристые пряди.[[/NMF_D_LOOKS]][[NMF_D_QUOTE]]Сделка закрыта.[[/NMF_D_QUOTE]][[NMF_D_TAGS]]нуар, арбитр[[/NMF_D_TAGS]][[NMF_D_IMG]]SCENE: Portrait...[[/NMF_D_IMG]][[/NMF_DROP]]',
        drops,
        'macro',
    );
    assert.equal(fused.stars >= 3, true);
    assert.deepEqual(fused.fusedFromNames, ['Рико Веронезе', 'Данте Моретти']);
});

test('v1.6.0 SillyImages v3.0.0-beta.1 Read-Only Appearance References & Gemini 2.5/3.1 + xAI /edits Parity', async () => {
    const samplePng = await ensurePngBytes('', 'REF', '#1de9b6');
    const refDataUrl = 'data:image/png;base64,' + Buffer.from(samplePng).toString('base64');

    const siV3Settings = {
        enabled: true,
        apiType: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com',
        apiKey: 'gem-key-123',
        model: 'gemini-2.5-flash-image',
        aspectRatio: '1:1',
        imageSize: '2K',
        refInstructionEnabled: true,
        sendRefDescriptions: true,
        lorebooks: [
            {
                id: 'lb_canon',
                name: 'JJK Refs',
                enabled: true,
                refs: [
                    {
                        id: 'r_gojo',
                        name: 'Gojo Satoru, Годжо',
                        description: 'white hair, six eyes, blindfold',
                        imagePath: refDataUrl,
                        enabled: true,
                        priority: 10,
                    },
                ],
            },
        ],
        characterReferenceLibrary: {
            characters: {
                'avatar:astarion.png': {
                    displayName: 'Astarion',
                    primary: { enabled: true, imagePath: refDataUrl, description: 'silver curls, crimson eyes' },
                    appearanceItems: [],
                },
            },
        },
    };
    const beforeSnapshot = JSON.stringify(siV3Settings);

    setTestTavernContext({
        extensionSettings: {
            inline_image_gen: siV3Settings,
            disabledExtensions: [],
        },
    });

    const catalog = listSillyImagesReferenceCatalog('auto');
    assert.equal(catalog.length, 2);
    const matched = matchSillyImagesReferencesByText('auto', 'Portrait of Годжо in 1940s suit');
    assert.equal(matched.length, 1);
    assert.equal(matched[0].description, 'white hair, six eyes, blindfold');

    const origFetch = globalThis.fetch;
    let capturedUrl = '';
    let capturedBody = null;
    try {
        globalThis.fetch = async (url, init) => {
            capturedUrl = String(url);
            capturedBody = JSON.parse(init.body);
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from(samplePng).toString('base64') } }] } }],
            }), { status: 200 });
        };

        const out = await generateCharacterPortrait('1940s noir portrait', {
            imageSource: 'inline_image_gen',
            aspectRatio: '1:1',
            refMode: 'auto_lorebook',
            refMatchContext: 'Годжо',
        });
        assert.ok(out.startsWith('data:image/png;base64,'));
        assert.ok(capturedUrl.includes('gemini-2.5-flash-image:generateContent'));
        // gemini-2.5-flash-image MUST NOT receive imageSize (v3.0 capability rule!), while receiving inlineData ref!
        assert.equal(capturedBody.generationConfig.imageConfig.imageSize, undefined);
        assert.equal(capturedBody.generationConfig.imageConfig.aspectRatio, '1:1');
        assert.equal(capturedBody.contents[0].parts.some((p) => Boolean(p.inlineData?.data)), true);
        // Zero mutation of SillyImages settings!
        assert.equal(JSON.stringify(siV3Settings), beforeSnapshot);
    } finally {
        globalThis.fetch = origFetch;
        setTestTavernContext(null);
    }
});

test('v1.7.0 Preset Macro Leak Sanitizer, Flexible <ART_MECHANISM> (Group/Artifact/World), Negatives, Method Isolation & AI Translator', () => {
    // 1. Custom preset blocks with hardcoded {{description}}, {{personality}}, {{scenario}}, {{worldInfoBefore}} are scrubbed cleanly
    const dirtyPresetBlock = `You are an elite writer.\n<char_info>{{description}}\n{{personality}}</char_info>\n[Scenario: {{scenario}}]\n{{worldInfoBefore}}\nStay vivid!`;
    const cleanedBlock = stripActiveChatMacrosFromPresetBlock(dirtyPresetBlock);
    assert.equal(cleanedBlock.includes('{{description}}'), false);
    assert.equal(cleanedBlock.includes('{{personality}}'), false);
    assert.equal(cleanedBlock.includes('{{scenario}}'), false);
    assert.equal(cleanedBlock.includes('{{worldInfoBefore}}'), false);
    assert.ok(cleanedBlock.includes('You are an elite writer.'));
    assert.ok(cleanedBlock.includes('Stay vivid!'));

    // 2. Flexible <ART_MECHANISM> adapts to Duo/Group, Artifact/Object, and World without medium words
    const groupRule = buildFlexibleAvatarArtMechanismRule({ originType: 'duo_group' });
    assert.ok(groupRule.includes('FIGURE 1 (NAME):') && groupRule.includes('FIGURE 2 (NAME):') && groupRule.includes('INTERACTION:'));

    const objRule = buildFlexibleAvatarArtMechanismRule({ originType: 'artifact_object' });
    assert.ok(objRule.includes('CHARACTERS IN THE IMAGE: no.') && objRule.includes('OBJECT (NAME):'));

    // 3. Method Isolation: Architect ignores Tinder dislikes & Gacha tags; Blitz defaults Tinder=ON, Gacha=OFF
    const sess = createDefaultSession(1);
    sess.tinder.dislikedTags = ['вампиры'];
    sess.gacha.tagsInput = 'неон + дождь + катана';

    const archSummary = buildFullCardRequest(sess, 'Cyber detective', 'prefill_user_msg', { modeContext: 'architect' }).user;
    assert.equal(archSummary.includes('вампиры'), false, 'Architect must be isolated from Tinder dislikes');
    assert.equal(archSummary.includes('неон + дождь + катана'), false, 'Architect must be isolated from Gacha tags');

    const blitzDefault = buildBlitzQuestionsRequest(sess, -1, 'prefill_user_msg').user;
    assert.equal(blitzDefault.includes('вампиры'), false, 'Blitz never injects Tinder anti-tags');
    assert.equal(blitzDefault.includes('неон + дождь + катана'), false, 'Blitz excludes Gacha tags by default');

    // 4. AI Card Translator round-trip
    const trReq = buildCardTranslationRequest({ name: 'Vance', description: 'Cold boss.', first_mes: 'Hello.' }, 'Русский', 'prefill_user_msg');
    assert.ok(trReq.user.includes('CARD V2 TRANSLATION TASK -> Русский'));
    const trParsed = parseCardTranslationResponse(
        '[[NMF_NAME]]Вэнс[[/NMF_NAME]][[NMF_DESC]]Холодный босс.[[/NMF_DESC]][[NMF_FIRST_MES]]Привет.[[/NMF_FIRST_MES]]',
        { name: 'Vance' },
        'Русский',
        'macro',
    );
    assert.equal(trParsed.lang, 'Русский');
    assert.equal(trParsed.name, 'Вэнс');
    assert.equal(trParsed.description, 'Холодный босс.');
});

test('v1.7.1 Real Tinder/Gacha -> Blitz Character Selection, Fast Blob Display URLs, Zero Blur & Aspect-Aware Grid', async () => {
    const sess = createDefaultSession(1);
    sess.tinder.liked = [
        {
            id: 'cand_lev',
            name: 'Лев Джонсон, 32',
            archetype: 'Хладнокровный детектив убойного отдела',
            pitch: 'Скрывает улику старого дела за пачкой дешёвых сигарет.',
            appearance: 'Высокий, шрам на скуле, серое пальто.',
            tags: ['детектив', 'нуар'],
            imagePrompt: 'SCENE: Rainy alley...',
        },
    ];
    sess.gacha.collection = [
        {
            id: 'gacha_garran',
            name: 'Garran, 36',
            stars: 4,
            epithet: 'Cinder-Crowned Crucible Warden',
            pitch: 'Undefeated pit-warden.',
            appearance: 'Towering scarred bear-warrior.',
            tags: ['warden'],
        },
    ];

    // 1. Default Blitz selects liked Tinder hero ("Лев Джонсон, 32") and excludes Gacha while useGachaContext=false
    const candsTinderOnly = listBlitzSelectableCandidates(sess);
    assert.equal(candsTinderOnly.length, 1);
    assert.equal(candsTinderOnly[0].entity.name, 'Лев Джонсон, 32');

    const seed1 = resolveBlitzSeedCandidate(sess);
    assert.equal(seed1?.entity.name, 'Лев Джонсон, 32');

    const blitzPromptLev = buildBlitzQuestionsRequest(sess, -1, 'prefill_user_msg').user;
    assert.ok(blitzPromptLev.includes('[SELECTED CHARACTER SEED TO DEEPEN IN THIS BLITZ — MANDATORY SUBJECT]'));
    assert.ok(blitzPromptLev.includes('Лев Джонсон, 32'));
    assert.ok(blitzPromptLev.includes('Хладнокровный детектив убойного отдела'));

    // 2. Opting into Gacha exposes Gacha candidates too, and __none__ builds from scratch
    sess.blitz.useGachaContext = true;
    const candsBoth = listBlitzSelectableCandidates(sess);
    assert.equal(candsBoth.length, 2);

    sess.blitz.selectedCandidateRef = 'gacha:gacha_garran';
    assert.equal(resolveBlitzSeedCandidate(sess)?.entity.name, 'Garran, 36');

    sess.blitz.selectedCandidateRef = '__none__';
    assert.equal(resolveBlitzSeedCandidate(sess), null);

    // 3. Fast blob: display URL caching for multi-KB/MB images
    clearMemoryVaultForTests();
    const sampleB64 = 'data:image/png;base64,' + Buffer.alloc(6000, 65).toString('base64');
    const mediaId = await saveMediaDataUrl(sampleB64);
    const entity = { avatarId: mediaId };
    const disp1 = resolveEntityDisplayUrl(entity);
    const disp2 = resolveEntityDisplayUrl(entity);
    assert.ok(disp1.startsWith('blob:') || disp1.startsWith('data:image/png;base64,'));
    assert.equal(disp1, disp2, 'Display URL must hit cache on repeated clicks');
    assert.equal(resolveEntityAvatarUrl(entity), sampleB64, 'Lossless raw DataURL remains 100% intact for export');

    // 4. CSS & Entry checks: zero backdrop-filter blur, zero height:92% sheet double-frames, !important width lock, native/wide grid
    const cssSrc = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../modules/nmf_themes_and_icons.js'), 'utf8');
    const entrySrc = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../nmf_entry.js'), 'utf8');
    assert.equal(cssSrc.includes('backdrop-filter'), false, 'Zero GPU-heavy backdrop-filter blur layers allowed');
    assert.equal(entrySrc.includes('style="height:92%"'), false, 'Zero stacked 92% modal sheets creating double top frames');
    assert.ok(cssSrc.includes('nmf-ratio-native') && cssSrc.includes('nmf-ratio-wide'));
    assert.ok(cssSrc.includes('50% 6%'));
});

test('v1.7.2 Gacha Prayer Economy (Sacrifice -> +Wishes, Zero Timer Reset), Unresettable Global Cooldown & 13-Theme Rituals', async () => {
    const { NMF_THEMES } = await import('../modules/nmf_themes_and_icons.js');

    // 1. Every single one of the 13 themes has its own distinct sinister first-sacrifice warning with hero name & zero emojis
    const seenTitles = new Set();
    for (const th of NMF_THEMES) {
        assert.ok(THEMED_SACRIFICE_WARNINGS[th.id], `Missing sacrifice lore for theme ${th.id}`);
        const warn = getThemedSacrificeWarning(th.id, 'Тархан, 34', 4);
        assert.ok(warn.body.includes('Тархан, 34'));
        assert.equal(warn.wishGain, 4);
        assert.equal(/[\p{Extended_Pictographic}]/u.test(warn.title + warn.body), false);
        seenTitles.add(warn.title);
    }
    assert.equal(seenTitles.size, 13, 'All 13 theme warnings must have unique titles');

    // 2. Spending all 10 base wishes triggers 2h wall-clock cooldown; sacrificing grants +Wishes WITHOUT resetting cooldown!
    const t0 = 1_800_000_000_000;
    const wallet = createDefaultGachaWallet();
    const s1 = syncGachaWalletState(wallet, { maxCap: 10, timerEnabled: true, nowMs: t0 });
    assert.equal(s1.totalWishes, 10);
    assert.equal(s1.coolingDown, false);

    const spend10 = spendGachaWalletWishes(wallet, 5, { maxCap: 10, timerEnabled: true, cooldownMinutes: 120, nowMs: t0 });
    assert.equal(spend10.spentFree, 5);
    spendGachaWalletWishes(wallet, 5, { maxCap: 10, timerEnabled: true, cooldownMinutes: 120, nowMs: t0 + 1000 });

    const onCd = syncGachaWalletState(wallet, { maxCap: 10, timerEnabled: true, nowMs: t0 + 5000 });
    assert.equal(onCd.coolingDown, true);
    assert.equal(onCd.freeWishesLeft, 0);
    assert.equal(onCd.totalWishes, 0);
    const savedCooldownEnd = wallet.cooldownEndsAt;
    assert.equal(savedCooldownEnd, t0 + 1000 + 120 * 60 * 1000);

    // Sacrifice a 4-star card -> +4 bonusWishes; cooldownEndsAt MUST NOT reset!
    wallet.bonusWishes += computeSacrificeWishGain(4);
    const afterSac = syncGachaWalletState(wallet, { maxCap: 10, timerEnabled: true, nowMs: t0 + 10_000 });
    assert.equal(afterSac.coolingDown, true, '2h base cooldown continues ticking honestly');
    assert.equal(wallet.cooldownEndsAt, savedCooldownEnd, 'Cooldown timestamp never resets on sacrifice');
    assert.equal(afterSac.bonusWishes, 4);
    assert.equal(afterSac.totalWishes, 4, 'Player immediately gets +4 playable Wishes');

    // Player can immediately pull x3 using sacrificial bonusWishes during cooldown!
    const pullDuringCd = spendGachaWalletWishes(wallet, 3, { maxCap: 10, timerEnabled: true, cooldownMinutes: 120, nowMs: t0 + 20_000 });
    assert.equal(pullDuringCd.spentTotal, 3);
    assert.equal(pullDuringCd.spentFree, 0);
    assert.equal(pullDuringCd.spentBonus, 3);
    assert.equal(wallet.bonusWishes, 1);
    assert.equal(wallet.cooldownEndsAt, savedCooldownEnd);

    // After 2 hours pass (even with browser closed), 10 base wishes restore AND leftover +1 bonusWish stays!
    const after2h = syncGachaWalletState(wallet, { maxCap: 10, timerEnabled: true, nowMs: savedCooldownEnd + 1 });
    assert.equal(after2h.coolingDown, false);
    assert.equal(after2h.freeWishesLeft, 10);
    assert.equal(after2h.bonusWishes, 1);
    assert.equal(after2h.totalWishes, 11);

    // 3. Legacy v1.7.0 migration converts earned sacrifice resetCharges > 1 into real bonusWishes & keeps global cooldown
    const legacyCfg = {
        settingsSchemaVersion: 4,
        activeSessionId: 's3',
        sessions: [{
            id: 's3',
            title: 'Сессия 3',
            gacha: { cycleCount: 10, cooldownEndsAt: t0 + 999999, resetCharges: 6 },
        }],
    };
    const migrated = normalizeAndMigrateSettings(legacyCfg).settings;
    assert.equal(migrated.gachaWallet.bonusWishes, 5, '5 earned sacrifice charges convert to +5 real Wishes');
    assert.equal(migrated.gachaWallet.cooldownEndsAt, t0 + 999999);
});

test('v1.7.2 Dedicated Gacha Wish Questionnaire Isolation & Cross-Pool Anti-Clone Guard (No Duplicate Lion/Lev Johnson)', () => {
    const sess = createDefaultSession(3);
    // Tinder has Canon Warhammer 40k + Lion El'Jonson in Matches
    sess.intake.originType = 'canon';
    sess.intake.fandomName = 'Вархаммер 40к';
    sess.intake.favFandomHero = 'Лион Эль\'Джонсон';
    sess.intake.settingEra = 'Империум Нигилус 41к';
    sess.tinder.liked = [
        { id: 'c1', name: 'Лион Эль\'Джонсон, 10 000+', archetype: 'Примарх' },
        { id: 'c2', name: 'Лев Джонсон, 32', archetype: 'Детектив' },
    ];

    // Gacha wish with completely different tags ("кибер-хирург + неон + шрам")
    const gachaReq = buildGachaSummonRequest(sess, ['кибер-хирург', 'неон', 'шрам'], [4], 'prefill_user_msg');
    assert.equal(gachaReq.user.includes('Вархаммер 40к'), false, 'Tinder fandom must NEVER leak into Gacha');
    assert.equal(gachaReq.user.includes('Империум Нигилус'), false, 'Tinder setting must NEVER leak into Gacha');
    assert.ok(gachaReq.user.includes('[GACHA BANNER WISH PREFERENCES — 100% ISOLATED FROM MAIN STORY QUESTIONNAIRE]'));
    assert.ok(gachaReq.user.includes('STRICT ANTI-CLONE & ZERO-DUPLICATE LAW'));
    assert.ok(gachaReq.user.includes('Лион Эль\'Джонсон') && gachaReq.user.includes('Лев Джонсон'));

    // Expanding a Gacha card into full V2 also uses Gacha wishPrefs (NOT Tinder Warhammer 40k!)
    sess.gacha.wishPrefs.wishesNote = 'Холодная ирония и закрытая клиника';
    const fullGachaCardReq = buildFullCardRequest(sess, 'Expand Kael, 29', 'prefill_user_msg', { modeContext: 'gacha' });
    assert.equal(fullGachaCardReq.user.includes('Вархаммер 40к'), false, 'Full card build from Gacha must stay isolated from Tinder');
    assert.ok(fullGachaCardReq.user.includes('Холодная ирония и закрытая клиника'));

    // Known character collector allows explicit summon if user literally writes name in "+" tags
    const filteredIfRequested = collectSessionKnownCharacterNames(sess, [], ['Лев Джонсон', 'нуар', 'дождь']);
    assert.equal(filteredIfRequested.includes('Лев Джонсон'), false);
    assert.equal(filteredIfRequested.includes('Лион Эль\'Джонсон'), true);
});

test('v1.7.3 Instant Art/LLM Cancel, Lossless WYSIWYG Cropper Geometry, Big Dossier & Idea+Intake Switcher', async () => {
    // 1. WYSIWYG Cropper math: vertical 1000x1500 portrait cropped to 1:1 at 1.25x zoom
    const geom = computeLosslessCropGeometry(1000, 1500, { aspectRatio: '1:1', zoom: 1.25, panX: 50, panY: 10 });
    assert.equal(geom.outW, 800);
    assert.equal(geom.outH, 800);
    assert.equal(Math.round(geom.sx), 100);
    assert.equal(Math.round(geom.sy), 70);
    assert.ok(geom.cssWidthPct > 120 && geom.cssHeightPct > 180);

    // 2. Architect "Idea + Intake" vs "Only Idea"
    const sess = createDefaultSession(1);
    sess.intake.fandomName = 'Киберпанк Нео-Токио';
    sess.intake.tropesWanted = 'телохранитель, дождь';

    const withIntakeReq = buildFullCardRequest(sess, 'Хакер по имени Рэй', 'prefill_user_msg', { modeContext: 'architect', useIntake: true });
    assert.ok(withIntakeReq.user.includes('Киберпанк Нео-Токио') && withIntakeReq.user.includes('телохранитель'));

    const pureIdeaReq = buildFullCardRequest(sess, 'Хакер по имени Рэй', 'prefill_user_msg', { modeContext: 'architect', useIntake: false });
    assert.equal(pureIdeaReq.user.includes('Киберпанк Нео-Токио'), false, 'Only-Idea mode must exclude Intake fandom');
    assert.ok(pureIdeaReq.user.includes('[DIRECT FREE-IDEA MODE'));

    // 3. Instant abort inside generateCharacterPortrait during slow provider call (<30ms response!)
    setTestTavernContext({
        extensionSettings: {
            inline_image_gen: {
                enabled: true,
                apiType: 'openai',
                endpoint: 'https://mock-art.local/v1',
                apiKey: 'sk-test',
                model: 'gpt-image-1',
            },
        },
    });
    const origFetch = globalThis.fetch;
    globalThis.fetch = (_url, opts) => new Promise((_res, rej) => {
        opts?.signal?.addEventListener('abort', () => rej(new Error('Aborted socket')), { once: true });
    });
    try {
        const ctl = new AbortController();
        const tStart = Date.now();
        const p = generateCharacterPortrait('SCENE: Noir rain', { imageSource: 'inline_image_gen', signal: ctl.signal });
        setTimeout(() => ctl.abort(), 15);
        await assert.rejects(p, /остановлена|отменён/i);
        assert.ok(Date.now() - tStart < 300, 'Art cancel must reject immediately without retrying');
    } finally {
        globalThis.fetch = origFetch;
    }
});

test('v1.8.0 Session Home, Live Tags (+ & comma), Visual Prompt Refinement & Mosaic Aspect Persistence', () => {
    // 1. Gacha tags support both '+' and ',' cleanly without leftover '+' chars
    assert.deepEqual(parseGachaPlusTags('Босс мафии + Фури + Сила'), ['Босс мафии', 'Фури', 'Сила']);
    assert.deepEqual(parseGachaPlusTags('киберпанк, дождь, шрам'), ['киберпанк', 'дождь', 'шрам']);

    // 2. New session starts on Home screen (homeCompleted = false), existing session with cards marks homeCompleted = true
    const freshSess = createDefaultSession(1);
    assert.equal(freshSess.homeCompleted, false);
    const migratedCfg = normalizeAndMigrateSettings({
        settingsSchemaVersion: 5,
        sessions: [{ id: 's1', title: 'S1', tinder: { liked: [{ id: 'c1', name: 'Vesper' }] } }],
    }).settings;
    assert.equal(migratedCfg.sessions[0].homeCompleted, true);

    // 3. Visual Prompt Refinement request & parser
    const refReq = buildVisualPromptRefinementRequest(
        { name: 'Vesper Valen', appearance: 'Black lynx crime lord', imagePrompt: 'SCENE: Cellar' },
        'Добавь золотой монокль и бокал вина',
        freshSess.intake,
        'prefill_user_msg',
    );
    assert.ok(refReq.user.includes('Добавь золотой монокль и бокал вина'));
    assert.equal(
        parseVisualPromptRefinementResponse('[[NMF_IMG_PROMPT]]SCENE: Candlelit cellar...[[/NMF_IMG_PROMPT]]'),
        'SCENE: Candlelit cellar...',
    );
});

test('v1.8.1 Guided Home Screen, Procedural Cover Lifecycle, Zero Prefill/4K Labels & Zero-Bar Cropped CSS', () => {
    const entryTxt = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../nmf_entry.js'), 'utf8');
    const tplTxt = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../modules/nmf_templates_and_prompts.js'), 'utf8');
    const cssTxt = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../modules/nmf_themes_and_icons.js'), 'utf8');

    // 1. Zero "Prefill" or "в 4K" in user-facing Russian UI strings
    assert.equal(entryTxt.includes('(Prefill)'), false);
    assert.equal(tplTxt.includes('(Prefill)'), false);
    assert.equal(entryTxt.includes('в 4K'), false);

    // 2. Procedural SVG cover generates valid safeImgSrc-approved Data URL for both normal and error states
    const normalCover = buildProceduralCoverDataUrl({ name: 'Vesper Valen, 28', stars: 4 }, { accentHex: '#e62e45', isError: false });
    const errorCover = buildProceduralCoverDataUrl({ name: 'Vesper Valen, 28', stars: 4 }, { accentHex: '#e62e45', isError: true });
    assert.ok(safeImgSrc(normalCover).startsWith('data:image/svg+xml;charset=utf-8,'));
    assert.ok(safeImgSrc(errorCover).startsWith('data:image/svg+xml;charset=utf-8,'));
    assert.notEqual(normalCover, errorCover);

    // 3. Cropped zero-bar rule exists & native hero-photo never uses object-fit: contain pillarboxing
    assert.ok(cssTxt.includes('.nmf-hero-visual.nmf-is-cropped'));
    assert.equal(cssTxt.includes('max-height: 540px !important;\n    object-fit: contain !important;'), false);
});

test('v1.9.0 Bilingual UI (RU/EN), Dynamic Placeholder Cover Lang, 39 Themed Unpack Labels, Safe Gacha Resolution, Luck Rigging & Sacrifice Failure', async () => {
    const { NMF_THEMES } = await import('../modules/nmf_themes_and_icons.js');
    const { setUiLang, getThemeUnpackCopy, getThemedSacrificeFailMessage } = await import('../modules/nmf_i18n.js');
    const { sanitizeAspectForProvider } = await import('../modules/nmf_card_io_and_art.js');
    const { rollSacrificeOutcome } = await import('../modules/nmf_templates_and_prompts.js');

    // 1. All 13 themes have distinct Match, Gacha & Art unpack labels in BOTH RU and EN
    for (const lang of ['ru', 'en']) {
        setUiLang(lang);
        const gachaSet = new Set();
        const matchSet = new Set();
        const artSet = new Set();
        for (const t of NMF_THEMES) {
            const copy = getThemeUnpackCopy(t.id);
            assert.ok(copy.matchBtn.length > 3);
            assert.ok(copy.gachaBtn.length > 3);
            assert.ok(copy.artBtn.length > 3);
            gachaSet.add(copy.gachaBtn);
            matchSet.add(copy.matchBtn);
            artSet.add(copy.artBtn);
            const failMsg = getThemedSacrificeFailMessage(t.id, 'Vesper');
            assert.ok(failMsg.includes('Vesper') && failMsg.includes('0'));
            if (lang === 'en') {
                assert.equal(/[А-Яа-яЁё]/.test(copy.matchBtn + copy.gachaBtn + copy.artBtn + failMsg), false, `Zero Cyrillic allowed in EN for theme ${t.id}`);
            }
        }
        assert.equal(gachaSet.size, 13, `All 13 Gacha unpack buttons must be unique in ${lang}`);
        assert.equal(matchSet.size, 13, `All 13 Match unpack buttons must be unique in ${lang}`);
        assert.equal(artSet.size, 13, `All 13 Art open buttons must be unique in ${lang}`);
    }

    // 2. Procedural SVG placeholder dynamically adapts to RU vs EN with zero Russian words in EN!
    setUiLang('en');
    const enSvg = decodeURIComponent(buildProceduralCoverDataUrl({ name: 'Vesper Valen', stars: 5 }, { isError: false }).split(',')[1]);
    assert.ok(enSvg.includes('5 STARS') && enSvg.includes('NO AI ART'));
    assert.equal(/[А-Яа-яЁё]/.test(enSvg), false, 'English placeholder SVG must contain zero Cyrillic');

    setUiLang('ru');
    const ruSvg = decodeURIComponent(buildProceduralCoverDataUrl({ name: 'Vesper Valen', stars: 5 }, { isError: false }).split(',')[1]);
    assert.ok(ruSvg.includes('5 ЗВ.') && ruSvg.includes('БЕЗ ИИ-АРТА'));

    // 3. Per-Gacha safe resolution never breaks NovelAI / Naistera or SillyImages defaults
    assert.equal(sanitizeAspectForProvider('sillyimages_default', 'novelai'), 'native');
    assert.equal(sanitizeAspectForProvider('3:4', 'novelai'), '2:3');
    assert.equal(sanitizeAspectForProvider('4:3', 'naistera'), '3:2');
    assert.equal(sanitizeAspectForProvider('2:3', 'gemini'), '2:3');
    assert.equal(sanitizeAspectForProvider('16:9', 'xai'), '16:9');

    // 4. Gacha Luck Rigging & Sacrifice Failure Risk
    const jackpotRoll = rollGachaCycleRarities(3, 0, () => 0.99, { luckMode: 'jackpot' });
    assert.deepEqual(jackpotRoll.rarities, [5, 5, 5]);
    const highRoll = rollGachaCycleRarities(3, 0, () => 0.95, { luckMode: 'high' });
    assert.ok(highRoll.rarities.every((s) => s >= 3));

    assert.equal(rollSacrificeOutcome({ sacrificeFailEnabled: false, sacrificeFailChance: 50, rngFn: () => 0.01 }).failed, false);
    assert.equal(rollSacrificeOutcome({ sacrificeFailEnabled: true, sacrificeFailChance: 25, rngFn: () => 0.12 }).failed, true);
    assert.equal(rollSacrificeOutcome({ sacrificeFailEnabled: true, sacrificeFailChance: 25, rngFn: () => 0.60 }).failed, false);

    // 5. Bundled Rikka Art Studio reveal assets exist and Aspect Ratio warning box is gone
    const entryTxt = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../nmf_entry.js'), 'utf8');
    assert.equal(entryTxt.includes('aspectWarnText'), false);
    assert.ok(entryTxt.includes('* Необязательно, но будет красиво'));
    assert.ok(fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/reveal_match.webp')));
    assert.ok(fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/reveal_altar.webp')));
});

test('v1.9.1 Deep Audit Regression: Zero Auto-Skip on Minimized Gacha Shade, Vault Media Isolation Across Prune & 4-Point Home Layout', async () => {
    const entryTxt = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../nmf_entry.js'), 'utf8');
    const { collectReferencedMediaIds } = await import('../modules/nmf_media_vault.js');

    // 1. All 4 numbered Points exist on Home Screen & zero "Шаг " labels remain in renderHomeTab
    assert.ok(entryTxt.includes('Пункт 1. Анкеты сессии и базовая настройка:'));
    assert.ok(entryTxt.includes('Пункт 2. Выберите режим создания карточки:'));
    assert.ok(entryTxt.includes('Пункт 3. Темы оформления и настройки Гачи:'));
    assert.ok(entryTxt.includes('Пункт 4. Генератор Артов и Обложки:'));

    // 2. Every pruneOrphanedMedia call in nmf_entry.js passes savedVault (zero bare pruneOrphanedMedia(cfg.sessions) calls!)
    assert.equal(/pruneOrphanedMedia\(\s*cfg\.sessions\s*\)/.test(entryTxt), false, 'All pruneOrphanedMedia calls must pass savedVault');

    // 3. Vault cards keep independent media IDs collected safely
    const refs = collectReferencedMediaIds(
        [{ card: { avatarId: 'm_profile_1' }, cardSlots: {}, tinder: {}, gacha: {} }],
        [],
        [{ avatarId: 'm_vault_independent_1', originalAvatarId: 'm_vault_orig_1' }],
    );
    assert.equal(refs.has('m_profile_1'), true);
    assert.equal(refs.has('m_vault_independent_1'), true);
    assert.equal(refs.has('m_vault_orig_1'), true);

    // 4. Minimized Gacha Shade never auto-consumes pendingWishReveal inside renderWindow()
    assert.ok(entryTxt.includes('data-act="open-pending-wish-stage"'));
    assert.ok(entryTxt.includes('startWishCometAndFlip'));
    assert.ok(entryTxt.includes('gachaCooldownTickId = setInterval'), 'Gacha cooldown ticker must stay active during RP');
});

test('v1.9.2 Start-First Launch, Clean Inner Tabs & 100% Zero Mixing Between Main Questionnaire and Gacha Questionnaire', async () => {
    const { summarizeGachaWishPrefsBlock, summarizeIntakeBlock, buildGachaSummonRequest, buildTinderPreviewRequest } = await import('../modules/nmf_templates_and_prompts.js');
    const sess = createDefaultSession(1);

    // Populate Main Questionnaire with distinct values
    sess.intake.fandomName = 'MAIN_ONLY_WITCHER';
    sess.intake.settingEra = 'MAIN_ERA_1272';
    sess.intake.tropesWanted = 'MAIN_TROPE_GRUMPY';
    sess.intake.hardBans = 'MAIN_BAN_LASERS';
    sess.intake.userGender = 'female';
    sess.intake.targetGender = 'male';
    sess.intake.rating = 'sfw';

    // Leave Gacha Questionnaire completely blank -> must activate High-Randomization & zero Main leak!
    const blankGachaBlock = summarizeGachaWishPrefsBlock(sess);
    assert.ok(blankGachaBlock.includes('High-Randomization Mode'));
    assert.equal(blankGachaBlock.includes('MAIN_ONLY_WITCHER'), false);
    assert.equal(blankGachaBlock.includes('MAIN_ERA_1272'), false);
    assert.equal(blankGachaBlock.includes('MAIN_TROPE_GRUMPY'), false);
    assert.equal(blankGachaBlock.includes('MAIN_BAN_LASERS'), false);
    assert.equal(blankGachaBlock.includes('Female'), false, 'Gacha userGender must not inherit Main userGender');
    assert.equal(blankGachaBlock.includes('Male'), false, 'Gacha targetGender must not inherit Main targetGender');

    // Populate Gacha Questionnaire with distinct values -> must NEVER leak into Main Questionnaire modes!
    sess.gacha.tagsInput = 'GACHA_TAG_CYBER + GACHA_TAG_RAIN + GACHA_TAG_BOSS';
    sess.gacha.wishPrefs.fandomOrWorld = 'GACHA_ONLY_ASTRA';
    sess.gacha.wishPrefs.wishesNote = 'GACHA_WISH_VILLAIN';
    sess.gacha.wishPrefs.hardBans = 'GACHA_BAN_MAGIC';

    const gachaReq = buildGachaSummonRequest(sess, ['cyber', 'rain', 'boss'], [5], 'prefill_user_msg');
    assert.ok(gachaReq.user.includes('GACHA_ONLY_ASTRA'));
    assert.equal(gachaReq.user.includes('MAIN_ONLY_WITCHER'), false);

    for (const ctxMode of ['swipe', 'blitz', 'architect']) {
        const mainBlock = summarizeIntakeBlock(sess, { modeContext: ctxMode });
        assert.ok(mainBlock.includes('MAIN_ONLY_WITCHER'));
        assert.equal(mainBlock.includes('GACHA_ONLY_ASTRA'), false);
        assert.equal(mainBlock.includes('GACHA_WISH_VILLAIN'), false);
        assert.equal(mainBlock.includes('GACHA_BAN_MAGIC'), false);
        assert.equal(mainBlock.includes('GACHA_TAG_CYBER'), false);
    }
    const tinderReq = buildTinderPreviewRequest(sess, 1, 'prefill_user_msg');
    assert.ok(tinderReq.user.includes('MAIN_ONLY_WITCHER'));
    assert.equal(tinderReq.user.includes('GACHA_ONLY_ASTRA'), false);
});
