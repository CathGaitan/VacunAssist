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


//--------------------------------------------------------------------
