var express = require('express');
var router = express.Router();
let mongoContext = require('../mongo');
let Users = mongoContext.Users;

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.name){
    let auth_user = req.session.name;
    switch(auth_user.rol){
      case "administrador":
        res.redirect('/administracion');
        break;
      case "cajero":
        res.redirect('/cajas');
        break;
      default:
        res.redirect('/pedidos/lista');
        break;
    }
  }
  else
    res.render('index', { title: 'Restaurantes' });
  /* req.session.name = {
    nom: "juan",
    rol: "admin"
  }
  console.log(req.session);
  let user = req.session.name;
  console.log("Nombre " + user.nom);
  console.log("Rol " + user.rol); */
});

module.exports = router;
