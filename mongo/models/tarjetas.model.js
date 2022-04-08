let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var TarjetasSchema   = new Schema({
    codigo: String,
    estado: Boolean,
    nombre: String,
    dirFileCode: String
});

module.exports = mongoose.model('Tarjetas', TarjetasSchema);