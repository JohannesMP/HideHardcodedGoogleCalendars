// ==UserScript==
// @name         Google Calendar - Remove Birthdays
// @author       JohannesMP
// @source       https://github.com/JohannesMP
// @downloadURL  https://github.com/JohannesMP/GoogleCalendarRemoveBirthdays/raw/refs/heads/main/GoogleCalendarRemoveBirthdays.user.js
// @supportURL   https://github.com/JohannesMP/GoogleCalendarRemoveBirthdays/issues
// @version      2026-02-24
// @description  Remove the Birthdays calendar
// @match        https://calendar.google.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_LABEL_TEXT = 'Birthdays';
    const LIST_ADJUSTED_ATTR = 'data-tm-bdays-list-adjusted';

    function getTranslateY(element) {
        const transform = element.style?.transform ?? '';
        if (!transform) return null;

        const ty = transform.match(/translateY\(\s*(-?\d+(?:\.\d+)?)px\s*\)/i);
        return ty ? Number(ty[1]) : null;
    }

    function setTranslateY(element, newY) {
        const transform = element.style?.transform ?? '';
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

    function tryAdjustInlineHeight(listElement, deltaPx) {
        const inlineHeight = listElement.style?.height ?? '';
        const match = inlineHeight.match(/(-?\d+(?:\.\d+)?)px/i);
        if (!match) return;

        const currentHeight = Number(match[1]);
        listElement.style.height = `${Math.max(0, currentHeight - deltaPx)}px`;
    }

    function findLabelElement(groupElement) {
        const all = groupElement.querySelectorAll('*');
        for (const el of all) {
            if (el.textContent?.trim() === TARGET_LABEL_TEXT) return el;
        }
        return null;
    }

    function processGroup(groupElement) {
        const label = findLabelElement(groupElement);
        if (!label) return;

        const list = label.closest('[role="list"]');
        if (!list) return;

        const rows = Array.from(list.children).filter((n) => n instanceof Element);
        const targetRow = rows.find((row) => row.contains(label));
        if (!targetRow) return;

        // We know that before removing Birthdays you will always have two rows
        const rowHeight = getTranslateY(rows[1]);
        if (!rowHeight || rowHeight < 1) {
            targetRow.remove();
            return;
        }

        // Always shift rows below the target row
        const targetIndex = rows.indexOf(targetRow);
        for (let i = targetIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            const y = getTranslateY(row);
            if (y !== null) setTranslateY(row, y - rowHeight);
        }

        // Only adjust list height once per list instance
        if (!list.hasAttribute(LIST_ADJUSTED_ATTR)) {
            tryAdjustInlineHeight(list, rowHeight);
            list.setAttribute(LIST_ADJUSTED_ATTR, '1');
        }

        targetRow.remove();
    }

    function processExpandedGroups(root = document) {
        const expandedGroups = root.querySelectorAll('[aria-hidden="false"][data-collapsed="false"]');
        for (const group of expandedGroups) processGroup(group);
    }

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList' && m.addedNodes?.length) {
                processExpandedGroups(document);
                return;
            }
            if (m.type === 'attributes' && (m.attributeName === 'aria-hidden' || m.attributeName === 'data-collapsed')) {
                processExpandedGroups(document);
                return;
            }
        }
    });

    observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'data-collapsed'],
    });

    processExpandedGroups(document);
})();
