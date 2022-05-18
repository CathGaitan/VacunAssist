const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
const bp = require('body-parser')
routerPersonUser.use(bp.json())
routerPersonUser.use(bp.urlencoded({ extended: true }))


//estableciendo rutas
routerPersonUser.get('/login', (req, res)=> {
    res.render('login');
})
routerPersonUser.get('/register', (req, res)=> {
    res.render('register');
})

// registracion
routerPersonUser.post('/register', async (req, res)=>{
    let passwordHash = await bcryptjs.hash(req.body.password, 8);
    let user = {
        email:req.body.email, 
        name:req.body.name, 
        lastname: req.body.lastname,
        password: passwordHash,
        DNI: req.body.DNI,
        dateofbirth: req.body.dateofbirth,
        risk: req.body.risk
    }
    if (user.DNI>0 && user.DNI<9999999999999 && user.DNI != 41777666){ //verificacion RENAPER (?)
        DB.query('INSERT INTO personuser SET ?', user, async (error, results)=> {
            if (error){
                console.log(error);
                if (error.code == 'ER_DUP_ENTRY'){
                    res.send('EMAIL EXISTENTE') 
                }
            }else{
                res.render('register', { //animacion de registro exitoso
                    alert: true,
                    alertTitle: "Registration",
                    alertMessage: "Registro exitoso!",
                    alertIcon:'success',
                    showConfirmButton: false,
                    timer: 2000,
                    ruta: ''
                });
            }
        });
    } else {
        res.send('DNI NO VALIDADO POR RENAPER')
    }
});

//autenticacion
routerPersonUser.post('/auth', async (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    let passwordHash = await bcryptjs.hash(password, 8);
    if (email && password){
        DB.query('SELECT * FROM personuser WHERE email ?', email, async (error, results)=>{
            if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))){
                res.send('usuario o contrasenia incorrecta')
            } else {
                res.send('login correcto')
            }
        });
    }
})

module.exports=routerPersonUser;
