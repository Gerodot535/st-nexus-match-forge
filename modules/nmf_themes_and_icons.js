export const NMF_THEMES = [
    { id: 'tavern', name: 'Тема Таверны', sub: 'TAVERN DATING SYNC', color: '#9ca3af' },
    { id: 'krakoa', name: 'Люди Икс: Кракоа', sub: 'HOX // MATCH PROTOCOL', color: '#1de9b6' },
    { id: 'demonic', name: 'Демонический Гримуар', sub: 'ABYSSAL MATCH', color: '#e62e45' },
    { id: 'scroll', name: 'Средневековый Свиток', sub: 'ROYAL COURTSHIP', color: '#9c7121' },
    { id: 'rose', name: 'Розовый Кварц', sub: 'PORCELAIN ROMANCE', color: '#d64d7e' },
    { id: 'manga', name: 'Манга-редакция', sub: 'ROMCOM EDITION', color: '#c93b3b' },
    { id: 'notebook', name: 'Классический Блокнот', sub: 'SECRET DIARY', color: '#b84a27' },
    { id: 'celestial', name: 'Астральный Кодекс', sub: 'STARLIGHT SYNASTRY', color: '#f0c674' },
    { id: 'cyber', name: 'Кибер-Нейролинк', sub: 'NEUROLINK DATING', color: '#00f0ff' },
    { id: 'velvet', name: 'Полуночный Бархат', sub: 'NOCTURNE SALON', color: '#d9468f' },
    { id: 'apothecary', name: 'Изумрудный Гербарий', sub: 'CHEMISTRY LAB', color: '#38d399' },
    { id: 'olympus', name: 'Мрамор и Золото', sub: 'APHRODITE COURT', color: '#b58428' },
    { id: 'abyss', name: 'Океаническая Бездна', sub: 'DEEP RESONANCE', color: '#22d3ee' },
];

export const NMF_LANGUAGES = [
    { id: '{{language}}', label: 'Макрос {{language}} (Авто-язык Таверны)' },
    { id: 'English', label: 'English (Английский — экономия токенов)' },
    { id: 'Русский', label: 'Русский (Russian)' },
    { id: '简体中文', label: '简体中文 (Chinese Simplified)' },
    { id: '繁體中文', label: '繁體中文 (Chinese Traditional)' },
    { id: '日本語', label: '日本語 (Japanese)' },
    { id: '한국어', label: '한국어 (Korean)' },
    { id: 'Español', label: 'Español (Spanish)' },
    { id: 'Deutsch', label: 'Deutsch (German)' },
    { id: 'Português', label: 'Português (Portuguese)' },
    { id: 'hybrid_en_local', label: 'Гибрид: Описание EN + Сцена {{language}}' },
    { id: 'Как в анкете', label: 'По языку текста анкеты' },
    { id: 'custom', label: 'Свой язык / Макрос...' },
];

// All SVG icons carry explicit width & height attributes — sharp technical vectors, zero emojis
export const NMF_ICONS = {
    home: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3V10.5z"/></svg>`,
    crest: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M12 21l-7.5-7.2L2 9l4.5-4.5L12 9l5.5-4.5L22 9l-2.5 4.8L12 21z"/></svg>`,
    rosterBtn: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/><path d="M12 7.5v9M7.5 12h9"/></svg>`,
    flame: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M12 2l4.5 6.5c2 3 2.5 6.5 0 9.5a6.5 6.5 0 0 1-9 0c-2.5-3-2-6.5 0-9.5L12 2z"/><path d="M12 11l2 3a2.5 2.5 0 0 1-4 0l2-3z"/></svg>`,
    heart: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><path d="M12 20.5l-7.8-7.6L2.5 8.8 6.8 4.5 12 9.2l5.2-4.7 4.3 4.3-1.7 4.1L12 20.5z"/></svg>`,
    matches: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="4" width="8" height="11"/><rect x="13" y="4" width="8" height="11"/><path d="M7 18h10"/></svg>`,
    blitz: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
    architect: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polygon points="12,2 22,8.5 12,15 2,8.5"/><polyline points="2,14 12,20.5 22,14"/></svg>`,
    rework: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><polyline points="21,3 21,8 16,8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><polyline points="3,21 3,16 8,16"/></svg>`,
    editor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="4" y="3" width="16" height="18"/><circle cx="12" cy="9" r="2.5"/><path d="M8 17c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5"/></svg>`,
    sliders: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><rect x="7" y="4" width="4" height="4" fill="currentColor"/><rect x="14" y="10" width="4" height="4" fill="currentColor"/><rect x="9" y="16" width="4" height="4" fill="currentColor"/></svg>`,
    palette: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>`,
    gear: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1H8.4l-.1-.1a1.7 1.7 0 0 0-1.9-.3l-.2.1-2-3.4.1-.1a1.7 1.7 0 0 0 .3-1.8v-.2a1.7 1.7 0 0 0-1.1-1.5H3.4v-4h.1a1.7 1.7 0 0 0 1.1-1.5V8.8a1.7 1.7 0 0 0-.3-1.8l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h7.2l.1.1a1.7 1.7 0 0 0 1.9.3l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.8v.2a1.7 1.7 0 0 0 1.1 1.5h.1v4h-.1a1.7 1.7 0 0 0-1.1 1.5z"/></svg>`,
    close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    pause: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    play: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polygon points="6,4 20,12 6,20"/></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>`,
    dislike: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    image: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="3" width="18" height="18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`,
    book: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    save: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M19 21H5V3h11l3 3v15z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>`,
    download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M21 15v4H3v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upload: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M21 15v4H3v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    spark: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polygon points="12,2 14.8,9.2 22,12 14.8,14.8 12,22 9.2,14.8 2,12 9.2,9.2"/></svg>`,
    undo: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polyline points="9,14 4,9 9,4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`,
    editSmall: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    zoom: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="9" y="9" width="12" height="12"/><path d="M5 15H3V3h12v2"/></svg>`,
    doc: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M14 2H6v20h12V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
    minimize: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polyline points="4,14 10,14 10,20"/><polyline points="20,10 14,10 14,4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    minus: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    star: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12,1.5 15.1,8.9 22.5,12 15.1,15.1 12,22.5 8.9,15.1 1.5,12 8.9,8.9"/></svg>`,
    primogem: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polygon points="12,2 16.2,9.8 22,12 16.2,14.2 12,22 7.8,14.2 2,12 7.8,9.8"/><polygon points="12,7.5 14,11 16.5,12 14,13 12,16.5 10,13 7.5,12 10,11"/></svg>`,
    alchemy: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polygon points="12,2 21,12 12,22 3,12"/><polygon points="12,6.5 17.5,12 12,17.5 6.5,12"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
    refFrame: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polyline points="3,8 3,3 8,3"/><polyline points="16,3 21,3 21,8"/><polyline points="21,16 21,21 16,21"/><polyline points="8,21 3,21 3,16"/><circle cx="12" cy="10" r="2.4"/><path d="M8.2 17c0-1.9 1.7-3.1 3.8-3.1s3.8 1.2 3.8 3.1"/></svg>`,
    chevronDown: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><polyline points="6,9 12,15 18,9"/></svg>`,
    help: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.9 2.2c-.9.5-1.4 1.1-1.4 2.1"/><line x1="12" y1="17.2" x2="12.01" y2="17.2"/></svg>`,
    translate: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><path d="M4 5h10M9 3v2M6 5c.6 4.2 3.1 7.6 6.8 9.4"/><path d="M11 8c-.9 2.9-3.1 5.4-6.2 6.8"/><path d="M13 20l4-9 4 9"/><line x1="14.4" y1="17" x2="19.6" y2="17"/></svg>`,
    vault: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="4" width="18" height="16"/><line x1="3" y1="9" x2="21" y2="9"/><rect x="9.5" y="12" width="5" height="3"/></svg>`,
    clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15.5,14"/></svg>`,
    check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><polyline points="4,12.5 9.5,18 20,6.5"/></svg>`,
    crop: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M6 2v14h14"/><path d="M2 6h14v14"/></svg>`,
    sacrifice: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polygon points="12,2 19,9 12,22 5,9"/><line x1="8.5" y1="9" x2="15.5" y2="9"/></svg>`,
    warn: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polygon points="12,3 22,20 2,20"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    globe: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><ellipse cx="12" cy="12" rx="4.2" ry="9.5"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
    layers: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="12,3 21,8 12,13 3,8"/><polyline points="3,12.5 12,17.5 21,12.5"/><polyline points="3,16.8 12,21.8 21,16.8"/></svg>`,
    dice: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/></svg>`,
    unbox: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><polygon points="12,7.5 13.8,11 17.5,12 13.8,13 12,16.5 10.2,13 6.5,12 10.2,11" fill="currentColor" stroke="none"/></svg>`,
    eyeOpen: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>`,
};

export const NMF_FULL_CSS = `
#nmf-dialog {
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    max-width: 100vw;
    max-height: 100dvh;
    width: 100vw;
    height: 100dvh;
    z-index: 2147483600;
}
#nmf-dialog::backdrop {
    background: rgba(4, 6, 11, 0.90);
}
#nmf-dialog[open] {
    display: flex;
    align-items: stretch;
    justify-content: center;
}
@media (min-width: 760px) {
    #nmf-dialog[open] {
        align-items: center;
        padding: 14px;
    }
}

