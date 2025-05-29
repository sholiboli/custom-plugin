  // 08 - Save Filter presets JS
  
  jQuery(function($){

  // ───────────────────────────────────────────────────────
  // 0) Preset loading: detect ?preset=XYZ and redirect to ?filter=…
  // ───────────────────────────────────────────────────────
  var urlParams = new URLSearchParams(window.location.search);
  if ( urlParams.has('preset') ) {
    var key = urlParams.get('preset');
    console.log('Preset block: found preset key =', key);

    // Fetch the saved filter string from WordPress
    $.post(ajaxurl, {
      action: 'caf_get_filter_preset',
      key:    key
    })
    .done(function(res){
      if ( res.success && res.data.filter ) {
        console.log('Preset block: got filter string =', res.data.filter);
        // Redirect to the standard ?filter=… URL so existing logic applies
        window.location = window.location.pathname
                        + '?filter='
                        + encodeURIComponent(res.data.filter);
      } else {
        console.warn('Preset block: no preset found for', key);
      }
    })
    .fail(function(xhr){
      console.error('Preset block: AJAX failed', xhr.status, xhr.responseText);
    });

    // Stop further JS until redirect
    return;
  }

  // ───────────────────────────────────────────────────────
  // 1) “Save This View” button handler
  // ───────────────────────────────────────────────────────
  $('#save-filter-preset').on('click', function(e){
    e.preventDefault();

    // Compute current filter string from checked boxes
    var checked = $(
      '#caf-multiple-check-filter input.check_box:checked,' +
      '#caf-multiple-taxonomy-filter input.check_box:checked'
    ).map(function(){
      return this.getAttribute('data-id');
    }).get();

    if (!checked.length) {
      alert('Please select at least one filter before saving a preset.');
      return;
    }

    var preset = checked.join(',');

    // Ask the user for an optional name
    var name = prompt('Name this preset (optional):', '');
    if (name === null) {
      return; // user cancelled
    }
    name = name.trim();

    // Send it to WordPress via AJAX
    $.post(ajaxurl, {
      action: 'caf_save_filter_preset',
      filter: preset,
      name:   name
    })
    .done(function(res){
      if (res.success) {
        alert('Preset saved! Share this link:\n' + res.data.link);
      } else {
        alert('Error saving preset:\n' + res.data);
      }
    })
    .fail(function(xhr){
      console.error('Preset save failed:', xhr.status, xhr.responseText);
      alert('Preset save failed with status ' + xhr.status);
    });
  });

  // ───────────────────────────────────────────────────────
  // 2) … your existing CAF filter logic goes here …  
  //    (URL‐param init for ?filter=…, custom‐button clicks,  
  //     checkbox‐change handler, AJAXComplete hooks, etc.)
  // ───────────────────────────────────────────────────────


  // ─────────────────────DELETE SAVED FILTER PRESET─────────────────────

	// Delegate click on any “×” delete button in the presets list
  $('.caf-presets-list').on('click', '.caf-delete-preset', function(e){
    e.preventDefault();

    var $li  = $(this).closest('li');
    var key  = $li.data('key');

    if (!key) {
      console.error('No preset key found on this list item');
      return;
    }
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    // AJAX call to delete the preset
    $.post(ajaxurl, {
      action: 'caf_delete_filter_preset',
      key:    key
    })
    .done(function(res){
      if (res.success) {
        // Fade out and remove the list item
        $li.fadeOut(200, function(){
          $(this).remove();
        });
      } else {
        alert('Error deleting preset:\n' + res.data);
      }
    })
    .fail(function(xhr){
      console.error('Delete preset failed:', xhr.status, xhr.responseText);
      alert('Failed to delete preset (status ' + xhr.status + ')');
    });
  });
	

	// 1) Click the “Edit” button to rename
$('.caf-presets-list').on('click', '.caf-edit-preset', function(e){
  e.preventDefault();

  var $li = $(this).closest('li');
  var key = $li.data('key');
  var oldName = $li.find('> a').text().trim();

  var newName = prompt('Rename this preset:', oldName);
  if ( newName === null ) {
    return; // user cancelled
  }
  newName = newName.trim();
  if ( ! newName ) {
    alert('Name cannot be empty.');
    return;
  }

  // AJAX call to rename
  $.post( ajaxurl, {
    action: 'caf_rename_filter_preset',
    key:    key,
    name:   newName
  })
  .done(function(res){
    if ( res.success ) {
      // Update link text in-place
      $li.find('> a').text( newName );
    } else {
      alert('Error renaming preset:\n' + res.data);
    }
  })
  .fail(function(xhr){
    alert('Failed to rename preset (status ' + xhr.status + ')');
  });
});


// 2) Make the presets list sortable
$('#caf-presets-sortable').sortable({
  handle: '.caf-preset-handle',
  update: function() {
    // Build an array of keys in their new order
    var newOrder = $(this).children('li').map(function(){
      return $(this).data('key');
    }).get();

    // Send to the server to save
    $.post(ajaxurl, {
      action: 'caf_reorder_filter_presets',
      order:  newOrder
    })
    .done(function(res){
      if (!res.success) {
        console.error('Reorder failed:', res.data);
      }
    })
    .fail(function(xhr){
      console.error('Reorder AJAX error:', xhr.status, xhr.responseText);
    });
  }
});

	
	
	
// ────────────────────CLOSING─────────────────────
	
});
