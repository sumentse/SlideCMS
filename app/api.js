// @ngInject
module.exports = () => {
    //a library of reusable functions
    return {
        $get: /*@ngInject*/ ($q, _, spService, CONST) => {

            return {
                encodeString: (theString) => {
                    return encodeURIComponent(theString).replace(/'/g, "''");
                },
                getTotalUsers: () => {
                    let deferred = $q.defer();

                    spService.getListItems(CONST.rootFolder, CONST.userDB, '',
                        (res) => {
                            deferred.resolve(res.data.d.results.length);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                getComment: (dataset) => {
                    let [version] = _.filter(angular.isString(dataset) ? JSON.parse(dataset) : dataset, (o) => o.default === 1);
                    if (version.comment) {
                        return `comment: ${version.comment}`;
                    } else {
                        return '';
                    }
                },
                getVersionNumber: (dataset) => {
                    let [version] = _.filter(angular.isString(dataset) ? JSON.parse(dataset) : dataset, (o) => o.default === 1);
                    return `v${version.id}`;
                },
                getImage: (dataset) => {
                    let [image] = _.filter(angular.isString(dataset) ? JSON.parse(dataset) : dataset, (o) => o.default === 1);
                    return image.slideCover;
                },
                getSlide: (query = '') => {
                    let deferred = $q.defer();

                    spService.getListItems(CONST.rootFolder, CONST.slideDB, query,
                        (res) => {
                            deferred.resolve(res.data.d.results);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                getUserDownloadHistory: (id) => {
                    let deferred = $q.defer();
                    
                    spService.getListItem(CONST.rootFolder, CONST.userDB, id, '?$select=current_slide_version',
                        (res) => {
                            deferred.resolve(JSON.parse(res.data.d.current_slide_version));
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                getUserByID: (id, query = '') => {
                    let deferred = $q.defer();

                    spService.getListItem(CONST.rootFolder, CONST.userDB, id, query,
                        (res) => {
                            deferred.resolve(res.data.d);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;                    
                },
                getUser: (query = '') => {
                    let deferred = $q.defer();

                    spService.getListItems(CONST.rootFolder, CONST.userDB, query,
                        (res) => {
                            deferred.resolve(res.data.d.results);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                addUser: (metadata) => {
                    let deferred = $q.defer();

                    spService.addListItem(CONST.rootFolder, CONST.userDB, {
                            metadata
                        },
                        (res) => {
                            deferred.resolve(true);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                searchSiteUsers: (query = '', limit = 25) => {
                    let deferred = $q.defer();

                    spService.searchUser(CONST.rootFolder, query, limit,
                        (res) => {
                            deferred.resolve(res.data.d.results);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                isTemplate: (files) => {
                    if (!angular.isArray(files)) {
                        return false;
                    } else {
                        if (files.length === 0) {
                            return false;
                        }
                    }

                    for (let i = 0, totalFiles = files.length; i < totalFiles; i++) {

                        if (_.endsWith(files[i].name, 'key') || _.endsWith(files[i].name, 'pptx')) {
                            return true;
                        }

                    }

                    return false;

                },
                isImage: (files) => {
                    if (!angular.isArray(files)) {
                        return false;
                    } else {
                        if (files.length === 0) {
                            return false;
                        }
                    }

                    for (let i = 0, totalFiles = files.length; i < totalFiles; i++) {

                        if (_.startsWith(files[i].type, 'image')) {
                            return true;
                        }

                    }

                    return false;
                },
                checkDuplicateTitle: (ID, title) => {
                    let deferred = $q.defer();

                    spService.getListItems(CONST.rootFolder, CONST.slideDB, `?$filter=Title eq '${title}' and ID ne '${ID}'`,
                        (res) => {
                            if (res.data.d.results.length === 0) {
                                deferred.resolve(false);
                            } else {
                                deferred.resolve(true);
                            }
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                getMetaFor: (filetype, theFiles, theMetaData) => {
                    if (filetype === 'image') {
                        let [image] = _.filter(theFiles, (file) => _.startsWith(file.type, 'image'));

                        if (image) {
                            return image;
                        }

                        return _.reduce(theMetaData, (acc, curr) => {

                            if (curr.default === 1) {
                                acc.name = curr.slideCover.split('/').pop();
                            }

                            return acc;
                        }, {});
                    }

                    if (filetype === 'slide') {

                        let [slide] = _.filter(theFiles, (file) => _.endsWith(file.name, 'key') || _.endsWith(file.name, 'pptx'));
                        if (slide) {
                            return slide;
                        }

                        return _.reduce(theMetaData, (acc, curr) => {

                            if (curr.default === 1) {
                                acc.name = curr.name;
                                acc.lastModified = curr.lastModified;
                                acc.size = curr.size;
                            }

                            return acc;
                        }, {});
                    }

                    return;
                },
                getDefaultMeta: (ID) => {
                    let deferred = $q.defer();

                    spService.getListItem(CONST.rootFolder, CONST.slideDB, ID, '?select=file_metadata',
                        (res) => {
                            let metadata = JSON.parse(res.data.d.file_metadata);
                            let [defaultMeta] = _.filter(metadata, (o) => o.default === 1);
                            deferred.resolve(defaultMeta);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                getSlideMeta: (ID) => {
                    let deferred = $q.defer();

                    spService.getListItem(CONST.rootFolder, CONST.slideDB, ID, '?select=file_metadata',
                        (res) => {

                            deferred.resolve(JSON.parse(res.data.d.file_metadata));
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                updateMetaData: (ID, theMetaData) => {
                    let deferred = $q.defer();

                    spService.updateListItem(CONST.rootFolder, CONST.slideDB, ID, { file_metadata: angular.toJson(theMetaData) },
                        (res) => {
                            deferred.resolve(true);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                updateSlide: (ID, theMetaData) => {
                    let deferred = $q.defer();

                    spService.updateListItem(CONST.rootFolder, CONST.slideDB, ID, theMetaData,
                        (res) => {

                            deferred.resolve(true);

                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                updateUser: (ID, theMetaData) => {
                    let deferred = $q.defer();

                    spService.updateListItem(CONST.rootFolder, CONST.userDB, ID, theMetaData,
                        (res) => {

                            deferred.resolve(true);

                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                deleteSlide: (ID) => {
                    let deferred = $q.defer();

                    spService.deleteListItem(CONST.rootFolder, CONST.slideDB, ID,
                        (res) => {
                            deferred.resolve(true);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                },
                deleteFile: (ID, fileName) => {
                    let deferred = $q.defer();

                    spService.deleteListFileAttachment(CONST.rootFolder, CONST.slideDB, ID, fileName,
                        (res) => {
                            deferred.resolve(true);
                        },
                        (err) => {
                            deferred.reject(err);
                        }
                    );

                    return deferred.promise;
                }
            };

        }
    }
};