#nmf-window {
    --nmf-bg: var(--SmartThemeBlurTintColor, #10131a);
    --nmf-bg-panel: rgba(16, 20, 28, 0.99);
    --nmf-bg-card: rgba(22, 27, 38, 0.98);
    --nmf-text: var(--SmartThemeBodyColor, #ecf0f6);
    --nmf-text-muted: #91a0b6;
    --nmf-accent: var(--SmartThemeQuoteColor, #4cc9f0);
    --nmf-accent-2: #e0a952;
    --nmf-border: rgba(148, 163, 184, 0.25);
    --nmf-border-active: var(--SmartThemeQuoteColor, #4cc9f0);
    --nmf-btn-fg: #081014;
    --nmf-font-title: Georgia, 'Times New Roman', serif;
    --nmf-font-body: system-ui, -apple-system, 'Segoe UI', sans-serif;
    --nmf-font-mono: ui-monospace, 'Courier New', monospace;
    --nmf-radius: 6px;

    position: relative;
    width: 100%;
    max-width: 540px;
    height: 100dvh;
    max-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--nmf-bg);
    color: var(--nmf-text);
    font-family: var(--nmf-font-body);
    border: none;
    border-top: 2px solid var(--nmf-accent);
    border-radius: 0;
    overflow: hidden;
    box-sizing: border-box;
    contain: layout paint style;
}
@media (min-width: 760px) {
    #nmf-window {
        max-width: 680px;
        height: 90dvh;
        max-height: 90dvh;
        border: 1px solid var(--nmf-border-active);
        border-top: 2.5px solid var(--nmf-accent);
        border-radius: 8px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.78);
    }
}
#nmf-window *, #nmf-window *::before, #nmf-window *::after {
    box-sizing: border-box;
}
#nmf-window button, #nmf-window summary, #nmf-window label, #nmf-window select, #nmf-window input {
    touch-action: manipulation;
}
#nmf-window svg { flex-shrink: 0; }

/* 13 FORGE THEMES */
#nmf-window.nmf-theme-krakoa { --nmf-bg: #0c100f; --nmf-bg-panel: #121816; --nmf-bg-card: #161f1c; --nmf-text: #f2f5f3; --nmf-text-muted: #9ab0a6; --nmf-accent: #1de9b6; --nmf-accent-2: #d99b43; --nmf-border: #283631; --nmf-border-active: #d99b43; --nmf-btn-fg: #07120f; }
#nmf-window.nmf-theme-demonic { --nmf-bg: #0c0406; --nmf-bg-panel: #15070b; --nmf-bg-card: #1d090f; --nmf-text: #f6e3dc; --nmf-text-muted: #b08288; --nmf-accent: #e62e45; --nmf-accent-2: #d6a456; --nmf-border: #4d1923; --nmf-border-active: #d6a456; --nmf-btn-fg: #fff5f6; }
#nmf-window.nmf-theme-scroll { --nmf-bg: #efe0c2; --nmf-bg-panel: #e4cfa7; --nmf-bg-card: #f8eed9; --nmf-text: #2b190d; --nmf-text-muted: #6e5239; --nmf-accent: #8a1c27; --nmf-accent-2: #8c6218; --nmf-border: #bfa375; --nmf-border-active: #8a1c27; --nmf-btn-fg: #fbf2df; }
#nmf-window.nmf-theme-rose { --nmf-bg: #fdf2f6; --nmf-bg-panel: #fae5ee; --nmf-bg-card: #ffffff; --nmf-text: #381d2a; --nmf-text-muted: #8c5e74; --nmf-accent: #d44d7e; --nmf-accent-2: #b57464; --nmf-border: #e6bfd0; --nmf-border-active: #db6590; --nmf-btn-fg: #ffffff; }
#nmf-window.nmf-theme-manga { --nmf-bg: #faf9f5; --nmf-bg-panel: #f1efe8; --nmf-bg-card: #ffffff; --nmf-text: #161618; --nmf-text-muted: #606066; --nmf-accent: #c93b3b; --nmf-accent-2: #161618; --nmf-border: #b8b5ab; --nmf-border-active: #161618; --nmf-btn-fg: #ffffff; }
#nmf-window.nmf-theme-notebook { --nmf-bg: #f6efe0; --nmf-bg-panel: #ede2cb; --nmf-bg-card: #fffdf8; --nmf-text: #2b211c; --nmf-text-muted: #786652; --nmf-accent: #b84a27; --nmf-accent-2: #2b6e58; --nmf-border: #d1bfa1; --nmf-border-active: #b84a27; --nmf-btn-fg: #fffdf8; }
#nmf-window.nmf-theme-celestial { --nmf-bg: #0b0f22; --nmf-bg-panel: #121836; --nmf-bg-card: #172046; --nmf-text: #eef1ff; --nmf-text-muted: #8b95c9; --nmf-accent: #f0c674; --nmf-accent-2: #7aa2f7; --nmf-border: rgba(240,198,116,0.28); --nmf-border-active: #f0c674; --nmf-btn-fg: #0b0f22; }
#nmf-window.nmf-theme-cyber { --nmf-bg: #060912; --nmf-bg-panel: #0b1122; --nmf-bg-card: #0e172d; --nmf-text: #e2f8ff; --nmf-text-muted: #6988a8; --nmf-accent: #00f0ff; --nmf-accent-2: #ff2a6d; --nmf-border: #173452; --nmf-border-active: #00f0ff; --nmf-btn-fg: #041017; }
#nmf-window.nmf-theme-velvet { --nmf-bg: #110815; --nmf-bg-panel: #1b0e22; --nmf-bg-card: #24122e; --nmf-text: #f9edf6; --nmf-text-muted: #b594ad; --nmf-accent: #e05297; --nmf-accent-2: #e8c382; --nmf-border: #4a2346; --nmf-border-active: #e8c382; --nmf-btn-fg: #190714; }
#nmf-window.nmf-theme-apothecary { --nmf-bg: #081310; --nmf-bg-panel: #0f201b; --nmf-bg-card: #132922; --nmf-text: #e9f7f1; --nmf-text-muted: #84ab9c; --nmf-accent: #38d399; --nmf-accent-2: #d4a853; --nmf-border: #1f4237; --nmf-border-active: #38d399; --nmf-btn-fg: #061510; }
#nmf-window.nmf-theme-olympus { --nmf-bg: #f5f1e8; --nmf-bg-panel: #ebe4d5; --nmf-bg-card: #ffffff; --nmf-text: #1f242d; --nmf-text-muted: #686b73; --nmf-accent: #a87924; --nmf-accent-2: #264e70; --nmf-border: #cfc4ae; --nmf-border-active: #a87924; --nmf-btn-fg: #fffdf9; }
#nmf-window.nmf-theme-abyss { --nmf-bg: #040d15; --nmf-bg-panel: #081826; --nmf-bg-card: #0b2133; --nmf-text: #e4f5fc; --nmf-text-muted: #6f9cb3; --nmf-accent: #22d3ee; --nmf-accent-2: #f59e0b; --nmf-border: #143952; --nmf-border-active: #22d3ee; --nmf-btn-fg: #04121a; }

