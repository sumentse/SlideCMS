// @ngInject
module.exports = ($sce, $scope, $uibModal, $state, $q, spService, _, user, slide, CONST, IE, globalFN) => {

    let { ID, sharepoint_id } = user;
    let { getSlideMeta, getImage } = globalFN;

    let {
        ID: slideID,
        Title,
        slide_description,
        slide_categories,
        slide_version,
        slide_type,
        Modified,
        file_metadata,
        UserProfileProperties
    } = slide;


    $scope.slidePage = {
        Title,
        slide_description,
        slide_categories: slide_categories ? slide_categories.split(',') : [],
        slide_type,
        file_metadata: JSON.parse(file_metadata),
        alikeTemplates: [],
        UserProfileProperties,
        Modified,
        showDownloadProgressBar: false,
        downloadProgress: 0,
    };

    $scope.getImage = (dataset) => getImage(dataset);

    $scope.openVersionHistory = () => {

        let modalInstance = $uibModal.open({
            animation: true,
            controller: 'component.versionHistory',
            templateUrl: CONST.userVersionHistoryTemplate,
            size: 'lg',
            resolve: {
                slideData: async() => {
                    return {
                        slideID,
                        Title,
                        file_metadata: await getSlideMeta(slideID),
                        UserProfileProperties
                    };
                }
            }
        });

        modalInstance.result.then(
            (res) => {},
            () => {

            }
        );

    };

    $scope.fetchSimilarTemplates = () => {
        //will not match any if there's no category on that slide
        if ($scope.slidePage.slide_categories.length === 0) {
            return;
        }

        let randomizedCategory = _.sampleSize($scope.slidePage.slide_categories, 4);
        let categoryQuery = '';


        if (randomizedCategory.length === 1) {
            categoryQuery += `
                <Contains>
                    <FieldRef Name="slide_categories" />
                    <Value Type="Text">${randomizedCategory[0]}</Value>
                </Contains>
            `;
        } else if (randomizedCategory.length === 2) {
            categoryQuery += `
                <Or>
                    <Contains>
                        <FieldRef Name="slide_categories" />
                        <Value Type="Text">${randomizedCategory[0]}</Value>
                    </Contains>
                    <Contains>
                        <FieldRef Name="slide_categories" />
                        <Value Type="Text">${randomizedCategory[1]}</Value>
                    </Contains>
                </Or>
            `;
        } else if (randomizedCategory.length === 3) {
            categoryQuery += `
                <Or>
                    <Or>
                        <Contains>
                            <FieldRef Name="slide_categories" />
                            <Value Type="Text">${randomizedCategory[0]}</Value>
                        </Contains>
                        <Contains>
                            <FieldRef Name="slide_categories" />
                            <Value Type="Text">${randomizedCategory[1]}</Value>
                        </Contains>
                    </Or>
                    <Contains>
                        <FieldRef Name="slide_categories" />
                        <Value Type="Text">${randomizedCategory[2]}</Value>
                    </Contains>
                </Or>
            `;
        } else {
            categoryQuery += `
                <Or>
                    <Or>
                        <Contains>
                            <FieldRef Name="slide_categories" />
                            <Value Type="Text">${randomizedCategory[0]}</Value>
                        </Contains>
                        <Contains>
                            <FieldRef Name="slide_categories" />
                            <Value Type="Text">${randomizedCategory[1]}</Value>
                        </Contains>
                    </Or>
                    <Or>
                        <Contains>
                            <FieldRef Name="slide_categories" />
                            <Value Type="Text">${randomizedCategory[2]}</Value>
                        </Contains>
                        <Contains>
                            <FieldRef Name="slide_categories" />
                            <Value Type="Text">${randomizedCategory[3]}</Value>
                        </Contains>
                    </Or> 
                </Or>
            `;
        }

        spService.camlQuery(CONST.rootFolder, CONST.slideDB,
            `
<View>
    <Query>
        <Where>
            <And>
                <Or>
                    <Or>
                        <Eq>
                            <FieldRef Name="Author" LookupId='True' />
                            <Value Type="Lookup">${sharepoint_id}</Value>
                        </Eq>
                        <Contains>
                            <FieldRef Name="permissioned_users" />
                            <Value Type="Text">:${ID},</Value>
                        </Contains>
                    </Or>
                    <Eq>
                        <FieldRef Name="access_control" />
                        <Value Type="Number">1</Value>
                    </Eq>
                </Or>
                <And>
                    <And>
                        <Eq>
                            <FieldRef Name="is_active" />
                            <Value Type="Number">1</Value>
                        </Eq>
                        <Neq>
                            <FieldRef Name="ID"/>
                            <Value Type="Counter">${slideID}</Value>
                        </Neq>
                    </And>
                    ${categoryQuery}
                </And>
            </And>
        </Where>
    </Query>
</View>        
            `,
            (res) => {

                let { results } = res;

                let matches = _.reduce(results, (acc, curr) => {

                    if (_.intersection(curr.slide_categories.split(','), $scope.slidePage.slide_categories).length > 0) {
                        acc.push(curr);
                    }

                    return acc;
                }, []);

                angular.extend($scope.slidePage, {
                    alikeTemplates: _.sampleSize(matches, 4)
                });

            },
            (err) => {
                throw Err;
            }
        );



    };

    $scope.getIFrameLink = () => {
        let [slideMetaData] = _.filter(JSON.parse(slide.file_metadata), (slide) => slide.default === 1);

        if (slideMetaData) {
            //only works for powerpoint files
            if (_.endsWith(slideMetaData.name, 'pptx') || _.endsWith(slideMetaData.name, 'ppt')) {
                return $sce.trustAsResourceUrl(`${CONST.rootFolder}/_layouts/15/WopiFrame2.aspx?sourcedoc=${CONST.rootFolder}/Lists/${CONST.slideDB}/Attachments/${slideID}/v${slide.slide_version}_${slideMetaData.name}&action=embedView&Embed=1`);

            }
        }

        return;

    };

    $scope.download = () => {

        let fetchUserData = () => {
            let deferred = $q.defer();

            spService.getListItem(CONST.rootFolder, CONST.userDB, user.ID, '',
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
                userDownloadHistory[slideID] = results.slide.slide_version;
                let [theFile] = _.filter(JSON.parse(results.slide.file_metadata), (slide) => slide.default === 1);

                if (theFile) {

                    await spService.downloadAttachment(theFile.filelink, {
                            type: theFile.type,
                            name: theFile.filelink.split('/').pop().replace(/v\d+_/g, ''),
                        },
                        (progress) => {
                            angular.extend($scope.slidePage, {
                                downloadProgress: progress,
                                showDownloadProgressBar: true
                            });
                        }
                    );

                    angular.extend($scope.slidePage, {
                        downloadProgress: 0,
                        showDownloadProgressBar: false
                    });
                    
                    await updateDownloadRecord(results.user.ID, userDownloadHistory);
                    await addDownloadCount(results.slide.downloadCount);

                } else {
                    throw 'Warning: there is no default file to download';
                }

            });

        } catch (err) {
            throw Error(err);
        }


    }


};