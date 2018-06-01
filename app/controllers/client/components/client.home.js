// @ngInject
module.exports = ($scope, $state, $timeout, $q, spService, _, user, config, CONST, globalFN) => {

    let { ID, sharepoint_id } = user;
    let { getImage, updateUser, getUserByID } = globalFN;

    let userOptions = JSON.parse(user.options);
    let timer;
    
    $scope.homeState = {
        slides: [],
        searchTerm: '',
        slideType: '',
        sortType: '',
        currentPage: 1,
        totalItems: 0,
        isLoading: true,
        toggleSideBar: userOptions.sideBarToggle,
        itemsPerPage: config.itemsPerPage
    };

    //use to get the image path
    $scope.getImage = (dataset) => getImage(dataset);

    $scope.toggle = () => {
        angular.extend($scope.homeState, {
            toggleSideBar: !$scope.homeState.toggleSideBar
        });

        angular.extend(userOptions, {
            sideBarToggle: $scope.homeState.toggleSideBar
        });

        $timeout.cancel(timer);

        timer = $timeout(async() => {
            //update user toggle setting
            await updateUser(user.ID, {
                options: angular.toJson(userOptions)
            });

        }, 5000);
    };

    //clears the search query
    $scope.clear = () => {
        angular.extend($scope.homeState, {
            searchTerm: '',
            slideType: '',
            sortType: ''
        });
    };

    $scope.query = () => {
        let { searchTerm, slideType, sortType } = $scope.homeState;

        let searchParameters = []; //at most two items
        let where = '';
        let isActive = `
                <Eq>
                    <FieldRef Name="is_active" />
                    <Value Type="Number">1</Value>
                </Eq>
            `;

        let isPublic = `
                <Eq>
                    <FieldRef Name="access_control" />
                    <Value Type="Number">1</Value>
                </Eq>
            `;

        let notInTrash = `
                <Eq>
                    <FieldRef Name="trashbin" />
                    <Value Type="Number">0</Value>
                </Eq>
            `;

        if (searchTerm) {
            searchParameters.push(
                `
                        <Contains>
                            <FieldRef Name="Title" />
                            <Value Type="Text">${searchTerm}</Value>
                        </Contains>
                    `
            );
        }

        if (slideType) {
            searchParameters.push(
                `
                        <Eq>
                            <FieldRef Name="slide_type" />
                            <Value Type="Text">${slideType}</Value>
                        </Eq>
                    `
            );
        }

        //this some complicated query I solved
        if (searchParameters.length !== 0) {
            where += `
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
                                ${isPublic}
                            </Or>
                            ${searchParameters.length === 2 ? 
                                `<And><And>${searchParameters.join('')}</And>${notInTrash}</And>` : 
                                `<And><And>${searchParameters.join('')}${isActive}</And>${notInTrash}</And>`}
                        </And>
                    </Where>
                `
        } else {
            where += `
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
                                ${isPublic}
                            </Or>
                            <And>
                                ${isActive}
                                ${notInTrash}
                            </And>
                        </And>
                    </Where>
                `;
        }

        //execute search results
        spService.camlQuery(CONST.rootFolder, CONST.slideDB,
            `
                    <View>
                        <ViewFields>
                            <FieldRef Name="ID"></FieldRef>
                            <FieldRef Name="Title"></FieldRef>
                            <FieldRef Name="slide_type"></FieldRef>
                            <FieldRef Name="file_metadata"></FieldRef>
                        </ViewFields>
                        <Query>
                            ${sortType ? `<OrderBy><FieldRef Name="Title" Ascending="${sortType}"/></OrderBy>`:'<OrderBy><FieldRef Name="ID" Ascending="false"/></OrderBy>'}
                            ${where}
                        </Query>
                        <RowLimit>${config.slideLimit}</RowLimit>
                    </View>           
                `,
            (res) => {

                let { results } = res;


                angular.extend($scope.homeState, {
                    slides: results,
                    totalItems: results.length,
                    isLoading: false
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



    };

    $scope.init = async()=>{

        let userData = await getUserByID(user.ID, '?$select=options');

        userOptions = JSON.parse(userData.options);

        angular.extend($scope.homeState, {
            toggleSideBar: userOptions.sideBarToggle
        });

        $scope.query();

    }






};