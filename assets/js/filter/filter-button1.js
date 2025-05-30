console.log('filter-button1.js');

jQuery(function($){

// Work on the shared array by aliasing it locally…
var selected = window.selected || [];

	
// If the user has NOT chosen “save last filter,” make sure no browser restoration sticks us with stale checks in Firefox
  if ( ! saveLastFilterPref ) {
    $('#caf-multiple-check-filter input.check_box, #caf-multiple-taxonomy-filter input.check_box')
      .prop('checked', false);
	  
	 // …and clear any “active” dropdown items
  $('ul.caf-multi-drop-sub li.active')
    .removeClass('active');
  }
	
// Helper: remove duplicate pills from the Active-Filters bar
  function dedupeActiveFilters(){
    var seen = {};
    $('.caf-active-filters ul li.filter-item').each(function(){
      var id = $(this).attr('data-id');
      if ( seen[id] ) {
        $(this).remove();
      } else {
        seen[id] = true;
      }
    });
  }
	
//───────────────────────PHASES LETTERS─────────────────────────────────────
    // A) Read user preference for multiSelectMode
  var multiSelectMode = false;
  if (typeof userMultiSelectMode !== 'undefined') {
    multiSelectMode = Boolean(parseInt(userMultiSelectMode, 10));
  }
//-------------------------------------------------------------------------
// B) Read “remember last filter” preference & saved value
var saveLastFilterPref = false;
if (typeof userSaveLastFilter !== 'undefined') {
  saveLastFilterPref = Boolean(parseInt(userSaveLastFilter, 10));
}
window.saveLastFilterPref = saveLastFilterPref;   // ← share it with other scripts

var lastFilter = [];
if (saveLastFilterPref && typeof userLastFilter !== 'undefined' && userLastFilter) {
  lastFilter = userLastFilter.split(',');
}

//-------------------------------------------------------------------------
  // C) UI for “Save Last Filter” toggle
  function updateLastFilterToggleUI(){
    var t = $('#toggle-last-filter');
    if (saveLastFilterPref) {
      t.addClass('active-filter-toggle');
      t.find('.oew-switch-wrap').addClass('oew-switch-on');
      t.find('.oew-switch-primary-wrap').removeClass('show').addClass('hide');
      t.find('.oew-switch-secondary-wrap').removeClass('hide').addClass('show');
      t.find("input[type='checkbox']").prop("checked", true);
    } else {
      t.removeClass('active-filter-toggle');
      t.find('.oew-switch-wrap').removeClass('oew-switch-on');
      t.find('.oew-switch-primary-wrap').removeClass('hide').addClass('show');
      t.find('.oew-switch-secondary-wrap').removeClass('show').addClass('hide');
      t.find("input[type='checkbox']").prop("checked", false);
    }
  }
  updateLastFilterToggleUI();
//-------------------------------------------------------------------------

// D) Toggle handler for “Save Last Filter”
$(document).on('click', '#toggle-last-filter', function(e){
  e.preventDefault();

  // flip the flag
  saveLastFilterPref = !saveLastFilterPref;
  window.saveLastFilterPref = saveLastFilterPref;   // ← keep the global in sync
  updateLastFilterToggleUI();

  // Persist preference
  $.post(ajaxurl, {
    action:   'caf_update_save_last_filter_pref',
    save_pref: saveLastFilterPref ? 1 : 0,
    nonce:    cafLastFilterNonce
  });

  // Save the actual current selection
  if (saveLastFilterPref) {
    var filterString = window.selected ? window.selected.join(',') : selected.join(',');

    $.post(ajaxurl, {
      action: 'caf_update_last_filter',
      filter: filterString,
      nonce:  cafLastFilterNonce
    });
  }
});

	
//-------------------------------------------------------------------------
// C) Multi-select toggle UI

  function updateMultiSelectToggleUI(){
    var t = $('#toggle-multi-select');
    if (multiSelectMode) {
      // MULTI-SELECT mode
      t.removeClass('active-toggle');
      t.find('.oew-switch-wrap').removeClass('oew-switch-on');
      t.find('.oew-switch-primary-wrap').addClass('show').removeClass('hide');
      t.find('.oew-switch-secondary-wrap').addClass('hide').removeClass('show');
      t.find('input[type="checkbox"]').prop('checked', false);
    } else {
      // SINGLE-SELECT mode
      t.addClass('active-toggle');
      t.find('.oew-switch-wrap').addClass('oew-switch-on');
      t.find('.oew-switch-primary-wrap').addClass('hide').removeClass('show');
      t.find('.oew-switch-secondary-wrap').addClass('show').removeClass('hide');
      t.find('input[type="checkbox"]').prop('checked', true);
    }
  }
  updateMultiSelectToggleUI();

  $(document).on('click','#toggle-multi-select',function(e){
    e.preventDefault();
    multiSelectMode = !multiSelectMode;
    updateMultiSelectToggleUI();
    // Persist preference
    $.post(ajaxurl,{
      action: 'caf_update_multi_select_mode',
      mode: multiSelectMode ? 1 : 0
    });
  });

//───────────────────────PHASES NUMBERS─────────────────────────────────────
// D) Core filter logic (Phase 2), with multi-select awareness

  // 1) Initialize (or re-hydrate) our shared selected[] globally
var defaultTerm = $('.caf-post-layout-container').attr('data-default-term')
                || $('.caf-post-layout-container').attr('data-terms')
                || '';
window.selected = window.selected && window.selected.length
               // if we already have a global from another snippet, keep it
               ? window.selected.slice()
               // otherwise fall back to lastFilter or defaultTerm
               : ( lastFilter && lastFilter.length
                   ? lastFilter.slice()
                   : ( defaultTerm
                       ? defaultTerm.split(',')
                       : []
                     )
                 );

	
//-------------------------------------------------------------------------
// 2) Paint buttons (always using the global selection)
function renderButtons(){
  $('.caf-custom-filter-btn').each(function(){
    var df = this.getAttribute('data-filter');
    // read from the shared global
    var isActive = Array.isArray(window.selected)
                   && window.selected.indexOf(df) > -1;
    $(this).toggleClass('active-button', isActive);
  });
}

// export it globally
window.renderButtons = renderButtons;

	
//-------------------------------------------------------------------------
  // 3) Build CAF AJAX params, choosing layout based on both MCF & MTF selections
function buildParams(page, div){
  var sel = '.' + div;

  // Count how many are checked in each filter
  var mcfCount = $('#caf-multiple-check-filter input.check_box:checked').length;
  var mtfCount = $('#caf-multiple-taxonomy-filter input.check_box:checked').length
               + $('ul.caf-multi-drop-sub li.active').length;

  // Decide which CAF layout to request
  var layout;
  if (mtfCount > 0) {
    layout = (mtfCount === 1)
      ? 'multiple-taxonomy-filter'
      : 'multiple-taxonomy-filter2';
  } else if (mcfCount > 0) {
    layout = (mcfCount === 1)
      ? 'multiple-checkbox'
      : 'multiple-checkbox2';
  } else {
    // fallback to whatever the container initially declared
    layout = $(sel).attr('data-filter-layout') || 'multiple-checkbox';
  }

  var p = {
    page: page,
    tax:             $(sel).attr('data-tax'),
    'post-type':     $(sel).attr('data-post-type'),
    term:            selected.join(','),
    'per-page':      $(sel).attr('data-per-page'),
    'filter-id':     $(sel).attr('data-filter-id'),
    'caf-post-layout':  $(sel).attr('data-post-layout'),
    'data-target-div':  sel,
    'data-filter-layout': layout,
    'data-relation':     $(sel).attr('data-relation'),
    'data-default-term': $(sel).attr('data-default-term'),
    'current-post-id':   $(sel).attr('current-post-id'),
    'data-order-by':     $(sel).attr('data-order-by'),
    'data-order-type':   $(sel).attr('data-order-type')
  };

  var s = $('#caf-search-input').val();
  if (s) p.search_string = s;

  return p;
}

//-------------------------------------------------------------------------
// 4) Fire filter + save last
function applyCustomFilters(){

  // Always target the actual CAF grid container
  var $container = $('.caf-post-layout-container'),
      div        = $container.attr('data-target-div');

  // Build the AJAX params off that container’s divKey
  var params = buildParams(1, div);


  $.ajax({
    url: tc_caf_ajax.ajax_url,
    type: 'POST',
    data: {
      action: 'get_filter_posts',
      nonce:  tc_caf_ajax.nonce,
      params: params
    },
    dataType: 'json',
    success: function(res){
      if (res.status === 200 && res.content) {
        $('#manage-ajax-response').html(res.content);
      }
      // after AJAX refresh, re-render your custom buttons
      renderButtons();
    }
  });

  // Save last filter if enabled
  if (saveLastFilterPref) {
    $.post(ajaxurl, {
      action: 'caf_update_last_filter',
      filter: selected.join(','),
      nonce:  cafLastFilterNonce
    });
  }
}

	

//-------------------------------------------------------------------------

// 5) Sync when CAF checkboxes change (always multi-select across both filters)
$(document).on(
  'change click',
  '#caf-multiple-check-filter input.check_box, ' +
  '#caf-multiple-taxonomy-filter input.check_box, ' +
  'ul.caf-multi-drop-sub li',
  function(){

    // 1.1) Gather all checked IDs from both checkbox filters
    var vals = $(
      '#caf-multiple-check-filter input.check_box:checked,' +
      '#caf-multiple-taxonomy-filter input.check_box:checked'
    ).map(function(){
      return this.getAttribute('data-id');
    }).get();

    // 1.2) Also gather all active IDs from the modern dropdown (MTF)
    var dropdownVals = $('ul.caf-multi-drop-sub li.active').map(function(){
      return this.getAttribute('data-value');
    }).get();

    // 2) Merge and de-duplicate
    vals = Array.from(new Set(vals.concat(dropdownVals)));

    // 3) Update our selected[] array
    selected = vals;
	  window.selected = selected;


    // 4) Update your custom filter buttons
    renderButtons();

    // 5) Sync the CAF Active-Filters bar
    var div = $('#caf-multiple-check-filter input.check_box').first().data('target-div');
    set_active_filters( $('.caf-post-layout-container.' + div) );
    dedupeActiveFilters(); // ← remove any duplicate pills

    // 6) Finally, re-fire the AJAX to refresh the grid
    applyCustomFilters();

    // 7) Save the new filter if the user has “save last” enabled
    if ( saveLastFilterPref ) {
      var newFilter = selected.join(',');
      $.post(ajaxurl, {
        action: 'caf_update_last_filter',
        filter: newFilter,
        nonce: cafLastFilterNonce
      });
    }
  }
);

	
	
	
	

//-------------------------------------------------------------------------
// on DOM ready, flag non-CAF pages
$(function(){
  if ( ! $('.caf-post-layout-container').length ) {
    $('body').addClass('header-no-caf');
  }
});

// 6) Custom-button clicks (globally)
$(document).on('click', '.caf-custom-filter-btn', function(e){
  var $btn = $(this);

  // if there is no CAF grid on this page, bail out → let the link navigate normally
  if ( ! $('.caf-post-layout-container').length ) {
    return;
  }

  // otherwise intercept and do our filtering magic
  e.preventDefault();

  // ─── pull filter & context ───────────────────────────────────────────────
  // 1) Try the combined data-filter first
  var df = $btn.attr('data-filter');

  // 2) Fallback to data-taxonomy + data-term-id
  var taxonomy = $btn.data('taxonomy'),
      termId   = $btn.data('termId'),
      slug      = $btn.data('slug');

  if ( ! df && taxonomy && termId ) {
    df = taxonomy + '___' + termId;
  }
  // 3) Fallback to data-taxonomy + data-slug (requires a termMap in JS)
  else if ( ! df && taxonomy && slug && window.termMap 
            && termMap[taxonomy] && termMap[taxonomy][slug] ) {
    df = taxonomy + '___' + termMap[taxonomy][slug];
  }

  var idx        = selected.indexOf(df),
      // Always target the actual CAF grid container
      $container = $('.caf-post-layout-container'),
      div        = $container.attr('data-target-div'),
      mode       = $btn.data('mode');   // ← per-button override

  // ─────────────────────────────────────────────────────────────────────────
 
  if ( mode === 'single' ) {
  
    // 1) Clear everything, then select just this one
    //selected = ( idx === -1 ? [ df ] : [] );
	//window.selected = selected;
	
// Replace any “selected = …” or push/filter logic **at the very top** of the block
// with this single two‐line toggle:

var idx = window.selected.indexOf(df);
if (idx === -1) {
  window.selected.push(df);
} else {
  window.selected.splice(idx, 1);
}
// Now sync the local `selected` alias if you need it:
selected = window.selected.slice();

	  
    // 1a) Uncheck all CAF boxes (no change event)
    $(
      '#caf-multiple-check-filter input.check_box,' +
      '#caf-multiple-taxonomy-filter input.check_box'
    ).prop('checked', false);

    // 1b) Remove “active” from all dropdown items
    $('ul.caf-multi-drop-sub li.active').removeClass('active');
	
    // 1c) Check only our single box
    $(
      '#caf-multiple-check-filter input.check_box,' +
      '#caf-multiple-taxonomy-filter input.check_box'
    )
      .filter('[data-id="'+ df +'"]')
      .prop('checked', true);

    // 1d) Activate the corresponding dropdown <li> (if present)
    $('ul.caf-multi-drop-sub li[data-value="'+ df +'"]').addClass('active');
	
    // **NEW**: update the grid’s “data-terms” to match selected[]
    $('.caf-post-layout-container.' + div)
      .attr('data-terms', selected.join(','));

    // 1e) Update the container’s data-terms so other scripts see only this term
    $('.caf-post-layout-container.' + div)
      .attr('data-terms', selected.join(','));

    // 3) Clear pills and rebuild
    $('.caf-active-filters ul').empty();
    set_active_filters( $('.caf-post-layout-container.' + div) );
    dedupeActiveFilters();

    // 5) Repaint & refresh
    renderButtons();
    applyCustomFilters();

    // 6) Overwrite save-last if needed
    if ( saveLastFilterPref ) {
      var filterString = window.selected ? window.selected.join(',') : selected.join(',');

      $.post(ajaxurl, {
        action: 'caf_update_last_filter',
        filter: filterString,
        nonce: cafLastFilterNonce
      });
    }

    // 7) Reset the client-side lastFilter array so old values are gone
    lastFilter = selected.slice();

    return;
  }

  // ─────────────────────────────────────────────────────────────────────────

  // otherwise fall back to your existing multi/single-toggle logic
  if ( multiSelectMode ) {
    // ── Toggle in our array ────────────────────────
   // if ( idx === -1 ) {
    //  selected.push(df);
    //} else {
      // remove all instances
    //  selected = selected.filter(id => id !== df);
	//	window.selected = selected;
   // }
	// Replace any “selected = …” or push/filter logic **at the very top** of the block
// with this single two‐line toggle:

var idx = window.selected.indexOf(df);
if (idx === -1) {
  window.selected.push(df);
} else {
  window.selected.splice(idx, 1);
}
// Now sync the local `selected` alias if you need it:
selected = window.selected.slice();

	  
    // ── Sync BOTH CAF checkbox UIs (MCF + MTF) ─────
    $(
      '#caf-multiple-check-filter input.check_box,' +
      '#caf-multiple-taxonomy-filter input.check_box'
    ).each(function(){
      var id = this.getAttribute('data-id');
      this.checked = ( selected.indexOf(id) > -1 );
    });

    // ── Sync MTF dropdown items ────────────────────
$('ul.caf-multi-drop-sub li').each(function(){
  var val = $(this).attr('data-value');
  $(this).toggleClass('active', selected.indexOf(val) > -1);
});

// ── Rebuild each dropdown’s default button label & data-value ────────
$('ul.caf_select_multi').each(function(){
  var $wrap      = $(this),
      $def       = $wrap.find('li.caf_select_multi_default'),
      defaultTxt = $def.data('default-text') || $def.find('span').text(),
      $activeLis = $wrap.find('ul.caf-multi-drop-sub li.active'),
      names      = $activeLis.map((i, el) => $(el).attr('data-name')).get(),
      values     = $activeLis.map((i, el) => $(el).attr('data-value')).get();

  // update the button text
  $def.find('span')
      .text(names.length ? names.join(', ') : defaultTxt);

  // update the data-value attribute
  $def.attr('data-value', values.length ? values.join(',') : '0');
});

    // **NEW**: also update the grid’s “data-terms” for AJAX
    $('.caf-post-layout-container.' + div)
      .attr('data-terms', selected.join(','));

    // ── Update the Active-Filters bar ───────────────
    set_active_filters( $('.caf-post-layout-container.' + div) );
    dedupeActiveFilters();
  } 
  else {
    // ── Single‐select (global toggle): replace with this one ────────
    selected = ( idx === -1 ? [ df ] : [] );
	window.selected = selected;

	  
    // 1) Uncheck all CAF checkboxes
    $(
      '#caf-multiple-check-filter input.check_box,' +
      '#caf-multiple-taxonomy-filter input.check_box'
    )
      .prop('checked', false)
      .filter('[data-id="'+ df +'"]')
      .prop('checked', true)
      .trigger('change');

    // 2) Clear any “active” state in the MTF dropdown
    $('ul.caf-multi-drop-sub li.active').removeClass('active');

    // 3) Mark the matching dropdown item as active
    var $li = $('ul.caf-multi-drop-sub li[data-value="'+ df +'"]');
    $li.addClass('active');

    // 4) Update the dropdown’s default label & data-value
    var $def = $li.closest('ul.caf_select_multi')
                 .find('li.caf_select_multi_default');
    $def.attr('data-value', df)
        .find('span').text($li.attr('data-name'));

    // **NEW**: update the grid’s “data-terms” to match this single selection
    $('.caf-post-layout-container.' + div)
      .attr('data-terms', selected.join(','));
  }
// ── Finally repaint buttons & fire AJAX ─────────
renderButtons();


applyCustomFilters();

});






//-------------------------------------------------------------------------
// 7) Re-render after CAF AJAX events (pagination, initial load, etc.)
$(document).ajaxComplete(function(evt, xhr, settings){
  if (typeof settings.data === 'string'
      && settings.data.indexOf('action=get_filter_posts') > -1) {

    // Always re-render your buttons
    renderButtons();

    // Decode and detect CAF’s initial “first” request
    var decoded = decodeURIComponent(settings.data);
    var isFirst = decoded.indexOf('params[first]=first') > -1;

    // Check URL param
    var urlParams = new URLSearchParams(window.location.search);

    // Only restore if all true AND no filter param
    if (
      isFirst &&
      saveLastFilterPref &&
      lastFilter.length &&
      !urlParams.has('filter')
    ) {
      setTimeout(applyCustomFilters, 100);
    } else {
    }

  }
});



//-------------------------------------------------------------------------
// 9) Handle clicks on the “X” or the tag text in the Active-Filters bar
$(document).on('mousedown', '.caf-active-filters .caf-active-filter-close, .caf-active-filters .caf-active-filter-tag', function(e){
  e.preventDefault();

  var $li   = $(this).closest('li.filter-item'),
      term  = $li.attr('data-id'),
      // first try to find a matching CAF checkbox
      $chk  = $('input.check_box[data-id="'+term+'"]');

  if (!term) return;

  if ($chk.length) {
    // 1) Classic checkbox layouts: uncheck & trigger change
    $chk.prop('checked', false).trigger('change');
  } else {
    // 2) Modern Taxonomy Filter (MTF): trigger its click handler
    var $opt = $('ul.caf-multi-drop-sub li[data-value="'+ term +'"]');
    if ($opt.length) {
      $opt.trigger('click.customMTF');
    }
  }

  // 3) Repaint custom filter buttons to reflect the updated selection
  renderButtons();
});


	
//-------------------------------------------------------------------------
// 9b) Handle clicks on the “Clear All” button
$(document).on('mousedown', '.caf-clear-all .clear-all-btn', function(e){
  e.preventDefault();
	
  // Uncheck every CAF checkbox (MCF + MTF) and trigger the change
  $('input.check_box:checked')
    .prop('checked', false)
    .trigger('change');
});
//-------------------------------------------------------------------------
	
	// 9c) Handle clicks on the “Clear All” button
$(document).on('click', '.caf-clear-all .clear-all-btn', function(e){
  e.preventDefault();

  // 1) Uncheck all CAF checkboxes (MCF + old taxonomy‐checkbox)
  $(
    '#caf-multiple-check-filter input.check_box,' +
    '#caf-multiple-taxonomy-filter input.check_box'
  ).prop('checked', false);

  // 1a) Clear all “active” states in the MTF dropdown
  $('ul.caf-multi-drop-sub li.active').removeClass('active');

  // 1b) Reset each dropdown’s default label & data-value
  $('ul.caf_select_multi').each(function(){
    var $def       = $(this).find('li.caf_select_multi_default'),
        defaultTxt = $def.data('default-text');
    $def.find('span').text(defaultTxt);
    $def.attr('data-value', '0');
  });

  // 2) Reset our selected[] array to empty
  selected = [];
	window.selected = selected;

	
  // 3) Update custom filter buttons
  renderButtons();

  // 4) Rebuild the CAF Active-Filters bar
  var div = $(
    '#caf-multiple-check-filter input.check_box,' +
    '#caf-multiple-taxonomy-filter input.check_box,' +
    'ul.caf-multi-drop-sub li.active'
  ).first().data('target-div');
  set_active_filters($('.caf-post-layout-container.' + div));

  // ── now remove any duplicate pills ────────────────────
  $('.caf-active-filters ul li.filter-item').each(function(){
    var id    = $(this).attr('data-id'),
        group = $('.caf-active-filters ul li.filter-item[data-id="'+id+'"]');
    if ( group.length > 1 ) {
      group.not(':first').remove();
    }
  });

  // 5) Re-fire the grid AJAX
  applyCustomFilters();
});
	
//-------------------------------------------------------------------------
	
//-------------------------------------------------------------------------
	
// 8a) AFTER CAF’s own preload & after ajaxComplete, apply default-term only
//      if we're NOT restoring a saved filter
$('.caf-post-layout-container').each(function(){
  var $grid = $(this),
      def   = $grid.attr('data-default-term') || '',
      terms = $grid.attr('data-terms')        || '';

  // only proceed if there's a default-term AND
  // (saveLastFilterPref is OFF, OR there's no lastFilter to restore)
  if (
    def &&
    (!terms || terms === def) &&
    (!saveLastFilterPref || (saveLastFilterPref && lastFilter.length === 0))
  ) {
    // write it back so later code sees it
    $grid.attr('data-terms', def);

    // ── CHECK ONLY THE MCF BOXES and trigger change to drive your central handler
    def.split(',').forEach(id => {
      $('#caf-multiple-check-filter input.check_box[data-id="'+id+'"]')
        .prop('checked', true)
        .trigger('change');
    });
  }
});




	// 8) Initial paint & preload (only if user opted in)
renderButtons();
if (saveLastFilterPref && lastFilter.length) {

	console.log('🔥 Hydration running:', lastFilter);

  // ✅ Sync MCTF checkboxes
  $('#caf-multiple-check-filter input.check_box, #caf-multiple-taxonomy-filter input.check_box').each(function() {
    var id = this.getAttribute('data-id');
    this.checked = (lastFilter.indexOf(id) > -1);
  });

  // ✅ Sync MTFM dropdown items
  $('ul.caf-multi-drop-sub li').each(function(){
    var val = $(this).attr('data-value');
    if (lastFilter.indexOf(val) > -1) {
      $(this).addClass('active');
    }
  });

  // ✅ Update MTFM dropdown button labels + values
  $('ul.caf_select_multi').each(function(){
    var $def = $(this).find('li.caf_select_multi_default');
    var defaultText = $def.data('default-text') || $def.find('span').text();
    var activeItems = $(this).find('ul.caf-multi-drop-sub li.active');
    var names = activeItems.map((i, el) => $(el).attr('data-name')).get();
    var values = activeItems.map((i, el) => $(el).attr('data-value')).get();
    $def.find('span').text(names.length ? names.join(', ') : defaultText);
    $def.attr('data-value', values.length ? values.join(',') : '0');
  });

  // ✅ Update selected array
  window.selected = lastFilter.slice();
  selected = window.selected;

  // ✅ Sync UI
  var div = $('#caf-post-layout-container').attr('data-target-div');
  set_active_filters($('.caf-post-layout-container.' + div));
  dedupeActiveFilters();
$(document).trigger('filtersReady');

  // ✅ Apply filters
  applyCustomFilters();
}


	
	
	
	
   

//────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// CUSTOM FILTER PAGES - SINGLE BUTTONS

// 1) Parse out “filter” from the query string
var params = new URLSearchParams(window.location.search);
if (!params.has('filter')) {
  return;  // nothing to do
}

var filterValue = params.get('filter');

// 0) Short‐circuit CAF’s own handlers & state
$('.caf-multiple-check-filter, .caf-multiple-taxonomy-filter')
  .off('change');  // unbind default change listeners

$('.caf-post-layout-container')
  .removeAttr('data-terms data-default-term');  // clear any stored terms

// 0A) Disable the other snippet’s handler too
$('.caf-post-layout-container').off(
  'change',
  '#caf-multiple-check-filter li .check_box, #caf-multiple-taxonomy-filter li .check_box'
);

// 0B) Clear any existing MTF dropdown active state and reset defaults
$('ul.caf-multi-drop-sub li.active').removeClass('active');
$('ul.caf_select_multi').each(function(){
  var $def       = $(this).find('li.caf_select_multi_default'),
      defaultTxt = $def.data('default-text');
  $def.find('span').text(defaultTxt);
  $def.attr('data-value', '0');
});

// 2) Populate your selected[] array
var incoming = filterValue.split(',');
selected = incoming.slice();
window.selected = selected;

	
// ── Disable any “save last filter” logic for the initial landing ──
saveLastFilterPref = false;
lastFilter = [];

// 3) Sync the CAF checkboxes
incoming.forEach(function(df){
  var $chk = $('input.check_box[data-id="' + df + '"]');
  if ($chk.length) {
    $chk.prop('checked', true);
  }
});

// 3B) Sync MTF dropdown items
incoming.forEach(function(df){
  var $li = $('ul.caf-multi-drop-sub li[data-value="' + df + '"]');
  if ($li.length) {
    $li.addClass('active');
    // Update that dropdown's default label and value
    var $wrap        = $li.closest('ul.caf_select_multi'),
        $def         = $wrap.find('li.caf_select_multi_default'),
        names        = $wrap.find('li.active').map((i,el)=>$(el).attr('data-name')).get(),
        values       = $wrap.find('li.active').map((i,el)=>$(el).attr('data-value')).get();
    $def.find('span').text(names.join(', '));
    $def.attr('data-value', values.join(','));
  }
});

// 4) Update the CAF “active-filters” bar
set_active_filters( $('.caf-post-layout-container') );
dedupeActiveFilters();

// 5) Listen for the next CAF AJAX, then apply your UI and unbind
$(document).one('ajaxComplete.urlParam', function(evt, xhr, settings){
  if (settings.data && settings.data.indexOf('action=get_filter_posts') > -1) {
    // Re-render custom filter buttons
    renderButtons();
    // Fire your custom filters
    applyCustomFilters();

    // 5a) Restore save-last preferences
    saveLastFilterPref = initialUserSaveLastFilter;
    cafLastFilterNonce = initialCafLastFilterNonce;

    // Unbind this one-time listener
    $(document).off('ajaxComplete.urlParam');
  }
});









  // (Optional) remove the ?filter=… from the URL so it’s cleaner
  // history.replaceState(null, '', window.location.pathname);
		
	

});
