// 8 Character, World & RPG Card Formats synthesized from ST / Chub / JanitorAI / GM-Authoring guides
// Note (NMF-017): World Sandbox and RPG GM Engine are structured content templates packaged inside standard Character Card V2 (chara_card_v2).
import { isEn, tx, detectDefaultUiLang, normalizeUiLang } from './nmf_i18n.js';

export const SETTINGS_SCHEMA_VERSION = 7;
export const MAX_LIKED_CANDIDATES = 100;
export const MAX_PASSED_CANDIDATES = 50;
export const MAX_GACHA_COLLECTION = 80;
export const MAX_SAVED_VAULT = 60;
export const GACHA_CYCLE_LIMIT = 10;
export const DEFAULT_GACHA_COOLDOWN_MINUTES = 120;
export const BLITZ_COUNT_OPTIONS = Object.freeze([5, 7, 10, 12, 15, 20]);
export const AU_QUESTION_COUNT_OPTIONS = Object.freeze([3, 5, 7, 10, 12]);
export const SACRIFICE_FAIL_CHANCE_OPTIONS = Object.freeze([15, 25, 40, 50]);

export const GACHA_RESOLUTION_OPTIONS = Object.freeze([
    { id: 'sillyimages_default', label: 'Как в SillyImages (не менять профиль)', labelEn: 'SillyImages Default (Keep Profile)' },
    { id: '2:3', label: '2:3 Коллекционная карта', labelEn: '2:3 Collectible Portrait Card' },
    { id: '3:4', label: '3:4 Классический портрет', labelEn: '3:4 Classic Portrait' },
    { id: '1:1', label: '1:1 Квадратная аватарка', labelEn: '1:1 Square Avatar' },
    { id: '3:2', label: '3:2 Широкая открытка', labelEn: '3:2 Wide Story Card' },
    { id: '16:9', label: '16:9 Кино-баннер', labelEn: '16:9 Widescreen Banner' },
    { id: '9:16', label: '9:16 Вертикальный постер', labelEn: '9:16 Full Vertical Poster' },
]);

export const GACHA_LUCK_OPTIONS = Object.freeze([
    { id: 'fair', label: 'Честный рандом (1-5 зв.)', labelEn: 'Fair Random (Honest 1-5 Star Odds)' },
    { id: 'soft', label: 'Мягкая удача (чаще 3-5 зв.)', labelEn: 'Soft Boost (More 3-5 Star Drops)' },
    { id: 'high', label: 'Сильная подкрутка (4-5 зв.)', labelEn: 'High Rigging (4-5 Star Focus)' },
    { id: 'jackpot', label: 'Золотой гарант (только 5 зв.)', labelEn: 'Golden Jackpot (All 5-Star)' },
]);

export const GACHA_TARGET_OPTIONS = Object.freeze([
    { id: 'oc', label: 'Оригинальный герой с нуля чисто по «+» тегам (По умолчанию)' },
    { id: 'fandom_oc', label: 'Новый герой (OC) внутри выбранной вселенной' },
    { id: 'canon_au', label: 'Канонный персонаж / AU указанного фандома' },
    { id: 'duo_group', label: 'Дуэт / Группа (2–3 персонажа в одной карте)' },
    { id: 'artifact', label: 'Особый Предмет / Разумный Артефакт' },
    { id: 'world_rpg', label: 'Мир / РПГ-система (без привязки к одному лицу)' },
]);

export const THEMED_SACRIFICE_WARNINGS = Object.freeze({
    tavern: {
        title: 'Печать Пепла Старой Таверны',
        body: 'Хозяин трактира молча открывает заслонку камина. Стоит бросить листок с именем «{name}» в раскалённые угли — и постоялец навсегда исчезнет из книг Таверны без архива «Мимо» и без единого шанса когда-нибудь вернуться за этот столик.',
    },
    krakoa: {
        title: 'Стирание из Протоколов Воскрешения',
        body: 'Тихий Совет предупреждает лишь однажды: резервные матрицы Церебро для «{name}» будут принудительно обнулены, а Пятёрке запрещено запускать цикл возрождения. Герой навсегда стирается из списков Кракоа и Таверны без права на возврат.',
    },
    demonic: {
        title: 'Кровавый Пакт Алтаря Бездны',
        body: 'Бездна не берёт залогов взаймы. Как только печать сомкнётся, душа и карточка «{name}» будут пожраны адским пламенем и навсегда выжжены из Гримуара и Таверны — без пепла в архиве и без малейшей надежды на воскрешение.',
    },
    scroll: {
        title: 'Королевский Указ о Вечном Изгнании',
        body: 'Придворный герольд заносит стальной скребок над пергаментом. Имя «{name}» будет выскоблено из всех хроник двора и удалено из Таверны навеки — ни один летописец больше не восстановит сожжённый свиток.',
    },
    rose: {
        title: 'Разбитое Фарфоровое Сердце',
        body: 'Столь хрупкую вещь можно уронить лишь один раз. Образ «{name}» рассыплется в тончайшую пудру и навсегда исчезнет из вашей шкатулки и Таверны — склеить или вернуть эту анкету будет невозможно.',
    },
    manga: {
        title: 'Шредер Главного Редактора',
        body: 'Беспощадный вердикт редакции перед сдачей номера: профиль персонажа «{name}» отправляется прямиком под ножи шредера без черновых копий и навсегда выбывает из Таверны без шанса на спин-офф.',
    },
    notebook: {
        title: 'Вырванная Страница Дневника',
        body: 'Лист с историей «{name}» будет вырван с корнем из переплёта и сожжён над свечой. Ни ластика, ни черновика на полях — запись навсегда исчезнет из Таверны без возможности восстановления.',
    },
    celestial: {
        title: 'Коллапс Погасшего Созвездия',
        body: 'Звезда судьбы «{name}» обращается в тёмную сингулярность, отдавая остаток своего света на новые Молитвы. Нить этого героя навсегда обрывается в Астральном Кодексе и удаляется из Таверны без возврата.',
    },
    cyber: {
        title: 'Деструктивная Перезапись Энграммы',
        body: 'Внимание оператора: сектора памяти энграммы «{name}» будут выжжены на физическом уровне без теневого бэкапа. Профиль навсегда удаляется из нейросети и Таверны в обмен на чистый импульс Молитв.',
    },
    velvet: {
        title: 'Последний Занавес Полуночного Салона',
        body: 'Маска снята, бокал осушён до дна. Имя «{name}» вычёркивают из тайных реестров салона и навсегда удаляют из Таверны — бархатные портьеры за этим гостем больше никогда не разомкнутся.',
    },
    apothecary: {
        title: 'Растворение в Царской Водке',
        body: 'Старший алхимик предупреждает лишь перед первым опытом: образец «{name}» будет без остатка перегнан в чистый эфир Молитв и навсегда исчезнет из каталога и Таверны без возможности синтезировать его обратно.',
    },
    olympus: {
        title: 'Damnatio Memoriae — Проклятие Памяти',
        body: 'Приговор Олимпа не знает отмены: лик и имя «{name}» собьют с мраморных скрижалей и омоют водой реки забвения Леты. Герой навсегда удаляется из Таверны без единого шанса на возвращение.',
    },
    abyss: {
        title: 'Погружение за Горизонт Впадины',
        body: 'Холодная толща океана смыкается над именем «{name}». Донное течение унесёт карточку в бездонную расщелину, навсегда стирая её из вахтенных журналов и Таверны без возможности поднять обратно.',
    },
});

export const THEMED_SACRIFICE_WARNINGS_EN = Object.freeze({
    tavern: {
        title: 'Ashen Seal of the Old Tavern',
        body: 'The innkeeper quietly opens the hearth grate. Once the slip bearing the name "{name}" falls into glowing embers, this guest vanishes forever from the Tavern ledgers with no backup and no chance to return.',
    },
    krakoa: {
        title: 'Erasure from Resurrection Protocols',
        body: 'A final warning from the Quiet Council: backup cradles for "{name}" will be permanently wiped. This hero will be erased from the archive and Tavern with no path back.',
    },
    demonic: {
        title: 'Crimson Pact of the Abyssal Altar',
        body: 'The Abyss never lends on credit. Once the seal closes, the soul and card of "{name}" are consumed by dark flame forever — leaving neither ash nor archive copy behind.',
    },
    scroll: {
        title: 'Royal Decree of Eternal Exile',
        body: 'The court herald raises a steel blade over parchment. "{name}" shall be scraped from every chronicle and removed from the Tavern forever.',
    },
    rose: {
        title: 'Shattered Porcelain Heart',
        body: 'Such delicate keepsakes break only once. The portrait of "{name}" will scatter into fine dust and vanish forever from your collection with no way to mend it.',
    },
    manga: {
        title: 'Chief Editor Shredder',
        body: 'Final print verdict before deadline: the character sheet of "{name}" goes straight into the shredder with zero rough drafts and no spin-off return.',
    },
    notebook: {
        title: 'Torn Page Over Candlelight',
        body: 'The page holding "{name}" will be torn from the binding and burned above the candle. No draft remains — the record is gone for good.',
    },
    celestial: {
        title: 'Collapse of a Fading Star',
        body: 'The star of "{name}" collapses into darkness to fuel new Prayers. Their thread is severed forever from the Astral Codex.',
    },
    cyber: {
        title: 'Permanent File Purge',
        body: 'Operator notice: memory sectors for "{name}" will be overwritten with no shadow backup in exchange for fresh Prayers.',
    },
    velvet: {
        title: 'Final Curtain of the Nocturne Salon',
        body: 'The glass is drained and the mask removed. "{name}" is struck from the private salon register forever — the velvet drapes will never part for them again.',
    },
    apothecary: {
        title: 'Complete Alchemical Dissolution',
        body: 'The master alchemist warns before the first distillation: specimen "{name}" will be dissolved into pure Prayer ether with no way to precipitate them back.',
    },
    olympus: {
        title: 'Damnatio Memoriae — Waters of Lethe',
        body: 'Olympus knows no appeal: the name "{name}" is struck from marble tablets and washed away in the river of oblivion forever.',
    },
    abyss: {
        title: 'Descent Beyond the Trench',
        body: 'Cold ocean depths close above "{name}". Deep currents carry the card into a bottomless rift with no hope of surfacing again.',
    },
});

export function getThemedSacrificeWarning(themeId = 'tavern', heroName = 'Незнакомец', wishGain = 1) {
    const dict = isEn() ? THEMED_SACRIFICE_WARNINGS_EN : THEMED_SACRIFICE_WARNINGS;
    const tpl = dict[themeId] || dict.tavern;
    const fallbackHero = tx('Незнакомец', 'Stranger');
    const cleanName = String(heroName || fallbackHero).trim() || fallbackHero;
    const gain = Math.max(1, Math.min(5, Math.round(Number(wishGain) || 1)));
    return {
        title: tpl.title,
        body: tpl.body.replace(/\{name\}/g, cleanName),
        wishGain: gain,
    };
}

export const CARD_SLOT_DEFS = Object.freeze([
    { id: 'swipe', label: 'Свайпы' },
    { id: 'gacha', label: 'Гача' },
    { id: 'blitz', label: 'Блиц' },
    { id: 'architect', label: 'Генератор' },
    { id: 'manual', label: 'Ручной' },
]);

export const LANGUAGE_PRESET_OPTIONS = Object.freeze([
    { id: '{{language}}', label: 'Авто по системе ({{language}})' },
    { id: 'Русский', label: 'Русский' },
    { id: 'English', label: 'English (экономия токенов)' },
    { id: 'Описание EN + Сцена {{language}}', label: 'Гибрид: База EN + Сцена на моём языке' },
    { id: 'Українська', label: 'Українська' },
    { id: '简体中文', label: '简体中文 (Китайский упр.)' },
    { id: '繁體中文', label: '繁體中文 (Китайский трад.)' },
    { id: '日本語', label: '日本語 (Японский)' },
    { id: '한국어', label: '한국어 (Корейский)' },
    { id: 'Español', label: 'Español' },
    { id: 'Deutsch', label: 'Deutsch' },
    { id: 'Français', label: 'Français' },
    { id: '__custom__', label: 'Свой язык вручную...' },
]);

export const STYLE_WRAP_OPTIONS = Object.freeze([
    { id: 'plain_prefix', label: 'Прямой префикс стиля (чистая подача)' },
    { id: 'sillyimages_tag', label: 'Тег [STYLE: ...] (как в чате SillyImages)' },
    { id: 'suffix', label: 'В конце промпта (мягкий акцент)' },
]);

export const IMAGE_REF_MODE_OPTIONS = Object.freeze([
    { id: 'off', label: 'Без референсов (с нуля по промпту)' },
    { id: 'auto_lorebook', label: 'Авто-подбор по имени из SillyImages' },
    { id: 'pick_sillyimages', label: 'Выбрать референс из SillyImages' },
    { id: 'custom_photo', label: 'Своё реф-фото внешности' },
]);

export const CARD_META_PURITY_RULE =
    'META-PURITY LAW (STRICTLY MANDATORY): NEVER write word counts (e.g. "(600 words)", "[Word count: 580]"), star ratings ("1-star".."5-star"), gacha rarity tiers ("N", "R", "SR", "SSR", "UR", "Legendary", "Epic"), or forge UI telemetry inside ANY card field, tag list, or opening scene.';

/**
 * Adapted flexible <ART_MECHANISM> director specification for Avatar / Cover imagePrompt generation.
 * Supports: Single Character, 2-3 Characters (with INTERACTION), World/Vista (no characters), and Focal Object/Artifact.
 * Strictly medium-neutral so the user's external SillyImages style preset controls the rendering medium 100%.
 */
export function buildFlexibleAvatarArtMechanismRule(intake = {}) {
    const origin = intake?.originType || 'oc';
    const isWorld = origin === 'world_sandbox' || origin === 'rpg_gm' || intake?.cardFormat === 'world_sandbox' || intake?.cardFormat === 'rpg_gm_engine';
    const isArtifact = origin === 'artifact_object';
    const isGroup = origin === 'duo_group' || intake?.cardFormat === 'cast_hub';

    const subjectBranch = isArtifact
        ? `- Because this card centers on a Special Object / Artifact (unless a wielder is essential), set "CHARACTERS IN THE IMAGE: no." (adding zero people or silhouettes) and include "OBJECT (NAME):" describing its exact visible form, scale, material texture, wear/inscriptions, light reflections, and placement in frame.`
        : (isWorld
            ? `- Because this is a World / Setting card, set "CHARACTERS IN THE IMAGE: no." (unless iconic figures are explicitly needed at distance) and focus on grand architectural/environmental composition, scale, depth, and atmospheric light.`
            : (isGroup
                ? `- Because this card features 2-3 characters together, set "CHARACTERS IN THE IMAGE: yes.", write paired "FIGURE 1 (NAME):" + "[Figure 1 is styled in: ...]" and "FIGURE 2 (NAME):" + "[Figure 2 is styled in: ...]" (and FIGURE 3 if applicable), followed by "INTERACTION:" detailing exact spatial overlap, height difference, eye line, and physical contact points.`
                : `- For a single character avatar, set "CHARACTERS IN THE IMAGE: yes." and write "FIGURE 1 (NAME):" + "[Figure 1 is styled in: ...]". (If the concept explicitly centers on 2-3 characters or a pure object/vista, adapt CHARACTERS IN THE IMAGE, FIGURE N, INTERACTION, or OBJECT accordingly.)`));

    return [
        `[AVATAR ART MECHANISM FOR image_prompt / IMG BLOCK]`,
        `Compose the English visual prompt like a visual director framing a dramatic key avatar/cover shot:`,
        `- STYLE SOURCE RULE: Do NOT invent or mention any rendering style on your own — rendering style comes strictly from SillyImages or from what the user explicitly wrote (if the user explicitly requested a visual style, preserve the user's exact words; otherwise describe ONLY the scene, lighting, and subject).`,
        `- Prefer bold, dynamic framing (chest-up three-quarter portrait, low-angle waist-up, intimate close-up, or dramatic focal shot) centered cleanly on the subject's head/upper torso or focal object so the avatar never crops off the top of the head. Describe ONLY what physically falls inside the cropped frame.`,
        `- Structure the prompt cleanly in this exact order:`,
        `  1) SCENE: Exact framing boundaries (from top edge cutoff with clear headroom above crown/ears down to bottom edge cutoff), viewing height/angle, foreground/midground depth, visible environment in the gaps around the subject (focused, up to 55 words), directional key light vs secondary rim/ambient light sculpting forms, surface reflections, contrast, and mood color palette.`,
        `  2) CHARACTERS IN THE IMAGE: yes or no.`,
        `  3) If characters appear — FIGURE N (NAME): Exact body orientation, posture, shoulder tension, visible build, skin/fur/surface tone and sheen, head tilt, gaze direction, micro-expression of eyes and lips, hair/mane and loose strands, and explicit visible placement of Left arm / hand and Right arm / hand. Follow immediately with [Figure N is styled in: ONLY garments, layers, folds, scars, accessories, and held items actually visible inside the crop — never mention footwear/pants if cropped above waist — contrasting matte fabric vs metallic/glass/wet highlights].`,
        `  4) If 2+ figures appear — INTERACTION: Spatial overlap, proximity, height difference, eye line, and contact points.`,
        `  5) If a standalone focal item/relic is central — OBJECT (NAME): Visible form, scale, material texture, wear/damage, reflections, and frame position.`,
        subjectBranch,
    ].join('\n');
}


export const TRANSPORT_MODE_GUIDES = Object.freeze({
    prefill_user_msg: {
        shortLabel: 'Через активный пресет Таверны',
        badge: 'Рекомендуется для прокси и 18+',
        explain: 'Запрос отправляется через ваш текущий открытый РП-пресет Таверны (его инструкции и стиль мышления помогают обходить цензуру и писать живее). Чужие карточки и лорбуки открытого чата мы автоматически вырезаем.',
    },
    json_schema: {
        shortLabel: 'Строгая JSON-схема (Прямой запрос)',
        badge: 'Максимум экономии токенов',
        explain: 'Чистый системный запрос напрямую к модели без отправки вашего тяжёлого РП-пресета. Тратит минимум токенов и выдаёт идеально ровные поля, но на строгих моделях может капризничать на 18+ темах.',
    },
});

