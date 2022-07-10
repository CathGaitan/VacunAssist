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

routerAdministrator.get('/viewMap',async(req,res)=>{
    res.render('viewMap',{
        name:""
    });
})

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

routerAdministrator.get('/usersList', async (req, res)=> {
    DB.query('SELECT * FROM personuser', async (req, results)=> {
        for(let i=0; i<results.length; i++){
            results[i].dateofbirth= (results[i].dateofbirth).toLocaleDateString();
            if (results[i].risk == 1){
                results[i].risk= "Si";
            }else{
                results[i].risk= "No";
            }
    }
        res.render('veruserlist',{
            accounts:results,
        });
    });
})

routerAdministrator.get('/vaccinesList', async (req, res)=> {
    DB.query('SELECT turn.vaccinename, turn.dose,turn.observation, personuser.name, personuser.lastname, personuser.zone, personuser.email, personuser.DNI, turn.date FROM turn JOIN personuser WHERE turn.state = ? AND turn.idpersonuser = personuser.id', "Aplicada", async (req, results)=> {
        for(let i=0; i<results.length; i++){
            results[i].date= (results[i].date).toLocaleDateString();
    }
        res.render('vervaccinelist',{
            accounts:results,
        });
    });
})

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
    DB.query('SELECT * FROM personuser WHERE state = ?', cancel, async (requ, results)=> {
        for (let i=0; i<results.length; i++){
            if (req.body[results[i].id]){
                DB.query ('DELETE FROM personuser WHERE id = ?', req.body[results[i].id], async (req, results)=>{});
                DB.query ('DELETE FROM turn WHERE idpersonuser = ?', req.body[results[i].id], async (req, results)=>{});
            }
        };
        res.render('verbajas', {
            alert: true,
            alertTitle: "Usuarios eliminados",
            alertMessage: "La baja de los usuarios seleccionados fue exitosa",
            alertIcon:'success',
            showConfirmButton: false,
            timer: 5000,
            accounts:results,
            ruta: 'administrator/verBajasAdministrator'
        });
    });
});

routerAdministrator.get('/elegirVacuna',async(req, res)=>{
    res.render('elegirVacuna',{
        turnosvacuna:[],
        activate:false

    });
});

routerAdministrator.post('/elegirvacuna',async(req, res)=>{
    let vaccinename=req.body.elegirnombrevacuna;
    let activar;
    DB.query('SELECT turn.id,name,lastname,vaccinename,dose FROM turn JOIN personuser WHERE turn.vaccinename = ? AND turn.state = ? AND turn.idpersonuser = personuser.id',[vaccinename,"Pendiente"], async(error, results)=>{
        if(results.length==0) activar=true;
        res.render('elegirVacuna',{
            turnosvacuna:results,
            activate:activar
        })
    });
});

routerAdministrator.get('/elegirTurno',async(req, res)=>{
    res.render('darTurno');
});

let idturno;
routerAdministrator.post('/elegirTurno',async(req, res)=>{
    res.render('darTurno');
    idturno=req.body.eleccionTurno;
});

routerAdministrator.post('/darTurno',async(req, res)=>{
    let fechaTurno=req.body.fechaturno;
    console.log(fechaTurno);
    console.log(idturno);
    DB.query('UPDATE turn SET state = ?, date = ? WHERE id = ?',["Otorgado",fechaTurno,idturno], async(error, results)=>{
        res.render('darTurno', {
            alert: true,
            alertTitle: "Turno asignado",
            alertMessage: `Se ha asignado el turno exitosamente para el dia: ${fechaTurno}`,
            alertIcon:'success',
            showConfirmButton: false,
            timer: 5000,
            accounts:results,
            ruta: 'administrator/elegirVacuna'
        });
    });
});

module.exports=routerAdministrator;