/* APP TOP BAR */
.nmf-header {
    padding: 9px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: var(--nmf-bg-panel);
    border-bottom: 1px solid var(--nmf-border);
    flex-shrink: 0;
}
.nmf-header-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.nmf-crest { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: var(--nmf-accent); border: 1px solid var(--nmf-border-active); background: rgba(128,128,128,0.06); }
.nmf-title-wrap { min-width: 0; flex: 1; }
.nmf-title-main { font-family: var(--nmf-font-title); font-size: 14px; font-weight: 700; letter-spacing: 0.4px; color: var(--nmf-text); display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nmf-title-sub { font-family: var(--nmf-font-mono); font-size: 9px; color: var(--nmf-text-muted); letter-spacing: 0.7px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nmf-header-actions { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }

.nmf-icon-btn {
    height: 32px;
    min-width: 32px;
    padding: 0 9px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-border);
    background: rgba(128,128,128,0.07);
    color: var(--nmf-text);
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}
.nmf-icon-btn.nmf-sq { width: 32px; padding: 0; }
.nmf-icon-btn:hover, .nmf-icon-btn.nmf-active { border-color: var(--nmf-accent); color: var(--nmf-accent); }
.nmf-intake-trigger {
    border-color: var(--nmf-accent);
    background: rgba(128,128,128,0.1);
    color: var(--nmf-accent);
}

/* DRAWERS (THEMES & SETTINGS) */
.nmf-drawer {
    display: none;
    padding: 9px 12px 12px;
    background: var(--nmf-bg-panel);
    border-bottom: 1px solid var(--nmf-border);
    flex-shrink: 0;
    max-height: 68dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
}
.nmf-drawer.nmf-open { display: block; }
.nmf-theme-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
}
.nmf-theme-strip::-webkit-scrollbar { display: none; }
.nmf-theme-chip {
    height: 28px;
    padding: 0 9px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg-card);
    color: var(--nmf-text-muted);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}
.nmf-theme-chip.nmf-active { border-color: var(--nmf-accent); color: var(--nmf-text); box-shadow: inset 2px 0 0 var(--nmf-accent); }
.nmf-theme-swatch { width: 8px; height: 8px; display: inline-block; border: 1px solid rgba(255,255,255,0.35); }

/* COMPACT SESSIONS & FILTER PILL STRIP */
.nmf-sessions-bar {
    padding: 6px 12px;
    background: var(--nmf-bg-panel);
    border-bottom: 1px solid var(--nmf-border);
    display: flex;
    align-items: center;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
}
.nmf-sessions-bar::-webkit-scrollbar { display: none; }
.nmf-sess-tab {
    height: 27px;
    padding: 0 9px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg);
    color: var(--nmf-text-muted);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
}
.nmf-sess-tab.nmf-active {
    border-color: var(--nmf-accent);
    background: var(--nmf-bg-card);
    color: var(--nmf-text);
    box-shadow: inset 0 -2px 0 var(--nmf-accent);
}
.nmf-sess-tab.nmf-frozen { border-style: dashed; opacity: 0.78; }
.nmf-sess-state { font-family: var(--nmf-font-mono); font-size: 8.5px; padding: 1px 4px; border: 1px solid var(--nmf-border); color: var(--nmf-accent-2); }

/* SCROLLABLE APP SCREEN */
.nmf-body {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior: contain;
    padding: 12px 12px 24px;
    display: block;
}
.nmf-body > * + * { margin-top: 10px; }

/* LIGHTWEIGHT FILTER RIBBON (OPEN CANVAS — NO HEAVY BOX) */
.nmf-filter-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 0 8px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--nmf-border);
    border-radius: 0;
}
.nmf-filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
    flex: 1;
}
.nmf-mini-tag {
    font-family: var(--nmf-font-mono);
    font-size: 10px;
    padding: 2px 6px;
    border: 1px solid var(--nmf-border);
    background: rgba(128,128,128,0.05);
    color: var(--nmf-text-muted);
    white-space: nowrap;
}

/* DATING SWIPE DECK & INTERACTIVE CARD */
.nmf-deck-stage {
    position: relative;
    padding: 4px 2px 8px;
    user-select: none;
}
.nmf-deck-backcard {
    position: absolute;
    left: 10px;
    right: 10px;
    top: 10px;
    bottom: 2px;
    background: var(--nmf-bg-card);
    border: 1px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
    opacity: 0.55;
    transform: translateY(5px) scale(0.98);
    pointer-events: none;
}
.nmf-swipe-card {
    position: relative;
    z-index: 2;
    background: var(--nmf-bg-panel);
    border: 1.5px solid var(--nmf-border-active);
    border-radius: var(--nmf-radius);
    box-shadow: 0 12px 30px rgba(0,0,0,0.45);
    overflow: hidden;
    transition: transform 0.22s ease, opacity 0.22s ease;
    will-change: transform;
}
.nmf-swipe-card.nmf-dragging {
    transition: none !important;
    cursor: grabbing;
}

/* SWIPE STAMPS (LIKE / NOPE) */
.nmf-stamp {
    position: absolute;
    top: 18px;
    z-index: 10;
    padding: 5px 12px;
    font-family: var(--nmf-font-mono);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 2px;
    border: 2.5px solid currentColor;
    background: rgba(8, 10, 14, 0.78);
    opacity: 0;
    pointer-events: none;
    text-transform: uppercase;
}
.nmf-stamp-like {
    left: 16px;
    color: #2ce59b;
    transform: rotate(-11deg);
}
.nmf-stamp-nope {
    right: 16px;
    color: #ff4d6d;
    transform: rotate(11deg);
}

/* IN-CARD PHOTO SHIMMER / DEVELOPING ANIMATION (NON-BLOCKING SEQUENTIAL ART!) */
.nmf-photo-loading {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
        linear-gradient(110deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.02) 65%),
        var(--nmf-bg-card);
    background-size: 220% 100%;
    animation: nmfPhotoShimmer 1.6s linear infinite;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    text-align: center;
}
@keyframes nmfPhotoShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -20% 0; }
}
.nmf-photo-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--nmf-border);
    border-top-color: var(--nmf-accent);
    animation: nmfSpin 0.9s linear infinite;
}
@keyframes nmfSpin {
    to { transform: rotate(360deg); }
}

