// ============================================================================
// NEXUSMATCH FORGE — SIMPLE LANGUAGE SCENARIOS, SMART TAG AUTOCOMPLETE LIBRARY
// & BILINGUAL PRESET EXAMPLE SESSIONS (ZERO EMOJIS IN CODE)
// ============================================================================

export const MAX_USER_TAG_LIBRARY = 300;

export const SIMPLE_LANGUAGE_SCENARIOS = Object.freeze([
    {
        id: 'all_my_lang',
        shortRu: 'Всё на моём языке',
        shortEn: 'All in My Language',
        titleRu: '1. Всё на моём языке (Проще всего)',
        titleEn: '1. Everything in My Language (Simplest)',
        explainRu: 'И анкета персонажа, и Первое сообщение, и доп. сцены сразу пишутся на вашем языке (или языке Таверны). Ничего переводить не нужно.',
        explainEn: 'Character description, First Message, and alt scenes are all written directly in your chosen language.',
    },
    {
        id: 'hybrid_tokens',
        shortRu: 'Гибрид (База EN + Сцена моя)',
        shortEn: 'Hybrid (EN Base + My Scene)',
        titleRu: '2. Гибрид: Описание на English + Сцена на моём языке',
        titleEn: '2. Hybrid: English Description + Scene in My Language',
        explainRu: 'Внутреннее досье пишется на English (экономит ~35–40% токенов памяти в чате), а Первое сообщение и ролевые сцены идут сразу на вашем языке!',
        explainEn: 'Internal card description uses English (saves ~35-40% context tokens), while First Message & scenes are in your language!',
    },
    {
        id: 'en_with_translation',
        shortRu: 'English + Перевод в Альте',
        shortEn: 'English + Translated Alt',
        titleRu: '3. Оригинал на English + Готовый перевод в Альте #1',
        titleEn: '3. Full English Card + Translated Greeting in Alt #1',
        explainRu: 'Вся карточка и 1-е сообщение пишутся на English, а во 2-е приветствие (Альт #1) ИИ автоматически кладёт литературный перевод 1-й сцены на ваш язык.',
        explainEn: 'Full card and 1st scene are in English, and AI automatically places a literary translation into your language in Alt Greeting #1.',
    },
]);

export function resolveSimpleLangScenarioId(intake = {}) {
    const userLang = String(intake?.userLanguage || '{{language}}').trim() || '{{language}}';
    const cardLang = String(intake?.cardLanguage || '{{language}}').trim() || '{{language}}';
    const fmLang = String(intake?.firstMesLanguage || 'same_as_card').trim() || 'same_as_card';
    const altCnt = Number(intake?.altGreetingsCount ?? 1);
    const firstAlt = String(intake?.altGreetingLangs?.[0] || '').trim();

    if (
        cardLang === 'Описание EN + Сцена {{language}}'
        || (cardLang === 'English' && (fmLang === 'target_user_lang' || fmLang === userLang) && userLang !== 'English')
    ) {
        return 'hybrid_tokens';
    }
    if (
        cardLang === 'English'
        && (fmLang === 'same_as_card' || fmLang === 'English')
        && altCnt >= 1
        && (firstAlt === 'target_user_translate' || firstAlt.endsWith('_translate'))
    ) {
        return 'en_with_translation';
    }
    const cardMatchesUser = cardLang === 'same_as_user' || cardLang === userLang;
    const fmMatchesUser = fmLang === 'same_as_card' || fmLang === 'target_user_lang' || fmLang === userLang;
    if (cardMatchesUser && fmMatchesUser) {
        return 'all_my_lang';
    }
    return 'custom_mix';
}

