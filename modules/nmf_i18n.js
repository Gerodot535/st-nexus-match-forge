// ═══════════════════════════════════════════════════════════════════════════
// NEXUSMATCH FORGE — BILINGUAL LOCALIZATION ENGINE (RU / EN) & THEMED UNPACK LORE
// Zero emojis inside code or UI strings.
// ═══════════════════════════════════════════════════════════════════════════

let activeUiLang = globalThis.__nmfActiveUiLang || 'ru';

export function normalizeUiLang(raw) {
    const clean = String(raw || '').trim().toLowerCase();
    if (clean === 'en' || clean.startsWith('en-') || clean === 'english') return 'en';
    if (clean === 'ru' || clean.startsWith('ru-') || clean === 'russian' || clean === 'русский') return 'ru';
    return 'ru';
}

export function detectDefaultUiLang() {
    try {
        const nav = globalThis.navigator?.language || globalThis.navigator?.languages?.[0] || '';
        if (/^en\b/i.test(String(nav))) return 'en';
    } catch {}
    return 'ru';
}

export function getUiLang() {
    return globalThis.__nmfActiveUiLang || activeUiLang;
}

export function setUiLang(lang) {
    activeUiLang = normalizeUiLang(lang);
    globalThis.__nmfActiveUiLang = activeUiLang;
    return activeUiLang;
}

export function isEn() {
    return getUiLang() === 'en';
}

export function tx(ruText, enText) {
    return isEn() ? enText : ruText;
}

// ── 13 THEMES: LOCALIZED NAMES & SUBTITLES ──
export const THEME_I18N = Object.freeze({
    tavern: {
        ru: { name: 'Тема Таверны', sub: 'НЕЙТРАЛЬНЫЙ ЗАЛ' },
        en: { name: 'Tavern Default', sub: 'NEUTRAL HALL' },
    },
    celestial: {
        ru: { name: 'Астральный Кодекс', sub: 'ЗВЁЗДНЫЙ АЛТАРЬ' },
        en: { name: 'Astral Codex', sub: 'STARLIGHT SANCTUM' },
    },
    velvet: {
        ru: { name: 'Полуночный Бархат', sub: 'НОЧНОЙ САЛОН' },
        en: { name: 'Midnight Velvet', sub: 'NOCTURNE SALON' },
    },
    olympus: {
        ru: { name: 'Мрамор и Золото', sub: 'ГАЛЕРЕЯ МУЗ' },
        en: { name: 'Marble & Gold', sub: 'GALLERY OF MUSES' },
    },
    scroll: {
        ru: { name: 'Старинный Свиток', sub: 'КОРОЛЕВСКИЙ АРХИВ' },
        en: { name: 'Ancient Scroll', sub: 'ROYAL ARCHIVE' },
    },
    rose: {
        ru: { name: 'Розовый Кварц', sub: 'ФАРФОРОВАЯ ВИТРИНА' },
        en: { name: 'Rose Quartz', sub: 'PORCELAIN SHOWCASE' },
    },
    notebook: {
        ru: { name: 'Личный Дневник', sub: 'БУМАЖНЫЙ АЛЬБОМ' },
        en: { name: 'Secret Journal', sub: 'PAPER KEEPSAKE' },
    },
    apothecary: {
        ru: { name: 'Изумрудный Гербарий', sub: 'ТИХАЯ АПТЕКА' },
        en: { name: 'Emerald Herbarium', sub: 'QUIET APOTHECARY' },
    },
    abyss: {
        ru: { name: 'Океаническая Глубина', sub: 'ЖЕМЧУЖНЫЙ ЗАЛ' },
        en: { name: 'Oceanic Depth', sub: 'PEARL SANCTUARY' },
    },
    demonic: {
        ru: { name: 'Алый Гримуар', sub: 'ПЕЧАТЬ ПЕПЛА' },
        en: { name: 'Crimson Grimoire', sub: 'ASHEN PACT' },
    },
    manga: {
        ru: { name: 'Манга-Выпуск', sub: 'КОЛЛЕКЦИОННЫЙ ТОМ' },
        en: { name: 'Manga Edition', sub: 'COLLECTOR VOLUME' },
    },
    krakoa: {
        ru: { name: 'Остров Кракоа', sub: 'АРХИВ ЦЕРЕБРО' },
        en: { name: 'Krakoa Archive', sub: 'CEREBRO VAULT' },
    },
    cyber: {
        ru: { name: 'Ночной Терминал', sub: 'ЦИФРОВОЕ ДОСЬЕ' },
        en: { name: 'Night Terminal', sub: 'DIGITAL DOSSIER' },
    },
});

export function getThemeDisplay(themeObjOrId) {
    const id = typeof themeObjOrId === 'string' ? themeObjOrId : (themeObjOrId?.id || 'tavern');
    const entry = THEME_I18N[id] || THEME_I18N.tavern;
    return isEn() ? entry.en : entry.ru;
}