/* HERO VISUAL TOP OF DATING CARD */
.nmf-hero-visual {
    position: relative;
    width: 100%;
    min-height: 230px;
    max-height: 360px;
    background:
        radial-gradient(circle at 80% 18%, rgba(128,128,128,0.16), transparent 55%),
        linear-gradient(165deg, var(--nmf-bg-card), var(--nmf-bg));
    border-bottom: 1px solid var(--nmf-border);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
}
.nmf-hero-visual.nmf-has-photo {
    aspect-ratio: var(--nmf-art-ratio, 1 / 1);
    max-height: 460px;
}
#nmf-window img.nmf-hero-photo,
.nmf-hero-photo {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    object-fit: var(--nmf-art-fit, cover) !important;
    object-position: var(--nmf-art-pos, 50% 6%) !important;
    display: block !important;
    background: #06080e;
}
.nmf-hero-scrim {
    position: relative;
    z-index: 2;
    padding: 36px 14px 13px;
    background: linear-gradient(180deg, transparent 0%, rgba(6, 8, 12, 0.78) 48%, rgba(6, 8, 12, 0.95) 100%);
    color: #f8fafc;
}
.nmf-hero-topbadges {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.nmf-match-badge {
    font-family: var(--nmf-font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.7px;
    padding: 4px 8px;
    background: rgba(8, 12, 16, 0.84);
    border: 1px solid var(--nmf-accent);
    color: var(--nmf-accent);
}
.nmf-art-chip-btn {
    height: 28px;
    padding: 0 9px;
    background: rgba(8, 12, 16, 0.84);
    border: 1px solid rgba(255,255,255,0.32);
    color: #f8fafc;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
.nmf-hero-name {
    font-family: var(--nmf-font-title);
    font-size: 21px;
    font-weight: 700;
    line-height: 1.2;
    color: #ffffff;
}
.nmf-hero-arch {
    margin-top: 3px;
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--nmf-accent-2);
}

.nmf-profile-body {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.nmf-profile-quote {
    padding: 8px 11px;
    border-left: 3px solid var(--nmf-accent);
    background: var(--nmf-bg);
    font-style: italic;
    font-size: 13px;
    line-height: 1.45;
}
.nmf-profile-bio {
    font-size: 13px;
    line-height: 1.54;
}
.nmf-profile-looks {
    font-size: 12px;
    line-height: 1.46;
    color: var(--nmf-text-muted);
    padding-top: 6px;
    border-top: 1px dotted var(--nmf-border);
}

/* DATING ACTION DOCK [NOPE] [BUILD] [LIKE] */
.nmf-dating-dock {
    display: grid;
    grid-template-columns: 1fr 1.35fr 1fr;
    gap: 8px;
    padding-top: 2px;
}
.nmf-dock-btn {
    height: 44px;
    border-radius: var(--nmf-radius);
    border: 1.5px solid var(--nmf-border);
    background: var(--nmf-bg-card);
    color: var(--nmf-text);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}
.nmf-dock-nope { border-color: #ff4d6d; color: #ff6b86; }
.nmf-dock-like { border-color: #2ce59b; color: #2ce59b; }
.nmf-dock-super {
    border-color: var(--nmf-accent);
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
}

/* POST-DISLIKE QUICK FEEDBACK TOAST BAR */
.nmf-feedback-pop {
    padding: 9px 11px;
    background: var(--nmf-bg-card);
    border: 1px solid #ff4d6d;
    border-left: 3px solid #ff4d6d;
    border-radius: var(--nmf-radius);
    display: flex;
    flex-direction: column;
    gap: 7px;
}

/* MATCHES 2-COLUMN GRID (LIKE PINTEREST REF #2) */
.nmf-matches-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
}
.nmf-match-tile {
    background: var(--nmf-bg-card);
    border: 1px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.nmf-match-thumb {
    position: relative;
    width: 100%;
    aspect-ratio: var(--nmf-art-ratio, 1 / 1);
    min-height: 176px;
    background: #070a10;
    border-bottom: 1px solid var(--nmf-border);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 10px;
    overflow: hidden;
}
#nmf-window .nmf-match-thumb img,
.nmf-match-thumb img {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    object-fit: var(--nmf-art-fit, cover) !important;
    object-position: var(--nmf-art-pos, 50% 6%) !important;
    display: block !important;
}

/* SMART ASPECT-AWARE GRID MODES (NATIVE IMAGE PROPORTIONS & 16:9 WIDE 1-COL) */
#nmf-window.nmf-ratio-wide .nmf-matches-grid {
    grid-template-columns: 1fr !important;
}
#nmf-window.nmf-ratio-native .nmf-matches-grid {
    align-items: start;
}
#nmf-window.nmf-ratio-native .nmf-hero-visual.nmf-has-photo {
    aspect-ratio: auto !important;
    min-height: 180px;
    max-height: none !important;
    padding: 0 !important;
    display: block !important;
}
#nmf-window.nmf-ratio-native img.nmf-hero-photo {
    position: relative !important;
    width: 100% !important;
    height: auto !important;
    max-height: none !important;
    object-fit: cover !important;
    object-position: 50% 6% !important;
}
#nmf-window.nmf-ratio-native .nmf-hero-visual.nmf-has-photo .nmf-hero-topbadges {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
}
#nmf-window.nmf-ratio-native .nmf-hero-visual.nmf-has-photo .nmf-hero-scrim {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 26px 12px 10px;
    background: linear-gradient(to top, rgba(4, 6, 11, 0.92) 0%, rgba(4, 6, 11, 0.45) 68%, transparent 100%);
}
#nmf-window.nmf-ratio-native .nmf-match-thumb {
    aspect-ratio: auto !important;
    min-height: 140px;
    padding: 0 !important;
    display: block !important;
}
#nmf-window.nmf-ratio-native .nmf-match-thumb img {
    position: relative !important;
    width: 100% !important;
    height: auto !important;
    max-height: none !important;
    object-fit: cover !important;
    object-position: 50% 6% !important;
}
/* Cropped artworks ALWAYS fill their exact chosen aspect frame with zero side/top bars! */
#nmf-window .nmf-hero-visual.nmf-is-cropped {
    aspect-ratio: var(--cropped-ratio, 1 / 1) !important;
    min-height: 0 !important;
    max-height: none !important;
    padding: 0 !important;
    display: flex !important;
}
#nmf-window .nmf-hero-visual.nmf-is-cropped img.nmf-hero-photo {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: 50% 50% !important;
}
.nmf-rendering-stage {
    min-height: 210px;
    background: radial-gradient(circle at 50% 45%, rgba(128,128,128,0.14), #06080e 78%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    text-align: center;
}
#nmf-window.nmf-ratio-native .nmf-match-thumb .nmf-match-thumb-ov {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0 !important;
    padding: 24px 10px 9px;
    background: linear-gradient(to top, rgba(4, 6, 11, 0.94) 0%, rgba(4, 6, 11, 0.45) 70%, transparent 100%);
}

.nmf-blitz-seed-card {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 8px 10px;
    border: 1px solid var(--nmf-border-active);
    border-left: 3px solid var(--nmf-accent);
    border-radius: var(--nmf-radius);
    background: rgba(128, 128, 128, 0.08);
}
.nmf-blitz-seed-ava {
    width: 54px;
    height: 54px;
    border-radius: 4px;
    border: 1px solid var(--nmf-border-active);
    background: #070a10;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--nmf-accent);
}
#nmf-window .nmf-blitz-seed-ava img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: 50% 6% !important;
    display: block !important;
}

/* INTERACTIVE TOUCH ART CROPPER STAGE */
.nmf-crop-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.nmf-crop-viewport {
    position: relative;
    width: min(100%, 300px);
    background: #05070c;
    border: 2px solid var(--nmf-accent);
    border-radius: 4px;
    overflow: hidden;
    touch-action: none !important;
    user-select: none;
    cursor: grab;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.72);
}
.nmf-crop-viewport:active {
    cursor: grabbing;
}
#nmf-window .nmf-crop-viewport img {
    position: absolute !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: none;
    user-select: none;
    display: block !important;
}
.nmf-crop-grid-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px);
    background-size: 33.333% 33.333%;
}
.nmf-match-click-zone {
    cursor: pointer;
}
.nmf-match-click-zone:hover .nmf-match-thumb {
    filter: brightness(1.06);
}

/* SMART PUZZLE / BENTO MOSAIC GRID FOR MIXED ASPECT RATIOS */
.nmf-mosaic-grid {
    column-count: 2;
    column-gap: 10px;
    width: 100%;
}
.nmf-mosaic-grid > .nmf-match-tile {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 10px;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
}
.nmf-mosaic-grid > .nmf-match-tile.nmf-tile-wide {
    column-span: all;
    display: flex;
}
#nmf-window .nmf-match-tile.nmf-tile-wide .nmf-match-thumb {
    aspect-ratio: var(--tile-aspect, 16 / 9) !important;
    min-height: 132px !important;
    max-height: 245px !important;
}
#nmf-window .nmf-match-tile.nmf-tile-square .nmf-match-thumb {
    aspect-ratio: 1 / 1 !important;
    min-height: 152px !important;
}
#nmf-window .nmf-match-tile.nmf-tile-tall .nmf-match-thumb {
    aspect-ratio: var(--tile-aspect, 2 / 3) !important;
    min-height: 215px !important;
}
#nmf-window .nmf-match-tile.nmf-tile-noart .nmf-match-thumb {
    aspect-ratio: auto !important;
    min-height: 92px !important;
}

/* 5 GACHA RARITY GLOW PALETTES + MATCH RADAR REVEAL + ART MATERIALIZE */
.nmf-wish-stage-modal.nmf-r1-glow {
    background: radial-gradient(circle at 50% 28%, rgba(148, 163, 184, 0.22), transparent 54%), radial-gradient(circle at 50% 60%, rgba(15, 19, 28, 0.97), rgba(4, 6, 12, 0.99));
}
.nmf-wish-stage-modal.nmf-r2-glow {
    background: radial-gradient(circle at 50% 28%, rgba(52, 211, 153, 0.24), transparent 54%), radial-gradient(circle at 50% 60%, rgba(10, 26, 22, 0.97), rgba(4, 6, 12, 0.99));
}
.nmf-wish-stage-modal.nmf-r3-glow {
    background: radial-gradient(circle at 50% 28%, rgba(56, 189, 248, 0.25), transparent 54%), radial-gradient(circle at 50% 60%, rgba(12, 22, 38, 0.97), rgba(4, 6, 12, 0.99));
}
.nmf-wish-stage-modal.nmf-r4-glow {
    background: radial-gradient(circle at 50% 28%, rgba(192, 132, 252, 0.27), transparent 54%), radial-gradient(circle at 50% 60%, rgba(24, 16, 42, 0.97), rgba(4, 6, 12, 0.99));
}
.nmf-wish-stage-modal.nmf-r5-glow {
    background: radial-gradient(circle at 50% 28%, rgba(245, 194, 91, 0.30), transparent 54%), radial-gradient(circle at 50% 60%, rgba(30, 22, 12, 0.97), rgba(4, 6, 12, 0.99));
}

