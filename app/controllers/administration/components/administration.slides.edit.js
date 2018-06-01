// @ngInject
module.exports = ($window, $uibModal, $timeout, $q, $scope, $state, $stateParams, spService, email, _, config, slide, user, Upload, CONST, globalFN) => {

    let { id } = $stateParams;
    let delayTimer;
    let {
        checkDuplicateTitle,
        encodeString,
        isTemplate,
        isImage,
        getSlideMeta,
        getDefaultMeta,
        getMetaFor,
    } = globalFN;

    //destructuring the slide object
    let {
        ID: slideID,
        Title: title,
        AuthorId,
        slide_description,
        is_active,
        access_control,
        slide_version,
        file_metadata,
        downloadCount,
        permissioned_users,
        slide_type,
        slide_categories: selectedCategories,
        AttachmentFiles: {
            results: fileStorage
        },
        UserProfileProperties
    } = slide;

    let [File] = fileStorage;

    //initial setup
    $scope.slideState = {
        alerts: [],
        enableComment: false,
        progressBar: 0,
        userClicked: false,
        searchWidgetEnable: false,
        searchUserResults: [],
        selectedUser: [],
        isLoading: true,
        uploadingFile: false,
        slideCategoryList: config.slideCategories,
        File,
        form: {
            title,
            comment: '',
            files: [],
            selectedCategories: selectedCategories ? selectedCategories.split(',') : [],
            slide_description,
            is_active,
            permissioned_users: JSON.parse(permissioned_users),
            searchUserQuery: '',
            file_metadata: JSON.parse(file_metadata),
            access_control
        }
    };

    let originalState = angular.copy($scope.slideState);


    $scope.manageVersionHistory = () => {
        let modalInstance = $uibModal.open({
            animation: true,
            controller: 'component.versionHistory',
            templateUrl: CONST.manageVersionHistoryTemplate,
            size: 'lg',
            resolve: {
                slideData: async() => {
                    return {
                        slideID,
                        Title: title,
                        file_metadata: await getSlideMeta(slideID),
                        UserProfileProperties
                    };
                }
            }
        });

        modalInstance.result.then(
            (newMetaData) => {
                angular.extend($scope.slideState.form, {
                    file_metadata: newMetaData
                });

            },
            () => {

            }
        );
    };

    $scope.getMetaFor = getMetaFor;

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

            let newTemplateSwap = _.endsWith(files[0].name, 'key') || _.endsWith(files[0].name, 'pptx');

            angular.extend($scope.slideState, {
                isLoading: false,
                enableComment: newTemplateSwap ? true : false,
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
                    file_metadata: ($scope.slideState.form.file_metadata),
                }
            });
        } else if ($scope.slideState.form.files.length === 1) {


            //execute code when the file type matches
            let shouldSwapTemplate = _.endsWith(files[0].name, 'key') || _.endsWith(files[0].name, 'pptx');

            let shouldSwapFile = _.endsWith(files[0].name, 'key') && _.endsWith($scope.slideState.form.files[0].name, 'key') ||
                _.endsWith(files[0].name, 'pptx') && _.endsWith($scope.slideState.form.files[0].name, 'pptx') ||
                _.endsWith(files[0].name, 'pptx') && _.endsWith($scope.slideState.form.files[0].name, 'key') ||
                _.endsWith(files[0].name, 'key') && _.endsWith($scope.slideState.form.files[0].name, 'pptx') ||
                _.startsWith(files[0].type, 'image') && _.startsWith($scope.slideState.form.files[0].type, 'image');

            angular.extend($scope.slideState, {
                isLoading: false,
                enableComment: !shouldSwapTemplate ? true : false,
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
                    file_metadata: $scope.slideState.form.file_metadata
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
                    file_metadata: $scope.slideState.form.file_metadata
                }
            });


        }


    };

    $scope.isTemplate = isTemplate;
    $scope.isImage = isImage;

    $scope.searchUser = (query) => {

        if (!angular.isString(query)) {
            return;
        }

        $timeout.cancel(delayTimer);

        delayTimer = $timeout(() => {

            let { permissioned_users } = $scope.slideState.form;


            //check if owner of the slide and exclude from search
            let excludeFromSearch = ` and sharepoint_id ne ${AuthorId}`;

            for (let i = 0, totalUser = permissioned_users.length; i < totalUser; i++) {
                excludeFromSearch += ` and ID ne ${permissioned_users[i].ID}`;
            }

            spService.getListItems(CONST.rootFolder, CONST.userDB, `?$select=ID,full_name,email&$orderBy=full_name&$filter=substringof('${encodeString(query)}',full_name)${excludeFromSearch}`,
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
                    }, 0);
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

    $scope.closeAlert = (index) => {
        $scope.slideState.alerts.splice(index, 1);
    };

    $scope.updateInformation = async() => {

        let defaultMetaData = await getDefaultMeta(id);

        angular.extend($scope.slideState, {
            userClicked: true
        });

        let [slide] = _.filter($scope.slideState.form.files, (file) => _.endsWith(file.name, 'key') || _.endsWith(file.name, 'pptx'));
        let [image] = _.filter($scope.slideState.form.files, (file) => _.startsWith(file.type, 'image'));

        //reusing the defaultMetaData path
        let [attachmentPath, imageName] = defaultMetaData.slideCover.split(/\/v\d+_/g);

        let errorUpdating = (res) => {

            angular.extend($scope.slideState, {
                userClicked: false,
                alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: res.statusText }])
            });

            //needs to do a rollback if update fails

            $timeout.setTimeout(() => {
                $window.scrollBy(0, document.body.scrollHeight);


                spService.updateListItem(CONST.rootFolder, CONST.slideDB, id, {
                    Title: title,
                    slide_description,
                    is_active,
                    slide_version,
                    file_metadata,
                    access_control,
                    slide_categories: selectedCategories,
                    downloadCount,
                    permissioned_users
                }, (res) => {
                    angular.merge($scope.slideState, originalState);
                }, (err) => {

                });


            }, 0);



        };

        let shouldChangeMetaData = async() => {

            //check if there is a file
            let replacementMetaData = $scope.slideState.form.file_metadata;
            let totalLength = replacementMetaData.length;

            if (slide) {
                //execute code when there is a slide swap. It will add a new element in the array copy
                //it will also check if there was an image swap too which will change accordingly. Otherwise, the default cover
                //should remain the same
                for (let i = 0; i < totalLength; i++) {

                    if (replacementMetaData[i].default === 1) {
                        replacementMetaData[i].default = 0;
                        replacementMetaData[i].downloadCount = await getDownloadCount();
                    }

                    if (i === totalLength - 1) {

                        //check if the default metadata is current with the slideversion
                        let slideCoverLabel = '';

                        //has an image attachment
                        if (image) {
                            //use the user provided image attachment as the name
                            slideCoverLabel = `${attachmentPath}/v${slide_version + 1}_${image.name}`;

                        } else {
                            //use the current default metadata image name as the name
                            slideCoverLabel = `${attachmentPath}/v${slide_version + 1}_${imageName}`;

                        }

                        //adding new data because there is a new slide attachment
                        replacementMetaData.unshift({
                            "id": slide_version + 1,
                            "comment": $scope.slideState.form.comment,
                            "lastModified": slide.lastModified, //this is for when the slide got modified not when the data got added to the system
                            "modifiedBy": user.full_name,
                            "email": user.email,
                            "name": slide.name,
                            "size": slide.size,
                            "type": _.endsWith(slide.name, 'key') ? 'application/x-iwork-keynote-sffkey' : 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
                            "downloadCount": 0,
                            "slideCover": slideCoverLabel,
                            "filelink": `${attachmentPath}/v${slide_version + 1}_${slide.name}`,
                            "default": 1
                        });
                    }
                }


            } else if (!slide && image) {

                //execute this code when there is no slide swap but there was an image swap
                //data should remain the same except the default slideCover should change
                let idx = _.findIndex(replacementMetaData, { default: 1 });

                if (idx !== -1) {

                    angular.extend(replacementMetaData[idx], {
                        slideCover: `${attachmentPath}/v${defaultMetaData.id}_${image.name}`
                    });

                }


            }

            //if there are no slide and no image then no need to replace the metadata


            //gets rid of that hashtag
            return angular.toJson(replacementMetaData);


        };

        let getDownloadCount = () => {
            let deferred = $q.defer();

            spService.getListItem(CONST.rootFolder, CONST.slideDB, id, '?select=downloadCount',
                (res) => {
                    let { downloadCount } = res.data.d;
                    deferred.resolve(downloadCount);
                },
                errorUpdating
            );

            return deferred.promise;
        };

        let uploadFile = (res) => {
            if (res.status === 204 || res.status === 200) {

                //must have at least one file
                if ($scope.slideState.form.files.length > 0) {

                    angular.extend($scope.slideState, {
                        uploadingFile: true
                    });

                    $timeout(() => {
                        $window.scrollBy(0, document.body.scrollHeight);
                    }, 100);

                    let uploadCallBack = (i) => {
                        if (i !== $scope.slideState.form.files.length) {

                            spService.addListFileAttachment(CONST.rootFolder, CONST.slideDB, id,
                                (slide && image || slide && !image) ? `v${slide_version + 1}_${$scope.slideState.form.files[i].name.replace(/^v\d+_/g,'')}` : `v${defaultMetaData.id}_${$scope.slideState.form.files[i].name}`,
                                $scope.slideState.form.files[i],
                                (res) => {

                                    angular.extend($scope.slideState, {
                                        progressBar: parseInt(((i + 1) / $scope.slideState.form.files.length) * 100, 10)
                                    });

                                    uploadCallBack(i + 1);
                                },
                                (err) => {
                                    // handle error for bad file upload
                                    angular.extend($scope.slideState, {
                                        uploadingFile: false,
                                        userClicked: false,
                                        progressBar: 0,
                                        alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: 'Error uploading file' }])

                                    });
                                }
                            );

                        } else {

                            $timeout(() => {

                                if (slide) {

                                    spService.camlQuery(CONST.rootFolder, CONST.userDB,
                                        `
                                            <View>
                                                <ViewFields>
                                                    <FieldRef Name="ID"></FieldRef>
                                                    <FieldRef Name="email"></FieldRef>
                                                    <FieldRef Name="full_name"></FieldRef>
                                                    <FieldRef Name="current_slide_version"></FieldRef>
                                                </ViewFields>
                                                <Query>
                                                    <Where>
                                                        <And>
                                                            <Neq>
                                                                <FieldRef Name="sharepoint_id" />
                                                                <Value Type="Number">${AuthorId}</Value>
                                                            </Neq>
                                                            <Contains>
                                                                <FieldRef Name="current_slide_version" />
                                                                <Value Type="Text">"${id}":${slide_version}</Value>
                                                            </Contains>
                                                        </And>
                                                    </Where>
                                                </Query>
                                                <RowLimit>5000</RowLimit>
                                            </View>           
                                        `,
                                        (res) => {

                                            let { results } = res;

                                            if (results.length > 0) {

                                                let batchMail = _.reduce(results, (emailTos, item) => {
                                                    emailTos.push(item.email);
                                                    return emailTos;
                                                }, []);

                                                email.send(batchMail, null,
                                                    `
                                                        A new version of your slide is available. Go here to <a href="https://one.mskcc.org/sites/pub/ha/App/SlideCentral/index.html#!/app/client/central/template/${id}">download</a>
                                                    `,
                                                    `${config.applicationName} – New Slide Update`,
                                                    (res) => {

                                                        angular.extend($scope.slideState, {
                                                            uploadingFile: false,
                                                            userClicked: false
                                                        });

                                                        $state.go('app.administration.slides.list');

                                                    },
                                                    (err) => {
                                                        //ignore the email error and go to the slide list
                                                        $state.go('app.administration.slides.list');
                                                    }
                                                );

                                            } else {
                                                angular.extend($scope.slideState, {
                                                    uploadingFile: false,
                                                    userClicked: false
                                                });

                                                $state.go('app.administration.slides.list');
                                            }


                                        },
                                        (err) => {
                                            $state.go('app.administration.slides.list');
                                        }
                                    );

                                } else {
                                    //image was uploaded
                                    angular.extend($scope.slideState, {
                                        uploadingFile: false,
                                        userClicked: false
                                    });

                                    $state.go('app.administration.slides.list');
                                }


                            }, 1500);
                        }

                    }

                    uploadCallBack(0);


                } else {

                    $state.go('app.administration.slides.list');

                }

            } else {
                angular.extend($scope.slideState, {
                    userClicked: false,
                    alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: res.statusText }])
                });
            }
        };

        let shouldRemoveImage = async(res) => {
            //if there is an image swap but no template swap then delete the image

            if (res.status === 204) {
                //get the current default metadata
                let theFileName = defaultMetaData.slideCover.split('/').pop();


                if (image && !slide) {
                    //start deleting after getting the currentSlideMetaData
                    spService.deleteListFileAttachment(CONST.rootFolder, CONST.slideDB, id, theFileName,
                        uploadFile, errorUpdating
                    );

                } else if (!image && slide) {
                    //make a copy of the cover image
                    let blobObj = await spService.getFile(defaultMetaData.slideCover, {
                        blob: false,
                        filename: theFileName
                    });

                    angular.extend($scope.slideState, {
                        form: angular.extend({}, $scope.slideState.form, {
                            files: $scope.slideState.form.files.concat(blobObj)
                        })
                    });

                    uploadFile({ status: 200 });

                } else {
                    //should make a copy of the current default image
                    uploadFile(res);
                }

            } else {
                //need to check a rollback error
                angular.extend($scope.slideState, {
                    userClicked: false,
                    alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: res.statusText }])
                });
            }

        };


        let start = async() => {

            let isClone = await checkDuplicateTitle(encodeString($scope.slideState.form.title), id);

            if (isClone) {
                // handle if there is a duplicated title
                $scope.$apply(() => {

                    angular.extend($scope.slideState, {
                        userClicked: false,
                        alerts: $scope.slideState.alerts.concat([{ type: 'danger', msg: 'The slide title is already in use. Please use another title' }])
                    });

                    $timeout(() => {
                        $window.scrollBy(0, document.body.scrollHeight);
                    }, 0);


                });

            } else {

                //only update the slide version if no new file are added
                let updatedMetaData = await shouldChangeMetaData();

                spService.updateListItem(CONST.rootFolder, CONST.slideDB, id, {
                        Title: $scope.slideState.form.title,
                        slide_description: $scope.slideState.form.slide_description,
                        is_active: $scope.slideState.form.is_active,
                        slide_version: slide ? slide_version + 1 : slide_version,
                        file_metadata: updatedMetaData,
                        access_control: $scope.slideState.form.access_control,
                        slide_categories: (_.filter($scope.slideState.form.selectedCategories, (category)=>_.includes(config.slideCategories, category))).join(','),
                        downloadCount: slide ? 0 : await getDownloadCount(), //reset the download counter if new slide is added
                        permissioned_users: angular.toJson($scope.slideState.form.permissioned_users),
                        slide_type: slide ? ((slide.type === 'application/x-iwork-keynote-sffkey') ? 'Keynote' : 'Powerpoint') : slide_type
                    },
                    shouldRemoveImage, errorUpdating
                );

            }
        }

        start();


    }


};