export const CARD_FORMAT_HUMAN_GUIDES = Object.freeze({
    dossier_19: {
        shortBtn: 'Полное досье (19 п.)',
        explain: 'Подробная классическая анкета из 19 чётких разделов: Личность, Внешность, Одежда, Психология, Страхи, Прошлое, Манера речи, Отношение к вам и Завязка. Идеальный универсальный выбор, если хотите максимально глубокого персонажа.',
    },
    jed_hybrid: {
        shortBtn: 'JED Гибрид (Chub)',
        explain: 'Популярный современный стандарт с Chub и JanitorAI: внешность и базовые черты даются короткими ёмкими списками (без воды), а биография, привычки и химия с игроком — живым литературным текстом.',
    },
    behavioral_prose: {
        shortBtn: 'Живая проза',
        explain: 'Никаких сухих таблиц и анкетных пунктов — карточка пишется связными абзацами через поступки: кто этот герой, чего он добивается, как звучит его голос и как он ведёт себя в стрессе и рядом с вами.',
    },
    xml_sheet: {
        shortBtn: 'XML-блоки',
        explain: 'Информация раскладывается по строгим тегам (<identity>, <appearance>, <psychology>, <speech_style>). Модели вроде Claude, Gemini и DeepSeek обожают такую разметку и почти никогда не путают детали внешности и характера.',
    },
    plist_alichat: {
        shortBtn: 'Экономный Ali:Chat',
        explain: 'Самый лёгкий по токенам формат: сверху сжатая сводка черт в скобках, а ниже — 3 живых мини-диалога в голосе самого персонажа, чтобы нейросеть с первой реплики поймала его интонацию и сленг.',
    },
    cast_hub: {
        shortBtn: 'Компания (2–4 чара)',
        explain: 'Специальный шаблон для дуэтов, трио и целых групп в одной карточке: у каждого героя свой отдельный мини-профиль, внешность и характер, чтобы ИИ не смешивал их реплики в одного человека.',
    },
    world_sandbox: {
        shortBtn: 'Мир-Песочница',
        explain: 'Карточка живого мира вместо одного партнёра: ИИ выступает рассказчиком вселенной, описывает законы мира, локации, фракции и разных встречных НПС со своими целями.',
    },
    rpg_gm_engine: {
        shortBtn: 'РПГ-Мастер',
        explain: 'Полноценная текстовая РПГ-кампания внутри карточки V2: правила мира, ранги/опасность, живые фракции, квесты и аккуратный блок статуса в конце ходов без игры за вашего персонажа.',
    },
});

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
        name: 'World Sandbox / Карточка Мира-Песочницы (Рассказчик, V2)',
        desc: 'Шаблон живого сеттинга внутри Character Card V2: законы мира, локации, фракции и ведущий-рассказчик.',
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
        name: 'RPG Game Master / РПГ-Система (Шаблон в Character Card V2)',
        desc: 'Шаблон Гейм-Мастера внутри Character Card V2: мир, ранги, живые НПС, квесты и компактный статус-блок.',
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
    { id: '1:1', label: '1:1 — Квадрат (По умолчанию, ровная сетка)' },
    { id: 'native', label: 'Авто — Под размер самого арта (без обрезки)' },
    { id: '3:4', label: '3:4 — Классическая портретная карточка' },
    { id: '2:3', label: '2:3 — Высокий вертикальный портрет' },
    { id: '16:9', label: '16:9 — Широкий кадр (1 колонка, Миры / Сцены)' },
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
    { id: 'nsfw', label: 'NSFW 18+ (Откровенный рейтинг)', warn: 'Не все модели соглашаются генерировать 18+ напрямую. Для взрослых карточек рекомендуется режим отправки «Через активный пресет Таверны» с вашим рабочим РП-пресетом.' },
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

// Real SillyTavern Core JsonSchema objects (fixes NMF-010)
export const FULL_CARD_JSON_SCHEMA = Object.freeze({
    name: 'nmf_full_card_v2',
    description: 'Complete Character Card V2 synthesis payload for NexusMatch Forge',
    strict: true,
    returnInvalid: true,
    value: {
        type: 'object',
        additionalProperties: false,
        required: [
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
            'image_prompt',
        ],
        properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            personality: { type: 'string' },
            scenario: { type: 'string' },
            first_mes: { type: 'string' },
            alternate_greetings: { type: 'array', items: { type: 'string' } },
            mes_example: { type: 'string' },
            creator_notes: { type: 'string' },
            system_prompt: { type: 'string' },
            post_history_instructions: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            image_prompt: { type: 'string' },
        },
    },
});

export const TINDER_PREVIEW_JSON_SCHEMA = Object.freeze({
    name: 'nmf_swipe_candidates',
    description: 'List of NexusMatch Forge swipe preview candidates',
    strict: true,
    returnInvalid: true,
    value: {
        type: 'object',
        additionalProperties: false,
        required: ['candidates'],
        properties: {
            candidates: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: [
                        'name',
                        'compatibility',
                        'archetype',
                        'pitch',
                        'appearance',
                        'quote',
                        'tags',
                        'image_prompt',
                    ],
                    properties: {
                        name: { type: 'string' },
                        compatibility: { type: 'number' },
                        archetype: { type: 'string' },
                        pitch: { type: 'string' },
                        appearance: { type: 'string' },
                        quote: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        image_prompt: { type: 'string' },
                    },
                },
            },
        },
    },
});

