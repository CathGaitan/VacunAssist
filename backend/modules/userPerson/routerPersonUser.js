const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');
const bcryptjs = require('bcryptjs');
const bp = require('body-parser')
routerPersonUser.use(bp.json())
routerPersonUser.use(bp.urlencoded({ extended: true }));
const transporter=require('../mailConfig/mailer');

var userActive;

//7- variables de session
const session = require('express-session');
const e = require('express');
routerPersonUser.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

const pastAYear=(dateflueString)=>{
    if(dateflueString != undefined){
        let today=Date.now();
        const datefluevaccine=Date.parse(dateflueString);
        let dif=today-datefluevaccine;
        return dif > 31609046081;
    }else{
        return true;
    }

}

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
routerPersonUser.get('/requestturn', (req, res)=>{
    res.render('requestturn')
})
routerPersonUser.get('/requestcovidturn', (req, res)=>{
    res.render('requestcovidturn')
})
routerPersonUser.get('/requestflueturn', (req, res)=>{
    res.render('requestflueturn')
})
routerPersonUser.get('/cancelturn', (req, res)=>{
    res.render('cancelturn')
})
routerPersonUser.get('/viewMap',async(req,res)=>{
    res.render('viewMap');
})
routerPersonUser.get('/solicitarbaja',async(req,res)=>{
    res.render('solicitarbaja');
})
routerPersonUser.get('/FAQ',async(req,res)=>{
    res.render('FAQ');
})
routerPersonUser.get('/sobreNosotros',async(req,res)=>{
    res.render('SobreNosotros');
})
routerPersonUser.get('/forgotpassword',async(req,res)=>{
    res.render('forgotpassword');
})



