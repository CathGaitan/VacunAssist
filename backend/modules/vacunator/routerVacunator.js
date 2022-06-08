const express = require('express');
const routerVacunator = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
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
    res.render('login');
});

//autenticacion
routerVacunator.post('/auth', async (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    let passwordHash = await bcryptjs.hash(password, 8);
    if (email && password){
        DB.query('SELECT * FROM personuser WHERE email = ?', email, async (error, results)=>{
            if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Email y/o contraseña  incorrecto",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'personUser/login'    
                }); 
            } else { //login exitoso
               //creamos una var de session y le asignamos true si INICIO SESSION       
				req.session.loggedin = true;                
				req.session.name = results[0].email;
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: 'personUser/dashboard'
				});       
            }
        });
    }
})

module.exports=routerVacunator;