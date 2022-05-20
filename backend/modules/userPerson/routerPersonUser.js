const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
const bp = require('body-parser')
routerPersonUser.use(bp.json())
routerPersonUser.use(bp.urlencoded({ extended: true }))

//7- variables de session
const session = require('express-session');
routerPersonUser.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

//estableciendo rutas
routerPersonUser.get('/login', (req, res)=> {
    res.render('login');
})
routerPersonUser.get('/register', (req, res)=> {
    res.render('register');
})
routerPersonUser.get('/updatedata', (req, res)=>{
    res.render('updatedata')
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
        risk: req.body.risk,
        zone: req.body.zone
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
                    alertTitle: "Registro",
                    alertMessage: "Registro exitoso!",
                    alertIcon:'success',
                    showConfirmButton: false,
                    timer: 2000,
                    ruta: '' //----------------- aca redirigis a cargar informacion
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
        DB.query('SELECT * FROM personuser WHERE email = ?', email, async (error, results)=>{
            if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Email y/o contrasenia incorrectas",
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

//actualizar datos personales
routerPersonUser.post('/updatedata', async (req, res)=>{
    let newname;
    let newlastname;
    let newpassword;
    let newdateofbirth;
    let newdni;
    let newrisk;
    const email= req.session.name;
    if (req.body.name){ 
        newname= req.body.name;
        DB.query('UPDATE personuser SET name = ? WHERE email = ?', [newname, email], async (error, results)=>{
            res.render('updatedata', {
                alert: true,
                alertTitle: "Actualizacion de datos exitosa",
                alertMessage: "¡ACTUALIZACION CORRECTA!",
                alertIcon:'success',
                showConfirmButton: false,
                timer: false,
                ruta: 'personUser/updatedata'
            });       
        })
    }
    if (req.body.lastname){
        newlastname= req.body.lastname;
        DB.query('UPDATE personuser SET lastname = ? WHERE email = ?', [newlastname, email], async (error, results)=>{
            res.render('updatedata', {
                alert: true,
                alertTitle: "Actualizacion de datos exitosa",
                alertMessage: "¡ACTUALIZACION CORRECTA!",
                alertIcon:'success',
                showConfirmButton: false,
                timer: false,
                ruta: 'personUser/updatedata'
            });       
        })
    }
    if (req.body.password){
        newHasshedPassword=  await bcryptjs.hash(req.body.password, 8);
        DB.query('UPDATE personuser SET password = ? WHERE email = ?', [newHasshedPassword, email], async (error, results)=>{
            res.render('updatedata', {
                alert: true,
                alertTitle: "Actualizacion de datos exitosa",
                alertMessage: "¡ACTUALIZACION CORRECTA!",
                alertIcon:'success',
                showConfirmButton: false,
                timer: false,
                ruta: 'personUser/updatedata'
            });       
        })
    }
    if (req.body.risk){
        newrisk= req.body.risk;
        console.log(risk);
        DB.query('UPDATE risk SET dateofbirth = ? WHERE email = ?', [newrisk, email], async (error, results)=>{
            res.render('updatedata', {
                alert: true,
                alertTitle: "Actualizacion de datos exitosa",
                alertMessage: "¡ACTUALIZACION CORRECTA!",
                alertIcon:'success',
                showConfirmButton: false,
                timer: false,
                ruta: 'personUser/updatedata'
            });       
        })
    }
});

//metodo todo para controlar que esta auth en todas las páginas
routerPersonUser.get('/dashboard', (req, res)=> {
	if (req.session.loggedin) {
		res.render('dashboard',{
			login: true,
			name: req.session.name			
		});		
	} else {
		res.render('dashboard',{
			login:false,
			name:'Debe iniciar sesión',			
		});				
	}
	res.end();
});
 //Logout: destruye la sesión.
routerPersonUser.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
	})
});

//función para limpiar la caché luego del logout
routerPersonUser.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

routerPersonUser.post('/infoCovid', async(req,res)=>{


});

module.exports=routerPersonUser;
