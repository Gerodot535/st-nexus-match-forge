import {
    saveCardBackup,
    getCardBackupById,
    base64ToBytes,
    isValidNonEmptyPngBytes,
} from './nmf_media_vault.js?v=2.1.34';

// CRC32 table for valid PNG tEXt ('chara') chunk embedding & verification
const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(bin);
}

function base64ToUtf8(b64) {
    const bin = atob(String(b64 || '').trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i) & 0xff;
    }
    return new TextDecoder('utf-8').decode(bytes);
}

// Public SillyTavern context accessor without importing internal /script.js modules (fixes NMF-015)
let injectedTestContext = null;
export function setTestTavernContext(mockCtx = null) {
    injectedTestContext = mockCtx;
}

export function getTavernContext() {
    if (injectedTestContext) return injectedTestContext;
    return globalThis.window?.SillyTavern?.getContext?.() || null;
}

export function getTavernHeaders({ omitContentType = false } = {}) {
    const ctx = getTavernContext();
    if (typeof ctx?.getRequestHeaders === 'function') {
        return ctx.getRequestHeaders({ omitContentType });
    }
    return omitContentType ? {} : { 'Content-Type': 'application/json' };
}

// Editable fields tracked for lossless surgical V2 updates (fixes NMF-003)
export const ALL_EDITABLE_CARD_FIELDS = Object.freeze([
    'name',
    'description',
    'personality',
    'scenario',
    'first_mes',
    'alternate_greetings',
    'mes_example',
    'creator_notes',
    'system_prompt',
    'post_history_instructions',
    'tags',
    'creator',
    'character_version',
    'world',
    'imagePrompt',
]);

const FIELD_LABELS_RU = Object.freeze({
    name: 'Имя / Название',
    description: 'Описание (Description)',
    personality: 'Характер (Personality)',
    scenario: 'Сценарий (Scenario)',
    first_mes: 'Первое сообщение (First Message)',
    alternate_greetings: 'Дополнительные приветствия',
    mes_example: 'Примеры диалогов',
    creator_notes: 'Заметки автора (Creator Notes)',
    system_prompt: 'System Prompt карточки',
    post_history_instructions: 'Post-History Instructions',
    tags: 'Теги',
    creator: 'Автор (Creator)',
    character_version: 'Версия карточки',
    world: 'Привязанный Лорбук (World Info)',
    imagePrompt: 'Промпт портрета (NMF)',
});

export function markCardFieldDirty(card, fieldName) {
    if (!card || typeof card !== 'object' || !fieldName) return;
    if (!Array.isArray(card.dirtyFields)) card.dirtyFields = [];
    if (!card.dirtyFields.includes(fieldName)) {
        card.dirtyFields.push(fieldName);
    }
}

function parseTagsArray(tagsVal) {
    return Array.isArray(tagsVal)
        ? tagsVal.map((s) => String(s).trim()).filter(Boolean)
        : String(tagsVal || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function parseAltGreetingsArray(altVal) {
    return Array.isArray(altVal)
        ? altVal.map((s) => String(s ?? ''))
        : [];
}

function stableStringify(val) {
    if (val === null || typeof val !== 'object') return JSON.stringify(val);
    if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
    const keys = Object.keys(val).filter((k) => k !== 'json_data').sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(val[k])).join(',') + '}';
}

export function computeCardSnapshotHash(cardObj) {
    if (!cardObj || typeof cardObj !== 'object') return '';
    const canon = stableStringify(cardObj);
    let h = 2166136261;
    for (let i = 0; i < canon.length; i++) {
        h ^= canon.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return 'fnv1a_' + (h >>> 0).toString(16);
}

function extractRawCardJsonFromTavernChar(srcChar) {
    if (!srcChar || typeof srcChar !== 'object') return null;
    if (typeof srcChar.json_data === 'string' && srcChar.json_data.trim()) {
        try {
            const parsed = JSON.parse(srcChar.json_data);
            if (parsed && typeof parsed === 'object') {
                delete parsed.json_data;
                if (srcChar.chat !== undefined && parsed.chat === undefined) parsed.chat = srcChar.chat;
                if (srcChar.create_date !== undefined && parsed.create_date === undefined) parsed.create_date = srcChar.create_date;
                if (srcChar.fav !== undefined && parsed.fav === undefined) parsed.fav = srcChar.fav;
                return parsed;
            }
        } catch {
            // Fall back to cloning srcChar
        }
    }
    const clone = structuredClone(srcChar);
    delete clone.json_data;
    return clone;
}

// Build clean editor card state from a FULL SillyTavern character object (fixes NMF-002 & NMF-003)
export function createCardStateFromTavernChar(fullChar, { avatarId = '' } = {}) {
    const rawJson = extractRawCardJsonFromTavernChar(fullChar) || {};
    const d = (rawJson.data && typeof rawJson.data === 'object') ? rawJson.data : (fullChar?.data || fullChar || {});
    const tagsList = Array.isArray(d.tags) ? d.tags : (Array.isArray(rawJson.tags) ? rawJson.tags : []);
    const nmfImgPrompt = String(d?.extensions?.nexus_match_forge?.image_prompt || '');

    return {
        name: String(d.name ?? rawJson.name ?? fullChar?.name ?? ''),
        description: String(d.description ?? rawJson.description ?? fullChar?.description ?? ''),
        personality: String(d.personality ?? rawJson.personality ?? fullChar?.personality ?? ''),
        scenario: String(d.scenario ?? rawJson.scenario ?? fullChar?.scenario ?? ''),
        first_mes: String(d.first_mes ?? rawJson.first_mes ?? fullChar?.first_mes ?? ''),
        alternate_greetings: Array.isArray(d.alternate_greetings) ? [...d.alternate_greetings] : [],
        mes_example: String(d.mes_example ?? rawJson.mes_example ?? fullChar?.mes_example ?? ''),
        creator_notes: String(d.creator_notes ?? rawJson.creatorcomment ?? fullChar?.creatorcomment ?? ''),
        system_prompt: String(d.system_prompt ?? ''),
        post_history_instructions: String(d.post_history_instructions ?? ''),
        tags: Array.isArray(tagsList) ? tagsList.join(', ') : String(tagsList || ''),
        creator: String(d.creator ?? ''),
        character_version: String(d.character_version ?? '1.0') || '1.0',
        world: String(d?.extensions?.world ?? ''),
        imagePrompt: nmfImgPrompt,
        avatarId: String(avatarId || ''),
        avatarDataUrl: '',
        avatarDirty: false,
        sourceAvatarId: String(fullChar?.avatar || ''),
        sourceLoadedFromTavern: Boolean(fullChar?.avatar),
        sourceSnapshotHash: computeCardSnapshotHash(rawJson),
        originalCardData: structuredClone(rawJson),
        dirtyFields: [],
    };
}

// Build independent editor card state from imported JSON — strictly resets sourceAvatarId & previous character links! (fixes NMF-004 & NMF-003)
export function createCardStateFromImportedJson(rawObj) {
    if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
        throw new Error('Импортированный JSON не является объектом карточки персонажа.');
    }
    const cleanOrig = structuredClone(rawObj);
    delete cleanOrig.json_data;

    const d = (cleanOrig.data && typeof cleanOrig.data === 'object') ? cleanOrig.data : cleanOrig;
    const tagsVal = d.tags !== undefined ? d.tags : cleanOrig.tags;
    const nmfPrompt = String(d?.extensions?.nexus_match_forge?.image_prompt || '');

    return {
        name: String(d.name ?? cleanOrig.name ?? ''),
        description: String(d.description ?? cleanOrig.description ?? ''),
        personality: String(d.personality ?? cleanOrig.personality ?? ''),
        scenario: String(d.scenario ?? cleanOrig.scenario ?? ''),
        first_mes: String(d.first_mes ?? cleanOrig.first_mes ?? ''),
        alternate_greetings: Array.isArray(d.alternate_greetings) ? d.alternate_greetings.map(String) : [],
        mes_example: String(d.mes_example ?? cleanOrig.mes_example ?? ''),
        creator_notes: String(d.creator_notes ?? cleanOrig.creatorcomment ?? ''),
        system_prompt: String(d.system_prompt ?? ''),
        post_history_instructions: String(d.post_history_instructions ?? ''),
        tags: Array.isArray(tagsVal) ? tagsVal.join(', ') : String(tagsVal ?? ''),
        creator: String(d.creator ?? ''),
        character_version: String(d.character_version ?? '1.0') || '1.0',
        world: String(d?.extensions?.world ?? ''),
        imagePrompt: nmfPrompt,
        avatarId: '',
        avatarDataUrl: '',
        avatarDirty: false,
        sourceAvatarId: '',
        sourceLoadedFromTavern: false,
        sourceSnapshotHash: '',
        originalCardData: cleanOrig,
        dirtyFields: [],
    };
}

function readComparableFieldFromState(stateObj, field) {
    switch (field) {
        case 'name':
            return String(stateObj?.name ?? '').trim();
        case 'alternate_greetings':
            return parseAltGreetingsArray(stateObj?.alternate_greetings).map((s) => s.trim()).filter(Boolean);
        case 'tags':
            return parseTagsArray(stateObj?.tags);
        case 'world':
            return String(stateObj?.world ?? '').trim();
        case 'imagePrompt':
            return String(stateObj?.imagePrompt ?? '').trim();
        case 'character_version':
            return String(stateObj?.character_version ?? '1.0');
        default:
            return String(stateObj?.[field] ?? '');
    }
}

export function computeChangedFieldKeysAgainstBase(nextState, baseState) {
    const changed = [];
    for (const field of ALL_EDITABLE_CARD_FIELDS) {
        const a = readComparableFieldFromState(nextState, field);
        const b = readComparableFieldFromState(baseState, field);
        if (stableStringify(a) !== stableStringify(b)) {
            changed.push(field);
        }
    }
    return changed;
}

// Pure standalone card builder for Blitz / Architect / Swipe Expansion — NEVER inherits fields from any previous sess.card! (fixes P1-A)
export function createCardStateFromGeneratedDraft(
    parsed = {},
    { avatarId = '', fallbackName = 'Новая Карточка', fallbackImagePrompt = '' } = {}
) {
    const cleanName = String(parsed?.name ?? '').trim() || String(fallbackName || 'Новая Карточка').trim() || 'Новая Карточка';
    const cleanImgPrompt = String(parsed?.imagePrompt ?? '').trim() || String(fallbackImagePrompt || '').trim();
    const cleanAvatarId = String(avatarId || '').trim();

    return {
        name: cleanName,
        description: String(parsed?.description ?? ''),
        personality: String(parsed?.personality ?? ''),
        scenario: String(parsed?.scenario ?? ''),
        first_mes: String(parsed?.first_mes ?? ''),
        alternate_greetings: Array.isArray(parsed?.alternate_greetings) ? parsed.alternate_greetings.map(String) : [],
        mes_example: String(parsed?.mes_example ?? ''),
        creator_notes: String(parsed?.creator_notes ?? ''),
        system_prompt: String(parsed?.system_prompt ?? ''),
        post_history_instructions: String(parsed?.post_history_instructions ?? ''),
        tags: Array.isArray(parsed?.tags) ? parsed.tags.join(', ') : String(parsed?.tags ?? ''),
        creator: 'NexusMatch Forge',
        character_version: '1.0',
        world: '',
        imagePrompt: cleanImgPrompt,
        avatarId: cleanAvatarId,
        avatarDataUrl: '',
        avatarDirty: Boolean(cleanAvatarId),
        sourceAvatarId: '',
        sourceLoadedFromTavern: false,
        sourceSnapshotHash: '',
        originalCardData: null,
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
    };
}

// Pure AU Rework applier strictly layered over target Tavern character A (baseState) — NEVER touches previous sess.card B! (fixes P1-A)
export function applyReworkResultToTavernBase(
    baseState,
    parsed = {},
    { avatarId = '', sourceAvatarId = '', snapshotHash = '', rawCardObject = null, inheritLorebook = true } = {}
) {
    if (!baseState || typeof baseState !== 'object') {
        throw new Error('Не загружена исходная карточка оригинала для AU Rework.');
    }

    const pickNonEmptyOrBase = (genVal, baseVal) => {
        if (genVal !== undefined && genVal !== null && String(genVal).trim() !== '') {
            return String(genVal);
        }
        return String(baseVal ?? '');
    };

    const parsedAlts = Array.isArray(parsed?.alternate_greetings)
        ? parsed.alternate_greetings.map(String).filter((s) => s.trim().length > 0)
        : [];
    const baseAlts = Array.isArray(baseState.alternate_greetings) ? [...baseState.alternate_greetings] : [];

    const parsedTagsStr = Array.isArray(parsed?.tags) ? parsed.tags.join(', ') : String(parsed?.tags ?? '');

    const nextCard = {
        name: pickNonEmptyOrBase(parsed?.name, baseState.name).trim() || String(baseState.name || 'Unnamed'),
        description: pickNonEmptyOrBase(parsed?.description, baseState.description),
        personality: pickNonEmptyOrBase(parsed?.personality, baseState.personality),
        scenario: pickNonEmptyOrBase(parsed?.scenario, baseState.scenario),
        first_mes: pickNonEmptyOrBase(parsed?.first_mes, baseState.first_mes),
        alternate_greetings: parsedAlts.length > 0 ? parsedAlts : baseAlts,
        mes_example: pickNonEmptyOrBase(parsed?.mes_example, baseState.mes_example),
        creator_notes: pickNonEmptyOrBase(parsed?.creator_notes, baseState.creator_notes),
        system_prompt: pickNonEmptyOrBase(parsed?.system_prompt, baseState.system_prompt),
        post_history_instructions: pickNonEmptyOrBase(parsed?.post_history_instructions, baseState.post_history_instructions),
        tags: pickNonEmptyOrBase(parsedTagsStr, baseState.tags),
        creator: String(baseState.creator ?? ''),
        character_version: String(baseState.character_version ?? '1.0') || '1.0',
        world: inheritLorebook ? String(baseState.world ?? '') : '',
        imagePrompt: pickNonEmptyOrBase(parsed?.imagePrompt, baseState.imagePrompt).trim(),
        avatarId: String(avatarId || baseState.avatarId || ''),
        avatarDataUrl: '',
        avatarDirty: false,
        stripInheritedCharacterBook: !inheritLorebook,
        sourceAvatarId: String(sourceAvatarId || baseState.sourceAvatarId || ''),
        sourceLoadedFromTavern: Boolean(sourceAvatarId || baseState.sourceAvatarId),
        sourceSnapshotHash: String(snapshotHash || baseState.sourceSnapshotHash || ''),
        originalCardData: rawCardObject
            ? structuredClone(rawCardObject)
            : (baseState.originalCardData ? structuredClone(baseState.originalCardData) : null),
        dirtyFields: [],
    };

    nextCard.dirtyFields = computeChangedFieldKeysAgainstBase(nextCard, baseState);
    return nextCard;
}

function applySingleFieldToCardObject(target, field, card) {
    if (!target.data || typeof target.data !== 'object') {
        target.data = {};
    }
    if (!target.data.extensions || typeof target.data.extensions !== 'object') {
        target.data.extensions = {};
    }

    switch (field) {
        case 'name': {
            const v = String(card.name || 'Unnamed').trim();
            target.name = v;
            target.data.name = v;
            break;
        }
        case 'description': {
            const v = String(card.description ?? '');
            target.description = v;
            target.data.description = v;
            break;
        }
        case 'personality': {
            const v = String(card.personality ?? '');
            target.personality = v;
            target.data.personality = v;
            break;
        }
        case 'scenario': {
            const v = String(card.scenario ?? '');
            target.scenario = v;
            target.data.scenario = v;
            break;
        }
        case 'first_mes': {
            const v = String(card.first_mes ?? '');
            target.first_mes = v;
            target.data.first_mes = v;
            break;
        }
        case 'mes_example': {
            const v = String(card.mes_example ?? '');
            target.mes_example = v;
            target.data.mes_example = v;
            break;
        }
        case 'creator_notes': {
            const v = String(card.creator_notes ?? '');
            target.creatorcomment = v;
            target.data.creator_notes = v;
            break;
        }
        case 'system_prompt': {
            target.data.system_prompt = String(card.system_prompt ?? '');
            break;
        }
        case 'post_history_instructions': {
            target.data.post_history_instructions = String(card.post_history_instructions ?? '');
            break;
        }
        case 'alternate_greetings': {
            target.data.alternate_greetings = parseAltGreetingsArray(card.alternate_greetings).filter((s) => s.trim().length > 0);
            break;
        }
        case 'tags': {
            const arr = parseTagsArray(card.tags);
            target.tags = arr;
            target.data.tags = arr;
            break;
        }
        case 'creator': {
            target.data.creator = String(card.creator ?? '');
            break;
        }
        case 'character_version': {
            target.data.character_version = String(card.character_version ?? '1.0');
            break;
        }
        case 'world': {
            target.data.extensions.world = String(card.world ?? '').trim();
            break;
        }
        case 'imagePrompt': {
            const cleanImgPrompt = String(card.imagePrompt ?? '').trim();
            if (cleanImgPrompt || target.data.extensions.nexus_match_forge) {
                target.data.extensions.nexus_match_forge = {
                    ...(target.data.extensions.nexus_match_forge || {}),
                    version: '1.5.0-beta',
                    image_prompt: cleanImgPrompt,
                };
            }
            break;
        }
        default:
            break;
    }
}

// Lossless Character Card V2 builder (fixes NMF-003):
// When originalCardData exists, clones it and applies ONLY dirtyFields, preserving character_book, unknown fields, fav, chat, create_date, talkativeness, depth_prompt, and third-party extensions!
export function buildV2CardObject(card) {
    if (card?.originalCardData && typeof card.originalCardData === 'object') {
        const cloned = structuredClone(card.originalCardData);
        delete cloned.json_data;

        if (!cloned.spec) cloned.spec = 'chara_card_v2';
        if (!cloned.spec_version) cloned.spec_version = '2.0';
        if (!cloned.data || typeof cloned.data !== 'object') {
            cloned.data = {
                name: cloned.name || '',
                description: cloned.description || '',
                personality: cloned.personality || '',
                scenario: cloned.scenario || '',
                first_mes: cloned.first_mes || '',
                mes_example: cloned.mes_example || '',
                creator_notes: cloned.creatorcomment || '',
                system_prompt: '',
                post_history_instructions: '',
                alternate_greetings: [],
                tags: Array.isArray(cloned.tags) ? [...cloned.tags] : [],
                creator: '',
                character_version: '1.0',
                extensions: {},
            };
        }
        if (!cloned.data.extensions || typeof cloned.data.extensions !== 'object') {
            cloned.data.extensions = {};
        }

        const fieldsToApply = Array.isArray(card.dirtyFields) ? card.dirtyFields : ALL_EDITABLE_CARD_FIELDS;
        for (const f of fieldsToApply) {
            applySingleFieldToCardObject(cloned, f, card);
        }
        if (card.stripInheritedCharacterBook) {
            delete cloned.character_book;
            if (cloned.data && typeof cloned.data === 'object') {
                delete cloned.data.character_book;
                if (cloned.data.extensions && typeof cloned.data.extensions === 'object') {
                    cloned.data.extensions.world = String(card.world || '').trim();
                }
            }
        }
        return cloned;
    }

    // Fresh V2 card created from scratch
    const tagsArr = parseTagsArray(card?.tags);
    const altArr = parseAltGreetingsArray(card?.alternate_greetings).map((s) => s.trim()).filter(Boolean);
    const cleanImgPrompt = String(card?.imagePrompt || '').trim();

    const extensions = {
        talkativeness: 0.5,
        fav: false,
        world: String(card?.world || '').trim(),
        depth_prompt: { prompt: '', depth: 4, role: 'system' },
    };
    if (cleanImgPrompt) {
        extensions.nexus_match_forge = {
            version: '1.5.0-beta',
            image_prompt: cleanImgPrompt,
        };
    }

    const data = {
        name: String(card?.name || 'Unnamed').trim(),
        description: String(card?.description || '').trim(),
        personality: String(card?.personality || '').trim(),
        scenario: String(card?.scenario || '').trim(),
        first_mes: String(card?.first_mes || '').trim(),
        mes_example: String(card?.mes_example || '').trim(),
        creator_notes: String(card?.creator_notes || '').trim(),
        system_prompt: String(card?.system_prompt || '').trim(),
        post_history_instructions: String(card?.post_history_instructions || '').trim(),
        alternate_greetings: altArr,
        tags: tagsArr,
        creator: String(card?.creator || 'NexusMatch Forge').trim(),
        character_version: String(card?.character_version || '1.0').trim(),
        extensions,
    };

    return {
        name: data.name,
        description: data.description,
        personality: data.personality,
        scenario: data.scenario,
        first_mes: data.first_mes,
        mes_example: data.mes_example,
        creatorcomment: data.creator_notes,
        avatar: 'none',
        talkativeness: 0.5,
        fav: false,
        tags: data.tags,
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data,
    };
}

// Build minimal surgical payload for POST /api/characters/merge-attributes (fixes NMF-001 & NMF-003)
export function buildSurgicalMergePayload(avatarFileName, card) {
    const dirty = Array.isArray(card?.dirtyFields) ? card.dirtyFields : [];
    const payload = { avatar: String(avatarFileName || '').trim() };
    if (!dirty.length) return payload;

    const dataPatch = {};
    const extPatch = {};

    for (const field of dirty) {
        switch (field) {
            case 'name': {
                const v = String(card.name || '').trim();
                if (v) {
                    payload.name = v;
                    dataPatch.name = v;
                }
                break;
            }
            case 'description':
                payload.description = String(card.description ?? '');
                dataPatch.description = String(card.description ?? '');
                break;
            case 'personality':
                payload.personality = String(card.personality ?? '');
                dataPatch.personality = String(card.personality ?? '');
                break;
            case 'scenario':
                payload.scenario = String(card.scenario ?? '');
                dataPatch.scenario = String(card.scenario ?? '');
                break;
            case 'first_mes':
                payload.first_mes = String(card.first_mes ?? '');
                dataPatch.first_mes = String(card.first_mes ?? '');
                break;
            case 'mes_example':
                payload.mes_example = String(card.mes_example ?? '');
                dataPatch.mes_example = String(card.mes_example ?? '');
                break;
            case 'creator_notes':
                payload.creatorcomment = String(card.creator_notes ?? '');
                dataPatch.creator_notes = String(card.creator_notes ?? '');
                break;
            case 'system_prompt':
                dataPatch.system_prompt = String(card.system_prompt ?? '');
                break;
            case 'post_history_instructions':
                dataPatch.post_history_instructions = String(card.post_history_instructions ?? '');
                break;
            case 'alternate_greetings':
                dataPatch.alternate_greetings = parseAltGreetingsArray(card.alternate_greetings).filter((s) => s.trim().length > 0);
                break;
            case 'tags': {
                const arr = parseTagsArray(card.tags);
                payload.tags = arr;
                dataPatch.tags = arr;
                break;
            }
            case 'creator':
                dataPatch.creator = String(card.creator ?? '');
                break;
            case 'character_version':
                dataPatch.character_version = String(card.character_version ?? '1.0');
                break;
            case 'world':
                extPatch.world = String(card.world ?? '').trim();
                break;
            case 'imagePrompt':
                extPatch.nexus_match_forge = {
                    version: '1.5.0-beta',
                    image_prompt: String(card.imagePrompt ?? '').trim(),
                };
                break;
            default:
                break;
        }
    }

    if (Object.keys(extPatch).length > 0) {
        dataPatch.extensions = extPatch;
    }
    if (Object.keys(dataPatch).length > 0) {
        payload.data = dataPatch;
    }
    return payload;
}

export function computeCardDiff(card, liveOrigData = null) {
    const base = liveOrigData || card?.originalCardData || {};
    const changed = [];
    const dirty = Array.isArray(card?.dirtyFields) ? card.dirtyFields : [];

    for (const f of dirty) {
        if (FIELD_LABELS_RU[f]) changed.push(FIELD_LABELS_RU[f]);
    }
    if (card?.avatarDirty) {
        changed.push('Портрет PNG (изображение)');
    }

    const preserved = [
        'Привязка к активному чату (chat)',
        'Дата создания (create_date)',
        base?.fav || base?.data?.extensions?.fav ? 'Статус «Избранное» (fav = true)' : 'Статус «Избранное» (fav)',
    ];
    if (base?.data?.character_book) {
        preserved.push('Встроенный Лорбук (character_book)');
    }
    if (base?.data?.extensions?.depth_prompt?.prompt) {
        preserved.push('Depth Prompt персонажа');
    }
    const foreignExtKeys = Object.keys(base?.data?.extensions || {}).filter(
        (k) => !['talkativeness', 'fav', 'world', 'depth_prompt', 'nexus_match_forge'].includes(k)
    );
    if (foreignExtKeys.length > 0) {
        preserved.push(`Сторонние данные расширений (${foreignExtKeys.join(', ')})`);
    }

    return {
        hasChanges: changed.length > 0,
        changedFields: changed,
        preservedProtected: preserved,
    };
}

export const CONCEPT_ALL_ASPECT_OPTIONS = Object.freeze([
    { id: '1:1', label: '1:1 (Квадрат)', labelEn: '1:1 (Square)' },
    { id: '2:3', label: '2:3 (Портрет)', labelEn: '2:3 (Portrait)' },
    { id: '3:2', label: '3:2 (Альбом)', labelEn: '3:2 (Landscape)' },
    { id: '3:4', label: '3:4 (Портрет)', labelEn: '3:4 (Portrait)' },
    { id: '4:3', label: '4:3 (Альбом)', labelEn: '4:3 (Landscape)' },
    { id: '4:5', label: '4:5 (Портрет)', labelEn: '4:5 (Portrait)' },
    { id: '5:4', label: '5:4 (Альбом)', labelEn: '5:4 (Landscape)' },
    { id: '9:16', label: '9:16 (Вертикальный)', labelEn: '9:16 (Vertical)' },
    { id: '16:9', label: '16:9 (Широкий)', labelEn: '16:9 (Wide)' },
    { id: '21:9', label: '21:9 (Ультраширокий)', labelEn: '21:9 (Ultrawide)' },
]);

export const EXTENDED_PROVIDER_ASPECT_OPTIONS = Object.freeze([
    ...CONCEPT_ALL_ASPECT_OPTIONS,
    { id: '2:1', label: '2:1 (Широкая панорама)', labelEn: '2:1 (Wide Panorama)' },
    { id: '1:2', label: '1:2 (Высокая лента)', labelEn: '1:2 (Tall Vertical)' },
    { id: '19.5:9', label: '19.5:9 (Экран смартфона, альбом)', labelEn: '19.5:9 (Mobile Wide)' },
    { id: '9:19.5', label: '9:19.5 (Экран смартфона, портрет)', labelEn: '9:19.5 (Mobile Portrait)' },
    { id: '20:9', label: '20:9 (Киноэкран, альбом)', labelEn: '20:9 (Cinema Wide)' },
    { id: '9:20', label: '9:20 (Киноэкран, портрет)', labelEn: '9:20 (Cinema Portrait)' },
    { id: '4:1', label: '4:1 (Ультра-баннер)', labelEn: '4:1 (Ultra Banner)' },
    { id: '1:4', label: '1:4 (Вертикальный свиток)', labelEn: '1:4 (Vertical Scroll)' },
    { id: '8:1', label: '8:1 (Панорамная полоса)', labelEn: '8:1 (Panoramic Strip)' },
    { id: '1:8', label: '1:8 (Высокая полоса)', labelEn: '1:8 (Tall Strip)' },
]);

const STUDIO_ASPECT_DESCRIPTIONS = Object.freeze({
    '1:1': { ru: '1:1 — Квадрат (ровная сетка)', en: '1:1 — Square (even grid)' },
    '2:3': { ru: '2:3 — Высокий вертикальный портрет', en: '2:3 — Tall Portrait' },
    '3:2': { ru: '3:2 — Альбомный кадр (1 колонка)', en: '3:2 — Landscape Story Card (1 col)' },
    '3:4': { ru: '3:4 — Классическая портретная карточка', en: '3:4 — Classic Portrait Card' },
    '4:3': { ru: '4:3 — Классический альбом (1 колонка)', en: '4:3 — Classic Landscape (1 col)' },
    '4:5': { ru: '4:5 — Компактный портрет', en: '4:5 — Compact Portrait' },
    '5:4': { ru: '5:4 — Компактный альбом (1 колонка)', en: '5:4 — Compact Landscape (1 col)' },
    '9:16': { ru: '9:16 — Полный вертикальный постер', en: '9:16 — Full Vertical Poster' },
    '16:9': { ru: '16:9 — Широкий кадр (1 колонка, Миры / Сцены)', en: '16:9 — Widescreen (1 col, Worlds / Scenes)' },
    '21:9': { ru: '21:9 — Ультраширокий кино-кадр (1 колонка)', en: '21:9 — Ultrawide Cinema (1 col)' },
    '2:1': { ru: '2:1 — Широкая панорама (1 колонка)', en: '2:1 — Wide Panorama (1 col)' },
    '1:2': { ru: '1:2 — Высокая вертикальная лента', en: '1:2 — Tall Vertical Strip' },
    '19.5:9': { ru: '19.5:9 — Широкий мобильный экран (1 колонка)', en: '19.5:9 — Mobile Widescreen (1 col)' },
    '9:19.5': { ru: '9:19.5 — Экран смартфона (вертикальный)', en: '9:19.5 — Full Mobile Portrait' },
    '20:9': { ru: '20:9 — Широкий киноэкран (1 колонка)', en: '20:9 — Cinema Widescreen (1 col)' },
    '9:20': { ru: '9:20 — Узкий вертикальный постер', en: '9:20 — Narrow Vertical Poster' },
    '4:1': { ru: '4:1 — Горизонтальный баннер (1 колонка)', en: '4:1 — Horizontal Banner (1 col)' },
    '1:4': { ru: '1:4 — Вертикальный свиток', en: '1:4 — Vertical Scroll' },
    '8:1': { ru: '8:1 — Узкая панорамная полоса (1 колонка)', en: '8:1 — Panoramic Strip (1 col)' },
    '1:8': { ru: '1:8 — Узкая вертикальная полоса', en: '1:8 — Narrow Vertical Strip' },
});

function buildAspectOptionList(ids = [], sizeMap = null) {
    const idSet = new Set(ids);
    return EXTENDED_PROVIDER_ASPECT_OPTIONS
        .filter((o) => idSet.has(o.id))
        .map((o) => {
            const desc = STUDIO_ASPECT_DESCRIPTIONS[o.id];
            const sz = sizeMap && sizeMap[o.id] ? ` · ${sizeMap[o.id]}` : '';
            return {
                ...o,
                studioLabelRu: `${desc ? desc.ru : o.label}${sz}`,
                studioLabelEn: `${desc ? desc.en : o.labelEn}${sz}`,
            };
        });
}

function getTargetCanvasDimensions(aspectRatio = '1:1') {
    if (aspectRatio === '2:3') return { width: 1024, height: 1536 };
    if (aspectRatio === '3:4') return { width: 1152, height: 1536 };
    if (aspectRatio === '4:5') return { width: 1152, height: 1440 };
    if (aspectRatio === '3:2') return { width: 1536, height: 1024 };
    if (aspectRatio === '4:3') return { width: 1536, height: 1152 };
    if (aspectRatio === '5:4') return { width: 1440, height: 1152 };
    if (aspectRatio === '16:9') return { width: 1536, height: 864 };
    if (aspectRatio === '9:16') return { width: 864, height: 1536 };
    if (aspectRatio === '21:9') return { width: 1792, height: 768 };
    if (aspectRatio === '2:1') return { width: 1536, height: 768 };
    if (aspectRatio === '1:2') return { width: 768, height: 1536 };
    if (aspectRatio === '19.5:9' || aspectRatio === '20:9') return { width: 1600, height: 720 };
    if (aspectRatio === '9:19.5' || aspectRatio === '9:20') return { width: 720, height: 1600 };
    if (aspectRatio === '4:1') return { width: 1792, height: 448 };
    if (aspectRatio === '1:4') return { width: 448, height: 1792 };
    if (aspectRatio === '8:1') return { width: 1792, height: 224 };
    if (aspectRatio === '1:8') return { width: 224, height: 1792 };
    return { width: 1024, height: 1024 };
}

export function parseAspectRatioNumber(aspectRatio = '1:1') {
    const m = String(aspectRatio || '').trim().match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
    if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        if (a > 0 && b > 0) return a / b;
    }
    return null;
}

