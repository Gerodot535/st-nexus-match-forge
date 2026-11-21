// Isolated IndexedDB vault for portraits and fail-closed pre-overwrite PNG backups
// Fixes NMF-013, NMF-001, P1-B (durable verified PNG backup), and P2-E (race-free Base64 -> IDB migration)
const DB_NAME = 'NexusMatchForgeVaultDB';
const DB_VERSION = 1;
const MEDIA_STORE = 'media_blobs';
const BACKUP_STORE = 'card_backups';
const MAX_BACKUPS = 20;

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const memoryMediaCache = new Map();
const memoryObjectUrlCache = new Map(); // mediaId -> { sourceLen, blobUrl }
const inlineObjectUrlCache = new Map(); // inlinePrefixHash -> { sourceLen, blobUrl }
const durablyPersistedMediaIds = new Set();

function dataUrlToFastObjectUrl(dataUrl) {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof atob !== 'function') {
        return dataUrl;
    }
    try {
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx === -1) return dataUrl;
        const header = dataUrl.slice(0, commaIdx);
        const mimeMatch = header.match(/^data:([^;]+)/i);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const b64 = dataUrl.slice(commaIdx + 1);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
        return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch {
        return dataUrl;
    }
}

function revokeCachedObjectUrl(mediaId) {
    const key = String(mediaId || '');
    const hit = memoryObjectUrlCache.get(key);
    if (hit?.blobUrl && hit.blobUrl.startsWith('blob:') && typeof URL?.revokeObjectURL === 'function') {
        try { URL.revokeObjectURL(hit.blobUrl); } catch {}
    }
    memoryObjectUrlCache.delete(key);
}
const memoryBackupList = [];
let dbOpenPromise = null;
let activeDbInstance = null;
let activeMigrationChain = Promise.resolve({
    changed: false,
    migratedCount: 0,
    failedCount: 0,
    complete: true,
});

function hasIndexedDb() {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function makeMediaId() {
    return 'nmf_img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function makeBackupId() {
    return 'nmf_bak_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function createCodedError(code, message, cause = null) {
    const err = new Error(message);
    err.code = code;
    if (cause) err.cause = cause;
    return err;
}

export function bytesToBase64(bytes) {
    if (!bytes || !bytes.length) return '';
    let bin = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(bin);
}

export function base64ToBytes(b64) {
    if (!b64) return new Uint8Array(0);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        out[i] = bin.charCodeAt(i) & 0xff;
    }
    return out;
}

function readUint32BE(bytes, offset) {
    return (
        ((bytes[offset] << 24) >>> 0) +
        ((bytes[offset + 1] << 16) >>> 0) +
        ((bytes[offset + 2] << 8) >>> 0) +
        (bytes[offset + 3] >>> 0)
    ) >>> 0;
}

// Strict structural PNG validator (magic + valid IHDR dimensions + intact chunk stream ending in IEND)
export function isValidNonEmptyPngBytes(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 57) return false;
    for (let i = 0; i < 8; i++) {
        if (bytes[i] !== PNG_MAGIC[i]) return false;
    }

    let offset = 8;
    let sawIhdr = false;
    let sawIdat = false;
    let sawIend = false;

    while (offset + 12 <= bytes.length) {
        const chunkLen = readUint32BE(bytes, offset);
        const type = String.fromCharCode(
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7]
        );
        const nextOffset = offset + 12 + chunkLen;
        if (nextOffset > bytes.length) return false;

        if (!sawIhdr) {
            if (type !== 'IHDR' || chunkLen !== 13) return false;
            const width = readUint32BE(bytes, offset + 8);
            const height = readUint32BE(bytes, offset + 12);
            if (width === 0 || height === 0) return false;
            sawIhdr = true;
        } else if (type === 'IDAT' && chunkLen > 0) {
            sawIdat = true;
        } else if (type === 'IEND') {
            if (chunkLen !== 0) return false;
            sawIend = true;
            offset = nextOffset;
            break;
        }

        offset = nextOffset;
    }

    return sawIhdr && sawIdat && sawIend;
}

