const { Pool } = require('pg');
var jwt = require('jsonwebtoken');
const pool = new Pool({
    user: 'rzzavong',
    host: 'hattie.db.elephantsql.com',
    database: 'rzzavong',
    password: 'l8aHOZSpzG2gV23qmMdo_FsJhBSjLVbb',
    port: 5432,
});

function datumIstekaNarudzbe(godina,mjesec,dan,sati,minute,sekunde){
    let daniumjesecu = [31,28,31,30,31,30,31,31,30,31,30,31];
    let obj = {}
    dan = parseInt(dan) + 15;
    if(dan > daniumjesecu[mjesec-1]){
        dan = parseInt(dan) - daniumjesecu[mjesec-1]
        mjesec = parseInt(mjesec) + 1;
        if(mjesec > 12){
            godina = parseInt(godina) + 1;
            mjesec = 1;
        }
    }

    if(dan < 10) dan = "0" + dan;
    if(mjesec < 10) mjesec = "0" + mjesec;


    let string = godina.toString() + mjesec.toString() + dan.toString() + " " + sati + ":" + minute + ":" + sekunde;

    return string;

}

function getDatum(){
    let datum_objave = new Date();
    let godina, dan,mjesec,sati,minute,sekunde;
    if(datum_objave.getHours() < 10){
        sati = "0" + datum_objave.getHours().toString();
    }
    else {
        sati = datum_objave.getHours().toString();
    }
    if(datum_objave.getMinutes() < 10){
        minute = "0" + datum_objave.getMinutes().toString();
    }
    else {
        minute = datum_objave.getMinutes().toString();
    }
    if(datum_objave.getSeconds() < 10){
        sekunde = "0" + datum_objave.getSeconds().toString();
    }
    else {
        sekunde = datum_objave.getSeconds().toString();
    }
    if(datum_objave.getDate() < 10){
        dan = "0" + datum_objave.getDate();
    }
    else dan = datum_objave.getDate();

    if((datum_objave.getMonth()+1) < 10){
        mjesec = "0" + (datum_objave.getMonth()+1);
    }
    else mjesec = (datum_objave.getMonth()+1);

    godina = datum_objave.getFullYear();


    let obj = {
        godina:godina,
        mjesec:mjesec,
        dan: dan,
        sati: sati,
        minute:minute,
        sekunde:sekunde
    }
    return obj;
}


exports.kupci = [];


exports.trgovci = [];






