// @ngInject
module.exports = ($scope, $http, $uibModal, $uibModalInstance, $q, spService, slideData, _, globalFN) => {

    $scope.modalState = {
        ...slideData
    }

    let {updateMetaData, getSlideMeta, deleteFile} = globalFN;

    $scope.delete = ($event, metadataID)=>{

        let modalInstance = $uibModal.open({
            animation: true,
            controller: ($scope, $uibModalInstance)=>{
                $scope.yes = ()=>{
                    $uibModalInstance.close(true);
                };

                $scope.no = ()=>{
                    $uibModalInstance.close(false);
                };

                $scope.closeModal = () => {
                    $uibModalInstance.close('close');
                };

            },
            template: `
                <div>
                    <header class="modal-header">
                        <button ng-click="closeModal()" type="button" class="close"><i class="fa fa-close"></i></button>
                    </header>
                    <main class="modal-body text-center">
                        <p>Are you sure you want to delete?</p>
                        <div>
                            <button class="btn btn-danger btn-md" ng-click="no()">No</button>
                            <button class="btn btn-success btn-md" ng-click="yes()">Yes</button>
                        </div>
                    </main>
                    <footer class="modal-footer">
                    </footer>
                </div>                
            `,
            size: 'sm'
        });

        modalInstance.result.then(async(userInput) => {
            //finish deletion
            let dangerBtn = angular.element($event.target);
            let successBtn = angular.element($event.target).parent().children()[1];

            try{
                
                if(userInput === true){
                    // //returns an object
                    dangerBtn[0].disabled = true; //convert angular.element to raw
                    successBtn.disabled = true;
                    dangerBtn.html(`<i class="fa fa-spinner fa-spin"></i>`);

                    let [filesToDelete] = _.filter($scope.modalState.file_metadata, (o)=>o.id === metadataID);
                    let updatedMetaData = _.filter($scope.modalState.file_metadata, (o)=>o.id !== metadataID);

                    let imageFileName = filesToDelete.slideCover.split('/').pop();
                    let slideFileName = filesToDelete.filelink.split('/').pop();

                    await deleteFile($scope.modalState.slideID, imageFileName);
                    await deleteFile($scope.modalState.slideID, slideFileName); 
                    await updateMetaData($scope.modalState.slideID, updatedMetaData);

                    //after deletion update the state
                    $scope.$apply(()=>{
                        angular.extend($scope.modalState, {
                            file_metadata: updatedMetaData
                        });
                    });
                }

            } catch(err){
                dangerBtn[0].disabled = false;
                successBtn.disabled = false;
                dangerBtn.html(`Delete`);
                throw err;
            }
        }, () => {
            //on fail
        });



    };


    $scope.makeDefault = async(index)=>{
        try {
            let metadata = await getSlideMeta($scope.modalState.slideID);
            let currentDefaultIndex = _.findIndex(metadata, (o)=>o.default === 1);

            metadata[currentDefaultIndex].default = 0;
            metadata[index].default = 1;


            await updateMetaData($scope.modalState.slideID, metadata);

            $scope.$apply(()=>{
                angular.extend($scope.modalState, {
                    file_metadata: metadata
                });

                
            })


        } catch(err){
            throw (err);
        }
    };

    $scope.download = async(id, link, type) => {


        try {
            let metadata = await getSlideMeta($scope.modalState.slideID);

            //make a copy of metadata
            let idx = _.findIndex(metadata, { id });

            if (idx !== -1) {
                let itemToChange = angular.copy(metadata[idx]);

                await spService.downloadAttachment(link, {
                    type
                });
                
                angular.extend($scope.modalState.file_metadata[idx], itemToChange, {
                    downloadCount: itemToChange.downloadCount + 1
                });

                await updateMetaData($scope.modalState.slideID, $scope.modalState.file_metadata);

            }


        } catch (err) {
            throw (err);
        }
    };

    $scope.closeModal = () => {
        $uibModalInstance.close($scope.modalState.file_metadata);
    };


};