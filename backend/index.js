const mySQL=require('mysql');

var connection = mySQL.createConnection({
    host: "localhost",
    user:"root",
    password:"",
    database:"" //nombre de la base de datos
})

connection.connect((error){
    if(error) throw error;
    console.log("Conexion okayy");
})



const express = require("express"); //importar express
const app = express();
const PORT = 3000;
const fs = require("fs");
const userPerson= require("./modules/userPerson/routerUserPerson");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/userPerson", userPerson);

app.get("/", (req, res) => {
  res.send("Aguante vocaloid!");
});

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));