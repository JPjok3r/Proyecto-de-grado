let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var MenuSchema   = new Schema({
    nombre: String,
    descripcion: String,
    categoria: String,
    imagen: String,
    precio: Number,
    disponible: Boolean
});

module.exports = mongoose.model('Menu', MenuSchema);