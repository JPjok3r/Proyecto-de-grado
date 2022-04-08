let mongoose     = require('mongoose');
let Schema       = mongoose.Schema;

var UsersSchema   = new Schema({
    nombre: String,
    apPaterno: String,
    apMaterno: String,
    email: String,
    celular: Number,
    estado: Boolean,
    cIdentidad: String,
    username: String,
    password: String,
    rol: String
});

module.exports = mongoose.model('Users', UsersSchema);