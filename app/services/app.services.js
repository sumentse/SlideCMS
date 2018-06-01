if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'app.services';
}

((window, angular, undefined) => {
    // @ngInject
    angular.module('app.services', [])
        .provider('spService', require('./spRest.service'))
        .provider('spFolder', require('./spFolder.service'))
        .provider('email', require('./email.service'))
        .factory('IE', () => {

            return {
                version: () => {
                    let rv = -1;
                    let ua, re;
                    if (navigator.appName == 'Microsoft Internet Explorer') {
                        ua = navigator.userAgent;
                        re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                        if (re.exec(ua) != null)
                            rv = parseFloat(RegExp.$1);
                    } else if (navigator.appName == 'Netscape') {
                        ua = navigator.userAgent;
                        re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
                        if (re.exec(ua) != null)
                            rv = parseFloat(RegExp.$1);
                    }
                    return rv;

                }
            }

        })
        .factory('_', () => require('lodash'))

})(window, window.angular);