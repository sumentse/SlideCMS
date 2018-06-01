if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'client.module';
}

((window, angular, undefined) => {
    // @ngInject
    angular.module('client.module', [])
    	.controller('client.controller', require('./components/client.controller'))
    	.controller('client.home', require('./components/client.home'))
    	.controller('client.view', require('./components/client.view'))
    	.controller('client.slides', require('./components/client.slides'))
    	.controller('client.slides.edit', require('./components/client.slides.edit'))
    	
})(window, window.angular);
