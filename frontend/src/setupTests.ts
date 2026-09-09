// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import i18n from './i18n';

// Keep i18next from logging missing translation keys during tests.
i18n.options.debug = false;
i18n.language = "en";

// i18n keys are the literal English source strings (keySeparator: false), so forcing the
// language to "en" makes t("Some label") echo the key back — assertions can match on English.
beforeAll(async () => {
  await i18n.changeLanguage("en");
});

// jsdom doesn't implement matchMedia / ResizeObserver, both of which MUI relies on
// (useMediaQuery, <Hidden>, responsive components, x-data-grid, ...).
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// A ResizeObserver that reports a fixed non-zero size on observe(), so components that
// size themselves from their container (MUI x-data-grid especially) render content.
(window as any).ResizeObserver = class {
  private cb: (entries: unknown[], observer: unknown) => void;
  constructor(cb: (entries: unknown[], observer: unknown) => void) {
    this.cb = cb;
  }
  observe(target: Element) {
    this.cb([{ target, contentRect: { width: 800, height: 600 } }], this);
  }
  unobserve() {}
  disconnect() {}
};

// jsdom returns 0 for every layout box; give elements a usable size for the same reason.
for (const [prop, value] of [
  ["offsetHeight", 600],
  ["offsetWidth", 800],
  ["clientHeight", 600],
  ["clientWidth", 800],
] as const) {
  if (Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)?.get) continue;
  Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => value });
}
