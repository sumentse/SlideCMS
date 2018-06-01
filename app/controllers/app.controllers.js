if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'app.controllers';
}

((window, angular, undefined) => {
    // @ngInject
    angular.module('app.controllers', [
            require('./administration/administration.module'),
            require('./client/client.module'),
            require('./components/component.module')
        ])
	    .controller('signup.controller', require('./signup.controller'))


})(window, window.angular);
