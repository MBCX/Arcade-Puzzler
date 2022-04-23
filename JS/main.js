import "../assets/libraries/swup/swup.min.js";
import "../assets/libraries/swup/plugins/SwupA11yPlugin.min.js";
import "../assets/libraries/swup/plugins/SwupDebugPlugin.min.js";
import {
    wrap,
    clamp,
    setGameTheme,
    setGameLanguageBasedOn,
    roll_dice,
    playSound,
    detectBrowser,
    getLocalStorageKey,
    setLocalStorageItem,
    stopAllAudio,
    setGameCubesAnimated,
} from "./utils/utils.js";
import { setAndUpdatei18nString, updatei18nAria } from "./i18n/i18nManager.js";
import {
    ARIA_TYPES,
    AUDIO_TYPES,
    game_i18n_lang,
    i18nmanager,
    BROWSER_STRINGS,
    GAME_KEYS,
    COLOUR_THEMES
} from "./shared/shared.js";

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
    STANDARD_REVERSE: 2, // 15 - 1 horizontal.
    VERTICAL_REVERSE: 3, // 15 - 1 vertical.
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
let config_dialogue_selected_config = 0;
let player_won;
let time_amount;
let current_config_mode;
let current_column = 0;
let started_playing = false;

// Used for moving with the arrow or
// W or S in the main menu buttons.
let menu_button_index = 0;

export const swup = new Swup({
    plugins: [new SwupA11yPlugin(), new SwupDebugPlugin()],
    cache: false,
});

function getCurrentGameConfig(mode) {
    switch (mode) {
        case CONFIG_MODE.STANDARD:
            return i18nmanager.i18n("game__config_mode_standard");
        case CONFIG_MODE.VERTICAL:
            return i18nmanager.i18n("game__config_mode_vertical");
        case CONFIG_MODE.STANDARD_REVERSE:
            return i18nmanager.i18n("game__config_mode_standard_reversed");
        case CONFIG_MODE.VERTICAL_REVERSE:
            return i18nmanager.i18n("game__config_mode_vertical_reversed");
    }
}

function initGameSettings() {
    setGameTheme(getLocalStorageKey(GAME_KEYS.THEME));
    setGameCubesAnimated(getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE));
}

function getGameTheme() {
    setGameTheme(getLocalStorageKey(GAME_KEYS.THEME));
}

function checkWinningCondition() {
    const number_container_lis = document.querySelectorAll(
        "#number-container li"
    );

    for (let i = 0; MAX_AMOUNT_ITEMS_GRID > i; ++i) {
        const li_pos_value = Number(
            number_container_lis[i].getAttribute("btn-pos")
        );
        if (li_pos_value !== i) {
            return false;
        }
    }

    // Player has won!
    can_play = false;
    if (!player_won) {
        number_container_lis.forEach((li, i) => {
            li.animate(
                [
                    { transform: "translateY(0px)" },
                    { transform: "translateY(-5px)" },
                    { transform: "translateY(-10px)" },
                    { transform: "translateY(-15px)" },
                    { transform: "translateY(-20px)" },
                    { transform: "translateY(-25px)" },
                    { transform: "translateY(-30px)" },
                    { transform: "translateY(-25px)" },
                    { transform: "translateY(-20px)" },
                    { transform: "translateY(-15px)" },
                    { transform: "translateY(-10px)" },
                    { transform: "translateY(-5px)" },
                    { transform: "translateY(0px)" },
                    { transform: "translateY(-5px)" },
                    { transform: "translateY(-10px)" },
                    { transform: "translateY(-15px)" },
                    { transform: "translateY(-20px)" },
                    { transform: "translateY(-15px)" },
                    { transform: "translateY(-10px)" },
                    { transform: "translateY(-5px)" },
                    { transform: "translateY(0px)" },
                    { transform: "translateY(-10px)" },
                    { transform: "translateY(-5px)" },
                    { transform: "translateY(0px)" },
                    { transform: "translateY(-5px)" },
                    { transform: "translateY(0px)" },
                ],
                {
                    duration: 750,
                    easing: "ease",
                    delay: (i + 1) * 35,
                    fill: "auto",
                }
            );
        });
        stopAllAudio();
        playSound(AUDIO_TYPES.FX.WIN);

        window.setTimeout(() => {
            swup.loadPage({
                url: "/results.html",
            });
        }, 4000);
        player_won = true;
        return true;
    }
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
    player_won = false;
    time_amount = "";
    started_playing = false;

    if (document.querySelector("#number-container")) {
        // Allow keyboard play and navigation of grid.
        number_container.removeEventListener(
            "keydown",
            handleGridKeyboardMovement
        );
        number_container.addEventListener(
            "keydown",
            handleGridKeyboardMovement
        );
    }
    window.requestAnimationFrame(gameUpdateLoop);
}

function checkBlankPosInBoard() {
    const container_children = number_container.children;
    for (let i = container_children.length; 0 < i; --i) {
        const item = container_children.item(i);
        if (null != item && item.getAttribute("id")) {
            return i;
        }
    }

    // @MBCX: Second search attempt
    // (partial bug fix for Safari)
    let index;
    [...container_children].forEach((child, i) => {
        if (child.getAttribute("id")) {
            index = i;
        }
    });
    return index;
}

