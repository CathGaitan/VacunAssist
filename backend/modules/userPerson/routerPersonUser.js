const express = require('express');
const routerPersonUser = express.Router();
const DB = require('../../dataBase/dataBase');

routerPersonUser.get('/probandoDB',(req,res)=>{
    console.log(DB);
});

routerPersonUser.get('/showUsers',(req,res)=>{
    const sql = 'SELECT * FROM personuser'
    DB.query(sql,(error,results)=>{
        if(error) throw error;
        if(results) res.json(results);
    })
})

module.exports=routerPersonUser;
