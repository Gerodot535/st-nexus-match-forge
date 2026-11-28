// ═══════════════════════════════════════════════════════════════════════════
// NEXUSMATCH FORGE v2.1.0 — TEMPLATE MANAGER, PHOTO-TO-CHAR LAB & CONCEPT ART LAB
// Strictly zero emojis in code/UI/prompts, zero pill radius, explicit SVG dimensions.
// ═══════════════════════════════════════════════════════════════════════════

import { NMF_ICONS } from './nmf_themes_and_icons.js?v=2.1.34';
import { tx, isEn, localizeOptionLabel } from './nmf_i18n.js?v=2.1.34';
import {
    CARD_FORMAT_HUMAN_GUIDES,
    CONCEPT_SERIES_COUNT_OPTIONS,
    CONCEPT_QUESTION_COUNT_OPTIONS,
    getAllCardFormats,
    resolveCardFormat,
    listConceptSelectableCandidates,
    resolveConceptSeedCandidate,
    hasActiveConceptCaptions,
    formatQuestionUserDecision,
    isWorldOrRpgMode,
} from './nmf_templates_and_prompts.js?v=2.1.34';
import { resolveEntityDisplayUrl } from './nmf_media_vault.js?v=2.1.34';
import {
    detectImageExtensions,
    listImageExtensionBuckets,
    getSupportedAspectRatiosForImageConfig,
} from './nmf_card_io_and_art.js?v=2.1.34';