function correctCurrentIndexGrid(type) {
    let button_offset = 2;
    const index_mod = current_column % (GRID_POSITION.LAST_ROW_COLUMN + 1);
    switch (type) {
        case "down":
            const element_down_blank_btn = number_container.children.item(
                current_index + 4
            );
            current_index = current_index + 4;
            break;
        case "up":
            const element_up_blank_btn = number_container.children.item(
                current_index - 4
            );
            current_index = current_index - 4;
            break;
        // case "up":
        //     if (
        //         index_mod === GRID_POSITION.FIRST_ROW_COLUMN ||
        //         index_mod === GRID_POSITION.SECOND_ROW_COLUMN ||
        //         index_mod === GRID_POSITION.THIRD_ROW_COLUMN
        //     ) {
        //         current_index = current_index - button_offset * 2;
        //     } else {
        //         button_offset = 0;
        //         current_index = current_index - (index_mod + button_offset);
        //     }
        //     break;
        // case "down":
        //     if (
        //         index_mod === GRID_POSITION.FIRST_ROW_COLUMN ||
        //         index_mod === GRID_POSITION.SECOND_ROW_COLUMN ||
        //         index_mod === GRID_POSITION.THIRD_ROW_COLUMN
        //     ) {
        //         current_index = current_index + button_offset * 2;
        //     } else {
        //         button_offset = 1;
        //         current_index = current_index + (index_mod + button_offset);
        //     }
        //     break;
    }
}

function handleGridKeyboardMovement(e) {
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
            current_column--;
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        } else if ("ArrowRight" === e.key || "d" === e.key || "D" === e.key) {
            current_index++;
            current_column++;
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        } else if ("ArrowUp" === e.key || "W" === e.key || "w" === e.key) {
            // correctCurrentIndexGrid("up");
            current_index = current_index - 4;
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        } else if ("ArrowDown" === e.key || "S" === e.key || "s" === e.key) {
            // correctCurrentIndexGrid("down");
            current_index = current_index + 4;
            playSound(AUDIO_TYPES.FX.MOVE_IN_GRID);
        }
        current_index = clamp(current_index, 0, buttons.length - 1);
        current_column = wrap(
            current_column,
            0,
            GRID_POSITION.LAST_ROW_COLUMN + 1
        );
        buttons[current_index].focus();
    }
}

/**
 * @returns [left_el, right_el, top_el, bottom_el]
 */
function getElementsAroundBlankBtn() {
    const pos = checkBlankPosInBoard();
    const blank_btn_pos_index = undefined == pos ? 0 : pos;
    const element_left_blank_btn = number_container.children.item(
        blank_btn_pos_index - 1
    );
    const element_right_blank_btn = number_container.children.item(
        blank_btn_pos_index + 1
    );
    element_up_blank_btn = number_container.children.item(
        blank_btn_pos_index - 4
    );
    element_down_blank_btn = number_container.children.item(
        blank_btn_pos_index + 4
    );

    return [
        element_left_blank_btn,
        element_right_blank_btn,
        element_up_blank_btn,
        element_down_blank_btn,
    ];
}

function checkIfWeCanMove(move_request, element) {
    const pos = checkBlankPosInBoard();
    const blank_btn_pos_index = undefined == pos ? 0 : pos;
    const element_left_blank_btn = number_container.children.item(
        blank_btn_pos_index - 1
    );
    const element_right_blank_btn = number_container.children.item(
        blank_btn_pos_index + 1
    );
    element_up_blank_btn = number_container.children.item(
        blank_btn_pos_index - 4
    );
    element_down_blank_btn = number_container.children.item(
        blank_btn_pos_index + 4
    );
    
    // The blank button can only move if
    // the requested element target is the
    // one needed to actually move (and it
    // exists).
    switch (move_request) {
        case MOVE_RQST.LEFT: {
            const pos = (blank_btn_pos_index - 1) % (GRID_POSITION.LAST_ROW_COLUMN + 1);
            const safe_to_move = pos !== GRID_POSITION.LAST_ROW_COLUMN;

            if (getLocalStorageKey(GAME_KEYS.CHEAT_MODE) === "true") {
                return (
                    null != blank_btn.previousElementSibling &&
                    element == element_left_blank_btn
                );
            }
            return (
                safe_to_move &&
                null != blank_btn.previousElementSibling &&
                element == element_left_blank_btn
            );
        }
        case MOVE_RQST.RIGHT: {
            const pos = (blank_btn_pos_index + 1) % (GRID_POSITION.LAST_ROW_COLUMN + 1);
            const safe_to_move = pos !== GRID_POSITION.FIRST_ROW_COLUMN;

            if (getLocalStorageKey(GAME_KEYS.CHEAT_MODE) === "true") {
                return (
                    null != blank_btn.previousElementSibling &&
                    element == element_right_blank_btn
                );
            }
            return (
                safe_to_move &&
                null != blank_btn.nextElementSibling &&
                element == element_right_blank_btn
            );
        }
        case MOVE_RQST.UP:
            return (
                null != element_up_blank_btn && element == element_up_blank_btn
            );
        case MOVE_RQST.DOWN:
            return (
                null != element_down_blank_btn &&
                element == element_down_blank_btn
            );
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
            if (
                buttons[current_index].offsetParent ==
                elements_around_blank_btn[i]
            ) {
                switch (i) {
                    // left.
                    case 0:
                        if (
                            last_touched_element != elements_around_blank_btn[i]
                        ) {
                            setAndUpdatei18nString(
                                true,
                                {
                                    a11y__button_can_move_right:
                                        target_inner_id,
                                },
                                true
                            );
                            last_touched_element =
                                buttons[current_index].offsetParent;
                            a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                        }
                        break;
                    // right.
                    case 1:
                        if (
                            last_touched_element != elements_around_blank_btn[i]
                        ) {
                            setAndUpdatei18nString(
                                true,
                                {
                                    a11y__button_can_move_left: target_inner_id,
                                },
                                true
                            );
                            last_touched_element =
                                buttons[current_index].offsetParent;
                            a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                        }
                        break;
                    // up.
                    case 2:
                        if (
                            last_touched_element != elements_around_blank_btn[i]
                        ) {
                            setAndUpdatei18nString(
                                true,
                                {
                                    a11y__button_can_move_down:
                                        element_up_blank_btn.innerText,
                                },
                                true
                            );
                            last_touched_element =
                                buttons[current_index].offsetParent;
                            a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                        }
                        break;
                    // down.
                    case 3:
                        if (
                            last_touched_element != elements_around_blank_btn[i]
                        ) {
                            setAndUpdatei18nString(
                                true,
                                {
                                    a11y__button_can_move_up:
                                        element_down_blank_btn.innerText,
                                },
                                true
                            );
                            last_touched_element =
                                buttons[current_index].offsetParent;
                            a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                        }
                        break;
                }
            }
        }
    }
}

