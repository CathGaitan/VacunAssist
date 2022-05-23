const nodemailer=require('nodemailer');
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'code.guess2022@gmail.com', // generated ethereal user
      pass: 'eesbslclxvbbeskr', // generated ethereal password
    },
});

transporter.verify().then(() => {
    console.log('ready for send emails');
})