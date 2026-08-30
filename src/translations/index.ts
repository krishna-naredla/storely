import { en } from './en';
import { te } from './te';
import { hi } from './hi';

export const translations = {
  en,
  te,
  hi
};

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof en;
