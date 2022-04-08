let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var EmpresaSchema   = new Schema({
    nombre: String,
    nAutorizacion: String,
    nitE: String,
    telefono: Number,
    dir: String
});

module.exports = mongoose.model('Empresa', EmpresaSchema);