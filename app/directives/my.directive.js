if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'my.directive.js';
}

((window, angular, Headroom, undefined) => {
    // @ngInject
    angular.module("my.directive.js", [])
        .directive('myEnter', () => {
            return (scope, element, attrs) => {
                element.bind("keydown keypress", (event) => {
                    if (event.which === 13) {
                        scope.$apply(() => {
                            scope.$eval(attrs.myEnter);
                        });

                        event.preventDefault();
                    }
                });
            };
        })
        .directive('customAddForm', ($state) => {
            //made this for reusability in the app
            return {
                restrict: 'EA',
                templateUrl: 'views/components/rootAddForm.html',
                link: (scope, element, attrs) => {

                    scope.characterLimit = {
                        title: 100,
                        slide_description: 385,
                        comment: 180
                    };

                    scope.cancel = () => {
                        $state.go(attrs['cancelbutton']);
                    }
                }
            }
        })
        .directive('customEditForm', ($state) => {
            //made this for reusability in the app
            return {
                restrict: 'EA',
                templateUrl: 'views/components/rootEditForm.html',
                link: (scope, element, attrs) => {

                    scope.characterLimit = {
                        title: 100,
                        slide_description: 385,
                        comment: 180
                    };

                    scope.cancel = () => {
                        $state.go(attrs['cancelbutton']);
                    }
                }
            }
        })
        .directive('previewImage', (_, Upload, $uibModal) => {
            return {
                restrict: 'E',
                scope: {
                    files: '=',
                    isImage: '@'
                },
                template: `
                    <div class="btn btn-primary ng-class:{'invisible':!isImage, 'animated fadeIn': isImage}" 
                         ng-click="previewImage()"
                    ><i class="fa fa-search"></i> <span>Preview Image</span></div>
                `,
                link: (scope, element, attrs) => {

                    scope.$watch('files', (n, o) => {
                        let [file] = _.filter(n, (file) => _.startsWith(file.type, 'image'));
                        if (!file) {
                            angular.extend(scope, {
                                isImage: false
                            });
                        } else {
                            angular.extend(scope, {
                                isImage: true
                            });
                        }
                    });

                    scope.previewImage = async() => {

                        if (!angular.isArray(scope.files)) {
                            return false
                        } else {
                            if (scope.files.length === 0) {
                                return false;
                            }
                        }

                        //filter out for an image
                        let [file] = _.filter(scope.files, (file) => _.startsWith(file.type, 'image'));

                        if (file) {


                            let imageSrc = await Upload.base64DataUrl(file);

                            let modalInstance = $uibModal.open({
                                animation: true,
                                controller: ($scope, $uibModalInstance) => {
                                    $scope.closeModal = () => {
                                        $uibModalInstance.close('close');
                                    }
                                },
                                template: `
                                    <div>
                                        <header class="modal-header">
                                            <button ng-click="closeModal()" type="button" class="close"><i class="fa fa-close"></i></button>
                                            <h3>${file.name}</h3>
                                        </header>
                                        <main class="modal-body">
                                            <img class="img-responsive" src="${imageSrc}" alt="image preview" />
                                        </main>
                                        <footer class="modal-footer">
                                            <div class="pull-right">
                                                <button class="btn btn-danger" ng-click="closeModal()">Close</button>
                                            </div>
                                        </footer>
                                    </div>
                                `,
                                size: "lg"
                            });

                        } else {
                            angular.extend(scope, {
                                isImage: false
                            });
                        }


                    };

                }
            }
        })
        .directive('imageonload', (CONST) => {
            return {
                restrict: 'A',
                link: (scope, element, attrs) => {
                    element.bind('error', () => {
                        element.attr('src', CONST.noImagePath);
                    });
                }
            };
        })
        .directive('searchWidget', ($window) => {
            return {
                restrict: 'A',
                link: (scope, element, attrs) => {

                    let destroyBindings = () => {
                        angular.element($window).unbind('click');
                    };

                    scope.$watch(attrs['searchWidget'], (value) => {
                        if (value) {
                            angular.element($window).bind('click', (e) => {


                                if (!element[0].contains(e.target)) {

                                    scope.$apply(() => scope.closeSearchWidget());


                                }

                            });


                        } else {
                            destroyBindings();
                        }
                    });

                    scope.$on('$destroy', destroyBindings());


                }
            };
        })
        .directive('uppercaseOnly',
            () => {
                return {
                    restrict: 'A',
                    require: 'ngModel',
                    link: (scope, element, attrs, ctrl) => {
                        element.on('keypress', (e) => {
                            var char = e.char || String.fromCharCode(e.charCode);
                            if (!/^[A-Z0-9]$/i.test(char)) {
                                e.preventDefault();
                                return false;
                            }
                        });

                        let parser = (value) => {
                            if (ctrl.$isEmpty(value)) {
                                return value;
                            }
                            var formatedValue = value.toUpperCase();
                            if (ctrl.$viewValue !== formatedValue) {
                                ctrl.$setViewValue(formatedValue);
                                ctrl.$render();
                            }
                            return formatedValue;
                        }

                        let formatter = (value) => {
                            if (ctrl.$isEmpty(value)) {
                                return value;
                            }
                            return value.toUpperCase();
                        }

                        ctrl.$formatters.push(formatter);
                        ctrl.$parsers.push(parser);
                    }
                };
            }
        )
        .directive('headroom', function() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div ng-transclude></div>',
                link: function(scope, element, attrs) {
                    var headroom, options;

                    var setupOptions = function() {
                        if (options)
                            return;

                        options = [];
                        angular.forEach(Headroom.options, function(value, key) {
                            if (key == 'classes' && attrs[key]){
                                options[key] = angular.fromJson(attrs[key]);
                            }
                            else
                                options[key] = attrs[key] || Headroom.options[key];
                        });

                        if (attrs.onPin) {
                            options.onPin = function() {
                                scope.$apply(attrs.onPin);
                            };
                        }
                        if (attrs.onUnpin) {
                            options.onUnpin = function() {
                                scope.$apply(attrs.onUnpin);
                            };
                        }
                        if (attrs.onTop) {
                            options.onTop = function() {
                                scope.$apply(attrs.onTop);
                            };
                        }
                        if (attrs.onNotTop) {
                            options.onNotTop = function() {
                                scope.$apply(attrs.onNotTop);
                            };
                        }
                    };

                    var initialize = function() {
                        setupOptions();
                        headroom = new Headroom(element[0], options);
                        headroom.init();
                    };

                    var destroy = function() {
                        if (headroom){
                            headroom.destroy();
                        }
                        
                    };

                    attrs.$observe('disabled', function(value) {
                        if (angular.isUndefined(value))
                            return;

                        if (value === true)
                            destroy();
                        else
                            initialize();
                    });

                    scope.$on('$destroy', function() {
                        destroy();
                    });
                }
            };
        });

})(window, window.angular, window.Headroom);