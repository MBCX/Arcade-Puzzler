/**
 * @fileoverview This file defines a singleton which provides access to all data
 * that is available as soon as the page's resources are loaded (before DOM
 * content has finished loading). This data includes both localized strings and
 * any data that is important to have ready from a very early stage (e.g. things
 * that must be displayed right away).
 *
 * Note that loadTimeData is not guaranteed to be consistent between page
 * refreshes (https://crbug.com/740629) and should not contain values that might
 * change if the page is re-opened later.
 */

/**
 * Make a string safe for Polymer bindings that are inner-h-t-m-l or other
 * innerHTML use.
 * @param {string} rawString The unsanitized string
 * @param {SanitizeInnerHtmlOpts=} opts Optional additional allowed tags and
 *     attributes.
 * @return {string}
 */
export const sanitizeInnerHtml = function (rawString, opts) {
    opts = opts || {};
    return parseHtmlSubset("<b>" + rawString + "</b>", opts.tags, opts.attrs)
        .firstChild.innerHTML;
};

/**
 * Parses a very small subset of HTML. This ensures that insecure HTML /
 * javascript cannot be injected into WebUI.
 * @param {string} s The string to parse.
 * @param {!Array<string>=} opt_extraTags Optional extra allowed tags.
 * @param {!Array<string>=} opt_extraAttrs
 *     Optional extra allowed attributes (all tags are run through these).
 * @throws {Error} In case of non supported markup.
 * @return {DocumentFragment} A document fragment containing the DOM tree.
 */
export const parseHtmlSubset = (function () {
    "use strict";

    /** @typedef {function(!Node, string):boolean} */
    let AllowFunction;

    /** @type {!AllowFunction} */
    const allowAttribute = (node, value) => true;

    /**
     * Allow-list of attributes in parseHtmlSubset.
     * @type {!Map<string, !AllowFunction>}
     * @const
     */
    const allowedAttributes = new Map([
        [
            "href",
            (node, value) => {
                // Only allow a[href] starting with chrome:// and https://
                return (
                    node.tagName === "A" &&
                    (value.startsWith("chrome://") ||
                        value.startsWith("https://"))
                );
            },
        ],
        [
            "target",
            (node, value) => {
                // Only allow a[target='_blank'].
                // TODO(dbeam): are there valid use cases for target !== '_blank'?
                return node.tagName === "A" && value === "_blank";
            },
        ],
        [
            "rel",
            (node, value) => {
                return node.tagName === "A" && value === "noopener noreferrer";
            },
        ],
    ]);

    /**
     * Allow-list of optional attributes in parseHtmlSubset.
     * @type {!Map<string, !AllowFunction>}
     * @const
     */
    const allowedOptionalAttributes = new Map([
        ["class", allowAttribute],
        ["id", allowAttribute],
        ["is", (node, value) => value === "action-link" || value === ""],
        ["role", (node, value) => value === "link"],
        [
            "src",
            (node, value) => {
                // Only allow img[src] starting with chrome:// or HTTPS
                return (
                    node.tagName === "IMG" &&
                    (value.startsWith("chrome://") ||
                        value.startsWith("https://"))
                );
            },
        ],
        ["tabindex", allowAttribute],
    ]);

    /**
     * Allow-list of tag names in parseHtmlSubset.
     * @type {!Set<string>}
     * @const
     */
    const allowedTags = new Set([
        "A",
        "B",
        "BR",
        "DIV",
        "P",
        "PRE",
        "SPAN",
        "STRONG",
    ]);

    /**
     * Allow-list of optional tag names in parseHtmlSubset.
     * @type {!Set<string>}
     * @const
     */
    const allowedOptionalTags = new Set(["IMG"]);

    /**
     * This policy maps a given string to a `TrustedHTML` object
     * without performing any validation. Callsites must ensure
     * that the resulting object will only be used in inert
     * documents. Initialized lazily.
     * @type {!TrustedTypePolicy}
     */
    let unsanitizedPolicy;

    /**
     * @param {!Array<string>} optTags an Array to merge.
     * @return {!Set<string>} Set of allowed tags.
     */
    function mergeTags(optTags) {
        const clone = new Set(allowedTags);
        optTags.forEach((str) => {
            const tag = str.toUpperCase();
            if (allowedOptionalTags.has(tag)) {
                clone.add(tag);
            }
        });
        return clone;
    }

    /**
     * @param {!Array<string>} optAttrs an Array to merge.
     * @return {!Map<string, !AllowFunction>} Map of allowed
     *     attributes.
     */
    function mergeAttrs(optAttrs) {
        const clone = new Map([...allowedAttributes]);
        optAttrs.forEach((key) => {
            if (allowedOptionalAttributes.has(key)) {
                clone.set(key, allowedOptionalAttributes.get(key));
            }
        });
        return clone;
    }

    function walk(n, f) {
        f(n);
        for (let i = 0; i < n.childNodes.length; i++) {
            walk(n.childNodes[i], f);
        }
    }

    function assertElement(tags, node) {
        if (!tags.has(node.tagName)) {
            throw Error(node.tagName + " is not supported");
        }
    }

    function assertAttribute(attrs, attrNode, node) {
        const n = attrNode.nodeName;
        const v = attrNode.nodeValue;
        if (!attrs.has(n) || !attrs.get(n)(node, v)) {
            throw Error(
                node.tagName + "[" + n + '="' + v + '"] is not supported'
            );
        }
    }

    return function (s, opt_extraTags, opt_extraAttrs) {
        const tags = opt_extraTags ? mergeTags(opt_extraTags) : allowedTags;
        const attrs = opt_extraAttrs
            ? mergeAttrs(opt_extraAttrs)
            : allowedAttributes;

        const doc = document.implementation.createHTMLDocument("");
        const r = doc.createRange();
        r.selectNode(doc.body);

        if (window.trustedTypes) {
            if (!unsanitizedPolicy) {
                unsanitizedPolicy = trustedTypes.createPolicy(
                    "parse-html-subset",
                    { createHTML: (untrustedHTML) => untrustedHTML }
                );
            }
            s = unsanitizedPolicy.createHTML(s);
        }

        // This does not execute any scripts because the document has no view.
        const df = r.createContextualFragment(s);
        walk(df, function (node) {
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                    assertElement(tags, node);
                    const nodeAttrs = node.attributes;
                    for (let i = 0; i < nodeAttrs.length; ++i) {
                        assertAttribute(attrs, nodeAttrs[i], node);
                    }
                    break;

                case Node.COMMENT_NODE:
                case Node.DOCUMENT_FRAGMENT_NODE:
                case Node.TEXT_NODE:
                    break;

                default:
                    throw Error(
                        "Node type " + node.nodeType + " is not supported"
                    );
            }
        });
        return df;
    };
})();

