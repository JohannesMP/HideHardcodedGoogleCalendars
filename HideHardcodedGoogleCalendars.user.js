// ==UserScript==
// @name         Hide Hardcoded Google Calendars
// @author       JohannesMP
// @source       https://github.com/JohannesMP
// @updateURL    https://github.com/JohannesMP/HideHardcodedGoogleCalendars/raw/refs/heads/main/HideHardcodedGoogleCalendars.user.js
// @downloadURL  https://github.com/JohannesMP/HideHardcodedGoogleCalendars/raw/refs/heads/main/HideHardcodedGoogleCalendars.user.js
// @supportURL   https://github.com/JohannesMP/HideHardcodedGoogleCalendars/issues
// @version      v5_2026-02-25
// @description  Hide hardcoded Google Calendars such as Birthdays and Tasks.
// @match        https://calendar.google.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';


    // --- Config ---

    const SECTION_LABEL = 'My calendars';

    const SECTION_CALENDARS_TO_HIDE = new Set([
          'Birthdays'
        , 'Tasks'
    ]);


    // --- Element style ---

    // Don't use global g flag or .test(...) becomes stateful and things could get weird.
    const TRANSLATE_Y_RE = /translateY\(\s*(-?\d+(?:\.\d+)?)px\s*\)/i;

    // Ensure our own changes don't trigger mutation callback
    const ignoreStyleMutations = new WeakSet();

    function getTranslateY(element) {
        const transform = element.style?.transform ?? '';
        const match = transform.match(TRANSLATE_Y_RE);
        return match ? Number(match[1]) : null;
    }

    function setTranslateY(element, newY) {
        ignoreStyleMutations.add(element);
        queueMicrotask(() => ignoreStyleMutations.delete(element));

        const oldTransform = element.style?.transform ?? '';
        const newTranslateY = `translateY(${newY}px)`;

        const newTransform = TRANSLATE_Y_RE.test(oldTransform)
            ? oldTransform.replace(TRANSLATE_Y_RE, newTranslateY)
            : `${oldTransform} ${newTranslateY}`.trim();

        if (newTransform !== oldTransform) {
            element.style.transform = newTransform;
        }
    }


    // --- Calendar visibility ---

    const SECTION_QUERY = `[role="list"][aria-label="${SECTION_LABEL}"]`;
    const SECTION_ROW_HEIGHT_ATTR = 'data-tm-row-height';

    let cachedSection = document.querySelector(SECTION_QUERY);

    function getSection() {
        if (!cachedSection || !cachedSection.isConnected) {
            cachedSection = document.querySelector(SECTION_QUERY);
        }
        return cachedSection;
    }

    function shouldHideCalendar(calendar) {
        const labelElement = calendar.querySelector('[data-text]');
        return SECTION_CALENDARS_TO_HIDE.has(labelElement?.getAttribute('data-text')?.trim());
    }

    function resizeSection(section, calendars, rowHeight) {
        for (let i = 0; i < calendars.length; i++) {
            setTranslateY(calendars[i], i * rowHeight);
        }
        section.style.height = `${rowHeight * calendars.length}px`;
    }

    function cleanSection(section) {
        if (!section) return;

        const calendars = Array.from(section.children);
        if (calendars.length < 2) return;

        let rowHeight = Number(section.getAttribute(SECTION_ROW_HEIGHT_ATTR));
        if (!rowHeight) {
            const yOffset = getTranslateY(calendars[1]);
            if (yOffset == null || yOffset < 1) return;
            rowHeight = yOffset;
            section.setAttribute(SECTION_ROW_HEIGHT_ATTR, String(rowHeight));
        }

        const calendarsToUpdate = [];
        for (const calendar of calendars) {
            if (shouldHideCalendar(calendar)) {
                calendar.remove();
            }
            else calendarsToUpdate.push(calendar);
        }
        resizeSection(section, calendarsToUpdate, rowHeight);
    }

    // --- Bootstrap Observer ---

    let bootstrapEnabled = false;
    let bootstrapObserver = null;

    function enableBootstrap() {
        if (bootstrapEnabled) return;
        bootstrapEnabled = true;

        if (!bootstrapObserver) {
            bootstrapObserver = new MutationObserver(() => {
                const section = getSection();
                if (!section) return;

                cleanSection(section);
                attachSectionObserver(section);

                // Once attached, disable bootstrap until the section is replaced.
                disableBootstrap();
            });
        }

        bootstrapObserver.observe(document.documentElement, {
            subtree: true,
            childList: true,
        });
    }

    function disableBootstrap() {
        if (!bootstrapEnabled) return;
        bootstrapEnabled = false;
        if (bootstrapObserver) {
            bootstrapObserver.disconnect();
        }
    }

    // --- Section Changes Observer ---

    let sectionObserver = null;
    let observedSection = null;

    function attachSectionObserver(section) {
        if (!section || section === observedSection) return;
        observedSection = section;

        if (sectionObserver) {
            sectionObserver.disconnect();
        }

        sectionObserver = new MutationObserver((mutations) => {
            if (!observedSection.isConnected) {
                enableBootstrap();
                return;
            }

            for (const m of mutations) {
                if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
                    cleanSection(observedSection);
                    continue;
                }

                if (m.type === 'attributes' && m.attributeName === 'style' && m.target instanceof Element) {
                    if (ignoreStyleMutations.has(m.target)) continue;

                    const rowHeight = Number(observedSection.getAttribute(SECTION_ROW_HEIGHT_ATTR));
                    if (!rowHeight) continue;

                    const calendars = Array.from(observedSection.children);
                    resizeSection(observedSection, calendars, rowHeight);
                }
            }
        });

        sectionObserver.observe(section, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['style'],
        });
    }


    // --- Entry point ---

    const initialSection = getSection();
    if (initialSection) {
        cleanSection(initialSection);
        attachSectionObserver(initialSection);
    } else {
        enableBootstrap();
    }
})();