export const BLITZ_QUESTIONS_JSON_SCHEMA = Object.freeze({
    name: 'nmf_blitz_questions',
    description: 'NexusMatch Forge Blitz questionnaire items',
    strict: true,
    returnInvalid: true,
    value: {
        type: 'object',
        additionalProperties: false,
        required: ['questions'],
        properties: {
            questions: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['question', 'options'],
                    properties: {
                        question: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
    },
});

export const GACHA_SUMMON_JSON_SCHEMA = Object.freeze({
    name: 'nmf_gacha_summon',
    description: 'NexusMatch Forge Gacha summon and fusion character concepts',
    strict: true,
    returnInvalid: true,
    value: {
        type: 'object',
        additionalProperties: false,
        required: ['drops'],
        properties: {
            drops: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: [
                        'name',
                        'epithet',
                        'archetype',
                        'pitch',
                        'appearance',
                        'quote',
                        'tags',
                        'image_prompt',
                    ],
                    properties: {
                        name: { type: 'string' },
                        epithet: { type: 'string' },
                        archetype: { type: 'string' },
                        pitch: { type: 'string' },
                        appearance: { type: 'string' },
                        quote: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        image_prompt: { type: 'string' },
                    },
                },
            },
        },
    },
});

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
        const g = typeof globalThis !== 'undefined' ? globalThis : {};
        const rawLoc = String(
            g.window?.localStorage?.getItem?.('language')
            || g.document?.documentElement?.lang
            || g.navigator?.language
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

export function stripAccidentalLanguageBraces(val) {
    const str = String(val ?? '').trim();
    if (!str) return '';
    // Preserve real {{language}} / {{lang}} macro, but unwrap accidental {{Русский}} -> Русский
    if (/^\{\{\s*(?:language|lang|card_lang|user_lang)\s*\}\}$/i.test(str)) {
        return '{{language}}';
    }
    return str.replace(/^\{\{\s*([^{}]+?)\s*\}\}$/g, '$1').trim();
}

function resolveRawLanguageField(rawVal, fallbackLegacyChoice = '', fallbackLegacyCustom = '') {
    const detected = detectUserLocaleLanguage();
    let rawChoice = stripAccidentalLanguageBraces(rawVal);
    if (!rawChoice) {
        if (fallbackLegacyChoice === 'custom') {
            rawChoice = stripAccidentalLanguageBraces(fallbackLegacyCustom) || '{{language}}';
        } else {
            rawChoice = stripAccidentalLanguageBraces(fallbackLegacyChoice) || '{{language}}';
        }
    }

    if (!rawChoice || rawChoice === '{{language}}' || /^\{\{\s*(?:language|lang|card_lang|user_lang)\s*\}\}$/i.test(rawChoice)) {
        return {
            shortLabel: detected,
            directive: `${detected} (resolved automatically from user's {{language}} macro)`,
        };
    }
    if (rawChoice === 'hybrid_en_local' || /описание\s+en\s*\+\s*сцена|база\s+en\s*\+\s*сцена/i.test(rawChoice)) {
        return {
            shortLabel: `EN + ${detected}`,
            directive: `BILINGUAL TOKEN-SAVER MODE — Write technical card definitions (Description, Personality, Scenario, System Prompt) in concise English, while writing First Message, Alternate Greetings, Example Dialogue, Creator Notes, and previews in ${detected}`,
        };
    }
    if (rawChoice === 'Как в анкете') {
        return {
            shortLabel: 'Auto (Input Language)',
            directive: `Match the primary language used by the user in their intake/concept notes (fallback: ${detected})`,
        };
    }
    if (rawChoice === 'custom' || rawChoice === '__custom__') {
        const customRaw = stripAccidentalLanguageBraces(fallbackLegacyCustom) || '{{language}}';
        const expanded = customRaw.replace(/\{\{\s*(?:language|lang|card_lang|user_lang)\s*\}\}/gi, detected);
        return {
            shortLabel: expanded,
            directive: expanded,
        };
    }
    const expanded = rawChoice.replace(/\{\{\s*(?:language|lang|card_lang|user_lang)\s*\}\}/gi, detected);
    return {
        shortLabel: expanded,
        directive: expanded,
    };
}

export function resolveUserLanguageSpec(intake = {}) {
    const safe = intake && typeof intake === 'object' ? intake : {};
    const legacyForUser = safe.language === 'hybrid_en_local' ? '{{language}}' : safe.language;
    return resolveRawLanguageField(safe.userLanguage, legacyForUser, safe.customLanguage);
}

export function resolveCardLanguageSpec(intake = {}) {
    const safe = intake && typeof intake === 'object' ? intake : {};
    return resolveRawLanguageField(safe.cardLanguage, safe.language, safe.customLanguage);
}

export function resolveOutputLanguageSpec(intake = {}) {
    return resolveCardLanguageSpec(intake);
}

export function resolveGenderSummary(intake = {}) {
    const safeIntake = intake && typeof intake === 'object' ? intake : {};
    const uMode = safeIntake.userGender || 'any';
    const tMode = safeIntake.targetGender || 'any';

    let userSpec = '';
    if (uMode === 'male') userSpec = 'Male (Мужчина)';
    else if (uMode === 'female') userSpec = 'Female (Женщина)';
    else if (uMode === 'custom' && String(safeIntake.userGenderCustom || '').trim()) {
        userSpec = String(safeIntake.userGenderCustom).trim();
    }

    let targetSpec = '';
    if (tMode === 'male') targetSpec = 'Male (Мужчина)';
    else if (tMode === 'female') targetSpec = 'Female (Женщина)';
    else if (tMode === 'custom' && String(safeIntake.targetGenderCustom || '').trim()) {
        targetSpec = String(safeIntake.targetGenderCustom).trim();
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
        return String(globalThis.window?.SillyTavern?.getContext?.()?.name1 || '').trim();
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

export function buildGreetingStyleDirective(intake = {}) {
    const safeIntake = intake && typeof intake === 'object' ? intake : {};
    const styleObj = GREETING_STYLES.find((s) => s.id === (safeIntake.greetingStyle || 'fanfic')) || GREETING_STYLES[0];
    const povObj = GREETING_POVS.find((p) => p.id === (safeIntake.greetingPov || 'third')) || GREETING_POVS[0];
    const customRules = String(safeIntake.greetingCustomRules || '').trim();

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

export function createBlankCardSlot() {
    return {
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
        avatarId: '',
        avatarDataUrl: '',
        avatarDirty: false,
        sourceAvatarId: '',
        sourceLoadedFromTavern: false,
        sourceSnapshotHash: '',
        originalCardData: null,
        dirtyFields: [],
        savedTranslation: null, // { lang, name, description, personality, scenario, first_mes, alternate_greetings, mes_example, creator_notes, updatedAt }
    };
}

export function createDefaultSession(index = 1) {
    const initialSlots = {
        swipe: createBlankCardSlot(),
        gacha: createBlankCardSlot(),
        blitz: createBlankCardSlot(),
        architect: createBlankCardSlot(),
        manual: createBlankCardSlot(),
    };
    return {
        id: 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        title: `Сессия ${index}`,
        homeCompleted: false,
        frozen: false,
        createdAt: Date.now(),
        activeCardSlot: 'manual',
        intake: {
            originType: 'oc', // oc | canon | fandom_au | fandom_oc | duo_group | artifact_object | world_sandbox | rpg_gm
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
            userLanguage: '{{language}}',
            cardLanguage: '{{language}}',
            language: '{{language}}',
            customLanguage: '',
            userGender: 'any',
            userGenderCustom: '',
            targetGender: 'any',
            targetGenderCustom: '',
            playerNameMode: 'macro',
        },
        artRefCustom: {
            avatarId: '',
            avatarDataUrl: '',
            description: '',
        },
        tinder: {
            batchSize: 1,
            autoArt: false,
            promptHint: '',
            queue: [],
            liked: [],
            passed: [],
            dislikedTags: [],
            dislikedNotes: [],
            lastDislikedCandidate: null,
        },
        gacha: {
            tagsInput: '',
            pullSize: 1,
            aspectRatio: 'sillyimages_default',
            cycleCount: 0,
            totalPulls: 0,
            pitySince4Plus: 0,
            cooldownEndsAt: 0,
            wishPrefs: createDefaultGachaWishPrefs(),
            recentNamesPool: [],
            collection: [],
            fusionSlotIds: [],
            fusionArtRefs: false,
            fusionHint: '',
            lastRevealBatch: [],
        },
        blitz: {
            topic: '',
            questionCount: 10,
            includeChoices: true,
            useTinderContext: true,
            useGachaContext: false,
            selectedCandidateRef: '',
            questions: [],
        },
        architect: {
            subMode: 'idea',
            useIntake: true,
            freeConcept: '',
        },
        rework: {
            sourceAvatar: '',
            reworkMode: 'au_shift',
            targetSettingEra: '',
            encounterIdea: '',
            moodTone: '',
            keepFormatting: true,
            questionCount: 5,
            includeChoices: true,
            questions: [],
        },
        cardSlots: initialSlots,
        card: initialSlots.manual,
    };
}

export function mapGachaTargetToOriginType(targetType = 'oc') {
    if (targetType === 'fandom_oc') return 'fandom_oc';
    if (targetType === 'canon_au') return 'canon';
    if (targetType === 'duo_group') return 'duo_group';
    if (targetType === 'artifact') return 'artifact_object';
    if (targetType === 'world_rpg') return 'rpg_gm';
    return 'oc';
}

export function createDefaultGachaWishPrefs() {
    return {
        targetType: 'oc',
        fandomOrWorld: '',
        userGender: 'any',
        userGenderCustom: '',
        targetGender: 'any',
        targetGenderCustom: '',
        rating: 'mature',
        wishesNote: '',
        hardBans: '',
    };
}

export function normalizeGachaWishPrefs(rawPrefs) {
    const base = createDefaultGachaWishPrefs();
    if (!rawPrefs || typeof rawPrefs !== 'object' || Array.isArray(rawPrefs)) {
        return base;
    }
    const validTargetTypes = new Set(GACHA_TARGET_OPTIONS.map((t) => t.id));
    const validUserGenders = new Set(USER_GENDER_OPTIONS.map((g) => g.id));
    const validGenders = new Set(TARGET_GENDER_OPTIONS.map((g) => g.id));
    const validRatings = new Set(RATING_OPTIONS.map((r) => r.id));
    return {
        targetType: validTargetTypes.has(rawPrefs.targetType) ? rawPrefs.targetType : 'oc',
        fandomOrWorld: String(rawPrefs.fandomOrWorld ?? ''),
        userGender: validUserGenders.has(rawPrefs.userGender) ? rawPrefs.userGender : base.userGender,
        userGenderCustom: String(rawPrefs.userGenderCustom ?? ''),
        targetGender: validGenders.has(rawPrefs.targetGender) ? rawPrefs.targetGender : base.targetGender,
        targetGenderCustom: String(rawPrefs.targetGenderCustom ?? ''),
        rating: validRatings.has(rawPrefs.rating) ? rawPrefs.rating : base.rating,
        wishesNote: String(rawPrefs.wishesNote ?? ''),
        hardBans: String(rawPrefs.hardBans ?? ''),
    };
}

export function createDefaultGachaWallet() {
    return {
        freeSpentInCycle: 0,
        bonusWishes: 0,
        cooldownEndsAt: 0,
        pitySince4Plus: 0,
        firstSacrificeConfirmed: false,
        updatedAt: 0,
    };
}

export function normalizeGachaWallet(rawWallet, sessions = [], activeSessionId = '') {
    if (rawWallet && typeof rawWallet === 'object' && !Array.isArray(rawWallet)) {
        return {
            freeSpentInCycle: Number.isFinite(Number(rawWallet.freeSpentInCycle))
                ? Math.max(0, Math.min(50, Math.round(Number(rawWallet.freeSpentInCycle))))
                : 0,
            bonusWishes: Number.isFinite(Number(rawWallet.bonusWishes))
                ? Math.max(0, Math.min(999, Math.round(Number(rawWallet.bonusWishes))))
                : 0,
            cooldownEndsAt: Number.isFinite(Number(rawWallet.cooldownEndsAt))
                ? Math.max(0, Math.round(Number(rawWallet.cooldownEndsAt)))
                : 0,
            pitySince4Plus: Number.isFinite(Number(rawWallet.pitySince4Plus))
                ? Math.max(0, Math.round(Number(rawWallet.pitySince4Plus)))
                : 0,
            firstSacrificeConfirmed: Boolean(rawWallet.firstSacrificeConfirmed),
            updatedAt: Number.isFinite(Number(rawWallet.updatedAt))
                ? Math.max(0, Math.round(Number(rawWallet.updatedAt)))
                : 0,
        };
    }

    // Migrate from legacy per-session gacha fields (converting earned sacrifice resetCharges > 1 into real bonusWishes!)
    const activeSess = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
    let maxCooldownEndsAt = 0;
    let migratedBonusWishes = 0;
    for (const s of sessions) {
        const cd = Number(s?.gacha?.cooldownEndsAt) || 0;
        if (cd > maxCooldownEndsAt) maxCooldownEndsAt = cd;
        const legacyCharges = Number(s?.gacha?._legacyResetCharges);
        if (Number.isFinite(legacyCharges) && legacyCharges > 1) {
            migratedBonusWishes += Math.round(legacyCharges - 1);
        }
    }
    return {
        freeSpentInCycle: Math.max(0, Math.min(50, Math.round(Number(activeSess?.gacha?.cycleCount) || 0))),
        bonusWishes: Math.min(999, migratedBonusWishes),
        cooldownEndsAt: maxCooldownEndsAt,
        pitySince4Plus: Math.max(0, Math.round(Number(activeSess?.gacha?.pitySince4Plus) || 0)),
        firstSacrificeConfirmed: false,
        updatedAt: Date.now(),
    };
}

function normalizeCandidateEntry(rawCand, idx = 0) {
    if (!rawCand || typeof rawCand !== 'object') return null;
    const inlineUrl = typeof rawCand.avatarDataUrl === 'string' && rawCand.avatarDataUrl.startsWith('data:')
        ? rawCand.avatarDataUrl
        : '';
    return {
        id: String(rawCand.id || '').trim() || `cand_mig_${Date.now().toString(36)}_${idx}`,
        name: String(rawCand.name || 'Кандидат').trim(),
        compatibility: Number.isFinite(Number(rawCand.compatibility)) ? Number(rawCand.compatibility) : 85,
        archetype: String(rawCand.archetype || ''),
        pitch: String(rawCand.pitch || ''),
        appearance: String(rawCand.appearance || ''),
        quote: String(rawCand.quote || ''),
        tags: Array.isArray(rawCand.tags)
            ? rawCand.tags.map((t) => String(t).trim()).filter(Boolean)
            : String(rawCand.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        imagePrompt: String(rawCand.imagePrompt || rawCand.image_prompt || ''),
        avatarId: String(rawCand.avatarId || ''),
        originalAvatarId: String(rawCand.originalAvatarId || ''),
        croppedAspect: String(rawCand.croppedAspect || ''),
        artNaturalRatio: Number.isFinite(Number(rawCand.artNaturalRatio)) ? Number(rawCand.artNaturalRatio) : 0,
        avatarDataUrl: inlineUrl,
    };
}

export function sanitizeCardMetaPollution(rawText, { isTags = false } = {}) {
    const str = String(rawText ?? '');
    if (!str) return '';

    if (isTags) {
        const bannedTagRe = /^(?:\d\s*[\u2605\u2606*]|\d\s*-?\s*stars?|[\u2605\u2606]{2,6}|s?sr|ur|ssr\+|gacha(?:\s*drop)?|rarity\s*:.*|word\s*count\s*:.*|~?\d+\s*(?:words?|слов[ао]?))$/i;
        return str
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t && !bannedTagRe.test(t))
            .join(', ');
    }

    return str
        // Strip bracketed/parenthesized word-count footers or headers
        .replace(/[\(\[\{]\s*(?:word\s*count|words|length|объ[её]м|кол(?:-во|ичество)\s*слов)\s*[:≈~=-]?\s*~?\d+(?:\s*[-–]\s*\d+)?\s*(?:words?|слов[ао]?)?\s*[\)\]\}]/gi, '')
        .replace(/[\(\[\{]\s*~?\d{2,5}\s*(?:words|слов[ао]?)\s*[\)\]\}]/gi, '')
        .replace(/^\s*(?:word\s*count|количество\s*слов)\s*:\s*~?\d+\s*(?:words?|слов[ао]?)?\s*$/gim, '')
        // Strip gacha star / rarity badges accidentally echoed by LLM
        .replace(/[\(\[\{]\s*(?:[3456]\s*[\u2605\u2606]\s*(?:s?sr|ur|epic|legendary)?|(?:sr|ssr|ur)\s*(?:\/|\|)?\s*[3456]?\s*[\u2605\u2606]?)\s*[\)\]\}]/gi, '')
        .replace(/(?:^|\s)[\u2605\u2606]{3,6}(?=\s|$)/g, ' ')
        .replace(/^\s*(?:rarity|редкость|ранг\s*редкости)\s*:\s*(?:[3456]\s*[\u2605\u2606]|s?sr|ur|legendary|epic).*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function normalizeGachaCardEntry(rawItem, idx = 0) {
    if (!rawItem || typeof rawItem !== 'object') return null;
    const inlineUrl = typeof rawItem.avatarDataUrl === 'string' && rawItem.avatarDataUrl.startsWith('data:')
        ? rawItem.avatarDataUrl
        : '';
    const parsedStars = Math.round(Number(rawItem.stars));
    const starsNum = (Number.isFinite(parsedStars) && parsedStars >= 1 && parsedStars <= 5)
        ? parsedStars
        : (String(rawItem.rarity || '').toUpperCase() === 'SSR' ? 5 : 3);
    const rarityCodeMap = { 1: 'C', 2: 'UC', 3: 'R', 4: 'SR', 5: 'SSR' };
    const rawTags = Array.isArray(rawItem.tags)
        ? rawItem.tags.map((t) => String(t).trim()).filter(Boolean).join(', ')
        : String(rawItem.tags || '');
    const cleanedTags = sanitizeCardMetaPollution(rawTags, { isTags: true })
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    return {
        id: String(rawItem.id || '').trim() || `gacha_${Date.now().toString(36)}_${idx}`,
        name: sanitizeCardMetaPollution(String(rawItem.name || 'Таинственный герой').trim()) || 'Таинственный герой',
        epithet: sanitizeCardMetaPollution(String(rawItem.epithet || rawItem.titleEpithet || '').trim()),
        stars: starsNum,
        rarity: rarityCodeMap[starsNum] || 'R',
        archetype: sanitizeCardMetaPollution(String(rawItem.archetype || '').trim()),
        pitch: sanitizeCardMetaPollution(String(rawItem.pitch || '').trim()),
        appearance: sanitizeCardMetaPollution(String(rawItem.appearance || '').trim()),
        quote: sanitizeCardMetaPollution(String(rawItem.quote || '').trim()),
        tags: cleanedTags,
        sourcePlusTags: Array.isArray(rawItem.sourcePlusTags)
            ? rawItem.sourcePlusTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
            : [],
        fusedFromNames: Array.isArray(rawItem.fusedFromNames)
            ? rawItem.fusedFromNames.map((n) => String(n).trim()).filter(Boolean).slice(0, 4)
            : [],
        imagePrompt: String(rawItem.imagePrompt || rawItem.image_prompt || '').trim(),
        avatarId: String(rawItem.avatarId || ''),
        originalAvatarId: String(rawItem.originalAvatarId || ''),
        croppedAspect: String(rawItem.croppedAspect || ''),
        gachaAspectOverride: String(rawItem.gachaAspectOverride || ''),
        artNaturalRatio: Number.isFinite(Number(rawItem.artNaturalRatio)) ? Number(rawItem.artNaturalRatio) : 0,
        avatarDataUrl: inlineUrl,
        createdAt: Number.isFinite(Number(rawItem.createdAt)) ? Number(rawItem.createdAt) : Date.now(),
    };
}

function normalizeQuestionEntry(rawQ, idx = 0) {
    if (!rawQ || (typeof rawQ !== 'object' && typeof rawQ !== 'string')) return null;
    if (typeof rawQ === 'string') {
        return {
            id: `q_mig_${idx}`,
            question: rawQ.trim(),
            options: [],
            selectedOptions: [],
            answer: '',
            skipped: false,
        };
    }
    const options = Array.isArray(rawQ.options) ? rawQ.options.map((o) => String(o)).filter(Boolean) : [];
    const selectedOptions = Array.isArray(rawQ.selectedOptions)
        ? rawQ.selectedOptions.map((o) => String(o)).filter((o) => Boolean(o))
        : [];
    return {
        id: String(rawQ.id || '').trim() || `q_mig_${Date.now().toString(36)}_${idx}`,
        question: String(rawQ.question || '').trim(),
        options,
        selectedOptions,
        answer: String(rawQ.answer || ''),
        skipped: Boolean(rawQ.skipped),
    };
}

export function formatQuestionUserDecision(q) {
    if (!q || q.skipped) return '';
    const picked = Array.isArray(q.selectedOptions) ? q.selectedOptions.map((x) => String(x).trim()).filter(Boolean) : [];
    const extra = String(q.answer || '').trim();
    return [...picked, extra].filter(Boolean).join('; ');
}

// Deep, crash-proof session normalizer (fixes NMF-014)
function normalizeSingleCardSlotObject(rawCard) {
    const rc = rawCard && typeof rawCard === 'object' && !Array.isArray(rawCard) ? rawCard : {};
    const inlineCardAvatar = typeof rc.avatarDataUrl === 'string' && rc.avatarDataUrl.startsWith('data:')
        ? rc.avatarDataUrl
        : '';
    const rawTr = rc.savedTranslation && typeof rc.savedTranslation === 'object' && !Array.isArray(rc.savedTranslation)
        ? rc.savedTranslation
        : null;
    const savedTranslation = rawTr ? {
        lang: String(rawTr.lang || ''),
        name: String(rawTr.name || ''),
        description: String(rawTr.description || ''),
        personality: String(rawTr.personality || ''),
        scenario: String(rawTr.scenario || ''),
        first_mes: String(rawTr.first_mes || ''),
        alternate_greetings: Array.isArray(rawTr.alternate_greetings) ? rawTr.alternate_greetings.map(String) : [],
        mes_example: String(rawTr.mes_example || ''),
        creator_notes: String(rawTr.creator_notes || ''),
        updatedAt: Number.isFinite(Number(rawTr.updatedAt)) ? Number(rawTr.updatedAt) : Date.now(),
    } : null;

    return {
        name: String(rc.name ?? ''),
        description: String(rc.description ?? ''),
        personality: String(rc.personality ?? ''),
        scenario: String(rc.scenario ?? ''),
        first_mes: String(rc.first_mes ?? ''),
        alternate_greetings: Array.isArray(rc.alternate_greetings)
            ? rc.alternate_greetings.map((g) => String(g ?? ''))
            : [],
        mes_example: String(rc.mes_example ?? ''),
        creator_notes: String(rc.creator_notes ?? ''),
        system_prompt: String(rc.system_prompt ?? ''),
        post_history_instructions: String(rc.post_history_instructions ?? ''),
        tags: Array.isArray(rc.tags) ? rc.tags.join(', ') : String(rc.tags ?? ''),
        creator: String(rc.creator ?? ''),
        character_version: String(rc.character_version ?? '1.0') || '1.0',
        world: String(rc.world ?? ''),
        imagePrompt: String(rc.imagePrompt ?? ''),
        avatarId: String(rc.avatarId ?? ''),
        originalAvatarId: String(rc.originalAvatarId ?? ''),
        croppedAspect: String(rc.croppedAspect ?? ''),
        artNaturalRatio: Number.isFinite(Number(rc.artNaturalRatio)) ? Number(rc.artNaturalRatio) : 0,
        avatarDataUrl: inlineCardAvatar,
        avatarDirty: Boolean(rc.avatarDirty),
        sourceAvatarId: String(rc.sourceAvatarId ?? ''),
        sourceLoadedFromTavern: Boolean(rc.sourceLoadedFromTavern ?? Boolean(rc.sourceAvatarId)),
        sourceSnapshotHash: String(rc.sourceSnapshotHash ?? ''),
        originalCardData: rc.originalCardData && typeof rc.originalCardData === 'object' && !Array.isArray(rc.originalCardData)
            ? structuredClone(rc.originalCardData)
            : null,
        dirtyFields: Array.isArray(rc.dirtyFields) ? [...new Set(rc.dirtyFields.map(String))] : [],
        savedTranslation,
    };
}

export function normalizeVaultCardEntry(rawVaultItem, idx = 0) {
    if (!rawVaultItem || typeof rawVaultItem !== 'object' || Array.isArray(rawVaultItem)) return null;
    const baseCard = normalizeSingleCardSlotObject(rawVaultItem);
    return {
        ...baseCard,
        vaultId: String(rawVaultItem.vaultId || rawVaultItem.id || `vault_${Date.now().toString(36)}_${idx}`),
        originMethod: String(rawVaultItem.originMethod || 'manual'),
        savedAt: Number.isFinite(Number(rawVaultItem.savedAt)) ? Number(rawVaultItem.savedAt) : Date.now(),
    };
}


export function normalizeSession(rawSession, index = 1) {
    const base = createDefaultSession(index);
    if (!rawSession || typeof rawSession !== 'object' || Array.isArray(rawSession)) {
        return base;
    }

    const rawIntake = rawSession.intake && typeof rawSession.intake === 'object' && !Array.isArray(rawSession.intake)
        ? rawSession.intake
        : {};
    const intake = {
        ...base.intake,
        ...Object.fromEntries(Object.entries(rawIntake).filter(([, v]) => v !== undefined && v !== null)),
        genres: Array.isArray(rawIntake.genres) ? rawIntake.genres.map(String).filter(Boolean) : [...base.intake.genres],
        customWords: Number.isFinite(Number(rawIntake.customWords)) ? Number(rawIntake.customWords) : base.intake.customWords,
        customGreetingWords: Number.isFinite(Number(rawIntake.customGreetingWords))
            ? Number(rawIntake.customGreetingWords)
            : base.intake.customGreetingWords,
    };
    if (!intake.greetingStyle) intake.greetingStyle = 'fanfic';
    if (!intake.greetingPov) intake.greetingPov = 'third';
    if (!intake.playerNameMode) intake.playerNameMode = 'macro';
    if (!intake.userGender) intake.userGender = 'any';
    if (!intake.targetGender) intake.targetGender = 'any';
    if (!intake.language) intake.language = '{{language}}';

    // Migrate legacy single dropdown language -> two clean manual text fields (v1.6.0)
    const rawLegacyVal = intake.language === 'custom'
        ? (String(intake.customLanguage || '').trim() || '{{language}}')
        : String(intake.language || '{{language}}').trim();
    const humanCardLang = rawLegacyVal === 'hybrid_en_local'
        ? 'Описание EN + Сцена {{language}}'
        : (rawLegacyVal || '{{language}}');
    if (!String(rawIntake.userLanguage ?? '').trim()) {
        intake.userLanguage = rawLegacyVal === 'hybrid_en_local' ? '{{language}}' : (stripAccidentalLanguageBraces(rawLegacyVal) || '{{language}}');
    } else {
        intake.userLanguage = stripAccidentalLanguageBraces(rawIntake.userLanguage) || '{{language}}';
    }
    if (!String(rawIntake.cardLanguage ?? '').trim() || rawIntake.cardLanguage === 'hybrid_en_local') {
        intake.cardLanguage = stripAccidentalLanguageBraces(humanCardLang) || '{{language}}';
    } else {
        intake.cardLanguage = stripAccidentalLanguageBraces(rawIntake.cardLanguage) || '{{language}}';
    }

    if (!intake.rating) intake.rating = 'sfw';
    if (!intake.originType) intake.originType = 'oc';
    if (!intake.cardFormat) intake.cardFormat = 'dossier_19';

    const rawArtRef = rawSession.artRefCustom && typeof rawSession.artRefCustom === 'object' && !Array.isArray(rawSession.artRefCustom)
        ? rawSession.artRefCustom
        : {};
    const artRefCustom = {
        avatarId: String(rawArtRef.avatarId ?? ''),
        avatarDataUrl: typeof rawArtRef.avatarDataUrl === 'string' && rawArtRef.avatarDataUrl.startsWith('data:')
            ? rawArtRef.avatarDataUrl
            : '',
        description: String(rawArtRef.description ?? '').trim(),
    };

    const rawTinder = rawSession.tinder && typeof rawSession.tinder === 'object' && !Array.isArray(rawSession.tinder)
        ? rawSession.tinder
        : {};
    const tinder = {
        ...base.tinder,
        batchSize: [1, 3, 5].includes(Number(rawTinder.batchSize)) ? Number(rawTinder.batchSize) : 1,
        autoArt: Boolean(rawTinder.autoArt),
        promptHint: String(rawTinder.promptHint ?? ''),
        queue: Array.isArray(rawTinder.queue) ? rawTinder.queue.map(normalizeCandidateEntry).filter(Boolean) : [],
        liked: Array.isArray(rawTinder.liked)
            ? rawTinder.liked.map(normalizeCandidateEntry).filter(Boolean).slice(0, MAX_LIKED_CANDIDATES)
            : [],
        passed: Array.isArray(rawTinder.passed)
            ? rawTinder.passed.map(normalizeCandidateEntry).filter(Boolean).slice(0, MAX_PASSED_CANDIDATES)
            : [],
        dislikedTags: Array.isArray(rawTinder.dislikedTags) ? rawTinder.dislikedTags.map(String).filter(Boolean) : [],
        dislikedNotes: Array.isArray(rawTinder.dislikedNotes) ? rawTinder.dislikedNotes.map(String).filter(Boolean) : [],
        lastDislikedCandidate: rawTinder.lastDislikedCandidate
            ? normalizeCandidateEntry(rawTinder.lastDislikedCandidate, 999)
            : null,
    };

    const rawBlitz = rawSession.blitz && typeof rawSession.blitz === 'object' && !Array.isArray(rawSession.blitz)
        ? rawSession.blitz
        : {};
    const parsedBlitzCount = Number(rawBlitz.questionCount);
    const blitz = {
        ...base.blitz,
        topic: String(rawBlitz.topic ?? ''),
        questionCount: Number.isFinite(parsedBlitzCount) && parsedBlitzCount >= 3 && parsedBlitzCount <= 25
            ? Math.round(parsedBlitzCount)
            : 10,
        includeChoices: rawBlitz.includeChoices !== undefined ? Boolean(rawBlitz.includeChoices) : true,
        useTinderContext: rawBlitz.useTinderContext !== undefined ? Boolean(rawBlitz.useTinderContext) : true,
        useGachaContext: rawBlitz.useGachaContext !== undefined ? Boolean(rawBlitz.useGachaContext) : false,
        selectedCandidateRef: String(rawBlitz.selectedCandidateRef ?? ''),
        questions: Array.isArray(rawBlitz.questions)
            ? rawBlitz.questions.map(normalizeQuestionEntry).filter(Boolean)
            : [],
    };

    const rawArch = rawSession.architect && typeof rawSession.architect === 'object' && !Array.isArray(rawSession.architect)
        ? rawSession.architect
        : {};
    const architect = {
        subMode: rawArch.subMode === 'rework' ? 'rework' : 'idea',
        useIntake: rawArch.useIntake !== undefined ? Boolean(rawArch.useIntake) : true,
        freeConcept: String(rawArch.freeConcept ?? ''),
    };

    const rawRework = rawSession.rework && typeof rawSession.rework === 'object' && !Array.isArray(rawSession.rework)
        ? rawSession.rework
        : {};
    const parsedAuQCount = Number(rawRework.questionCount);
    const rework = {
        sourceAvatar: String(rawRework.sourceAvatar ?? ''),
        reworkMode: rawRework.reworkMode === 'full_rebuild' ? 'full_rebuild' : 'au_shift',
        targetSettingEra: String(rawRework.targetSettingEra ?? ''),
        encounterIdea: String(rawRework.encounterIdea ?? ''),
        moodTone: String(rawRework.moodTone ?? ''),
        keepFormatting: rawRework.keepFormatting !== false,
        questionCount: Number.isFinite(parsedAuQCount) && parsedAuQCount >= 3 && parsedAuQCount <= 20
            ? Math.round(parsedAuQCount)
            : 5,
        includeChoices: rawRework.includeChoices !== false,
        questions: Array.isArray(rawRework.questions)
            ? rawRework.questions.map(normalizeQuestionEntry).filter(Boolean)
            : [],
    };

    const rawSlots = rawSession.cardSlots && typeof rawSession.cardSlots === 'object' && !Array.isArray(rawSession.cardSlots)
        ? rawSession.cardSlots
        : null;
    const validSlotIds = new Set(CARD_SLOT_DEFS.map((d) => d.id));
    const activeCardSlot = validSlotIds.has(rawSession.activeCardSlot) ? rawSession.activeCardSlot : 'manual';
    const migratedMainCard = normalizeSingleCardSlotObject(rawSession.card);
    const cardSlots = {
        swipe: rawSlots?.swipe ? normalizeSingleCardSlotObject(rawSlots.swipe) : createBlankCardSlot(),
        gacha: rawSlots?.gacha ? normalizeSingleCardSlotObject(rawSlots.gacha) : createBlankCardSlot(),
        blitz: rawSlots?.blitz ? normalizeSingleCardSlotObject(rawSlots.blitz) : createBlankCardSlot(),
        architect: rawSlots?.architect ? normalizeSingleCardSlotObject(rawSlots.architect) : createBlankCardSlot(),
        manual: rawSlots?.manual ? normalizeSingleCardSlotObject(rawSlots.manual) : createBlankCardSlot(),
    };
    if (!rawSlots || (!cardSlots[activeCardSlot].name && !cardSlots[activeCardSlot].description && !cardSlots[activeCardSlot].avatarId && !cardSlots[activeCardSlot].avatarDataUrl)) {
        cardSlots[activeCardSlot] = migratedMainCard;
    }
    const card = cardSlots[activeCardSlot];

    const rawGacha = rawSession.gacha && typeof rawSession.gacha === 'object' && !Array.isArray(rawSession.gacha)
        ? rawSession.gacha
        : {};
    const normalizedCollection = Array.isArray(rawGacha.collection)
        ? rawGacha.collection.map(normalizeGachaCardEntry).filter(Boolean).slice(0, MAX_GACHA_COLLECTION)
        : [];
    const validCollectionIds = new Set(normalizedCollection.map((x) => x.id));
    const validGachaAspects = new Set(GACHA_RESOLUTION_OPTIONS.map((a) => a.id));
    const gacha = {
        ...base.gacha,
        tagsInput: String(rawGacha.tagsInput ?? ''),
        pullSize: Number(rawGacha.pullSize) === 3 ? 3 : 1,
        aspectRatio: validGachaAspects.has(rawGacha.aspectRatio) ? rawGacha.aspectRatio : 'sillyimages_default',
        cycleCount: Number.isFinite(Number(rawGacha.cycleCount))
            ? Math.max(0, Math.min(50, Math.round(Number(rawGacha.cycleCount))))
            : 0,
        totalPulls: Number.isFinite(Number(rawGacha.totalPulls)) ? Math.max(0, Math.round(Number(rawGacha.totalPulls))) : 0,
        pitySince4Plus: Number.isFinite(Number(rawGacha.pitySince4Plus)) ? Math.max(0, Math.round(Number(rawGacha.pitySince4Plus))) : 0,
        cooldownEndsAt: Number.isFinite(Number(rawGacha.cooldownEndsAt)) ? Math.max(0, Number(rawGacha.cooldownEndsAt)) : 0,
        wishPrefs: normalizeGachaWishPrefs(rawGacha.wishPrefs),
        _legacyResetCharges: Number.isFinite(Number(rawGacha.resetCharges)) ? Number(rawGacha.resetCharges) : 0,
        recentNamesPool: Array.isArray(rawGacha.recentNamesPool)
            ? rawGacha.recentNamesPool.map((n) => String(n).trim()).filter(Boolean).slice(0, 30)
            : [],
        collection: normalizedCollection,
        fusionSlotIds: Array.isArray(rawGacha.fusionSlotIds)
            ? rawGacha.fusionSlotIds.map(String).filter((id) => validCollectionIds.has(id)).slice(0, 3)
            : [],
        fusionArtRefs: Boolean(rawGacha.fusionArtRefs),
        fusionHint: String(rawGacha.fusionHint ?? ''),
        lastRevealBatch: Array.isArray(rawGacha.lastRevealBatch)
            ? rawGacha.lastRevealBatch.map(normalizeGachaCardEntry).filter(Boolean).slice(0, 5)
            : [],
    };

    const hasExistingWork = Boolean(
        (tinder.liked && tinder.liked.length)
        || (tinder.queue && tinder.queue.length)
        || (gacha.collection && gacha.collection.length)
        || (blitz.questions && blitz.questions.length)
        || card.name
        || card.description,
    );
    return {
        id: String(rawSession.id || '').trim() || base.id,
        title: String(rawSession.title || '').trim() || base.title,
        homeCompleted: rawSession.homeCompleted !== undefined ? Boolean(rawSession.homeCompleted) : hasExistingWork,
        frozen: Boolean(rawSession.frozen),
        createdAt: Number.isFinite(Number(rawSession.createdAt)) ? Number(rawSession.createdAt) : base.createdAt,
        activeCardSlot,
        intake,
        artRefCustom,
        tinder,
        gacha,
        blitz,
        architect,
        rework,
        cardSlots,
        card,
    };
}

function createCompactMigrationSnapshot(rawCfg) {
    try {
        const clone = JSON.parse(JSON.stringify(rawCfg, (key, val) => {
            if (key === 'avatarDataUrl' && typeof val === 'string' && val.length > 120) {
                return `[inline_media_${val.length}b]`;
            }
            if (key === '_preMigrationBackup') return undefined;
            return val;
        }));
        return {
            backedUpAt: Date.now(),
            fromVersion: Number(rawCfg?.settingsSchemaVersion || 1),
            snapshot: clone,
        };
    } catch {
        return null;
    }
}

// Versioned settings migration & recovery (fixes NMF-014)
export function normalizeAndMigrateSettings(rawCfg, { defaultTheme = 'tavern' } = {}) {
    let recoveredFromCorruption = false;
    let migrated = false;

    if (!rawCfg || typeof rawCfg !== 'object' || Array.isArray(rawCfg)) {
        recoveredFromCorruption = rawCfg !== undefined && rawCfg !== null;
        const fresh = {
            settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
            uiLang: detectDefaultUiLang(),
            theme: defaultTheme || 'tavern',
            transportMode: 'prefill_user_msg',
            stripActiveCharFromPreset: true,
            presetCorrectionPrompt: DEFAULT_PRESET_CORRECTION_PROMPT,
            imageSource: 'auto',
            imageProfileId: '',
            imageStyleId: '',
            styleWrapMode: 'plain_prefix',
            imageNegativeId: '',
            imageCustomNegative: '',
            imageAspectRatio: '1:1',
            imageCropFocus: 'top',
            imageRefMode: 'off',
            imagePickedRefUid: '',
            gachaTimerEnabled: true,
            gachaCooldownMinutes: DEFAULT_GACHA_COOLDOWN_MINUTES,
            gachaMaxPullsPerCycle: GACHA_CYCLE_LIMIT,
            gachaLuckMode: 'fair',
            gachaSacrificeFailEnabled: true,
            gachaSacrificeFailChance: 25,
            gachaWallet: createDefaultGachaWallet(),
            savedVault: [],
            activeSessionId: '',
            sessions: [createDefaultSession(1)],
        };
        fresh.activeSessionId = fresh.sessions[0].id;
        return { settings: fresh, migrated: true, recoveredFromCorruption };
    }

    const prevVersion = Number(rawCfg.settingsSchemaVersion || 1);
    let preMigrationBackup = rawCfg._preMigrationBackup || null;
    if (prevVersion < SETTINGS_SCHEMA_VERSION) {
        preMigrationBackup = createCompactMigrationSnapshot(rawCfg) || preMigrationBackup;
        migrated = true;
    }

    let sessions = [];
    if (Array.isArray(rawCfg.sessions) && rawCfg.sessions.length > 0) {
        const nonNullRawSessions = rawCfg.sessions.filter((item) => {
            if (item === null || item === undefined) {
                recoveredFromCorruption = true;
                return false;
            }
            return true;
        });
        sessions = nonNullRawSessions
            .map((s, idx) => {
                try {
                    if (typeof s !== 'object' || Array.isArray(s)) {
                        recoveredFromCorruption = true;
                        return null;
                    }
                    return normalizeSession(s, idx + 1);
                } catch {
                    recoveredFromCorruption = true;
                    return null;
                }
            })
            .filter(Boolean);
    }

    if (sessions.length === 0) {
        if (rawCfg.sessions !== undefined) recoveredFromCorruption = true;
        sessions = [createDefaultSession(1)];
        migrated = true;
    }

    const activeSessionId = (rawCfg.activeSessionId && sessions.some((s) => s.id === rawCfg.activeSessionId))
        ? String(rawCfg.activeSessionId)
        : sessions[0].id;

    const savedVault = Array.isArray(rawCfg.savedVault)
        ? rawCfg.savedVault.map(normalizeVaultCardEntry).filter(Boolean).slice(0, MAX_SAVED_VAULT)
        : [];

    const gachaWallet = normalizeGachaWallet(rawCfg.gachaWallet, sessions, activeSessionId);
    for (const s of sessions) {
        if (s?.gacha && '_legacyResetCharges' in s.gacha) {
            delete s.gacha._legacyResetCharges;
        }
    }

    const parsedCooldownMin = Number(rawCfg.gachaCooldownMinutes);
    const parsedMaxPulls = Number(rawCfg.gachaMaxPullsPerCycle);
    const parsedFailChance = Number(rawCfg.gachaSacrificeFailChance);
    const validLuckModes = new Set(GACHA_LUCK_OPTIONS.map((x) => x.id));

    const normalized = {
        settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
        uiLang: rawCfg.uiLang ? normalizeUiLang(rawCfg.uiLang) : detectDefaultUiLang(),
        theme: typeof rawCfg.theme === 'string' && rawCfg.theme.trim() ? rawCfg.theme.trim() : (defaultTheme || 'tavern'),
        transportMode: rawCfg.transportMode === 'json_schema' ? 'json_schema' : 'prefill_user_msg',
        stripActiveCharFromPreset: rawCfg.stripActiveCharFromPreset !== false,
        presetCorrectionPrompt: rawCfg.presetCorrectionPrompt !== undefined && rawCfg.presetCorrectionPrompt !== null
            ? String(rawCfg.presetCorrectionPrompt)
            : DEFAULT_PRESET_CORRECTION_PROMPT,
        imageSource: typeof rawCfg.imageSource === 'string' && rawCfg.imageSource.trim() ? rawCfg.imageSource.trim() : 'auto',
        imageProfileId: typeof rawCfg.imageProfileId === 'string' ? rawCfg.imageProfileId : '',
        imageStyleId: typeof rawCfg.imageStyleId === 'string' ? rawCfg.imageStyleId : '',
        styleWrapMode: ['plain_prefix', 'sillyimages_tag', 'suffix'].includes(rawCfg.styleWrapMode)
            ? rawCfg.styleWrapMode
            : 'plain_prefix',
        imageNegativeId: typeof rawCfg.imageNegativeId === 'string' ? rawCfg.imageNegativeId : '',
        imageCustomNegative: typeof rawCfg.imageCustomNegative === 'string' ? rawCfg.imageCustomNegative : '',
        imageAspectRatio: typeof rawCfg.imageAspectRatio === 'string' && rawCfg.imageAspectRatio.trim()
            ? rawCfg.imageAspectRatio.trim()
            : '1:1',
        imageCropFocus: typeof rawCfg.imageCropFocus === 'string' && rawCfg.imageCropFocus.trim()
            ? rawCfg.imageCropFocus.trim()
            : 'top',
        imageRefMode: ['off', 'auto_lorebook', 'pick_sillyimages', 'custom_photo'].includes(rawCfg.imageRefMode)
            ? rawCfg.imageRefMode
            : 'off',
        imagePickedRefUid: typeof rawCfg.imagePickedRefUid === 'string' ? rawCfg.imagePickedRefUid : '',
        gachaTimerEnabled: rawCfg.gachaTimerEnabled !== false,
        gachaCooldownMinutes: Number.isFinite(parsedCooldownMin) && parsedCooldownMin >= 5 && parsedCooldownMin <= 1440
            ? Math.round(parsedCooldownMin)
            : DEFAULT_GACHA_COOLDOWN_MINUTES,
        gachaMaxPullsPerCycle: Number.isFinite(parsedMaxPulls) && parsedMaxPulls >= 3 && parsedMaxPulls <= 50
            ? Math.round(parsedMaxPulls)
            : GACHA_CYCLE_LIMIT,
        gachaLuckMode: validLuckModes.has(rawCfg.gachaLuckMode) ? rawCfg.gachaLuckMode : 'fair',
        gachaSacrificeFailEnabled: prevVersion < 7
            ? true
            : (rawCfg.gachaSacrificeFailEnabled !== undefined ? Boolean(rawCfg.gachaSacrificeFailEnabled) : true),
        gachaSacrificeFailChance: Number.isFinite(parsedFailChance) && parsedFailChance >= 5 && parsedFailChance <= 90
            ? Math.round(parsedFailChance)
            : 25,
        gachaWallet,
        savedVault,
        activeSessionId,
        sessions,
    };

    if (preMigrationBackup) {
        normalized._preMigrationBackup = preMigrationBackup;
    }

    return { settings: normalized, migrated, recoveredFromCorruption };
}

export function resolveWordTarget(intake = {}) {
    if (intake?.wordBudgetId === 'custom') return Math.max(100, Math.min(4000, Number(intake.customWords) || 800));
    const found = WORD_BUDGETS.find((b) => b.id === intake?.wordBudgetId);
    return found ? found.words : 600;
}

export function resolveGreetingTarget(intake = {}) {
    if (intake?.greetingBudgetId === 'custom') return Math.max(50, Math.min(2000, Number(intake.customGreetingWords) || 320));
    const found = GREETING_BUDGETS.find((b) => b.id === intake?.greetingBudgetId);
    return found ? found.words : 280;
}

export function summarizeGachaWishPrefsBlock(session) {
    const it = session?.intake || createDefaultSession(1).intake;
    const wp = normalizeGachaWishPrefs(session?.gacha?.wishPrefs);
    const targetModeMap = {
        oc: 'Original Character (OC) forged 100% from scratch around the "+" tag formula (do NOT pull canon characters from unrelated fandoms!)',
        fandom_oc: 'Original Character (OC) native to the specified Gacha Universe below',
        canon_au: 'Canon Character or Alternate Universe variant from the specified Gacha Universe below',
        duo_group: 'DUO / GROUP CAST CARD (2-3 Distinct Interacting Characters in one card & visual frame)',
        artifact: 'SENTIENT / FOCAL ARTIFACT OR OBJECT CARD',
        world_rpg: 'WORLD / INTERACTIVE RPG SYSTEM CARD (Living Setting & Multi-NPC World)',
    };
    const ratingMap = {
        sfw: 'SFW (Clean / Non-explicit)',
        mature: 'Mature 16+ (Dramatic, gritty, dark or intense themes allowed)',
        nsfw: 'NSFW 18+ (Adult roleplay card; mature/explicit elements allowed naturally)',
    };
    const cardLangSpec = resolveCardLanguageSpec(it);
    const userLangSpec = resolveUserLanguageSpec(it);
    const gachaGenderIntake = {
        userGender: wp.userGender,
        userGenderCustom: wp.userGenderCustom,
        targetGender: wp.targetGender,
        targetGenderCustom: wp.targetGenderCustom,
    };
    const { userSpec, targetSpec } = resolveGenderSummary(gachaGenderIntake);
    const worldLike = wp.targetType === 'world_rpg' || wp.targetType === 'artifact';
    const isLeftBlankForRandom = (
        wp.targetType === 'oc'
        && !wp.fandomOrWorld.trim()
        && !wp.wishesNote.trim()
        && !wp.hardBans.trim()
        && (wp.targetGender || 'any') === 'any'
    );

    const rawText = [
        `[GACHA BANNER WISH PREFERENCES — 100% ISOLATED FROM MAIN STORY QUESTIONNAIRE]`,
        `- Summon Target Mode: ${targetModeMap[wp.targetType] || targetModeMap.oc}`,
        isLeftBlankForRandom
            ? `- High-Randomization Mode: Gacha Questionnaire was intentionally left blank — maximize creative surprise, diverse archetypes, and fresh settings guided purely by the "+" tags!`
            : '',
        userSpec ? `- Player ({ {user} }) Gender / Identity: ${userSpec}` : '',
        targetSpec ? (worldLike
            ? `- Key Cast / Entity Gender Preference: ${targetSpec}`
            : `- Summoned Character ({ {char} }) Gender / Identity Sought: ${targetSpec} (strictly match this!)`) : '',
        wp.fandomOrWorld.trim()
            ? `- Gacha Universe / Setting Anchor: ${wp.fandomOrWorld.trim()}`
            : `- Universe Rule: Derive the world & setting purely from the current "+" summon tags (do NOT inject outside fandoms!).`,
        wp.wishesNote.trim() ? `- User's Special Wish & Chemistry Desire: ${wp.wishesNote.trim()}` : '',
        wp.hardBans.trim() ? `- STRICTLY AVOID in this Banner (Banned Elements): ${wp.hardBans.trim()}` : '',
        `- Content Rating: ${ratingMap[wp.rating] || ratingMap.mature}`,
        `- Target Output Language for AI Card Fields: ${cardLangSpec.directive}`,
        `- Target Language for Human-Facing Preview & Creator Notes: ${userLangSpec.directive}`,
    ].filter(Boolean).join('\n');

    return (it.playerNameMode || 'macro') === 'macro' ? shieldMacrosForPrompt(rawText) : rawText;
}

export function summarizeIntakeBlock(session, { modeContext = 'swipe' } = {}) {
    if (modeContext === 'gacha') {
        return summarizeGachaWishPrefsBlock(session);
    }
    if (modeContext === 'blitz') {
        const seed = resolveBlitzSeedCandidate(session);
        if (seed?.source === 'gacha') {
            return summarizeGachaWishPrefsBlock(session);
        }
        if (session?.blitz?.useTinderContext === false && !seed) {
            return summarizeMinimalDirectIdeaBlock(session);
        }
    }
    const it = session?.intake || createDefaultSession(1).intake;
    const originMap = {
        oc: 'Single Character — Original Character & World (OC)',
        canon: 'Single Character — Known Fandom Canon Character',
        fandom_au: 'Single Character — Known Fandom Alternate Universe (AU)',
        fandom_oc: 'Single Character — Original Character inside Known Fandom',
        duo_group: 'DUO / GROUP CAST CARD (2-3 Distinct Interacting Characters in one card & visual frame)',
        artifact_object: 'SENTIENT / FOCAL ARTIFACT OR OBJECT CARD (Roleplay centered around a unique item, relic, or entity)',
        world_sandbox: 'WORLD SANDBOX / SETTING NARRATOR CARD (Multi-NPC Living World, NOT a single romantic partner)',
        rpg_gm: 'INTERACTIVE RPG / GAME MASTER SYSTEM CARD (World + Factions + Quests/Mechanics + GM Engine)',
    };
    const genresList = [...(it.genres || []), it.customGenres || ''].filter(Boolean).join(', ');

    // Strict questionnaire isolation: Main Questionnaire NEVER reads Gacha tags or Gacha wishes!
    const includeTinderDislikes = modeContext === 'swipe';

    const antiTags = [
        ...(includeTinderDislikes ? (session?.tinder?.dislikedTags || []) : []),
        it.hardBans || '',
    ].filter(Boolean).join(', ');
    const antiNotes = includeTinderDislikes
        ? (session?.tinder?.dislikedNotes || []).filter(Boolean).join('; ')
        : '';

    const ratingMap = {
        sfw: 'SFW (Clean / Non-explicit)',
        mature: 'Mature 16+ (Dramatic, gritty, dark or intense themes allowed)',
        nsfw: 'NSFW 18+ (Adult roleplay card; mature/explicit elements allowed naturally)',
    };
    const cardLangSpec = resolveCardLanguageSpec(it);
    const userLangSpec = resolveUserLanguageSpec(it);
    const { userSpec, targetSpec } = resolveGenderSummary(it);
    const worldMode = isWorldOrRpgMode(it) || it.originType === 'artifact_object';

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
        `- Target Output Language for AI Card Fields (Description, Personality, Scenario, First Message, Dialogue): ${cardLangSpec.directive}`,
        `- Target Language for Human-Facing Creator Notes & Summaries: ${userLangSpec.directive}`,
    ].filter(Boolean).join('\n');

    return (it.playerNameMode || 'macro') === 'macro' ? shieldMacrosForPrompt(rawText) : rawText;
}

export function stripReasoning(raw) {
    if (raw && typeof raw === 'object') {
        return JSON.stringify(raw);
    }
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

// Balanced JSON block scanner so multiple JSON objects or surrounding text in a single message parse cleanly (fixes NMF-010)
function scanBalancedJsonCandidates(str) {
    const out = [];
    const len = str.length;
    for (let i = 0; i < len; i++) {
        const ch = str[i];
        if (ch !== '{' && ch !== '[') continue;
        let depth = 0;
        let inString = false;
        let escaped = false;
        const stack = [];
        for (let j = i; j < len; j++) {
            const c = str[j];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (c === '\\') {
                    escaped = true;
                } else if (c === '"') {
                    inString = false;
                }
                continue;
            }
            if (c === '"') {
                inString = true;
                continue;
            }
            if (c === '{' || c === '[') {
                stack.push(c === '{' ? '}' : ']');
                depth++;
            } else if (c === '}' || c === ']') {
                const expected = stack.pop();
                if (c !== expected) break;
                depth--;
                if (depth === 0) {
                    out.push(str.slice(i, j + 1));
                    i = j;
                    break;
                }
            }
        }
    }
    return out;
}

export function extractJsonLoose(raw, validatorFn = null) {
    if (raw && typeof raw === 'object') {
        if (!validatorFn || validatorFn(raw)) return raw;
        throw new Error('Ответ модели имеет неверную JSON-структуру для выбранной задачи.');
    }

    const cleaned = stripReasoning(raw)
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    if (!cleaned) {
        throw new Error('Модель вернула пустой ответ.');
    }

    try {
        const direct = JSON.parse(cleaned);
        if (!validatorFn || validatorFn(direct)) return direct;
    } catch {
        // Fall through to balanced candidate extraction
    }

    const candidates = scanBalancedJsonCandidates(cleaned);
    const parsedValid = [];
    const parsedAny = [];

    for (const snippet of candidates) {
        try {
            const val = JSON.parse(snippet);
            parsedAny.push(val);
            if (!validatorFn || validatorFn(val)) {
                parsedValid.push(val);
            }
        } catch {
            // Ignore malformed fragment
        }
    }

    if (parsedValid.length > 0) {
        return parsedValid[parsedValid.length - 1];
    }
    if (parsedAny.length > 0 && validatorFn) {
        throw new Error('JSON получен, но в нём отсутствуют обязательные поля или не совпадает тип данных.');
    }

    throw new Error('Не удалось распознать JSON-ответ модели (ответ обрезан или повреждён). Проверьте Промпт коррекции или лимит токенов ответа.');
}

function isValidFullCardJsonShape(val) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
    const d = val.data && typeof val.data === 'object' && !Array.isArray(val.data) ? val.data : val;
    if (typeof d.name !== 'string' || !d.name.trim()) return false;
    if (typeof d.description !== 'string' && typeof d.first_mes !== 'string') return false;
    if (d.alternate_greetings !== undefined && !Array.isArray(d.alternate_greetings) && typeof d.alternate_greetings !== 'string') {
        return false;
    }
    return true;
}

export function summarizeMinimalDirectIdeaBlock(session) {
    const it = session?.intake || createDefaultSession(1).intake;
    const ratingMap = {
        sfw: 'SFW (Clean / Non-explicit)',
        mature: 'Mature 16+ (Dramatic, gritty, dark or intense themes allowed)',
        nsfw: 'NSFW 18+ (Adult roleplay card; mature/explicit elements allowed naturally)',
    };
    const cardLangSpec = resolveCardLanguageSpec(it);
    const userLangSpec = resolveUserLanguageSpec(it);
    const rawText = [
        `[DIRECT FREE-IDEA MODE — IGNORE PREVIOUS SESSION FANDOMS/TROPES, FOLLOW ONLY USER CONCEPT BELOW]`,
        `- Content Rating: ${ratingMap[it.rating] || ratingMap.sfw}`,
        `- Target Output Language for AI Card Fields: ${cardLangSpec.directive}`,
        `- Target Language for Human-Facing Creator Notes: ${userLangSpec.directive}`,
    ].join('\n');
    return (it.playerNameMode || 'macro') === 'macro' ? shieldMacrosForPrompt(rawText) : rawText;
}

export function buildFullCardRequest(session, extraBrief = '', mode = 'prefill_user_msg', { modeContext = 'architect', useIntake = true } = {}) {
    const effectiveIntake = modeContext === 'gacha'
        ? {
            ...session.intake,
            originType: mapGachaTargetToOriginType(session.gacha?.wishPrefs?.targetType),
        }
        : session.intake;
    const worldMode = isWorldOrRpgMode(effectiveIntake);
    const effectiveFmtId = effectiveIntake.originType === 'rpg_gm' && effectiveIntake.cardFormat === 'dossier_19'
        ? 'rpg_gm_engine'
        : (effectiveIntake.originType === 'world_sandbox' && effectiveIntake.cardFormat === 'dossier_19'
            ? 'world_sandbox'
            : (effectiveIntake.originType === 'duo_group' && effectiveIntake.cardFormat === 'dossier_19' ? 'cast_hub' : effectiveIntake.cardFormat));
    const fmt = CARD_FORMATS.find((f) => f.id === effectiveFmtId) || CARD_FORMATS[0];

    const descWords = resolveWordTarget(effectiveIntake);
    const greetWords = resolveGreetingTarget(effectiveIntake);
    const intakeSummary = (modeContext === 'architect' && useIntake === false)
        ? summarizeMinimalDirectIdeaBlock(session)
        : summarizeIntakeBlock(session, { modeContext });
    const userLangSpec = resolveUserLanguageSpec(effectiveIntake);
    const pMode = effectiveIntake.playerNameMode || 'macro';
    const safeBrief = pMode === 'macro' ? shieldMacrosForPrompt(extraBrief) : String(extraBrief || '');
    const greetStyleBlock = buildGreetingStyleDirective(effectiveIntake);
    const artMechRule = buildFlexibleAvatarArtMechanismRule(effectiveIntake);

    const gmExtraRule = worldMode
        ? `WORLD / RPG CARD SPECIAL REQUIREMENT:\n- Because this is a World/RPG Narrator card, ALSO populate [[NMF_SYS_PROMPT]] with a crisp Game Master / Narrator operating instruction (act as reactive GM/world, voice autonomous NPCs with distinct agendas, never control or speak for the player) and [[NMF_POST_HISTORY]] with a concise anti-drift turn-ending rule (end turns on actionable hooks/consequences; keep any status block clean).`
        : '';

    const coreRules = [
        `You are NexusMatch Architect, an elite SillyTavern Character & World Card V2 designer.`,
        `Do NOT roleplay with the user. Construct a complete, vivid, ready-to-import SillyTavern V2 card.`,
        buildUniversalMacroRule(pMode),
        greetStyleBlock,
        `Never write actions, thoughts, or dialogue for the player inside the opening scene.`,
        `Target length for Description: approximately ${descWords} words.`,
        `Target length for First Message (Opening Scene): approximately ${greetWords} words.`,
        `Write human-facing Creator Notes (creator_notes / [[NMF_CREATOR_NOTES]]) in ${userLangSpec.shortLabel} so the user can read the card overview and play tips in their own language even if the card itself is in another language.`,
        CARD_META_PURITY_RULE,
        `Formatting Standard: ${fmt.name}\n${fmt.instructions}`,
        gmExtraRule,
        artMechRule,
    ].filter(Boolean).join('\n');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(coreRules) + `\nOutput ONLY valid JSON matching this exact object structure:\n{"name":"","description":"","personality":"","scenario":"","first_mes":"","alternate_greetings":[""],"mes_example":"","creator_notes":"","system_prompt":"","post_history_instructions":"","tags":["tag1","tag2"],"image_prompt":""}`,
            user: `${intakeSummary}\n\n[USER CONCEPT / EXTRA DATA]\n${safeBrief || 'Create an unforgettable card matching all intake parameters above.'}`,
            jsonSchema: FULL_CARD_JSON_SCHEMA,
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
            `[[NMF_DESC]]Full Description[[/NMF_DESC]]`,
            `[[NMF_PERSONALITY]]${worldMode ? 'GM / Narrator behavioral principles' : 'Concise personality summary'}[[/NMF_PERSONALITY]]`,
            `[[NMF_SCENARIO]]Starting scenario & premise[[/NMF_SCENARIO]]`,
            `[[NMF_FIRST_MES]]Opening scene[[/NMF_FIRST_MES]]`,
            `[[NMF_ALT_GREETING]]One alternative opening scene hook[[/NMF_ALT_GREETING]]`,
            `[[NMF_MES_EXAMPLE]]<START>\n{ {user} }: ...\n{ {char} }: ...[[/NMF_MES_EXAMPLE]]`,
            `[[NMF_SYS_PROMPT]]${worldMode ? 'System prompt for GM/Narrator role' : ''}[[/NMF_SYS_PROMPT]]`,
            `[[NMF_POST_HISTORY]]${worldMode ? 'Post-history anti-drift / HUD reminder' : ''}[[/NMF_POST_HISTORY]]`,
            `[[NMF_CREATOR_NOTES]]Brief creator notes & play tips for the user[[/NMF_CREATOR_NOTES]]`,
            `[[NMF_TAGS]]comma-separated tags[[/NMF_TAGS]]`,
            `[[NMF_IMG_PROMPT]]Detailed English visual prompt[[/NMF_IMG_PROMPT]]`,
        ].join('\n')),
        jsonSchema: null,
    };
}

export function parseFullCardResponse(raw, mode = 'prefill_user_msg', playerNameMode = 'macro', { fallbackName = '' } = {}) {
    const text = stripReasoning(raw);
    const cleanFallbackName = String(fallbackName || '').trim();
    let res;
    if (typeof raw === 'string' && (text.includes('[[NMF_NAME]]') || text.includes('[[NMF_DESC]]'))) {
        const alt = extractTagBlock(text, 'NMF_ALT_GREETING');
        res = {
            name: extractTagBlock(text, 'NMF_NAME') || cleanFallbackName,
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
        if (!res.name || (!res.description && !res.first_mes)) {
            throw new Error('Ответ модели не содержит обязательных секций имени и описания.');
        }
    } else {
        const validator = cleanFallbackName
            ? (val) => {
                if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
                const d = val.data && typeof val.data === 'object' && !Array.isArray(val.data) ? val.data : val;
                if (d.name !== undefined && typeof d.name !== 'string') return false;
                if (typeof d.description !== 'string' && typeof d.first_mes !== 'string') return false;
                if (d.alternate_greetings !== undefined && !Array.isArray(d.alternate_greetings) && typeof d.alternate_greetings !== 'string') {
                    return false;
                }
                return true;
            }
            : isValidFullCardJsonShape;
        const rawObj = extractJsonLoose(raw, validator);
        const obj = rawObj.data && typeof rawObj.data === 'object' ? rawObj.data : rawObj;
        const altList = Array.isArray(obj.alternate_greetings)
            ? obj.alternate_greetings.filter((x) => typeof x === 'string' || typeof x === 'number').map(String).filter(Boolean)
            : (typeof obj.alternate_greetings === 'string' && obj.alternate_greetings.trim() ? [obj.alternate_greetings.trim()] : []);
        const tagsText = Array.isArray(obj.tags)
            ? obj.tags.map((t) => String(t).trim()).filter(Boolean).join(', ')
            : String(obj.tags ?? '').trim();

        res = {
            name: String(obj.name || '').trim() || cleanFallbackName,
            description: typeof obj.description === 'string' ? obj.description.trim() : '',
            personality: typeof obj.personality === 'string' ? obj.personality.trim() : '',
            scenario: typeof obj.scenario === 'string' ? obj.scenario.trim() : '',
            first_mes: typeof obj.first_mes === 'string' ? obj.first_mes.trim() : '',
            alternate_greetings: altList,
            mes_example: typeof obj.mes_example === 'string' ? obj.mes_example.trim() : '',
            system_prompt: typeof obj.system_prompt === 'string' ? obj.system_prompt.trim() : '',
            post_history_instructions: typeof obj.post_history_instructions === 'string' ? obj.post_history_instructions.trim() : '',
            creator_notes: typeof obj.creator_notes === 'string' ? obj.creator_notes.trim() : '',
            tags: tagsText,
            imagePrompt: typeof (obj.image_prompt ?? obj.imagePrompt) === 'string'
                ? String(obj.image_prompt ?? obj.imagePrompt).trim()
                : '',
        };
    }

    const chName = sanitizeCardMetaPollution(res.name) || cleanFallbackName || res.name;
    return {
        ...res,
        name: chName,
        description: sanitizeCardMetaPollution(normalizeCardMacros(res.description, chName, playerNameMode)),
        personality: sanitizeCardMetaPollution(normalizeCardMacros(res.personality, chName, playerNameMode)),
        scenario: sanitizeCardMetaPollution(normalizeCardMacros(res.scenario, chName, playerNameMode)),
        first_mes: sanitizeCardMetaPollution(normalizeCardMacros(res.first_mes, chName, playerNameMode)),
        alternate_greetings: res.alternate_greetings.map((g) => sanitizeCardMetaPollution(normalizeCardMacros(g, chName, playerNameMode))),
        mes_example: sanitizeCardMetaPollution(normalizeCardMacros(res.mes_example, chName, playerNameMode)),
        system_prompt: sanitizeCardMetaPollution(normalizeCardMacros(res.system_prompt, chName, playerNameMode)),
        post_history_instructions: sanitizeCardMetaPollution(normalizeCardMacros(res.post_history_instructions, chName, playerNameMode)),
        creator_notes: sanitizeCardMetaPollution(normalizeCardMacros(res.creator_notes, chName, playerNameMode)),
        tags: sanitizeCardMetaPollution(res.tags, { isTags: true }),
    };
}

export function buildTinderPreviewRequest(session, count = 1, mode = 'prefill_user_msg') {
    const intakeSummary = summarizeIntakeBlock(session, { modeContext: 'swipe' });
    const worldMode = isWorldOrRpgMode(session.intake);
    const pMode = session.intake.playerNameMode || 'macro';
    // Swipe preview cards are read directly by the human user -> use userLanguage!
    const previewLangSpec = resolveUserLanguageSpec(session.intake);
    const artMechRule = buildFlexibleAvatarArtMechanismRule(session.intake);
    const hint = session.tinder.promptHint ? `\nExtra Swipe Wish: ${shieldMacrosForPrompt(session.tinder.promptHint)}` : '';
    const macroRule = buildUniversalMacroRule(pMode);

    const entityDesc = worldMode
        ? `distinct, atmospheric WORLD SANDBOX / RPG CAMPAIGN preview card(s) (each card is a whole playable setting/campaign with factions, hook, and visual atmosphere — NOT a single dating bio!)`
        : (session.intake.originType === 'artifact_object'
            ? `distinct, intriguing FOCAL ARTIFACT / RELIC preview card(s)`
            : `distinct, magnetic CHARACTER dating-profile card(s)`);

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`You are NexusMatch Swipe Generator. Generate ${count} ${entityDesc}. Write all human-readable preview fields (name, archetype, pitch, appearance, quote, tags) in ${previewLangSpec.directive}, and write image_prompt in English following the Avatar Art Mechanism below. Respect all disliked/banned tags strictly.\n${macroRule}\n${artMechRule}\nOutput ONLY valid JSON: {"candidates":[{"name":"","compatibility":92,"archetype":"","pitch":"","appearance":"","quote":"","tags":["t1","t2","t3","t4"],"image_prompt":""}]}`),
            user: intakeSummary + hint,
            jsonSchema: TINDER_PREVIEW_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // SWIPE DECK PITCHES]`,
            `Generate ${count} ${entityDesc}.`,
            `Preview Display Language (for name, archetype, pitch, looks, quote, tags — read by the user): ${previewLangSpec.directive}.`,
            `Strictly avoid every disliked tag and rejected pattern listed below!`,
            macroRule,
            artMechRule,
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
            `[[NMF_C_IMG]]SCENE: ... CHARACTERS IN THE IMAGE: ... FIGURE / OBJECT ...[[/NMF_C_IMG]]`,
            `[[/NMF_CANDIDATE]]`,
        ].join('\n')),
        jsonSchema: null,
    };
}

