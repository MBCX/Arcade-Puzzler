import i18nManager from "../i18n/i18nClass.js";
import { setGameLanguageBasedOn } from "../utils/utils.js";

export const game_i18n_lang = import(`../i18n/lang/${setGameLanguageBasedOn(navigator.language)}.js`);
export const i18nmanager = new i18nManager();
export const DEV_MODE = false;
export const ARIA_TYPES = {
    NONE: 0,
    ARIA_LABEL: 1,
    TITLE: 2,
    ALT_IMAGES: 3,
    INSIDE_ELEMENT: -1
}
export const SOUND_DEFAULTS = {
    DEFAULT_VOLUME: 0.5,
};
export const BROWSER_STRINGS = {
    CHROMIUM: "Chromium",
    FIREFOX: "Firefox",
    SAFARI: "Safari",
    SAFARI_MOBILE: "Safari Mobile",
    IE: "Internet Explorer",
};
export const COLOUR_THEMES = {
    LIGHT: "light",
    DARK: "dark",
    RETRO: "retro",
    AUTO: "automatic",
};
export const GAME_KEYS = {
    THEME: "game-theme",
    BLOCKS_ANIMATE: "animate-blocks",
    CHEAT_MODE: "cheat-mode",
};