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

routerAdministrator.get('/verbajas', (req, res)=> {
    res.render('verbajas');
})

routerAdministrator.get('/otorgarBaja', (req, res)=>{
    res.render('otorgarBaja')
})




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

routerAdministrator.get('/dashboard', (req, res)=> { //controla el dashboard
	if (req.session.loggedin) {
        const email= req.session.email;
        DB.query('SELECT id FROM administrator WHERE email = ?',email,async(error, results)=>{
            res.render('dashboardAdministrator',{
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

routerAdministrator.get('/verBajasAdministrator', async (req, res)=> {
    let cancel= 'accountcancelationreq';
    DB.query('SELECT * FROM personuser WHERE state = ?', cancel, async (req, results)=> {
        res.render('verbajas',{
        accounts:results,
        });
    });
});

routerAdministrator.post('/otorgarBaja', async (req, res)=>{
    let cancel= 'accountcancelationreq';
    DB.query('SELECT * FROM personuser WHERE state = ?', cancel, async (req, results)=> {
        for (let i=0; i<results.length; i++){
            console.log(req.body[results[i].id]);
            if (req.body[results[i].id]){
                DB.query ('DELETE FROM personuser WHERE id = ?', req.body.results[i].id, async (req, results)=>{
                    console.log('eliminado ;)');
                });
            }
        };
        res.render('otorgarBaja', {
            alert: true,
            alertTitle: "Usuarios eliminados",
            alertMessage: "La baja de los usuarios seleccionados fue exitosa",
            alertIcon:'success',
            showConfirmButton: false,
            timer: 5000,
            ruta: 'administrator/dashboard'
        });
    });
});

module.exports=routerAdministrator;