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
    warn: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="square"><polygon points="12,3 22,20 2,20"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
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
    background: rgba(3, 5, 10, 0.82);
    backdrop-filter: blur(5px);
}
#nmf-dialog[open] {
    display: flex;
    align-items: flex-end;
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
    --nmf-bg-panel: rgba(16, 20, 28, 0.98);
    --nmf-bg-card: rgba(22, 27, 38, 0.96);
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
    --nmf-radius: 4px;

    position: relative;
    width: 100%;
    max-width: 540px;
    height: 95dvh;
    max-height: 95dvh;
    display: flex;
    flex-direction: column;
    background: var(--nmf-bg);
    color: var(--nmf-text);
    font-family: var(--nmf-font-body);
    border: 1px solid var(--nmf-border-active);
    border-top: 2.5px solid var(--nmf-accent);
    border-radius: 4px 4px 0 0;
    box-shadow: 0 -14px 48px rgba(0, 0, 0, 0.82);
    overflow: hidden;
    box-sizing: border-box;
}
@media (min-width: 760px) {
    #nmf-window {
        max-width: 680px;
        height: 90dvh;
        border-radius: 4px;
    }
}
#nmf-window *, #nmf-window *::before, #nmf-window *::after {
    box-sizing: border-box;
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
    padding: 9px 12px;
    background: var(--nmf-bg-panel);
    border-bottom: 1px solid var(--nmf-border);
    flex-shrink: 0;
    max-height: 46dvh;
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

/* DATING FILTER SUMMARY BAR ON DISCOVER SCREEN */
.nmf-filter-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    background: var(--nmf-bg-card);
    border: 1px solid var(--nmf-border);
    border-radius: var(--nmf-radius);
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
    background: var(--nmf-bg);
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
    max-height: 430px;
}
.nmf-hero-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--nmf-art-fit, cover);
    object-position: var(--nmf-art-pos, center 18%);
    display: block;
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
    height: 138px;
    background: linear-gradient(155deg, var(--nmf-bg-panel), var(--nmf-bg));
    border-bottom: 1px solid var(--nmf-border);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 10px;
    overflow: hidden;
}
.nmf-match-thumb img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--nmf-art-fit, cover);
    object-position: var(--nmf-art-pos, center 18%);
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

/* SEPARATE INTAKE PREFERENCES MODAL SHEET */
.nmf-sheet-backdrop {
    position: absolute;
    inset: 0;
    z-index: 40;
    background: rgba(4, 6, 12, 0.84);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}
.nmf-sheet-panel {
    height: 90%;
    background: var(--nmf-bg);
    border-top: 2.5px solid var(--nmf-accent);
    display: flex;
    flex-direction: column;
    overflow: hidden;
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

/* INTERACTIVE LOADING RADAR OVERLAY WITH WITTY THEME QUIPS */
.nmf-loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 60;
    background: rgba(6, 9, 15, 0.88);
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    gap: 14px;
}
.nmf-radar-box {
    width: 68px;
    height: 68px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--nmf-accent);
}
.nmf-radar-ring {
    position: absolute;
    inset: 0;
    border: 2px solid var(--nmf-accent);
    animation: nmfPulseRing 1.8s ease-out infinite;
}
.nmf-radar-ring:nth-child(2) {
    animation-delay: 0.9s;
    border-color: var(--nmf-accent-2);
}
@keyframes nmfPulseRing {
    0% { transform: scale(0.55) rotate(45deg); opacity: 0.95; }
    100% { transform: scale(1.25) rotate(45deg); opacity: 0; }
}
.nmf-loading-task {
    font-family: var(--nmf-font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--nmf-accent);
}
.nmf-loading-quip {
    max-width: 360px;
    font-family: var(--nmf-font-title);
    font-size: 15px;
    line-height: 1.45;
    color: #f1f5f9;
    min-height: 44px;
}
.nmf-loading-timer {
    font-family: var(--nmf-font-mono);
    font-size: 11px;
    color: var(--nmf-text-muted);
}

/* PANELS, FORMS, SWITCHES & CHIPS */
.nmf-panel {
    background: var(--nmf-bg-card);
    border: 1px solid var(--nmf-border);
    border-left: 3px solid var(--nmf-accent);
    border-radius: var(--nmf-radius);
    padding: 11px 12px;
    display: flex;
    flex-direction: column;
    gap: 9px;
}
.nmf-panel-sub { border-left-color: var(--nmf-accent-2); }
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
    padding: 9px 10px;
    border: 1px solid var(--nmf-border);
    background: var(--nmf-bg-card);
    border-radius: var(--nmf-radius);
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.nmf-q-card.nmf-q-skipped { opacity: 0.48; border-style: dashed; }
.nmf-q-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.nmf-q-title { font-size: 12.5px; font-weight: 700; line-height: 1.4; flex: 1; }

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
`;
