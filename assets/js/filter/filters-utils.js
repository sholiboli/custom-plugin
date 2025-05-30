/**
 * filters-utils.js
 * A grab-bag of tiny helpers that any Perfect-Blog script can use.
 * No dependencies except jQuery (already loaded by WordPress).
 *
 * The module attaches ONE global:  window.PF  (= Perfect Filters)
 * You’ll call helpers as  PF.dedupeActiveFilters(), PF.debounce(fn, 200), etc.
 */
window.PF = (function ($) {
    'use strict';

    /* ─────────────────────────────────────────────────────────────── */
    /* 1.  Remove duplicate “pills” in CAF’s .caf-active-filters bar   */
    /* ─────────────────────────────────────────────────────────────── */
    function dedupeActiveFilters () {
        const seen = {};
        $('.caf-active-filters ul li.filter-item').each(function () {
            const id = $(this).attr('data-id');
            if (seen[id]) {
                $(this).remove();
            } else {
                seen[id] = true;
            }
        });
    }

    /* ─────────────────────────────────────────────────────────────── */
    /* 2.  Generic debounce helper (you’ll need it later)             */
    /* ─────────────────────────────────────────────────────────────── */
    function debounce (fn, wait) {
        let t;
        return function () {
            clearTimeout(t);
            const args = arguments;
            const ctx  = this;
            t = setTimeout(function () {
                fn.apply(ctx, args);
            }, wait);
        };
    }

    /*  Export public helpers  */
    return { dedupeActiveFilters, debounce };

})(jQuery);
