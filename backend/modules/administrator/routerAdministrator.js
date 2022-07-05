const express = require('express');
const routerAdministrator = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
const bp = require('body-parser')
routerAdministrator.use(bp.json())
routerAdministrator.use(bp.urlencoded({ extended: true }));
const transporter=require('../mailConfig/mailer');

const session = require('express-session');
routerAdministrator.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

routerAdministrator.get('/login', (req, res)=> {
    res.render('loginVacunator',{
        name:"Administrador"
    });
});



//autenticacion
routerAdministrator.post('/auth', async (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    if (email && password){
        DB.query('SELECT * FROM administrator WHERE email = ?', email, async (error, results)=>{
            if (results.length == 0 || (password != results[0].password)){
                res.render('loginVacunator', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Email y/o contraseña  incorrecto",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    name:"Administrador",
                    ruta: 'administrator/login'    
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
                    name:"Administrador",
					ruta: 'administrator/dashboard'
				});       
            }
        });
    }
})


module.exports=routerAdministrator;