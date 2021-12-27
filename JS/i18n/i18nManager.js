import { i18nmanager, game_i18n_lang, ARIA_TYPES } from "../shared/shared.js";
import { updateA11yAlert } from "../utils/utils.js";

export function setAndUpdatei18nString(a11y, data, force_reset = false, element = null)
{
    if (a11y)
    {
        game_i18n_lang.then(() => {
            let complete_string = '';
            if (Array.isArray(data)) {
                if (1 === data.length) {
                    updateA11yAlert(i18nmanager.i18n(data))
                } else {
                    for (let i = 0; data.length > i; ++i) {
                        complete_string += i18nmanager.i18n(data[i]) + ' ';
                    }
                    updateA11yAlert(complete_string, force_reset);
                }
            } else if ("object" === typeof data) {
                for (const i18n_value_prop in data) {
                    complete_string += i18nmanager.i18n(i18n_value_prop, data[i18n_value_prop]) + ' ';
                }
                updateA11yAlert(complete_string, force_reset);
            } else {
                updateA11yAlert(i18nmanager.i18n(data), force_reset)
            }
        });
    }
    else
    {
        if (!element.hasAttribute("data-i18n-id")) {
            console.error(`The element ${element} does not have an localisation id (data-i18n-id).`);
            return;
        }
    
        game_i18n_lang.then(() => {
            const i18n_id_data = element.getAttribute("data-i18n-id");
            element.innerText = i18nmanager.i18n(i18n_id_data, data);
        });
    }
}

export function updatei18nAria(element, aria_type = ARIA_TYPES.NONE)
{
    if (!element.hasAttribute("data-i18n-id")) {
        console.error(`The element ${element} does not have an localisation id (data-i18n-id).`);
        return;
    }

    const i18n_id_data = element.getAttribute("data-i18n-id");
    const i18n_result = i18nmanager.i18n(i18n_id_data);

    switch (aria_type) {
        case ARIA_TYPES.ARIA_LABEL:
            element.setAttribute("aria-label", i18n_result);
            break;
        case ARIA_TYPES.TITLE:
            element.setAttribute("title", i18n_result);
            break;
        case ARIA_TYPES.INSIDE_ELEMENT:
            element.innerText = i18n_result;
            break;
    }
}