export function isWideCardAspect(aspectRatio = '') {
    const n = parseAspectRatioNumber(aspectRatio);
    return n !== null && n > 1.15;
}

export function coerceAspectToSupported(rawAspect = 'native', supportedIds = []) {
    const clean = String(rawAspect || '').trim();
    if (!clean || clean === 'native' || clean === 'sillyimages_default' || clean === 'auto') {
        return clean || 'native';
    }
    if (!Array.isArray(supportedIds) || supportedIds.length === 0 || supportedIds.includes(clean)) {
        return clean;
    }
    const num = parseAspectRatioNumber(clean);
    if (num !== null && num < 0.96) {
        for (const p of ['2:3', '3:4', '9:16', '4:5', '1:2', '9:19.5', '9:20']) {
            if (supportedIds.includes(p)) return p;
        }
    } else if (num !== null && num > 1.04) {
        for (const l of ['3:2', '16:9', '4:3', '5:4', '21:9', '2:1']) {
            if (supportedIds.includes(l)) return l;
        }
    } else if (supportedIds.includes('1:1')) {
        return '1:1';
    }
    return 'native';
}

export function sanitizeAspectForProvider(rawAspect = 'native', apiType = '') {
    const clean = String(rawAspect || '').trim();
    if (!clean || clean === 'native' || clean === 'sillyimages_default' || clean === 'auto') {
        return 'native';
    }
    const allowedAll = new Set(EXTENDED_PROVIDER_ASPECT_OPTIONS.map((o) => o.id));
    if (!allowedAll.has(clean)) return 'native';

    const pLow = String(apiType || '').toLowerCase();
    if (pLow === 'novelai' || pLow === 'naistera') {
        if (clean === '3:4' || clean === '4:5' || clean === '1:2' || clean === '9:19.5' || clean === '9:20' || clean === '1:4' || clean === '1:8') return '2:3';
        if (clean === '4:3' || clean === '5:4' || clean === '2:1') return '3:2';
        if (clean === '21:9' || clean === '19.5:9' || clean === '20:9' || clean === '4:1' || clean === '8:1') return '16:9';
    }
    if (pLow === 'xai') {
        if (clean === '4:5') return '3:4';
        if (clean === '5:4') return '4:3';
        if (clean === '21:9') return '20:9';
        if (clean === '4:1' || clean === '8:1') return '2:1';
        if (clean === '1:4' || clean === '1:8') return '1:2';
    }
    return clean;
}

function decodePngDataUrlBytesDirect(avatarDataUrl) {
    if (typeof avatarDataUrl !== 'string') return null;
    const trimmed = avatarDataUrl.trim();
    const b64Marker = ';base64,';
    const markerIdx = trimmed.indexOf(b64Marker);
    if (markerIdx === -1 || trimmed.slice(0, markerIdx).toLowerCase() !== 'data:image/png') return null;
    try {
        const rawB64 = trimmed.slice(markerIdx + b64Marker.length);
        const cleanB64 = /\s/.test(rawB64) ? rawB64.replace(/\s+/g, '') : rawB64;
        if (!cleanB64) return null;
        const bin = atob(cleanB64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i) & 0xff;
        if (!isValidNonEmptyPngBytes(arr)) return null;
        const width = (((arr[16] << 24) >>> 0) + ((arr[17] << 16) >>> 0) + ((arr[18] << 8) >>> 0) + (arr[19] >>> 0)) >>> 0;
        const height = (((arr[20] << 24) >>> 0) + ((arr[21] << 16) >>> 0) + ((arr[22] << 8) >>> 0) + (arr[23] >>> 0)) >>> 0;
        return { bytes: arr, width, height };
    } catch {
        return null;
    }
}

// Valid minimal 1x1 RGB PNG fallback for headless Node unit tests without HTMLCanvasElement
const MINIMAL_1X1_PNG_BYTES = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222,
    0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 221, 141, 176,
    0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

function buildHeadlessPlaceholderPng(charName = 'NMF', accentHex = '#1de9b6') {
    const labelBytes = new TextEncoder().encode(`Title\0${String(charName || 'NMF').slice(0, 32)}:${String(accentHex || '')}`);
    const typeBytes = new Uint8Array([0x74, 0x45, 0x58, 0x74]); // tEXt
    const crcInput = new Uint8Array(4 + labelBytes.length);
    crcInput.set(typeBytes, 0);
    crcInput.set(labelBytes, 4);
    const crcVal = crc32(crcInput);

    const chunk = new Uint8Array(12 + labelBytes.length);
    const len = labelBytes.length;
    chunk[0] = (len >>> 24) & 0xff;
    chunk[1] = (len >>> 16) & 0xff;
    chunk[2] = (len >>> 8) & 0xff;
    chunk[3] = len & 0xff;
    chunk.set(typeBytes, 4);
    chunk.set(labelBytes, 8);
    const crcOff = 8 + len;
    chunk[crcOff] = (crcVal >>> 24) & 0xff;
    chunk[crcOff + 1] = (crcVal >>> 16) & 0xff;
    chunk[crcOff + 2] = (crcVal >>> 8) & 0xff;
    chunk[crcOff + 3] = crcVal & 0xff;

    const iendOffset = MINIMAL_1X1_PNG_BYTES.length - 12;
    const out = new Uint8Array(MINIMAL_1X1_PNG_BYTES.length + chunk.length);
    out.set(MINIMAL_1X1_PNG_BYTES.subarray(0, iendOffset), 0);
    out.set(chunk, iendOffset);
    out.set(MINIMAL_1X1_PNG_BYTES.subarray(iendOffset), iendOffset + chunk.length);
    return out;
}

// Strictly lossless, zero-downscale PNG builder:
// - Never shrinks 2K/4K artwork or applies lossy compression.
// - Bypasses <canvas> completely (bit-for-bit pass-through) whenever input is already a PNG matching 'native' or target aspect ratio.
// - When cropping or converting JPEG/WebP -> PNG, outputs at 100% native pixel density of the source crop window.
export async function ensurePngBytes(avatarDataUrl, charName = 'NMF', accentHex = '#1de9b6', { aspectRatio = '1:1', cropFocus = 'top' } = {}) {
    const directPng = decodePngDataUrlBytesDirect(avatarDataUrl);
    const targetRatio = aspectRatio === 'native' ? null : parseAspectRatioNumber(aspectRatio);

    if (directPng) {
        const srcRatio = directPng.width / directPng.height;
        const ratioAlreadyMatches = targetRatio !== null && Math.abs(srcRatio - targetRatio) / targetRatio <= 0.015;
        if (aspectRatio === 'native' || (ratioAlreadyMatches && cropFocus !== 'contain')) {
            return directPng.bytes;
        }
    }

    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
        if (directPng) return directPng.bytes;
        return buildHeadlessPlaceholderPng(charName, accentHex);
    }

    const dims = getTargetCanvasDimensions(aspectRatio === 'native' ? '1:1' : aspectRatio);
    const canvas = document.createElement('canvas');
    canvas.width = dims.width;
    canvas.height = dims.height;
    const g = canvas.getContext('2d');

    if (!g) {
        return directPng ? directPng.bytes : new Uint8Array(MINIMAL_1X1_PNG_BYTES);
    }

    if (avatarDataUrl) {
        try {
            const img = await new Promise((resolve, reject) => {
                const el = new Image();
                el.crossOrigin = 'anonymous';
                el.onload = () => resolve(el);
                el.onerror = reject;
                el.src = avatarDataUrl;
            });

            const srcW = Math.max(1, img.naturalWidth || img.width);
            const srcH = Math.max(1, img.naturalHeight || img.height);

            if (aspectRatio === 'native' || targetRatio === null) {
                // 100% native pixel dimensions — zero downscaling!
                canvas.width = srcW;
                canvas.height = srcH;
                g.imageSmoothingEnabled = false;
                g.drawImage(img, 0, 0, srcW, srcH);
            } else if (cropFocus === 'contain') {
                // Fit entire image inside target aspect ratio at 100% native pixel resolution (zero shrinking!)
                const srcRatio = srcW / srcH;
                const outW = srcRatio >= targetRatio ? srcW : Math.max(1, Math.round(srcH * targetRatio));
                const outH = srcRatio >= targetRatio ? Math.max(1, Math.round(srcW / targetRatio)) : srcH;
                canvas.width = outW;
                canvas.height = outH;
                g.fillStyle = '#0b0e13';
                g.fillRect(0, 0, outW, outH);
                const dx = Math.round((outW - srcW) / 2);
                const dy = Math.round((outH - srcH) / 2);
                g.imageSmoothingEnabled = false;
                g.drawImage(img, dx, dy, srcW, srcH);
            } else {
                // Crop to target aspect ratio at 100% native pixel density of the source crop area (zero downscaling!)
                const srcRatio = srcW / srcH;
                let sw = srcW;
                let sh = srcH;
                if (srcRatio > targetRatio) {
                    sw = Math.max(1, Math.round(srcH * targetRatio));
                } else if (srcRatio < targetRatio) {
                    sh = Math.max(1, Math.round(srcW / targetRatio));
                }
                const sx = Math.max(0, Math.round((srcW - sw) / 2));
                const sy = cropFocus === 'top'
                    ? Math.max(0, Math.round((srcH - sh) * 0.14))
                    : Math.max(0, Math.round((srcH - sh) / 2));

                canvas.width = sw;
                canvas.height = sh;
                g.imageSmoothingQuality = 'high';
                g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            }

            const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
            return new Uint8Array(await blob.arrayBuffer());
        } catch (err) {
            if (directPng) return directPng.bytes;
            console.warn('[NexusMatch Forge] Avatar decode fallback:', err);
        }
    }

    // Technical geometric monogram placeholder
    g.fillStyle = '#0d1117';
    g.fillRect(0, 0, dims.width, dims.height);

    g.strokeStyle = accentHex;
    g.globalAlpha = 0.25;
    g.lineWidth = 2;
    g.strokeRect(22, 22, dims.width - 44, dims.height - 44);
    g.strokeRect(34, 34, dims.width - 68, dims.height - 68);

    g.globalAlpha = 0.12;
    for (let y = 60; y < dims.height; y += 44) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(dims.width, y);
        g.stroke();
    }

    g.globalAlpha = 1;
    const initials = String(charName || 'NM')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] || '')
        .join('')
        .toUpperCase() || 'NM';

    g.fillStyle = accentHex;
    g.font = `700 ${Math.round(dims.width * 0.27)}px Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(initials, dims.width / 2, dims.height * 0.45);

    g.fillStyle = '#a3b1c2';
    g.font = `600 ${Math.max(16, Math.round(dims.width * 0.032))}px monospace`;
    g.fillText('NEXUSMATCH FORGE // V2', dims.width / 2, dims.height * 0.62);

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
}

export function embedCharaChunkIntoPng(pngBytes, cardObj) {
    const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
        if (pngBytes[i] !== PNG_SIG[i]) {
            throw new Error('Некорректный заголовок PNG.');
        }
    }

    const keyword = new TextEncoder().encode('chara');
    const b64Payload = new TextEncoder().encode(utf8ToBase64(JSON.stringify(cardObj)));
    const chunkData = new Uint8Array(keyword.length + 1 + b64Payload.length);
    chunkData.set(keyword, 0);
    chunkData[keyword.length] = 0;
    chunkData.set(b64Payload, keyword.length + 1);

    const typeBytes = new TextEncoder().encode('tEXt');
    const crcInput = new Uint8Array(4 + chunkData.length);
    crcInput.set(typeBytes, 0);
    crcInput.set(chunkData, 4);
    const crcVal = crc32(crcInput);

    const fullChunk = new Uint8Array(4 + 4 + chunkData.length + 4);
    const dv = new DataView(fullChunk.buffer);
    dv.setUint32(0, chunkData.length, false);
    fullChunk.set(typeBytes, 4);
    fullChunk.set(chunkData, 8);
    dv.setUint32(8 + chunkData.length, crcVal, false);

    const keptChunks = [pngBytes.subarray(0, 8)];
    let offset = 8;
    let inserted = false;

    while (offset + 8 <= pngBytes.length) {
        const view = new DataView(pngBytes.buffer, pngBytes.byteOffset + offset, 8);
        const len = view.getUint32(0, false);
        const type = String.fromCharCode(
            pngBytes[offset + 4],
            pngBytes[offset + 5],
            pngBytes[offset + 6],
            pngBytes[offset + 7],
        );
        const total = 12 + len;
        if (offset + total > pngBytes.length) break;

        if (type === 'tEXt' || type === 'iTXt') {
            const kEnd = pngBytes.indexOf(0, offset + 8);
            if (kEnd > offset + 8 && kEnd < offset + 8 + 16) {
                const kw = new TextDecoder().decode(pngBytes.subarray(offset + 8, kEnd)).toLowerCase();
                if (kw === 'chara' || kw === 'ccv3') {
                    offset += total;
                    continue;
                }
            }
        }
        if (type === 'IEND' && !inserted) {
            keptChunks.push(fullChunk);
            inserted = true;
        }
        keptChunks.push(pngBytes.subarray(offset, offset + total));
        offset += total;
    }

    if (!inserted) keptChunks.push(fullChunk);
    const totalLen = keptChunks.reduce((acc, a) => acc + a.length, 0);
    const out = new Uint8Array(totalLen);
    let pos = 0;
    for (const part of keptChunks) {
        out.set(part, pos);
        pos += part.length;
    }
    return out;
}

// Round-trip PNG 'chara' metadata reader for verification & tests (Test #26)
export function extractCharaJsonFromPng(pngBytes) {
    const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
        if (pngBytes[i] !== PNG_SIG[i]) {
            throw new Error('Некорректная сигнатура PNG.');
        }
    }
    let offset = 8;
    while (offset + 8 <= pngBytes.length) {
        const view = new DataView(pngBytes.buffer, pngBytes.byteOffset + offset, 8);
        const len = view.getUint32(0, false);
        const type = String.fromCharCode(
            pngBytes[offset + 4],
            pngBytes[offset + 5],
            pngBytes[offset + 6],
            pngBytes[offset + 7],
        );
        const total = 12 + len;
        if (offset + total > pngBytes.length) break;

        if (type === 'tEXt') {
            const dataStart = offset + 8;
            const dataEnd = dataStart + len;
            const nul = pngBytes.indexOf(0, dataStart);
            if (nul > dataStart && nul < dataEnd) {
                const kw = new TextDecoder().decode(pngBytes.subarray(dataStart, nul)).toLowerCase();
                if (kw === 'chara') {
                    const b64 = new TextDecoder().decode(pngBytes.subarray(nul + 1, dataEnd));
                    return JSON.parse(base64ToUtf8(b64));
                }
            }
        }
        offset += total;
    }
    throw new Error('В PNG отсутствует блок метаданных chara.');
}

export async function buildCardPngBlob(card, accentHex = '#1de9b6', cropOpts = {}, explicitAvatarDataUrl = '') {
    const v2 = buildV2CardObject(card);
    const effectiveAvatar = explicitAvatarDataUrl || card.avatarDataUrl || '';
    const rawPng = await ensurePngBytes(effectiveAvatar, v2.data?.name || v2.name, accentHex, cropOpts);
    const withMeta = embedCharaChunkIntoPng(rawPng, v2);
    return new Blob([withMeta], { type: 'image/png' });
}

// Modal-safe download helper for Android Chrome & Desktop:
// Appends <a> inside open <dialog> (avoiding HTML5 showModal() inertness on document.body!) and holds blob URL for 60s
export function triggerDownload(blob, filename) {
    if (typeof document === 'undefined' || !blob) return false;
    const safeName = String(filename || 'download.bin').trim().replace(/[\\/:*?"<>|]+/g, '_');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    a.rel = 'noopener';
    a.style.position = 'fixed';
    a.style.left = '-4096px';
    a.style.opacity = '0';

    const mountTarget = document.getElementById('nmf-dialog')
        || document.querySelector('dialog[open]')
        || document.body;
    mountTarget.appendChild(a);
    a.click();

    const tRemove = setTimeout(() => {
        try { a.remove(); } catch {}
    }, 2500);
    const tRevoke = setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch {}
    }, 60_000);
    tRemove?.unref?.();
    tRevoke?.unref?.();
    return true;
}

export function dataUrlToPureBlob(dataUrl) {
    const clean = String(dataUrl || '').trim();
    const b64Marker = ';base64,';
    const markerIdx = clean.indexOf(b64Marker);
    const header = markerIdx > 5 ? clean.slice(0, markerIdx) : '';
    if (!/^data:image\/[a-zA-Z0-9.+-]+$/i.test(header)) {
        throw new Error('Некорректный формат изображения для скачивания.');
    }
    const mime = header.slice(5).toLowerCase();
    const rawB64 = clean.slice(markerIdx + b64Marker.length);
    const cleanB64 = /\s/.test(rawB64) ? rawB64.replace(/\s+/g, '') : rawB64;
    if (!cleanB64) {
        throw new Error('Некорректный формат изображения для скачивания.');
    }
    const bin = atob(cleanB64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
    const ext = mime.includes('jpeg') || mime.includes('jpg')
        ? 'jpg'
        : (mime.includes('webp') ? 'webp' : (mime.includes('gif') ? 'gif' : 'png'));
    return { blob: new Blob([bytes], { type: mime }), ext, mime };
}

// Strict NEW-card import only — never overwrites existing character files (fixes NMF-001)
export async function importCardIntoTavern(card, { avatarDataUrl = '', accentHex = '#1de9b6', aspectRatio = '1:1', cropFocus = 'top' } = {}) {
    if (!String(card?.name || '').trim()) {
        throw new Error('Укажите название или имя перед сохранением в Таверну.');
    }
    const ctx = getTavernContext();
    const pngBlob = await buildCardPngBlob(card, accentHex, { aspectRatio, cropFocus }, avatarDataUrl);
    const safeSlug = String(card.name).trim().replace(/[\\/:*?"<>|]+/g, '_') || 'Character';
    const file = new File([pngBlob], `${safeSlug}.png`, { type: 'image/png' });

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('file_type', 'png');
    formData.append('user_name', ctx?.name1 || 'User');

    const res = await fetch('/api/characters/import', {
        method: 'POST',
        headers: getTavernHeaders({ omitContentType: true }),
        body: formData,
        cache: 'no-cache',
    });
    if (!res.ok) {
        throw new Error(`Ошибка сохранения новой карточки в Таверну (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (data?.error) {
        throw new Error(
            data.error === true
                ? 'SillyTavern не смогла прочитать PNG-файл карточки при импорте.'
                : String(data.error),
        );
    }

    if (typeof ctx?.getCharacters === 'function') {
        await ctx.getCharacters();
    }
    return data?.file_name ? `${data.file_name}.png` : `${safeSlug}.png`;
}

// Fetch FULL character record even when performance.lazyLoadCharacters is enabled (fixes NMF-002)
export async function fetchFullTavernCharacter(avatarUrl, { signal = null } = {}) {
    const cleanAvatar = String(avatarUrl || '').trim();
    if (!cleanAvatar) {
        throw new Error('Не указан идентификатор файла персонажа (avatar_url).');
    }

    const ctx = getTavernContext();
    if (typeof ctx?.unshallowCharacter === 'function' && Array.isArray(ctx?.characters)) {
        const idx = ctx.characters.findIndex((c) => c?.avatar === cleanAvatar);
        if (idx >= 0) {
            try {
                await ctx.unshallowCharacter(idx);
            } catch {
                // Continue to authoritative /api/characters/get
            }
        }
    }

    const res = await fetch('/api/characters/get', {
        method: 'POST',
        headers: getTavernHeaders(),
        body: JSON.stringify({ avatar_url: cleanAvatar }),
        cache: 'no-cache',
        signal,
    });

    if (res.status === 404) {
        const err = new Error(`Исходная карточка «${cleanAvatar}» не найдена на диске (возможно, она была удалена или переименована).`);
        err.code = 'CARD_NOT_FOUND';
        throw err;
    }
    if (!res.ok) {
        throw new Error(`Не удалось загрузить полную карточку «${cleanAvatar}» (HTTP ${res.status}).`);
    }

    const fullChar = await res.json();
    if (!fullChar || typeof fullChar !== 'object') {
        throw new Error(`Сервер вернул пустые данные для карточки «${cleanAvatar}».`);
    }

    const rawCardObject = extractRawCardJsonFromTavernChar(fullChar);
    return {
        fullChar,
        rawCardObject,
        snapshotHash: computeCardSnapshotHash(rawCardObject),
    };
}

const MISSING_MERGE_ROUTE_STATUSES = new Set([404, 405, 501]);

const STANDARD_V2_DATA_KEYS = new Set([
    'name',
    'description',
    'personality',
    'scenario',
    'first_mes',
    'mes_example',
    'creator_notes',
    'system_prompt',
    'post_history_instructions',
    'alternate_greetings',
    'tags',
    'creator',
    'character_version',
    'character_book',
    'extensions',
]);

const KNOWN_TOP_LEVEL_KEYS = new Set([
    'name',
    'description',
    'personality',
    'scenario',
    'first_mes',
    'mes_example',
    'creatorcomment',
    'avatar',
    'chat',
    'create_date',
    'talkativeness',
    'fav',
    'tags',
    'spec',
    'spec_version',
    'data',
    'json_data',
    'shallow',
]);

function extractEffectiveFav(raw) {
    if (raw?.data?.extensions?.fav !== undefined) return Boolean(raw.data.extensions.fav);
    return Boolean(raw?.fav);
}

function extractEffectiveTalkativeness(raw) {
    const val = raw?.data?.extensions?.talkativeness !== undefined
        ? raw.data.extensions.talkativeness
        : (raw?.talkativeness !== undefined ? raw.talkativeness : 0.5);
    const num = Number(val);
    return Number.isFinite(num) ? String(num) : String(val);
}

function extractEffectiveDepthPrompt(raw) {
    const dp = raw?.data?.extensions?.depth_prompt;
    if (!dp || typeof dp !== 'object') return null;
    return {
        prompt: String(dp.prompt ?? ''),
        depth: Number(dp.depth ?? 4),
        role: String(dp.role ?? 'system'),
    };
}

function readActualFieldFromRawCard(raw, field) {
    const d = (raw?.data && typeof raw.data === 'object') ? raw.data : (raw || {});
    switch (field) {
        case 'name':
            return String(d.name ?? raw?.name ?? '').trim();
        case 'description':
            return String(d.description ?? raw?.description ?? '');
        case 'personality':
            return String(d.personality ?? raw?.personality ?? '');
        case 'scenario':
            return String(d.scenario ?? raw?.scenario ?? '');
        case 'first_mes':
            return String(d.first_mes ?? raw?.first_mes ?? '');
        case 'mes_example':
            return String(d.mes_example ?? raw?.mes_example ?? '');
        case 'creator_notes':
            return String(d.creator_notes ?? raw?.creatorcomment ?? '');
        case 'system_prompt':
            return String(d.system_prompt ?? '');
        case 'post_history_instructions':
            return String(d.post_history_instructions ?? '');
        case 'alternate_greetings':
            return parseAltGreetingsArray(d.alternate_greetings).map((s) => s.trim()).filter(Boolean);
        case 'tags':
            return parseTagsArray(d.tags !== undefined ? d.tags : raw?.tags);
        case 'creator':
            return String(d.creator ?? '');
        case 'character_version':
            return String(d.character_version ?? '1.0');
        case 'world':
            return String(d?.extensions?.world ?? '').trim();
        case 'imagePrompt':
            return String(d?.extensions?.nexus_match_forge?.image_prompt ?? '').trim();
        default:
            return '';
    }
}

// Strict post-save invariant & requested-diff verifier (fixes P1-C)
export function verifyPostSaveIntegrity({ beforeRaw, afterRaw, card, dirtyFields = [] }) {
    const mismatches = [];
    if (!afterRaw || typeof afterRaw !== 'object') {
        return { ok: false, mismatches: ['Сервер вернул пустой объект карточки при контрольном чтении.'] };
    }

    const dirtySet = new Set(Array.isArray(dirtyFields) ? dirtyFields : []);

    // 1. Protected SillyTavern state invariants
    if (extractEffectiveFav(afterRaw) !== extractEffectiveFav(beforeRaw)) {
        mismatches.push(`Статус fav изменился (${extractEffectiveFav(beforeRaw)} -> ${extractEffectiveFav(afterRaw)})`);
    }
    if (beforeRaw?.chat !== undefined && String(afterRaw?.chat ?? '') !== String(beforeRaw.chat)) {
        mismatches.push(`Привязка chat изменилась (${beforeRaw.chat} -> ${afterRaw?.chat})`);
    }
    if (beforeRaw?.create_date !== undefined && String(afterRaw?.create_date ?? '') !== String(beforeRaw.create_date)) {
        mismatches.push(`Поле create_date изменилось (${beforeRaw.create_date} -> ${afterRaw?.create_date})`);
    }
    if (extractEffectiveTalkativeness(afterRaw) !== extractEffectiveTalkativeness(beforeRaw)) {
        mismatches.push(`Поле talkativeness изменилось (${extractEffectiveTalkativeness(beforeRaw)} -> ${extractEffectiveTalkativeness(afterRaw)})`);
    }
    if (stableStringify(extractEffectiveDepthPrompt(afterRaw)) !== stableStringify(extractEffectiveDepthPrompt(beforeRaw))) {
        mismatches.push('Встроенный depth_prompt изменился или был сброшен');
    }
    if (stableStringify(afterRaw?.data?.character_book ?? null) !== stableStringify(beforeRaw?.data?.character_book ?? null)) {
        mismatches.push('Встроенный character_book изменился или был потерян');
    }

    // 2. Third-party data.extensions preservation
    const beforeExt = beforeRaw?.data?.extensions || {};
    const afterExt = afterRaw?.data?.extensions || {};
    const reservedExt = new Set(['talkativeness', 'fav', 'depth_prompt', 'nexus_match_forge']);
    if (dirtySet.has('world')) reservedExt.add('world');

    for (const extKey of Object.keys(beforeExt)) {
        if (reservedExt.has(extKey)) continue;
        if (stableStringify(afterExt[extKey]) !== stableStringify(beforeExt[extKey])) {
            mismatches.push(`Потеряно или изменено поле расширения data.extensions.${extKey}`);
        }
    }

    // 3. Unknown V2 fields preservation (both inside data.* and custom top-level properties)
    const beforeData = beforeRaw?.data || {};
    const afterData = afterRaw?.data || {};
    for (const k of Object.keys(beforeData)) {
        if (STANDARD_V2_DATA_KEYS.has(k)) continue;
        if (stableStringify(afterData[k]) !== stableStringify(beforeData[k])) {
            mismatches.push(`Потеряно или изменено пользовательское поле data.${k}`);
        }
    }
    for (const k of Object.keys(beforeRaw || {})) {
        if (KNOWN_TOP_LEVEL_KEYS.has(k)) continue;
        if (stableStringify(afterRaw?.[k]) !== stableStringify(beforeRaw[k])) {
            mismatches.push(`Потеряно или изменено поле верхнего уровня ${k}`);
        }
    }

    // 4. Unmodified standard V2 fields must stay identical, and modified dirtyFields must match requested values
    for (const field of ALL_EDITABLE_CARD_FIELDS) {
        const afterVal = readActualFieldFromRawCard(afterRaw, field);
        if (dirtySet.has(field)) {
            const expectedVal = readComparableFieldFromState(card, field);
            if (stableStringify(afterVal) !== stableStringify(expectedVal)) {
                mismatches.push(`Изменённое поле «${field}» не применилось корректно на сервере`);
            }
        } else {
            const beforeVal = readActualFieldFromRawCard(beforeRaw, field);
            if (stableStringify(afterVal) !== stableStringify(beforeVal)) {
                mismatches.push(`Неизменяемое поле «${field}» изменилось без запроса пользователя`);
            }
        }
    }

    return {
        ok: mismatches.length === 0,
        mismatches,
    };
}

async function uploadAvatarPngBytesToTavern(targetAvatar, pngBytes) {
    const imgFile = new File([new Blob([pngBytes], { type: 'image/png' })], targetAvatar, { type: 'image/png' });
    const fd = new FormData();
    fd.append('avatar', imgFile);
    fd.append('avatar_url', targetAvatar);

    return fetch('/api/characters/edit-avatar', {
        method: 'POST',
        headers: getTavernHeaders({ omitContentType: true }),
        body: fd,
        cache: 'no-cache',
    });
}

