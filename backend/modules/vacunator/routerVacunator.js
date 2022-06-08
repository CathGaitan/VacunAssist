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
routerVacunator.get('/registerVacunator', (req, res)=> {
    res.render('registerVacunator');
})
routerVacunator.get('/infovaccines', (req, res)=> {
    res.render('infovaccines');
})

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

//registro
routerVacunator.post('registerVacunator', async (req, res)=> {
    let pass= req.body.DNI;
    let passwordHash = await bcryptjs.hash(req.body.DNI, 8);
    let randomCode=Math.floor((Math.random() * (9999 - 1000 + 1)) + 1000);
    let user = {
        email:req.body.email, 
        name:req.body.name, 
        lastname: req.body.lastname,
        password: passwordHash,
        DNI: req.body.DNI,
        dateofbirth: req.body.dateofbirth,
        risk: req.body.risk,
        zone: "esto hay que acomodarlo cuando tengamos lo del vacunador hecho",
        securecode: randomCode
    }
    userActive= user.email;
    if (pass.length < 6){ //si la contrasenia tiene menos de 6 dig
        res.render('register', { //animacion de registro exitoso
            alert: true,
            alertTitle: "Error",
            alertMessage: "La contraseña debe ser de como minimo 6 caracteres",
            alertIcon:'error',
            showConfirmButton: false,
            timer: false,
            ruta: 'vacunator/registerVacunator' 
        });
    }else{ //si la contrasenia es valida
        if (user.DNI>0 && user.DNI<9999999999999 && user.DNI != 41777666){ //verificacion RENAPER (?)
            DB.query('INSERT INTO personuser SET ?', user, async (error, results)=> {
                if (error){
                    if (error.code == 'ER_DUP_ENTRY'){
                        res.render('register', { //animacion de dni no validado
                            alert: true,
                            alertTitle: "Error en el registro",
                            alertMessage: "Ese email ya existe en el sistema",
                            alertIcon:'error',
                            showConfirmButton: false,
                            timer: false,
                            ruta: 'vacunator/registerVacunator' 
                        });
                    }
                }else{
                    await transporter.sendMail({
                        from: '"Vacunassist" <code.guess2022@gmail.com>', // sender address
                        to: user.email, // list of receivers
                        subject: "Nueva cuenta en vacunassist!", // Subject line
                        text: `Felicidades, se ha creado una cuenta en vacunassist, el siguiente codigo debera ingresarlo al iniciar sesion: ${randomCode}`
                    });
                    res.render('register', { //animacion de registro exitoso
                        alert: true,
                        alertTitle: "Registro",
                        alertMessage: "Registro exitoso!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'vacunator/infovaccines' 
                    });
                }
            });
        } else {
            res.render('register', { //animacion de dni no validado
                alert: true,
                alertTitle: "Error en el registro",
                alertMessage: "El DNI no esta validado por RENAPER",
                alertIcon:'error',
                showConfirmButton: false,
                timer: false,
                ruta: 'vacunator/registerVacunator' 
            });
        }
    }
});



module.exports=routerVacunator;