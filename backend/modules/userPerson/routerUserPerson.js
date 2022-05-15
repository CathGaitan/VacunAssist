const express = require('express');
const routerUserPerson = express.Router();
const DB = require('../../dataBase/dataBase');

routerUserPerson.get('/probandoDB',(req,res)=>{
    console.log(DB);
});

module.exports=routerUserPerson;