/**
 * @typedef {{
 *   substitutions: (!Array<string>|undefined),
 *   attrs: (!Array<string>|undefined),
 *   tags: (!Array<string>|undefined),
 * }}
 */
export let SanitizeInnerHtmlOpts;

// eslint-disable-next-line no-var
export /** @type {!LoadTimeData} */
var loadTimeData;

// Expose this type globally as a temporary work around until
// https://github.com/google/closure-compiler/issues/544 is fixed.
/** @constructor */
function LoadTimeData() {}

(function () {
    "use strict";

    LoadTimeData.prototype = {
        /**
         * Sets the backing object.
         *
         * Note that there is no getter for |data_| to discourage abuse of the form:
         *
         *     var value = loadTimeData.data()['key'];
         *
         * @param {Object} value The de-serialized page data.
         */
        set data(value) {
            expect(!this.data_, "Re-setting data.");
            this.data_ = value;
        },

        /**
         * Returns a JsEvalContext for |data_|.
         * @returns {JsEvalContext}
         */
        createJsEvalContext() {
            return new JsEvalContext(this.data_);
        },

        /**
         * @param {string} id An ID of a value that might exist.
         * @return {boolean} True if |id| is a key in the dictionary.
         */
        valueExists(id) {
            return id in this.data_;
        },

        /**
         * Fetches a value, expecting that it exists.
         * @param {string} id The key that identifies the desired value.
         * @return {*} The corresponding value.
         */
        getValue(id) {
            expect(
                this.data_,
                "No data. Did you remember to include strings.js?"
            );
            const value = this.data_[id];
            expect(
                typeof value !== "undefined",
                "Could not find value for " + id
            );
            return value;
        },

        /**
         * As above, but also makes sure that the value is a string.
         * @param {string} id The key that identifies the desired string.
         * @return {string} The corresponding string value.
         */
        getString(id) {
            const value = this.getValue(id);
            expectIsType(id, value, "string");
            return /** @type {string} */ (value);
        },

        /**
         * Returns a formatted localized string where $1 to $9 are replaced by the
         * second to the tenth argument.
         * @param {string} id The ID of the string we want.
         * @param {...(string|number)} var_args The extra values to include in the
         *     formatted output.
         * @return {string} The formatted string.
         */
        getStringF(id, var_args) {
            const value = this.getString(id);
            if (!value) {
                return "";
            }

            const args = Array.prototype.slice.call(arguments);
            args[0] = value;
            return this.substituteString.apply(this, args);
        },

        /**
         * Make a string safe for use with with Polymer bindings that are
         * inner-h-t-m-l (or other innerHTML use).
         * @param {string} rawString The unsanitized string.
         * @param {SanitizeInnerHtmlOpts=} opts Optional additional allowed tags and
         *     attributes.
         * @return {string}
         */
        sanitizeInnerHtml(rawString, opts) {
            opts = opts || {};
            return parseHtmlSubset(
                "<b>" + rawString + "</b>",
                opts.tags,
                opts.attrs
            ).firstChild.innerHTML;
        },

        /**
         * Returns a formatted localized string where $1 to $9 are replaced by the
         * second to the tenth argument. Any standalone $ signs must be escaped as
         * $$.
         * @param {string} label The label to substitute through.
         *     This is not an resource ID.
         * @param {...(string|number)} var_args The extra values to include in the
         *     formatted output.
         * @return {string} The formatted string.
         */
        substituteString(label, var_args) {
            const varArgs = arguments;
            return label.replace(/\$(.|$|\n)/g, function (m) {
                console.assert(
                    m.match(/\$[$1-9]/),
                    "Unescaped $ found in localized string."
                );
                return m === "$$" ? "$" : varArgs[m[1]];
            });
        },

        /**
         * Returns a formatted string where $1 to $9 are replaced by the second to
         * tenth argument, split apart into a list of pieces describing how the
         * substitution was performed. Any standalone $ signs must be escaped as $$.
         * @param {string} label A localized string to substitute through.
         *     This is not an resource ID.
         * @param {...(string|number)} var_args The extra values to include in the
         *     formatted output.
         * @return {!Array<!{value: string, arg: (null|string)}>} The formatted
         *     string pieces.
         */
        getSubstitutedStringPieces(label, var_args) {
            const varArgs = arguments;
            // Split the string by separately matching all occurrences of $1-9 and of
            // non $1-9 pieces.
            const pieces = (
                label.match(/(\$[1-9])|(([^$]|\$([^1-9]|$))+)/g) || []
            ).map(function (p) {
                // Pieces that are not $1-9 should be returned after replacing $$
                // with $.
                if (!p.match(/^\$[1-9]$/)) {
                    console.assert(
                        (p.match(/\$/g) || []).length % 2 === 0,
                        "Unescaped $ found in localized string."
                    );
                    return {
                        value: p.replace(/\$\$/g, "$"),
                        arg: null,
                    };
                }

                // Otherwise, return the substitution value.
                return {
                    value: varArgs[p[1]],
                    arg: p,
                };
            });

            return pieces;
        },

        /**
         * As above, but also makes sure that the value is a boolean.
         * @param {string} id The key that identifies the desired boolean.
         * @return {boolean} The corresponding boolean value.
         */
        getBoolean(id) {
            const value = this.getValue(id);
            expectIsType(id, value, "boolean");
            return /** @type {boolean} */ (value);
        },

        /**
         * As above, but also makes sure that the value is an integer.
         * @param {string} id The key that identifies the desired number.
         * @return {number} The corresponding number value.
         */
        getInteger(id) {
            const value = this.getValue(id);
            expectIsType(id, value, "number");
            expect(
                value === Math.floor(value),
                "Number isn't integer: " + value
            );
            return /** @type {number} */ (value);
        },

        /**
         * Override values in loadTimeData with the values found in |replacements|.
         * @param {Object} replacements The dictionary object of keys to replace.
         */
        overrideValues(replacements) {
            expect(
                typeof replacements === "object",
                "Replacements must be a dictionary object."
            );
            for (const key in replacements) {
                this.data_[key] = replacements[key];
            }
        },
    };

    /**
     * Checks condition, displays error message if expectation fails.
     * @param {*} condition The condition to check for truthiness.
     * @param {string} message The message to display if the check fails.
     */
    function expect(condition, message) {
        if (!condition) {
            console.error(
                "Unexpected condition on " +
                    document.location.href +
                    ": " +
                    message
            );
        }
    }

    /**
     * Checks that the given value has the given type.
     * @param {string} id The id of the value (only used for error message).
     * @param {*} value The value to check the type on.
     * @param {string} type The type we expect |value| to be.
     */
    function expectIsType(id, value, type) {
        expect(
            typeof value === type,
            "[" + value + "] (" + id + ") is not a " + type
        );
    }

    expect(!loadTimeData, "should only include this file once");
    loadTimeData = new LoadTimeData();

    // Expose |loadTimeData| directly on |window|. This is only necessary by the
    // auto-generated load_time_data.m.js, since within a JS module the scope is
    // local.
    window.loadTimeData = loadTimeData;
})();