// registracion
routerPersonUser.post('/register', async (req, res)=>{
    let pass= req.body.password;
    let passwordHash = await bcryptjs.hash(req.body.password, 8);
    let randomCode=Math.floor((Math.random() * (9999 - 1000 + 1)) + 1000);
    let user = {
        email:req.body.email, 
        name:req.body.name, 
        lastname: req.body.lastname,
        password: passwordHash,
        DNI: req.body.DNI,
        dateofbirth: req.body.dateofbirth,
        risk: req.body.risk,
        zone: req.body.zone,
        securecode: randomCode
    }
    console.log(user.securecode);
    userActive= user.email;
    if (pass.length < 6){ //si la contrasenia tiene menos de 6 dig
        res.render('register', { //animacion de registro exitoso
            alert: true,
            alertTitle: "Error",
            alertMessage: "La contraseña debe ser de como minimo 6 caracteres",
            alertIcon:'error',
            showConfirmButton: false,
            timer: false,
            ruta: 'personUser/register' 
        });
    }else{ //si la contrasenia es valida
        let route;
        if (getEdad(user.dateofbirth)>=18){ //si es mayor carga info
            route= 'personUser/infoCovid'
        }else{ //si es menor va a dashboard
            route= 'personUser/infoGripe'
        }
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
                            ruta: 'personUser/register' 
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
                        ruta: route 
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
                ruta: 'personUser/register' 
            });
        }
    }
});
routerPersonUser.post('/forgotpassword', async (req, res)=>{
    let randomCode=Math.floor((Math.random() * (999999 - 100000 + 1)) + 100000);
    await transporter.sendMail({
        from: '"Vacunassist" <code.guess2022@gmail.com>', // sender address
        to: req.body.emailpsswd, // list of receivers
        subject: "Olvidaste tu contraseña", // Subject line
        text: `Aqui tienes una contraseña provisoria, una vez que inicies sesion podras cambiarla: ${randomCode}`
    });
    res.render('forgotpassword', { //animacion de registro exitoso
        alert: true,
        alertTitle: "Nueva contraseña",
        alertMessage: "Hemos enviado un email a tu casilla para que puedas inicar sesion!",
        alertIcon:'success',
        showConfirmButton: false,
        timer: false,
        ruta: '/' 
    });
});
//autenticacion
routerPersonUser.post('/auth', async (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const secureCode = req.body.secureCode;
    let passwordHash = await bcryptjs.hash(password, 8);
    if (email && password){
        DB.query('SELECT * FROM personuser WHERE email = ?', email, async (error, results)=>{
            console.log(secureCode,'-',results[0].securecode);
            if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password)) || (secureCode!=results[0].securecode)){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Email, contraseña y/o codigo incorrecto",
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
    let datoACambiar="";
    const oldpassword=req.body.oldpassword;
    const email= req.session.name;
    DB.query('SELECT * FROM personuser WHERE email = ?', email, async (error, results)=>{
        if (await bcryptjs.compare(oldpassword, results[0].password)){
            if (req.body.name){ 
                newname= req.body.name;
                datoACambiar+="nombre";
                DB.query('UPDATE personuser SET name = ? WHERE email = ?', [newname, email])
            }
            if (req.body.lastname){
                newlastname= req.body.lastname;
                datoACambiar+=" apellido";
                DB.query('UPDATE personuser SET lastname = ? WHERE email = ?', [newlastname, email])
            }
            if (req.body.mayor18){
                f= new Date();
                f.setMonth(11);
                f.setDate(12)
                f.setFullYear(2000)
                let fecha = f.toISOString().split('T')[0];
                console.log(fecha)
                DB.query('UPDATE personuser SET dateofbirth = ? WHERE email = ?', [fecha, email])
            }
            if (req.body.mayor60){
                f= new Date();
                f.setMonth(11);
                f.setDate(12)
                f.setFullYear(1952)
                let fecha = f.toISOString().split('T')[0];
                console.log(fecha)
                DB.query('UPDATE personuser SET dateofbirth = ? WHERE email = ?', [fecha, email])
            }
            if (req.body.password){
                if(req.body.password.length >= 6){
                    datoACambiar+=" contraseña";
                    newHasshedPassword=await bcryptjs.hash(req.body.password, 8);
                    DB.query('UPDATE personuser SET password = ? WHERE email = ?', [newHasshedPassword, email])
                }else{
                    return res.render('updatedata', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "La contraseña debe tener tener 6 o mas caracteres",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'personUser/updatedata'    
                    }); 
                }
            }
            if (req.body.zone != null){
                newzone= req.body.zone;
                datoACambiar+=" zona"
                DB.query('UPDATE personuser SET zone = ? WHERE email = ?', [newzone, email])
            }
            await transporter.sendMail({
                from: '"Vacunassist" <code.guess2022@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Se han cambiado tus datos!", // Subject line
                text: `Se han cambiado exitosamente los siguientes datos de tu cuenta de vacunassist: ${datoACambiar}`
            });
            return res.render('updatedata', {
                alert: true,
                alertTitle: "Actualizacion de datos exitosa",
                alertMessage: "¡ACTUALIZACION CORRECTA!",
                alertIcon:'success',
                showConfirmButton: false,
                timer: false,
                ruta: 'personUser/updatedata'
            });
        }else{
            res.render('updatedata', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Contraseña incorrecta",
                alertIcon:'error',
                showConfirmButton: true,
                timer: false,
                ruta: 'personUser/updatedata'    
            }); 
        }
    })
});


//ver datos personales
routerPersonUser.get('/listData',async(req, res)=>{
    const email= req.session.name;
    DB.query('SELECT * FROM personuser WHERE email = ?',email,async (error, results)=>{
        if (results[0].risk==0) 
            results[0].risk="No"
        else 
            results[0].risk="Si";
        birthdate= new Date();
        birthdate= results[0].dateofbirth;
        results[0].dateofbirth= birthdate.toLocaleDateString();
        res.render('viewdata',{
            personuserdata:results
        });
    });
});

