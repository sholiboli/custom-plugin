console.log('filter-button2');
console.log('FilterHelper exists?', typeof FilterHelper !== 'undefined');

//———————————————————————————————————————————— JS SCRIPT HELPER————————————————————————————————————————————————————————————————

jQuery(function($){
	
// Work on the shared array by aliasing it locally…
var selected = window.selected || [];

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
    console.log('[MTF] All-label clicked → let CAF default run');
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
  console.log('[MTF] defaultTxt:', defaultTxt);

  /* --------D. TOGGLE ACTIVE STATE---------------------- */
	
  $li.toggleClass('active');
  console.log('[MTF] $li isActive?', $li.hasClass('active'));

  /* --------E. LABEL & DATA-VALUE ON <li.caf_select_multi_default> -------------------------------- */
 
	// Helper function: Get active names and values from a dropdown
	var { names, values } = FilterHelper.getActiveNamesAndValues($dropdown);
	// Helper: Default text and value updater
	FilterHelper.updateDropdownLabel($wrap, defaultTxt);

  console.log('[MTF] names[]:', names);
  console.log('[MTF] vals[] :', values);

	  /* ---------F. IDENTIFY THE TARGET GRID------------------ */
	
  var divClass = $li.closest('.caf-multiple-taxonomy-filter-modern')
                    .attr('class')
                    .split(/\s+/)
                    .find(c => c.indexOf('data-target-div') === 0);
  console.log('[MTF] divClass:', divClass);

  /* -------- G. COLLECT SELECTED TERMS  (*** KEY PART ***)------------------ */
	
// ✅ Always gather from all active dropdown selections, not just the current one
var allVals = $('ul.caf-multi-drop-sub li.active').map(function(){
  return this.getAttribute('data-value');
}).get();

var flat     = allVals.slice(); // full deduped list
var termsCSV = flat.join(',');
console.log('[MTF] flat     →', flat);
console.log('[MTF] termsCSV →', termsCSV);

/* keep globals in sync */
window.selected = flat.slice();
console.log('[MTF] ✅ window.selected updated across all dropdowns:', window.selected);

/* persist last-filter pref if enabled */
FilterHelper.saveLastFilterPref(window.selected);

  /* ------------ H. DECIDE LAYOUT STRING---------------- */

	// Helper function: Decide layout string for given container
	var $container = $('#caf-post-layout-container.' + divClass);
	var layout = FilterHelper.getFilterLayoutFromContainer($container, flat);
	console.log('[MTF] chosen layout →', layout);

	// Helper function: Update container metadata, store latest terms/layout on wrapper
		FilterHelper.updateContainerMeta($container, termsCSV, layout);

  /* -----------  I. BUILD PARAMS FOR get_posts()------------------- */
  
	// Helper function: Build params for AJAX post
		var params = FilterHelper.buildAjaxParams(divClass, termsCSV, $li.data('value'));

  console.log('[MTF] final params to get_posts:', params);

  /* ------------- J. FIRE AJAX & UI HELPERS------------------- */
	
  cafScrollToDiv(divClass.replace('data-target-div', ''));
  get_posts(params);
   console.log('[MTF] get_posts received:', JSON.parse(JSON.stringify(params)));

  /* after reload, refresh pills */
  setTimeout(function () {
    $('.caf-filter-layout').each(function () {
      set_active_filters(this);
    });
    console.log('[MTF] set_active_filters() ran (timeout)');
	  
	  
	   // 11) Save filter to DB if enabled
FilterHelper.saveLastFilterPref(window.selected);
  }, 100);

  /* rebuild custom buttons */
  renderButtons();
  FilterHelper.rebuildActiveFilterUI($container);
  console.log('[MTF] custom buttons rebuilt');
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
  console.log("🛠 [MTF ClearAll] before set_active_filters(), window.selected =", window.selected);
  renderButtons();

  // f) Rebuild the (now empty) active-filters UI
  set_active_filters('#caf-post-layout-container.' + divKey);
});


//----------------------------------------------------------------------------------------------------------

// 10) Handle clicks on “All …” in MTF to toggle that entire taxonomy
$(document).on('click', 'ul.caf-multi-drop-sub li.caf_select_multi_default_label_2', function(e){
  e.preventDefault();
  e.stopPropagation();

  console.log("🔧 [AllHandler] clicked inner All …");

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

  // Debug #3: after mutation
  console.log("🔧 [AllHandler] window.selected after:", window.selected);

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
	
console.log('[MTF] [AllHandler] final params to get_posts:', params); // optional
cafScrollToDiv(divKey);
get_posts(params);
	
});

	// after all scripts finish restoring filters on load

$(window).on('load', function(){
  setTimeout(function(){
    if (window.saveLastFilterPref && Array.isArray(window.selected) && window.selected.length > 0) {
  renderButtons();
  set_active_filters($('.caf-post-layout-container'));
  $(document).trigger('filtersReady');
}
	  
	// Also restore pills for modern layout if needed	  
	// Helper function: Get divKey from .caf-post-layout-container
		const $container = $('.caf-post-layout-container');
		const divKey = FilterHelper.getDivKey($container);

	  const savedTerms = $container.data('terms') || '';
console.log('[MTF] ⏱ Restore check: savedTerms =', savedTerms);

	  
	 	
	// Only override if window.selected is missing or empty  
	  if ((!window.selected || window.selected.length === 0) && savedTerms && savedTerms.length > 0) {
  window.selected = savedTerms.split(',');
  console.log('[MTF] ⏱ window.selected populated from savedTerms:', window.selected);
}

if (window.selected && window.selected.length > 0) {
  FilterHelper.rebuildActiveFilterUI($container);
  console.log('[MTF] ✅ Active filters restored (modern layout)', window.selected);
}
  }, 500); // keep your delay
});

	
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
