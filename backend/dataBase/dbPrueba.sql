CREATE DATABASE datebaseprueba1; #Crear baseDeDatos

CREATE TABLE personUser( #Crear una tabla
    DNI int(10) NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    fechaNacimiento date NOT NULL,
    factorRiesgo boolean NOT NULL,
    email text NOT NULL,
    contrasenia text NOT NULL
);

ALTER TABLE personUser #Cambiar una tabla
    MODIFY DNI int(15) NOT NULL;

INSERT INTO personuser #AgregarPersona
    VALUES (328751024,'Leti','Ballestero','1996-05-13',1,'leti@gmail.com','perrito');

SELECT * FROM personuser; #Imprimir datos de tabla
DESCRIBE personUser; #Imprimir campos de la tabla