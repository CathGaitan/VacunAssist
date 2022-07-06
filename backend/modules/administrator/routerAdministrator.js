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



routerAdministrator.get('/viewMap',async(req,res)=>{
    res.render('viewMap',{
        name:""
    });
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

routerAdministrator.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/administrator/login') // siempre se ejecutará después de que se destruya la sesión
	})
});

//función para limpiar la caché luego del logout
routerAdministrator.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

routerAdministrator.get('/changeNameVaccinationCentre',async(req,res)=>{
    DB.query('SELECT * FROM vaccinationcentres', async (error, results)=>{
        res.render('changeNameVaccinationCentre',{
            name:"",
            centres:results
        });
    });
});

routerAdministrator.post('/changeNameVaccinationCentre',async(req,res)=>{
    let oldName=req.body.changeName;
    let newName=req.body.newName;
    DB.query('UPDATE vaccinationcentres SET name = ? WHERE name = ?',[newName,oldName],async (error, results)=>{
        DB.query('UPDATE vacunator SET zonaVacunatorio = ? WHERE zonaVacunatorio = ?',[newName,oldName],async (error, results)=>{
            DB.query('UPDATE personUser SET zone = ? WHERE zone = ?',[newName,oldName],async (error, results)=>{
                DB.query('SELECT * FROM vaccinationcentres', async (error, nombrescentros)=>{
                    res.render('changeNameVaccinationCentre', {
                        alert: true,
                        alertTitle: "Cambio exitoso",
                        alertMessage: "Se ha cambiado el nombre del vacunatorio",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: 1500,
                        centres:nombrescentros,
                        ruta: 'administrator/changeNameVaccinationCentre'
                    });     
                });

            });
        });
    });
});


function userExist(usermail){
    DB.query('SELECT COUNT(*) FROM personuser WHERE email = ?',usermail,async (error,results)=>{
        return results===0
    });
}


routerAdministrator.post('/changeToRisk',async(req,res)=>{
    let usermail=req.body.usermail;

    DB.query('UPDATE vaccinationcentres SET name = ? WHERE name = ?',usermail,async (error, results)=>{});

});

module.exports=routerAdministrator;