@keyframes nmfArtMaterialize {
    0% { opacity: 0; transform: scale(1.045); filter: brightness(1.75) contrast(1.15); }
    55% { opacity: 1; filter: brightness(1.18) contrast(1.04); }
    100% { opacity: 1; transform: scale(1); filter: brightness(1) contrast(1); }
}
.nmf-art-fresh {
    animation: nmfArtMaterialize 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes nmfMatchPulseRing {
    0% { transform: scale(0.55); opacity: 0.95; }
    100% { transform: scale(1.85); opacity: 0; }
}
.nmf-match-signal-burst {
    position: relative;
    width: 84px;
    height: 84px;
    border: 2px solid var(--nmf-accent);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--nmf-accent);
    background: rgba(8, 12, 20, 0.85);
    box-shadow: 0 0 28px rgba(128, 128, 128, 0.25);
}
.nmf-match-signal-burst::after {
    content: '';
    position: absolute;
    inset: -6px;
    border: 2px solid var(--nmf-accent);
    border-radius: 8px;
    animation: nmfMatchPulseRing 0.95s ease-out infinite;
}

/* SESSION HOME SCREEN LAUNCHPAD */
.nmf-home-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}
.nmf-home-mode-btn {
    padding: 11px 10px;
    border: 1px solid var(--nmf-border);
    border-left: 3px solid var(--nmf-accent);
    border-radius: var(--nmf-radius);
    background: var(--nmf-bg-card);
    color: var(--nmf-text);
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.nmf-home-mode-btn:hover,
.nmf-home-mode-btn.nmf-active {
    border-color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.10);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}
.nmf-intake-spotlight {
    padding: 13px 12px;
    border: 1.5px solid var(--nmf-accent);
    border-left: 4px solid var(--nmf-accent);
    border-radius: var(--nmf-radius);
    background:
        linear-gradient(135deg, rgba(128, 128, 128, 0.11), rgba(128, 128, 128, 0.03)),
        var(--nmf-bg-card);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    gap: 9px;
}
.nmf-section-kicker {
    font-size: 12px;
    font-weight: 700;
    color: var(--nmf-text);
    padding: 0 2px;
}
.nmf-match-thumb-ov {
    position: relative;
    z-index: 2;
    background: linear-gradient(180deg, transparent, rgba(5,7,12,0.88));
    margin: -10px;
    padding: 24px 9px 8px;
    color: #fff;
}