//metodo todo para controlar que esta auth en todas las páginas ACA HAY QUE ACOMODAR PARA QUE ANDE, SOLO ANDA EN EL DASHBOARD
routerPersonUser.get('/dashboard', (req, res)=> { //controla el dashboard
	if (req.session.loggedin) {
        const email= req.session.name;
        DB.query('SELECT id FROM personuser WHERE email = ?',email,async(error, results)=>{
            idpersonuser=results[0].id;
            DB.query('SELECT * FROM turn WHERE (idpersonuser = ?) and (state = ?) ',[idpersonuser,"Otorgado"],async(error,results)=>{
                res.render('dashboard',{
                    login: true,
                    name: req.session.name,
                    notif: results.length		
                });	
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
                let fechanac= results[0].dateofbirth;
                let edad= getEdad(fechanac); 
                if (results[0].risk || edad>=60){ //si es de riesgo o si tiene 60 o mas anios
                    const tiempoTranscurrido = Date.now();
                    const fecha = new Date(tiempoTranscurrido);
                    let dia= fecha.getDate()+7 //asigno turno a una semana
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
        if (fluevaccine == 0 || pastAYear(datefluevaccine)){ //si no tiene la vacuna de la gripe
            const hoy = Date.now();
            const fecha = new Date(hoy);
            fechanac= results[0].dateofbirth;
            let edad= getEdad(fechanac);
            let turn={
                idpersonuser: results[0].id,
                vaccinename: "Gripe",
                dose: "Unica por año",
                state: "Otorgado",
                date: undefined
            }
            if (edad>=60){ // si es mayor de 60 ---> es de riesgo
                let mes= fecha.getMonth()+2
                fecha.setMonth(mes);
                turn.date= fecha;
            }
            else{ //si no es de riesgo
                let mes= fecha.getMonth()+4
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

routerPersonUser.post('/requestturn', async (req, res)=>{
    const email= req.session.name;
    DB.query('SELECT * FROM personuser WHERE email = ?', email, async (error, results)=>{
        if (results[0].fevervaccine == "0"){ //si no tiene la vacuna
            let fechanac= results[0].dateofbirth;
            let edad= getEdad(fechanac);
            if (edad < 60){ //si es menor de 60 
                let turn={
                    idpersonuser: results[0].id,
                    vaccinename: "Fiebre Amarilla",
                    dose: "Unica en la vida",
                    state: "Pendiente",
                    date: undefined}
                DB.query('INSERT INTO turn SET ?', turn)
                res.render('requestturn', {
                    alert: true,
                    alertTitle: "Turno solicitado exitosamente",
                    alertMessage: "Se ha registrado la solicitud de su turno!",
                    alertIcon:'success',
                    showConfirmButton: false,
                    timer: 4000,
                    ruta: 'personUser/dashboard'
                });   
            }else{ //si es mayor de 60
                res.render('requestturn', {
                    alert: true,
                    alertTitle: "Turno no solicitado",
                    alertMessage: "Usted no puede aplicarse esta vacuna ya que es mayor de 60 años.",
                    alertIcon:'error',
                    showConfirmButton: false,
                    timer: 4000,
                    ruta: 'personUser/dashboard'
                });   
            }
        }else{ //si tiene la vacuna
            res.render('requestturn', {
                alert: true,
                alertTitle: "Turno no solicitado",
                alertMessage: "Usted ya posee esta vacuna",
                alertIcon:'error',
                showConfirmButton: false,
                timer: 4000,
                ruta: 'personUser/dashboard'
            });   
        }
    });
});

routerPersonUser.post('/requestcovidturn', async (req, res)=>{
    const email= req.session.name;
    DB.query('SELECT * FROM personuser WHERE email = ?', email, async (error, results)=>{
        if (results[0].coviddoses < "2"){ //si tiene menos de 2 dosis
            let id= results[0].id;
            let fechanac= results[0].dateofbirth;
            let edad= getEdad(fechanac);
            if (edad > 18){ //si es mayor de 18
                let turn={
                    idpersonuser: results[0].id,
                    vaccinename: "Covid-19",
                    dose: results[0].coviddoses+1,
                    state: " ",
                    date: undefined
                }
                let fechanac= results[0].dateofbirth;
                let edad= getEdad(fechanac); 
                if (results[0].risk || edad>=60){ //si es de riesgo o si tiene 60 o mas anios
                    const tiempoTranscurrido = Date.now();
                    const fecha = new Date(tiempoTranscurrido);
                    let dia= fecha.getDate()+7 //asigno turno a una semana
                    fecha.setDate(dia);
                    turn.state= "Otorgado";
                    turn.date= fecha
                }
                else{ //si no es de riesgo
                    turn.state= "Pendiente";
                }
                DB.query ('SELECT * FROM turn WHERE idpersonuser = ? AND vaccinename=?', [id, 'Covid-19'], async (error, results)=>{
                    darTurno=results.some((turno)=>(turno.state=="Pendiente")||(turno.state=="Otorgado"));
                    console.log(darTurno); 
                    if (darTurno){
                        res.render('requestcovidturn', {
                            alert: true,
                            alertTitle: "Turno no solicitado",
                            alertMessage: "Usted no puede solicitar este turno debido a que ya ha solicitado uno",
                            alertIcon:'error',
                            showConfirmButton: false,
                            timer: 5000,
                            ruta: 'personUser/dashboard'
                        }); 
                    } else {
                        DB.query('INSERT INTO turn SET ?', turn)
                        res.render('requestcovidturn', {
                            alert: true,
                            alertTitle: "Turno solicitado exitosamente",
                            alertMessage: "Se ha registrado la solicitud de su turno!",
                            alertIcon:'success',
                            showConfirmButton: false,
                            timer: 5000,
                            ruta: 'personUser/dashboard'
                        }); 
                    }
                });
            } else {
                res.render('requestcovidturn', {
                    alert: true,
                    alertTitle: "Turno no solicitado",
                    alertMessage: "Usted no puede aplicarse esta vacuna ya que es menor de 18 años.",
                    alertIcon:'error',
                    showConfirmButton: false,
                    timer: 5000,
                    ruta: 'personUser/dashboard'
                });
            }
        } else {
            res.render('requestcovidturn', {
                alert: true,
                alertTitle: "Turno no solicitado",
                alertMessage: "Usted no puede aplicarse esta vacuna ya que cuenta con 2 dosis aplicadas o con un turno para su 2da dosis",
                alertIcon:'error',
                showConfirmButton: false,
                timer: 5000,
                ruta: 'personUser/dashboard'
            });
        }
    });
});

routerPersonUser.post('/requestflueturn', async (req, res)=>{
    const email= req.session.name;
    DB.query('SELECT * FROM personuser WHERE email = ?', [email], async (error, results)=>{
        let date = new Date(Date.now());
        if (results[0].fluevaccine == 0 || pastAYear(results[0].datefluevaccine)){ //si no tiene la vacuna de la gripe
            const hoy = Date.now();
            const fecha = new Date(hoy);
            fechanac= results[0].dateofbirth;
            let edad= getEdad(fechanac);
            let id=results[0].id;
            let turn={
                idpersonuser: results[0].id,
                vaccinename: "Gripe",
                dose: "Unica por año",
                state: "Otorgado",
                date: undefined
            }
            if (edad>=60){ // si es mayor de 60 ---> es de riesgo
                let mes= fecha.getMonth()+2
                fecha.setMonth(mes);
                turn.date= fecha;
            }
            else{ //si no es de riesgo
                let mes= fecha.getMonth()+4
                fecha.setMonth(mes);
                turn.date= fecha
            }
            DB.query ('SELECT * FROM turn WHERE idpersonuser = ? AND vaccinename=?', [id, 'Gripe'], async (error, results)=>{
                darTurno=results.some((turno)=>(turno.state=="Pendiente")||(turno.state=="Otorgado"));
                if (darTurno){
                    res.render('requestflueturn', {
                        alert: true,
                        alertTitle: "Turno no solicitado",
                        alertMessage: "Usted no puede solicitar este turno debido a que ya ha solicitado uno",
                        alertIcon:'error',
                        showConfirmButton: false,
                        timer: 5000,
                        ruta: 'personUser/dashboard'
                    }); 
                } else {
                    DB.query('INSERT INTO turn SET ?', turn)
                    res.render('requestflueturn', {
                        alert: true,
                        alertTitle: "Turno solicitado exitosamente",
                        alertMessage: "Se ha registrado la solicitud de su turno!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: 5000,
                        ruta: 'personUser/dashboard'
                    }); 
                }
            })
        }else{ 
            res.render('requestflueturn', {
                alert: true,
                alertTitle: "Turno no solicitado",
                alertMessage: "Usted no puede aplicarse esta vacuna ya que se la aplico hace menos de un año.",
                alertIcon:'error',
                showConfirmButton: false,
                timer: 5000,
                ruta: 'personUser/dashboard'
            }); 
        }
    });      
});


//solicitud de baja
routerPersonUser.post('/solicitarbaja', async (req, res)=>{
    const email=req.session.name;
    const motivo=req.body.motivoBaja;
    DB.query('UPDATE personuser SET state = ? WHERE email = ?', ["accountcancelationreq", email], async (error, results)=>{
        DB.query('UPDATE  personUser SET unsubscribemotive = ? WHERE email = ?',[motivo,email], async (error, results)=>{
            res.render('solicitarbaja', {
                alert: true,
                alertTitle: "Enviado",
                alertMessage: "Solicitud de peticion de baja exitosa",
                alertIcon:'success',
                showConfirmButton: false,
                timer: 5000,
                ruta: 'personUser/dashboard'
            });
        });
    });
});

let turns;

routerPersonUser.post('/cancelturn', async (req, res)=>{
    const email= req.session.name;
    let nameturn=req.body.selectTurns;
    DB.query('SELECT * FROM personuser WHERE email = ?',email,async(error,result)=>{
        idpersonuser=result[0].id;
        DB.query('SELECT * FROM turn WHERE idpersonuser = ?',idpersonuser,async(error,results)=>{
            let turn=results.find(r => r.vaccinename === nameturn)
            if(turn == null){
                res.render('cancelturn',{
                    alert: true,
                    alertTitle: "No tiene turno para esa vacuna",
                    alertMessage: "No puede cancelar el turno ya que no tiene un turno para esa vacuna",
                    alertIcon:'error',
                    showConfirmButton: false,
                    timer: false,
                    ruta: 'personUser/cancelturn'
                })
            }else{
                DB.query('UPDATE turn SET state = ? WHERE id= ?',["Cancelado",turn.id],async(error,result)=>{
                    res.render('cancelturn', {
                        alert: true,
                        alertTitle: "Se ha cancelado tu turno",
                        alertMessage: "Turno cancelado",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: false,
                        ruta: 'personUser/cancelTurn'
                    });  
                });
            }
        })
    })
})

routerPersonUser.get('/listvaccines', async (req, res)=>{
    const email= req.session.name;
    let flueVaccineString="";
    let feverVaccineString="";
    DB.query('SELECT * FROM personuser WHERE email = ?',email,async(error, results)=>{
        let fechaFlueVaccine=results[0].datefluevaccine;
        let fechaFeverVaccine=results[0].datefevervaccine;
        let idpersonuser=results[0].id;
        if(results[0].fluevaccine==0){
            flueVaccineString="Usted no tiene aplicada la vacuna de la gripe"
            fechaFlueVaccine="---"
        }else{
            flueVaccineString="Ya se aplico la vacuna"
            fechaFlueVaccine=fechaFlueVaccine.toLocaleDateString()
        }
        if(results[0].fevervaccine==0){
            feverVaccineString="Usted no tiene aplicada la vacuna de la fiebre amarilla"
            fechaFeverVaccine="---"
        }else{
            feverVaccineString="Ya se aplico la vacuna"
            fechaFeverVaccine=fechaFeverVaccine.toLocaleDateString()
        }
        DB.query('SELECT * FROM turn WHERE (idpersonuser = ? AND state = ?)',[idpersonuser,"Aplicada"],async(error,result)=>{
            newResult=result.slice();
            for(let i=0;i<result.length;i++){
                newResult[i].date=result[i].date.toLocaleDateString();
            }
            res.render('viewvaccines',{
                coviddoses:results[0].coviddoses,
                fluevaccine: flueVaccineString,
                datefluevaccine: fechaFlueVaccine,
                fevervaccine: feverVaccineString,
                datefevervaccine: fechaFeverVaccine,
                result:newResult
            });
        });
    });
});

routerPersonUser.get('/listTurns', async (req, res)=>{
    const email= req.session.name;
    DB.query('SELECT id FROM personuser WHERE email = ?',email,async(error, results)=>{
        idpersonuser=results[0].id;
        DB.query('SELECT * FROM turn WHERE idpersonuser = ?',idpersonuser,async(error,results)=>{
            turns=results;
            for(let i=0; i<results.length; i++){
                if(results[i].date!=null){
                    fecha = new Date();
                    fecha= results[i].date;
                    results[i].date= fecha.toLocaleDateString();
                }else{
                    results[i].date="---";
                }
            }
            res.render('viewturns',{
                turnsinfo:results
            });
        });
    });
});

routerPersonUser.get('/notifications',async(req,res)=>{
    const email= req.session.name;
    DB.query('SELECT id FROM personuser WHERE email = ?',email,async(error, results)=>{
        idpersonuser=results[0].id;
        DB.query('SELECT * FROM turn WHERE (idpersonuser = ?) and (state = ?) ',[idpersonuser,"Otorgado"],async(error,results)=>{
            console.log(results.length);
            res.send(results.length)
        });
    });
});

module.exports=routerPersonUser;
