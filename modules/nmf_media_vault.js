// Isolated IndexedDB vault for portraits and pre-overwrite PNG backups (fixes NMF-013 & NMF-001 backup requirement)
const DB_NAME = 'NexusMatchForgeVaultDB';
const DB_VERSION = 1;
const MEDIA_STORE = 'media_blobs';
const BACKUP_STORE = 'card_backups';
const MAX_BACKUPS = 20;

const memoryMediaCache = new Map();
const memoryBackupList = [];
let dbOpenPromise = null;

function hasIndexedDb() {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function makeMediaId() {
    return 'nmf_img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function makeBackupId() {
    return 'nmf_bak_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function bytesToBase64(bytes) {
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

function openVaultDb() {
    if (!hasIndexedDb()) return Promise.resolve(null);
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
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => {
                console.warn('[NexusMatch Forge] IndexedDB unavailable, falling back to RAM vault:', req.error);
                resolve(null);
            };
        } catch (err) {
            console.warn('[NexusMatch Forge] IndexedDB open exception:', err);
            resolve(null);
        }
    });
    return dbOpenPromise;
}

function idbPut(db, storeName, record) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
    });
}

function idbGet(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

function idbDelete(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

function idbGetAllKeys(db, storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAllKeys();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result.map(String) : []);
        req.onerror = () => reject(req.error);
    });
}

function idbGetAll(db, storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => reject(req.error);
    });
}

export function getMediaDataUrlSync(mediaId) {
    if (!mediaId) return '';
    return memoryMediaCache.get(String(mediaId)) || '';
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

export async function saveMediaDataUrl(dataUrl, existingId = '') {
    const clean = String(dataUrl || '').trim();
    if (!clean) {
        if (existingId) await deleteMediaById(existingId);
        return '';
    }
    const id = existingId && String(existingId).startsWith('nmf_img_') ? String(existingId) : makeMediaId();
    memoryMediaCache.set(id, clean);

    const db = await openVaultDb();
    if (db) {
        try {
            await idbPut(db, MEDIA_STORE, { id, dataUrl: clean, updatedAt: Date.now() });
        } catch (err) {
            console.warn('[NexusMatch Forge] Failed to persist image in IndexedDB:', err);
        }
    }
    return id;
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
            memoryMediaCache.set(id, String(rec.dataUrl));
            return String(rec.dataUrl);
        }
    } catch (err) {
        console.warn('[NexusMatch Forge] Failed to read image from IndexedDB:', err);
    }
    return '';
}

export async function deleteMediaById(mediaId) {
    const id = String(mediaId || '').trim();
    if (!id) return false;
    memoryMediaCache.delete(id);

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

export function collectReferencedMediaIds(sessions = []) {
    const ids = new Set();
    if (!Array.isArray(sessions)) return ids;
    for (const s of sessions) {
        if (!s || typeof s !== 'object') continue;
        if (s.card?.avatarId) ids.add(String(s.card.avatarId));
        for (const pool of ['queue', 'liked', 'passed']) {
            const arr = s.tinder?.[pool];
            if (!Array.isArray(arr)) continue;
            for (const c of arr) {
                if (c?.avatarId) ids.add(String(c.avatarId));
            }
        }
        if (s.tinder?.lastDislikedCandidate?.avatarId) {
            ids.add(String(s.tinder.lastDislikedCandidate.avatarId));
        }
    }
    return ids;
}

export async function hydrateSessionsMedia(sessions = []) {
    const ids = collectReferencedMediaIds(sessions);
    await Promise.all([...ids].map((id) => loadMediaDataUrl(id)));
}

// Migrate any legacy inline Base64 avatarDataUrl fields out of extensionSettings into the vault (fixes NMF-013)
export async function migrateInlineSessionMediaToVault(sessions = []) {
    if (!Array.isArray(sessions)) return false;
    let changed = false;

    const migrateEntity = async (ent) => {
        if (!ent || typeof ent !== 'object') return;
        const inline = typeof ent.avatarDataUrl === 'string' ? ent.avatarDataUrl.trim() : '';
        if (inline.startsWith('data:')) {
            const id = await saveMediaDataUrl(inline, ent.avatarId || '');
            ent.avatarId = id;
            ent.avatarDataUrl = '';
            changed = true;
        } else if (ent.avatarDataUrl) {
            ent.avatarDataUrl = '';
            changed = true;
        }
    };

    for (const s of sessions) {
        if (!s || typeof s !== 'object') continue;
        await migrateEntity(s.card);
        for (const pool of ['queue', 'liked', 'passed']) {
            const arr = s.tinder?.[pool];
            if (!Array.isArray(arr)) continue;
            for (const c of arr) {
                await migrateEntity(c);
            }
        }
        if (s.tinder?.lastDislikedCandidate) {
            await migrateEntity(s.tinder.lastDislikedCandidate);
        }
    }
    return changed;
}

export async function pruneOrphanedMedia(sessions = []) {
    const referenced = collectReferencedMediaIds(sessions);
    let removed = 0;

    for (const key of [...memoryMediaCache.keys()]) {
        if (!referenced.has(key)) {
            memoryMediaCache.delete(key);
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

// Pre-overwrite full PNG + V2 JSON backup vault (fixes NMF-001 backup requirement)
export async function saveCardBackup({ avatarFileName, characterName = '', pngBytes = null, cardJson = null }) {
    const record = {
        id: makeBackupId(),
        avatarFileName: String(avatarFileName || '').trim(),
        characterName: String(characterName || avatarFileName || '').trim(),
        pngBase64: pngBytes instanceof Uint8Array ? bytesToBase64(pngBytes) : '',
        cardJson: cardJson ? structuredClone(cardJson) : null,
        createdAt: Date.now(),
    };

    memoryBackupList.unshift(record);
    if (memoryBackupList.length > MAX_BACKUPS) {
        memoryBackupList.length = MAX_BACKUPS;
    }

    const db = await openVaultDb();
    if (db) {
        try {
            await idbPut(db, BACKUP_STORE, record);
            const all = await idbGetAll(db, BACKUP_STORE);
            if (all.length > MAX_BACKUPS) {
                all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                for (const stale of all.slice(MAX_BACKUPS)) {
                    await idbDelete(db, BACKUP_STORE, stale.id);
                }
            }
        } catch (err) {
            console.warn('[NexusMatch Forge] Failed to store card backup in IndexedDB:', err);
        }
    }
    return record;
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
    const inMem = memoryBackupList.find((b) => b.id === id);
    if (inMem) return inMem;

    const db = await openVaultDb();
    if (!db) return null;
    try {
        return await idbGet(db, BACKUP_STORE, id);
    } catch {
        return null;
    }
}

export function clearMemoryVaultForTests() {
    memoryMediaCache.clear();
    memoryBackupList.length = 0;
}