/* BOTTOM NAVIGATION BAR (APP-STYLE) */
.nmf-bottom-nav {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    background: var(--nmf-bg-panel);
    border-top: 1px solid var(--nmf-border);
    flex-shrink: 0;
}
.nmf-nav-item {
    height: 48px;
    padding: 3px 2px;
    border: none;
    border-right: 1px solid var(--nmf-border);
    background: transparent;
    color: var(--nmf-text-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    position: relative;
}
.nmf-nav-item:last-child { border-right: none; }
.nmf-nav-item.nmf-active {
    color: var(--nmf-accent);
    background: var(--nmf-bg-card);
    box-shadow: inset 0 2.5px 0 var(--nmf-accent);
}
.nmf-nav-badge {
    position: absolute;
    top: 4px;
    right: 10px;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
    font-family: var(--nmf-font-mono);
    font-size: 9px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* FULL-WINDOW CLEAN MODAL SHEETS (NO DOUBLE TOP FRAMES, NO GPU BLUR LAG) */
.nmf-sheet-backdrop {
    position: absolute;
    inset: 0;
    z-index: 40;
    background: rgba(5, 7, 12, 0.94);
    display: flex;
    flex-direction: column;
    justify-content: stretch;
}
.nmf-sheet-panel {
    width: 100%;
    height: 100% !important;
    background: var(--nmf-bg);
    border: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
@media (min-width: 760px) {
    .nmf-sheet-backdrop {
        align-items: center;
        justify-content: center;
        padding: 16px;
    }
    .nmf-sheet-panel {
        width: min(100%, 600px);
        height: 92% !important;
        border: 1px solid var(--nmf-border-active);
        border-radius: var(--nmf-radius);
    }
}
.nmf-sheet-head {
    padding: 10px 12px;
    background: var(--nmf-bg-panel);
    border-bottom: 1px solid var(--nmf-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.nmf-sheet-body {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    padding: 12px 12px 22px;
    display: block;
}
.nmf-sheet-body > * + * { margin-top: 10px; }
.nmf-sheet-foot {
    padding: 9px 12px;
    background: var(--nmf-bg-panel);
    border-top: 1px solid var(--nmf-border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

/* MINIMALIST PC-WINDOW LOADER (ZERO GPU BLUR LAG) */
.nmf-loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 60;
    background: rgba(5, 7, 13, 0.90);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.nmf-pc-win {
    width: min(100%, 332px);
    background: var(--nmf-bg-panel);
    border: 1px solid var(--nmf-border-active);
    border-radius: 2px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.72);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.nmf-pc-titlebar {
    height: 32px;
    padding: 0 4px 0 11px;
    background: var(--nmf-bg-card);
    border-bottom: 1px solid var(--nmf-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    user-select: none;
}
.nmf-pc-title-text {
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--nmf-text-muted);
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nmf-pc-win-btns {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}
.nmf-pc-win-btn {
    width: 26px;
    height: 24px;
    border: 1px solid transparent;
    border-radius: 2px;
    background: transparent;
    color: var(--nmf-text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}
.nmf-pc-win-btn:hover {
    border-color: var(--nmf-border);
    background: rgba(128, 128, 128, 0.14);
    color: var(--nmf-text);
}
.nmf-pc-win-btn.nmf-pc-close:hover {
    border-color: #e63950;
    background: #e63950;
    color: #ffffff;
}
.nmf-pc-win-btn:disabled {
    opacity: 0.32;
    cursor: not-allowed;
}
.nmf-pc-body {
    padding: 26px 20px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
}
.nmf-single-spinner {
    width: 52px;
    height: 52px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--nmf-accent);
}
.nmf-single-spinner::before {
    content: '';
    position: absolute;
    inset: 5px;
    border: 1.8px solid var(--nmf-border);
    border-top-color: var(--nmf-accent);
    border-right-color: var(--nmf-accent);
    transform: rotate(45deg);
    animation: nmfPrismTurnCW 1.35s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}
@keyframes nmfPrismTurnCW {
    from { transform: rotate(45deg); }
    to { transform: rotate(405deg); }
}
.nmf-loading-task {
    font-family: var(--nmf-font-mono);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--nmf-text);
}
.nmf-loading-quip {
    max-width: 280px;
    font-family: var(--nmf-font-body);
    font-size: 12px;
    line-height: 1.44;
    color: var(--nmf-text-muted);
}
.nmf-telemetry-dock {
    padding: 5px 12px;
    background: var(--nmf-bg-card);
    border-bottom: 1px solid var(--nmf-accent);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
}
.nmf-telemetry-dock-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    overflow: hidden;
    background: rgba(148, 163, 184, 0.14);
}
.nmf-telemetry-dock-bar::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 36%;
    background: var(--nmf-accent);
    animation: nmfArtPulseSlide 1.2s ease-in-out infinite;
}
.nmf-diamond-ping {
    width: 8px;
    height: 8px;
    border: 1.5px solid var(--nmf-accent);
    transform: rotate(45deg);
    flex-shrink: 0;
    animation: nmfPrismTurnCW 2.2s linear infinite;
}

/* PORTRAIT LIGHTBOX & APPEARANCE SAVER MODAL */
.nmf-lightbox-stage {
    width: 100%;
    max-height: 52dvh;
    min-height: 210px;
    background: #05070b;
    border: 1px solid var(--nmf-border-active);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
}
.nmf-lightbox-stage img {
    max-width: 100%;
    max-height: 52dvh;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
}
.nmf-tappable-photo {
    cursor: zoom-in;
}

/* OPEN-CANVAS SECTIONS (VISUAL DECLUTTER — NO BOX-IN-BOX CLUTTER) */
.nmf-panel {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--nmf-border);
    border-radius: 0;
    padding: 2px 0 13px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.nmf-panel:last-child { border-bottom: none; padding-bottom: 4px; }
.nmf-panel-sub {
    background: rgba(128, 128, 128, 0.045);
    border: 1px solid var(--nmf-border);
    border-radius: 2px;
    padding: 10px 11px;
}
.nmf-modal-card-panel {
    background: var(--nmf-bg-card);
    border: 1px solid var(--nmf-border-active);
    padding: 13px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.nmf-sess-trigger {
    height: 24px;
    padding: 0 7px;
    border: 1px solid var(--nmf-border);
    border-radius: 2px;
    background: rgba(128, 128, 128, 0.08);
    color: var(--nmf-accent);
    font-family: var(--nmf-font-mono);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 136px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nmf-sess-trigger.nmf-active {
    border-color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.16);
}
.nmf-seg-bar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border: 1px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
    overflow: hidden;
    background: var(--nmf-bg);
}
.nmf-seg-bar.nmf-seg-3 { grid-template-columns: repeat(3, 1fr); }
.nmf-seg-btn {
    height: 34px;
    border: none;
    background: transparent;
    color: var(--nmf-text-muted);
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}
.nmf-seg-btn.nmf-active {
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
}

.nmf-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.nmf-label {
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--nmf-text-muted);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
}
#nmf-window input.nmf-input,
#nmf-window select.nmf-select {
    width: 100% !important;
    height: 36px !important;
    min-height: 36px !important;
    max-height: 36px !important;
    margin: 0 !important;
    padding: 0 9px !important;
    background: var(--nmf-bg) !important;
    color: var(--nmf-text) !important;
    border: 1px solid var(--nmf-border) !important;
    border-radius: var(--nmf-radius) !important;
    font-family: var(--nmf-font-body) !important;
    font-size: 12.5px !important;
    line-height: 34px !important;
}
#nmf-window textarea.nmf-textarea {
    width: 100% !important;
    margin: 0 !important;
    padding: 9px 10px !important;
    background: var(--nmf-bg) !important;
    color: var(--nmf-text) !important;
    border: 1px solid var(--nmf-border) !important;
    border-radius: var(--nmf-radius) !important;
    font-family: var(--nmf-font-body) !important;
    font-size: 13px !important;
    line-height: 1.48 !important;
    min-height: 84px;
    resize: vertical;
}
#nmf-window input.nmf-input:focus,
#nmf-window select.nmf-select:focus,
#nmf-window textarea.nmf-textarea:focus {
    border-color: var(--nmf-accent) !important;
    outline: none !important;
}

.nmf-grid-2 { display: grid; grid-template-columns: 1fr; gap: 8px; }
@media (min-width: 480px) { .nmf-grid-2 { grid-template-columns: 1fr 1fr; } }
.nmf-grid-2-compact { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

.nmf-chip-wrap { display: flex; flex-wrap: wrap; gap: 5px; }
.nmf-chip {
    height: 26px;
    padding: 0 8px;
    border-radius: 2px;
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg);
    color: var(--nmf-text-muted);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
.nmf-chip.nmf-on { border-color: var(--nmf-accent); background: var(--nmf-accent); color: var(--nmf-btn-fg); font-weight: 700; }
.nmf-chip.nmf-ban { border-color: #e63950; background: rgba(230, 57, 80, 0.14); color: #ff8fa0; }

.nmf-toggle-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
    background: var(--nmf-bg);
    cursor: pointer;
}
.nmf-switch {
    width: 38px;
    height: 20px;
    border-radius: 2px;
    border: 1px solid var(--nmf-border-active);
    background: rgba(128,128,128,0.16);
    position: relative;
    flex-shrink: 0;
}
.nmf-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 1px;
    background: var(--nmf-text-muted);
    transition: transform 0.16s ease, background 0.16s ease;
}
.nmf-switch.nmf-on { border-color: var(--nmf-accent); }
.nmf-switch.nmf-on::after { transform: translateX(18px); background: var(--nmf-accent); }

.nmf-btn-row { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
.nmf-btn-primary {
    height: 38px;
    padding: 0 14px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-accent);
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}
.nmf-btn-secondary {
    height: 34px;
    padding: 0 11px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-border-active);
    background: transparent;
    color: var(--nmf-text);
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}
.nmf-btn-danger { border-color: #e63950; color: #ff7b90; }
.nmf-btn-primary:disabled, .nmf-btn-secondary:disabled { opacity: 0.5; cursor: wait; }

.nmf-warn-box {
    padding: 8px 10px;
    border: 1px solid var(--nmf-accent-2);
    border-left: 3px solid var(--nmf-accent-2);
    background: rgba(224, 169, 82, 0.10);
    font-size: 11.5px;
    line-height: 1.42;
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.nmf-q-card {
    padding: 11px 12px;
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg-card);
    border-radius: var(--nmf-radius);
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.nmf-q-card.nmf-q-skipped { opacity: 0.48; border-style: dashed; }
.nmf-q-card.nmf-q-answered { border-color: var(--nmf-border-active); }
.nmf-q-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.nmf-q-num {
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
    border: 1px solid var(--nmf-border-active);
    color: var(--nmf-accent);
    background: rgba(128,128,128,0.08);
}
.nmf-q-title {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.44;
    color: var(--nmf-text);
    word-break: break-word;
}
.nmf-q-opt-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.nmf-q-opt-item {
    width: 100%;
    min-height: 36px;
    height: auto !important;
    margin: 0 !important;
    padding: 8px 10px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg);
    color: var(--nmf-text);
    font-size: 12.5px;
    line-height: 1.42;
    white-space: normal !important;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 9px;
}
.nmf-q-opt-item.nmf-checked {
    border-color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.18);
    color: var(--nmf-accent) !important;
    font-weight: 700;
    box-shadow: inset 3px 0 0 var(--nmf-accent);
}
.nmf-q-check-box {
    width: 16px;
    height: 16px;
    margin-top: 1px;
    border-radius: 4px;
    border: 1.5px solid var(--nmf-border-active);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: transparent;
    background: transparent;
}
.nmf-q-opt-item.nmf-checked .nmf-q-check-box {
    border-color: var(--nmf-accent);
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
}

