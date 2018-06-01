// @ngInject
module.exports = ($scope, $timeout, $uibModalInstance, itemsToDelete, listName, _, spService, CONST) => {

    $scope.modalState = {
        alerts: [],
        code: '',
        deletionCode: '',
        progressBar: 0,
        showProgressBar: false,
        inProgressDelete: false
    };

    let alphaNumeric = 'ABCEDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let confirmationCode = '';

    for (let i = 0; i < 6; i++) {
        confirmationCode += alphaNumeric.charAt(Math.floor(Math.random() * alphaNumeric.length));
    }

    angular.extend($scope.modalState, {
        code: confirmationCode
    });

    $scope.checkLength = () => {
        if ($scope.modalState.deletionCode.length > 6) {
            angular.extend($scope.modalState, {
                deletionCode: $scope.modalState.deletionCode.substring(0, 6)
            });

        } else {

            $scope.modalState = angular.extend({}, $scope.modalState, {
                code: _.reduce(confirmationCode, (acc, curr, index) => {
                    if (curr === $scope.modalState.deletionCode.charAt(index)) {
                        acc += `<span class="text-success">${curr}<span>`;
                    } else {
                        acc += `<span class="text-danger">${curr}</span>`;
                    }
                    return acc;
                }, "")
            });

        }
    }

    $scope.closeAlert = (index) => {

        $scope.modalState.alerts.splice(index, 1);
    };

    $scope.confirmDelete = (code) => {
        if (confirmationCode !== code) {
            angular.extend($scope.modalState, {
                alerts: $scope.modalState.alerts.concat([{ type: 'danger', msg: 'Incorrect code' }])
            });
        } else {

            let deleteItem = (i) => {
                if (i !== itemsToDelete.length) {

                    spService.deleteListItem(CONST.rootFolder, listName, itemsToDelete[i], 
                        (res)=>{
                            angular.extend($scope.modalState, {
                                showProgressBar: true,
                                inProgressDelete: true,
                                progressBar: parseInt(((i + 1) / itemsToDelete.length) * 100, 10)
                            });

                            deleteItem(i + 1);
                        },
                        (err)=>{
                            //move onto the next item if an err occurs with the current item
                            deleteItem(i + 1);
                        }
                    );

                    //need an error handler

                } else {

                    $timeout(() => {

                        angular.extend($scope.modalState, {
                            inProgressDelete: false
                        });

                        $scope.successful();

                    }, 1500);

                }
            };

            deleteItem(0);
        }
    };

    $scope.successful = () => {
        $uibModalInstance.close('success');
    };

    $scope.closeModal = () => {
        $uibModalInstance.close('close');
    };


};