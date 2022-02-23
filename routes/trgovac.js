var express = require('express');
var router = express.Router();
var multer = require('multer');
var { obj, kupci,trgovci} = require('../pomocnijavascript/pooling');
var path = require('path');
const fs = require('fs');
var jwt = require('jsonwebtoken');

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


var io = null;

/* GET users listing. */
router.get('/',obj.getTrgovac,obj.getTrgovacArticles,obj.getAllCategories, (req,res,next) => {
    if(!io){
        io = require('socket.io')(req.connection.server);
        io.on("connection", client => {
            client.on("trgovac_se_logovao")

            console.info(kupci);
            console.info(trgovci);


            client.on("klijent_salje_poruku_za_usera", obj => {
                let primalac = null;
                let posiljalac = null;
                for(let i = 0; i < kupci.length; i++){
                    if(kupci[i].kupac.id === obj.destinacija){
                        primalac = kupci[i].socketID;
                    }
                }
                console.info(primalac);
                console.info(obj);
                client.to(primalac).emit("primi_poruku", obj);
            })
        })
    }

    res.render('trgovac-naslovna',{trgovac: req.trgovac, artikli: req.artikli, kategorije: req.kategorije, kupcionline: kupci});

});

router.get('/artikal/:id',obj.getArtikal,(req,res,next) => {
        res.render('artikal', {artikal: req.artikal});
})

router.post('/dodajArtikal',obj.getTrgovac,obj.addArticle,obj.addArticleCategories,(req,res,next) => {
    console.info("uspjesno dodan artikal");
    res.sendStatus(200);
})

router.post('/editartikal',obj.updateArtikal,obj.deleteAllCategoriesFromArticleById,obj.addArticleCategories, (req,res,next) => {
    console.info(req.body);
    console.info("uspjesno editovan artikal!");
    res.sendStatus(200);
})

router.post('/artikal/delete/:id',obj.deleteArtikal,(req,res,next) => {
    res.sendStatus(200);
})

router.post('/upload/artikalslika',upload.single('artikal_avatar'),(req,res,next) => {
    console.info(req.file.filename);
    console.info("slika je uploadana");
    res.cookie("artikalslika", req.file.filename);
    res.sendStatus(200);
})

router.post('/upload/editartikalslika',upload.single('edit_artikal_avatar'),(req,res,next) => {
    console.info(req.file.filename);
    console.info("slika je uploadana");

    res.cookie("artikalslika", req.file.filename);
    res.sendStatus(200);
})
router.get("/narudzbe",obj.getNarudzbeByTrgovacID,(req,res,next) => {
    console.info(req.narudzbe);
    res.render("trgovac-narudzbe",{narudzbe: req.narudzbe, artikli: req.artikli});
})

router.post("/prihvatinarudzbu/:id",obj.trgovacOdobriNarudzbu,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/odbijnarudzbu/:id",obj.trgovacOdbijNarudzbu,(req,res,next) => {
    res.sendStatus(200);
})


router.post("/editprofile",obj.editTrgovacPofile,obj.editTrgovinaProfile,(req,res,next) => {
    console.info(req.body);
    res.sendStatus(200);
})

router.post("/editupload/trgovacslika",upload.single('trgovac_avatar'), (req,res,next) => {
    console.info("slika je uploadana");
    console.info(req.file.filename);
    res.cookie("trgovacslika", req.file.filename);
    res.sendStatus(200);
})

router.post("/changepassword/:currentpassword/:newpassword",obj.trgovacChangePassword,(req,res,next) => {
    res.sendStatus(200);
})




router.get('/signout',(req,res,next) => {
    res.clearCookie('trgovac');
    res.sendStatus(200);
})





module.exports = router;