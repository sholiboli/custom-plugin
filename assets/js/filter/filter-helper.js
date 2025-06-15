console.log('filter-helper - v111');

//————————————————— FILTER-BUTTON2.JS FUNCTIONS———————————————

if (typeof window.FilterHelper === 'undefined') {
  window.FilterHelper = {

	// Helper: Default text and value updater
    updateDropdownLabel: function($wrap, defaultTxt) {
  const names = jQuery($wrap).find('ul.caf-multi-drop-sub li.active')
                             .map((i, el) => jQuery(el).attr('data-name'))
                             .get();
  const values = jQuery($wrap).find('ul.caf-multi-drop-sub li.active')
                              .map((i, el) => jQuery(el).attr('data-value'))
                              .get();

  jQuery($wrap).find('li.caf_select_multi_default')
               .attr('data-value', values.length ? values.join(',') : '0')
               .find('span')
               .text(names.length ? names.join(', ') : defaultTxt);
},

	// Saving the last filter preference -> filter-button2
saveLastFilterPref: function(selected) {
  if (!window.saveLastFilterPref) return;

  jQuery.post(ajaxurl, {
    action: 'caf_update_last_filter',
    filter: selected.join(','),
    nonce: cafLastFilterNonce
  });
},

	// Repainting dropdown items as active -> filter-button2
repaintDropdown: function($wrap, selected) {
  jQuery($wrap).find('ul.caf-multi-drop-sub li.caf_select_multi_dp_value').each(function() {
    const val = jQuery(this).attr('data-value');
    const isActive = selected.indexOf(val) > -1;
    jQuery(this).toggleClass('active', isActive);
  });
},

	  // Helper: remove duplicate pills from the Active-Filters bar -> filter-button2
  dedupeActiveFilters: function($scope = jQuery(document)) {
  const seen = {};
  jQuery($scope).find('.caf-active-filters ul li.filter-item').each(function () {
    const id = jQuery(this).attr('data-id');
    if (seen[id]) {
      jQuery(this).remove();
    } else {
      seen[id] = true;
    }
  });
},

	  // Helper: refresh the entire UI with dedupeactivefilters
	  // FL-1, FL-2
	  rebuildActiveFilterUI: function($container){
  if (typeof set_active_filters === 'function') {
    set_active_filters($container);
  }
  this.dedupeActiveFilters($container);
},
  
	  
	  
	  
	  
	  
	  
	
	// Helper function: Get active names and values from a dropdown, update the default button text & value
	getActiveNamesAndValues: function($wrap) {
  const names = $wrap.find('ul.caf-multi-drop-sub li.active')
                     .map((i, el) => jQuery(el).attr('data-name'))
                     .get();
  const values = $wrap.find('ul.caf-multi-drop-sub li.active')
                      .map((i, el) => jQuery(el).attr('data-value'))
                      .get();
  return { names, values };
},
	  	  
  // Helper function: Get divKey from .caf-post-layout-container
  getDivKey: function($wrap) {
    return $wrap.closest('.caf-post-layout-container').attr('data-target-div') || '';
  },
	  
// Helper function: Decide layout string for given container
// FL-1
getFilterLayoutFromContainer: function($container, mtfTerms = [], mcfTerms = []) {
  // 1. Taxonomy filters selected
  if (mtfTerms.length > 0) {
    let layout = (mtfTerms.length > 1)
      ? 'multiple-taxonomy-filter2'
      : 'multiple-taxonomy-filter';
    // Optional override: horizontal-modern layout
    if (
      layout === 'multiple-taxonomy-filter' &&
      $container.data('filter-layout') === 'multiple-taxonomy-filter-hor-modern'
    ) {
      layout = 'multiple-taxonomy-filter-hor-modern';
    }
    return layout;
  }
  // 2. Checkbox filters selected (but no MTF)
  if (mcfTerms.length > 0) {
    return 'multiple-checkbox2';
  }
  // 3. Nothing selected: fall back to saved layout or default
  return $container.attr('data-filter-layout') || 'multiple-checkbox';
},
  
	// Helper function - Reset all dropdowns to default state (used in “Clear All” logic)
	  resetDropdownsDefault: function($scope) {
  const $container = jQuery($scope);
  
  // 1. Clear all active classes in dropdowns
  $container.find('ul.caf-multi-drop-sub li.active').removeClass('active');
  // 2. Reset each default button's label and data-value
  $container.find('ul.caf_select_multi').each(function() {
    const $def = jQuery(this).find('li.caf_select_multi_default');
    const defaultTxt = $def.data('default-text');
    $def.find('span').text(defaultTxt);
    $def.attr('data-value', '0');
  });
},
	  
	// Helper function: Build params for AJAX post
	// FL-1
	/* ===================================================================
 *  UNIFIED PARAM-BUILDER  –  replaces the old buildAjaxParams
 * =================================================================*/
buildAjaxParams: function (divKey, termsCSV, triggeredTerm, page = 1) {

  var sel = '.' + divKey;

  /* Count checked terms */
  var mcfCount = jQuery('#caf-multiple-check-filter input.check_box:checked').length;
  var mtfCount = jQuery('#caf-multiple-taxonomy-filter input.check_box:checked').length +
                 jQuery('ul.caf-multi-drop-sub li.active').length;

  /* Decide which CAF layout to request */
  var layout;
  if (mtfCount > 0) {
    layout = (mtfCount === 1) ? 'multiple-taxonomy-filter' : 'multiple-taxonomy-filter2';
  } else if (mcfCount > 0) {
    layout = (mcfCount === 1) ? 'multiple-checkbox' : 'multiple-checkbox2';
  } else {
    layout = jQuery(sel).attr('data-filter-layout') || 'multiple-checkbox';
  }

  /* Build the full params object */
  var params = {
    page: page,
    tax:               jQuery(sel).attr('data-tax'),
    'post-type':       jQuery(sel).attr('data-post-type'),
    term:              (termsCSV != null) ? termsCSV
                     : (window.selected ? window.selected.join(',') : ''),
    'per-page':        jQuery(sel).attr('data-per-page'),
    'filter-id':       jQuery(sel).attr('data-filter-id'),
    'caf-post-layout': jQuery(sel).attr('data-post-layout'),
    'data-target-div': sel,
    'data-filter-layout': layout,
    'data-relation':     jQuery(sel).attr('data-relation'),
    'data-default-term': jQuery(sel).attr('data-default-term'),
    'current-post-id':   jQuery(sel).attr('current-post-id'),
    'data-order-by':     jQuery(sel).attr('data-order-by'),
    'data-order-type':   jQuery(sel).attr('data-order-type'),
    'caf-perform':       'filter'
  };

  if (triggeredTerm != null) {
    params['caf-perform-term'] = triggeredTerm;
  }

  /* Search box */
  var s = jQuery('#caf-search-input').val();
  if (s) params.search_string = s;

  /* Toggles  –  read the live checkbox state, ignore globals */
params.hide_bookmarked_posts =
  jQuery('.toggle-show-read  input.custom-toggle-input').is(':checked') ? '1' : '0';

params.show_only_saved =
  jQuery('.toggle-show-saved input.custom-toggle-input').is(':checked') ? '1' : '0';


  return params;
},







	// Helper function: Update container metadata, restore the container’s data-terms & layout
	// FL-1
	  updateContainerMeta: function($container, termsCSV, layout) {
  if (!$container || !$container.length) return;
  $container.attr('data-terms', termsCSV);
  $container.attr('data-filter-layout', layout);
},

	// Helper function: update layout parameter based on how many boxes are checked, returns full objects instead of just data-id strings
	// FL-1, FL-2
collectCheckedTerms: function($container, selector) {
  return $container.find(selector).filter(':checked').map(function() {
    const $checkbox = jQuery(this);
    const $li = $checkbox.closest('li');
    const label = $li.find('label').text().trim();
    const dataName = $checkbox.closest('ul').find('h3').attr('data-name') || '';
    const dataId = $checkbox.attr('data-id');

    return {
      $checkbox: $checkbox,
      label: label,
      dataName: dataName,
      dataId: dataId
    };
  }).get();
},


	  // Helper: Combine selected values from both MCF and MTF filters.
	  // FL-1
getCombinedFilterTerms: function($container) {
  const mcfTerms = this.collectCheckedTerms($container, "#caf-multiple-check-filter li .check_box").map(x => x.dataId);
  const mtfTerms = this.collectCheckedTerms($container, "#caf-multiple-taxonomy-filter li .check_box").map(x => x.dataId);
  return mcfTerms.concat(mtfTerms).join(",");
},

 
	  
	  // Helper: Synchronize checkbox states between MCF and MTF.
	  // FL-1
// Helper: Synchronize checkbox states between MCF and MTF.  // FL-1
syncCheckboxStates: function($container, dataId, isChecked) {
  $container
    .find("#caf-multiple-check-filter li .check_box[data-id='" + dataId + "']")
    .prop("checked", isChecked);

  $container
    .find("#caf-multiple-taxonomy-filter li .check_box[data-id='" + dataId + "']")
    .prop("checked", isChecked);

  /* toggle active state on every custom-filter button */
  jQuery(".caf-custom-filter-btn[data-filter='" + dataId + "']")
    [isChecked ? "addClass" : "removeClass"]("active-button");

  /* --- keep window.selected up-to-date -------------------- */
  if (Array.isArray(window.selected)) {
    if (isChecked) {
      if (window.selected.indexOf(dataId) === -1) {
        window.selected.push(dataId);              // add if missing
      }
    } else {
      var idx = window.selected.indexOf(dataId);   // remove if present
      if (idx > -1) {
        window.selected.splice(idx, 1);
      }
    }
  }

  /* fire CAF refresh & clean up MTF list only when un-checking */
  if (isChecked === false) {
    $container
      .find("#caf-multiple-check-filter li .check_box[data-id='" + dataId + "']")
      .trigger("change");
    $container
      .find("#caf-multiple-taxonomy-filter li .check_box[data-id='" + dataId + "']")
      .trigger("change");

    $container
      .find("#caf-multiple-taxonomy-filter li.active .check_box[data-id='" + dataId + "']")
      .closest("li").removeClass("active");
  }

  /* refresh all custom buttons after window.selected changes */
  if (typeof FilterHelper.updateCustomButtonStates === 'function') {
    FilterHelper.updateCustomButtonStates();
  }
},






	  
	  // Helper: send AJAX request to update filtered posts, targets #manage-ajax-response and uses global nonce.
	  // FL-1
sendAjaxFilterRequest: function(params, onSuccess = null, onError = null) {
  jQuery.ajax({
    url: tc_caf_ajax.ajax_url,
    type: "POST",
    data: {
      action: "get_filter_posts",
      nonce: tc_caf_ajax.nonce,
      params: params
    },
    dataType: "json",
    beforeSend: function() {
      // Optional: add loading UI logic here if needed
    },
    success: function(response) {
      if (response.status === 200) {
        jQuery("#manage-ajax-response").html(response.content);
        if (typeof onSuccess === "function") onSuccess(response);
      } else {
        if (typeof onError === "function") onError(response);
      }
    },
    error: function(xhr, status, error) {
      if (typeof onError === "function") onError(error);
    }
  });
},

	  
	  // Helper: Render a single active filter pill into the target container
renderFilterPill: function({ id, label, name }, $targetList) {
  var htm = '<li class="filter-item" data-id="' + id + '" data-label="' 
    + label + '" data-name="' + name + '" style="display:none;">' 
    + '<span class="caf-active-filter-tag">' + label + '</span>' 
    + '<span class="caf-active-filter-close"> X</span></li>';
  $targetList.append(htm).find('li:last').fadeIn();
},

	  
	  // Helper: Add to active_filters if not already present
addToActiveFilters: function(label, dataName) {
  const exists = active_filters.some(item => item.label === label && item.dataName === dataName);
  if (!exists) {
    active_filters.push({ label: label, dataName: dataName });
    return true;
  }
  return false;
},

	  // Helper: Add or remove the “Clear All” button based on active filters
	  // FL-2
toggleClearAllButton: function($container) {
  const $list = $container.find(".caf-active-filters ul");
  if (active_filters.length > 0) {
    $list.find("li.caf-clear-all").remove();
    if ($list.find(".caf-clear-all").length === 0) {
      $list.append('<li class="caf-clear-all" style="display:none;"><button class="clear-all-btn">Clear All</button></li>')
           .find('li:last').fadeIn();
    }
  } else {
    $list.find(".caf-clear-all").fadeOut(function() {
      jQuery(this).remove();
    });
  }
},

	  // Helper: Loop over terms and render any not already in active_filters
	  // FL-2
renderPillsFromTerms: function(termsArray, $targetList) {
  termsArray.forEach(term => {
    if (this.addToActiveFilters(term.label, term.dataName)) {
      this.renderFilterPill(
        { id: term.dataId, label: term.label, name: term.dataName },
        $targetList
      );
    }
  });
},

	  // Helper: Collect active dropdown filter terms from MTF UI
	  // 2xFL-2
collectDropdownTerms: function($container) {
  const mtfTerms = [];

  $container.find("ul.caf-multi-drop-sub li.active").each(function () {
    const $li = jQuery(this);
    const $menu = $li.closest("ul.caf_select_multi");
    const active = FilterHelper.getActiveNamesAndValues($menu);
    const data_id = $li.attr("data-value");
    const filter_label = active.names[active.values.indexOf(data_id)];
    const data_name = $menu.find("li.caf_select_multi_default span").text();

    mtfTerms.push({ dataId: data_id, label: filter_label, dataName: data_name });
  });

  return mtfTerms;
},

	  
	  
	// ending bracket - window.FilterHelper 
  };
	

	// new get params function to add functionalities on top of the CAF default function
FilterHelper.addCustomParams = function (params, divKey) {
  var sel = '.' + divKey;
  var mcfCount = jQuery('#caf-multiple-check-filter input.check_box:checked').length;
  var mtfCount = jQuery('#caf-multiple-taxonomy-filter input.check_box:checked').length +
                 jQuery('ul.caf-multi-drop-sub li.active').length;

  var layout;
  if (mtfCount > 0) {
    layout = (mtfCount === 1) ? 'multiple-taxonomy-filter' : 'multiple-taxonomy-filter2';
  } else if (mcfCount > 0) {
    layout = (mcfCount === 1) ? 'multiple-checkbox' : 'multiple-checkbox2';
  } else {
    layout = jQuery(sel).attr('data-filter-layout') || 'multiple-checkbox';
  }

  params['data-filter-layout'] = layout;

  if (typeof window.hideBookmarkedPosts !== 'undefined') {
    params.hide_bookmarked_posts = window.hideBookmarkedPosts ? '1' : '0';
  }

  if (typeof window.showSavedPosts !== 'undefined') {
    params.show_only_saved = window.showSavedPosts ? '1' : '0';
  }
};

document.addEventListener('caf:beforeAjax', function (e) {
  var div   = e.detail.div;
  var params = e.detail.params;

  FilterHelper.addCustomParams(params, div);
});

	
	
	
	// ending bracket - if (typeof window.FilterHelper === 'undefined')
}