function openVaultDb() {
    if (!hasIndexedDb()) return Promise.resolve(null);
    if (activeDbInstance) return Promise.resolve(activeDbInstance);
    if (dbOpenPromise) return dbOpenPromise;

    dbOpenPromise = new Promise((resolve) => {
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(MEDIA_STORE)) {
                    db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(BACKUP_STORE)) {
                    const store = db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('avatarFileName', 'avatarFileName', { unique: false });
                }
            };
            req.onsuccess = () => {
                activeDbInstance = req.result;
                if (activeDbInstance && typeof activeDbInstance.onclose === 'undefined') {
                    // no-op for minimal shims
                }
                resolve(activeDbInstance);
            };
            req.onblocked = () => {
                dbOpenPromise = null;
                resolve(null);
            };
            req.onerror = () => {
                dbOpenPromise = null;
                console.warn('[NexusMatch Forge] IndexedDB unavailable:', req.error);
                resolve(null);
            };
        } catch (err) {
            dbOpenPromise = null;
            console.warn('[NexusMatch Forge] IndexedDB open exception:', err);
            resolve(null);
        }
    });
    return dbOpenPromise;
}

function idbPut(db, storeName, record) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const fail = (err) => {
            if (settled) return;
            settled = true;
            reject(err || new Error('IndexedDB write failed'));
        };
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).put(record);
            req.onerror = () => fail(req.error || tx.error);
            tx.onabort = () => fail(tx.error || req.error || new Error('IndexedDB transaction aborted'));
            tx.onerror = () => fail(tx.error || req.error);
            tx.oncomplete = () => {
                if (settled) return;
                settled = true;
                resolve(record);
            };
        } catch (err) {
            fail(err);
        }
    });
}

function idbGet(db, storeName, id) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error || tx.error || new Error('IndexedDB read failed'));
            tx.onabort = () => reject(tx.error || new Error('IndexedDB read aborted'));
        } catch (err) {
            reject(err);
        }
    });
}

function idbDelete(db, storeName, id) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const fail = (err) => {
            if (settled) return;
            settled = true;
            reject(err || new Error('IndexedDB delete failed'));
        };
        try {
            const tx = db.transaction(storeName, 'readwrite');
            const req = tx.objectStore(storeName).delete(id);
            req.onerror = () => fail(req.error || tx.error);
            tx.onabort = () => fail(tx.error || req.error);
            tx.onerror = () => fail(tx.error || req.error);
            tx.oncomplete = () => {
                if (settled) return;
                settled = true;
                resolve(true);
            };
        } catch (err) {
            fail(err);
        }
    });
}

function idbGetAllKeys(db, storeName) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).getAllKeys();
            req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result.map(String) : []);
            req.onerror = () => reject(req.error || tx.error);
        } catch (err) {
            reject(err);
        }
    });
}

function idbGetAll(db, storeName) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
            req.onerror = () => reject(req.error || tx.error);
        } catch (err) {
            reject(err);
        }
    });
}

export function getMediaDataUrlSync(mediaId) {
    if (!mediaId) return '';
    return memoryMediaCache.get(String(mediaId)) || '';
}

export function isMediaDurablyPersisted(mediaId) {
    if (!mediaId) return false;
    return durablyPersistedMediaIds.has(String(mediaId));
}

export function resolveEntityAvatarUrl(entity) {
    if (!entity || typeof entity !== 'object') return '';
    if (entity.avatarId) {
        const cached = getMediaDataUrlSync(entity.avatarId);
        if (cached) return cached;
    }
    if (typeof entity.avatarDataUrl === 'string' && entity.avatarDataUrl.startsWith('data:')) {
        return entity.avatarDataUrl;
    }
    return '';
}

/**
 * Returns a short, GPU-cached blob: URL (36 chars instead of 8MB Base64!) for fast DOM <img src> rendering
 * so clicks and tab switches never freeze mobile or desktop browsers re-parsing multi-megabyte data: URLs.
 */
