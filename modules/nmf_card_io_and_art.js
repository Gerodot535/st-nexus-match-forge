// CRC32 table for valid PNG tEXt ('chara') chunk embedding
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

export function buildV2CardObject(card) {
    const tagsArr = Array.isArray(card.tags)
        ? card.tags.map((s) => String(s).trim()).filter(Boolean)
        : String(card.tags || '').split(',').map((s) => s.trim()).filter(Boolean);

    const altArr = Array.isArray(card.alternate_greetings)
        ? card.alternate_greetings.map((s) => String(s || '').trim()).filter(Boolean)
        : [];

    const extensions = {
        talkativeness: '0.5',
        fav: false,
        world: String(card.world || '').trim(),
        depth_prompt: { prompt: '', depth: 4, role: 'system' },
        nexus_match_forge: {
            version: '1.3.0-beta',
            image_prompt: String(card.imagePrompt || '').trim(),
        },
    };

    const data = {
        name: String(card.name || 'Unnamed').trim(),
        description: String(card.description || '').trim(),
        personality: String(card.personality || '').trim(),
        scenario: String(card.scenario || '').trim(),
        first_mes: String(card.first_mes || '').trim(),
        mes_example: String(card.mes_example || '').trim(),
        creator_notes: String(card.creator_notes || '').trim(),
        system_prompt: String(card.system_prompt || '').trim(),
        post_history_instructions: String(card.post_history_instructions || '').trim(),
        alternate_greetings: altArr,
        tags: tagsArr,
        creator: String(card.creator || 'NexusMatch Forge').trim(),
        character_version: String(card.character_version || '1.0').trim(),
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
        talkativeness: '0.5',
        fav: false,
        tags: data.tags,
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data,
    };
}

function getTargetCanvasDimensions(aspectRatio = '1:1') {
    if (aspectRatio === '2:3') return { width: 640, height: 960 };
    if (aspectRatio === '3:4') return { width: 672, height: 896 };
    if (aspectRatio === '16:9') return { width: 960, height: 540 };
    return { width: 768, height: 768 }; // Default 1:1 square
}

// Crop & render PNG bytes respecting user's chosen aspect ratio (default 1:1, or 'native' to keep model's exact proportions!) and crop focus
export async function ensurePngBytes(avatarDataUrl, charName = 'NMF', accentHex = '#1de9b6', { aspectRatio = '1:1', cropFocus = 'top' } = {}) {
    const dims = getTargetCanvasDimensions(aspectRatio === 'native' ? '1:1' : aspectRatio);
    const canvas = document.createElement('canvas');
    canvas.width = dims.width;
    canvas.height = dims.height;
    const g = canvas.getContext('2d');

    if (avatarDataUrl) {
        try {
            const img = await new Promise((resolve, reject) => {
                const el = new Image();
                el.crossOrigin = 'anonymous';
                el.onload = () => resolve(el);
                el.onerror = reject;
                el.src = avatarDataUrl;
            });

            if (aspectRatio === 'native' && img.width > 0 && img.height > 0) {
                const maxSide = 1280;
                const s = Math.min(1, maxSide / Math.max(img.width, img.height));
                canvas.width = Math.max(64, Math.round(img.width * s));
                canvas.height = Math.max(64, Math.round(img.height * s));
                g.drawImage(img, 0, 0, canvas.width, canvas.height);
            } else if (cropFocus === 'contain') {
                g.fillStyle = '#0a0d14';
                g.fillRect(0, 0, canvas.width, canvas.height);
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                g.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
            } else {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const offsetX = (canvas.width - w) / 2;
                // 'top' keeps upper 18% anchor so heads/faces are never sliced off when cropping vertical art to 1:1!
                const offsetY = cropFocus === 'top' ? (canvas.height - h) * 0.18 : (canvas.height - h) / 2;
                g.fillStyle = '#0a0d14';
                g.fillRect(0, 0, canvas.width, canvas.height);
                g.drawImage(img, offsetX, offsetY, w, h);
            }
        } catch {
            drawGeometricCover(g, canvas.width, canvas.height, charName, accentHex);
        }
    } else {
        drawGeometricCover(g, canvas.width, canvas.height, charName, accentHex);
    }

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
}

function drawGeometricCover(g, w, h, charName, accent) {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0d131d');
    grad.addColorStop(1, '#070a10');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    g.strokeStyle = accent || '#1de9b6';
    g.lineWidth = 3;
    g.strokeRect(20, 20, w - 40, h - 40);
    g.lineWidth = 1;
    g.globalAlpha = 0.45;
    g.strokeRect(32, 32, w - 64, h - 64);
    g.globalAlpha = 1;

    const cy = Math.round(h * 0.42);
    const r = Math.round(Math.min(w, h) * 0.14);
    g.beginPath();
    g.moveTo(w / 2, cy - r);
    g.lineTo(w / 2 + r, cy);
    g.lineTo(w / 2, cy + r);
    g.lineTo(w / 2 - r, cy);
    g.closePath();
    g.stroke();

    const initials = String(charName || 'NM')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0] || '')
        .join('')
        .toUpperCase() || 'NM';

    g.fillStyle = '#f1f5f9';
    g.font = '700 58px Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(initials, w / 2, cy);

    g.fillStyle = accent || '#1de9b6';
    g.font = '700 17px monospace';
    g.fillText('NEXUSMATCH // CARD V2', w / 2, h - 110);

    g.fillStyle = '#e2e8f0';
    g.font = '700 26px system-ui, sans-serif';
    g.fillText(String(charName || 'Unnamed').slice(0, 26), w / 2, h - 72);
}

