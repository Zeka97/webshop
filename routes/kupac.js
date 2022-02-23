var express = require('express');
var router = express.Router();
var multer = require('multer');
var { obj, kupci, trgovci } = require('../pomocnijavascript/pooling');
var jwt = require('jsonwebtoken');
var path = require('path');
const fs = require('fs');

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

router.get('/',obj.getKupac,obj.getMostPopularArticles, (req,res,next) => {
    var decoded = jwt.decode(req.cookies.kupac,'kljuc');
    console.info(decoded.id);
    console.info(decoded);
    if(!io){
        io = require('socket.io')(req.connection.server);
        io.on("connection", client => {

            client.on("kupac_se_logovao", obj => {
                let postoji = false;
                let index = 0;
                for(let i = 0; i < kupci.length; i++){
                    if(kupci[i].kupac.id === obj.kupac.id){
                        postoji = true;
                        index = i;

                    }
                }
                if(postoji){
                    kupci[index].socketID = obj.socketID;
                }
                else{
                    kupci.push(obj);
                }

                console.info(kupci);
                console.info(trgovci);

                io.emit("kupci_trgovci", kupci);
            })

            client.on("klijent_salje_poruku_za_usera", obj => {
                let primalac = null;
                let posiljalac = null;
                for(let i = 0; i < kupci.length; i++){
                    if(kupci[i].kupac.id === obj.destinacija){
                        primalac = kupci[i].socketID;
                    }
                    else if(kupci[i].kupac.id === obj.posiljalacID){
                        posiljalac = kupci[i].socketID;
                    }
                }
                console.info(primalac);
                client.to(primalac).emit("primi_poruku", obj);
                client.emit("primi_poruku_posiljalac", obj);
            })
        })
    }

    res.render('kupac-naslovna',{kupac: req.kupac, najpopularniji: req.najpopularniji});

})


router.get('/profil/:id',obj.getKupac, (req,res,next) => {
    res.render("kupac_profil", {kupac: req.kupac});
})

router.get("/artikli/",obj.getAllArticles,obj.getKupac,obj.getAllCategories,(req,res,next) => {
    res.render('kupac-artikli', {artikli: req.artikli, kupac:req.kupac, kategorije: req.kategorije});
});

router.get("/artikli/kategorija/:id", (req,res,next) => {
    console.info(req.artikli);
    res.render('kupac-artikli', {artikli: req.artikli})
})

router.get("/artikli/search/:naziv/:id",obj.getAllArticlesLike,obj.getKupac,obj.getAllCategories,(req,res,next) => {
    console.info(req.artikli)
    res.render('kupac-artikli', {artikli: req.artikli, kupac: req.kupac, kategorije: req.kategorije});
});
router.get("/artikli/:orderby", obj.getAllArticles,obj.getKupac,(req,res,next) => {
    res.render('kupac-artikli',{artikli:req.artikli});
})
router.post("/kreirajnarudzbu",obj.kreirajNarudzbu,obj.getNarudzbaID, obj.dodajArtikleUVeznuTabeluNarudzbi,(req,res,next) => {
    res.clearCookie('korpa');
    res.sendStatus(200);
})

router.get("/trgovci",obj.getKupac,obj.getAllTrgovci,(req,res,next) => {
    console.info(req.trgovci);
    res.render("kupac_trgovci",{trgovci:req.trgovci, kupac: req.kupac});
})
router.post("/editprofile",obj.editKupacProfile,(req,res,next) => {
    res.sendStatus(200);
})

router.get("/trgovina/:trgovac_id", obj.getAllTrgovacArticles,obj.getKupac, (req,res,next) => {
    res.render("kupac_trgovina", {artikli: req.artikli, kupac:req.kupac})
})

router.get("/narudzbe",obj.getNarudzbeByKupacID,obj.getKupac,(req,res,next) => {
    console.info(req.narudzbe);
    console.info(req.artikli);
    res.render("kupac_narudzbe",{narudzbe: req.narudzbe, artikli: req.artikli, kupac: req.kupac});
})

router.post("/editupload/kupacslika",upload.single('kupac_avatar'),(req,res,next) => {
    console.info("slika je uploadana");
    console.info(req.file.filename);
    res.cookie("kupacslika", req.file.filename);
    res.sendStatus(200);
})






router.post("/checkout/", (req,res,next) => {
    req.body = JSON.parse(JSON.stringify(req.body));
    req.body.korpa = JSON.parse(req.body.korpa);
    res.cookie('korpa',req.body.korpa);
    res.sendStatus(200);
})

router.get("/checkout/",(req,res,next) => {
    console.log(req.cookies.korpa);
    res.render('kupac-checkout', {korpa: req.cookies.korpa})
})
router.post("/prekininarudzbu/:id",obj.kupacPrekiniNarudzbu, (req,res,next) => {
    res.sendStatus(200);
})


router.post("/changepassword/:currentpassword/:newpassword",obj.kupacChangePassword,(req,res,next) => {
        res.sendStatus(200);
})



router.get('/signout',(req,res,next) => {
    res.clearCookie('kupac');
    res.sendStatus(200);
})








module.exports = router;