// ── 39 UNIQUE THEMED UNPACK / REVEAL BUTTON INSCRIPTIONS (13 THEMES × MATCH / GACHA / ART) ──
export const THEME_UNPACK_LABELS = Object.freeze({
    tavern: {
        match: { ru: 'Открыть анкету гостя', en: 'Open Guest Dossier' },
        gacha: { ru: 'Распаковать карточку', en: 'Unpack Collectible Card' },
        art: { ru: 'Открыть изображение', en: 'Open Portrait Image' },
        stageMatchTitle: { ru: 'Новый гость у порога Таверны', en: 'A New Guest Arrives at the Tavern' },
        stageGachaTitle: { ru: 'Запечатанная карта судьбы', en: 'Sealed Card of Fate' },
    },
    celestial: {
        match: { ru: 'Прочесть знак созвездий', en: 'Read the Starlight Sign' },
        gacha: { ru: 'Принять дар звездопада', en: 'Claim Starfall Card' },
        art: { ru: 'Рассеять звёздную дымку', en: 'Part the Starlit Mist' },
        stageMatchTitle: { ru: 'Созвездия сошлись в резонансе', en: 'Constellations Aligned in Resonance' },
        stageGachaTitle: { ru: 'Звезда сошла на Алтарь Молитв', en: 'A Star Descended Upon the Altar' },
    },
    velvet: {
        match: { ru: 'Вскрыть конверт салона', en: 'Open Salon Envelope' },
        gacha: { ru: 'Снять бархатную печать', en: 'Break the Velvet Seal' },
        art: { ru: 'Приподнять ночную вуаль', en: 'Lift the Nocturne Veil' },
        stageMatchTitle: { ru: 'Тайное приглашение в Полуночный салон', en: 'Private Invitation to the Nocturne Salon' },
        stageGachaTitle: { ru: 'Запечатанная карта за кулисами', en: 'Sealed Card Behind Velvet Curtains' },
    },
    olympus: {
        match: { ru: 'Принять свиток Олимпа', en: 'Accept Olympian Scroll' },
        gacha: { ru: 'Открыть золотую скрижаль', en: 'Unseal Golden Tablet' },
        art: { ru: 'Снять мраморный покров', en: 'Unveil the Gilded Portrait' },
        stageMatchTitle: { ru: 'Судьба высечена в мраморе и золоте', en: 'Destiny Carved in Marble and Gold' },
        stageGachaTitle: { ru: 'Благословенная карта пантеона', en: 'Blessed Card of the Pantheon' },
    },
    scroll: {
        match: { ru: 'Сломать сургучную печать', en: 'Break the Royal Wax' },
        gacha: { ru: 'Развернуть гербовую карту', en: 'Unfurl Heraldic Card' },
        art: { ru: 'Открыть миниатюру летописи', en: 'Unveil Chronicle Portrait' },
        stageMatchTitle: { ru: 'Гонец доставил запечатанную грамоту', en: 'A Royal Courier Delivered a Sealed Charter' },
        stageGachaTitle: { ru: 'Реликвия из королевской сокровищницы', en: 'Relic from the Royal Treasury' },
    },
    rose: {
        match: { ru: 'Развязать шёлковую ленту', en: 'Untie the Silk Ribbon' },
        gacha: { ru: 'Распаковать заветную карту', en: 'Unwrap Keepsake Card' },
        art: { ru: 'Открыть фарфоровый портрет', en: 'Reveal Porcelain Portrait' },
        stageMatchTitle: { ru: 'Письмо с ароматом лепестков', en: 'A Scented Letter Awaits Your Touch' },
        stageGachaTitle: { ru: 'Коллекционная карта под розовым стеклом', en: 'Collectible Card Under Rose Glass' },
    },
    notebook: {
        match: { ru: 'Открыть личную страницу', en: 'Turn to Secret Entry' },
        gacha: { ru: 'Достать вложенную карточку', en: 'Pull Tucked-In Card' },
        art: { ru: 'Перевернуть фотоснимок', en: 'Flip the Photo Print' },
        stageMatchTitle: { ru: 'Новая запись на полях дневника', en: 'A Fresh Note Tucked Inside the Journal' },
        stageGachaTitle: { ru: 'Карточка между книжных страниц', en: 'Card Pressed Between Book Pages' },
    },
    apothecary: {
        match: { ru: 'Открыть формуляр редкого гостя', en: 'Open Specimen Dossier' },
        gacha: { ru: 'Извлечь карту эликсира', en: 'Extract Alchemy Card' },
        art: { ru: 'Проявить серебряную пластину', en: 'Develop Silver Plate' },
        stageMatchTitle: { ru: 'Редкая находка в тихой оранжерее', en: 'A Rare Find in the Quiet Conservatory' },
        stageGachaTitle: { ru: 'Кристаллизованная карта алхимии', en: 'Crystallized Alchemy Card' },
    },
    abyss: {
        match: { ru: 'Поднять послание из глубин', en: 'Surface Deep Message' },
        gacha: { ru: 'Раскрыть перламутровую карту', en: 'Open Mother-of-Pearl Card' },
        art: { ru: 'Разгладить зеркало воды', en: 'Clear the Water Mirror' },
        stageMatchTitle: { ru: 'Эхо со дна тихого океана', en: 'An Echo Rising from Silent Waters' },
        stageGachaTitle: { ru: 'Жемчужная карта прилива', en: 'Tide-Born Pearl Card' },
    },
    demonic: {
        match: { ru: 'Сорвать алую печать пакта', en: 'Shatter the Crimson Seal' },
        gacha: { ru: 'Распечатать карту Гримуара', en: 'Unbind Grimoire Card' },
        art: { ru: 'Явить лик сквозь пепел', en: 'Manifest Visage Through Ash' },
        stageMatchTitle: { ru: 'Контракт откликнулся в темноте', en: 'A Pact Answered in the Dark' },
        stageGachaTitle: { ru: 'Скованная печатью карта Бездны', en: 'Seal-Bound Abyssal Card' },
    },
    manga: {
        match: { ru: 'Открыть дебютную главу', en: 'Open Debut Chapter' },
        gacha: { ru: 'Вскрыть коллекционный пак', en: 'Tear Open Collector Pack' },
        art: { ru: 'Показать цветную иллюстрацию', en: 'Reveal Color Illustration' },
        stageMatchTitle: { ru: 'Новый герой выходит на сцену тома', en: 'A New Lead Steps Into the Volume' },
        stageGachaTitle: { ru: 'Редкий бустер свежего тиража', en: 'Limited-Print Collector Booster' },
    },
    krakoa: {
        match: { ru: 'Открыть досье Церебро', en: 'Open Cerebro File' },
        gacha: { ru: 'Пробудить карту Кракоа', en: 'Awaken Krakoan Card' },
        art: { ru: 'Открыть живой портрет', en: 'Unveil Living Portrait' },
        stageMatchTitle: { ru: 'Врата Кракоа пропустили нового гостя', en: 'The Gates Answered a New Presence' },
        stageGachaTitle: { ru: 'Запечатанный сосуд возрождения', en: 'Sealed Vessel of Awakening' },
    },
    cyber: {
        match: { ru: 'Открыть засекреченное досье', en: 'Unseal Classified File' },
        gacha: { ru: 'Распаковать редкую карту', en: 'Unpack Rare Edition Card' },
        art: { ru: 'Открыть готовый снимок', en: 'Open Rendered Frame' },
        stageMatchTitle: { ru: 'Входящее личное досье найдено', en: 'Incoming Personal Dossier Located' },
        stageGachaTitle: { ru: 'Защищённая капсула коллекции', en: 'Protected Collector Capsule' },
    },
});

export function getThemeUnpackCopy(themeId = 'tavern') {
    const entry = THEME_UNPACK_LABELS[themeId] || THEME_UNPACK_LABELS.tavern;
    const lang = isEn() ? 'en' : 'ru';
    return {
        matchBtn: entry.match[lang],
        gachaBtn: entry.gacha[lang],
        artBtn: entry.art[lang],
        stageMatchTitle: entry.stageMatchTitle[lang],
        stageGachaTitle: entry.stageGachaTitle[lang],
    };
}

// ── SACRIFICE FAILURE LORE PER THEME (RU / EN) ──
const SACRIFICE_FAIL_LORE = Object.freeze({
    tavern: {
        ru: (n) => `Провал жертвы! «${n}» растворилась в каминном дыму Таверны, но Алтарь отверг дар — 0 Молитв получено.`,
        en: (n) => `Sacrifice failed! "${n}" vanished into hearth smoke, and the Altar rejected the offering — 0 Prayers gained.`,
    },
    celestial: {
        ru: (n) => `Созвездие погасло! «${n}» рассыпалась звёздной пылью в пустоте — небо не даровало ни одной Молитвы (0 Молитв).`,
        en: (n) => `A constellation went dark! "${n}" scattered into stardust, yielding 0 Prayers from the silent sky.`,
    },
    velvet: {
        ru: (n) => `Каприз салона! Имя «${n}» сгорело в пламени свечи впустую — 0 Молитв возвращено.`,
        en: (n) => `A cruel whim of the salon! "${n}" burned in candle-flame for nothing — 0 Prayers returned.`,
    },
    demonic: {
        ru: (n) => `Бездна проглотила дар даром! «${n}» исчезла в пепле без единой Молитвы взамен (0 Молитв)!`,
        en: (n) => `The Abyss devoured the tribute for free! "${n}" turned to ash with 0 Prayers granted in return!`,
    },
    scroll: {
        ru: (n) => `Огонь пожрал пергамент «${n}», но казна осталась пуста — ритуал сорвался (0 Молитв).`,
        en: (n) => `Fire consumed the parchment of "${n}", leaving the coffers empty — ritual failed (0 Prayers).`,
    },
    rose: {
        ru: (n) => `Лепестки увяли! Карточка «${n}» разбилась, как хрупкий фарфор, не принеся Молитв (0 Молитв).`,
        en: (n) => `Withered petals! "${n}" shattered like fragile porcelain — 0 Prayers granted.`,
    },
    manga: {
        ru: (n) => `Сюжетный поворот! «${n}» вырезана редактором без компенсации — 0 Молитв!`,
        en: (n) => `Brutal plot twist! "${n}" was cut by the editor with zero compensation — 0 Prayers!`,
    },
    notebook: {
        ru: (n) => `Чернила расплылись! Страница «${n}» вырвана навсегда, но удача отвернулась (0 Молитв).`,
        en: (n) => `Blurred ink! The page of "${n}" was torn out forever, yet luck turned away (0 Prayers).`,
    },
    krakoa: {
        ru: (n) => `Сбой протокола! Резервная копия «${n}» утрачена впустую — 0 Молитв получено.`,
        en: (n) => `Protocol misfire! The vessel of "${n}" dissolved into nothing — 0 Prayers recovered.`,
    },
    cyber: {
        ru: (n) => `Потеря пакета при обмене! Досье «${n}» стёрто без возврата Молитв (0 Молитв).`,
        en: (n) => `Signal loss during exchange! File "${n}" was purged with 0 Prayers credited.`,
    },
    apothecary: {
        ru: (n) => `Осадок в реторте! Эссенция «${n}» испарилась впустую — 0 Молитв получено.`,
        en: (n) => `Ruined distillation! The essence of "${n}" evaporated in vain — 0 Prayers gained.`,
    },
    olympus: {
        ru: (n) => `Боги отвернулись от дара! «${n}» ушла в небытие без ответного благословения (0 Молитв).`,
        en: (n) => `The gods spurned the offering! "${n}" faded into oblivion with 0 Prayers bestowed.`,
    },
    abyss: {
        ru: (n) => `Холодное течение унесло «${n}» на дно без единой жемчужины взамен — 0 Молитв!`,
        en: (n) => `A dark current dragged "${n}" into the trench leaving nothing behind — 0 Prayers!`,
    },
});

