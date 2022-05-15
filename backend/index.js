const express = require('express');
const morgan = require('morgan');
const routerUserPerson = require('./modules/userPerson/routerUserPerson');
const connection = require('./dataBase/dataBase');

//Inicialization
const app=express();

//Settigs
app.set('port',5000); //definir puertos

//Middlewares (funciones que se ejecutan que se envia una peticion al servidor)
app.use(morgan('dev')); //muestra por consola las peticiones que van llegando

//Routes
app.get('/',(req,res)=>{ //puedo tenerlo en otro archivo e importarlo
    res.send('esto anda, creo');
})

app.get('/showUsers',(req,res)=>{
    const sql = 'SELECT * FROM personuser'
    connection.query(sql,(error,results)=>{
        if(error) throw error;
        if(results) res.json(results);
    })
})


//Start the server
app.listen(app.get('port'),()=>{ //se ejecuta al iniciar el server
    console.log('Server on port: ',app.get('port')); 
}); 






