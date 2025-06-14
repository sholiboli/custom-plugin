console.log('filter-layout1 - 21');

jQuery(document).ready(function($) {
        
    // Unified event handler on change for checkboxes in both filter groups.
    $(".caf-post-layout-container").on("change", "#caf-multiple-check-filter li .check_box, #caf-multiple-taxonomy-filter li .check_box", function(e) {
        var dataId = $(this).attr("data-id");
        var isChecked = $(this).is(":checked");
        var container = $(this).closest(".caf-post-layout-container");
        var div = container.attr("data-target-div");
        
        // Helper: Synchronize checkbox states between MCF and MTF.
        FilterHelper.syncCheckboxStates(container, dataId, isChecked);
        
         // Helper: Combine selected values from both MCF and MTF filters.
        var combinedTerms = FilterHelper.getCombinedFilterTerms(container);
      
		// Helper: refresh the entire UI with dedupeactivefilters
        FilterHelper.rebuildActiveFilterUI(container);
        
        // Helper function: Build params for AJAX post
        var params = FilterHelper.buildAjaxParams(div, combinedTerms);
        
        // Helper function: update layout parameter based on how many boxes are checked.
        var mtfTerms = FilterHelper.collectCheckedTerms(container, "#caf-multiple-taxonomy-filter li .check_box");
		var mcfTerms = FilterHelper.collectCheckedTerms(container, "#caf-multiple-check-filter li .check_box");
	
		// Helper function: Decide layout string for given container
		params["data-filter-layout"] = FilterHelper.getFilterLayoutFromContainer(container, mtfTerms, mcfTerms);

        // Helper function: Update container metadata, restore the container’s data-terms & layout
		FilterHelper.updateContainerMeta(container, combinedTerms, params["data-filter-layout"]);
		
        // Helper: send AJAX request to update filtered posts
        // REMOVE / COMMENT OUT → let the CAF plugin send the AJAX (in markup-toggle.js)
  		 FilterHelper.sendAjaxFilterRequest(params);

		
	// end of Unified event handler
    });
	
// end of jQuery		
});