function gameUpdateLoop(time) {
    function removeAnimation(target, name) {
        if ("" != name) {
            target.classList.remove(name);
        }
    }

    function handleButtonMovement(e) {
        if (can_play) {
            const li_target = e.target.offsetParent;
            let block_animation_name = "";

            // Left and right movement.
            if (checkIfWeCanMove(MOVE_RQST.LEFT, li_target)) {
                if (
                    current_config_mode === CONFIG_MODE.VERTICAL_REVERSE ||
                    current_config_mode === CONFIG_MODE.VERTICAL
                ) {
                    block_animation_name = "block-animate-down";
                } else {
                    block_animation_name = "block-animate-right";
                }
                li_target.before(blank_btn);
                move_amount++;
                current_column++;
                a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                setAndUpdatei18nString(true, {
                    a11y__button_moved_right: e.target.innerText,
                });
                blank_btn_at_grid -= 1;
                const has_won = checkWinningCondition();

                if (has_won === false) {
                    if (
                        getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE) === "true"
                    ) {
                        li_target.classList.add(block_animation_name);
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                    } else {
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE_INSTANT);
                    }
                }
            } else if (checkIfWeCanMove(MOVE_RQST.RIGHT, li_target)) {
                if (
                    current_config_mode === CONFIG_MODE.VERTICAL_REVERSE ||
                    current_config_mode === CONFIG_MODE.VERTICAL
                ) {
                    block_animation_name = "block-animate-up";
                } else {
                    block_animation_name = "block-animate-left";
                }
                li_target.after(blank_btn);
                move_amount++;
                current_column--;
                setAndUpdatei18nString(true, {
                    a11y__button_moved_left: e.target.innerText,
                });
                a11y_btn_say_delay = A11Y_DELAY_BETWEEN_BTN_NUMBERS;
                blank_btn_at_grid += 1;
                const has_won = checkWinningCondition();

                if (has_won === false) {
                    if (
                        getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE) === "true"
                    ) {
                        li_target.classList.add(block_animation_name);
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                    } else {
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE_INSTANT);
                    }
                }
            } else if (checkIfWeCanMove(MOVE_RQST.UP, li_target)) {
                // Up and down movement.
                if (
                    current_config_mode === CONFIG_MODE.VERTICAL_REVERSE ||
                    current_config_mode === CONFIG_MODE.VERTICAL
                ) {
                    block_animation_name = "block-animate-right";
                } else {
                    block_animation_name = "block-animate-down";
                }
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
                correctCurrentIndexGrid("down");
                const has_won = checkWinningCondition();

                if (has_won === false) {
                    if (
                        getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE) === "true"
                    ) {
                        li_target.classList.add(block_animation_name);
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                    } else {
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE_INSTANT);
                    }
                }
            } else if (checkIfWeCanMove(MOVE_RQST.DOWN, li_target)) {
                if (
                    current_config_mode === CONFIG_MODE.VERTICAL_REVERSE ||
                    current_config_mode === CONFIG_MODE.VERTICAL
                ) {
                    block_animation_name = "block-animate-left";
                } else {
                    block_animation_name = "block-animate-up";
                }
                const new_blank_btn = document.createElement("li");
                const new_li_target = document.querySelector(
                    `[btn-pos="${parseInt(
                        e.target.innerText - 1
                    )}"] + [btn-pos]`
                );
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
                correctCurrentIndexGrid("up");
                const has_won = checkWinningCondition();

                if (has_won === false) {
                    if (
                        getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE) === "true"
                    ) {
                        li_target.classList.add(block_animation_name);
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE);
                    } else {
                        playSound(AUDIO_TYPES.FX.MOVE_PIECE_INSTANT);
                    }
                }
            } else {
                setAndUpdatei18nString(
                    true,
                    {
                        a11y__button_cant_move: e.target.innerText,
                    },
                    true
                );
                playSound(AUDIO_TYPES.FX.BAD_MOVE_PIECE);
                e.target.classList.add("animation_button_wrong");
                e.target.addEventListener(
                    "animationend",
                    removeAnimation.bind(
                        this,
                        e.target,
                        "animation_button_wrong"
                    ),
                    {
                        once: true,
                    }
                );
            }

            if (getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE)) {
                li_target.addEventListener(
                    "animationend",
                    removeAnimation.bind(this, li_target, block_animation_name),
                    {
                        once: true,
                    }
                );
            }
        }
    }

    function generateGridButtons() {
        function createBlankBtn() {
            if (!document.querySelector("li#blank")) {
                const blank = document.createElement("li");
                number_container.append(blank);
                blank.setAttribute("id", "blank");
                setAndUpdatei18nString(true, [
                    "a11y__generated_grid_numbers",
                    "a11y__how_to_play",
                ]);
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
                if (
                    (current_config_mode === CONFIG_MODE.STANDARD_REVERSE ||
                        current_config_mode === CONFIG_MODE.VERTICAL ||
                        current_config_mode === CONFIG_MODE.VERTICAL_REVERSE) &&
                    detectBrowser() === BROWSER_STRINGS.FIREFOX
                ) {
                    const div = document.createElement("div");
                    new_btn.append(div);
                    div.innerText = li_slot;
                } else {
                    new_btn.innerText = li_slot;
                }
                new_btn.addEventListener("click", handleButtonMovement);
                new_li.animate(
                    [
                        {
                            transform: "translateY(100%)",
                            opacity: 0,
                        },
                        {
                            transform: "translateY(0)",
                            opacity: 1,
                        },
                    ],
                    {
                        duration: 500,
                        easing: "ease",
                        fill: "forwards",
                    }
                );
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
            let hours =
                Math.abs(
                    Math.floor(
                        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                    )
                ) - 1;
            let minutes =
                Math.abs(
                    Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                ) - 1;
            let seconds = Math.abs(
                Math.floor((difference % (1000 * 60)) / 1000)
            );

            seconds = 10 > seconds ? "0" + seconds : seconds;
            minutes = 10 > minutes ? "0" + minutes : minutes;
            hours = 10 > hours ? "0" + hours : hours;
            return `${hours}:${minutes}:${seconds}`;
        }
        return "00:00:00";
    }

    if (!player_won && null != last_time_render) {
        delta_time = time - last_time_render;

        if (can_play) {
            time_amount = calculateTimeAmount(delta_time);
        } else {
            time_amount = "00:00:00";
        }
        generateGridButtons();

        blank_btn = document.querySelector("#blank");

        setAndUpdatei18nString(
            false,
            time_amount,
            false,
            document.querySelector(`[data-i18n-id="game__time"]`)
        );
        setAndUpdatei18nString(
            false,
            move_amount,
            false,
            document.querySelector(`[data-i18n-id="game__moves"]`)
        );
        setAndUpdatei18nString(
            false,
            getCurrentGameConfig(current_config_mode),
            false,
            document.querySelector(`[data-i18n-id="game__config_mode"]`)
        );

        if (a11y_btn_say_delay > 0) {
            a11y_btn_say_delay -= 1 / delta_time;
        }

        if (a11y_mode && a11y_btn_say_delay === 0) {
            tellA11yWichButtonToMove();
        }
        a11y_btn_say_delay = clamp(
            a11y_btn_say_delay,
            0,
            A11Y_DELAY_BETWEEN_BTN_NUMBERS
        );
        blank_btn_at_grid = clamp(
            blank_btn_at_grid,
            0,
            GRID_POSITION.LAST_ROW_COLUMN
        );
    }
    last_time_render = time;
    window.requestAnimationFrame(gameUpdateLoop);
}

