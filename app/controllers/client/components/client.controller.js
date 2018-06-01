// @ngInject
module.exports = ($scope, $state, spService, email, _, user) => {

    //parent state
    $scope.clientState = {
    	$state,
        is_admin: user.is_admin,
        isHeaderTop: true 
    };

    $scope.isTop = ()=>{
    	angular.extend($scope.clientState, {
    		isHeaderTop: true
    	});
    }

    $scope.isNotTop = ()=>{
    	angular.extend($scope.clientState, {
    		isHeaderTop: false
    	});
    }


};