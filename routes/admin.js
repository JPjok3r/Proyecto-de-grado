let express = require('express');
const session = require('express-session');
let qr = require('qr-image');
let fs = require('fs');
let mailer = require('nodemailer');
let router = express.Router();
let mongoContext = require('../mongo');
let Users = mongoContext.Users;
let Tarjetas = mongoContext.Tarjetas;
let Menu = mongoContext.Menu;
let Empresa = mongoContext.Empresa;

const transporter = mailer.createTransport({
	service: 'Gmail',
	host: 'smtp.gmail.com',
	secure: true,
	auth: {
		user: 'jokerjp4ps@gmail.com',
		pass: 'Jok3rJPsaavedra2205'
	},
	tls: { rejectUnauthorized: false }
});

router.get('/', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		res.render('administracion', {title: 'Administración', user: req.session.name.nombre});
	} else{
		res.redirect('/');
	}
});

router.get('/listar_usuarios', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		return Users.find().then(users=>{
			res.render('list_user', {title: 'Lista de Usuarios', user: req.session.name.nombre, list: users });
		})
		.catch(next);
	} else{
		res.redirect('/');
	}
});

router.get('/usuario/:id', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		let _id = req.params.id;
		return Users.findById(_id).then(userf=>{
			console.log(userf);
			res.render('user_found', { title: 'Detalle de usuario', usuario: userf, user:req.session.name.nombre });
		})
		.catch(next);
	} else{
		res.redirect('/');
	}
});

router.get('/nuevousuario', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador"))
		res.render('new_user', { title: 'Crear nuevo usuario', user: req.session.name.nombre });
	else
		res.redirect('/');
});


router.post('/nuevousuario', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador"))
	{
		let data = req.body;
		let nombre = data.nombre;
		let apPaterno = data.apPaterno;
		let apMaterno = data.apMaterno;
		let email = data.email;
		let celular = data.celular;
		let estado = false;
		let cIdentidad = data.cIdentidad;
		let username = data.username;
		let password = data.password;
		let rol = data.rol;
		let newu = {
			nombre,
			apPaterno,
			apMaterno,
			email,
			celular,
			estado,
			cIdentidad,
			username,
			password,
			rol
		};
		let uc = new Users(newu);
		return uc.save().then(userCreated=>{
			console.log('Usuario Creado');
			console.log(userCreated);
			let mensajetext = 'Querido ' + userCreated.nombre + ' ' + userCreated.apPaterno + ' su nombre de usuario es: ' + userCreated.username + ' y su contraseña es: ' + userCreated.password;
			let mensajehtml = `<html>
			<body>
			<p>Bienvenido ${userCreated.nombre} ${userCreated.apPaterno}</p>
			<p>Le brindamos nuestros mas cordiales saludos y anunciamos que:</p>
			<p>Su nombre de usuario es: ${userCreated.username}</p>
			<p>Su contraseña es: ${userCreated.password}</p>
			</body>
			</html>`;
			let mail_op = {
				from: 'jokerjp4ps@gmail.com',
				to: userCreated.email,
				subject: 'Usuario y contraseña de inicio de sesion',
				text: mensajetext,
				html: mensajehtml
			}
			transporter.sendMail(mail_op, function(err, info){
				if(err)
					console.log(err);
				else
					console.log('Email enviado: ' + info);
			});
			res.redirect('/administracion/nuevousuario');
		})
		.catch(err => {
			next(err);
		});
	} else{
		res.redirect('/');
	}
	
});

router.get('/eliminar_usuario', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador"))
	return Users.find().then(users=>{
		res.render('delete_user', {title: 'Eliminar Usuario', user: req.session.name.nombre, list: users });
	})
	.catch(next);
	else
		res.redirect('/');
});

router.post('/eliminar_usuario', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador"))
	{
		let _id = req.body.id;
		console.log(_id);
		return Users.deleteOne({ _id }).then((userdeleted) => {
			console.log(userdeleted);
			//res.render('delete_user', {title: 'Eliminar Usuario', user: req.session.name.nombre, list: users });
			return Users.find().then(users=>{
				res.render('delete_user', {title: 'Eliminar Usuario', user: req.session.name.nombre, list: users, mensaje: "Usuario eliminado satisfactoriamente" });
			})
			.catch(next);
		})
		.catch(next);
	} else
		res.redirect('/');
});

