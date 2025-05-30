console.log('filter-layout1.js');

jQuery(document).ready(function($) {
    // Helper: Deduplicate active filters in the container.
    function deduplicateActiveFilters(div) {
        var seen = {};
        $("." + div).find(".caf-active-filters ul li.filter-item").each(function() {
            var id = $(this).attr("data-id");
            if (seen[id]) {
                $(this).remove();
            } else {
                seen[id] = true;
            }
        });
    }
    
    // Helper: Build AJAX parameters from container attributes.
    function get_params(page, div) {
        var divClass = "." + div;
        var params = {
            page: page,
            tax: $(divClass).attr("data-tax"),
            "post-type": $(divClass).attr("data-post-type"),
            term: $(divClass).attr("data-terms"),
            "per-page": $(divClass).attr("data-per-page"),
            "filter-id": $(divClass).attr("data-filter-id"),
            "caf-post-layout": $(divClass).attr("data-post-layout"),
            "data-target-div": divClass,
            "data-filter-layout": $(divClass).attr("data-filter-layout"),
            "data-relation": $(divClass).attr("data-relation"),
            "data-default-term": $(divClass).attr("data-default-term"),
            "current-post-id": $(divClass).attr("current-post-id"),
            "data-order-by": $(divClass).attr("data-order-by"),
            "data-order-type": $(divClass).attr("data-order-type")
        };
        if ($("#caf-search-input").val() !== "") {
            params.search_string = $("#caf-search-input").val();
        }
        return params;
    }
    
    // Helper: Combine selected values from both MCF and MTF filters.
    function getCombinedFilterTerms(div) {
        var container = $("." + div);
        var mcfTerms = [];
        container.find("#caf-multiple-check-filter li .check_box:checked").each(function() {
            mcfTerms.push($(this).val());
        });
        var mtfTerms = [];
        container.find("#caf-multiple-taxonomy-filter li .check_box:checked").each(function() {
            mtfTerms.push($(this).val());
        });
        var combined = mcfTerms.concat(mtfTerms);
        return combined.join(",");
    }
    
    // Unified event handler on change for checkboxes in both filter groups.
    $(".caf-post-layout-container").on("change", "#caf-multiple-check-filter li .check_box, #caf-multiple-taxonomy-filter li .check_box", function(e) {
        var dataId = $(this).attr("data-id");
        var isChecked = $(this).is(":checked");
        var container = $(this).closest(".caf-post-layout-container");
        var div = container.attr("data-target-div");
        
        // Synchronize: update matching checkboxes in both groups.
        $("." + div).find("#caf-multiple-check-filter li .check_box[data-id='" + dataId + "']").prop("checked", isChecked);
        $("." + div).find("#caf-multiple-taxonomy-filter li .check_box[data-id='" + dataId + "']").prop("checked", isChecked);
        
        // Update combined filter terms.
        var combinedTerms = getCombinedFilterTerms(div);
        $("." + div).attr("data-terms", combinedTerms);
        
        // Update active filters display.
        if ($("." + div).find(".caf-active-filters").length > 0 && typeof set_active_filters === "function") {
            set_active_filters($("." + div));
        }
        // Remove any duplicate active filter entries.
        deduplicateActiveFilters(div);
        
        // Build the AJAX parameters.
        var params = get_params(1, div);
        params.term = combinedTerms; // Override term with our combined selection.
        
        // Update layout parameter based on how many boxes are checked.
        var mtfCount = $("." + div).find("#caf-multiple-taxonomy-filter li .check_box:checked").length;
        var mcfCount = $("." + div).find("#caf-multiple-check-filter li .check_box:checked").length;
        if (mtfCount > 0) {
            params["data-filter-layout"] = (mtfCount === 1) ? "multiple-taxonomy-filter" : "multiple-taxonomy-filter2";
        } else if (mcfCount > 0) {
            params["data-filter-layout"] = "multiple-checkbox2";
        } else {
            params["data-filter-layout"] = $("." + div).attr("data-filter-layout") || "multiple-checkbox";
        }
        
        // Send the AJAX request to update posts.
        $.ajax({
            url: tc_caf_ajax.ajax_url,
            type: "POST",
            data: {
                action: "get_filter_posts",
                nonce: tc_caf_ajax.nonce,
                params: params
            },
            dataType: "json",
            beforeSend: function() {
            },
            success: function(response) {
                if (response.status === 200) {
                    $("#manage-ajax-response").html(response.content);
                } else {
                }
            },
            error: function(xhr, status, error) {
            }
        });
    });
});
