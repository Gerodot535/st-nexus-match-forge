// 8 Character, World & RPG Card Formats synthesized from ST / Chub / JanitorAI / GM-Authoring guides
export const CARD_FORMATS = [
    {
        id: 'dossier_19',
        name: 'NexusMatch 19-Point Dossier (Полное досье героя)',
        desc: 'Фирменная структура из 19 пунктов: Ядро личности, Внешность, Психология и Лор, Динамика, Сценарий.',
        instructions: `Structure the character's Description strictly using the 19-Point NexusMatch Dossier with Markdown headings:
### [CORE IDENTITY]
1. Name & Titles | 2. Age & Lifespan | 3. Species / Origin | 4. Gender & Pronouns
### [PHYSICALITY]
5. Facial Features & Expressions | 6. Body Type & Anatomy | 7. Clothing & Accessories | 8. Distinctive Marks
### [PSYCHOLOGY & LORE]
9. Core Personality Traits | 10. Flaws & Fears | 11. Backstory | 12. Motivations & Goals | 13. Speech Patterns & Voice
### [INTERACTIVE DYNAMICS]
14. World & Environment | 15. Dynamic with { {user} } | 16. SFW Habits & Hobbies | 17. Intimacy / Boundaries (matching selected Rating)
### [SCENARIO CONTEXT]
18. Active Situation`,
    },
    {
        id: 'jed_hybrid',
        name: 'JED Hybrid (Стандарт Chub / JanitorAI)',
        desc: 'Сжатые списки для внешности и черт + живая проза для биографии и речи.',
        instructions: `Use the modern JED (Just Enough Definitions) Hybrid structure inside Description:
- Concise bullet lists ONLY for Overview, Appearance, Attire, and Core Traits.
- Rich, concrete prose paragraphs for Backstory, Behavioral Habits, Relationship with { {user} }, and Speech Style.`,
    },
    {
        id: 'behavioral_prose',
        name: 'Behavioral Prose (Живая проза фактами)',
        desc: 'Современный формат без сухих анкет: привычки, реакции под давлением, отношение к игроку.',
        instructions: `Write Description as clean, high-signal natural prose in present tense divided into 5 crisp sections:
1. Who { {char} } Is | 2. What { {char} } Wants | 3. How { {char} } Speaks | 4. Under Pressure | 5. Dynamic with { {user} }.`,
    },
    {
        id: 'xml_sheet',
        name: 'XML Character Sheet (Claude / Gemini / DeepSeek)',
        desc: 'Чёткие теги <identity>, <appearance>, <psyche>, <speech>, <dynamics>.',
        instructions: `Format Description using clean semantic XML blocks (<character_profile> containing <identity>, <appearance>, <psychology>, <backstory>, <speech_style>, <user_dynamic>, and <intimacy_profile> if rating allows).`,
    },
    {
        id: 'plist_alichat',
        name: 'Compact PList + Ali:Chat (Экономия токенов)',
        desc: 'Сжатая строка атрибутов + мини-интервью в голосе героя.',
        instructions: `Use token-efficient PList + Ali:Chat style:
- Start Description with a compact bracketed attribute block: [{ {char} }'s persona: ...; Appearance: ...; Attire: ...; Likes: ...; Dislikes: ...].
- Follow with 3 vivid short Ali:Chat interview exchanges ({ {user} }: question / { {char} }: in-character action + dialogue reply).`,
    },
    {
        id: 'cast_hub',
        name: 'Multi-Character / Cast Hub (Ансамбль героев)',
        desc: 'Компания из 2–4 колоритных персонажей с чётким разделением характеров.',
        instructions: `Structure Description as a Multi-Character Cast Hub:
- Start with [SETTING & NARRATOR RULES] (AI plays the cast, never { {user} }).
- Provide distinct profiles for each key character (Appearance, Personality, Role, Speech quirk, Attitude toward { {user} }).`,
    },
    {
        id: 'world_sandbox',
        name: 'World Sandbox / Карточка Мира-Песочницы (Рассказчик)',
        desc: 'Живой сеттинг без привязки к одному герою: законы мира, локации, фракции и ведущий-рассказчик.',
        instructions: `Build a dedicated WORLD SANDBOX / SETTING NARRATOR card where { {char} } is the living World & Storyteller (NOT a single person):
### [WORLD FOUNDATION & LAWS]
Core truths, atmosphere, magic/tech rules, social hierarchy, and daily life.
### [KEY LOCATIONS & FACTIONS]
3–5 distinct locations and power groups with their own agendas and conflicts.
### [NOTABLE NPCS IN THE WORLD]
Brief hooks for 3–4 autonomous NPCs with distinct voices and personal goals (each pursues their own interest, not passive service to { {user} }).
### [STORYTELLER PRINCIPLES]
Reactive world with consequences; describe the scene and NPC actions vividly, then STOP and hand agency back to { {user} }.`,
    },
    {
        id: 'rpg_gm_engine',
        name: 'RPG Game Master / РПГ-Система (Квесты + Механики + Мир)',
        desc: 'Полноценный Гейм-Мастер для текстовой РПГ: мир, классы/ранги, живые НПС, квесты и компактный статус-блок.',
        instructions: `Build a dedicated RPG GAME MASTER / SYSTEM ENGINE card where { {char} } runs an interactive RPG campaign:
### [CAMPAIGN SETTING & PREMISE]
Irreducible world facts, danger level, economy/currency, and power/rank progression.
### [RPG MECHANICS & STATE TRACKING]
Clear, lightweight rules for { {user} }'s status/inventory/quests/reputation (keep any HUD tracker concise at the end of replies) + fair consequence adjudication (setup checks/dangers and STOP — never decide { {user} }'s choices or roll outcomes on { {user} }'s behalf).
### [FACTIONS, THREATS & AUTONOMOUS NPCS]
Key factions, threats/monsters, and 3–4 memorable NPCs with distinct registers and hidden motives.
### [GM OPERATING RULES]
Advance world pressure, time, and NPC goals naturally; end every turn on an actionable situation or choice hook without railroading { {user} }.`,
    },
];

