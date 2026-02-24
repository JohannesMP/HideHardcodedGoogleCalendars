// ==UserScript==
// @name         Google Calendar - Remove Birthdays
// @author       JohannesMP
// @source       https://github.com/JohannesMP
// @updateURL    https://github.com/JohannesMP/GoogleCalendarRemoveBirthdays/raw/refs/heads/main/GoogleCalendarRemoveBirthdays.user.js
// @downloadURL  https://github.com/JohannesMP/GoogleCalendarRemoveBirthdays/raw/refs/heads/main/GoogleCalendarRemoveBirthdays.user.js
// @supportURL   https://github.com/JohannesMP/GoogleCalendarRemoveBirthdays/issues
// @version      v2_2026-02-24
// @description  Remove the Birthdays calendar
// @match        https://calendar.google.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_LABEL_TEXT = 'Birthdays';
    const LIST_ROW_HEIGHT_ATTR = 'data-tm-bdays-row-height';

    const ignoreStyleMutations = new WeakSet();

    function getTranslateY(element) {
        const transform = element.style?.transform ?? '';
        if (!transform) return null;

        const ty = transform.match(/translateY\(\s*(-?\d+(?:\.\d+)?)px\s*\)/i);
        return ty ? Number(ty[1]) : null;
    }

    function setTranslateY(element, newY) {
        const transform = element.style?.transform ?? '';

        ignoreStyleMutations.add(element);
        queueMicrotask(() => ignoreStyleMutations.delete(element));

        if (!transform) {
            element.style.transform = `translateY(${newY}px)`;
            return;
        }

        if (/translateY\(/i.test(transform)) {
            element.style.transform = transform.replace(
                /translateY\(\s*(-?\d+(?:\.\d+)?)px\s*\)/i,
                `translateY(${newY}px)`
            );
            return;
        }

        element.style.transform = `${transform} translateY(${newY}px)`.trim();
    }

    function findLabelElement(groupElement) {
        const all = groupElement.querySelectorAll('*');
        for (const el of all) {
            if (el.textContent?.trim() === TARGET_LABEL_TEXT) return el;
        }
        return null;
    }

    function repackList(list) {
        const rowHeight = Number(list.getAttribute(LIST_ROW_HEIGHT_ATTR));
        if (!rowHeight || rowHeight < 1) return;

        const rows = Array.from(list.children);
        for (let i = 0; i < rows.length; i++) {
            setTranslateY(rows[i], i * rowHeight);
        }

        list.style.height = `${rowHeight * rows.length}px`;
    }

    function processGroup(groupElement) {
        const label = findLabelElement(groupElement);
        if (!label) return;

        const list = label.closest('[role="list"]');
        if (!list) return;

        const rows = Array.from(list.children);
        const targetRow = rows.find((row) => row.contains(label));
        if (!targetRow) return;

        // Can assume we will always have at least two calendars
        const rowHeight = getTranslateY(rows[1]);
        if (!rowHeight || rowHeight < 1) {
            targetRow.remove();
            return;
        }

        targetRow.remove();

        list.setAttribute(LIST_ROW_HEIGHT_ATTR, String(rowHeight));
        repackList(list);
    }

    function processExpandedGroups(root = document) {
        const expandedGroups = root.querySelectorAll('[aria-hidden="false"][data-collapsed="false"]');
        for (const group of expandedGroups) processGroup(group);
    }

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList' && m.addedNodes?.length) {
                processExpandedGroups(document);
                continue;
            }

            if (m.type === 'attributes') {
                if (m.attributeName === 'aria-hidden' || m.attributeName === 'data-collapsed') {
                    processExpandedGroups(document);
                    continue;
                }

                if (m.attributeName === 'style' && m.target instanceof Element) {
                    if (ignoreStyleMutations.has(m.target)) continue;

                    const list = m.target.closest('[role="list"]');
                    if (!list) continue;

                    if (list.hasAttribute(LIST_ROW_HEIGHT_ATTR)) {
                        repackList(list);
                        continue;
                    }
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
    });

    processExpandedGroups(document);
})();