function isValidSwipeCandidatesShape(val) {
    const arr = Array.isArray(val) ? val : (val && typeof val === 'object' ? val.candidates : null);
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((c) => c && typeof c === 'object' && !Array.isArray(c) && typeof c.name === 'string' && c.name.trim());
}

export function parseTinderPreviewResponse(raw, playerNameMode = 'macro') {
    const text = stripReasoning(raw);
    if (typeof raw === 'string') {
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
                    avatarId: '',
                    avatarDataUrl: '',
                };
            });
        }
    }

    const obj = extractJsonLoose(raw, isValidSwipeCandidatesShape);
    const arr = Array.isArray(obj) ? obj : (obj.candidates || []);
    return arr.map((c) => {
        const baseName = String(c.name || 'Кандидат').trim();
        const fullLabel = c.age && !baseName.includes(String(c.age)) ? `${baseName}, ${c.age}` : baseName;
        return {
            id: 'cand_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
            name: fullLabel,
            compatibility: Number.isFinite(Number(c.compatibility))
                ? Math.min(99, Math.max(60, Number(c.compatibility)))
                : (85 + Math.floor(Math.random() * 14)),
            archetype: normalizeCardMacros(String(c.archetype || '').trim(), baseName, playerNameMode),
            pitch: normalizeCardMacros(String(c.pitch || '').trim(), baseName, playerNameMode),
            appearance: normalizeCardMacros(String(c.appearance || '').trim(), baseName, playerNameMode),
            quote: normalizeCardMacros(String(c.quote || '').trim(), baseName, playerNameMode),
            tags: Array.isArray(c.tags) ? c.tags.map(String) : String(c.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
            imagePrompt: String(c.image_prompt || c.imagePrompt || '').trim(),
            avatarId: '',
            avatarDataUrl: '',
        };
    });
}

