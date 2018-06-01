// @ngInject
module.exports = ($scope, $state, $stateParams, spService, config, account, user, globalFN) => {

    let { updateUser, getUser } = globalFN;
    let { id } = $stateParams;
    let statusCategoryList = [{ name: 'Standard', value: 0 }, { name: 'Admin', value: 1 }];


    //initial setup
    $scope.userState = {
        alerts: [],
        display: account,
        userClicked: false,
        isLoading: true,
        srcDisplay: [],
        statusCategoryList,
        is_admin: statusCategoryList[account.is_admin]
    };

    $scope.closeAlert = (index) => {
        $scope.userState.alerts.splice(index, 1);
    };

    $scope.updateInformation = () => {


        angular.extend($scope.userState, {
            userClicked: true
        });


        let update = async() => {

            try {
                await updateUser(id, {
                    is_admin: parseInt($scope.userState.is_admin.value, 10)
                });

                angular.extend($scope.userState, {
                    alerts: $scope.userState.alerts.concat([{ type: 'success', msg: 'Successfully updated' }]),
                    userClicked: false
                });

                if (user.ID === id) {
                    if (JSON.parse(res.config.data).is_admin !== 1) {

                        $state.go('app.central', {}, { reload: true });

                    } else {
                        $state.go('app.administration.users.list');
                    }
                } else {
                    $state.go('app.administration.users.list');
                }

            } catch (err) {
                $state.go('app.administration.error', {
                    errorCode: 'custom',
                    redirectionPath: 'app.administration.users.list',
                    errorHeader: '500 - Internal Server Error',
                    errorMessage: 'It seems something mess up on our end. Please try again later.',
                    buttonLabel: 'User List',
                    icon: 'fa fa-frown-o text-danger'
                });
            }

        }

        //there should be at least one admin in the admin section
        let onlyAdmin = async() => {


            let data = await getUser('?$filter=is_admin eq 1&$top=2');

            if (data.length === 1 && account.is_admin === 1) {
                if (parseInt($scope.userState.is_admin.value, 10) === 0) {
                    //throws an error if there is only one admin and changing account to status will close out
                    //any users going to the admin section
                    
                    $scope.$apply(()=>{
                        angular.extend($scope.userState, {
                            alerts: $scope.userState.alerts.concat([{ type: 'danger', msg: 'Cannot switch to standard account. There must be at least one admin' }]),
                            userClicked: false
                        });
                    });

                } else {
                    $state.go('app.administration.users.list');
                }
            } else {
                update();
            }


        }

        onlyAdmin();





    }


};