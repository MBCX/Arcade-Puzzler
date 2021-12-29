import "../assets/libraries/swup/swup.min.js";
import "../assets/libraries/swup/plugins/SwupA11yPlugin.min.js";
import "../assets/libraries/swup/plugins/SwupDebugPlugin.min.js";
import {wrap, clamp, setDarkMode, setGameLanguageBasedOn, roll_dice, playSound, } from "./utils/utils.js";
import {setAndUpdatei18nString, updatei18nAria} from "./i18n/i18nManager.js";
import {ARIA_TYPES, AUDIO_TYPES, game_i18n_lang, i18nmanager} from "./shared/shared.js";

const GRID_POSITION = {
    FIRST_ROW_COLUMN: 0,
    SECOND_ROW_COLUMN: 1,
    THIRD_ROW_COLUMN: 2,
    LAST_ROW_COLUMN: 3,
};

const MOVE_RQST = {
    LEFT: 0,
    RIGHT: 1,
    UP: 2,
    DOWN: 3,
};

const CONFIG_MODE = {
    STANDARD: 0, // 1 - 15 horizontal.
    VERTICAL: 1, // 1 - 15 vertical.
    STANDARD_INVERTED: 2, // 15 - 1 horizontal.
    VERTICAL_INVERTED: 3, // 15 - 1 vertical.
};

// Grid amount + blank grid.
let MAX_AMOUNT_ITEMS_GRID;
let date_current;
let number_container;
let A11Y_DELAY_BETWEEN_BTN_NUMBERS;
let list_of_grid_numbers;
let last_time_render;
let delta_time;
let move_amount;
let current_index;
let can_play;
let blank_btn;
let a11y_mode;
let element_up_blank_btn;
let element_down_blank_btn;
let a11y_btn_say_delay;
let blank_btn_at_grid;
let config_mode;
let config_dialogue_selected_config = 0;

// Used for moving with the arrow or
// W or S in the main menu buttons.
let menu_button_index = 0;

export const swup = new Swup({
    plugins: [new SwupA11yPlugin(), new SwupDebugPlugin()],
    cache: false,
});

function checkWinningCondition()
{
    const number_container_lis = document.querySelectorAll("#number-container li");

    for (let i = 0; MAX_AMOUNT_ITEMS_GRID > i; ++i) {
        const li_pos_value = Number(number_container_lis[i].getAttribute("btn-pos"));
        if (li_pos_value !== i) {
            console.log("Player has not won, yet.");
            return;
        }
    }
    
    // Player has won!
    can_play = false;
    console.log("PLAYER HAS WON THE GAME!!!!")
}

function reset() {
    MAX_AMOUNT_ITEMS_GRID = 15;
    date_current = new Date().getTime();
    number_container = document.querySelector("#number-container");
    A11Y_DELAY_BETWEEN_BTN_NUMBERS = 5;
    list_of_grid_numbers = [];
    last_time_render;
    delta_time;
    move_amount = 0;
    current_index = 0;
    can_play = false;
    blank_btn = null;
    a11y_mode = window.localStorage.getItem("a11yModeEnabled") ?? false;
    element_up_blank_btn = null;
    element_down_blank_btn = null;
    a11y_btn_say_delay = 0;
    blank_btn_at_grid = GRID_POSITION.LAST_ROW_COLUMN;
    config_mode = CONFIG_MODE.STANDARD;

    if (document.querySelector("#number-container")) {
        // Allow keyboard play and navigation of grid.
        number_container.removeEventListener("keydown", handleGridKeyboardMovement);
        number_container.addEventListener("keydown", handleGridKeyboardMovement);
    }
    window.requestAnimationFrame(gameUpdateLoop);
}

function checkBlankPosInBoard() {
    for (let i = number_container.children.length; 0 < i; --i) {
        if (document.querySelector("#blank") == number_container.children.item(i)) {
            return i;
        }
    }
}

function correctCurrentIndexGrid(type)
{
    const button_offset = 2;
    const index_mod = current_index % (GRID_POSITION.LAST_ROW_COLUMN + 1);
    switch (type) {
        case "up":
            if (
                index_mod === GRID_POSITION.FIRST_ROW_COLUMN ||
                index_mod === GRID_POSITION.SECOND_ROW_COLUMN ||
                index_mod === GRID_POSITION.THIRD_ROW_COLUMN
            ) {
                current_index = current_index - (button_offset * 2);
            } else {
                current_index = current_index - (index_mod + button_offset);
            }
            break;
        case "down":
            if (
                index_mod === GRID_POSITION.FIRST_ROW_COLUMN ||
                index_mod === GRID_POSITION.SECOND_ROW_COLUMN ||
                index_mod === GRID_POSITION.THIRD_ROW_COLUMN
            ) {
                current_index = current_index + (button_offset * 2);
            } else {
                current_index = current_index + (index_mod + button_offset);
            }
            break;
    }
}