export function listBlitzSelectableCandidates(session) {
    const out = [];
    const bz = session?.blitz || {};
    if (bz.useTinderContext !== false) {
        for (const c of (session?.tinder?.liked || [])) {
            if (c && c.id) out.push({ ref: `liked:${c.id}`, source: 'tinder', badge: 'Мэтч', entity: c });
        }
        for (const c of (session?.tinder?.queue || [])) {
            if (c && c.id && !out.some((x) => x.entity.id === c.id)) {
                out.push({ ref: `queue:${c.id}`, source: 'tinder', badge: 'Лента', entity: c });
            }
        }
    }
    if (bz.useGachaContext) {
        for (const g of (session?.gacha?.collection || [])) {
            if (g && g.id) out.push({ ref: `gacha:${g.id}`, source: 'gacha', badge: `Гача ${g.stars || 3} зв.`, entity: g });
        }
    }
    return out;
}

export function resolveBlitzSeedCandidate(session) {
    const list = listBlitzSelectableCandidates(session);
    if (!list.length) return null;
    const ref = String(session?.blitz?.selectedCandidateRef || '').trim();
    if (ref === '__none__') return null;
    if (ref) {
        const hit = list.find((x) => x.ref === ref || x.entity.id === ref);
        if (hit) return hit;
    }
    return list[0];
}

