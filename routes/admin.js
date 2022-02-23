const express = require("express");
var router = express.Router();
var { obj } = require('../pomocnijavascript/pooling');

router.get('/',obj.getAllKupci,obj.getAllTrgovci,(req,res,next) => {
    res.render('./admin/admin-dashboard',{kupci:req.kupci, trgovci: req.trgovci});
})
router.get('/users',obj.getAllKupci,obj.getAllTrgovci,(req,res,next) => {
    console.info(req.kupci);
    console.info(req.trgovci);
    res.render('./admin/admin-useri',{kupci: req.kupci, trgovci: req.trgovci});
})
router.get("/kategorije",obj.getAllInteresi, obj.getAllCategories,(req,res,next) => {
    res.render("./admin/admin_kategorije", {interesi: req.interesi, kategorije: req.kategorije});
})

router.post('/blocktrgovactemp/:id',obj.block15daysTrgovac,(req,res,next) => {
    res.sendStatus(200);
})

router.post('/trgovacodblokiraj/:id',obj.odblokirajTrgovca,(req,res,next) => {
    res.sendStatus(200);
})

router.post('/blockkupactemp/:id', obj.block15daysKupac,(req,res,next) => {
    res.sendStatus(200);
})

router.post("/kupacodblokiraj/:id",obj.odblokirajKupca, (req,res,next) => {
    res.sendStatus(200);
})

router.post("/blokirajkupcatrajno/:id",obj.kupacBlockTrajno,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/blokirajtrgovcatrajno/:id",obj.trgovacBlockTrajno,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/arhivirajtrgovca/:id",obj.arhivirajTrgovca,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/arhivirajkupca/:id",obj.arhivirajKupca,(req,res,next) => {
    res.sendStatus(200);
})

router.post("/odarhivirajkupca/:id",obj.odArhivirajKupca,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/odarhivirajtrgovca/:id",obj.odArhivirajTrgovca,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/dodajkategoriju/:naziv",obj.adminDodajKategoriju,(req,res,next) => {
    res.sendStatus(200);
})

router.post("/dodajinteres/:naziv",obj.adminDodajInteres,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/obrisikategoriju/:id",obj.adminObrisiKategoriju,(req,res,next) => {
    res.sendStatus(200);
})
router.post("/obrisiinteres/:id",obj.adminObrisiInteres, (req,res,next) => {
    res.sendStatus(200);
})



router.post("/signout",(req,res,next) => {
    res.clearCookie('admin');
    res.sendStatus(200);
})










module.exports = router;