
(function () {

    var app = angular.module('AdPost', ['ngMaterial', 'ngMessages', 'ngFileUpload', 'ngRoute']);

    app.config(function ($routeProvider) {
      $routeProvider.
        when('/index', {
            templateUrl: 'form.html',
            controller: 'FormController'
        }).
        when('/publish_feed', {
            templateUrl: 'publish_feed.html',
            controller: 'FeedController'
        }).
        otherwise({
            redirectTo: '/index'
        });
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
            js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.6";

            ref.parentNode.insertBefore(js, ref);

        }(document));


        //since rootscope is globally accessible, create the user session here
        $rootScope.user = {};

        //connect app to Facebook
        $window.fbAsyncInit = function () {
              
            FB.init({
                appId: '1207375285991743',

                // check the authentication status at the start up of the app 
                status: true,
 
                //Enable cookies to allow the server to access the session 
                cookie: true,

                /* Parse XFBML */
                xfbml: true,

                version: 'v2.6'
            });

            authSvc.authenticate = function ()
            {
                FB.login(function (response) {
                    if (response.authResponse)
                    {
                        authSvc.auth = response.authResponse;
                        authSvc.user = { "userID": response.authResponse.userID };
                        console.log("AuthResponse: " + response.authResponse);
                    }
                    
                }, {
                    scope: 'publish_actions,user_managed_groups',
                    return_scopes: true
                });
                
            };

            authSvc.postToGroup = function(callback) {

                var tempObj = {
                    "message": authSvc.postObject.message
                };

                if (authSvc.postObject.includeImg)
                {
                    tempObj["link"] = authSvc.postObject.url;
                    tempObj["picture"] = authSvc.postObject.url;
                    tempObj["caption"] = authSvc.postObject.caption;
                }

                FB.api("/" + authSvc.FbGroupID + "/feed",
                    "POST",
                    tempObj,
                    function (response) {
                        console.log(response);
                        callback(response);
                });





                

            };

            FB.Event.subscribe('auth.authResponseChange', function (response) {
                //The user is not logged to the app, or into Facebook. Re-authenticate.
                if (response.status !== 'connected') {
                    authSvc.authenticate();
                }
            });

            authSvc.getLoginStatus = function (callback) {
                FB.getLoginStatus(function (response) {
                    var readyToPost;
                    if (response.status === 'connected') {
                        // the user is logged in and has authenticated the app
                        readyToPost = true;
                    } else if (response.status === 'not_authorized') {
                        // the user is logged in to Facebook, 
                        // but has not authenticated your app
                        readyToPost = false;
                    } else {
                        // the user isn't logged in to Facebook.
                        readyToPost = false;
                    }
                    callback(readyToPost);
                });
            };

        }

    }]);



    app.service('authSvc', function () {

        this.user;
        this.auth;
        this.authenticate = function () { };
        this.postToGroup = function () { };
        this.getLoginStatus = function () { };
        this.FbGroupID;
        this.postObject;
        this.postingFrequency;

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
            if (this.auth) {
                if (this.auth.grantedScopes) {
                    //check that granted_scopes includes both "publish_actions" and "user_managed_groups" and return true
                    var permissionArray = this.auth.grantedScopes.split(',');
                    var scopes_exist = ($.inArray("publish_actions", permissionArray) > -1) &&
                                            ($.inArray("user_managed_groups", permissionArray) > -1);
                    return scopes_exist;
                }
            }
            return false;
        };

        
    });

    app.controller('FormController', ['$scope', 'authSvc', 'Upload', '$mdToast', '$timeout', '$mdDialog', '$location',
                        function ($scope, authSvc, Upload, $mdToast, $timeout, $mdDialog, $location) {


        $scope.FbGroupID;
        $scope.bindingInterval;
        $scope.postObject;
        $scope.textbooks;
        $scope.postingFrequency;
                           
        $scope.init = function () {
            $scope.postingFrequency = {
                hours: 1,
                minutes: 0
            };

            $scope.textbooks = [];
            $scope.textbooks.push({
                operation: "SELLING",
                courseCode: "",
                author: "",
                name: "",
                price: 0.00,
                picture: null
            });
            $scope.showInstructionDialog();
        };

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

        $scope.removeBook = function (index) {

            //at least one book is needed
            if ($scope.textbooks.length == 1)
            {
                return;
            }
            $scope.textbooks.splice(index, 1)
            $scope.$evalAsync(function () {
                $timeout(bindButtonsToFileInputs, 100);
                $timeout(generateImagePreview, 100);
            });
        };

        $scope.showInstructionDialog = function () {

            $mdDialog.show({
                scope: $scope,        // use parent scope in template
                preserveScope: true,
                templateUrl: 'instructions.html',
                controller: function DialogController($scope, $mdDialog) {
                    $scope.closeInstructionDialog = function () {
                        $mdDialog.hide();
                        authSvc.authenticate();
                        bindButtonsToFileInputs();
                    };
                }
            });

        };

        

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
                    $scope.textbooks[index].picture = null;

                    $scope.$evalAsync(function () {
                        $timeout(generateImagePreview, 1000);
                    });
                });

                var fileUploadButton = $(this);

                fileInput.on("change", function () {
                    if(fileInput[0].files[0])
                    {
                        fileUploadButton.text(fileInput[0].files[0].name);

                        $scope.$evalAsync(function () {
                            $timeout(generateImagePreview, 100);
                        });
                    }
                });

            });

            if($scope.bindingInterval) clearInterval($scope.bindingInterval);
        }

        $scope.onFormSubmit = function () {

            if (!$scope.adForm.$valid)
            {
                $scope.adForm.$submitted = true;
                return;
            }

            authSvc.getLoginStatus(function (readyToPost) {
                if ( (!readyToPost) )
                {
                    authSvc.authenticate();
                }
                else
                {
                    var result = generateImagePreview();
                    promptUser(result);
                }
            });


            function promptUser(userUploadedImages)
            {
                var dialogTitle = "", dialogText = "";
                if (userUploadedImages)
                {
                    dialogTitle = 'Do you like what you see?';
                    dialogText = 'Are you ok with posting the concatenated ' +
                                    'image shown in the Image Preview?';
                }
                else
                {
                    dialogTitle = 'Proceed?';
                    dialogText = 'The application will now use the data you inputted in the form to recurringly' +
                                    ' post to Facebook.';
                }

                window.scrollTo(0, document.body.scrollHeight);
                var parentElement = $("#postingFrequency")[0];
                var confirm = $mdDialog.confirm()
                                    .parent(parentElement)
                                    .title(dialogTitle)
                                    .textContent(dialogText)
                                    .ok('Post to Facebook')
                                    .cancel("Cancel")
                                    .hasBackdrop(false);

                $mdDialog.show(confirm).then(function() {
                    var postMsg = composePostMessage();

                    if (userUploadedImages)
                    {
                        $mdDialog.show(
                          $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Waiting for Imgur API')
                            .textContent('Your image is being uploaded to Imgur. ' +
                                'Please be patient during this process. You will be redirected shortly.')
                            .ok('Got it!')
                        );

                       var imgData = canvas.toDataURL("image/png").split(',')[1];
                        $.ajax({
                            url: 'https://api.imgur.com/3/image',
                            type: 'post',
                            headers: {
                                Authorization: 'Client-ID 5eaf7c7f9474480'
                            },
                            data: {
                                image: imgData
                            },
                            dataType: 'json',
                            success: function(response) {
                                if(response.success) 
                                {
                                    var liveURL = response.data.link;
                                    $scope.postObject = {
                                        message: postMsg,
                                        includeImg: userUploadedImages,
                                        url: liveURL,
                                        caption: "View Full Image on Imgur"
                                    };
                                    $mdDialog.hide();
                                    postToFB();
                                }
                            }
                        });
                    }
                    else
                    {
                        $scope.postObject = {
                            message: postMsg,
                            includeImg: userUploadedImages,
                            url: null,
                            caption: "View Full Image on Imgur",
                        };
                        postToFB();
                    }

                }, function() {});
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
            });
        }

        function generateImagePreview() {
            var images = [];
            getImagesFromFiles(images);

            //if there are no images to collage/preview, then clear canvas and exit
            if (images.length < 1) {
                var canvas = document.getElementById('canvas');
                var context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                return false;
            }

            var presetWidth = getPresetWidth(images);

            var counter = 0;

            //initialize image attributes on load
            $.each(images, function (index, image) {
                image.img.onload = function () {
                    image.width = this.width;
                    image.height = this.height;
                    counter++;
                    
                    //display images onto canvas if this is the last image to be loaded
                    if (counter == images.length)
                    {
                        $scope.$evalAsync(function () {
                            $timeout(loadImages(images, presetWidth), 100);
                        });
                    }

                };
            });


            return true;
        }

        function loadImages(images, presetWidth) {
            var canvas = document.getElementById('canvas');
            var context = canvas.getContext('2d');
            var potentialHeight = getMaxCanvasHeight(images, presetWidth);
            canvas.height = potentialHeight < ($(window).height() * 0.5) ? potentialHeight : $(window).height() * 0.5;
            canvas.width = adjustCanvasWidthBasedOnHeight(images, canvas.height);
            var widthTaken = 0;
            $.each(images, function (index, image) {
                context.drawImage(image.img, widthTaken, 0, canvas.height * image.aspectRatio(), canvas.height);
                widthTaken += canvas.height * image.aspectRatio();
                //clean up temp URL
                URL.revokeObjectURL(image.img.src);
            });
        }

        function getImagesFromFiles(images) {
            //convert File objects to Image objects
            $.each($scope.textbooks, function (index, value) {
                if (value.picture) {
                    var newImg = new Image();
                    newImg.src = URL.createObjectURL(value.picture);
                    images.push({
                        img: newImg,
                        width: null,
                        height: null,
                        aspectRatio: function () {
                            return this.width / this.height;
                        }
                    });
                }
            });
        }

        function getPresetWidth(images) {
            //calculate presetWidth based on browser space and number of images to be filled
            var card = $("#canvasContainer");
            var cardPadding = parseInt(card.css('padding-right')) + parseInt(card.css('padding-left'));
            var space = $("#canvasContainer")[0].clientWidth - cardPadding;
            //width of uploaded images during concatenation
            var presetWidth = space / images.length;
            return presetWidth;
        }

        function getMaxCanvasHeight(images, presetWidth) {
            var max = 0;
            $.each(images, function (index, image) {
                var presetHeight = presetWidth/image.aspectRatio();
                if(presetHeight > max) max = presetHeight;
            });
            return max;
        }

        function adjustCanvasWidthBasedOnHeight(images, canvasHeight)
        {
            var total = 0;
            $.each(images, function (index, image) {
                total += canvasHeight * image.aspectRatio();
            });

            return total;
        }

        function composePostMessage()
        {
            var selling = "", buying = "", msg = "";

            $.each($scope.textbooks, function(index, textbook){
                if(textbook.operation == "SELLING")
                {
                    selling += textbook.courseCode + " - " + textbook.author + 
                                ": " + textbook.name +" $" + textbook.price + "\n";                    
                }
                else
                {
                    buying += textbook.courseCode + " - " + textbook.author + 
                                ": " + textbook.name +" $" + textbook.price + "\n";
                }
            }); 

            if (selling.length > 0)
            {
                msg += "SELLING:\n\n" + selling;
            }
          
            if (buying.length > 0)
            {
                msg += "\nBUYING:\n\n" + buying;
            }

            return msg; 
        }

        function postToFB()
        {
            authSvc.postObject = $scope.postObject;
            authSvc.FbGroupID = $scope.FbGroupID;
            authSvc.postingFrequency= $scope.postingFrequency;
            $location.path("/publish_feed");
            $scope.$apply()
        }

        angular.element(document).ready(function () {
            $scope.init();
            bindButtonsToFileInputs();
        });

    }]);

    app.controller('FeedController', ['$scope', 'authSvc', '$filter', '$interval', 
                function ($scope, authSvc, $filter, $interval) {

        $scope.publishedPosts = [];
        $scope.publishInterval;
        $scope.timeRemaining;
        $scope.isPosting;
    
        $scope.stopPosting = function () {
            if ($scope.publishInterval.handle)
            {
                $interval.cancel($scope.publishInterval.handle);
                if ($scope.timeRemaining.handle)
                {
                    $interval.cancel($scope.timeRemaining.handle);
                }
            }
        };

        function postToFb()
        {
            $scope.isPosting = true;

            authSvc.postToGroup(function (response) {
                if (response && !response.error)
                {
                    var nodeID = response.id.split('_')[0];
                    var postID = response.id.split('_')[1];
                    var postURL = 'https://www.facebook.com/' + nodeID + '/posts/' + postID;
                    $scope.publishedPosts.push({
                        time: $filter('date')(new Date(), "medium"),
                        success: true,
                        url: postURL
                    });
                }
                else
                {
                    var timeAndError = $filter('date')(new Date(), "medium") + "\t" +
                                ". Error: " + response.error.message;
                    $scope.publishedPosts.push({
                        time: timeAndError,
                        success: false,
                        url: null
                    });
                }
                
                $scope.isPosting = false;
            });

            //reset time remaining
            $scope.timeRemaining.time = $scope.publishInterval.time;
        }

        
                    
        angular.element(document).ready(function () {

            //hours to milliseconds
            var milliseconds = authSvc.postingFrequency.hours * 60 * 60 * 1000;
            //minutes to milliseconds
            milliseconds += authSvc.postingFrequency.minutes * 60 * 1000;

            //minumum posting frequency is 1 hour to prevent spamming
            if (milliseconds < 1 * 60 * 60 * 1000)
            {
                milliseconds = 1 * 60 * 60 * 1000;
            }

            $scope.publishInterval = {
                handle: $interval(postToFb, milliseconds),
                time: milliseconds
            };

            $scope.timeRemaining = {
                handle: $interval(function () {
                    $scope.timeRemaining.time -= 1000;
                    $scope.timeRemaining.timeString = Math.trunc($scope.timeRemaining.time / 3600000) + " hours " +
                        $filter('date')($scope.timeRemaining.time, "mm 'minutes' ss 'seconds'")
                }, 1000),
                time: milliseconds,
                timeString: Math.trunc(milliseconds / 3600000) + " hours " +
                    $filter('date')(milliseconds, "mm 'minutes' ss 'seconds'")
            };

            postToFb();
        });

    }]);


})();