const UNSET_SENTINEL = '__@@UNSET@@__';

// Extracts non-'chara' visual PNG chunks so pixel updates / rollbacks can be verified deterministically (fixes P2-01 & P1-03)
export function stripPngCharaChunkBytes(pngBytes) {
    if (!(pngBytes instanceof Uint8Array) || pngBytes.length < 33) return new Uint8Array(0);
    const chunks = [pngBytes.subarray(0, 8)];
    let offset = 8;
    let total = 8;

    while (offset + 12 <= pngBytes.length) {
        const len = (
            ((pngBytes[offset] << 24) >>> 0) +
            ((pngBytes[offset + 1] << 16) >>> 0) +
            ((pngBytes[offset + 2] << 8) >>> 0) +
            (pngBytes[offset + 3] >>> 0)
        ) >>> 0;
        const type = String.fromCharCode(
            pngBytes[offset + 4],
            pngBytes[offset + 5],
            pngBytes[offset + 6],
            pngBytes[offset + 7]
        );
        const end = offset + 12 + len;
        if (end > pngBytes.length) break;

        let isCharaText = false;
        if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
            const dataStart = offset + 8;
            if (len >= 6) {
                const kw = String.fromCharCode(...pngBytes.subarray(dataStart, Math.min(dataStart + 6, end)));
                if (kw === 'chara\0') isCharaText = true;
            }
        }

        if (!isCharaText) {
            const slice = pngBytes.subarray(offset, end);
            chunks.push(slice);
            total += slice.length;
        }
        offset = end;
        if (type === 'IEND') break;
    }

    const out = new Uint8Array(total);
    let pos = 0;
    for (const c of chunks) {
        out.set(c, pos);
        pos += c.length;
    }
    return out;
}

function areByteArraysEqual(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function buildEditFormDataFromMergedCard(targetAvatar, mergedFull, referenceRawCard) {
    const origD = referenceRawCard?.data || {};
    const origExt = origD.extensions || {};
    const hasEmbeddedBook = Boolean(mergedFull?.data?.character_book && typeof mergedFull.data.character_book === 'object');
    const editFd = new FormData();
    editFd.append('avatar_url', targetAvatar);
    editFd.append('ch_name', mergedFull.data?.name || mergedFull.name || 'Unnamed');
    editFd.append('description', mergedFull.data?.description ?? mergedFull.description ?? '');
    editFd.append('personality', mergedFull.data?.personality ?? mergedFull.personality ?? '');
    editFd.append('scenario', mergedFull.data?.scenario ?? mergedFull.scenario ?? '');
    editFd.append('first_mes', mergedFull.data?.first_mes ?? mergedFull.first_mes ?? '');
    editFd.append('mes_example', mergedFull.data?.mes_example ?? mergedFull.mes_example ?? '');
    editFd.append('creator_notes', mergedFull.data?.creator_notes ?? mergedFull.creatorcomment ?? '');
    editFd.append('system_prompt', mergedFull.data?.system_prompt ?? '');
    editFd.append('post_history_instructions', mergedFull.data?.post_history_instructions ?? '');
    editFd.append('creator', mergedFull.data?.creator ?? '');
    editFd.append('character_version', mergedFull.data?.character_version ?? '1.0');
    for (const alt of (mergedFull.data?.alternate_greetings || [])) {
        editFd.append('alternate_greetings', alt);
    }
    editFd.append('tags', (mergedFull.data?.tags || []).join(', '));
    editFd.append('fav', String(extractEffectiveFav(referenceRawCard)));
    editFd.append('talkativeness', String(referenceRawCard?.talkativeness ?? origExt.talkativeness ?? 0.5));
    // Important (fixes P1-03): in SillyTavern charaFormatData, non-empty form 'world' overwrites json_data.data.character_book!
    // When an embedded character_book exists, pass '' in form 'world' while preserving extensions.world inside 'extensions' JSON.
    editFd.append('world', hasEmbeddedBook ? '' : String(mergedFull.data?.extensions?.world ?? origExt.world ?? ''));
    editFd.append('depth_prompt_prompt', String(origExt.depth_prompt?.prompt ?? ''));
    editFd.append('depth_prompt_depth', String(origExt.depth_prompt?.depth ?? 4));
    editFd.append('depth_prompt_role', String(origExt.depth_prompt?.role ?? 'system'));
    if (referenceRawCard?.chat !== undefined) {
        editFd.append('chat', String(referenceRawCard.chat));
    }
    if (referenceRawCard?.create_date !== undefined) {
        editFd.append('create_date', String(referenceRawCard.create_date));
    }
    editFd.append('extensions', JSON.stringify(mergedFull.data?.extensions || {}));
    editFd.append('json_data', JSON.stringify(mergedFull));
    return editFd;
}

function buildObjectRestorePatchWithSentinels(targetObj, currentObj) {
    const isPlain = (v) => Boolean(v && typeof v === 'object' && !Array.isArray(v));
    if (!isPlain(targetObj)) {
        return targetObj === undefined ? UNSET_SENTINEL : structuredClone(targetObj);
    }
    const patch = {};
    const cur = isPlain(currentObj) ? currentObj : {};
    const allKeys = new Set([...Object.keys(targetObj), ...Object.keys(cur)]);
    for (const k of allKeys) {
        if (k === 'json_data' || k === 'shallow') continue;
        if (!(k in targetObj) || targetObj[k] === undefined) {
            patch[k] = UNSET_SENTINEL;
        } else if (isPlain(targetObj[k]) && isPlain(cur[k])) {
            patch[k] = buildObjectRestorePatchWithSentinels(targetObj[k], cur[k]);
        } else {
            patch[k] = structuredClone(targetObj[k]);
        }
    }
    return patch;
}

export function summarizeExternalDivergence(expectedRaw, liveRaw) {
    const diffs = [];
    if (!expectedRaw || !liveRaw) return diffs;
    if (String(expectedRaw.chat ?? '') !== String(liveRaw.chat ?? '')) diffs.push('chat');
    if (extractEffectiveFav(expectedRaw) !== extractEffectiveFav(liveRaw)) diffs.push('fav');
    for (const f of ALL_EDITABLE_CARD_FIELDS) {
        if (stableStringify(readActualFieldFromRawCard(expectedRaw, f)) !== stableStringify(readActualFieldFromRawCard(liveRaw, f))) {
            diffs.push(FIELD_LABELS_RU[f] || f);
        }
    }
    if (stableStringify(expectedRaw?.data?.character_book ?? null) !== stableStringify(liveRaw?.data?.character_book ?? null)) {
        diffs.push('character_book');
    }
    if (stableStringify(expectedRaw?.data?.extensions ?? {}) !== stableStringify(liveRaw?.data?.extensions ?? {})) {
        diffs.push('data.extensions');
    }
    return [...new Set(diffs)];
}

async function applyFullJsonRestoreToTavern(avatarFileName, targetRawJson, currentLiveRawJson) {
    const cleanTarget = structuredClone(targetRawJson);
    delete cleanTarget.json_data;
    delete cleanTarget.shallow;

    const mergePayload = buildObjectRestorePatchWithSentinels(cleanTarget, currentLiveRawJson || {});
    mergePayload.avatar = avatarFileName;

    const mergeRes = await fetch('/api/characters/merge-attributes', {
        method: 'POST',
        headers: getTavernHeaders(),
        body: JSON.stringify(mergePayload),
        cache: 'no-cache',
    });

    if (MISSING_MERGE_ROUTE_STATUSES.has(mergeRes.status)) {
        const editFd = buildEditFormDataFromMergedCard(avatarFileName, cleanTarget, cleanTarget);
        const editRes = await fetch('/api/characters/edit', {
            method: 'POST',
            headers: getTavernHeaders({ omitContentType: true }),
            body: editFd,
            cache: 'no-cache',
        });
        if (!editRes.ok) {
            throw new Error(`Не удалось восстановить поля JSON через /edit (HTTP ${editRes.status}).`);
        }
        return;
    }

    if (!mergeRes.ok) {
        const txt = await mergeRes.text().catch(() => '');
        throw new Error(`Не удалось восстановить поля JSON через /merge-attributes (HTTP ${mergeRes.status}): ${txt.slice(0, 160)}`);
    }
}

export function verifyRestoredCardExactMatch(backupRawJson, afterRawJson) {
    const baseState = createCardStateFromTavernChar({
        ...structuredClone(backupRawJson),
        avatar: backupRawJson?.avatar || 'restored.png',
        json_data: JSON.stringify(backupRawJson),
    });
    return verifyPostSaveIntegrity({
        beforeRaw: backupRawJson,
        afterRaw: afterRawJson,
        card: baseState,
        dirtyFields: [],
    });
}

async function applyTextFieldsUpdateToTavern(targetAvatar, card, dirtyFields, baseRawObject) {
    const mergePayload = buildSurgicalMergePayload(targetAvatar, card);
    const mergeRes = await fetch('/api/characters/merge-attributes', {
        method: 'POST',
        headers: getTavernHeaders(),
        body: JSON.stringify(mergePayload),
        cache: 'no-cache',
    });

    // Fallback to /api/characters/edit ONLY when /merge-attributes route is explicitly unsupported (404/405/501 — fixes P2-F)
    if (MISSING_MERGE_ROUTE_STATUSES.has(mergeRes.status)) {
        const mergedFull = buildV2CardObject({
            ...card,
            originalCardData: baseRawObject,
            dirtyFields,
        });
        const editFd = buildEditFormDataFromMergedCard(targetAvatar, mergedFull, baseRawObject);
        const fallbackRes = await fetch('/api/characters/edit', {
            method: 'POST',
            headers: getTavernHeaders({ omitContentType: true }),
            body: editFd,
            cache: 'no-cache',
        });
        if (!fallbackRes.ok) {
            const fbTxt = await fallbackRes.text().catch(() => '');
            throw new Error(`Ошибка сохранения полей карточки через /edit (HTTP ${fallbackRes.status}): ${fbTxt.slice(0, 160)}`);
        }
        return;
    }

    if (!mergeRes.ok) {
        const errTxt = await mergeRes.text().catch(() => '');
        throw new Error(`Ошибка слияния полей карточки (HTTP ${mergeRes.status}): ${errTxt.slice(0, 180)}`);
    }
}

// Guarded lossless restore from durable Backup Vault with default conflict protection (fixes P1-01 & P1-03)
export async function restoreCardFromBackupVault(
    backupId,
    { allowExternalChangeOverride = false, expectedSnapshotHash = '' } = {}
) {
    const bak = await getCardBackupById(backupId);
    if (!bak || !bak.avatarFileName || !bak.pngBase64 || !bak.cardJson) {
        const err = new Error('Резервная копия не найдена или не содержит полного снимка PNG + JSON.');
        err.code = 'BACKUP_NOT_FOUND';
        throw err;
    }

    const pngBytes = base64ToBytes(bak.pngBase64);
    if (!isValidNonEmptyPngBytes(pngBytes)) {
        const err = new Error('Байты PNG в резервной копии повреждены.');
        err.code = 'BACKUP_INVALID_PNG';
        throw err;
    }

    const liveCurrent = await fetchFullTavernCharacter(bak.avatarFileName);
    const baselineHash = String(expectedSnapshotHash || computeCardSnapshotHash(bak.cardJson) || '').trim();
    if (!allowExternalChangeOverride && baselineHash && liveCurrent.snapshotHash && liveCurrent.snapshotHash !== baselineHash) {
        const changedFields = summarizeExternalDivergence(bak.cardJson, liveCurrent.rawCardObject);
        const err = new Error(
            `После создания снимка карточка была изменена другим процессом (${changedFields.join(', ') || 'обнаружены новые правки'}). Подтвердите принудительное восстановление, если хотите перезаписать новые изменения.`
        );
        err.code = 'EXTERNAL_CARD_MODIFIED';
        err.changedFields = changedFields;
        err.currentSnapshotHash = liveCurrent.snapshotHash;
        err.backupId = bak.id;
        throw err;
    }

    const avRes = await uploadAvatarPngBytesToTavern(bak.avatarFileName, pngBytes);
    if (!avRes.ok) {
        throw new Error(`Не удалось восстановить исходный PNG из бэкапа (HTTP ${avRes.status}).`);
    }

    try {
        await applyFullJsonRestoreToTavern(bak.avatarFileName, bak.cardJson, liveCurrent.rawCardObject);
    } catch (jsonErr) {
        const partialErr = new Error(
            `Частичное восстановление (PARTIAL_RESTORE): исходный PNG записан, но восстановление JSON завершилось ошибкой (${jsonErr.message}). Повторите восстановление или импортируйте скачанный бэкап PNG.`
        );
        partialErr.code = 'PARTIAL_RESTORE';
        partialErr.backupId = bak.id;
        partialErr.avatarRestored = true;
        partialErr.fieldsRestored = false;
        partialErr.cause = jsonErr;
        throw partialErr;
    }

    // Strict post-restore verification of BOTH full V2 JSON (including character_book!) AND PNG avatar bytes
    const afterRestore = await fetchFullTavernCharacter(bak.avatarFileName);
    const jsonCheck = verifyRestoredCardExactMatch(bak.cardJson, afterRestore.rawCardObject);
    if (!jsonCheck.ok) {
        const verErr = new Error(
            `Проверка целостности после восстановления не пройдена: ${jsonCheck.mismatches.join('; ')}`
        );
        verErr.code = 'INTEGRITY_RESTORE_FAILED';
        verErr.mismatches = jsonCheck.mismatches;
        verErr.backupId = bak.id;
        throw verErr;
    }

    const imgCheckRes = await fetch(`/characters/${encodeURIComponent(bak.avatarFileName)}`, { cache: 'no-cache' });
    const afterPngBytes = imgCheckRes.ok ? new Uint8Array(await imgCheckRes.arrayBuffer()) : null;
    if (!afterPngBytes || !isValidNonEmptyPngBytes(afterPngBytes)) {
        const pngErr = new Error('Сервер вернул невалидный PNG после восстановления из бэкапа.');
        pngErr.code = 'INTEGRITY_RESTORE_FAILED';
        pngErr.backupId = bak.id;
        throw pngErr;
    }

    const ctx = getTavernContext();
    if (typeof ctx?.getOneCharacter === 'function') {
        await ctx.getOneCharacter(bak.avatarFileName);
    } else if (typeof ctx?.getCharacters === 'function') {
        await ctx.getCharacters();
    }

    return {
        fileName: bak.avatarFileName,
        backupId: bak.id,
        restoredChar: afterRestore.fullChar,
        snapshotHash: afterRestore.snapshotHash,
        rawCardObject: afterRestore.rawCardObject,
    };
}

// Safe existing character update with fail-closed PNG backup (P1-B), PARTIAL_SAVE handling & rollback (P1/P2-D),
// exact 404/405/501 fallback (P2-F), and strict post-save invariant readback (P1-C)
export async function updateExistingCardInTavern(card, {
    avatarFileName = '',
    avatarDataUrl = '',
    accentHex = '#1de9b6',
    aspectRatio = '1:1',
    cropFocus = 'top',
    allowExternalChangeOverride = false,
    writeOrder = 'avatar-first',
} = {}) {
    const targetAvatar = String(avatarFileName || card?.sourceAvatarId || '').trim();
    if (!targetAvatar) {
        throw new Error('Не указан исходный персонаж для обновления.');
    }
    if (!String(card?.name || '').trim()) {
        throw new Error('Имя персонажа не может быть пустым.');
    }

    // 1. Pre-flight: read full live character from disk & verify it still exists
    const liveBefore = await fetchFullTavernCharacter(targetAvatar);
    if (card.sourceSnapshotHash && liveBefore.snapshotHash && card.sourceSnapshotHash !== liveBefore.snapshotHash && !allowExternalChangeOverride) {
        const err = new Error('Исходная карточка была изменена в SillyTavern после её загрузки в редактор.');
        err.code = 'EXTERNAL_CARD_MODIFIED';
        throw err;
    }

    const diff = computeCardDiff(card, liveBefore.rawCardObject);
    if (!diff.hasChanges) {
        return {
            fileName: targetAvatar,
            backup: null,
            updatedChar: liveBefore.fullChar,
            diff,
            noop: true,
        };
    }

    // 2. Fail-closed Backup (P1-B): require valid source PNG bytes + durable IndexedDB commit + readback BEFORE any mutation
    let origPngBytes = null;
    let imgStatus = 0;
    try {
        const imgRes = await fetch(`/characters/${encodeURIComponent(targetAvatar)}`, { cache: 'no-cache' });
        imgStatus = imgRes.status;
        if (imgRes.ok) {
            origPngBytes = new Uint8Array(await imgRes.arrayBuffer());
        }
    } catch (fetchErr) {
        const err = new Error('Не удалось скачать исходный PNG карточки для страховочного бэкапа. Перезапись заблокирована — сохраните как новую карточку или скачайте PNG.');
        err.code = 'BACKUP_SOURCE_PNG_UNREADABLE';
        err.cause = fetchErr;
        throw err;
    }

    if (!origPngBytes || !isValidNonEmptyPngBytes(origPngBytes)) {
        const err = new Error(
            `Сервер не вернул валидный PNG оригинала (HTTP ${imgStatus || 'ошибка'}). Перезапись оригинала заблокирована — сохраните как новую карточку или скачайте PNG/JSON.`
        );
        err.code = 'BACKUP_SOURCE_PNG_UNREADABLE';
        throw err;
    }

    const backup = await saveCardBackup(
        {
            avatarFileName: targetAvatar,
            characterName: liveBefore.fullChar?.name || card.name,
            pngBytes: origPngBytes,
            cardJson: liveBefore.rawCardObject,
        },
        { requireDurable: true }
    );

    const dirtyFields = Array.isArray(card.dirtyFields) ? [...card.dirtyFields] : [];
    // Fixes P2-01: when card.avatarDirty === true with empty avatarDataUrl (clear-avatar), writes clean monogram placeholder PNG!
    const wantAvatarWrite = Boolean(card.avatarDirty);
    const wantFieldsWrite = dirtyFields.length > 0;
    const origVisualBytes = stripPngCharaChunkBytes(origPngBytes);

    let newPngBytes = null;
    let newVisualBytes = null;
    if (wantAvatarWrite) {
        newPngBytes = await ensurePngBytes(avatarDataUrl || '', card.name, accentHex, { aspectRatio, cropFocus });
        if (!isValidNonEmptyPngBytes(newPngBytes)) {
            const err = new Error('Сформированный новый PNG не прошёл проверку целостности. Запись отменена.');
            err.code = 'INVALID_NEW_AVATAR_PNG';
            throw err;
        }
        newVisualBytes = stripPngCharaChunkBytes(newPngBytes);
    }

    // 3 & 4. Controlled execution with server-mutation readback on ambiguous HTTP 500/drop, PARTIAL_SAVE detection & guarded rollback
    let avatarApplied = false;
    let fieldsApplied = false;

    const runAvatarStep = async () => {
        if (!wantAvatarWrite) return;
        const avRes = await uploadAvatarPngBytesToTavern(targetAvatar, newPngBytes);
        if (!avRes.ok) {
            throw new Error(`Ошибка обновления изображения персонажа (HTTP ${avRes.status}).`);
        }
        avatarApplied = true;
    };

    const runFieldsStep = async () => {
        if (!wantFieldsWrite) return;
        await applyTextFieldsUpdateToTavern(targetAvatar, card, dirtyFields, liveBefore.rawCardObject);
        fieldsApplied = true;
    };

    try {
        if (writeOrder === 'fields-first') {
            await runFieldsStep();
            await runAvatarStep();
        } else {
            await runAvatarStep();
            await runFieldsStep();
        }
    } catch (stepErr) {
        let midState = null;
        let observedHashAfterFailure = liveBefore.snapshotHash;
        try {
            midState = await fetchFullTavernCharacter(targetAvatar);
            observedHashAfterFailure = midState.snapshotHash || observedHashAfterFailure;
            // Detect "server wrote to disk, then returned HTTP 500 / dropped connection" before classifying incident!
            if (!fieldsApplied && wantFieldsWrite && midState.snapshotHash !== liveBefore.snapshotHash) {
                fieldsApplied = true;
            }
            if (!avatarApplied && wantAvatarWrite) {
                const probeImg = await fetch(`/characters/${encodeURIComponent(targetAvatar)}`, { cache: 'no-cache' });
                if (probeImg.ok) {
                    const probeBytes = new Uint8Array(await probeImg.arrayBuffer());
                    if (!areByteArraysEqual(stripPngCharaChunkBytes(probeBytes), origVisualBytes)) {
                        avatarApplied = true;
                    }
                }
            }
        } catch {
            midState = null;
        }

        if (avatarApplied || fieldsApplied) {
            let rolledBack = false;
            let rollbackError = '';
            try {
                const stateForRollback = midState || await fetchFullTavernCharacter(targetAvatar);
                if (avatarApplied && !fieldsApplied) {
                    if (stateForRollback.snapshotHash === liveBefore.snapshotHash) {
                        const rbRes = await uploadAvatarPngBytesToTavern(targetAvatar, origPngBytes);
                        if (rbRes.ok) {
                            rolledBack = true;
                            avatarApplied = false;
                            observedHashAfterFailure = liveBefore.snapshotHash;
                        } else {
                            rollbackError = `HTTP ${rbRes.status}`;
                        }
                    } else {
                        rollbackError = 'обнаружено параллельное изменение карточки';
                    }
                } else if (fieldsApplied && !avatarApplied) {
                    const expectedMidObj = buildV2CardObject({
                        ...card,
                        originalCardData: liveBefore.rawCardObject,
                        dirtyFields,
                    });
                    const expectedMidCheck = verifyPostSaveIntegrity({
                        beforeRaw: liveBefore.rawCardObject,
                        afterRaw: stateForRollback.rawCardObject,
                        card,
                        dirtyFields,
                    });
                    if (expectedMidCheck.ok || computeCardSnapshotHash(stateForRollback.rawCardObject) === computeCardSnapshotHash(expectedMidObj)) {
                        await applyFullJsonRestoreToTavern(targetAvatar, liveBefore.rawCardObject, stateForRollback.rawCardObject);
                        const postRb = await fetchFullTavernCharacter(targetAvatar);
                        observedHashAfterFailure = postRb.snapshotHash;
                        rolledBack = true;
                        fieldsApplied = false;
                    } else {
                        rollbackError = 'обнаружено параллельное изменение карточки';
                    }
                }
            } catch (rbErr) {
                rollbackError = rbErr?.message || 'ошибка сети при откате';
            }

            const partialErr = new Error(
                rolledBack
                    ? `Второй шаг сохранения завершился ошибкой (${stepErr.message}). Первичное изменение автоматически откачено к страховочному бэкапу (${backup.id}); несохранённые правки оставлены в редакторе.`
                    : `Частичное сохранение (PARTIAL_SAVE): ${stepErr.message}. Автооткат не выполнен (${rollbackError || 'ошибка сервера'}). Используйте кнопку «Восстановить из бэкапа» (${backup.id}) или скачайте резервный PNG.`
            );
            partialErr.code = 'PARTIAL_SAVE';
            partialErr.backupId = backup.id;
            partialErr.observedSnapshotHash = observedHashAfterFailure;
            partialErr.rolledBack = rolledBack;
            partialErr.avatarApplied = avatarApplied;
            partialErr.fieldsApplied = fieldsApplied;
            partialErr.cause = stepErr;
            throw partialErr;
        }
        stepErr.backupId = backup.id;
        stepErr.observedSnapshotHash = observedHashAfterFailure;
        throw stepErr;
    }

    // 5. Strict post-save readback & full JSON + PNG verification (fixes P1-C & P2-01)
    const liveAfter = await fetchFullTavernCharacter(targetAvatar);
    const integrity = verifyPostSaveIntegrity({
        beforeRaw: liveBefore.rawCardObject,
        afterRaw: liveAfter.rawCardObject,
        card,
        dirtyFields,
    });

    if (wantAvatarWrite) {
        try {
            const afterImgRes = await fetch(`/characters/${encodeURIComponent(targetAvatar)}`, { cache: 'no-cache' });
            const afterPngBytes = afterImgRes.ok ? new Uint8Array(await afterImgRes.arrayBuffer()) : null;
            if (!afterPngBytes || !isValidNonEmptyPngBytes(afterPngBytes)) {
                integrity.ok = false;
                integrity.mismatches.push('После записи портрета сервер вернул повреждённый или пустой PNG');
            } else if (
                newVisualBytes &&
                !areByteArraysEqual(newVisualBytes, origVisualBytes) &&
                areByteArraysEqual(stripPngCharaChunkBytes(afterPngBytes), origVisualBytes)
            ) {
                integrity.ok = false;
                integrity.mismatches.push('Новый портрет не применился на диске (остались старые байты изображения)');
            }
        } catch {
            integrity.ok = false;
            integrity.mismatches.push('Не удалось перечитать обновлённый PNG персонажа для верификации портрета');
        }
    }

    if (!integrity.ok) {
        const intErr = new Error(
            `Проверка целостности карточки после сохранения не пройдена: ${integrity.mismatches.join('; ')}. Правки и страховочный бэкап (${backup.id}) сохранены — вы можете восстановить оригинал в один клик.`
        );
        intErr.code = 'INTEGRITY_CHECK_FAILED';
        intErr.mismatches = integrity.mismatches;
        intErr.backupId = backup.id;
        intErr.observedSnapshotHash = liveAfter.snapshotHash;
        throw intErr;
    }

    // Commit clean state ONLY after 100% verified readback
    card.originalCardData = structuredClone(liveAfter.rawCardObject);
    card.sourceSnapshotHash = liveAfter.snapshotHash;
    card.dirtyFields = [];
    card.avatarDirty = false;

    const ctx = getTavernContext();
    if (typeof ctx?.getOneCharacter === 'function') {
        await ctx.getOneCharacter(targetAvatar);
    } else if (typeof ctx?.getCharacters === 'function') {
        await ctx.getCharacters();
    }

    return {
        fileName: targetAvatar,
        backup,
        updatedChar: liveAfter.fullChar,
        diff,
        noop: false,
    };
}

// Fetch roster & Lorebook names using public endpoints/context without importing internal /scripts/world-info.js (fixes NMF-015)
export async function fetchTavernRosterAndWorlds({ signal = null } = {}) {
    const ctx = getTavernContext();
    const headers = getTavernHeaders();
    let characters = [];
    let worlds = [];

    try {
        const r = await fetch('/api/characters/all', {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
            signal,
        });
        if (r.ok) {
            characters = await r.json();
        } else if (Array.isArray(ctx?.characters)) {
            characters = ctx.characters;
        }
    } catch {
        characters = Array.isArray(ctx?.characters) ? ctx.characters : [];
    }

    if (typeof ctx?.getWorldInfoNames === 'function') {
        try {
            const names = await ctx.getWorldInfoNames();
            if (Array.isArray(names)) worlds = [...names];
        } catch {}
    }

    if (!worlds.length) {
        try {
            const sRes = await fetch('/api/settings/get', {
                method: 'POST',
                headers,
                body: JSON.stringify({}),
                signal,
            });
            if (sRes.ok) {
                const sData = await sRes.json();
                if (Array.isArray(sData?.world_names)) {
                    worlds = [...sData.world_names];
                }
            }
        } catch {}
    }

    if (!worlds.length && typeof document !== 'undefined') {
        const opts = document.querySelectorAll('#world_info option');
        worlds = [...opts]
            .map((o) => String(o.textContent || o.value || '').trim())
            .filter((n) => n && !/^[-—\s]*none|нет/i.test(n));
    }

    return {
        characters: Array.isArray(characters) ? characters : [],
        worlds,
    };
}

// Network helper with unified per-request timeout & combined AbortSignal (fixes NMF-016)
export const DEFAULT_IMAGE_REQUEST_TIMEOUT_MS = 120_000;
export const MAX_IMAGE_DOWNLOAD_BYTES = 60 * 1024 * 1024; // 60 MB guard for uncompressed 4K PNGs

export function computeLosslessCropGeometry(imgW, imgH, { aspectRatio = '1:1', zoom = 1, panX = 50, panY = 10 } = {}) {
    const w = Math.max(1, Number(imgW) || 1024);
    const h = Math.max(1, Number(imgH) || 1024);
    const targetRatio = parseAspectRatioNumber(aspectRatio) || 1;
    const z = Math.max(1, Math.min(3.5, Number(zoom) || 1));
    const px = Math.max(0, Math.min(100, Number.isFinite(Number(panX)) ? Number(panX) : 50));
    const py = Math.max(0, Math.min(100, Number.isFinite(Number(panY)) ? Number(panY) : 10));

    const srcRatio = w / h;
    let baseW;
    let baseH;
    if (srcRatio > targetRatio) {
        baseH = h;
        baseW = h * targetRatio;
    } else {
        baseW = w;
        baseH = w / targetRatio;
    }

    const cropW = baseW / z;
    const cropH = baseH / z;
    const maxSX = Math.max(0, w - cropW);
    const maxSY = Math.max(0, h - cropH);
    const sx = (px / 100) * maxSX;
    const sy = (py / 100) * maxSY;

    return {
        targetRatio,
        sx,
        sy,
        cropW,
        cropH,
        maxSX,
        maxSY,
        outW: Math.max(64, Math.round(cropW)),
        outH: Math.max(64, Math.round(cropH)),
        cssWidthPct: (w / cropW) * 100,
        cssHeightPct: (h / cropH) * 100,
        cssLeftPct: -(sx / cropW) * 100,
        cssTopPct: -(sy / cropH) * 100,
    };
}

export async function cropImageDataUrlLossless(sourceDataUrl, cropParams = {}) {
    if (!sourceDataUrl || typeof sourceDataUrl !== 'string') {
        throw new Error('Нет исходного изображения для кадрирования.');
    }
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
        return sourceDataUrl;
    }
    const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Не удалось декодировать исходный арт для обрезки.'));
        el.src = sourceDataUrl;
    });
    const geom = computeLosslessCropGeometry(img.naturalWidth || img.width, img.naturalHeight || img.height, cropParams);
    const canvas = document.createElement('canvas');
    canvas.width = geom.outW;
    canvas.height = geom.outH;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('2D-контекст холста недоступен.');
    ctx2d.imageSmoothingEnabled = true;
    ctx2d.imageSmoothingQuality = 'high';
    ctx2d.drawImage(img, geom.sx, geom.sy, geom.cropW, geom.cropH, 0, 0, geom.outW, geom.outH);
    if (typeof canvas.toBlob === 'function' && typeof FileReader !== 'undefined') {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
            return await new Promise((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(String(fr.result || ''));
                fr.onerror = () => reject(new Error('Не удалось закодировать PNG-кадр.'));
                fr.readAsDataURL(blob);
            });
        }
    }
    return canvas.toDataURL('image/png');
}