export function embedCharaChunkIntoPng(pngBytes, cardObj) {
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
        if (pngBytes[i] !== sig[i]) throw new Error('Invalid PNG header');
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

    const fullChunk = new Uint8Array(12 + chunkData.length);
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

        if (type === 'tEXt') {
            const keyEnd = pngBytes.indexOf(0, offset + 8);
            if (keyEnd > offset + 8 && keyEnd < offset + 8 + 10) {
                const keyName = new TextDecoder().decode(pngBytes.subarray(offset + 8, keyEnd));
                if (keyName === 'chara' || keyName === 'ccv3') {
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

export async function buildCardPngBlob(card, accentHex = '#1de9b6', cropOpts = {}) {
    const v2 = buildV2CardObject(card);
    const rawPng = await ensurePngBytes(card.avatarDataUrl, v2.data.name, accentHex, cropOpts);
    const withMeta = embedCharaChunkIntoPng(rawPng, v2);
    return new Blob([withMeta], { type: 'image/png' });
}

export function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
    }, 800);
}

export async function importCardIntoTavern(card, { preserveAvatarFile = '', accentHex = '#1de9b6', aspectRatio = '1:1', cropFocus = 'top' } = {}) {
    if (!String(card.name || '').trim()) {
        throw new Error('Укажите название или имя перед сохранением в Таверну.');
    }
    const mod = await import('/script.js');
    const pngBlob = await buildCardPngBlob(card, accentHex, { aspectRatio, cropFocus });
    const safeSlug = String(card.name).trim().replace(/[\\/:*?"<>|]+/g, '_') || 'Character';
    const file = new File([pngBlob], `${safeSlug}.png`, { type: 'image/png' });

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('file_type', 'png');
    const ctx = window.SillyTavern?.getContext?.();
    formData.append('user_name', ctx?.name1 || 'User');
    if (preserveAvatarFile) {
        const cleanPreserved = String(preserveAvatarFile).replace(/\.png$/i, '');
        formData.append('preserved_name', cleanPreserved);
    }

    const res = await fetch('/api/characters/import', {
        method: 'POST',
        headers: mod.getRequestHeaders({ omitContentType: true }),
        body: formData,
        cache: 'no-cache',
    });
    if (!res.ok) {
        throw new Error(`Ошибка сохранения в Таверну (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (data?.error) throw new Error(String(data.error));

    if (typeof mod.getCharacters === 'function') await mod.getCharacters();
    else if (typeof ctx?.getCharacters === 'function') await ctx.getCharacters();
    return data?.file_name ? `${data.file_name}.png` : `${safeSlug}.png`;
}

export async function fetchTavernRosterAndWorlds() {
    const mod = await import('/script.js');
    const wiMod = await import('/scripts/world-info.js').catch(() => ({}));
    let characters = [];
    try {
        const r = await fetch('/api/characters/all', {
            method: 'POST',
            headers: mod.getRequestHeaders(),
            body: JSON.stringify({}),
        });
        if (r.ok) characters = await r.json();
    } catch {
        characters = window.SillyTavern?.getContext?.()?.characters || [];
    }
    const worlds = Array.isArray(wiMod.world_names) ? [...wiMod.world_names] : [];
    return { characters: Array.isArray(characters) ? characters : [], worlds };
}

export async function urlToDataUrl(url, signal = null) {
    const res = await fetch(url, { cache: 'no-cache', signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ''));
        fr.onerror = reject;
        fr.readAsDataURL(blob);
    });
}

export function detectPocketCodex() {
    const hasDom = Boolean(document.getElementById('pcx-sendbar-btn') || document.getElementById('pcx-dialog'));
    const ctx = window.SillyTavern?.getContext?.();
    const disabled = ctx?.extensionSettings?.disabledExtensions || [];
    const isOff = disabled.some((d) => String(d).includes('st-pocket-codex'));
    return hasDom && !isOff;
}

export function openPocketCodexForge() {
    const btn = document.getElementById('pcx-sendbar-btn');
    if (btn) {
        btn.click();
        setTimeout(() => {
            const forgeWing = document.querySelector('#pcx-window [data-wing="forge"], #pcx-window [data-mod="forge"], #pcx-mod-forge');
            if (forgeWing) forgeWing.click();
        }, 180);
        return true;
    }
    return false;
}

// ── UNIVERSAL INLINE IMAGE GENERATION ENGINE ──
const IMG_MARKERS = [
    'aspectRatio',
    'sendCharAvatar',
    'sendUserAvatar',
    'npcList',
    'npcReferences',
    'imageContextEnabled',
    'imageSize',
    'styles',
];

function resolveBucketModel(v) {
    if (!v) return '';
    if (v.apiType === 'novelai') {
        return String(v.novelaiModel === '__custom__' ? (v.novelaiCustomModel || '') : (v.novelaiModel || v.model || '')).trim();
    }
    if (v.apiType === 'naistera') {
        return String(v.naisteraModel || v.model || '').trim();
    }
    return String(v.model || v.naisteraModel || '').trim();
}

function isBucketReady(v) {
    if (!v || typeof v !== 'object') return false;
    if (v.apiType === 'a1111') return Boolean(v.endpoint);
    return Boolean(v.apiKey && resolveBucketModel(v) && (v.endpoint || v.apiType === 'naistera' || v.apiType === 'openrouter' || v.apiType === 'xai'));
}

export function listImageExtensionBuckets() {
    const out = [];
    const ctx = window.SillyTavern?.getContext?.();
    const all = ctx?.extensionSettings || {};
    for (const key of Object.keys(all)) {
        const v = all[key];
        if (!v || typeof v !== 'object') continue;
        if (typeof v.endpoint !== 'string' && typeof v.apiType !== 'string') continue;
        if (!IMG_MARKERS.some((m) => m in v)) continue;
        out.push({
            key,
            ready: isBucketReady(v),
            model: resolveBucketModel(v),
            apiType: v.apiType || '',
            extAspectRatio: v.aspectRatio || v.naisteraAspectRatio || '1:1',
            profiles: (Array.isArray(v.connectionProfiles) ? v.connectionProfiles : [])
                .filter((p) => p && p.id)
                .map((p) => ({ id: p.id, name: p.name || p.id, model: resolveBucketModel(p), apiType: p.apiType || v.apiType || '' })),
            styles: (Array.isArray(v.styles) ? v.styles : [])
                .filter((s) => s && s.id)
                .map((s) => ({ id: s.id, name: s.name || s.id })),
        });
    }
    return out;
}

function pickEffectiveBucket(sourcePref = 'auto') {
    const ctx = window.SillyTavern?.getContext?.();
    const all = ctx?.extensionSettings || {};
    if (sourcePref && sourcePref !== 'auto' && sourcePref !== 'iig' && sourcePref !== 'st_sd' && sourcePref !== 'off') {
        if (all[sourcePref] && typeof all[sourcePref] === 'object') {
            return { key: sourcePref, cfg: all[sourcePref] };
        }
    }
    const buckets = listImageExtensionBuckets();
    const readyOne = buckets.find((b) => b.ready) || buckets[0];
    if (readyOne && all[readyOne.key]) {
        return { key: readyOne.key, cfg: all[readyOne.key] };
    }
    return null;
}

export function detectImageExtensions() {
    const ctx = window.SillyTavern?.getContext?.();
    const ext = ctx?.extensionSettings || {};
    const disabled = ext.disabledExtensions || [];
    const buckets = listImageExtensionBuckets();
    const hasIig = buckets.some((b) => b.ready);
    const sdCfg = ext.sd || {};
    const hasStSd = Boolean(!disabled.includes('sd') && sdCfg.source && sdCfg.model);

    return {
        hasAny: hasIig || hasStSd,
        hasIig,
        hasStSd,
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

function isNonRetryableArtError(err) {
    const msg = String(err?.message || err || '');
    if (/остановлена|aborted|AbortError/i.test(msg)) return true;
    if (/HTTP (?:401|402|403|404)\b/i.test(msg)) return true;
    if (/SAFETY|PROHIBITED|BLOCKED|не заполнены URL|отключена|не настроен|пуст/i.test(msg)) return true;
    return false;
}

export async function generateCharacterPortrait(visualPrompt, options = {}) {
    const cleanPrompt = String(visualPrompt || '').trim();
    if (!cleanPrompt) throw new Error('Промпт изображения пуст.');

    const sourcePref = typeof options === 'string' ? options : (options.imageSource || 'auto');
    const profileId = typeof options === 'object' ? (options.imageProfileId || '') : '';
    const styleId = typeof options === 'object' ? (options.imageStyleId || '') : '';
    const aspect = typeof options === 'object' && options.aspectRatio ? options.aspectRatio : '1:1';
    const signal = typeof options === 'object' ? (options.signal || null) : null;
    const maxAttempts = typeof options === 'object' && Number(options.maxAttempts) > 0 ? Number(options.maxAttempts) : 3;
    const onStatus = typeof options === 'object' && typeof options.onStatus === 'function' ? options.onStatus : null;

    const emit = (stage, detail = '', attempt = 1, providerLabel = '') => {
        if (!onStatus) return;
        try {
            onStatus({ stage, detail, attempt, maxAttempts, providerLabel });
        } catch {}
    };

    if (sourcePref === 'off') {
        throw new Error('Генерация изображений отключена в настройках.');
    }

    if (sourcePref === 'st_sd') {
        emit('Генерация [Попытка 1/1]', 'Отправка команды в штатный генератор /sd Таверны...', 1, 'ST /sd');
        const ctx = window.SillyTavern?.getContext?.();
        if (typeof ctx?.executeSlashCommandsWithOptions !== 'function') {
            throw new Error('Штатная команда /sd недоступна.');
        }
        const escaped = cleanPrompt.replace(/"/g, "'");
        const res = await ctx.executeSlashCommandsWithOptions(`/sd quiet=true "${escaped}"`);
        const outUrl = String(res?.pipe || res || '').trim();
        if (!outUrl || (!outUrl.startsWith('data:') && !outUrl.startsWith('/') && !outUrl.startsWith('http'))) {
            throw new Error('Штатный /sd не настроен. Выберите Inline Image Generation в шестерёнке настроек.');
        }
        emit('Обработка кадра', 'Загрузка и декодирование полученного изображения...', 1, 'ST /sd');
        return outUrl.startsWith('data:') ? outUrl : await urlToDataUrl(outUrl, signal);
    }

    emit('Подготовка генерации', 'Чтение профиля и стиля расширения картинок...', 1, '');

    const picked = pickEffectiveBucket(sourcePref);
    if (!picked) {
        throw new Error('Не найдено настроенное расширение картинок.');
    }

    const cfgBase = picked.cfg;
    const profiles = Array.isArray(cfgBase.connectionProfiles) ? cfgBase.connectionProfiles : [];
    const wantedProfId = profileId || cfgBase.activeConnectionProfileId || '';
    const profObj = profiles.find((p) => p && p.id === wantedProfId) || null;
    const imgCfg = profObj
        ? {
            ...cfgBase,
            ...Object.fromEntries(
                Object.entries(profObj).filter(([k, v]) => k !== 'id' && k !== 'name' && v !== undefined && v !== '')
            ),
        }
        : { ...cfgBase };

    const isPollinations = imgCfg.apiType === 'pollinations' || /pollinations\.ai/i.test(String(imgCfg.endpoint || ''));
    if (!isPollinations && !isBucketReady(imgCfg)) {
        throw new Error(`В настройках ${picked.key} не заполнены URL, ключ или модель.`);
    }

    const model = resolveBucketModel(imgCfg);
    const rawEndpointFlag = Boolean(imgCfg.rawEndpoint);
    const endpoint = String(imgCfg.endpoint || '').trim().replace(/\/+$/, '');
    const providerLabel = [imgCfg.apiType || picked.key, model ? String(model).split('/').pop() : ''].filter(Boolean).join(' · ');

    let styleText = '';
    if (styleId !== '__none__') {
        const stylesArr = Array.isArray(imgCfg.styles) ? imgCfg.styles : [];
        const chosenStyle = (styleId && stylesArr.find((s) => s && s.id === styleId))
            || stylesArr.find((s) => s && s.id === imgCfg.activeStyleId);
        styleText = String(chosenStyle?.value ?? chosenStyle?.style ?? chosenStyle?.promptPrefix ?? '').trim();
        if (!styleText && !styleId && imgCfg.slayStyle) {
            styleText = String(imgCfg.slayStyle).trim();
        }
    }
    const fullPrompt = styleText ? `[STYLE: ${styleText}]\n\n${cleanPrompt}` : cleanPrompt;

    const executeSingleAttempt = async (attemptNum) => {
        const stagePrefix = attemptNum === 1
            ? `Генерация [Попытка 1/${maxAttempts}]`
            : `Повтор генерации [Попытка ${attemptNum}/${maxAttempts}]`;

        emit(stagePrefix, `Отправка запроса в ${providerLabel || 'API'} (${aspect})...`, attemptNum, providerLabel);

        // 0. POLLINATIONS
        if (isPollinations) {
            const dims = getTargetCanvasDimensions(aspect);
            const pModel = model || 'flux';
            const seed = Math.floor(Math.random() * 1000000);
            const pUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${dims.width}&height=${dims.height}&model=${encodeURIComponent(pModel)}&seed=${seed}&nologo=true`;
            emit(stagePrefix, `Ожидание рендера Pollinations (${pModel})...`, attemptNum, providerLabel);
            return await urlToDataUrl(pUrl, signal);
        }

        // 1. NAISTERA
        if (imgCfg.apiType === 'naistera') {
            const base = endpoint || 'https://naistera.org';
            const url = rawEndpointFlag ? base : (base.endsWith('/api/generate') ? base : `${base}/api/generate`);
            const body = { prompt: fullPrompt, model: model || undefined };
            if (aspect !== 'native') body.aspect_ratio = aspect;
            else if (imgCfg.naisteraAspectRatio) body.aspect_ratio = imgCfg.naisteraAspectRatio;
            if (imgCfg.naisteraPreset) body.preset = imgCfg.naisteraPreset;

            const resp = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${imgCfg.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal,
            });
            if (!resp.ok) throw new Error(`Naistera HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}`);
            const j = await resp.json();
            if (j?.data_url) {
                emit('Декодирование арта', 'Получен готовый кадр от Naistera...', attemptNum, providerLabel);
                return String(j.data_url);
            }
            if (j?.job_id) {
                const jobBase = base.replace(/\/api\/generate$/i, '');
                for (let poll = 1; poll <= 30; poll++) {
                    await sleepAbortable(1500, signal);
                    emit(stagePrefix, `Очередь Naistera · проверка готовности #${poll}...`, attemptNum, providerLabel);
                    const jr = await fetch(`${jobBase}/api/jobs/${encodeURIComponent(j.job_id)}`, {
                        headers: { Authorization: `Bearer ${imgCfg.apiKey}` },
                        signal,
                    });
                    if (!jr.ok) throw new Error(`Naistera job HTTP ${jr.status}`);
                    const jd = await jr.json();
                    if (jd?.data_url) return String(jd.data_url);
                    if (String(jd?.status || '').toLowerCase() === 'failed' || jd?.error) {
                        throw new Error(`Naistera: ${jd.error || 'ошибка рендера'}`);
                    }
                }
            }
            throw new Error('Naistera не вернула изображение.');
        }

        // 2. A1111
        if (imgCfg.apiType === 'a1111') {
            const url = rawEndpointFlag ? endpoint : `${endpoint}/sdapi/v1/txt2img`;
            const dims = getTargetCanvasDimensions(aspect);
            const headers = { 'Content-Type': 'application/json' };
            if (imgCfg.apiKey) headers.Authorization = `Bearer ${imgCfg.apiKey}`;
            const resp = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt: imgCfg.a1111PromptPrefix ? `${imgCfg.a1111PromptPrefix}, ${fullPrompt}` : fullPrompt,
                    negative_prompt: imgCfg.a1111NegativePrompt || '',
                    width: dims.width,
                    height: dims.height,
                    steps: Number(imgCfg.a1111Steps) || 24,
                    cfg_scale: Number(imgCfg.a1111CfgScale) || 7,
                }),
                signal,
            });
            if (!resp.ok) throw new Error(`A1111 HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}`);
            emit('Декодирование арта', 'Чтение ответа локального SD / Forge...', attemptNum, providerLabel);
            const j = await resp.json();
            if (!j?.images?.[0]) throw new Error('A1111 не вернул изображение.');
            return `data:image/png;base64,${j.images[0]}`;
        }

        // 3. OPENROUTER
        if (imgCfg.apiType === 'openrouter' || /openrouter\.ai/i.test(endpoint)) {
            const base = (endpoint || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
            const url = rawEndpointFlag ? base : (base.endsWith('/chat/completions') ? base : `${base}/chat/completions`);
            const isGeminiOrText = /gemini|gpt|banana/i.test(model);
            const sendOpenRouter = async (withAspect) => {
                const payload = {
                    model,
                    messages: [{ role: 'user', content: fullPrompt }],
                    modalities: isGeminiOrText ? ['image', 'text'] : ['image'],
                };
                if (withAspect && aspect !== 'native') {
                    payload.image_config = { aspect_ratio: aspect };
                }
                return await fetch(url, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${imgCfg.apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal,
                });
            };

            let resp = await sendOpenRouter(aspect !== 'native');
            if (!resp.ok && aspect !== 'native' && [400, 404, 422].includes(resp.status)) {
                emit(stagePrefix, 'Модель не принимает image_config · повтор в родном формате модели...', attemptNum, providerLabel);
                resp = await sendOpenRouter(false);
            }
            if (!resp.ok) throw new Error(`OpenRouter HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}`);
            emit('Декодирование арта', 'Загрузка изображения из ответа OpenRouter...', attemptNum, providerLabel);
            const j = await resp.json();
            const msg = j?.choices?.[0]?.message;
            const imgObj = msg?.images?.[0];
            const imgUrl = imgObj?.image_url?.url
                || imgObj?.data_url
                || (imgObj?.b64_json ? `data:${imgObj?.media_type || 'image/png'};base64,${imgObj.b64_json}` : '')
                || imgObj?.url;
            if (imgUrl) return imgUrl.startsWith('data:') ? imgUrl : await urlToDataUrl(imgUrl, signal);
            throw new Error('OpenRouter не вернул картинку.');
        }

        // 4. GEMINI / NANO-BANANA
        const isGemini = imgCfg.apiType === 'gemini'
            || /gemini|banana|imagen/i.test(String(model))
            || /google-ai/i.test(endpoint);

        if (isGemini) {
            const pathModel = String(model).includes('/') ? String(model).slice(String(model).indexOf('/') + 1) : String(model);
            const baseClean = endpoint.replace(/\/v1beta$/i, '');
            const url = rawEndpointFlag
                ? endpoint
                : `${baseClean}/v1beta/models/${encodeURIComponent(pathModel)}:generateContent`;

            const headers = {
                Authorization: `Bearer ${imgCfg.apiKey}`,
                'Content-Type': 'application/json',
            };
            if (/googleapis\.com/i.test(url)) headers['x-goog-api-key'] = imgCfg.apiKey;

            const sendGemini = async (withImageCfg) => {
                const genCfg = { responseModalities: ['TEXT', 'IMAGE'] };
                if (withImageCfg && aspect !== 'native') {
                    genCfg.imageConfig = { aspectRatio: aspect };
                    if (imgCfg.imageSize && /^(1K|2K|4K)$/i.test(String(imgCfg.imageSize))) {
                        genCfg.imageConfig.imageSize = String(imgCfg.imageSize).toUpperCase();
                    }
                }
                return await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                        generationConfig: genCfg,
                    }),
                    signal,
                });
            };

            let resp = await sendGemini(aspect !== 'native');
            if (!resp.ok && aspect !== 'native' && [400, 404, 422].includes(resp.status)) {
                emit(stagePrefix, 'Модель не принимает imageConfig · повтор в родном формате модели...', attemptNum, providerLabel);
                resp = await sendGemini(false);
            }
            if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}`);

            emit('Декодирование арта', 'Извлечение кадра из ответа Gemini...', attemptNum, providerLabel);
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
                `Модель не вернула фото` +
                (blockReason ? ` (${blockReason})` : '') +
                (textPart ? `: ${textPart.slice(0, 90)}` : '')
            );
        }

        // 5. OPENAI-COMPATIBLE / XAI / ELECTRONHUB (1:1 parity with sillyimages OpenAIProvider!)
        const defaultBase = imgCfg.apiType === 'xai' ? 'https://api.x.ai' : 'https://api.openai.com';
        const oaBase = (endpoint || defaultBase)
            .replace(/\/compatible$/i, '')
            .replace(/\/v1\/images\/generations$/i, '')
            .replace(/\/images\/generations$/i, '')
            .replace(/\/v1$/i, '');
        const oaUrl = rawEndpointFlag ? endpoint : `${oaBase}/v1/images/generations`;

        const mLow = String(model || '').toLowerCase();
        const isGptImg = mLow.includes('gpt-image');
        const isDalle3 = mLow.includes('dall-e-3');
        const isDalle2 = mLow.includes('dall-e-2');

        // Exact sillyimages aspectRatioToSize rule:
        // Only map aspect->size for families with documented OpenAI size tables (gpt-image*, dall-e-3, dall-e-2).
        // For xAI / Grok / Flux / custom proxy models, NEVER force unsupported OpenAI dimensions — use profile's imgCfg.size!
        let resolvedSize = '';
        if (aspect !== 'native') {
            if (isGptImg) {
                resolvedSize = aspect === '1:1' ? '1024x1024'
                    : (aspect === '2:3' || aspect === '3:4') ? '1024x1536'
                    : '1536x1024';
            } else if (isDalle3) {
                resolvedSize = aspect === '1:1' ? '1024x1024'
                    : (aspect === '2:3' || aspect === '3:4') ? '1024x1792'
                    : '1792x1024';
            } else if (isDalle2) {
                resolvedSize = '1024x1024';
            }
        }
        if (!resolvedSize && imgCfg.size) {
            resolvedSize = String(imgCfg.size).trim();
        }

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

        const sendOpenAiCompat = async (minimalFallback = false) => {
            const body = { model, prompt: fullPrompt, n: 1 };
            if (!minimalFallback) {
                if (imgCfg.apiType === 'xai') {
                    if (aspect !== 'native') body.aspect_ratio = aspect;
                } else {
                    if (resolvedSize) body.size = resolvedSize;
                    if (resolvedQuality) body.quality = resolvedQuality;
                }
            }
            // CRITICAL FIX: Always send response_format: 'b64_json' for Grok / xAI / non-gpt-image models (just like sillyimages!),
            // otherwise xAI returns a temporary CDN URL that 404s when fetched from browser/proxy!
            if (!isGptImg) {
                body.response_format = 'b64_json';
            } else {
                body.moderation = 'low';
            }

            return await fetch(oaUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${imgCfg.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal,
            });
        };

        let resp = await sendOpenAiCompat(false);
        // Automatic self-healing fallback if model/proxy rejects size, quality, or aspect_ratio (400 / 404 / 422)!
        if (!resp.ok && [400, 404, 422].includes(resp.status)) {
            emit(stagePrefix, 'Модель не принимает заданный размер · повтор в родном формате модели...', attemptNum, providerLabel);
            resp = await sendOpenAiCompat(true);
        }
        if (!resp.ok) throw new Error(`Image API HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}`);

        emit('Декодирование арта', 'Распаковка сгенерированного кадра...', attemptNum, providerLabel);
        const j = await resp.json();
        const d = j?.data?.[0];
        if (d?.b64_json) {
            const mime = String(d.b64_json).startsWith('/9j/') ? 'image/jpeg' : 'image/png';
            return `data:${mime};base64,${d.b64_json}`;
        }
        if (d?.url || j?.url) return await urlToDataUrl(d?.url || j?.url, signal);
        throw new Error('Image API не вернул картинку.');
    };

    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (signal?.aborted) throw new Error('Генерация остановлена.');
        try {
            const outDataUrl = await executeSingleAttempt(attempt);
            emit('Готово', 'Изображение успешно получено!', attempt, providerLabel);
            return outDataUrl;
        } catch (err) {
            lastErr = err;
            if (attempt >= maxAttempts || isNonRetryableArtError(err)) {
                throw err;
            }
            const shortErr = String(err?.message || err).slice(0, 80);
            const waitSec = attempt === 1 ? 2 : 3;
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
}

// Build ephemeral message array sending the ENTIRE active SillyTavern preset around the 'chatHistory' slot!
// Preserves ALL user-enabled preset blocks and trailing whitespace-only blocks ("\n") byte-for-byte WITHOUT .trim()!
function buildPresetAlignedMessages(ctx, userTaskContent, systemPrompt = '', presetCorrectionPrompt = '') {
    const oai = ctx?.chatCompletionSettings || {};
    const prompts = Array.isArray(oai.prompts) ? oai.prompts : [];
    const byId = new Map(prompts.map((p) => [p?.identifier, p]));
    const orderEntry = Array.isArray(oai.prompt_order)
        ? (oai.prompt_order.find((o) => o?.character_id === 100001) || oai.prompt_order[0])
        : null;
    const orderList = Array.isArray(orderEntry?.order) ? orderEntry.order.filter((x) => x?.enabled) : [];

    const chatIdx = orderList.findIndex((x) => x.identifier === 'chatHistory');
    const messages = [];

    // Skip only runtime dynamic chat/character/world placeholders so an unrelated background chat never leaks into card creation
    const DYNAMIC_SLOTS = new Set([
        'worldInfoBefore', 'worldInfoAfter', 'charDescription', 'charPersonality',
        'scenario', 'personaDescription', 'dialogueExamples', 'chatHistory', 'enhanceDefinitions',
    ]);

    const correctionClean = String(presetCorrectionPrompt || '').trim();
    const finalUserTask = correctionClean
        ? `${userTaskContent}\n\n${correctionClean}`
        : userTaskContent;

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    if (chatIdx === -1) {
        // Fallback if custom preset has no explicit chatHistory marker: send ALL enabled preset blocks, then user task, then prefill
        for (const item of orderList) {
            if (DYNAMIC_SLOTS.has(item.identifier)) continue;
            const p = byId.get(item.identifier);
            if (!p || typeof p.content !== 'string' || p.content.length === 0) continue;
            messages.push({ role: p.role || 'system', content: p.content });
        }
        messages.push({ role: 'user', content: finalUserTask });
        if (oai.assistant_prefill && String(oai.assistant_prefill).length > 0) {
            messages.push({ role: 'assistant', content: String(oai.assistant_prefill) });
        }
        return messages;
    }

    // 1. BEFORE chatHistory: send ALL enabled static preset blocks in exact user order!
    for (let i = 0; i < chatIdx; i++) {
        const id = orderList[i].identifier;
        if (DYNAMIC_SLOTS.has(id)) continue;
        const p = byId.get(id);
        if (!p || typeof p.content !== 'string' || p.content.length === 0) continue;
        messages.push({ role: p.role || 'system', content: p.content });
    }

    // 2. AT chatHistory slot: inject our ephemeral User request + Correction Note (NEVER saved into ST chat!)
    messages.push({ role: 'user', content: finalUserTask });

    // 3. AFTER chatHistory: send ALL enabled post-history blocks in exact user order (preserving prefill & "\n" 100% intact!)
    if (chatIdx < orderList.length - 1) {
        for (let i = chatIdx + 1; i < orderList.length; i++) {
            const id = orderList[i].identifier;
            if (DYNAMIC_SLOTS.has(id)) continue;
            const p = byId.get(id);
            if (!p || typeof p.content !== 'string' || p.content.length === 0) continue;
            messages.push({ role: p.role || 'user', content: p.content });
        }
    } else if (oai.assistant_prefill && String(oai.assistant_prefill).length > 0) {
        messages.push({ role: 'assistant', content: String(oai.assistant_prefill) });
    }

    return messages;
}

// Extract reasoning ("думалка") across all providers (Google Makersuite/Vertex thought parts, OpenRouter, DeepSeek, Claude, <think> tags)
async function extractUniversalReasoningAndText(data, rawFallbackText = '') {
    let text = rawFallbackText;
    let reasoning = '';

    try {
        const scriptMod = await import('/script.js');
        const reasonMod = await import('/scripts/reasoning.js').catch(() => ({}));
        if (data && typeof data === 'object') {
            if (typeof scriptMod.extractMessageFromData === 'function') {
                text = String(scriptMod.extractMessageFromData(data) || '');
            }
            if (typeof reasonMod.extractReasoningFromData === 'function') {
                reasoning = String(reasonMod.extractReasoningFromData(data, { ignoreShowThoughts: true }) || '');
            }
            // Direct check for Gemini / proxy responseContent.parts[].thought or choices[0].message.reasoning_content
            if (!reasoning) {
                const gParts = data?.responseContent?.parts || data?.candidates?.[0]?.content?.parts || [];
                const thoughtParts = gParts.filter((pt) => pt && pt.thought && pt.text).map((pt) => pt.text);
                if (thoughtParts.length) reasoning = thoughtParts.join('\n\n');
            }
            if (!reasoning) {
                reasoning = String(
                    data?.choices?.[0]?.message?.reasoning_content
                    || data?.choices?.[0]?.message?.reasoning
                    || data?.thinking
                    || ''
                );
            }
        }
    } catch (e) {
        console.warn('[NexusMatch Forge] Reasoning extraction warning:', e);
    }

    // Also capture inline <think>...</think> or <thought>...</thought> if model emitted tags inside content
    const inlineMatches = [...String(text || '').matchAll(/<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/gi)];
    if (inlineMatches.length > 0) {
        const inlineTxt = inlineMatches.map((m) => m[1].trim()).filter(Boolean).join('\n\n');
        if (inlineTxt && !reasoning.includes(inlineTxt)) {
            reasoning = [reasoning, inlineTxt].filter(Boolean).join('\n\n');
        }
    }

    return { text: String(text || ''), reasoning: String(reasoning || '').trim() };
}

// Stores latest model reasoning so UI can display it in a clean collapsible drawer
export let lastGenerationReasoning = '';

export function abortTavernTextGeneration() {
    try {
        const ctx = window.SillyTavern?.getContext?.();
        if (typeof ctx?.stopGeneration === 'function') {
            ctx.stopGeneration();
            return;
        }
        const ev = ctx?.eventTypes?.GENERATION_STOPPED || ctx?.event_types?.GENERATION_STOPPED || 'generation_stopped';
        ctx?.eventSource?.emit?.(ev);
    } catch (e) {
        console.warn('[NexusMatch Forge] stopGeneration warning:', e);
    }
}

export async function runLlmGeneration({ system = '', user = '', transportMode = 'prefill_user_msg', presetCorrectionPrompt = '', signal = null }) {
    const ctx = window.SillyTavern?.getContext?.();
    if (!ctx) throw new Error('Контекст SillyTavern ещё не готов.');

    const scriptMod = await import('/script.js').catch(() => ({}));
    const rawDataFn = scriptMod.generateRawData;
    const rawFn = ctx.generateRaw || scriptMod.generateRaw;

    if (typeof rawDataFn !== 'function' && typeof rawFn !== 'function') {
        throw new Error('API генерации SillyTavern недоступно. Проверьте подключение модели.');
    }

    const onAbort = () => abortTavernTextGeneration();
    if (signal) {
        if (signal.aborted) {
            abortTavernTextGeneration();
            throw new Error('Генерация остановлена.');
        }
        signal.addEventListener('abort', onAbort, { once: true });
    }

    // Force include_reasoning: true ONLY for our single outgoing request via one-shot event listener (without mutating saved preset!)
    const readyEv = ctx?.eventTypes?.CHAT_COMPLETION_SETTINGS_READY || ctx?.event_types?.CHAT_COMPLETION_SETTINGS_READY || 'chat_completion_settings_ready';
    const forceReasoningHook = (genData) => {
        if (genData && typeof genData === 'object') {
            genData.include_reasoning = true;
        }
    };
    ctx?.eventSource?.on?.(readyEv, forceReasoningHook);

    try {
        const runPromise = (async () => {
            const promptPayload = transportMode === 'prefill_user_msg'
                ? buildPresetAlignedMessages(ctx, user, system, presetCorrectionPrompt)
                : user;
            const sysPayload = transportMode === 'prefill_user_msg' ? '' : system;

            if (typeof rawDataFn === 'function') {
                const data = await rawDataFn({
                    prompt: promptPayload,
                    api: ctx.mainApi || 'openai',
                    systemPrompt: sysPayload,
                    prefill: '',
                    instructOverride: false,
                    quietToLoud: false,
                });
                const { text, reasoning } = await extractUniversalReasoningAndText(data);
                lastGenerationReasoning = reasoning;
                return text;
            }

            const fallbackTxt = await rawFn({
                prompt: promptPayload,
                systemPrompt: sysPayload,
                prefill: '',
                instructOverride: false,
                quietToLoud: false,
            });
            const { text, reasoning } = await extractUniversalReasoningAndText(null, String(fallbackTxt || ''));
            lastGenerationReasoning = reasoning;
            return text;
        })();

        if (!signal) return await runPromise;

        return await Promise.race([
            runPromise,
            new Promise((_, reject) => {
                signal.addEventListener('abort', () => reject(new Error('Генерация остановлена пользователем.')), { once: true });
            }),
        ]);
    } finally {
        ctx?.eventSource?.removeListener?.(readyEv, forceReasoningHook);
        if (signal) signal.removeEventListener('abort', onAbort);
    }
}
