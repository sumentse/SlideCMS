// @ngInject
module.exports = ($window, $uibModal, $q, $scope, $state, $stateParams, $filter, $location, $timeout, spService, email, _, user, config, Upload, CONST, globalFN) => {

    let delayTimer;
    let { deleteSlide, updateSlide, getComment, getVersionNumber } = globalFN;

    $scope.slideState = {
        alerts: [],
        colLength: (document.querySelector('#column-names')) ? document.querySelector('#column-names').childElementCount : 0,
        display: [],
        isLoading: true,
        uploadingFile: false,
        srcDisplay: [],
        slideCategoryList: config.slideCategories,
        disableSelectedRecycleBtn: true,
        disableSelectedRestoreBtn: true,
        userClicked: false,
        searchWidgetEnable: false,
        searchUserResults: [],
        selectedUser: [],
        isMovingToBin: false,
        isRestoring: false,
        selectedRecycle: 0,
        selectedRestore: 0,
        selectedDeletion: 0,
        recycleBinMode: 0,
        form: {
            title: '',
            files: [],
            selectedCategories: [],
            slide_description: '',
            is_active: 0,
            permissioned_users: [],
            searchUserQuery: '',
            access_control: 0,
            file_metadata: {}
        }
    };


    $scope.$on('$destroy', () => {
        angular.element($window).unbind('click');
    });

    $scope.goToBin = () => {
        angular.extend($scope.slideState, {
            recycleBinMode: 1,
            selectedRestore: 0,
            selectedDeletion: 0,
            selectAll: false
        });

        $scope.$broadcast('refreshTable');
    };

    $scope.goToSlides = () => {
        angular.extend($scope.slideState, {
            recycleBinMode: 0,
            selectedRecycle: 0,
            selectAll: false
        });
        $scope.$broadcast('refreshTable');
    }

    $scope.restoreSlide = async(slide = {}) => {
        if (!angular.isObject(slide)) {
            return;
        } else {
            if (_.isEmpty(slide)) {
                return;
            }
        }

        if (await updateSlide(slide.ID, { trashbin: 0 })) {
            $scope.$broadcast('refreshTable');

            angular.extend($scope.slideState, {
                selectedRestore: 0,
                selectedDeletion: 0,
                selectAll: false
            });
        }

    };

    $scope.restoreSlides = () => {
        let itemsToRestore = _.reduce(document.querySelectorAll('.user-checkbox:checked'), (acc, curr) => {
            acc.push(curr.dataset.id);
            return acc;
        }, []);

        let updateItems = async(i) => {

            if (itemsToRestore.length === 0) {
                return;
            }

            if (i === 0) {
                angular.extend($scope.slideState, {
                    isRestoring: true,
                    selectedDeletion: 0
                });
            }

            if (i !== itemsToRestore.length) {

                if( await updateSlide(itemsToRestore[i], {trashbin:0}) ){
                    updateItems(i + 1);
                }

            } else {
                $scope.$broadcast('refreshTable');
                angular.extend($scope.slideState, {
                    selectedRestore: 0,
                    selectedDeletion: 0,
                    isRestoring: false,
                    selectAll: false
                });
            }
        };

        updateItems(0);
    };

    $scope.recycleSlide = async(slide) => {
        if (!angular.isObject(slide)) {
            return;
        } else {
            if (_.isEmpty(slide)) {
                return;
            }
        }

        if( await updateSlide(slide.ID, {trashbin:1}) ){

            $scope.$broadcast('refreshTable');
            
        }

    };

    $scope.recycleSlides = () => {

        let itemsToRecycle = _.reduce(document.querySelectorAll('.user-checkbox:checked'), (acc, curr) => {
            acc.push(curr.dataset.id);
            return acc;
        }, []);

        let updateItems = async(i) => {

            if (itemsToRecycle.length === 0) {
                return;
            }

            if (i === 0) {
                angular.extend($scope.slideState, {
                    isMovingToBin: true
                });
            }

            if (i !== itemsToRecycle.length) {

                if( await updateSlide(itemsToRecycle[i], {trashbin: 1}) ){
                    updateItems(i + 1);
                }

            } else {
                $scope.$broadcast('refreshTable');
                angular.extend($scope.slideState, {
                    selectedRecycle: 0,
                    isMovingToBin: false,
                    selectAll: false
                });
            }
        };

        updateItems(0);

    };

    $scope.deleteSlide = async(slide = {}) => {

        if (!angular.isObject(slide)) {
            return;
        } else {
            if (_.isEmpty(slide)) {
                return;
            }
        }


        if( await deleteSlide(slide.ID) ){

            $scope.$broadcast('refreshTable');

            angular.extend($scope.slideState, {
                selectedDeletion: 0,
                selectedRestore: 0,
                selectAll: false
            });
            
        }

    };

    $scope.deleteSlides = () => {

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
                listName: () => CONST.slideDB
            }
        });

        //adding catch prevent the error message of escape key
        modalInstance.result.then((res) => {
            //finish deletion
            if (res === 'success') {

                $scope.$broadcast('refreshTable');

                angular.extend($scope.slideState, {
                    selectedDeletion: 0,
                    selectedRestore: 0,
                    selectAll: false
                });

            }
        }, () => {
            //on fail
        });

    };

    $scope.getComment = getComment;
    $scope.getVersionNumber = getVersionNumber;

    $scope.customPipe = (tableState) => {

        let { pagination, search, sort } = tableState;
        let locationSearch = $location.search();
        let start = pagination.start || 0;
        let number = pagination.number || 25;



        angular.extend($scope.slideState, {
            isLoading: true
        });

        spService.getListItems(CONST.rootFolder, CONST.slideDB, `?$filter=trashbin eq ${$scope.slideState.recycleBinMode}&$top=${config.slideLimit}&$orderBy=ID desc`,
            (res) => {
                let data = res.data.d.results;

                if (search.predicateObject) {

                    Object.keys(search.predicateObject).forEach(k => (!search.predicateObject[k] && search.predicateObject[k] !== undefined) && delete search.predicateObject[k]);

                    angular.extend($scope.slideState, {
                        isLoading: false,
                        display: search.predicateObject ? $filter('filter')(data, search.predicateObject) : data
                    });

                    //update the url params
                    if (search.predicateObject.is_active) {
                        $location.search('is_active', search.predicateObject.is_active);
                    } else {
                        $location.search('is_active', null);
                    }

                } else {

                    //update the is_admin droplist
                    angular.extend(search, {
                        predicateObject: {
                            is_active: locationSearch.is_active
                        }
                    });


                    angular.extend($scope.slideState, {
                        isLoading: false,
                        display: search.predicateObject ? $filter('filter')(data, search.predicateObject) : data
                    });

                }

                //Handles sorting for column header
                if (sort.predicate) {
                    angular.extend(
                        $scope.slideState, {
                            display: $filter('orderBy')($scope.slideState.display, sort.predicate, sort.reverse)
                        }
                    );
                }

                //pagination
                angular.merge(tableState, {
                    pagination: {
                        totalItemCount: $scope.slideState.display.length,
                        numberOfPages: Math.ceil($scope.slideState.display.length / number)
                    }
                });

                angular.extend(
                    $scope.slideState, {
                        display: $scope.slideState.display.slice(start, start + number)
                    }
                );
                $scope.toggleAll();
            },
            (err) => {

            }
        );


    };

    $scope.isSelected = () => {
        let hasSelectedChecks = document.querySelectorAll('.user-checkbox:checked').length;

        //in recycling bin mode
        if($scope.slideState.recycleBinMode === 1){

            angular.extend($scope.slideState, {
                selectedRestore: hasSelectedChecks,
                selectedDeletion: hasSelectedChecks
            });


            if ($scope.slideState.disableSelectedRestoreBtn === false && hasSelectedChecks) {
                return;
            } else {
                angular.extend($scope.slideState, {
                    disableSelectedRestoreBtn: !$scope.slideState.disableSelectedRestoreBtn
                });
            }

            if (hasSelectedChecks) {
                angular.extend($scope.slideState, {
                    disableSelectedRestoreBtn: false
                });
            } else {
                angular.extend($scope.slideState, {
                    disableSelectedRestoreBtn: true
                });
            }            

        } else if($scope.slideState.recycleBinMode === 0){

            angular.extend($scope.slideState, {
                selectedRecycle: hasSelectedChecks
            });

            if ($scope.slideState.disableSelectedRecycleBtn === false && hasSelectedChecks) {
                return;
            } else {
                angular.extend($scope.slideState, {
                    disableSelectedRecycleBtn: !$scope.slideState.disableSelectedRecycleBtn
                });
            }

            if (hasSelectedChecks) {
                angular.extend($scope.slideState, {
                    disableSelectedRecycleBtn: false
                });
            } else {
                angular.extend($scope.slideState, {
                    disableSelectedRecycleBtn: true
                });
            }
        }

    };

    $scope.toggleAll = () => {

        if ($scope.slideState.selectAll) {
            angular.forEach(document.querySelectorAll('.user-checkbox'), (input) => {
                input.checked = $scope.slideState.selectAll;
            });

        } else {

            angular.forEach(document.querySelectorAll('.user-checkbox'), (input) => {
                input.checked = $scope.slideState.selectAll;
            });

        }

    };


};