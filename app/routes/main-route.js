// @ngInject
module.exports = ($stateProvider, $urlRouterProvider, $locationProvider, CONST) => {

    $urlRouterProvider.otherwise('/app/client/central');
    $urlRouterProvider.when('/app/administration', '/app/administration/dashboard');
    $urlRouterProvider.when('/app/administration/users', '/app/administration/users/list');
    $urlRouterProvider.when('/app/administration/slides', '/app/administration/slides/list');

    const viewPath = 'views/';
    const adminViewPath = `${viewPath}/administration/`;
    const clientViewPath = `${viewPath}/client/`;

    let user = ($q, $state, spService) => {
        //if no match then take them to the request access page        
        let deferred = $q.defer();


        //check database to see if sp current user matches
        //if match take them to protected route
        let checkIfExist = (Email) => {

            spService.getListItems(CONST.rootFolder, CONST.userDB, `?$filter=email eq '${Email}'`,
                async(res) => {
                    if (res.data.d.results.length > 0) {
                        let [user] = res.data.d.results;

                        //always update the userAgent
                        let theMetaData = {userAgent: angular.toJson(detect.parse(navigator.userAgent))};
                        
                        spService.updateListItem(CONST.rootFolder, CONST.userDB, user.ID, theMetaData,
                            (res) => {

                                deferred.resolve(user);

                            },
                            (err) => {

                                deferred.resolve(user);

                            }
                        );

                    } else {
                        $state.go('signup');
                    }
                },
                (err) => {
                    $state.go('error');
                }
            );

        };

        //check if generic account
        //display error message if generic
        let isGenericAccount = ({ Title, Email }) => {
            //generic does not have a Title
            if (Title) {
                //not generic
                checkIfExist(Email);
            } else {
                $state.go('error', { errorCode: 'Generic' });
            }
        }

        let getCurrentUser = async() => {
            //get the sp current user

            try {
                let { data: { d: currentUser } } = await spService.getCurrentUser(CONST.rootFolder, '');
                isGenericAccount(currentUser);

            } catch (err) {
                $state.go('error');
            }

        }


        getCurrentUser();


        return deferred.promise;
    };

    let hasAdmin = (user, $state, $timeout, $q) => {
        //checking if user has admin privileges

        if (user.is_admin) {
            //allow access if they do
            return true;

        } else {
            $state.go('app.client.central');
            //take them to request access page
            // $state.go('signup');
        }


    };

    let config = ($http, $q, spService) => {

        let deferred = $q.defer();

        spService.getListItems(CONST.rootFolder, CONST.configDB, `?$filter=Title%20eq%20'slidecentral'`,
            (res) => {
                if (res.status === 200) {
                    if (res.data.d.results.length > 0) {
                        deferred.resolve(
                            angular.extend({}, JSON.parse(res.data.d.results[0].config), {
                                Modified: res.data.d.results[0].Modified
                            })
                        );
                    }
                }
                deferred.reject(res);
            },
            (err) => {
                deferred.reject(err);
            }
        );

        return deferred.promise;
    }

    //checks if there is an user with that account ID on the database
    let account = ($http, $q, $state, $stateParams, spService, user) => {
        let { id } = $stateParams;
        let deferred = $q.defer();


        if (id) {

            spService.getListItem(CONST.rootFolder, CONST.userDB, id, '',
                (res) => {
                    if (res.data.d) {
                        deferred.resolve(res.data.d);
                    }
                },
                (err) => {
                    $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.administration.dashboard' });
                }
            );

        } else {
            deferred.reject(false);
        }
        return deferred.promise;

    };

    let checkEditRights = ($q, $state, $stateParams, spService) => {

        let { id } = $stateParams;
        let deferred = $q.defer();

        if (id) {

            spService.getListItem(CONST.rootFolder, CONST.slideDB, id, '?$expand=AttachmentFiles',
                async(res) => {
                    let data = res.data.d;

                    if (data) {
                        let { data: { d: userData } } = await spService.getUserByID(CONST.rootFolder, res.data.d.AuthorId);

                        if(data.trashbin === 1){
                            $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
                        }

                        //access should be granted if they are the original author
                        if (data.AuthorId === userData.Id) {


                            deferred.resolve(
                                angular.extend({}, data, {
                                    UserProfileProperties: userData.UserProfileProperties
                                })
                            );

                        } else {

                            $state.go('app.client.central.error', { errorCode: 403, redirectionPath: 'app.client.central' });

                        }


                    } else {
                        //no data was provided for the slide
                        $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
                    }
                },
                (err) => {
                    $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
                }
            );

        } else {
            //couldn't get ID
            $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
        }

        return deferred.promise;
    };

    //for viewing a slide page
    let checkSlideAuth = ($q, $state, $stateParams, user, _, spService) => {
        let { id } = $stateParams;
        let deferred = $q.defer();

        if (id) {

            spService.getListItem(CONST.rootFolder, CONST.slideDB, id, '?$expand=AttachmentFiles',
                async(res) => {
                    let data = res.data.d;

                    if (data) {
                        let { data: { d: userData } } = await spService.getUserByID(CONST.rootFolder, res.data.d.AuthorId);

                        if(data.trashbin === 1){
                            $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
                        }

                        //access should be granted if they are the original author
                        if (data.AuthorId === userData.Id) {


                            deferred.resolve(
                                angular.extend({}, data, {
                                    UserProfileProperties: userData.UserProfileProperties
                                })
                            );

                        } else {

                            //the slide is public and active
                            if (data.access_control === 1 && data.is_active === 1) {
                                deferred.resolve(
                                    angular.extend({}, data, {
                                        UserProfileProperties: userData.UserProfileProperties
                                    })
                                );
                            } else {
                                //the slide is not public and will proceed to check if they are permissioned
                                let permissionList = JSON.parse(data.permissioned_users);
                                let idx = _.findIndex(permissionList, (authUser) => authUser.email === user.email);

                                //user was found in the database and they are permissioned
                                if (idx !== -1) {
                                    //check if slide is active
                                    if (data.is_active === 1) {

                                        deferred.resolve(
                                            angular.extend({}, data, {
                                                UserProfileProperties: userData.UserProfileProperties
                                            })
                                        );

                                    } else {
                                        $state.go('app.client.central.error', { errorCode: 403, redirectionPath: 'app.client.central' });
                                    }

                                } else {
                                    $state.go('app.client.central.error', { errorCode: 403, redirectionPath: 'app.client.central' });
                                }
                            }

                        }


                    } else {
                        //no data was provided for the slide
                        $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
                    }
                },
                (err) => {
                    $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
                }
            );

        } else {
            //couldn't get ID
            $state.go('app.client.central.error', { errorCode: 404, redirectionPath: 'app.client.central' });
        }

        return deferred.promise;
    }

    let slide = ($http, $q, $state, $stateParams, spService) => {
        let { id } = $stateParams;
        let deferred = $q.defer();

        if (id) {

            spService.getListItem(CONST.rootFolder, CONST.slideDB, id, '?$expand=AttachmentFiles',
                (res) => {
                    let data = res.data.d;
                    if (data) {
                        deferred.resolve(data);
                    }
                },
                (err) => {
                    $state.go('app.administration.error', { errorCode: 404, redirectionPath: 'app.administration.dashboard' });
                }
            );

        } else {
            deferred.reject(false);
        }

        return deferred.promise;
    };

    let myProfile = ($state, $http, $q, _, spService) => {

        let deferred = $q.defer();

        let findProfile = async() => {
            let { data: { d: currentUser } } = await spService.getCurrentUser(CONST.rootFolder, '');

            //fetch the sharepoint ID
            spService.searchUser(CONST.rootFolder, currentUser.Email, 1,
                (res) => {
                    if (res.data.d.results.length > 0) {
                        //get the results from the first array
                        let [data] = res.data.d.results;
                        let { Id: sharepoint_id } = data;

                        deferred.resolve(
                            angular.extend(currentUser, {
                                sharepoint_id
                            })
                        );
                    } else {
                        //cannot get the sharepoint ID
                        deferred.reject(false)
                    }
                },
                (err) => {
                    $state.go('error');
                }
            )

        }

        findProfile();

        return deferred.promise;
    };

    $stateProvider
        .state('signup', {
            url: '/signup',
            data: {
                'backgroundColor': '#fff'
            },
            resolve: {
                myProfile,
                config
            },
            views: {
                '': {
                    controller: 'signup.controller',
                    templateUrl: `${viewPath}signup.html`
                },
                'loader@signup': {
                    templateUrl: `${viewPath}components/loader.html`
                }
            }
        })
        .state('error', {
            url: '/error',
            params: {
                errorCode: null,
                redirectionPath: null,
                errorHeader: null,
                errorMessage: null,
                buttonLabel: null,
                icon: null
            },
            controller: 'component.error',
            templateUrl: `${viewPath}error.html`,
            data: {
                'backgroundColor': '#fff'
            }
        })
        .state('app', {
            url: '/app',
            abstract: true,
            template: '<div ui-view></div>',
            data: {
                'backgroundColor': '#fff'
            },
            resolve: {
                user, //logic to sign up a user, checking generic, or if user exists
                myProfile, //getting loginUserInformation
                config //getting the app configuration settings
            }
        })
        .state('app.client', {
            url: '/client',
            abstract: true,
            views: {
                '': {
                    controller: 'client.controller',
                    templateUrl: `${clientViewPath}client.html`
                },
                'client-navigation@app.client': {
                    templateUrl: `${clientViewPath}navigation.html`
                }
            }
        })
        .state('app.client.central', {
            url: '/central',
            views: {
                'page@app.client': {
                    controller: 'client.home',
                    templateUrl: `${clientViewPath}/partials/home/central.html`
                },
                'sidebar@app.client.central': {
                    templateUrl: `${clientViewPath}/partials/home/sidebar.html`
                },
                'loader@app.client.central': {
                    templateUrl: `${viewPath}components/loader.html`
                }
            }
        })
        .state('app.client.central.template', {
            url: '/template/{id:int}',
            resolve: {
                slide: checkSlideAuth
            },
            views: {
                'page@app.client': {
                    controller: 'client.view',
                    templateUrl: `${clientViewPath}/partials/home/slidePage.html`
                }
            }
        })
        .state('app.client.central.slide', {
            url: '/slides',
            views: {
                'page@app.client': {
                    controller: 'client.slides',
                    templateUrl: `${clientViewPath}/partials/slides/slides.html`
                },
                'loader@app.client.central.slide': {
                    templateUrl: `${viewPath}components/loader.html`
                }
            }
        })
        .state('app.client.central.slide.add', {
            url: '/add',
            views: {
                'page@app.client': {
                    controller: 'component.slide.add',
                    templateUrl: `${clientViewPath}/partials/slides/newSlide.html`
                }
            }
        })
        .state('app.client.central.slide.edit', {
            url: '/edit/{id:int}',
            views: {
                'page@app.client': {
                    resolve: {
                        slide: checkEditRights
                    },
                    controller: 'client.slides.edit',
                    templateUrl: `${clientViewPath}/partials/slides/slideDetail.html`
                }
            }
        })
        .state('app.client.central.error', {
            url: '/error',
            params: {
                errorCode: null,
                redirectionPath: null
            },
            views: {
                'page@app.client': {
                    controller: 'component.error',
                    templateUrl: `${viewPath}/error.html`
                }
            }
        })
        .state('app.administration', {
            url: '/administration',
            abstract: true,
            data: {
                'backgroundColor': '#f8f8f8'
            },
            resolve: {
                hasAdmin
            },
            views: {
                '': {
                    controller: 'administration.controller',
                    templateUrl: `${adminViewPath}administration.html`
                },
                'admin-navigation@app.administration': {
                    controller: ($scope, user) => {
                        $scope.navigationState = {
                            profileID: user.ID
                        };
                    },
                    templateUrl: `${adminViewPath}navigation.html`
                }
            }
        })
        .state('app.administration.dashboard', {
            url: '/dashboard',
            views: {
                'page@app.administration': {
                    controller: 'administration.dashboard',
                    templateUrl: `${adminViewPath}/partials/dashboard.html`
                }
            }
        })
        .state('app.administration.users', {
            url: '/users',
            abstract: true
        })
        .state('app.administration.users.list', {
            url: '/list?is_admin',
            params: {
                is_admin: null
            },
            reloadOnSearch: false,
            views: {
                'page@app.administration': {
                    controller: 'administration.users',
                    templateUrl: `${adminViewPath}/partials/users/users.html`
                },
                'loader@app.administration.users.list': {
                    templateUrl: `${viewPath}components/loader.html`
                }
            }
        })
        .state('app.administration.users.edit', {
            url: '/edit/{id:int}',
            views: {
                'page@app.administration': {
                    resolve: {
                        account
                    },
                    controller: 'administration.users.edit',
                    templateUrl: `${adminViewPath}/partials/users/userDetail.html`
                }
            }
        })
        .state('app.administration.users.add', {
            url: '/add',
            views: {
                'page@app.administration': {
                    controller: 'administration.users',
                    templateUrl: `${adminViewPath}/partials/users/newUser.html`
                }
            }
        })
        .state('app.administration.slides', {
            url: '/slides',
            abstract: true
        })
        .state('app.administration.slides.list', {
            url: '/list?is_active',
            params: {
                is_active: null
            },
            reloadOnSearch: false,
            views: {
                'page@app.administration': {
                    controller: 'administration.slides',
                    templateUrl: `${adminViewPath}/partials/slides/slides.html`
                },
                'loader@app.administration.slides.list': {
                    templateUrl: `${viewPath}components/loader.html`
                }
            }
        })
        .state('app.administration.slides.add', {
            url: '/add',
            views: {
                'page@app.administration': {
                    controller: 'component.slide.add',
                    templateUrl: `${adminViewPath}/partials/slides/newSlide.html`
                }
            }
        })
        .state('app.administration.slides.edit', {
            url: '/edit/{id:int}',
            views: {
                'page@app.administration': {
                    resolve: {
                        slide
                    },
                    controller: 'administration.slides.edit',
                    templateUrl: `${adminViewPath}/partials/slides/slideDetail.html`
                }
            }
        })
        .state('app.administration.settings', {
            url: '/settings',
            abstract: true
        })
        .state('app.administration.settings.general', {
            url: '/general',
            parent: 'app.administration.settings',
            views: {
                'page@app.administration': {
                    controller: 'administration.settings',
                    templateUrl: `${adminViewPath}/partials/settings.html`
                }
            }
        })
        .state('app.administration.settings.logs', {
            url: '/logs',
            parent: 'app.administration.settings',
            views: {
                'page@app.administration': {
                    templateUrl: `${adminViewPath}/partials/settings.html`
                }
            }
        })
        .state('app.administration.error', {
            url: '/error',
            params: {
                errorCode: null,
                redirectionPath: null,
                errorHeader: null,
                errorMessage: null,
                buttonLabel: null,
                icon: null
            },
            views: {
                'page@app.administration': {
                    controller: 'component.error',
                    templateUrl: `${viewPath}/error.html`
                }
            }
        })

    if (CONST.htmlMode) {
        $locationProvider.html5Mode(true);
    }

};