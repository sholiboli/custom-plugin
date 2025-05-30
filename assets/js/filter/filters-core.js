/**
 * filters-core.js
 * Owns: filter state, persistence, CAF refresh
 * Emits: filters:changed, filters:restored
 */

(function ($, window, wp) {
    'use strict';

    const STORAGE_KEY = 'perfectBlog.filterState';

    const readStore  = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    };

    const writeStore = (obj) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {
            // Silently fail in private mode or quota errors
        }
    };

    const refreshCAF = () => {
        if ($.fn.caf && $('.caf-wrapper').length) {
            $('.caf-wrapper').caf('refresh');
        }
    };

    const state = {
        toggles: {},
        terms: []
    };

    function setToggle(name, value) {
        state.toggles[name] = !!value;
        commit();
    }

    function toggleTerm(slug) {
        const i = state.terms.indexOf(slug);
        i === -1 ? state.terms.push(slug) : state.terms.splice(i, 1);
        commit();
    }

    function commit() {
        writeStore(state);
        refreshCAF();
        document.dispatchEvent(new CustomEvent('filters:changed', { detail: state }));
    }

    $(document).ready(() => {
        Object.assign(state, readStore());
        document.dispatchEvent(new CustomEvent('filters:restored', { detail: state }));
    });

    // Export
    window.PerfectFilters = {
        getState: () => ({ ...state }),
        setToggle,
        toggleTerm
    };

})(jQuery, window, window.wp || {});
