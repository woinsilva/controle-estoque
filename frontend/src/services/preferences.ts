import { i18n } from '../i18n';

export type ThemeMode = 'light' | 'dark';
export type LocaleCode = 'pt' | 'en' | 'es';

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('app-dark', theme === 'dark');
}

export function applyLocale(locale: LocaleCode) {
  i18n.global.locale.value = locale;
}

export function applyPreferences(locale: LocaleCode, theme: ThemeMode) {
  applyLocale(locale);
  applyTheme(theme);
}