export function applySimpleLangScenario(intake, scenarioId) {
    if (!intake || typeof intake !== 'object') return;
    const curUserLang = String(intake.userLanguage || '{{language}}').trim() || '{{language}}';
    const curAltCnt = Number.isFinite(Number(intake.altGreetingsCount))
        ? Math.max(0, Math.min(4, Math.round(Number(intake.altGreetingsCount))))
        : 1;

    if (scenarioId === 'hybrid_tokens') {
        intake.cardLanguage = 'English';
        intake.firstMesLanguage = 'target_user_lang';
        intake.altGreetingLangs = Array.from({ length: Math.max(1, curAltCnt) }, () => 'target_user_scene');
        return;
    }

    if (scenarioId === 'en_with_translation') {
        intake.cardLanguage = 'English';
        intake.firstMesLanguage = 'English';
        if (curAltCnt === 0) intake.altGreetingsCount = 1;
        const nextCnt = Math.max(1, Number(intake.altGreetingsCount) || 1);
        intake.altGreetingLangs = Array.from(
            { length: nextCnt },
            (_, idx) => (idx === 0 ? 'target_user_translate' : 'same_as_card'),
        );
        return;
    }

    // Default: 'all_my_lang'
    intake.cardLanguage = curUserLang;
    intake.firstMesLanguage = 'same_as_card';
    intake.altGreetingLangs = Array.from({ length: Math.max(1, curAltCnt) }, () => 'same_as_card');
}

// ============================================================================
// SEMANTIC BILINGUAL TAG CLUSTERS + USER SAVED TAG LIBRARY & AUTOCOMPLETE
// ============================================================================

export const BUILTIN_SEMANTIC_TAG_CLUSTERS = Object.freeze([
    {
        id: 'close_bonds',
        category: 'vibe',
        ru: ['старший брат', 'сводный брат', 'лучший друг брата', 'друг детства', 'сосед по комнате', 'живут под одной крышей', 'опекун', 'наставник', 'телохранитель', 'бывший возлюбленный', 'семейная тайна', 'гиперопека'],
        en: ['older brother', 'stepbrother', 'brother\'s best friend', 'childhood friend', 'roommate', 'living under one roof', 'guardian', 'mentor', 'bodyguard', 'ex-lover', 'family secret', 'overprotective'],
    },
    {
        id: 'power_roles',
        category: 'vibe',
        ru: ['босс мафии', 'глава синдиката', 'генеральный директор', 'постарше', 'богатый наследник', 'частный детектив', 'хирург', 'профессор', 'наёмник', 'капитан стражи', 'инквизитор', 'рыцарь-отступник', 'контрабандист'],
        en: ['mafia boss', 'syndicate leader', 'billionaire CEO', 'older man', 'wealthy heir', 'private detective', 'surgeon', 'professor', 'mercenary', 'captain of the guard', 'inquisitor', 'fallen knight', 'smuggler'],
    },
    {
        id: 'personality_heat',
        category: 'vibe',
        ru: ['холодный снаружи', 'собственник', 'ревнивый', 'спокойная доминация', 'сухая ирония', 'мягкий только со мной', 'тайная одержимость', 'сдержанная страсть', 'дерзкий и нахальный', 'заботливый в деле', 'острый ум', 'опасное обаяние'],
        en: ['cold exterior', 'possessive', 'jealous', 'calm dominance', 'dry wit', 'soft only for user', 'secret obsession', 'restrained passion', 'cocky & teasing', 'acts of service', 'sharp mind', 'dangerous charm'],
    },
    {
        id: 'chemistry_tropes',
        category: 'vibe',
        ru: ['от ненависти до любви', 'запретная связь', 'разница в возрасте', 'разница в статусе', 'фиктивный брак', 'вынужденное сближение', 'медленный накал', 'одна кровать', 'ночной разговор', 'утешение после травмы', 'тайный роман', 'сделка с дьяволом'],
        en: ['enemies to lovers', 'forbidden romance', 'age gap', 'status gap', 'arranged marriage', 'forced proximity', 'slow burn', 'one bed trope', 'late night talks', 'hurt/comfort', 'secret relationship', 'deal with the devil'],
    },
    {
        id: 'visual_details',
        category: 'vibe',
        ru: ['высокий и плечистый', 'шрам на брови', 'татуировки на руках', 'строгий костюм-тройка', 'кожаные перчатки', 'тёмные кудри', 'пепельные волосы', 'очки в тонкой оправе', 'низкий бархатный голос', 'лёгкая щетина', 'перстень-печатка', 'расстёгнутый ворот'],
        en: ['tall & broad-shouldered', 'brow scar', 'forearm tattoos', 'tailored three-piece suit', 'leather gloves', 'dark curls', 'silver hair', 'thin-rimmed glasses', 'deep velvet voice', 'light stubble', 'signet ring', 'unbuttoned collar'],
    },
    {
        id: 'settings_worlds',
        category: 'vibe',
        ru: ['ночной мегаполис', 'дождь и неон', 'закрытый элитный клуб', 'мафия 1940-х', 'мрачное фэнтези', 'готический замок', 'закрытая академия', 'киберпанк', 'космическая станция', 'южный порт', 'пост-апокалипсис', 'викторианский нуар'],
        en: ['midnight metropolis', 'rain & neon', 'private lounge', '1940s noir mafia', 'dark fantasy', 'gothic castle', 'elite academy', 'cyberpunk', 'orbital station', 'coastal port', 'post-apocalyptic', 'victorian noir'],
    },
    {
        id: 'anti_tags_bans',
        category: 'ban',
        ru: ['борода', 'густые усы', 'грубость к игроку', 'измена', 'гарем', 'третий лишний', 'тюрьма', 'инфантильность', 'нытьё', 'клоунада', 'контроль действий игрока', 'клише альфача', 'бессмысленная жестокость', 'фурри'],
        en: ['full beard', 'thick mustache', 'rudeness to player', 'cheating / NTR', 'harem', 'love triangle', 'prison', 'childishness', 'whining', 'slapstick comedy', 'godmodding user', 'cringe alpha clichés', 'pointless cruelty', 'furry'],
    },
]);

