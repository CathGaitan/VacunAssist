const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');

routerPersonUser.get('/showUsers',(req,res)=>{
    const sql = 'SELECT * FROM personuser'
    DB.query(sql,(error,results)=>{
        if(error) throw error;
        if(results) res.json(results);
    })
});

routerPersonUser.get('/showUser/:id',(req,res)=>{
    const {id} = req.params;
    const sql=`SELECT * FROM personuser WHERE id=${id}`
    DB.query(sql,(error,result)=>{
        if(error) throw error;
        if(result) res.json(result)
    })
});


function isTheEmail(email){
    const sql = `SELECT email FROM personuser WHERE email="${email}"`
    DB.query(sql,(error,results)=>{
        if(error) throw error;
        let resultsString=JSON.stringify(results);
        return resultsString!=="[]"
    });
}

routerPersonUser.post('/addNewUser',(req,res)=>{
    const sql= 'INSERT INTO personuser SET ?';
    const newUser= {
        DNI: req.body.DNI,
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        fechaNacimiento: req.body.fechaNacimiento,
        factorRiesgo: req.body.factorRiesgo,
        email: req.body.email,
        contrasenia: req.body.contrasenia
    }
    console.log('booleano: ',isTheEmail(newUser.email));
    if(isTheEmail(newUser.email)){
        res.send('Ya existe un usuario con ese email');
    }
    if(((newUser.DNI>0)&&(newUser.DNI<9999999999))&&(newUser.DNI!=41777666)){ //Validacion del ""RENAPER""
        DB.query(sql,newUser,error=>{
            if(error) throw error;
            res.send('Se ha aniadido el nuevo usuario');
        })
    }else{
        res.send('El DNI no esta validado por el RENAPER');
    }
});

module.exports=routerPersonUser;
