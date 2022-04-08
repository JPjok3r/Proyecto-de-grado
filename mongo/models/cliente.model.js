let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var ClienteSchema   = new Schema({
    nombre: String,
    apPaterno: String,
    apMaterno: String,
    email: String,
    celular: Number,
    nomFactura: String,
    ciNit: String,
    username: String,
    password: String,
    dir: Object,
    fecha: Date
});

module.exports = mongoose.model('Cliente', ClienteSchema);