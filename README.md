__This project is currently a work in progress. Expect breaking API changes!__

# 46cl - Custom Fields

## Upload box

Outputs an upload button which uses the media modal:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $options An array of options
 */
function upload($name, $data, $options = array())
```

Usage example:

```php
Qscl\CustomFields\CustomFields::upload(
    'my_upload_file',
    get_post_meta($post->ID, 'my_upload_file', true),
    array(

        /**
         * Defines the text used for the button.
         * Defaults to: "Ajouter une image"
         */
        'label' => 'Add a new file',

        /**
         * Defines if the modal should be automatically opened on box
         * addition. This is effective only when used in sequential boxes.
         * Defaults to: false
         */
        'openModalOnAddition' => true,

    )
);
```

## Post box

Outputs a field allowing to select a post with the modal used by the editor when adding a new link in the content:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $options An array of options
 */
function post($name, $data, $options = array())
```

Usage example:

```php
Qscl\CustomFields\CustomFields::post(
    'my_linked_post',
    get_post_meta($post->ID, 'my_linked_post', true),
    array(

        /**
         * Defines the text used for the label and the modal title.
         * Defaults to: "Ajouter une image"
         */
        'label' => 'Add a new file',

        /**
         * Defines if the modal should be automatically opened on box
         * addition. This is effective only when used in sequential boxes.
         * Defaults to: false
         */
        'openModalOnAddition' => true,

        /**
         * Should we hide the label?
         * Defaults to: false
         */
        'hideLabel' => true,

    )
);
```

## Color box

Outputs a component used to choose a color:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $options An array of options
 */
function post($name, $data, $options = array())
```

Usage example:

```php
Qscl\CustomFields\CustomFields::color(
    'my_color',
    get_post_meta($post->ID, 'my_color', true),
    array(

        /**
         * Defines the text used for the label.
         * Defaults to: "Sélectionner une couleur"
         */
        'label' => 'Add a new file',

        /**
         * A set of options handled by the jQuery.Colorpicker library.
         * Defaults to: []
         * @see http://vanderlee.github.io/colorpicker/ jQuery.Colorpicker's documentation
         */
        'jquery.colorpicker' => [
            // The following part is a custom one created for this project and
            // provides another presentation for swatches, feel free to use it
            // if necessary.
            'parts' => ['swatcheslist']
        ],

    )
);
```

## Sequential boxes

Outputs a UI allowing the user to add multiple times a predefined set of fields:

```php
/**
 * @param  {string} $name    The name of the input
 * @param  {array}  $data    The data
 * @param  {array}  $fields  An array of fields
 * @param  {array}  $options An array of options
 */
function sequential($name, $data, $fields, $options = array())
```

Usage example:

```php
Qscl\CustomFields\CustomFields::sequential(
    'my_sequential_boxes',
    get_post_meta($post->ID, 'my_sequential_boxes', true),
    array(

        /**
         * An input[type=text]
         */
        array(
            'type' => 'text',
            'name' => 'my_input_text',
            'label' => 'My input text'
        ),

        /**
         * A textarea
         */
        array(
            'type' => 'textarea',
            'name' => 'my_textarea',
            'label' => 'My textarea'
        ),

        /**
         * A WP editor
         */
        array(
            'type' => 'wysiwyg',
            'name' => 'my_wysiwyg'
        ),

        /**
         * An upload box
         */
        array(
            'type' => 'upload',
            'name' => 'my_upload_box',
            'options' => array(
                'label' => 'My upload box',
                'openModalOnAddition' => true
            )
        ),

        /**
         * A post box
         */
        array(
            'type' => 'post',
            'name' => 'my_post_box',
            'options' => array(
                'label' => 'My post box',
                'openModalOnAddition' => true,
                'hideLabel' => true
            )
        ),

    ),
    array(

        /**
         * The layout to use between "classic" and "large".
         * Defaults to: "classic"
         */
        'layout' => 'large',

        /**
         * A maximum of sequential boxes the user can add.
         * Defaults to: null
         */
        'max' => 10,

    )
);
```
