<?php

namespace Qscl\CustomFields\Utils;

/**
 * Provide information about the plugin.
 */
class Plugin {

    const SYSTEM_PATH = 0;
    const HTTP_PATH = 1;

    /**
     * Compute the system or HTTP path of the plugin directory.
     * @param  int $pathType The type of path you want to get: `::SYSTEM_PATH` or `::HTTP_PATH`.
     * @return string
     */
    static public function getPath($pathType = self::SYSTEM_PATH)
    {
        $pluginBasename = explode('/', plugin_basename( __FILE__ ))[0];

        if ($pathType == self::SYSTEM_PATH) {
            return WP_CONTENT_DIR . '/plugins/' . $pluginBasename;
        } else if ($pathType == self::HTTP_PATH) {
            return plugins_url() . '/' . $pluginBasename;
        }
    }

}
