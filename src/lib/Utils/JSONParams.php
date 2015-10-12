<?php

namespace Qscl\CustomFields\Utils;

/**
 * Manipulate POST parameters to easily decode JSON values.
 * The custom fields can send JSON values, this class helps to decode those values to PHP's native types.
 */
class JSONParams {

    const PARAM_LIST_NAME = '_46cl-custom-fields';

    static private $decoded = false;

    /**
     * Register a POST parameter as a JSON value.
     * @param string $name The name of the POST parameter.
     */
    static public function register($name)
    {
        return '<input type="hidden" name="' . self::PARAM_LIST_NAME . '[]" value="' . $name . '">';
    }

    /**
     * Decode the registered parameters.
     */
    static public function decodeAll()
    {
        if (self::$decoded) return;
        self::$decoded = true;

        $params = @$_POST[self::PARAM_LIST_NAME] ?: [];

        foreach ($params as $paramName) if (isset($_POST[$paramName])) {
            $_POST[$paramName] = self::decodeJSON($_POST[$paramName]);
        }
    }

    /**
     * Checks if a string is a valid JSON object and decodes it.
     * @param string $value The string to analyze.
     * @return string Returns the decoded object if the value was a valid JSON object or, otherwise, the original
     * value.
     */
    static private function decodeJSON($value)
    {
        if (is_string($value)) {
            $value = stripslashes($value); // I hate you Wordpress, really.
            $firstChar = substr($value, 0, 1);

            if ($firstChar == '{' || $firstChar == '[') { // Fast checking
                $jsonValue = json_decode($value);

                if (is_object($jsonValue) || is_array($jsonValue)) { // Be sure it's a JSON object
                    return $jsonValue;
                }
            }
        }

        return $value;
    }

}