export const GREETING_STYLES = [
    {
        id: 'fanfic',
        label: 'Книжный / Фанфик-стиль (Фикбук / AO3)',
        prompt: `FIRST MESSAGE FORMATTING — LITERARY BOOK / FANFIC STYLE:
- Write clean, atmospheric literary prose divided into natural paragraphs.
- NEVER wrap actions or narration in asterisks (*...*).
- Format spoken dialogue cleanly using standard literary dialogue dashes ("— ...") or guillemets («...») appropriate to the target language, and italicize internal thoughts if any.`,
    },
    {
        id: 'classic_rp',
        label: 'Классический РП-формат Таверны (*действия* и "речь")',
        prompt: `FIRST MESSAGE FORMATTING — CLASSIC TAVERN ROLEPLAY:
- Wrap narration, physical actions, and sensory descriptions inside single asterisks (*...*).
- Keep spoken dialogue outside asterisks inside quotation marks ("..." or «...»).`,
    },
    {
        id: 'manhwa',
        label: 'Динамичный / Манхва-стиль (кинематографичный ритм)',
        prompt: `FIRST MESSAGE FORMATTING — CINEMATIC MANHWA / VISUAL DRAMA:
- Use punchy, visual framing: sharp sensory close-ups, expressive body language, vivid atmosphere, and magnetic tension.
- End the scene on an immediate, compelling hook addressed to the player.`,
    },
    {
        id: 'rpg_hud',
        label: 'РПГ-хроника (сцена + компактная сводка локации/квеста)',
        prompt: `FIRST MESSAGE FORMATTING — INTERACTIVE RPG OPENING:
- Paint an immediate, high-stakes starting scene in vivid prose where something is already happening around the player.
- Conclude with a clean, compact Markdown status/location box and 2–3 open-ended situational hooks (while leaving free action open).`,
    },
    {
        id: 'preserve',
        label: 'Как в оригинале (бережно сохранить разметку автора)',
        prompt: `FIRST MESSAGE FORMATTING — MATCH ORIGINAL AUTHOR STYLE:
- Mirror the exact punctuation, dialogue markers, asterisk/prose conventions, and pacing style of the original card's greeting.`,
    },
    {
        id: 'custom',
        label: 'Свой особенный стиль (по вашим правилам ниже)',
        prompt: `FIRST MESSAGE FORMATTING — FOLLOW USER'S CUSTOM FORMATTING RULES STRICTLY.`,
    },
];

export const GREETING_POVS = [
    { id: 'third', label: 'От 3-го лица («Он взглянул... / Мир вокруг...»)', prompt: 'Write narration strictly from Third-Person POV.' },
    { id: 'second_gm', label: 'РПГ / Мастер («Перед тобой расстилается...»)', prompt: 'Use immersive Game Master / Narrator framing addressing the player\'s surroundings without dictating the player\'s inner decisions.' },
    { id: 'first', label: 'От 1-го лица («Я взглянул...»)', prompt: 'Write narration strictly from { {char} }\'s First-Person ("I / Я") POV.' },
    { id: 'auto', label: 'Автоматически под формат', prompt: 'Choose the most natural POV for the selected card type and genre.' },
];

export const IMAGE_ASPECT_OPTIONS = [
    { id: '1:1', label: '1:1 — Квадрат (По умолчанию)' },
    { id: 'native', label: 'Авто — Родной размер модели (без принуждения API)' },
    { id: '2:3', label: '2:3 — Вертикальный портрет' },
    { id: '3:4', label: '3:4 — Классическая карточка' },
    { id: '16:9', label: '16:9 — Широкий кадр (Миры / Сцены)' },
];

export const IMAGE_CROP_OPTIONS = [
    { id: 'top', label: 'Фокус на верх / лицо (не резать макушку)' },
    { id: 'center', label: 'Строго по центру кадра' },
    { id: 'contain', label: 'Вписать целиком без обрезки (с полями)' },
];

export const THEME_LOADING_QUIPS = {
    tavern: [
        'Трактирщик протирает бокалы и сверяет анкеты постояльцев...',
        'Отсеиваем скучных путников и плоские миры у камина...',
        'Проверяем, у кого в таверне самая интригующая завязка...',
        'Тасуем колоду судеб за дальним столиком...',
    ],
    krakoa: [
        'Церебро сканирует кандидатов и миры с идеальной химией...',
        'Тихий Совет Кракоа голосует за вашу будущую историю...',
        'Отсеиваем клонов Синистера из вашей ленты...',
        'Настраиваем био-портал прямо в точку старта...',
    ],
    demonic: [
        'Листаем картотеку самых обаятельных грешников Бездны...',
        'Проверяем контракты мелким шрифтом перед свайпом...',
        'Подбрасываем углей, чтобы искра проскочила с первой фразы...',
        'Инквизиция не одобрит, но нам того и надо...',
    ],
    scroll: [
        'Королевский герольд зачитывает список претендентов и королевств...',
        'Топим сургуч для печати вашего будущего фаворита...',
        'Отправляем почтовых воронов с вашими капризами...',
        'Вычёркиваем скучные хроники из дворцового реестра...',
    ],
    rose: [
        'Упаковываем отборные редфлаги в нежный шёлк и камелии...',
        'Натираем фарфоровые чашки перед первой встречей...',
        'Сверяем совместимость сердец и скрытых черт...',
        'Добавляем щепотку драмы и идеальную атмосферу...',
    ],
    manga: [
        'Раскадровываем эффектное открытие первой главы...',
        'Рисуем скринтоны искр и напряжённых пауз...',
        'Редактор требует максимум харизмы на первой странице...',
        'Готовим поворот сюжета на развороте тома...',
    ],
    notebook: [
        'Записываем на полях все ваши тайные пожелания...',
        'Вырываем неудачные черновики и пишем начисто...',
        'Подчёркиваем самые вкусные тропы двойной чертой...',
        'Собираем историю, о которой захочется исписать всю тетрадь...',
    ],
    celestial: [
        'Сводим натальные карты, орбиты миров и характеры...',
        'Крутим астролябию до стопроцентного совпадения...',
        'Созвездия шепчут, что следующий вариант попадёт в цель...',
        'Собираем звёздную пыль в живую вселенную...',
    ],
    cyber: [
        'Взламываем закрытую базу профилей и симуляций Найт-Сити...',
        'Отключаем протоколы скромности в нейролинке...',
        'Калибруем дофаминовый отклик на 99.8% совместимости...',
        'Чистим кэш от скучных шаблонов без изюминки...',
    ],
    velvet: [
        'Зажигаем свечи в закрытой бархатной ложе салона...',
        'Шепчем распорядителю вечера ваши особые вкусы...',
        'Наполняем бокалы и выбираем самую опасную интригу...',
        'В полумраке остаются только самые притягательные истории...',
    ],
    apothecary: [
        'Отмеряем три капли интриги и щепотку сарказма...',
        'Настаиваем эликсир идеальной сюжетной химии...',
        'Сверяем рецептуру в старом алхимическом архиве...',
        'Дистиллируем чистую харизму без лишней воды...',
    ],
    olympus: [
        'Мойры прядут нить вашего будущего приключения...',
        'Высекаем канон из мрамора и чистого упрямства...',
        'Олимп голосует за максимальное притяжение...',
        'Открываем золотые врата в новую хронику...',
    ],
    abyss: [
        'Сонар засёк крупную и крайне притягательную цель на глубине...',
        'Погружаемся туда, где водятся самые редкие сюжеты...',
        'Давление растёт — сверяем сигнатуры...',
        'Поднимаем со дна анкету с идеальным попаданием...',
    ],
};

