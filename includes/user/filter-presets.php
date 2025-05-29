<?php
  
//  08 - Save Filter presets PHP
  
  // Single function to handle saving presets
function caf_handle_save_filter_preset() {
    // Only allow for logged-in users (you can remove this check if you want guests)
    if ( ! is_user_logged_in() || empty( $_POST['filter'] ) ) {
        wp_send_json_error( 'Not authorized or missing filter' );
    }

    $user_id = get_current_user_id();
    $filter  = sanitize_text_field( $_POST['filter'] );
    $name    = isset( $_POST['name'] ) ? sanitize_text_field( $_POST['name'] ) : '';

    // Load existing presets
    $presets = get_user_meta( $user_id, 'caf_filter_presets', true );
    if ( ! is_array( $presets ) ) {
        $presets = [];
    }

    // Generate unique key
    $key = substr( str_shuffle( '0123456789abcdefghijklmnopqrstuvwxyz' ), 0, 6 );

    // Add new preset
    $presets[ $key ] = [
        'name'   => $name,
        'filter' => $filter,
        'time'   => current_time( 'mysql' ),
    ];
    update_user_meta( $user_id, 'caf_filter_presets', $presets );

    // Return the share link
    $link = home_url( "/posts/?preset={$key}" );
    wp_send_json_success( [ 'link' => $link ] );
}
add_action( 'wp_ajax_caf_save_filter_preset',        'caf_handle_save_filter_preset' );
add_action( 'wp_ajax_nopriv_caf_save_filter_preset', 'caf_handle_save_filter_preset' );




// Shortcode to list current user’s CAF filter presets (with drag‐handle)
add_shortcode('caf_list_presets', function(){
    if ( ! is_user_logged_in() ) {
        return '<p>Please <a href="/wp-login.php">log in</a> to see your presets.</p>';
    }
    $user_id  = get_current_user_id();
    $presets  = get_user_meta($user_id, 'caf_filter_presets', true);
    if ( empty($presets) || ! is_array($presets) ) {
        return '<p>You have no saved presets.</p>';
    }

    // Wrap in a UL with an ID for Sortable
    $out  = '<ul id="caf-presets-sortable" class="caf-presets-list">';
    foreach ( $presets as $key => $info ) {
        $name = esc_html( $info['name'] ?: $key );
        $link = esc_url( home_url( "/posts/?preset={$key}" ) );

        // Month‐Year label
        $label = '';
        if ( ! empty( $info['time'] ) ) {
            $dt = DateTime::createFromFormat('Y-m-d H:i:s', $info['time']);
            if ( $dt ) {
                $label = $dt->format('M Y');
            }
        }

        $out .= "<li data-key=\"{$key}\" style=\"cursor: move;\">";
        // ← Add the drag handle
        $out .= '<span class="caf-preset-handle" title="Drag to reorder">☰</span> ';
        $out .= "<a href=\"{$link}\">{$name}</a> <small>({$label})</small> ";
        $out .= "<button class=\"caf-edit-preset\"   title=\"Edit this preset\">✎</button> ";
        $out .= "<button class=\"caf-delete-preset\" title=\"Delete this preset\">&times;</button>";
        $out .= "</li>";
    }
    $out .= '</ul>';

    return $out;
});






add_action('wp_ajax_caf_get_filter_preset',        'caf_handle_get_filter_preset');
add_action('wp_ajax_nopriv_caf_get_filter_preset', 'caf_handle_get_filter_preset');
function caf_handle_get_filter_preset() {
    if ( empty($_POST['key']) ) {
        wp_send_json_error('Missing preset key');
    }
    $key = sanitize_text_field( $_POST['key'] );

    // Only logged-in users have presets
    if ( ! is_user_logged_in() ) {
        wp_send_json_error('Not logged in');
    }

    $user_id = get_current_user_id();
    $presets = get_user_meta( $user_id, 'caf_filter_presets', true );
    if ( empty($presets[ $key ]['filter'] ) ) {
        wp_send_json_error('Preset not found');
    }

    wp_send_json_success([ 'filter' => $presets[ $key ]['filter'] ]);
}



