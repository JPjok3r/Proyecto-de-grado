let mongoose     = require('mongoose');
const pedidosModel = require('./pedidos.model');
let Schema       = mongoose.Schema;

var FacturaSchema   = new Schema({
    detalle: Object,
    nombre: String,
    nFactura: Number,
    nit: String,
    total: Number,
    fecha: Date,
    pedidoId: String,
    codControl: String
});

module.exports = mongoose.model('Factura', FacturaSchema);