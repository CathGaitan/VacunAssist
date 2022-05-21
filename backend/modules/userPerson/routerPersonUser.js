const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
const bp = require('body-parser')
routerPersonUser.use(bp.json())
routerPersonUser.use(bp.urlencoded({ extended: true }))
var userActive;

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
routerPersonUser.get('/viewdata', (req, res)=>{
    res.render('viewdata')
})
routerPersonUser.get('/infoCovid', (req, res)=>{
    res.render('infoCovid')
})
routerPersonUser.get('/infoGripe', (req, res)=>{
    res.render('infoGripe')
})
routerPersonUser.get('/infoFiebreAmarilla', (req, res)=>{
    res.render('infoFiebreAmarilla')
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
    userActive= user.email;
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
                    timer: false,
                    ruta: 'personUser/infoCovid' 
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
    let newzone;
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
    if (req.body.zone != 'empty'){
        newzone= req.body.zone;
        DB.query('UPDATE personuser SET zone = ? WHERE email = ?', [newzone, email], async (error, results)=>{
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

const formatDate = (date)=>{
    let formatted_date = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()
    return formatted_date;
}


//ver datos personales
routerPersonUser.get('/listData',async(req, res)=>{
    const email= req.session.name;
    DB.query('SELECT * FROM personuser WHERE email = ?',email,async (error, results)=>{
        console.log(results);
        if(results[0].risk==0) results[0].risk="No"
        else results[0].risk="Si";
        results[0].dateofbirth=formatDate(results[0].dateofbirth);
        res.render('viewdata',{
            personuserdata:results
        });
    });
});


//metodo todo para controlar que esta auth en todas las páginas
routerPersonUser.get('/dashboard', (req, res)=> { //controla el dashboard
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

routerPersonUser.get('/updatedata', (req, res)=> { //controla el updatedata NO FUNCIONA
	if (req.session.loggedin) {
		res.render('updatedata',{
			login: true,
			name: req.session.name			
		});		
	} else {
		res.render('updatedata',{
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
    const email= userActive;
    const doses= req.body.doses;
    DB.query('UPDATE personuser SET coviddoses = ? WHERE email = ?', [doses, email], async (error, results)=>{
        DB.query('SELECT * FROM personuser WHERE email = ?', [email], async (error, results)=>{
            if (results[0].coviddoses<2){
                let turn={
                    idpersonuser: results[0].id,
                    vaccinename: "Covid-19",
                    dose: results[0].coviddoses+1,
                    state: " ",
                    date: undefined
                }
                if (results[0].risk == 1){ // si es de riesgo 
                    const tiempoTranscurrido = Date.now();
                    const fecha = new Date(tiempoTranscurrido);
                    let dia= fecha.getDate()+7
                    fecha.setDate(dia);
                    turn.state= "Otorgado";
                    turn.date= fecha
                }
                else{ //si no es de riesgo
                    turn.state= "Pendiente";
                }
                DB.query('INSERT INTO turn SET ?', turn)}
            });
        });
        res.render('infoCovid', {
            alert: true,
            alertTitle: "Tu informacion se guardo exitosamente",
            alertMessage: "¡INFORMACION GUARDADA!",
            alertIcon:'success',
            showConfirmButton: false,
            timer: false,
            ruta: 'personUser/infoGripe'
        });
});

routerPersonUser.post('/infoGripe', async(req,res)=>{
    const email= userActive;
    const fluevaccine= req.body.fluevaccine;
    const datefluevaccine= req.body.datefluevaccine;
    DB.query('SELECT * FROM personuser WHERE email = ?', [email], async (error, results)=>{
        if (results[0].fluevaccine == 0){
            const tiempoTranscurrido = Date.now();
            const fecha = new Date(tiempoTranscurrido);
            let turn={
                idpersonuser: results[0].id,
                vaccinename: "Gripe",
                dose: "unica por anio",
                state: "Otorgado",
                date: undefined
            }
            if (results[0].risk == 1){ // si es de riesgo 
                let mes= fecha.getMonth()+2
                fecha.setMonth(mes);
                turn.date= fecha;
            }
            else{ //si no es de riesgo
                let mes= fecha.getMonth()+5
                fecha.setMonth(mes);
                turn.date= fecha
            }
            DB.query('INSERT INTO turn SET ?', turn)}
        });
    DB.query('UPDATE personuser SET fluevaccine = ?, datefluevaccine = ? WHERE email = ?', [fluevaccine, datefluevaccine, email], async (error, results)=>{
        res.render('infoGripe', {
            alert: true,
            alertTitle: "Tu informacion se guardo exitosamente",
            alertMessage: "¡INFORMACION GUARDADA!",
            alertIcon:'success',
            showConfirmButton: false,
            timer: false,
            ruta: 'personUser/infoFiebreAmarilla'
        });       
    })
});

routerPersonUser.post('/infoFiebreAmarilla', async(req,res)=>{
    const email= userActive;
    const fevervaccine= req.body.fevervaccine;
    const datefevervaccine= req.body.datefevervaccine;
    DB.query('UPDATE personuser SET fevervaccine = ?, datefevervaccine = ? WHERE email = ?', [fevervaccine, datefevervaccine, email], async (error, results)=>{
        res.render('infoFiebreAmarilla', {
            alert: true,
            alertTitle: "Tu informacion se guardo exitosamente",
            alertMessage: "¡INFORMACION GUARDADA!",
            alertIcon:'success',
            showConfirmButton: false,
            timer: false,
            ruta: 'personUser/dashboard'
        });       
    })
});

module.exports=routerPersonUser;
