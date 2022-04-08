let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var PersonaSchema   = new Schema({
    nombre: String,
    apPaterno: String,
    apMaterno: String,
    email: String,
    celular: Number
});

module.exports = mongoose.model('Persona', PersonaSchema);