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
    res.render('loginVacunator',{
        name:"Vacunador"
    });
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
routerVacunator.get('/changeRisk', (req, res)=> {
    res.render('changeRiskStatus');
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
                    name: "Vacunador",
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
                    name:"Vacunador",
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
        if (user.DNI>0 && user.DNI<9999999999999 && user.DNI != 41777666){ //verificacion RENAPER (?)
            DB.query('INSERT INTO personuser SET ?', user, async (error, results)=> {
                if (error){
                    if (error.code == 'ER_DUP_ENTRY'){
                        res.render('registerVacunator', { //animacion de dni no validado
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
                    res.render('registerVacunator', { //animacion de registro exitoso
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
            res.render('registerVacunator', { //animacion de dni no validado
                alert: true,
                alertTitle: "Error en el registro",
                alertMessage: "El DNI no esta validado por RENAPER",
                alertIcon:'error',
                showConfirmButton: false,
                timer: false,
                ruta: 'vacunator/registerVacunator' 
            });
        }
    });
});

let newResults=[];
routerVacunator.get('/registrarausente', async(req,res)=>{
    let vacunador= req.session.name;
    DB.query('SELECT * FROM vacunator WHERE email = ?', vacunador, async (error, results)=> {
        let zonevac = results[0].zonaVacunatorio;
        let date = new Date(Date.now());
        let fecha = date.toISOString().split('T')[0];
        DB.query('SELECT name, lastname, email, vaccinename FROM turn JOIN personuser WHERE (turn.date = ?) AND (personuser.zone = ?) AND (turn.idpersonuser = personuser.id) AND (turn.state = ?)', [fecha, zonevac,"Otorgado"], async(error, results)=>{
            newResults.splice(0,newResults.length);
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
    DB.query('SELECT * FROM personuser WHERE email = ?', usuarioausente, async (error, results)=> {
        let id = results[0].id;
        DB.query('UPDATE turn SET state = ?  WHERE (idpersonuser = ?) AND (vaccinename = ?) AND (date = ?)', ['Ausente', id, vacuna, fecha], async (error, results)=> {
            res.render('marcarausente', { 
                alert: true,
                alertTitle: "Turno registrado como ausente",
                alertMessage: "El turno se ha registrado como ausente",
                alertIcon:'success',
                showConfirmButton: false,
                timer: false,
                results:newResults,
                ruta: 'vacunator/registrarausente' 
            });
            newResults.splice(0,newResults.length);
        });
    })
});

routerVacunator.post('/infovaccines', async(req,res)=>{
    const email= userActive;
    let vacturn= req.body.menuvacunas;
    let dosis;
    let date = new Date(Date.now());
    let fecha = date.toISOString().split('T')[0];
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
        console.log(esmayor18)
        let esmayor60;
        if (edad > 59){
            esmayor60= true;
        }else{
            esmayor60= false;
        }
        console.log(esmayor60)
        let turn={
            idpersonuser: results[0].id,
            vaccinename: vacturn,
            dose: dosis,
            state: "Otorgado",
            date: fecha
        }
        //genero el turno
        if ((esmayor18 && vacturn == 'Covid-19') || (!esmayor60 && vacturn == 'Fiebre Amarilla') || (vacturn == 'Gripe')){
            DB.query('INSERT INTO turn SET ?', turn);
        }
        //si seleccione turno para covid updateo la info de esta manera
        if (vacturn == 'Covid-19'){//updateo todos los campos
            //info covid
            let dos= req.body.nrodosisc;
            let vacfiebre= req.body.fevervaccine;
            let vacfiebredate= req.body.datefevervaccine;
            let vacgripe= req.body.fluevaccine;
            let vacgripedate= req.body.datefluevaccine;
            DB.query('UPDATE  personuser SET coviddoses = ?, fluevaccine = ?, datefluevaccine = ?, fevervaccine = ?, datefevervaccine = ? WHERE email = ?', [dos, vacgripe, vacgripedate, vacfiebre, vacfiebredate, email], async (error, results)=>{
                if (esmayor18){
                    res.render('infovaccines', {
                        alert: true,
                        alertTitle: "Tu informacion se guardo exitosamente y se le ha asignado un turno para hoy",
                        alertMessage: "¡INFORMACION GUARDADA!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'vacunator/dashboard'
                    });
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
                })
        }
        //si seleccione turno para la fiebre, updateo de esta manera
        if (vacturn == 'Fiebre Amarilla') {
            let dos= req.body.menuCovid;
            let vacgripe= req.body.fluevaccine;
            let vacgripedate= req.body.datefluevaccine;
            let date = new Date(Date.now());
            let fecha = date.toISOString().split('T')[0];
            DB.query('UPDATE personuser SET coviddoses = ?, fluevaccine = ?, datefluevaccine = ?, fevervaccine = ?, datefevervaccine = ? WHERE email = ?', [dos, vacgripe, vacgripedate, 1, fecha, email], async (error, results)=>{
                if (!esmayor60){
                    res.render('infovaccines', {
                        alert: true,
                        alertTitle: "Tu informacion se guardo exitosamente y se le ha asignado un turno para hoy",
                        alertMessage: "¡INFORMACION GUARDADA!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'vacunator/dashboard'
                    }); 
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
            });
        }
        //si seleccione turno para gripe, updateo de esta manera
        if (vacturn == 'Gripe') {
            let dosiscovid= req.body.menuCovid;
            let vacfiebre= req.body.fevervaccine;
            let vacfiebredate= req.body.datefevervaccine;
            let date = new Date(Date.now());
            let fecha = date.toISOString().split('T')[0];
            DB.query('UPDATE personuser SET coviddoses = ?, fluevaccine = ?, datefluevaccine = ?, fevervaccine = ?, datefevervaccine = ? WHERE email = ?', [dosiscovid, 1, fecha, vacfiebre, vacfiebredate, email], async (error, results)=>{
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

routerVacunator.get('/listtodayturns', async (req, res)=> {
    let vacunador = req.session.name;
    DB.query('SELECT * FROM vacunator WHERE email = ?', vacunador, async (error, results)=> {
        let zonevac= results[0].zonaVacunatorio;
        let date = new Date(Date.now());
        let fecha = date.toISOString().split('T')[0];
        DB.query('SELECT name, lastname, zone, vaccinename, dose, turn.state,turn.observation FROM turn JOIN personuser WHERE (turn.date = ?) AND (personuser.zone = ?) AND (turn.idpersonuser = personuser.id)', [fecha, zonevac], async (req, results)=> {
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


let newResults2=[];
routerVacunator.get('/recordVaccination', async(req,res)=>{
    let vacunador= req.session.name;
    DB.query('SELECT * FROM vacunator WHERE email = ?', vacunador, async (error, results)=> {
        let zonevac = results[0].zonaVacunatorio;
        let date = new Date(Date.now());
        let fecha = date.toISOString().split('T')[0];
        DB.query('SELECT name, lastname, email, vaccinename FROM turn JOIN personuser WHERE (turn.date = ?) AND (personuser.zone = ?) AND (turn.idpersonuser = personuser.id) AND (turn.state= ?)', [fecha, zonevac,"Otorgado"], async(error, results)=>{
            newResults2.splice(0,newResults2.length);
            for(let i=0; i<results.length; i++){
                newResults2.push(results[i].name+" "+results[i].lastname+" ( "+results[i].email+" ) Vacuna: "+results[i].vaccinename);
            }
            res.render('recordVaccination',{results:newResults2});
        });
    });
});

routerVacunator.post('/recordVaccination', async(req,res)=>{
    let nameAndLastname=req.body.selectNameUser;
    let observacion=req.body.observacion;
    let separacion=nameAndLastname.split(' '); //posicion 0 = nombre, posicion1 = apellido
    let vaccinename = separacion[6];
    let emailUsuario= separacion[3];
    if (vaccinename == 'Fiebre') vaccinename='Fiebre Amarilla'
    DB.query('SELECT id FROM personuser WHERE email = ?',emailUsuario,async(error,results)=>{
        const idpersonuser=results[0].id;
        let date = new Date(Date.now());
        let fecha = date.toISOString().split('T')[0];
        DB.query('SELECT * FROM turn WHERE (idpersonuser = ? AND date = ? AND state = ?)',[idpersonuser,fecha,"Otorgado"],async(error,results)=>{
            if(results.length!=0){
                DB.query('UPDATE turn SET state = ?, observation = ? WHERE (idpersonuser = ? AND date = ? AND vaccinename = ? AND state = ?)' ,["Aplicada",observacion,idpersonuser,fecha,vaccinename,"Otorgado"]);
                res.render('recordVaccination', {
                    alert: true,
                    alertTitle: "Actualizacion exitosa",
                    alertMessage: "Se ha registrado la vacunacion",
                    alertIcon:'success',
                    showConfirmButton: false,
                    timer: false,
                    results:newResults2,
                    ruta: 'vacunator/recordVaccination'
                });
                newResults2.splice(0,newResults2.length);
            }else{
                res.render('recordVaccination', {
                    alert: true,
                    alertTitle: "Actualizacion fallida",
                    alertMessage: "No se ha podido marcar la vacuna como Aplicada, debido a que el usuario no tiene turno",
                    alertIcon:'error',
                    showConfirmButton: false,
                    timer: false,
                    results:newResults2,
                    ruta: 'vacunator/recordVaccination'
                });
                newResults2.splice(0,newResults2.length);
            }
        })
    });
});


routerVacunator.post('/changeRisk',async(req,res)=>{
    let usermail=req.body.usermail;
    let newRisk=req.body.risk;
    DB.query('SELECT * FROM personuser WHERE email = ?',usermail,async (error,user)=>{
        console.log(newRisk);
        console.log(usermail);
        if(user.length==1){
            DB.query('UPDATE personuser SET risk = ? WHERE email = ?',[newRisk,usermail],async (error, results)=>{
                res.render('changeRiskStatus', {
                    alert: true,
                    alertTitle: "Estado cambiado",
                    alertMessage: `Se ha cambiado el estado de riesgo del usuario ${usermail}`,
                    alertIcon:'success',
                    showConfirmButton: false,
                    timer: false,
                    ruta: 'vacunator/changeRisk'
                });
            });
        }else{
            res.render('changeRiskStatus', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Ese usuario no existe en el sistema",
                alertIcon:'error',
                showConfirmButton: false,
                timer: false,
                ruta: 'vacunator/changeRisk'
            });
        }
    });
});

module.exports=routerVacunator;