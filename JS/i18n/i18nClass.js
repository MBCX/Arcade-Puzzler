import { loadTimeData, parseHtmlSubset, sanitizeInnerHtml } from "../utils/loadTimeData.js";

export class i18nManager {
    /**
     * Returns a translated string where $1 to $9 are replaced by the given
     * values.
     * @param id The ID of the string to translate.
     * @param var_args Values to replace the placeholders $1 to $9 in the
     *     string.
     * @return A translated, substituted string.
     */
    i18nRaw_(id, ...var_args) {
        return var_args.length === 0
            ? loadTimeData.getString(id)
            : loadTimeData.getStringF(id, ...var_args);
    }
    /**
     * Returns a translated string where $1 to $9 are replaced by the given
     * values. Also sanitizes the output to filter out dangerous HTML/JS.
     * Use with Polymer bindings that are *not* inner-h-t-m-l.
     * NOTE: This is not related to $i18n{foo} in HTML, see file overview.
     * @param id The ID of the string to translate.
     * @param var_args Values to replace the placeholders $1 to $9 in the
     *     string.
     * @return A translated, sanitized, substituted string.
     */
    i18n(id, ...var_args) {
        const rawString = this.i18nRaw_(id, ...var_args);
        return parseHtmlSubset(`<b>${rawString}</b>`).firstChild.textContent;
    }
    /**
     * Similar to 'i18n', returns a translated, sanitized, substituted
     * string. It receives the string ID and a dictionary containing the
     * substitutions as well as optional additional allowed tags and
     * attributes. Use with Polymer bindings that are inner-h-t-m-l, for
     * example.
     * @param id The ID of the string to translate.
     */
    i18nAdvanced(id, opts) {
        opts = opts || {};
        const rawString = this.i18nRaw_(id, ...(opts.substitutions || []));
        return sanitizeInnerHtml(rawString, opts);
    }
    /**
     * Similar to 'i18n', with an unused |locale| parameter used to trigger
     * updates when the locale changes.
     * @param locale The UI language used.
     * @param id The ID of the string to translate.
     * @param var_args Values to replace the placeholders $1 to $9 in the
     *     string.
     * @return A translated, sanitized, substituted string.
     */
    i18nDynamic(_locale, id, ...var_args) {
        return this.i18n(id, ...var_args);
    }
    /**
     * Similar to 'i18nDynamic', but var_args valus are interpreted as keys
     * in loadTimeData. This allows generation of strings that take other
     * localized strings as parameters.
     * @param locale The UI language used.
     * @param id The ID of the string to translate.
     * @param var_args Values to replace the placeholders $1 to $9
     *     in the string. Values are interpreted as strings IDs if found in
     * the list of localized strings.
     * @return A translated, sanitized, substituted string.
     */
    i18nRecursive(locale, id, ...var_args) {
        let args = var_args;
        if (args.length > 0) {
            // Try to replace IDs with localized values.
            args = args.map((str) => {
                return this.i18nExists(str) ? loadTimeData.getString(str) : str;
            });
        }
        return this.i18nDynamic(locale, id, ...args);
    }
    /**
     * Returns true if a translation exists for |id|.
     */
    i18nExists(id) {
        return loadTimeData.valueExists(id);
    }
}
export default i18nManager;