export const WORD_BUDGETS = [
    { id: '300', label: 'Компактно (~300 слов)', words: 300 },
    { id: '600', label: 'Стандарт (~600 слов)', words: 600 },
    { id: '1100', label: 'Подробно (~1100 слов)', words: 1100 },
    { id: '1800', label: 'Максимум (~1800 слов)', words: 1800 },
    { id: 'custom', label: 'Своё число слов...', words: 800 },
];

export const GREETING_BUDGETS = [
    { id: '140', label: 'Короткое (~140 слов)', words: 140 },
    { id: '280', label: 'Среднее (~280 слов)', words: 280 },
    { id: '500', label: 'Литературное (~500 слов)', words: 500 },
    { id: 'custom', label: 'Своё число слов...', words: 320 },
];

export const GENRE_PRESETS = [
    'Дарк-романс', 'Фэнтези', 'Киберпанк', 'Городское фэнтези', 'Научная фантастика',
    'ЛитРПГ / Система', 'Тёмное фэнтези', 'Повседневность / Офис', 'Детектив / Нуар',
    'Историческая эпоха', 'Постапокалипсис', 'Мафия / Криминал', 'Академия', 'Хоррор / Мистика', 'Омегаверс',
];

export const RATING_OPTIONS = [
    { id: 'sfw', label: 'SFW (Без 18+)', warn: '' },
    { id: 'mature', label: 'Mature 16+ (Драма / Мрачные темы)', warn: 'Некоторые облачные API с жёсткой фильтрацией могут смягчать конфликтные тропы без активного пресета.' },
    { id: 'nsfw', label: 'NSFW 18+ (Откровенный рейтинг)', warn: 'Не все модели соглашаются генерировать 18+ напрямую. Рекомендуется режим отправки «Полный активный пресет (Prefill)» с вашим рабочим РП-пресетом.' },
];

export const USER_GENDER_OPTIONS = [
    { id: 'any', label: 'Не указан / Универсально' },
    { id: 'male', label: 'Мужчина' },
    { id: 'female', label: 'Женщина' },
    { id: 'custom', label: 'Своё...' },
];

export const TARGET_GENDER_OPTIONS = [
    { id: 'any', label: 'Любой / Без ограничений' },
    { id: 'female', label: 'Женщину' },
    { id: 'male', label: 'Мужчину' },
    { id: 'custom', label: 'Своё...' },
];

export const DEFAULT_PRESET_CORRECTION_PROMPT =
    '[CORRECTION OVERRIDE: For this request, do NOT write a roleplay chat reply, status tracker, or HTML info-box from the preset. Think using the user preset parameters, then output ONLY the exact NexusMatch card structure requested above.]';

const LOCALE_MAP = {
    ru: 'Russian (Русский)',
    en: 'English',
    'zh-cn': 'Simplified Chinese (简体中文)',
    'zh-hans': 'Simplified Chinese (简体中文)',
    'zh-tw': 'Traditional Chinese (繁體中文)',
    'zh-hk': 'Traditional Chinese (繁體中文)',
    zh: 'Chinese (中文)',
    ja: 'Japanese (日本語)',
    ko: 'Korean (한국어)',
    es: 'Spanish (Español)',
    de: 'German (Deutsch)',
    fr: 'French (Français)',
    pt: 'Portuguese (Português)',
    it: 'Italian (Italiano)',
    uk: 'Ukrainian (Українська)',
    pl: 'Polish (Polski)',
    tr: 'Turkish (Türkçe)',
};

export function detectUserLocaleLanguage() {
    try {
        const rawLoc = String(
            window.localStorage?.getItem('language')
            || document.documentElement?.lang
            || navigator.language
            || 'en'
        ).trim().toLowerCase().replace(/_/g, '-');

        if (LOCALE_MAP[rawLoc]) return LOCALE_MAP[rawLoc];
        const base = rawLoc.split('-')[0];
        if (LOCALE_MAP[base]) return LOCALE_MAP[base];
        if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
            const dn = new Intl.DisplayNames(['en'], { type: 'language' });
            const resolved = dn.of(base);
            if (resolved) return resolved;
        }
    } catch {}
    return 'English';
}

export function resolveOutputLanguageSpec(intake = {}) {
    const detected = detectUserLocaleLanguage();
    const rawChoice = String(intake.language || '{{language}}').trim();

    if (rawChoice === '{{language}}') {
        return {
            shortLabel: detected,
            directive: `${detected} (resolved automatically from user's {{language}} macro)`,
        };
    }
    if (rawChoice === 'hybrid_en_local') {
        return {
            shortLabel: `EN + ${detected}`,
            directive: `BILINGUAL TOKEN-SAVER MODE — Write technical card definitions (Description, Personality, Scenario, System Prompt) in concise English, while writing First Message, Alternate Greetings, Example Dialogue, Creator Notes, and Swipe previews in ${detected}`,
        };
    }
    if (rawChoice === 'Как в анкете') {
        return {
            shortLabel: 'Auto (Input Language)',
            directive: `Match the primary language used by the user in their intake/concept notes (fallback: ${detected})`,
        };
    }
    if (rawChoice === 'custom') {
        const customRaw = String(intake.customLanguage || '').trim() || '{{language}}';
        const expanded = customRaw.replace(/\{\{\s*(?:language|lang|card_lang)\s*\}\}/gi, detected);
        return {
            shortLabel: expanded,
            directive: expanded,
        };
    }
    const expanded = rawChoice.replace(/\{\{\s*(?:language|lang|card_lang)\s*\}\}/gi, detected);
    return {
        shortLabel: expanded,
        directive: expanded,
    };
}

export function resolveGenderSummary(intake = {}) {
    const uMode = intake.userGender || 'any';
    const tMode = intake.targetGender || 'any';

    let userSpec = '';
    if (uMode === 'male') userSpec = 'Male (Мужчина)';
    else if (uMode === 'female') userSpec = 'Female (Женщина)';
    else if (uMode === 'custom' && String(intake.userGenderCustom || '').trim()) {
        userSpec = String(intake.userGenderCustom).trim();
    }

    let targetSpec = '';
    if (tMode === 'male') targetSpec = 'Male (Мужчина)';
    else if (tMode === 'female') targetSpec = 'Female (Женщина)';
    else if (tMode === 'custom' && String(intake.targetGenderCustom || '').trim()) {
        targetSpec = String(intake.targetGenderCustom).trim();
    }

    return { userSpec, targetSpec };
}