export function buildBlitzQuestionsRequest(session, singleIndexToReplace = -1, mode = 'prefill_user_msg') {
    const seedHit = resolveBlitzSeedCandidate(session);
    const seedEntity = seedHit?.entity || null;
    const effectiveModeContext = seedHit?.source === 'gacha' ? 'gacha' : 'blitz';
    const intakeSummary = summarizeIntakeBlock(session, { modeContext: effectiveModeContext });
    const worldMode = effectiveModeContext === 'gacha'
        ? (session.gacha?.wishPrefs?.targetType === 'world_rpg' || session.gacha?.wishPrefs?.targetType === 'artifact')
        : isWorldOrRpgMode(session.intake);
    const langSpec = resolveUserLanguageSpec(session.intake);

    const defaultTopic = seedEntity
        ? `Deepening and fleshing out ${seedEntity.name}`
        : (worldMode ? 'Core Worldbuilding & RPG Campaign Design' : 'Ideal Character & Story Chemistry');
    const topic = shieldMacrosForPrompt(session.blitz.topic || defaultTopic);
    const withChoices = Boolean(session.blitz.includeChoices);
    const configuredCount = Math.min(25, Math.max(3, Math.round(Number(session.blitz?.questionCount) || 10)));
    const count = singleIndexToReplace >= 0 ? 1 : configuredCount;
    const existingList = singleIndexToReplace >= 0
        ? `\nExisting questions (do NOT repeat these; generate 1 brand-new replacement question for slot #${singleIndexToReplace + 1}):\n` +
          shieldMacrosForPrompt(session.blitz.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n'))
        : '';

    const seedCharacterBlock = seedEntity
        ? `\n[SELECTED CHARACTER SEED TO DEEPEN IN THIS BLITZ — MANDATORY SUBJECT]\n` +
          shieldMacrosForPrompt(buildCleanBriefFromEntity(seedEntity)) +
          `\nCRITICAL RULE: Every single question MUST be specifically about THIS exact character ("${seedEntity.name}") — refer to ${seedEntity.name} directly by name, build directly on their existing pitch/appearance/archetype above, and ask the user clarifying questions about ${seedEntity.name}'s hidden past, habits, relationship dynamic with the player, and opening scene! NEVER invent a separate character!`
        : '';

    const naturalQuestionToneRule = `Write questions in clean, natural human language in ${langSpec.shortLabel} — do NOT put raw technical curly-brace macros like {{char}} or {{user}} inside the question text itself.`;

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`Generate ${count} sharp, engaging quiz question(s) in ${langSpec.shortLabel}. ${naturalQuestionToneRule} ${withChoices ? 'Include 3 concise clickable option suggestions per question.' : 'Keep options empty [].'}\nOutput ONLY valid JSON: {"questions":[{"question":"","options":[]}]}`),
            user: `Topic: ${topic}\n${intakeSummary}${seedCharacterBlock}${existingList}`,
            jsonSchema: BLITZ_QUESTIONS_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // BLITZ QUESTIONNAIRE]`,
            `Generate ${count} engaging, insightful question(s) in ${langSpec.shortLabel} around: "${topic}".`,
            naturalQuestionToneRule,
            seedEntity
                ? `Focus 100% on deepening "${seedEntity.name}" (their secret history, psychological contradictions, attitude toward the player, voice quirks, and exact starting encounter) without contradicting their established bio above.`
                : (worldMode
                    ? `Cover distinct worldbuilding & RPG angles (magic/tech level, danger & lethality, factions, starting status of player, quests/HUD mechanics, tone).`
                    : `Cover distinct character angles (core paradox, visual impression, secret/past, dynamic with player, voice/habit, tension).`),
            withChoices ? `For each question, also provide 3 concise suggested answer options separated by " | ".` : `Do NOT add multiple-choice options unless requested.`,
            intakeSummary + seedCharacterBlock + existingList,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `Wrap each question in [[NMF_Q]]...[[/NMF_Q]]:`,
            `[[NMF_Q]]`,
            `[[NMF_Q_TEXT]]Question text[[/NMF_Q_TEXT]]`,
            withChoices ? `[[NMF_Q_OPTS]]Option 1 | Option 2 | Option 3[[/NMF_Q_OPTS]]` : ``,
            `[[/NMF_Q]]`,
        ].filter(Boolean).join('\n')),
        jsonSchema: null,
    };
}

function isValidBlitzQuestionsShape(val) {
    const arr = Array.isArray(val) ? val : (val && typeof val === 'object' ? val.questions : null);
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((q) => (typeof q === 'string' && q.trim()) || (q && typeof q === 'object' && typeof q.question === 'string' && q.question.trim()));
}

export function parseBlitzQuestionsResponse(raw) {
    const text = stripReasoning(raw);
    if (typeof raw === 'string') {
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
    }

    const obj = extractJsonLoose(raw, isValidBlitzQuestionsShape);
    const arr = Array.isArray(obj) ? obj : (obj.questions || []);
    return arr.map((q) => ({
        id: 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        question: normalizeCardMacros(String(typeof q === 'object' ? q.question : q).trim()),
        options: Array.isArray(q?.options) ? q.options.map((o) => normalizeCardMacros(String(o))).filter(Boolean) : [],
        answer: '',
        skipped: false,
    }));
}

export function buildAuReworkQuestionsRequest(session, sourceCard, singleIndexToReplace = -1, mode = 'prefill_user_msg') {
    const rw = session.rework || {};
    const targetEra = rw.targetSettingEra || session.intake.settingEra || 'Alternate Universe';
    const langSpec = resolveUserLanguageSpec(session.intake);
    const withChoices = rw.includeChoices !== false;
    const configuredCount = Math.min(20, Math.max(3, Math.round(Number(rw.questionCount) || 5)));
    const count = singleIndexToReplace >= 0 ? 1 : configuredCount;
    const macroRule = buildUniversalMacroRule(session.intake.playerNameMode || 'macro');
    const intakeSummary = summarizeIntakeBlock(session, { modeContext: 'rework' });

    const existingList = singleIndexToReplace >= 0
        ? `\nExisting AU questions (do NOT repeat these; generate 1 brand-new replacement question for slot #${singleIndexToReplace + 1}):\n` +
          shieldMacrosForPrompt((rw.questions || []).map((q, i) => `${i + 1}. ${q.question}`).join('\n'))
        : '';

    const srcExcerpt = shieldMacrosForPrompt([
        `[SOURCE CHARACTER TO TRANSPLANT]`,
        `Name: ${sourceCard.name || ''}`,
        `Description:\n${String(sourceCard.description || '').slice(0, 3500)}`,
        sourceCard.personality ? `Personality:\n${String(sourceCard.personality).slice(0, 1200)}` : '',
        sourceCard.scenario ? `Scenario:\n${String(sourceCard.scenario).slice(0, 1000)}` : '',
    ].filter(Boolean).join('\n\n'));

    const sysCore = [
        `You are NexusMatch Multiverse AU Consultant.`,
        `Analyze the Source Character and the Target Universe ("${targetEra}")${rw.moodTone ? ` [Mood: ${rw.moodTone}]` : ''}${rw.encounterIdea ? ` [Encounter hint: ${rw.encounterIdea}]` : ''}.`,
        `Generate ${count} sharp, concrete AU adaptation question(s) in ${langSpec.shortLabel} for the user BEFORE rewriting the card.`,
        `Focus specifically on:`,
        `1) How to convert setting-locked elements from the original card (e.g., royal titles, magic/powers, fantasy factions/druids/orders, medieval weapons/armor, past wars) into 100% authentic equivalents of "${targetEra}" with zero anachronisms;`,
        `2) Exact social status, occupation, and power base of { {char} } in "${targetEra}";`,
        `3) Who { {user} } is to { {char} } in this new world and what sparks their opening encounter.`,
        macroRule,
    ].join('\n');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`${sysCore}\n${withChoices ? 'Provide 3 vivid, setting-accurate option suggestions per question.' : 'Keep options empty [].'}\nOutput ONLY valid JSON: {"questions":[{"question":"","options":[]}]}`),
            user: `${intakeSummary}\n\n${srcExcerpt}${existingList}`,
            jsonSchema: BLITZ_QUESTIONS_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // MULTIVERSE AU ADAPTATION QUIZ]`,
            sysCore,
            withChoices ? `For each question, provide 3 vivid, era-authentic suggested options separated by " | ".` : `Do NOT add multiple-choice options.`,
            ``,
            intakeSummary,
            ``,
            srcExcerpt + existingList,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `Wrap each question in [[NMF_Q]]...[[/NMF_Q]]:`,
            `[[NMF_Q]]`,
            `[[NMF_Q_TEXT]]Question text[[/NMF_Q_TEXT]]`,
            withChoices ? `[[NMF_Q_OPTS]]Option 1 | Option 2 | Option 3[[/NMF_Q_OPTS]]` : ``,
            `[[/NMF_Q]]`,
        ].filter(Boolean).join('\n')),
        jsonSchema: null,
    };
}

