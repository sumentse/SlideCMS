// @ngInject
module.exports = ($uibModal, $scope, $state, $stateParams, $filter, $location, $timeout, $window, spService, email, _, IE, config, CONST, globalFN) => {

    let { updateUser, getUser, searchSiteUsers, addUser } = globalFN;

    $scope.userState = {
        alerts: [],
        colLength: (document.querySelector('#column-names')) ? document.querySelector('#column-names').childElementCount : 0,
        disableDeleteAllBtn: true,
        display: [],
        is_admin: $stateParams.is_admin,
        isLoading: true,
        search: '',
        searchLimit: '25',
        selectAll: false,
        selectedUsers: [],
        srcDisplay: [],
        selectedDeletion: 0,
        statusCategoryList: [{ name: 'Standard', value: 0 }, { name: 'Admin', value: 1 }]
    };

    let removeSlidePermission = (users = []) => {
        //remove the user permission from the slide
        if (!angular.isArray(users)) {
            return;
        } else {
            if (users.length < 1) {
                return;
            }
        }
    };

    $scope.closeAlert = (index) => {
        $scope.userState.alerts.splice(index, 1);
    };


    //for new user searching
    $scope.search = async(query = '', limit = 25) => {
        if (query === '') {
            return;
        }

        let excluder = (users, excluded) => {

            return {
                display: _.filter(users, (item) => {
                    return !_.includes(excluded, item.Id);
                }),
                srcDisplay: _.filter(users, (item) => {
                    return !_.includes(excluded, item.Id);
                })
            }


        };

        //gets the site users based on query
        let users = await searchSiteUsers(query, limit);

        let userWithAccess = _.reduce(await getUser('?$select=sharepoint_id&$top=5000'), (users, current)=>{
            users.push(current.sharepoint_id);
            return users;
        },[]);

        //gets an object
        let displayData = excluder(users, userWithAccess);

        $scope.$apply(() => {
            angular.extend($scope.userState, displayData);
        });

    };


    $scope.toggleAll = () => {

        if ($scope.userState.selectAll) {
            angular.forEach(document.querySelectorAll('.user-checkbox'), (input) => {
                input.checked = $scope.userState.selectAll;
            });

        } else {

            angular.forEach(document.querySelectorAll('.user-checkbox'), (input) => {
                input.checked = $scope.userState.selectAll;
            });

        }

    };

    $scope.refreshTable = () => {


        let ieVersion = IE.version();

        if (ieVersion > 0 && ieVersion <= 11) {
            $scope.$broadcast('ie_refreshTable');

        } else if (window.navigator.userAgent.indexOf("Edge") > -1) {
            $scope.$broadcast('ie_refreshTable');

        } else {
            //if not using Internet explorer or Edge
            return;
        }


    }

    $scope.customPipe = async(tableState) => {

        let { pagination, search, sort } = tableState;
        let locationSearch = $location.search();
        let start = pagination.start || 0;
        let number = pagination.number || 25;


        angular.extend($scope.userState, {
            isLoading: true
        });


        spService.getListItems(CONST.rootFolder, CONST.userDB, '?$orderBy=ID desc&$top=5000',
            (res) => {
                let data = res.data.d.results;

                //if predicateObject do a search otherwise if 
                //is empty then do a search on location
                if (search.predicateObject) {

                    Object.keys(search.predicateObject).forEach(k => (!search.predicateObject[k] && search.predicateObject[k] !== undefined) && delete search.predicateObject[k]);

                    angular.extend($scope.userState, {
                        isLoading: false,
                        display: search.predicateObject ? $filter('filter')(data, search.predicateObject) : data
                    });

                    //update the url params
                    if (search.predicateObject.is_admin) {

                        $location.search('is_admin', String(search.predicateObject.is_admin));

                    } else {
                        $location.search('is_admin', null);
                    }


                } else {

                    //update the is_admin droplist
                    angular.extend(search, {
                        predicateObject: {
                            is_admin: locationSearch.is_admin
                        }
                    });


                    angular.extend($scope.userState, {
                        isLoading: false,
                        display: search.predicateObject ? $filter('filter')(data, search.predicateObject) : data
                    });

                }

                //Handles sorting for column header
                if (sort.predicate) {
                    angular.extend(
                        $scope.userState, {
                            display: $filter('orderBy')($scope.userState.display, sort.predicate, sort.reverse)
                        }
                    );
                }


                //pagination
                angular.merge(tableState, {
                    pagination: {
                        totalItemCount: $scope.userState.display.length,
                        numberOfPages: Math.ceil($scope.userState.display.length / number)
                    }
                });

                angular.extend(
                    $scope.userState, {
                        display: $scope.userState.display.slice(start, start + number)
                    }
                );

                $scope.toggleAll();
            },
            (err) => {
                $state.go('app.administration.error', {
                    errorCode: 'custom',
                    redirectionPath: 'app.administration.users.list',
                    errorHeader: '400 - Bad Request',
                    errorMessage: 'It seems you mess up something. Please try again.',
                    buttonLabel: 'User List',
                    icon: 'fa fa-frown-o text-danger'
                });
            }
        );


    };

    //disable the delete users button if there are no checked boxes
    $scope.isSelected = () => {
        let hasSelectedChecks = document.querySelectorAll('.user-checkbox:checked').length;

        angular.extend($scope.userState, {
            selectedDeletion: hasSelectedChecks
        });

        if ($scope.userState.disableDeleteAllBtn === false && hasSelectedChecks) {
            return;
        } else {
            angular.extend($scope.userState, {
                disableDeleteAllBtn: !$scope.userState.disableDeleteAllBtn
            });
        }

        if (hasSelectedChecks) {
            angular.extend($scope.userState, {
                disableDeleteAllBtn: false
            });
        } else {
            angular.extend($scope.userState, {
                disableDeleteAllBtn: true
            });
        }
    };


    $scope.addUser = async(user = {}) => {
        if (!angular.isObject(user)) {
            return;
        } else {
            if (_.isEmpty(user)) {
                return;
            }
        }

        let postData = async(UserProfileProperties) => {
            //user does not exist

            try {

                if (UserProfileProperties) {

                    if (UserProfileProperties.FirstName.Value && UserProfileProperties.LastName.Value) {
                        await addUser({
                            email: user.Email,
                            full_name: `${UserProfileProperties.FirstName.Value} ${UserProfileProperties.LastName.Value}`,
                            sharepoint_id: user.Id,
                            is_admin: user.is_admin.value,
                            current_slide_version: angular.toJson({}),
                            department: UserProfileProperties.Department.Value,
                            options: angular.toJson(
                                {
                                    firstTimer: true,
                                    sideBarToggle: config.hideSideBar
                                }
                            )
                        });

                        $scope.$apply(() => {
                            let idx = _.findIndex($scope.userState.srcDisplay,(o)=>o.Id === user.Id);

                            angular.extend($scope.userState, {
                                display: _.filter($scope.userState.display, (o)=>o.Id !== user.Id),
                                srcDisplay: _.filter($scope.userState.srcDisplay, (o)=>o.Id !== user.Id)
                            });

                        });

                    } else {
                    let modalInstance = $uibModal.open({
                        animation: true,
                        controller: ($scope, $uibModalInstance) => {
                            $scope.closeModal = () => {
                                $uibModalInstance.close('close');
                            };
                        },
                        template: `
                                    <div>
                                        <header class="modal-header">
                                            <button ng-click="closeModal()" type="button" class="close"><i class="fa fa-close"></i></button>                                   
                                        </header>
                                        <main class="modal-body text-center">
                                            <p><i class="fa fa-3x fa-exclamation-triangle text-danger"></i></p>
                                            <p>Generic account cannot be added. Only real users can be added.</p>
                                        </main>
                                        <footer class="modal-footer">
                                        </footer>
                                    </div>
                                `,
                        size: 'md'
                    });

                    modalInstance.result.then(() => {}, () => {});
                    }

                } else {
                    let modalInstance = $uibModal.open({
                        animation: true,
                        controller: ($scope, $uibModalInstance) => {
                            $scope.closeModal = () => {
                                $uibModalInstance.close('close');
                            };
                        },
                        template: 
                        `
                            <div>
                                <header class="modal-header">
                                    <button ng-click="closeModal()" type="button" class="close"><i class="fa fa-close"></i></button>                                   
                                </header>
                                <main class="modal-body text-center">
                                    <p><i class="fa fa-3x fa-exclamation-triangle text-danger"></i></p>                                        
                                    <p>The employee does not work here anymore.</p>
                                </main>
                                <footer class="modal-footer">
                                </footer>
                            </div>
                        `,
                        size: 'md'
                    });

                    modalInstance.result.then(() => {}, () => {});
                }



            } catch (err) {
                console.log(err);
            }

        }

        let dataset = await spService.getUserByID(CONST.rootFolder, user.Id);
        let isThereUser = await getUser(`?$filter=sharepoint_id eq ${dataset.data.d.Id}`);

        //check if user exist in the system
        if (isThereUser.length === 0) {
            postData(dataset.data.d.UserProfileProperties);
        } 

    };


    $scope.deleteUser = (user = {}) => {
        //remove slide Permission
        if (!angular.isObject(user)) {
            return;
        } else {
            if (_.isEmpty(user)) {
                return;
            }
        }

        let { ID, is_admin } = user;

        let proceedDeletion = () => {
            spService.deleteListItem(CONST.rootFolder, CONST.userDB, ID,
                (res) => {
                    $scope.$broadcast('refreshTable');
                },
                (err) => {
                    $state.go('app.administration.error', {
                        errorCode: 'custom',
                        redirectionPath: 'app.administration.users.list',
                        errorHeader: '500 - Internal Server Error',
                        errorMessage: 'It seems something mess up on our end. Please try again later.',
                        buttonLabel: 'User List',
                        icon: 'fa fa-frown-o text-danger'
                    });
                }
            );
        };

        if (is_admin === 1) {
            spService.getListItems(CONST.rootFolder, CONST.userDB, '?$filter=is_admin eq 1&$top=2',
                (res) => {
                    if (res.data.d.results.length > 1) {
                        //item can be delete
                        proceedDeletion();
                    } else {
                        //item should not be deleted because only admin
                        let modalInstance = $uibModal.open({
                            animation: true,
                            controller: ($scope, $uibModalInstance) => {
                                $scope.closeModal = () => {
                                    $uibModalInstance.close('close');
                                };
                            },
                            template: `
                                <div>
                                    <header class="modal-header">
                                        <button ng-click="closeModal()" type="button" class="close"><i class="fa fa-close"></i></button>                                   
                                    </header>
                                    <main class="modal-body text-center">
                                        <p><i class="fa fa-3x fa-exclamation-triangle text-danger"></i></p>
                                        <p>There must be at least one administrator</p>
                                    </main>
                                    <footer class="modal-footer">
                                    </footer>
                                </div>
                            `,
                            size: 'md'
                        });

                        modalInstance.result.then(() => {}, () => {});


                    }
                },
                (err) => {
                    $state.go('app.administration.error', {
                        errorCode: 'custom',
                        redirectionPath: 'app.administration.users.list',
                        errorHeader: '500 - Internal Server Error',
                        errorMessage: 'It seems something mess up on our end. Please try again later.',
                        buttonLabel: 'User List',
                        icon: 'fa fa-frown-o text-danger'
                    });
                }
            );

        } else {
            proceedDeletion();

        }


    };

    $scope.deleteUsers = async() => {

        try {
            let data = await getUser('?$filter=is_admin eq 1&$top=26');

            //compare the check amount to the total admins
            let totalAdmins = data.length;
            let totalSelectedAdmins = _.reduce(document.querySelectorAll('[data-is-admin="1"]'), (sum, selected) => {
                if (selected.checked) {
                    sum = sum + 1;
                }
                return sum;
            }, 0);

            if (totalSelectedAdmins === totalAdmins) {
                //display an error
                angular.extend($scope.userState, {
                    alerts: $scope.userState.alerts.concat([{
                        type: 'danger',
                        msg: 'Warning: you are deleting all the adminstrators. There must be at least one administrator.'
                    }])
                });

                $timeout(() => {
                    $window.scrollBy(0, document.body.scrollHeight);
                }, 100);

            } else {
                let modalInstance = $uibModal.open({
                    animation: true,
                    controller: 'component.deletionBox',
                    templateUrl: CONST.deletionBoxTemplate,
                    size: 'md',
                    resolve: {
                        itemsToDelete: () => _.reduce(document.querySelectorAll('.user-checkbox:checked'), (acc, curr) => {
                            acc.push(curr.dataset.id);
                            return acc;
                        }, []),
                        listName: () => CONST.userDB
                    }
                });

                //adding catch prevent the error message of escape key
                modalInstance.result.then((res) => {
                    //finish deletion
                    if (res === 'success') {

                        angular.extend($scope.userState, {
                            selectedDeletion: 0
                        });

                        $scope.$broadcast('refreshTable');

                    }
                }, () => {
                    //on fail
                });
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




    };



};