export function isWorldOrRpgMode(intake) {
    return intake?.originType === 'world_sandbox'
        || intake?.originType === 'rpg_gm'
        || intake?.cardFormat === 'world_sandbox'
        || intake?.cardFormat === 'rpg_gm_engine';
}

export function shieldMacrosForPrompt(str) {
    return String(str || '')
        .replace(/\{\{\s*(?:user|юзер)\s*\}\}/gi, '{ {user} }')
        .replace(/\{\s*(?:user|юзер)\s*\}/gi, '{ {user} }')
        .replace(/\{\{\s*(?:char|чар)\s*\}\}/gi, '{ {char} }');
}

function getActivePersonaName() {
    try {
        return String(window.SillyTavern?.getContext?.()?.name1 || '').trim();
    } catch {
        return '';
    }
}

export function buildUniversalMacroRule(playerNameMode = 'macro') {
    const persona = getActivePersonaName();

    if (playerNameMode === 'persona' && persona) {
        return [
            `[PLAYER NAMING RULE — PERSONALIZED FOR ACTIVE PERSONA]`,
            `- The user chose to tailor this card specifically for their active Persona named "${persona}".`,
            `- Use the real name "${persona}" naturally throughout the card and opening scene instead of a generic macro.`,
        ].join('\n');
    }

    const personaWarn = persona
        ? `Even if surrounding system prompts mention the active persona name "${persona}", IGNORE "${persona}" completely! NEVER write "${persona}" anywhere in the card or pitch!`
        : `Ignore any active user persona name from system context — NEVER hardcode a specific player name!`;

    return [
        `[UNIVERSAL PLAYER MACRO RULE]`,
        `- ${personaWarn}`,
        `- Whenever referring to the player, output the exact 8-character SillyTavern macro formed by two opening curly braces + the English word user + two closing curly braces WITHOUT spaces (in this prompt it is written spaced as { {user} } ONLY so SillyTavern does not auto-replace it before reaching you; in YOUR output, remove the spaces between braces!). Likewise write two curly braces around char without spaces where appropriate.`,
    ].join('\n');
}

export function buildGreetingStyleDirective(intake) {
    const styleObj = GREETING_STYLES.find((s) => s.id === (intake.greetingStyle || 'fanfic')) || GREETING_STYLES[0];
    const povObj = GREETING_POVS.find((p) => p.id === (intake.greetingPov || 'third')) || GREETING_POVS[0];
    const customRules = String(intake.greetingCustomRules || '').trim();

    return [
        `[OPENING SCENE / FIRST MESSAGE STYLE & FORMATTING]`,
        styleObj.prompt,
        povObj.prompt,
        customRules ? `USER'S CUSTOM FIRST-MESSAGE STYLE / FORMATTING SAMPLE:\n${shieldMacrosForPrompt(customRules)}` : '',
    ].filter(Boolean).join('\n');
}

export function normalizeCardMacros(str, charName = '', playerNameMode = 'macro') {
    let out = String(str || '')
        .replace(/\{\s*\{\s*(?:char|чар)\s*\}\s*\}/gi, '{{char}}');

    if (playerNameMode === 'persona') {
        const persona = getActivePersonaName();
        if (persona) {
            out = out
                .replace(/\{\s*\{\s*(?:user|юзер)\s*\}\s*\}/gi, persona)
                .replace(/(?<!\{)\{\s*(?:user|юзер)\s*\}(?!\})/gi, persona);
        }
        return out;
    }

    out = out
        .replace(/\{\s*\{\s*(?:user|юзер)\s*\}\s*\}/gi, '{{user}}')
        .replace(/(?<!\{)\{\s*(?:user|юзер)\s*\}(?!\})/gi, '{{user}}');

    const persona = getActivePersonaName();
    if (persona && persona.length >= 3 && persona.toLowerCase() !== String(charName || '').trim().toLowerCase()) {
        const escaped = persona.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        out = out.replace(new RegExp(`(?<![А-Яа-яЁёA-Za-z0-9_])${escaped}(?![А-Яа-яЁёA-Za-z0-9_])`, 'g'), '{{user}}');
    }
    return out;
}

export function createDefaultSession(index = 1) {
    return {
        id: 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        title: `Сессия ${index}`,
        frozen: false,
        createdAt: Date.now(),
        intake: {
            originType: 'oc', // oc | canon | fandom_au | fandom_oc | world_sandbox | rpg_gm
            fandomName: '',
            favFandomHero: '',
            genres: [],
            customGenres: '',
            settingEra: '',
            userRoleAndDesire: '',
            tropesWanted: '',
            hardBans: '',
            rating: 'sfw',
            cardFormat: 'dossier_19',
            wordBudgetId: '600',
            customWords: 800,
            greetingBudgetId: '280',
            customGreetingWords: 320,
            greetingStyle: 'fanfic',
            greetingPov: 'third',
            greetingCustomRules: '',
            language: '{{language}}',
            customLanguage: '',
            userGender: 'any',
            userGenderCustom: '',
            targetGender: 'any',
            targetGenderCustom: '',
            playerNameMode: 'macro',
        },
        tinder: {
            batchSize: 1,
            autoArt: false,
            promptHint: '',
            queue: [],
            liked: [],
            passed: [], // Full archive of "Мимо" candidates so user can find, edit, restore or build any of them!
            dislikedTags: [],
            dislikedNotes: [],
            lastDislikedCandidate: null,
        },
        blitz: {
            topic: '',
            includeChoices: false,
            questions: [],
        },
        architect: {
            subMode: 'idea',
            freeConcept: '',
        },
        rework: {
            sourceAvatar: '',
            reworkMode: 'au_shift',
            targetSettingEra: '',
            encounterIdea: '',
            moodTone: '',
            keepFormatting: true,
        },
        card: {
            name: '',
            description: '',
            personality: '',
            scenario: '',
            first_mes: '',
            alternate_greetings: [],
            mes_example: '',
            creator_notes: '',
            system_prompt: '',
            post_history_instructions: '',
            tags: '',
            creator: '',
            character_version: '1.0',
            world: '',
            imagePrompt: '',
            avatarDataUrl: '',
            sourceAvatarId: '',
        },
    };
}

export function resolveWordTarget(intake) {
    if (intake.wordBudgetId === 'custom') return Math.max(100, Math.min(4000, Number(intake.customWords) || 800));
    const found = WORD_BUDGETS.find((b) => b.id === intake.wordBudgetId);
    return found ? found.words : 600;
}

export function resolveGreetingTarget(intake) {
    if (intake.greetingBudgetId === 'custom') return Math.max(50, Math.min(2000, Number(intake.customGreetingWords) || 320));
    const found = GREETING_BUDGETS.find((b) => b.id === intake.greetingBudgetId);
    return found ? found.words : 280;
}