export function resolveEntityDisplayUrl(entity) {
    if (!entity || typeof entity !== 'object') return '';
    if (entity.avatarId) {
        const key = String(entity.avatarId);
        const raw = memoryMediaCache.get(key);
        if (raw) {
            const cachedObj = memoryObjectUrlCache.get(key);
            if (cachedObj && cachedObj.sourceLen === raw.length) {
                return cachedObj.blobUrl;
            }
            revokeCachedObjectUrl(key);
            const blobUrl = dataUrlToFastObjectUrl(raw);
            memoryObjectUrlCache.set(key, { sourceLen: raw.length, blobUrl });
            return blobUrl;
        }
    }
    if (typeof entity.avatarDataUrl === 'string' && entity.avatarDataUrl.startsWith('data:')) {
        const raw = entity.avatarDataUrl;
        if (raw.length < 4096) return raw;
        const sig = raw.slice(0, 48) + ':' + raw.length + ':' + raw.slice(-32);
        const hit = inlineObjectUrlCache.get(sig);
        if (hit && hit.sourceLen === raw.length) return hit.blobUrl;
        const blobUrl = dataUrlToFastObjectUrl(raw);
        if (inlineObjectUrlCache.size > 60) {
            const firstKey = inlineObjectUrlCache.keys().next().value;
            const old = inlineObjectUrlCache.get(firstKey);
            if (old?.blobUrl?.startsWith('blob:')) {
                try { URL.revokeObjectURL(old.blobUrl); } catch {}
            }
            inlineObjectUrlCache.delete(firstKey);
        }
        inlineObjectUrlCache.set(sig, { sourceLen: raw.length, blobUrl });
        return blobUrl;
    }
    return '';
}

export const MAX_EMERGENCY_INLINE_ITEMS = 8;
export const MAX_EMERGENCY_INLINE_TOTAL_CHARS = 25_000_000;

export async function saveMediaDataUrl(dataUrl, existingId = '') {
    const clean = String(dataUrl || '').trim();
    if (!clean) {
        if (existingId) await deleteMediaById(existingId);
        return '';
    }
    const id = existingId && String(existingId).startsWith('nmf_img_') ? String(existingId) : makeMediaId();
    revokeCachedObjectUrl(id);
    memoryMediaCache.set(id, clean);
    durablyPersistedMediaIds.delete(id);

    const db = await openVaultDb();
    if (db) {
        try {
            await idbPut(db, MEDIA_STORE, { id, dataUrl: clean, updatedAt: Date.now() });
            const readback = await idbGet(db, MEDIA_STORE, id);
            if (readback && readback.id === id && readback.dataUrl === clean) {
                durablyPersistedMediaIds.add(id);
            } else {
                console.warn('[NexusMatch Forge] Media readback mismatch in IndexedDB for', id);
            }
        } catch (err) {
            durablyPersistedMediaIds.delete(id);
            console.warn('[NexusMatch Forge] Failed to persist image in IndexedDB:', err);
        }
    }
    return id;
}

// Assigns new/uploaded portrait to a card or candidate:
// - Normal path (IndexedDB healthy): stores in IndexedDB + clears avatarDataUrl = '' (0 bytes in settings.json!)
// - Emergency path (IndexedDB unavailable / QuotaExceededError — P1-02): retains avatarDataUrl inline subject to strict cap
export async function assignEntityMediaWithFallback(entity, dataUrl, existingId = '') {
    if (!entity || typeof entity !== 'object') {
        return { id: '', durable: true, keptInlineFallback: false };
    }
    const clean = String(dataUrl || '').trim();
    if (!clean) {
        if (existingId || entity.avatarId) {
            await deleteMediaById(existingId || entity.avatarId);
        }
        entity.avatarId = '';
        entity.avatarDataUrl = '';
        return { id: '', durable: true, keptInlineFallback: false };
    }

    const id = await saveMediaDataUrl(clean, existingId || entity.avatarId || '');
    const durable = Boolean(id && isMediaDurablyPersisted(id));
    entity.avatarId = id;

    if (durable) {
        entity.avatarDataUrl = '';
        delete entity._nmfEmergencyInlineTs;
        return { id, durable: true, keptInlineFallback: false };
    }

    entity.avatarDataUrl = clean;
    entity._nmfEmergencyInlineTs = Date.now();
    return { id, durable: false, keptInlineFallback: true };
}