router.get('/generar_nuevoqr', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		let result = '';
		let carcteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let clen = carcteres.length;
		for(let i = 0; i < 30; i++ ){
			result += carcteres.charAt(Math.floor(Math.random() * clen));
		}
		return Tarjetas.find().then(tarjetas=>{
			let qr_code = qr.image(result, { type: 'png' });
			let cn = tarjetas.length;
			let codigo = result;
			let estado = false;
			let nombre = 'code' + (cn + 1) ;
			let dirFileCode = 'public/images/qr_codes/';
			let dirfile = dirFileCode + nombre + '.png';
			let output = fs.createWriteStream(dirfile);
			qr_code.pipe(output);
			let new_tarjeta = {
				codigo,
				estado,
				nombre,
				dirFileCode
			}
			let nt = new Tarjetas(new_tarjeta);
			return nt.save().then(tarjetac=>{
				console.log(dirfile);
				console.log(tarjetac);
				res.render('qr_codes', { title: 'Codigo QR generado', codigo: tarjetac, user: req.session.name.nombre});
			})
			.catch(next);
		})
		.catch(next);	
	} else{
		res.redirect('/');
	}
});

router.get('/nuevo_menu_item', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		res.render('new_menu', { title: 'Agregar nuevo item al menu', user: req.session.name.nombre });
	} else{
		res.redirect('/');
	}
});

router.post('/nuevo_menu_item', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		let item = req.body;
		if (!req.files){
			console.log('no se cargan archivos');
			res.redirect('/administracion');
		} else{
			let nombre = item.nombre;
			let descripcion = item.descripcion;
			let precio = parseFloat(item.precio);
			let categoria = item.categoria;
			let itemfile = req.files.nm_item;
			let disponible = true;
			let imagen = '/images/menu/' + itemfile.name;
 			itemfile.mv('./public/images/menu/' + itemfile.name, function(error){
				if(error){
					console.log(error);
					res.redirect('/administracion/nuevo_menu_item');
				}
				else{
					let newmenu = {
						nombre,
						descripcion,
						categoria,
						precio,
						imagen,
						disponible
					}
					let nm = new Menu(newmenu);
					return nm.save().then(menuc=>{
						console.log(menuc);
						res.render('menu_agregado', { title: 'Nuevo item de menu agregado', user: req.session.name.nombre, item: menuc });
					})
					.catch(next);
				}
			});
		}
	} else{
		res.redirect('/');
	}
});

router.get('/datos/empresa', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		Empresa.find().then(datos =>{
			console.log(datos);
			if(datos.length === 0){
				res.render('datos_empresa', { title: "Datos del restaurante", user:req.session.name.nombre });
			} else{
				res.render('datos_empresa', { title: "Datos del restaurante", mensaje: "Se guardaron los datos del restaurante", disabled: "true", datos: datos[0], user:req.session.name.nombre });
				
			}
		})
		.catch(next);
	} else{
		res.redirect('/');
	}
});

router.post('/datos/empresa', function(req, res, next){
	if(req.session.name && (req.session.name.rol === "administrador")){
		let control = req.body.control;
		if(control === "modificar")
		{
			Empresa.find().then( (emp) => {
				let nombre = req.body.nombreE,
					dir = req.body.dirE,
					nAutorizacion = req.body.nAuth, 
					telefono = req.body.telfE, 
					nitE = req.body.nitE;
				if(emp[0].nombre !== nombre){
					emp[0].nombre = nombre;
				}
				if(emp[0].nAutorizacion !== nAutorizacion){
					emp[0].nAutorizacion = nAutorizacion;
				}
				if(emp[0].dir !== dir){
					emp[0].dir = dir;
				}
				if(emp[0].telefono !== telefono){
					emp[0].telefono = telefono;
				}
				if(emp[0].nitE !== nitE){
					emp[0].nitE = nitE;
				}
				emp[0].save().then(data => {
					res.render('datos_empresa', { title: "Datos del restaurante", mensaje: "Datos guardados exitosamente", disabled: "true", datos: data, user:req.session.name.nombre});
				});
			})
			.catch(next);
		} else{
			let datos = req.body,
				nombre = datos.nombreE,
				dir = datos.dirE, 
				nAutorizacion = datos.nAuth, 
				telefono = datos.telfE, 
				nitE = datos.nitE;
			let newEmp = {
				nombre,
				nAutorizacion,
				nitE,
				telefono,
				dir
			};
			let ne = new Empresa(newEmp);
			ne.save().then((datos)=> {
				res.render('datos_empresa', { title: "Datos del restaurante", mensaje: "Datos guardados exitosamente", disabled: "true", datos: datos, user:req.session.name.nombre});
			})
			.catch(next);
		}
	}
});

module.exports = router;