function handleGridKeyboardMovement(e)
{
    const buttons = document.querySelectorAll("#number-container li button");

    // Allow the user to exit the game via the back button.
    if ("Escape" === e.key) {
        const menu_btn = document.querySelector("#back-to-main-menu");
        e.preventDefault();
        menu_btn.focus();
        return;
    }

    // Control focus of buttons.
    if (can_play) {
        if ("ArrowLeft" === e.key || "a" === e.key || "A" === e.key) {
            current_index--;
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        } else if ("ArrowRight" === e.key || "d" === e.key || "D" === e.key) {
            current_index++;
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        } else if ("ArrowUp" === e.key || "W" === e.key || "w" === e.key) {
            correctCurrentIndexGrid("up");
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        } else if ("ArrowDown" === e.key || "S" === e.key || "s" === e.key) {
            correctCurrentIndexGrid("down");
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        }
        current_index = clamp(current_index, 0, buttons.length - 1);
        buttons[current_index].focus();
    }
}

/**
 * @returns [left_el, right_el, top_el, bottom_el]
 */
function getElementsAroundBlankBtn() {
    const pos = checkBlankPosInBoard();
    const blank_btn_pos_index = undefined == pos ? 0 : pos;
    const element_left_blank_btn = number_container.children.item(blank_btn_pos_index - 1);
    const element_right_blank_btn = number_container.children.item(blank_btn_pos_index + 1);
    element_up_blank_btn = number_container.children.item(blank_btn_pos_index - 4);
    element_down_blank_btn = number_container.children.item(blank_btn_pos_index + 4);

    return [element_left_blank_btn, element_right_blank_btn, element_up_blank_btn, element_down_blank_btn, ];
}

function checkIfWeCanMove(move_request, element) {
    const pos = checkBlankPosInBoard();
    const blank_btn_pos_index = undefined == pos ? 0 : pos;
    const element_left_blank_btn = number_container.children.item(blank_btn_pos_index - 1);
    const element_right_blank_btn = number_container.children.item(blank_btn_pos_index + 1);
    element_up_blank_btn = number_container.children.item(blank_btn_pos_index - 4);
    element_down_blank_btn = number_container.children.item(blank_btn_pos_index + 4);

    // The blank button can only move if
    // the requested element target is the
    // one needed to actually move (and it
    // exists).
    switch (move_request) {
    case MOVE_RQST.LEFT:
        return (null != blank_btn.previousElementSibling && element == element_left_blank_btn);
    case MOVE_RQST.RIGHT:
        return (null != blank_btn.nextElementSibling && element == element_right_blank_btn);
    case MOVE_RQST.UP:
        return (null != element_up_blank_btn && element == element_up_blank_btn);
    case MOVE_RQST.DOWN:
        return (null != element_down_blank_btn && element == element_down_blank_btn);
    }
}

// Tell to screen readers wich buttons they
// can move to wich direction.
let last_touched_element = null;
function tellA11yWichButtonToMove() {
    const buttons = document.querySelectorAll("#number-container li button");
    const elements_around_blank_btn = getElementsAroundBlankBtn();
    const target_inner_id = buttons[current_index].innerText;

    if (a11y_mode) {
        for (let i = 0; elements_around_blank_btn.length > i; ++i) {
            if (buttons[current_index].offsetParent == elements_around_blank_btn[i]) {
                switch (i) {
                    // left.
                case 0:
                    if (last_touched_element != elements_around_blank_btn[i]) {
                        setAndUpdatei18nString(true, {
                            a11y__button_can_move_right: target_inner_id,
                        }, true);
                        last_touched_element = buttons[current_index].offsetParent;
                        a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                    }
                    break;
                    // right.
                case 1:
                    if (last_touched_element != elements_around_blank_btn[i]) {
                        setAndUpdatei18nString(true, {
                            a11y__button_can_move_left: target_inner_id,
                        }, true);
                        last_touched_element = buttons[current_index].offsetParent;
                        a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                    }
                    break;
                    // up.
                case 2:
                    if (last_touched_element != elements_around_blank_btn[i]) {
                        setAndUpdatei18nString(true, {
                            a11y__button_can_move_down: element_up_blank_btn.innerText,
                        }, true);
                        last_touched_element = buttons[current_index].offsetParent;
                        a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                    }
                    break;
                    // down.
                case 3:
                    if (last_touched_element != elements_around_blank_btn[i]) {
                        setAndUpdatei18nString(true, {
                            a11y__button_can_move_up: element_down_blank_btn.innerText,
                        }, true);
                        last_touched_element = buttons[current_index].offsetParent;
                        a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                    }
                    break;
                }
            }
        }
    }
}