.nmf-empty-deck {
    padding: 28px 16px;
    background: var(--nmf-bg-card);
    border: 1px dashed var(--nmf-border-active);
    border-radius: var(--nmf-radius);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.nmf-art-status-hud {
    width: min(100%, 296px);
    padding: 8px 10px;
    background: rgba(8, 11, 18, 0.88);
    border: 1px solid var(--nmf-border-active);
    border-left: 3px solid var(--nmf-accent);
    display: flex;
    flex-direction: column;
    gap: 5px;
    text-align: left;
    position: relative;
    z-index: 4;
}
.nmf-art-status-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 700;
    color: var(--nmf-accent);
    text-transform: uppercase;
    letter-spacing: 0.4px;
}
.nmf-art-status-detail {
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    line-height: 1.38;
    color: var(--nmf-text);
    word-break: break-word;
}
.nmf-art-status-sub {
    font-family: var(--nmf-font-mono);
    font-size: 9.8px;
    color: var(--nmf-text-muted);
}
.nmf-art-pulse-track {
    width: 100%;
    height: 3px;
    background: rgba(148, 163, 184, 0.18);
    overflow: hidden;
    position: relative;
}
.nmf-art-pulse-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 38%;
    background: var(--nmf-accent);
    animation: nmfArtPulseSlide 1.25s ease-in-out infinite;
}
@keyframes nmfArtPulseSlide {
    0% { left: -40%; }
    100% { left: 102%; }
}
.nmf-editor-art-strip {
    margin-top: 4px;
    padding: 6px 8px;
    border: 1px solid var(--nmf-border-active);
    border-left: 3px solid var(--nmf-accent);
    background: var(--nmf-bg);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

/* =========================================================================
   GACHA WISH BANNER, ASTRAL SUMMON ANIMATION & ALCHEMY COLLECTION (v1.6.0)
   ========================================================================= */
.nmf-gacha-banner {
    position: relative;
    overflow: hidden;
    padding: 15px 13px 14px;
    border: 1px solid var(--nmf-border-active);
    border-top: 2px solid var(--nmf-accent);
    background:
        radial-gradient(circle at 86% 16%, rgba(245, 194, 91, 0.16), transparent 48%),
        radial-gradient(circle at 14% 84%, rgba(124, 92, 255, 0.13), transparent 52%),
        linear-gradient(160deg, var(--nmf-bg-card), var(--nmf-bg));
    display: flex;
    flex-direction: column;
    gap: 11px;
}
.nmf-gacha-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}
.nmf-gacha-kicker {
    font-family: var(--nmf-font-mono);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--nmf-accent);
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
.nmf-gacha-title {
    font-family: var(--nmf-font-title);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--nmf-text);
    margin-top: 2px;
}
.nmf-pity-box {
    text-align: right;
    flex-shrink: 0;
}
.nmf-pity-num {
    font-family: var(--nmf-font-mono);
    font-size: 13px;
    font-weight: 800;
    color: #f5c25b;
}
.nmf-pity-sub {
    font-family: var(--nmf-font-mono);
    font-size: 9px;
    color: var(--nmf-text-muted);
    text-transform: uppercase;
}
.nmf-pity-track {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 4px;
}
.nmf-pity-pip {
    height: 5px;
    background: rgba(148, 163, 184, 0.18);
    border: 1px solid var(--nmf-border);
}
.nmf-pity-pip.nmf-filled {
    background: var(--nmf-accent);
    border-color: var(--nmf-accent);
}
.nmf-pity-pip.nmf-gold {
    border-color: rgba(245, 194, 91, 0.65);
}
.nmf-pity-pip.nmf-gold.nmf-filled {
    background: #f5c25b;
    border-color: #f5c25b;
    box-shadow: 0 0 8px rgba(245, 194, 91, 0.6);
}
.nmf-plus-tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 7px;
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 700;
    border: 1px solid var(--nmf-border-active);
    background: rgba(128, 128, 128, 0.09);
    color: var(--nmf-text);
}
.nmf-wish-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 2px;
}
.nmf-wish-btn {
    height: 42px;
    padding: 0 10px;
    border: 1px solid var(--nmf-border-active);
    background: var(--nmf-bg-panel);
    color: var(--nmf-text);
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
}
.nmf-wish-btn.nmf-wish-gold {
    border-color: #f5c25b;
    background: linear-gradient(135deg, #f5c25b 0%, #d99326 100%);
    color: #171005;
}
.nmf-wish-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

/* WISH COMET & TROPHY REVEAL STAGE */
.nmf-wish-stage-modal {
    position: absolute;
    inset: 0;
    z-index: 58;
    background: radial-gradient(circle at 50% 35%, rgba(28, 25, 54, 0.96), rgba(4, 6, 12, 0.98));
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 14px 12px 18px;
}
.nmf-wish-stage-modal.nmf-ssr-glow {
    background:
        radial-gradient(circle at 50% 24%, rgba(245, 194, 91, 0.24), transparent 52%),
        radial-gradient(circle at 50% 55%, rgba(24, 20, 42, 0.97), rgba(4, 6, 12, 0.99));
}
.nmf-wish-stage-modal.nmf-sr-glow {
    background:
        radial-gradient(circle at 50% 24%, rgba(168, 85, 247, 0.24), transparent 52%),
        radial-gradient(circle at 50% 55%, rgba(18, 22, 44, 0.97), rgba(4, 6, 12, 0.99));
}
.nmf-comet-flight {
    position: relative;
    flex: 1;
    min-height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.nmf-comet-beam {
    width: 190px;
    height: 3px;
    background: linear-gradient(90deg, transparent, #ffffff, var(--wish-color, #f5c25b));
    box-shadow: 0 0 22px var(--wish-color, #f5c25b);
    transform: rotate(-32deg);
    animation: nmfCometStreak 1.05s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes nmfCometStreak {
    0% { transform: translate(-180px, -140px) rotate(-32deg) scaleX(0.4); opacity: 0; }
    35% { opacity: 1; }
    85% { transform: translate(40px, 28px) rotate(-32deg) scaleX(1.35); opacity: 1; }
    100% { transform: translate(150px, 105px) rotate(-32deg) scaleX(2.1); opacity: 0; }
}
.nmf-comet-burst {
    width: 68px;
    height: 68px;
    color: var(--wish-color, #f5c25b);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: nmfStarBurst 1.05s ease-out forwards;
}
@keyframes nmfStarBurst {
    0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
    55% { transform: scale(1.18) rotate(45deg); opacity: 1; }
    100% { transform: scale(1.7) rotate(90deg); opacity: 0.95; }
}

.nmf-gacha-card {
    position: relative;
    border: 1.5px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
    background: var(--nmf-bg-panel);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: nmfRevealCardIn 0.32s ease-out;
}
.nmf-gacha-card.nmf-stars-3 { border-color: #38bdf8; }
.nmf-gacha-card.nmf-stars-4 { border-color: #a855f7; box-shadow: 0 6px 20px rgba(168, 85, 247, 0.16); }
.nmf-gacha-card.nmf-stars-5 {
    border-color: #f5c25b;
    box-shadow: 0 8px 28px rgba(245, 194, 91, 0.22);
}
@keyframes nmfRevealCardIn {
    from { transform: translateY(10px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
}
.nmf-star-row {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: #94a3b8;
}
.nmf-star-row.nmf-stars-2 { color: #34d399; }
.nmf-star-row.nmf-stars-3 { color: #38bdf8; }
.nmf-star-row.nmf-stars-4 { color: #c084fc; }
.nmf-star-row.nmf-stars-5 {
    color: #f5c25b;
    filter: drop-shadow(0 0 5px rgba(245, 194, 91, 0.5));
}
.nmf-star-pill {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px 6px;
    border-radius: 4px;
    background: rgba(6, 9, 15, 0.84);
    border: 1px solid rgba(255, 255, 255, 0.16);
}

/* CLEAN SPOILERS (<details class="nmf-spoiler">) & HELP '?' POPOVERS (v1.7.0) */
details.nmf-spoiler {
    border: 1px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
    background: rgba(128, 128, 128, 0.04);
    overflow: hidden;
}
details.nmf-spoiler > summary {
    list-style: none;
    padding: 9px 11px;
    font-family: var(--nmf-font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--nmf-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    user-select: none;
}
details.nmf-spoiler > summary::-webkit-details-marker { display: none; }
details.nmf-spoiler[open] > summary {
    border-bottom: 1px solid var(--nmf-border);
    color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.07);
}
.nmf-spoiler-body {
    padding: 10px 11px;
    display: flex;
    flex-direction: column;
    gap: 9px;
}

.nmf-help-q {
    width: 18px;
    height: 18px;
    padding: 0;
    border-radius: 4px;
    border: 1px solid var(--nmf-border-active);
    background: rgba(128, 128, 128, 0.10);
    color: var(--nmf-accent);
    font-family: var(--nmf-font-mono);
    font-size: 10.5px;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.nmf-help-q:hover {
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
}

.nmf-slot-strip {
    display: flex;
    align-items: center;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
}
.nmf-slot-strip::-webkit-scrollbar { display: none; }
.nmf-slot-btn {
    height: 29px;
    padding: 0 9px;
    border-radius: var(--nmf-radius);
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg);
    color: var(--nmf-text-muted);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
}
.nmf-slot-btn.nmf-active {
    border-color: var(--nmf-accent);
    background: var(--nmf-bg-card);
    color: var(--nmf-text);
    box-shadow: inset 0 -2px 0 var(--nmf-accent);
}
.nmf-slot-dot {
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: var(--nmf-accent-2);
}

/* ALCHEMY FUSION ALTAR & GACHA COLLECTION */
.nmf-alchemy-altar {
    padding: 12px;
    border: 1px solid var(--nmf-border-active);
    background:
        radial-gradient(circle at 50% 0%, rgba(128, 128, 128, 0.10), transparent 65%),
        var(--nmf-bg-card);
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.nmf-fusion-slots {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
}
.nmf-fusion-slot {
    min-height: 76px;
    padding: 7px 6px;
    border: 1px dashed var(--nmf-border-active);
    background: var(--nmf-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-align: center;
    position: relative;
}
.nmf-fusion-slot.nmf-filled {
    border-style: solid;
    border-color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.08);
}
.nmf-fusion-thumb {
    width: 34px;
    height: 34px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--nmf-accent);
}

/* ── v1.9.0 NEUTRAL UNIFORM HOME CARDS & COLLECTIBLE SHOWCASE ── */
.nmf-home-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.nmf-hcard {
    background: var(--nmf-bg-card);
    border: 1px solid var(--nmf-border);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.nmf-hcard.nmf-hcard-open,
.nmf-hcard.nmf-hcard-accent {
    border-color: var(--nmf-border-active);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22);
}
.nmf-hcard-head {
    padding: 11px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}
.nmf-hcard-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
}
.nmf-hcard-icon {
    width: 34px;
    height: 34px;
    border-radius: 7px;
    border: 1px solid var(--nmf-border);
    background: rgba(128, 128, 128, 0.08);
    color: var(--nmf-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.nmf-hcard-info {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.nmf-hcard-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--nmf-text);
    line-height: 1.25;
}
.nmf-hcard-sub {
    font-size: 11px;
    color: var(--nmf-text-muted);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nmf-hcard-btn {
    height: 30px;
    min-width: 88px;
    padding: 0 11px;
    border-radius: 6px;
    border: 1px solid var(--nmf-border-active);
    background: rgba(128, 128, 128, 0.08);
    color: var(--nmf-text);
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex-shrink: 0;
    white-space: nowrap;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.nmf-hcard-btn:hover,
.nmf-hcard-btn.nmf-on {
    background: var(--nmf-accent);
    border-color: var(--nmf-accent);
    color: var(--nmf-btn-fg);
}
.nmf-hcard-body {
    padding: 11px 12px 13px;
    border-top: 1px solid var(--nmf-border);
    background: rgba(128, 128, 128, 0.03);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.nmf-theme-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
}
.nmf-theme-card-opt {
    padding: 8px 9px;
    border-radius: 6px;
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg);
    color: var(--nmf-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    min-width: 0;
}
.nmf-theme-card-opt.nmf-active {
    border-color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.11);
    box-shadow: inset 2px 0 0 var(--nmf-accent);
}
.nmf-theme-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
}

.nmf-sess-list-grid {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 190px;
    overflow-y: auto;
}
.nmf-sess-row-card {
    padding: 7px 9px;
    border-radius: 6px;
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg);
    color: var(--nmf-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
}
.nmf-sess-row-card.nmf-active {
    border-color: var(--nmf-accent);
    background: rgba(128, 128, 128, 0.10);
}

.nmf-art-bottom-spoiler {
    border: 1px dashed var(--nmf-border);
    border-radius: 8px;
    background: rgba(128, 128, 128, 0.03);
    overflow: hidden;
}
.nmf-art-bottom-spoiler > summary {
    list-style: none;
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--nmf-text-muted);
}
.nmf-art-bottom-spoiler > summary::-webkit-details-marker { display: none; }
.nmf-art-bottom-spoiler[open] {
    border-style: solid;
    border-color: var(--nmf-border-active);
    background: var(--nmf-bg-card);
}
.nmf-art-bottom-spoiler[open] > summary {
    color: var(--nmf-text);
    border-bottom: 1px solid var(--nmf-border);
}

/* ── SEALED COLLECTIBLE UNPACK STAGE (MATCH & GACHA ONLINE PULL AESTHETIC) ── */
.nmf-unpack-stage-modal {
    position: absolute;
    inset: 0;
    z-index: 62;
    display: flex;
    flex-direction: column;
    background-color: #090b12;
    background-size: cover;
    background-position: center;
    overflow-y: auto;
    padding: 14px;
}
.nmf-unpack-stage-scrim {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 42%, rgba(8, 10, 18, 0.36), rgba(6, 8, 14, 0.88) 82%);
}
.nmf-unpack-inner {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
}
.nmf-sealed-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 16px 8px;
    text-align: center;
}
.nmf-sealed-card-totem {
    width: 176px;
    height: 254px;
    border-radius: 10px;
    border: 1.5px solid var(--seal-color, #f0c674);
    background:
        radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.11), transparent 62%),
        linear-gradient(160deg, rgba(24, 28, 42, 0.94), rgba(10, 12, 20, 0.97));
    box-shadow:
        0 14px 36px rgba(0, 0, 0, 0.65),
        0 0 28px var(--seal-glow, rgba(240, 198, 116, 0.32));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    position: relative;
    animation: nmfSealedFloat 2.8s ease-in-out infinite;
    will-change: transform;
}
.nmf-sealed-card-totem::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    pointer-events: none;
}
@keyframes nmfSealedFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
}
.nmf-unpack-cta-btn {
    min-height: 42px;
    padding: 0 22px;
    border-radius: 8px;
    border: 1.5px solid var(--seal-color, var(--nmf-accent));
    background: rgba(12, 15, 24, 0.88);
    color: #f8fafc;
    font-size: 13.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 18px var(--seal-glow, rgba(240, 198, 116, 0.25));
    transition: transform 0.15s ease, background 0.15s ease;
}
.nmf-unpack-cta-btn:hover {
    transform: translateY(-1px);
    background: var(--seal-color, var(--nmf-accent));
    color: #0b0e14;
}
.nmf-unpacked-card-enter {
    animation: nmfCardUnpackReveal 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change: transform, opacity;
}
@keyframes nmfCardUnpackReveal {
    0% { opacity: 0; transform: perspective(700px) rotateY(65deg) scale(0.88); }
    65% { opacity: 1; transform: perspective(700px) rotateY(-4deg) scale(1.02); }
    100% { opacity: 1; transform: perspective(700px) rotateY(0deg) scale(1); }
}

/* ── FRESH ART CURTAIN ("OPEN IMAGE" PER THEME) ── */
.nmf-art-veil-layer {
    position: absolute;
    inset: 0;
    z-index: 6;
    background:
        radial-gradient(circle at 50% 45%, rgba(28, 32, 48, 0.86), rgba(9, 11, 18, 0.96));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px;
    text-align: center;
}
.nmf-art-open-btn {
    min-height: 36px;
    padding: 0 16px;
    border-radius: 7px;
    border: 1.5px solid var(--nmf-accent);
    background: rgba(14, 18, 28, 0.92);
    color: #f8fafc;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.48);
}
.nmf-art-open-btn:hover {
    background: var(--nmf-accent);
    color: var(--nmf-btn-fg);
}
.nmf-art-just-opened {
    animation: nmfArtCurtainLift 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change: transform, opacity;
}
@keyframes nmfArtCurtainLift {
    0% { opacity: 0.15; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
}

/* ── LIVING ALTAR OF FUSION BLOCK ANIMATION ── */
.nmf-altar-shrine {
    position: relative;
    border-radius: 8px;
    border: 1px solid var(--nmf-border-active);
    background-color: var(--nmf-bg-card);
    background-size: cover;
    background-position: center 42%;
    overflow: hidden;
}
.nmf-altar-shrine-overlay {
    position: relative;
    z-index: 1;
    background: linear-gradient(180deg, rgba(10, 12, 20, 0.78), rgba(10, 12, 20, 0.92));
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.nmf-altar-shrine.nmf-altar-working {
    border-color: #f5c25b;
    box-shadow: 0 0 26px rgba(245, 194, 91, 0.28);
}
.nmf-altar-ritual-stage {
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
}
.nmf-altar-ring-wrap {
    position: relative;
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.nmf-altar-ring-outer {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px dashed #f5c25b;
    animation: nmfAltarSpin 7s linear infinite;
    will-change: transform;
}
.nmf-altar-ring-inner {
    position: absolute;
    inset: 14px;
    border-radius: 50%;
    border: 1.5px solid #c084fc;
    opacity: 0.85;
    animation: nmfAltarSpinRev 4.5s linear infinite;
    will-change: transform;
}
.nmf-altar-core-gem {
    color: #f5c25b;
    animation: nmfAltarPulse 1.4s ease-in-out infinite;
    will-change: transform, opacity;
}
@keyframes nmfAltarSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
@keyframes nmfAltarSpinRev {
    0% { transform: rotate(360deg); }
    100% { transform: rotate(0deg); }
}
@keyframes nmfAltarPulse {
    0%, 100% { transform: scale(0.94); opacity: 0.82; }
    50% { transform: scale(1.14); opacity: 1; }
}
.nmf-altar-donor-converge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.nmf-altar-donor-orb {
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid rgba(245, 194, 91, 0.55);
    background: rgba(15, 18, 28, 0.88);
    font-size: 10.5px;
    font-weight: 700;
    color: #f8fafc;
    animation: nmfDonorConverge 1.6s ease-in-out infinite alternate;
    will-change: transform;
}
@keyframes nmfDonorConverge {
    0% { transform: translateY(2px) scale(0.97); }
    100% { transform: translateY(-3px) scale(1.03); }
}
`;
