// @ngInject
module.exports = () => {
    let defaultDomain = "/";
    let digestValue = angular.element(document.querySelector("#__REQUESTDIGEST")).val();
    return {
        urlDomain: (urlLink) => {
            if (angular.isDefined(urlLink)) {
                defaultDomain = urlLink;
                return this;
            } else {
                return defaultDomain;
            }
        },       
        $get: /*@ngInject*/ ($http, $q) => {
            return {
                getDigestValue: (complete = () => {}) => {

                    let deferred = $q.defer();

                    if (digestValue != null) {
                        complete(digestValue);
                        deferred.resolve(digestValue);
                    } else {

                        $http({
                            url: `${defaultDomain}/_api/contextinfo`,
                            async: true,
                            method: "POST",
                            headers: {
                                "accept": "application/json;odata=verbose",
                                "contentType": "text/xml"
                            }
                        }).then((response) => {
                            digestValue = response.data.d.GetContextWebInformation.FormDigestValue;
                            complete(digestValue);
                            deferred.resolve(digestValue);

                        }, (response) => {
                            alert("Cannot get digestValue.");
                            deferred.reject(response);

                        });

                    }

                    return deferred.promise;


                },
                getFileBuffer: (file) => {
                    let deffered = $q.defer();

                    let reader = new FileReader();
                    reader.onload = (e) => {
                        deffered.resolve(e.target.result);
                    }
                    reader.onerror = (e) => {
                        deffered.reject(e.target.error);
                    }
                    reader.readAsArrayBuffer(file);
                    return deffered.promise;

                },                
                getFolderItems: (url, folderpath = '', query = '', complete, failure) => {
                    //folderpath should start with /sites/domain/foldername
                    $http({
                        url: `${url}/_api/web/getFolderByServerRelativeUrl('${encodeURIComponent(folderpath)}')/Files${query}`,
                        method: "GET",
                        headers: {
                            "Accept": "application/json; odata=verbose"
                        }
                    }).then((response) => {
                        complete(response);
                    }, (response) => {
                        failure(response);
                    });
                },
                getFolders: (url, folderpath = '', query = '', complete, failure) => {
                    $http({
                        url: `${url}/_api/web/getFolderByServerRelativeUrl('${encodeURIComponent(folderpath)}')/Folders${query}`,
                        method: "GET",
                        headers: {
                            "Accept": "application/json; odata=verbose"
                        }
                    }).then((response) => {
                        complete(response);
                    }, (response) => {
                        failure(response);
                    });
                },
                getListItemAllFields: (url, folderpath = '') => {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/getFolderByServerRelativeUrl('${encodeURIComponent(folderpath)}')/ListItemAllFields`,
                        method: "GET",
                        headers: {
                            "Accept": "application/json; odata=verbose"
                        }
                    }).then((response) => {
                        deferred.resolve(response.data.d);
                    }, (error) => {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                },
                level: async function(url, folderpath = '') {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(folderpath)}')/Level`,
                        method: "GET",
                        headers: {
                            "Accept": "application/json; odata=verbose"
                        }
                    }).then(
                        (response) => {

                            let levelType = 'checkout';

                            if (response.data.d.Level === 1) {
                                levelType = 'published';
                            } else if (response.data.d.Level === 2) {
                                levelType = 'draft';
                            }

                            deferred.resolve(levelType)
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                isCheckOut: async function(url, folderpath = '') {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(folderpath)}')/checkOutType`,
                        method: "GET",
                        headers: {
                            "Accept": "application/json; odata=verbose"
                        }
                    }).then(
                        (response) => {
                            deferred.resolve(response.data.d.CheckOutType === 0 ? true : false)
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                checkOut: async function(url, folderpath = '') {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(folderpath)}')/checkout`,
                        method: "POST",
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "X-RequestDigest": await this.getDigestValue()
                        }
                    }).then(
                        (response) => {
                            deferred.resolve(true);
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                checkIn: async function(url, folderpath = '') {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(folderpath)}')/CheckIn(comment='Comment',checkintype=0)`,
                        method: "POST",
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "X-RequestDigest": await this.getDigestValue()
                        }
                    }).then(
                        (response) => {
                            deferred.resolve(true);
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                addFile: async function(url, folderpath = '', file) {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderpath)}')/Files/add(url='${file.name}',overwrite=${file.overwrite})`,
                        method: "POST",
                        data: await this.getFileBuffer(file.data),
                        processData: false,
                        transformRequest: (data) => {
                            return data;
                        },
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "X-RequestDigest": await this.getDigestValue()
                        }
                    }).then(
                        (response) => {
                            deferred.resolve(true);
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                deleteFile: async function(url, folderpath = '') {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(folderpath)}')`,
                        method: "POST",
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "X-RequestDigest": await this.getDigestValue(),
                            "IF-MATCH": "*",
                            "X-HTTP-Method": "DELETE"
                        }
                    }).then(
                        (response) => {
                            deferred.resolve(true);
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                createFolder: async function(url, folderpath = '', foldername, complete, failure) {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/folders`,
                        method: "POST",
                        data: angular.toJson({ '__metadata': { 'type': 'SP.Folder' }, 'ServerRelativeUrl': `${encodeURIComponent(folderpath)}/${encodeURIComponent(foldername)}` }),
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "X-RequestDigest": await this.getDigestValue(),
                            "Content-Type": "application/json;odata=verbose"
                        }
                    }).then(
                        (response) => {
                            complete(response);
                            deferred.resolve(true);
                        },
                        (error) => {
                            failure(error);
                            deferred.resolve(false);
                        }
                    );

                    return deferred.promise;
                },
                deleteFolder: async function(url, folderpath = '') {
                    let deferred = $q.defer();

                    $http({
                        url: `${url}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderpath)}')`,
                        method: "POST",
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "X-RequestDigest": await this.getDigestValue(),
                            "IF-MATCH": "*",
                            "X-HTTP-Method": "DELETE"
                        }
                    }).then(
                        (response) => {
                            deferred.resolve(true);
                        },
                        (error) => {
                            deferred.reject(error);
                        }
                    );

                    return deferred.promise;
                },
                rename: async function(url, path, newName) {


                    let deferred = $q.defer();

                    if(angular.isUndefined(newName) || angular.isUndefined(path)){
                        deferred.reject('path or newName argument missing');
                    }

                    let { __metadata } = await this.getListItemAllFields(url, path);

                    if (!__metadata) {
                        deferred.reject('folder was not found');
                    } else {

                        let item = angular.extend({
                            "__metadata": {
                                "type": __metadata.type
                            }
                        }, { Title: encodeURIComponent(newName), FileLeafRef: encodeURIComponent(newName) });

                        $http({
                            url: __metadata.uri,
                            method: "POST",
                            data: angular.toJson(item),
                            headers: {
                                "Accept": "application/json;odata=verbose",
                                "Content-Type": "application/json;odata=verbose",
                                "X-RequestDigest": await this.getDigestValue(),
                                "X-HTTP-Method": "MERGE",
                                "If-Match": "*"
                            }
                        }).then(
                            (response) => {
                                deferred.resolve(true)
                            },
                            (error) => {
                                deferred.reject(error);
                            }
                        );
                    }



                    return deferred.promise;
                }
            };

        }
    }
};