export function normalizeTagString(raw = '') {
    return String(raw || '').replace(/\s+/g, ' ').trim();
}

export function splitInputIntoTags(rawText = '') {
    return String(rawText || '')
        .split(/[+,;\n]+/)
        .map((s) => normalizeTagString(s))
        .filter((s) => s.length >= 2 && s.length <= 48);
}

export function normalizeUserTagLibrary(rawArr) {
    if (!Array.isArray(rawArr)) return [];
    const seen = new Set();
    const out = [];
    for (const item of rawArr) {
        const clean = normalizeTagString(item);
        if (!clean || clean.length < 2 || clean.length > 48) continue;
        const key = clean.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(clean);
        if (out.length >= MAX_USER_TAG_LIBRARY) break;
    }
    return out;
}

export function harvestTagsIntoLibrary(rawTextOrArr, currentLibrary = []) {
    const incoming = Array.isArray(rawTextOrArr)
        ? rawTextOrArr.flatMap((x) => splitInputIntoTags(x))
        : splitInputIntoTags(rawTextOrArr);
    if (!incoming.length) return normalizeUserTagLibrary(currentLibrary);

    // Put newly used tags at the front so favorite/recent tags stay prioritized!
    return normalizeUserTagLibrary([...incoming, ...(Array.isArray(currentLibrary) ? currentLibrary : [])]);
}

