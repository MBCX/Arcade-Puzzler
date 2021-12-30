import i18nManager from "../i18n/i18nClass.js";
import { setGameLanguageBasedOn } from "../utils/utils.js";

export const game_i18n_lang = import(`../i18n/lang/${setGameLanguageBasedOn(navigator.language)}.js`);
export const i18nmanager = new i18nManager();
export const ARIA_TYPES = {
    NONE: 0,
    ARIA_LABEL: 1,
    TITLE: 2,
    ALT_IMAGES: 3,
    INSIDE_ELEMENT: -1
}
export const AUDIO_TYPES = {
    FX: {
        TITLE: "sn_title_screen.wav",
        MOVE_PIECE: "sn_move_piece.wav",
        BAD_MOVE_PIECE: "sn_bad_move_piece.wav",
        MOVE_IN_GRID: "sn_move_grid.wav",
        WIN: "sn_win.wav",
        ENTER: "sn_enter_click.wav"
    },
    MUSIC: {

    }
}