export const lastRequestDiagnostics = {
    art: null,
    llm: null,
};

function sanitizeUrlForLog(rawUrl = '') {
    return String(rawUrl || '').replace(/([?&](?:key|api_key|apikey|token)=)[^&#]+/gi, '$1***[HIDDEN]***');
}

function sanitizeHeadersForLog(headers = {}) {
    if (!headers || typeof headers !== 'object') return {};
    const out = {};
    for (const [k, v] of Object.entries(headers)) {
        if (/authorization|api[-_]?key|token|secret|cookie/i.test(k)) {
            out[k] = '*** [СКРЫТО ДЛЯ БЕЗОПАСНОСТИ] ***';
        } else {
            out[k] = String(v ?? '');
        }
    }
    return out;
}

function scrubInlineImagesFromParsedJson(root) {
    if (!root || typeof root !== 'object') return root;
    const BINARY_KEYS = new Set(['b64_json', 'data', 'image', 'bytesBase64Encoded']);
    const cloneRoot = Array.isArray(root) ? [...root] : { ...root };
    const stack = [cloneRoot];

    while (stack.length > 0) {
        const cur = stack.pop();
        if (Array.isArray(cur)) {
            for (let i = 0; i < cur.length; i++) {
                const val = cur[i];
                if (typeof val === 'string') {
                    if (val.length > 140 && val.startsWith('data:image/') && val.includes(';base64,')) {
                        cur[i] = `[DATA_URL_IMAGE · ~${Math.round((val.length * 0.75) / 1024)} KB]`;
                    }
                } else if (val && typeof val === 'object') {
                    const next = Array.isArray(val) ? [...val] : { ...val };
                    cur[i] = next;
                    stack.push(next);
                }
            }
        } else {
            for (const key of Object.keys(cur)) {
                const val = cur[key];
                if (typeof val === 'string') {
                    if (val.length > 140 && val.startsWith('data:image/') && val.includes(';base64,')) {
                        cur[key] = `[DATA_URL_IMAGE · ~${Math.round((val.length * 0.75) / 1024)} KB]`;
                    } else if (BINARY_KEYS.has(key) && val.length >= 200 && !val.includes(' ')) {
                        cur[key] = `[BASE64_IMAGE_PAYLOAD · ~${Math.round((val.length * 0.75) / 1024)} KB]`;
                    }
                } else if (val && typeof val === 'object') {
                    const next = Array.isArray(val) ? [...val] : { ...val };
                    cur[key] = next;
                    stack.push(next);
                }
            }
        }
    }
    return cloneRoot;
}

function scrubPlainStringDataUrlsLinear(inputStr, maxLen = 14000) {
    const marker = 'data:image/';
    let pos = 0;
    let out = '';
    while (pos < inputStr.length && out.length <= maxLen + 2048) {
        const idx = inputStr.indexOf(marker, pos);
        if (idx === -1) {
            const rem = maxLen + 2048 - out.length;
            out += inputStr.slice(pos, pos + Math.max(0, rem));
            if (pos + Math.max(0, rem) < inputStr.length) {
                return `${out.slice(0, maxLen)}\n… [обрезано ${inputStr.length - maxLen} симв.]`;
            }
            pos = inputStr.length;
            break;
        }
        out += inputStr.slice(pos, idx);
        const semiIdx = inputStr.indexOf(';base64,', idx);
        if (semiIdx !== -1 && semiIdx - idx < 64) {
            let end = semiIdx + 8;
            while (end < inputStr.length) {
                const c = inputStr.charCodeAt(end);
                const isB64 = (c >= 65 && c <= 90)
                    || (c >= 97 && c <= 122)
                    || (c >= 48 && c <= 57)
                    || c === 43 || c === 47 || c === 61
                    || c === 10 || c === 13;
                if (!isB64) break;
                end++;
            }
            const b64Len = end - (semiIdx + 8);
            if (b64Len >= 120) {
                out += `[DATA_URL_IMAGE · ~${Math.round((b64Len * 0.75) / 1024)} KB]`;
                pos = end;
                continue;
            }
        }
        out += marker;
        pos = idx + marker.length;
    }
    return out.length > maxLen ? `${out.slice(0, maxLen)}\n… [обрезано ${out.length - maxLen} симв.]` : out;
}

function sanitizePayloadStringForLog(rawStr = '', maxLen = 14000) {
    if (!rawStr) return '';
    if (typeof FormData !== 'undefined' && rawStr instanceof FormData) {
        const parts = [];
        try {
            for (const [k, v] of rawStr.entries()) {
                if (typeof v === 'string') {
                    parts.push(`${k}: ${v.length > 500 ? v.slice(0, 500) + '…' : v}`);
                } else {
                    parts.push(`${k}: [File/Blob ${v?.type || ''} · ${Math.round((v?.size || 0) / 1024)} KB]`);
                }
            }
        } catch {}
        return `[FormData]\n${parts.join('\n')}`;
    }

    if (typeof rawStr === 'object') {
        try {
            const safeObj = scrubInlineImagesFromParsedJson(rawStr);
            const str = JSON.stringify(safeObj, null, 2);
            return str.length > maxLen ? `${str.slice(0, maxLen)}\n… [обрезано ${str.length - maxLen} симв.]` : str;
        } catch {}
    }

    const str = String(rawStr);
    const firstCh = str.trimStart()[0];
    if (firstCh === '{' || firstCh === '[') {
        try {
            const parsed = JSON.parse(str);
            const safeObj = scrubInlineImagesFromParsedJson(parsed);
            const pretty = JSON.stringify(safeObj, null, 2);
            return pretty.length > maxLen ? `${pretty.slice(0, maxLen)}\n… [обрезано ${pretty.length - maxLen} симв.]` : pretty;
        } catch {}
    }

    return scrubPlainStringDataUrlsLinear(str, maxLen);
}

export async function fetchWithTimeout(url, init = {}, timeoutMs = DEFAULT_IMAGE_REQUEST_TIMEOUT_MS, externalSignal = null) {
    const cleanUrl = sanitizeUrlForLog(url);
    const isLocalAssetFetch = cleanUrl.startsWith('/') || /^blob:|^data:/i.test(cleanUrl);
    const isInternalCheck = isLocalAssetFetch || /\/user\/subscription$/i.test(cleanUrl);
    const startedAt = Date.now();
    const prevArtCtx = lastRequestDiagnostics.art?.artContext || null;
    const diagEntry = !isInternalCheck ? {
        kind: 'art',
        startedAt,
        finishedAt: 0,
        status: 'В процессе (ожидание заголовков HTTP)...',
        ok: null,
        httpStatus: 0,
        method: String(init?.method || 'GET').toUpperCase(),
        url: cleanUrl,
        headers: sanitizeHeadersForLog(init?.headers || {}),
        requestBody: sanitizePayloadStringForLog(init?.body || ''),
        responsePreview: 'Ждём ответ сервера...',
        artContext: prevArtCtx,
    } : null;
    if (diagEntry) {
        lastRequestDiagnostics.art = diagEntry;
    }

    if (externalSignal?.aborted) {
        if (diagEntry) {
            diagEntry.status = 'Отменено пользователем';
            diagEntry.ok = false;
            diagEntry.finishedAt = Date.now();
        }
        const err = new Error('Запрос отменён пользователем.');
        err.code = 'ABORTED';
        throw err;
    }

    const ctl = new AbortController();
    let timedOut = false;

    const onExternalAbort = () => ctl.abort();
    if (externalSignal) {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const effectiveTimeout = Math.max(250, Number(timeoutMs) || DEFAULT_IMAGE_REQUEST_TIMEOUT_MS);
    const deadlineMs = startedAt + effectiveTimeout;
    const headerTimer = setTimeout(() => {
        timedOut = true;
        ctl.abort();
    }, effectiveTimeout);

    const cleanupAbortHook = () => {
        if (externalSignal) {
            externalSignal.removeEventListener('abort', onExternalAbort);
        }
    };

    const wrapBodyPromiseWithRemainingTimeout = (readFn, modeLabel = 'body') => {
        const remMs = Math.max(250, deadlineMs - Date.now());
        let bodyTimedOut = false;
        const bodyTimer = setTimeout(() => {
            bodyTimedOut = true;
            timedOut = true;
            ctl.abort();
        }, remMs);

        if (diagEntry && diagEntry.ok !== false) {
            diagEntry.status = `HTTP ${diagEntry.httpStatus} получен · скачивание потока (${modeLabel})...`;
        }

        return new Promise((resolve, reject) => {
            const onTimeoutOrAbort = () => {
                clearTimeout(bodyTimer);
                cleanupAbortHook();
                if (bodyTimedOut || timedOut) {
                    const msg = `Превышено время ожидания потока ответа (${Math.round(effectiveTimeout / 1000)} сек) — прокси прислал HTTP ${diagEntry?.httpStatus || 200}, но завис при передаче тела кадра.`;
                    if (diagEntry) {
                        diagEntry.status = `Таймаут потока (${Math.round(effectiveTimeout / 1000)}с)`;
                        diagEntry.ok = false;
                        diagEntry.finishedAt = Date.now();
                        diagEntry.responsePreview = msg;
                    }
                    const te = new Error(msg);
                    te.code = 'TIMEOUT';
                    reject(te);
                    return;
                }
                if (externalSignal?.aborted) {
                    if (diagEntry) {
                        diagEntry.status = 'Остановлено пользователем';
                        diagEntry.ok = false;
                        diagEntry.finishedAt = Date.now();
                    }
                    const ae = new Error('Генерация остановлена пользователем.');
                    ae.code = 'ABORTED';
                    reject(ae);
                }
            };

            ctl.signal.addEventListener('abort', onTimeoutOrAbort, { once: true });
            Promise.resolve().then(readFn).then(
                (val) => {
                    clearTimeout(bodyTimer);
                    ctl.signal.removeEventListener('abort', onTimeoutOrAbort);
                    cleanupAbortHook();
                    if (diagEntry) {
                        diagEntry.finishedAt = Date.now();
                        diagEntry.status = diagEntry.httpStatus >= 200 && diagEntry.httpStatus < 300
                            ? `Успешно (HTTP ${diagEntry.httpStatus})`
                            : `Ошибка HTTP ${diagEntry.httpStatus}`;
                        if (modeLabel === 'arrayBuffer') {
                            diagEntry.responsePreview = `[Бинарный файл получен · ${Math.round((val?.byteLength || 0) / 1024)} KB]`;
                        } else {
                            diagEntry.responsePreview = sanitizePayloadStringForLog(val, 10000);
                        }
                    }
                    resolve(val);
                },
                (err) => {
                    clearTimeout(bodyTimer);
                    ctl.signal.removeEventListener('abort', onTimeoutOrAbort);
                    cleanupAbortHook();
                    if (bodyTimedOut || timedOut) {
                        const msg = `Превышено время ожидания потока ответа (${Math.round(effectiveTimeout / 1000)} сек) — прокси прислал HTTP ${diagEntry?.httpStatus || 200}, но завис при передаче тела кадра.`;
                        if (diagEntry) {
                            diagEntry.status = `Таймаут потока (${Math.round(effectiveTimeout / 1000)}с)`;
                            diagEntry.ok = false;
                            diagEntry.finishedAt = Date.now();
                            diagEntry.responsePreview = msg;
                        }
                        const te = new Error(msg);
                        te.code = 'TIMEOUT';
                        reject(te);
                        return;
                    }
                    if (externalSignal?.aborted) {
                        if (diagEntry) {
                            diagEntry.status = 'Остановлено пользователем';
                            diagEntry.ok = false;
                            diagEntry.finishedAt = Date.now();
                        }
                        const ae = new Error('Генерация остановлена пользователем.');
                        ae.code = 'ABORTED';
                        reject(ae);
                        return;
                    }
                    if (diagEntry) {
                        diagEntry.status = 'Ошибка чтения тела ответа';
                        diagEntry.ok = false;
                        diagEntry.finishedAt = Date.now();
                        diagEntry.responsePreview = String(err?.message || err);
                    }
                    reject(err);
                },
            );
        });
    };

    try {
        const resp = await fetch(url, { ...init, signal: ctl.signal });
        clearTimeout(headerTimer);
        if (diagEntry) {
            diagEntry.httpStatus = resp.status;
            diagEntry.ok = resp.ok;
            diagEntry.status = resp.ok
                ? `HTTP ${resp.status} OK · ждём поток тела...`
                : `HTTP ${resp.status} (ошибка сервера)`;
        }
        return {
            ok: resp.ok,
            status: resp.status,
            statusText: resp.statusText,
            headers: resp.headers,
            url: resp.url,
            json: () => wrapBodyPromiseWithRemainingTimeout(() => resp.json(), 'json'),
            text: () => wrapBodyPromiseWithRemainingTimeout(() => resp.text(), 'text'),
            arrayBuffer: () => wrapBodyPromiseWithRemainingTimeout(() => resp.arrayBuffer(), 'arrayBuffer'),
        };
    } catch (err) {
        clearTimeout(headerTimer);
        cleanupAbortHook();
        if (timedOut) {
            const msg = `Превышено время ожидания ответа от сервера изображений (${Math.round(effectiveTimeout / 1000)} сек).`;
            if (diagEntry) {
                diagEntry.status = `Таймаут (${Math.round(effectiveTimeout / 1000)}с)`;
                diagEntry.ok = false;
                diagEntry.finishedAt = Date.now();
                diagEntry.responsePreview = msg;
            }
            const te = new Error(msg);
            te.code = 'TIMEOUT';
            throw te;
        }
        if (externalSignal?.aborted) {
            if (diagEntry) {
                diagEntry.status = 'Генерация остановлена пользователем';
                diagEntry.ok = false;
                diagEntry.finishedAt = Date.now();
            }
            const ae = new Error('Генерация остановлена пользователем.');
            ae.code = 'ABORTED';
            throw ae;
        }
        if (diagEntry) {
            diagEntry.status = 'Сетевая ошибка';
            diagEntry.ok = false;
            diagEntry.finishedAt = Date.now();
            diagEntry.responsePreview = String(err?.message || err);
        }
        throw err;
    }
}

function detectImageMimeFromBytes(bytes, headerType = '') {
    const cleanHeader = String(headerType || '').split(';')[0].trim().toLowerCase();
    if (cleanHeader.startsWith('image/')) return cleanHeader;
    if (bytes.length >= 4) {
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp';
    }
    return '';
}

export async function urlToDataUrl(url, signal = null, timeoutMs = DEFAULT_IMAGE_REQUEST_TIMEOUT_MS) {
    const res = await fetchWithTimeout(url, { cache: 'no-cache' }, timeoutMs, signal);
    if (!res.ok) {
        throw new Error(`Ошибка загрузки изображения (HTTP ${res.status}).`);
    }

    const contentLength = Number(res.headers?.get?.('content-length') || 0);
    if (contentLength > MAX_IMAGE_DOWNLOAD_BYTES) {
        throw new Error(`Размер изображения превышает допустимый лимит (20 МБ).`);
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_DOWNLOAD_BYTES) {
        throw new Error(`Размер полученного файла превышает допустимый лимит (20 МБ).`);
    }
    if (buf.byteLength === 0) {
        throw new Error('Сервер вернул пустой файл вместо изображения.');
    }

    const mime = detectImageMimeFromBytes(buf, res.headers?.get?.('content-type') || '');
    if (!mime) {
        throw new Error('Сервер вернул ответ неверного типа (ожидалось изображение PNG/JPEG/WebP).');
    }

    let bin = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < buf.length; i += chunkSize) {
        bin += String.fromCharCode(...buf.subarray(i, i + chunkSize));
    }
    return `data:${mime};base64,${btoa(bin)}`;
}

// Pocket Codex optional integration with public CustomEvent + safe DOM fallback (Section 8)
export function detectPocketCodex() {
    if (typeof document === 'undefined') return false;
    const hasDom = Boolean(document.getElementById('pcx-sendbar-btn') || document.getElementById('pcx-dialog'));
    const ctx = getTavernContext();
    const disabled = Array.isArray(ctx?.extensionSettings?.disabledExtensions)
        ? ctx.extensionSettings.disabledExtensions
        : [];
    const isOff = disabled.some((d) => String(d).toLowerCase().includes('st-pocket-codex'));
    return hasDom && !isOff;
}

export function openPocketCodexForge(cardPayload = null) {
    if (!detectPocketCodex()) return false;
    let handledViaEvent = false;
    try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            const ev = new CustomEvent('pcx:open-forge', {
                cancelable: true,
                detail: {
                    source: 'st-nexus-match-forge',
                    card: cardPayload && typeof cardPayload === 'object' ? cardPayload : null,
                },
            });
            window.dispatchEvent(ev);
            handledViaEvent = ev.defaultPrevented;
        }
    } catch {}

    if (handledViaEvent) return true;

    const btn = typeof document !== 'undefined' ? document.getElementById('pcx-sendbar-btn') : null;
    if (btn) {
        const dlg = document.getElementById('pcx-dialog');
        if (!dlg?.open) btn.click();
        setTimeout(() => {
            const forgeWing = document.querySelector('#pcx-window [data-wing="forge"], #pcx-window [data-mod="forge"], #pcx-mod-forge');
            if (forgeWing) forgeWing.click();
        }, 180);
        return true;
    }
    return false;
}

// ── SILLYIMAGES & PROVIDER ADAPTER (fixes NMF-007, NMF-008, NMF-009, NMF-016) ──

export const KNOWN_IMAGE_EXTENSION_KEYS = Object.freeze([
    'inline_image_gen', // Official 0xl0cal/sillyimages MODULE_NAME
    'sillyimages',
    'inline_image_generation',
]);

export const SILLYIMAGES_DEFAULT_ENDPOINTS = Object.freeze({
    xai: 'https://api.x.ai',
    naistera: 'https://naistera.org',
    novelai: 'https://image.novelai.net',
    openrouter: 'https://openrouter.ai/api/v1',
    electronhub: 'https://api.electronhub.ai',
    a1111: 'http://127.0.0.1:7860',
});

export const SUPPORTED_SILLYIMAGES_PROVIDERS = Object.freeze([
    'openai',
    'xai',
    'gemini',
    'openrouter',
    'electronhub',
    'naistera',
    'novelai',
    'a1111',
    'pollinations',
]);

export const NOVELAI_MODELS = Object.freeze({
    'nai-diffusion-5-full': 'NovelAI V5 Full',
    'nai-diffusion-5-full-medium': 'NovelAI V5 Full Medium',
    'nai-diffusion-5-curated': 'NovelAI V5 Curated',
    'nai-diffusion-4-5-full': 'NovelAI V4.5 Full',
    'nai-diffusion-4-5-curated': 'NovelAI V4.5 Curated',
});

const NOVELAI_MEDIUM_MODEL = 'nai-diffusion-5-full-medium';
const NOVELAI_MEDIUM_NEGATIVE = 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
const NOVELAI_RESOLUTION_PRESETS = Object.freeze({
    small: { '1:1': [640, 640], '2:3': [512, 768], '3:2': [768, 512], '9:16': [448, 832], '16:9': [832, 448] },
    normal: { '1:1': [1024, 1024], '2:3': [832, 1216], '3:2': [1216, 832], '9:16': [768, 1344], '16:9': [1344, 768] },
    big: { '1:1': [1472, 1472], '2:3': [1024, 1536], '3:2': [1536, 1024], '9:16': [1088, 1920], '16:9': [1920, 1088] },
});

// Exact connection profile schema from 0xl0cal/sillyimages src/settings.js (fixes NMF-007)
export const SILLYIMAGES_DEFAULT_CONNECTION_FIELDS = Object.freeze({
    apiType: 'openai',
    endpoint: '',
    rawEndpoint: false,
    apiKey: '',
    model: '',
    size: '1024x1024',
    quality: 'standard',
    aspectRatio: '1:1',
    imageSize: '1K',
    xaiAspectRatio: '1:1',
    xaiResolution: '1k',
    xaiQuality: 'medium',
    naisteraAspectRatio: '1:1',
    naisteraModel: '',
    naisteraNegativePrompt: '',
    naisteraSteps: 23,
    naisteraCfgScale: 7,
    naisteraCfgRescale: 0,
    naisteraSampler: 'k_euler_ancestral',
    naisteraPolling: false,
    naisteraPollIntervalMs: 3000,
    naisteraPollTimeoutMs: 120000,
    novelaiNeverSpendAnlas: true,
    novelaiResolution: 'normal',
    novelaiAspectRatio: '2:3',
    novelaiSteps: 23,
    novelaiCfgScale: 7,
    novelaiCfgRescale: 0,
    novelaiSampler: 'k_euler_ancestral',
    novelaiNoiseSchedule: 'karras',
    novelaiSeed: -1,
    novelaiSkipCfgAboveSigma: 0,
    novelaiNegativePrompt: '',
    a1111Width: 512,
    a1111Height: 512,
    a1111Steps: 20,
    a1111CfgScale: 7,
    a1111Sampler: 'Euler a',
    a1111PromptPrefix: '',
    a1111NegativePrompt: '',
    a1111Seed: -1,
});

export function normalizeProviderEndpoint(apiType, rawEndpointStr) {
    const trimmed = String(rawEndpointStr || '').trim().replace(/\/+$/, '');
    if (!trimmed) {
        return SILLYIMAGES_DEFAULT_ENDPOINTS[apiType] || '';
    }
    if (apiType === 'naistera') {
        return trimmed.replace(/\/api\/(?:generate|models)$/i, '');
    }
    if (apiType === 'xai') {
        return trimmed.replace(/\/v1$/i, '');
    }
    return trimmed;
}

function isImageExtensionDisabledInTavern(bucketKey, cfgObj, disabledList = []) {
    if (!cfgObj || typeof cfgObj !== 'object') return true;
    if (cfgObj.enabled === false) return true;

    const normDisabled = (Array.isArray(disabledList) ? disabledList : []).map((d) => String(d || '').toLowerCase());
    if (!normDisabled.length) return false;

    const keyLow = String(bucketKey || '').toLowerCase();
    return normDisabled.some((entry) => {
        if (entry === keyLow || entry.endsWith('/' + keyLow)) return true;
        if (keyLow === 'inline_image_gen' && (
            entry.includes('sillyimages')
            || entry.includes('inline-image-gen')
            || entry.includes('inline_image_gen')
        )) {
            return true;
        }
        if (keyLow === 'slay_image_gen' && entry.includes('slay')) return true;
        return false;
    });
}

function resolveBucketModel(v) {
    if (!v || typeof v !== 'object') return '';
    if (v.apiType === 'naistera') {
        return String(v.naisteraModel ?? v.model ?? '').trim();
    }
    if (v.apiType === 'novelai') {
        if (v.novelaiModel === '__custom__') return String(v.novelaiCustomModel || '').trim();
        return String(v.model ?? v.novelaiModel ?? '').trim();
    }
    return String(v.model ?? '').trim();
}

export function getModelMaxReferenceImages(imgCfg) {
    if (!imgCfg || typeof imgCfg !== 'object') return 0;
    const apiType = String(imgCfg.apiType || '').toLowerCase().trim();
    const model = resolveBucketModel(imgCfg).toLowerCase();
    const endpoint = String(imgCfg.endpoint || '').toLowerCase();

    const classifyGem = (m) => {
        if (m.includes('gemini-3.1-flash-image') || m.includes('nano-banana-2') || m.includes('nano banana 2')) return 14;
        if (m.includes('gemini-3-pro-image') || m.includes('nano-banana-pro') || m.includes('nano banana pro')) return 11;
        if (m.includes('gemini-2.5-flash-image') || m.includes('nano-banana')) return 3;
        return 0;
    };

    if (apiType === 'gemini' || (apiType === 'openai' && endpoint.includes('google-ai'))) {
        return classifyGem(model) || 5;
    }
    if (apiType === 'openrouter') {
        return classifyGem(model) || 5;
    }
    if (apiType === 'xai') {
        return 3;
    }
    if (apiType === 'openai' || apiType === 'electronhub') {
        if (model.includes('gpt-image')) return apiType === 'electronhub' ? 1 : 5;
        if ((model.includes('flux') && model.includes('kontext')) || model.includes('dall-e-2')) return 1;
        return 0;
    }
    if (apiType === 'naistera') {
        if (/^novelai(?:-|$)/i.test(model)) return 0;
        return 14;
    }
    return 0;
}

export function getActiveImageModelReferenceInfo(sourcePref = 'auto', requestedProfileId = '') {
    try {
        if (sourcePref === 'off') {
            return { maxRefs: 0, supportsImageRefs: false, model: '', apiType: sourcePref, profileName: '', hasUnsavedProfileDiff: false };
        }
        const picked = pickEffectiveBucket(sourcePref);
        if (!picked?.cfg) {
            return { maxRefs: 0, supportsImageRefs: false, model: '', apiType: '', profileName: '', hasUnsavedProfileDiff: false };
        }
        const cfgBase = picked.cfg;
        const imgCfg = resolveIsolatedImageConfig(cfgBase, requestedProfileId);
        const maxRefs = getModelMaxReferenceImages(imgCfg);
        let hasUnsavedProfileDiff = false;
        if (!requestedProfileId && cfgBase.activeConnectionProfileId && Array.isArray(cfgBase.connectionProfiles)) {
            const savedActive = cfgBase.connectionProfiles.find((p) => p && p.id === cfgBase.activeConnectionProfileId);
            if (savedActive) {
                const liveModel = resolveBucketModel(cfgBase);
                const savedModel = resolveBucketModel(savedActive);
                if (
                    String(cfgBase.apiType || '') !== String(savedActive.apiType || '')
                    || liveModel !== savedModel
                    || String(cfgBase.endpoint || '') !== String(savedActive.endpoint || '')
                ) {
                    hasUnsavedProfileDiff = true;
                }
            }
        }
        return {
            maxRefs,
            supportsImageRefs: maxRefs > 0,
            model: resolveBucketModel(imgCfg),
            apiType: imgCfg.apiType || '',
            profileName: imgCfg.profileName || 'Активный профиль',
            hasUnsavedProfileDiff,
        };
    } catch {
        return { maxRefs: 0, supportsImageRefs: false, model: '', apiType: '', profileName: '', hasUnsavedProfileDiff: false };
    }
}

const GEMINI_31_ASPECT_IDS = Object.freeze([
    '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9',
    '1:4', '4:1', '1:8', '8:1',
]);
const STANDARD_TEN_ASPECT_IDS = Object.freeze([
    '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9',
]);
const XAI_SUPPORTED_ASPECT_IDS = Object.freeze([
    '1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9',
    '2:1', '1:2', '19.5:9', '9:19.5', '20:9', '9:20',
]);
const NAI_SUPPORTED_ASPECT_IDS = Object.freeze(['1:1', '2:3', '3:2', '9:16', '16:9']);
const GPT_IMAGE_SIZE_MAP = Object.freeze({
    '1:1': '1024x1024',
    '2:3': '1024x1536',
    '3:2': '1536x1024',
});
const DALLE3_SIZE_MAP = Object.freeze({
    '1:1': '1024x1024',
    '9:16': '1024x1792',
    '16:9': '1792x1024',
});

// 1:1 parity with 0xl0cal/sillyimages v3.0.0-beta.1 src/modelCapabilities.js
export function classifySillyImagesGeminiModel(modelId) {
    const id = String(modelId || '').toLowerCase().trim();
    if (!id) return 'unknown';
    const clean = id.startsWith('google/') ? id.slice('google/'.length) : id;
    if (clean.startsWith('gemini-3.1-flash-image') || clean.includes('nano-banana-2') || clean.includes('nano banana 2')) {
        return 'gemini-3.1-flash-image';
    }
    if (clean.startsWith('gemini-3-pro-image') || clean.includes('nano-banana-pro') || clean.includes('nano banana pro')) {
        return 'gemini-3-pro-image';
    }
    if (clean.startsWith('gemini-2.5-flash-image') || clean.includes('nano-banana')) {
        return 'gemini-2.5-flash-image';
    }
    return 'unknown';
}

export function getSillyImagesGeminiCaps(modelId) {
    const kind = classifySillyImagesGeminiModel(modelId);
    if (kind === 'gemini-3.1-flash-image') {
        return { kind, maxReferences: 14, imageSizes: ['512', '1K', '2K', '4K'], aspectRatios: GEMINI_31_ASPECT_IDS };
    }
    if (kind === 'gemini-3-pro-image') {
        return { kind, maxReferences: 11, imageSizes: ['1K', '2K', '4K'], aspectRatios: STANDARD_TEN_ASPECT_IDS };
    }
    if (kind === 'gemini-2.5-flash-image') {
        return { kind, maxReferences: 3, imageSizes: null, aspectRatios: STANDARD_TEN_ASPECT_IDS };
    }
    return { kind: 'unknown', maxReferences: 5, imageSizes: ['1K', '2K', '4K'], aspectRatios: STANDARD_TEN_ASPECT_IDS };
}

export function classifySillyImagesOpenRouterModel(modelId) {
    const id = String(modelId || '').toLowerCase().trim();
    if (!id) return 'unknown';
    if (id.startsWith('google/') || id.includes('gemini-') || id.includes('nano-banana')) {
        const gemKind = classifySillyImagesGeminiModel(id);
        if (gemKind !== 'unknown') return gemKind;
    }
    if (id.startsWith('black-forest-labs/')) return 'flux';
    if (id.startsWith('sourceful/')) return 'sourceful';
    return 'unknown';
}

export function getSillyImagesOpenRouterCaps(modelId) {
    const kind = classifySillyImagesOpenRouterModel(modelId);
    if (kind === 'gemini-3.1-flash-image' || kind === 'gemini-3-pro-image' || kind === 'gemini-2.5-flash-image') {
        return { ...getSillyImagesGeminiCaps(kind), isGeminiOpenRouter: true };
    }
    return {
        kind,
        isGeminiOpenRouter: false,
        maxReferences: 5,
        imageSizes: null,
        aspectRatios: STANDARD_TEN_ASPECT_IDS,
    };
}

