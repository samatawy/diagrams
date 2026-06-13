/**
 * Shared DOM utilities for editor components.
 * All functions are browser-safe: they guard against SSR/non-DOM environments.
 */

/**
 * Injects a <style> element into document.head identified by id.
 * No-op if the element already exists or document is unavailable.
 */
export function injectStyles(id: string, css: string): void {
    if (typeof document === 'undefined' || document.getElementById(id)) {
        return;
    }
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Adds each unique, non-empty class name from names to el.
 * Duplicates and empty strings are silently ignored.
 */
export function setClasses(el: Element, ...names: string[]): void {
    for (const name of new Set(names.filter(Boolean))) {
        el.classList.add(name);
    }
}

/**
 * Toggles each unique, non-empty class name from names on el according to force.
 */
export function toggleClasses(el: Element, force: boolean, ...names: string[]): void {
    for (const name of new Set(names.filter(Boolean))) {
        el.classList.toggle(name, force);
    }
}

/**
 * Removes each unique, non-empty class name from names from el.
 */
export function removeClasses(el: Element, ...names: string[]): void {
    for (const name of new Set(names.filter(Boolean))) {
        el.classList.remove(name);
    }
}
