(function($){

  // ——————————————————————————————————————
  // 1) Define CAF’s get_params as a true global, now including live filter state
  window.get_params = (page, divKey) => {
    const sel      = `.${divKey}`;
    const $el      = $(sel);
    const $wrapper = $el.closest('.caf-filter-layout');

    // 1A) Static attributes
    const params = {
      page:               page,
      tax:                $el.data('tax'),
      'post-type':        $el.data('post-type'),
      term:               $el.data('terms'),
      'per-page':         $el.data('per-page'),
      'filter-id':        $el.data('filter-id'),
      'caf-post-layout':  $el.data('post-layout'),
      'data-target-div':  sel,
      'data-filter-layout': $el.data('filter-layout'),
      'data-relation':      $el.data('relation'),
      'data-default-term':  $el.data('default-term'),
      'current-post-id':    $el.data('current-post-id'),
      'data-order-by':      $el.data('order-by'),
      'data-order-type':    $el.data('order-type')
    };

    // 1B) Live checkbox filters: every checked input under any caf-filter-container
    const liveTerms = $wrapper
      .find('.caf-filter-container input:checked')
      .map(function(){ return this.value; })
      .get();

    if ( liveTerms.length ) {
      params.term = liveTerms.join(',');
    }

    // 1C) Live <select> controls under caf-filter-container (per-page, order, etc.)
    $wrapper
      .find('.caf-filter-container select')
      .each(function(){
        const $c    = $(this);
        const name  = $c.attr('name');
        const value = $c.val();
        if ( name && value != null ) {
          params[name] = value;
        }
      });

    // 1D) Live search input (if you use one)
    const search = $('#caf-search-input').val();
    if ( search ) {
      params.search_string = search;
    }

    return params;
  };

  // ——————————————————————————————————————
  // 2) Define refreshCAF globally (unchanged)
  window.refreshCAF = () => {
    const $caf = $('.caf-post-layout-container:visible').first();
    if ( !$caf.length ) {
      return;
    }
    const params = get_params(1, $caf.data('target-div'));
    get_posts(params);
  };

  // ——————————————————————————————————————
  
	
	// 3) Wait for CAF’s get_posts to exist, then init your toggles
const waitForCAF = () => {
  if ( typeof get_posts === 'function' ) {
    jQuery(function initMyToggles($){

      // ————— GROUPED TOGGLE CONFIGS —————
      const toggleConfigs = {
        // “hide read” flag
        hide: {
          wrappers: ['#toggle-cbx', '.toggle-show-read'],
          dataObj: toggleBookmarkedPosts,
          onAction: 'hide_bookmarked_posts',
          offAction: 'show_bookmarked_posts'
        },
        // “show saved” flag
        show_only_saved: {
          wrappers: ['#toggle-fav', '.toggle-show-saved'],
          dataObj: favToggleData,
          onAction: 'toggle_favorites_filter',
          offAction: 'toggle_favorites_filter',
          paramKey: 'show_favorites'
        },
        // “show liked” flag
        show_only_liked: {
          wrappers: ['#toggle-liked', '.toggle-show-liked'],
          dataObj: likedToggleData,
          onAction: 'toggle_liked_filter',
          offAction: 'toggle_liked_filter',
          paramKey: 'show_liked'
        },
		 // ———— Show read new flag ————
		hide_custom_read: {
          wrappers: ['#toggle-custom-read', '.toggle-hide-custom-read'],
          dataObj: customReadToggleData,          // localised in PHP
          onAction: 'toggle_custom_read_filter',  // same endpoint both ways
          offAction: 'toggle_custom_read_filter',
          paramKey: 'hide_custom_read'
        }	  
		  
      };

      // ————— VISUAL UTILITY —————
      const updateVisual = ($wrap, isOn) => {
        const $sw = $wrap.find('.oew-switch-wrap');
        $sw.toggleClass('oew-switch-on',  isOn)
           .toggleClass('oew-switch-off', !isOn);
      };

      // ————— INITIALIZER FOR ONE FLAG —————
function initFlagToggle(flagKey, cfg) {
  const sel     = cfg.wrappers.join(',');
  const $inputs = $(sel).find('input[type="checkbox"]');
  const isOn    = cfg.dataObj[flagKey] === '1';

  // 1) sync initial checked state + visuals
  $inputs.prop('checked', isOn)
         .closest('.oew-switch-wrap')
         .toggleClass('oew-switch-on',  isOn)
         .toggleClass('oew-switch-off', !isOn);

  // 2) on any change, send AJAX and refresh CAF
  $inputs.on('change', function (e) {
    e.preventDefault();
    const nowOn = $(this).is(':checked');
    $inputs.prop('disabled', true);

    /* ─── GUEST-ONLY ▼────────────────────────────── */
    if (!document.body.classList.contains('logged-in')) {

  /* remember the choice locally */
  localStorage.setItem(flagKey, nowOn ? '1' : '0');

  /* 30-day cookies so PHP can read the switches */
  if (flagKey === 'show_only_liked') {
    document.cookie =
      `guest_show_only_liked=${nowOn ? 1 : 0};path=/;max-age=${60*60*24*30}`;
  } else if (flagKey === 'hide_custom_read') {          // ← NEW block
    document.cookie =
      `guest_hide_custom_read=${nowOn ? 1 : 0};path=/;max-age=${60*60*24*30}`;
  }

  /* instant UI + grid refresh */
  $(this).closest('.oew-switch-wrap')
         .toggleClass('oew-switch-on',  nowOn)
         .toggleClass('oew-switch-off', !nowOn);
  refreshCAF();
  $inputs.prop('disabled', false);
  return;            // ← skip the AJAX call
}

    /* ─── GUEST-ONLY ▲────────────────────────────── */

    const data = { action: nowOn ? cfg.onAction : cfg.offAction };
    data[cfg.paramKey || flagKey] = nowOn;

    $.post(cfg.dataObj.ajax_url, data)
      .always(() => { $inputs.prop('disabled', false); })
      .done(() => {
        $inputs.prop('checked', nowOn)
               .closest('.oew-switch-wrap')
               .toggleClass('oew-switch-on',  nowOn)
               .toggleClass('oew-switch-off', !nowOn);
        refreshCAF();
      })
      .fail(() => { alert('Could not update preference.'); });
  });
}


      // ————— KICK OFF ALL FLAGS —————
      Object.entries(toggleConfigs).forEach(([flagKey, cfg]) => {
        initFlagToggle(flagKey, cfg);
      });

    });
  } else {
    setTimeout(waitForCAF, 100);
  }
};

waitForCAF();

	

})(jQuery);