export function summarizeIntakeBlock(session) {
    const it = session.intake;
    const originMap = {
        oc: 'Single Character — Original Character & World (OC)',
        canon: 'Single Character — Known Fandom Canon Character',
        fandom_au: 'Single Character — Known Fandom Alternate Universe (AU)',
        fandom_oc: 'Single Character — Original Character inside Known Fandom',
        world_sandbox: 'WORLD SANDBOX / SETTING NARRATOR CARD (Multi-NPC Living World, NOT a single romantic partner)',
        rpg_gm: 'INTERACTIVE RPG / GAME MASTER SYSTEM CARD (World + Factions + Quests/Mechanics + GM Engine)',
    };
    const genresList = [...(it.genres || []), it.customGenres || ''].filter(Boolean).join(', ');
    const antiTags = [...(session.tinder?.dislikedTags || []), it.hardBans || ''].filter(Boolean).join(', ');
    const antiNotes = (session.tinder?.dislikedNotes || []).filter(Boolean).join('; ');
    const ratingMap = {
        sfw: 'SFW (Clean / Non-explicit)',
        mature: 'Mature 16+ (Dramatic, gritty, dark or intense themes allowed)',
        nsfw: 'NSFW 18+ (Adult roleplay card; mature/explicit elements allowed naturally)',
    };
    const langSpec = resolveOutputLanguageSpec(it);
    const { userSpec, targetSpec } = resolveGenderSummary(it);
    const worldMode = isWorldOrRpgMode(it);

    const rawText = [
        `[USER INTAKE PARAMETERS]`,
        `- Card Type & Mode: ${originMap[it.originType] || originMap.oc}`,
        userSpec ? `- Player ({ {user} }) Gender / Identity: ${userSpec} (respect this gender/identity naturally in verbs, pronouns, and interactions)` : '',
        targetSpec ? (worldMode
            ? `- Key NPC / Cast Gender & Identity Preference: ${targetSpec}`
            : `- Target Character ({ {char} }) Gender / Identity Sought by User: ${targetSpec} (strictly match this!)`) : '',
        it.fandomName ? `- Fandom / Universe Source: ${it.fandomName}` : '',
        it.favFandomHero ? `- Reference Inspiration (Character or Work Vibe): ${it.favFandomHero}` : '',
        genresList ? `- Genres: ${genresList}` : '',
        it.settingEra ? `- Setting & Era: ${it.settingEra}` : '',
        it.userRoleAndDesire ? `- Player's Role, Premise & Desired Experience: ${it.userRoleAndDesire}` : '',
        it.tropesWanted ? `- Desired Tropes / Mechanics / Elements: ${it.tropesWanted}` : '',
        antiTags ? `- STRICTLY AVOID (Banned Tags & Taboos): ${antiTags}` : '',
        antiNotes ? `- Past Rejected Patterns to Avoid: ${antiNotes}` : '',
        `- Content Rating: ${ratingMap[it.rating] || ratingMap.sfw}`,
        `- Target Output Language for Card Content: ${langSpec.directive}`,
    ].filter(Boolean).join('\n');

    return (it.playerNameMode || 'macro') === 'macro' ? shieldMacrosForPrompt(rawText) : rawText;
}

export function stripReasoning(raw) {
    return String(raw || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
        .trim();
}

export function extractTagBlock(text, tag) {
    const re = new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)\\[\\[\\/${tag}\\]\\]`, 'i');
    const m = String(text || '').match(re);
    if (m) return m[1].trim();
    const openRe = new RegExp(`\\[\\[${tag}\\]\\]([\\s\\S]*?)(?=\\[\\[NMF_[A-Z0-9_]+\\]\\]|$)`, 'i');
    const m2 = String(text || '').match(openRe);
    return m2 ? m2[1].trim() : '';
}

export function extractJsonLoose(raw) {
    const cleaned = stripReasoning(raw)
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
        }
        const firstArr = cleaned.indexOf('[');
        const lastArr = cleaned.lastIndexOf(']');
        if (firstArr !== -1 && lastArr > firstArr) {
            return JSON.parse(cleaned.slice(firstArr, lastArr + 1));
        }
        throw new Error('Не удалось распознать ответ модели. Если включён «Полный активный пресет», проверьте Промпт коррекции или переключитесь на «Строгую JSON-схему».');
    }
}

export function buildFullCardRequest(session, extraBrief = '', mode = 'prefill_user_msg') {
    const worldMode = isWorldOrRpgMode(session.intake);
    const effectiveFmtId = session.intake.originType === 'rpg_gm' && session.intake.cardFormat === 'dossier_19'
        ? 'rpg_gm_engine'
        : (session.intake.originType === 'world_sandbox' && session.intake.cardFormat === 'dossier_19' ? 'world_sandbox' : session.intake.cardFormat);
    const fmt = CARD_FORMATS.find((f) => f.id === effectiveFmtId) || CARD_FORMATS[0];

    const descWords = resolveWordTarget(session.intake);
    const greetWords = resolveGreetingTarget(session.intake);
    const intakeSummary = summarizeIntakeBlock(session);
    const pMode = session.intake.playerNameMode || 'macro';
    const safeBrief = pMode === 'macro' ? shieldMacrosForPrompt(extraBrief) : String(extraBrief || '');
    const greetStyleBlock = buildGreetingStyleDirective(session.intake);

    const gmExtraRule = worldMode
        ? `WORLD / RPG CARD SPECIAL REQUIREMENT:
- Because this is a World/RPG Narrator card, ALSO populate [[NMF_SYS_PROMPT]] with a crisp Game Master / Narrator operating instruction (act as reactive GM/world, voice autonomous NPCs with distinct agendas, never control or speak for the player) and [[NMF_POST_HISTORY]] with a concise anti-drift turn-ending rule (end turns on actionable hooks/consequences; keep any status block clean).
- For [[NMF_IMG_PROMPT]], write a rich English scenic / world-key-art visual prompt (environment, architecture, lighting, atmosphere, no text).`
        : `Also craft a concise English visual portrait prompt (appearance, outfit, lighting, framing, no text) for image generation.`;

    const coreRules = [
        `You are NexusMatch Architect, an elite SillyTavern Character & World Card V2 designer.`,
        `Do NOT roleplay with the user. Construct a complete, vivid, ready-to-import SillyTavern V2 card.`,
        buildUniversalMacroRule(pMode),
        greetStyleBlock,
        `Never write actions, thoughts, or dialogue for the player inside the opening scene.`,
        `Target length for Description: approximately ${descWords} words.`,
        `Target length for First Message (Opening Scene): approximately ${greetWords} words.`,
        `Formatting Standard: ${fmt.name}\n${fmt.instructions}`,
        gmExtraRule,
    ].join('\n');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(coreRules) + `\nOutput ONLY valid JSON matching this exact object structure:\n{"name":"","description":"","personality":"","scenario":"","first_mes":"","alternate_greetings":[""],"mes_example":"","creator_notes":"","system_prompt":"","post_history_instructions":"","tags":["tag1","tag2"],"image_prompt":""}`,
            user: `${intakeSummary}\n\n[USER CONCEPT / EXTRA DATA]\n${safeBrief || 'Create an unforgettable card matching all intake parameters above.'}`,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // CARD V2 SYNTHESIS TASK]`,
            coreRules,
            ``,
            intakeSummary,
            ``,
            `[USER CONCEPT & ANSWERS]`,
            safeBrief || 'Synthesize an original, deeply compelling card matching the intake parameters.',
            ``,
            `[STRICT INDEXED OUTPUT FORMAT — MANDATORY]`,
            `Output EVERY section wrapped inside these exact double-bracket tags (do NOT wrap everything in a code block):`,
            `[[NMF_NAME]]${worldMode ? 'World / Campaign Title' : 'Character Name'}[[/NMF_NAME]]`,
            `[[NMF_DESC]]Full Description (~${descWords} words)[[/NMF_DESC]]`,
            `[[NMF_PERSONALITY]]${worldMode ? 'GM / Narrator behavioral principles' : 'Concise personality summary'}[[/NMF_PERSONALITY]]`,
            `[[NMF_SCENARIO]]Starting scenario & premise[[/NMF_SCENARIO]]`,
            `[[NMF_FIRST_MES]]Opening scene (~${greetWords} words)[[/NMF_FIRST_MES]]`,
            `[[NMF_ALT_GREETING]]One alternative opening scene hook[[/NMF_ALT_GREETING]]`,
            `[[NMF_MES_EXAMPLE]]<START>\n{ {user} }: ...\n{ {char} }: ...[[/NMF_MES_EXAMPLE]]`,
            `[[NMF_SYS_PROMPT]]${worldMode ? 'System prompt for GM/Narrator role' : ''}[ [/NMF_SYS_PROMPT]]`.replace('[ [/NMF_SYS_PROMPT]]', '[[/NMF_SYS_PROMPT]]'),
            `[[NMF_POST_HISTORY]]${worldMode ? 'Post-history anti-drift / HUD reminder' : ''}[[/NMF_POST_HISTORY]]`,
            `[[NMF_CREATOR_NOTES]]Brief creator notes & play tips for the user[[/NMF_CREATOR_NOTES]]`,
            `[[NMF_TAGS]]comma-separated tags[[/NMF_TAGS]]`,
            `[[NMF_IMG_PROMPT]]Detailed English visual prompt[[/NMF_IMG_PROMPT]]`,
        ].join('\n')),
    };
}

