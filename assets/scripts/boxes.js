jQuery(function($) {

    'use strict';

    var wpAdmin = angular.module('wp-admin', ['ui.sortable']);

    wpAdmin.config(['$interpolateProvider', '$httpProvider', function($interpolateProvider, $httpProvider) {
        // Avoid Twig conflicts
        $interpolateProvider.startSymbol('((').endSymbol('))');

        // Post data as form data because Wordpress doesn't support JSON
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        $httpProvider.defaults.transformRequest = function(obj) {
            var encodedStr = [];
            $.each(obj || {}, function(key, value) {
                encodedStr.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            });
            return encodedStr.join('&');
        };
    }])

    /*
     * Sequential boxes
     */

    wpAdmin.factory('$sequentialBoxes', function() {
        var itemJustAdded = false;

        return {
            get itemJustAdded() {
                var cache = itemJustAdded;
                itemJustAdded = false;
                return cache;
            },

            set itemJustAdded(value) {
                itemJustAdded = value;
            }
        };
    });

    wpAdmin.directive('sequentialBoxes', ['$sequentialBoxes', function($sequentialBoxes) {

        function link(scope) {

            scope.data = [];

            try {
                var data = JSON.parse(scope.dataTxt);
                // Return empty array if meta data is corrupted
                if (!Array.isArray(data)) {
                    scope.data = [];
                }
                // Parse the data instead of using two-way binding because UI.sortable can't reorder a two-way binded
                // array directly outputted in the HTML code
                else {
                    scope.data = data;
                }
            } catch(e) {}

            scope.add = function() {
                if (angular.isDefined(scope.options.max) && scope.data >= scope.options.max) {
                    return;
                }

                $sequentialBoxes.itemJustAdded = true;
                scope.data.push({});
            };

            scope.remove = function(dataSet) {
                var index = scope.data.indexOf(dataSet);
                scope.data.splice(index, 1);
            };

        }

        return {
            restrict: 'E',
            scope: {
                name: '@',
                fields: '=',
                options: '=',
                dataTxt: '@data'
            },
            templateUrl: 'sequential-boxes.html',
            link: link
        };

    }]);

    /*
     * WP Editor
     */

    wpAdmin.directive('wpEditor', function() {

        var link = function(scope, element, attrs, NgModelCtrl) {
            var id = 'boxes-wysiwyg-' + (new Date).getTime();
            element.find('textarea').attr('id', id);

            // Retrieve the current data
            scope.$watch(NgModelCtrl, function() {
                scope.text = NgModelCtrl.$modelValue;
            });

            // Initialize the editor, based on this repository: https://github.com/hezachary/wordpress-wysiwyg-widget
            setTimeout(function() {
                tinymce.execCommand('mceRemoveEditor', true, id);

                var initParams = tinymce.extend(tinyMCEPreInit.mceInit.__boxes_defaults, {
                    selector: '#' + id,
                    setup: function(editor) {
                        editor.on('change', function(e) {
                            scope.$apply(function() {
                                scope.text = editor.getContent();
                                NgModelCtrl.$setViewValue(scope.text);
                            });
                        });
                    }
                });

                tinymce.init(initParams);
            }, 0);

        };

        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            scope: {},
            templateUrl: 'wp-editor.html',
            link: link
        };

    });

    /*
     * Upload box
     */

    wpAdmin.directive('uploadBox', ['$http', '$timeout', '$sequentialBoxes', function($http, $timeout, $sequentialBoxes) {

        var filesExtensions = {
            archive: ['bz2', 'cab', 'dmg', 'gz', 'rar', 'sea', 'sit', 'sqx', 'tar', 'tgz', 'zip', '7z'],
            audio: [
                'aac', 'ac3', 'aif', 'aiff', 'm3a', 'm4a', 'm4b', 'mka', 'mp1', 'mp2', 'mp3', 'ogg', 'oga', 'ram',
                'wav', 'wma'
            ],
            code: ['css', 'htm', 'html', 'php', 'js'],
            document: [
                'doc', 'docx', 'docm', 'dotm', 'odt', 'pages', 'pdf', 'xps', 'oxps', 'rtf', 'wp', 'wpd', 'psd', 'xcf'
            ],
            image: ['jpg', 'jpeg', 'jpe', 'gif', 'png', 'bmp', 'tif', 'tiff', 'ico'],
            interactive: ['swf', 'key', 'ppt', 'pptx', 'pptm', 'pps', 'ppsx', 'ppsm', 'sldx', 'sldm', 'odp'],
            spreadsheet: ['numbers', 'ods', 'xls', 'xlsx', 'xlsm', 'xlsb'],
            text: ['asc', 'csv', 'tsv', 'txt'],
            video: [
                '3g2', '3gp', '3gpp', 'asf', 'avi', 'divx', 'dv', 'flv', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg',
                'mpv', 'ogm', 'ogv', 'qt', 'rm', 'vob', 'wmv'
            ]
        };

        /**
         * A wrapper to manage the media modal
         */
        function newFrame(callback) {
            var frame = wp.media({
                title: 'Sélectionner un fichier',
                // library: { type: 'image' },
                multiple: false
            });

            frame.state('library').on('select', function () {
                var image = this.get('selection').first().toJSON();
                callback(image.id, image.url);
            });

            return frame;
        }

        function link(scope, element, attrs, NgModelCtrl) {

            /**
             * Return the url of the picture (picture or icon in function of the type of file)
             */
            function setUrlPicture(url) {
                if (angular.isDefined(url)) {
                    var fileExtension = url.split('.').pop();

                    for (var type in filesExtensions) {
                        if (filesExtensions[type].indexOf(fileExtension) != -1) {
                            if (type == "image") {
                                scope.file.iconUrl = url;
                                scope.file.name = "";
                            } else {
                                var iconsDir = location.href.slice(0, location.href.indexOf('wp-admin'))
                                             + 'wp-includes/images/media/';

                                scope.file.iconUrl = iconsDir + type + '.png';
                                scope.file.name = url.split('/').pop();
                            }
                        }
                    }
                } else {
                    scope.file.iconUrl = url;
                    scope.file.name = "";
                }
            }

            function select(id, url) {
                $timeout(function() {
                    scope.file.id = id;

                    // Update the model value
                    if (scope.binded) NgModelCtrl.$setViewValue(id);

                    // Retrieve the URL if necessary
                    if (id !== undefined && !url) {
                        $http.post('/wp-admin/admin-ajax.php', {
                            action: 'upload_box',
                            id: id
                        }).success(setUrlPicture);
                    } else {
                        setUrlPicture(url);
                    }
                });
            }

            scope.frame = null;
            scope.binded = angular.isDefined(attrs.ngModel);

            // Elements of the file
            scope.file = {
                id: null,
                name: null,
                iconUrl: null,
            };

            // Manage options
            scope.options = {
                label: 'Ajouter une image',
                openModalOnAddition: false
            };

            try {
                scope.options = $.extend(scope.options, JSON.parse(attrs.options));
            } catch(e) {}

            // Retrieve the current data
            if (scope.binded) {
                scope.$watch(NgModelCtrl, function() {
                    select(NgModelCtrl.$modelValue);
                });
            } else {
                try {
                    var id = JSON.parse(attrs.value) || null;
                    id = isNaN(parseInt(id)) ? undefined : parseInt(id);
                    select(id);
                } catch(e) {
                    select();
                }
            }

            // Create a function to open a new modal
            scope.openModal = function() {
                scope.frame = scope.frame || newFrame(select);
                scope.frame.open();
            };

            scope.reset = function() {
                delete scope.file.id;
                if (scope.binded) NgModelCtrl.$setViewValue(undefined);
            };

            // If the `openModalOnAddition` is set to `true`, open the modal when an item is added.
            if (scope.options.openModalOnAddition && $sequentialBoxes.itemJustAdded) {
                $timeout(function() {
                    scope.openModal();
                });
            }

        }

        return {
            restrict: 'E',
            replace: true,
            require: '?ngModel',
            scope: {
                name: '@'
            },
            templateUrl: 'upload-box.html',
            link: link
        };

    }]);

    /*
     * Post box
     */

    wpAdmin.directive('postBox', [
        '$rootScope', '$http', '$timeout', '$sce', '$sequentialBoxes',
        function($rootScope, $http, $timeout, $sce, $sequentialBoxes) {

            var lastInputId = 0;

            // Alter the wpLink API to intercept the `close` and `update` “events”
            ['update', 'close'].forEach(function(eventName) {
                wpLink[eventName] = (function(eventCallback) {
                    return function() {
                        $rootScope.$emit('postBox:' + eventName);
                        eventCallback();
                    };
                })(wpLink[eventName]);
            });

            function link(scope, element, attrs, NgModelCtrl) {

                scope.binded = angular.isDefined(attrs.ngModel);
                scope.inputId = 'post-box-' + lastInputId++;

                // Manage options
                scope.options = {
                    label: 'Sélectionner un contenu',
                    hideLabel: false,
                    openModalOnAddition: false
                };

                try {
                    scope.options = $.extend(scope.options, JSON.parse(attrs.options));
                } catch(e) {}

                // Create a wrapper to manage the wpLink modal
                scope.modal = {

                    $modal: $('#wp-link-wrap'),
                    $title: $('#wp-link-wrap #link-modal-title').contents()[0],
                    $search: $('#wp-link-wrap #search-field'),
                    $submit: $('#wp-link-wrap #wp-link-submit'),

                    opened: false,

                    open: function() {
                        this.opened = true;

                        this.originalStates = {
                            searchPanelWasVisible: this.$modal.hasClass('search-panel-visible'),
                            title: this.$title.textContent,
                            submit: this.$submit.val()
                        };

                        this.$modal.addClass('search-panel-visible post-box-modal');
                        wpLink.open(scope.inputId);

                        this.$title.textContent = scope.options.label;
                        this.$submit.val('Valider');
                        this.$search.focus();
                    },

                    update: function() {
                        if (!this.opened) {
                            return;
                        }

                        scope.loading = true;

                        var formPost = wpLink.getAttrs();

                        // Retrieve the ID of the post
                        $http.post('/wp-admin/admin-ajax.php', {
                            action: 'post_box',
                            permalink: formPost.href
                        }).success(function(post) {
                            scope.post = post;
                            scope.post.title = $sce.trustAsHtml(scope.post.title);

                            if (scope.binded) {
                                NgModelCtrl.$setViewValue(post.id);
                            }
                        }).finally(function() {
                            scope.loading = false;
                        });
                    },

                    close: function() {
                        if (!this.opened) {
                            return;
                        }

                        this.opened = false;

                        this.$modal.toggleClass('search-panel-visible', this.originalStates.searchPanelWasVisible)
                                   .removeClass('post-box-modal');

                        this.$title.textContent = this.originalStates.title;
                        this.$submit.val(this.originalStates.submit);
                    }

                };

                // Retrieve the current data
                function postFromId(id) {
                    if (typeof id != 'number' && (typeof id != 'string' || id.length == 0)) {
                        return;
                    }

                    scope.loading = true;

                    $http.post('/wp-admin/admin-ajax.php', {
                        action: 'post_box',
                        id: id
                    }).success(function(post) {
                        scope.post = post;
                        scope.post.title = $sce.trustAsHtml(scope.post.title);
                        scope.loading = false;
                    });
                }

                if (scope.binded) {
                    scope.$watch(NgModelCtrl, function() {
                        postFromId(NgModelCtrl.$modelValue);
                    });
                } else {
                    postFromId(attrs.value);
                }

                // Register a method to reset the directive state
                scope.reset = function() {
                    delete scope.post;
                    if (scope.binded) NgModelCtrl.$setViewValue(undefined);
                };

                // Listen to wpLink events
                ['update', 'close'].forEach(function(eventName) {
                    $rootScope.$on('postBox:' + eventName, function() {
                        scope.modal[eventName]();
                    });
                });

                if (scope.options.openModalOnAddition && $sequentialBoxes.itemJustAdded) {
                    $timeout(function() {
                        scope.modal.open();
                    });
                }

            }

            return {
                restrict: 'E',
                replace: true,
                require: '?ngModel',
                scope: {
                    name: '@'
                },
                templateUrl: 'post-box.html',
                link: link
            };

        }
    ]);

    /*
     * Color box
     */

    $.colorpicker.parts.swatcheslist = function(colorpicker) {

        this.init = function() {
            var $container = $(colorpicker.dialog).find('.ui-colorpicker-swatcheslist-container'),
                swatchesKey = colorpicker.options.swatches || 'html',
                swatches;

            if (angular.isString(swatchesKey)) {
                swatches = $.colorpicker.swatches[swatchesKey];
            } else {
                swatches = Object.keys(swatchesKey).map(function(name) {
                    return $.extend(swatchesKey[name], { name: name });
                });
            }

            var colorItems = swatches.map(function(swatch) {
                var rgb = ['r', 'g', 'b'].map(function(channel) {
                    return Math.round(swatch[channel] * 255);
                });

                var color = 'rgb(' + rgb.join(',') + ')';

                return [
                    '<div class="ui-colorpicker-swatch-item" data-color="' + color + '">',
                        '<div style="background-color: ' + color + '"></div>',
                        '<span>' + (swatchesKey === 'pantone' ? 'Pantone ' :  '') + swatch.name + '</span>',
                    '</div>',
                ].join('');
            }).join('');

            $container.append($('<div>').addClass('ui-colorpicker-swatcheslist').append(colorItems));

            $container.find('.ui-colorpicker-swatch-item').on('click', function(event) {
                var color = $(event.currentTarget).data('color');
                colorpicker.color = colorpicker._parseColor(color) || new $.colorpicker.Color();
                colorpicker._change();
            });
        };

    };

    $.colorpicker.parsers.CMYK = function(color) {
        var match = /^cmyk\(\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/.exec(color);

        if (match) {
            var color = new $.colorpicker.Color,
                channels = match.slice(1).map(function(channel) {
                    return channel / 100;
                });

            return color.setCMYK.apply(color, channels);
        }
    };

    $.colorpicker.writers.CMYK = function(color, colorpicker) {
        color = color.getCMYK();
        return [
            'cmyk(',
                Math.round(color.c * 100) + ',',
                Math.round(color.m * 100) + ',',
                Math.round(color.y * 100) + ',',
                Math.round(color.k * 100),
            ')',
        ].join('');
    };

    $.colorpicker.writers['CMYK%'] = function(color, colorpicker) {
        color = color.getCMYK();
        return [
            'cmyk(',
                Math.round(color.c * 100) + '%,',
                Math.round(color.m * 100) + '%,',
                Math.round(color.y * 100) + '%,',
                Math.round(color.k * 100) + '%',
            ')',
        ].join('');
    };

    wpAdmin.directive('colorBox', function() {

        function link(scope, element, attrs, NgModelCtrl) {

            scope.binded = angular.isDefined(attrs.ngModel);

            // Manage options
            scope.options = {
                label: 'Sélectionner une couleur',
                hideLabel: false,
            };

            try {
                scope.options = $.extend(scope.options, JSON.parse(attrs.options));
            } catch(e) {}

            // Instanciate the colorpicker
            var $input = element.find('input'),
                $button = element.find('button');

            var colorOptions = $.extend(true, {
                position: {
                    my: 'left top',
                    at: 'left bottom',
                    of: $button,
                }
            }, scope.options['jquery.colorpicker']);

            var colorpicker = $input.colorpicker(colorOptions).data('vanderlee-colorpicker');

            colorpicker.option('layout', $.extend(colorpicker.options.layout, {
                swatcheslist: [5, 0, 1, 5],
            }));

            // Display the colorpicker when the button is clicked
            $button.on('click', setTimeout.bind(window, colorpicker.open.bind(colorpicker)));

            // Style the buttons
            $input.on('colorpickeropen', function() {
                colorpicker.dialog.find('.ui-button').addClass('button');

                // Refresh the position
                colorpicker.dialog.position(colorpicker.options.position);
            });

            // Manage color value
            function formatsToColor(formats, formatNames) {
                if (!angular.isDefined(formats)) return;
                formatNames = formatNames || scope.options.formats;

                function validColorFilter(color) {
                    return color;
                }

                function parseFormat(format) {
                    var parsers = $.colorpicker.parsers;

                    return Object.keys(parsers).map(function(parserName) {
                        return parsers[parserName](format, colorpicker);
                    }).filter(validColorFilter)[0];
                }

                if (!Array.isArray(formatNames)) {
                    return parseFormat(formats);
                } else {
                    return Object.keys(formats).map(function(formatKey) {
                        return parseFormat(formats[formatKey]);
                    }).filter(validColorFilter)[0];
                }
            }

            function colorToFormats(colorObj, formatNames) {
                formatNames = formatNames || scope.formats;

                if (!Array.isArray(formatNames)) {
                    var writer = $.colorpicker.writers[String(formatNames).toUpperCase()];
                    return writer ? writer(colorObj, colorpicker) : null;
                } else {
                    return formatNames.reduce(function(output, formatName) {
                        output[formatName] = colorToFormats(colorObj, formatName);
                        return output;
                    }, {});
                }
            }

            function convertFormatsTo(formats, formatsNames) {
                var color = formatsToColor(formats);
                if (color) return colorToFormats(color, formatsNames);
            }

            function applyFormats(formats) {
                if (!formats) return;

                setTimeout(function() {
                    scope.colorFormats = formats;

                    var rgbColor = convertFormatsTo(formats, 'rgb');
                    scope.colorValue = rgbColor;
                    colorpicker.setColor(rgbColor);
                }, 0);
            }

            if (scope.binded) {
                scope.$watch(NgModelCtrl, function() {
                    applyFormats(NgModelCtrl.$modelValue);
                });
            } else {
                applyFormats(attrs.value);
            }

            $input.on('colorpickerselect', function(event, args) {
                var colorObj = colorpicker.color;

                scope.colorValue = $.colorpicker.writers.RGB(colorObj, colorpicker);
                scope.colorFormats = angular.isDefined(scope.options.formats)
                                   ? colorToFormats(colorObj)
                                   : '#' + args.formatted;

                if (scope.binded) NgModelCtrl.$setViewValue(scope.colorFormats);
                scope.$apply();
            });

        }

        return {
            restrict: 'E',
            replace: true,
            require: '?ngModel',
            scope: {
                name: '@'
            },
            templateUrl: 'color-box.html',
            link: link
        };

    });

    /*
     * Bootstrapping
     */

    $('[boxes-bootstrap]').each(function() {
        angular.bootstrap(this, ['wp-admin']);
    });

});
