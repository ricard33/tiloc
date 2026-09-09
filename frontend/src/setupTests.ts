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

if (!(window as any).ResizeObserver) {
  (window as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
