let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
const fileUpload = require('express-fileUpload');

let index = require('./routes/index');
let users = require('./routes/users');
let admin = require('./routes/admin');
let pedidos = require('./routes/pedidos');
let cajas = require('./routes/cajas');
let clientes = require('./routes/clientes');
let reportes = require('./routes/reportes');

let app = express();

let date = new Date();
let yy = date.getFullYear();
let mm = date.getMonth() + 1;
let dd = date.getDate();
let hh = date.getHours();
let min = date.getMinutes(); 
yyy = (yy < 10 ? "0" : "") + yy;
mmm = (mm < 10 ? "0" : "") + mm;
ddd = (dd < 10 ? "0" : "") + dd;
hhh = (hh < 10 ? "0" : "") + hh;
minn = (min < 10 ? "0" : "") + min;
let hora = hhh + ":" + minn;
let fecha = mmm + "/" + ddd + "/" + yyy;

let session = require('express-session');

let mongoContext = require('./mongo');
//Creación de la base de datos
mongoContext.connect({
   uri: process.env.MONGO_URL || 'mongodb://localhost/restaurant',
   params: {
       connectTimeoutMS: 15000,
       safe: true, //Not supported, 
       useNewUrlParser: true
   }
}, function (err) {
   console.error(`MongoDB connection error: ${err}`);
   process.exit(-1);
});

console.log("Servidor iniciado");
console.log("Hora de inicio: " + hora);
console.log("Fecha de inicio: " + fecha);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/favicon.ico', express.static('images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: '2C44-4D44-WppQ38S',
  resave: true,
  saveUninitialized: true
}));
app.use(fileUpload());


app.use('/', index);
app.use('/users', users);
app.use('/administracion', admin);
app.use('/pedidos', pedidos);
app.use('/cajas', cajas);
app.use('/clientes', clientes);
app.use('/administracion/reportes', reportes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