exports.obj = {
    getAllInteresi: (req, res, next) => {
        pool.query("select * from interesi", (err, result) => {
            if (err) {
                console.info(err);
                return next();
            }
            req.interesi = result.rows;

            next();
        })
    },

    createKupac: (req, res, next) => {
        let slika = req.cookies.kupacslika;
        if (req.greska) {
            console.info(req.greska);
            next();
        }
        pool.query("insert into kupac(ime,prezime,username,email,adresa,password,photo) values($1,$2,$3,$4,$5,$6,$7)",
            [req.body.ime, req.body.prezime, req.body.username, req.body.email, req.body.adresa, jwt.sign(req.body.password, 'kljuc'),slika],
            (err, result) => {
                if (err) {
                    console.info(err);
                    return next();
                }
                next();
            });
    },
    addKupacInterests: (req, res, next) => {
        if (req.greska) {
            throw req.greska;
        }
        pool.query("select id from kupac where username = $1", [req.body.username], (err, result) => {
            if (err) {
                console.info(err);
                return next();
            }

            req.params.userID = result.rows[0].id;
            pool.query("select dodajInterese($1,$2::int[],$3)",
                [req.params.userID, req.body.interesi, req.body.interesi.length],
                (err, result) => {
                    if (err) {
                        console.info(err);
                        return next();
                    }
                    next();
                });
            next();
        });
    },
    getKupac: (req, res, next) => {
        let decoded = jwt.verify(req.cookies.kupac, 'kljuc');
        let username = decoded.username;
        pool.query("select * from kupac where username = $1", [username], (err, result) => {
            if (err) {
                console.info(err);
                return res.send(err);
            }
            req.kupac = result.rows[0];
            next();
        })
    },

    getTrgovac: (req, res, next) => {
        let decoded = jwt.verify(req.cookies.trgovac, 'kljuc');
        let username = decoded.username;

        pool.query("select * from trgovac inner join trgovina t on t.id = trgovac.trgovina_id where trgovac.username = $1", [username], (err, result) => {
            if (err) {
                console.info(err);
                throw next();
            }
            req.trgovac = result.rows[0];
            console.info(req.trgovac);
            next();

        })
    },
    getTrgovacArticles: (req, res, next) => {
        pool.query("select * from artikli where trgovina_id = $1", [req.trgovac.id], (err, result) => {
            if (err) {
                console.info(err);
                throw next();
            }
            req.artikli = result.rows;
            next();
        })
    },
    checkLoginTrgovca: (req, res, next) => {
        pool.query("select * from trgovac where username = $1", [req.params.username], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            if (!result.rows.length) {
                req.greska = "Ne postoji taj trgovac!";
                console.info(req.greska);
            } else {
                req.user = result.rows[0];
                let password = jwt.decode(req.user.password, "kljuc");            //ne radi za basic usera jer nije sifra hashovana //
                console.info(password);
                if (req.params.password != password) {
                    return res.status(400).send({
                        message: "Pogresna lozinka"
                    });
                } else {
                    if(req.user.block_timestamp !== null){
                        return res.status(400).send({
                            message: "Vas racun je blokiran do" + req.user.block_timestamp.toLocaleString('de-DE',{year: 'numeric', month: 'numeric', day: 'numeric'})
                        });
                    }
                    else if(req.user.blocked_forever === true){
                        return res.status(400).send({
                            message: "Vas racun je blokiran trajno"
                        });
                    }
                    else{
                        let token = jwt.sign(req.user, 'kljuc');
                        res.cookie('trgovac', token);
                        return res.redirect("/trgovac");
                    }
                }
            }
            next();
        })
    },
    checkLoginKupca: (req, res, next) => {
        pool.query("select * from kupac where username = $1", [req.params.username], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            if (!result.rows.length) {
                req.greska = "Ne postoji user sa tim username-om";
                console.info(req.greska);
            } else {
                req.user = result.rows[0];
                let password = jwt.decode(req.user.password, "kljuc");
                if (req.params.password != password) {
                    return res.status(400).send({
                        message: "Pogresna lozinka"
                    });
                } else {
                    if(req.user.block_timestamp != null){
                        return res.status(400).send({
                            message: "vas racun je blokiran do " + req.user.block_timestamp.toLocaleString('de-DE',{year: 'numeric', month: 'numeric', day: 'numeric'})
                        });
                    }
                    else if(req.user.blocked_forever === true){
                        return res.status(400).send({
                            message:"vas racun je trajno blokiran"
                        })
                    }
                    else {
                        let token = jwt.sign(req.user, 'kljuc');
                        res.cookie('kupac', token);
                        return res.redirect("/kupac");
                    }
                }
            }
            next();
        })
    },
    checkLoginAdmin: (req,res,next) => {
        pool.query("select * from administrator where username=$1",[req.params.username], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            if(!result.rows.length){
                return res.sendStatus(500);
            }
            else{
                req.user = result.rows[0];
                let password = req.user.password;
                if(req.params.password != password){
                    return res.status(400).send({
                        message:"Pogresna lozinka"
                    });
                }
                else{
                    let token = jwt.sign(req.user,'kljuc');
                    res.cookie('admin',token);
                    res.redirect("/admin")
                }
            }
            next();
        })
    },
    checkTrgovina: (req, res, next) => {
        pool.query("select * from trgovina where naziv = $1", [req.body.imekompanije], (err, result) => {
            if (err) {
                console.info(err);
                throw next();
            }
            if (result.rows.length) {
                req.greska = "postoji firma sa tim nazivom";
            }
            next();
        })
    },
    checkIfTrgovacUnique: (req, res, next) => {
        pool.query("select * from trgovac where username = $1 or email = $2", [req.body.username, req.body.email], (err, result) => {
            if (err) {
                console.info(err);
            }
            if (result.rows.length) {
                req.greska = "postoji vec user sa tim username-om ili email-om";
            }
            next();
        })

    },
    checkIfKupacUnique: (req, res, next) => {
        pool.query("select * from kupac where username = $1 or email = $2", [req.body.username, req.body.email], (err, result) => {
            if (err) {
                console.info(err);
            }
            if (result.rows.length) {
                req.greska = "postoji vec user sa tim username-om ili email-om";
            }
            next();
        })
    },
    getAllTrgovci: (req, res, next) => {
        pool.query("select trgovac.id as idt, * from trgovac inner join trgovina t on trgovac.trgovina_id = t.id", (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            req.trgovci = result.rows;
            next();
        })
    },


    getArtikal: (req, res, next) => {
        pool.query("select * from artikli where id = $1", [req.params.id], (err, result) => {
            if (err) {
                console.info(err);
            }
            console.info(result.rows[0]);
            req.artikal = result.rows[0];
            next();
        })
    },
    deleteArtikal: (req, res, next) => {
        console.info(req.params.id);
        pool.query("delete from artikli_kategorije_veza where artikal_id = $1", [req.params.id],(err,result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            pool.query("delete from artikli where id = $1", [req.params.id], (err, result) => {
                if (err) {
                    console.info(err);
                    return res.sendStatus(500);
                }
                next();
            })
        })
    },

    createTrgovina: (req, res, next) => {
        if (req.greska) {
            next();
        }
        pool.query("insert into trgovina(naziv,kontakt_tel,sjediste_adresa,grad) values($1, $2, $3, $4)",
            [req.body.imekompanije, req.body.brojkompanije, req.body.adresasjedista, req.body.grad], (err, result) => {
                if (err) {
                    console.info(err);
                }
                pool.query("select id from trgovina where naziv = $1", [req.body.imekompanije], (err, result) => {
                    if (err) {
                        console.info(err);
                    }
                    req.trgovinaid = result.rows[0].id;
                    console.info("result", result.rows[0].id);
                    console.info("id:", req.trgovinaid);
                    next();

                })
                next();
            })
    },

    createTrgovac: (req, res, next) => {
        if (req.greska) {
            next();
        }

        let slika = req.cookies.trgovacslika;
        let password = jwt.sign(req.body.sifra, 'kljuc')

        console.info(password);
        console.info(slika);
        console.info(req.trgovinaid);
        pool.query("insert into trgovac(ime, prezime, adresa, grad, username, email, password,photo,trgovina_id,drzava) values ($1, $2, $3, $4, $5, $6, $7, $8,$9,$10)",
            [req.body.ime, req.body.prezime, req.body.adresatrgovca, req.body.grad, req.body.username, req.body.email, password, slika, req.trgovinaid, req.body.drzava], (err, result) => {
                if (err) {
                    console.info(err);
                }
                next();
            })
    },

    getAllCategories: (req, res, next) => {           // paziti pri promjeni baze ispraviti
        pool.query("select * from kategorije", (err, result) => {
            if (err) {
                console.info(err);
            }
            req.kategorije = result.rows;
            next();
        })
    },
    addArticle: (req, res, next) => {
        let trgovinaid = req.trgovac.trgovina_id;
        let slika = req.cookies.artikalslika;
        pool.query("insert into artikli(naziv, opis, photo, cijena, kolicina, trgovina_id) values($1,$2,$3,$4,$5,$6)",
            [req.body.naziv, req.body.opis, slika, req.body.cijena, req.body.kolicina, trgovinaid], (err, result) => {
                if (err) {
                    console.info(err);
                }
                pool.query("select id from artikli where naziv = $1 and opis = $2 and photo = $3", [req.body.naziv, req.body.opis, slika], (err, result) => {
                    if (err) {
                        console.info(err);
                    }
                    req.id = result.rows[0].id;
                    next();
                })
            })
    },
    addArticleCategories: (req, res, next) => {
        console.info(req.id);
        pool.query("select dodajkategorijenaartikal($1,$2::int[],$3)", [req.id, req.body.kategorije, req.body.kategorije.length], (err, result) => {
            if (err) {
                console.info(err);
            }
            next();
        })
    },

    updateArtikal: (req, res, next) => {
        let slika = req.cookies.artikalslika;
        pool.query("update artikli set naziv = $1, opis = $2, photo = $3, cijena = $4, kolicina = $5 where id = $6",
            [req.body.naziv, req.body.opisartikla, slika, req.body.cijena, req.body.kolicina, req.body.id], (err, result) => {
                if (err) {
                    console.info(err);
                }
                next();
            })
        next();
    },
    deleteAllCategoriesFromArticleById: (req, res, next) => {
        req.id = req.body.id;
        pool.query("delete from artikli_kategorije_veza where artikal_id = $1", [req.body.id], (err, result) => { // stao kod edita kateogirja bug imam na null constraint za artikal id undefined
            if (err) {
                console.info(err)
            }
            next();
        })
    },
    getAllArticles: (req, res, next) => {
        if (!req.params.orderby) {
            req.params.orderby = "artikli.naziv ASC";
        }
        console.info(req.params.orderby);
        pool.query("select artikli.id as artikal_id, artikli.naziv as artikal_naziv, artikli.opis as artikal_opis, artikli.photo as artikal_photo, artikli.cijena as artikal_cijena, " +
            "artikli.kolicina as artikal_kolicina,artikli.trgovina_id as artikal_trgovina_id, artikli.datum_objave as artikal_datum_objave, artikli.datum_posljednje_izmjene as artikal_datum_posljednje_izmjene,artikli.stanje as artikal_stanje, t.naziv as trgovina_naziv, t.kontakt_tel as trgovina_telefon , " +
            "t.sjediste_adresa as trgovina_adresa, t.grad as trgovina_grad,t.logo as trgovina_photo, t2.id as id_trgovca  from artikli " +
            "inner join trgovina t on artikli.trgovina_id = t.id " +
            "inner join trgovac t2 on t.id = t2.trgovina_id order by " + req.params.orderby, [], (err, result) => {
            if (err) {
                console.info(err);
            }
            console.info(result.rows);
            req.artikli = result.rows;
            next();
        })
    },
    getAllArticlesLike: (req, res, next) => {
        let kategorija = "akv.kategorija_id";
        if(req.params.naziv === 'null'){
            req.params.naziv = "%";
        }
        else {
            req.params.naziv = req.params.naziv + "%";
        }
        if(req.params.id != '0'){
            kategorija = req.params.id;
        }

        console.info(req.params.id);
        console.info(req.params.naziv);

        pool.query("select artikli.id as artikal_id, artikli.naziv as artikal_naziv, artikli.opis as artikal_opis, artikli.photo as artikal_photo, artikli.cijena as artikal_cijena," +
            "artikli.kolicina as artikal_kolicina,artikli.trgovina_id as artikal_trgovina_id, artikli.datum_objave as artikal_datum_objave, artikli.datum_posljednje_izmjene as artikal_datum_posljednje_izmjene,artikli.stanje as artikal_stanje, t.naziv as trgovina_naziv, t.kontakt_tel as trgovina_telefon," +
            "t.sjediste_adresa as trgovina_adresa, t.grad as trgovina_grad,t.logo as trgovina_photo, t2.id as id_trgovca  from artikli " +
            "inner join trgovina t on artikli.trgovina_id = t.id " +
            "inner join trgovac t2 on t.id = t2.trgovina_id " +
            "inner join artikli_kategorije_veza akv on artikli.id = akv.artikal_id where akv.kategorija_id = " + kategorija + " and  artikli.naziv LIKE $1", [req.params.naziv], (err, result) => {

                if (err) {
                    console.info(err);
                }
                req.artikli = result.rows;
                next();
        })
    },
    getMostPopularArticles: (req,res,next) => {
        pool.query("select artikli.id as artikal_id, artikli.naziv as artikal_naziv, artikli.opis as artikal_opis, artikli.photo as artikal_photo, artikli.cijena as artikal_cijena," +
            "artikli.kolicina as artikal_kolicina,artikli.trgovina_id as artikal_trgovina_id, artikli.datum_objave as artikal_datum_objave, artikli.datum_posljednje_izmjene as artikal_datum_posljednje_izmjene,artikli.stanje as artikal_stanje, t.naziv as trgovina_naziv, t.kontakt_tel as trgovina_telefon,"+
            "t.sjediste_adresa as trgovina_adresa, t.grad as trgovina_grad,t.logo as trgovina_photo, t2.id as id_trgovca  from artikli" +
            " inner join trgovina t on artikli.trgovina_id = t.id " +
            "inner join trgovac t2 on t.id = t2.trgovina_id order by broj_narudzbi DESC limit 3", [] , (err,result) => {
            if(err){
                console.info(err);
            }
            req.najpopularniji = result.rows;
            next();
        })
    },

    kreirajNarudzbu: (req, res, next) => {
        let decripted = jwt.decode(req.cookies.kupac, 'kljuc');
        let kupac_id = decripted.id;

        let obj = getDatum();
        let datum_narudzbe = obj.godina.toString() + "-" +  obj.mjesec.toString() + "-" + obj.dan.toString() + " " + obj.sati.toString() +":"+ obj.minute.toString() + ":" + obj.sekunde.toString();

        let datum_isteka = datumIstekaNarudzbe(obj.godina, obj.mjesec, obj.dan, obj.sati, obj.minute, obj.sekunde);


        let query = '';
        query += "insert into narudzbe(datum_kreiranja_zahtjeva,datum_isteka_zahtjeva,trgovac_id,kupac_id, cijena) values" +
            "(" + "'" + datum_narudzbe + "'" + "," + "'" + datum_isteka + "'" + "," + req.cookies.korpa[0].trgovac_id + "," + kupac_id + ',' + req.cookies.korpa[req.cookies.korpa.length - 1] + ")";

        console.info(query);
        console.info("123");

        if(decripted.arhiv_status === true){
            return res.status(400).send({
                message: "Kupac arhiviran"
            });
        };

        pool.query(query, (err, result) => {
            if (err) {
                console.info(err)
                res.sendStatus(500);
            }
            ;
            req.datum_narudzbe = datum_narudzbe;
            next();
        })
    },
    getNarudzbaID: (req, res, next) => {
        pool.query("select id from narudzbe where datum_kreiranja_zahtjeva = $1", [req.datum_narudzbe], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            console.info(result.rows[0]);
            req.narudzbaID = result.rows[0].id;
            next();
        })
    },
    dodajArtikleUVeznuTabeluNarudzbi: (req, res, next) => {

        let query = "insert into narudzbe_artikli_veza(narudzba_id, artikal_id) VALUES";

        let povecajnarudzbe = "update artikli set broj_narudzbi = broj_narudzbi + 1 where ";

        for (i = 0; i < req.cookies.korpa.length - 2; i++) {
            query += "(" + req.narudzbaID + "," + req.cookies.korpa[i].id + "),";
            povecajnarudzbe += "id = " + req.cookies.korpa[i].id + " or ";
        }
        query += "(" + req.narudzbaID + "," + req.cookies.korpa[req.cookies.korpa.length - 2].id + ")";
        povecajnarudzbe += "id = " + req.cookies.korpa[req.cookies.korpa.length - 2].id;
        console.info(query);



        pool.query(query, (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            pool.query(povecajnarudzbe, (err,result) => {
                if(err){
                    console.info(err);
                    return res.sendStatus(500);
                }
                next();
            })

        })


    },

    getAllTrgovacArticles: (req, res, next) => {
        if (!req.params.orderby) {
            req.params.orderby = "artikli.naziv ASC";
        }
        console.info(req.params.orderby);
        pool.query("select artikli.id as artikal_id, artikli.naziv as artikal_naziv, artikli.opis as artikal_opis," +
            "artikli.photo as artikal_photo, artikli.cijena as artikal_cijena,artikli.kolicina as artikal_kolicina,artikli.trgovina_id as artikal_trgovina_id, artikli.datum_objave as artikal_datum_objave, artikli.datum_posljednje_izmjene as artikal_datum_posljednje_izmjene," +
            "artikli.stanje as artikal_stanje, t.naziv as trgovina_naziv, t.kontakt_tel as trgovina_telefon,t.sjediste_adresa as trgovina_adresa, t.grad as trgovina_grad,t.logo as trgovina_photo, t2.id as id_trgovca, t2.ime as trgovac_ime," +
            "t2.prezime as trgovac_prezime, t2.adresa as trgovac_adresa, t2.grad as trgovac_grad, t2.email as trgovac_email, t2.photo as trgovac_photo   from artikli " +
            "inner join trgovina t on artikli.trgovina_id = t.id " +
            "inner join trgovac t2 on t.id = t2.trgovina_id where t2.id = $1 order by " + req.params.orderby, [req.params.trgovac_id], (err, result) => {
            if (err) {
                console.info(err);
            }
            console.info(result.rows);
            console.info(req.params.trgovac_id);
            req.artikli = result.rows;
            next();
        })
    },
    getNarudzbeByKupacID: (req, res, next) => {
        let decripted = jwt.decode(req.cookies.kupac, 'kljuc');
        let kupac_id = decripted.id;
        pool.query("select narudzbe.id as narudzba_id, datum_kreiranja_zahtjeva as narudzba_datum_kreiranja_zahtjeva, datum_isteka_zahtjeva as narudzba_datum_isteka_zahtjeva, trgovac_odobrio as narudzba_trgovac_odobrio," +
            "datum_odobrenja_trgovca as narudzba_datum_odobrenja_trgovca, datum_isporuke_kupac as narudzba_datum_isporuke_kupac,kupac_ponistio_narudzbu as narudzba_kupac_ponistio,cijena as narudzba_cijena,status_narudzbe as narudzba_status_narudzbe," +
            "t.id as trgovac_id, t.ime as trgovac_ime, t.prezime as trgovac_prezime,t.adresa as trgovac_adresa,t.email as trgovac_email  from narudzbe inner join trgovac t on narudzbe.trgovac_id = t.id inner join kupac k on k.id = narudzbe.kupac_id where kupac_id = $1 order by narudzbe.id", [kupac_id], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            req.narudzbe = result.rows;
            pool.query("select * from narudzbe_artikli_veza inner join artikli a on a.id = narudzbe_artikli_veza.artikal_id", (err, result) => {
                if (err) {
                    console.info(err);
                    return res.sendStatus(500);
                }
                req.artikli = result.rows;
                next();
            })
        })
    },
    getNarudzbeByTrgovacID: (req, res, next) => {
        let decripted = jwt.decode(req.cookies.trgovac, 'kljuc');
        let trgovac_id = decripted.id;
        pool.query("select narudzbe.id as narudzba_id, datum_kreiranja_zahtjeva as narudzba_datum_kreiranja_zahtjeva, datum_isteka_zahtjeva as narudzba_datum_isteka_zahtjeva, trgovac_odobrio as narudzba_trgovac_odobrio," +
            "datum_odobrenja_trgovca as narudzba_datum_odobrenja_trgovca, datum_isporuke_kupac as narudzba_datum_isporuke_kupac,kupac_ponistio_narudzbu as narudzba_kupac_ponistio,cijena as narudzba_cijena,status_narudzbe as narudzba_status_narudzbe," +
            "t.id as trgovac_id, t.ime as trgovac_ime, t.prezime as trgovac_prezime,t.adresa as trgovac_adresa,t.email as trgovac_email, k.ime as kupac_ime, k.prezime as kupac_prezime  from narudzbe inner join trgovac t on narudzbe.trgovac_id = t.id inner join kupac k on k.id = narudzbe.kupac_id where trgovac_id = $1 order by narudzbe.id", [trgovac_id], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            req.narudzbe = result.rows;
            pool.query("select * from narudzbe_artikli_veza inner join artikli a on a.id = narudzbe_artikli_veza.artikal_id", (err, result) => {
                if (err) {
                    console.info(err);
                    return res.sendStatus(500);
                }
                req.artikli = result.rows;
                next();
            })
        })
    },
    trgovacOdobriNarudzbu: (req, res, next) => {

        let obj = getDatum();
        let datum_narudzbe = obj.godina.toString() + obj.mjesec.toString() + obj.dan.toString() + " " + obj.sati.toString() + ":" + obj.minute.toString() + ":" + obj.sekunde.toString();

        let datum_isteka = datumIstekaNarudzbe(obj.godina, obj.mjesec, obj.dan, obj.sati, obj.minute, obj.sekunde);

        pool.query("update narudzbe set trgovac_odobrio = true,datum_odobrenja_trgovca = $1, datum_isporuke_kupac = $2 where id= $3", [datum_narudzbe, datum_isteka, req.params.id], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    trgovacOdbijNarudzbu: (req, res, next) => {

        pool.query("update narudzbe set trgovac_odobrio = false,status_narudzbe = false where id= $1", [req.params.id], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    kupacPrekiniNarudzbu: (req, res, next) => {
        pool.query("update narudzbe set kupac_ponistio_narudzbu = true, status_narudzbe = false where id = $1", [req.params.id], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    editKupacProfile: (req, res, next) => {
        console.info(jwt.decode(req.cookies.kupac, 'kljuc'));
        let sifra = req.body.password;
        let decoded = jwt.decode(req.cookies.kupac, 'kljuc');
        let password = jwt.decode(decoded.password, 'kljuc');
        let slika = req.cookies.kupacslika;
        if (sifra != password) {
            return res.status(400).send({
                message: 'Pogresno unijeta sifra'
            })
        }
        ;
        pool.query("update kupac set ime = $1, prezime = $2, adresa = $3, email = $4, photo = $5 where id = $6", [req.body.ime, req.body.prezime, req.body.adresa, req.body.email,slika, decoded.id], (err, result) => {
            if (err) {
                console.info(err);
                return res.sendStatus(500);
            }
            decoded.ime = req.body.ime;
            decoded.prezime = req.body.prezime;
            decoded.email = req.body.email;
            decoded.adresa = req.body.adresa;
            res.cookie('kupac', jwt.sign(decoded, 'kljuc'));
            console.info("ovo je novi cookie", req.cookies.kupac);
            next();
        });
    },
    kupacChangePassword: (req,res,next) =>{
        let decripted = jwt.decode(req.cookies.kupac, 'kljuc');
        let id = decripted.id;
        let password = jwt.decode(decripted.password,'kljuc');
        if(req.params.currentpassword != password){
            return res.status(400).send({
                message:"Pogresna trenutna lozinka"
            });
        }
        pool.query("update kupac set password = $1 where id = $2",[jwt.sign(req.params.newpassword,'kljuc'),id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(400);
            }
            next();
        })

    },
    editTrgovacPofile: (req,res,next) => {
        let decoded = jwt.decode(req.cookies.trgovac,'kljuc');
        let sifra = jwt.decode(decoded.password,'kljuc');
        let slika = req.cookies.trgovacslika;
        if(req.body.password != sifra){
            return res.status(400).send({
                message: "Pogresna lozinka"
            });
        };
        pool.query("update trgovac set ime = $1, prezime = $2, adresa = $3, email = $4, drzava = $5, grad = $6,photo = $7 where id = $8",
            [req.body.ime,req.body.prezime,req.body.adresa,req.body.email,req.body.drzava,req.body.grad,slika,decoded.id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    editTrgovinaProfile: (req,res,next) => {
        let decoded = jwt.decode(req.cookies.trgovac,'kljuc');

        pool.query("update trgovina set naziv = $1, kontakt_tel = $2 where id=$3",[req.body.imefirme, req.body.firma_tel, decoded.trgovina_id],(err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    trgovacChangePassword: (req,res,next) => {
        let decoded = jwt.decode(req.cookies.trgovac,'kljuc');
        let password = jwt.decode(decoded.password,'kljuc');
        console.info(req.params.currentpassword);
        if(req.params.currentpassword != password){
            return res.status(400).send({
                message: "Pogresno ste unijeli trenutnu lozinku"
            });
        }
        pool.query("update trgovac set password = $1 where id = $2",[jwt.sign(req.params.newpassword,'kljuc'),decoded.id], (err,result) =>{
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    getAllKupci: (req,res,next) => {
        pool.query("select * from kupac", (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            req.kupci = result.rows;
            next();
        })
    },
    block15daysTrgovac: (req,res,next) => {
        let obj = getDatum();
        let timestamp = datumIstekaNarudzbe(obj.godina,obj.mjesec,obj.dan,obj.sati,obj.minute,obj.sekunde);


        pool.query("update trgovac set block_timestamp = $1 where id = $2",[timestamp, req.params.id] , (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    odblokirajTrgovca: (req,res,next) => {
        pool.query("update trgovac set block_timestamp = null, blocked_forever = null where id = $1",[req.params.id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    block15daysKupac: (req,res,next) => {
        let obj = getDatum();
        let timestamp = datumIstekaNarudzbe(obj.godina,obj.mjesec,obj.dan,obj.sati,obj.minute,obj.sekunde);

        pool.query("update kupac set block_timestamp = $1 where id = $2",[timestamp,req.params.id],(err,result)=>{
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    odblokirajKupca: (req,res,next) => {
        pool.query("update kupac set block_timestamp = null, blocked_forever = null where id=$1",[req.params.id],(err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    kupacBlockTrajno: (req,res,next) => {
        pool.query("update kupac set blocked_forever = true where id=$1",[req.params.id],(err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    trgovacBlockTrajno: (req,res,next) => {
        pool.query("update trgovac set blocked_forever = true where id=$1",[req.params.id],(err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    arhivirajTrgovca: (req,res,next) => {
        pool.query("update trgovac set arhiv_status = true where id=$1",[req.params.id],(err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    arhivirajKupca: (req,res,next) => {
        pool.query("update kupac set arhiv_status = true where id = $1",[req.params.id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    odArhivirajKupca: (req,res,next) => {
        pool.query("update kupac set arhiv_status = null where id=$1",[req.params.id],(err,result) => {
            if(err){
                console.log(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    odArhivirajTrgovca: (req,res,next) => {
        pool.query("update trgovac set arhiv_status = null where id=$1",[req.params.id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    adminDodajKategoriju: (req,res,next) => {
        pool.query("insert into kategorije(naziv) values($1)",[req.params.naziv], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    adminDodajInteres: (req,res,next) => {
        pool.query("insert into interesi(naziv) values($1)", [req.params.naziv], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    adminObrisiKategoriju: (req,res,next) => {
        pool.query("delete from kategorije where id=$1",[req.params.id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    },
    adminObrisiInteres: (req,res,next) => {
        pool.query("delete from interesi where id=$1",[req.params.id], (err,result) => {
            if(err){
                console.info(err);
                return res.sendStatus(500);
            }
            next();
        })
    }





}