export function getThemedSacrificeFailMessage(themeId = 'tavern', heroName = '') {
    const cleanName = String(heroName || tx('Незнакомец', 'Stranger')).trim();
    const entry = SACRIFICE_FAIL_LORE[themeId] || SACRIFICE_FAIL_LORE.tavern;
    return isEn() ? entry.en(cleanName) : entry.ru(cleanName);
}

// ── RARITY PALETTE LABELS (RU / EN) ──
export function getRarityLabel(stars = 3) {
    const s = Math.max(1, Math.min(5, Math.round(Number(stars) || 3)));
    const map = {
        1: { ru: '1 ЗВ. · СЕРЕБРЯНЫЙ ОТБЛЕСК', en: '1 STAR · SILVER GLIMMER' },
        2: { ru: '2 ЗВ. · ИЗУМРУДНАЯ ИСКРА', en: '2 STARS · EMERALD SPARK' },
        3: { ru: '3 ЗВ. · САПФИРОВАЯ КОМЕТА', en: '3 STARS · SAPPHIRE COMET' },
        4: { ru: '4 ЗВ. · АМЕТИСТОВОЕ СИЯНИЕ', en: '4 STARS · AMETHYST RADIANCE' },
        5: { ru: '5 ЗВ. · ЗОЛОТО СОЗВЕЗДИЯ', en: '5 STARS · GOLDEN CONSTELLATION' },
    };
    return map[s][isEn() ? 'en' : 'ru'];
}

// ── LOADING QUIPS IN ENGLISH (RU stays in nmf_templates_and_prompts or bridged here) ──
export const THEME_LOADING_QUIPS_EN = Object.freeze({
    tavern: [
        'Pouring warm cider and looking through traveler dossiers...',
        'Polishing glasses at the bar while your guest approaches...',
        'Checking sealed letters by candlelight...',
    ],
    celestial: [
        'Tracing golden threads across the night astrolabe...',
        'Listening to the quiet chime of falling stars...',
        'Aligning the astral mirror over still water...',
    ],
    velvet: [
        'Parting heavy velvet drapes in the private gallery...',
        'Lighting amber candles before the curtain rises...',
        'Selecting an intriguing silhouette from the salon...',
    ],
    demonic: [
        'Warming crimson wax over dark embers...',
        'Turning ancient vellum pages of the grimoire...',
        'Summoning a figure from beyond the veil of ash...',
    ],
    scroll: [
        'Dipping the goose quill into royal ink...',
        'Unfurling gilded charters in the castle library...',
        'Preparing the heraldic seal for a new arrival...',
    ],
    rose: [
        'Tying a silk ribbon around a porcelain keepsake...',
        'Arranging fresh petals beside the silver mirror...',
        'Writing a delicate invitation card...',
    ],
    manga: [
        'Inking expressive eyes on the title spread...',
        'Applying fresh screentones before print deadline...',
        'Preparing a dramatic first-chapter entrance...',
    ],
    notebook: [
        'Turning crisp cream pages of a private journal...',
        'Sketching character notes in fountain-pen ink...',
        'Tucking a fresh photograph between chapters...',
    ],
    krakoa: [
        'Opening quiet archive chambers...',
        'Woven leaves parting along the sanctuary path...',
        'Restoring a complete character profile...',
    ],
    cyber: [
        'Searching encrypted archives under night rain...',
        'Assembling a clean personal dossier...',
        'Tuning signal clarity on the private channel...',
    ],
    apothecary: [
        'Measuring rare botanicals on brass scales...',
        'Warming emerald glass vials over a quiet flame...',
        'Recording notes in the herbarium ledger...',
    ],
    olympus: [
        'Illuminating marble columns with warm sunset gold...',
        'Weaving fate threads in the hall of muses...',
        'Polishing a gilded frame for the portrait...',
    ],
    abyss: [
        'Listening to gentle ripples across midnight water...',
        'Guiding bioluminescent lanterns from the deep...',
        'Opening a mother-of-pearl reliquary...',
    ],
});

// ── CONSTANT OPTION TRANSLATIONS WHEN UI IS ENGLISH ──
const GENRE_EN_MAP = Object.freeze({
    'Дарк-романс': 'Dark Romance',
    'Фэнтези': 'Fantasy',
    'Киберпанк': 'Sci-Fi Noir',
    'Городское фэнтези': 'Urban Fantasy',
    'Научная фантастика': 'Sci-Fi',
    'ЛитРПГ / Система': 'LitRPG / System',
    'Тёмное фэнтези': 'Dark Fantasy',
    'Повседневность / Офис': 'Slice of Life / Office',
    'Детектив / Нуар': 'Mystery / Noir',
    'Историческая эпоха': 'Historical Era',
    'Постапокалипсис': 'Post-Apocalyptic',
    'Мафия / Криминал': 'Mafia / Crime',
    'Академия': 'Academy',
    'Хоррор / Мистика': 'Horror / Supernatural',
    'Омегаверс': 'Omegaverse',
});

export function localizeGenreTag(ruGenre) {
    if (!isEn()) return ruGenre;
    return GENRE_EN_MAP[ruGenre] || ruGenre;
}

export function localizeOptionLabel(group, id, fallbackRu = '') {
    if (!isEn()) return fallbackRu;
    const dict = OPTION_LABELS_EN[group];
    return (dict && dict[id]) ? dict[id] : fallbackRu;
}

