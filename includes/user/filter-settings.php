<?php
  

// 41_User preferences PHP
 
  // ajaxurl is available for your AJAX calls.
function my_print_ajaxurl() {
    ?>
    <script type="text/javascript">
        var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';
    </script>
    <?php
}
add_action('wp_head', 'my_print_ajaxurl');

// Output the user's multi-select mode as a JS variable
function caf_print_multi_select_preference() {
    $mode = 1; // default to single-select (0)
    if ( is_user_logged_in() ) {
        $user_id = get_current_user_id();
        $stored = get_user_meta( $user_id, 'caf_multi_select_mode', true );
        if ( $stored !== '' ) {
            $mode = intval($stored);
        }
    }
    ?>
    <script type="text/javascript">
        var userMultiSelectMode = <?php echo $mode; ?>;
    </script>
    <?php
}
add_action('wp_head', 'caf_print_multi_select_preference');


// AJAX handler to save multi-select mode for logged-in users
function caf_update_multi_select_mode() {
    if ( is_user_logged_in() && isset($_POST['mode']) ) {
        $user_id = get_current_user_id();
        $mode = intval($_POST['mode']); // 1 (multi-select) or 0 (single-select)
        update_user_meta($user_id, 'caf_multi_select_mode', $mode);
        wp_send_json_success("Mode updated to " . $mode);
    } else {
        wp_send_json_error("Not logged in or mode not provided");
    }
}
add_action('wp_ajax_caf_update_multi_select_mode', 'caf_update_multi_select_mode');

//KOPIRANO IZ DRUGEGA CODE SNIPPETA

// To update the last filter value when a custom filter button is clicked, 
function caf_update_last_filter() {
    // Log the entire POST data for debugging.
    
    // Verify the nonce.
    check_ajax_referer('caf_last_filter_nonce', 'nonce');
    
    if ( is_user_logged_in() && isset($_POST['filter']) ) {
        $user_id = get_current_user_id();
        $filter = sanitize_text_field($_POST['filter']);
        
        // Attempt to update the user meta.
        $result = update_user_meta($user_id, 'caf_last_filter', $filter);
        
        wp_send_json_success("Last filter updated to " . $filter);
    } else {
        wp_send_json_error("Not logged in or filter not provided");
    }
}
add_action('wp_ajax_caf_update_last_filter', 'caf_update_last_filter');


 
 
// Output the user's "save last filter" toggle preference as JS variables.
function caf_print_last_filter_toggle_preference() {
    $save_pref = 0;
    if ( is_user_logged_in() ) {
        $user_id = get_current_user_id();
        $stored  = get_user_meta( $user_id, 'caf_save_last_filter', true );
        if ( $stored !== '' ) {
            $save_pref = intval( $stored );
        }
    }
    // Create nonce for last filter update.
    $nonce = wp_create_nonce( 'caf_last_filter_nonce' );

    // Determine initial JS values
    if ( isset( $_GET['filter'] ) ) {
        // We’re landing via ?filter=…: disable for now, but remember real pref & nonce
        ?>
        <script type="text/javascript">
            var initialUserSaveLastFilter  = <?php echo $save_pref; ?>;
            var userSaveLastFilter         = 0;
            var initialCafLastFilterNonce  = '<?php echo esc_js( $nonce ); ?>';
            var cafLastFilterNonce         = '';
        </script>
        <?php
    } else {
        // Normal page load
        ?>
        <script type="text/javascript">
            var initialUserSaveLastFilter  = <?php echo $save_pref; ?>;
            var userSaveLastFilter         = <?php echo $save_pref; ?>;
            var initialCafLastFilterNonce  = '<?php echo esc_js( $nonce ); ?>';
            var cafLastFilterNonce         = '<?php echo esc_js( $nonce ); ?>';
        </script>
        <?php
    }
}
add_action( 'wp_head', 'caf_print_last_filter_toggle_preference' );






// AJAX handler to update user meta for saving last filter preference.
function caf_update_save_last_filter_pref() {
    // Check nonce.
    check_ajax_referer('caf_last_filter_nonce', 'nonce');
    
    if ( is_user_logged_in() && isset($_POST['save_pref']) ) {
        $user_id = get_current_user_id();
        $pref = intval($_POST['save_pref']); // 1 to save last filter, 0 to ignore.
        update_user_meta($user_id, 'caf_save_last_filter', $pref);
        wp_send_json_success("Save last filter preference updated to " . $pref);
    } else {
        wp_send_json_error("Not logged in or preference not provided");
    }
}
add_action('wp_ajax_caf_update_save_last_filter_pref', 'caf_update_save_last_filter_pref');

// USER PREFERENCE LAST FILTER
function caf_print_last_filter_value() {
    // If we're landing with ?filter=…, clear out any saved filter
    if ( isset( $_GET['filter'] ) ) {
        ?>
        <script type="text/javascript">
            var userLastFilter = '';
        </script>
        <?php
        return;
    }

    $last_filter = '';
    if ( is_user_logged_in() ) {
        $user_id = get_current_user_id();
        $stored  = get_user_meta( $user_id, 'caf_last_filter', true );
        if ( ! empty( $stored ) ) {
            $last_filter = $stored;
        }
    }
    ?>
    <script type="text/javascript">
        var userLastFilter = '<?php echo esc_js( $last_filter ); ?>';
    </script>
    <?php
}
add_action( 'wp_head', 'caf_print_last_filter_value' );
