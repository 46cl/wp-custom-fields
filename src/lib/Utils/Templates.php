<?php

namespace Qscl\CustomFields\Utils;

use League\Plates\Engine as Plates;

class Templates {

    static private $templates = null;

    static public function render($file, $data = [])
    {
        self::init();
        return self::$templates->render($file, $data);
    }

    static private function init() {
        if (self::$templates === null) {
            self::$templates = new Plates;

            self::$templates->setFileExtension('tpl.php');

            self::$templates->addFolder('src', Plugin::getPath() . '/src/templates');
            self::$templates->addFolder('assets', Plugin::getPath() . '/assets/templates');

            self::$templates->registerFunction('toDataAttr', function($data) {
                return htmlspecialchars(json_encode($data));
            });
        }
    }

}