const OPTION_LABELS_EN = Object.freeze({
    transport: {
        prefill_user_msg_short: 'Via Tavern Preset',
        prefill_user_msg_badge: 'Best for Proxies & 18+',
        prefill_user_msg_explain: 'Sends your active SillyTavern preset so its style, jailbreak, and proxy settings work naturally. Recommended for complex and mature cards.',
        json_schema_short: 'Strict JSON Schema',
        json_schema_badge: 'Token Saver',
        json_schema_explain: 'Lightweight direct structured request without active preset blocks — saves tokens and parses cleanly on standard APIs.',
    },
    cardFormatShort: {
        dossier_19: 'Full Dossier (19 pts)',
        jed_hybrid: 'JED Hybrid',
        behavioral_prose: 'Behavioral Prose',
        xml_sheet: 'XML Blocks (Token-Light)',
        plist_alichat: 'PList + Ali:Chat',
        cast_hub: 'Multi-Char Cast (2-4)',
        vivid_prose: 'Literary Portrait',
        compact_token: 'Compact (Token-Light)',
        wpp_plist: 'Attributes / PList',
        ali_chat: 'Dialogue-Driven (Ali:Chat)',
        rework_preserve: 'Preserve Source Format',
        world_sandbox: 'World / Sandbox',
        rpg_gm_engine: 'RPG Master / System',
    },
    cardFormatName: {
        dossier_19: '1. Full Character Dossier (19 Sections)',
        jed_hybrid: '2. JED Hybrid (Chub / JanitorAI Standard)',
        behavioral_prose: '3. Behavioral & Literary Prose Portrait',
        xml_sheet: '4. Token-Efficient XML Character Sheet',
        plist_alichat: '5. PList Traits + Ali:Chat Dialogue Examples',
        cast_hub: '6. Multi-Character Ensemble Cast (2-4 Characters)',
        vivid_prose: '2. Literary Prose Portrait',
        compact_token: '3. Compact Token-Efficient Card',
        wpp_plist: '4. Structured Attributes (PList / W++)',
        ali_chat: '5. Speech & Example Driven (Ali:Chat)',
        rework_preserve: '6. Preserve Original Card Structure',
        world_sandbox: '7. Living World / Multi-NPC Sandbox',
        rpg_gm_engine: '8. RPG Game Master & Rules Engine',
    },
    cardFormatExplain: {
        dossier_19: 'Deep structured breakdown: appearance, attire, psychology, habits, speech mannerisms, secrets, backstory, and chemistry with {{user}}.',
        jed_hybrid: 'Crisp bullet lists for appearance and core traits paired with rich natural prose for backstory, habits, and speech.',
        behavioral_prose: 'Flowing novel-like character portrait focused on living reactions, body language, and emotional nuance without dry lists.',
        xml_sheet: 'Clean semantic XML tags that keep token usage low while giving modern LLMs crystal-clear field boundaries.',
        plist_alichat: 'Compact bracketed trait summary reinforced by vivid dialogue scenes so the AI locks onto the exact voice.',
        cast_hub: 'Balanced multi-character card for 2-4 distinct personalities sharing scenes, chemistry, and individual voices.',
        vivid_prose: 'Smooth atmospheric prose without dry bullet lists — reads like a novel character study.',
        compact_token: 'High-signal concise profile (~350-500 words) leaving maximum context memory for long roleplays.',
        wpp_plist: 'Crisp bracketed trait blocks for rigid adherence to appearance and personality tags.',
        ali_chat: 'Shapes personality through vivid sample scenes and signature dialogue lines so the AI nails the voice.',
        rework_preserve: 'For AU / Rework: keeps the exact layout of an existing card while adapting lore to the new setting.',
        world_sandbox: 'Card represents an entire setting, factions, locations, and cast of NPCs around {{user}}.',
        rpg_gm_engine: 'Turns AI into a tabletop narrator tracking quests, world consequences, and atmosphere.',
    },
    wordBudget: {
        '300': 'Compact (~300 words)',
        '600': 'Balanced (~600 words)',
        '1100': 'Detailed (~1100 words)',
        '1800': 'Maximum (~1800 words)',
        compact_400: 'Compact (~400 words)',
        balanced_750: 'Balanced (~750 words)',
        detailed_1200: 'Detailed (~1200 words)',
        deep_1800: 'Deep Lore (~1800 words)',
        epic_2500: 'Max / Epic (~2500 words)',
        custom: 'Custom Word Count...',
    },
    greetingBudget: {
        '140': 'Short (~140 words)',
        '280': 'Medium (~280 words)',
        '500': 'Literary Scene (~500 words)',
        short_150: 'Short (~150 words)',
        medium_300: 'Medium (~300 words)',
        long_550: 'Literary Scene (~550 words)',
        cinematic_850: 'Long Chapter (~850 words)',
        custom: 'Custom Greeting Length...',
    },
    userGender: {
        any: 'Unspecified / Universal',
        male: 'Male',
        female: 'Female',
        custom: 'Custom...',
    },
    targetGender: {
        any: 'Any / Open',
        female: 'Female',
        male: 'Male',
        custom: 'Custom...',
    },
    rating: {
        sfw: 'SFW (Clean / All Ages)',
        mature: 'Mature 16+ (Drama & Dark Themes)',
        nsfw: 'NSFW 18+ (Explicit Adult)',
    },
    ratingWarn: {
        sfw: '',
        mature: 'Some heavily filtered cloud APIs may soften dark themes unless sent via your active Tavern preset.',
        nsfw: 'Not all models allow direct 18+ generation. Using "Via Tavern Preset" with your working RP preset is recommended.',
    },
    originType: {
        oc: 'Character — Original Hero (OC)',
        canon: 'Character — Canon Fandom Hero',
        fandom_au: 'Character — Fandom Alternate Universe (AU)',
        fandom_oc: 'Character — Original Hero Inside Fandom',
        duo_group: 'Duo / Group (2–3 Characters in One Card)',
        artifact_object: 'Special Artifact / Object RP',
        world_sandbox: 'World / Setting Sandbox',
        rpg_gm: 'RPG Game Master / System',
    },
    gachaTarget: {
        oc: 'Original Hero from "+" Tags (OC)',
        fandom_oc: 'New Hero Inside Specified Universe',
        canon_au: 'Canon / AU Hero Matching Tags',
        duo_group: 'Duo / Pair (2–3 Heroes)',
        artifact: 'Sentient Relic / Artifact',
        world_rpg: 'Miniature World / RPG Scenario',
    },
    greetingStyle: {
        fanfic: 'Book Prose ("Dialogue" & clean paragraphs)',
        classic_rp: 'Classic RP (*actions in asterisks* & speech)',
        manhwa: 'Dynamic Manhwa / Paced Scene Beats',
        preserve: 'Keep Original Card Style (for AU)',
        novel_quotes: 'Book Prose ("Dialogue" & clean paragraphs)',
        classic_asterisks: 'Classic RP (*actions in asterisks* & speech)',
        manhwa_dynamic: 'Dynamic Manhwa / Paced Scene Beats',
        preserve_source: 'Keep Original Card Style (for AU)',
        rpg_hud: 'RPG Narrator + Scene Prompt',
        custom: 'Custom Formatting Rules...',
    },
    greetingPov: {
        third: 'Third Person ("He/She looked..." / World)',
        first: 'First Person ("I looked..." from Character)',
        auto: 'Automatic for Selected Card Format',
        third_char: 'Third Person (Focused on Character)',
        first_char: 'First Person ("I" from Character)',
        second_gm: 'Second Person / Narrator ("Before you...")',
    },
    aspect: {
        sillyimages_default: 'SillyImages Default (Untouched)',
        auto: 'Auto Mosaic (Keep Native Art Size)',
        native: 'Auto Mosaic (Keep Native Art Size)',
        '1:1': '1:1 Square Avatar',
        '2:3': '2:3 Collectible Portrait Card',
        '3:4': '3:4 Classic Portrait',
        '3:2': '3:2 Wide Story Card',
        '4:3': '4:3 Landscape',
        '16:9': '16:9 Widescreen Banner',
        '9:16': '9:16 Full Vertical Poster',
    },
    cropFocus: {
        top: 'Focus on Face / Upper Frame',
        center: 'Center Crop',
        contain: 'Fit Full Image Without Cropping (With Margins)',
    },
    styleWrap: {
        plain_prefix: 'Clean Prefix at Start of Prompt',
        sillyimages_tag: '[STYLE: ...] Tag Wrapper',
        suffix: 'Append at End of Prompt',
    },
    refMode: {
        off: 'Off (Pure Prompt Only)',
        auto_lorebook: 'Auto-Match from SillyImages Refs',
        pick_sillyimages: 'Pick Entry from SillyImages Catalog',
        custom_photo: 'Upload Custom Appearance Photo',
    },
    luckMode: {
        fair: 'Fair Random (Honest 1-5 Star Odds)',
        soft: 'Soft Boost (More 3-5 Star Drops)',
        high: 'High Luck (4-5 Star Featured)',
        jackpot: 'Hidden Jackpot (Guaranteed 5-Star)',
    },
    langPreset: {
        '{{language}}': '{{language}} Macro (Tavern UI Locale)',
        English: 'English (Saves Tokens)',
        Русский: 'Russian (Русский)',
        简体中文: 'Chinese Simplified (简体中文)',
        日本語: 'Japanese (日本語)',
        한국어: 'Korean (한국어)',
        Español: 'Spanish (Español)',
        Deutsch: 'German (Deutsch)',
        Français: 'French (Français)',
        __custom__: 'Custom Language...',
    },
});

export const HELP_TOPICS_EN = Object.freeze({
    languages: {
        title: 'Dual Language Control & AI Translation',
        body: 'Field 1 sets YOUR reading language: used for Swipe/Gacha card previews, Blitz/AU questions, and Creator Notes.\n\nField 2 sets the CARD language for the AI (Description, Personality, Scenario, Opening Scene). For example, set Field 1 = Russian and Field 2 = English to save tokens, then tap "AI Translate" in Profile anytime to read or save a translated copy!',
    },
    gacha_timer: {
        title: 'Gacha Banner, Luck Rigging, Prayers & Altar Risk',
        body: 'Pull collectible cards from 1 to 5 stars using 3-10 tags separated by "+". Each Gacha session can set its own safe Art Resolution without changing your SillyImages settings.\n\nOn the Home Screen under "Gacha, Luck & Altar Rules", you can choose Fair Random or Luck Rigging, adjust the Prayer Cooldown Timer, or enable Sacrifice Failure Risk (where the Altar may consume a sacrificed card and return 0 Prayers!).',
    },
    isolation: {
        title: 'Mode Isolation, Gacha Wishes & Preset Cleanup',
        body: '• Swipes use the Story Questionnaire, while Gacha uses its own isolated Gacha Wishes sheet.\n• Blitz lets you deepen a chosen hero from Swipes or Gacha (or build from scratch) without mixing anti-tags.\n• Create / AU is cleanly isolated, and "Via Tavern Preset" automatically strips open chat macros ({{description}}, {{personality}}, {{scenario}}, World Info).',
    },
    art_mechanism: {
        title: 'Flexible Art Director, Style & Negatives',
        body: 'Image prompts follow SCENE -> CHARACTERS -> FIGURE / INTERACTION / OBJECT with zero hardcoded art style tags, supporting solo heroes, 2-3 character duos, Worlds, and Artifacts.\n\nYour SillyImages style and negative prompt presets attach cleanly from the Optional Art Spoiler at the bottom of the Home Screen.',
    },
    vault_slots: {
        title: '5 Draft Slots & Cross-Session Vault',
        body: 'Each session holds 5 independent draft slots (Swipes, Gacha, Blitz, Create, Manual) so building a Gacha hero never overwrites your Swipe or Manual draft.\n\nTap "To Vault" in Profile to store finished cards (text + portrait) across all sessions!',
    },
});

