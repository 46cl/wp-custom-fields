<?php

namespace Qscl\CustomFields;

use Qscl\CustomFields\Utils\JSONParams;
use Qscl\CustomFields\Utils\Plugin;
use Qscl\CustomFields\Utils\Templates;

class CustomFields
{

    static private $renderedOnce = false;
    static private $originalDirname;

    static public function load()
    {
        // Enqueue the assets required by the class
        add_action('admin_enqueue_scripts', function() { self::enqueueAssets(); });

        // Register API endpoints
        add_action('wp_ajax_upload_box', function() { self::uploadAjax(); });
        add_action('wp_ajax_post_box', function() { self::postAjax(); });

        // Decode the POST parameters
        add_action('wp_loaded', function() {
            JSONParams::decodeAll();
        });
    }

    static public function sequential($name, $data, $fields, $options = array(), $returnHtml = false)
    {
        $output = self::init($returnHtml);

        $options = array_merge(array(
            'layout' => 'classic'
        ), $options);

        $output .= self::render($name, 'src::sequential', array(
            'name' => $name,
            'data' => $data,
            'fields' => $fields,
            'options' => $options,
        ));

        if (!$returnHtml) echo $output;

        $output .= self::destroy($returnHtml);

        if ($returnHtml) return $output;
    }

    static public function upload($name, $data, $options = array(), $returnHtml = false)
    {
        $output = self::init($returnHtml);

        $output .= self::render($name, 'src::upload', array(
            'name' => $name,
            'data' => $data,
            'options' => $options,
        ));

        if (!$returnHtml) echo $output;

        $output .= self::destroy($returnHtml);

        if ($returnHtml) return $output;
    }

    static public function post($name, $data, $options = array(), $returnHtml = false)
    {
        $output = self::init($returnHtml);

        $output .= self::render($name, 'src::post', array(
            'name' => $name,
            'data' => $data,
            'options' => $options,
        ));

        if (!$returnHtml) echo $output;

        $output .= self::destroy($returnHtml);

        if ($returnHtml) return $output;
    }

    static public function color($name, $data, $options = array(), $returnHtml = false)
    {
        $output = self::init($returnHtml);

        $output .= self::render($name, 'src::color', array(
            'name' => $name,
            'data' => $data,
            'options' => $options,
        ));

        if (!$returnHtml) echo $output;

        $output .= self::destroy($returnHtml);

        if ($returnHtml) return $output;
    }

    static private function render($name, $tpl, $data)
    {
        return JSONParams::register($name) . Templates::render($tpl, $data);
    }

    static private function uploadAjax()
    {
        $id = wp_unslash($_POST['id']);
        $fileUrl = wp_get_attachment_url($id);
        header('Content-type: application/json');
        die(json_encode($fileUrl));
    }

    static private function postAjax()
    {
        global $polylang;
        header('Content-type: application/json');

        $response = null;
        $id = @wp_unslash($_POST['id']);
        $permalink = @wp_unslash($_POST['permalink']);

        if (!empty($id) || !empty($permalink)) {
            $langs = null;

            if (isset($polylang)) {
                $langs = implode(',', array_map(function($lang) {
                    return $lang->slug;
                }, $polylang->model->get_languages_list()));
            }

            $query = array(
                'post_type' => array_keys(get_post_types()),
                'post_status' => 'any',
                'nopaging' => true,
                'update_post_term_cache' => false,
                'update_post_meta_cache' => false,
                'suppress_filters' => true,
                'lang' => $langs,
            );

            if (!empty($id)) {
                $query['p'] = intval($id);
            }

            $posts = get_posts($query);

            if (!empty($permalink)) {
                $posts = array_filter($posts, function($post) use ($permalink) {
                    return get_permalink($post->ID) == $permalink;
                });

                $posts = array_values($posts);
            }

            $response = array(
                'id' => @$posts[0]->ID,
                'title' => @$posts[0]->post_title
            );
        }

        die(json_encode($response));
    }

    static private function enqueueAssets()
    {
        // Wordpress dependencies

        $jqueryUiDeps = [
            'jquery-ui-core',
            'jquery-ui-widget',
            'jquery-ui-position',
            'jquery-ui-button',
            'jquery-ui-mouse',
            'jquery-ui-draggable',
            'jquery-ui-sortable',
        ];

        wp_enqueue_style('editor-buttons');
        array_map('wp_enqueue_script', $jqueryUiDeps);
        wp_enqueue_media();

        // External dependencies

        wp_enqueue_script('boxes-angular', 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.13/angular.min.js');
        wp_enqueue_script(
            'boxes-ui-sortable',
            'https://cdnjs.cloudflare.com/ajax/libs/angular-ui-sortable/0.13.3/sortable.min.js',
            $jqueryUiDeps
        );

        wp_enqueue_style(
            'boxes-colorpicker',
            Plugin::getPath(Plugin::HTTP_PATH) . '/assets/stylesheets/vendor/jquery.colorpicker.css'
        );
        wp_enqueue_script(
            'boxes-colorpicker',
            Plugin::getPath(Plugin::HTTP_PATH) . '/assets/scripts/vendor/jquery.colorpicker.js',
            $jqueryUiDeps
        );
        wp_enqueue_script(
            'boxes-colorpicker-pantone',
            Plugin::getPath(Plugin::HTTP_PATH) . '/assets/scripts/vendor/jquery.colorpicker.pantone.js'
        );

        // Internal dependencies

        wp_enqueue_style('boxes-admin', Plugin::getPath(Plugin::HTTP_PATH) . '/assets/stylesheets/boxes.css');
        wp_enqueue_script('boxes-admin', Plugin::getPath(Plugin::HTTP_PATH) . '/assets/scripts/boxes.js');
    }

    static private function init($returnHtml = false)
    {
        // Open a wrapper used to bootstrap the boxes inside
        $output = '<div boxes-bootstrap>';

        // Load Angular templates
        $output .= Templates::render('assets::templates');

        // First rendering
        if (!self::$renderedOnce) {
            self::$renderedOnce = true;

            // Declare a new WP editor, never output it. This allows to output the default set of TinyMCE options.
            // The default set will be accessible in JS with `tinyMCEPreInit.mceInit.__boxes_defaults`.
            // See: https://github.com/WordPress/WordPress/blob/00e4f35300720d13895adafa51361d9bb9f7c93b/wp-includes/class-wp-editor.php#L639
            ob_start();
            wp_editor('hello', '__boxes_defaults');
            ob_end_clean();
        }

        if ($returnHtml) {
            return $output;
        } else {
            echo $output;
            return '';
        }
    }

    static private function destroy($returnHtml = false)
    {
        // Close the wrapper
        $output = '</div>';

        if ($returnHtml) {
            return $output;
        } else {
            echo $output;
            return '';
        }
    }

}