/**
 * AJAX handler to delete a saved CAF filter preset.
 */
function caf_handle_delete_filter_preset() {
    // Must supply a key
    if ( empty( $_POST['key'] ) ) {
        wp_send_json_error( 'Missing preset key' );
    }
    // Only logged-in users can delete their own presets
    if ( ! is_user_logged_in() ) {
        wp_send_json_error( 'Not logged in' );
    }

    $user_id = get_current_user_id();
    $key     = sanitize_text_field( $_POST['key'] );

    // Fetch existing presets
    $presets = get_user_meta( $user_id, 'caf_filter_presets', true );
    if ( ! is_array( $presets ) || ! isset( $presets[ $key ] ) ) {
        wp_send_json_error( 'Preset not found' );
    }

    // Remove it
    unset( $presets[ $key ] );
    update_user_meta( $user_id, 'caf_filter_presets', $presets );

    wp_send_json_success();
}
// For logged-in users
add_action( 'wp_ajax_caf_delete_filter_preset',        'caf_handle_delete_filter_preset' );
// (Optionally) for guests—usually not needed for user meta
add_action( 'wp_ajax_nopriv_caf_delete_filter_preset', 'caf_handle_delete_filter_preset' );




/**
 * AJAX handler to rename a saved CAF filter preset.
 */
function caf_handle_rename_filter_preset() {
    // Must supply a key and a new name
    if ( empty( $_POST['key'] ) || ! isset( $_POST['name'] ) ) {
        wp_send_json_error( 'Missing parameters' );
    }
    if ( ! is_user_logged_in() ) {
        wp_send_json_error( 'Not logged in' );
    }

    $user_id = get_current_user_id();
    $key     = sanitize_text_field( $_POST['key'] );
    $new_name= sanitize_text_field( $_POST['name'] );

    // Fetch existing presets
    $presets = get_user_meta( $user_id, 'caf_filter_presets', true );
    if ( ! is_array( $presets ) || ! isset( $presets[ $key ] ) ) {
        wp_send_json_error( 'Preset not found' );
    }

    // Update only the name
    $presets[ $key ]['name'] = $new_name;
    update_user_meta( $user_id, 'caf_filter_presets', $presets );

    wp_send_json_success();
}
add_action( 'wp_ajax_caf_rename_filter_preset',        'caf_handle_rename_filter_preset' );
add_action( 'wp_ajax_nopriv_caf_rename_filter_preset', 'caf_handle_rename_filter_preset' );


// DRAG SAVED FILTER PRESETS


// Enqueue jQuery UI Sortable so $.fn.sortable() is available
add_action( 'wp_enqueue_scripts', function(){
    // WordPress bundles jQuery UI core and sortable—you just need to enqueue them
    wp_enqueue_script( 'jquery-ui-core' );
    wp_enqueue_script( 'jquery-ui-sortable' );
}, 20 );




function caf_handle_reorder_filter_presets() {
    if ( ! is_user_logged_in() || empty($_POST['order']) || ! is_array($_POST['order']) ) {
        wp_send_json_error('Invalid request');
    }
    $user_id = get_current_user_id();
    $new_order = array_map( 'sanitize_text_field', $_POST['order'] );

    // Fetch existing presets
    $presets = get_user_meta($user_id, 'caf_filter_presets', true);
    if ( ! is_array($presets) ) {
        wp_send_json_error('No presets to reorder');
    }

    // Build a reordered array
    $reordered = [];
    foreach ( $new_order as $key ) {
        if ( isset( $presets[ $key ] ) ) {
            $reordered[ $key ] = $presets[ $key ];
        }
    }
    // Save
    update_user_meta( $user_id, 'caf_filter_presets', $reordered );
    wp_send_json_success();
}
add_action('wp_ajax_caf_reorder_filter_presets',        'caf_handle_reorder_filter_presets');
add_action('wp_ajax_nopriv_caf_reorder_filter_presets', 'caf_handle_reorder_filter_presets');