export function classifySillyImagesOpenAIModel(modelId) {
    const id = String(modelId || '').toLowerCase().trim();
    if (id.includes('gpt-image-1.5') || id.includes('gpt-image-1-5')) return 'gpt-image-1.5';
    if (id.includes('gpt-image-1-mini')) return 'gpt-image-1-mini';
    if (id.includes('gpt-image-1')) return 'gpt-image-1';
    if (id.includes('gpt-image')) return 'gpt-image';
    if (id.includes('flux-1-kontext') || (id.includes('flux') && id.includes('kontext'))) return 'flux-kontext';
    if (id.includes('dall-e-3')) return 'dall-e-3';
    if (id.includes('dall-e-2')) return 'dall-e-2';
    return 'unknown';
}

export function isSillyImagesGptImageFamily(kind) {
    return kind === 'gpt-image-1.5' || kind === 'gpt-image-1-mini' || kind === 'gpt-image-1' || kind === 'gpt-image';
}

export function mapAspectAndSizeForOpenAIModel(requestedAspect, profileSize, modelKind) {
    const cleanAspect = String(requestedAspect || '').trim();
    const explicit = cleanAspect && cleanAspect !== 'native' && cleanAspect !== 'sillyimages_default' && cleanAspect !== 'auto';
    const rawProfSize = String(profileSize || '').trim().toLowerCase();

    if (isSillyImagesGptImageFamily(modelKind)) {
        if (explicit) {
            const num = parseAspectRatioNumber(cleanAspect);
            if (cleanAspect === '1:1' || (num !== null && Math.abs(num - 1) <= 0.04)) {
                return { size: '1024x1024', aspectLabel: '1:1' };
            }
            if (num !== null && num < 1) {
                return { size: '1024x1536', aspectLabel: '2:3' };
            }
            return { size: '1536x1024', aspectLabel: '3:2' };
        }
        // Inherit from SillyImages settings.size, safely normalizing DALL-E portrait/landscape sizes for gpt-image-*
        if (rawProfSize === 'auto') return { size: 'auto', aspectLabel: 'auto' };
        if (rawProfSize === '1024x1536' || rawProfSize === '1024x1792') return { size: '1024x1536', aspectLabel: '2:3' };
        if (rawProfSize === '1536x1024' || rawProfSize === '1792x1024') return { size: '1536x1024', aspectLabel: '3:2' };
        return { size: '1024x1024', aspectLabel: '1:1' };
    }

    if (modelKind === 'dall-e-3') {
        if (explicit) {
            const num = parseAspectRatioNumber(cleanAspect);
            if (cleanAspect === '1:1' || (num !== null && Math.abs(num - 1) <= 0.04)) {
                return { size: '1024x1024', aspectLabel: '1:1' };
            }
            if (num !== null && num < 1) {
                return { size: '1024x1792', aspectLabel: '9:16' };
            }
            return { size: '1792x1024', aspectLabel: '16:9' };
        }
        if (rawProfSize === '1024x1792' || rawProfSize === '1024x1536') return { size: '1024x1792', aspectLabel: '9:16' };
        if (rawProfSize === '1792x1024' || rawProfSize === '1536x1024') return { size: '1792x1024', aspectLabel: '16:9' };
        return { size: '1024x1024', aspectLabel: '1:1' };
    }

    if (modelKind === 'dall-e-2') {
        const validD2 = new Set(['256x256', '512x512', '1024x1024']);
        const sz = (!explicit && validD2.has(rawProfSize)) ? rawProfSize : '1024x1024';
        return { size: sz, aspectLabel: '1:1' };
    }

    // Generic OpenAI-compatible / Electron Hub / Flux Kontext
    if (explicit) {
        const dims = getTargetCanvasDimensions(cleanAspect);
        return { size: `${dims.width}x${dims.height}`, aspectLabel: cleanAspect };
    }
    const fallbackSz = rawProfSize && /^\d+x\d+$/.test(rawProfSize) ? rawProfSize : (rawProfSize || '1024x1024');
    let derivedLabel = '1:1';
    const m = fallbackSz.match(/^(\d+)x(\d+)$/);
    if (m) {
        const w = Number(m[1]);
        const h = Number(m[2]);
        if (w > 0 && h > 0) {
            if (Math.abs(w - h) <= 4) derivedLabel = '1:1';
            else if (Math.abs(w / h - 2 / 3) < 0.05) derivedLabel = '2:3';
            else if (Math.abs(w / h - 3 / 2) < 0.05) derivedLabel = '3:2';
            else if (Math.abs(w / h - 9 / 16) < 0.05) derivedLabel = '9:16';
            else if (Math.abs(w / h - 16 / 9) < 0.05) derivedLabel = '16:9';
            else derivedLabel = w < h ? 'портрет' : 'альбом';
        }
    }
    return { size: fallbackSz, aspectLabel: derivedLabel };
}

export function resolveInheritedProfileAspectInfo(imgCfg) {
    if (!imgCfg || typeof imgCfg !== 'object') {
        return { aspectRatio: '1:1', size: '', summaryRu: '1:1', summaryEn: '1:1' };
    }
    const apiType = String(imgCfg.apiType || '').toLowerCase().trim();
    const model = String(resolveBucketModel(imgCfg) || '');
    const endpointLow = String(imgCfg.endpoint || '').toLowerCase();
    const isPollinations = apiType === 'pollinations' || endpointLow.includes('pollinations.ai');
    const isGeminiDirect = apiType === 'gemini' || (apiType === 'openai' && endpointLow.includes('google-ai'));

    if (apiType === 'openrouter') {
        const caps = getSillyImagesOpenRouterCaps(model);
        const profAr = String(imgCfg.aspectRatio || '1:1').trim();
        const ar = caps.aspectRatios.includes(profAr) ? profAr : '1:1';
        const sz = Array.isArray(caps.imageSizes) && caps.imageSizes.includes(String(imgCfg.imageSize || '').toUpperCase())
            ? String(imgCfg.imageSize).toUpperCase()
            : '';
        return {
            aspectRatio: ar,
            size: sz,
            summaryRu: sz ? `${ar} · ${sz}` : ar,
            summaryEn: sz ? `${ar} · ${sz}` : ar,
        };
    }

    if (isGeminiDirect) {
        const caps = getSillyImagesGeminiCaps(model);
        const profAr = String(imgCfg.aspectRatio || '1:1').trim();
        const ar = caps.aspectRatios.includes(profAr) ? profAr : '1:1';
        const sz = Array.isArray(caps.imageSizes) && caps.imageSizes.includes(String(imgCfg.imageSize || '').toUpperCase())
            ? String(imgCfg.imageSize).toUpperCase()
            : '';
        return {
            aspectRatio: ar,
            size: sz,
            summaryRu: sz ? `${ar} · ${sz}` : ar,
            summaryEn: sz ? `${ar} · ${sz}` : ar,
        };
    }

    if (apiType === 'xai') {
        const validXai = new Set(['auto', ...XAI_SUPPORTED_ASPECT_IDS]);
        const rawXai = String(imgCfg.xaiAspectRatio || '1:1').trim();
        const ar = validXai.has(rawXai) ? rawXai : '1:1';
        const res = String(imgCfg.xaiResolution || '1k').toLowerCase() === '2k' ? '2K' : '1K';
        return {
            aspectRatio: ar,
            size: res,
            summaryRu: `${ar === 'auto' ? 'Авто' : ar} · ${res}`,
            summaryEn: `${ar === 'auto' ? 'Auto' : ar} · ${res}`,
        };
    }

    if (apiType === 'naistera') {
        const rawNai = String(imgCfg.naisteraAspectRatio || '1:1').trim();
        const ar = NAI_SUPPORTED_ASPECT_IDS.includes(rawNai) ? rawNai : '1:1';
        return { aspectRatio: ar, size: '', summaryRu: ar, summaryEn: ar };
    }

    if (apiType === 'novelai') {
        const rawNai = String(imgCfg.novelaiAspectRatio || '2:3').trim();
        const ar = NAI_SUPPORTED_ASPECT_IDS.includes(rawNai) ? rawNai : '2:3';
        return { aspectRatio: ar, size: '', summaryRu: ar, summaryEn: ar };
    }

    if (apiType === 'a1111') {
        const w = Math.max(64, Number(imgCfg.a1111Width) || 512);
        const h = Math.max(64, Number(imgCfg.a1111Height) || 512);
        return { aspectRatio: 'native', size: `${w}x${h}`, summaryRu: `${w}x${h}`, summaryEn: `${w}x${h}` };
    }

    if (isPollinations) {
        const rawAr = String(imgCfg.aspectRatio || '').trim();
        if (STANDARD_TEN_ASPECT_IDS.includes(rawAr)) {
            const dims = getTargetCanvasDimensions(rawAr);
            return { aspectRatio: rawAr, size: `${dims.width}x${dims.height}`, summaryRu: `${rawAr} · ${dims.width}x${dims.height}`, summaryEn: `${rawAr} · ${dims.width}x${dims.height}` };
        }
        const rawSz = String(imgCfg.size || '').trim();
        if (/^\d+x\d+$/.test(rawSz)) {
            return { aspectRatio: '1:1', size: rawSz, summaryRu: rawSz, summaryEn: rawSz };
        }
        return { aspectRatio: '1:1', size: '1024x1024', summaryRu: '1:1 · 1024x1024', summaryEn: '1:1 · 1024x1024' };
    }

    // OpenAI / Electron Hub / OpenAI-compatible
    const oaKind = classifySillyImagesOpenAIModel(model);
    const mapped = mapAspectAndSizeForOpenAIModel('native', imgCfg.size, oaKind);
    const sum = mapped.size === 'auto' ? 'Auto' : `${mapped.aspectLabel} · ${mapped.size}`;
    return {
        aspectRatio: mapped.aspectLabel,
        size: mapped.size,
        summaryRu: sum,
        summaryEn: sum,
    };
}

export function getSupportedAspectRatiosForImageConfig(sourcePref = 'auto', requestedProfileId = '') {
    const stdFallbackIds = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9'];
    try {
        if (sourcePref === 'off') {
            const offIds = [...STANDARD_TEN_ASPECT_IDS];
            return {
                apiType: 'off',
                model: '',
                profileName: '',
                supportedIds: offIds,
                options: buildAspectOptionList(offIds),
                inheritedSummaryRu: 'Авто',
                inheritedSummaryEn: 'Auto',
                studioNativeLabelRu: 'Авто — Под размер самого арта (без обрезки)',
                studioNativeLabelEn: 'Auto — Keep Native Art Size (uncropped)',
                noteRu: 'Генератор отключён — доступны все пропорции для ваших собственных иллюстраций.',
                noteEn: 'Image generator is off — all frame ratios are available for manual uploads.',
            };
        }
        const picked = pickEffectiveBucket(sourcePref);
        if (!picked?.cfg) {
            return {
                apiType: '',
                model: '',
                profileName: '',
                supportedIds: [...STANDARD_TEN_ASPECT_IDS],
                options: buildAspectOptionList(STANDARD_TEN_ASPECT_IDS),
                inheritedSummaryRu: '1:1',
                inheritedSummaryEn: '1:1',
                studioNativeLabelRu: 'Как в SillyImages (наследовать из профиля · без обрезки)',
                studioNativeLabelEn: 'Inherit from SillyImages (keep native size)',
                noteRu: 'Профиль SillyImages ещё не выбран.',
                noteEn: 'SillyImages profile is not configured yet.',
            };
        }
        const imgCfg = resolveIsolatedImageConfig(picked.cfg, requestedProfileId);
        const apiType = String(imgCfg.apiType || '').toLowerCase().trim();
        const model = String(resolveBucketModel(imgCfg) || '');
        const mLow = model.toLowerCase();
        const endpointLow = String(imgCfg.endpoint || '').toLowerCase();
        const profileName = imgCfg.profileName || 'Активный профиль';
        const inherited = resolveInheritedProfileAspectInfo(imgCfg);
        const studioNativeLabelRu = `Как в SillyImages (из профиля · сейчас: ${inherited.summaryRu})`;
        const studioNativeLabelEn = `Inherit from SillyImages (profile: ${inherited.summaryEn})`;

        if (apiType === 'openrouter') {
            const orCaps = getSillyImagesOpenRouterCaps(model);
            const ids = [...orCaps.aspectRatios];
            const shortMod = model ? model.split('/').pop() : 'OpenRouter';
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: orCaps.isGeminiOpenRouter
                    ? `OpenRouter (${shortMod}): доступны все ${ids.length} форматов и наследование из SillyImages (${inherited.summaryRu}).`
                    : `OpenRouter (${shortMod}): доступны все 10 пропорций OpenRouter и прямое наследование из SillyImages (${inherited.summaryRu}).`,
                noteEn: `OpenRouter (${shortMod}): all ${ids.length} aspect ratios + SillyImages profile inheritance (${inherited.summaryEn}).`,
            };
        }

        const isGeminiDirect = apiType === 'gemini'
            || (apiType === 'openai' && endpointLow.includes('google-ai'));

        if (isGeminiDirect) {
            const gemCaps = getSillyImagesGeminiCaps(model);
            const ids = [...gemCaps.aspectRatios];
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: `Gemini Image (${model || 'активная модель'}): доступны все ${ids.length} форматов и наследование из SillyImages (${inherited.summaryRu}).`,
                noteEn: `Gemini Image (${model || 'active model'}): ${ids.length} aspect ratios + SillyImages inheritance (${inherited.summaryEn}).`,
            };
        }

        const oaKind = classifySillyImagesOpenAIModel(model);
        if (isSillyImagesGptImageFamily(oaKind)) {
            const ids = ['1:1', '2:3', '3:2'];
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids, GPT_IMAGE_SIZE_MAP),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: `GPT Image (${model}): подключены 3 родных формата OpenAI — 1:1 (1024x1024), 2:3 (1024x1536 портрет) и 3:2 (1536x1024 альбом).`,
                noteEn: `GPT Image (${model}): 3 native OpenAI formats — 1:1 (1024x1024), 2:3 (1024x1536 portrait), and 3:2 (1536x1024 landscape).`,
            };
        }

        if (oaKind === 'dall-e-3') {
            const ids = ['1:1', '9:16', '16:9'];
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids, DALLE3_SIZE_MAP),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: 'DALL-E 3: подключены 3 родных формата — 1:1 (1024x1024), 9:16 (1024x1792) и 16:9 (1792x1024).',
                noteEn: 'DALL-E 3: 3 native formats — 1:1 (1024x1024), 9:16 (1024x1792), and 16:9 (1792x1024).',
            };
        }

        if (oaKind === 'dall-e-2') {
            const ids = ['1:1'];
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids, { '1:1': inherited.size || '1024x1024' }),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: 'DALL-E 2 поддерживает только квадратный формат 1:1.',
                noteEn: 'DALL-E 2 supports 1:1 square format only.',
            };
        }

        if (apiType === 'xai' || mLow.includes('grok')) {
            const ids = [...XAI_SUPPORTED_ASPECT_IDS];
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: `xAI Grok Imagine: доступны все ${ids.length} родных пропорций и наследование из SillyImages (${inherited.summaryRu}).`,
                noteEn: `xAI Grok Imagine: all ${ids.length} native aspect ratios + SillyImages inheritance (${inherited.summaryEn}).`,
            };
        }

        if (apiType === 'novelai' || apiType === 'naistera') {
            const ids = [...NAI_SUPPORTED_ASPECT_IDS];
            const provName = apiType === 'novelai' ? 'NovelAI' : 'Naistera';
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: `${provName}: подключены 5 родных пропорций (1:1, 2:3, 3:2, 9:16, 16:9) и наследование из SillyImages (${inherited.summaryRu}).`,
                noteEn: `${provName}: 5 native aspect ratios (1:1, 2:3, 3:2, 9:16, 16:9) + SillyImages inheritance (${inherited.summaryEn}).`,
            };
        }

        if (apiType === 'pollinations' || apiType === 'a1111' || endpointLow.includes('pollinations.ai')) {
            const ids = [...STANDARD_TEN_ASPECT_IDS];
            const provName = apiType === 'a1111' ? 'A1111 / Forge' : 'Pollinations';
            return {
                apiType,
                model,
                profileName,
                supportedIds: ids,
                options: buildAspectOptionList(ids),
                inheritedSummaryRu: inherited.summaryRu,
                inheritedSummaryEn: inherited.summaryEn,
                studioNativeLabelRu,
                studioNativeLabelEn,
                noteRu: `${provName}: свободный холст (все 10 пропорций) и наследование из профиля (${inherited.summaryRu}).`,
                noteEn: `${provName}: custom canvas (all 10 aspect ratios) + profile inheritance (${inherited.summaryEn}).`,
            };
        }

        // Electron Hub / Flux Kontext / Generic OpenAI-compatible image models
        const compatIds = [...STANDARD_TEN_ASPECT_IDS];
        return {
            apiType,
            model,
            profileName,
            supportedIds: compatIds,
            options: buildAspectOptionList(compatIds),
            inheritedSummaryRu: inherited.summaryRu,
            inheritedSummaryEn: inherited.summaryEn,
            studioNativeLabelRu,
            studioNativeLabelEn,
            noteRu: `${apiType === 'electronhub' ? 'Electron Hub' : 'OpenAI-совместимый генератор'} (${model || 'профиль'}): все 10 пропорций холста и наследование из SillyImages (${inherited.summaryRu}).`,
            noteEn: `${apiType === 'electronhub' ? 'Electron Hub' : 'OpenAI-compatible'} (${model || 'profile'}): all 10 canvas ratios + SillyImages inheritance (${inherited.summaryEn}).`,
        };
    } catch {
        return {
            apiType: '',
            model: '',
            profileName: '',
            supportedIds: stdFallbackIds,
            options: buildAspectOptionList(stdFallbackIds),
            inheritedSummaryRu: '1:1',
            inheritedSummaryEn: '1:1',
            studioNativeLabelRu: 'Как в SillyImages (наследовать из профиля · без обрезки)',
            studioNativeLabelEn: 'Inherit from SillyImages (keep native size)',
            noteRu: '',
            noteEn: '',
        };
    }
}

// Isolated connection profile resolver: NEVER inherits apiKey, endpoint, or credentials from another profile! (fixes NMF-007)
export function resolveIsolatedImageConfig(cfgBase, requestedProfileId = '') {
    if (!cfgBase || typeof cfgBase !== 'object') {
        throw new Error('Настройки источника изображений недоступны.');
    }

    const profiles = Array.isArray(cfgBase.connectionProfiles)
        ? cfgBase.connectionProfiles.filter((p) => p && typeof p === 'object' && p.id)
        : [];
    const explicitId = String(requestedProfileId || '').trim();
    const activeNamedProfile = !explicitId && cfgBase.activeConnectionProfileId
        ? profiles.find((p) => p.id === cfgBase.activeConnectionProfileId)
        : null;
    const selectedProfile = explicitId ? profiles.find((p) => p.id === explicitId) : null;

    // Only global non-credential fields come from cfgBase (strictly READ-ONLY)
    const globalShared = {
        enabled: cfgBase.enabled !== false,
        styles: Array.isArray(cfgBase.styles) ? cfgBase.styles : [],
        activeStyleId: String(cfgBase.activeStyleId || ''),
        negativePrompts: Array.isArray(cfgBase.negativePrompts) ? cfgBase.negativePrompts : [],
        activeNegativePromptId: String(cfgBase.activeNegativePromptId || ''),
        slayStyle: String(cfgBase.slayStyle || ''),
        refInstructionEnabled: cfgBase.refInstructionEnabled !== false,
        refInstruction: String(cfgBase.refInstruction ?? '').trim(),
        sendRefDescriptions: cfgBase.sendRefDescriptions !== false,
    };

    // When explicitId is empty ("Active Profile"), read live top-level cfgBase if populated so unsaved active edits work too,
    // falling back to activeNamedProfile snapshot when top-level fields are blank.
    // When explicitId IS set, strictly isolate to selectedProfile only (zero key leakage across profiles — NMF-007!).
    const useLiveBase = !explicitId && Boolean(cfgBase.apiKey || cfgBase.endpoint || cfgBase.model || !activeNamedProfile);
    const sourceSnapshot = explicitId ? (selectedProfile || {}) : (useLiveBase ? cfgBase : activeNamedProfile);
    const isolatedConn = {};
    for (const [key, defVal] of Object.entries(SILLYIMAGES_DEFAULT_CONNECTION_FIELDS)) {
        const val = Object.prototype.hasOwnProperty.call(sourceSnapshot, key) ? sourceSnapshot[key] : undefined;
        isolatedConn[key] = val !== undefined && val !== null ? val : defVal;
    }

    isolatedConn.apiKey = explicitId
        ? String(selectedProfile?.apiKey ?? '')
        : String(sourceSnapshot?.apiKey ?? '');
    const rawEp = explicitId
        ? String(selectedProfile?.endpoint ?? '')
        : String(sourceSnapshot?.endpoint ?? '');
    isolatedConn.rawConfiguredEndpoint = rawEp;
    isolatedConn.endpoint = normalizeProviderEndpoint(isolatedConn.apiType, rawEp);

    return {
        ...globalShared,
        ...isolatedConn,
        profileId: (selectedProfile || activeNamedProfile)?.id || '',
        profileName: (selectedProfile || activeNamedProfile)?.name || 'Default',
    };
}

export function validateResolvedImageConfig(imgCfg) {
    if (!imgCfg || typeof imgCfg !== 'object') {
        return { ready: false, reason: 'Конфигурация пуста.' };
    }
    if (imgCfg.enabled === false) {
        return { ready: false, reason: 'Расширение генерации изображений выключено в настройках.' };
    }

    const apiType = String(imgCfg.apiType || '').trim();
    const isPollinations = apiType === 'pollinations' || /pollinations\.ai/i.test(String(imgCfg.endpoint || ''));
    if (isPollinations) {
        return { ready: true, reason: '' };
    }

    if (!SUPPORTED_SILLYIMAGES_PROVIDERS.includes(apiType)) {
        return { ready: false, reason: `Провайдер «${apiType || 'unknown'}» не поддерживается адаптером NexusMatch Forge.` };
    }

    const endpoint = normalizeProviderEndpoint(apiType, imgCfg.rawConfiguredEndpoint ?? imgCfg.endpoint);
    const apiKey = String(imgCfg.apiKey || '').trim();
    const model = resolveBucketModel(imgCfg);

    if (apiType === 'a1111') {
        if (!endpoint) return { ready: false, reason: 'Не указан URL сервера A1111 / Forge.' };
        return { ready: true, reason: '' };
    }

    if (!apiKey) {
        return { ready: false, reason: 'В выбранном профиле не заполнен API-ключ.' };
    }

    if ((apiType === 'openai' || apiType === 'gemini') && !endpoint) {
        return { ready: false, reason: `Для провайдера ${apiType} необходимо указать Endpoint URL в профиле.` };
    }

    if (apiType === 'novelai') {
        if (!Object.prototype.hasOwnProperty.call(NOVELAI_MODELS, model)) {
            return { ready: false, reason: `Для NovelAI выберите поддерживаемую модель (${Object.keys(NOVELAI_MODELS).join(', ')}).` };
        }
        return { ready: true, reason: '' };
    }

    if (apiType !== 'naistera' && !model) {
        return { ready: false, reason: 'В выбранном профиле не выбрана модель генерации изображений.' };
    }

    return { ready: true, reason: '' };
}

function getEffectiveNegativePromptForConfig(imgCfg, requestedNegId = '', customNegText = '') {
    const negArr = Array.isArray(imgCfg.negativePrompts) ? imgCfg.negativePrompts : [];
    let presetVal = '';
    if (requestedNegId !== '__none__') {
        const chosenNeg = (requestedNegId && negArr.find((n) => n && n.id === requestedNegId))
            || negArr.find((n) => n && n.id === imgCfg.activeNegativePromptId);
        const negStr = String(chosenNeg?.value ?? chosenNeg?.prompt ?? '').trim();
        if (negStr) {
            presetVal = negStr;
        } else if (!requestedNegId) {
            if (imgCfg.apiType === 'novelai') presetVal = String(imgCfg.novelaiNegativePrompt || '').trim();
            else if (imgCfg.apiType === 'naistera') presetVal = String(imgCfg.naisteraNegativePrompt || '').trim();
            else if (imgCfg.apiType === 'a1111') presetVal = String(imgCfg.a1111NegativePrompt || '').trim();
        }
    }
    const extraVal = String(customNegText || '').trim();
    return [presetVal, extraVal].filter(Boolean).join(', ');
}

// Strict known-ID discovery for SillyImages & compatible forks (fixes NMF-009)
export function listImageExtensionBuckets() {
    const out = [];
    const ctx = getTavernContext();
    const all = ctx?.extensionSettings || {};
    const disabledList = Array.isArray(all.disabledExtensions) ? all.disabledExtensions : [];

    for (const key of KNOWN_IMAGE_EXTENSION_KEYS) {
        const v = all[key];
        if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
        if (typeof v.apiType !== 'string' && !Array.isArray(v.connectionProfiles)) continue;

        const isDisabled = isImageExtensionDisabledInTavern(key, v, disabledList);
        const resolvedActive = resolveIsolatedImageConfig(v, v.activeConnectionProfileId || '');
        const activeValidation = isDisabled
            ? { ready: false, reason: 'Расширение отключено в SillyTavern.' }
            : validateResolvedImageConfig(resolvedActive);

        const profiles = (Array.isArray(v.connectionProfiles) ? v.connectionProfiles : [])
            .filter((p) => p && p.id)
            .map((p) => {
                const snap = resolveIsolatedImageConfig(v, p.id);
                const check = isDisabled
                    ? { ready: false, reason: 'Расширение отключено.' }
                    : validateResolvedImageConfig(snap);
                return {
                    id: p.id,
                    name: p.name || p.id,
                    model: resolveBucketModel(snap),
                    apiType: snap.apiType || '',
                    ready: check.ready,
                    reason: check.reason,
                };
            });

        out.push({
            key,
            enabled: !isDisabled,
            ready: activeValidation.ready,
            reason: activeValidation.reason,
            model: resolveBucketModel(resolvedActive),
            apiType: resolvedActive.apiType || '',
            activeProfileName: resolvedActive.profileName || 'Default',
            extAspectRatio: resolveInheritedProfileAspectInfo(resolvedActive).summaryRu,
            profiles,
            styles: (Array.isArray(v.styles) ? v.styles : [])
                .filter((s) => s && s.id)
                .map((s) => ({ id: s.id, name: s.name || s.id })),
            negativePrompts: (Array.isArray(v.negativePrompts) ? v.negativePrompts : [])
                .filter((n) => n && n.id)
                .map((n) => ({ id: n.id, name: n.name || n.id })),
        });
    }
    return out;
}

export function resolveAutoImageSourceSummary(sourcePref = 'auto', profileId = '') {
    const normPref = (sourcePref === 'st_sd' || sourcePref === 'slay_image_gen') ? 'auto' : sourcePref;
    const buckets = listImageExtensionBuckets();
    if (normPref === 'off') {
        return { mode: 'off', label: 'Выключено' };
    }
    const enabledBuckets = buckets.filter((b) => b.enabled);
    const chosen = (normPref !== 'auto' && normPref !== 'iig')
        ? buckets.find((b) => b.key === normPref)
        : (enabledBuckets.find((b) => b.ready) || enabledBuckets[0] || null);

    if (!chosen) {
        return { mode: 'none', label: 'Активный источник SillyImages не обнаружен' };
    }
    const prof = profileId
        ? chosen.profiles.find((p) => p.id === profileId)
        : null;
    const profName = prof?.name || chosen.activeProfileName || 'Default';
    const apiLabel = prof?.apiType || chosen.apiType || 'api';
    return {
        mode: chosen.key,
        key: chosen.key,
        ready: prof ? prof.ready : chosen.ready,
        reason: prof ? prof.reason : chosen.reason,
        label: `${chosen.key} -> Профиль «${profName}» (${apiLabel})`,
    };
}

function pickEffectiveBucket(sourcePref = 'auto') {
    const normPref = (sourcePref === 'st_sd' || sourcePref === 'slay_image_gen') ? 'auto' : sourcePref;
    const ctx = getTavernContext();
    const all = ctx?.extensionSettings || {};
    const buckets = listImageExtensionBuckets();

    if (normPref && normPref !== 'auto' && normPref !== 'iig' && normPref !== 'off') {
        const explicitBucket = buckets.find((b) => b.key === normPref);
        if (explicitBucket && !explicitBucket.enabled) {
            throw new Error(`Источник изображений «${normPref}» отключён в настройках SillyTavern.`);
        }
        if (explicitBucket && all[normPref]) {
            return { key: normPref, cfg: all[normPref] };
        }
        throw new Error(`Источник изображений «${normPref}» не найден.`);
    }

    const enabledBuckets = buckets.filter((b) => b.enabled);
    const readyOne = enabledBuckets.find((b) => b.ready) || enabledBuckets[0];
    if (readyOne && all[readyOne.key]) {
        return { key: readyOne.key, cfg: all[readyOne.key] };
    }
    return null;
}

export function detectImageExtensions() {
    const buckets = listImageExtensionBuckets();
    const hasIig = buckets.some((b) => b.enabled && b.ready);

    return {
        hasAny: hasIig,
        hasIig,
        hasStSd: false,
        buckets,
    };
}

function sleepAbortable(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(new Error('Генерация остановлена.'));
        const t = setTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(t);
            reject(new Error('Генерация остановлена.'));
        };
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
    });
}

function formatHttpProviderError(providerName, status, rawDetail = '') {
    const shortDetail = String(rawDetail || '').trim().slice(0, 180);
    if (status === 401 || status === 403) {
        return `${providerName}: неверный или неавторизованный API-ключ (HTTP ${status})${shortDetail ? ` — ${shortDetail}` : ''}`;
    }
    if (status === 429) {
        return `${providerName}: превышен лимит запросов провайдера (HTTP 429)${shortDetail ? ` — ${shortDetail}` : ''}`;
    }
    if (status >= 500) {
        return `${providerName}: временная ошибка сервера провайдера (HTTP ${status})${shortDetail ? ` — ${shortDetail}` : ''}`;
    }
    return `${providerName} HTTP ${status}${shortDetail ? `: ${shortDetail}` : ''}`;
}

