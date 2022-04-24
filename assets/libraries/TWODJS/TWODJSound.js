import { SOUND_DEFAULTS } from "../../../JS/shared/shared.js";
import TWODJSUtils from "./utils/TWODJSUtils.js";

/* 
Variables are here because TypeScript does not
want to work with private variables on static
methods.
*/
const MAX_VOLUME = 1.0;

// Both, music and sfx are enabled by
// default.
let music_enabled = true;
let sfx_enabled = true;

const sounds = {};
const sound_channels = {};
const volumes = {};
const expendable_channels = new Array();
const expendable_sounds = new Array();
const sound_loops = {};

// Max amount of sounds that can
// be added to the game.
const MAX_EXPENDABLES = 64;
let play_sounds = false;

/** Class that handles everything related to sound. */
class TWODJSSound {
    static init() {
        window.addEventListener("keydown", this.can_play_sounds, { once: true });
        window.addEventListener("mousedown", this.can_play_sounds, { once: true });
    }

    /**
     * Returns true if we can play sounds through
     * the browser.
     */
    can_play_sounds() {
        if (!play_sounds) {
            play_sounds = true;
        }
        return play_sounds;
    }

    /**
     * Special internal function that runs each time a new
     * audio has been added to configure its name and audio levels.
     */
    each_loaded_audio_data(name, volume) {
        // Nullesh coelasing here because this may load
        // faster than the SOUND_DATA_STATE struct.
        const data_target = TWODJSUtils.SOUND_DATA_STATE?.HAVE_CURRENT_DATA ?? 2;

        // This audio can be played.
        if (sounds[name].readyState >= data_target) {
            sounds[name].volume = volumes[name] * volume;
            sound_channels[name] = sounds[name];
        }

        // Auto clean-up.
        sounds[name].removeEventListener(
            "loadeddata",
            TWODJSSound.prototype.each_loaded_audio_data.bind(this)
        );
    }

    /**
     * Enables and/or disables global game music.
     */
    static change_music_state() {
        music_enabled = !music_enabled;
    }

    /**
     * Enables and/or disables global sound effects.
     */
    static change_sfx_state() {
        sfx_enabled = !sfx_enabled;
    }

    /**
     * Adds a new sound to the sound system. This function
     * MUST BE CALLED FIRST before trying to play any sounds.
     * @param sound_src String source path to find the audio (can be both relative and absolute pahts).
     * @param name Simple name to uniquely identify this audio file.
     * @param volume Volume for this audio. Must be between 0.0 and 1.0 (1.0 by default)
     */
    static add_sound(
        sound_src,
        name,
        volume = SOUND_DEFAULTS.DEFAULT_VOLUME
    ) {
        sounds[name] = new Audio(sound_src);
        volumes[name] = volume;
        sounds[name].addEventListener(
            "loadeddata",
            this.prototype.each_loaded_audio_data.bind(this, name, volume)
        );
    }

    /**
     * Plays a sound though is unique name (defined by add_sound).
     * The name of the sound can be an array of names, if it is,
     * it will randomly pick between each name in the array (as default behaviour).
     * If not random, each one will be played after the other.
     * @param name One or an array of sound names (randomly chosen if its an array.)
     * @param volume
     * @param override_at_each_sound Do you want the same sound to cancel itself if it's already playing?
     * @param priority Should this sound be prioritised over other sounds?
     * @param pick_randomly If sound and volume are and array, do you want to pick one and play at random?
     */
    static play_sound(
        name,
        volume = SOUND_DEFAULTS.DEFAULT_VOLUME,
        override_at_each_sound = false,
        priority = false,
        pick_randomly = false
    ) {
        const can_play = this.prototype.can_play_sounds();
        if (Array.isArray(name)) {
        } else {
            if (!sfx_enabled || !sounds[name]) {
                console.warn(`The sound: ${name} does not exists.`);
                return;
            }

            if (can_play) {
                if (priority) {
                    if (!sound_channels[name]) {
                        this.reseve_sound_channel();
                        sound_channels[name].volume = volume;
                        sound_channels[name].play();
                        return;
                    }
                } else {
                    if (!expendable_sounds.includes(sounds[name])) {
                        expendable_channels.push(sound_channels[name]);
                        expendable_sounds.push(sounds[name]);
                    }

                    if (expendable_channels.length >= MAX_EXPENDABLES) {
                        // this.garbage_collect_expendable_channels();
                    }
                }

                if (override_at_each_sound && this.is_audio_playing(name)) {
                    this.stop_sound(name);
                }
                sound_channels[name].volume = volume;
                sound_channels[name].play();
            }
        }
    }

    /**
     * Stops a specific sound from playing.
     * @param name Name of the sound.
     */
    static stop_sound(name) {
        if (sound_channels[name]) {
            sound_channels[name].pause();
            sound_channels[name].currentTime = 0;
        }

        if (sound_loops[name]) {
            delete sound_loops[name];
        }
    }

    /**
     * Determines if a given audio (by its name) is
     * currently playing or not.
     * @param name Name of the sound.
     */
    static is_audio_playing(name) {
        if (!TWODJSUtils.is_undefined(sound_channels[name])) {
            const time_curr = sound_channels[name].currentTime;
            const time_dur = sound_channels[name].duration;
            return 0 < time_curr && time_curr != time_dur;
        }
        return false;
    }

    /**
     * For each sound that needs priority, this method
     * will reserve a channel for it. Meaning it will
     * always be at the top of the class's internal
     * audio list.
     */
    static reseve_sound_channel() {
        for (let i = 0; expendable_channels.length > i; ++i) {
            if (expendable_channels[i].duration < expendable_sounds[i].length) {
                expendable_channels[i].stop();
                expendable_channels.splice(i, 1);
                expendable_sounds.splice(i, 1);
                --i;
            }
        }
    }

    /**
     * Method that automatically takes care of the maximum
     * amount of sounds that the engine can play.
     */
    static garbage_collect_expendable_channels() {}
}

export { TWODJSSound };