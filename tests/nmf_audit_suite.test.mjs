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
    createDefaultSession,
    normalizeAndMigrateSettings,
    extractJsonLoose,
    buildFullCardRequest,
    parseFullCardResponse,
    buildTinderPreviewRequest,
    parseTinderPreviewResponse,
    buildBlitzQuestionsRequest,
    parseBlitzQuestionsResponse,
} from '../modules/nmf_templates_and_prompts.js';

import {
    setTestTavernContext,
    markCardFieldDirty,
    createCardStateFromTavernChar,
    createCardStateFromImportedJson,
    computeCardDiff,
    buildV2CardObject,
    ensurePngBytes,
    embedCharaChunkIntoPng,
    extractCharaJsonFromPng,
    importCardIntoTavern,
    fetchFullTavernCharacter,
    updateExistingCardInTavern,
    resolveIsolatedImageConfig,
    validateResolvedImageConfig,
    listImageExtensionBuckets,
    generateCharacterPortrait,
    buildPresetAlignedMessages,
    runLlmGeneration,
    detectPocketCodex,
} from '../modules/nmf_card_io_and_art.js';

import {
    saveMediaDataUrl,
    resolveEntityAvatarUrl,
    migrateInlineSessionMediaToVault,
    pruneOrphanedMedia,
    listCardBackups,
    clearMemoryVaultForTests,
} from '../modules/nmf_media_vault.js';

import {
    state,
    esc,
    getSettings,
    withBusy,
    requestCancelBusyTask,
} from '../nmf_entry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

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
            const merged = deepMergeLikeTavern(existing.cardJson, cleanUpdate);
            const mergedPng = embedCharaChunkIntoPng(existing.pngBytes, merged);
            diskCards.set(update.avatar, { pngBytes: mergedPng, cardJson: merged });
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
    assert.equal(moved, true);

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
