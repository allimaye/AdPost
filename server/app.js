
    var express = require('express');
    var app = express(); 
    var bodyParser = require('body-parser');
    var multer = require('multer');
    var logger = require('morgan');


    //Use Morgan for logging
    app.use(logger('dev'));

    //Middleware (allow cross origin requests)
    app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "http://localhost");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    /** Serving from the same express Server
    No cors required */
    app.use(express.static(process.cwd()+'/client'));
    app.use(bodyParser.json());  
    app.use('/scripts', express.static(process.cwd() + '/node_modules/'));

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
        }
    });

    var upload = multer({ //multer settings
                    storage: storage
                }).single('file');

    /** API path that will upload the files */
    app.post('/upload', function(req, res) {
        upload(req,res,function(err){
            if(err){
                    res.json({error_code:1,err_desc:err});
                    return;
            }
                res.json({error_code:0,err_desc:null});
        });
    });

    var port = Number(process.env.PORT || '6060');

    app.listen(port, function(){
        console.log('running on port ' + port + '...');
    });