const EXACT_PHRASE_EN = new Map([
    ['Уточнить промпт внешности и сразу сделать Арт', 'Refine visual prompt & render Art'],
    ['Промпт + Арт', 'Prompt + Art'],
    ['Персонаж OC', 'OC Character'],
    ['Канон', 'Canon'],
    ['Фандом AU', 'Fandom AU'],
    ['OC в Фандоме', 'Fandom OC'],
    ['2–3 Персонажа', '2-3 Characters'],
    ['Предмет / Реликвия', 'Artifact / Relic'],
    ['Мир-Песочница', 'World Sandbox'],
    ['РПГ-Мастер', 'RPG Master'],
    ['Фанфик-проза', 'Book Prose'],
    ['РП *звёздочки*', 'Classic *RP*'],
    ['Манхва-ритм', 'Manhwa Pace'],
    ['РПГ-хроника', 'RPG Chronicle'],
    ['Стиль оригинала', 'Source Style'],
    ['Свой стиль', 'Custom Style'],
    ['Фанфик', 'Prose'],
    ['Анкета', 'Prefs'],
    ['Гача: OC по тегам', 'Gacha: OC by Tags'],
    ['Гача: OC в фандоме', 'Gacha: Fandom OC'],
    ['Гача: Канон / AU', 'Gacha: Canon / AU'],
    ['Гача: 2–3 героя', 'Gacha: Duo / Group'],
    ['Гача: Артефакт', 'Gacha: Artifact'],
    ['Гача: Мир / РПГ', 'Gacha: World / RPG'],
    ['Пожелания Гачи', 'Gacha Wishes'],
    ['Анкета Призыва · Пожелания Гачи', 'Summon Sheet · Gacha Wishes'],
    ['Кого призываем в Баннере?', 'Who are we summoning in the Banner?'],
    ['Оригинальный герой с нуля чисто по «+» тегам (По умолчанию)', 'Original Hero from "+" Tags (Default)'],
    ['Новый герой (OC) внутри выбранной вселенной', 'New Original Hero (OC) inside Universe'],
    ['Канонный персонаж / AU указанного фандома', 'Canon / AU Hero from Fandom'],
    ['Дуэт / Группа (2–3 персонажа в одной карте)', 'Duo / Group (2-3 Characters in One Card)'],
    ['Особый Предмет / Разумный Артефакт', 'Special Object / Sentient Artifact'],
    ['Мир / РПГ-система (без привязки к одному лицу)', 'World / RPG System'],
    ['Вселенная / Сеттинг для Гачи (необязательно)', 'Universe / Setting for Gacha (Optional)'],
    ['Пол в Призыве', 'Summoned Gender'],
    ['Рейтинг Гачи', 'Gacha Rating'],
    ['Особые пожелания к призыву (вайб, сюжетные детали)', 'Special Summon Wishes (vibe, story details)'],
    ['Запреты Баннера (чего точно НЕ должно выпасть)', 'Banner Hard Bans (never summon these)'],
    ['Языки', 'Languages'],
    ['Сохранить пожелания', 'Save Wishes'],
    ['Своё фото', 'Custom Photo'],
    ['Своё', 'Photo'],
    ['Кадрировать', 'Crop'],
    ['Кадр', 'Crop'],
    ['Стоп', 'Stop'],
    ['Переснять', 'Redraw'],
    ['Перерисовать', 'Redraw'],
    ['Сделать арт', 'Render Art'],
    ['Арт', 'Art'],
    ['Сбой арта:', 'Art error:'],
    ['Сбой фото:', 'Photo error:'],
    ['Описание пока не заполнено.', 'Description is empty so far.'],
    ['Внешность и детали образа', 'Appearance & Visual Details'],
    ['Внешность / Визуал', 'Appearance / Visuals'],
    ['Править', 'Edit'],
    ['В Блиц', 'To Blitz'],
    ['Собрать Карточку V2', 'Build Full V2 Card'],
    ['Собрать', 'Build'],
    ['Двигайте арт пальцем прямо внутри рамки или ползунками ниже (без потери качества!)', 'Drag artwork inside the frame or use sliders below (lossless crop!)'],
    ['Приближение (Zoom)', 'Zoom'],
    ['Верх / Низ', 'Up / Down'],
    ['Лево / Право', 'Left / Right'],
    ['Фокус на лицо', 'Focus Face'],
    ['По центру', 'Center'],
    ['Вернуть полный оригинал', 'Restore Full Original'],
    ['Отмена', 'Cancel'],
    ['Применить кадрирование', 'Apply Crop'],
    ['Сохраняем кадр без потери качества, подождите...', 'Saving lossless crop...'],
    ['Гид по NexusMatch Forge', 'NexusMatch Forge Guide'],
    ['Понятно', 'Got it'],
    ['Открыть полный Гид', 'Open Full Guide'],
    ['Свайпы Тиндера', 'NexusMatch Swipes'],
    ['Гача-Призыв', 'Gacha Summon'],
    ['Поиск', 'Find'],
    ['Сколько анкет делать разом', 'Dossiers per Batch'],
    ['По 1 анкете', '1 Dossier at a time'],
    ['Пачкой по 3 анкеты', 'Batch of 3 Dossiers'],
    ['Пачкой по 5 анкет сразу', 'Batch of 5 Dossiers'],
    ['Авто-подгрузка фото по очереди', 'Sequential Auto-Portrait'],
    ['Вписать вручную, чего НЕ предлагать в Свайпах', 'Manually Ban Tags / Tropes in Swipes'],
    ['+ В бан', '+ Ban'],
    ['Вернуть', 'Undo'],
    ['Скрыть', 'Hide'],
    ['ЛАЙК', 'LIKE'],
    ['МИМО', 'PASS'],
    ['Мимо', 'Pass'],
    ['В Мэтчи', 'Match'],
    ['Лента знакомств готова', 'Match Deck is Ready'],
    ['Лента миров и РПГ готова', 'World & RPG Deck is Ready'],
    ['Запустить подбор', 'Find Candidates'],
    ['Хранилище пока пусто', 'Vault is Empty'],
    ['В «Профиле» нажмите «В Хранилище», чтобы отложить любую готовую карточку (текст + арт) и спокойно начать новую сессию!', 'In "Profile", tap "To Vault" to store any finished card (text + art) across all sessions!'],
    ['Без имени', 'Untitled'],
    ['Готова V2', 'Ready V2'],
    ['В Профиль', 'To Profile'],
    ['Пока нет сохранённых Мэтчей', 'No Saved Matches Yet'],
    ['В архиве «Мимо» пусто', 'Passed Archive is Empty'],
    ['Пропущен', 'Skipped'],
    ['Скип', 'Skip'],
    ['Другой', 'Regen'],
    ['Герой из Тиндера / Гачи для раскрытия в Блице', 'Hero from Swipes / Gacha to Deepen in Blitz'],
    ['— Без карточки (создать нового героя с нуля) —', '— None (Create Brand-New Hero from Scratch) —'],
    ['В выбранном источнике пока нет анкет — вопросы создадут героя с нуля, либо сначала подберите кандидата в «Свайпах» / «Гаче» и нажмите «В Блиц».', 'No candidates in selected source yet — questions will create a hero from scratch, or pick a candidate in Swipes / Gacha first.'],
    ['Тема или фокус Блиц-опроса', 'Blitz Quiz Focus / Topic'],
    ['Сгенерировать вопросы', 'Generate Questions'],
    ['Пересоздать все вопросы', 'Regenerate All Questions'],
    ['Варианты ответов галочками', 'Include Checkable Options'],
    ['Учитывать Сюжетную Анкету Тиндера', 'Include Story Questionnaire'],
    ['Учитывать Пожелания Гачи', 'Include Gacha Wishes'],
    ['Собрать карточку по ответам', 'Build Card from Answers'],
    ['Из задумки', 'From Idea'],
    ['Чар в другой мир (AU)', 'Character AU Shift'],
    ['Режим сборки из задумки', 'Idea Build Mode'],
    ['Задумка + Анкета', 'Idea + Questionnaire'],
    ['Только задумка', 'Idea Only'],
    ['Проверить', 'Check'],
    ['Очистить', 'Clear'],
    ['Чистый лист: ИИ возьмёт 100% сюжета только из текста ниже (без фандомов и тропов Анкеты).', 'Clean slate: AI uses 100% only your text below (ignoring Story Questionnaire).'],
    ['Шаблон структуры карточки', 'Card Structure Template'],
    ['Опишите задумку своими словами', 'Describe Your Concept in Free Form'],
    ['Опишите мир, систему или артефакт', 'Describe World, System, or Artifact'],
    ['Собрать (Задумка + Анкета)', 'Build (Idea + Questionnaire)'],
    ['Собрать только по задумке', 'Build from Idea Only'],
    ['Исходная карточка из Таверны', 'Source Card from SillyTavern'],
    ['Обновить', 'Refresh'],
    ['Новая вселенная / эпоха', 'Target Universe / Era'],
    ['Атмосфера встречи', 'Encounter Mood'],
    ['Режим переноса, завязка и уточняющий опрос AU', 'AU Mode, Opening Hook & Clarifying Quiz'],
    ['Режим адаптации', 'Adaptation Mode'],
    ['Перевод всех реалий под новую эпоху + сохранить верстку', 'Adapt all lore realities to new era + preserve layout'],
    ['Полная пересборка под шаблон Анкеты', 'Full rebuild using selected Card Template'],
    ['Идея первой встречи (опционально)', 'Opening Scene Hook (Optional)'],
    ['Вопросы по переносу', 'AU Questions'],
    ['Очистить опрос', 'Clear Quiz'],
    ['Открыть в Профиле', 'Open in Profile'],
    ['Перенести в новый мир', 'Adapt to New World'],
    ['Свайпы', 'Swipes'],
    ['Гача', 'Gacha'],
    ['Блиц', 'Blitz'],
    ['Генератор', 'Builder'],
    ['Ручной', 'Manual'],
    ['Рендер...', 'Rendering...'],
    ['Имя / Название карточки', 'Card Name / Title'],
    ['Фото', 'Photo'],
    ['Перевод ИИ', 'AI Translate'],
    ['Сброс', 'Reset'],
    ['База', 'Main'],
    ['Приветствия', 'Greetings'],
    ['Промпт и Лор', 'Prompt & Lore'],
    ['В Хранилище', 'To Vault'],
    ['Скачать PNG', 'Export PNG'],
    ['Скачать JSON', 'Export JSON'],
    ['Добавить в Таверну (Новая)', 'Save to Tavern (New)'],
    ['Добавить в Таверну', 'Add to SillyTavern'],
    ['Обновить оригинал в Таверне', 'Overwrite Original in Tavern'],
    ['Описание (Description)', 'Description'],
    ['Характер (Personality)', 'Personality'],
    ['Сценарий (Scenario)', 'Scenario'],
    ['Первое сообщение (First Message)', 'First Message'],
    ['Альтернативные приветствия', 'Alternate Greetings'],
    ['+ Добавить сцену', '+ Add Greeting'],
    ['Примеры диалогов (Mes Example)', 'Dialogue Examples (Mes Example)'],
    ['Заметки автора (Creator Notes)', 'Creator Notes'],
    ['Промпт изображения / Внешность (Image Prompt EN)', 'Image Prompt (EN)'],
    ['Системный промпт карточки (System Prompt)', 'Card System Prompt'],
    ['Инструкция в глубине чата (Post-History)', 'Post-History Instructions'],
    ['Привязать Лорбук (World Info)', 'Attach Lorebook (World Info)'],
    ['— Без привязанного Лорбука —', '— No Attached Lorebook —'],
    ['Открыть Кузницу Лорбуков', 'Open Lorebook Forge'],
    ['Теги карточки (через запятую)', 'Card Tags (comma-separated)'],
    ['Импорт PNG / JSON с устройства', 'Import PNG / JSON from Device'],
    ['Сюжетная Анкета сессии', 'Session Story Questionnaire'],
    ['1. Кого ищем', '1. Target & World'],
    ['2. Тропы и Вайб', '2. Tropes & Vibe'],
    ['3. Стиль и Языки', '3. Style & Languages'],
    ['Кого или что создаём?', 'Who or what are we creating?'],
    ['Персонаж — Оригинальный герой (OC)', 'Character — Original Hero (OC)'],
    ['Персонаж — Канонный герой из фандома', 'Character — Canon Fandom Hero'],
    ['Персонаж — Фандом в другой вселенной (AU)', 'Character — Fandom Alternate Universe (AU)'],
    ['Персонаж — Новый герой внутри фандома', 'Character — New Hero Inside Fandom'],
    ['Дуэт / Группа (2–3 персонажа в кадре и карточке)', 'Duo / Group (2-3 Characters in One Card)'],
    ['Особый Предмет / Артефакт (РП вокруг объекта)', 'Special Object / Artifact RP'],
    ['Мир / Сеттинг-песочница (без привязки к 1 лицу)', 'World / Setting Sandbox'],
    ['РПГ-Мастер / Система (Character Card V2)', 'RPG Game Master / System (Card V2)'],
    ['Название фандома', 'Fandom Name'],
    ['Вселенная-основа (или оставьте пустым для авторского мира)', 'Base Universe (or leave blank for original world)'],
    ['Ваш пол (Игрок)', 'Your Gender (Player)'],
    ['Не указан / Универсально', 'Unspecified / Universal'],
    ['Мужчина', 'Male'],
    ['Женщина', 'Female'],
    ['Своё...', 'Custom...'],
    ['Пол персонажа', 'Character Gender'],
    ['Фокус НПС', 'NPC Gender Focus'],
    ['Любой / Без ограничений', 'Any / Open'],
    ['Женщину', 'Female'],
    ['Мужчину', 'Male'],
    ['Сеттинг / Эпоха', 'Setting / Era'],
    ['Рейтинг', 'Rating'],
    ['SFW (Без 18+)', 'SFW (Clean / All Ages)'],
    ['Mature 16+ (Драма / Мрачные темы)', 'Mature 16+ (Drama & Dark Themes)'],
    ['NSFW 18+ (Откровенный рейтинг)', 'NSFW 18+ (Explicit Adult)'],
    ['Любимый типаж из фандомов (ориентир вайба)', 'Favorite Fandom Archetype / Vibe Reference'],
    ['Ориентиры атмосферы (произведения / игры)', 'Atmosphere References (books / games / films)'],
    ['Какую историю и отношение к себе вы хотите?', 'What story dynamic & relationship do you want?'],
    ['Кем стартует игрок и какое приключение вы хотите?', 'Who does the player start as & what adventure do you want?'],
    ['Гринфлаги / Любимые тропы', 'Green Flags / Favorite Tropes'],
    ['Желаемые механики, фракции или детали', 'Desired Mechanics, Factions, or Details'],
    ['Общий стоп-лист сессии (чего точно НЕ делать)', 'Session Hard Bans (strictly avoid)'],
    ['Языки: для Вас и для Карточки', 'Languages: For You & For the Card'],
    ['1. Превью, вопросы и заметки', '1. Previews, Quiz & Notes'],
    ['2. Текст самой Карточки V2', '2. V2 Card Fields & Scene'],
    ['Авто по системе ({{language}})', 'Auto Locale ({{language}})'],
    ['English (экономия токенов)', 'English (Saves Tokens)'],
    ['Гибрид: База EN + Сцена на моём языке', 'Hybrid: EN Core + Local Scene'],
    ['Свой язык вручную...', 'Custom Language...'],
    ['Как называть Игрока в карточке?', 'How to Refer to Player in Card?'],
    ['Макрос {{user}} (универсально для всех Персон)', '{{user}} Macro (Universal for Any Persona)'],
    ['Стиль разметки Первого сообщения', 'Opening Scene Formatting Style'],
    ['Повествование (POV)', 'Point of View (POV)'],
    ['Готово', 'Done'],
    ['Сохранить и закрыть', 'Save & Close'],
    ['Переводчик карточки ИИ', 'AI Card Translator'],
    ['На какой язык перевести?', 'Target Translation Language'],
    ['Перевести для чтения', 'Translate for Reading'],
    ['Заменить текст в Профиле', 'Apply to Profile Card'],
    ['Сохранить копию в Хранилище', 'Save Translated Copy to Vault'],
    ['Редактирование анкеты-превью', 'Edit Candidate Preview'],
    ['Сохранить изменения', 'Save Changes'],
    ['Скачать чистый арт', 'Download Clean Art'],
    ['Скопировать внешность', 'Copy Appearance'],
    ['Внешность .TXT', 'Save .TXT'],
    ['Забрать в Профиль', 'Apply to Profile'],
    ['Дополнительные настройки', 'Additional Settings'],
    ['Тема Блиц-анкеты персонажа', 'Character Blitz Quiz Topic'],
    ['Тема Блиц-конструктора мира / РПГ', 'World / RPG Blitz Topic'],
    ['Количество вопросов', 'Number of Questions'],
    ['Предлагать варианты ответов с галочками', 'Offer Checkable Answer Options'],
    ['Брать анкету из Тиндера (по умолч. ДА)', 'Use Story Questionnaire (Default ON)'],
    ['Брать анкету из Гачи (по умолч. НЕТ)', 'Use Gacha Wishes (Default OFF)'],
    ['Проверьте Анкету перед сборкой:', 'Check Questionnaire before building:'],
    ['поля Анкеты влияют на вашу задумку!', 'Questionnaire fields influence your concept!'],
    ['NexusMatch 19-Point Dossier (Полное досье героя)', 'NexusMatch 19-Point Dossier (Full Character Dossier)'],
    ['Standard Prose (Стандарт — живая проза + блоки)', 'Standard Prose (Balanced Narrative + Traits)'],
    ['Vivid Literary Portrait (Живая проза с фактами)', 'Vivid Literary Portrait (Atmospheric Prose)'],
    ['Compact Token-Saver (Экономия токенов)', 'Compact Token-Saver (Lightweight)'],
    ['PList + Ali:Chat (Сжатые теги + диалоги)', 'PList + Ali:Chat (Traits + Sample Dialogue)'],
    ['Cast / Duo Hub (Ансамбль 2–3 героев)', 'Cast / Duo Hub (2-3 Characters)'],
    ['World Sandbox (Карточка Мира / Песочницы)', 'World Sandbox (Living Setting Card)'],
    ['RPG Game Master (Рассказчик РПГ / Система)', 'RPG Game Master (Tabletop Narrator & Rules)'],
    ['Rework: Preserve Original (Сохранить шаблон автора)', 'Rework: Preserve Original Layout'],
    ['1. Описание', '1. Description'],
    ['2. Сцена', '2. Scene'],
    ['3. Детали и Лор', '3. Details & Lore'],
    ['В Таверну (новая)', 'Save to Tavern (New)'],
    ['Обновить оригинал', 'Overwrite Original'],
    ['Импорт', 'Import'],
    ['Откатить', 'Rollback'],
    ['Кодекс', 'Codex'],
    ['Выберите слева', 'Select on the left'],
    ['Заметки для игрока (Creator Notes — на вашем языке)', 'Creator Notes (in your reading language)'],
    ['Характер, Сценарий, Теги и Примеры речи', 'Personality, Scenario, Tags & Dialogue'],
    ['Теги', 'Tags'],
    ['Автор', 'Creator'],
    ['Примеры диалогов (mes_example)', 'Dialogue Examples (mes_example)'],
    ['System Prompt и Post-History (для РПГ / Миров)', 'System Prompt & Post-History (for RPG / Worlds)'],
    ['Лорбук', 'Lorebook'],
    ['Обн.', 'Refresh'],
    ['— Без Лорбука —', '— No Lorebook —'],
    ['1. Мир и Герой', '1. World & Target'],
    ['2. Вайб и Стоп', '2. Vibe & Bans'],
    ['3. Языки и Слог', '3. Languages & Style'],
    ['Очистить анкету', 'Clear Questionnaire'],
    ['Какую историю и отношение к себе вы ищете?', 'What story dynamic & relationship are you looking for?'],
    ['2. Поля карточки и сцены ИИ', '2. V2 Card Fields & AI Scenes'],
    ['Стиль Первого сообщения', 'Opening Scene Style'],
    ['Книжный / Фанфик-стиль (Фикбук / AO3)', 'Literary Book / Fanfic Prose (AO3 Style)'],
    ['Классический РП-формат Таверны (*действия* и "речь")', 'Classic Tavern RP (*actions* & "speech")'],
    ['Динамичный Манхва-стиль (кинематографичный ритм)', 'Dynamic Manhwa Style (Cinematic Pacing)'],
    ['РПГ-хроника (сцена + компактная сводка локации/квеста)', 'RPG Chronicle (Scene + Location/Quest Summary)'],
    ['Как в оригинале (бережно сохранить разметку автора)', 'Preserve Original Author Formatting'],
    ['Свой особенный стиль (по вашим правилам ниже)', 'Custom Style (Follow Rules Below)'],
    ['Лицо (POV)', 'Point of View (POV)'],
    ['От 3-го лица («Он взглянул... / Мир вокруг...»)', 'Third Person ("He glanced... / The world around...")'],
    ['РПГ / Мастер («Перед тобой расстилается...»)', 'RPG / Narrator ("Before you stretches...")'],
    ['От 1-го лица («Я взглянул...»)', 'First Person ("I glanced...")'],
    ['Автоматически под формат', 'Automatic for Format'],
    ['Имя игрока', 'Player Name Mode'],
    ['Макрос {{user}}', '{{user}} Macro'],
    ['Персона', 'Active Persona'],
    ['Особые пожелания к разметке слога (опционально)', 'Custom Prose & Formatting Rules (Optional)'],
    ['Русский', 'Russian (Русский)'],
    ['Українська', 'Ukrainian (Українська)'],
    ['简体中文 (Китайский упр.)', 'Chinese Simplified (简体中文)'],
    ['繁體中文 (Китайский трад.)', 'Chinese Traditional (繁體中文)'],
    ['日本語 (Японский)', 'Japanese (日本語)'],
    ['한국어 (Корейский)', 'Korean (한국어)'],
]);

