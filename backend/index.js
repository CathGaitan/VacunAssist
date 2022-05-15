const express = require('express');
const morgan = require('morgan');

//Inicialization
const app=express();
const routerPersonUser = require('./modules/userPerson/routerPersonUser');


//Settigs
app.set('port',5000); //definir puertos

//Middlewares (funciones que se ejecutan que se envia una peticion al servidor)
app.use(morgan('dev')); //muestra por consola las peticiones que van llegando
app.use(express.json());
app.use('/personUser',routerPersonUser);

//Routes
app.get('/',(req,res)=>{ //puedo tenerlo en otro archivo e importarlo
    res.send('esto anda, creo');
});

//Start the server
app.listen(app.get('port'),()=>{ //se ejecuta al iniciar el server
    console.log('Server on port: ',app.get('port')); 
}); 






