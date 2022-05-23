// invocamos a dotenv
require('dotenv').config();
const exp = require('constants');
const express = require('express');
const app = express();
const routerPersonUser = require('./modules/userPerson/routerPersonUser');
//const nodemailer=require('nodemailer');
app.use('/personUser',routerPersonUser);

// seteamos url encoded para caputar los datos del formulario
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// el directorio public
var path = require ('path');
app.use('/resources', express.static(path.join(__dirname+'/views')));

// establecemos el motor de plantillas ejs
app.set('view engine', 'ejs');


// variables de session
const session = require ('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.get('/', (req, res)=> {
    res.render('index', {msg: 'esto es un mensaje desde node'});    
});

app.listen(5000, (req, res) => {
    console.log('SERVER RUNNING IN PORT 5000');
});