function gameUpdateLoop(time) {
    function handleButtonMovement(e) {
        checkWinningCondition();

        if (can_play) {
            const li_target = e.target.offsetParent;
    
            // Left and right movement.
            if (checkIfWeCanMove(MOVE_RQST.LEFT, li_target)) {
                li_target.before(blank_btn);
                move_amount++;
                a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                setAndUpdatei18nString(true, {
                    a11y__button_moved_right: e.target.innerText,
                });
                playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                blank_btn_at_grid -= 1;
            } else if (checkIfWeCanMove(MOVE_RQST.RIGHT, li_target)) {
                li_target.after(blank_btn);
                move_amount++;
                setAndUpdatei18nString(true, {
                    a11y__button_moved_left: e.target.innerText,
                });
                a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                blank_btn_at_grid += 1;
            } else if (checkIfWeCanMove(MOVE_RQST.UP, li_target)) {
                // Up and down movement.
                const new_blank_btn = document.createElement("li");
                const new_li_target = e.target.offsetParent.nextElementSibling;
                blank_btn.before(li_target);
    
                blank_btn.remove();
                new_blank_btn.id = "blank";
    
                blank_btn = new_blank_btn;
                number_container.append(new_blank_btn);
                new_li_target.before(new_blank_btn);
                move_amount++;
                setAndUpdatei18nString(true, {
                    a11y__button_moved_down: e.target.innerText,
                });
                a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                e.target.focus();
                playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                correctCurrentIndexGrid("down");
            } else if (checkIfWeCanMove(MOVE_RQST.DOWN, li_target)) {
                const new_blank_btn = document.createElement("li");
                const new_li_target = document.querySelector(`[btn-pos="${parseInt(e.target.innerText - 1)}"] + [btn-pos]`);
                blank_btn.after(li_target);
    
                blank_btn.remove();
                new_blank_btn.id = "blank";
    
                blank_btn = new_blank_btn;
                number_container.append(new_blank_btn);
    
                // If this is null, it means that
                // we're moving the very last item
                // at the grid.
                if (null != new_li_target) {
                    new_li_target.before(new_blank_btn);
                }
                move_amount++;
                setAndUpdatei18nString(true, {
                    a11y__button_moved_up: e.target.innerText,
                });
                a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                e.target.focus();
                playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                correctCurrentIndexGrid("up");
            } else {
                setAndUpdatei18nString(true, {
                    a11y__button_cant_move: e.target.innerText,
                }, true);
                playSound(AUDIO_TYPES.FX.BAD_MOVE_PIECE);
            }
        }
    }

    function generateGridButtons() {
        function createBlankBtn() {
            if (!document.querySelector("li#blank")) {
                const blank = document.createElement("li");
                number_container.append(blank);
                blank.setAttribute("id", "blank");
                setAndUpdatei18nString(true, ["a11y__generated_grid_numbers", "a11y__how_to_play", ]);
            }
        }

        if (number_container.children.length < MAX_AMOUNT_ITEMS_GRID) {
            setAndUpdatei18nString(true, "a11y__generating_grid_numbers");
            let li_slot = roll_dice(1, 15);

            if (!list_of_grid_numbers.includes(li_slot)) {
                const new_li = document.createElement("li");
                const new_btn = document.createElement("button");
                new_li.setAttribute("btn-pos", li_slot - 1);
                number_container.append(new_li);
                new_li.append(new_btn);
                new_btn.innerText = li_slot;
                new_btn.addEventListener("click", handleButtonMovement);
                new_li.animate([{
                    transform: "translateY(100%)",
                    opacity: 0,
                }, {
                    transform: "translateY(0)",
                    opacity: 1,
                }, ], {
                    duration: 500,
                    easing: "ease",
                    fill: "forwards",
                });
                list_of_grid_numbers.push(li_slot);
            }
        } else {
            can_play = true;
            createBlankBtn();
        }
    }

    function calculateTimeAmount() {
        // REFERENCE: https://stackoverflow.com/questions/31559469/how-to-create-a-simple-javascript-timer
        if (can_play) {
            const now = new Date().getTime();
            const difference = date_current - now;
            let hours = Math.abs(Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) - 1;
            let minutes = Math.abs(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))) - 1;
            let seconds = Math.abs(Math.floor((difference % (1000 * 60)) / 1000));

            seconds = 10 > seconds ? "0" + seconds : seconds;
            minutes = 10 > minutes ? "0" + minutes : minutes;
            hours = 10 > hours ? "0" + hours : hours;
            return `${hours}:${minutes}:${seconds}`;
        }
        return "00:00:00";
    }

    if (null != last_time_render) {
        let time_amount = "";
        delta_time = time - last_time_render;

        time_amount = calculateTimeAmount(delta_time);

        // Set light or dark mode.
        setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
        generateGridButtons();

        blank_btn = document.querySelector("#blank");

        setAndUpdatei18nString(false, time_amount, false, document.querySelector(`[data-i18n-id="game__time"]`));
        setAndUpdatei18nString(false, move_amount, false, document.querySelector(`[data-i18n-id="game__moves"]`));

        // Aria labels.
        updatei18nAria(document.querySelector("#back-to-main-menu"), ARIA_TYPES.ARIA_LABEL);
        updatei18nAria(document.querySelector("#back-to-main-menu"), ARIA_TYPES.TITLE);

        if (a11y_btn_say_delay > 0) {
            a11y_btn_say_delay -= 1 / delta_time;
        }

        if (a11y_mode && a11y_btn_say_delay === 0) {
            tellA11yWichButtonToMove();
        }
        a11y_btn_say_delay = clamp(a11y_btn_say_delay, 0, A11Y_DELAY_BETWEEN_BTN_NUMBERS);
        blank_btn_at_grid = clamp(blank_btn_at_grid, 0, GRID_POSITION.LAST_ROW_COLUMN);
    }
    last_time_render = time;
    window.requestAnimationFrame(gameUpdateLoop);
}

