const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');

//estableciendo rutas
routerPersonUser.get('/login', (req, res)=> {
    res.render('login');
})
routerPersonUser.get('/register', (req, res)=> {
    res.render('register');
})

// registracion
routerPersonUser.post('/register', async (req, res)=>{
    let passwordHash = await bcryptjs.hash(req.body.password, 8);
    let user = {
        email:req.body.email, 
        name:req.body.name, 
        lastname: req.body.lastname,
        password:passwordHash,
        DNI: req.body.DNI,
        dateofbirth: req.body.dateofbirth,
        risk: req.body.risk
    }
    if (user.DNI>0 && user.DNI<9999999999999 && user.DNI != 41777666){ //verificacion RENAPER (?)
        DB.query('INSERT INTO personuser SET ?', user, async (error, results)=> {
            if (error){
                if (error.code == 'ER_DUP_ENTRY'){
                    res.send('EMAIL EXISTENTE') 
                }
            }else{
                res.send('SE REGISTROOOOO')
            }
        });
    } else {
        res.send('DNI NO VALIDADO POR RENAPER')
    }
});

module.exports=routerPersonUser;
