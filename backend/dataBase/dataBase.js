const mysql=require('mysql');
const {database}= require('./keys');

const connection = mysql.createConnection(database); //conexion con la base de datos

connection.connect((error)=>{
    if(error){
        if(error) throw error;
    }
    console.log('DB is connected');
});

module.exports=connection;