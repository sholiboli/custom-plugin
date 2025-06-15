console.log('filter-button2 - v5');

//———————————————————————————————————————————— JS SCRIPT HELPER————————————————————————————————————————————————————————————————

jQuery(function($){
	
// Work on the shared array by aliasing it locally…
var selected = window.selected || [];

	/*
	// Initialize toggle state from localized PHP variable
	if (typeof window.hideBookmarkedPosts === 'undefined') {
  if (typeof toggleBookmarkedPosts !== 'undefined' && toggleBookmarkedPosts.hide === '1') {
    window.hideBookmarkedPosts = true;
  } else {
    window.hideBookmarkedPosts = false;
  }
}

// Initialize showSavedPosts from localized PHP variable
if (typeof window.showSavedPosts === 'undefined') {
  if (typeof favToggleData !== 'undefined' && favToggleData.show_only_saved === '1') {
    window.showSavedPosts = true;
  } else {
    window.showSavedPosts = false;
  }
}
*/
	
	
// Ensure window.saveLastFilterPref is correctly set
if (typeof window.saveLastFilterPref === 'undefined') {
  if (typeof userSaveLastFilter !== 'undefined') {
    window.saveLastFilterPref = Boolean(parseInt(userSaveLastFilter, 10));
  } else {
    window.saveLastFilterPref = false;
  }
}
	
  // 1) Cache each filter’s default-text
  $('ul.caf_select_multi').each(function(){
    var $d = $(this).find('.caf_select_multi_default');
    $d.data('default-text', $d.find('span').text());
  });

  // 2) Remove CAF’s original handlers
  $(document).off('click.customMTF', 'ul.caf-multi-drop-sub li');
  $('ul.caf-multi-drop-sub li').off('click');

  	// 3) Bind our multi-select + immediate-AJAX handler
$(document).on('click.customMTF', 'ul.caf-multi-drop-sub li', function (e) {
  var $li = $(this);
  console.log('[MTF] click on:', {
    text:  $li.text().trim(),
    id:    $li.data('value'),
    name:  $li.data('name')
  });

  /* ------------------A. BYPASS “All …” LABEL------------------ */
	
  if ($li.hasClass('caf_select_multi_default_label_2')) {
       return false;
  }

  /* -----------B. STOP CAF’S OWN LISTENER (unchanged from your code)----------------- */
	
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  /* --------- C. BUILD REFERENCES----------------- */
	
  var $dropdown = $li.closest('ul.caf-multi-drop-sub'),
      $wrap     = $dropdown.closest('ul.caf_select_multi'),
      $def      = $wrap.find('.caf_select_multi_default'),
      defaultTxt = $def.data('default-text');


  /* --------D. TOGGLE ACTIVE STATE---------------------- */
	
  $li.toggleClass('active');
 

  /* --------E. LABEL & DATA-VALUE ON <li.caf_select_multi_default> -------------------------------- */
 
	// Helper function: Get active names and values from a dropdown
	var { names, values } = FilterHelper.getActiveNamesAndValues($dropdown);
	// Helper: Default text and value updater
	FilterHelper.updateDropdownLabel($wrap, defaultTxt);


	  /* ---------F. IDENTIFY THE TARGET GRID------------------ */
	
  var divClass = $li.closest('.caf-multiple-taxonomy-filter-modern')
                    .attr('class')
                    .split(/\s+/)
                    .find(c => c.indexOf('data-target-div') === 0);

  /* -------- G. COLLECT SELECTED TERMS  (*** KEY PART ***)------------------ */
	
// ✅ Always gather from all active dropdown selections, not just the current one
var allVals = $('ul.caf-multi-drop-sub li.active').map(function(){
  return this.getAttribute('data-value');
}).get();

var flat     = allVals.slice(); // full deduped list
var termsCSV = flat.join(',');

/* keep globals in sync */
window.selected = flat.slice();
		
/* persist last-filter pref if enabled */
FilterHelper.saveLastFilterPref(window.selected);

  /* ------------ H. DECIDE LAYOUT STRING---------------- */

	// Helper function: Decide layout string for given container
	var $container = $('#caf-post-layout-container.' + divClass);
	var layout = FilterHelper.getFilterLayoutFromContainer($container, flat);
	
	// Helper function: Update container metadata, store latest terms/layout on wrapper
		FilterHelper.updateContainerMeta($container, termsCSV, layout);

  /* -----------  I. BUILD PARAMS FOR get_posts()------------------- */
  
	// Helper function: Build params for AJAX post
		var params = FilterHelper.buildAjaxParams(divClass, termsCSV, $li.data('value'));

 	
  /* ------------- J. FIRE AJAX & UI HELPERS------------------- */
	
  cafScrollToDiv(divClass.replace('data-target-div', ''));

  get_posts(params);

  /* after reload, refresh pills */
  setTimeout(function () {
    $('.caf-filter-layout').each(function () {
      set_active_filters(this);
    });
    
	  
	   // 11) Save filter to DB if enabled
FilterHelper.saveLastFilterPref(window.selected);
  }, 100);

  /* rebuild custom buttons */
  renderButtons();
  FilterHelper.rebuildActiveFilterUI($container);
});
	
	// 4) Clear All handler for MTF
$(document).on('click', '.clear-all-btn', function(e){
  e.preventDefault();
  e.stopPropagation();

  // a) Identify the container
  // a2) Helper function: Get divKey from .caf-post-layout-container
  var $plc   = $(this).closest('.caf-post-layout-container'),
      divKey = FilterHelper.getDivKey($plc);

	// Helper function - Reset all dropdowns to default state 
	// b & c) Reset all dropdowns to default
		FilterHelper.resetDropdownsDefault($plc);

	// Helper function: Update container metadata, restore the container’s data-terms & layout
		FilterHelper.updateContainerMeta(
			$plc,
			$plc.data('selected-terms'),
				'multiple-taxonomy-filter'
		);

  // → reset the saved‐filter array so it’s truly cleared
  window.selected = [];

  // —————————SAVE LAST FILTER————————
FilterHelper.saveLastFilterPref(window.selected);

	
  // —————————SAVE LAST FILTER————————

  // e) Trigger AJAX reload
  // Helper function: Build params for AJAX post
  var params = FilterHelper.buildAjaxParams(divKey, '');
  cafScrollToDiv(divKey);

  get_posts(params);

  // —— NEW —— repaint your custom buttons before clearing pills
  renderButtons();

  // f) Rebuild the (now empty) active-filters UI
  set_active_filters('#caf-post-layout-container.' + divKey);
});


//----------------------------------------------------------------------------------------------------------

// 10) Handle clicks on “All …” in MTF to toggle that entire taxonomy
$(document).on('click', 'ul.caf-multi-drop-sub li.caf_select_multi_default_label_2', function(e){
  e.preventDefault();
  e.stopPropagation();
	
  var $wrap     = $(this).closest('ul.caf_select_multi'),
      taxonomy  = $wrap
                   .find('ul.caf-multi-drop-sub li.caf_select_multi_dp_value')
                   .first()
                   .attr('data-value')
                   .split('___')[0],
      allVals   = $wrap
                   .find('ul.caf-multi-drop-sub li.caf_select_multi_dp_value')
                   .map((i, el) => $(el).attr('data-value'))
                   .get(),
      current   = window.selected.filter(v => v.startsWith(taxonomy + '___')),
      selectAll = current.length < allVals.length;

  if (selectAll) {
    allVals.forEach(v => {
      if (window.selected.indexOf(v) === -1) {
        window.selected.push(v);
      }
    });
  } else {
    window.selected = window.selected.filter(v => !v.startsWith(taxonomy + '___'));
  }

	
  // keep your local copy in sync
  selected = window.selected.slice();

  // —————————SAVE LAST FILTER————————
FilterHelper.saveLastFilterPref(window.selected);

  // —————————SAVE LAST FILTER————————

  // Now rebuild the dropdown UI
  FilterHelper.repaintDropdown($wrap, selected);

  // Helper function: Get active names and values from a dropdown, update the default button text & value
	const defaultTxt = $wrap.find('li.caf_select_multi_default').data('default-text');
	FilterHelper.updateDropdownLabel($wrap, defaultTxt);


  // repaint buttons
  renderButtons();

  // rebuild the CAF Active-Filters bar
  // Helper function: Get divKey from .caf-post-layout-container
  var divKey = FilterHelper.getDivKey($wrap.closest('.caf-post-layout-container'))
      $container = $('#caf-post-layout-container.' + divKey);

	FilterHelper.rebuildActiveFilterUI($container);


  // then fire CAF’s AJAX filter
  // Helper function: Build params for AJAX post
 var params = FilterHelper.buildAjaxParams(divKey, window.selected.join(','));
	
cafScrollToDiv(divKey);

get_posts(params);
	
});

	// after all scripts finish restoring filters on load

$(window).on('load', function(){
  setTimeout(function(){
    const $container = $('.caf-post-layout-container');
    const divKey = FilterHelper.getDivKey($container);
    const savedTerms = $container.data('terms') || '';
	 	  
    // Step 1: Restore window.selected from data-terms if not already set
    if ((!window.selected || window.selected.length === 0) && savedTerms && savedTerms.length > 0) {
      window.selected = savedTerms.split(',');

    }

    // Step 2: Repaint dropdown UI to reflect saved state
    if (Array.isArray(window.selected) && window.selected.length > 0) {
      $('ul.caf_select_multi').each(function() {
        FilterHelper.repaintDropdown($(this), window.selected);
      });

      // Step 3: Rebuild filter pills and sync CAF UI
      if (window.saveLastFilterPref) {
        renderButtons();
        set_active_filters($container);
        $(document).trigger('filtersReady');
      }

      FilterHelper.rebuildActiveFilterUI($container);
		
    }
  }, 500); // Keep your existing delay for now
});


	
// SEAMLESS HIDE UNREAD POSTS for MTFM

	/*
$('.toggle-show-read input.custom-toggle-input').on('change', function () {
	 console.log('BUTTON2-toggle handler fired');
  const isHidden = $(this).is(':checked');
  window.hideBookmarkedPosts = isHidden;

  // Save to user meta (AJAX call)
  $.post(toggleBookmarkedPosts.ajax_url, {
    action: isHidden ? 'hide_bookmarked_posts' : 'show_bookmarked_posts',
    hide: isHidden ? 'true' : 'false'
  });

  // Delay the reload slightly to avoid race conditions
  setTimeout(() => {
    if (typeof window.selected !== 'undefined' && typeof FilterHelper !== 'undefined') {
      const $container = $('.caf-post-layout-container');
      const divKey = FilterHelper.getDivKey($container);
      const termsCSV = (window.selected || []).join(',');
      const params = FilterHelper.buildAjaxParams(divKey, termsCSV);
      params.hide_bookmarked_posts = isHidden ? '1' : '0';
      get_posts(params);
    }
  }, 300); // adjust delay as needed
});
*/

// SEAMLESS SHOW SAVED POSTS for MTFM
/*
	$('.toggle-show-saved input.custom-toggle-input').on('change', function () {
  const isSavedOnly = $(this).is(':checked');
  window.showSavedPosts = isSavedOnly;

  // Save to user meta (AJAX call)
  $.post(favToggleData.ajax_url, {
    action: isSavedOnly ? 'show_saved_posts' : 'hide_saved_posts',
    show: isSavedOnly ? 'true' : 'false'
  });

  // Delay the reload slightly to avoid race conditions
  setTimeout(() => {
    if (typeof window.selected !== 'undefined' && typeof FilterHelper !== 'undefined') {
      const $container = $('.caf-post-layout-container');
      const divKey = FilterHelper.getDivKey($container);
      const termsCSV = (window.selected || []).join(',');
      const params = FilterHelper.buildAjaxParams(divKey, termsCSV);
      params.show_only_saved = isSavedOnly ? '1' : '0';
      get_posts(params);
    }
  }, 300); // match delay to existing pattern
});
*/



	
//───────────────────────PART 2: ENABLE MULTIPLE DROPDOWN MENUS OPENED AT THE SAME TIME─────────────────────────────────────

// 4) Neutralize CAF’s header-click and replace it
/*
$('ul.caf_select_multi li.caf_select_multi_default').off('click');

$('ul.caf_select_multi li.caf_select_multi_default').on('click', function(e){
  e.stopPropagation();

  var $btn  = $(this),
      $wrap = $btn.closest('ul.caf_select_multi'),
      $menu = $wrap.find('ul.caf-multi-drop-sub'),
      $icon = $btn.find('i.caf-multi-mod-right');

  $menu.toggleClass('active');
  $icon.toggleClass('fa-chevron-up');
});
*/
	

});