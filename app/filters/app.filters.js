if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'app.filters';
}

((window, angular, undefined) => {
    // @ngInject
    angular.module('app.filters', [])
        .filter('bytes', () => {
            return (bytes, precision) => {
                if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
                if (typeof precision === 'undefined') precision = 1;
                let units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                    number = Math.floor(Math.log(bytes) / Math.log(1024));
                return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
            }
        })
        .filter('ellipsis', () => {
            return (text, charLimit) => {

                if (angular.isUndefined(text)) {
                    return;
                }

                if (typeof charLimit === 'undefined') {
                    return;
                }

                if (text.length > charLimit) {
                    return text.substring(0, charLimit) + '...';
                } else {
                    return text;
                }
            }
        })
        .filter('titlecase', () => {
            return (input) => {
                var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

                input = input.toLowerCase();
                return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, (match, index, title) => {
                    if (index > 0 && index + match.length !== title.length &&
                        match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
                        (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                        title.charAt(index - 1).search(/[^\s-]/) < 0) {
                        return match.toLowerCase();
                    }

                    if (match.substr(1).search(/[A-Z]|\../) > -1) {
                        return match;
                    }

                    return match.charAt(0).toUpperCase() + match.substr(1);
                });
            }
        })
        .filter('regex', () => {
            return (input, field, regex) => {
                let patt = new RegExp(regex);
                let out = [];
                for (let i = 0; i < input.length; i++) {
                    if (patt.test(input[i][field]))
                        out.push(input[i]);
                }
                return out;
            };
        });

})(window, window.angular);