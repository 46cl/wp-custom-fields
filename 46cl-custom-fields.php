<?php
/*
Plugin Name: 46cl - Custom Fields
Plugin URI:  https://github.com/46cl/wp-custom-fields
Description: Custom fields created by 46cl for Wordpress
Version:     0.1.0
Author:      46cl
Author URI:  http://46cl.fr
*/

require_once __DIR__ . '/vendor/autoload.php';
Qscl\CustomFields\CustomFields::load();
