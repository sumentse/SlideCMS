if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'component.module';
}

((window, angular, undefined) => {
    // @ngInject
    angular.module('component.module', [])
        .controller('component.slide.add', require('./slide.add'))
        .controller('component.error', require('./error'))
        .controller('component.deletionBox', require('./deletionBox'))
        .controller('component.confirmationBox', require('./confirmationBox'))
        .controller('component.versionHistory', require('./versionHistory'))
        .controller('component.downloadHistory', require('./downloadHistory'))

})(window, window.angular);