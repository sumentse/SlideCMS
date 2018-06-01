// @ngInject
module.exports = ($q, $scope, spService, _, CONST, globalFN, email) => {

    let { getSlide, getUser } = globalFN;

    $scope.dashboardState = {
        totals: {
            admins: 0,
            users: 0,
            slides: 0,
            downloads: 0
        },
        notifications: {
            latestSlide: null,
            latestUser: null,
            latestAdminUser: null,
            latestConfigurationUpdate: null
        }
    };

    let totalAdmin = async() => {
        let deferred = $q.defer();

        try {

            let results = await getUser('?$filter=is_admin eq 1');

            deferred.resolve(results.length);

        } catch (err) {

            deferred.reject(err);

        }

        return deferred.promise;
    };

    let totalUsers = async() => {
        let deferred = $q.defer();

        try {
            let results = await getUser();
            deferred.resolve(results.length);
        } catch (err) {
            deferred.reject(err);
        }

        return deferred.promise;

    };

    let totalSlides = async() => {
        let deferred = $q.defer();

        try {
            let results = await getSlide();
            deferred.resolve(results.length);
        } catch (err) {
            deferred.reject(err);
        }

        return deferred.promise;

    };

    let totalDownloads = async() => {
        let deferred = $q.defer();

        try {
            let results = await getSlide('?$select=downloadCount');
            deferred.resolve(_.reduce(results, (sum, entry) => {
                return sum + entry.downloadCount;
            }, 0));
        } catch (err) {
            deferred.reject(err);
        }

        return deferred.promise;

    };

    let getLatestSlide = async() => {
        let deferred = $q.defer();

        try {
            let results = await getSlide('?$select=ID,Created&$orderBy=ID desc&$top=1');
            if (results.length === 0) {

                deferred.resolve(null);

            } else {

                deferred.resolve(results[0]);

            }
        } catch (err) {
            deferred.reject(err);
        }


        return deferred.promise;

    };

    let getLatestUser = async() => {
        let deferred = $q.defer();

        try {
            let results = await getUser('?$select=ID,Created&$orderBy=ID desc&$top=1');
            if (results.length === 0) {

                deferred.resolve(null);

            } else {

                deferred.resolve(results[0]);

            }
        } catch (err) {
            deferred.reject(err);
        }


        return deferred.promise;

    };

    let getLatestAdminUser = async() => {
        let deferred = $q.defer();

        try {
            let results = await getUser('?$select=ID,Created&$filter=is_admin eq 1&$orderBy=ID desc&$top=1');
            if (results.length === 0) {
                deferred.resolve(null);
            } else {
                deferred.resolve(results[0]);
            }
        } catch (err) {
            deferred.reject(err);
        }

        return deferred.promise;

    };

    let lastConfigurationUpdate = () => {
        let deferred = $q.defer();


        spService.getListItems(CONST.rootFolder, 'Apps Configurations', `?$select=Modified&$filter=Title eq 'slidecentral'`,
            (res) => {

                if (res.data.d.results.length > 0) {

                    deferred.resolve(res.data.d.results[0].Modified)
                }

            },
            (err) => {
                deferred.reject(err);
            }
        );


        return deferred.promise;
    };


    let promises = {
        admins: totalAdmin(),
        users: totalUsers(),
        slides: totalSlides(),
        downloads: totalDownloads(),
        latestSlide: getLatestSlide(),
        latestUser: getLatestUser(),
        latestAdminUser: getLatestAdminUser(),
        latestConfigurationUpdate: lastConfigurationUpdate()

    };

    $q.all(promises).then(({
        admins,
        users,
        slides,
        downloads,
        latestSlide,
        latestUser,
        latestAdminUser,
        latestConfigurationUpdate
    }) => {
        angular.merge($scope.dashboardState, {
            totals: {
                admins,
                users,
                slides,
                downloads
            },
            notifications: {
                latestSlide,
                latestUser,
                latestAdminUser,
                latestConfigurationUpdate
            }
        });

    });


};