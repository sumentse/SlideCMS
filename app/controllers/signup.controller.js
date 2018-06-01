// @ngInject
module.exports = ($scope, $state, spService, email, myProfile, _, CONST, globalFN, config) => {

    let {getTotalUsers} = globalFN;

    $scope.signupState = {
        ready: false,
        disableBtn: false
    };

    $scope.user = myProfile;

    //prevents double signup
    $scope.init = () => {

        spService.getListItems(CONST.rootFolder, CONST.userDB, `?$filter=email eq '${$scope.user.Email}'`,
            (res) => {
                if (res.data.d.results.length > 0) {
                    $state.go('app.client.central');
                } else {
                    angular.extend($scope.signupState, {
                        ready: true
                    });
                }
            },
            (err) => {
                $state.go('error', {
                    errorCode: 'custom',
                    redirectionPath: 'signup',
                    errorHeader: '500 - Internal Server Error',
                    errorMessage: 'It seems something mess up on our end. Please try again later.',
                    buttonLabel: 'Home',
                    icon: 'fa fa-frown-o text-danger'
                });
            }
        );

    };


    $scope.signup = async() => {

        angular.extend($scope.signupState, {
            disableBtn: true
        });

        if ($scope.user.UserProfileProperties.FirstName.Value && $scope.user.UserProfileProperties.LastName.Value) {

            spService.addListItem(CONST.rootFolder, CONST.userDB, {
                    metadata: {
                        email: $scope.user.Email,
                        full_name: `${$scope.user.UserProfileProperties.FirstName.Value} ${$scope.user.UserProfileProperties.LastName.Value}`,
                        sharepoint_id: $scope.user.sharepoint_id,
                        is_admin: await getTotalUsers() === 0 ? 1 : 0, //make admin if user is the first user
                        current_slide_version: angular.toJson({}),
                        department: $scope.user.UserProfileProperties.Department.Value,
                        options: angular.toJson(
                            {
                                firstTimer: true,
                                sideBarToggle: config.hideSideBar
                            }
                        ),
                        userAgent: angular.toJson(detect.parse(navigator.userAgent))
                    },
                    AttachmentFiles: []
                },
                (res) => {
                    if (res.status === 201) {
                        $state.go('app.client.central.slide.add');
                    } else {
                        $state.go('error', {
                            errorCode: 'custom',
                            redirectionPath: 'signup',
                            errorHeader: '500 - Internal Server Error',
                            errorMessage: 'It seems something mess up on our end. Please try again later.',
                            buttonLabel: 'Home',
                            icon: 'fa fa-frown-o text-danger'
                        });
                    }
                },
                (err) => {
                    angular.extend($scope.signupState, {
                        disableBtn: false
                    });

                    $state.go('error', {
                        errorCode: 'custom',
                        redirectionPath: 'signup',
                        errorHeader: '500 - Internal Server Error',
                        errorMessage: 'It seems something mess up on our end. Please try again later.',
                        buttonLabel: 'Home',
                        icon: 'fa fa-frown-o text-danger'
                    });

                }
            );


        }


    }

};