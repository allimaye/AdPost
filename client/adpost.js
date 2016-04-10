
(function () {

    var app = angular.module('AdPost', ['ngMaterial', 'ngMessages', 'ngFileUpload']);


    app.config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default');
    });


    app.run(['$rootScope', '$window', 'authSvc',  function ($rootScope, $window, authSvc) {



        //Use an immediately invoked function expression to setup

        (function (d) {
            // load the Facebook javascript SDK

            var js,
            id = 'facebook-jssdk',
            ref = d.getElementsByTagName('script')[0];

            if (d.getElementById(id)) {
                return;
            }

            js = d.createElement('script');
            js.id = id;
            js.async = true;
            js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.5";

            ref.parentNode.insertBefore(js, ref);

        }(document));


        //since rootscope is globally accessible, create the user session here
        $rootScope.user = {};

        //connect app to Facebook
        $window.fbAsyncInit = function () {
              

            FB.init({
                appId: '1162628327133106',

                // check the authentication status at the start up of the app 
                status: true,
 
                //Enable cookies to allow the server to access the session 
                //cookie: true,

                /* Parse XFBML */
                xfbml: true,

                version: 'v2.5'
            });

            //wait on FB async init and do what's inside after FB has been initialized
            FB.getLoginStatus(function (response) {
                //if (response.status !== "connected")
                //{
                //    authSvc.login();
                //}
                authSvc.authenticate();
                //postToGroup();
                //console.log(response.authResponse)
                    
            });

            authSvc.authenticate = function ()
            {
                FB.login(function (response) {
                    
                    authSvc.auth = response.authResponse;
                    authSvc.user = { "userID": response.authResponse.userID };
                    console.log("AuthResponse: " + response.authResponse);
                    readGroups();
                }, {
                    scope: 'publish_actions,user_managed_groups',
                    return_scopes: true
                });
                
            };

            FB.Event.subscribe('auth.authResponseChange', function (response) {
                //The user is not logged to the app, or into Facebook. Re-authenticate.
                if (response.status !== 'connected') {
                    authSvc.authenticate();
                }
            });

            function readGroups()
            {
                var userId = authSvc.user;
                FB.api("/" + userId + "/groups",
                        "GET",
                        {
                            "access_token": authSvc.auth.accessToken
                        },
                        function (response) {
                        if (response && !response.error) {
                            console.log("Read groups response: " + response);
                            /* handle the result */
                        }
                });
            }

            function postToGroup() {
                var groupId = '1675366959396956';
                FB.api("/"+groupId+"/photos",
                        "POST",
                        {
                            "message": "test post from AdPost",
                            "url": "http://blogs.ubc.ca/pausing/files/2015/03/Flower_jtca001.jpg"
                        },
                        function (response) {
                            if (response && !response.error)
                            {
                                console.log(response);
                            }
                                /* handle the result */
                        });
            }

        }

       



    }]);



    app.service('authSvc', function () {

        this.user;
        this.auth;
        this.authenticate = function () { };

        var self = this;

        this.setAuth = function (newAuth) {
            if (newAuth) {
                self.auth = newAuth;
            }
        };

        this.setUser = function (newUser) {
            if (newUser) {
                self.user = newUser;
            }
        };

    
        this.appHasReqPermissions = function () {
            if (auth) {
                if (auth.granted_scopes) {
                    //check that granted_scopes includes both "publish_actions" and "user_managed_groups" and return true
                    var permissionArray = auth.granted_scopes.split(',');
                    var scopes_exist = ($.inArray("publish_actions", permissionArray) > -1) &&
                                            ($.inArray("user_managed_groups", permissionArray) > -1);
                    return scopes_exist;
                }
            }
            return false;
        }
    });

    
    app.controller('FormController', ['$scope', 'authSvc', 'Upload', '$mdToast', function ($scope, authSvc, Upload, $mdToast) {
        
        
        

        $scope.FbGroupURL;

        $scope.textbooks = [];
        $scope.textbooks.push({
            operation: "SELLING",
            courseCode: "",
            author: "",
            name: "",
            price: 0.00,
            picture: null
        });

        $scope.addBook = function () {
            $scope.textbooks.push({
                operation: "SELLING",
                courseCode: "",
                author: "",
                name: "",
                price: 0.00,
                picture: null
            });
        };

        $(document).ready(function () {
            bindButtonsToFileInputs();
        });

        function bindButtonsToFileInputs()
        {
            var fileUploadButtons = $(".fileUploadButton");
            $.each(fileUploadButtons, function (index, value) {

                var fileInput = $(this).siblings(".fileInput").eq(0);
                $(this).on("click", function () {
                    fileInput.click();
                    $(this).text("UPLOAD PICTURE");
                });

                var fileUploadButton = $(this);

                fileInput.on("change", function () {
                    if(fileInput[0].files[0])
                    {
                        fileUploadButton.text(fileInput[0].files[0].name);
                    }
                });

            });
        }

        $scope.onFormSubmit = function () {

            if (!$scope.adForm.$valid)
            {
                //$scope.$apply();
                $scope.adForm.$submitted = true;
                return;
            }

            $.each($scope.textbooks, function (index, value) {

                if(value.picture)
                {
                    upload(value.picture);
                }

            });

            //if ($scope.upload_form.file.$valid && $scope.file) { //check if from is valid
            //    vm.upload(vm.file); //call upload function
            //}
        };


        function upload(file) {
            Upload.upload({
                url: 'http://localhost:6060/upload', //webAPI exposed to upload the file
                data: { file: file } //pass file as data, should be user ng-model
            }).then(function (resp) { //upload function returns a promise
                if (resp.data.error_code === 0) { //validate success
                    $window.alert('Success ' + resp.config.data.file.name + 'uploaded. Response: ');
                } else {
                    $window.alert('an error occured');
                }
            }, function (resp) { //catch error
                console.log('Error status: ' + resp.status);
                $window.alert('Error status: ' + resp.status);
            }, function (evt) {
                console.log(evt);
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                //$mdToast.show($mdToast.simple().textContent('progress: ' + progressPercentage + '% ' + evt.config.data.file.name));
                //vm.progress = 'progress: ' + progressPercentage + '% '; // capture upload progress
            });
        }

    }]);


   




})();

