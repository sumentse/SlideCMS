// @ngInject
module.exports = ($scope, $uibModalInstance) => {

	$scope.userInput = (input)=>{
		$uibModalInstance.close(input);
	};

    $scope.closeModal = () => {
        $uibModalInstance.close('close');
    };


};