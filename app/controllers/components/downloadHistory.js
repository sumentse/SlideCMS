// @ngInject
module.exports = ($q, $scope, $state, $uibModalInstance, history, spService, CONST, _, userID, globalFN) => {

    let {updateUser} = globalFN;

    $scope.modalState = {
        historyItems: [],
        didChangeOccur: false,
        downloadProgress: 0,
        showDownloadProgressBar: false
    };

    //catches the backdrop click
    $scope.$on('modal.closing', (event, reason, closed)=>{
        if (reason == "backdrop click" || reason == "escape key press") {
            event.preventDefault();

            $uibModalInstance.close($scope.modalState.didChangeOccur);
        }
    });

    $scope.openNewWindow = (slideID)=>{
        let url = $state.href('app.client.central.template', {id:slideID});
        window.open(url,'_blank');
    };

    $scope.fetchItems = () => {
        let where = '';

        if (history.length > 0) {

            where += '<Where><In><FieldRef Name="ID" /><Values>';


            for (let i = 0, totalItem = history.length; i < totalItem; i++) {

                where += `<Value Type="Number">${history[i].slideID}</Value>`;

            }

            where += '</Values></In></Where>';


        }


        spService.camlQuery(CONST.rootFolder, CONST.slideDB,
            `
                <View>
                    <ViewFields>
                        <FieldRef Name="ID"></FieldRef>
                        <FieldRef Name="Title"></FieldRef>
                        <FieldRef Name="slide_version"></FieldRef>
                        <FieldRef Name="file_metadata"></FieldRef>
                    </ViewFields>
                    <Query>
                        ${where}
                    </Query>
                    <RowLimit>5000</RowLimit>
                </View>           
            `,
            async(res) => {

                let { results } = res;
                let mapper = _.keyBy(history, 'slideID');

                angular.extend($scope.modalState, {
                    historyItems: _.reduce(results, (acc, curr) => {

                        let [defaultMeta] = _.filter(JSON.parse(curr.file_metadata), (meta) => meta.default === 1);

                        if(mapper[curr.ID]){
                            acc.push(
                                angular.extend(curr, {
                                    user_version: mapper[curr.ID]['version'],
                                    latest_version: defaultMeta.id
                                })
                            );
                        }

                        return acc;
                    }, [])
                });

                let recordsToUpdate = _.reduce($scope.modalState.historyItems, (acc, curr)=>{
                    acc[curr.ID] = curr.user_version;

                    return acc;

                }, {});

                //remove slide ID if the slide was remove by author
                await updateUser(userID, {
                    current_slide_version: angular.toJson(recordsToUpdate)
                });

            },
            (err) => {
                $state.go('error', {
                    errorCode: 'custom',
                    redirectionPath: 'app.client.central',
                    errorHeader: '400 - Bad Request',
                    errorMessage: 'It seems something went wrong',
                    buttonLabel: 'Home',
                    icon: 'fa fa-frown-o text-danger'
                });
            }
        );

    }

    $scope.download = (slideID) => {


        let fetchUserData = () => {
            let deferred = $q.defer();

            spService.getListItem(CONST.rootFolder, CONST.userDB, userID, '',
                (res) => {
                    deferred.resolve(res.data.d);
                },
                (err) => {
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        };

        let fetchSlideData = () => {
            //this makes sure that if something updated on the backend they will get the latest one
            let deferred = $q.defer();

            spService.getListItem(CONST.rootFolder, CONST.slideDB, slideID, '?$select=downloadCount, file_metadata, slide_version',
                (res) => {
                    deferred.resolve(res.data.d);
                },
                (err) => {
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        };


        let updateDownloadRecord = (userID, record) => {
            let deferred = $q.defer();

            spService.updateListItem(CONST.rootFolder, CONST.userDB, userID, {
                    current_slide_version: angular.toJson(record)
                },
                (res) => {
                    deferred.resolve(true);
                },
                (err) => {
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        };

        let addDownloadCount = (startingFrom = 0) => {
            let deferred = $q.defer();

            spService.updateListItem(CONST.rootFolder, CONST.slideDB, slideID, {
                    downloadCount: startingFrom + 1
                },
                (res) => {
                    deferred.resolve(true);
                },
                (err) => {
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        }

        try {
            let promises = {
                user: fetchUserData(),
                slide: fetchSlideData()
            };


            $q.all(promises).then(async(results) => {
                let userDownloadHistory = JSON.parse(results.user.current_slide_version);
                let [theFile] = _.filter(JSON.parse(results.slide.file_metadata), (slide) => slide.default === 1);
                userDownloadHistory[slideID] = theFile.id;

                if (theFile) {

                    await spService.downloadAttachment(theFile.filelink, {
                        type: theFile.type,
                        name: theFile.filelink.split('/').pop().replace(/v\d+_/g, '')
                    }, (progress)=>{
                        angular.extend($scope.modalState, {
                            downloadProgress: progress,
                            showDownloadProgressBar: true
                        });                        
                    });

                    angular.extend($scope.modalState, {
                        downloadProgress: 0,
                        showDownloadProgressBar: false
                    });

                    await updateDownloadRecord(results.user.ID, userDownloadHistory);
                    await addDownloadCount(results.slide.downloadCount);

                    let idx = _.findIndex($scope.modalState.historyItems, (o) => o.ID === slideID);

                    if ($scope.modalState.historyItems[idx].user_version !== $scope.modalState.historyItems[idx].latest_version) {


                        $scope.$apply(() => {

                            angular.extend($scope.modalState.historyItems[idx], {
                                user_version: theFile.id
                            });

                            angular.extend($scope.modalState, {
                                didChangeOccur: true
                            });


                        });

                    }

                } else {
                    throw 'Warning: there is no default file to download';
                }

            });

        } catch (err) {
            throw Error(err);
        }


    }

    $scope.closeModal = () => {
        $uibModalInstance.close($scope.modalState.didChangeOccur);
    };

    $scope.fetchItems();

};