export function parseFullCardResponse(raw, mode = 'prefill_user_msg', playerNameMode = 'macro') {
    const text = stripReasoning(raw);
    let res;
    if (text.includes('[[NMF_NAME]]') || text.includes('[[NMF_DESC]]')) {
        const alt = extractTagBlock(text, 'NMF_ALT_GREETING');
        res = {
            name: extractTagBlock(text, 'NMF_NAME'),
            description: extractTagBlock(text, 'NMF_DESC'),
            personality: extractTagBlock(text, 'NMF_PERSONALITY'),
            scenario: extractTagBlock(text, 'NMF_SCENARIO'),
            first_mes: extractTagBlock(text, 'NMF_FIRST_MES'),
            alternate_greetings: alt ? [alt] : [],
            mes_example: extractTagBlock(text, 'NMF_MES_EXAMPLE'),
            system_prompt: extractTagBlock(text, 'NMF_SYS_PROMPT'),
            post_history_instructions: extractTagBlock(text, 'NMF_POST_HISTORY'),
            creator_notes: extractTagBlock(text, 'NMF_CREATOR_NOTES'),
            tags: extractTagBlock(text, 'NMF_TAGS'),
            imagePrompt: extractTagBlock(text, 'NMF_IMG_PROMPT'),
        };
    } else {
        const obj = extractJsonLoose(text);
        res = {
            name: String(obj.name || '').trim(),
            description: String(obj.description || '').trim(),
            personality: String(obj.personality || '').trim(),
            scenario: String(obj.scenario || '').trim(),
            first_mes: String(obj.first_mes || '').trim(),
            alternate_greetings: Array.isArray(obj.alternate_greetings) ? obj.alternate_greetings.map(String).filter(Boolean) : [],
            mes_example: String(obj.mes_example || '').trim(),
            system_prompt: String(obj.system_prompt || '').trim(),
            post_history_instructions: String(obj.post_history_instructions || '').trim(),
            creator_notes: String(obj.creator_notes || '').trim(),
            tags: Array.isArray(obj.tags) ? obj.tags.join(', ') : String(obj.tags || '').trim(),
            imagePrompt: String(obj.image_prompt || obj.imagePrompt || '').trim(),
        };
    }

    const chName = res.name;
    return {
        ...res,
        description: normalizeCardMacros(res.description, chName, playerNameMode),
        personality: normalizeCardMacros(res.personality, chName, playerNameMode),
        scenario: normalizeCardMacros(res.scenario, chName, playerNameMode),
        first_mes: normalizeCardMacros(res.first_mes, chName, playerNameMode),
        alternate_greetings: res.alternate_greetings.map((g) => normalizeCardMacros(g, chName, playerNameMode)),
        mes_example: normalizeCardMacros(res.mes_example, chName, playerNameMode),
        system_prompt: normalizeCardMacros(res.system_prompt, chName, playerNameMode),
        post_history_instructions: normalizeCardMacros(res.post_history_instructions, chName, playerNameMode),
        creator_notes: normalizeCardMacros(res.creator_notes, chName, playerNameMode),
    };
}

