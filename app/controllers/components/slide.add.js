// @ngInject
module.exports = ($rootScope, $window, $uibModal, $q, $scope, $state, $stateParams, $filter, $location, $timeout, spService, email, _, config, user, CONST, globalFN) => {

    let delayTimer;
    let { encodeString, isTemplate, isImage, updateMetaData, deleteSlide, updateUser, getUserByID } = globalFN;

    $scope.characterLimit = {
        title: 100,
        slide_description: 385,
        comment: 180
    };

    $scope.slideState = {
        alerts: [],
        isLoading: true,
        uploadingFile: false,
        progressBar: 0,
        srcDisplay: [],
        slideCategoryList: config.slideCategories,
        userClicked: false,
        searchWidgetEnable: false,
        searchUserResults: [],
        selectedUser: [],
        form: {
            title: '',
            comment: '',
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

    $scope.closeAlert = (index) => {
        $scope.slideState.alerts.splice(index, 1);
    };

    $scope.uploadFiles = (files, invalid) => {

        if (invalid.length > 0) {
            if (invalid[0].$error === "maxSize") {

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
                                <p>The file size for ${invalid[0].name} is greater than ${invalid[0].$errorParam}. Please upload a file that is less than ${invalid[0].$errorParam}.</p>
                            </main>
                            <footer class="modal-footer">
                            </footer>
                        </div>
                    `,
                    size: 'md'
                });

                modalInstance.result.then(() => {}, () => {});


            }
        }

        if (files.length === 0) {
            return;
        }

        if ($scope.slideState.form.files.length === 0) {
            angular.extend($scope.slideState, {
                isLoading: false,
                form: {
                    title: $scope.slideState.form.title,
                    comment: $scope.slideState.form.comment,
                    files,
                    selectedCategories: $scope.slideState.form.selectedCategories,
                    slide_description: $scope.slideState.form.slide_description,
                    is_active: $scope.slideState.form.is_active,
                    access_control: $scope.slideState.form.access_control,
                    searchUserQuery: $scope.slideState.form.searchUserQuery,
                    permissioned_users: $scope.slideState.form.permissioned_users,
                    file_metadata: {}
                }
            });


        } else if ($scope.slideState.form.files.length === 1) {
            //logic if there is at least one file on the form and execute swap if it has that type

            //check if the form contains the same file type as the new one the user has uploaded

            let shouldSwapFile = _.endsWith(files[0].name, 'key') && _.endsWith($scope.slideState.form.files[0].name, 'key') ||
                _.endsWith(files[0].name, 'pptx') && _.endsWith($scope.slideState.form.files[0].name, 'pptx') ||
                _.endsWith(files[0].name, 'pptx') && _.endsWith($scope.slideState.form.files[0].name, 'key') || 
                _.endsWith(files[0].name, 'key') && _.endsWith($scope.slideState.form.files[0].name, 'pptx') ||
                _.startsWith(files[0].type, 'image') && _.startsWith($scope.slideState.form.files[0].type, 'image');


            angular.extend($scope.slideState, {
                isLoading: false,
                form: {
                    title: $scope.slideState.form.title,
                    comment: $scope.slideState.form.comment,
                    files: shouldSwapFile ? files : $scope.slideState.form.files.concat(files[0]),
                    selectedCategories: $scope.slideState.form.selectedCategories,
                    slide_description: $scope.slideState.form.slide_description,
                    is_active: $scope.slideState.form.is_active,
                    access_control: $scope.slideState.form.access_control,
                    searchUserQuery: $scope.slideState.form.searchUserQuery,
                    permissioned_users: $scope.slideState.form.permissioned_users,
                    file_metadata: {}
                }
            });


        } else if ($scope.slideState.form.files.length > 1) {
            //should be one image and one template file


            //make a copy of original
            let replacementFiles = $scope.slideState.form.files;

            for (let i = 0, totalFiles = $scope.slideState.form.files.length; i < totalFiles; i++) {

                //execute code when the file type matches
                let shouldSwapFile = _.endsWith(files[0].name, 'key') && _.endsWith($scope.slideState.form.files[i].name, 'key') ||
                    _.endsWith(files[0].name, 'pptx') && _.endsWith($scope.slideState.form.files[i].name, 'pptx') ||
                    _.endsWith(files[0].name, 'pptx') && _.endsWith($scope.slideState.form.files[i].name, 'key') || 
                    _.endsWith(files[0].name, 'key') && _.endsWith($scope.slideState.form.files[i].name, 'pptx') ||
                    _.startsWith(files[0].type, 'image') && _.startsWith($scope.slideState.form.files[i].type, 'image');

                if (shouldSwapFile) {
                    //swap if match
                    replacementFiles[i] = files[0];
                }

            }

            angular.extend($scope.slideState, {
                isLoading: false,
                form: {
                    title: $scope.slideState.form.title,
                    comment: $scope.slideState.form.comment,
                    files: replacementFiles,
                    selectedCategories: $scope.slideState.form.selectedCategories,
                    slide_description: $scope.slideState.form.slide_description,
                    is_active: $scope.slideState.form.is_active,
                    access_control: $scope.slideState.form.access_control,
                    searchUserQuery: $scope.slideState.form.searchUserQuery,
                    permissioned_users: $scope.slideState.form.permissioned_users,
                    file_metadata: {}
                }
            });


        }


    };

    $scope.isTemplate = isTemplate;

    //return a bool for if the file is an image. Must pass an array
    $scope.isImage = isImage;

    $scope.searchUser = (query) => {

        if (!angular.isString(query)) {
            return;
        }

        $timeout.cancel(delayTimer);

        delayTimer = $timeout(() => {

            let { permissioned_users } = $scope.slideState.form;

            let excludeFromSearch = ` and ID ne ${user.ID}`;

            for (let i = 0, totalUser = permissioned_users.length; i < totalUser; i++) {
                excludeFromSearch += ` and ID ne ${permissioned_users[i].ID}`;
            }

            spService.getListItems(CONST.rootFolder, CONST.userDB, `?$select=ID,full_name,email&$orderBy=full_name&$filter=substringof('${query}',full_name)${excludeFromSearch}`,
                (res) => {
                    let data = res.data.d.results;
                    angular.extend($scope.slideState, {
                        searchUserResults: _.reduce(data, (result, item) => {

                            result.push({
                                ID: item.ID,
                                full_name: item.full_name,
                                email: item.email
                            });

                            return result;
                        }, []),
                        selectedUser: [] //reset any selected user for new search
                    });

                },
                (res) => {
                    //error geting the user list
                    angular.extend($scope.slideState, {
                        alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: `${res.statusText} – ${res.data.error.message.value}` }])
                    });

                    $timeout(() => {
                        $window.scrollBy(0, document.body.scrollHeight);
                    }, 100);
                }
            );


        }, 1000);

    };

    $scope.openSearchWidget = () => {
        angular.extend($scope.slideState, {
            searchWidgetEnable: true,
        });
    }

    $scope.closeSearchWidget = () => {

        angular.extend($scope.slideState, {
            searchWidgetEnable: false,
            searchUserResults: [],
            selectedUser: [],
            form: angular.extend({}, $scope.slideState.form, {
                searchUserQuery: '',
                permissioned_users: $scope.slideState.form.permissioned_users.concat($scope.slideState.selectedUser)
            })
        });

    };

    $scope.isCategorySelected = (category) => {
        return _.findIndex($scope.slideState.form.selectedCategories, (o) => o === category) !== -1 ? true : false;
    };

    $scope.toggleCategory = (category) => {
        let idx = _.findIndex($scope.slideState.form.selectedCategories, (o) => o === category);
        //no matches
        if (idx === -1) {
            angular.merge($scope.slideState, {
                form: {
                    selectedCategories: $scope.slideState.form.selectedCategories.concat(category)
                }
            });

        } else {
            //matches
            _.remove($scope.slideState.form.selectedCategories, (o) => o === category)

        }


    };

    $scope.isRowSelected = (user) => {
        return _.findIndex($scope.slideState.selectedUser, (o) => o.ID === user.ID) !== -1 ? true : false;
    };

    $scope.assignUser = (user) => {
        //toggle selection
        let idx = _.findIndex($scope.slideState.selectedUser, (o) => o.ID === user.ID);

        //match is found
        if (idx !== -1) {
            angular.extend($scope.slideState, {
                selectedUser: _.filter($scope.slideState.selectedUser, (o) => o.ID !== user.ID)
            });
        } else {
            angular.extend($scope.slideState, {
                selectedUser: $scope.slideState.selectedUser.concat([{
                    ID: user.ID,
                    full_name: user.full_name,
                    email: user.email
                }])
            });
        }
    };

    $scope.removeUser = (user) => {
        angular.extend($scope.slideState, {
            form: angular.extend($scope.slideState.form, {
                permissioned_users: _.filter($scope.slideState.form.permissioned_users, (o) => o !== user)
            })
        });

    };

    $scope.addSlide = (data = {}) => {
        if (!angular.isObject(data)) {
            return;
        } else {
            if (_.isEmpty(data)) {
                return;
            }
        }

        let { title: Title, is_active, slide_description, selectedCategories: slide_categories, files, access_control, comment } = data;

        angular.extend($scope.slideState, {
            userClicked: true
        });

        if (files.length === 0) {
            angular.extend($scope.slideState, {
                userClicked: false,
                alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: 'You need to provide a powerpoint or keynote file' }])
            });

            $timeout(() => {
                $window.scrollBy(0, document.body.scrollHeight);
            }, 0);

        } else {
            let [slide] = _.filter(files, (file) => _.endsWith(file.name, 'key') || _.endsWith(file.name, 'pptx'));
            let [image] = _.filter(files, (file) => _.startsWith(file.type, 'image'));

            if (slide && image) {

                if (!Title) {
                    angular.extend($scope.slideState, {
                        userClicked: false,
                        alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: 'You are required to fill out a slide title' }])
                    });

                    $timeout(() => {
                        $window.scrollBy(0, document.body.scrollHeight);
                    }, 100);

                    return;

                }

                spService.getListItems(CONST.rootFolder, CONST.slideDB, `?$filter=Title eq '${encodeString(Title)}'&$top=1`,
                    (res) => {
                        let data = res.data.d.results;

                        //if Title does not exist then add onto the database. This is to prevent duplication of titles
                        if (data.length === 0) {
                            spService.addListItem(CONST.rootFolder, CONST.slideDB, {
                                    metadata: {
                                        Title,
                                        slide_categories: slide_categories.join(','),
                                        is_active,
                                        access_control,
                                        slide_description,
                                        slide_version: 1,
                                        downloadCount: 0,
                                        permissioned_users: angular.toJson($scope.slideState.form.permissioned_users),
                                        slide_type: _.endsWith(slide.name, 'key') ? 'Keynote' : 'Powerpoint',
                                        trashbin: 0
                                    },
                                    AttachmentFiles: $scope.slideState.form.files,
                                    prefix: 'v1_'
                                },
                                (success) => {
                                    //document created successfully
                                    angular.extend($scope.slideState, {
                                        uploadingFile: true,
                                        progressBar: 0
                                    });

                                    //scroll to the progress bar
                                    $timeout(() => {
                                        $window.scrollBy(0, document.body.scrollHeight);
                                    }, 100);

                                },
                                (err) => {

                                    // handle error for bad file upload
                                    angular.extend($scope.slideState, {
                                        uploadingFile: false,
                                        userClicked: false,
                                        progressBar: 0,
                                        alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: err.statusText }])
                                    });

                                    spService.getListItems(CONST.rootFolder, CONST.slideDB, `?$filter=Title eq '${Title}'`,
                                        async(res) => {
                                            let data = res.data.d.results;
                                            await deleteSlide(data[0].ID);
                                        },
                                        (res) => {

                                            angular.extend($scope.slideState, {
                                                alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: `${res.statusText} – ${res.data.error.message.value}` }])
                                            });

                                            $timeout(() => {
                                                $window.scrollBy(0, document.body.scrollHeight);
                                            }, 0);
                                        }
                                    );


                                },
                                async(documentID, status, index) => {
                                    //show progress bar

                                    angular.extend($scope.slideState, {
                                        progressBar: parseInt(((index + 1) / $scope.slideState.form.files.length) * 100, 10)
                                    });

                                    //files completed uploading
                                    if (index === $scope.slideState.form.files.length - 1) {

                                        //add the metadata
                                        await updateMetaData(documentID, [{
                                            "id": 1,
                                            "comment": comment,
                                            "lastModified": slide.lastModified,
                                            "modifiedBy": user.full_name,
                                            "email": user.email,
                                            "name": slide.name,
                                            "size": slide.size,
                                            "type": _.endsWith(slide.name, 'key') ? 'application/x-iwork-keynote-sffkey' : 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                            "downloadCount": 0,
                                            "slideCover": `${CONST.rootFolder}/Lists/${CONST.slideDB}/Attachments/${documentID}/v1_${image.name}`, //this needs to be empty because the system doesn't know which ID is it
                                            "filelink": `${CONST.rootFolder}/Lists/${CONST.slideDB}/Attachments/${documentID}/v1_${slide.name}`, //this needs to be empty because the system doesn't know which ID is it
                                            "default": 1
                                        }]);

                                        $timeout(() => {
                                            //redirect 
                                            angular.extend($scope.slideState, {
                                                uploadingFile: false,
                                                userClicked: false
                                            });

                                            //goes to either the admin section or client section
                                            if ($state.includes('app.client.central')) {
                                                $rootScope.stopGuide();
                                                $state.go('app.client.central.slide');

                                            } else {
                                                $state.go('app.administration.slides.list');

                                            }

                                        }, 1500);

                                    }

                                }
                            );
                        } else {
                            angular.extend($scope.slideState, {
                                userClicked: false,
                                alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: 'The slide title is already in use. Please use another title' }])
                            });

                            $timeout(() => {
                                $window.scrollBy(0, document.body.scrollHeight);
                            }, 0);
                        }
                    },
                    (err) => {
                        angular.extend($scope.slideState, {
                            userClicked: false
                        });
                    }
                );


            } else if (slide && !image) {
                if (!Title) {
                    angular.extend($scope.slideState, {
                        userClicked: false,
                        alerts: $scope.slideState.alerts.concat([
                            { type: 'danger', msg: 'You are required to fill out a slide title' },
                            { type: 'danger', msg: 'You are missing a slide cover image. The image type should be either a PNG or JPEG' }
                        ])
                    });
                } else {
                    angular.extend($scope.slideState, {
                        userClicked: false,
                        alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: 'You are missing a slide cover image. The image type should be either a PNG or JPEG' }])
                    });
                }

                $timeout(() => {
                    $window.scrollBy(0, document.body.scrollHeight);
                }, 100);

            } else {
                angular.extend($scope.slideState, {
                    userClicked: false
                });
            }


        }


    };

    $scope.init = async()=>{

        let userInfo = await getUserByID(user.ID, '');
        let userOptions = JSON.parse(userInfo.options);

        if(userOptions.firstTimer){
            $timeout(async()=>{
                $rootScope.showGuide();
                
                angular.extend(userOptions, {
                    firstTimer: false
                });

                await updateUser(user.ID, {options: angular.toJson(userOptions)})
            }, 1000);
        }
    };

    $scope.init();




};