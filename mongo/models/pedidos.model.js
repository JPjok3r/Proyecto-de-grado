let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var PedidoSchema   = new Schema({
    detalle: Object,
    fecha: Date,
    estado: Number,
    tipoPedido: Number,
    tarjeta: String,
    cliente: String,
    numMesa: Number
});

module.exports = mongoose.model('Pedidos', PedidoSchema);