function moveBetweenMenuButtons(e) {
    const all_links = document.querySelectorAll(".link-group a");
    if (
        "ArrowUp" === e.key ||
        "W" === e.key ||
        "w" === e.key ||
        "ArrowLeft" === e.key ||
        "A" === e.key ||
        "a" === e.key
    ) {
        menu_button_index--;
    } else if (
        "ArrowDown" === e.key ||
        "S" === e.key ||
        "s" === e.key ||
        "ArrowRight" === e.key ||
        "D" === e.key ||
        "d" === e.key ||
        "Tab" === e.key
    ) {
        menu_button_index++;
    }
    playSound(AUDIO_TYPES.FX.SELECTING);
    menu_button_index = wrap(menu_button_index, 0, all_links.length);
    all_links[menu_button_index].focus();
}

function registerAllSounds() {
    return new Promise((resolve, reject) => {
        const MAX_SOUNDS_TO_LOAD = 12;
        let sounds_loaded = 0;

        for (const audio_name in AUDIO_TYPES.FX) {
            const audio = new Audio(
                `../assets/audio/${AUDIO_TYPES.FX[audio_name]}`
            );
            audio.volume = 0;

            audio
                .play()
                .then(() => {
                    let name = audio_name;
                    console.log(`Audio (${name}) loaded with success.`);
                    sounds_loaded++;
                    console.log(sounds_loaded);
                })
                .then(() => {
                    if (sounds_loaded === MAX_SOUNDS_TO_LOAD) {
                        console.log("All sounds loaded! The game is ready.");
                        resolve(true);
                    }
                });
        }
        reject(false);
    });
}