export function renderTemplateManagerWidgetHtml({
    sess,
    cfg,
    state,
    esc,
    rosterChars = [],
}) {
    const it = sess.intake || {};
    const allFormats = getAllCardFormats(cfg.customCardFormats);
    const curFmt = resolveCardFormat(it.cardFormat, cfg.customCardFormats, it);
    const isCustom = Boolean(curFmt.isCustom);
    const fmtGuideRu = CARD_FORMAT_HUMAN_GUIDES[curFmt.id] || {
        shortBtn: curFmt.shortBtn || curFmt.name,
        explain: curFmt.desc || '',
    };
    const fmtFullTitle = isCustom ? curFmt.name : localizeOptionLabel('cardFormatName', curFmt.id, curFmt.name);
    const fmtExplain = isCustom ? (curFmt.desc || '') : localizeOptionLabel('cardFormatExplain', curFmt.id, fmtGuideRu.explain);

    const inspectorOpen = Boolean(state.tplInspectorOpen);
    const newTplOpen = Boolean(state.tplCreatorOpen);
    const extractorOpen = Boolean(state.tplExtractorOpen);
    const qLower = String(state.tplExtractFilter || '').trim().toLowerCase();
    const filteredRoster = qLower
        ? rosterChars.filter((c) => String(c.name || '').toLowerCase().includes(qLower) || String(c.avatar || '').toLowerCase().includes(qLower))
        : rosterChars;

    return `
    <div style="display:flex;flex-direction:column;gap:8px">
        <div class="nmf-chip-wrap">
            ${allFormats.map((f) => {
                const gRu = CARD_FORMAT_HUMAN_GUIDES[f.id] || { shortBtn: f.shortBtn || f.name };
                const btnText = f.isCustom ? (f.shortBtn || f.name) : localizeOptionLabel('cardFormatShort', f.id, gRu.shortBtn);
                return `<button type="button" class="nmf-chip ${curFmt.id === f.id ? 'nmf-on' : ''}" data-act="pick-home-format" data-fmt="${esc(f.id)}" ${sess.frozen ? 'disabled' : ''}>${esc(btnText)}</button>`;
            }).join('')}
        </div>

        <div style="padding:8px 10px;border-left:2px solid var(--nmf-accent);background:var(--nmf-bg);border-radius:6px;font-size:12px;line-height:1.45">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:2px">
                <span style="font-weight:700;color:var(--nmf-accent)">${esc(fmtFullTitle)}</span>
                ${isCustom ? `<span style="font-family:var(--nmf-font-mono);font-size:9.5px;padding:1px 6px;border-radius:4px;border:1px solid var(--nmf-accent);color:var(--nmf-accent)">${esc(tx('СВОЙ ШАБЛОН', 'CUSTOM'))}</span>` : ''}
            </div>
            <div style="color:var(--nmf-text-muted)">${esc(fmtExplain)}</div>
        </div>

        <div class="nmf-chip-wrap">
            <button type="button" class="nmf-chip ${inspectorOpen ? 'nmf-on' : ''}" data-act="toggle-tpl-inspector">
                ${NMF_ICONS.eyeOpen} <span>${esc(inspectorOpen ? tx('Скрыть промпт анкеты', 'Hide Template Prompt') : tx('Промпт анкеты', 'View Template Prompt'))}</span>
            </button>
            <button type="button" class="nmf-chip ${newTplOpen ? 'nmf-on' : ''}" data-act="toggle-tpl-creator" ${sess.frozen ? 'disabled' : ''}>
                ${NMF_ICONS.plus} <span>${esc(tx('Своя анкета', 'Add Custom Template'))}</span>
            </button>
            <button type="button" class="nmf-chip ${extractorOpen ? 'nmf-on' : ''}" data-act="toggle-tpl-extractor" ${sess.frozen ? 'disabled' : ''}>
                ${NMF_ICONS.templateExtract} <span>${esc(tx('Шаблон из чара (ИИ)', 'Extract from Char (AI)'))}</span>
            </button>
        </div>

        ${inspectorOpen ? `
        <div class="nmf-tpl-inspector">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
                <span style="font-size:11.5px;font-weight:700;color:var(--nmf-text)">
                    ${esc(isCustom
                        ? tx('Редактирование вашего шаблона анкеты', 'Edit Your Custom Template')
                        : tx('Промпт шаблона анкеты (можно свободно редактировать)', 'Template Prompt (freely editable)'))}
                </span>
                <div style="display:inline-flex;gap:5px;flex-wrap:wrap">
                    ${!isCustom && curFmt.hasOverride ? `
                    <button type="button" class="nmf-chip" data-act="reset-builtin-tpl" data-fmt="${esc(curFmt.id)}" ${sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.undo} <span>${esc(tx('Сбросить к стандарту', 'Reset Default'))}</span>
                    </button>` : ''}
                    ${!isCustom ? `
                    <button type="button" class="nmf-chip" data-act="clone-builtin-tpl" data-fmt="${esc(curFmt.id)}" ${sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.copy} <span>${esc(tx('Дублировать отдельно', 'Duplicate as New'))}</span>
                    </button>` : `
                    <button type="button" class="nmf-chip" style="border-color:#e05a6d;color:#e05a6d" data-act="delete-custom-tpl" data-fmt="${esc(curFmt.id)}" ${sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.trash} <span>${esc(tx('Удалить шаблон', 'Delete'))}</span>
                    </button>`}
                </div>
            </div>
            ${isCustom ? `
            <div class="nmf-grid-2-compact">
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Короткая кнопка', 'Short Chip Label'))}</label>
                    <input type="text" class="nmf-input" data-custom-tpl-field="shortBtn" data-fmt="${esc(curFmt.id)}" value="${esc(curFmt.shortBtn || '')}"/>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Полное название', 'Full Title'))}</label>
                    <input type="text" class="nmf-input" data-custom-tpl-field="name" data-fmt="${esc(curFmt.id)}" value="${esc(curFmt.name || '')}"/>
                </div>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Краткое пояснение', 'Short Description'))}</label>
                <input type="text" class="nmf-input" data-custom-tpl-field="desc" data-fmt="${esc(curFmt.id)}" value="${esc(curFmt.desc || '')}"/>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Промпт структуры для ИИ (чистые ## Заголовки без скобок)', 'AI Formatting Instructions (clean ## Headings)'))}</label>
                <textarea class="nmf-textarea" style="min-height:130px;font-family:var(--nmf-font-mono);font-size:11px" data-custom-tpl-field="instructions" data-fmt="${esc(curFmt.id)}" ${sess.frozen ? 'disabled' : ''}>${esc(curFmt.instructions || '')}</textarea>
            </div>` : `
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Промпт структуры анкеты для ИИ (изменения сохраняются автоматически)', 'AI Template Structure Prompt (saved automatically)'))}</label>
                <textarea class="nmf-textarea" style="min-height:130px;font-family:var(--nmf-font-mono);font-size:11px" data-builtin-tpl-instr="${esc(curFmt.id)}" ${sess.frozen ? 'disabled' : ''}>${esc(curFmt.instructions || '')}</textarea>
            </div>`}
        </div>` : ''}

        ${newTplOpen ? `
        <div class="nmf-tpl-inspector">
            <div style="font-size:12px;font-weight:700;color:var(--nmf-accent)">${esc(tx('Новая пользовательская анкета', 'Create New Custom Template'))}</div>
            <div class="nmf-grid-2-compact">
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Название кнопки', 'Short Chip Name'))}</label>
                    <input type="text" class="nmf-input" data-new-tpl="shortBtn" value="${esc(state.newTplDraft?.shortBtn || '')}" placeholder="${esc(tx('Например: Моё досье', 'e.g. My Dossier'))}"/>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Краткое описание', 'Brief Note'))}</label>
                    <input type="text" class="nmf-input" data-new-tpl="desc" value="${esc(state.newTplDraft?.desc || '')}" placeholder="${esc(tx('Для каких карточек этот шаблон...', 'What kind of cards is this for...'))}"/>
                </div>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Промпт структуры анкеты (используйте ## Заголовок, {{char}} и {{user}})', 'Template Instructions (use ## Heading, {{char}} & {{user}})'))}</label>
                <textarea class="nmf-textarea" style="min-height:120px;font-family:var(--nmf-font-mono);font-size:11px" data-new-tpl="instructions" placeholder="${esc(tx('## ЛИЧНОСТЬ\n- Имя, возраст, роль...\n## ВНЕШНОСТЬ\n...\n## ХАРАКТЕР И РЕЧЬ\n...', '## CORE IDENTITY\n...\n## APPEARANCE\n...\n## PERSONALITY & VOICE\n...'))}">${esc(state.newTplDraft?.instructions || '')}</textarea>
            </div>
            <div class="nmf-btn-row" style="justify-content:flex-end">
                <button type="button" class="nmf-btn-secondary" data-act="toggle-tpl-creator">${esc(tx('Отмена', 'Cancel'))}</button>
                <button type="button" class="nmf-btn-primary" data-act="save-new-custom-tpl">${NMF_ICONS.check} ${esc(tx('Сохранить и выбрать', 'Save & Select'))}</button>
            </div>
        </div>` : ''}

        ${extractorOpen ? `
        <div class="nmf-tpl-inspector">
            <div style="font-size:12px;font-weight:700;color:var(--nmf-accent)">${esc(tx('Сделать универсальный шаблон на основе готового чара', 'Extract Reusable Template from Character Card'))}</div>
            <div style="font-size:11.5px;color:var(--nmf-text-muted);line-height:1.4">
                ${esc(tx('ИИ прочитает анкету выбранного персонажа, уберёт чужие имена и сюжет, приведет заголовки к чистому виду «## Заголовок» и сохранит готовый шаблон для будущих генераций.', 'AI analyzes the selected character card, removes specific names/lore, converts headers to clean "## Heading" style, and saves a reusable template.'))}
            </div>
            <div class="nmf-field">
                <label class="nmf-label">
                    <span>${esc(tx('Выберите персонажа из Таверны', 'Pick Character from Tavern'))}</span>
                    <button type="button" class="nmf-chip" data-act="trigger-tpl-card-upload">${NMF_ICONS.upload} <span>${esc(tx('Или файл PNG/JSON', 'Or Upload PNG/JSON'))}</span></button>
                </label>
                ${rosterChars.length > 6 ? `
                <input type="text" class="nmf-input" data-tpl-roster-filter="1" value="${esc(state.tplExtractFilter || '')}" placeholder="${esc(tx('Поиск по имени карточки...', 'Filter characters by name...'))}"/>` : ''}
                <select class="nmf-select" data-tpl-extract-avatar="1">
                    <option value="">${esc(tx('— Выберите карточку из списка Таверны —', '— Choose a character from Tavern —'))}</option>
                    ${filteredRoster.slice(0, 250).map((c) => `<option value="${esc(c.avatar)}" ${state.tplExtractAvatar === c.avatar ? 'selected' : ''}>${esc(c.name)} (${esc(c.avatar)})</option>`).join('')}
                </select>
                ${state.tplExtractUploadedCard?.name ? `
                <div style="font-size:11.5px;color:var(--nmf-accent);font-weight:600">
                    ${esc(tx('Загружен файл карточки:', 'Uploaded card file:'))} ${esc(state.tplExtractUploadedCard.name)}
                </div>` : ''}
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Пожелания к шаблону (по желанию)', 'Optional Tweaks for Extracted Template'))}</label>
                <input type="text" class="nmf-input" data-tpl-extract-hint="1" value="${esc(state.tplExtractHint || '')}" placeholder="${esc(tx('Например: оставь разделы, но сделай пункты внешности списком...', 'e.g. Keep sections, make appearance concise bullets...'))}"/>
            </div>
            <div class="nmf-btn-row" style="justify-content:flex-end">
                <button type="button" class="nmf-btn-secondary" data-act="toggle-tpl-extractor">${esc(tx('Закрыть', 'Close'))}</button>
                <button type="button" class="nmf-btn-primary" data-act="run-extract-tpl-from-char" ${state.busy ? 'disabled' : ''}>
                    ${NMF_ICONS.spark} ${esc(tx('Извлечь шаблон ИИ', 'Extract Template with AI'))}
                </button>
            </div>
        </div>` : ''}
    </div>`;
}

export function renderPhotoLabTabHtml({
    sess,
    cfg,
    state,
    esc,
    safeImgSrc,
    renderStudioRoomBar,
    rosterChars = [],
}) {
    const pl = sess.photoLab || {};
    const photoUrl = safeImgSrc(resolveEntityDisplayUrl(pl.photo));
    const drafts = Array.isArray(pl.drafts) ? pl.drafts : [];
    const latestDraft = (pl.lastCreatedId && drafts.find((d) => d.id === pl.lastCreatedId)) || drafts[0] || null;
    const conceptSheetUrl = safeImgSrc(resolveEntityDisplayUrl(sess.conceptLab?.anchorPhoto)) || safeImgSrc(resolveEntityDisplayUrl(sess.conceptLab?.singleSheet));

    return `
    ${renderStudioRoomBar(
        'Герой по фото',
        'Character from Photo',
        `<div style="display:inline-flex;gap:5px">
            ${drafts.length > 0 ? `<button type="button" class="nmf-chip" data-act="open-photo-collection">${NMF_ICONS.matches} <span>${esc(tx(`Коллекция (${drafts.length})`, `Collection (${drafts.length})`))}</span></button>` : ''}
            <button type="button" class="nmf-chip" data-act="open-intake-sheet">${NMF_ICONS.sliders} <span>${esc(tx('Анкета', 'Questionnaire'))}</span></button>
        </div>`,
    )}

    <div class="nmf-panel">
        <div class="nmf-lab-photo-box">
            ${photoUrl ? `
            <div class="nmf-lab-photo-frame nmf-tappable-photo" data-act="open-raw-lightbox" data-src="${esc(photoUrl)}" data-title="${esc(pl.charName || tx('Исходное фото', 'Source Photo'))}">
                <img src="${esc(photoUrl)}" alt="Uploaded Reference"/>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                <span style="font-size:11.5px;color:var(--nmf-text-muted)">${esc(tx('Исходная иллюстрация', 'Source Artwork'))}</span>
                <div class="nmf-chip-wrap">
                    <button type="button" class="nmf-chip" data-act="trigger-photo-lab-upload" ${sess.frozen ? 'disabled' : ''}>${NMF_ICONS.upload} <span>${esc(tx('Сменить', 'Replace'))}</span></button>
                    <button type="button" class="nmf-chip" data-act="clear-photo-lab-image" ${sess.frozen ? 'disabled' : ''}>${NMF_ICONS.trash}</button>
                </div>
            </div>` : `
            <button type="button" class="nmf-btn-secondary" style="height:88px;border-style:dashed;flex-direction:column;gap:5px" data-act="trigger-photo-lab-upload" ${sess.frozen ? 'disabled' : ''}>
                ${NMF_ICONS.camera}
                <span>${esc(tx('Прикрепить портрет или арт без потери качества', 'Attach portrait or artwork (lossless)'))}</span>
            </button>
            ${conceptSheetUrl ? `
            <button type="button" class="nmf-chip" style="align-self:flex-start" data-act="photo-lab-use-concept" ${sess.frozen ? 'disabled' : ''}>
                ${NMF_ICONS.conceptBoard} <span>${esc(tx('Взять фото из Концепт-бюро', 'Use Photo from Concept Lab'))}</span>
            </button>` : ''}`}
        </div>

        <div class="nmf-field">
            <label class="nmf-label">${esc(tx('Кем сделать героя, характер и завязка (несколько штрихов)', 'Role, Personality & Opening Hook (Optional)'))}</label>
            <textarea class="nmf-textarea" style="min-height:64px" data-photo-lab="roleVibeHint" placeholder="${esc(tx('Опишите вайб и роль героя или оставьте пустым на усмотрение ИИ...', 'Add a few character hints or leave blank for AI...'))}" ${sess.frozen ? 'disabled' : ''}>${esc(pl.roleVibeHint || '')}</textarea>
        </div>

        <details class="nmf-spoiler">
            <summary><span>${esc(tx('Шаблон анкеты, имя и доп. настройки', 'Template, Name & Extra Options'))}</span>${NMF_ICONS.chevronDown}</summary>
            <div class="nmf-spoiler-body">
                ${renderTemplateManagerWidgetHtml({ sess, cfg, state, esc, rosterChars })}
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Имя (необязательно)', 'Name (Optional)'))}</label>
                    <input type="text" class="nmf-input" data-photo-lab="charName" value="${esc(pl.charName || '')}" placeholder="${esc(tx('Пусто = ИИ подберёт имя под образ...', 'Blank = AI picks a name...'))}" ${sess.frozen ? 'disabled' : ''}/>
                </div>
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Дополнительные детали', 'Extra Notes'))}</label>
                    <input type="text" class="nmf-input" data-photo-lab="extraNotes" value="${esc(pl.extraNotes || '')}" placeholder="${esc(tx('Сеттинг, рейтинг, стиль...', 'Setting, rating, style...'))}" ${sess.frozen ? 'disabled' : ''}/>
                </div>
                <div class="nmf-toggle-line" data-act="toggle-photo-use-intake">
                    <span style="font-size:12px;font-weight:600">${esc(tx('Учитывать общую Сюжетную анкету сессии', 'Apply main Session Story Questionnaire'))}</span>
                    <div class="nmf-switch ${pl.useIntake ? 'nmf-on' : ''}"></div>
                </div>
            </div>
        </details>

        <button type="button" class="nmf-btn-primary" style="width:100%" data-act="run-photo-to-card" ${state.busy || sess.frozen || !photoUrl ? 'disabled' : ''}>
            ${NMF_ICONS.spark} ${esc(tx('Создать анкету по фото', 'Create Profile from Photo'))}
        </button>
    </div>

    ${latestDraft ? `
    <div class="nmf-concept-card">
        <div class="nmf-concept-plate-head">
            <div class="nmf-concept-plate-title">
                <span class="nmf-concept-plate-num">${esc(tx('ГОТОВО', 'READY'))}</span>
                <strong>${esc(latestDraft.name)}</strong>
            </div>
        </div>
        <div class="nmf-caption-table">
            <div class="nmf-caption-row" style="grid-template-columns:1fr">
                <div class="nmf-caption-cell-text">${esc((latestDraft.pitch || latestDraft.cardDraft?.description || '').slice(0, 280))}${(latestDraft.pitch || '').length > 280 ? '...' : ''}</div>
            </div>
        </div>
        <div style="padding:10px 12px;border-top:1px solid var(--nmf-border);display:flex;flex-wrap:wrap;gap:6px">
            <button type="button" class="nmf-btn-secondary" style="flex:1;min-width:115px" data-act="send-cand-to-blitz" data-source="photo" data-ref="photo:${esc(latestDraft.id)}">
                ${NMF_ICONS.blitz} ${esc(tx('В Блиц', 'To Blitz'))}
            </button>
            <button type="button" class="nmf-btn-secondary" style="flex:1;min-width:115px" data-act="send-cand-to-concept" data-ref="photo:${esc(latestDraft.id)}">
                ${NMF_ICONS.conceptBoard} ${esc(tx('В Концепт', 'To Concept'))}
            </button>
            <button type="button" class="nmf-btn-primary" style="flex:1;min-width:160px" data-act="open-photo-draft-v2" data-id="${esc(latestDraft.id)}">
                ${NMF_ICONS.editor} ${esc(tx('В Редактор V2', 'Open V2 Card'))}
            </button>
        </div>
    </div>` : ''}`;
}

export function renderConceptLabTabHtml({
    sess,
    cfg,
    state,
    esc,
    safeImgSrc,
    renderStudioRoomBar,
    renderCheckableQuestionCard,
}) {
    const cl = sess.conceptLab || {};
    const candidatesList = listConceptSelectableCandidates(sess);
    const seedHit = resolveConceptSeedCandidate(sess);
    const seedEntity = seedHit?.entity || null;
    const curSelRef = cl.linkedCandidateRef === '__none__' ? '__none__' : (seedHit?.ref || '__none__');

    const imgExt = detectImageExtensions();
    const buckets = listImageExtensionBuckets();
    const activeBucket = buckets.find((b) => cfg.imageSource === 'auto' ? b.enabled : b.key === cfg.imageSource) || buckets[0] || null;
    const profiles = Array.isArray(activeBucket?.cfg?.connectionProfiles) ? activeBucket.cfg.connectionProfiles : [];
    const aspectInfo = getSupportedAspectRatiosForImageConfig(cfg.imageSource, cfg.imageProfileId);
    const supportedAspectOpts = aspectInfo.options || [];
    const effectiveConceptAspect = aspectInfo.supportedIds.includes(cl.aspectRatio)
        ? cl.aspectRatio
        : (aspectInfo.supportedIds.includes('3:2') ? '3:2' : (aspectInfo.supportedIds[0] || '1:1'));
    const effectiveAnchorAspect = aspectInfo.supportedIds.includes(cl.anchorAspect)
        ? cl.anchorAspect
        : (aspectInfo.supportedIds.includes('2:3') ? '2:3' : (aspectInfo.supportedIds[0] || '1:1'));

    const anchorUrl = safeImgSrc(resolveEntityDisplayUrl(cl.anchorPhoto));
    const seedAvatarUrl = seedEntity ? safeImgSrc(resolveEntityDisplayUrl(seedEntity)) : '';
    const singleSheetUrl = safeImgSrc(resolveEntityDisplayUrl(cl.singleSheet));
    const answeredCount = Array.isArray(cl.questions)
        ? cl.questions.filter((q) => Boolean(formatQuestionUserDecision(q))).length
        : 0;
    const hasCaptions = hasActiveConceptCaptions(sess);
    const conceptVaultCount = Array.isArray(cl.vault) ? cl.vault.length : 0;

    const hasSingleOutput = Boolean(singleSheetUrl || cl.singleSheet?.masterCaption || cl.singleSheet?.visualPrompt);
    const hasSeriesOutput = Array.isArray(cl.seriesFrames) && cl.seriesFrames.length > 0;
    const hasAnyConceptOutput = hasSingleOutput || hasSeriesOutput;
    const editSingleOpen = state.editingConceptKey === 'single';
    const appendOpen = Boolean(state.conceptAppendOpen);
    const appendMode = state.conceptAppendMode === 'single' || state.conceptAppendMode === 'series'
        ? state.conceptAppendMode
        : (!hasSingleOutput ? 'single' : 'series');
    const appendCnt = Math.min(6, Math.max(1, Number(state.conceptAppendCount) || 1));

    return `
    ${renderStudioRoomBar(
        'Концепт-арт Бюро',
        'Concept Art Lab',
        `<div style="display:inline-flex;gap:5px">
            ${conceptVaultCount > 0 ? `<button type="button" class="nmf-chip" data-act="open-concept-collection">${NMF_ICONS.matches} <span>${esc(tx(`Коллекция (${conceptVaultCount})`, `Collection (${conceptVaultCount})`))}</span></button>` : ''}
            <button type="button" class="nmf-chip" data-act="open-intake-sheet">${NMF_ICONS.sliders} <span>${esc(tx('Анкета', 'Questionnaire'))}</span></button>
        </div>`,
    )}

    <!-- COMPACT SUBJECT & ANCHOR CARD -->
    <div class="nmf-panel" style="gap:10px">
        <div class="nmf-field">
            <label class="nmf-label">
                <span>${esc(tx('Основа концепта', 'Subject Source'))}</span>
                ${seedEntity ? `<button type="button" class="nmf-chip" data-act="open-concept-seed-card">${NMF_ICONS.eyeOpen} <span>${esc(tx('Открыть карточку', 'View Card'))}</span></button>` : ''}
            </label>
            <select class="nmf-select" data-concept-cand="1" ${sess.frozen ? 'disabled' : ''}>
                <option value="__none__" ${curSelRef === '__none__' ? 'selected' : ''}>${esc(tx('— С нуля (новый персонаж или мир) —', '— From scratch (new character or world) —'))}</option>
                ${candidatesList.map((item) => `
                    <option value="${esc(item.ref)}" ${curSelRef === item.ref ? 'selected' : ''}>
                        [${esc(item.badge)}] ${esc(item.entity.name)}${item.entity.archetype || item.entity.epithet ? ` — ${esc((item.entity.archetype || item.entity.epithet).slice(0, 32))}` : ''}
                    </option>
                `).join('')}
            </select>
        </div>

        ${seedEntity ? `
        <div class="nmf-toggle-line" data-act="toggle-concept-send-bio">
            <span style="font-size:12px;font-weight:500">${esc(tx('Отправлять описание персонажа в ИИ', 'Send character description to AI'))}</span>
            <div class="nmf-switch ${cl.sendSeedBio !== false ? 'nmf-on' : ''}"></div>
        </div>` : `
        <div class="nmf-seg-bar">
            <button type="button" class="nmf-seg-btn ${cl.subjectKind !== 'world' ? 'nmf-active' : ''}" data-act="set-concept-subject" data-kind="character">${esc(tx('Персонаж', 'Character'))}</button>
            <button type="button" class="nmf-seg-btn ${cl.subjectKind === 'world' ? 'nmf-active' : ''}" data-act="set-concept-subject" data-kind="world">${esc(tx('Мир / Сеттинг', 'World / Setting'))}</button>
        </div>`}

        ${anchorUrl ? `
        <div class="nmf-lab-photo-frame nmf-tappable-photo" data-act="open-raw-lightbox" data-src="${esc(anchorUrl)}" data-title="${esc(seedEntity?.name || tx('Опорное фото', 'Anchor Photo'))}">
            <img src="${esc(anchorUrl)}" alt="Anchor Photo"/>
        </div>` : ''}

        <!-- HIDDEN CANVAS, ANCHOR & MODEL SETTINGS -->
        <details class="nmf-spoiler" ${(!anchorUrl && cl.anchorMode === 'generate') ? 'open' : ''}>
            <summary>
                <span>${esc(tx(`Холст и опорное фото · ${effectiveConceptAspect} · ${cl.onArtLanguage || 'English'}`, `Canvas & Anchor · ${effectiveConceptAspect} · ${cl.onArtLanguage || 'English'}`))}</span>
                ${NMF_ICONS.chevronDown}
            </summary>
            <div class="nmf-spoiler-body">
                <div class="nmf-seg-bar">
                    <button type="button" class="nmf-seg-btn ${cl.anchorMode !== 'generate' ? 'nmf-active' : ''}" data-act="set-concept-anchor-mode" data-amode="upload">${esc(tx('Своё фото', 'Own Photo'))}</button>
                    <button type="button" class="nmf-seg-btn ${cl.anchorMode === 'generate' ? 'nmf-active' : ''}" data-act="set-concept-anchor-mode" data-amode="generate">${esc(tx('Создать главное фото', 'Render Main Photo'))}</button>
                </div>

                ${cl.anchorMode === 'generate' ? `
                <textarea class="nmf-textarea" style="min-height:56px" data-concept="anchorPrompt" placeholder="${esc(tx('Описание главного портрета или вида мира...', 'Main portrait or world view description...'))}" ${sess.frozen ? 'disabled' : ''}>${esc(cl.anchorPrompt || (seedEntity?.imagePrompt || seedEntity?.appearance || ''))}</textarea>
                <div class="nmf-grid-2-compact" style="align-items:end">
                    <select class="nmf-select" data-concept="anchorAspect" ${sess.frozen ? 'disabled' : ''}>
                        ${supportedAspectOpts.map((o) => `<option value="${esc(o.id)}" ${effectiveAnchorAspect === o.id ? 'selected' : ''}>${esc(isEn() ? o.labelEn : o.label)}</option>`).join('')}
                    </select>
                    <button type="button" class="nmf-btn-secondary" data-act="gen-concept-anchor-photo" ${state.busy || sess.frozen || !imgExt.hasAny ? 'disabled' : ''}>
                        ${NMF_ICONS.image} ${esc(anchorUrl ? tx('Переснять', 'Redraw') : tx('Создать фото', 'Render'))}
                    </button>
                </div>` : `
                <div class="nmf-chip-wrap">
                    <button type="button" class="nmf-chip" data-act="trigger-concept-anchor-upload" ${sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.upload} <span>${esc(anchorUrl ? tx('Сменить опорное фото', 'Replace Anchor') : tx('Прикрепить фото', 'Attach Photo'))}</span>
                    </button>
                    ${(seedAvatarUrl && !anchorUrl) ? `<button type="button" class="nmf-chip" data-act="concept-adopt-seed-avatar">${NMF_ICONS.image} <span>${esc(tx('Взять арт карточки', 'Use Card Art'))}</span></button>` : ''}
                    ${anchorUrl ? `<button type="button" class="nmf-chip" data-act="clear-concept-anchor">${NMF_ICONS.trash} <span>${esc(tx('Убрать', 'Clear'))}</span></button>` : ''}
                </div>`}

                ${profiles.length > 0 ? `
                <div class="nmf-field">
                    <label class="nmf-label">${esc(tx('Профиль генератора (SillyImages)', 'Generator Profile'))}</label>
                    <select class="nmf-select" data-cfg-live="imageProfileId">
                        <option value="" ${!cfg.imageProfileId ? 'selected' : ''}>${esc(tx('Активный профиль SillyImages', 'Active SillyImages Profile'))}</option>
                        ${profiles.map((p) => `<option value="${esc(p.id)}" ${cfg.imageProfileId === p.id ? 'selected' : ''}>${esc(p.name || p.id)} (${esc(p.apiType || '')})</option>`).join('')}
                    </select>
                </div>` : ''}

                <div class="nmf-grid-2-compact">
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Формат концепта', 'Aspect Ratio'))}</label>
                        <select class="nmf-select" data-concept="aspectRatio" ${sess.frozen ? 'disabled' : ''}>
                            ${supportedAspectOpts.map((o) => `<option value="${esc(o.id)}" ${effectiveConceptAspect === o.id ? 'selected' : ''}>${esc(isEn() ? o.labelEn : o.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Язык надписей на арте', 'On-Art Label Language'))}</label>
                        <input type="text" class="nmf-input" data-concept="onArtLanguage" value="${esc(cl.onArtLanguage ?? 'English')}" placeholder="${esc(tx('English, Русский, Без текста', 'English, Русский, None'))}" ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                </div>
                ${(aspectInfo.noteRu || aspectInfo.noteEn) ? `<div style="font-size:11px;color:var(--nmf-text-muted)">${esc(aspectInfo.model || aspectInfo.apiType)}: ${esc(isEn() ? aspectInfo.noteEn : aspectInfo.noteRu)}</div>` : ''}
            </div>
        </details>

        <!-- CREATION CONTROLS (COLLAPSES AUTOMATICALLY ONCE ALBUM IS GENERATED!) -->
        <details class="nmf-spoiler" ${!hasAnyConceptOutput ? 'open' : ''}>
            <summary>
                <span>${esc(hasAnyConceptOutput
                    ? tx('Пересоздать концепт с нуля', 'Recreate Concept from Scratch')
                    : (cl.conceptMode === 'series'
                        ? tx(`Замысел серии (${Number(cl.seriesCount) || 4} кадр.)`, `Series Direction (${Number(cl.seriesCount) || 4} frames)`)
                        : tx('Замысел концепт-листа', 'Concept Sheet Direction')))}</span>
                ${NMF_ICONS.chevronDown}
            </summary>
            <div class="nmf-spoiler-body">
                <div class="nmf-seg-bar">
                    <button type="button" class="nmf-seg-btn ${cl.conceptMode !== 'series' ? 'nmf-active' : ''}" data-act="set-concept-mode" data-cmode="single">${esc(tx('Единый лист', 'Single Sheet'))}</button>
                    <button type="button" class="nmf-seg-btn ${cl.conceptMode === 'series' ? 'nmf-active' : ''}" data-act="set-concept-mode" data-cmode="series">${esc(tx('Серия кадров', 'Photo Series'))}</button>
                </div>

                ${cl.conceptMode === 'series' ? `
                <div class="nmf-chip-wrap">
                    ${CONCEPT_SERIES_COUNT_OPTIONS.map((cnt) => `
                        <button type="button" class="nmf-chip ${(Number(cl.seriesCount) || 4) === cnt ? 'nmf-on' : ''}" data-act="set-concept-series-count" data-cnt="${cnt}" ${sess.frozen ? 'disabled' : ''}>${cnt} ${esc(tx('фото', 'photos'))}</button>
                    `).join('')}
                </div>` : ''}

                <textarea class="nmf-textarea" style="min-height:66px" data-concept="themeBrief" placeholder="${esc(cl.conceptMode === 'series'
                    ? tx('Кратко опишите, что показать на кадрах (вещи, быт, локации, ракурсы)...', 'Briefly describe what to show across the frames...')
                    : tx('Что включить в концепт-лист (разворот, палитра, эмоции, личные вещи)...', 'What to include on the concept sheet...'))}" ${sess.frozen ? 'disabled' : ''}>${esc(cl.themeBrief || '')}</textarea>

                ${cl.conceptMode === 'series' ? `
                <details class="nmf-spoiler" ${cl.questions?.length ? 'open' : ''}>
                    <summary><span>${esc(tx(`Помощь ИИ: наводящие вопросы к серии${cl.questions?.length ? ` (${answeredCount}/${cl.questions.length})` : ''}`, `AI Guided Series Questions${cl.questions?.length ? ` (${answeredCount}/${cl.questions.length})` : ''}`))}</span>${NMF_ICONS.chevronDown}</summary>
                    <div class="nmf-spoiler-body">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
                            <div class="nmf-chip-wrap">
                                ${CONCEPT_QUESTION_COUNT_OPTIONS.map((qn) => `<button type="button" class="nmf-chip ${(Number(cl.questionCount) || 4) === qn ? 'nmf-on' : ''}" data-act="set-concept-q-count" data-cnt="${qn}">${qn}</button>`).join('')}
                            </div>
                            <div class="nmf-chip-wrap">
                                <button type="button" class="nmf-chip nmf-on" data-act="gen-concept-questions" ${state.busy || sess.frozen ? 'disabled' : ''}>${NMF_ICONS.blitz} <span>${esc(tx('Спросить ИИ', 'Ask AI'))}</span></button>
                                ${cl.questions?.length ? `<button type="button" class="nmf-chip" data-act="clear-concept-questions">${NMF_ICONS.trash}</button>` : ''}
                            </div>
                        </div>
                        ${(cl.questions || []).map((q, idx) => renderCheckableQuestionCard(q, idx, {
                            skipAct: 'concept-q-skip',
                            regenAct: 'concept-q-regen-one',
                            optAct: 'concept-q-pick-opt',
                            ansAttr: 'data-concept-q-ans',
                            disabled: state.busy || sess.frozen,
                        })).join('')}
                    </div>
                </details>

                <div class="nmf-btn-row" style="flex-wrap:wrap">
                    <button type="button" class="nmf-btn-primary" style="flex:1;min-width:170px" data-act="run-concept-series-all" ${state.busy || sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.conceptBoard} ${esc(tx(`Создать серию (${Number(cl.seriesCount) || 4} фото)`, `Create Series (${Number(cl.seriesCount) || 4})`))}
                    </button>
                    <button type="button" class="nmf-btn-secondary" data-act="run-concept-series-plan" ${state.busy || sess.frozen ? 'disabled' : ''}>
                        ${esc(tx('Только план', 'Plan Only'))}
                    </button>
                </div>` : `
                <div class="nmf-btn-row" style="flex-wrap:wrap">
                    <button type="button" class="nmf-btn-primary" style="flex:1;min-width:170px" data-act="run-concept-single-full" ${state.busy || sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.conceptBoard} ${esc(tx('Создать Концепт-лист', 'Create Concept Sheet'))}
                    </button>
                    <button type="button" class="nmf-btn-secondary" data-act="run-concept-single-plan" ${state.busy || sess.frozen ? 'disabled' : ''}>
                        ${esc(tx('Только план', 'Plan Only'))}
                    </button>
                </div>`}
            </div>
        </details>
    </div>

    <!-- CLEAN EDITORIAL ALBUM PLATES + PENCIL CAPTION TABLE -->
    ${hasSingleOutput ? `
    <div class="nmf-concept-card">
        <div class="nmf-concept-plate-head">
            <div class="nmf-concept-plate-title">
                <span class="nmf-concept-plate-num">${esc(hasSeriesOutput ? tx('ЛИСТ', 'SHEET') : '01')}</span>
                <span>${esc(cl.singleSheet?.title || seedEntity?.name || tx('Личное дело и концепт образа', 'Concept Sheet'))}</span>
            </div>
            <div style="display:inline-flex;gap:4px">
                <button type="button" class="nmf-icon-btn nmf-sq ${editSingleOpen ? 'nmf-active' : ''}" data-act="toggle-concept-edit" data-ekey="single" title="${esc(tx('Редактировать подпись и параметры', 'Edit caption & settings'))}">${NMF_ICONS.editSmall}</button>
                ${singleSheetUrl ? `<button type="button" class="nmf-icon-btn nmf-sq" data-act="download-concept-single" title="PNG">${NMF_ICONS.download}</button>` : ''}
            </div>
        </div>

        ${singleSheetUrl ? `
        <div class="nmf-concept-sheet-view nmf-tappable-photo" data-act="open-raw-lightbox" data-src="${esc(singleSheetUrl)}" data-title="${esc(cl.singleSheet?.title || tx('Концепт-лист', 'Concept Sheet'))}">
            <img src="${esc(singleSheetUrl)}" alt="Concept Sheet"/>
        </div>` : ''}

        <div class="nmf-caption-table" style="padding:4px 8px">
            <details class="nmf-spoiler">
                <summary><span>${esc(tx('Заметка о персонаже', 'Character Story Note'))}</span>${NMF_ICONS.chevronDown}</summary>
                <div class="nmf-spoiler-body">
                    <div class="nmf-caption-cell-text">${esc(cl.singleSheet?.masterCaption || tx('Подпись ещё не задана.', 'No caption yet.'))}</div>
                </div>
            </details>
        </div>

        ${editSingleOpen ? `
        <div class="nmf-caption-edit-drawer">
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Заголовок концепт-листа', 'Concept Sheet Title'))}</label>
                <input type="text" class="nmf-input" data-concept-single="title" value="${esc(cl.singleSheet?.title || '')}" ${sess.frozen ? 'disabled' : ''}/>
            </div>
            <div class="nmf-field">
                <label class="nmf-label">${esc(tx('Заметка-рассказ о персонаже (для вдохновения ИИ)', 'Character Story Note (for AI synthesis)'))}</label>
                <textarea class="nmf-textarea" style="min-height:110px;font-size:12px" data-concept-single="masterCaption" ${sess.frozen ? 'disabled' : ''}>${esc(cl.singleSheet?.masterCaption || '')}</textarea>
            </div>
            <details class="nmf-spoiler">
                <summary><span>${esc(tx('Промпт иллюстрации (EN)', 'Visual Prompt (EN)'))}</span>${NMF_ICONS.chevronDown}</summary>
                <div class="nmf-spoiler-body">
                    <textarea class="nmf-textarea" style="min-height:76px;font-family:var(--nmf-font-mono);font-size:11px" data-concept-single="visualPrompt" ${sess.frozen ? 'disabled' : ''}>${esc(cl.singleSheet?.visualPrompt || '')}</textarea>
                </div>
            </details>
            <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <div style="display:inline-flex;gap:6px;flex-wrap:wrap">
                    <button type="button" class="nmf-btn-secondary" data-act="render-concept-single-art-only" ${state.busy || sess.frozen || !imgExt.hasAny ? 'disabled' : ''}>
                        ${NMF_ICONS.image} ${esc(singleSheetUrl ? tx('Перерисовать лист', 'Redraw Sheet') : tx('Нарисовать лист', 'Render Sheet'))}
                    </button>
                    <button type="button" class="nmf-icon-btn nmf-sq" style="border-color:#e05a6d;color:#e05a6d" data-act="delete-concept-single" title="${esc(tx('Удалить концепт-лист', 'Delete Concept Sheet'))}" ${state.busy || sess.frozen ? 'disabled' : ''}>
                        ${NMF_ICONS.trash}
                    </button>
                </div>
                <button type="button" class="nmf-btn-primary" data-act="toggle-concept-edit" data-ekey="single">${esc(tx('Готово', 'Done'))}</button>
            </div>
        </div>` : ''}
    </div>` : ''}

    ${hasSeriesOutput ? `
    <div style="display:flex;flex-direction:column;gap:12px">
        ${cl.seriesFrames.map((fr, idx) => {
            const frUrl = safeImgSrc(resolveEntityDisplayUrl(fr));
            const frAspect = aspectInfo.supportedIds.includes(fr.aspectRatio) ? fr.aspectRatio : effectiveConceptAspect;
            const eKey = `frame_${idx}`;
            const isEdit = state.editingConceptKey === eKey;
            const plateNum = String(idx + 1).padStart(2, '0');
            return `
            <div class="nmf-concept-card">
                <div class="nmf-concept-plate-head">
                    <div class="nmf-concept-plate-title">
                        <span class="nmf-concept-plate-num">${plateNum}</span>
                        <span style="overflow:hidden;text-overflow:ellipsis">${esc(fr.title || `Кадр #${idx + 1}`)}</span>
                    </div>
                    <div style="display:inline-flex;gap:4px;flex-shrink:0">
                        ${!frUrl ? `<button type="button" class="nmf-chip nmf-on" data-act="render-concept-frame-one" data-idx="${idx}" ${state.busy || sess.frozen || !imgExt.hasAny ? 'disabled' : ''}>${NMF_ICONS.image} <span>${esc(tx('Арт', 'Render'))}</span></button>` : ''}
                        <button type="button" class="nmf-icon-btn nmf-sq ${isEdit ? 'nmf-active' : ''}" data-act="toggle-concept-edit" data-ekey="${eKey}" title="${esc(tx('Исправить или перерисовать', 'Edit or redraw'))}">${NMF_ICONS.editSmall}</button>
                        ${frUrl ? `<button type="button" class="nmf-icon-btn nmf-sq" data-act="download-concept-frame" data-idx="${idx}" title="PNG">${NMF_ICONS.download}</button>` : ''}
                    </div>
                </div>

                ${frUrl ? `
                <div class="nmf-concept-sheet-view nmf-tappable-photo" data-act="open-raw-lightbox" data-src="${esc(frUrl)}" data-title="${esc(fr.title || `Кадр #${idx + 1}`)}">
                    <img src="${esc(frUrl)}" alt="${esc(fr.title || '')}"/>
                </div>` : ''}

                <div class="nmf-caption-table">
                    <div class="nmf-caption-row" style="grid-template-columns:1fr">
                        <div class="nmf-caption-cell-text">${esc(fr.caption || tx('Без подписи.', 'No caption.'))}</div>
                    </div>
                </div>

                ${isEdit ? `
                <div class="nmf-caption-edit-drawer">
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Заголовок кадра', 'Frame Title'))}</label>
                        <input type="text" class="nmf-input" data-concept-frame-title="${idx}" value="${esc(fr.title || '')}" ${sess.frozen ? 'disabled' : ''}/>
                    </div>
                    <div class="nmf-field">
                        <label class="nmf-label">${esc(tx('Подпись кадра (участвует при сборке чара)', 'Frame Caption (used in card synthesis)'))}</label>
                        <textarea class="nmf-textarea" style="min-height:84px;font-size:12px" data-concept-frame-cap="${idx}" ${sess.frozen ? 'disabled' : ''}>${esc(fr.caption || '')}</textarea>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
                        <div class="nmf-chip-wrap">
                            <select class="nmf-select" style="width:auto;height:30px;font-size:11px;padding:0 8px" data-concept-frame-aspect="${idx}" ${sess.frozen ? 'disabled' : ''}>
                                ${supportedAspectOpts.map((o) => `<option value="${esc(o.id)}" ${frAspect === o.id ? 'selected' : ''}>${esc(o.id)}</option>`).join('')}
                            </select>
                            <button type="button" class="nmf-chip ${fr.needsAnchorRef !== false ? 'nmf-on' : ''}" data-act="toggle-concept-frame-ref" data-idx="${idx}">
                                ${NMF_ICONS.refFrame} <span>${esc(fr.needsAnchorRef !== false ? tx('С опорой', 'Ref ON') : tx('Без опоры', 'Ref OFF'))}</span>
                            </button>
                            <button type="button" class="nmf-chip" data-act="render-concept-frame-one" data-idx="${idx}" ${state.busy || sess.frozen || !imgExt.hasAny ? 'disabled' : ''}>
                                ${NMF_ICONS.image} <span>${esc(frUrl ? tx('Перерисовать', 'Redraw') : tx('Нарисовать', 'Render'))}</span>
                            </button>
                            <button type="button" class="nmf-icon-btn nmf-sq" style="border-color:#e05a6d;color:#e05a6d" data-act="delete-concept-frame" data-idx="${idx}" title="${esc(tx('Удалить этот кадр', 'Delete frame'))}" ${state.busy || sess.frozen ? 'disabled' : ''}>
                                ${NMF_ICONS.trash}
                            </button>
                        </div>
                        <button type="button" class="nmf-chip nmf-on" data-act="toggle-concept-edit" data-ekey="${eKey}">${esc(tx('Готово', 'Done'))}</button>
                    </div>
                    <details class="nmf-spoiler">
                        <summary><span>${esc(tx('Промпт кадра (EN)', 'Visual Prompt (EN)'))}</span>${NMF_ICONS.chevronDown}</summary>
                        <div class="nmf-spoiler-body">
                            <textarea class="nmf-textarea" style="min-height:64px;font-family:var(--nmf-font-mono);font-size:11px" data-concept-frame-prompt="${idx}" ${sess.frozen ? 'disabled' : ''}>${esc(fr.visualPrompt || '')}</textarea>
                        </div>
                    </details>
                </div>` : ''}
            </div>`;
        }).join('')}
    </div>` : ''}

    <!-- SIMPLE "+" AI EXPANSION CARD (JUST LIKE THE START!) -->
    ${hasAnyConceptOutput ? (
        !appendOpen ? `
        <button type="button" class="nmf-btn-secondary" style="width:100%;min-height:44px;border-style:dashed;justify-content:center;gap:8px;color:var(--nmf-accent);border-color:var(--nmf-accent)" data-act="toggle-concept-append" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.plus}
            <span>${esc(tx('Дополнить концепт-арты', 'Add More Concept Art'))}</span>
        </button>` : `
        <div class="nmf-panel" style="gap:10px;border-color:var(--nmf-accent)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <div style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:13px;color:var(--nmf-accent)">
                    ${NMF_ICONS.plus}
                    <span>${esc(tx('Дополнить концепт-арты с ИИ', 'Add More Concept Art with AI'))}</span>
                </div>
                <button type="button" class="nmf-icon-btn nmf-sq" data-act="toggle-concept-append" title="${esc(tx('Свернуть', 'Collapse'))}">${NMF_ICONS.close}</button>
            </div>

            <div class="nmf-seg-bar">
                <button type="button" class="nmf-seg-btn ${appendMode !== 'series' ? 'nmf-active' : ''}" data-act="set-concept-append-mode" data-amode="single">${esc(tx('Большой лист', 'Single Sheet'))}</button>
                <button type="button" class="nmf-seg-btn ${appendMode === 'series' ? 'nmf-active' : ''}" data-act="set-concept-append-mode" data-amode="series">${esc(tx('Ещё арты', 'More Frames'))}</button>
            </div>

            ${appendMode === 'series' ? `
            <div class="nmf-chip-wrap">
                ${CONCEPT_SERIES_COUNT_OPTIONS.map((cnt) => `
                    <button type="button" class="nmf-chip ${appendCnt === cnt ? 'nmf-on' : ''}" data-act="set-concept-append-count" data-cnt="${cnt}" ${sess.frozen ? 'disabled' : ''}>+${cnt} ${esc(tx('фото', 'photos'))}</button>
                `).join('')}
            </div>` : ''}

            <textarea class="nmf-textarea" style="min-height:60px" data-concept-append-brief="1" placeholder="${esc(appendMode === 'series'
                ? tx('Что показать на новых кадрах (необязательно — если пусто, ИИ сам придумает новые ракурсы без повторов)...', 'Optional wish for the new frames (if empty, AI invents fresh facets without repeating)...')
                : tx('Пожелание к большому Концепт-листу (необязательно)...', 'Optional wish for the master Concept Sheet...'))}" ${sess.frozen ? 'disabled' : ''}>${esc(state.conceptAppendBrief || '')}</textarea>

            ${appendMode === 'series' ? `
            <div class="nmf-btn-row" style="flex-wrap:wrap">
                <button type="button" class="nmf-btn-primary" style="flex:1;min-width:170px" data-act="run-concept-append-series" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    ${NMF_ICONS.plus} ${esc(tx(`Добавить с ИИ (+${appendCnt} фото)`, `Add with AI (+${appendCnt})`))}
                </button>
                <button type="button" class="nmf-btn-secondary" data-act="run-concept-append-series-plan" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    ${esc(tx('Только план', 'Plan Only'))}
                </button>
            </div>` : `
            <div class="nmf-btn-row" style="flex-wrap:wrap">
                <button type="button" class="nmf-btn-primary" style="flex:1;min-width:170px" data-act="run-concept-append-single" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    ${NMF_ICONS.conceptBoard} ${esc(hasSingleOutput ? tx('Обновить Концепт-лист', 'Regenerate Concept Sheet') : tx('Добавить Концепт-лист', 'Add Concept Sheet'))}
                </button>
                <button type="button" class="nmf-btn-secondary" data-act="run-concept-append-single-plan" ${state.busy || sess.frozen ? 'disabled' : ''}>
                    ${esc(tx('Только план', 'Plan Only'))}
                </button>
            </div>`}
        </div>`
    ) : ''}

    <!-- CALM BOTTOM ACTION BAR -->
    ${hasCaptions ? `
    <div class="nmf-btn-row" style="padding-top:2px;flex-wrap:wrap">
        <button type="button" class="nmf-btn-secondary" style="flex:1;min-width:130px" data-act="send-concept-to-blitz" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.blitz} ${esc(tx('В Блиц', 'To Blitz'))}
        </button>
        <button type="button" class="nmf-btn-primary" style="flex:1.4;min-width:170px" data-act="build-card-from-concept" ${state.busy || sess.frozen ? 'disabled' : ''}>
            ${NMF_ICONS.spark} ${esc(tx('Создать Карточку V2', 'Build V2 Card'))}
        </button>
    </div>` : ''}`;
}