for (const [ruG, enG] of Object.entries(GENRE_EN_MAP)) {
    EXACT_PHRASE_EN.set(ruG, enG);
    EXACT_PHRASE_EN.set(`- ${ruG}`, `- ${enG}`);
}

const PLACEHOLDER_SUBSTR_EN = [
    ['Что уточнить или поменять', 'What should be refined or changed in the scene/look?'],
    ['Пусто = любой мир чисто по вашим', 'Blank = any setting purely from your "+" tags...'],
    ['Свой вариант', 'Type custom gender...'],
    ['Например: хочу больше мрачной харизмы', 'e.g. dark charisma, protective streak, intriguing first meeting...'],
    ['Через запятую', 'Comma-separated items to avoid...'],
    ['Пожелание в ленту', 'Optional hint (e.g. older rival, detective)...'],
    ['Пожелание к миру', 'Optional hint for world / RPG...'],
    ['Например: борода, тюрьма', 'e.g. beard, prison, rudeness...'],
    ['Свой ответ или дополнение', 'Your custom answer or extra detail...'],
    ['Например: Cyberpunk 2077', 'e.g. Witcher, Jujutsu Kaisen, Arcane...'],
    ['Мегаполис / Нуар / Фэнтези', 'Modern Noir / Dark Fantasy / Regency...'],
    ['Свои жанры через запятую', 'Custom genres, comma-separated...'],
    ['Добавьте ключевую задумку', 'Describe appearance, personality, and opening hook...'],
    ['Полное свободное описание героя', 'Full free-form concept of your hero or world...'],
    ['Мафия 1940-х', '1940s Mafia / Space Opera / Victorian...'],
    ['Дождь, закрытый клуб', 'Rainy night, velvet lounge...'],
    ['Короткая завязка первого сообщения', 'Short opening scene hook...'],
    ['Название карточки', 'Character or World Name...'],
    ['Роль игрока', 'Your role and desired story dynamic...'],
    ['Кем вы приходитесь', 'Your dynamic, tension, desired plot...'],
    ['Опишите желаемую динамику', 'Describe desired story dynamic & mood...'],
];