// Protects extensionSettings / settings.json from unbounded Base64 bloat when IndexedDB is broken on new generations,
// while never dropping pre-existing legacy inline session data awaiting migration (harmonizes NMF-013, P2-E, and P1-02)
export function enforceEmergencyInlineBudget(
    sessions = [],
    activeSessionId = '',
    { maxItems = MAX_EMERGENCY_INLINE_ITEMS, maxTotalChars = MAX_EMERGENCY_INLINE_TOTAL_CHARS, savedVault = [] } = {}
) {
    if (!Array.isArray(sessions)) return { keptCount: 0, evictedCount: 0, totalChars: 0 };

    const emergencyEntities = [];
    const activeSess = sessions.find((s) => s?.id === activeSessionId) || sessions[0] || null;

    const visitEntity = (ent) => {
        if (!ent || typeof ent !== 'object' || !ent.avatarDataUrl) return;
        const raw = String(ent.avatarDataUrl).trim();
        if (!raw.startsWith('data:')) {
            ent.avatarDataUrl = '';
            delete ent._nmfEmergencyInlineTs;
            return;
        }
        if (ent.avatarId && isMediaDurablyPersisted(ent.avatarId)) {
            ent.avatarDataUrl = '';
            delete ent._nmfEmergencyInlineTs;
            return;
        }
        // Only cap newly added emergency inline fallbacks; pre-existing un-migrated data is preserved intact for P2-E
        if (ent._nmfEmergencyInlineTs && !emergencyEntities.includes(ent)) {
            emergencyEntities.push(ent);
        }
    };

    if (activeSess) {
        visitEntity(activeSess.card);
        if (Array.isArray(activeSess.tinder?.queue) && activeSess.tinder.queue[0]) {
            visitEntity(activeSess.tinder.queue[0]);
        }
    }
    for (const s of sessions) {
        visitEntity(s?.card);
        if (s?.cardSlots && typeof s.cardSlots === 'object') {
            for (const slotCard of Object.values(s.cardSlots)) visitEntity(slotCard);
        }
    }
    for (const pool of ['queue', 'liked', 'passed']) {
        for (const s of sessions) {
            const arr = s?.tinder?.[pool];
            if (!Array.isArray(arr)) continue;
            for (const c of arr) visitEntity(c);
        }
    }
    for (const s of sessions) {
        visitEntity(s?.tinder?.lastDislikedCandidate);
        visitEntity(s?.artRefCustom);
        if (Array.isArray(s?.gacha?.collection)) {
            for (const g of s.gacha.collection) visitEntity(g);
        }
        if (Array.isArray(s?.gacha?.lastRevealBatch)) {
            for (const g of s.gacha.lastRevealBatch) visitEntity(g);
        }
    }
    if (Array.isArray(savedVault)) {
        for (const v of savedVault) visitEntity(v);
    }

    let keptCount = 0;
    let totalChars = 0;
    let evictedCount = 0;

    for (const ent of emergencyEntities) {
        const len = String(ent.avatarDataUrl || '').length;
        if (keptCount < maxItems && totalChars + len <= maxTotalChars) {
            keptCount += 1;
            totalChars += len;
        } else {
            ent.avatarDataUrl = '';
            delete ent._nmfEmergencyInlineTs;
            evictedCount += 1;
        }
    }

    return { keptCount, evictedCount, totalChars };
}

export async function loadMediaDataUrl(mediaId) {
    const id = String(mediaId || '').trim();
    if (!id) return '';
    if (memoryMediaCache.has(id)) return memoryMediaCache.get(id) || '';

    const db = await openVaultDb();
    if (!db) return '';
    try {
        const rec = await idbGet(db, MEDIA_STORE, id);
        if (rec?.dataUrl) {
            const val = String(rec.dataUrl);
            memoryMediaCache.set(id, val);
            durablyPersistedMediaIds.add(id);
            return val;
        }
    } catch (err) {
        console.warn('[NexusMatch Forge] Failed to read image from IndexedDB:', err);
    }
    return '';
}

export async function deleteMediaById(mediaId) {
    const id = String(mediaId || '').trim();
    if (!id) return false;
    revokeCachedObjectUrl(id);
    memoryMediaCache.delete(id);
    durablyPersistedMediaIds.delete(id);

    const db = await openVaultDb();
    if (db) {
        try {
            await idbDelete(db, MEDIA_STORE, id);
        } catch (err) {
            console.warn('[NexusMatch Forge] Failed to delete image from IndexedDB:', err);
        }
    }
    return true;
}

export function resolveOriginalEntityMediaUrl(entity) {
    if (!entity || typeof entity !== 'object') return '';
    if (entity.originalAvatarId) {
        const orig = memoryMediaCache.get(String(entity.originalAvatarId));
        if (orig) return orig;
    }
    return resolveEntityAvatarUrl(entity);
}

