//───────────────────────ENABLE CAF ACTIVE FILTERS FOR MTF MODERN AND MCF─────────────────────────────────────
console.log('filter-layout2.js');

jQuery(function($){

  // NEW: Helper function to remove duplicates in .caf-active-filters
  function deduplicateActiveFilters(div) {
    var seen = {};
    jQuery(div).find('.caf-active-filters ul li.filter-item').each(function() {
      var id = jQuery(this).attr('data-id');
      if (seen[id]) {
        jQuery(this).remove();
      } else {
        seen[id] = true;
      }
    });
  }

  window.set_active_filters = function(div) {

    // 0) Clear any previous filters in the UI and in memory
    active_filters = [];
    jQuery(div).find(".caf-active-filters ul").empty();

    // 1) Handle checkbox-based filters (as CAF does by default)
    jQuery(div).find(
      "#caf-multiple-taxonomy-filter li .check_box," +
      "#caf-multiple-check-filter li .check_box"
    ).each(function () {
      var filter_label = jQuery(this).closest("li").find('label').text();
      var data_name    = jQuery(this).closest("ul").find('h3').attr('data-name');
      var data_id      = jQuery(this).attr('data-id');
      var filter_obj   = { label: filter_label, dataName: data_name };

      if (jQuery(this).is(":checked")) {
        if (!active_filters.some(item => item.label === filter_label && item.dataName === data_name)) {
          active_filters.push(filter_obj);
          var htm = '<li class="filter-item" data-id="'+data_id+'" data-label="' 
            + filter_label + '" data-name="' + data_name + '" style="display:none;">' 
            + '<span class="caf-active-filter-tag">' + filter_label + '</span>' 
            + '<span class="caf-active-filter-close"> X</span></li>';
          jQuery(div).find(".caf-active-filters ul")
                     .append(htm)
                     .find('li:last').fadeIn();
        }
      } else {
        active_filters = active_filters.filter(item =>
          !(item.label === filter_label && item.dataName === data_name)
        );
        jQuery(div).find(
          '.caf-active-filters ul li[data-label="'+filter_label+'"][data-name="'+data_name+'"]'
        ).fadeOut(function(){ jQuery(this).remove(); });
      }
    });

    // 2) Handle your MTF dropdown active <li> items
    jQuery(div).find("ul.caf-multi-drop-sub li.active").each(function(){
      var $li          = jQuery(this),
          filter_label = $li.attr("data-name"),
          data_id      = $li.attr("data-value"),
          data_name    = $li.closest("ul.caf_select_multi")
                             .find("li.caf_select_multi_default span")
                             .text(),
          filter_obj   = { label: filter_label, dataName: data_name };

      if (!active_filters.some(item => item.label === filter_label && item.dataName === data_name)) {
        active_filters.push(filter_obj);
        var htm = '<li class="filter-item" data-id="'+data_id+'" data-label="' 
          + filter_label + '" data-name="' + data_name + '" style="display:none;">' 
          + '<span class="caf-active-filter-tag">' + filter_label + '</span>' 
          + '<span class="caf-active-filter-close"> X</span></li>';
        jQuery(div).find(".caf-active-filters ul")
                   .append(htm)
                   .find('li:last').fadeIn();
      }
    });

    // 3) “Clear All” logic (same as CAF’s defaults)
    if (active_filters.length > 0) {
      jQuery(div).find(".caf-active-filters ul li.caf-clear-all").remove();
      if (jQuery(div).find(".caf-clear-all").length === 0) {
        jQuery(div).find(".caf-active-filters ul")
          .append('<li class="caf-clear-all" style="display:none;"><button class="clear-all-btn">Clear All</button></li>')
          .find('li:last').fadeIn();
      }
    } else {
      jQuery(div).find(".caf-clear-all").fadeOut(function(){ jQuery(this).remove(); });
    }

    // NEW: remove any duplicate filters
    deduplicateActiveFilters(div);
  };

  // Wait for filtersReady event from filter-button1.js or filter-button2.js
  $(document).on('filtersReady', function() {
    var $container = $('.caf-post-layout-container');
    if ($container.length && typeof set_active_filters === 'function') {
      set_active_filters($container);
    }
  });

});
