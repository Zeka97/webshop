var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var multer = require('multer');
var { obj } = require('../pomocnijavascript/pooling');
var path = require('path');
var fs = require('fs');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect("/login");
});
router.get('/login', (req,res,next) => {
  res.render('login');
})

router.get('/login/:username/:password',obj.checkLoginTrgovca,obj.checkLoginKupca,obj.checkLoginAdmin,(req,res,next) => {
        if(req.greska){
            return res.status(400).send({
                message: req.greska
            })
        };
        res.sendStatus(200);
})


router.get('/signup',obj.getAllInteresi, (req,res,next) => {
  res.render('signup',{ interesi: req.interesi } );
})

router.post('/signup/kupac',obj.checkIfKupacUnique,obj.checkIfTrgovacUnique,obj.createKupac,obj.addKupacInterests,(req,res,next) => {
    if(req.greska){
        console.info(req.greska);
        return res.sendStatus(500);
    }
    else  res.sendStatus(200);
})
router.post('/signup/trgovac', obj.checkTrgovina, obj.checkIfTrgovacUnique,obj.checkIfKupacUnique,obj.createTrgovina, obj.createTrgovac, (req, res, next) => {

        if (req.greska) {
            console.info(req.greska);
            res.sendStatus(500);
        } else {
            console.info("Uspjesno ste kreirali trgovca");
            res.clearCookie('trgovacslika');
            res.sendStatus(200);
        }
})




router.post('/signup/upload/kupacslika',upload.single('kupac_avatar'),(req,res,next) => {
        console.info(req.file.filename);
        res.cookie("kupacslika",req.file.filename);
        console.info("slika je uploadana");
        res.sendStatus(200);
})
router.post('/signup/upload/trgovacslika/',upload.single('trgovac_avatar'),(req,res,next) => {
    console.info(req.file.filename);
    console.info("slika je uploadana");
    res.cookie("trgovacslika", req.file.filename);
    res.sendStatus(200);
})



module.exports = router;
