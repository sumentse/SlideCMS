// @ngInject
module.exports = ($scope, $state, myProfile, config) => {

    $scope.adminState = {
        $state,
        collapsingMenuName: '',
        isNavCollapsed: true,
        applicationName: config.applicationName
    };

    $scope.toggleMenuCollapse = ($event, collapsingMenuName) => {
        $event.preventDefault();
        if ($scope.adminState.collapsingMenuName === collapsingMenuName) {
            angular.extend($scope.adminState, {
                collapsingMenuName: ''
            });
        } else {
            angular.extend($scope.adminState, {}, {
                collapsingMenuName
            });
        }
    };


};