async function enableSoundByClicking() {
    document.querySelector("#enable-sound").remove();
    document.removeEventListener("click", enableSoundByClicking);
    document.removeEventListener("keydown", enableSoundByClicking);

    await registerAllSounds()
        .then(initMainMenu)
        .catch(() => {
            console.warn(
                "Some sounds may or may not have loaded properly, expect sound de-sync."
            );
            initMainMenu();
        });
}

function initMainMenu() {
    game_i18n_lang.then(() => {
        document.documentElement.lang = setGameLanguageBasedOn(
            navigator.language
        );

        if (document.querySelector("[is-main-page]")) {
            const all_spans = document.querySelectorAll(
                "#intro-cutscene .animated-text-container .text-wrapper span"
            );
            all_spans.forEach((span, i) => {
                // span.style = `--delay: ${i + 1}`;
                span.animate(
                    [
                        {
                            opacity: 0,
                            transform: "translateY(110%)",
                        },
                        {
                            opacity: 1,
                            transform: "translateY(0%)",
                        },
                    ],
                    {
                        duration: 800,
                        easing: "linear",
                        delay: (i + 1) * 50,
                        fill: "forwards",
                    }
                ).addEventListener("finish", () => {
                    const fire = document.querySelector(".fire");
                    const animated_container = document.querySelector(
                        ".animated-text-container"
                    );

                    if (span == all_spans[all_spans.length - 1]) {
                        fire.setAttribute(
                            "style",
                            `
                            animation: animate_fire 1000ms steps(9) reverse forwards, generic_fadeout 800ms linear forwards;
                        `
                        );
                        playSound(AUDIO_TYPES.FX.TITLE);
                        fire.addEventListener("animationend", () => {
                            animated_container.setAttribute(
                                "style",
                                `
                                animation: generic_fadeout 1000ms linear 3100ms forwards;
                            `
                            );
                            animated_container.addEventListener(
                                "animationend",
                                () => {
                                    document
                                        .querySelector("#intro-cutscene")
                                        .animate(
                                            [
                                                {
                                                    transform: "translateY(0%)",
                                                    transform:
                                                        "translateY(-100%)",
                                                },
                                            ],
                                            {
                                                duration: 1000,
                                                easing: "cubic-bezier(0.76, 0.02, 1, 1.01)",
                                                delay: 4100,
                                                fill: "forwards",
                                            }
                                        )
                                        .addEventListener("finish", () => {
                                            if (
                                                document.querySelector(
                                                    "#intro-cutscene"
                                                )
                                            ) {
                                                document
                                                    .querySelector(
                                                        "#intro-cutscene"
                                                    )
                                                    .remove();
                                            }
                                        });
                                }
                            );
                        });
                    }
                });
            });

            updatei18nAria(
                document.querySelector("#game-title"),
                ARIA_TYPES.INSIDE_ELEMENT
            );

            // Intro buttons.
            updatei18nAria(
                document.querySelector("#game_btn"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            updatei18nAria(
                document.querySelector("#options_btn"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            updatei18nAria(
                document.querySelector("#feedback_btn"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            document
                .querySelector(".link-group")
                .addEventListener("keydown", moveBetweenMenuButtons);
            document
                .querySelector(".link-group")
                .addEventListener("click", playEnterSound);
        }
    });
}

function playEnterSound() {
    playSound(AUDIO_TYPES.FX.ENTER);
}

function playBackSound() {
    playSound(AUDIO_TYPES.FX.BACK_BUTTON);
}

function addAgainEventListenerForMenuGroup() {
    menu_button_index = 0;
    document
        .querySelector(".link-group")
        .removeEventListener("keydown", moveBetweenMenuButtons);
    document
        .querySelector(".link-group")
        .removeEventListener("click", playEnterSound);
    document
        .querySelector(".link-group")
        .addEventListener("keydown", moveBetweenMenuButtons);
    document
        .querySelector(".link-group")
        .addEventListener("click", playEnterSound);
}

function handleGameExit(e) {
    game_i18n_lang.then(() => {
        if (
            false ===
            window.confirm(i18nmanager.i18n("game__goto_main_menu_confirm"))
        ) {
            e.target.setAttribute("href", "#");
            playBackSound();
            return false;
        } else {
            e.target.setAttribute("href", "/index.html");
            playBackSound();
        }
    });
}

function controlGameConfigOptions() {
    const values = {
        MOVE_TILES: getLocalStorageKey(GAME_KEYS.BLOCKS_ANIMATE),
        CHEAT: getLocalStorageKey(GAME_KEYS.CHEAT_MODE),
    };
    const checkboxes = {
        MOVE_TILES: document.querySelector("#check-moving-titles"),
        CHEAT: document.querySelector("#check-cheat-mode"),
    };
    function radioEditTheme(radioElement) {
        const id = String(radioElement.getAttribute("id")).split("-")[2];
        switch (id) {
            case "light":
                playSound(AUDIO_TYPES.FX.RADIO_BUTTON_CLICKED);
                setGameTheme(COLOUR_THEMES.LIGHT);
                break;
            case "dark":
                playSound(AUDIO_TYPES.FX.RADIO_BUTTON_CLICKED);
                setGameTheme(COLOUR_THEMES.DARK);
                break;
            case "retro":
                playSound(AUDIO_TYPES.FX.RADIO_BUTTON_CLICKED);
                setGameTheme(COLOUR_THEMES.RETRO);
                break;
            case "auto":
                playSound(AUDIO_TYPES.FX.RADIO_BUTTON_CLICKED);
                setGameTheme(COLOUR_THEMES.AUTO);
                break;
        }
    }

    function animteMovingTiles() {
        const checkbox = checkboxes.MOVE_TILES;
        if (!checkbox.checked) {
            playSound(AUDIO_TYPES.FX.TICKBOX_TICKED);
        } else {
            playSound(AUDIO_TYPES.FX.TICKBOX_NOT_TICKED);
        }
        setLocalStorageItem(GAME_KEYS.BLOCKS_ANIMATE, checkbox.checked);
    }

    function enableCheatMode()
    {
        const checkbox = checkboxes.CHEAT;
        if (!checkbox.checked) {
            playSound(AUDIO_TYPES.FX.TICKBOX_TICKED);
        } else {
            playSound(AUDIO_TYPES.FX.TICKBOX_NOT_TICKED);
        }
        setLocalStorageItem(GAME_KEYS.CHEAT_MODE, checkbox.checked);
    }

    function setCheckState()
    {
        if (values.MOVE_TILES === "true") {
            checkboxes.MOVE_TILES.checked = true;
        }

        if (values.CHEAT === "true") {
            checkboxes.CHEAT.checked = true;
        }
    }

    game_i18n_lang.then(() => {
        const all_radios = document.querySelectorAll(".value-wrapper input");

        document.querySelector(
            "[data-i18n-id='game__goto_options']"
        ).innerText = i18nmanager.i18n("game__goto_options");
        document.querySelector(
            "[data-i18n-id='game__options_title_gameplay']"
        ).innerText = i18nmanager.i18n("game__options_title_gameplay");
        document.querySelector(
            "[data-i18n-id='game__options_animate_tiles']"
        ).innerText = i18nmanager.i18n("game__options_animate_tiles");
        document.querySelector(
            "[data-i18n-id='game__options_cheat_mode']"
        ).innerText = i18nmanager.i18n("game__options_cheat_mode");

        // Colour schemes.
        document.querySelector(
            "[data-i18n-id='game__options_title_colour_skins']"
        ).innerText = i18nmanager.i18n("game__options_title_colour_skins");
        document.querySelector(
            "[data-i18n-id='game__options_colour_scheme_light']"
        ).innerText = i18nmanager.i18n("game__options_colour_scheme_light");
        document.querySelector(
            "[data-i18n-id='game__options_colour_scheme_dark']"
        ).innerText = i18nmanager.i18n("game__options_colour_scheme_dark");
        document.querySelector(
            "[data-i18n-id='game__options_colour_scheme_retro']"
        ).innerText = i18nmanager.i18n("game__options_colour_scheme_retro");
        document.querySelector(
            "[data-i18n-id='game__options_colour_scheme_auto']"
        ).innerText = i18nmanager.i18n("game__options_colour_scheme_auto");
        document
            .querySelector("#back-to-main-menu")
            .addEventListener("click", playBackSound);

        all_radios.forEach((radio) => {
            const curr_theme = getLocalStorageKey(GAME_KEYS.THEME);
            const id = String(radio.getAttribute("id")).split("-")[2];
            if (id === curr_theme) {
                radio.checked = true;
            }
            radio.addEventListener("click", radioEditTheme.bind(this, radio), { once: true });
        });
        setCheckState();
        checkboxes.MOVE_TILES.addEventListener("click", animteMovingTiles, { once: true });
        checkboxes.CHEAT.addEventListener("click", enableCheatMode, { once: true });
    });
}

function controlGameConfigDialogue() {
    game_i18n_lang.then(() => {
        function handleGameConfig(e) {
            const dialogue_container =
                document.querySelector("#config-dialogue");
            const num_container = document.createElement("ul");
            if (e.target.nodeName.toLowerCase() === "button") {
                const btn_config_id = e.target.getAttribute("id");
                if (btn_config_id === "config-standard") {
                    num_container.classList.add("config-standard");
                    current_config_mode = CONFIG_MODE.STANDARD;
                } else if (btn_config_id === "config-vertical") {
                    num_container.classList.add("config-vertical");
                    current_config_mode = CONFIG_MODE.VERTICAL;
                } else if (btn_config_id === "config-standard-reverse") {
                    num_container.classList.add("config-standard-reverse");
                    current_config_mode = CONFIG_MODE.STANDARD_REVERSE;
                } else if (btn_config_id === "config-vertical-reverse") {
                    num_container.classList.add("config-vertical-reverse");
                    current_config_mode = CONFIG_MODE.VERTICAL_REVERSE;
                }
            } else if (e.target.nodeName.toLowerCase() === "img") {
                const img_class = e.target.getAttribute("class");
                const split = img_class.split(" ");

                if (split[0] === "img-mode-standard") {
                    num_container.classList.add("config-standard");
                    current_config_mode = CONFIG_MODE.STANDARD;
                } else if (split[0] === "img-mode-vertical") {
                    num_container.classList.add("config-vertical");
                    current_config_mode = CONFIG_MODE.VERTICAL;
                } else if (split[0] === "img-mode-reverse") {
                    num_container.classList.add("config-standard-reverse");
                    current_config_mode = CONFIG_MODE.STANDARD_REVERSE;
                } else if (split[0] === "img-mode-reverse") {
                    num_container.classList.add("config-vertical-reverse");
                    current_config_mode = CONFIG_MODE.VERTICAL_REVERSE;
                }
            }
            num_container.setAttribute("id", "number-container");
            num_container.classList.add("transition-move-and-fade-down");

            if (!started_playing) {
                dialogue_container
                    .animate([{ opacity: 0, transform: "translateY(48px)" }], {
                        duration: 400,
                        easing: "ease",
                    })
                    .addEventListener("finish", () => {
                        dialogue_container.remove();
                        document.querySelector("#swup").append(num_container);
                        reset();
                        window.requestAnimationFrame(gameUpdateLoop);
                    });
                playSound(AUDIO_TYPES.FX.ENTER);
                started_playing = true;
            }
        }

        function showInfo(index) {
            const all_desc = document.querySelectorAll(".carousel__desc");
            if (
                all_desc[index].style.display === "none" ||
                all_desc[index].style.display === ""
            ) {
                all_desc[index].style.display = "block";
            } else {
                all_desc[index].style.display = "none";
            }
        }

        const dialogue_btn_prev = document.querySelector("#carousel-btn-prev");
        const dialogue_btn_next = document.querySelector("#carousel-btn-next");
        const all_dialogues_amount =
            document.querySelectorAll(".carousel__item").length;
        const all_images = document.querySelectorAll(
            "#config-dialogue .img-group img"
        );
        const all_info_btns = document.querySelectorAll(".carousel__info");

        // Set element aria labels and i18n strings.
        updatei18nAria(
            document.querySelector("#back-to-main-menu"),
            ARIA_TYPES.ARIA_LABEL
        );
        updatei18nAria(
            document.querySelector("#back-to-main-menu"),
            ARIA_TYPES.TITLE
        );
        updatei18nAria(
            document.querySelector("#config-dialogue h1"),
            ARIA_TYPES.INSIDE_ELEMENT
        );
        updatei18nAria(
            document.querySelector("#config-dialogue p"),
            ARIA_TYPES.INSIDE_ELEMENT
        );

        updatei18nAria(
            document.querySelector("#carousel-btn-prev"),
            ARIA_TYPES.ARIA_LABEL
        );
        updatei18nAria(
            document.querySelector("#carousel-btn-prev"),
            ARIA_TYPES.TITLE
        );
        updatei18nAria(
            document.querySelector("#carousel-btn-next"),
            ARIA_TYPES.ARIA_LABEL
        );
        updatei18nAria(
            document.querySelector("#carousel-btn-next"),
            ARIA_TYPES.TITLE
        );

        // Sadly, need to update the alt desc of each individual image.
        updatei18nAria(all_images[0], ARIA_TYPES.ALT_IMAGES);
        updatei18nAria(all_images[1], ARIA_TYPES.ALT_IMAGES);
        updatei18nAria(all_images[2], ARIA_TYPES.ALT_IMAGES);
        updatei18nAria(all_images[3], ARIA_TYPES.ALT_IMAGES);

        document.querySelectorAll(".carousel__title").forEach((title) => {
            updatei18nAria(title, ARIA_TYPES.INSIDE_ELEMENT);
        });

        document.querySelectorAll(".carousel__desc").forEach((desc) => {
            updatei18nAria(desc, ARIA_TYPES.INSIDE_ELEMENT);
        });

        document.querySelectorAll(".carousel__begin").forEach((btn) => {
            updatei18nAria(btn, ARIA_TYPES.INSIDE_ELEMENT);
            btn.addEventListener("click", handleGameConfig);
        });

        all_images.forEach((img) => {
            img.addEventListener("click", handleGameConfig);
        });

        all_info_btns.forEach((btn, i) => {
            btn.addEventListener("click", showInfo.bind(this, i));
        });

        dialogue_btn_next.addEventListener("click", () => {
            const current_carousel = document.querySelector(
                ".carousel__item.selected"
            );
            config_dialogue_selected_config++;
            dialogue_btn_prev.classList.remove("last");

            if (all_dialogues_amount - 1 == config_dialogue_selected_config) {
                dialogue_btn_next.classList.add("last");
            }

            if (
                null != current_carousel.nextElementSibling &&
                current_carousel.nextElementSibling.classList.contains(
                    "carousel__item"
                )
            ) {
                current_carousel.classList.remove("selected");
                current_carousel.nextElementSibling.classList.add("selected");
                playSound(AUDIO_TYPES.FX.SELECTING);
            }
            config_dialogue_selected_config = clamp(
                config_dialogue_selected_config,
                0,
                all_dialogues_amount - 1
            );
        });

        dialogue_btn_prev.addEventListener("click", () => {
            const current_carousel = document.querySelector(
                ".carousel__item.selected"
            );
            config_dialogue_selected_config--;
            dialogue_btn_next.classList.remove("last");

            if (0 >= config_dialogue_selected_config) {
                dialogue_btn_prev.classList.add("last");
            }

            if (
                null != current_carousel.previousElementSibling &&
                current_carousel.previousElementSibling.classList.contains(
                    "carousel__item"
                )
            ) {
                current_carousel.classList.remove("selected");
                current_carousel.previousElementSibling.classList.add(
                    "selected"
                );
                playSound(AUDIO_TYPES.FX.SELECTING);
            }
            config_dialogue_selected_config = clamp(
                config_dialogue_selected_config,
                0,
                all_dialogues_amount - 1
            );
        });
    });
}

// Swup specific listeners.
document.addEventListener("swup:pageView", function () {
    getGameTheme();
    if ("/game.html" === window.location.pathname) {
        controlGameConfigDialogue();
        document
            .querySelector("#back-to-main-menu")
            .addEventListener("click", handleGameExit);
        document.documentElement.removeAttribute("is-main-page");
        document.documentElement.removeAttribute("results-page");
        config_dialogue_selected_config = 0;
    } else if (
        "/" === window.location.pathname ||
        "/index.html" === window.location.pathname
    ) {
        window.cancelAnimationFrame(gameUpdateLoop);
        config_dialogue_selected_config = 0;
        document.documentElement.removeAttribute("options-page");
        document.documentElement.removeAttribute("results-page");
        document.documentElement.setAttribute("is-main-page", "");
        game_i18n_lang.then(() => {
            updatei18nAria(
                document.querySelector("#game-title"),
                ARIA_TYPES.INSIDE_ELEMENT
            );

            // Intro buttons.
            updatei18nAria(
                document.querySelector("#game_btn"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            updatei18nAria(
                document.querySelector("#options_btn"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            updatei18nAria(
                document.querySelector("#feedback_btn"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            addAgainEventListenerForMenuGroup();
        });
    } else if ("/results.html" === window.location.pathname) {
        config_dialogue_selected_config = 0;
        window.cancelAnimationFrame(gameUpdateLoop);
        document.documentElement.setAttribute("results-page", "");
        setAndUpdatei18nString(
            false,
            time_amount,
            false,
            document.querySelector(".carousel__title")
        );
        setAndUpdatei18nString(
            false,
            move_amount,
            false,
            document.querySelector(".carousel__desc")
        );
        game_i18n_lang.then(() => {
            document.querySelector(
                "[data-i18n-id='game__results_title']"
            ).innerText = i18nmanager.i18n("game__results_title");
            setAndUpdatei18nString(
                false,
                getCurrentGameConfig(current_config_mode),
                false,
                document.querySelector(`[data-i18n-id="game__config_mode"]`)
            );
        });

        document.querySelectorAll(".btn-container .btn").forEach((btn_link) => {
            updatei18nAria(btn_link, ARIA_TYPES.INSIDE_ELEMENT);
            btn_link.addEventListener("click", playEnterSound);
        });
    } else if ("/options.html" === window.location.pathname) {
        document
            .querySelector("#back-to-main-menu")
            .removeEventListener("click", playBackSound);
        document.documentElement.removeAttribute("is-main-page");
        document.documentElement.setAttribute("options-page", "");
        controlGameConfigOptions();
    }
});

document.addEventListener("swup:contentReplaced", function () {
    getGameTheme();
    if (
        "/" === window.location.pathname ||
        "/index.html" === window.location.pathname
    ) {
        document.documentElement.setAttribute("is-main-page", "");
        window.cancelAnimationFrame(gameUpdateLoop);
        addAgainEventListenerForMenuGroup();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Set light or dark mode.
    initGameSettings();
    if ("/game.html" === window.location.pathname) {
        controlGameConfigDialogue();
        document
            .querySelector("#back-to-main-menu")
            .addEventListener("click", handleGameExit);
        document.documentElement.removeAttribute("is-main-page");
        document.documentElement.removeAttribute("results-page");
    } else if ("/options.html" === window.location.pathname) {
        controlGameConfigOptions();
    } else if (
        "/" === window.location.pathname ||
        "/index.html" === window.location.pathname
    ) {
        document.documentElement.setAttribute("is-main-page", "");
        window.cancelAnimationFrame(gameUpdateLoop);
        addAgainEventListenerForMenuGroup();
    }
});

if (document.querySelector("#enable-sound")) {
    // Set light or dark mode.
    initGameSettings();
    game_i18n_lang.then(() => {
        if (navigator.userAgent.includes("Mobile")) {
            document
                .querySelector("#enable-sound")
                .setAttribute(
                    "data-i18n-id",
                    "game__sound_please_enable_mobile"
                );
            document.addEventListener("click", enableSoundByClicking);
            updatei18nAria(
                document.querySelector("#enable-sound"),
                ARIA_TYPES.INSIDE_ELEMENT
            );
            document.querySelector("#enable-sound").animate(
                [
                    { opacity: 0, transform: "translateY(30px) " },
                    { opacity: 1, transform: "translateY(0px) " },
                ],
                {
                    duration: 500,
                    easing: "ease",
                }
            );
            return;
        }
        updatei18nAria(
            document.querySelector("#enable-sound"),
            ARIA_TYPES.INSIDE_ELEMENT
        );
        document.addEventListener("click", enableSoundByClicking);
        document.addEventListener("keydown", enableSoundByClicking);

        document.querySelector("#enable-sound").animate(
            [
                { opacity: 0, transform: "translateY(30px) " },
                { opacity: 1, transform: "translateY(0px) " },
            ],
            {
                duration: 500,
                easing: "ease",
            }
        );
    });
}