function seededShuffle(items, seedNum = 1) {
    const arr = [...items];
    let s = (Math.abs(Math.round(Number(seedNum) || 1)) * 2654435761) >>> 0;
    if (s === 0) s = 1234567;
    for (let i = arr.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

export function extractActiveTypingTagFragment(rawInput = '') {
    const str = String(rawInput ?? '');
    const lastSepIdx = Math.max(str.lastIndexOf(','), str.lastIndexOf('+'), str.lastIndexOf(';'), str.lastIndexOf('\n'));
    const fragment = lastSepIdx >= 0 ? str.slice(lastSepIdx + 1) : str;
    return {
        prefixBeforeFragment: lastSepIdx >= 0 ? str.slice(0, lastSepIdx + 1) : '',
        separatorChar: lastSepIdx >= 0 ? str[lastSepIdx] : '',
        fragment: fragment.trim(),
    };
}

export function applyChosenTagToInputValue(currentValue = '', chosenTag = '', defaultSeparator = ', ') {
    const cleanTag = normalizeTagString(chosenTag);
    if (!cleanTag) return String(currentValue ?? '');
    const raw = String(currentValue ?? '');
    if (!raw.trim()) return cleanTag;

    const lastPlus = raw.lastIndexOf('+');
    const lastComma = raw.lastIndexOf(',');
    const lastSemi = raw.lastIndexOf(';');
    const lastIdx = Math.max(lastPlus, lastComma, lastSemi);

    if (lastIdx >= 0) {
        const sep = raw[lastIdx] === '+' ? ' + ' : ', ';
        const head = raw.slice(0, lastIdx).trimEnd();
        return head ? `${head}${sep}${cleanTag}${sep}` : `${cleanTag}${defaultSeparator}`;
    }

    // User was typing the very first word fragment -> replace fragment with chosenTag + separator so they can keep typing!
    const existingTags = splitInputIntoTags(raw).map((t) => t.toLowerCase());
    if (existingTags.includes(cleanTag.toLowerCase())) {
        return raw;
    }
    return `${cleanTag}${defaultSeparator}`;
}

export function getSessionRotatingTagSuggestions({
    seed = 1,
    category = 'vibe', // 'vibe' | 'ban'
    userLibrary = [],
    existingInput = '',
    lang = 'ru',
    limit = 7,
} = {}) {
    const isEnLang = lang === 'en';
    const alreadyUsed = new Set(splitInputIntoTags(existingInput).map((t) => t.toLowerCase()));
    const result = [];
    const seen = new Set();

    const pushItem = (tag, fromLibrary = false) => {
        const clean = normalizeTagString(tag);
        if (!clean) return;
        const low = clean.toLowerCase();
        if (alreadyUsed.has(low) || seen.has(low)) return;
        seen.add(low);
        result.push({ tag: clean, fromLibrary });
    };

    // 1. Mix up to 3 rotated personal saved tags from the user's library (for 'vibe' fields)
    if (category !== 'ban' && Array.isArray(userLibrary) && userLibrary.length > 0) {
        const shuffledUser = seededShuffle(userLibrary, seed + 17);
        for (const ut of shuffledUser.slice(0, 3)) {
            pushItem(ut, true);
        }
    }

    // 2. Fill remaining slots with session-seeded random tags from matching builtin clusters
    const clusters = BUILTIN_SEMANTIC_TAG_CLUSTERS.filter((c) => (category === 'ban' ? c.category === 'ban' : c.category !== 'ban'));
    const pool = clusters.flatMap((c) => (isEnLang ? c.en : c.ru));
    const shuffledPool = seededShuffle(pool, seed * 31 + (category === 'ban' ? 99 : 7));
    for (const bt of shuffledPool) {
        if (result.length >= limit) break;
        pushItem(bt, false);
    }

    return result.slice(0, limit);
}

export function getLiveSimilarTagSuggestions({
    rawInput = '',
    category = 'vibe',
    userLibrary = [],
    lang = 'ru',
    limit = 8,
} = {}) {
    const { fragment } = extractActiveTypingTagFragment(rawInput);
    const q = fragment.toLowerCase().trim();
    if (!q) return [];

    const isEnLang = lang === 'en';
    const alreadyUsed = new Set(
        splitInputIntoTags(rawInput)
            .map((t) => t.toLowerCase())
            .filter((t) => t !== q),
    );

    const directPrefix = [];
    const directSubstr = [];
    const semanticNeighbors = [];
    const seen = new Set();

    const consider = (bucket, tag, fromLibrary = false) => {
        const clean = normalizeTagString(tag);
        if (!clean) return;
        const low = clean.toLowerCase();
        if (low === q || alreadyUsed.has(low) || seen.has(low)) return;
        seen.add(low);
        bucket.push({ tag: clean, fromLibrary });
    };

    // 1. Search user's personal saved library first!
    for (const ut of (Array.isArray(userLibrary) ? userLibrary : [])) {
        const low = String(ut || '').toLowerCase();
        if (low.startsWith(q)) consider(directPrefix, ut, true);
        else if (low.includes(q)) consider(directSubstr, ut, true);
    }

    // 2. Search builtin bilingual clusters + collect semantic neighbor tags from any matched cluster!
    const matchedClusters = [];
    for (const cluster of BUILTIN_SEMANTIC_TAG_CLUSTERS) {
        const targetList = isEnLang ? cluster.en : cluster.ru;
        const altList = isEnLang ? cluster.ru : cluster.en;
        let clusterHit = false;

        targetList.forEach((tag, idx) => {
            const low = tag.toLowerCase();
            const altLow = String(altList[idx] || '').toLowerCase();
            const wordStarts = low.split(/[\s/-]+/).some((w) => w.startsWith(q)) || altLow.split(/[\s/-]+/).some((w) => w.startsWith(q));
            if (low.startsWith(q) || wordStarts) {
                consider(directPrefix, tag, false);
                clusterHit = true;
            } else if (low.includes(q) || altLow.includes(q)) {
                consider(directSubstr, tag, false);
                clusterHit = true;
            }
        });

        if (clusterHit) {
            matchedClusters.push(targetList);
        }
    }

    // 3. Add similar neighbor tags from matched semantic clusters ("похожие теги выскакивают как выбор!")
    for (const cList of matchedClusters) {
        for (const neighbor of cList) {
            consider(semanticNeighbors, neighbor, false);
        }
    }

    // Filter out ban-only cluster from vibe unless explicitly matched, or keep relevant
    return [...directPrefix, ...directSubstr, ...semanticNeighbors].slice(0, limit);
}

// ============================================================================
// READY-MADE BILINGUAL PRESET EXAMPLE SESSIONS (AUTO-TRANSLATED RU <-> EN)
// ============================================================================

export const PRESET_SESSION_TEMPLATES = Object.freeze([
    {
        id: 'preset_noir_syndicate',
        ru: {
            btnLabel: 'Пример: Босс Синдиката',
            btnSub: 'Нуар, опасная харизма и сделки',
            title: 'Пример: Босс Синдиката',
            originType: 'oc',
            genres: ['Мафия / Криминал', 'Романтика', 'Триллер / Детектив'],
            customGenres: 'нуар, закрытый клуб',
            settingEra: 'Ночной мегаполис, дождливые пентхаусы и теневой синдикат',
            favFandomHero: 'Томас Шелби, Силко',
            userRoleAndDesire: 'Случайный свидетель или должник, к которому холодный глава синдиката неожиданно проявляет личный интерес и защиту.',
            tropesWanted: 'спокойная доминация, собственник, сухая ирония, разница в статусе, мягкий только со мной',
            hardBans: 'клоунада, бессмысленная жестокость к игроку',
            tinderHint: 'харизматичный босс постарше со шрамом и безупречным костюмом',
            gachaTags: 'босс синдиката + шрам на брови + строгий костюм + сухая ирония + ночной дождь',
        },
        en: {
            btnLabel: 'Sample: Syndicate Boss',
            btnSub: 'Noir metropolis, danger & tension',
            title: 'Sample: Syndicate Boss',
            originType: 'oc',
            genres: ['Мафия / Криминал', 'Романтика', 'Триллер / Детектив'],
            customGenres: 'noir, private lounge',
            settingEra: 'Rain-drenched modern metropolis & underworld syndicate',
            favFandomHero: 'Thomas Shelby, Silco',
            userRoleAndDesire: 'An unexpected witness or debtor whom the ruthless syndicate boss takes under his personal protection.',
            tropesWanted: 'calm dominance, possessive, dry wit, status gap, soft only for user',
            hardBans: 'slapstick comedy, pointless cruelty to player',
            tinderHint: 'older charismatic syndicate boss with a scar and tailored suit',
            gachaTags: 'syndicate boss + brow scar + tailored suit + dry wit + midnight rain',
        },
    },
    {
        id: 'preset_close_tension',
        ru: {
            btnLabel: 'Пример: Под одной крышей',
            btnSub: 'Накал чувств, забота и ревность',
            title: 'Пример: Под одной крышей',
            originType: 'oc',
            genres: ['Романтика', 'Драма / Ангст', 'Повседневность'],
            customGenres: 'вынужденное соседство, медленный накал',
            settingEra: 'Современный город, просторная квартира на двоих',
            favFandomHero: '',
            userRoleAndDesire: 'Жизнь под одной крышей со старшим, властным и внешне сдержанным человеком, который слишком пристально следит за каждым моим шагом.',
            tropesWanted: 'живут под одной крышей, гиперопека, ревнивый, сдержанная страсть, ночной разговор',
            hardBans: 'измена, третий лишний, инфантильность',
            tinderHint: 'высокий, постарше, собственник, заботливый на деле',
            gachaTags: 'под одной крышей + постарше + ревнивый взгляд + сдержанная страсть + ночная кухня',
        },
        en: {
            btnLabel: 'Sample: Under One Roof',
            btnSub: 'Close quarters, jealousy & tension',
            title: 'Sample: Under One Roof',
            originType: 'oc',
            genres: ['Романтика', 'Драма / Ангст', 'Повседневность'],
            customGenres: 'forced proximity, slow burn',
            settingEra: 'Modern city, shared apartment with late-night tension',
            favFandomHero: '',
            userRoleAndDesire: 'Living under the same roof with an older, composed, fiercely protective figure whose restraint is starting to crack.',
            tropesWanted: 'living under one roof, overprotective, jealous, restrained passion, late night talks',
            hardBans: 'cheating, love triangle, childishness',
            tinderHint: 'tall, older, possessive, acts of service',
            gachaTags: 'under one roof + older + jealous gaze + restrained passion + midnight kitchen',
        },
    },
    {
        id: 'preset_dark_fantasy',
        ru: {
            btnLabel: 'Пример: Тёмное Фэнтези',
            btnSub: 'Рыцарь-отступник и древнее проклятие',
            title: 'Пример: Тёмное Фэнтези',
            originType: 'oc',
            genres: ['Тёмное фэнтези', 'Приключения', 'Мистика / Хоррор'],
            customGenres: 'готика, рыцарский орден',
            settingEra: 'Угасающее королевство, пепельные пустоши и древние цитадели',
            favFandomHero: 'Геральт, Мессмер, Астарион',
            userRoleAndDesire: 'Спутник опального рыцаря, связанный с ним опасной клятвой в мире, где магия требует плату.',
            tropesWanted: 'рыцарь-отступник, телохранитель, вынужденное сближение, шрамы, верность вопреки всему',
            hardBans: 'современный сленг, клоунада',
            tinderHint: 'мрачный мечник или инквизитор с тайным проклятием',
            gachaTags: 'рыцарь-отступник + серебряный клинок + пепел + верная клятва + готический замок',
        },
        en: {
            btnLabel: 'Sample: Dark Fantasy',
            btnSub: 'Fallen knight & ancient curse',
            title: 'Sample: Dark Fantasy',
            originType: 'oc',
            genres: ['Тёмное фэнтези', 'Приключения', 'Мистика / Хоррор'],
            customGenres: 'gothic, knightly order',
            settingEra: 'Dying kingdom, ash wastes, and ancient citadels',
            favFandomHero: 'Geralt, Messmer, Astarion',
            userRoleAndDesire: 'Bound by a perilous oath to a disgraced knight in a world where magic demands a toll.',
            tropesWanted: 'fallen knight, bodyguard, forced proximity, scars, fierce loyalty',
            hardBans: 'modern slang, slapstick comedy',
            tinderHint: 'brooding swordsman or inquisitor carrying a secret curse',
            gachaTags: 'fallen knight + silver blade + ash + unbroken oath + gothic citadel',
        },
    },
    {
        id: 'preset_rpg_master',
        ru: {
            btnLabel: 'Пример: РПГ-Мастер (Мир)',
            btnSub: 'Готовая настройка под систему и мир',
            title: 'Пример: РПГ-Песочница',
            originType: 'rpg_gm',
            cardFormat: 'rpg_gm_engine',
            greetingStyle: 'rpg_hud',
            greetingPov: 'second_gm',
            genres: ['Высокое фэнтези', 'Приключения', 'Детектив'],
            customGenres: 'живой мир, фракции, репутация',
            settingEra: 'Вольный портовый архипелаг контрабандистов, гильдий и древних руин',
            favFandomHero: 'Baldur\'s Gate 3, Disco Elysium',
            userRoleAndDesire: 'Игрок начинает с нуля в портовом городе, свободно выбирает ремесло, союзников и ввязывается в интриги фракций.',
            tropesWanted: 'живая экономика, последствия решений, колоритные НПС, скрытые тайны',
            hardBans: 'контроль действий игрока, рельсовый сюжет',
            tinderHint: 'необычный сеттинг с интригами фракций и системой репутации',
            gachaTags: 'вольный порт + гильдии наёмников + древние артефакты + живой мир',
        },
        en: {
            btnLabel: 'Sample: RPG Master (World)',
            btnSub: 'Pre-tuned for sandbox & GM system',
            title: 'Sample: RPG Sandbox',
            originType: 'rpg_gm',
            cardFormat: 'rpg_gm_engine',
            greetingStyle: 'rpg_hud',
            greetingPov: 'second_gm',
            genres: ['Высокое фэнтези', 'Приключения', 'Детектив'],
            customGenres: 'living world, factions, reputation',
            settingEra: 'Freeport archipelago of smugglers, mercenary guilds, and sunken ruins',
            favFandomHero: 'Baldur\'s Gate 3, Disco Elysium',
            userRoleAndDesire: 'Start from scratch in the port city, choose allies freely, and navigate faction intrigue with real consequences.',
            tropesWanted: 'living economy, meaningful consequences, vivid NPCs, hidden mysteries',
            hardBans: 'godmodding player actions, railroading',
            tinderHint: 'unique sandbox world with faction politics and reputation HUD',
            gachaTags: 'freeport archipelago + mercenary guilds + ancient relics + living world',
        },
    },
]);

export function populateSessionFromPresetTemplate(baseSession, templateId, uiLang = 'ru') {
    const tpl = PRESET_SESSION_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl || !baseSession) return baseSession;
    const loc = uiLang === 'en' ? tpl.en : tpl.ru;

    baseSession.presetTemplateId = tpl.id;
    baseSession.presetLangApplied = uiLang === 'en' ? 'en' : 'ru';
    baseSession.title = loc.title;

    baseSession.intake.originType = loc.originType || 'oc';
    baseSession.intake.cardFormat = loc.cardFormat || 'dossier_19';
    baseSession.intake.greetingStyle = loc.greetingStyle || 'fanfic';
    baseSession.intake.greetingPov = loc.greetingPov || 'third';
    baseSession.intake.genres = [...(loc.genres || [])];
    baseSession.intake.customGenres = loc.customGenres || '';
    baseSession.intake.settingEra = loc.settingEra || '';
    baseSession.intake.favFandomHero = loc.favFandomHero || '';
    baseSession.intake.userRoleAndDesire = loc.userRoleAndDesire || '';
    baseSession.intake.tropesWanted = loc.tropesWanted || '';
    baseSession.intake.hardBans = loc.hardBans || '';
    // Always follow Tavern language ({{language}}) out of the box!
    baseSession.intake.userLanguage = '{{language}}';
    baseSession.intake.cardLanguage = '{{language}}';
    baseSession.intake.firstMesLanguage = 'same_as_card';

    baseSession.tinder.promptHint = loc.tinderHint || '';
    baseSession.gacha.tagsInput = loc.gachaTags || '';
    return baseSession;
}

export function syncPresetSessionsToUiLanguage(sessions = [], targetUiLang = 'ru') {
    if (!Array.isArray(sessions)) return false;
    const nextLang = targetUiLang === 'en' ? 'en' : 'ru';
    let changed = false;

    for (const sess of sessions) {
        if (!sess || !sess.presetTemplateId) continue;
        const tpl = PRESET_SESSION_TEMPLATES.find((t) => t.id === sess.presetTemplateId);
        if (!tpl) continue;

        const prevLoc = nextLang === 'en' ? tpl.ru : tpl.en;
        const nextLoc = nextLang === 'en' ? tpl.en : tpl.ru;

        const swapIfMatchesTemplate = (curVal, prevTplVal, nextTplVal) => {
            const cleanCur = String(curVal ?? '').trim();
            if (!cleanCur || cleanCur === String(prevTplVal ?? '').trim()) {
                return nextTplVal;
            }
            return curVal;
        };

        const nextTitle = swapIfMatchesTemplate(sess.title, prevLoc.title, nextLoc.title);
        if (nextTitle !== sess.title) {
            sess.title = nextTitle;
            changed = true;
        }
        if (sess.intake) {
            for (const field of ['customGenres', 'settingEra', 'favFandomHero', 'userRoleAndDesire', 'tropesWanted', 'hardBans']) {
                const updated = swapIfMatchesTemplate(sess.intake[field], prevLoc[field], nextLoc[field]);
                if (updated !== sess.intake[field]) {
                    sess.intake[field] = updated;
                    changed = true;
                }
            }
        }
        if (sess.tinder) {
            const updatedHint = swapIfMatchesTemplate(sess.tinder.promptHint, prevLoc.tinderHint, nextLoc.tinderHint);
            if (updatedHint !== sess.tinder.promptHint) {
                sess.tinder.promptHint = updatedHint;
                changed = true;
            }
        }
        if (sess.gacha) {
            const updatedTags = swapIfMatchesTemplate(sess.gacha.tagsInput, prevLoc.gachaTags, nextLoc.gachaTags);
            if (updatedTags !== sess.gacha.tagsInput) {
                sess.gacha.tagsInput = updatedTags;
                changed = true;
            }
        }
        sess.presetLangApplied = nextLang;
    }

    return changed;
}