function moveBetweenMenuButtons(e) {
    const all_links = document.querySelectorAll(".link-group a");

    if (
        ("ArrowUp" === e.key || "W" === e.key || "w" === e.key) ||
        ("ArrowLeft" === e.key || "A" === e.key || "a" === e.key)
    ) {
        menu_button_index--;
    } else if (
        ("ArrowDown" === e.key || "S" === e.key || "s" === e.key) ||
        ("ArrowRight" === e.key || "D" === e.key || "d" === e.key)
    ) {
        menu_button_index++;
    }
    menu_button_index = wrap(menu_button_index, 0, all_links.length);
    all_links[menu_button_index].focus();
}

function enableSoundByClicking()
{
    initMainMenu();
    document.removeEventListener("click", enableSoundByClicking);
    document.removeEventListener("keydown", enableSoundByClicking);
    document.querySelector("#enable-sound").remove();
}

function initMainMenu()
{
    game_i18n_lang.then(()=>{
        // Set language.
        setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.lang = setGameLanguageBasedOn(navigator.language);
    
        if (document.querySelector("[is-main-page]")) {
            const all_spans = document.querySelectorAll("#intro-cutscene .animated-text-container .text-wrapper span");
            all_spans.forEach((span, i) => {
                // span.style = `--delay: ${i + 1}`;
                span.animate([
                    {
                        opacity: 0,
                        transform: "translateY(110%)"
                    },
                    {
                        opacity: 1,
                        transform: "translateY(0%)"
                    }],
                    {
                        duration: 800,
                        easing: "linear",
                        delay: (i + 1) * 50,
                        fill: "forwards"
                    }
                ).addEventListener("finish", () => {
                    const fire = document.querySelector(".fire");
                    const animated_container = document.querySelector(".animated-text-container");

                    if (span == all_spans[all_spans.length - 1]) {
                        fire.setAttribute("style", `
                            animation: animate_fire 1000ms steps(9) reverse forwards, generic_fadeout 800ms linear forwards;
                        `);
                        playSound(AUDIO_TYPES.FX.TITLE);
                        fire.addEventListener("animationend", () => {
                            animated_container.setAttribute("style", `
                                animation: generic_fadeout 1000ms linear 3100ms forwards;
                            `);
                            animated_container.addEventListener("animationend", () => {
                                document.querySelector("#intro-cutscene").animate([
                                    { transform: "translateY(0%)", transform: "translateY(-100%)" }
                                ], {
                                    duration: 1000,
                                    easing: "cubic-bezier(0.76, 0.02, 1, 1.01)",
                                    delay: 4100,
                                    fill: "forwards",
                                }).addEventListener("finish", () => {
                                    if (document.querySelector("#intro-cutscene")) {
                                        document.querySelector("#intro-cutscene").remove();
                                    }
                                });
                            });
                        });
                    }
                });
            });
    
            updatei18nAria(document.querySelector("#game-title"), ARIA_TYPES.INSIDE_ELEMENT);
    
            // Intro buttons.
            updatei18nAria(document.querySelector("#game_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            updatei18nAria(document.querySelector("#settings_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            updatei18nAria(document.querySelector("#exit_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            updatei18nAria(document.querySelector("#feedback_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            document.querySelector(".link-group").addEventListener("keydown", moveBetweenMenuButtons);
        }
    });    
}

function addAgainEventListenerForMenuGroup()
{
    menu_button_index = 0;
    document.querySelector(".link-group").removeEventListener("keydown", moveBetweenMenuButtons);
    document.querySelector(".link-group").addEventListener("keydown", moveBetweenMenuButtons);
}

function controlGameConfigDialogue()
{
    const dialogue_btn_prev = document.querySelector("#carousel-btn-prev");
    const dialogue_btn_next = document.querySelector("#carousel-btn-next");
    const all_dialogues_amount = document.querySelectorAll(".carousel__item").length;

    dialogue_btn_next.addEventListener("click", () => {
        const current_carousel = document.querySelector(".carousel__item.selected");
        config_dialogue_selected_config++;
        config_dialogue_selected_config = clamp(config_dialogue_selected_config, 0, all_dialogues_amount);
        
        dialogue_btn_prev.classList.remove("last");
        
        if (
            all_dialogues_amount - 1 === config_dialogue_selected_config ||
            all_dialogues_amount === config_dialogue_selected_config
        ) {
            dialogue_btn_next.classList.add("last");
        }

        if (current_carousel.nextElementSibling.classList.contains("carousel__item")) {
            current_carousel.classList.remove("selected");
            current_carousel.nextElementSibling.classList.add("selected");
        }
    });

    dialogue_btn_prev.addEventListener("click", () => {
        const current_carousel = document.querySelector(".carousel__item.selected");
        config_dialogue_selected_config--;
        config_dialogue_selected_config = clamp(config_dialogue_selected_config, 0, all_dialogues_amount);
        dialogue_btn_next.classList.remove("last");
        
        if (
            1 === config_dialogue_selected_config ||
            0 === config_dialogue_selected_config
        ) {
            dialogue_btn_prev.classList.add("last");
        }

        if (current_carousel.previousElementSibling.classList.contains("carousel__item")) {
            current_carousel.classList.remove("selected");
            current_carousel.previousElementSibling.classList.add("selected");
        }
    });
}

// Swup specific listeners.
document.addEventListener("swup:pageView", function() {
    if ("/game.html" === window.location.pathname) {
        controlGameConfigDialogue();
        // reset();
        // window.requestAnimationFrame(gameUpdateLoop);
    } else if ("/" === window.location.pathname || "/index.html" === window.location.pathname) {
        window.cancelAnimationFrame(gameUpdateLoop);
        game_i18n_lang.then(()=>{
            updatei18nAria(document.querySelector("#game-title"), ARIA_TYPES.INSIDE_ELEMENT);

            // Intro buttons.
            updatei18nAria(document.querySelector("#game_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            updatei18nAria(document.querySelector("#settings_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            updatei18nAria(document.querySelector("#exit_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            updatei18nAria(document.querySelector("#feedback_btn"), ARIA_TYPES.INSIDE_ELEMENT);
            addAgainEventListenerForMenuGroup();
        });
    }
});

document.addEventListener("swup:contentReplaced", function() {
    if ("/" === window.location.pathname || "/index.html" === window.location.pathname) {
        window.cancelAnimationFrame(gameUpdateLoop);
        addAgainEventListenerForMenuGroup();
    }
});

if (document.querySelector("#enable-sound")) {
    game_i18n_lang.then(() => {
        if (navigator.userAgent.includes("Mobile")) {
            document.querySelector("#enable-sound").setAttribute("data-i18n-id", "game__sound_please_enable_mobile");
            document.addEventListener("click", enableSoundByClicking);
            updatei18nAria(document.querySelector("#enable-sound"), ARIA_TYPES.INSIDE_ELEMENT);
            return;
        }
        updatei18nAria(document.querySelector("#enable-sound"), ARIA_TYPES.INSIDE_ELEMENT);
        document.addEventListener("click", enableSoundByClicking);
        document.addEventListener("keydown", enableSoundByClicking);
    });
}