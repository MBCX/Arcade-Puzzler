import { BROWSER_STRINGS, COLOUR_THEMES, GAME_KEYS } from "../shared/shared.js";

let current_a11y_string = "";
let MASTER_AUDIO = new Audio();

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function wrap(variable, wrap_min, wrap_max) {
    const _limiter = (variable - wrap_min) % (wrap_max - wrap_min);
    if (0 > _limiter) {
        return _limiter + wrap_max;
    }
    return _limiter + wrap_min;
}

export function setGameLanguageBasedOn(lang) {
    if (lang.includes("es")) {
        return "es";
    }

    switch (lang) {
        case "en-GB":
        case "en-AU":
        case "en-IN":
        case "en-NZ":
        case "en-ZA":
            return "en-GB";

        case "en-US":
        case "en":
        case "en-CA":
        case "en-GB-oxendict":
            return "en";
        default:
            return "en";
    }
}


export function setGameTheme(themeKey) {
    switch (themeKey) {
        case undefined:
        case null:
        case COLOUR_THEMES.AUTO:
            setLocalStorageItem(GAME_KEYS.THEME, COLOUR_THEMES.AUTO);
            document.documentElement.setAttribute(
                "data-theme",
                window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? COLOUR_THEMES.DARK
                    : COLOUR_THEMES.LIGHT
            );
            break;
        case COLOUR_THEMES.DARK:
            setLocalStorageItem(GAME_KEYS.THEME, COLOUR_THEMES.DARK);
            document.documentElement.setAttribute(
                "data-theme",
                COLOUR_THEMES.DARK
            );
            break;
        case COLOUR_THEMES.LIGHT:
            setLocalStorageItem(GAME_KEYS.THEME, COLOUR_THEMES.LIGHT);
            document.documentElement.setAttribute(
                "data-theme",
                COLOUR_THEMES.LIGHT
            );
            break;
        case COLOUR_THEMES.RETRO:
            setLocalStorageItem(GAME_KEYS.THEME, COLOUR_THEMES.RETRO);
            document.documentElement.setAttribute(
                "data-theme",
                COLOUR_THEMES.RETRO
            );
            break;
    }
}

export function setGameCubesAnimated(key) {
    switch (key) {
        case undefined:
        case null:
            setLocalStorageItem(GAME_KEYS.BLOCKS_ANIMATE, "true");
            break;
        case "false":
            setLocalStorageItem(GAME_KEYS.BLOCKS_ANIMATE, "false");
            break;
    }
}

export function setLocalStorageItem(key, value) {
    window.localStorage.setItem(key, value);
}

export function removeLocalStorageKey(key) {
    window.localStorage.removeItem(key);
}

export function getLocalStorageKey(key) {
    return window.localStorage.getItem(key);
}

export function updateA11yAlert(text, force_reset) {
    current_a11y_string = text;
    const alert_element = document.querySelector("#a11y-alert");

    if (force_reset) {
        alert_element.innerText = "";
        alert_element.innerText = text;
    } else {
        if (current_a11y_string.trim() === alert_element.innerText.trim()) {
            return;
        }
        alert_element.innerText = "";
        alert_element.innerText = text;
    }
}

/**
 * Returns the sum of a number of dice rolls using
 * dice with a given number of sides.
 * @param {Number} roll_amount The amount of times to roll.
 * @param {Number} sides Amount of sides of the dice.
 */
export function roll_dice(roll_amount, sides) {
    let sum = 0;
    for (; roll_amount > 0; --roll_amount) {
        sum += Math.floor(Math.random() * sides) + 1;
    }
    return sum;
}

export function playSound(sound_type, volume = 0.5) {
    return new Promise((resolve, reject) => {
        if (sound_type.includes("wav")) {
            MASTER_AUDIO.src = `../../assets/audio/${sound_type}`;
        } else {
            MASTER_AUDIO.src = `../../assets/audio/${sound_type}.wav`;
        }
        MASTER_AUDIO.volume = volume;
        MASTER_AUDIO.play()
            .then(() => {
                resolve(true);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

export function stopAllAudio() {
    MASTER_AUDIO.pause();
    MASTER_AUDIO.currentTime = 0;
}

export function isAudioPlaying(audio) {
    const time_curr = audio.currentTime;
    const time_dur = audio.duration;
    return 0 < time_curr && time_curr != time_dur;
}

export function detectBrowser() {
    if (CSS.supports("-webkit-app-region", "inherit")) {
        return BROWSER_STRINGS.CHROMIUM;
    } else if (CSS.supports("-moz-animation", "none")) {
        return BROWSER_STRINGS.FIREFOX;
    } else if (CSS.supports("-apple-pay-button-style", "none")) {
        return BROWSER_STRINGS.SAFARI;
    } else if (CSS.supports("-webkit-touch-callout", "inherit")) {
        return BROWSER_STRINGS.SAFARI_MOBILE;
    }
    return window.navigator.userAgent;
}
