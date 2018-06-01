if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'app.directives';
}

((window, angular, undefined) => {
    // @ngInject
    require("angular-timeago");

    angular.module("app.directives", [
            require("angular-ui-router"),
            require("angular-smart-table"),
            require("ng-file-upload"),
            require("angular-ui-bootstrap"),
            require("angular-animate"),
            require("./stTableCustom"),
            require("./my.directive"),
            require("angular-sanitize"),
            'yaru22.angular-timeago'
        ])

     
})(window, window.angular);