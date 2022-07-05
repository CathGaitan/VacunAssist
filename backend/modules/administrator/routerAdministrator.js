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
    res.render('loginVacunator');
});

routerAdministrator.get('/login', (req, res)=> {
    res.render('loginVacunator');
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
					ruta: 'vacunator/dashboard'
				});       
            }
        });
    }
})

routerAdministrator.get('/dashboard', (req, res)=> { //controla el dashboard
	if (req.session.loggedin) {
        const email= req.session.email;
        DB.query('SELECT id FROM vacunator WHERE email = ?',email,async(error, results)=>{
            res.render('dashboardVacunator',{
                login: true,
                name: req.session.name,	
            });
        });	
	} else {
		res.render('dashboard',{
			login:false,
			name:'Debe iniciar sesión',			
		});
        res.end();			
	}
});