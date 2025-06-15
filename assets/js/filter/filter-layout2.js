console.log('filter-layout2 - ');

jQuery(function($){

  window.set_active_filters = function(div) {

    // 0) Clear any previous filters in the UI and in memory
    active_filters = [];
    jQuery(div).find(".caf-active-filters ul").empty();

    // 1) Handle checkbox-based filters using enhanced helper  
    // Helper: Loop over terms and render any not already in active_filters
	var checkedTerms = FilterHelper.collectCheckedTerms($(div), "#caf-multiple-taxonomy-filter li .check_box, #caf-multiple-check-filter li .check_box");
	FilterHelper.renderPillsFromTerms(checkedTerms, jQuery(div).find(".caf-active-filters ul"));

    // 2) Handle your MTF dropdown active <li> items
    // Helper: Collect active dropdown filter terms from MTF UI
	var mtfTerms = FilterHelper.collectDropdownTerms(jQuery(div));

	// Helper: Loop over terms and render any not already in active_filters
	FilterHelper.renderPillsFromTerms(mtfTerms, jQuery(div).find(".caf-active-filters ul"));

    // Helper: Add or remove the “Clear All” button based on active filters
	FilterHelper.toggleClearAllButton(jQuery(div));

    // Helper: remove duplicate pills from the Active-Filters bar -> filter-button2
    FilterHelper.dedupeActiveFilters($(div));
	  	
	// end of set_active_filters
  };

  // Helper: refresh the entire UI with dedupeactivefilters
	$(document).on('filtersReady', function() {
	FilterHelper.rebuildActiveFilterUI($('.caf-post-layout-container'));
	});

// end of jQuery	
});