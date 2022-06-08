const express = require('express');
const routerVacunator = express.Router();
const DB = require('../../dataBase/dataBase');
const bp = require('body-parser')
routerVacunator.use(bp.json())
routerVacunator.use(bp.urlencoded({ extended: true }));
const transporter=require('../mailConfig/mailer');

var userActive;

//7- variables de session
const session = require('express-session');
const e = require('express');
routerVacunator.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

routerVacunator.get('/login', (req, res)=> {
    res.render('loginVacunator');
});

routerVacunator.get('/dashboard', (req, res)=> {
    res.render('dashboardVacunator');
});

//autenticacion
routerVacunator.post('/auth', async (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    if (email && password){
        DB.query('SELECT * FROM vacunator WHERE email = ?', email, async (error, results)=>{
            if (results.length == 0 || (password != results[0].password)){
                res.render('loginVacunator', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Email y/o contraseña  incorrecto",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'vacunator/login'    
                }); 
            } else { //login exitoso
               //creamos una var de session y le asignamos true si INICIO SESSION       
				req.session.loggedin = true;                
				req.session.name = results[0].email;
				res.render('loginVacunator', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: 'vacunator/dashboard'
				});       
            }
        });
    }
})

module.exports=routerVacunator;