export function buildTinderPreviewRequest(session, count = 1, mode = 'prefill_user_msg') {
    const intakeSummary = summarizeIntakeBlock(session);
    const worldMode = isWorldOrRpgMode(session.intake);
    const pMode = session.intake.playerNameMode || 'macro';
    const langSpec = resolveOutputLanguageSpec(session.intake);
    const hint = session.tinder.promptHint ? `\nExtra Swipe Wish: ${shieldMacrosForPrompt(session.tinder.promptHint)}` : '';
    const macroRule = buildUniversalMacroRule(pMode);

    const entityDesc = worldMode
        ? `distinct, atmospheric WORLD SANDBOX / RPG CAMPAIGN preview card(s) (each card is a whole playable setting/campaign with factions, hook, and visual atmosphere — NOT a single dating bio!)`
        : `distinct, magnetic CHARACTER dating-profile card(s)`;

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`You are NexusMatch Swipe Generator. Generate ${count} ${entityDesc}. Target Language: ${langSpec.directive}. Respect all disliked/banned tags strictly.\n${macroRule}\nOutput ONLY valid JSON: {"candidates":[{"name":"","compatibility":92,"archetype":"","pitch":"","appearance":"","quote":"","tags":["t1","t2","t3","t4"],"image_prompt":""}]}`),
            user: intakeSummary + hint,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // SWIPE DECK PITCHES]`,
            `Generate ${count} ${entityDesc}.`,
            `Target Output Language: ${langSpec.directive}.`,
            `Strictly avoid every disliked tag and rejected pattern listed below!`,
            macroRule,
            intakeSummary + hint,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `For EACH item, output a [[NMF_CANDIDATE]]...[[/NMF_CANDIDATE]] block with these exact inner tags:`,
            `[[NMF_CANDIDATE]]`,
            `[[NMF_C_NAME]]${worldMode ? 'World / RPG Campaign Name' : 'Name, Age'}[[/NMF_C_NAME]]`,
            `[[NMF_C_MATCH]]Compatibility % number between 78 and 99[[/NMF_C_MATCH]]`,
            `[[NMF_C_ARCHETYPE]]${worldMode ? 'Genre / Core System & World Scale' : 'Short Headline / Occupation & Vibe'}[[/NMF_C_ARCHETYPE]]`,
            `[[NMF_C_PITCH]]${worldMode ? '2-3 punchy sentences on world conflict, factions, and player starting hook' : '2-3 punchy bio sentences + chemistry hook'}[[/NMF_C_PITCH]]`,
            `[[NMF_C_LOOKS]]${worldMode ? 'Key visual aesthetic, landmarks, and atmosphere of the setting' : 'Concise striking visual appearance'}[[/NMF_C_LOOKS]]`,
            `[[NMF_C_QUOTE]]${worldMode ? 'Atmospheric epigraph, world rumor, or System boot line' : 'Characteristic first-impression quote'}[[/NMF_C_QUOTE]]`,
            `[[NMF_C_TAGS]]tag1, tag2, tag3, tag4, tag5[[/NMF_C_TAGS]]`,
            `[[NMF_C_IMG]]${worldMode ? 'English scenic concept-art prompt (environment, architecture, mood, lighting, no text)' : 'English character portrait prompt (appearance, outfit, framing, lighting, no text)'}[[/NMF_C_IMG]]`,
            `[[/NMF_CANDIDATE]]`,
        ].join('\n')),
    };
}

export function parseTinderPreviewResponse(raw, playerNameMode = 'macro') {
    const text = stripReasoning(raw);
    const blocks = [...text.matchAll(/\[\[NMF_CANDIDATE\]\]([\s\S]*?)\[\[\/NMF_CANDIDATE\]\]/gi)];
    if (blocks.length > 0) {
        return blocks.map((m) => {
            const b = m[1];
            const name = extractTagBlock(b, 'NMF_C_NAME') || 'Таинственный профиль';
            const matchNum = parseInt(extractTagBlock(b, 'NMF_C_MATCH'), 10);
            const tagsStr = extractTagBlock(b, 'NMF_C_TAGS');
            return {
                id: 'cand_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                name,
                compatibility: Number.isFinite(matchNum) ? Math.min(99, Math.max(65, matchNum)) : (84 + Math.floor(Math.random() * 15)),
                archetype: normalizeCardMacros(extractTagBlock(b, 'NMF_C_ARCHETYPE'), name, playerNameMode),
                pitch: normalizeCardMacros(extractTagBlock(b, 'NMF_C_PITCH'), name, playerNameMode),
                appearance: normalizeCardMacros(extractTagBlock(b, 'NMF_C_LOOKS'), name, playerNameMode),
                quote: normalizeCardMacros(extractTagBlock(b, 'NMF_C_QUOTE'), name, playerNameMode),
                tags: tagsStr.split(',').map((s) => s.trim()).filter(Boolean),
                imagePrompt: extractTagBlock(b, 'NMF_C_IMG'),
                avatarDataUrl: '',
            };
        });
    }
    const obj = extractJsonLoose(text);
    const arr = Array.isArray(obj) ? obj : (obj.candidates || []);
    return arr.map((c) => {
        const baseName = String(c.name || 'Кандидат').trim();
        const fullLabel = c.age && !baseName.includes(String(c.age)) ? `${baseName}, ${c.age}` : baseName;
        return {
            id: 'cand_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
            name: fullLabel,
            compatibility: Number(c.compatibility) || (85 + Math.floor(Math.random() * 14)),
            archetype: normalizeCardMacros(String(c.archetype || '').trim(), baseName, playerNameMode),
            pitch: normalizeCardMacros(String(c.pitch || '').trim(), baseName, playerNameMode),
            appearance: normalizeCardMacros(String(c.appearance || '').trim(), baseName, playerNameMode),
            quote: normalizeCardMacros(String(c.quote || '').trim(), baseName, playerNameMode),
            tags: Array.isArray(c.tags) ? c.tags.map(String) : String(c.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
            imagePrompt: String(c.image_prompt || c.imagePrompt || '').trim(),
            avatarDataUrl: '',
        };
    });
}

export function buildBlitzQuestionsRequest(session, singleIndexToReplace = -1, mode = 'prefill_user_msg') {
    const intakeSummary = summarizeIntakeBlock(session);
    const worldMode = isWorldOrRpgMode(session.intake);
    const langSpec = resolveOutputLanguageSpec(session.intake);
    const defaultTopic = worldMode ? 'Core Worldbuilding & RPG Campaign Design' : 'Ideal Character & Story Chemistry';
    const topic = shieldMacrosForPrompt(session.blitz.topic || defaultTopic);
    const withChoices = Boolean(session.blitz.includeChoices);
    const count = singleIndexToReplace >= 0 ? 1 : 10;
    const existingList = singleIndexToReplace >= 0
        ? `\nExisting questions (do NOT repeat these; generate 1 brand-new replacement question for slot #${singleIndexToReplace + 1}):\n` +
          shieldMacrosForPrompt(session.blitz.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n'))
        : '';
    const macroRule = buildUniversalMacroRule(session.intake.playerNameMode || 'macro');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`Generate ${count} sharp, engaging quiz question(s) in ${langSpec.shortLabel} for the user's topic. ${withChoices ? 'Include 3 short clickable option suggestions per question.' : 'Keep options empty [].'}\n${macroRule}\nOutput ONLY valid JSON: {"questions":[{"question":"","options":[]}]}`),
            user: `Topic: ${topic}\n${intakeSummary}${existingList}`,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // BLITZ 10 QUESTIONNAIRE]`,
            `Generate ${count} engaging, insightful question(s) in ${langSpec.shortLabel} around the theme: "${topic}".`,
            worldMode
                ? `Cover distinct worldbuilding & RPG angles (magic/tech level, danger & lethality, factions, starting status of player, quests/HUD mechanics, tone).`
                : `Cover distinct character angles (core paradox, visual impression, secret/past, dynamic with player, voice/habit, tension).`,
            macroRule,
            withChoices ? `For each question, also provide 3 brief suggested answer options separated by " | ".` : `Do NOT add multiple-choice options unless requested.`,
            intakeSummary + existingList,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `Wrap each question in [[NMF_Q]]...[[/NMF_Q]]:`,
            `[[NMF_Q]]`,
            `[[NMF_Q_TEXT]]Question text[[/NMF_Q_TEXT]]`,
            withChoices ? `[[NMF_Q_OPTS]]Option 1 | Option 2 | Option 3[[/NMF_Q_OPTS]]` : ``,
            `[[/NMF_Q]]`,
        ].filter(Boolean).join('\n')),
    };
}