export function collectReferencedMediaIds(sessions = [], extraIds = [], savedVault = []) {
    const ids = new Set();
    const pushEnt = (ent) => {
        if (!ent || typeof ent !== 'object') return;
        if (ent.avatarId) ids.add(String(ent.avatarId));
        if (ent.originalAvatarId) ids.add(String(ent.originalAvatarId));
    };
    if (Array.isArray(extraIds)) {
        for (const eid of extraIds) {
            if (eid) ids.add(String(eid));
        }
    }
    if (Array.isArray(savedVault)) {
        for (const v of savedVault) pushEnt(v);
    }
    if (!Array.isArray(sessions)) return ids;
    for (const s of sessions) {
        if (!s || typeof s !== 'object') continue;
        pushEnt(s.card);
        if (s.cardSlots && typeof s.cardSlots === 'object') {
            for (const sc of Object.values(s.cardSlots)) pushEnt(sc);
        }
        pushEnt(s.artRefCustom);
        for (const pool of ['queue', 'liked', 'passed']) {
            const arr = s.tinder?.[pool];
            if (!Array.isArray(arr)) continue;
            for (const c of arr) pushEnt(c);
        }
        pushEnt(s.tinder?.lastDislikedCandidate);
        for (const gPool of ['collection', 'lastRevealBatch']) {
            const gArr = s.gacha?.[gPool];
            if (!Array.isArray(gArr)) continue;
            for (const g of gArr) pushEnt(g);
        }
    }
    return ids;
}

export async function hydrateSessionsMedia(sessions = [], extraIds = [], savedVault = []) {
    const ids = collectReferencedMediaIds(sessions, extraIds, savedVault);
    await Promise.all([...ids].map((id) => loadMediaDataUrl(id)));
}

// Race-free, upfront-snapshotted Base64 -> IndexedDB migration (fixes NMF-013 & P2-E):
// 1. Captures an immutable snapshot of all inline data: URLs synchronously BEFORE the first await.
// 2. Clears ent.avatarDataUrl ONLY after confirmed IndexedDB write + readback verification.
// 3. Preserves ent.avatarDataUrl intact if IndexedDB is unavailable or fails mid-batch (e.g. QuotaExceededError).
export function migrateInlineSessionMediaToVault(sessions = [], savedVault = []) {
    if (!Array.isArray(sessions) && !Array.isArray(savedVault)) {
        return Promise.resolve({ changed: false, migratedCount: 0, failedCount: 0, complete: true });
    }

    // Synchronous snapshot BEFORE any await so concurrent saveSettings() cannot race ahead
    const snapshotItems = [];
    const seenEntities = new Set();
    let cleanedGarbage = 0;

    const collectEntity = (ent) => {
        if (!ent || typeof ent !== 'object' || seenEntities.has(ent)) return;
        seenEntities.add(ent);
        const raw = typeof ent.avatarDataUrl === 'string' ? ent.avatarDataUrl.trim() : '';
        if (raw.startsWith('data:')) {
            snapshotItems.push({
                ent,
                rawDataUrl: raw,
                existingId: ent.avatarId ? String(ent.avatarId) : '',
            });
        } else if (ent.avatarDataUrl) {
            ent.avatarDataUrl = '';
            cleanedGarbage += 1;
        }
    };

    for (const s of sessions) {
        if (!s || typeof s !== 'object') continue;
        collectEntity(s.card);
        if (s.cardSlots && typeof s.cardSlots === 'object') {
            for (const sc of Object.values(s.cardSlots)) collectEntity(sc);
        }
        for (const pool of ['queue', 'liked', 'passed']) {
            const arr = s.tinder?.[pool];
            if (!Array.isArray(arr)) continue;
            for (const c of arr) {
                collectEntity(c);
            }
        }
        if (s.tinder?.lastDislikedCandidate) {
            collectEntity(s.tinder.lastDislikedCandidate);
        }
        if (s.artRefCustom) {
            collectEntity(s.artRefCustom);
        }
        for (const gPool of ['collection', 'lastRevealBatch']) {
            const gArr = s.gacha?.[gPool];
            if (!Array.isArray(gArr)) continue;
            for (const g of gArr) {
                collectEntity(g);
            }
        }
    }
    if (Array.isArray(savedVault)) {
        for (const v of savedVault) collectEntity(v);
    }

    const runStep = async () => {
        let migratedCount = 0;
        let failedCount = 0;

        for (const item of snapshotItems) {
            const { ent, rawDataUrl, existingId } = item;
            // Skip if user already replaced this entity's image with a completely different inline Data URL
            const currentInline = typeof ent.avatarDataUrl === 'string' ? ent.avatarDataUrl.trim() : '';
            if (currentInline && currentInline !== rawDataUrl) {
                continue;
            }

            const id = await saveMediaDataUrl(rawDataUrl, ent.avatarId || existingId);
            if (id && isMediaDurablyPersisted(id)) {
                ent.avatarId = id;
                ent.avatarDataUrl = '';
                delete ent._nmfEmergencyInlineTs;
                migratedCount += 1;
            } else {
                // Durable IDB write/readback did NOT succeed — preserve inline Base64 so reload never loses user art!
                if (id) ent.avatarId = id;
                ent.avatarDataUrl = rawDataUrl;
                failedCount += 1;
            }
        }

        return {
            changed: migratedCount > 0 || cleanedGarbage > 0,
            migratedCount,
            failedCount,
            complete: failedCount === 0,
        };
    };

    activeMigrationChain = activeMigrationChain.catch(() => {}).then(runStep);
    return activeMigrationChain;
}

