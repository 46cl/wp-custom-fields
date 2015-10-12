<?php

namespace Qscl\CustomFields\Boxes;

use Qscl\CustomFields\Utils\JSONParams;
use Qscl\CustomFields\Utils\Templates;

abstract class BasicBox {

    protected $name;
    protected $options = [];
    protected $data = null;

    static public function create($name, array $options = [], $data = null)
    {
        new self($name, $options, $data);
    }

    public function __construct($name, array $options = [], $data = null)
    {
        $this->options = $options;
    }

    public function compile($tpl)
    {
        $jsonParamsRegistration = JSONParams::register($this->name);

        $renderedBox = Templates::render($tpl, [
            'name' => $this->name,
            'options' => $this->options,
            'data' => $this->data,
        ]);

        return $jsonParamsRegistration . $renderedBox;
    }

    public function render($tpl)
    {
        echo $this->compile($tpl);
    }

}
