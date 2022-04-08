'use strict';

let mongoose = require ('mongoose');
let Userschema = require('./models/users.model'); 
let Tarjetaschema = require('./models/tarjetas.model');
let Pedidoschema = require('./models/pedidos.model');
let Menuschema = require('./models/menu.model');
let Facturaschema = require('./models/factura.model');
let Clienteschema = require('./models/cliente.model');
let Empresaschema = require('./models/empresa.model');
let Personaschema = require('./models/persona.model');

mongoose.Promise = global.Promise;


function connect(config, onError) {
  mongoose.connect(config.uri, config.params);
  mongoose.connection.on('error', onError);
}


module.exports.connect = connect;
module.exports.Users = mongoose.model('Users', Userschema.UsersSchema); // para exportar los schemas
module.exports.Pedidos = mongoose.model('Pedidos', Pedidoschema.PedidoSchema);
module.exports.Tarjetas = mongoose.model('Tarjetas', Tarjetaschema.TarjetasSchema);
module.exports.Cliente = mongoose.model('Cliente', Clienteschema.ClienteSchema);
module.exports.Factura = mongoose.model('Factura', Facturaschema.FacturaSchema);
module.exports.Menu = mongoose.model('Menu', Menuschema.MenuSchema);
module.exports.Empresa = mongoose.model('Empresa', Empresaschema.EmpresaSchema);
module.exports.Persona = mongoose.model('Persona', Personaschema.PersonaSchema);