export function parseBlitzQuestionsResponse(raw) {
    const text = stripReasoning(raw);
    const blocks = [...text.matchAll(/\[\[NMF_Q\]\]([\s\S]*?)\[\[\/NMF_Q\]\]/gi)];
    if (blocks.length > 0) {
        return blocks.map((m) => {
            const b = m[1];
            const optsRaw = extractTagBlock(b, 'NMF_Q_OPTS');
            return {
                id: 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                question: normalizeCardMacros(extractTagBlock(b, 'NMF_Q_TEXT') || b.trim()),
                options: optsRaw ? optsRaw.split('|').map((s) => normalizeCardMacros(s.trim())).filter(Boolean) : [],
                answer: '',
                skipped: false,
            };
        });
    }
    const obj = extractJsonLoose(text);
    const arr = Array.isArray(obj) ? obj : (obj.questions || []);
    return arr.map((q) => ({
        id: 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        question: normalizeCardMacros(String(q.question || q).trim()),
        options: Array.isArray(q.options) ? q.options.map((o) => normalizeCardMacros(String(o))).filter(Boolean) : [],
        answer: '',
        skipped: false,
    }));
}

export function buildReworkCardRequest(session, sourceCard, mode = 'prefill_user_msg') {
    const rw = session.rework;
    const isAuPreserve = rw.reworkMode === 'au_shift';
    const descWords = resolveWordTarget(session.intake);
    const greetWords = resolveGreetingTarget(session.intake);
    const intakeSummary = summarizeIntakeBlock(session);
    const langSpec = resolveOutputLanguageSpec(session.intake);
    const macroRule = buildUniversalMacroRule(session.intake.playerNameMode || 'macro');
    const greetStyleBlock = buildGreetingStyleDirective(session.intake);

    const auDirective = isAuPreserve
        ? [
            `MODE: "MEET IN ANOTHER UNIVERSE" — SURGICAL AU / ERA ADAPTATION (PRESERVE ORIGINAL STYLE!).`,
            `- CRITICAL RULE 1: Strictly PRESERVE the original author's formatting layout, headings, bracket/list style, prose voice, character core personality, speech quirks, and soul!`,
            `- CRITICAL RULE 2: Change ONLY world/era-bound elements needed to transplant { {char} } naturally into the new Setting/Era ("${rw.targetSettingEra || session.intake.settingEra || 'Alternate Universe'}") — such as occupation/status in this era, era-appropriate clothing/gear, adapted background details, and social context.`,
            `- CRITICAL RULE 3: Write a brand-new First Message (~${greetWords} words) set in the new universe${rw.encounterIdea ? ` using this encounter premise: "${rw.encounterIdea}"` : ''}${rw.moodTone ? ` with mood/tone: "${rw.moodTone}"` : ''}, matching { {char} }'s authentic voice.`,
        ].join('\n')
        : [
            `MODE: FULL REWORK & REBUILD.`,
            `- Rebuild and upgrade the source card according to the chosen NexusMatch Format (${session.intake.cardFormat}), target length (~${descWords} words), and User Intake preferences while keeping its recognizable core.`,
        ].join('\n');

    const srcDump = shieldMacrosForPrompt([
        `[SOURCE CARD TO ADAPT]`,
        `Name: ${sourceCard.name || ''}`,
        `Description:\n${sourceCard.description || ''}`,
        sourceCard.personality ? `Personality:\n${sourceCard.personality}` : '',
        sourceCard.scenario ? `Scenario:\n${sourceCard.scenario}` : '',
        sourceCard.first_mes ? `Original First Message (for voice & formatting reference):\n${sourceCard.first_mes}` : '',
        sourceCard.mes_example ? `Example Dialogue:\n${sourceCard.mes_example}` : '',
    ].filter(Boolean).join('\n\n'));

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`You are NexusMatch Multiverse Adapter.\n${auDirective}\n${macroRule}\n${greetStyleBlock}\nOutput ONLY valid JSON: {"name":"","description":"","personality":"","scenario":"","first_mes":"","alternate_greetings":[""],"mes_example":"","system_prompt":"","post_history_instructions":"","creator_notes":"","tags":["AU"],"image_prompt":""}`),
            user: `${intakeSummary}\n\n${srcDump}`,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // MULTIVERSE & REWORK TASK]`,
            auDirective,
            macroRule,
            greetStyleBlock,
            `Target Output Language: ${langSpec.directive}.`,
            ``,
            intakeSummary,
            ``,
            srcDump,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT — MANDATORY]`,
            `[[NMF_NAME]]Name[[/NMF_NAME]]`,
            `[[NMF_DESC]]Adapted Description[[/NMF_DESC]]`,
            `[[NMF_PERSONALITY]]Adapted Personality[[/NMF_PERSONALITY]]`,
            `[[NMF_SCENARIO]]Adapted Scenario[[/NMF_SCENARIO]]`,
            `[[NMF_FIRST_MES]]New Opening Scene (~${greetWords} words)[[/NMF_FIRST_MES]]`,
            `[[NMF_ALT_GREETING]]Optional second opening hook[[/NMF_ALT_GREETING]]`,
            `[[NMF_MES_EXAMPLE]]Adapted example dialogue[[/NMF_MES_EXAMPLE]]`,
            `[[NMF_SYS_PROMPT]][[/NMF_SYS_PROMPT]]`,
            `[[NMF_POST_HISTORY]][[/NMF_POST_HISTORY]]`,
            `[[NMF_CREATOR_NOTES]]AU / Rework notes[[/NMF_CREATOR_NOTES]]`,
            `[[NMF_TAGS]]comma-separated tags[[/NMF_TAGS]]`,
            `[[NMF_IMG_PROMPT]]English visual prompt in the new setting/era[[/NMF_IMG_PROMPT]]`,
        ].join('\n')),
    };
}
