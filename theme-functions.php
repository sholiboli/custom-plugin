<?php
/**
 * OceanWP Child Theme Functions
 *
 * When running a child theme (see http://codex.wordpress.org/Theme_Development
 * and http://codex.wordpress.org/Child_Themes), you can override certain
 * functions (those wrapped in a function_exists() call) by defining them first
 * in your child theme's functions.php file. The child theme's functions.php
 * file is included before the parent theme's file, so the child theme
 * functions will be used.
 *
 * Text Domain: oceanwp
 * @link http://codex.wordpress.org/Plugin_API
 *
 */

/**
 * Load the parent style.css file
 *
 * @link http://codex.wordpress.org/Child_Themes
 */
function oceanwp_child_enqueue_parent_style() {

	// Dynamically get version number of the parent stylesheet (lets browsers re-cache your stylesheet when you update the theme).
	$theme   = wp_get_theme( 'OceanWP' );
	$version = $theme->get( 'Version' );

	// Load the stylesheet.
	wp_enqueue_style( 'child-style', get_stylesheet_directory_uri() . '/style.css', array( 'oceanwp-style' ), $version );
	
}

add_action( 'wp_enqueue_scripts', 'oceanwp_child_enqueue_parent_style' );

//---------------------------------------------------------------------------------------------------------------------------

// ENABLE JS - AUTO-SCROLL TO CAF CONTAINER JS
function perfect_blog_enqueue_scripts() {
    wp_enqueue_script(
        'perfect-blog-auto-scroll',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/auto-scroll.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_scripts');

// ENABLE JS - CUSTOM FILTER BUTTONS FOR MCF, MTF, MTFM
function perfect_blog_enqueue_filter_buttons() {
    wp_enqueue_script(
        'perfect-blog-filter-button1',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/filter/filter-button1.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_buttons');

// ENABLE JS - CUSTOM FILTER BUTTONS, SAVE LAST FILTER, MULTISELECT FOR MTFM
function perfect_blog_enqueue_filter_button2() {
    wp_enqueue_script(
        'perfect-blog-filter-button2',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/filter/filter-button2.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_button2');

// ENABLE JS - CAF ACTIVE FILTERS FOR MCF, MTFM
function perfect_blog_enqueue_filter_layout2() {
    wp_enqueue_script(
        'perfect-blog-filter-layout2',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/filter/filter-layout2.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_layout2');

// ENABLE - POST GRID MARKUP MULTIBUTTON TOGGLE
require_once get_stylesheet_directory() . '/perfect-blog/includes/post/markup-toggle.php';

function perfect_blog_enqueue_post_markup_toggle() {
    wp_enqueue_script(
        'perfect-blog-post-markup-toggle',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/post/markup-toggle.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_post_markup_toggle');

function perfect_blog_enqueue_markup_toggle_style() {
    wp_enqueue_style(
        'perfect-blog-markup-toggle-style',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/css/post/markup-toggle.css',
        array(),
        null
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_markup_toggle_style');




// ENABLE JS - MULTIFILTER MTF&MCF
function perfect_blog_enqueue_filter_layout1() {
    wp_enqueue_script(
        'perfect-blog-filter-layout1',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/filter/filter-layout1.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_layout1');

function perfect_blog_enqueue_filter_layout1_style() {
    wp_enqueue_style(
        'perfect-blog-filter-layout1-style',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/css/filter/filter-layout1.css',
        array(),
        null
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_layout1_style');



// ENABLE PHP - CUSTOM FILTER BUTTONS SHORTCODES
require_once get_stylesheet_directory() . '/perfect-blog/includes/filter/filter-button.php';
require_once get_stylesheet_directory() . '/perfect-blog/includes/post/post-button.php';

// ENABLE USER PREFERENCES (Save last filter, multiselect)
require_once get_stylesheet_directory() . '/perfect-blog/includes/user/filter-settings.php';

// ENABLE SAVE FILTER PRESETS/SELECTIONS
require_once get_stylesheet_directory() . '/perfect-blog/includes/user/filter-presets.php';

function perfect_blog_enqueue_filter_presets() {
    wp_enqueue_script(
        'perfect-blog-filter-presets',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/js/user/filter-presets.js',
        array('jquery'),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_presets');

// ENABLE CUSTOM FILTER BUTTONS IN POST GRID LAYOUT
function perfect_blog_enqueue_filter_button1_style() {
    wp_enqueue_style(
        'perfect-blog-filter-button1-style',
        get_stylesheet_directory_uri() . '/perfect-blog/assets/css/filter/filter-button1.css',
        array(),
        null
    );
}
add_action('wp_enqueue_scripts', 'perfect_blog_enqueue_filter_button1_style');

