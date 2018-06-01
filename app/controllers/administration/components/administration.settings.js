// @ngInject
module.exports = ($uibModal, $scope, $state, spService, config, _, CONST, globalFN) => {

    let {encodeString} = globalFN;

    $scope.uiState = {
        categoryInput: '',
        disableBtn: false,
        modified: config.Modified
    };

    $scope.configState = {
        applicationName: config.applicationName,
        slideLimit: config.slideLimit,
        itemsPerPage: config.itemsPerPage,
        slideCategories: config.slideCategories.sort(),
        hideSideBar: config.hideSideBar
    };

    $scope.resetDefaultSettings = () => {

        angular.extend($scope.uiState, {
            disableBtn: true
        });

        let defaultSettings = {
            applicationName: 'SlideCentral',
            slideLimit: 5000,
            itemsPerPage: 6,
            slideCategories: ["Administrative","Agenda","Budget","Case Study","Collections","Comparison","Complete Templates","Dashboard","Finance","Funnels","General","Graph","Guides","Lists","Map","Medical","Org Chart","Our Team","Process","Puzzle","Strategy","Tables","Technology","Timeline","Vision & Mission"],
            hideSideBar: false
        };

        let modalInstance = $uibModal.open({
            animation: true,
            controller: 'component.confirmationBox',
            templateUrl: CONST.confirmationBoxTemplate,
            size: 'md'
        });

        modalInstance.result.then((userInput) => {
            if (_.isBoolean(userInput)) {

                if (userInput) {
                    //user inputted yes

                    //check if the current config is the same as the default, otherwise ignore this request
                    if (angular.toJson(defaultSettings) !== angular.toJson($scope.configState)) {
                        spService.getListItems(CONST.rootFolder, CONST.configDB, `?$filter=Title eq 'slidecentral'&$top=1`,
                            (res) => {
                                let [data] = res.data.d.results;

                                spService.updateListItem(CONST.rootFolder, CONST.configDB, data.ID, {
                                        config: angular.toJson(defaultSettings)
                                    },
                                    (res) => {
                                        if (res.status === 204) {
                                            $state.reload();
                                        }
                                    },
                                    (err) => {
                                        $state.go('error', {
                                            errorCode: 'custom',
                                            redirectionPath: 'app.administration.settings',
                                            errorHeader: '500 - Internal Server Error',
                                            errorMessage: 'It seems something mess up on our end. Please try again later.',
                                            buttonLabel: 'Home',
                                            icon: 'fa fa-frown-o text-danger'
                                        });
                                    }
                                );
                            },
                            (err) => {

                                $state.go('error', {
                                    errorCode: 'custom',
                                    redirectionPath: 'app.administration.settings',
                                    errorHeader: '500 - Internal Server Error',
                                    errorMessage: 'It seems something mess up on our end. Please try again later.',
                                    buttonLabel: 'Home',
                                    icon: 'fa fa-frown-o text-danger'
                                });
                            }
                        );


                    } else {
                        angular.extend($scope.uiState, {
                            disableBtn: false
                        });

                        let modalInstance = $uibModal.open({
                            animation: true,
                            controller: ($scope, $uibModalInstance)=>{
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
                                        <p>Warning: Settings are the same</p>
                                    </main>
                                    <footer class="modal-footer">
                                    </footer>
                                </div>
                            `,
                            size: 'md'
                        });

                        modalInstance.result.then(()=>{},()=>{});

                    }

                } else {
                    angular.extend($scope.uiState, {
                        disableBtn: false
                    });


                }
            } else {
                angular.extend($scope.uiState, {
                    disableBtn: false
                });
            }
        }, () => {
            //on fail

            $state.go('error', {
                errorCode: 'custom',
                redirectionPath: 'app.administration.settings',
                errorHeader: '500 - Internal Server Error',
                errorMessage: 'It seems something mess up on our end. Please try again later.',
                buttonLabel: 'Home',
                icon: 'fa fa-frown-o text-danger'
            });

        });


    }

    $scope.addCategory = (category) => {

        if (category === '') {
            return;
        }

        let newCategoryList = $scope.configState.slideCategories.concat(category).sort();

        angular.extend($scope.configState, {
            slideCategories: _.sortedUniq(newCategoryList)
        });

        angular.extend($scope.uiState, {
            categoryInput: ''
        });

    };

    $scope.removeCategory = (category) => {
        angular.extend($scope.configState, {
            slideCategories: _.filter($scope.configState.slideCategories, (item) => category !== item)
        });
    };

    $scope.updateSettings = () => {

        angular.extend($scope.uiState, {
            disableBtn: true
        });

        spService.getListItems(CONST.rootFolder, CONST.configDB, `?$filter=Title eq 'slidecentral'&$top=1`,
            (res) => {
                let [data] = res.data.d.results;

                spService.updateListItem(CONST.rootFolder, CONST.configDB, data.ID, {
                        config: angular.toJson({
                            applicationName: encodeString($scope.configState.applicationName),
                            slideLimit: $scope.configState.slideLimit,
                            itemsPerPage: $scope.configState.itemsPerPage,
                            hideSideBar: $scope.configState.hideSideBar,
                            slideCategories: $scope.configState.slideCategories
                        })
                    },
                    (res) => {
                        if (res.status === 204) {
                            $state.reload();
                        }
                    },
                    (err) => {
                        $state.go('error', {
                            errorCode: 'custom',
                            redirectionPath: 'app.administration.settings',
                            errorHeader: '500 - Internal Server Error',
                            errorMessage: 'It seems something mess up on our end. Please try again later.',
                            buttonLabel: 'Home',
                            icon: 'fa fa-frown-o text-danger'
                        });
                    }
                );
            },
            (err) => {
                $state.go('error', {
                    errorCode: 'custom',
                    redirectionPath: 'app.administration.settings',
                    errorHeader: '500 - Internal Server Error',
                    errorMessage: 'It seems something mess up on our end. Please try again later.',
                    buttonLabel: 'Home',
                    icon: 'fa fa-frown-o text-danger'
                });
            }
        );

    };



};