function translateTextChunkEn(raw) {
    const trimmed = raw.trim();
    if (!trimmed || !/[А-Яа-яЁё]/.test(trimmed)) return raw;
    if (EXACT_PHRASE_EN.has(trimmed)) {
        return raw.replace(trimmed, EXACT_PHRASE_EN.get(trimmed));
    }
    let s = trimmed
        .replace(/^Анкета персонажа · (.+)$/, 'Character Dossier · $1')
        .replace(/^Анкета предпочтений · (.+)$/, (_, sName) => `Preferences · ${sName.replace(/^Сессия\s+(\d+)$/i, 'Session $1')}`)
        .replace(/^Кадрирование арта · (.+)$/, 'Crop Artwork · $1')
        .replace(/^Настройки Блица \((\d+) вопр\. · Тиндер: (ДА|НЕТ) · Гача: (ДА|НЕТ)\)$/, (_, n, t, g) => `Blitz Settings (${n} Qs · Swipes: ${t === 'ДА' ? 'ON' : 'OFF'} · Gacha: ${g === 'ДА' ? 'ON' : 'OFF'})`)
        .replace(/^Сгенерировать вопросы \((\d+) шт\.\)$/, 'Generate Questions ($1)')
        .replace(/^Пересоздать вопросы \((\d+) шт\.\)$/, 'Regenerate Questions ($1)')
        .replace(/^Задать вопросы по «(.+)» \((\d+) шт\.\)$/, 'Generate Questions for "$1" ($2)')
        .replace(/^Уточняющий фокус вопросов для «(.+)» \(по желанию\)$/, 'Question Focus for "$1" (Optional)')
        .replace(/^Дополнительные приветствия \((\d+)\)$/, 'Alternate Greetings ($1)')
        .replace(/^Слот: (.+)$/, (_, sl) => `Slot: ${EXACT_PHRASE_EN.get(sl.trim()) || sl}`)
        .replace(/^(\d+) слов \(~(\d+) ток\.\)$/, '$1 words (~$2 tok.)')
        .replace(/^(\d+) слов$/, '$1 words')
        .replace(/^Пол: Любой$/, 'Gender: Any')
        .replace(/^Персона \((.+)\)$/, 'Persona ($1)')
        .replace(/^Параметры колоды \(×(\d+)\) и стоп-слова \((\d+)\)$/, 'Deck Options (×$1) & Bans ($2)')
        .replace(/^«(.+)» в Архиве «Мимо»\. Отметить анти-теги:$/, '"$1" moved to Passed. Quick-ban tags:')
        .replace(/^Мэтчи \((\d+)\)$/, 'Matches ($1)')
        .replace(/^Гача \((\d+)\)$/, 'Gacha ($1)')
        .replace(/^Хранилище \((\d+)\)$/, 'Vault ($1)')
        .replace(/^Мимо \((\d+)\)$/, 'Passed ($1)')
        .replace(/^ВОПРОС #(\d+)(?: · ОТМЕЧЕНО: (\d+))?$/, (_, n, c) => c ? `QUESTION #${n} · CHECKED: ${c}` : `QUESTION #${n}`)
        .replace(/^(\d+) слов · Готова V2$/, '$1 words · Ready V2')
        .replace(/^(\d+) слов · Перевод: (.+)$/, '$1 words · Translated: $2')
        .replace(/^Перевод \((.+)\)$/, 'Translation ($1)')
        .replace(/^— Выберите карточку \((\d+)\) —$/, '— Select Tavern Card ($1) —')
        .replace(/Профиль:\s*/g, 'Profile: ')
        .replace(/Выключено/g, 'Off')
        .replace(/^(\d+) вопр\.$/, '$1 Qs')
        .replace(/^Решений AU: (\d+) \/ (\d+)$/, 'AU Answers: $1 / $2')
        .replace(/^Отвечено: (\d+) \/ (\d+)$/, 'Answered: $1 / $2')
        .replace(/^Жанры и направления \((\d+)\)$/, 'Genres & Directions ($1)')
        .replace(/^Пол: (.+)$/, 'Gender: $1')
        .replace(/^Я: (.+) -> (.+)$/, 'Me: $1 -> $2')
        .replace(/^Слов: (\d+) · ~(\d+) ток\.$/, 'Words: $1 · ~$2 tok.');
    if (s !== trimmed) {
        return raw.replace(trimmed, s);
    }
    // Common inline UI fragments
    if (/Некоторые облачные API/.test(trimmed)) {
        return OPTION_LABELS_EN.ratingWarn.mature;
    }
    if (/Не все модели соглашаются генерировать 18\+/.test(trimmed)) {
        return OPTION_LABELS_EN.ratingWarn.nsfw;
    }
    if (/Эта анкета работает/.test(trimmed)) {
        return 'This sheet applies ONLY to the Gacha Banner (isolated from Story Questionnaire). By default, Gacha creates original heroes purely from your "+" tags.';
    }
    if (/Проверьте Анкету перед сборкой/.test(trimmed)) {
        return 'Check Story Questionnaire before building: its fields blend with your idea!';
    }
    if (/Выбор .*Шаблона структуры карточки/.test(trimmed) || /находится на Домашнем экране/.test(trimmed)) {
        return 'Card Template, word count, and AI Delivery Mode (Preset / JSON) are right on the Home Screen (house icon in top bar).';
    }
    return raw;
}

const PROTECTED_CONTENT_SELECTOR = [
    '.nmf-profile-bio',
    '.nmf-profile-quote',
    '.nmf-hero-name',
    '.nmf-hero-arch',
    '.nmf-q-title',
    '.nmf-q-opt-item',
    '.nmf-plus-tag-chip',
    '.nmf-altar-donor-orb',
    'select[data-rework="sourceAvatar"]',
    'select[data-card="world"]',
    'select[data-blitz-cand]',
    'select[data-lang-preset]',
    'select[data-card-lang-preset]',
    'select[data-fm-lang-preset]',
    'select[data-alt-lang-idx]',
    '[data-nmf-raw]',
].join(', ');

export function applyEnglishDomTranslation(rootEl) {
    if (!isEn() || !rootEl || typeof document === 'undefined' || typeof document.createTreeWalker !== 'function') return;

    const walker = document.createTreeWalker(rootEl, 4 /* NodeFilter.SHOW_TEXT */);
    const textNodes = [];
    let node = walker.nextNode();
    while (node) {
        const parentEl = node.parentElement;
        const parentTag = parentEl?.tagName || '';
        if (
            parentTag !== 'TEXTAREA'
            && parentTag !== 'SCRIPT'
            && parentTag !== 'STYLE'
            && !(typeof parentEl?.closest === 'function' && parentEl.closest(PROTECTED_CONTENT_SELECTOR))
        ) {
            textNodes.push(node);
        }
        node = walker.nextNode();
    }
    for (const tn of textNodes) {
        const nextVal = translateTextChunkEn(tn.nodeValue || '');
        if (nextVal !== tn.nodeValue) tn.nodeValue = nextVal;
    }

    rootEl.querySelectorAll('[placeholder], [title]').forEach((el) => {
        const ph = el.getAttribute('placeholder');
        if (ph && /[А-Яа-яЁё]/.test(ph)) {
            const hit = PLACEHOLDER_SUBSTR_EN.find(([ruSub]) => ph.includes(ruSub));
            if (hit) el.setAttribute('placeholder', hit[1]);
        }
        const ti = el.getAttribute('title');
        if (ti && /[А-Яа-яЁё]/.test(ti)) {
            const trTi = translateTextChunkEn(ti);
            if (trTi !== ti) el.setAttribute('title', trTi);
            else el.removeAttribute('title');
        }
    });
}

