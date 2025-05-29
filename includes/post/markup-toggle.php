<?php
  
  /**
 * 1. Enqueue & localize all toggles under one dummy handle
 */
function oceanwp_child_enqueue_and_localize_toggles() {
    wp_register_script( 'oceanwp-toggle-handler', '' );
    wp_enqueue_script( 'oceanwp-toggle-handler' );

    $user_id    = get_current_user_id();
    $show_saved = $user_id ? get_user_meta( $user_id, 'fav_filter_only_favorites', true ) : false;
    $hide_read  = $user_id ? get_user_meta( $user_id, 'hide_bookmarked_posts',       true ) : false;
    $show_liked = $user_id ? get_user_meta( $user_id, 'show_only_liked',             true ) : false;
	$hide_custom_read = $user_id ? get_user_meta( $user_id, 'hide_custom_read', true ) : false;
	
    // Favorites data
    wp_localize_script( 'oceanwp-toggle-handler', 'favToggleData', [
        'ajax_url'        => admin_url( 'admin-ajax.php' ),
        'show_only_saved' => $show_saved ? '1' : '0',
    ] );

    // CBX “hide read” data
    wp_localize_script( 'oceanwp-toggle-handler', 'toggleBookmarkedPosts', [
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'hide'     => $hide_read ? '1' : '0',
    ] );

    // Liked posts data
    wp_localize_script( 'oceanwp-toggle-handler', 'likedToggleData', [
        'ajax_url'         => admin_url( 'admin-ajax.php' ),
        'show_only_liked'  => $show_liked ? '1' : '0',
    ] );
	
	    /* NEW “Hide Read (v2)” switch ------------------------- */
        wp_localize_script( 'oceanwp-toggle-handler', 'customReadToggleData', [
        'ajax_url'          => admin_url( 'admin-ajax.php' ),
        'hide_custom_read'  => $hide_custom_read ? '1' : '0',
    ] );
	
}
add_action( 'wp_enqueue_scripts', 'oceanwp_child_enqueue_and_localize_toggles' );



/**
 * 2. Single AJAX handler for FAV, CBX, and Liked toggle actions
 */
function oceanwp_child_handle_all_toggles() {
    if ( ! is_user_logged_in() ) {
        wp_send_json_error( 'Not logged in' );
    }
    $user_id = get_current_user_id();

    // Favorites toggle
    if ( isset( $_POST['action'], $_POST['show_favorites'] ) 
      && $_POST['action'] === 'toggle_favorites_filter' ) 
    {
        $val = $_POST['show_favorites'] === 'true' ? '1' : '0';
        update_user_meta( $user_id, 'fav_filter_only_favorites', $val );
        wp_send_json_success();
    }

    // CBX “hide read” toggle
    if ( isset( $_POST['action'], $_POST['hide'] ) 
      && in_array( $_POST['action'], [ 'hide_bookmarked_posts', 'show_bookmarked_posts' ], true ) ) 
    {
        $val = $_POST['hide'] === 'true' ? '1' : '0';
        update_user_meta( $user_id, 'hide_bookmarked_posts', $val );
        wp_send_json_success();
    }

    // Liked posts toggle
    if ( isset( $_POST['action'], $_POST['show_liked'] ) 
      && $_POST['action'] === 'toggle_liked_filter' ) 
    {
        $val = $_POST['show_liked'] === 'true' ? '1' : '0';
        update_user_meta( $user_id, 'show_only_liked', $val );
        wp_send_json_success();
    }

	    /* NEW Hide-Custom-Read toggle ------------------------- */
    if ( isset( $_POST['action'], $_POST['hide_custom_read'] )
      && $_POST['action'] === 'toggle_custom_read_filter' )
    {
        $val = $_POST['hide_custom_read'] === 'true' ? '1' : '0';
        update_user_meta( $user_id, 'hide_custom_read', $val );
        wp_send_json_success();
    }
	
    wp_send_json_error( 'Invalid toggle request' );
}
add_action( 'wp_ajax_toggle_favorites_filter', 'oceanwp_child_handle_all_toggles' );
add_action( 'wp_ajax_hide_bookmarked_posts',   'oceanwp_child_handle_all_toggles' );
add_action( 'wp_ajax_show_bookmarked_posts',   'oceanwp_child_handle_all_toggles' );
add_action( 'wp_ajax_toggle_liked_filter',     'oceanwp_child_handle_all_toggles' );
add_action( 'wp_ajax_toggle_custom_read_filter', 'oceanwp_child_handle_all_toggles' );




