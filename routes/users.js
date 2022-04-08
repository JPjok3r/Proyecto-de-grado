let express = require('express');
const session = require('express-session');
let router = express.Router();
let mongoContext = require('../mongo');
let Users = mongoContext.Users;


router.post('/verification', function(req, res, next){
	let data = req.body;
	let username = data.username;
	let passwd = data.password;
	return Users.findOne({username}).then(users=>{
		console.log(users);
		if(users !== null) {
			if(passwd === users.password){
				req.session.name = {
					rol: users.rol,
					user: users.username,
					nombre: users.nombre + " " + users.apPaterno
				}
				console.log(req.session);
				switch(users.rol){
					case "administrador":
					res.redirect('/administracion');
					break;
					case "cajero":
					res.redirect('/cajas');
					break;
					case "cocinero" || "garzon":
					res.redirect('/pedidos/mostrar/lista');
					break;
					case "envios":
					res.redirect('/envios/domicilio');
					break;
					default:
					res.render('error_login', { title: "Usuario Inexistente" });
					break;
				}
			} else
				res.redirect('/');
		} else{
			res.render('index', { title: 'Restaurantes', mensaje: 'Usuario no valido. Porfavor verifique su nombre de usuario y contraseña, o pongase en contacto con administración.' });
		}
	})
	.catch(next);
});

router.post('/verificar/existe/usuario', function(req, res, next){
	let username = req.body.username;
	console.log(username);
	Users.findOne({ username }).then((user)=> {
		console.log(user);
		let respObj;
		if(req.body.password === user.password){
			respObj = {"userExist": true};
		} else{
			respObj = {"userExist": false};
		}
		res.json(respObj);
	})
	.catch(next);
});

router.post('/verificar/existe/username', function(req, res, next){
	let username = req.body.username;
	console.log(username);
	Users.findOne({ username }).then((user)=> {
		console.log(user);
		let respObj;
		if(user){
			respObj = {"userExist": true};
		} else{
			respObj = {"userExist": false};
		}
		res.json(respObj);
	})
	.catch(next);
});

router.get('/salir', function(req, res){
	req.session.name = "";
	console.log(req.session);
	res.redirect('/');
});

module.exports = router;
