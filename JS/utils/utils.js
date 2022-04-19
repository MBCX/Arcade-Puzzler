let current_a11y_string = "";
let MASTER_AUDIO = new Audio();
export const BROWSER_STRINGS = {
    CHROMIUM: "Chromium",
    FIREFOX: "Firefox",
    SAFARI: "Safari",
    SAFARI_MOBILE: "Safari Mobile",
    IE: "Internet Explorer"
};

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

export function setDarkMode(enable) {
    document.documentElement.classList.toggle("dark-mode", enable);
}

export function setLocalStorageItem(key, value)
{
    window.localStorage.setItem(key, value);
}

export function removeLocalStorageKey(key)
{
    window.localStorage.removeItem(key);
}

export function getLocalStorageKey(key)
{
    window.localStorage.getItem(key);
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
    if (sound_type.includes("wav")) {
        MASTER_AUDIO.src = `../../assets/audio/${sound_type}`;
    } else {
        MASTER_AUDIO.src = `../../assets/audio/${sound_type}.wav`;
    }
    MASTER_AUDIO.volume = volume;

    MASTER_AUDIO.play().then(() => {
        return Promise.resolve();
    });
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