export function waitForActiveMediaMigration() {
    return activeMigrationChain;
}

export async function pruneOrphanedMedia(sessions = [], extraIds = [], savedVault = []) {
    const referenced = collectReferencedMediaIds(sessions, extraIds, savedVault);
    let removed = 0;

    for (const key of [...memoryMediaCache.keys()]) {
        if (!referenced.has(key)) {
            revokeCachedObjectUrl(key);
            memoryMediaCache.delete(key);
            durablyPersistedMediaIds.delete(key);
            removed += 1;
        }
    }

    const db = await openVaultDb();
    if (db) {
        try {
            const allKeys = await idbGetAllKeys(db, MEDIA_STORE);
            for (const key of allKeys) {
                if (!referenced.has(key)) {
                    await idbDelete(db, MEDIA_STORE, key);
                    removed += 1;
                }
            }
        } catch (err) {
            console.warn('[NexusMatch Forge] Orphaned media cleanup warning:', err);
        }
    }
    return removed;
}

// Fail-closed pre-overwrite full PNG + V2 JSON backup vault (fixes NMF-001 & P1-B)
// When requireDurable === true (default), strictly requires:
//  1) structurally valid non-empty PNG bytes,
//  2) valid V2 JSON object,
//  3) successful IndexedDB transaction commit,
//  4) verified IndexedDB readback matching exact PNG Base64 & JSON.
// RAM-only fallback is NEVER treated as a valid pre-overwrite safety backup.
export async function saveCardBackup(
    { avatarFileName, characterName = '', pngBytes = null, cardJson = null },
    { requireDurable = true } = {}
) {
    const cleanAvatar = String(avatarFileName || '').trim();
    if (!cleanAvatar) {
        throw createCodedError('BACKUP_INVALID_TARGET', 'Не указано имя файла персонажа для создания страховочного бэкапа.');
    }
    if (!isValidNonEmptyPngBytes(pngBytes)) {
        throw createCodedError(
            'BACKUP_INVALID_PNG',
            'Не удалось прочитать валидный исходный PNG карточки для страховочного бэкапа. Перезапись заблокирована — сохраните карточку как новую или скачайте PNG/JSON.'
        );
    }
    if (!cardJson || typeof cardJson !== 'object' || Array.isArray(cardJson)) {
        throw createCodedError(
            'BACKUP_INVALID_JSON',
            'Исходный JSON карточки повреждён или пуст. Перезапись заблокирована.'
        );
    }

    const pngBase64 = bytesToBase64(pngBytes);
    if (!pngBase64) {
        throw createCodedError('BACKUP_INVALID_PNG', 'Пустой буфер PNG при кодировании страховочного бэкапа.');
    }

    const record = {
        id: makeBackupId(),
        avatarFileName: cleanAvatar,
        characterName: String(characterName || cleanAvatar).trim(),
        pngBase64,
        cardJson: structuredClone(cardJson),
        createdAt: Date.now(),
    };

    const db = await openVaultDb();
    if (!db) {
        if (requireDurable) {
            throw createCodedError(
                'BACKUP_IDB_UNAVAILABLE',
                'Хранилище IndexedDB недоступно (приватный режим или блокировка браузера) — невозможно надёжно сохранить страховочный PNG-бэкап. Перезапись оригинала заблокирована; скачайте отдельный PNG или сохраните как новую карточку.'
            );
        }
        memoryBackupList.unshift({ ...record, durable: false });
        if (memoryBackupList.length > MAX_BACKUPS) memoryBackupList.length = MAX_BACKUPS;
        return { ...record, durable: false };
    }

    try {
        await idbPut(db, BACKUP_STORE, record);
    } catch (err) {
        if (requireDurable) {
            throw createCodedError(
                'BACKUP_WRITE_FAILED',
                `Не удалось записать страховочный PNG-бэкап в IndexedDB (${err?.name || err?.message || 'ошибка хранилища'}). Перезапись оригинала заблокирована — скачайте отдельный PNG/JSON.`,
                err
            );
        }
        memoryBackupList.unshift({ ...record, durable: false });
        return { ...record, durable: false };
    }

    let verified = null;
    try {
        verified = await idbGet(db, BACKUP_STORE, record.id);
    } catch (err) {
        if (requireDurable) {
            throw createCodedError(
                'BACKUP_READBACK_FAILED',
                'Контрольное чтение страховочного бэкапа из IndexedDB завершилось ошибкой. Перезапись оригинала заблокирована.',
                err
            );
        }
    }

    const isReadbackValid = Boolean(
        verified &&
        verified.id === record.id &&
        typeof verified.pngBase64 === 'string' &&
        verified.pngBase64.length === record.pngBase64.length &&
        verified.pngBase64 === record.pngBase64 &&
        verified.cardJson &&
        typeof verified.cardJson === 'object'
    );

    if (!isReadbackValid && requireDurable) {
        throw createCodedError(
            'BACKUP_READBACK_FAILED',
            'Проверка целостности записанного PNG-бэкапа в IndexedDB не пройдена. Перезапись оригинала заблокирована.'
        );
    }

    // Best-effort pruning of older backups beyond MAX_BACKUPS (never deletes just-verified record)
    try {
        const all = await idbGetAll(db, BACKUP_STORE);
        if (all.length > MAX_BACKUPS) {
            all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            for (const stale of all.slice(MAX_BACKUPS)) {
                if (stale.id !== record.id) {
                    await idbDelete(db, BACKUP_STORE, stale.id);
                }
            }
        }
    } catch {
        // Non-fatal cleanup error after current backup is already verified
    }

    const finalRecord = { ...record, durable: isReadbackValid };
    memoryBackupList.unshift(finalRecord);
    if (memoryBackupList.length > MAX_BACKUPS) {
        memoryBackupList.length = MAX_BACKUPS;
    }
    return finalRecord;
}

export async function listCardBackups(avatarFileName = '') {
    const filterName = String(avatarFileName || '').trim();
    const db = await openVaultDb();
    let list = [];

    if (db) {
        try {
            list = await idbGetAll(db, BACKUP_STORE);
        } catch {
            list = [...memoryBackupList];
        }
    } else {
        list = [...memoryBackupList];
    }

    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (filterName) {
        return list.filter((b) => b.avatarFileName === filterName);
    }
    return list;
}

export async function getCardBackupById(backupId) {
    const id = String(backupId || '').trim();
    if (!id) return null;

    const db = await openVaultDb();
    if (db) {
        try {
            const rec = await idbGet(db, BACKUP_STORE, id);
            if (rec) return rec;
        } catch {
            // Fall through to memory cache if read fails
        }
    }
    return memoryBackupList.find((b) => b.id === id) || null;
}

export function clearMemoryVaultForTests({ closeDb = true } = {}) {
    memoryMediaCache.clear();
    durablyPersistedMediaIds.clear();
    memoryBackupList.length = 0;
    if (closeDb) {
        try {
            activeDbInstance?.close?.();
        } catch {
            // ignore
        }
        activeDbInstance = null;
        dbOpenPromise = null;
    }
}