export function buildReworkCardRequest(session, sourceCard, mode = 'prefill_user_msg') {
    const rw = session.rework;
    const isAuPreserve = rw.reworkMode === 'au_shift';
    const targetEra = rw.targetSettingEra || session.intake.settingEra || 'Alternate Universe';
    const descWords = resolveWordTarget(session.intake);
    const greetWords = resolveGreetingTarget(session.intake);
    const intakeSummary = summarizeIntakeBlock(session, { modeContext: 'rework' });
    const langSpec = resolveOutputLanguageSpec(session.intake);
    const macroRule = buildUniversalMacroRule(session.intake.playerNameMode || 'macro');
    const greetStyleBlock = buildGreetingStyleDirective(session.intake);

    const answeredAuDecisions = Array.isArray(rw.questions)
        ? rw.questions
            .map((q, idx) => {
                const dec = formatQuestionUserDecision(q);
                return dec ? `Q${idx + 1}: ${q.question}\nUser Decision: ${dec}` : '';
            })
            .filter(Boolean)
            .join('\n\n')
        : '';

    const userAuDecisionsBlock = answeredAuDecisions
        ? `\n[USER AU ADAPTATION ANSWERS — MANDATORY CANON FOR THIS REWORK]\n${shieldMacrosForPrompt(answeredAuDecisions)}\n`
        : '';

    const zeroAnachronismLaw = [
        `- ZERO ANACHRONISMS & TOTAL WORLD TRANSLATION LAW (STRICTLY MANDATORY):`,
        `  Do NOT leave leftover props, titles, factions, races/classes, magic systems, creatures, currencies, or weapons from the old universe inside "${targetEra}" unless "${targetEra}" explicitly includes them!`,
        `  Every single old-world concept MUST be deeply and organically translated into an authentic, grounded equivalent of "${targetEra}":`,
        `  * Old titles & courts (e.g. king, lord, council of druids, knightly order) -> authentic "${targetEra}" power structures (e.g. crime syndicate boss, consigliere & capos, corporate board, cartel, military command).`,
        `  * Old weapons & gear (e.g. battle-axes, broadswords, plate armor, runes, potions) -> authentic "${targetEra}" weapons, attire, and status symbols (e.g. tailored three-piece coat, custom engraved firearm/switchblade, heavy signet ring, luxury car).`,
        `  * Supernatural abilities/curses (if moving to a non-magical setting) -> psychological dominance, lethal combat skill, underworld influence, political leverage, or obsessive reputation.`,
        `  * Past battles, locations, and biography -> rewritten so 100% of { {char} }'s history natively happened inside "${targetEra}".`,
    ].join('\n');

    const auDirective = isAuPreserve
        ? [
            `MODE: "MEET IN ANOTHER UNIVERSE" — COMPLETE WORLD TRANSPLANT WITH AUTHORIAL STRUCTURE PRESERVATION.`,
            `- PILLAR 1 (KEEP FORMATTING & PSYCHOLOGICAL SOUL): Preserve the original author's structural layout (section headings, XML/brackets/lists, prose rhythm) AND { {char} }'s core temperament, charisma, flaws, habits, and speech mannerisms.`,
            zeroAnachronismLaw,
            `- PILLAR 3 (OPENING SCENE): Write a brand-new First Message (~${greetWords} words) fully grounded in "${targetEra}"${rw.encounterIdea ? ` using this encounter premise: "${rw.encounterIdea}"` : ''}${rw.moodTone ? ` with mood/tone: "${rw.moodTone}"` : ''}, matching { {char} }'s authentic voice.`,
        ].join('\n')
        : [
            `MODE: FULL AU REWORK & STRUCTURAL REBUILD INTO "${targetEra}".`,
            `- Rebuild the character from the ground up using the chosen NexusMatch Format (${session.intake.cardFormat}), target length (~${descWords} words), and User Intake preferences while keeping { {char} }'s recognizable personality core.`,
            zeroAnachronismLaw,
            `- Write a vivid brand-new First Message (~${greetWords} words) set in "${targetEra}"${rw.encounterIdea ? ` using premise: "${rw.encounterIdea}"` : ''}${rw.moodTone ? ` with mood/tone: "${rw.moodTone}"` : ''}.`,
        ].join('\n');

    const srcDump = shieldMacrosForPrompt([
        `[SOURCE CARD TO TRANSPLANT INTO "${targetEra}"]`,
        `Name: ${sourceCard.name || ''}`,
        `Description:\n${sourceCard.description || ''}`,
        sourceCard.personality ? `Personality:\n${sourceCard.personality}` : '',
        sourceCard.scenario ? `Scenario:\n${sourceCard.scenario}` : '',
        sourceCard.first_mes ? `Original First Message (for voice & formatting structure reference ONLY — replace all old-world lore!):\n${sourceCard.first_mes}` : '',
        sourceCard.mes_example ? `Example Dialogue (adapt any old-world terms to "${targetEra}"):\n${sourceCard.mes_example}` : '',
    ].filter(Boolean).join('\n\n'));

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`You are NexusMatch Multiverse Adapter.\n${auDirective}\n${macroRule}\n${greetStyleBlock}\n${CARD_META_PURITY_RULE}\nOutput ONLY valid JSON: {"name":"","description":"","personality":"","scenario":"","first_mes":"","alternate_greetings":[""],"mes_example":"","system_prompt":"","post_history_instructions":"","creator_notes":"","tags":["AU"],"image_prompt":""}`),
            user: `${intakeSummary}${userAuDecisionsBlock}\n\n${srcDump}`,
            jsonSchema: FULL_CARD_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // MULTIVERSE & REWORK TASK]`,
            auDirective,
            macroRule,
            greetStyleBlock,
            CARD_META_PURITY_RULE,
            `Target Output Language: ${langSpec.directive}.`,
            ``,
            intakeSummary,
            userAuDecisionsBlock,
            srcDump,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT — MANDATORY]`,
            `[[NMF_NAME]]Name[[/NMF_NAME]]`,
            `[[NMF_DESC]]Adapted Description (100% native to ${targetEra}, zero old-world anachronisms)[[/NMF_DESC]]`,
            `[[NMF_PERSONALITY]]Adapted Personality[[/NMF_PERSONALITY]]`,
            `[[NMF_SCENARIO]]Adapted Scenario in ${targetEra}[[/NMF_SCENARIO]]`,
            `[[NMF_FIRST_MES]]New Opening Scene[[/NMF_FIRST_MES]]`,
            `[[NMF_ALT_GREETING]]Optional second opening hook[[/NMF_ALT_GREETING]]`,
            `[[NMF_MES_EXAMPLE]]Adapted example dialogue[[/NMF_MES_EXAMPLE]]`,
            `[[NMF_SYS_PROMPT]][[/NMF_SYS_PROMPT]]`,
            `[[NMF_POST_HISTORY]][[/NMF_POST_HISTORY]]`,
            `[[NMF_CREATOR_NOTES]]AU / Rework notes[[/NMF_CREATOR_NOTES]]`,
            `[[NMF_TAGS]]comma-separated tags[[/NMF_TAGS]]`,
            `[[NMF_IMG_PROMPT]]English visual prompt of character dressed & set authentically in ${targetEra}[[/NMF_IMG_PROMPT]]`,
        ].join('\n')),
        jsonSchema: null,
    };
}

// ============================================================================
// GACHA SUMMON BANNER (3-10 '+' TAGS, 10-PULL CYCLE) & ALCHEMY CARD FUSION
// ============================================================================

export function parseGachaPlusTags(rawInput) {
    const raw = String(rawInput ?? '').trim();
    if (!raw) return [];
    const splitter = raw.includes('+') ? /\+/g : /[,;\n]+/g;
    return raw
        .split(splitter)
        .map((s) => s.replace(/^[+\s]+|[+\s]+$/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 10);
}

export function buildVisualPromptRefinementRequest(entity, userHint = '', intake = {}, mode = 'prefill_user_msg') {
    const artMechRule = buildFlexibleAvatarArtMechanismRule(intake);
    const name = String(entity?.name || 'Character').trim();
    const looks = String(entity?.appearance || entity?.description || '').slice(0, 1800).trim();
    const prevPrompt = String(entity?.imagePrompt || '').trim();
    const hint = String(userHint || '').trim();

    const core = [
        'You are NexusMatch Visual Prompt Director.',
        'Rewrite and upgrade the English visual portrait prompt strictly following the <ART_MECHANISM> specification below (SCENE -> CHARACTERS IN THE IMAGE -> FIGURE / INTERACTION / OBJECT).',
        'Do NOT invent rendering styles on your own — only include style words if the user explicitly wrote them in their direction; otherwise let SillyImages control the style.',
        'Output ONLY the pure English visual prompt inside [[NMF_IMG_PROMPT]]...[[/NMF_IMG_PROMPT]] (or JSON {"image_prompt":"..."} if JSON mode).',
        artMechRule,
    ].join('\n');

    const userBody = [
        `Subject Name: ${name}`,
        looks ? `Established Appearance / Bio:\n${looks}` : '',
        prevPrompt ? `Previous Visual Prompt:\n${prevPrompt}` : '',
        hint
            ? `MANDATORY USER REFINEMENT / NEW VISUAL DIRECTION (incorporate 100% accurately):\n${hint}`
            : 'Create a fresh, striking, well-framed portrait composition faithful to the character appearance.',
    ].filter(Boolean).join('\n\n');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(core + '\nOutput ONLY valid JSON: {"image_prompt":"SCENE: ..."}'),
            user: shieldMacrosForPrompt(userBody),
            jsonSchema: {
                name: 'nmf_visual_prompt',
                strict: true,
                value: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['image_prompt'],
                    properties: { image_prompt: { type: 'string' } },
                },
            },
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            '[NEXUSMATCH FORGE // VISUAL PROMPT REFINEMENT]',
            core,
            '',
            userBody,
            '',
            'Output strictly wrapped in:',
            '[[NMF_IMG_PROMPT]]SCENE: ...[[/NMF_IMG_PROMPT]]',
        ].join('\n')),
        jsonSchema: null,
    };
}

export function parseVisualPromptRefinementResponse(raw) {
    const text = stripReasoning(raw);
    const tagged = extractTagBlock(text, 'NMF_IMG_PROMPT');
    if (tagged) return tagged.trim();
    try {
        const obj = extractJsonLoose(raw, (v) => v && typeof v === 'object' && typeof (v.image_prompt || v.imagePrompt) === 'string');
        return String(obj.image_prompt || obj.imagePrompt || '').trim();
    } catch {
        const cleaned = text.replace(/^[`"'\s]+|[`"'\s]+$/g, '').trim();
        if (/SCENE\s*:/i.test(cleaned)) return cleaned;
        return cleaned;
    }
}

function cryptoRandomUnitFloat() {
    try {
        if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
            const arr = new Uint32Array(1);
            globalThis.crypto.getRandomValues(arr);
            return arr[0] / 4294967296;
        }
    } catch {}
    return Math.random();
}

export function rollGachaCycleRarities(
    pullCount = 1,
    currentCycleCount = 0,
    rngFn = cryptoRandomUnitFloat,
    { maxCycleLimit = GACHA_CYCLE_LIMIT, startPitySince4Plus = 0, luckMode = 'fair' } = {},
) {
    const cap = Math.max(3, Math.min(50, Math.round(Number(maxCycleLimit) || GACHA_CYCLE_LIMIT)));
    const count = Math.max(1, Math.min(5, Math.round(Number(pullCount) || 1)));
    let cycle = Math.max(0, Math.min(cap, Math.round(Number(currentCycleCount) || 0)));
    let pity4 = Math.max(0, Math.round(Number(startPitySince4Plus) || 0));
    const rarities = [];

    for (let i = 0; i < count; i++) {
        cycle += 1;
        pity4 += 1;
        const r = rngFn();
        let stars = 1;

        if (luckMode === 'jackpot') {
            stars = 5;
        } else if (luckMode === 'high') {
            if (r < 0.28 || pity4 >= 4) stars = r < 0.45 ? 5 : 4;
            else if (r < 0.82) stars = 4;
            else stars = 3;
        } else if (luckMode === 'soft') {
            if (pity4 >= 6) {
                stars = r < 0.30 ? 5 : 4;
            } else if (r < 0.085) {
                stars = 5;
            } else if (r < 0.32) {
                stars = 4;
            } else if (r < 0.70) {
                stars = 3;
            } else if (r < 0.92) {
                stars = 2;
            } else {
                stars = 1;
            }
        } else if (pity4 >= 10) {
            stars = r < 0.18 ? 5 : 4;
        } else if (r < 0.025) {
            stars = 5;
        } else if (r < 0.12) {
            stars = 4;
        } else if (r < 0.32) {
            stars = 3;
        } else if (r < 0.62) {
            stars = 2;
        } else {
            stars = 1;
        }

        if (stars >= 4) pity4 = 0;
        rarities.push(stars);
    }

    return {
        rarities,
        nextCycleCount: Math.min(cap, cycle),
        nextPitySince4Plus: pity4,
        hitCycleCap: cycle >= cap,
    };
}

export function rollSacrificeOutcome({
    sacrificeFailEnabled = false,
    sacrificeFailChance = 25,
    rngFn = cryptoRandomUnitFloat,
} = {}) {
    if (!sacrificeFailEnabled) {
        return { failed: false, chancePct: 0, rollPct: 100 };
    }
    const chancePct = Math.max(5, Math.min(90, Math.round(Number(sacrificeFailChance) || 25)));
    const raw = Math.max(0, Math.min(0.999999, Number(rngFn()) || 0));
    const rollPct = raw * 100;
    return {
        failed: rollPct < chancePct,
        chancePct,
        rollPct: Number(rollPct.toFixed(1)),
    };
}

export function computeSacrificeWishGain(stars = 1) {
    const st = Math.round(Number(stars) || 1);
    return Math.max(1, Math.min(5, st));
}

// Backwards-compatible alias
export const computeSacrificeResetGain = computeSacrificeWishGain;

export function syncGachaWalletState(
    wallet,
    { maxCap = GACHA_CYCLE_LIMIT, timerEnabled = true, nowMs = Date.now() } = {},
) {
    const cap = Math.max(3, Math.min(50, Math.round(Number(maxCap) || GACHA_CYCLE_LIMIT)));
    if (!wallet || typeof wallet !== 'object') {
        return { coolingDown: false, leftMs: 0, maxCap: cap, freeWishesLeft: cap, bonusWishes: 0, totalWishes: cap, changed: false };
    }
    let changed = false;
    const endsAt = Number(wallet.cooldownEndsAt) || 0;
    if (endsAt > 0 && nowMs >= endsAt) {
        wallet.cooldownEndsAt = 0;
        wallet.freeSpentInCycle = 0;
        wallet.updatedAt = nowMs;
        changed = true;
    }
    const spent = Math.max(0, Math.min(cap, Math.round(Number(wallet.freeSpentInCycle) || 0)));
    const freeCooling = timerEnabled !== false && endsAt > nowMs;
    const freeWishesLeft = timerEnabled === false
        ? cap
        : (freeCooling ? 0 : Math.max(0, cap - spent));
    const bonusWishes = Math.max(0, Math.round(Number(wallet.bonusWishes) || 0));
    const totalWishes = freeWishesLeft + bonusWishes;
    return {
        coolingDown: freeCooling,
        leftMs: freeCooling ? Math.max(0, endsAt - nowMs) : 0,
        maxCap: cap,
        freeWishesLeft,
        bonusWishes,
        totalWishes,
        changed,
    };
}

export function spendGachaWalletWishes(
    wallet,
    requestedCount = 1,
    {
        maxCap = GACHA_CYCLE_LIMIT,
        timerEnabled = true,
        cooldownMinutes = DEFAULT_GACHA_COOLDOWN_MINUTES,
        nowMs = Date.now(),
    } = {},
) {
    const status = syncGachaWalletState(wallet, { maxCap, timerEnabled, nowMs });
    const want = Math.max(1, Math.min(5, Math.round(Number(requestedCount) || 1)));
    const actualCount = timerEnabled === false ? want : Math.min(want, status.totalWishes);
    if (actualCount <= 0) {
        return { spentTotal: 0, spentFree: 0, spentBonus: 0, startedCooldown: false };
    }
    if (timerEnabled === false) {
        wallet.updatedAt = nowMs;
        return { spentTotal: actualCount, spentFree: actualCount, spentBonus: 0, startedCooldown: false };
    }

    const useFree = Math.min(actualCount, status.freeWishesLeft);
    const useBonus = actualCount - useFree;
    wallet.freeSpentInCycle = Math.min(status.maxCap, Math.max(0, Math.round(Number(wallet.freeSpentInCycle) || 0)) + useFree);
    wallet.bonusWishes = Math.max(0, status.bonusWishes - useBonus);

    let startedCooldown = false;
    if (wallet.freeSpentInCycle >= status.maxCap && (!wallet.cooldownEndsAt || wallet.cooldownEndsAt <= nowMs)) {
        const cdMin = Math.max(5, Math.min(1440, Math.round(Number(cooldownMinutes) || DEFAULT_GACHA_COOLDOWN_MINUTES)));
        wallet.cooldownEndsAt = nowMs + cdMin * 60 * 1000;
        startedCooldown = true;
    }
    wallet.updatedAt = nowMs;
    return { spentTotal: actualCount, spentFree: useFree, spentBonus: useBonus, startedCooldown };
}

export function collectSessionKnownCharacterNames(session, savedVault = [], currentPlusTags = []) {
    const rawNames = [];
    const pushName = (n) => {
        const full = String(n || '').trim();
        if (!full || full === 'Кандидат' || full === 'Незнакомец') return;
        const base = full.split(',')[0].split('—')[0].trim();
        if (base && base.length >= 2) rawNames.push(base);
    };

    for (const c of (session?.tinder?.liked || [])) pushName(c?.name);
    for (const c of (session?.tinder?.queue || [])) pushName(c?.name);
    for (const g of (session?.gacha?.collection || [])) pushName(g?.name);
    for (const n of (session?.gacha?.recentNamesPool || [])) pushName(n);
    if (session?.cardSlots && typeof session.cardSlots === 'object') {
        for (const sl of Object.values(session.cardSlots)) pushName(sl?.name);
    }
    for (const v of (Array.isArray(savedVault) ? savedVault : [])) pushName(v?.name);

    const lowerFormula = (Array.isArray(currentPlusTags) ? currentPlusTags : []).join(' ').toLowerCase();
    const seen = new Set();
    const out = [];
    for (const nm of rawNames) {
        const low = nm.toLowerCase();
        if (seen.has(low)) continue;
        // Allow summoning if user explicitly wrote this exact character name inside their "+" tags
        if (lowerFormula && lowerFormula.includes(low)) continue;
        seen.add(low);
        out.push(nm);
        if (out.length >= 30) break;
    }
    return out;
}

function isValidGachaDropsShape(val) {
    const arr = Array.isArray(val) ? val : (val && typeof val === 'object' ? (val.drops || val.candidates) : null);
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((c) => c && typeof c === 'object' && !Array.isArray(c) && typeof c.name === 'string' && c.name.trim());
}

export function buildGachaSummonRequest(session, plusTags = [], rarities = [3], mode = 'prefill_user_msg', { savedVault = [] } = {}) {
    const intakeSummary = summarizeGachaWishPrefsBlock(session);
    const pMode = session.intake.playerNameMode || 'macro';
    const previewLangSpec = resolveUserLanguageSpec(session.intake);
    const gachaOrigin = mapGachaTargetToOriginType(session.gacha?.wishPrefs?.targetType);
    const artMechRule = buildFlexibleAvatarArtMechanismRule({ ...session.intake, originType: gachaOrigin });
    const macroRule = buildUniversalMacroRule(pMode);
    const cleanTags = (Array.isArray(plusTags) ? plusTags : parseGachaPlusTags(plusTags)).slice(0, 10);
    const count = Math.max(1, rarities.length);
    const formulaStr = cleanTags.join(' + ');

    const forbiddenNames = collectSessionKnownCharacterNames(session, savedVault, cleanTags);
    const antiRepeatLine = forbiddenNames.length > 0
        ? `STRICT ANTI-CLONE & ZERO-DUPLICATE LAW: NEVER summon, rename-clone, or output any of these characters who ALREADY exist in the user's roster/session: [${forbiddenNames.join(', ')}]. Every summoned drop MUST be a 100% distinct, brand-new individual governed strictly by the current "+" tags!`
        : '';

    const slotDirectives = rarities.map((stars, idx) => {
        if (stars >= 5) {
            return `- Drop #${idx + 1} [EXTERNAL ROLL: 5/5 — APEX / HYPER-OP SCALE]: Keep 100% of the user's requested role and exact visual appearance from the tags, and scale their reach, wealth, authority, and capabilities to the absolute supreme pinnacle (e.g. if "mafia boss" -> untouchable global syndicate emperor owning ports, banks, and politicians; if "mage" -> legendary archmage-sovereign).`;
        }
        if (stars === 4) {
            return `- Drop #${idx + 1} [EXTERNAL ROLL: 4/5 — HIGH ELITE SCALE]: Keep 100% of the user's requested role and appearance, giving them major city-wide or regional dominance, serious luxury wealth, elite subordinates, and formidable power.`;
        }
        if (stars === 3) {
            return `- Drop #${idx + 1} [EXTERNAL ROLL: 3/5 — SOLID ESTABLISHED SCALE]: Keep 100% of the user's requested role and appearance at a respected, financially comfortable district/mid-tier scale with steady income, loyal crew, and solid reputation.`;
        }
        if (stars === 2) {
            return `- Drop #${idx + 1} [EXTERNAL ROLL: 2/5 — LOCAL / SMALL-SCALE]: Keep 100% of the user's requested role and exact requested appearance, but scale their territory, resources, and finances to a modest local neighborhood level (e.g. if "mafia boss" -> leader of a small dockside crew holding two blocks on a tight budget).`;
        }
        return `- Drop #${idx + 1} [EXTERNAL ROLL: 1/5 — TINY / UNDERDOG SCALE]: Keep 100% of the user's requested role and exact requested appearance (NEVER downgrade their appearance or strip their requested title!), but make the scale of their domain, money, and resources tiny and scrappy (e.g. if "mafia boss" -> boss of a scrappy back-alley street gang of 4 people operating out of a cramped basement with empty pockets and big ambition).`;
    }).join('\n');

    const coreRules = [
        `You are NexusMatch Astral Summoner. Synthesize ${count} distinct, original card concept(s) forged directly from EVERY tag in this summon formula: [${formulaStr}].`,
        `Every single "+" tag in the formula MUST fuse organically into the identity, appearance, atmosphere, and story hook.`,
        `Preview Display Language (for name, epithet, archetype, pitch, looks, quote, tags — read by the user): ${previewLangSpec.directive}.`,
        CARD_META_PURITY_RULE,
        antiRepeatLine,
        slotDirectives,
        macroRule,
        artMechRule,
    ].filter(Boolean).join('\n');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`${coreRules}\nOutput ONLY valid JSON: {"drops":[{"name":"","epithet":"","archetype":"","pitch":"","appearance":"","quote":"","tags":["t1","t2","t3","t4"],"image_prompt":""}]}`),
            user: `${intakeSummary}\n\n[SUMMON TAG FORMULA]\n${shieldMacrosForPrompt(formulaStr)}`,
            jsonSchema: GACHA_SUMMON_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // ASTRAL SUMMON WISH]`,
            coreRules,
            ``,
            intakeSummary,
            ``,
            `[SUMMON TAG FORMULA]`,
            formulaStr,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `For EACH summoned drop (${count} total), output a [[NMF_DROP]]...[[/NMF_DROP]] block:`,
            `[[NMF_DROP]]`,
            `[[NMF_D_NAME]]Name, Age (or Title)[[/NMF_D_NAME]]`,
            `[[NMF_D_EPITHET]]Poetic 2-4 word title / epithet (NO stars or rarity labels!)[[/NMF_D_EPITHET]]`,
            `[[NMF_D_ARCHETYPE]]Role, occupation & core vibe[[/NMF_D_ARCHETYPE]]`,
            `[[NMF_D_PITCH]]3 vivid sentences: personality paradox, backstory hook, and dynamic with { {user} }[[/NMF_D_PITCH]]`,
            `[[NMF_D_LOOKS]]Striking physical appearance, expression, attire, and signature detail[[/NMF_D_LOOKS]]`,
            `[[NMF_D_QUOTE]]Memorable in-character opening voice line[[/NMF_D_QUOTE]]`,
            `[[NMF_D_TAGS]]tag1, tag2, tag3, tag4, tag5[[/NMF_D_TAGS]]`,
            `[[NMF_D_IMG]]SCENE: ... CHARACTERS IN THE IMAGE: ... FIGURE / OBJECT ...[[/NMF_D_IMG]]`,
            `[[/NMF_DROP]]`,
        ].join('\n')),
        jsonSchema: null,
    };
}