export function renderConceptCollectionViewHtml({
    sess,
    state,
    esc,
    safeImgSrc,
    resolveDisplayOrCoverSpec,
    resolvePuzzleTileSpec,
}) {
    const items = Array.isArray(sess.conceptLab?.vault) ? sess.conceptLab.vault : [];
    if (items.length === 0) {
        return `
        <div class="nmf-panel" style="align-items:center;text-align:center;padding:28px 16px;border-style:dashed">
            <span style="color:var(--nmf-accent)">${NMF_ICONS.conceptBoard}</span>
            <div style="font-family:var(--nmf-font-title);font-size:16px;font-weight:700">${esc(tx('Концепт-артов пока нет', 'No Concept Arts Yet'))}</div>
            <div style="font-size:12px;color:var(--nmf-text-muted);max-width:340px;line-height:1.45">
                ${esc(tx('Создайте концепт-лист или серию в «Концепт-арт Бюро» либо нажмите «Концепт» на любой карточке из Тиндера, Гачи или По фото.', 'Create a concept sheet or series in Concept Art Lab, or tap "Concept" on any card from Swipes, Gacha, or Photo.'))}
            </div>
            <button type="button" class="nmf-btn-primary" style="margin-top:6px" data-act="launch-mode-from-home" data-mode="concept">
                ${NMF_ICONS.conceptBoard} ${esc(tx('Открыть Концепт-арт Бюро', 'Open Concept Art Lab'))}
            </button>
        </div>`;
    }

    const selectableMap = new Map(listConceptSelectableCandidates(sess).map((x) => [x.ref, x.entity]));

    return `
    <div class="nmf-mosaic-grid">
        ${items.map((cv, idx) => {
            const linkedHero = (cv.sourceRef && cv.sourceRef !== '__none__') ? (selectableMap.get(cv.sourceRef) || null) : null;
            const heroFaceUrl = linkedHero ? safeImgSrc(resolveEntityDisplayUrl(linkedHero)) : '';
            const anchorUrl = safeImgSrc(resolveEntityDisplayUrl(cv.anchorPhoto));
            const singleUrl = safeImgSrc(resolveEntityDisplayUrl(cv.singleSheet));
            const firstSeriesUrl = Array.isArray(cv.seriesFrames)
                ? cv.seriesFrames.map((f) => safeImgSrc(resolveEntityDisplayUrl(f))).find(Boolean) || ''
                : '';
            const thumbUrl = heroFaceUrl || anchorUrl || singleUrl || firstSeriesUrl || safeImgSrc(resolveEntityDisplayUrl(cv));
            const specEntity = linkedHero || cv;
            const fSpec = resolveDisplayOrCoverSpec(specEntity, thumbUrl, false, '');
            const pSpec = resolvePuzzleTileSpec(specEntity, Boolean(thumbUrl));
            const tileCls = fSpec.isReal ? pSpec.cls : 'nmf-tile-square';
            const hasSingleInVault = Boolean(singleUrl || String(cv.singleSheet?.masterCaption || '').trim());
            const seriesLen = Array.isArray(cv.seriesFrames) ? cv.seriesFrames.length : 0;
            const seriesJoined = Array.isArray(cv.seriesFrames)
                ? cv.seriesFrames.map((f) => f.caption).filter(Boolean).join(' · ')
                : '';
            const captionPreview = (linkedHero?.pitch || cv.pitch || '').trim()
                || (cv.singleSheet?.masterCaption || '').trim()
                || seriesJoined
                || (cv.themeBrief || '');
            const archLine = linkedHero?.archetype || cv.archetype || '';
            const modeTag = (hasSingleInVault && seriesLen > 0)
                ? tx(`Лист + ${seriesLen} кадр.`, `Sheet + ${seriesLen}`)
                : (seriesLen > 0
                    ? tx(`Серия (${seriesLen})`, `Series (${seriesLen})`)
                    : tx('Концепт-лист', 'Concept Sheet'));
            return `
            <div class="nmf-match-tile ${tileCls}" style="${fSpec.isReal ? pSpec.style : ''}">
                <div class="nmf-match-click-zone" data-act="open-cand-dossier" data-pool="concept_collection" data-idx="${idx}" title="${esc(tx('Открыть анкету персонажа и концепт-арт', 'Open character dossier & concept art'))}">
                    <div class="nmf-match-thumb nmf-tappable-photo">
                        ${fSpec.src ? `<img src="${esc(fSpec.src)}" alt="Concept"/>` : ''}
                        <div style="position:absolute;top:6px;left:6px;right:6px;display:flex;justify-content:space-between;gap:4px;z-index:2">
                            <span style="font-family:var(--nmf-font-mono);font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(10,12,16,0.82);border:1px solid var(--nmf-accent);color:var(--nmf-accent)">${esc(modeTag)}</span>
                            ${cv.sourceBadge ? `<span style="font-family:var(--nmf-font-mono);font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(10,12,16,0.82);border:1px solid var(--nmf-border);color:var(--nmf-text)">${esc(cv.sourceBadge)}</span>` : ''}
                        </div>
                        <div class="nmf-match-thumb-ov">
                            <div style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;line-height:1.2">${esc(linkedHero?.name || cv.name)}</div>
                            ${archLine ? `<div class="nmf-tile-arch">${esc(archLine)}</div>` : ''}
                        </div>
                    </div>
                    <div class="nmf-tile-pitch">
                        ${esc(captionPreview)}
                    </div>
                </div>
                <div class="nmf-tile-actions">
                    <button type="button" class="nmf-btn-primary" style="flex:1;font-size:10.5px;padding:0 6px" data-act="expand-concept-vault" data-idx="${idx}" ${state.busy || sess.frozen ? 'disabled' : ''}>${esc(tx('Собрать', 'Build'))}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="open-concept-vault-item" data-idx="${idx}" title="${esc(tx('Редактировать концепт', 'Edit Concept'))}">${NMF_ICONS.editSmall}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="del-concept-vault-item" data-idx="${idx}" title="${esc(tx('Удалить', 'Delete'))}">${NMF_ICONS.trash}</button>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

export function renderPhotoCollectionViewHtml({
    sess,
    state,
    esc,
    safeImgSrc,
    resolveDisplayOrCoverSpec,
    resolvePuzzleTileSpec,
}) {
    const items = Array.isArray(sess.photoLab?.drafts) ? sess.photoLab.drafts : [];
    if (items.length === 0) {
        return `
        <div class="nmf-panel" style="align-items:center;text-align:center;padding:28px 16px;border-style:dashed">
            <span style="color:var(--nmf-accent)">${NMF_ICONS.camera}</span>
            <div style="font-family:var(--nmf-font-title);font-size:16px;font-weight:700">${esc(tx('Анкет по фото пока нет', 'No Photo Profiles Yet'))}</div>
            <div style="font-size:12px;color:var(--nmf-text-muted);max-width:340px;line-height:1.45">
                ${esc(tx('Загрузите фото чара или локации в лаборатории «Герой по фото», чтобы создать первую базовую анкету.', 'Upload character or world art in the Character from Photo lab to build an initial profile.'))}
            </div>
            <button type="button" class="nmf-btn-primary" style="margin-top:6px" data-act="launch-mode-from-home" data-mode="photo">
                ${NMF_ICONS.camera} ${esc(tx('Открыть «Герой по фото»', 'Open Character from Photo'))}
            </button>
        </div>`;
    }

    return `
    <div class="nmf-mosaic-grid">
        ${items.map((pd, idx) => {
            const thumbUrl = safeImgSrc(resolveEntityDisplayUrl(pd));
            const fSpec = resolveDisplayOrCoverSpec(pd, thumbUrl, false, '');
            const pSpec = resolvePuzzleTileSpec(pd, Boolean(thumbUrl));
            const tileCls = fSpec.isReal ? pSpec.cls : 'nmf-tile-tall';
            return `
            <div class="nmf-match-tile ${tileCls}" style="${fSpec.isReal ? pSpec.style : ''}">
                <div class="nmf-match-click-zone" data-act="open-cand-dossier" data-pool="photo_collection" data-idx="${idx}" title="${esc(tx('Открыть анкету персонажа', 'Open character dossier'))}">
                    <div class="nmf-match-thumb nmf-tappable-photo">
                        ${fSpec.src ? `<img src="${esc(fSpec.src)}" alt="Photo Hero"/>` : ''}
                        <div class="nmf-match-thumb-ov">
                            <div style="font-family:var(--nmf-font-title);font-size:13.5px;font-weight:700;line-height:1.2">${esc(pd.name)}</div>
                            ${pd.archetype ? `<div class="nmf-tile-arch">${esc(pd.archetype)}</div>` : ''}
                        </div>
                    </div>
                    <div class="nmf-tile-pitch">
                        ${esc(pd.pitch || pd.cardDraft?.description || '')}
                    </div>
                </div>
                <div class="nmf-tile-actions">
                    <button type="button" class="nmf-btn-primary" style="flex:1;font-size:10.5px;padding:0 6px" data-act="open-photo-draft-v2" data-id="${esc(pd.id)}" ${state.busy || sess.frozen ? 'disabled' : ''}>${esc(tx('Редактор', 'Editor'))}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="send-cand-to-blitz" data-source="photo" data-ref="photo:${esc(pd.id)}" title="${esc(tx('В Блиц', 'To Blitz'))}">${NMF_ICONS.blitz}</button>
                    <button type="button" class="nmf-icon-btn nmf-sq" data-act="del-photo-draft-item" data-idx="${idx}" title="${esc(tx('Удалить', 'Delete'))}">${NMF_ICONS.trash}</button>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}