function isNonRetryableArtError(err) {
    if (err?.code === 'ABORTED') return true;
    const msg = String(err?.message || err || '');
    if (/остановлена|отменён|aborted|AbortError/i.test(msg)) return true;
    if (/HTTP (?:401|402|403|404)\b|неверный или неавторизованный API-ключ|Anlas protection/i.test(msg)) return true;
    if (/SAFETY|PROHIBITED|BLOCKED|не заполнен|отключ|не поддерживается|не выбрана модель/i.test(msg)) return true;
    return false;
}

// 1:1 NovelAI parameter builder & Anlas protection matching 0xl0cal/sillyimages/src/novelai.js (fixes NMF-008)
function buildNovelAiPayload(imgCfg, fullPrompt, negativePrompt, requestedAspect = '2:3') {
    const model = resolveBucketModel(imgCfg);
    const medium = model === NOVELAI_MEDIUM_MODEL;
    const protectAnlas = imgCfg.novelaiNeverSpendAnlas !== false;
    const resTier = protectAnlas ? 'normal' : (NOVELAI_RESOLUTION_PRESETS[imgCfg.novelaiResolution] ? imgCfg.novelaiResolution : 'normal');
    const validAspects = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    const aspectKey = (requestedAspect !== 'native' && validAspects.includes(requestedAspect))
        ? requestedAspect
        : (validAspects.includes(imgCfg.novelaiAspectRatio) ? imgCfg.novelaiAspectRatio : '2:3');
    const [width, height] = NOVELAI_RESOLUTION_PRESETS[resTier][aspectKey] || [832, 1216];

    const steps = medium
        ? 14
        : (protectAnlas ? (model.startsWith('nai-diffusion-4-5-') ? 28 : 23) : Math.max(1, Math.min(50, Number(imgCfg.novelaiSteps) || 23)));
    const sampler = medium ? 'k_euler_ancestral' : (imgCfg.novelaiSampler || 'k_euler_ancestral');
    const scale = Math.max(0, Math.min(10, Number(imgCfg.novelaiCfgScale ?? 7)));
    const cfgRescale = medium ? 0 : Math.max(0, Math.min(1, Number(imgCfg.novelaiCfgRescale ?? 0)));
    const rawSeed = Number(imgCfg.novelaiSeed ?? -1);
    const seed = rawSeed < 0 ? Math.floor(Math.random() * 4294967296) : rawSeed;

    const splitPipes = (txt) => {
        const [base = '', ...characters] = String(txt || '').split(/\\?\|/u).map((s) => s.trim());
        return { base, characters };
    };
    const pos = splitPipes(fullPrompt);
    const mergedNegStr = medium
        ? [NOVELAI_MEDIUM_NEGATIVE, negativePrompt].filter(Boolean).join(', ')
        : negativePrompt;
    const neg = splitPipes(mergedNegStr);
    const makeCaption = (base, chars) => ({
        base_caption: base,
        char_captions: chars.map((char_caption) => ({ char_caption, centers: [{ x: 0.5, y: 0.5 }] })),
    });

    const parameters = {
        params_version: 4,
        width,
        height,
        steps,
        scale,
        cfg_rescale: cfgRescale,
        sampler,
        noise_schedule: imgCfg.novelaiNoiseSchedule || 'karras',
        seed,
        n_samples: 1,
        negative_prompt: neg.base,
        qualityToggle: false,
        ucPreset: medium ? 0 : 3,
        deliberate_euler_ancestral_bug: false,
        prefer_brownian: true,
        skip_cfg_above_sigma: Number(imgCfg.novelaiSkipCfgAboveSigma) || null,
        v4_prompt: { caption: makeCaption(pos.base, pos.characters), use_coords: false, use_order: true },
        v4_negative_prompt: {
            caption: makeCaption(
                neg.base,
                Array.from({ length: Math.max(pos.characters.length, neg.characters.length) }, (_, i) => neg.characters[i] || '')
            ),
            legacy_uc: false,
        },
    };
    if (model.startsWith('nai-diffusion-5-')) {
        delete parameters.noise_schedule;
        delete parameters.skip_cfg_above_sigma;
    }
    if (medium) {
        delete parameters.cfg_rescale;
    }
    return {
        action: 'generate',
        model,
        input: pos.base,
        parameters,
    };
}

async function verifyNovelAiFreeAllowance(generateUrl, apiKey, model, timeoutMs, signal) {
    let target;
    try {
        target = new URL(generateUrl);
    } catch {
        throw new Error('NovelAI Anlas protection: некорректный URL генерации.');
    }
    if (!target.pathname.endsWith('/ai/generate-image') || target.search || target.hash) {
        throw new Error('NovelAI Anlas protection: проверка бесплатного лимита недоступна на нестандартном URL.');
    }
    target.pathname = target.pathname.replace(/\/ai\/generate-image$/, '/user/subscription');
    const subRes = await fetchWithTimeout(target.href, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    }, Math.min(15000, timeoutMs), signal);
    if (!subRes.ok) {
        throw new Error(`NovelAI Anlas protection: не удалось проверить подписку Opus (HTTP ${subRes.status}).`);
    }
    const sub = await subRes.json();
    if (sub?.active !== true || sub.tier !== 3 || typeof sub.expiresAt !== 'number' || sub.expiresAt * 1000 <= Date.now()) {
        throw new Error('NovelAI Anlas protection: для генерации без траты Anlas требуется активная подписка Opus.');
    }
    const usage = sub.usage;
    const hasRegular = usage?.isNegative === false && Number.isFinite(usage.percent) && usage.percent > 0;
    const hasExtra = Number.isFinite(usage?.purchasedPercent) && usage.purchasedPercent > 0 && usage.purchasedPercent <= 400;
    if (model.startsWith('nai-diffusion-5-') && !hasRegular && !hasExtra) {
        throw new Error('NovelAI Anlas protection: бесплатный лимит V5 исчерпан.');
    }
}

export const SILLYIMAGES_DEFAULT_REF_INSTRUCTION = '[CRITICAL: The reference image(s) above show the EXACT appearance of the character(s). You MUST precisely copy their: face structure, eye color, hair color and style, skin tone, body type, clothing, and all distinctive features. Do not deviate from the reference appearances.]';
export const FUSION_BLEND_REF_INSTRUCTION = '[VISUAL ALCHEMY REFERENCE: The reference image(s) above show parent donor archetypes. Synthesize a brand-new, cohesive original character appearance that organically harmonizes select visual echoes from them while strictly following the new character portrait description below. Do NOT copy any single reference verbatim.]';
export const CONCEPT_SHEET_REF_INSTRUCTION = '[CONCEPT ART ANCHOR REFERENCE: The reference image above establishes the exact canonical appearance, face structure, species features, body proportions, hair/fur, color palette, and visual style of the subject. Maintain 100% identity consistency with this anchor reference while freely illustrating all requested turnaround views, expressions, alternate outfits, close-up belongings, and environment panels described below.]';

function splitDataUrlComponents(rawStr) {
    const val = String(rawStr || '').trim();
    if (!val) return null;
    if (val.startsWith('data:')) {
        const b64Marker = ';base64,';
        const markerIdx = val.indexOf(b64Marker);
        if (markerIdx > 5) {
            const mime = val.slice(5, markerIdx) || 'image/png';
            const rawB64 = val.slice(markerIdx + b64Marker.length);
            const cleanB64 = /\s/.test(rawB64) ? rawB64.replace(/\s+/g, '') : rawB64;
            if (!cleanB64) return null;
            return {
                mimeType: mime,
                base64: cleanB64,
                dataUrl: `data:${mime};base64,${cleanB64}`,
            };
        }
        return null;
    }
    if (val.length > 64 && !/[^A-Za-z0-9+/=\s]/.test(val)) {
        const cleanB64 = /\s/.test(val) ? val.replace(/\s+/g, '') : val;
        const mime = cleanB64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        return {
            mimeType: mime,
            base64: cleanB64,
            dataUrl: `data:${mime};base64,${cleanB64}`,
        };
    }
    return null;
}

function base64ToBlobBinary(base64Str, mimeType = 'image/png') {
    let binStr = '';
    if (typeof atob === 'function') {
        binStr = atob(base64Str);
    } else if (typeof Buffer !== 'undefined') {
        return new Blob([Buffer.from(base64Str, 'base64')], { type: mimeType });
    }
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
}

function normalizeSillyImagesStoredImagePath(rawPath) {
    const val = String(rawPath || '').trim();
    if (!val) return '';
    if (val.startsWith('data:') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/')) {
        return val;
    }
    return `/${val.replace(/^\.?\//, '')}`;
}

function textMatchesTriggerAlias(haystackNorm, aliasRaw) {
    const alias = String(aliasRaw || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!haystackNorm || !alias) return false;
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    try {
        const re = new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, 'iu');
        return re.test(haystackNorm);
    } catch {
        return haystackNorm.includes(alias);
    }
}

/**
 * Read-only catalog of available appearance references from SillyImages v3.0+ (lorebooks & characterReferenceLibrary)
 * and legacy v2 additionalReferences. Never mutates SillyImages settings.
 */
export function listSillyImagesReferenceCatalog(sourcePref = 'auto', { includeDisabled = false } = {}) {
    let picked = null;
    try {
        picked = pickEffectiveBucket(sourcePref);
    } catch {
        picked = null;
    }
    const cfg = picked?.cfg;
    if (!cfg || typeof cfg !== 'object') return [];

    const catalog = [];
    const powerMode = cfg.additionalReferencesMode === 'power';

    // 1. SillyImages v3.0+ Lorebooks
    if (Array.isArray(cfg.lorebooks)) {
        for (const lb of cfg.lorebooks) {
            if (!lb || typeof lb !== 'object') continue;
            const lbEnabled = lb.enabled !== false;
            const lbName = String(lb.name || 'Lorebook').trim();
            const refs = Array.isArray(lb.refs) ? lb.refs : [];
            for (const r of refs) {
                if (!r || typeof r !== 'object') continue;
                const refEnabled = r.enabled !== false;
                if (!includeDisabled && !refEnabled) continue;
                const imagePath = normalizeSillyImagesStoredImagePath(r.imagePath);
                const description = String(r.description || '').trim();
                const name = String(r.name || '').trim();
                if (!imagePath && !description) continue;
                catalog.push({
                    uid: `lb:${lb.id || lbName}:${r.id || name}`,
                    kind: 'lorebook',
                    bookEnabled: (!powerMode || lbEnabled) && refEnabled,
                    refEnabled,
                    lbEnabled,
                    bookName: lbName,
                    name: name || 'Без имени',
                    label: `[${lbName}] ${name || 'Референс'}`,
                    description,
                    imagePath,
                    matchMode: r.matchMode === 'always' ? 'always' : 'match',
                    priority: Number.isFinite(Number(r.priority)) ? Number(r.priority) : 0,
                    useRegex: r.useRegex === true,
                    secondaryKeys: String(r.secondaryKeys || '').trim(),
                });
            }
        }
    } else if (Array.isArray(cfg.additionalReferences)) {
        // Legacy SillyImages v2 fallback
        for (const [idx, r] of cfg.additionalReferences.entries()) {
            if (!r || typeof r !== 'object') continue;
            const refEnabled = r.enabled !== false;
            if (!includeDisabled && !refEnabled) continue;
            const imagePath = normalizeSillyImagesStoredImagePath(r.imagePath || r.url || r.image);
            const description = String(r.description || '').trim();
            const name = String(r.name || '').trim();
            if (!imagePath && !description) continue;
            catalog.push({
                uid: `legacy:${r.id || idx}`,
                kind: 'lorebook',
                bookEnabled: refEnabled,
                refEnabled,
                lbEnabled: true,
                bookName: 'Refs',
                name: name || `Ref ${idx + 1}`,
                label: `[Refs] ${name || `Ref ${idx + 1}`}`,
                description,
                imagePath,
                matchMode: r.matchMode === 'always' ? 'always' : 'match',
                priority: Number.isFinite(Number(r.priority)) ? Number(r.priority) : 0,
                useRegex: r.useRegex === true,
                secondaryKeys: String(r.secondaryKeys || '').trim(),
            });
        }
    }

    // 2. SillyImages v3.0+ Character & User Persona Reference Libraries
    const libBuckets = [
        { map: cfg.characterReferenceLibrary?.characters, kind: 'char_lib', bookLabel: 'Персонажи ST', prefix: '[Чар]' },
        { map: cfg.characterReferenceLibrary?.users, kind: 'user_lib', bookLabel: 'Персоны Юзера', prefix: '[Юзер]' },
    ];
    for (const { map, kind, bookLabel, prefix } of libBuckets) {
        if (!map || typeof map !== 'object') continue;
        for (const [charKey, entry] of Object.entries(map)) {
            if (!entry || typeof entry !== 'object') continue;
            const rawFileName = charKey.startsWith('avatar:') ? charKey.slice('avatar:'.length) : '';
            const fallbackAvatarPath = rawFileName
                ? (kind === 'user_lib' ? `/User Avatars/${encodeURIComponent(rawFileName)}` : `/characters/${encodeURIComponent(rawFileName)}`)
                : '';
            const disp = String(entry.displayName || charKey.replace(/^avatar:|^name:/, '').replace(/\.png$/i, '')).trim() || charKey;
            const primImg = normalizeSillyImagesStoredImagePath(entry.primary?.imagePath) || fallbackAvatarPath;
            const primDesc = String(entry.primary?.description || '').trim();
            const primEnabled = entry.primary?.enabled !== false;
            if ((includeDisabled || primEnabled) && (primImg || primDesc)) {
                catalog.push({
                    uid: `${kind}:${charKey}:primary`,
                    kind,
                    bookEnabled: primEnabled,
                    refEnabled: primEnabled,
                    lbEnabled: true,
                    bookName: bookLabel,
                    name: disp,
                    label: `${prefix} ${disp}`,
                    description: primDesc,
                    imagePath: primImg,
                    matchMode: 'match',
                    priority: 10,
                    useRegex: false,
                    secondaryKeys: '',
                });
            }
            const items = Array.isArray(entry.appearanceItems) ? entry.appearanceItems : [];
            items.forEach((it, idx) => {
                if (!it) return;
                const itEnabled = it.enabled !== false;
                if (!includeDisabled && !itEnabled) return;
                const itImg = it.type === 'image' ? normalizeSillyImagesStoredImagePath(it.imagePath) : '';
                const itDesc = String(it.description || '').trim();
                if (!itImg && !itDesc) return;
                catalog.push({
                    uid: `${kind}:${charKey}:item:${it.id || idx}`,
                    kind,
                    bookEnabled: itEnabled,
                    refEnabled: itEnabled,
                    lbEnabled: true,
                    bookName: bookLabel,
                    name: `${disp} #${idx + 1}`,
                    label: `${prefix} ${disp} — облик #${idx + 1}`,
                    description: itDesc,
                    imagePath: itImg,
                    matchMode: 'match',
                    priority: 5,
                    useRegex: false,
                    secondaryKeys: '',
                });
            });
        }
    }

    return catalog;
}

