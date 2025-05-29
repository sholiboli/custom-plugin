console.log('MTF Modern Multiselect - ver7');

jQuery(function($){
	
	// Work on the shared array by aliasing it locally…
var selected = window.selected || [];

	// bring in the “save last filter” preference so our blocks can refer to it
// bring in the global “save last filter” flag
var saveLastFilterPref = (typeof window.saveLastFilterPref !== 'undefined')
                         ? window.saveLastFilterPref
                         : (typeof userSaveLastFilter !== 'undefined'
                            ? Boolean(parseInt(userSaveLastFilter, 10))
                            : false);


	
  // 1) Cache each filter’s default-text
  $('ul.caf_select_multi').each(function(){
    var $d = $(this).find('.caf_select_multi_default');
    $d.data('default-text', $d.find('span').text());
  });

  // 2) Remove CAF’s original handlers
  $(document).off('click.customMTF', 'ul.caf-multi-drop-sub li');
  $('ul.caf-multi-drop-sub li').off('click');

  
	// 3) Bind our multi-select + immediate-AJAX handler
$(document).on('click.customMTF', 'ul.caf-multi-drop-sub li', function(e){
  var $li = $(this);

  // If this is the built-in “All …” entry, skip CAF’s original code but
  // don’t leave this handler—you need block 10 to run.
  if ( $li.hasClass('caf_select_multi_default_label_2') ) {
    // just return out of CAF’s default, not the custom logic
    return false;
  }

  // — your existing logic —
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  var $dropdown = $li.closest('ul.caf-multi-drop-sub'),
      $wrap     = $dropdown.closest('ul.caf_select_multi'),
      $def      = $wrap.find('.caf_select_multi_default'),
      defaultTxt= $def.data('default-text');

  // a) Toggle active
  $li.toggleClass('active');

  // b) Rebuild label & its data-value
  var names = $dropdown.find('li.active').map((i,el)=>$(el).attr('data-name')).get(),
      vals  = $dropdown.find('li.active').map((i,el)=>$(el).attr('data-value')).get();
  $def.find('span').text(names.length ? names.join(', ') : defaultTxt);
  $def.attr('data-value', vals.length ? vals.join(',') : '0');

  // c) Identify the full data-target-div class
  var divClass = $li.closest('.caf-multiple-taxonomy-filter-modern')
                   .attr('class')
                   .split(/\s+/)
                   .find(c=>c.indexOf('data-target-div')===0);

  // d) Flatten all defaults’ values into CSV
  var flat = [];
  $('li.caf_select_multi_default').each(function(){
    var str = $(this).attr('data-value');
    if (str && str!=='0') str.split(',').forEach(v=>flat.push(v));
  });
  var termsCSV = flat.join(',');

  // —— NEW —— sync your shared array
  selected = flat.slice();
  window.selected = selected;

  // ✅ Moved here: persist if user wants “save last filter”
  if ( window.saveLastFilterPref ) {

    $.post( ajaxurl, {
      action: 'caf_update_last_filter',
      filter: window.selected.join(','),
      nonce:  cafLastFilterNonce
    });
  }

  // e) Decide layout
  var layout = flat.length > 1
               ? 'multiple-taxonomy-filter2'
               : 'multiple-taxonomy-filter';

  // f) Update the container’s attributes
  var $container = $('#caf-post-layout-container.' + divClass);
  $container
    .attr('data-terms', termsCSV)
    .attr('data-filter-layout', layout);

  // g) Build params via get_params()
  var params = get_params('1', divClass);
  params['caf-perform'] = 'filter';
  params['term']        = termsCSV;
  params['caf-perform-term'] = $li.attr('data-value');

  // j) Fire CAF’s AJAX refresh
  cafScrollToDiv(divClass.replace('data-target-div',''));
  get_posts(params);

  // k) Rebuild the “active filters” list & custom buttons
  renderButtons();
  set_active_filters('#caf-post-layout-container.' + divClass);
});



	
	
	// 4) Clear All handler for MTF
$(document).on('click', '.clear-all-btn', function(e){
  e.preventDefault();
  e.stopPropagation();

  // a) Identify the container
  var $plc   = $(this).closest('.caf-post-layout-container'),
      divKey = $plc.attr('data-target-div');

  // b) Clear all active classes in dropdowns
  $plc.find('ul.caf-multi-drop-sub li.active').removeClass('active');

  // c) Reset each default button to its original text & value
  $plc.find('ul.caf_select_multi').each(function(){
    var $def       = $(this).find('li.caf_select_multi_default'),
        defaultTxt = $def.data('default-text');
    $def.find('span').text(defaultTxt);
    $def.attr('data-value', '0');
  });

  // d) Restore the container’s data-terms & layout
  $plc
    .attr('data-terms', $plc.data('selected-terms'))
    .attr('data-filter-layout', 'multiple-taxonomy-filter');

  // → reset the saved‐filter array so it’s truly cleared
  window.selected = [];

  // —————————SAVE LAST FILTER————————
  if ( window.saveLastFilterPref ) {

    $.post( ajaxurl, {
      action: 'caf_update_last_filter',
      filter: window.selected.join(','),
      nonce:  cafLastFilterNonce
    } );
  }
  // —————————SAVE LAST FILTER————————

  // e) Trigger AJAX reload
  var params = get_params('1', divKey);
  params['caf-perform'] = 'filter';
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
  if ( window.saveLastFilterPref ) {

    $.post(ajaxurl, {
      action: 'caf_update_last_filter',
      filter: window.selected.join(','),
      nonce: cafLastFilterNonce
    });
  }
  // —————————SAVE LAST FILTER————————

  // Now rebuild the dropdown UI
  $wrap.find('ul.caf-multi-drop-sub li.caf_select_multi_dp_value').each(function(){
    var val = $(this).attr('data-value'),
        isActive = selected.indexOf(val) > -1;
    $(this).toggleClass('active', isActive);
    console.log("  🔧 option", val, "active?", isActive);
  });

  // Update the default button text & value
  var defaultTxt = $wrap.find('li.caf_select_multi_default').data('default-text'),
      names      = $wrap.find('ul.caf-multi-drop-sub li.active').map((i, el) => $(el).attr('data-name')).get(),
      values     = $wrap.find('ul.caf-multi-drop-sub li.active').map((i, el) => $(el).attr('data-value')).get();

  console.log("🔧 [AllHandler] new default names:", names, "values:", values);

  $wrap.find('li.caf_select_multi_default')
       .attr('data-value', values.length ? values.join(',') : '0')
       .find('span')
       .text(names.length ? names.join(', ') : defaultTxt);

  // repaint buttons
  renderButtons();

  // rebuild the CAF Active-Filters bar
  var divKey     = $wrap.closest('.caf-post-layout-container').attr('data-target-div'),
      $container = $('#caf-post-layout-container.' + divKey);

  set_active_filters($container);
  $('.caf-active-filters ul li.filter-item').each(function(){
    var id    = $(this).attr('data-id'),
        group = $('.caf-active-filters ul li.filter-item[data-id="'+id+'"]');
    if (group.length > 1) group.not(':first').remove();
  });

  // then fire CAF’s AJAX filter
  var params = get_params('1', divKey);
  params['caf-perform'] = 'filter';
  cafScrollToDiv(divKey);
  get_posts(params);
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
