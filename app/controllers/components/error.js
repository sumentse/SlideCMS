// @ngInject
module.exports = ($scope, $state, $stateParams) => {


    $scope.errorState = {
        errorCode: $stateParams.errorCode,
        redirectionPath: $stateParams.redirectionPath,
        custom: {
            errorHeader: '',
            errorMessage: '',
            buttonLabel: '',
            icon: ''
        }
    };


    if ($stateParams.redirectionPath && $stateParams.errorCode === 'custom') {

        angular.merge($scope.errorState, {
            custom: {
                errorHeader: $stateParams.errorHeader,
                errorMessage: $stateParams.errorMessage,
                buttonLabel: $stateParams.buttonLabel,
                icon: $stateParams.icon
            }
        });

    } else {

        if ($state.includes('app.client.central')) {

            angular.extend($scope.errorState, {
                redirectionPath: 'app.client.central'
            });

        } else if ($state.includes('app.administration')) {

            angular.extend($scope.errorState, {
                redirectionPath: 'app.administration.dashboard'
            });

        } else {

            angular.extend($scope.errorState, {
                redirectionPath: 'app.client.central'
            });

        }

    }



};