var library = module.exports = {}

library.sendMail = function(mailOptions, callback){
    var nodemailer = require("nodemailer");
    var smtpTransport = nodemailer.createTransport("SMTP",{
        host:'smtpcloud.sohu.com',
        port:'25',
        auth: {
            user: "postmaster@weyu-message.sendcloud.org",
            pass: "LsOnrMF8oYHmcg9m"
        }
    });
    smtpTransport.sendMail(mailOptions, function(error, response){
        callback(error, response);
        smtpTransport.close();
    });
}