export function matchSillyImagesReferencesByText(sourcePref = 'auto', searchText = '', maxRefs = 5) {
    const catalog = listSillyImagesReferenceCatalog(sourcePref).filter((x) => x.bookEnabled);
    if (!catalog.length) return [];
    const normHaystack = String(searchText || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
    const matched = [];
    const seenKeys = new Set();

    for (const item of catalog) {
        let matchReasonLabel = '';
        if (item.matchMode === 'always') {
            matchReasonLabel = `Библиотека «${item.bookName}» · Всегда активен`;
        } else {
            if (!normHaystack) continue;
            let primaryHit = false;
            let hitKey = '';
            if (item.useRegex && item.name) {
                try {
                    const m = item.name.match(/^\/(.+)\/([a-z]*)$/i);
                    const re = m ? new RegExp(m[1], m[2] || 'iu') : new RegExp(item.name, 'iu');
                    primaryHit = re.test(searchText);
                    if (primaryHit) hitKey = item.name;
                } catch {
                    primaryHit = textMatchesTriggerAlias(normHaystack, item.name);
                    if (primaryHit) hitKey = item.name;
                }
            } else {
                const aliases = String(item.name || '').split(',').map((s) => s.trim()).filter(Boolean);
                const foundAlias = aliases.find((a) => textMatchesTriggerAlias(normHaystack, a));
                primaryHit = Boolean(foundAlias);
                hitKey = foundAlias || '';
            }
            if (!primaryHit) continue;
            matchReasonLabel = `Библиотека «${item.bookName}» · Ключ «${hitKey || item.name}»`;
        }

        if (item.secondaryKeys) {
            const sec = item.secondaryKeys.split(',').map((s) => s.trim()).filter(Boolean);
            if (sec.length > 0 && !sec.every((s) => textMatchesTriggerAlias(normHaystack, s))) {
                continue;
            }
        }
        const dedupeSig = `${item.name}|${item.imagePath}|${item.description}`;
        if (seenKeys.has(dedupeSig)) continue;
        seenKeys.add(dedupeSig);
        matched.push({ ...item, _matchSource: matchReasonLabel });
    }

    matched.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return matched.slice(0, Math.max(1, maxRefs));
}

async function resolveActiveReferencePayloadList({
    sourcePref = 'auto',
    refMode = 'off',
    pickedRefUid = '',
    pickedRefUids = [],
    customRefDataUrls = [],
    customRefDesc = '',
    matchText = '',
    maxRefs = 5,
    fusionBlendRefs = false,
    signal = null,
    timeoutMs = DEFAULT_IMAGE_REQUEST_TIMEOUT_MS,
} = {}) {
    const normalizedMode = String(refMode || 'off').trim();
    if (normalizedMode === 'off' && (!Array.isArray(customRefDataUrls) || customRefDataUrls.length === 0)) {
        return [];
    }

    const cap = Math.max(1, Number(maxRefs) || 5);
    const out = [];
    const pushResolved = (rawDataUrl, desc, label, sourceTag = '', previewUrl = '') => {
        const parts = splitDataUrlComponents(rawDataUrl);
        if (parts) {
            out.push({
                dataUrl: parts.dataUrl,
                base64: parts.base64,
                mimeType: parts.mimeType,
                description: String(desc || '').trim(),
                label: String(label || '').trim(),
                sourceTag: String(sourceTag || '').trim(),
                previewUrl: previewUrl || parts.dataUrl,
            });
        } else if (String(desc || '').trim()) {
            out.push({
                dataUrl: '',
                base64: '',
                mimeType: '',
                description: String(desc || '').trim(),
                label: String(label || '').trim(),
                sourceTag: String(sourceTag || '').trim(),
                previewUrl: previewUrl || '',
            });
        }
    };

    if (Array.isArray(customRefDataUrls) && customRefDataUrls.length > 0 && (normalizedMode === 'custom_photo' || normalizedMode === 'explicit')) {
        const tag = fusionBlendRefs ? 'Синтез Алтаря (донор)' : 'Своё реф-фото сессии';
        for (const item of customRefDataUrls.slice(0, cap)) {
            if (typeof item === 'string') {
                pushResolved(item, customRefDesc, 'Custom Reference', tag, item);
            } else if (item && typeof item === 'object') {
                const u = item.dataUrl || item.image || '';
                pushResolved(u, item.description ?? customRefDesc, item.label || 'Reference', tag, u);
            }
        }
        return out;
    }

    let rawItems = [];
    const normalizedUids = Array.isArray(pickedRefUids) && pickedRefUids.length > 0
        ? pickedRefUids.map((u) => String(u || '').trim()).filter(Boolean)
        : (pickedRefUid ? [String(pickedRefUid).trim()] : []);

    if (normalizedMode === 'pick_sillyimages' && normalizedUids.length > 0) {
        const uniqueUids = [...new Set(normalizedUids)];
        const all = listSillyImagesReferenceCatalog(sourcePref, { includeDisabled: true });
        rawItems = uniqueUids
            .map((uid) => all.find((x) => x.uid === uid))
            .filter(Boolean)
            .map((it) => ({ ...it, _matchSource: `Выбрано вручную · ${it.bookName || 'SillyImages'}` }));
    } else if (normalizedMode === 'auto_lorebook') {
        rawItems = matchSillyImagesReferencesByText(sourcePref, matchText, cap);
    }

    for (const item of rawItems.slice(0, cap)) {
        if (item.imagePath) {
            try {
                const dUrl = item.imagePath.startsWith('data:')
                    ? item.imagePath
                    : await urlToDataUrl(item.imagePath, signal, timeoutMs);
                pushResolved(dUrl, item.description, item.name, item._matchSource || item.bookName, item.imagePath);
            } catch {
                if (item.description) {
                    pushResolved('', item.description, item.name, item._matchSource || item.bookName, item.imagePath);
                }
            }
        } else if (item.description) {
            pushResolved('', item.description, item.name, item._matchSource || item.bookName, '');
        }
    }
    return out;
}

export async function generateCharacterPortrait(visualPrompt, options = {}) {
    const cleanPrompt = String(visualPrompt || '').trim();
    if (!cleanPrompt) throw new Error('Промпт изображения пуст.');

    const sourcePref = typeof options === 'string' ? options : (options.imageSource || 'auto');
    const profileId = typeof options === 'object' ? (options.imageProfileId || '') : '';
    const styleId = typeof options === 'object' ? (options.imageStyleId || '') : '';
    const styleWrapMode = typeof options === 'object' ? (options.styleWrapMode || 'plain_prefix') : 'plain_prefix';
    const negativePromptId = typeof options === 'object' ? (options.imageNegativeId || '') : '';
    const customNegativePrompt = typeof options === 'object' ? (options.imageCustomNegative || '') : '';
    const rawAspect = typeof options === 'object' && options.aspectRatio ? options.aspectRatio : '1:1';
    const signal = typeof options === 'object' ? (options.signal || null) : null;
    let maxAttempts = typeof options === 'object' && Number.isFinite(Number(options.maxAttempts)) && Number(options.maxAttempts) > 0 ? Number(options.maxAttempts) : 0;
    const timeoutMs = typeof options === 'object' && Number(options.timeoutMs) > 0
        ? Number(options.timeoutMs)
        : DEFAULT_IMAGE_REQUEST_TIMEOUT_MS;
    const onStatus = typeof options === 'object' && typeof options.onStatus === 'function' ? options.onStatus : null;

    const refMode = typeof options === 'object' ? (options.refMode || 'off') : 'off';
    const pickedRefUid = typeof options === 'object' ? (options.pickedRefUid || '') : '';
    const pickedRefUids = typeof options === 'object' && Array.isArray(options.pickedRefUids) ? options.pickedRefUids : [];
    const customRefDataUrls = typeof options === 'object' && Array.isArray(options.customRefDataUrls) ? options.customRefDataUrls : [];
    const customRefDesc = typeof options === 'object' ? (options.customRefDesc || '') : '';
    const refMatchContext = typeof options === 'object' ? (options.refMatchContext || '') : '';
    const fusionBlendRefs = typeof options === 'object' && options.fusionBlendRefs === true;
    const refInstructionOverride = typeof options === 'object' && typeof options.refInstructionOverride === 'string'
        ? options.refInstructionOverride.trim()
        : '';
    const safeFandomArtPrompt = typeof options === 'object' && options.safeFandomArtPrompt === true;

    const emit = (stage, detail = '', attempt = 1, providerLabel = '') => {
        if (!onStatus) return;
        try {
            onStatus({ stage, detail, attempt, maxAttempts, providerLabel });
        } catch {}
    };

    if (sourcePref === 'off') {
        throw new Error('Генерация изображений отключена в настройках.');
    }

    emit('Подготовка генерации', 'Чтение профиля и параметров генератора...', 1, '');

    const picked = pickEffectiveBucket(sourcePref);
    if (!picked) {
        throw new Error('Не найдено включённое и настроенное расширение генерации изображений (SillyImages).');
    }

    const imgCfg = resolveIsolatedImageConfig(picked.cfg, profileId);
    const siMaxRetries = Number.isFinite(Number(picked.cfg.maxRetries)) && Number(picked.cfg.maxRetries) >= 0 ? Math.min(5, Math.round(Number(picked.cfg.maxRetries))) : 0;
    const siBaseDelayMs = Number.isFinite(Number(picked.cfg.retryDelay)) && Number(picked.cfg.retryDelay) >= 500 ? Number(picked.cfg.retryDelay) : 1000;
    if (!maxAttempts) maxAttempts = 1 + siMaxRetries;
    const validation = validateResolvedImageConfig(imgCfg);
    if (!validation.ready) {
        throw new Error(`${picked.key} (${imgCfg.profileName}): ${validation.reason}`);
    }

    const maxModelRefs = getModelMaxReferenceImages(imgCfg);
    const effectiveMaxRefs = maxModelRefs > 0 ? maxModelRefs : 5;

    const resolvedRefs = await resolveActiveReferencePayloadList({
        sourcePref,
        refMode,
        pickedRefUid,
        pickedRefUids,
        customRefDataUrls,
        customRefDesc,
        matchText: `${refMatchContext}\n${cleanPrompt}`,
        maxRefs: effectiveMaxRefs,
        fusionBlendRefs,
        signal,
        timeoutMs,
    });
    const imageRefs = maxModelRefs > 0
        ? resolvedRefs.filter((r) => Boolean(r.base64 && r.dataUrl)).slice(0, maxModelRefs)
        : [];
    const refDescriptionsBlock = imgCfg.sendRefDescriptions !== false
        ? resolvedRefs
            .filter((r) => Boolean(r.description))
            .map((r, idx) => `- Reference ${idx + 1}${(!safeFandomArtPrompt && r.label) ? ` (${r.label})` : ''}: ${r.description}`)
            .join('\n')
        : '';

    const apiType = imgCfg.apiType;
    const aspect = sanitizeAspectForProvider(rawAspect, apiType);
    const isPollinations = apiType === 'pollinations' || /pollinations\.ai/i.test(String(imgCfg.endpoint || ''));
    const model = resolveBucketModel(imgCfg);
    const rawEndpointFlag = Boolean(imgCfg.rawEndpoint);
    const endpoint = imgCfg.endpoint;
    const negativePrompt = getEffectiveNegativePromptForConfig(imgCfg, negativePromptId, customNegativePrompt);
    const providerLabel = [apiType || picked.key, model ? String(model).split('/').pop() : ''].filter(Boolean).join(' · ');

    // Preserve 100% of user/card prompt words intact — art style comes cleanly from SillyImages or explicit user input!
    const mediumNeutralScenePrompt = cleanPrompt;

    let styleText = '';
    if (styleId !== '__none__') {
        const stylesArr = Array.isArray(imgCfg.styles) ? imgCfg.styles : [];
        const chosenStyle = (styleId && stylesArr.find((s) => s && s.id === styleId))
            || stylesArr.find((s) => s && s.id === imgCfg.activeStyleId);
        styleText = String(chosenStyle?.value ?? chosenStyle?.prompt ?? chosenStyle?.style ?? chosenStyle?.promptPrefix ?? '').trim();
        if (!styleText && !styleId && imgCfg.slayStyle) {
            styleText = String(imgCfg.slayStyle).trim();
        }
    }

    let baseStyledPrompt = mediumNeutralScenePrompt;
    if (styleText) {
        if (styleWrapMode === 'sillyimages_tag') {
            baseStyledPrompt = `[STYLE: ${styleText}]\n\n${mediumNeutralScenePrompt}`;
        } else if (styleWrapMode === 'suffix') {
            baseStyledPrompt = `${mediumNeutralScenePrompt}\n\n${styleText}`;
        } else {
            // 'plain_prefix' (default): clean direct style direction at the very top without bracket noise
            baseStyledPrompt = `${styleText}\n\n${mediumNeutralScenePrompt}`;
        }
    }

    const promptWithRefOnly = refDescriptionsBlock
        ? `${baseStyledPrompt}\n\nCharacter reference descriptions:\n${refDescriptionsBlock}`
        : baseStyledPrompt;

    // For LLM/diffusion endpoints without a dedicated negative_prompt JSON field, append explicit exclusion block when set
    const promptWithRefText = negativePrompt
        ? `${promptWithRefOnly}\n\n[NEGATIVE / DO NOT INCLUDE: ${negativePrompt}]`
        : promptWithRefOnly;

    const effectiveRefInstruction = refInstructionOverride
        ? refInstructionOverride
        : (fusionBlendRefs
            ? FUSION_BLEND_REF_INSTRUCTION
            : (imgCfg.refInstructionEnabled === false ? '' : (imgCfg.refInstruction || SILLYIMAGES_DEFAULT_REF_INSTRUCTION)));

    const buildConditionedPrompt = (hasSentRefImages) => {
        if (hasSentRefImages && effectiveRefInstruction) {
            return `${effectiveRefInstruction}\n\n${promptWithRefText}`;
        }
        return promptWithRefText;
    };

    const refModeHumanMap = {
        off: 'Выключены (без референсов)',
        auto_lorebook: 'Авто-подбор по имени/триггерам из лорбука SillyImages',
        pick_sillyimages: 'Ручной выбор записи из каталога SillyImages',
        custom_photo: 'Своё референс-фото текущей сессии',
        explicit: fusionBlendRefs ? 'Синтез Алтаря (портреты карт-доноров)' : 'Явно переданный референс',
    };
    const inheritedProfileAspect = resolveInheritedProfileAspectInfo(imgCfg);
    const effectiveDisplayAspect = aspect === 'native'
        ? `${inheritedProfileAspect.summaryRu} (SillyImages)`
        : aspect;
    const artContextSnapshot = {
        sourceExtension: picked.key,
        profileName: imgCfg.profileName || 'Активный профиль',
        apiType: apiType || 'unknown',
        model: model || '(по умолчанию)',
        aspectRatio: effectiveDisplayAspect,
        styleName: styleId === '__none__'
            ? 'Без стиля (отключено)'
            : (styleText ? `Применён (${styleWrapMode})` : 'Пустой / не задан в профиле'),
        styleText: styleText || '',
        rawScenePrompt: cleanPrompt,
        negativePrompt: negativePrompt || '',
        refInstruction: (imageRefs.length > 0 && effectiveRefInstruction) ? effectiveRefInstruction : '',
        finalCombinedPrompt: buildConditionedPrompt(imageRefs.length > 0),
        refDetector: {
            modeId: fusionBlendRefs ? 'explicit' : (refMode || 'off'),
            modeLabel: fusionBlendRefs
                ? 'Синтез Алтаря (портреты карт-доноров)'
                : (refModeHumanMap[refMode] || String(refMode || 'off')),
            matchQuery: refMode === 'auto_lorebook' ? String(refMatchContext || '').trim().slice(0, 180) : '',
            maxModelRefs,
            totalMatched: resolvedRefs.length,
            imagesAttached: imageRefs.length,
            items: resolvedRefs.map((r, i) => ({
                index: i + 1,
                label: r.label || `Референс #${i + 1}`,
                sourceTag: r.sourceTag || '',
                previewUrl: r.previewUrl && !r.previewUrl.startsWith('data:') ? r.previewUrl : (r.dataUrl || ''),
                hasImage: Boolean(r.base64 && r.dataUrl) && maxModelRefs > 0,
                mimeType: r.mimeType || '',
                approxKb: r.base64 ? Math.round((r.base64.length * 0.75) / 1024) : 0,
                description: r.description || '',
            })),
        },
    };
    lastRequestDiagnostics.art = {
        kind: 'art',
        startedAt: Date.now(),
        finishedAt: 0,
        status: 'Подготовка запроса Арта...',
        ok: null,
        httpStatus: 0,
        method: isPollinations ? 'GET' : 'POST',
        url: sanitizeUrlForLog(endpoint || apiType || ''),
        headers: {},
        requestBody: '',
        responsePreview: 'Подготовка к отправке...',
        artContext: artContextSnapshot,
    };

    const executeSingleAttempt = async (attemptNum) => {
        const stagePrefix = attemptNum === 1
            ? `Генерация [Попытка 1/${maxAttempts}]`
            : `Повтор генерации [Попытка ${attemptNum}/${maxAttempts}]`;

        emit(stagePrefix, `Отправка запроса в ${providerLabel || 'API'} (${effectiveDisplayAspect})...`, attemptNum, providerLabel);

        // 0. POLLINATIONS
        if (isPollinations) {
            let dims = getTargetCanvasDimensions(aspect === 'native' ? (inheritedProfileAspect.aspectRatio || '1:1') : aspect);
            if (aspect === 'native' && inheritedProfileAspect.size) {
                const szMatch = String(inheritedProfileAspect.size).match(/^(\d+)x(\d+)$/);
                if (szMatch) {
                    dims = { width: Number(szMatch[1]), height: Number(szMatch[2]) };
                }
            }
            const pModel = model || 'flux';
            const seed = Math.floor(Math.random() * 1000000);
            const pUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptWithRefText)}?width=${dims.width}&height=${dims.height}&model=${encodeURIComponent(pModel)}&seed=${seed}&nologo=true`;
            emit(stagePrefix, `Ожидание рендера Pollinations (${pModel})...`, attemptNum, providerLabel);
            return await urlToDataUrl(pUrl, signal, timeoutMs);
        }

        // 1. NOVELAI DIRECT API (1:1 parity with SillyImages NovelAIProvider + Anlas guard)
        if (apiType === 'novelai') {
            const url = rawEndpointFlag || endpoint.endsWith('/ai/generate-image')
                ? endpoint
                : `${endpoint}/ai/generate-image`;
            if (imgCfg.novelaiNeverSpendAnlas !== false) {
                await verifyNovelAiFreeAllowance(url, imgCfg.apiKey, model, timeoutMs, signal);
            }
            const naiBase = styleText ? `${styleText}, ${cleanPrompt}` : cleanPrompt;
            const naiPrompt = refDescriptionsBlock ? `${naiBase}, ${resolvedRefs.map((r) => r.description).filter(Boolean).join(', ')}` : naiBase;
            const body = buildNovelAiPayload(imgCfg, naiPrompt, negativePrompt, aspect);
            const resp = await fetchWithTimeout(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${imgCfg.apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(body),
            }, timeoutMs, signal);

            if (!resp.ok) {
                throw new Error(formatHttpProviderError('NovelAI', resp.status, await resp.text().catch(() => '')));
            }
            const j = await resp.json();
            const imageB64 = j?.images?.[0]?.image;
            if (typeof imageB64 !== 'string' || !imageB64.trim()) {
                throw new Error('NovelAI не вернул изображение в ответе.');
            }
            return `data:image/png;base64,${imageB64.trim()}`;
        }

        // 2. NAISTERA (supports dedicated negative_prompt & reference_objects in SillyImages v3.0+)
        if (apiType === 'naistera') {
            const base = endpoint || SILLYIMAGES_DEFAULT_ENDPOINTS.naistera;
            const url = rawEndpointFlag ? base : (base.endsWith('/api/generate') ? base : `${base}/api/generate`);
            const isNaiSubModel = /^novelai(?:-|$)/i.test(String(model || ''));
            const canUseNaisteraRefs = !isNaiSubModel && imageRefs.length > 0;
            const naisteraPosPrompt = (canUseNaisteraRefs && effectiveRefInstruction)
                ? `${effectiveRefInstruction}\n\n${promptWithRefOnly}`
                : promptWithRefOnly;
            const body = {
                prompt: naisteraPosPrompt,
                model: model || undefined,
                steps: Math.round(Number(imgCfg.naisteraSteps) || 23),
                scale: Number(imgCfg.naisteraCfgScale) || 7,
            };
            const rawNaisteraAr = String(imgCfg.naisteraAspectRatio || '1:1').trim();
            body.aspect_ratio = aspect !== 'native'
                ? aspect
                : (NAI_SUPPORTED_ASPECT_IDS.includes(rawNaisteraAr) ? rawNaisteraAr : '1:1');
            if (negativePrompt) body.negative_prompt = negativePrompt;
            if (canUseNaisteraRefs) {
                body.reference_objects = imageRefs.map((r) => ({
                    image: r.dataUrl,
                    description: r.description || '',
                }));
            }

            const resp = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${imgCfg.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }, timeoutMs, signal);
            if (!resp.ok) {
                throw new Error(formatHttpProviderError('Naistera', resp.status, await resp.text().catch(() => '')));
            }
            const j = await resp.json();
            if (j?.data_url) {
                emit('Чтение потока арта', 'Получен готовый кадр от Naistera...', attemptNum, providerLabel);
                return String(j.data_url);
            }
            if (j?.job_id) {
                const jobBase = base.replace(/\/api\/generate\/?$/i, '').replace(/\/$/, '');
                const pollInterval = Math.max(1000, Math.min(30000, Number(imgCfg.naisteraPollIntervalMs) || 3000));
                const maxPollDeadline = Date.now() + Math.min(timeoutMs, Number(imgCfg.naisteraPollTimeoutMs) || 120000);
                let poll = 0;
                while (Date.now() < maxPollDeadline) {
                    poll += 1;
                    await sleepAbortable(pollInterval, signal);
                    emit(stagePrefix, `Очередь Naistera · проверка готовности #${poll}...`, attemptNum, providerLabel);
                    const jr = await fetchWithTimeout(`${jobBase}/api/generate/jobs/${encodeURIComponent(j.job_id)}`, {
                        headers: { Authorization: `Bearer ${imgCfg.apiKey}`, Accept: 'application/json' },
                    }, Math.min(30000, timeoutMs), signal);
                    if (!jr.ok) throw new Error(formatHttpProviderError('Naistera job', jr.status));
                    const jd = await jr.json();
                    if (jd?.data_url) return String(jd.data_url);
                    if (String(jd?.status || '').toLowerCase() === 'failed' || jd?.error) {
                        throw new Error(`Naistera: ${jd.error || 'ошибка рендера'}`);
                    }
                }
                throw new Error('Naistera: превышено время ожидания готовности изображения в очереди.');
            }
            throw new Error('Naistera не вернула изображение.');
        }

        // 3. A1111 / FORGE
        if (apiType === 'a1111') {
            const base = endpoint || SILLYIMAGES_DEFAULT_ENDPOINTS.a1111;
            const url = rawEndpointFlag ? base : `${base}/sdapi/v1/txt2img`;
            const dims = getTargetCanvasDimensions(aspect);
            const headers = { 'Content-Type': 'application/json' };
            if (imgCfg.apiKey) {
                headers.Authorization = imgCfg.apiKey.includes(':')
                    ? `Basic ${btoa(imgCfg.apiKey)}`
                    : `Bearer ${imgCfg.apiKey}`;
            }
            const rawTagPrompt = resolvedRefs.some((r) => r.description)
                ? `${cleanPrompt}, ${resolvedRefs.map((r) => r.description).filter(Boolean).join(', ')}`
                : cleanPrompt;
            const a1111Body = {
                prompt: imgCfg.a1111PromptPrefix ? `${imgCfg.a1111PromptPrefix}, ${rawTagPrompt}` : rawTagPrompt,
                negative_prompt: negativePrompt,
                width: Number(imgCfg.a1111Width) > 0 && aspect === 'native' ? Number(imgCfg.a1111Width) : dims.width,
                height: Number(imgCfg.a1111Height) > 0 && aspect === 'native' ? Number(imgCfg.a1111Height) : dims.height,
                steps: Number(imgCfg.a1111Steps) || 20,
                cfg_scale: Number(imgCfg.a1111CfgScale) || 7,
                sampler_name: imgCfg.a1111Sampler || 'Euler a',
            };
            if (model) {
                a1111Body.override_settings = { sd_model_checkpoint: model };
            }
            const resp = await fetchWithTimeout(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(a1111Body),
            }, timeoutMs, signal);
            if (!resp.ok) {
                throw new Error(formatHttpProviderError('A1111', resp.status, await resp.text().catch(() => '')));
            }
            emit('Чтение потока арта', 'Чтение ответа локального SD / Forge...', attemptNum, providerLabel);
            const j = await resp.json();
            if (!j?.images?.[0]) throw new Error('A1111 не вернул изображение.');
            return `data:image/png;base64,${j.images[0]}`;
        }

        // 4. OPENROUTER (1:1 parity with SillyImages v3.0: all 10/14 ratios, profile inheritance, modalities, 512/1K/2K/4K)
        if (apiType === 'openrouter') {
            const base = (endpoint || SILLYIMAGES_DEFAULT_ENDPOINTS.openrouter).replace(/\/+$/, '');
            const url = rawEndpointFlag ? base : (base.endsWith('/chat/completions') ? base : `${base}/chat/completions`);
            const orCaps = getSillyImagesOpenRouterCaps(model);
            const profOrAspect = String(imgCfg.aspectRatio || '1:1').trim();
            let effectiveOrAspect = aspect !== 'native' ? aspect : profOrAspect;
            if (!orCaps.aspectRatios.includes(effectiveOrAspect)) {
                effectiveOrAspect = orCaps.aspectRatios.includes(profOrAspect) ? profOrAspect : '1:1';
            }
            let effectiveOrSize = '';
            if (Array.isArray(orCaps.imageSizes) && imgCfg.imageSize) {
                const candSz = String(imgCfg.imageSize).trim().toUpperCase();
                effectiveOrSize = orCaps.imageSizes.includes(candSz)
                    ? candSz
                    : (orCaps.imageSizes.includes('1K') ? '1K' : '');
            }

            const headers = {
                Authorization: `Bearer ${imgCfg.apiKey}`,
                'Content-Type': 'application/json',
            };
            try {
                if (new URL(url).hostname.endsWith('openrouter.ai') && globalThis.window?.location?.origin) {
                    headers['HTTP-Referer'] = globalThis.window.location.origin;
                    headers['X-Title'] = 'SillyTavern NexusMatch Forge';
                }
            } catch {}

            let messageContent = buildConditionedPrompt(imageRefs.length > 0);
            if (imageRefs.length > 0) {
                const contentParts = [];
                imageRefs.slice(0, Math.max(1, maxModelRefs)).forEach((ref, idx) => {
                    if (ref.description) {
                        contentParts.push({ type: 'text', text: `Reference ${idx + 1}: ${ref.description}` });
                    }
                    contentParts.push({ type: 'image_url', image_url: { url: ref.dataUrl } });
                });
                contentParts.push({ type: 'text', text: buildConditionedPrompt(true) });
                messageContent = contentParts;
            }

            const sendOpenRouter = async (withAspect) => {
                const payload = {
                    model,
                    messages: [{ role: 'user', content: messageContent }],
                    modalities: orCaps.isGeminiOpenRouter ? ['image', 'text'] : ['image'],
                    enable_base64_output: true,
                };
                if (withAspect) {
                    const imageConfig = { aspect_ratio: effectiveOrAspect };
                    if (effectiveOrSize) {
                        imageConfig.image_size = effectiveOrSize;
                    }
                    payload.image_config = imageConfig;
                }
                return await fetchWithTimeout(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                }, timeoutMs, signal);
            };

            let resp = await sendOpenRouter(true);
            if (!resp.ok && [400, 404, 422].includes(resp.status)) {
                emit(stagePrefix, 'Модель не принимает image_config · повтор в родном формате модели...', attemptNum, providerLabel);
                resp = await sendOpenRouter(false);
            }
            if (!resp.ok) {
                throw new Error(formatHttpProviderError('OpenRouter', resp.status, await resp.text().catch(() => '')));
            }
            emit('Чтение потока арта', 'Извлечение изображения из ответа OpenRouter...', attemptNum, providerLabel);
            const j = await resp.json();
            const msg = j?.choices?.[0]?.message;
            const imgObj = msg?.images?.[0];
            let imgUrl = imgObj?.image_url?.url
                || imgObj?.data_url
                || (imgObj?.b64_json ? `data:${imgObj?.media_type || 'image/png'};base64,${imgObj.b64_json}` : '')
                || imgObj?.url
                || '';

            if (!imgUrl && Array.isArray(msg?.content)) {
                const part = msg.content.find((p) => p?.image_url?.url || p?.url);
                imgUrl = part?.image_url?.url || part?.url || '';
            }
            if (!imgUrl && typeof msg?.content === 'string') {
                const dataMatch = msg.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
                const httpMatch = msg.content.match(/https?:\/\/[^\s)"']+/);
                imgUrl = dataMatch?.[0] || httpMatch?.[0] || '';
            }

            if (imgUrl) {
                return imgUrl.startsWith('data:') ? imgUrl : await urlToDataUrl(imgUrl, signal, timeoutMs);
            }
            throw new Error('OpenRouter не вернул изображение в ответе.');
        }

        // 5. GEMINI / NANO-BANANA (1:1 parity with SillyImages v3.0 GeminiProvider + inlineData references)
        const isGemini = apiType === 'gemini' || (apiType === 'openai' && /google-ai/i.test(endpoint));
        if (isGemini) {
            const pathModel = String(model).includes('/') ? String(model).slice(String(model).indexOf('/') + 1) : String(model);
            const baseClean = endpoint.replace(/\/v1beta$/i, '');
            const url = rawEndpointFlag
                ? endpoint
                : `${baseClean}/v1beta/models/${encodeURIComponent(pathModel)}:generateContent`;

            const gemCaps = getSillyImagesGeminiCaps(pathModel);
            const maxGeminiRefs = gemCaps.maxReferences;
            const profGemAspect = String(imgCfg.aspectRatio || '1:1').trim();
            let effectiveGemAspect = aspect !== 'native' ? aspect : profGemAspect;
            if (!gemCaps.aspectRatios.includes(effectiveGemAspect)) {
                effectiveGemAspect = gemCaps.aspectRatios.includes(profGemAspect) ? profGemAspect : '1:1';
            }
            let effectiveGemSize = '';
            if (Array.isArray(gemCaps.imageSizes) && imgCfg.imageSize) {
                const candSz = String(imgCfg.imageSize).trim().toUpperCase();
                effectiveGemSize = gemCaps.imageSizes.includes(candSz) ? candSz : '';
            }

            const headers = {
                Authorization: `Bearer ${imgCfg.apiKey}`,
                'Content-Type': 'application/json',
            };
            if (/googleapis\.com/i.test(url)) headers['x-goog-api-key'] = imgCfg.apiKey;

            const geminiParts = [];
            const usedGeminiRefs = imageRefs.slice(0, maxGeminiRefs);
            usedGeminiRefs.forEach((ref, idx) => {
                if (ref.description) {
                    geminiParts.push({ text: `IMAGE_${idx + 1}: ${ref.description}` });
                }
                geminiParts.push({
                    inlineData: {
                        mimeType: ref.mimeType || 'image/png',
                        data: ref.base64,
                    },
                });
            });
            geminiParts.push({ text: buildConditionedPrompt(usedGeminiRefs.length > 0) });

            const sendGemini = async (withImageCfg) => {
                const genCfg = { responseModalities: ['TEXT', 'IMAGE'] };
                if (withImageCfg) {
                    const imgCfgBlock = { aspectRatio: effectiveGemAspect };
                    if (effectiveGemSize) {
                        imgCfgBlock.imageSize = effectiveGemSize;
                    }
                    genCfg.imageConfig = imgCfgBlock;
                }
                return await fetchWithTimeout(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: geminiParts }],
                        generationConfig: genCfg,
                    }),
                }, timeoutMs, signal);
            };

            let resp = await sendGemini(true);
            if (!resp.ok && [400, 404, 422].includes(resp.status)) {
                emit(stagePrefix, 'Модель не принимает imageConfig · повтор в родном формате модели...', attemptNum, providerLabel);
                resp = await sendGemini(false);
            }
            if (!resp.ok) {
                throw new Error(formatHttpProviderError('Gemini', resp.status, await resp.text().catch(() => '')));
            }

            emit('Чтение потока арта', 'Извлечение кадра из ответа Gemini...', attemptNum, providerLabel);
            const j = await resp.json();
            const parts = j?.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
            const inlineObj = imgPart?.inlineData || imgPart?.inline_data;
            if (inlineObj?.data) {
                const mime = inlineObj.mimeType || inlineObj.mime_type || 'image/png';
                return `data:${mime};base64,${inlineObj.data}`;
            }

            const textPart = parts.map((p) => p.text || '').join('\n');
            const mdDataMatch = textPart.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
            if (mdDataMatch) return mdDataMatch[0];

            const blockReason = j?.promptFeedback?.blockReason || j?.candidates?.[0]?.finishReason || '';
            throw new Error(
                `Gemini не вернул изображение` +
                (blockReason ? ` (${blockReason})` : '') +
                (textPart ? `: ${textPart.slice(0, 90)}` : '')
            );
        }

        // 6. OPENAI-COMPATIBLE / XAI / ELECTRON HUB (1:1 parity with SillyImages v3.0 /generations & /edits)
        const defaultBase = SILLYIMAGES_DEFAULT_ENDPOINTS[apiType] || 'https://api.openai.com';
        const oaBase = (endpoint || defaultBase)
            .replace(/\/compatible$/i, '')
            .replace(/\/v1\/images\/(?:generations|edits)$/i, '')
            .replace(/\/images\/(?:generations|edits)$/i, '')
            .replace(/\/v1$/i, '');

        const mLow = String(model || '').toLowerCase();
        const oaKind = classifySillyImagesOpenAIModel(model);
        const isGptImg = isSillyImagesGptImageFamily(oaKind);
        const isFluxKontext = oaKind === 'flux-kontext';
        const isDalle3 = oaKind === 'dall-e-3';
        const isDalle2 = oaKind === 'dall-e-2';

        const mappedOaSize = mapAspectAndSizeForOpenAIModel(aspect, imgCfg.size, oaKind);
        const resolvedSize = mappedOaSize.size || '';

        let resolvedQuality = String(imgCfg.quality || '').toLowerCase().trim();
        if (isGptImg) {
            if (resolvedQuality === 'hd') resolvedQuality = 'high';
            else if (resolvedQuality === 'standard') resolvedQuality = 'medium';
            else if (!['low', 'medium', 'high', 'auto'].includes(resolvedQuality)) resolvedQuality = 'auto';
        } else if (isDalle3) {
            if (!['standard', 'hd'].includes(resolvedQuality)) resolvedQuality = 'standard';
        } else if (isDalle2) {
            resolvedQuality = 'standard';
        }

        // 6A. xAI Imagine with v3.0 resolution/quality & reference edits
        if (apiType === 'xai') {
            const canXaiRefs = mLow.includes('grok-imagine-image') && imageRefs.length > 0;
            const xaiPath = canXaiRefs ? '/v1/images/edits' : '/v1/images/generations';
            const xaiUrl = rawEndpointFlag ? (endpoint || defaultBase) : `${oaBase}${xaiPath}`;
            const validXaiSet = new Set(['auto', ...XAI_SUPPORTED_ASPECT_IDS]);
            const rawXaiAr = aspect !== 'native' ? aspect : String(imgCfg.xaiAspectRatio || '1:1').trim();
            const resolvedXaiAr = validXaiSet.has(rawXaiAr) ? rawXaiAr : '1:1';
            const xaiBody = {
                model,
                prompt: buildConditionedPrompt(canXaiRefs),
                n: 1,
                response_format: 'b64_json',
                aspect_ratio: resolvedXaiAr,
                resolution: String(imgCfg.xaiResolution || '1k').toLowerCase() === '2k' ? '2k' : '1k',
            };
            if (mLow.includes('grok-imagine-image-2.0')) {
                xaiBody.quality = String(imgCfg.xaiQuality || 'medium').toLowerCase() === 'low' ? 'low' : 'medium';
            }
            if (canXaiRefs) {
                if (imageRefs.length === 1) {
                    xaiBody.image = { type: 'image_url', url: imageRefs[0].dataUrl };
                } else {
                    xaiBody.images = imageRefs.slice(0, 3).map((r) => ({ type: 'image_url', url: r.dataUrl }));
                }
            }
            const xResp = await fetchWithTimeout(xaiUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${imgCfg.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(xaiBody),
            }, timeoutMs, signal);
            if (!xResp.ok) {
                throw new Error(formatHttpProviderError('xAI', xResp.status, await xResp.text().catch(() => '')));
            }
            const xj = await xResp.json();
            const xd = xj?.data?.[0];
            if (xd?.b64_json) {
                const mime = String(xd.b64_json).startsWith('/9j/') ? 'image/jpeg' : 'image/png';
                return `data:${mime};base64,${xd.b64_json}`;
            }
            if (xd?.url || xj?.url) return await urlToDataUrl(xd?.url || xj?.url, signal, timeoutMs);
            throw new Error('xAI не вернул изображение.');
        }

        // 6B. OpenAI / ElectronHub multipart /v1/images/edits when references are provided and supported
        const canOpenAiEdits = (isGptImg || isFluxKontext) && imageRefs.length > 0 && typeof FormData !== 'undefined';
        if (canOpenAiEdits) {
            const editsUrl = rawEndpointFlag ? (endpoint || defaultBase) : `${oaBase}/v1/images/edits`;
            const form = new FormData();
            form.append('model', model);
            form.append('prompt', buildConditionedPrompt(true));
            form.append('n', '1');
            if (resolvedSize) form.append('size', resolvedSize);
            if (resolvedQuality) form.append('quality', resolvedQuality);
            if (isGptImg) form.append('moderation', 'low');

            if (isGptImg && apiType !== 'electronhub' && imageRefs.length > 1) {
                imageRefs.slice(0, 5).forEach((ref, idx) => {
                    form.append('image[]', base64ToBlobBinary(ref.base64, ref.mimeType || 'image/png'), `reference-${idx}.png`);
                });
            } else {
                form.append('image', base64ToBlobBinary(imageRefs[0].base64, imageRefs[0].mimeType || 'image/png'), 'reference-0.png');
            }

            const eResp = await fetchWithTimeout(editsUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${imgCfg.apiKey}` },
                body: form,
            }, timeoutMs, signal);
            if (!eResp.ok) {
                throw new Error(formatHttpProviderError(apiType === 'electronhub' ? 'Electron Hub /edits' : 'OpenAI /edits', eResp.status, await eResp.text().catch(() => '')));
            }
            const ej = await eResp.json();
            const ed = ej?.data?.[0];
            if (ed?.b64_json) {
                const mime = String(ed.b64_json).startsWith('/9j/') ? 'image/jpeg' : 'image/png';
                return `data:${mime};base64,${ed.b64_json}`;
            }
            if (ed?.url || ej?.url) return await urlToDataUrl(ed?.url || ej?.url, signal, timeoutMs);
            throw new Error('Image /edits API не вернул изображение.');
        }

        // 6C. Standard OpenAI / ElectronHub /v1/images/generations
        const oaUrl = rawEndpointFlag ? (endpoint || defaultBase) : `${oaBase}/v1/images/generations`;
        const sendOpenAiCompat = async (minimalFallback = false) => {
            const body = { model, prompt: promptWithRefText, n: 1 };
            if (!minimalFallback) {
                if (resolvedSize) body.size = resolvedSize;
                if (resolvedQuality) body.quality = resolvedQuality;
            }
            if (!isGptImg) {
                body.response_format = 'b64_json';
            } else {
                body.moderation = 'low';
            }

            return await fetchWithTimeout(oaUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${imgCfg.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }, timeoutMs, signal);
        };

        let resp = await sendOpenAiCompat(false);
        if (!resp.ok && [400, 404, 422].includes(resp.status)) {
            emit(stagePrefix, 'Модель не принимает заданный размер · повтор в родном формате модели...', attemptNum, providerLabel);
            resp = await sendOpenAiCompat(true);
        }
        if (!resp.ok) {
            throw new Error(formatHttpProviderError(apiType === 'electronhub' ? 'Electron Hub' : 'Image API', resp.status, await resp.text().catch(() => '')));
        }

        emit('Чтение потока арта', 'Распаковка сгенерированного кадра...', attemptNum, providerLabel);
        const j = await resp.json();
        const d = j?.data?.[0];
        if (d?.b64_json) {
            const mime = String(d.b64_json).startsWith('/9j/') ? 'image/jpeg' : 'image/png';
            return `data:${mime};base64,${d.b64_json}`;
        }
        if (d?.url || j?.url) return await urlToDataUrl(d?.url || j?.url, signal, timeoutMs);
        throw new Error('Image API не вернул изображение.');
    };

    let lastErr = null;
    const runLoop = async () => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (signal?.aborted) {
                const ae = new Error('Генерация остановлена пользователем.');
                ae.code = 'ABORTED';
                throw ae;
            }
            try {
                const outDataUrl = await executeSingleAttempt(attempt);
                if (signal?.aborted) {
                    const ae = new Error('Генерация остановлена пользователем.');
                    ae.code = 'ABORTED';
                    throw ae;
                }
                emit('Готово', 'Изображение успешно получено!', attempt, providerLabel);
                return outDataUrl;
            } catch (err) {
                if (signal?.aborted) {
                    const ae = new Error('Генерация остановлена пользователем.');
                    ae.code = 'ABORTED';
                    throw ae;
                }
                lastErr = err;
                if (attempt >= maxAttempts || isNonRetryableArtError(err)) {
                    throw err;
                }
                const fullErrMsg = String(err?.message || err || '');
                const shortErr = fullErrMsg.slice(0, 80);
                const retryMatch = fullErrMsg.match(/try again in\s+(\d+(?:\.\d+)?)\s*s/i)
                    || fullErrMsg.match(/"retry_after"\s*:\s*(\d+(?:\.\d+)?)/i);
                const is429 = /HTTP 429|rate.?limit|too many requests/i.test(fullErrMsg);
                const parsedWait = retryMatch ? Math.ceil(Number(retryMatch[1])) + 2 : 0;
                const siStepSec = Math.max(1, Math.ceil((siBaseDelayMs * Math.pow(2, attempt - 1)) / 1000));
                const waitSec = parsedWait > 0
                    ? Math.min(25, Math.max(siStepSec, parsedWait))
                    : (is429 ? Math.max(5, siStepSec) : siStepSec);
                for (let left = waitSec; left > 0; left--) {
                    emit(
                        `Ожидание повтора [${attempt + 1}/${maxAttempts}]`,
                        `Попытка ${attempt} не удалась (${shortErr}) · повтор через ${left} сек...`,
                        attempt + 1,
                        providerLabel,
                    );
                    await sleepAbortable(1000, signal);
                }
            }
        }
        throw lastErr || new Error('Не удалось сгенерировать изображение.');
    };

    if (!signal) return await runLoop();

    return await new Promise((resolve, reject) => {
        const onAbort = () => {
            const ae = new Error('Генерация остановлена пользователем.');
            ae.code = 'ABORTED';
            reject(ae);
        };
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        runLoop().then(
            (val) => {
                signal.removeEventListener('abort', onAbort);
                resolve(val);
            },
            (err) => {
                signal.removeEventListener('abort', onAbort);
                reject(err);
            },
        );
    });
}

const CHAT_LEAK_MACRO_RE = /\{\{\s*(?:description|charPrompt|char_prompt|personality|scenario|mesExamples|mesExamplesRaw|worldInfoBefore|worldInfoAfter|wiBefore|wiAfter|charDepthPrompt|depth_prompt|charJailbreak|char_version|persona|personaDescription|summary|authorsNote|char_GlobalNote|iig-book|iig_book|char_appearance|user_appearance)\s*\}\}/gi;

/**
 * Strips all SillyTavern active character, persona, world-info/lorebook, example-dialogue, and chat-summary macros
 * from custom preset prompt blocks BEFORE SillyTavern runs substituteParams(), preventing active chat cards/worlds
 * from leaking into NexusMatch Forge generations across any user preset.
 * IMPORTANT: Blocks that do NOT contain active-chat leak macros are returned 100% verbatim (preserving '\n' empty toggles & assistant prefills!).
 */
export function stripActiveChatMacrosFromPresetBlock(rawBlockText) {
    const src = String(rawBlockText ?? '');
    if (!src) return '';

    CHAT_LEAK_MACRO_RE.lastIndex = 0;
    if (!CHAT_LEAK_MACRO_RE.test(src)) {
        // Zero active-chat macros inside this block — return 100% untouched (never trim '\n' or assistant prefills!)
        return src;
    }

    CHAT_LEAK_MACRO_RE.lastIndex = 0;
    let cleaned = src.replace(CHAT_LEAK_MACRO_RE, '');

    // Collapse XML/tag wrappers that became empty after removing the macro (e.g. <description>\n</description>)
    cleaned = cleaned.replace(/<([a-zA-Z0-9_:-]+)>\s*<\/\1>/g, '');
    cleaned = cleaned.replace(/\[(?:Character|Scenario|World\s*Info|Lorebook|Persona|Examples|SCENARIO)[^\]]*:\s*\]/gi, '');
    cleaned = cleaned.replace(/^(?:SCENARIO|DESCRIPTION|PERSONALITY|PERSONA|CHARACTER)\s*:\s*$/gim, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    return cleaned;
}

// Chat Completion preset message builder — 1:1 faithful to SillyTavern PromptManager:
// Preserves ALL assistant blocks, Sugar Rush / enhanceDefinitions prefills, @ Depth injections, and '\n' empty toggles!
export function buildPresetAlignedMessages(
    ctx,
    userTaskContent,
    systemPrompt = '',
    presetCorrectionPrompt = '',
    { stripActiveCharFromPreset = true, outTrace = null } = {},
) {
    const oai = ctx?.chatCompletionSettings || {};
    const prompts = Array.isArray(oai.prompts) ? oai.prompts : [];
    const byId = new Map(prompts.map((p) => [p?.identifier, p]));
    const orderEntry = Array.isArray(oai.prompt_order)
        ? (oai.prompt_order.find((o) => o?.character_id === 100001)
            || oai.prompt_order.find((o) => o?.character_id === 100000)
            || oai.prompt_order[0])
        : null;
    const orderList = Array.isArray(orderEntry?.order) ? orderEntry.order.filter((x) => x?.enabled) : [];

    const chatIdx = orderList.findIndex((x) => x.identifier === 'chatHistory');
    const messages = [];

    // ONLY true character/world/chat markers — NEVER include 'enhanceDefinitions', 'nsfw', 'jailbreak', or 'main'!
    const TRUE_MARKER_SLOTS = new Set([
        'worldInfoBefore', 'worldInfoAfter', 'charDescription', 'charPersonality',
        'scenario', 'personaDescription', 'dialogueExamples', 'chatHistory',
    ]);

    const pushTrace = (zone, role, label, contentStr) => {
        if (!Array.isArray(outTrace)) return;
        const isWhitespaceToggle = contentStr.length > 0 && contentStr.trim().length === 0;
        outTrace.push({
            zone,
            role,
            label,
            chars: contentStr.length,
            isWhitespaceToggle,
            preview: isWhitespaceToggle
                ? `[Пустой/пробельный тогл: ${JSON.stringify(contentStr)}]`
                : contentStr.replace(/\s+/g, ' ').trim().slice(0, 90),
        });
    };

    const resolveBlockMessage = (id, defaultRole = 'system') => {
        if (id === 'chatHistory') return null;
        if (stripActiveCharFromPreset && TRUE_MARKER_SLOTS.has(id)) return null;
        const p = byId.get(id);
        if (!p || p.marker === true) return null;
        if (typeof p.content !== 'string' || p.content.length === 0) return null;

        CHAT_LEAK_MACRO_RE.lastIndex = 0;
        const hadLeakMacro = stripActiveCharFromPreset && CHAT_LEAK_MACRO_RE.test(p.content);
        const finalContent = stripActiveCharFromPreset
            ? stripActiveChatMacrosFromPresetBlock(p.content)
            : p.content;

        // Only skip if the block originally held an active-chat macro ({{description}}, {{persona}}, etc.) and became empty after stripping it!
        // Intentional '\n' / ' ' empty toggles and ALL assistant/user/system blocks without chat-leak macros are preserved 100% verbatim!
        if (hadLeakMacro && finalContent.trim().length === 0) {
            return null;
        }
        if (finalContent.length === 0) return null;

        return {
            role: p.role || defaultRole,
            content: finalContent,
            name: p.name && p.role && p.name.startsWith('example_') ? p.name : undefined,
            identifier: id,
            _label: p.name || id,
            _injPos: Number(p.injection_position) === 1 ? 1 : 0,
            _injDepth: Number(p.injection_position) === 1 && Number.isFinite(Number(p.injection_depth)) ? Number(p.injection_depth) : 4,
            _injOrder: Number.isFinite(Number(p.injection_order)) ? Number(p.injection_order) : 100,
        };
    };

    const correctionClean = String(presetCorrectionPrompt || '').trim();
    const finalUserTask = correctionClean
        ? `${userTaskContent}\n\n${correctionClean}`
        : userTaskContent;

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt, _id: 'nmfSystem' });
        pushTrace('NMF_SYS', 'system', 'NexusMatch System Prompt', systemPrompt);
    }

    // Separate absolute In-Chat (@ Depth) injections so Depth 0 lands AFTER chatHistory and Depth >= 1 lands BEFORE chatHistory
    const depthBeforeTask = [];
    const depthZeroAfterTask = [];
    for (const item of orderList) {
        const p = byId.get(item.identifier);
        if (p && Number(p.injection_position) === 1) {
            const built = resolveBlockMessage(item.identifier, p.role || 'system');
            if (!built) continue;
            if (built._injDepth <= 0) depthZeroAfterTask.push(built);
            else depthBeforeTask.push(built);
        }
    }
    depthBeforeTask.sort((a, b) => (b._injDepth - a._injDepth) || (a._injOrder - b._injOrder));
    depthZeroAfterTask.sort((a, b) => a._injOrder - b._injOrder);

    const pushResolved = (zone, built) => {
        const msgObj = { role: built.role, content: built.content, _id: built.identifier };
        if (built.name) msgObj.name = built.name;
        messages.push(msgObj);
        pushTrace(zone, built.role, built._label, built.content);
    };

    if (chatIdx === -1) {
        for (const item of orderList) {
            if (item.identifier === 'chatHistory') continue;
            const p = byId.get(item.identifier);
            if (p && Number(p.injection_position) === 1) continue;
            const built = resolveBlockMessage(item.identifier, 'system');
            if (built) pushResolved('BEFORE_CHAT', built);
        }
        for (const b of depthBeforeTask) pushResolved('DEPTH_BEFORE', b);
        messages.push({ role: 'user', content: finalUserTask, _nmfTask: true });
        pushTrace('CHAT_TASK', 'user', 'Задание NexusMatch Forge (вместо Chat History)', finalUserTask);
        for (const b of depthZeroAfterTask) pushResolved('DEPTH_0_AFTER', b);
    } else {
        for (let i = 0; i < chatIdx; i++) {
            const id = orderList[i].identifier;
            const p = byId.get(id);
            if (p && Number(p.injection_position) === 1) continue;
            const built = resolveBlockMessage(id, 'system');
            if (built) pushResolved('BEFORE_CHAT', built);
        }
        for (const b of depthBeforeTask) pushResolved('DEPTH_BEFORE', b);

        messages.push({ role: 'user', content: finalUserTask, _nmfTask: true });
        pushTrace('CHAT_TASK', 'user', 'Задание NexusMatch Forge (на месте Chat History)', finalUserTask);

        for (const b of depthZeroAfterTask) pushResolved('DEPTH_0_AFTER', b);

        for (let i = chatIdx + 1; i < orderList.length; i++) {
            const id = orderList[i].identifier;
            const p = byId.get(id);
            if (p && Number(p.injection_position) === 1) continue;
            const built = resolveBlockMessage(id, 'system');
            if (built) pushResolved('AFTER_CHAT', built);
        }
    }

    // Append explicit oai.assistant_prefill if set in settings and not already covered by a post-chat assistant block
    if (oai.assistant_prefill && String(oai.assistant_prefill).length > 0) {
        const prefillStr = stripActiveCharFromPreset
            ? stripActiveChatMacrosFromPresetBlock(oai.assistant_prefill)
            : String(oai.assistant_prefill);
        if (prefillStr.length > 0) {
            const alreadyHasSameAssistant = messages.some((m) => m.role === 'assistant' && m.content === prefillStr);
            if (!alreadyHasSameAssistant) {
                messages.push({ role: 'assistant', content: prefillStr });
                pushTrace('PREFILL_SETTING', 'assistant', 'oai_settings.assistant_prefill', prefillStr);
            }
        }
    }

    // Honor SillyTavern's native `squash_system_messages` ("Squash system messages") setting 1:1 for ANY preset:
    // combines consecutive nameless `system` messages (excluding `newMainChat`, `newChat`, `groupNudge`) with `\n`.
    if (oai.squash_system_messages) {
        const excludeSquashIds = new Set(['newMainChat', 'newChat', 'groupNudge']);
        const squashed = [];
        let lastMsg = null;
        const canSquash = (m) => m && m.role === 'system' && !m.name && !excludeSquashIds.has(m._id);
        for (const m of messages) {
            if (m.role === 'system' && !m.content) continue;
            if (canSquash(m) && lastMsg && canSquash(lastMsg)) {
                lastMsg.content += '\n' + m.content;
            } else {
                const copy = { ...m };
                squashed.push(copy);
                lastMsg = copy;
            }
        }
        pushTrace('SQUASH_SYS', 'system', `Squashed system messages (${messages.length} -> ${squashed.length})`, '');
        return squashed.map(({ _id, ...rest }) => rest);
    }

    return messages.map(({ _id, ...rest }) => rest);
}

// Reasoning & text extraction using public getContext() APIs without importing internal /scripts/reasoning.js (fixes NMF-015)
function extractUniversalReasoningAndText(ctx, data, rawFallbackText = '') {
    let text = rawFallbackText;
    let reasoning = '';
    const isChatComp = (ctx?.mainApi || 'openai') === 'openai';
    const allowModelThoughts = !isChatComp || Boolean(ctx?.chatCompletionSettings?.show_thoughts);
    const allowAutoParseReasoning = ctx?.powerUserSettings?.reasoning?.auto_parse !== false;

    try {
        if (typeof data === 'string') {
            text = data;
        } else if (data && typeof data === 'object') {
            if (typeof data?.content === 'string' && data.content.length > 0) {
                text = data.content;
            } else {
                const extractedViaCtx = typeof ctx?.extractMessageFromData === 'function'
                    ? String(ctx.extractMessageFromData(data, isChatComp ? 'openai' : null) || '')
                    : '';
                if (extractedViaCtx) {
                    text = extractedViaCtx;
                } else if (Array.isArray(data?.content)) {
                    text = data.content.filter((p) => p && p.type === 'text' && p.text).map((p) => p.text).join('\n\n');
                } else if (typeof data?.choices?.[0]?.message?.content === 'string') {
                    text = data.choices[0].message.content;
                } else if (Array.isArray(data?.responseContent?.parts)) {
                    text = data.responseContent.parts.filter((pt) => pt && !pt.thought && pt.text).map((pt) => pt.text).join('');
                } else if (Array.isArray(data?.candidates?.[0]?.content?.parts)) {
                    text = data.candidates[0].content.parts.filter((pt) => pt && !pt.thought && pt.text).map((pt) => pt.text).join('');
                } else if (typeof data?.content === 'string') {
                    text = data.content;
                } else if (data?.content && typeof data.content === 'object') {
                    text = JSON.stringify(data.content);
                } else {
                    // If generateRawData / processRequest({ json_schema }) returned an extracted JSON object directly
                    text = JSON.stringify(data);
                }
            }

            if (allowModelThoughts) {
                const gParts = data?.responseContent?.parts || data?.candidates?.[0]?.content?.parts || [];
                const thoughtParts = gParts.filter((pt) => pt && pt.thought && pt.text).map((pt) => pt.text);
                const claudeThoughts = Array.isArray(data?.content)
                    ? data.content.filter((p) => p && p.type === 'thinking' && p.thinking).map((p) => p.thinking)
                    : [];
                if (thoughtParts.length) reasoning = thoughtParts.join('\n\n');
                else if (claudeThoughts.length) reasoning = claudeThoughts.join('\n\n');

                if (!reasoning) {
                    reasoning = String(
                        data?.reasoning
                        || data?.choices?.[0]?.message?.reasoning_content
                        || data?.choices?.[0]?.message?.reasoning
                        || data?.thinking
                        || ''
                    );
                }
            }
        }

        if (allowAutoParseReasoning && typeof ctx?.parseReasoningFromString === 'function' && text) {
            const parsed = ctx.parseReasoningFromString(text, { strict: false });
            if (parsed?.reasoning) {
                if (allowModelThoughts && !reasoning.includes(parsed.reasoning)) {
                    reasoning = [reasoning, parsed.reasoning].filter(Boolean).join('\n\n');
                }
                if (typeof parsed.content === 'string') {
                    text = parsed.content;
                }
            }
        }
    } catch (e) {
        console.warn('[NexusMatch Forge] Reasoning extraction warning:', e);
    }

    const inlineThinkRe = /<(?:think|thought|thinking|thoughts|reasoning|cot|thought_process|inner_monologue|inner_thoughts|analysis|rp_plan)\b[^>]*>([\s\S]*?)<\/(?:think|thought|thinking|thoughts|reasoning|cot|thought_process|inner_monologue|inner_thoughts|analysis|rp_plan)>/gi;
    const inlineMatches = [...String(text || '').matchAll(inlineThinkRe)];
    if (inlineMatches.length > 0) {
        const inlineTxt = inlineMatches.map((m) => m[1].trim()).filter(Boolean).join('\n\n');
        if (allowModelThoughts && inlineTxt && !reasoning.includes(inlineTxt)) {
            reasoning = [reasoning, inlineTxt].filter(Boolean).join('\n\n');
        }
        text = String(text || '').replace(inlineThinkRe, '').trim();
    }

    text = String(text || '').replace(/```(?:think|thought|thinking|reasoning|cot)\b[\s\S]*?```/gi, '').trim();

    // Strip unclosed/dangling opening think tags if prefill opened one
    text = String(text || '').replace(/^[\s\S]*?<\/(?:think|thought|thinking|thoughts|reasoning|cot|thought_process|inner_monologue|inner_thoughts|analysis|rp_plan)>\s*/i, '').trim();

    if (!allowModelThoughts) {
        reasoning = '';
    }

    return { text: String(text || ''), reasoning: String(reasoning || '').trim() };
}

export let lastGenerationReasoning = '';

// Isolated background LLM runner:
// - Never invokes global chat stop or emits global GENERATION_STOPPED (fixes NMF-005)
// - Never attaches global chat settings event mutators (fixes NMF-012)
// - Separates OpenAI Chat Completion vs Text Completion APIs (fixes NMF-011)
// - Passes native jsonSchema into generateRawData when in json_schema mode (fixes NMF-010)
function resolveActiveChatCompletionModelFromOai(oai = {}, ctx = null) {
    if (typeof ctx?.getChatCompletionModel === 'function') {
        try {
            const viaCtx = String(ctx.getChatCompletionModel(oai) || '').trim();
            if (viaCtx) return viaCtx;
        } catch {}
    }
    const src = String(oai.chat_completion_source || 'openai').trim().toLowerCase();
    const sourceModelKeyMap = {
        openai: 'openai_model',
        claude: 'claude_model',
        openrouter: 'openrouter_model',
        makersuite: 'google_model',
        vertexai: 'vertexai_model',
        ai21: 'ai21_model',
        mistralai: 'mistralai_model',
        custom: 'custom_model',
        cohere: 'cohere_model',
        perplexity: 'perplexity_model',
        groq: 'groq_model',
        electronhub: 'electronhub_model',
        chutes: 'chutes_model',
        nanogpt: 'nanogpt_model',
        deepseek: 'deepseek_model',
        aimlapi: 'aimlapi_model',
        xai: 'xai_model',
        pollinations: 'pollinations_model',
        moonshot: 'moonshot_model',
        fireworks: 'fireworks_model',
        cometapi: 'cometapi_model',
        azure_openai: 'azure_openai_model',
        zai: 'zai_model',
        siliconflow: 'siliconflow_model',
        workers_ai: 'workers_ai_model',
        minimax: 'minimax_model',
    };
    const key = sourceModelKeyMap[src] || `${src}_model`;
    return (key && oai[key]) ? String(oai[key]) : String(oai.openai_model || oai.google_model || '');
}

export async function runLlmGeneration({
    system = '',
    user = '',
    jsonSchema = null,
    transportMode = 'prefill_user_msg',
    presetCorrectionPrompt = '',
    stripActiveCharFromPreset = true,
    stream = undefined,
    visionImageUrls = [],
    visionOptional = false,
    signal = null,
}) {
    const ctx = getTavernContext();
    if (!ctx) throw new Error('Контекст SillyTavern ещё не готов.');

    const rawDataFn = ctx.generateRawData;
    const rawFn = ctx.generateRaw;
    const cleanVisionUrls = Array.isArray(visionImageUrls)
        ? visionImageUrls
            .map((u) => String(u || '').trim())
            .filter((u) => /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(u) || /^https?:\/\//i.test(u))
        : [];
    const hasVisionImages = cleanVisionUrls.length > 0;

    if (!hasVisionImages && typeof rawDataFn !== 'function' && typeof rawFn !== 'function') {
        throw new Error('API генерации SillyTavern недоступно. Проверьте подключение модели.');
    }

    if (signal?.aborted) {
        throw new Error('Генерация остановлена пользователем.');
    }

    const activeApi = ctx.mainApi || 'openai';
    const isChatCompletion = activeApi === 'openai';
    if (hasVisionImages && !isChatCompletion) {
        throw new Error('Генерация по фото (Vision) требует режим Chat Completion (Google AI Studio / Gemini, OpenAI, Claude, Grok, OpenRouter).');
    }
    const correctionClean = String(presetCorrectionPrompt || '').trim();

    let promptPayload;
    let sysPayload = '';
    let prefillPayload = '';
    let schemaPayload = null;
    const presetTrace = [];

    if (transportMode === 'prefill_user_msg') {
        if (isChatCompletion) {
            promptPayload = buildPresetAlignedMessages(ctx, user, system, presetCorrectionPrompt, {
                stripActiveCharFromPreset: stripActiveCharFromPreset !== false,
                outTrace: presetTrace,
            });
            sysPayload = '';
        } else {
            // Text Completion API (Kobold / TextGenWebUI / NovelAI): let Core apply active Text Completion Context & Instruct templates!
            const combinedUser = correctionClean ? `${user}\n\n${correctionClean}` : user;
            promptPayload = combinedUser;
            sysPayload = system;
            prefillPayload = String(ctx?.textCompletionSettings?.start_reply_with || '');
        }
    } else {
        promptPayload = user;
        sysPayload = system;
        schemaPayload = isChatCompletion && jsonSchema ? jsonSchema : null;
    }

    let visionMessagesPayload = null;
    if (hasVisionImages) {
        const subParams = typeof ctx?.substituteParams === 'function'
            ? (str) => String(ctx.substituteParams(String(str ?? '')) ?? '')
            : (str) => String(str ?? '');
        if (Array.isArray(promptPayload)) {
            let injectedOntoTask = false;
            visionMessagesPayload = promptPayload.map((m) => {
                const textClean = subParams(typeof m.content === 'string' ? m.content : '');
                const isTaskMsg = Boolean(m._nmfTask) || (!injectedOntoTask && m.role === 'user' && textClean.includes(user.slice(0, Math.min(36, user.length))));
                if (!injectedOntoTask && isTaskMsg) {
                    injectedOntoTask = true;
                    return {
                        role: 'user',
                        content: [
                            { type: 'text', text: textClean },
                            ...cleanVisionUrls.map((u) => ({ type: 'image_url', image_url: { url: u } })),
                        ],
                    };
                }
                const outMsg = { role: m.role, content: textClean };
                if (m.name) outMsg.name = m.name;
                return outMsg;
            });
            if (!injectedOntoTask) {
                visionMessagesPayload.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: subParams(user) },
                        ...cleanVisionUrls.map((u) => ({ type: 'image_url', image_url: { url: u } })),
                    ],
                });
            }
        } else {
            visionMessagesPayload = [];
            if (sysPayload) {
                visionMessagesPayload.push({ role: 'system', content: subParams(sysPayload) });
            }
            visionMessagesPayload.push({
                role: 'user',
                content: [
                    { type: 'text', text: subParams(String(promptPayload || user)) },
                    ...cleanVisionUrls.map((u) => ({ type: 'image_url', image_url: { url: u } })),
                ],
            });
        }
    }
    if (Array.isArray(promptPayload)) {
        promptPayload = promptPayload.map(({ _nmfTask, ...rest }) => rest);
    }

    const visionDiagSummary = hasVisionImages
        ? cleanVisionUrls.map((u, idx) => `[Image #${idx + 1}: ${u.slice(0, 32)}... (~${Math.round((u.length * 0.75) / 1024)} KB)]`)
        : undefined;

    const llmDiag = {
        kind: 'llm',
        startedAt: Date.now(),
        finishedAt: 0,
        status: hasVisionImages ? 'В процессе (анализ фото Vision ИИ)...' : 'В процессе (генерация текста ИИ)...',
        ok: null,
        api: activeApi,
        transportMode,
        presetTrace,
        extensionPrompts: {
            modeLabel: transportMode === 'json_schema'
                ? 'Строгая JSON-схема (прямой системный запрос)'
                : 'Через активный пресет SillyTavern',
            systemFromExtension: String(system || '').trim(),
            userFromExtension: String(user || '').trim(),
            presetCorrection: transportMode === 'prefill_user_msg' ? correctionClean : '',
            hasJsonSchema: Boolean(schemaPayload),
            visionAttachments: visionDiagSummary,
        },
        requestBody: sanitizePayloadStringForLog({
            transportMode,
            api: activeApi,
            systemPrompt: sysPayload || undefined,
            prefill: prefillPayload || undefined,
            hasJsonSchema: Boolean(schemaPayload),
            visionAttachments: visionDiagSummary,
            prompt: promptPayload,
        }, 400000),
        responsePreview: 'Ожидание ответа модели...',
    };
    lastRequestDiagnostics.llm = llmDiag;
    lastGenerationReasoning = '';

    let cancelledLocally = false;
    const runPromise = (async () => {
        try {
            if (isChatCompletion && (hasVisionImages || (transportMode === 'prefill_user_msg' && ctx?.ChatCompletionService && typeof ctx.ChatCompletionService.sendRequest === 'function'))) {
                const ccs = ctx?.ChatCompletionService;
                if (ccs && typeof ccs.processRequest === 'function') {
                    const oai = ctx?.chatCompletionSettings || {};
                    const subParams = typeof ctx?.substituteParams === 'function'
                        ? (str) => String(ctx.substituteParams(String(str ?? '')) ?? '')
                        : (str) => String(str ?? '');
                    const finalMessages = hasVisionImages
                        ? visionMessagesPayload
                        : (Array.isArray(promptPayload)
                            ? promptPayload.map((m) => {
                                const out = { role: m.role, content: subParams(typeof m.content === 'string' ? m.content : '') };
                                if (m.name) out.name = m.name;
                                return out;
                            })
                            : [{ role: 'user', content: subParams(String(promptPayload || user)) }]);
                    const extStreamSetting = stream !== undefined
                        ? Boolean(stream)
                        : Boolean(ctx?.extensionSettings?.st_nexus_match_forge?.enableStreaming);
                    const useStream = Boolean(extStreamSetting && !hasVisionImages && !schemaPayload);
                    const allowThoughts = Boolean(oai.show_thoughts);
                    const presetMgr = ctx?.getPresetManager?.('openai');
                    const activePresetName = presetMgr?.getSelectedPresetName?.() || '';
                    let reqData = {
                        messages: finalMessages,
                        stream: useStream,
                        chat_completion_source: oai.chat_completion_source || 'openai',
                        model: resolveActiveChatCompletionModelFromOai(oai, ctx) || undefined,
                        max_tokens: Number(oai.openai_max_tokens) || 4096,
                        temperature: Number.isFinite(Number(oai.temp_openai)) ? Number(oai.temp_openai) : 1,
                        custom_url: oai.custom_url || undefined,
                        reverse_proxy: oai.reverse_proxy || undefined,
                        proxy_password: oai.proxy_password || undefined,
                        custom_prompt_post_processing: oai.custom_prompt_post_processing || undefined,
                        use_sysprompt: oai.use_sysprompt !== undefined ? Boolean(oai.use_sysprompt) : true,
                        reasoning_effort: oai.reasoning_effort || undefined,
                        include_reasoning: allowThoughts,
                    };
                    if (activePresetName && typeof presetMgr?.getCompletionPresetByName === 'function' && typeof ccs.presetToGeneratePayload === 'function') {
                        const presetObj = presetMgr.getCompletionPresetByName(activePresetName);
                        if (presetObj) {
                            reqData = await ccs.presetToGeneratePayload({ ...presetObj }, {}, reqData);
                        }
                    }
                    // Force request-local stream setting (false by default) WITHOUT mutating the user's SillyTavern preset
                    reqData.messages = finalMessages;
                    reqData.stream = useStream;
                    reqData.use_sysprompt = oai.use_sysprompt !== undefined ? Boolean(oai.use_sysprompt) : true;
                    reqData.include_reasoning = allowThoughts;
                    if (schemaPayload) {
                        reqData.json_schema = schemaPayload;
                    }
                    let vData;
                    try {
                        vData = typeof ccs.sendRequest === 'function'
                            ? await ccs.sendRequest(
                                typeof ccs.createRequestData === 'function' ? ccs.createRequestData(reqData) : reqData,
                                false,
                                signal || null,
                            )
                            : await ccs.processRequest(reqData, {}, false, signal || null);
                    } catch (visionErr) {
                        const vMsg = String(visionErr?.message || visionErr || '');
                        const isRateOrServerErr = /\b(401|402|403|408|429|500|502|503|504)\b|quota|rate\s*limit|timeout|aborted/i.test(vMsg);
                        const isCapabilityReject = !isRateOrServerErr && (
                            /\b(400|404|415|422)\b/.test(vMsg)
                            || /image_url|multimodal|vision|modality|media|unsupported|content.*array/i.test(vMsg)
                        );
                        if (hasVisionImages && visionOptional && isCapabilityReject && !cancelledLocally && !signal?.aborted && (typeof rawDataFn === 'function' || typeof rawFn === 'function')) {
                            return await runLlmGeneration({
                                system,
                                user,
                                jsonSchema,
                                transportMode,
                                presetCorrectionPrompt,
                                stripActiveCharFromPreset,
                                stream,
                                visionImageUrls: [],
                                visionOptional: false,
                                signal,
                            });
                        }
                        throw visionErr;
                    }
                    if (cancelledLocally || signal?.aborted) return '';

                    let rawStreamedText = '';
                    let rawStreamedReasoning = '';
                    if (typeof vData === 'function') {
                        for await (const chunk of vData()) {
                            if (cancelledLocally || signal?.aborted) return '';
                            if (typeof chunk?.text === 'string') rawStreamedText = chunk.text;
                            if (allowThoughts && chunk?.state?.reasoning) {
                                rawStreamedReasoning = String(chunk.state.reasoning);
                            }
                        }
                        const cleaned = extractUniversalReasoningAndText(ctx, null, rawStreamedText);
                        const finalText = cleaned.text;
                        const finalReasoning = allowThoughts
                            ? ([rawStreamedReasoning, cleaned.reasoning].filter(Boolean).join('\n\n').trim())
                            : '';
                        lastGenerationReasoning = finalReasoning;
                        llmDiag.finishedAt = Date.now();
                        llmDiag.ok = true;
                        llmDiag.status = hasVisionImages
                            ? `Успешно · Vision (${finalText.length} симв.)`
                            : `Успешно (${finalText.length} симв.)`;
                        llmDiag.responsePreview = sanitizePayloadStringForLog(finalText || '[Пустой ответ]', 250000);
                        return finalText;
                    }

                    const extracted = extractUniversalReasoningAndText(ctx, vData);
                    lastGenerationReasoning = allowThoughts ? extracted.reasoning : '';
                    llmDiag.finishedAt = Date.now();
                    llmDiag.ok = true;
                    llmDiag.status = hasVisionImages
                        ? `Успешно · Vision (${extracted.text.length} симв.)`
                        : `Успешно (${extracted.text.length} симв.)`;
                    llmDiag.responsePreview = sanitizePayloadStringForLog(extracted.text || '[Пустой ответ]', 250000);
                    return extracted.text;
                }
                if (hasVisionImages) {
                    if (visionOptional && (typeof rawDataFn === 'function' || typeof rawFn === 'function')) {
                        return await runLlmGeneration({
                            system,
                            user,
                            jsonSchema,
                            transportMode,
                            presetCorrectionPrompt,
                            stripActiveCharFromPreset,
                            stream,
                            visionImageUrls: [],
                            visionOptional: false,
                            signal,
                        });
                    }
                    throw new Error('Сервис ChatCompletionService недоступен в этой версии SillyTavern для отправки фото.');
                }
            }

            if (typeof rawDataFn === 'function') {
                const data = await rawDataFn({
                    prompt: promptPayload,
                    api: activeApi,
                    systemPrompt: sysPayload,
                    prefill: prefillPayload,
                    instructOverride: false,
                    quietToLoud: false,
                    jsonSchema: schemaPayload,
                    signal, // Forwarded harmlessly now; automatically picked up if Core adds request-scoped signal support
                });
                if (cancelledLocally || signal?.aborted) return '';
                const { text, reasoning } = extractUniversalReasoningAndText(ctx, data);
                lastGenerationReasoning = reasoning;
                llmDiag.finishedAt = Date.now();
                llmDiag.ok = true;
                llmDiag.status = `Успешно (${text.length} симв.)`;
                llmDiag.responsePreview = sanitizePayloadStringForLog(text || '[Пустой ответ]', 250000);
                return text;
            }

            const fallbackTxt = await rawFn({
                prompt: promptPayload,
                api: activeApi,
                systemPrompt: sysPayload,
                prefill: prefillPayload,
                instructOverride: false,
                quietToLoud: false,
                jsonSchema: schemaPayload,
            });
            if (cancelledLocally || signal?.aborted) return '';
            const { text, reasoning } = extractUniversalReasoningAndText(ctx, null, String(fallbackTxt || ''));
            lastGenerationReasoning = reasoning;
            llmDiag.finishedAt = Date.now();
            llmDiag.ok = true;
            llmDiag.status = `Успешно (${text.length} симв.)`;
            llmDiag.responsePreview = sanitizePayloadStringForLog(text || '[Пустой ответ]', 250000);
            return text;
        } catch (err) {
            llmDiag.finishedAt = Date.now();
            llmDiag.ok = false;
            llmDiag.status = 'Ошибка генерации ИИ';
            llmDiag.responsePreview = String(err?.message || err);
            throw err;
        }
    })();

    if (!signal) return await runPromise;

    return await new Promise((resolve, reject) => {
        const onAbort = () => {
            cancelledLocally = true;
            llmDiag.finishedAt = Date.now();
            llmDiag.ok = false;
            llmDiag.status = 'Отменено пользователем';
            reject(new Error('Генерация в NexusMatch Forge отменена пользователем.'));
        };
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        runPromise.then(
            (val) => {
                signal.removeEventListener('abort', onAbort);
                if (cancelledLocally) return;
                resolve(val);
            },
            (err) => {
                signal.removeEventListener('abort', onAbort);
                if (cancelledLocally) return;
                reject(err);
            }
        );
    });
}
