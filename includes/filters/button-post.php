/**
 * Generate one (or more) custom filter buttons based on ACF fields:
 *  - custom_filter_category (select of category slugs)
 *  - custom_filter_tag      (select of tag slugs)
 */
function custom_filter_button_for_post( $post_id ) {
    // 1) Get categories from ACF (slug or array of slugs)
    $cat_raw = get_field( 'custom_filter_category', $post_id );
    if ( empty( $cat_raw ) ) {
        $cat_slugs = [];
    } elseif ( is_array( $cat_raw ) ) {
        $cat_slugs = $cat_raw;
    } else {
        $cat_slugs = [ $cat_raw ];
    }

    // 2) Get tags from ACF (slug or array of slugs)
    $tag_raw = get_field( 'custom_filter_tag', $post_id );
    if ( empty( $tag_raw ) ) {
        $tag_slugs = [];
    } elseif ( is_array( $tag_raw ) ) {
        $tag_slugs = $tag_raw;
    } else {
        $tag_slugs = [ $tag_raw ];
    }

    // 3) If both are empty, fall back to the post's first category
    if ( empty( $cat_slugs ) && empty( $tag_slugs ) ) {
        $cats = get_the_category( $post_id );
        if ( ! empty( $cats ) && ! is_wp_error( $cats ) ) {
            $cat_slugs = [ $cats[0]->slug ];
        }
    }

    // 4) Merge & unique
    $slugs = array_unique( array_merge( $cat_slugs, $tag_slugs ) );
    if ( empty( $slugs ) ) {
        return ''; // nothing to show
    }

    // 5) Build buttons
    $output = '';
    foreach ( $slugs as $slug ) {
        // try category
        $term = get_term_by( 'slug', $slug, 'category' );
        // if not a category, try tag
        if ( ! $term ) {
            $term = get_term_by( 'slug', $slug, 'post_tag' );
        }
        if ( ! $term || is_wp_error( $term ) ) {
            continue; // skip invalid slugs
        }

        $filter_attr = esc_attr( $term->taxonomy . '___' . $term->term_id );
        $label       = esc_html( $term->name );

        $output   .= sprintf(
            '<button class="caf-custom-filter-btn" data-filter="%1$s" data-taxonomy="%2$s" data-term-id="%3$s" data-slug="%4$s">%5$s</button>',
            $filter_attr,
            esc_attr( $term->taxonomy ),
            esc_attr( $term->term_id ),
            esc_attr( $term->slug ),
            $label
        );
    }

    return $output;
}

// Shortcode remains unchanged:
function custom_filter_buttons_shortcode() {
    global $post;
    if ( empty( $post ) ) {
        return '';
    }
    return custom_filter_button_for_post( $post->ID );
}
add_shortcode( 'custom_filter_buttons', 'custom_filter_buttons_shortcode' );
