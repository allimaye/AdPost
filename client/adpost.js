
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

            authSvc.postToGroup = function(groupId, postObject) {
                FB.api("/"+groupId+"/photos",
                        "POST",
                        {
                            "message": postObject.message,
                            "url": postObject.url,
                            "name": postObject.name,
                            "caption": postObject.caption,
                            "description": postObject.description
                        },
                        function (response) {
                            if (response && !response.error)
                            {
                                console.log(response);
                            }
                                /* handle the result */
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





            // function postToGroup() {
            //     var groupId = '1675366959396956';
            //     FB.api("/"+groupId+"/photos",
            //             "POST",
            //             {
            //                 "message": "test post from AdPost",
            //                 "url": "http://blogs.ubc.ca/pausing/files/2015/03/Flower_jtca001.jpg"
            //             },
            //             function (response) {
            //                 if (response && !response.error)
            //                 {
            //                     console.log(response);
            //                 }
            //                     /* handle the result */
            //             });
            // }

        }

       



    }]);



    app.service('authSvc', function () {

        this.user;
        this.auth;
        this.authenticate = function () { };
        this.postToGroup = function() { };

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
        };
    });

    app.service('imageSvc', function () {
        //put all image processing code in here
    });

    app.controller('FormController', ['$scope', 'authSvc', 'Upload', '$mdToast', '$timeout', '$mdDialog'
                        function ($scope, authSvc, Upload, $mdToast, $timeout, $mdDialog) {

        $scope.FbGroupURL;
        $scope.bindingInterval;
        $scope.postObject;

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

            $scope.$evalAsync(function(){
                $timeout(bindButtonsToFileInputs, 100);
            });

        };


        $(document).ready(function () {
            bindButtonsToFileInputs();
        });

        function bindButtonsToFileInputs()
        {
            var fileUploadButtons = $(".fileUploadButton");
            $.each(fileUploadButtons, function (index, value) {

                //check if an onclick event is currently binded to this button. 
                //If so, continue to next button
                var registeredEvents = $._data(value, "events");
                if(registeredEvents)
                {
                    if(registeredEvents.click) return;
                }

                var fileInput = $("#fileInput"+index);
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

            if($scope.bindingInterval) clearInterval($scope.bindingInterval);
        }

        $scope.onFormSubmit = function () {

            // if (!$scope.adForm.$valid)
            // {
            //     $scope.adForm.$submitted = true;
            //     return;
            // }

            var images = [];
            var canvas = document.getElementById('canvas');
            var context = canvas.getContext('2d');


            //convert File objects to Image objects
            $.each($scope.textbooks, function (index, value) {
                if(value.picture)
                {
                    var newImg = new Image();
                    newImg.src = URL.createObjectURL(value.picture);
                    images.push({
                        img: newImg,
                        width: null,
                        height: null,
                        aspectRatio: function() {
                           return this.width/this.height;
                        }
                    });       
                }
            });

            if(images.length > 0)
            {
                //calculate presetWidth based on browser space and number of images to be filled
                var card = $("#canvasContainer");
                var cardPadding = parseInt(card.css('padding-right')) + parseInt(card.css('padding-left'));
                var space = $("#canvasContainer")[0].clientWidth - cardPadding;
                //width of uploaded images during concatenation
                var presetWidth = space/images.length; 

                $.each(images, function (index, image) {
                    image.img.onload = function() {
                        image.width = this.width;
                        image.height = this.height;
                    };
                });
                
                $scope.$evalAsync(function(){
                    $timeout(loadImagesAndPromptUser, 500);
                });
                
            }

            function loadImagesAndPromptUser()
            {
                canvas.width = images.length * presetWidth;
                canvas.height = getMaxCanvasHeight(images, presetWidth);
                $.each(images, function (index, image) {
                    context.drawImage(image.img, index*presetWidth, 0, presetWidth, 
                               presetWidth/image.aspectRatio());
                    //clean up temp URL
                    URL.revokeObjectURL(image.img.src);
                });

                var confirm = $mdDialog.confirm()
                                  .title('Do you like what you see?')
                                  .textContent('Are you ok with posting the concatenated' + 
                                    'image shown in the live preview?')
                                  .ok('Looks good!')
                                  .cancel("Don't include the image.");

                $mdDialog.show(confirm).then(function() {
                   $scope.postObject = {
                        message:
                        includeImg:
                        url:
                        name:
                        caption:
                        description:
                    };
                }, function() {
                  $scope.status = 'You decided to keep your debt.';
                });

            }
            
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

        function getMaxCanvasHeight(images, presetWidth) {
            var max = 0;

            $.each(images, function (index, image) {
                var presetHeight = presetWidth/image.aspectRatio();
                if(presetHeight > max) max = presetHeight;
            });

            return max;
        }

    }]);


   




})();


/* ========= Potentially useful code ======

- image resizing (step down technique)



// // set main canvas size proportional to image
// canvas.height = canvas.width * (addImg.height / addImg.width);
// // context.drawImage(addImg, 0, 0, canvas.width, canvas.height);

// //Step 1 - resize to 50% of original. This is done by first halving the canvas width/height,
// //and then adding the image to the modified canvas
// var oc = document.createElement('canvas'),
//     octx = oc.getContext('2d');

// oc.width = addImg.width * 0.5;
// oc.height = addImg.height * 0.5;
// octx.drawImage(addImg, 0, 0, oc.width, oc.height);

// //Step 2 - resize to 50% of Step 1. Draw the half size canvas onto itself,
// //once again halving dimensions as its done.
// octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

// //Step 3, resize to final size. Draw temp canvas into final canvas using clipping.
// //Start clipping at (0,0) and only use half of temp canvas dimensions since that is
// //the only part of the canvas that was filled in Step 2. 
// context.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
// 0, 0, canvas.width, canvas.height);



// var addImg = new Image();

// addImg.onload = function() {
//     addImg.style.width = presetWidth+"px";
//     addImg.style.height = "auto";
//     context.drawImage(addImg, index*presetWidth, 0, presetWidth, canvas.height);
// };

// addImg.src = URL.createObjectURL(img);





*/