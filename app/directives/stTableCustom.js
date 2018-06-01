if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'stTableCustom';
}

((window, angular, undefined) => {

    // @ngInject
    angular.module('stTableCustom', [])
        .directive('pageSelect', () => {
            //this directive controls the pagination on tables
            return {
                restrict: 'E',
                template: '<input type="text" class="select-page" ng-model="inputPage" ng-change="selectPage(inputPage)">',
                link: (scope, element, attrs) => {
                    scope.$watch('currentPage', (c) => {
                        scope.inputPage = c;
                    });

                    scope.$on('currentPage', (event, args)=>{
                        if(scope.currentPage < scope.numPages){
                            scope.selectPage(scope.pages[scope.pages.length - 1]);
                        }
                        
                    });
                }
            }
        })
        .directive('customEvent', () => {
            return {
                require: 'stTable',
                restrict: 'A',
                link: (scope, elem, attr, table) => {
                    let tableState = table.tableState();

                    scope.$on('refreshTable', () => {

                        table.pipe(tableState);


                    });

                    //handles refresh on IE browsers
                    scope.$on('ie_refreshTable', () => {
                        table.pipe(angular.merge(tableState, {
                            search: {
                                predicateObject: {
                                    is_admin: scope.userState.is_admin,
                                    status: scope.userState.status
                                }
                            }
                        }));
                    })
                }
            }
        })
})(window, window.angular);