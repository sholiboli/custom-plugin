add_shortcode('filter-button-page', function($atts, $content = '') {
    $atts = shortcode_atts([
        'taxonomy'   => '',
        'term_id'    => 0,
        'slug'       => '',
        'target_div' => 'data-target-div1',
        'mode'       => 'multi',
        'class'      => '',
        'show_count' => '1',  // ← new toggle attribute
    ], $atts, 'filter-button-page');

    // sanitize inputs
    $tax       = sanitize_text_field( $atts['taxonomy'] );
    $term_id   = intval( $atts['term_id'] );
    $slug      = sanitize_text_field( $atts['slug'] );
    $show      = filter_var( $atts['show_count'], FILTER_VALIDATE_BOOLEAN );

    if ( ! $tax ) {
        return ''; // taxonomy is mandatory
    }

    // If no term_id but a slug is provided, look up the term
    if ( ! $term_id && $slug ) {
        $term_obj = get_term_by( 'slug', $slug, $tax );
        if ( $term_obj && ! is_wp_error( $term_obj ) ) {
            $term_id = $term_obj->term_id;
        }
    }

    if ( ! $term_id ) {
        return ''; // still no valid term
    }

    // fetch term
    $term = get_term( $term_id, $tax );
    if ( is_wp_error($term) || ! $term ) {
        return '';
    }

    // determine post type
    global $caf_cpt_value;
    $post_type = ! empty( $caf_cpt_value ) ? $caf_cpt_value : 'post';

    //────────────────────────────────────────────────
    // TRANSIENT‐WRAPPED COUNT (caches for 15 minutes)
    //────────────────────────────────────────────────
    $cache_key = sprintf( 'caf_count_%s_%d_%s', $tax, $term_id, $post_type );
    $count     = get_transient( $cache_key );
    if ( false === $count ) {
        $post_ids = get_posts([
            'post_type'      => $post_type,
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'tax_query'      => [[
                'taxonomy' => $tax,
                'field'    => 'term_id',
                'terms'    => $term_id,
            ]],
        ]);
        $count = is_array($post_ids) ? count($post_ids) : 0;
        set_transient( $cache_key, $count, 15 * MINUTE_IN_SECONDS );
    }
    //────────────────────────────────────────────────

    // build attributes
    $filter_attr = esc_attr( "{$tax}___{$term_id}" );
    $classes     = 'caf-custom-filter-btn ' . esc_attr( $atts['class'] );
    $label       = do_shortcode( $content );
    $slug_attr   = esc_attr( $term->slug );

    // assemble the link
    $html  = sprintf(
        '<a href="#" class="%1$s"
            data-filter="%2$s"
            data-taxonomy="%3$s"
            data-term-id="%4$s"
            data-slug="%5$s"
            data-target-div="%6$s"
            data-mode="%7$s">%8$s',
        $classes,
        $filter_attr,
        esc_attr($tax),
        esc_attr($term_id),
        $slug_attr,
        esc_attr($atts['target_div']),
        esc_attr($atts['mode']),
        $label
    );

    // append count bubble only if show_count is true
    if ( $show ) {
        $html .= sprintf(
            '<span class="post_count" aria-label="%1$s">%2$s</span>',
            esc_attr__('Number of posts in this filter', 'your-textdomain'),
            intval($count)
        );
    }

    // close tag
    $html .= '</a>';

    return $html;
});
