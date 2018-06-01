// @ngInject
module.exports = ($rootScope) => {

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

        document.querySelector('body').style.backgroundColor = toState.data.backgroundColor;
        document.getElementById('page-loading').classList.add("remove");

    });


    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

        document.getElementById('page-loading').classList.add("hide");

    });


    $rootScope.stopGuide = () => {
        introJs().exit();
    };

    $rootScope.showGuide = () => {
        introJs().start();
    };
};