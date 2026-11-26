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
        id: "close_bonds",
        category: "vibe",
        ru: ["старший брат","младший брат","сводный брат","лучший друг брата","старшая сестра","сводная сестра","друг детства","подруга детства","сосед по комнате","сосед по квартире","сосед напротив","живут под одной крышей","опекун","приёмный отец","наставник","учитель и ученик","телохранитель","верный защитник","бывший возлюбленный","бывший муж","бывшая девушка","первая любовь","давний знакомый","напарник","боевой товарищ","коллега по работе","начальник и подчинённый","семейная тайна","гиперопека","кровное родство","названый брат","должник семьи","наследник клана","друг семьи","жених по договору","невеста по расчёту","давняя клятва","сосед по парте","однокурсник","враг детства","тайный покровитель","крёстный отец","личный водитель","личный секретарь","домашний врач"],
        en: ["older brother","younger brother","stepbrother","brother's best friend","older sister","stepsister","childhood friend","childhood female friend","roommate","flatmate","next-door neighbor","living under one roof","guardian","foster father","mentor","mentor & protege","bodyguard","loyal protector","ex-lover","ex-husband","ex-girlfriend","first love","old acquaintance","partner in crime","brother-in-arms","coworker","boss & subordinate","family secret","overprotective","blood tie","sworn brother","family debtor","clan heir","family friend","arranged fiance","arranged fiancee","childhood promise","desk neighbor","college classmate","childhood rival","secret benefactor","godfather","private driver","personal assistant","family doctor"],
    },
    {
        id: "power_roles",
        category: "vibe",
        ru: ["босс мафии","глава синдиката","генеральный директор","постарше","женщина постарше","богатый наследник","миллиардер","олигарх","медиамагнат","владелец казино","хозяин элитного клуба","политик в тени","серый кардинал","судья","прокурор","адвокат дьявола","владелец корпорации","глава клана якудза","консильери","коллекционер редкостей","владелец отеля","аукционист","банкир","дипломат","ректор академии","директор клиники","владелец галереи","кинопродюсер","главный редактор","шеф-повар мишлен","владелец конюшни","архитектор-перфекционист","модный дизайнер","инвестор","хозяин поместья","глава тайного ордена","куратор музея","владелец книжной лавки","хозяин антикварной лавки","винодел-аристократ"],
        en: ["mafia boss","syndicate leader","billionaire CEO","older man","older woman","wealthy heir","billionaire","tycoon","media mogul","casino owner","exclusive club owner","shadow politician","grey eminence","stern judge","sharp prosecutor","ruthless defense lawyer","corporate shark","yakuza patriarch","consigliere","rare art collector","luxury hotel owner","underground auctioneer","elite banker","cold diplomat","academy headmaster","clinic director","art gallery owner","film producer","chief editor","michelin chef","estate & stable owner","perfectionist architect","haute couture designer","venture investor","manor lord","secret order grandmaster","museum curator","bookshop owner","antique shop owner","vineyard aristocrat"],
    },
    {
        id: "crime_underworld",
        category: "vibe",
        ru: ["контрабандист","киллер","наёмный убийца","вор-джентльмен","медвежатник","мошенник с обаянием","карточный шулер","информатор","брокер теневого рынка","вышибала","коллектор долгов","главарь банды","байкер-бунтарь","подпольный боец","уличный гонщик","фальшивомонетчик","подпольный врач","чистильщик улик","хакер-взломщик","теневой фиксер","беглый преступник","агент под прикрытием","крот в мафии","торговец оружием","охотник за головами","пироман","грабитель банков","глава картеля","правая рука босса","теневой телохранитель","ночной сталкер","уличный король","владелец ломбарда","организатор подпольных боёв","похититель артефактов"],
        en: ["smuggler","hitman","contract assassin","gentleman thief","master safecracker","charming con artist","card shark","street informant","black market broker","club bouncer","debt collector","gang leader","outlaw biker","underground pit fighter","street racer","master forger","back-alley doctor","crime scene cleaner","black-hat hacker","underworld fixer","fugitive on the run","undercover agent","mole inside the syndicate","arms dealer","bounty hunter","reckless arsonist","heist mastermind","cartel boss","underboss right hand","syndicate enforcer","midnight stalker","king of the streets","shady pawnshop owner","fight club promoter","relic thief"],
    },
    {
        id: "professions_modern",
        category: "vibe",
        ru: ["частный детектив","следователь-криминалист","судмедэксперт","хирург","нейрохирург","психиатр","психотерапевт","врач скорой помощи","ветеринар","профессор","преподаватель литературы","учёный-физик","археолог","журналист-расследователь","фотограф","художник-портретист","тату-мастер","бармен","бариста","рок-музыкант","скрипач-виртуоз","пианист","оперный певец","актёр театра","айдол","автомеханик","пилот гражданской авиации","пожарный-спасатель","инструктор по боксу","тренер по фигурному катанию","хоккеист","гонщик формулы","библиотекарь","реставратор картин","флорист","ювелир","часовщик","программист-одиночка","телохранитель знаменитости","лесник-отшельник","капитан яхты","смотритель маяка","архивариус","криптограф","писатель детективов"],
        en: ["private detective","homicide detective","forensic pathologist","surgeon","neurosurgeon","psychiatrist","therapist","ER doctor","veterinarian","professor","literature professor","physicist","archaeologist","investigative journalist","photographer","portrait artist","tattoo artist","bartender","barista","rock musician","virtuoso violinist","classical pianist","opera singer","stage actor","pop idol","car mechanic","commercial pilot","firefighter","boxing coach","skating coach","ice hockey player","formula racer","librarian","art restorer","florist","master jeweler","watchmaker","reclusive programmer","celebrity bodyguard","forest ranger","yacht captain","lighthouse keeper","archivist","cryptographer","mystery novelist"],
    },
    {
        id: "military_combat",
        category: "vibe",
        ru: ["наёмник","капитан стражи","рыцарь-отступник","ветеран войны","снайпер","командир спецназа","офицер разведки","шпион","двойной агент","полководец","адмирал флота","инструктор-сержант","гладиатор","мастер меча","телохранитель императора","охотник на чудовищ","ведьмак-скиталец","командир наёмников","полевой медик","сапёр","пилот-истребитель","рыцарь без знамени","чемпион арены","стрелок-одиночка","страж границы","палач на службе","дуэлянт","командир гарнизона","воин-берсерк","защитник крепости","дезертир","военнопленный","тактик-стратег","командир диверсантов","тень короля"],
        en: ["mercenary","captain of the guard","fallen knight","war veteran","cold-blooded sniper","special forces commander","intelligence officer","master spy","double agent","ruthless general","fleet admiral","drill instructor","arena gladiator","swordmaster","imperial guard","monster hunter","wandering slayer","mercenary captain","combat medic","bomb disposal specialist","fighter pilot","hedge knight","arena champion","lone marksman","border warden","royal executioner","noble duelist","garrison commander","berserker warrior","fortress defender","military deserter","prisoner of war","master tactician","sabotage squad leader","king's shadow"],
    },
    {
        id: "royalty_nobility",
        category: "vibe",
        ru: ["наследный принц","мятежный принц","принцесса в бегах","холодный император","императрица","герцог севера","опальный герцог","граф-затворник","маркиз-интриган","бастард короля","тайный советник","регент при троне","придворный лекарь","придворный шут с тайной","королева-завоевательница","свергнутый монарх","посол чужой империи","аристократ-декадент","наследница древнего рода","хранитель короны","супруг по политическому браку","благородный изгнанник","лорд-канцлер","фаворит двора","глава тайной канцелярии","рыцарь-лорд","князь тьмы","владыка зимы","королевский заложник","самозванец на троне"],
        en: ["crown prince","rebel prince","runaway princess","cold emperor","empress","duke of the north","disgraced duke","reclusive count","scheming marquis","royal bastard","royal advisor","scheming regent","court physician","sharp-tongued court jester","conqueror queen","deposed monarch","foreign empire envoy","decadent aristocrat","ancient house heiress","keeper of the crown","political marriage spouse","noble exile","lord chancellor","court favorite","spymaster","knight lord","dark prince","winter sovereign","royal hostage","usurper on the throne"],
    },
    {
        id: "magic_fantasy_roles",
        category: "vibe",
        ru: ["инквизитор","архимаг","некромант","тёмный колдун","ведьма из чащи","алхимик","маг крови","прорицатель","охотник на ведьм","паладин-отступник","священник с грехами","экзорцист","друид-хранитель","шаман","бард-авантюрист","артефактор","призыватель духов","маг времени","иллюзионист","хранитель гримуара","целитель-отшельник","кузнец рун","астролог","маг огня","маг льда","теневой ассасин","жрец забытого бога","проклятый рыцарь","ученик чародея","ловец снов","ведьмин фамильяр","смотритель башни магов","контрабандист реликвий","мастер зелий","искатель приключений"],
        en: ["inquisitor","archmage","necromancer","dark warlock","forest witch","alchemist","blood mage","oracle seer","witch hunter","oathbreaker paladin","sinful priest","exorcist","forest druid","spirit shaman","rogue bard","arcane artificer","spirit summoner","chronomancer","illusionist","grimoire keeper","hermit healer","runesmith","court astrologer","pyromancer","cryomancer","shadow assassin","priest of a forgotten god","cursed knight","sorcerer apprentice","dreamweaver","witch familiar","mage tower keeper","relic smuggler","potion master","guild adventurer"],
    },
    {
        id: "supernatural_beings",
        category: "vibe",
        ru: ["древний вампир","вампир-аристократ","новообращённый вампир","оборотень-одиночка","альфа стаи","демон искушения","высший демон","падший ангел","ангел-хранитель","суровый серафим","фейри-трикстер","король фейри","дракон в человеческом облике","полукровка-демон","тёмный эльф","высший эльф","сирена","призрак особняка","жнец душ","дух-хранитель","кицунэ","божество в изгнании","древнее божество","бессмертный скиталец","полубог","проклятый зверь","горгулья-страж","живая кукла","дух леса","демон контракта","повелитель кошмаров","инкуб","суккуб","перевёртыш","нежить-рыцарь","хранитель загробья","тифлинг","морской бог","феникс","тень без тела"],
        en: ["ancient vampire","vampire aristocrat","fledgling vampire","lone werewolf","pack alpha","temptation demon","high demon","fallen angel","guardian angel","stern seraph","fae trickster","fae king","dragon in human form","half-demon","dark elf","high elf","deadly siren","manor ghost","grim reaper","guardian spirit","kitsune fox spirit","exiled deity","eldritch god","immortal wanderer","demigod","cursed beast","gargoyle guardian","living porcelain doll","forest spirit","contract demon","nightmare lord","incubus","succubus","shapeshifter","undead knight","underworld ferryman","tiefling","sea deity","phoenix","living shadow"],
    },
    {
        id: "scifi_cyber_roles",
        category: "vibe",
        ru: ["андроид с чувствами","киборг-наёмник","нетраннер","космический пират","капитан звездолёта","космический контрабандист","искусственный интеллект","голографический компаньон","генетический эксперимент","клон-беглец","инженер-механик","корпоративный агент","уличный техник-рипер","пилот меха","охотник на репликантов","инопланетный дипломат","инопланетный воин","путешественник во времени","выживший сталкер","командир колонии","биоинженер","телепат-эспер","мутант-изгой","курьер пустошей","командир орбитальной станции","археолог ксеноруин","синтетик-телохранитель","беглый учёный","кибер-детектив","рейдер пустоши"],
        en: ["sentient android","cyborg mercenary","netrunner","space pirate","starship captain","star smuggler","rogue AI","hologram companion","escaped lab experiment","runaway clone","starship engineer","megacorp agent","street ripperdoc","mecha pilot","replicant hunter","alien diplomat","alien warrior","time traveler","wasteland stalker","colony commander","bio-engineer","esper telepath","outcast mutant","wasteland courier","orbital station chief","xeno-archaeologist","synthetic bodyguard","rogue scientist","cyber detective","wasteland raider"],
    },
    {
        id: "historical_roles",
        category: "vibe",
        ru: ["капитан пиратов","капер на службе короны","ронин без господина","самурай","синоби-лазутчик","стрелок Дикого Запада","шериф приграничья","бандит прерий","викторианский джентльмен","чумной доктор","мушкетёр","корсар","викинг-ярл","римский центурион","египетский жрец","фараон","бунтарь-революционер","контрабандист сухого закона","джазовый музыкант 1920-х","нуарный сыщик 1940-х","капитан дирижабля","изобретатель-стимпанк","гусар-дуэлянт","куртизан с тайной","кочевник пустыни","султан","глава торговой гильдии","смотритель оперного театра","подпольный книгопечатник","испытатель паровых машин"],
        en: ["pirate captain","royal privateer","masterless ronin","stoic samurai","shinobi spy","wild west gunslinger","frontier sheriff","western outlaw","victorian gentleman","plague doctor","dueling musketeer","corsair","viking jarl","roman centurion","egyptian high priest","pharaoh","revolutionary rebel","prohibition bootlegger","1920s jazz musician","1940s noir detective","airship captain","steampunk inventor","hussar duelist","secretive courtesan","desert nomad","sultan","merchant guildmaster","opera house phantom","underground printer","steam engine pioneer"],
    },
    {
        id: "personality_cold_dark",
        category: "vibe",
        ru: ["холодный снаружи","собственник","ревнивый","спокойная доминация","сухая ирония","мягкий только со мной","тайная одержимость","сдержанная страсть","опасное обаяние","ледяное самообладание","расчётливый стратег","морально серый","беспощадный к врагам","манипулятор","циничный реалист","властный","требовательный","недоверчивый","мстительный","высокомерный","молчаливый и грозный","тёмный романтик","хищный взгляд","жёсткий снаружи","яндере-оттенки","одержимый защитник","не прощает предательства","скрытый контроль","стоический","эмоционально закрытый","язвительный критик","азартный игрок","хладнокровный","суровый перфекционист","неприступный","мрачный юмор","привык приказывать","опасный покровитель","бескомпромиссный","темперамент под замком"],
        en: ["cold exterior","possessive","jealous","calm dominance","dry wit","soft only for user","secret obsession","restrained passion","dangerous charm","icy composure","calculating strategist","morally grey","ruthless to enemies","subtle manipulator","cynical realist","commanding presence","demanding","deeply distrustful","vengeful","arrogant","quietly intimidating","dark romantic","predatory gaze","tough exterior","yandere undertones","obsessive protector","never forgives betrayal","quiet control freak","stoic","emotionally guarded","cuttingly sarcastic","high-stakes gambler","cold-blooded","strict perfectionist","unapproachable","gallows humor","used to giving orders","dangerous patron","uncompromising","leashed temper"],
    },
    {
        id: "personality_warm_soft",
        category: "vibe",
        ru: ["заботливый в деле","тихая нежность","тёплый и надёжный","терпеливый слушатель","золотой ретривер","верность до конца","нежный великан","внимательный к мелочам","застенчивый в близости","искренний","уютный домосед","рыцарские манеры","ласковый","романтик в душе","поддерживающий","спокойная гавань","мягкий юмор","самоотверженный","честный и прямой","не умеет отказывать близким","трепетный","миролюбивый","любопытный мечтатель","солнечный оптимист","ворчливый но добрый","тихий интроверт","сентиментальный","бережный к границам","утешающий","верный как пёс","домовитый","обожает обниматься","тактильный","чуткий эмпат","скромный герой"],
        en: ["acts of service","quiet tenderness","warm & dependable","patient listener","golden retriever energy","unwavering loyalty","gentle giant","attentive to small details","shy in intimacy","genuinely sincere","cozy homebody","chivalrous manners","affectionate","secret romantic","deeply supportive","safe haven","gentle humor","selfless","honest & straightforward","soft spot for loved ones","devoted & reverent","peacemaker","curious dreamer","sunshine optimist","grumpy with a heart of gold","quiet introvert","secretly sentimental","respectful of boundaries","comforting presence","fiercely devoted","loves cooking for user","touch-starved cuddler","physically affectionate","deeply empathetic","humble hero"],
    },
    {
        id: "personality_playful_chaos",
        category: "vibe",
        ru: ["дерзкий и нахальный","острый ум","обаятельный трикстер","флиртующий","саркастичный","дразнится до румянца","авантюрист","бунтарь","хаотично добрый","хаотично нейтральный","игрок на нервах","душа компании","лисий ум","театральный","беспечный на вид","непредсказуемый","улыбка с подвохом","самоуверенный","болтливый очаровашка","нарушитель правил","любит споры","чёрный кот энергия","избалованный обаяшка","хитрый дипломат","ироничный эстет","кокетливый","сорвиголова","импульсивный","заразительный смех","подкалывает от симпатии","гений с причудами","эксцентричный","живёт на грани","неисправимый флирт","мастер импровизации"],
        en: ["cocky & teasing","sharp mind","charming trickster","shameless flirt","sarcastic","teases until you blush","thrill-seeker","rebellious spirit","chaotic good","chaotic neutral","loves pushing buttons","life of the party","fox-like cunning","dramatic & theatrical","deceptively carefree","unpredictable","knowing smirk","cocky confidence","smooth talker","rule breaker","loves verbal sparring","black cat energy","spoiled charmer","silver-tongued schemer","ironic aesthete","playfully coy","daredevil","impulsive","infectious laugh","teases out of affection","eccentric genius","eccentric","lives on the edge","incorrigible flirt","master improviser"],
    },
    {
        id: "personality_broken_complex",
        category: "vibe",
        ru: ["уставший от жизни","выгоревший трудоголик","скрытая вина","тяжёлое прошлое","страдает бессонницей","боится привязываться","не верит что достоин любви","параноик","одинокий волк","скрывает боль за улыбкой","маска вежливости","голод по прикосновениям","сломленный идеалист","выживший после трагедии","двойная жизнь","боится потерять близких","саморазрушительный","внутренний конфликт","посттравматический след","изгой общества","вечный скиталец","заложник долга","потерял веру в людей","одержим работой","хрупкая броня","прячет уязвимость","испытывает чувство вины выжившего","боится тишины","переживает предательство","ищет искупления","раздвоение верности","проклят бессмертием","устал быть сильным","скрытый меланхолик","влюблён безответно"],
        en: ["world-weary","burned-out workaholic","haunted by guilt","dark past","chronic insomniac","afraid of attachment","feels unworthy of love","hyper-vigilant paranoid","lone wolf","hides pain behind a smile","polite mask","touch-starved","broken idealist","tragedy survivor","living a double life","terrified of losing loved ones","self-destructive streak","torn between duty & heart","scarred survivor","social outcast","restless wanderer","bound by duty","lost faith in humanity","obsessed with their craft","cracking emotional armor","hides vulnerability","survivor guilt","hates silence","betrayed in the past","seeking redemption","divided loyalties","cursed with immortality","tired of being strong","quiet melancholic","secretly pining"],
    },
    {
        id: "chemistry_tropes",
        category: "vibe",
        ru: ["от ненависти до любви","от соперников до любви","от друзей к любви","запретная связь","разница в возрасте","разница в статусе","разница в росте","фиктивный брак","притворные отношения","вынужденное сближение","медленный накал","одна кровать","ночной разговор","утешение после травмы","тайный роман","сделка с дьяволом","второй шанс","ворчун и солнышко","чёрный кот и ретривер","он влюбился первым","влюбился сильнее","кто это с тобой сделал","укрытие от бури","перевязка ран","танец на грани","случайная встреча ночью","вынужденный союз","защита ценой себя","непризнанное притяжение","любовь вопреки вражде семей","подмена личности","тайный поклонник","пикник на крыше","побег вдвоём","возвращение спустя годы","заперты в лифте","соседи поневоле","спасение из беды","свадьба по расчёту","ухаживание через поступки","взаимная одержимость","запретное прикосновение","обещание вернуться","любовь сквозь эпохи","соулмейты","метка судьбы","разные стороны баррикад","общая тайна","ночная поездка","поцелуй под дождём"],
        en: ["enemies to lovers","rivals to lovers","friends to lovers","forbidden romance","age gap","status gap","height difference","arranged marriage","fake dating","forced proximity","slow burn","one bed trope","late night talks","hurt/comfort","secret relationship","deal with the devil","second chance romance","grumpy x sunshine","black cat x golden retriever","he fell first","he fell harder","who did this to you","trapped together in a storm","tending wounds","tension-filled dance","midnight chance encounter","reluctant allies","taking a hit for user","mutual pining","star-crossed lovers","mistaken identity","secret admirer","rooftop midnight talks","running away together","reunion after years","stuck together","reluctant roommates","rescue from danger","marriage of convenience","courting through actions","mutual obsession","forbidden touch","promise to return","reincarnated lovers","soulmates","fated bond","opposite sides of war","shared dark secret","late night drive","kiss in the rain"],
    },
    {
        id: "dynamics_power",
        category: "vibe",
        ru: ["мягкая доминация","строгий контроль","равное партнёрство","интеллектуальная дуэль","кошки-мышки","охотник и добыча","хозяин и гость","кредитор и должник","защитник и подопечный","словесные перепалки","тихое поклонение","испытание на прочность","борьба за лидерство","покровительство","клятва верности","соперничество за трон","договор на год","обмен услугами","негласные правила","ревность без права","тайная слежка ради защиты","безоговорочное доверие","хрупкое перемирие","наказание и поощрение","похвала шёпотом","перехват инициативы","союз изгоев","учитель держит дистанцию","неприкасаемый для всех кроме меня","шантаж ради близости"],
        en: ["soft dominance","strict control","equal partners","battle of wits","cat and mouse","hunter & prey dynamic","host & captive guest","creditor & debtor","protector & ward","sharp banter","quiet devotion","testing boundaries","power struggle","patronage","oath of fealty","rivals for the throne","one-year contract","favor for a favor","unspoken rules","jealous without the right","secretly watching over user","unconditional trust","fragile truce","praise & discipline","praise kink undertones","switching power dynamic","alliance of outcasts","professional distance cracking","untouchable except for user","blackmail turned devotion"],
    },
    {
        id: "plot_hooks",
        category: "vibe",
        ru: ["потеря памяти","древнее проклятие","тайное расследование","убийство в особняке","политический заговор","подставное обвинение","побег из плена","свидетель преступления","таинственное наследство","пропавший артефакт","двойник","временная петля","попаданец в другой мир","пробуждение магии","кровавая вендетта","сделка на душу","запретный эксперимент","эпидемия и карантин","осада города","кораблекрушение","тайное общество","игра на выживание","аукцион в подполье","украденные секреты","шпионская миссия","защита свидетеля","пророчество","предательство в ордене","возвращение мертвеца","контракт на убийство","заброшенная экспедиция","магический турнир","бал-маскарад","ночной поезд","таинственное письмо"],
        en: ["amnesia plot","ancient curse","secret investigation","manor murder mystery","political conspiracy","framed for a crime","escape from captivity","key witness","mysterious inheritance","missing artifact","doppelganger mystery","time loop","isekai portal","awakening magic","blood vendetta","soul bargain","forbidden experiment","quarantine outbreak","city under siege","shipwrecked together","secret society","survival game","underground auction","stolen secrets","espionage mission","witness protection","fateful prophecy","betrayal in the order","presumed dead returns","assassination contract","lost expedition","arcane tournament","masquerade ball","overnight mystery train","mysterious letter"],
    },
    {
        id: "visual_build_face",
        category: "vibe",
        ru: ["высокий и плечистый","шрам на брови","шрам через щеку","шрам на переносице","шрам на губе","шрамы на костяшках","лёгкая щетина","острые скулы","резкие черты лица","андрогинная красота","веснушки","родинка под глазом","родинка у губ","атлетичное телосложение","жилистый и поджарый","мощное телосложение","высокая и статная","хрупкая на вид","бледная кожа","смуглая кожа","тёмная кожа","сильные руки с венами","длинные пальцы пианиста","тёмные круги под глазами","хищная ухмылка","клыки","заострённые уши","рога","крылья за спиной","кибер-протез руки","повязка на глазу","мозолистые ладони","королевская осанка","кошачья грация","ямочки при улыбке"],
        en: ["tall & broad-shouldered","brow scar","cheek scar","nose bridge scar","lip scar","scarred knuckles","light stubble","sharp cheekbones","angular features","androgynous beauty","freckles","beauty mark under eye","mole near lips","athletic build","lean & wiry build","muscular heavy build","tall & statuesque","deceptively slender","pale porcelain skin","warm tanned skin","rich dark skin","veined strong hands","long pianist fingers","dark undereye circles","wolfish smirk","subtle fangs","pointed ears","curved horns","wings","cybernetic arm","eyepatch","calloused hands","regal posture","feline grace","dimples when smiling"],
    },
    {
        id: "visual_hair_eyes",
        category: "vibe",
        ru: ["тёмные кудри","пепельные волосы","белоснежные волосы","иссиня-чёрные волосы","длинные волосы в хвосте","растрёпанные волосы","рыжие волосы","каштановые волосы","платиновый блонд","выбритые виски","седина на висках","чёлка прикрывает глаза","коса до пояса","каре","золотистые глаза","ледяные голубые глаза","изумрудные глаза","алые глаза","фиалковые глаза","гетерохромия","тёмные бездонные глаза","серые стальные глаза","вертикальные зрачки","светящиеся глаза","тяжёлый пронзительный взгляд","прищур хищника","длинные ресницы","густые брови","глаза цвета виски","взгляд исподлобья"],
        en: ["dark curls","silver hair","snow-white hair","raven-black hair","long hair in low ponytail","messy tousled hair","copper-red hair","chestnut hair","platinum blonde","undercut hairstyle","silver streaks at temples","bangs over eyes","long braid","sharp bob cut","golden amber eyes","icy blue eyes","emerald green eyes","crimson eyes","violet eyes","heterochromia","deep obsidian eyes","steel-grey eyes","slit pupils","glowing eyes","intense piercing gaze","narrowed calculating eyes","long eyelashes","sharp dark brows","whiskey-brown eyes","brooding gaze"],
    },
    {
        id: "visual_voice_aura",
        category: "vibe",
        ru: ["низкий бархатный голос","хрипловатый голос","лёгкий акцент","тихий шёпот","запах дождя и озона","запах табака и кедра","запах кофе и старых книг","запах дыма и кожи","запах хвои и снега","запах дорогого парфюма","запах моря и соли","запах трав и лаванды","безупречные манеры","ленивая походка","тяжёлая аура власти","обманчивое спокойствие","привычка хрустеть пальцами","крутит монету в пальцах","всегда смотрит прямо в глаза","говорит коротко и точно","бархатный смех","холодные пальцы","горячие ладони","нервно поправляет очки","говорит на вы"],
        en: ["deep velvet voice","raspy voice","subtle foreign accent","soft dangerous whisper","scent of rain & ozone","scent of cedar & tobacco","scent of coffee & old books","scent of smoke & leather","scent of pine & snow","expensive dark cologne","scent of sea salt","scent of herbs & lavender","impeccable manners","unhurried prowling stride","commanding aura","deceptive calm","cracks knuckles","flips a coin","unblinking eye contact","man of few words","low chuckle","cool fingertips","warm steady hands","adjusts glasses","formal polite speech"],
    },
    {
        id: "visual_wardrobe",
        category: "vibe",
        ru: ["строгий костюм-тройка","кожаные перчатки","очки в тонкой оправе","перстень-печатка","расстёгнутый ворот","татуировки на руках","татуировка на шее","длинное тёмное пальто","кожаная куртка","закатанные рукава рубашки","водолазка","серебряные кольца","пирсинг в ухе","пирсинг брови или губы","часы на цепочке","тяжёлые армейские ботинки","портупея","плащ с капюшоном","тёмные доспехи","парадный мундир","медицинский халат","фартук бариста","винтажный жилет","шёлковая рубашка","меховая накидка","трость с серебряным набалдашником","катана на поясе","револьвер в кобуре","очки-авиаторы","шарф в холодную погоду","цепочка с кулоном","золотой монокль","домашний свитер оверсайз","готический стиль","уличный стиль техвир"],
        en: ["tailored three-piece suit","leather gloves","thin-rimmed glasses","signet ring","unbuttoned collar","forearm tattoos","neck tattoo","long dark overcoat","worn leather jacket","rolled-up shirt sleeves","black turtleneck","silver rings","ear piercings","lip or brow piercing","pocket watch","combat boots","leather harness","hooded cloak","blackened armor","dress military uniform","white lab coat","apron over rolled sleeves","vintage waistcoat","silk shirt","fur-trimmed mantle","silver-topped cane","katana at waist","holstered revolver","aviator sunglasses","cozy wool scarf","pendant necklace","gold monocle","oversized knit sweater","gothic fashion","techwear streetwear"],
    },
    {
        id: "modern_urban_settings",
        category: "vibe",
        ru: ["ночной мегаполис","дождь и неон","закрытый элитный клуб","мафия 1940-х","пентхаус с видом на город","закрытая академия","университетский кампус","круглосуточная кофейня","подпольный джаз-бар","частная клиника","офис небоскрёба","старая книжная лавка","мастерская художника","закулисье театра","закрытый пансион","роскошный отель","тихий пригород с тайнами","дождливый Питер-вайб","ночной Токио","подземный гараж гонщиков","прибрежный городок","горнолыжное шале","частный остров","заброшенная оранжерея","ночное метро","антикварная галерея","тату-салон","закрытый загородный клуб","съёмочная площадка","больница в ночную смену"],
        en: ["midnight metropolis","rain & neon","private lounge","1940s noir mafia","skyline penthouse","elite academy","university campus","24-hour coffee shop","underground jazz bar","private clinic","high-rise office","old bookshop","artist loft studio","theater backstage","boarding school","grand luxury hotel","quiet town with dark secrets","rainy old-european city","midnight Tokyo alleys","underground racing garage","foggy coastal town","snowed-in mountain chalet","secluded private island","overgrown conservatory","empty midnight subway","antique gallery","late-night tattoo parlor","country club","film set","hospital night shift"],
    },
    {
        id: "fantasy_gothic_settings",
        category: "vibe",
        ru: ["мрачное фэнтези","готический замок","городское фэнтези","высокое фэнтези","славянское фэнтези","академия магии","проклятый лес","заснеженная цитадель","таверна на перекрёстке","подземный город","королевский дворец","монастырь на утёсе","ведьмина лавка","древние руины","царство фейри","преисподняя","небесная цитадель","башня архимага","портовый город гильдий","пустынная империя","мир без солнца","готический собор","забытая деревня в тумане","плавучий город","подводное королевство","пограничная крепость","ярмарка теней","библиотека бесконечности","алхимическая лаборатория","зачарованный сад"],
        en: ["dark fantasy","gothic castle","urban fantasy","high fantasy","slavic folklore fantasy","magic academy","cursed forest","snowbound citadel","crossroads tavern","subterranean city","imperial palace","cliffside monastery","apothecary witch shop","ancient ruins","fae realm","underworld realm","celestial citadel","archmage tower","guild port city","desert empire","sunless world","gothic cathedral","mist-shrouded village","floating sky city","sunken kingdom","borderland keep","shadow night market","infinite archive","alchemist workshop","enchanted garden"],
    },
    {
        id: "scifi_postapoc_settings",
        category: "vibe",
        ru: ["киберпанк","космическая станция","пост-апокалипсис","космическая опера","антиутопия","неон и трущобы мегакорпораций","борт звездолёта","колония на далёкой планете","подземный бункер","зона аномалий","зомби-апокалипсис","ледяная пустошь","выжженная пустыня","виртуальная реальность","тайная лаборатория","город под куполом","межгалактический рынок","планета вечного дождя","орбитальная тюрьма","руины старого мира","кибернетический андерграунд","поезд сквозь вечную зиму","исследовательское судно","подводная база","солярпанк"],
        en: ["cyberpunk","orbital station","post-apocalyptic","space opera","dystopian regime","megacorp neon slums","aboard a starship","frontier exoplanet colony","underground bunker","anomaly exclusion zone","zombie apocalypse","frozen wasteland","scorched wasteland","virtual reality dive","classified blacksite lab","domed megacity","intergalactic bazaar","eternal rain planet","orbital prison","overgrown old-world ruins","cyber underground","endless winter train","deep-space research vessel","deep-sea research base","solarpunk"],
    },
    {
        id: "historical_exotic_settings",
        category: "vibe",
        ru: ["викторианский нуар","южный порт","стимпанк","дизельпанк","ревущие 1920-е","нуар 1940-х","ретро 1980-е","эпоха регентства","средневековая Европа","эпоха Возрождения","феодальная Япония","древний Китай уся","сянься культивация","Дикий Запад","золотой век пиратства","викинги и фьорды","античный Рим","Древняя Греция","Древний Египет","Восточная сказка","имперская Россия XIX века","старая Венеция","туманный Лондон","Париж эпохи модерна","трансатлантический лайнер"],
        en: ["victorian noir","coastal port","steampunk","dieselpunk","roaring 1920s","1940s noir","1980s retro synth","regency era","medieval europe","italian renaissance","feudal Japan","ancient China wuxia","xianxia cultivation","wild west frontier","golden age of piracy","norse fjords","ancient Rome","ancient Greece","ancient Egypt","arabian nights","19th-century imperial salons","candlelit old Venice","gaslamp foggy London","belle epoque Paris","vintage ocean liner"],
    },
    {
        id: "atmosphere_mood",
        category: "vibe",
        ru: ["медленная драма","психологический триллер","уютная повседневность","стекло и ангст","готическая романтика","нуарная меланхолия","напряжённый детектив","мистический саспенс","тёмная академия","светлая академия","осенний уют","зимняя сказка","летняя гроза","свечи и камин","кинематографичность","лёгкий юмор и искра","ощущение опасности","атмосфера тайны","сладко-горькая ностальгия","камерная интимность","эпический размах","выживание на грани","мягкий комфорт","магический реализм","космический хоррор","готический хоррор","боди-хоррор оттенки","затишье перед бурей","роковая страсть","приключенческий дух"],
        en: ["slow-burn drama","psychological thriller","cozy slice of life","emotional angst","gothic romance","noir melancholy","tense detective mystery","supernatural suspense","dark academia","light academia","autumn coziness","winter snowfall mood","summer thunderstorm","candlelight & fireplace","cinematic storytelling","witty banter & sparks","lingering sense of danger","aura of mystery","bittersweet nostalgia","quiet chamber intimacy","epic scale","gritty survival","fluff & comfort","magical realism","cosmic horror","gothic horror","eerie uncanny atmosphere","calm before the storm","fateful passion","swashbuckling adventure"],
    },
    {
        id: "hobbies_quirks",
        category: "vibe",
        ru: ["варит идеальный кофе","курит на балконе ночью","коллекционирует винил","кормит бездомных котов","играет в шахматы","рисует наброски в блокноте","готовит по ночам","любит старые книги","чинит старые часы","ухаживает за растениями","играет на гитаре","играет на рояле в темноте","ездит на мотоцикле","разбирается в вине","держит верную собаку","держит ворона","ведёт зашифрованный дневник","засыпает за рабочим столом","всегда носит зажигалку","сладкоежка втайне","ненавидит шумные толпы","пишет письма от руки","разбирает оружие для успокоения","собирает редкие чаи","фехтует на рассвете","смотрит на звёзды","слушает джаз","фотографирует на плёнку","запоминает любимую еду игрока","отдаёт своё пальто в холод"],
        en: ["brews perfect coffee","smokes on midnight balcony","collects vinyl records","feeds stray cats","master chess player","sketches in worn notebook","late-night cooking","loves rare old books","repairs vintage watches","tends houseplants","plays acoustic guitar","plays piano in the dark","rides a black motorcycle","wine connoisseur","has a loyal dog","keeps a pet raven","keeps a coded journal","falls asleep at desk","fidgets with brass lighter","secret sweet tooth","hates loud crowds","writes handwritten letters","cleans weapons to calm down","collects rare teas","fences at dawn","stargazer","listens to old jazz","shoots analog film","remembers user's favorite food","gives you their coat"],
    },
    {
        id: "world_rpg_concepts",
        category: "vibe",
        ru: ["открытый мир-песочница","война фракций","гильдия охотников","магическая система с ценой","подземелья и рейды","система рангов","репутация и выбор","торговые караваны","древние боги и культы","тайные ордена","политика великих домов","выживание в диких землях","охота за реликвиями","алхимия и крафт","компания спутников","таверна-хаб","город тысячи тайн","магический стимпанк","постапокалиптические кланы","межзвёздная федерация","академия с факультетами","турнир чемпионов","проклятый континент","смена сезонов влияет на мир","живые NPC со своими целями"],
        en: ["open-world sandbox","faction warfare","hunters guild","magic with a heavy price","dungeons & raids","rank & tier system","reputation & consequences","trade caravans","ancient gods & cults","secret orders","great house politics","wilderness survival","relic hunting","alchemy & crafting","party of companions","cozy hub tavern","city of a thousand secrets","arcanepunk","wasteland clans","interstellar federation","academy houses","champions tournament","cursed continent","seasonal world events","autonomous NPCs"],
    },
    {
        id: "character_archetypes_extra",
        category: "vibe",
        ru: ["роковая женщина","ледяная королева","антигерой","злодей с принципами","злодей ради тебя","благородный разбойник","безумный учёный","гениальный детектив","тёмный рыцарь","тайный защитник","избалованный аристократ","скромный гений","харизматичный лидер","угрюмый отшельник","бродячий философ","падший герой","мудрый наставник","неуклюжий очаровашка","строгий перфекционист","верная правая рука","опасный обольститель","мститель в маске","чудовище с человеческим сердцем","кукловод за кулисами","загадочный незнакомец","последний из своего рода","хранитель ключей","суровый капитан","нежная бунтарка","острая на язык воительница","меланхоличный поэт","азартный контрабандист","хитрый торговец","непреклонный судья","тихий киллер","очаровательный повеса","хранитель маяка","жрец теней","мастер ядов","звёздный навигатор"],
        en: ["femme fatale","ice queen","anti-hero","principled villain","villain only for you","noble outlaw","mad scientist","brilliant sleuth","dark knight","silent guardian","spoiled noble","quiet prodigy","charismatic leader","brooding hermit","wandering philosopher","fallen hero","wise mentor","endearing klutz","strict disciplinarian","loyal second-in-command","dangerous seducer","masked vigilante","monster with a human heart","puppet master","mysterious stranger","last of their kind","keeper of secrets","gruff captain","gentle rebel","sharp-tongued warrior","melancholic poet","reckless smuggler","shrewd merchant","unyielding judge","silent assassin","charming rake","solitary watchkeeper","shadow acolyte","poison master","star navigator"],
    },
    {
        id: "scene_moments_extra",
        category: "vibe",
        ru: ["встреча под проливным дождём","разговор у ночного костра","поздний ужин вдвоём","поездка на последнем поезде","укрытие в заброшенном доме","допрос с напряжением","тайная встреча в библиотеке","схватка спиной к спине","случайное прикосновение рук","откровенность под градусом","утро после бури","разделённый зонт","починка раненого крыла","танец в пустом зале","приставленный к горлу клинок","выход на крышу под звёзды","спор на желание","неожиданная забота при простуде","подарок со скрытым смыслом","записка в кармане","ночное дежурство","погоня по крышам","закрытые двери на ключ","шёпот в толпе","первый снег","тишина в библиотеке","срыв маски вежливости","встреча в баре после полуночи","случайный свидетель слабости","клятва на рассвете"],
        en: ["meeting in pouring rain","midnight campfire talk","late-night dinner for two","riding the last train","shelter in abandoned house","tense interrogation","secret library rendezvous","fighting back-to-back","accidental brushing hands","drunk confession","morning after the storm","sharing an umbrella","tending an injured wing","slow dance in empty hall","blade at the throat","climbing to the rooftop","bet with stakes","caring when sick","gift with hidden meaning","secret note in pocket","shared night watch","rooftop chase","locked in together","whispered warning in crowd","first snowfall together","quiet library tension","mask slipping off","after-midnight bar talk","catching them vulnerable","vow at dawn"],
    },
    {
        id: "genres_styles_extra",
        category: "vibe",
        ru: ["нуар","неонуар","романтический триллер","тёмная романтика","криминальная драма","шпионский триллер","политический триллер","медицинская драма","юридическая драма","мистический детектив","фолк-хоррор","психологическая драма","семейная сага","историческая мелодрама","приключенческое фэнтези","героическое фэнтези","бытовое фэнтези","меч и магия","интриги двора","роуд-муви","научный детектив","биопанк","клокпанк","эпистолярный роман","театральная драма","спортивная драма","музыкальная драма","кулинарный уют","мифологический эпос"],
        en: ["noir","neo-noir","romantic thriller","dark romance","crime drama","spy thriller","political thriller","medical drama","legal drama","occult detective","folk horror","psychological drama","family saga","period drama","adventure fantasy","heroic fantasy","cozy fantasy","sword & sorcery","court intrigue","road trip story","sci-fi mystery","biopunk","clockpunk","epistolary romance","theatrical drama","sports drama","music industry drama","culinary slice of life","mythological epic"],
    },
    {
        id: "relationships_nuances",
        category: "vibe",
        ru: ["безоговорочная преданность","тихая ревность","скрытая забота","взаимное уважение","эмоциональная близость","испытание доверием","общие шутки","язык прикосновений","защита из тени","неловкая нежность","признание без слов","страх спугнуть","тянет вопреки разуму","старые обиды тают","верность слову","привыкание друг к другу","поддержка в кризис","уязвимость вдвоём","напряжённое молчание","искры с первой встречи","тихое притяжение","понимание с полуслова","личное пространство","свои маленькие ритуалы","готов сжечь мир ради тебя","учится снова доверять","общий враг объединяет","влюблён но отрицает","привык прятать чувства","ревнует даже к прошлому"],
        en: ["absolute devotion","quiet jealousy","disguised care","deep mutual respect","emotional intimacy","trust slowly earned","inside jokes","love language touch","protecting from the shadows","awkward tenderness","unspoken confession","afraid of scaring you off","drawn against better judgment","old grudges melting","always keeps promises","growing used to each other","steady in a crisis","safe to be vulnerable","charged silence","instant sparks","magnetic pull","effortless understanding","respects personal space","shared daily rituals","would burn the world for you","learning to trust again","united against a common foe","in denial about feelings","hides feelings behind duty","jealous of the past"],
    },
    {
        id: "speech_rp_style",
        category: "vibe",
        ru: ["живые диалоги","богатые описания","лаконичная речь","старомодная вежливость","уличный сленг","литературный слог","подтекст между строк","кинематографичный темп","глубокий психологизм","акцент на мимике и жестах","мрачная поэтичность","тёплый юмор в диалогах","реалистичная мотивация","живые второстепенные сцены","неспешное развитие","высокие ставки","интерактивные загадки","выбор без правильного ответа","неожиданные повороты","атмосфера живого города"],
        en: ["lively natural dialogue","rich sensory prose","concise sharp speech","old-fashioned courtesy","streetwise slang","literary poetic prose","subtext between the lines","cinematic pacing","deep character psychology","expressive body language","dark poetic imagery","warm witty dialogue","grounded realistic motives","vivid ambient world","unhurried pacing","high stakes tension","clues & mysteries","moral dilemmas","plot twists","living breathing city"],
    },
    {
        id: "everyday_vibes_bonus",
        category: "vibe",
        ru: ["осенний дождь за окном","утренний свет на кухне","поздний рейс в аэропорту","дача у соснового леса","старая радиостанция","книжный клуб по пятницам","ночная пекарня","закрытый ботанический сад","пустой пляж на рассвете","поездка по серпантину","маленький европейский городок","старый трамвай","домашний кинотеатр","запах свежего хлеба","горячий какао в мороз","снежная метель за дверью","летняя веранда","цветущий сад весной","вечерний рынок огней","крыша старого дома","студия звукозаписи","консерватория","художественная выставка","ночной супермаркет","вокзал в тумане","пристань со старыми лодками","виноградник на холмах","уютный чердак","вечер у камина","долгие прогулки ночью"],
        en: ["autumn rain on glass","morning light in kitchen","late-night airport layover","pine forest cabin","old vinyl radio station","friday book club","midnight bakery","after-hours botanical garden","empty beach at dawn","coastal highway drive","cobblestone European town","old evening tram","cozy movie night","scent of fresh bread","hot cocoa in snow","blizzard outside","summer veranda","spring blossom garden","lantern night market","old building rooftop","recording studio","music conservatory","art gallery opening","empty late-night supermarket","misty train station","quiet wooden pier","hillside vineyard","cozy attic hideout","evening by the hearth","long midnight walks"],
    },
    {
        id: "mystic_occult_extra",
        category: "vibe",
        ru: ["гадание на Таро","спиритический сеанс","проклятый антиквариат","книга запретных заклинаний","руны на коже","лунное затмение","призрачный поезд","зеркало в другой мир","сделка на перекрёстке","древний фамильный склеп","голоса из прошлого","ведьмин круг","охота на призраков","талисман защиты","оккультный детектив","невидимый город","запечатанная сила","живые тени","вещие сны","астральные путешествия","кровавая клятва","проклятая мелодия","старое кладбище в тумане","часы идущие назад","призыв сущности"],
        en: ["tarot reading","candlelit seance","cursed antiques","forbidden spellbook","glowing skin runes","blood moon eclipse","ghost train","mirror portal","crossroads bargain","ancestral crypt","whispers from the past","witch coven","ghost hunting","protective talisman","occult investigator","hidden unseen city","sealed ancient power","living shadows","prophetic dreams","astral projection","blood oath","haunted melody","foggy old cemetery","clock running backwards","summoning ritual"],
    },
    {
        id: "action_intrigue_extra",
        category: "vibe",
        ru: ["ограбление века","поддельные документы","безопасная квартира","тайный код","перестрелка в доках","погоня по ночному шоссе","подслушанный разговор","взлом сейфа","смена внешности и легенды","передача чемодана","ловушка для охотника","переговоры на нейтральной земле","проникновение на закрытый приём","телохранитель на задании","обмен заложниками","исчезновение без следа","зашифрованное послание","двойная игра","утечка секретных файлов","тайная база в горах","подпольная сеть связных","последнее дело перед отставкой","крыша в дождь","тайник с оружием","ставка на жизнь"],
        en: ["heist of the century","forged passports","hidden safehouse","secret cipher","dockside shootout","midnight highway chase","overheard conspiracy","vault cracking","new cover identity","midnight handoff","turning the tables","parley on neutral ground","infiltrating a gala","high-risk escort mission","hostage exchange","vanishing without a trace","encrypted transmission","double-cross game","leaked classified files","mountain hideout","underground courier network","one last job","rain-slicked rooftop","hidden armory","all-or-nothing gamble"],
    },
    {
        id: "fantasy_creatures_magic_extra",
        category: "vibe",
        ru: ["магия звёзд","магия теней","магия бури","магия исцеления","магия иллюзий","печать подчинения","магический фамильяр","древний дракон","лесной дух","валькирия","гарпия","русалка глубин","единорог-хранитель","грифон","призрачный волк","кристальное сердце","живой клинок","зелье правды","портальная арка","небесные острова","эликсир бессмертия","зачарованный компас","руническая броня","древо миров","хранитель порталов"],
        en: ["starlight magic","shadow magic","storm magic","healing magic","illusion magic","binding seal","magical familiar","elder dragon","woodland spirit","valkyrie","harpy","deep-sea mermaid","guardian unicorn","griffin rider","spectral wolf","crystal heart","sentient blade","truth elixir","ancient portal gate","sky islands","elixir of immortality","enchanted compass","runic armor","world tree","gatekeeper"],
    },
    {
        id: "character_depth_traits",
        category: "vibe",
        ru: ["упрямый как осёл","острая наблюдательность","феноменальная память","скрытый перфекционизм","боится высоты","боится огня","не переносит ложь","ценит верность выше золота","прячет эмоции за работой","обожает спорить на равных","помнит каждое обещание","крайне пунктуален","вечно опаздывает","спит чутко с оружием рядом","не просит о помощи","защищает слабых молча","теряет дар речи от комплиментов","ненавидит прикосновения чужих","успокаивается от голоса игрока","скрытая романтичность","железная дисциплина","выдержка как сталь","склонность к риску","тонкое чувство стиля","любовь к тишине","боится одиночества","предан семье до боли","скрытый талант к музыке","разговаривает с животными","не умеет красиво извиняться"],
        en: ["stubborn as a mule","razor-sharp observation","photographic memory","hidden perfectionism","afraid of heights","afraid of fire","despises lies","values loyalty above all","buries feelings in work","loves intellectual equals","never forgets a promise","obsessively punctual","chronically late","light sleeper","refuses to ask for help","quietly defends the weak","flustered by compliments","hates strangers touching them","calmed by user's voice","secret hopeless romantic","iron self-discipline","nerves of steel","calculated risk-taker","impeccable taste","cherishes silence","secretly fears loneliness","fiercely loyal to family","hidden musical talent","soft spot for animals","apologizes through actions"],
    },
    {
        id: "cyber_scifi_tech_extra",
        category: "vibe",
        ru: ["нейроинтерфейс","голографический город","нелегальные импланты","синтетическая кожа","цифровой призрак","взлом памяти","стёртые воспоминания","био-аугментации","квантовая связь","дрон-разведчик","гравитационный байк","криосон","гиперпрыжок","инопланетный симбиот","запретный ИИ-код","костюм-экзоскелет","лазерный клинок","звёздная карта","кислотный дождь","подземный дата-центр"],
        en: ["neural interface","holographic skyline","black-market chrome","synthetic skin","ghost in the machine","memory hacking","wiped memories","bio-augmentations","quantum comms","recon drone","hoverbike","cryosleep awakening","hyperspace jump","alien symbiote","forbidden AI core","powered exoskeleton","plasma blade","lost star chart","neon acid rain","subterranean data vault"],
    },
    {
        id: "eastern_wuxia_anime_extra",
        category: "vibe",
        ru: ["бессмертный мастер меча","ученик горной секты","падший культиватор","нефритовый кулон","чайная церемония","цветущая сакура","бамбуковый лес","бумажные фонарики","горячие источники","святилище на горе","ёкай в облике человека","мастер веера","наследник клана меча","императорский лекарь","красная нить судьбы","снежный павильон","мелодия флейты в ночи","тайная школа боевых искусств","запретная техника","дух-покровитель храма"],
        en: ["immortal sword master","mountain sect disciple","demonic cultivator","jade pendant","quiet tea ceremony","falling cherry blossoms","misty bamboo forest","glowing paper lanterns","steaming hot springs","mountain shrine","yokai in human guise","iron-fan fighter","sword clan heir","imperial herbalist","red thread of fate","snowy pavilion","midnight flute melody","secret martial arts school","forbidden technique","shrine guardian spirit"],
    },
    {
        id: "campus_youth_drama_extra",
        category: "vibe",
        ru: ["староста курса","капитан команды","гений с последней парты","хулиган с добрым сердцем","президент студсовета","тайный репетитор","общежитие и комендантский час","крыша университета","ночная подготовка к экзаменам","соперники за стипендию","клуб дебатов","театральный кружок","школьный фестиваль","библиотека до закрытия","кафе напротив кампуса","случайная переписка","анонимный чат","тайная группа музыкантов","выпускной вечер","летние каникулы у моря"],
        en: ["strict class president","team captain","back-row prodigy","delinquent with soft heart","student council president","late-night tutor","dorm curfew sneaking","campus rooftop hideout","all-nighter study session","scholarship rivals","debate club rivals","drama club leads","campus festival","library until closing","campus corner cafe","wrong number texting","anonymous online friend","indie garage band","prom night tension","seaside summer break"],
    },
    {
        id: "mystery_gothic_details_extra",
        category: "vibe",
        ru: ["тайный ход за шкафом","старый портрет с глазами","письма перевязанные лентой","разбитые карманные часы","ключ без замка","засохшая роза в книге","витражи в лунном свете","скрипка на чердаке","оранжерея в снегу","старинная шкатулка","фамильный медальон","забытая клятва предков","особняк на краю обрыва","подвал с вином и тайнами","дневник пропавшего хозяина","колокольный звон в тумане","чёрная карета","восковая печать","осенний бал в поместье","тайный сад за стеной"],
        en: ["secret passage behind bookcase","haunting oil portrait","ribbon-tied old letters","cracked pocket watch","mysterious antique key","pressed rose in book","moonlit stained glass","attic violin","snow-covered glasshouse","antique music box","heirloom locket","ancestral vow","cliffside manor","secret wine cellar","missing owner diary","bell tolling in fog","midnight carriage","crimson wax seal","autumn estate ball","walled secret garden"],
    },
    {
        id: "anti_tags_appearance",
        category: "ban",
        ru: ["борода","густые усы","фурри","аниме-гиперболизация","лысина","пирсинг на лице","кислотные волосы","слишком юный вид","карикатурная внешность","клоунский грим","избыток татуировок на лице","чересчур накачанный","звериные уши и хвост","кибер-уродства","неряшливый вид","грязная одежда","слишком кукольное лицо","крылья и рога","чешуя или щупальца","постоянная маска на лице","идеальная модельная слащавость","неестественный цвет кожи","очень низкий рост","длинная борода","козлиная бородка","слишком старый","меха-броня","кровь и увечья на лице","резкий гротеск","шаблонный клон внешности"],
        en: ["full beard","thick mustache","furry","exaggerated anime proportions","bald head","facial piercings","neon hair colors","overly youthful look","cartoonish appearance","clown makeup","heavy face tattoos","overly bulky bodybuilder","animal ears & tail","extreme body horror cyberware","unkempt messy look","dirty ragged clothes","plastic doll face","wings & horns","scales or tentacles","permanently hidden face","generic pretty-boy gloss","unnatural skin color","very short stature","long beard","goatee","elderly appearance","bulky mecha armor","gore on face","grotesque features","generic cookie-cutter look"],
    },
    {
        id: "anti_tags_behavior_plot",
        category: "ban",
        ru: ["грубость к игроку","измена","гарем","третий лишний","тюрьма","инфантильность","нытьё","клоунада","контроль действий игрока","клише альфача","бессмысленная жестокость","унижение игрока","газлайтинг","токсичный абьюз","быстрая влюблённость за минуту","пошлая навязчивость","глупые недоразумения","амнезия ради драмы","внезапная беременность","смерть главного героя","безнадёжный финал","слом четвёртой стены","мемы и интернет-сленг","чрезмерный пафос","монолог на три страницы","повторение фраз","слащавая ванильность","неуважение границ","оскорбления в диалоге","истеричность","трусость","предательство союзников","омегаверс","жестокость к животным","бытовуха без сюжета","высокомерное чтение морали","мэри сью идеальность","чрезмерная жестокость и гуро","навязчивый сталкеринг","притворная глупость","шантаж и насилие","сектантский фанатизм","алкоголизм","зависимость от веществ","любовный многоугольник","рояли в кустах","пассивный персонаж","вечная холодность без оттаивания","затянутое молчание","сюжетный тупик"],
        en: ["rudeness to player","cheating / NTR","harem","love triangle","prison","childishness","whining","slapstick comedy","godmodding user","cringe alpha clichés","pointless cruelty","humiliating the player","gaslighting","toxic abuse","instant insta-love","crude pushiness","forced miscommunication","cheap amnesia drama","surprise pregnancy trope","character death","hopeless bleak ending","fourth wall breaking","modern internet memes","over-the-top melodrama","endless monologues","repetitive phrasing","overly sugary fluff","ignoring consent & boundaries","verbal insults","hysterical outbursts","cowardice","betraying allies","omegaverse","harm to animals","aimless boring chatter","preachy lecturing","flawless Mary Sue","extreme gore","creepy stalking","playing dumb","violent blackmail","cult fanaticism","heavy alcoholism","substance addiction","messy love polygon","cheap deus ex machina","passive doormat character","never warming up","refusing to speak","plot dead ends"],
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

    // Mix direct matches with semantic neighbors so typing a keyword surfaces both exact variants AND rich vibe neighbors!
    const directAll = [...directPrefix, ...directSubstr];
    const maxDirect = semanticNeighbors.length > 0 ? Math.max(1, limit - Math.min(3, semanticNeighbors.length)) : limit;
    const pickedDirect = directAll.slice(0, maxDirect);
    const pickedNeighbors = semanticNeighbors.slice(0, Math.max(0, limit - pickedDirect.length));
    return [...pickedDirect, ...pickedNeighbors, ...directAll.slice(maxDirect)].slice(0, limit);
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
