if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'administration.module';
}

((window, angular, undefined) => {
    // @ngInject
    angular.module('administration.module', [])
    	.controller('administration.controller', require('./components/administration.controller'))
    	.controller('administration.dashboard', require('./components/administration.dashboard'))
    	.controller('administration.settings', require('./components/administration.settings'))
    	.controller('administration.slides', require('./components/administration.slides'))
        .controller('administration.slides.edit', require('./components/administration.slides.edit'))
    	.controller('administration.users', require('./components/administration.users'))
        .controller('administration.users.edit', require('./components/administration.users.edit'))
        
})(window, window.angular);