/**
 * 3. Helper: fetch bookmarked post IDs via CBX table
 */
function get_user_bookmarked_post_ids() {
    if ( ! is_user_logged_in() ) {
        return [];
    }
    global $wpdb;
    return $wpdb->get_col(
        $wpdb->prepare(
            "SELECT object_id FROM {$wpdb->prefix}cbxwpbookmark WHERE user_id = %d",
            get_current_user_id()
        )
    );
}


/**
 * 4. Unified CAF filter: combines “Show Liked”, “Show Saved” and “Hide Read”.
 * Order of operations:
 *   1) If Show Saved → start with that list
 *   2) If Show Liked → intersect with liked IDs
 *   3) If Hide Read  → subtract read IDs
 */
function oceanwp_child_apply_user_toggles_to_caf( $args, $filter_id ) {

    if ( ! is_user_logged_in() ) {
        return $args;                                 // guests handled elsewhere
    }

    /* ------------------------------------------------------------------
     *  Current flag states
     * ---------------------------------------------------------------- */
    $user_id    = get_current_user_id();
    $show_liked = (bool) get_user_meta( $user_id, 'show_only_liked',           true );
    $show_saved = (bool) get_user_meta( $user_id, 'fav_filter_only_favorites', true );
    $hide_read  = (bool) get_user_meta( $user_id, 'hide_bookmarked_posts',     true );
	$hide_custom_read = (bool) get_user_meta( $user_id, 'hide_custom_read', true );

    /* ------------------------------------------------------------------
     *  ID lists
     * ---------------------------------------------------------------- */
    // Liked
    $liked_ids = array_map( 'intval',
        (array) get_user_meta( $user_id, 'liked_posts', true )
    );

    // Saved (“Favorites” plugin)
    $fav_array = maybe_unserialize(
        get_user_meta( $user_id, 'simplefavorites', true )
    );
    $fav_ids = ! empty( $fav_array[0]['posts'] )
               ? array_map( 'intval', $fav_array[0]['posts'] )
               : [];

    // Read / Bookmarked (“CBX Bookmarks” plugin)
    $read_ids = array_map( 'intval', get_user_bookmarked_post_ids() );

	    // Custom “read_posts” list (your new feature)
    $custom_read_ids = array_map( 'intval',
        (array) get_user_meta( $user_id, 'read_posts', true )
    );

	
	
    /* ------------------------------------------------------------------
     *  Build the keep-list step by step
     * ---------------------------------------------------------------- */
    unset( $args['post__in'], $args['post__not_in'] );   // start clean
    $keep = null;                                        // null = “all posts so far”

    // 1) Show Saved
    if ( $show_saved ) {
        $keep = $fav_ids;
    }

    // 2) Show Liked  (intersect if we already have a list)
    if ( $show_liked ) {
        $keep = ( $keep === null )
                ? $liked_ids
                : array_intersect( $keep, $liked_ids );
    }

    // 3) Hide Read  (subtract read IDs, or use post__not_in)
    if ( $hide_read ) {
        if ( $keep === null ) {                         // no inclusion list yet
            if ( ! empty( $read_ids ) ) {
                $args['post__not_in'] = $read_ids;      // exclude via NOT IN
            }
        } else {
            $keep = array_diff( $keep, $read_ids );     // subtract from keep-list
        }
    }

	    // 4) Hide Custom Read (v2)
    if ( $hide_custom_read ) {
        if ( $keep === null ) {
            if ( ! empty( $custom_read_ids ) ) {
                $args['post__not_in'] = array_merge(
                    $args['post__not_in'] ?? [],
                    $custom_read_ids
                );
            }
        } else {
            $keep = array_diff( $keep, $custom_read_ids );
        }
    }
	
    /* ------------------------------------------------------------------
     *  Apply to WP_Query
     * ---------------------------------------------------------------- */
    if ( $keep !== null ) {
        $args['post__in'] = empty( $keep ) ? [ 0 ] : $keep;  // empty → no posts
    }

    return $args;
}
add_filter( 'tc_caf_filter_posts_query', 'oceanwp_child_apply_user_toggles_to_caf', 10, 2 );