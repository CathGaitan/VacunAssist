const express = require('express');
const routerVacunator = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
const bp = require('body-parser')
routerVacunator.use(bp.json())
routerVacunator.use(bp.urlencoded({ extended: true }));
const transporter=require('../mailConfig/mailer');
var userActive;


function getEdad(dateString) {
    let hoy = new Date()
    let fechaNacimiento = new Date(dateString)
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
    let diferenciaMeses = hoy.getMonth() - fechaNacimiento.getMonth()
    if (
      diferenciaMeses < 0 ||
      (diferenciaMeses === 0 && hoy.getDate() < fechaNacimiento.getDate())
    ) {
      edad--
    }
    return edad
  }

//7- variables de session
const session = require('express-session');
routerVacunator.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

routerVacunator.get('/login', (req, res)=> {
    res.render('loginVacunator');
});
routerVacunator.get('/registerVacunator', (req, res)=> {
    res.render('registerVacunator');
})
routerVacunator.get('/infovaccines', (req, res)=> {
    res.render('infovaccines');
})
routerVacunator.get('/viewlist', (req, res)=> {
    res.render('viewlist');
})

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

routerVacunator.get('/dashboard', (req, res)=> { //controla el dashboard
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

//registro
routerVacunator.post('/registerVacunator', async (req, res)=> {
    let pass= req.body.DNI;
    let passwordHash = await bcryptjs.hash(req.body.DNI, 8);
    let randomCode=Math.floor((Math.random() * (9999 - 1000 + 1)) + 1000);
    const email= req.session.name;
    var zonav;
    DB.query('SELECT * FROM vacunator WHERE email = ?', email, async (error, results)=> {
        let user = {
            email:req.body.email, 
            name:req.body.name, 
            lastname: req.body.lastname,
            password: passwordHash,
            DNI: req.body.DNI,
            dateofbirth: req.body.dateofbirth,
            risk: req.body.risk,
            zone: results[0].zonaVacunatorio,
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
                        userActive= user.email;
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
});

routerVacunator.get('/registrarausente', async(req,res)=>{
    let vacunador= req.session.name;
    DB.query('SELECT * FROM vacunator WHERE email = ?', vacunador, async (error, results)=> {
        let zonevac = results[0].zonaVacunatorio;
        let date = new Date(Date.now());
        let fecha = date.toISOString().split('T')[0];
        DB.query('SELECT name, lastname, email, vaccinename FROM turn JOIN personuser WHERE (turn.date = ?) AND (personuser.zone = ?) AND (turn.idpersonuser = personuser.id)', [fecha, zonevac], async(error, results)=>{
            let newResults=[];
            for(let i=0; i<results.length; i++){
                newResults.push(results[i].name+" "+results[i].lastname+" ( "+results[i].email+" ) Vacuna: "+results[i].vaccinename);
            }
            res.render('marcarausente',{results:newResults});
        });
    });
});

routerVacunator.post('/registrarausente', async(req,res)=>{
    let nameAndLastname=req.body.selectNameUser;
    let separacion=nameAndLastname.split(' '); //posicion 0 = nombre, posicion1 = apellido posicion2= email
    let usuarioausente= separacion[3];
    let date = new Date(Date.now());
    let fecha = date.toISOString().split('T')[0];
    let vacuna = separacion[6];
    if (vacuna == 'Fiebre'){
        vacuna='Fiebre Amarilla'
    }
    DB.query('SELECT id FROM personuser WHERE ', async (error, results)=> {

    })
        DB.query('UPDATE state = Ausencia FROM turn WHERE vaccinename = ? ', async (error, results)=> {
        
        });
});

routerVacunator.post('/infovaccines', async(req,res)=>{
    const email= userActive;
    let vacturn= req.body.menuvacunas;
    let dosis;
    const hoy = Date.now();
    const fecha = new Date(hoy);
    if (vacturn == 'Covid-19'){
        dosis= req.body.nrodosisc;
    } else{
        if (vacturn == 'Gripe'){
            dosis= "Unica por año";
        } else {
            dosis= "Unica en la vida"
        }
    }
    DB.query('SELECT * FROM personuser WHERE email = ?', [email], async (error, results)=>{
        let edad= getEdad(results[0].dateofbirth);
        console.log('edad ',edad);
        let esmayor18;
        if (edad > 17){
            esmayor18= true;
        }else{
            esmayor18= false;
        }
        let esmayor60;
        if (edad > 59){
            esmayor60= true;
        }else{
            esmayor60= false;
        }
        let turn={
            idpersonuser: results[0].id,
            vaccinename: vacturn,
            dose: dosis,
            state: "Otorgado",
            date: fecha
        }
        console.log(turn);
        //genero el turno
        DB.query('INSERT INTO turn SET ?', turn, async (error, results)=> {    
            //si seleccione turno para covid updateo la info de esta manera
            if (vacturn == 'Covid-19' && esmayor18){//updateo todos los campos
                //info covid
                let vacgripe= req.body.menuFlue;
                let vacgripedate= req.body.inputDate;
                let vacfiebre= req.body.menuFiebre;
                let vacfiebredate= req.body.inputDatefiebre;
                DB.query('UPDATE coviddoses, fluevaccine, datefluevaccine, fevervaccine, datefevervaccine FROM personuser WHERE email = ?', [dosis, vacgripe, vacgripedate, vacfiebre, vacfiebredate, email], async (error, results)=>{
                    res.render('infovaccines', {
                        alert: true,
                        alertTitle: "Tu informacion se guardo exitosamente y se le ha asignado un turno para hoy",
                        alertMessage: "¡INFORMACION GUARDADA!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'vacunator/dashboard'
                    });       
                })
            } else {
                res.render('infovaccines', {
                    alert: true,
                    alertTitle: "Los datos se han almacenado pero el turno no ha sido asignado ya que el usuario es menor de edad",
                    alertMessage: "¡INFORMACION GUARDADA!",
                    alertIcon:'error',
                    showConfirmButton: false,
                    timer: false,
                    ruta: 'vacunator/dashboard'
                });    
            }
            //si seleccione turno para la fiebre, updateo de esta manera
            if (vacturn == 'Fiebre Amarilla' && !esmayor60) {
                let vacgripe= req.body.menuFlue;
                let vacgripedate= req.body.inputDate;
                let dosiscovid= req.body.menuCovid;
                DB.query('UPDATE coviddoses, fluevaccine, datefluevaccine, fevervaccine, datefevervaccine FROM personuser WHERE email = ?', [dosiscovid, vacgripe, vacgripedate, 1, Date.now(), email], async (error, results)=>{
                    res.render('infovaccines', {
                        alert: true,
                        alertTitle: "Tu informacion se guardo exitosamente y se le ha asignado un turno para hoy",
                        alertMessage: "¡INFORMACION GUARDADA!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'vacunator/dashboard'
                    });       
                })
            } else {
                res.render('infovaccines', {
                    alert: true,
                    alertTitle: "Los datos se han almacenado pero el turno no ha sido asignado ya que el usuario es mayor de 60",
                    alertMessage: "¡INFORMACION GUARDADA!",
                    alertIcon:'error',
                    showConfirmButton: false,
                    timer: false,
                    ruta: 'vacunator/dashboard'
                });   
            }
            //si seleccione turno para gripe, updateo de esta manera
            if (vacturn = 'Gripe') {
                let dosiscovid= req.body.menuCovid;
                let vacfiebre= req.body.menuFiebre;
                let vacfiebredate= req.body.inputDatefiebre;
                DB.query('UPDATE coviddoses, fluevaccine, datefluevaccine, fevervaccine, datefevervaccine FROM personuser WHERE email = ?', [dosiscovid, 1, Date.now(), vacfiebre, vacfiebredate, email], async (error, results)=>{
                    res.render('infovaccines', {
                        alert: true,
                        alertTitle: "Tu informacion se guardo exitosamente y se le ha asignado un turno para hoy",
                        alertMessage: "¡INFORMACION GUARDADA!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'vacunator/dashboard'
                    });       
                })
            }
        }) 
    });
});

routerVacunator.get('/listtodayturns', async (req, res)=> {
    let vacunador = req.session.name;
    DB.query('SELECT * FROM vacunator WHERE email = ?', vacunador, async (error, results)=> {
        let zonevac= results[0].zonaVacunatorio;
        let date = new Date(Date.now());
        let fecha = date.toISOString().split('T')[0];
        DB.query('SELECT name, lastname, zone, vaccinename, dose FROM turn JOIN personuser WHERE (turn.date = ?) AND (personuser.zone = ?) AND (turn.idpersonuser = personuser.id)', [fecha, zonevac], async (req, results)=> {
            res.render('viewlist',{
                turnsinfo:results,
                zonav: zonevac
            });
        });
    });
});

routerVacunator.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/vacunator/login') // siempre se ejecutará después de que se destruya la sesión
	})
});

//función para limpiar la caché luego del logout
routerVacunator.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

routerVacunator.get('/recordVaccination', async(req,res)=>{
    DB.query('SELECT name,lastname FROM personuser',async(error, results)=>{
        let newResults=[];
        for(let i=0; i<results.length; i++){
            newResults.push(results[i].name+" "+results[i].lastname);
        }
        console.log(newResults);
        res.render('recordVaccination',{results:newResults});
    });
});

routerVacunator.post('/recordVaccination', async(req,res)=>{
    let nameAndLastname=req.body.selectNameUser;
    let vaccinename=req.body.vaccineName;
    let separacion=nameAndLastname.split(' '); //posicion 0 = nombre, posicion1 = apellido
    DB.query('SELECT id FROM personuser WHERE (name = ? AND lastname = ?)',[separacion[0],separacion[1]],async(error,results)=>{
        const idpersonuser=results[0].id;
        DB.query('SELECT * FROM turn WHERE idpersonuser = ?',idpersonuser,async(error,results)=>{
            let hoy = new Date(Date.now());
            let hoyformateada = hoy.toISOString().split('T')[0];
            tieneTurno=results.some((turno)=>(turno.vaccinename==vaccinename)&&(turno.state=="Otorgado"));
            if(tieneTurno){
                console.log("tiene turno");
            }else{
                console.log("no tiene turno para hoy");
            }
        })
    });
});


module.exports=routerVacunator;