export function parseGachaSummonResponse(raw, rarities = [3], plusTags = [], playerNameMode = 'macro') {
    const text = stripReasoning(raw);
    const safeTags = Array.isArray(plusTags) ? plusTags.map(String).filter(Boolean).slice(0, 10) : [];
    const rarityCodeMap = { 1: 'C', 2: 'UC', 3: 'R', 4: 'SR', 5: 'SSR' };

    const buildEntry = (rawObj, idx) => {
        const rawStarVal = Math.round(Number(rarities[idx] ?? rarities[0] ?? 3));
        const stars = Math.max(1, Math.min(5, Number.isFinite(rawStarVal) ? rawStarVal : 3));
        const name = sanitizeCardMetaPollution(rawObj.name || 'Незнакомец') || 'Незнакомец';
        const rawTagStr = Array.isArray(rawObj.tags) ? rawObj.tags.join(', ') : String(rawObj.tags || '');
        const cleanedTags = sanitizeCardMetaPollution(rawTagStr, { isTags: true })
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        return normalizeGachaCardEntry({
            id: `gacha_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}_${idx}`,
            name,
            epithet: normalizeCardMacros(sanitizeCardMetaPollution(rawObj.epithet || ''), name, playerNameMode),
            stars,
            rarity: rarityCodeMap[stars] || 'R',
            archetype: normalizeCardMacros(sanitizeCardMetaPollution(rawObj.archetype || ''), name, playerNameMode),
            pitch: normalizeCardMacros(sanitizeCardMetaPollution(rawObj.pitch || ''), name, playerNameMode),
            appearance: normalizeCardMacros(sanitizeCardMetaPollution(rawObj.appearance || ''), name, playerNameMode),
            quote: normalizeCardMacros(sanitizeCardMetaPollution(rawObj.quote || ''), name, playerNameMode),
            tags: cleanedTags,
            sourcePlusTags: safeTags,
            fusedFromNames: [],
            imagePrompt: String(rawObj.imagePrompt || rawObj.image_prompt || '').trim(),
            avatarId: '',
            avatarDataUrl: '',
            createdAt: Date.now(),
        }, idx);
    };

    if (typeof raw === 'string') {
        const blocks = [...text.matchAll(/\[\[NMF_DROP\]\]([\s\S]*?)\[\[\/NMF_DROP\]\]/gi)];
        if (blocks.length > 0) {
            return blocks.map((m, idx) => {
                const b = m[1];
                return buildEntry({
                    name: extractTagBlock(b, 'NMF_D_NAME'),
                    epithet: extractTagBlock(b, 'NMF_D_EPITHET'),
                    archetype: extractTagBlock(b, 'NMF_D_ARCHETYPE'),
                    pitch: extractTagBlock(b, 'NMF_D_PITCH'),
                    appearance: extractTagBlock(b, 'NMF_D_LOOKS'),
                    quote: extractTagBlock(b, 'NMF_D_QUOTE'),
                    tags: extractTagBlock(b, 'NMF_D_TAGS'),
                    imagePrompt: extractTagBlock(b, 'NMF_D_IMG'),
                }, idx);
            });
        }
    }

    const obj = extractJsonLoose(raw, isValidGachaDropsShape);
    const arr = Array.isArray(obj) ? obj : (obj.drops || obj.candidates || []);
    return arr.map((item, idx) => buildEntry(item, idx));
}

export function buildGachaFusionRequest(session, donorCards = [], fusionHint = '', mode = 'prefill_user_msg') {
    const intakeSummary = summarizeGachaWishPrefsBlock(session);
    const pMode = session.intake.playerNameMode || 'macro';
    const previewLangSpec = resolveUserLanguageSpec(session.intake);
    const gachaOrigin = mapGachaTargetToOriginType(session.gacha?.wishPrefs?.targetType);
    const artMechRule = buildFlexibleAvatarArtMechanismRule({ ...session.intake, originType: gachaOrigin });
    const macroRule = buildUniversalMacroRule(pMode);
    const safeHint = String(fusionHint || '').trim();

    const donorsText = donorCards.map((d, idx) => [
        `[DONOR SOUL #${idx + 1}: ${d.name}]`,
        d.epithet ? `Title: ${d.epithet}` : '',
        d.archetype ? `Archetype: ${d.archetype}` : '',
        d.pitch ? `Core Concept: ${d.pitch}` : '',
        d.appearance ? `Visual Aesthetics: ${d.appearance}` : '',
        Array.isArray(d.tags) && d.tags.length ? `Motifs: ${d.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n')).join('\n\n');

    const alchemyRules = [
        `You are NexusMatch Alchemy Crucible. Transmute the ${donorCards.length} Donor Souls below into ONE (1) completely brand-new, sovereign character written 100% from scratch.`,
        `- ZERO FRANKENSTEIN / ZERO COPY-PASTE LAW: Do NOT concatenate donor names, do NOT copy donor sentences, and do NOT make a "split personality of Donor A + Donor B".`,
        `- TRUE ALCHEMICAL SYNTHESIS: Distill the deepest thematic tension, aesthetic DNA, emotional magnetism, and contrasting traits of the donors, then birth an entirely new person with a fresh Name, coherent biography, unified appearance, and magnetic dynamic with { {user} }.`,
        safeHint ? `- User's Alchemical Direction: ${safeHint}` : '',
        `Preview Display Language (read by the user): ${previewLangSpec.directive}.`,
        CARD_META_PURITY_RULE,
        macroRule,
        artMechRule,
    ].filter(Boolean).join('\n');

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`${alchemyRules}\nOutput ONLY valid JSON with exactly 1 item in drops: {"drops":[{"name":"","epithet":"","archetype":"","pitch":"","appearance":"","quote":"","tags":["t1","t2","t3","t4"],"image_prompt":""}]}`),
            user: `${intakeSummary}\n\n${shieldMacrosForPrompt(donorsText)}`,
            jsonSchema: GACHA_SUMMON_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // ALCHEMICAL SOUL SYNTHESIS]`,
            alchemyRules,
            ``,
            intakeSummary,
            ``,
            donorsText,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `Output exactly ONE [[NMF_DROP]]...[[/NMF_DROP]] block for the newly born character:`,
            `[[NMF_DROP]]`,
            `[[NMF_D_NAME]]Brand-New Character Name, Age[[/NMF_D_NAME]]`,
            `[[NMF_D_EPITHET]]Poetic 2-4 word title / epithet (NO stars or rarity labels!)[[/NMF_D_EPITHET]]`,
            `[[NMF_D_ARCHETYPE]]Unified role, occupation & core vibe[[/NMF_D_ARCHETYPE]]`,
            `[[NMF_D_PITCH]]3-4 vivid sentences written from scratch: personality, new origin, and chemistry with { {user} }[[/NMF_D_PITCH]]`,
            `[[NMF_D_LOOKS]]Cohesive, newly synthesized physical appearance, attire, and signature detail[[/NMF_D_LOOKS]]`,
            `[[NMF_D_QUOTE]]Memorable first-impression voice line[[/NMF_D_QUOTE]]`,
            `[[NMF_D_TAGS]]tag1, tag2, tag3, tag4, tag5[[/NMF_D_TAGS]]`,
            `[[NMF_D_IMG]]SCENE: ... CHARACTERS IN THE IMAGE: ... FIGURE ...[[/NMF_D_IMG]]`,
            `[[/NMF_DROP]]`,
        ].join('\n')),
        jsonSchema: null,
    };
}

export function parseGachaFusionResponse(raw, donorCards = [], playerNameMode = 'macro') {
    const avgDonorStars = donorCards.length
        ? Math.min(5, Math.max(3, Math.round(donorCards.reduce((acc, d) => acc + (Number(d?.stars) || 3), 0) / donorCards.length) + 1))
        : 4;
    const parsed = parseGachaSummonResponse(raw, [avgDonorStars], [], playerNameMode);
    const first = parsed[0];
    if (!first) {
        throw new Error('Не удалось распознать результат Алхимического Слияния.');
    }
    first.fusedFromNames = donorCards.map((d) => String(d?.name || '').split(',')[0].trim()).filter(Boolean).slice(0, 4);
    return first;
}

export const CARD_TRANSLATION_JSON_SCHEMA = Object.freeze({
    name: 'nmf_card_translation',
    description: 'Faithful literary translation of a SillyTavern V2 Character Card',
    strict: true,
    returnInvalid: true,
    value: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'personality', 'scenario', 'first_mes', 'alternate_greetings', 'mes_example', 'creator_notes'],
        properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            personality: { type: 'string' },
            scenario: { type: 'string' },
            first_mes: { type: 'string' },
            alternate_greetings: { type: 'array', items: { type: 'string' } },
            mes_example: { type: 'string' },
            creator_notes: { type: 'string' },
        },
    },
});

export function buildCardTranslationRequest(card, targetLangLabel = 'Русский', mode = 'prefill_user_msg') {
    const targetLang = stripAccidentalLanguageBraces(targetLangLabel) || detectUserLocaleLanguage();
    const altDump = Array.isArray(card.alternate_greetings)
        ? card.alternate_greetings.map((g, idx) => `--- ALT #${idx + 1} ---\n${g}`).join('\n\n')
        : '';

    const coreRules = [
        `You are an elite literary & roleplay translator for SillyTavern Character Card V2.`,
        `Translate all provided card fields faithfully and artistically into ${targetLang}.`,
        `- Preserve 100% of Markdown headings, XML tags, bullet lists, dialogue formatting, and SillyTavern macros ({ {char} }, { {user} }, <START>).`,
        `- Do NOT summarize, censor, or omit details — translate every paragraph completely.`,
        CARD_META_PURITY_RULE,
    ].join('\n');

    const sourceBlock = shieldMacrosForPrompt([
        `[SOURCE CARD TO TRANSLATE INTO ${targetLang}]`,
        `Name: ${card.name || ''}`,
        `Description:\n${card.description || ''}`,
        card.personality ? `Personality:\n${card.personality}` : '',
        card.scenario ? `Scenario:\n${card.scenario}` : '',
        card.first_mes ? `First Message:\n${card.first_mes}` : '',
        altDump ? `Alternate Greetings:\n${altDump}` : '',
        card.mes_example ? `Example Dialogue:\n${card.mes_example}` : '',
        card.creator_notes ? `Creator Notes:\n${card.creator_notes}` : '',
    ].filter(Boolean).join('\n\n'));

    if (mode === 'json_schema') {
        return {
            system: shieldMacrosForPrompt(`${coreRules}\nOutput ONLY valid JSON matching: {"name":"","description":"","personality":"","scenario":"","first_mes":"","alternate_greetings":[],"mes_example":"","creator_notes":""}`),
            user: sourceBlock,
            jsonSchema: CARD_TRANSLATION_JSON_SCHEMA,
        };
    }

    return {
        system: '',
        user: shieldMacrosForPrompt([
            `[NEXUSMATCH FORGE // CARD V2 TRANSLATION TASK -> ${targetLang}]`,
            coreRules,
            ``,
            sourceBlock,
            ``,
            `[STRICT INDEXED OUTPUT FORMAT]`,
            `[[NMF_NAME]]Translated or transliterated name[[/NMF_NAME]]`,
            `[[NMF_DESC]]Translated Description[[/NMF_DESC]]`,
            `[[NMF_PERSONALITY]]Translated Personality[[/NMF_PERSONALITY]]`,
            `[[NMF_SCENARIO]]Translated Scenario[[/NMF_SCENARIO]]`,
            `[[NMF_FIRST_MES]]Translated First Message[[/NMF_FIRST_MES]]`,
            `[[NMF_ALT_GREETING]]Translated Alternate Greeting (if multiple, separate with ===NMF_ALT_SEP===)[[/NMF_ALT_GREETING]]`,
            `[[NMF_MES_EXAMPLE]]Translated Example Dialogue[[/NMF_MES_EXAMPLE]]`,
            `[[NMF_CREATOR_NOTES]]Translated Creator Notes[[/NMF_CREATOR_NOTES]]`,
        ].join('\n')),
        jsonSchema: null,
    };
}

export function parseCardTranslationResponse(raw, sourceCard = {}, targetLangLabel = '', playerNameMode = 'macro') {
    const text = stripReasoning(raw);
    let out = null;
    if (typeof raw === 'string' && (text.includes('[[NMF_DESC]]') || text.includes('[[NMF_FIRST_MES]]'))) {
        const altRaw = extractTagBlock(text, 'NMF_ALT_GREETING');
        const alts = altRaw
            ? altRaw.split(/===NMF_ALT_SEP===/i).map((s) => s.trim()).filter(Boolean)
            : [];
        out = {
            name: extractTagBlock(text, 'NMF_NAME') || sourceCard.name || '',
            description: extractTagBlock(text, 'NMF_DESC'),
            personality: extractTagBlock(text, 'NMF_PERSONALITY'),
            scenario: extractTagBlock(text, 'NMF_SCENARIO'),
            first_mes: extractTagBlock(text, 'NMF_FIRST_MES'),
            alternate_greetings: alts,
            mes_example: extractTagBlock(text, 'NMF_MES_EXAMPLE'),
            creator_notes: extractTagBlock(text, 'NMF_CREATOR_NOTES'),
        };
    } else {
        const obj = extractJsonLoose(raw, (v) => v && typeof v === 'object' && !Array.isArray(v));
        out = {
            name: String(obj.name || sourceCard.name || '').trim(),
            description: String(obj.description || '').trim(),
            personality: String(obj.personality || '').trim(),
            scenario: String(obj.scenario || '').trim(),
            first_mes: String(obj.first_mes || '').trim(),
            alternate_greetings: Array.isArray(obj.alternate_greetings) ? obj.alternate_greetings.map(String).filter(Boolean) : [],
            mes_example: String(obj.mes_example || '').trim(),
            creator_notes: String(obj.creator_notes || '').trim(),
        };
    }

    const chName = sanitizeCardMetaPollution(out.name) || sourceCard.name || '';
    return {
        lang: stripAccidentalLanguageBraces(targetLangLabel) || detectUserLocaleLanguage(),
        name: chName,
        description: sanitizeCardMetaPollution(normalizeCardMacros(out.description, chName, playerNameMode)),
        personality: sanitizeCardMetaPollution(normalizeCardMacros(out.personality, chName, playerNameMode)),
        scenario: sanitizeCardMetaPollution(normalizeCardMacros(out.scenario, chName, playerNameMode)),
        first_mes: sanitizeCardMetaPollution(normalizeCardMacros(out.first_mes, chName, playerNameMode)),
        alternate_greetings: out.alternate_greetings.map((g) => sanitizeCardMetaPollution(normalizeCardMacros(g, chName, playerNameMode))),
        mes_example: sanitizeCardMetaPollution(normalizeCardMacros(out.mes_example, chName, playerNameMode)),
        creator_notes: sanitizeCardMetaPollution(normalizeCardMacros(out.creator_notes, chName, playerNameMode)),
        updatedAt: Date.now(),
    };
}

/**
 * Builds a pure, game-telemetry-free character brief from a Swipe Match or Gacha Collection item
 * so stars, rarity, match %, and word counters NEVER leak into SillyTavern Character Card V2 fields.
 */
export function buildCleanBriefFromEntity(entity) {
    if (!entity || typeof entity !== 'object') return '';
    const cleanTags = sanitizeCardMetaPollution(
        Array.isArray(entity.tags) ? entity.tags.join(', ') : String(entity.tags || ''),
        { isTags: true },
    );
    return [
        `Chosen Character Concept:`,
        `Name: ${sanitizeCardMetaPollution(entity.name || '')}`,
        entity.epithet ? `Title / Epithet: ${sanitizeCardMetaPollution(entity.epithet)}` : '',
        entity.archetype ? `Archetype & Role: ${sanitizeCardMetaPollution(entity.archetype)}` : '',
        entity.pitch ? `Core Bio & Chemistry Hook: ${sanitizeCardMetaPollution(entity.pitch)}` : '',
        entity.appearance ? `Appearance: ${sanitizeCardMetaPollution(entity.appearance)}` : '',
        entity.quote ? `Signature Voice Quote: "${sanitizeCardMetaPollution(entity.quote)}"` : '',
        cleanTags ? `Thematic Tags: ${cleanTags}` : '',
        entity.imagePrompt ? `Visual Portrait Direction: ${entity.imagePrompt}` : '',
    ].filter(Boolean).join('\n');
}
