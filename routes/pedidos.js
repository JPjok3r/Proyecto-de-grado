let express = require('express');
const session = require('express-session');
const { mongo, connection } = require('mongoose');
let fs = require('fs');
let router = express.Router();
let mongoContext = require('../mongo');
let Tarjetas = mongoContext.Tarjetas;
let Clientes = mongoContext.Cliente;
let Menu = mongoContext.Menu;
let Pedidos = mongoContext.Pedidos;
let Factura = mongoContext.Factura;
let Empresa = mongoContext.Empresa;

let change_state = function(codigo, estado){
    Tarjetas.findOne({ codigo }).then(tar=>{
        tar.estado = estado;
        return tar.save();
    })
    .then(t=>{
        console.log(t);
    });
}

const d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const inv = [0,4,3,2,1,5,6,7,8,9];
const p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];

function Verhoeff(numerover = 0, iterations = 1) {
    let resfinal = 0;
    let numaux = numerover.toString();
    let numinv = "";
    for(let i = numaux.length - 1; i >= 0; i--){
        numinv += numaux[i];
    }
    for(let i = 0; i < numinv.length; i++) {
        resfinal = d[resfinal][p[((i + 1) % 8)][parseInt(numinv[i])]]
    }
    resfinal = inv[resfinal];
    if(iterations > 1) {
        return resfinal += Verhoeff(resfinal, --iterations);
    }
    resfinal = resfinal.toString();
    return resfinal;
}

function AllegedRC4(mensaje, key) {
    let state = [];
    let x = 0, y = 0, i1 = 0, i2 = 0;
    let nmen = 0;
    let aux = 0;
    let msgcifrado = "", hexmsg = "";
    for(let i = 0; i < 256; i++){
        state[i] = i;
    }
    for(let i = 0; i < 256; i++){
        i2 = (key[i1].charCodeAt(0) + state[i] + i2) % 256;
        aux = state[i]; state[i] = state[i2]; state[i2] = aux;
        aux = 0;
        i1 = (i1 + 1) % key.length;
    }
    for(let i = 0; i < mensaje.length; i++){
        x = (x + 1) % 256;
        y = (state[x] + y) % 256;
        aux = state[x]; state[x] = state[y]; state[y] = aux;
        aux = 0;
        nmen = mensaje[i].charCodeAt(0) ^ state[(state[x] + state[y]) % 256];
        hexmsg = nmen.toString(16).toUpperCase();
        msgcifrado += (hexmsg.length < 2 ? "0" : "") + hexmsg;
    }
    return msgcifrado;
}

function base64(nu) {
    let n = nu;
    const base = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
                'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 
                'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 
                'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 
                'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 
                'y', 'z', '+', '/'];
    let c = 1; let res = '';
    while(c > 0){
        c = parseInt(n / 64);
        res = base[n % 64] + res;
        n = c;
    }
    return res;
}

function codigoControl(numAutorizacion, numFactura, nitciCliente, fechaFactura, montoTotal, llaveDSF) {
    try {
        let numAutorizacion1 = numAutorizacion;
        let numFactura1 = numFactura;
        let nitciCliente1 = parseInt(nitciCliente);
        let fechaFactura1 = parseInt(fechaFactura);
        let montoTotal1 = montoTotal; 
        let codigo_control = "ERROR";
        let controlCodeFinal = '';
        if(nitciCliente === ""){
            nitciCliente1 = 0;
        }
        if(numAutorizacion === "" || numFactura === -1 || nitciCliente === "" || fechaFactura === "" || montoTotal === -1 || llaveDSF === "") {
            codigo_control = "ERROR_Sin_Datos";
        } else{
            //Paso1 Calcular 2 digitos Verhoeff para cada dato
            let verhnFa = Verhoeff(numFactura1, 2);
            let verhnFa1 = numFactura.toString() + verhnFa;
            let verhNitCi = Verhoeff(nitciCliente1, 2);
            let verhNitCi1 = nitciCliente + verhNitCi;
            let verhfechaF = Verhoeff(fechaFactura1, 2);
            let verhfechaF1 = fechaFactura + verhfechaF;
            let verhmTotal = Verhoeff(montoTotal1, 2);
            let verhmTotal1 = montoTotal.toString() + verhmTotal;
            //Realizar una sumatoria de los valores obtenidos con Verhoeff y volver a obtener 5 digitos del resultado.
            let sumatotal = parseInt(verhnFa1) + parseInt(verhNitCi1) + parseInt(verhfechaF1) + parseInt(verhmTotal1);
            let paso1 = Verhoeff(sumatotal, 5);
            console.log(paso1);
            //Paso2 de la llave de dosificacion obtener subcadenas del tamaño segun cada dígito del Verhoeff obtenido
            //de la sumatoria sumandole 1 a cada dígito, teniendo 5 subcadenas.
            let auxp = [];
            for(let i = 0; i < paso1.length; i++){
                auxp[i] = parseInt(paso1[i]);
            }
            let icon = 0, sub_llaves = [], ip = 0;
            for(let i = 0; i < llaveDSF.length; i++){
                if(ip < paso1.length){
                    sub_llaves[icon] += llaveDSF[i];
                    auxp[ip] = auxp[ip] - 1;
                }
                if(auxp[ip] < 0){
                    ip++;
                    icon++;
                } 
            }
            numAutorizacion1 += sub_llaves[0];
            verhnFa1 += sub_llaves[1];
            verhNitCi1 += sub_llaves[2];
            verhfechaF1 += sub_llaves[3];
            verhmTotal1 += sub_llaves[4];
            //Paso 3 con las nuevas cadenas obtenidas concatenarlas y aplicar RC4 con la llave de dosificacion
            let conCadAllRC = numAutorizacion1 + verhnFa1 + verhNitCi1 + verhfechaF1 + verhmTotal1;
            let resRC4 = AllegedRC4(conCadAllRC, (llaveDSF + paso1));
            //Paso 4 obtenemos las sumatorias de los valores ASCII de un caraccter de la cadena obtenida en RC4 y sumatorias
            //parciales de la misma cadena cada 5 posiciones.
            let suma_parcial = [0,0,0,0,0], paso4 = 0;
            for(let i = 0; i < resRC4.length; i++){
                paso4 += resRC4[i].charCodeAt(0);
                suma_parcial[i%5] += resRC4[i].charCodeAt(0);
            }
            //Paso 5 multiplicacmos la sumatoria total con cada una de las obtenidas parciales y dividimos obteniendo
            //solo la parte entera de la division.
            let paso5 = 0, paso5base = '';
            for(let i = 0; i < suma_parcial.length; i++){
                paso5 += parseInt((paso4 * suma_parcial[i]) / (1 + parseInt(paso1[i])));
            }
            paso5base = base64(paso5);
            //Paso 6 por ultimo aplicar AllegedRC4 a la expresion obtenida en paso5 con la llave de dosificacion.
            codigo_control = AllegedRC4(paso5base, (llaveDSF + paso1));
            //let controlCodeFinal = '';
            for(let i = 0; i < codigo_control.length; i++){
                if(i !== 0 && (i % 2 === 0)){
                    controlCodeFinal += '-';
                }
                controlCodeFinal += codigo_control[i];
            }
        }
        return controlCodeFinal;
    } catch (error) {
        console.log(error);
        return 'ERROR';
    }
}

router.get('/pedido/volver/:codigo', function(req, res, next){
    Menu.find().then((menu)=>{
        let show_menucate = 'Platos';
        let showMenu = [];
        for(let i = 0; i < menu.length; i++){
            if(menu[i].disponible){
                showMenu.push(menu[i]);
            }
        }
        res.render('pedido_seguir', { menu: showMenu, show_menucate: show_menucate });
    })
    .catch(next);
});

router.post('/pedido/volver/:codigo', function(req, res, next){
    let codigo = req.params.codigo;
    
    Clientes.find().then((clientes)=> {
        res.render('datos_factura_form', { title: 'Datos de facturacion', cliente: req.body, clientes: clientes, codigo: codigo })
    })
    .catch(next);
});

router.get('/pedido/local/:codigo', function(req, res, next){
    let cod = req.params.codigo;
    let nummesa = req.query.numesa;
    let state = false;
    console.log(cod);
    Tarjetas.find().then(tarjetas=>{
        let ntarval = -1;
        for(let i = 0; i < tarjetas.length; i++){
            if(tarjetas[i].codigo === cod){
                state=true;
                ntarval = i;
            }
        } 
        if(state){
            if(tarjetas[ntarval].estado){
                res.send('Tarjeta en uso.  Por favor comuníquese con un encargado.')
            } else{
                change_state(cod, state);
                Clientes.find().then(clientesf=>{
                    Menu.find().then(menuf=>{
                        let showMenu = [];
                        for(let i = 0; i < menuf.length; i++){
                            if(menuf[i].disponible){
                                showMenu.push(menuf[i]);
                            }
                        }
                        let show_menucate = 'Platos';
                        console.log(showMenu);
                        res.render('menu_pedidos', { title: 'Menu', clientes: clientesf, menu: showMenu, show_menucate: show_menucate, codigo1: cod, nummesa: nummesa });
                    })
                    .catch(next);
                })
                .catch(next);
            }
        } else{
            res.send("Codigo no valido");
        }
    })
    .catch(next);
});

router.post('/pedido/local/:codigo', function(req, res, next){
    let show_menucate = req.body.show_menucat;
    let cod = req.params.codigo;
    console.log(show_menucate);
    Menu.find().then(menuf=>{
        let showMenu = [];
        for(let i = 0; i < menuf.length; i++){
            if(menuf[i].disponible){
                showMenu.push(menuf[i]);
            }
        }
        res.render('menu_pedidos_simp', { title: 'Menu', menu: showMenu, show_menucate: show_menucate, codigo1: cod})
    })
    .catch(next);
});

/* Ruta en la que se maneja la peticion AJAX para guardar temporalmente los pedidos de los clientes
que se realizan en el lugar (Restaurante), el modulo recibe una peticion POST obteniendo datos para 
poder ir creando el pedido y posteriormente la factura. */
router.post('/pedido/agregar', function(req, res, next){
    const nombreitem = req.body.nombre; //variables recibidas en la peticion POST para crear el pedido
    const precioitem = req.body.precio; //estas variables son el nombre del item de menu y su precio respectivo
    let code = req.body.codigo;         //se recibe tambien el codigo de la tarjeta que utiliza el cliente para realizar el pedido
    console.log(nombreitem);
    console.log(precioitem);
    console.log(code);
    let pedido = [];                    //array vacio para el manejo y armado del pedido
    //se verifica si existe el archivo con el nombre como el codigo de la tarjeta, ya que la tarjeta esta ligado a un cliente
    fs.stat('./'+code+'.json', (err, stats)=>{
        if(err){ // si la funcion obtiene error, quiere decir que el archivo no existe por tanto debemos crear el archivo
            console.log(err);
            let cant = 1;
            let json = {
                "nombre": nombreitem,
                "precio": precioitem,
                "cantidad": cant
            };
            console.log(json);
            pedido.push({ 
                "nombre": nombreitem,
                "precio": precioitem,
                "cantidad": cant
            }); // colocamos los datos obtenidos de la peticion AJAX en el array
            //creamos el archivo y escribimos en el los datos obntenidos
            fs.writeFile(code+'.json', JSON.stringify(pedido), 'utf8', function(err){
                if(err) console.error(err);
            });
            res.json(json); //respondemos a la peticion POST de AJAX
        }
        else{ //si el archivo ya existe ya se empezo a realizar el pedido
            console.log(stats);
            //se lee el arhivo
            fs.readFile(code+'.json','utf8', function(err,data){
                let auxjson; //variable para obtener el contenido del archivo
                if(err){
                    console.log(err);
                    res.send('Ocurrio un error');
                }else{
                    //como el contenido del archivo esta guardado como String, se realiza una conversion a JSON
                    //para manejarlo y realizar todas nuestras operaciones necesarias
                    auxjson = JSON.parse(data);
                    console.log(auxjson);
                    let controlador = false;
                    console.log(data.length);
                    console.log(auxjson.length);
                    //recorremos y busca y verificacion si los datos nueos datos obtenidos de la nueva peticion
                    //concuerdan con algun dato ya almacenado para actualizarlo
                    for(let i = 0; i < auxjson.length; i++){
                        if(auxjson[i].nombre === nombreitem){
                            auxjson[i].cantidad++; // se actualiza
                            controlador = true;
                        } 
                    }
                    console.log(controlador);
                    if(!controlador){ //nuestro control nos indica que no encontro un dato ya almacenado y se trata de un nuevo dato para almacenar
                        auxjson.push({
                            "nombre": nombreitem,
                            "precio": precioitem,
                            "cantidad": 1
                        }); //se ingresan los nuevos datos
                        // se guardan los datos en el archivo temporal
                        fs.writeFile(code+'.json', JSON.stringify(auxjson), 'utf8', function(err){
                            if(err) console.error(err);
                        });
                    } else{
                        console.log(auxjson);
                        //se realiza el guardado de los datos actualizados en el archivo temporal
                        pedido.push(JSON.stringify(auxjson));
                        fs.writeFile(code+'.json', pedido, 'utf8', function(err){
                            if(err) console.error(err);
                        });
                    }
                }
                res.json(auxjson);
            });
        }
    });
});

router.get('/pedido/existe/:codigo', function(req, res, next){
    let codigo = req.params.codigo;
    fs.stat(codigo+'.json', (err,stats)=>{
        if(err){
            res.send('No existe');
        } else{
            res.send('Existe');
        }
    });
});

router.get('/pedido/datos/facturacion/:codigo', function(req, res, next){
    let code = req.params.codigo;
    let cliente = {
        "nombre": "",
        "apellido": "",
        "nit": ""
    }
    Clientes.find().then((clientes)=>{
        res.render('datos_factura_form', { title_form: "Datos de facturacion", clientes: clientes, cliente: cliente, codigo: code })
    })
    .catch(next);
});

router.get('/pedido/mostrar/pedido/:codigo', function(req, res, next){
    let code = req.params.codigo;
    let querystring = req.query;
    console.log(querystring);
    let nombre = querystring.nombre;
    let apellido = querystring.apellido;
    let nit = querystring.nit
    let op_nomfactura = querystring.nomfactura;
    let cliente = {};
    
    if(op_nomfactura === "nombre"){
        cliente = {
            "nombre": nombre,
            "apellido": apellido,
            "nit": nit,
            "nomfactura": nombre
        };
    } else if(op_nomfactura === "apellido"){
        cliente = {
            "nombre": nombre,
            "apellido": apellido,
            "nit": nit,
            "nomfactura": apellido
        };
    }else{
        cliente = {
            "nombre": nombre,
            "apellido": apellido,
            "nit": nit,
            "nomfactura": nombre + " " + apellido 
        };
    }
    console.log(cliente);
    let pedido = [];
    fs.readFile(code+'.json', 'utf8', (err, data)=>{
        if(err) console.log(err);
        pedido = JSON.parse(data);
        console.log(pedido);
        res.render('show_pedido', { title: "Su pedido", cliente: cliente, pedido: pedido })
    })
    
});

function getFecha(control=false){
    let date = new Date();
    let yy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    let yyy = (yy < 10 ? "0" : "") + yy;
    let mmm = (mm < 10 ? "0" : "") + mm;
    let ddd = (dd < 10 ? "0" : "") + dd;
    if(control)
        return yyy + "-" + mmm + "-" + ddd;
    else
        return yyy + mmm + ddd;
}

async function nuevoCliente(nCliente, next){
    console.log(nCliente);
    let newClient = new Clientes(nCliente);
    try {
        const cliente = await newClient.save();
        console.log(cliente);
    } catch (next) {
        return next(next);
    }
}

async function nuevoPedido(nPedido, next){
    let newOrder = new Pedidos(nPedido);
    try {
        const pedido = await newOrder.save();
        return pedido;
    } catch (next) {
        return next(next);
    }
}

async function nuevaFactura(nFactura, next){
    let newFactura = new Factura(nFactura);
    try {
        const factura = await newFactura.save();
        console.log(factura);
    } catch (next) {
        return next(next);
    }
}

router.post('/pedido/factura/:codigo', function(req, res, next){
    let body = req.body;
    let codigo = req.params.codigo;
    console.log(body);
    let nombrecli = body.nombre;
    let apellidocli = body.apellido;
    let nit = body.nit;
    let nom_factura = body.nomfactura;
    let detalle = body.pedido;
    let ciNit = nit;
    let pedidoId;
    let numMesa = body.numesa;
    let nAuth = '', nFactura = 0;
    let codigo_control = '';
    return Clientes.findOne({ ciNit }, async function (err, data) {
            if (err) {
                console.log(err);
            }
            if (data === null) {
                console.log("El cliente no esta registrado");
                //agregar
                let nombre = nombrecli;
                let apPaterno = apellidocli;
                let apMaterno = "",
                    email = "",
                    celular = 0,
                    username = "",
                    password = "",
                    dir = { "direccion": "", "lat": 0, "lon": 0};
                if(ciNit !== "" && apPaterno !== ""){
                    let fecha = getFecha(true);
                    let newcliente = {
                        nombre,
                        apPaterno,
                        apMaterno,
                        email,
                        celular,
                        ciNit,
                        username,
                        password,
                        dir,
                        fecha
                    };
                    nuevoCliente(newcliente, next);
                } else{
                    nit = "S/N";
                }
                let fecha;
                fecha = getFecha(true);
                let estado = -1;
                let tipoPedido = 0;
                let tarjeta = codigo;
                let cliente = nit;
                
                let newpedido = {
                    detalle,
                    fecha,
                    estado,
                    tipoPedido,
                    tarjeta,
                    cliente,
                    numMesa
                };
                nuevoPedido(newpedido, next).then(ped => {
                    pedidoId = ped._id;
                    pedidoId = pedidoId.toString();
                    if ((nombrecli === "") && (apellidocli === "")) {
                        //crear factura sin nombre
                        let total = 0;
                        for (let i = 0; i < detalle.length; i++) {
                            total += (parseFloat(detalle[i].precioU) * parseFloat(detalle[i].cantidad));
                        }
                        let nombre = "S/N";
                        nit = "0";
                        Empresa.find((err, data) => {
                            if(err){
                                console.log('Error: ' + err);
                            } else{
                                if(data.length === 0){
                                    console.log('No hay datos para generar codigo.');
                                } else{
                                    nAuth = data[0].nAutorizacion;
                                    Factura.find().then((doc) => {
                                        if(doc.length === 0)
                                            nFactura = 1;
                                        else
                                            nFactura = doc.length + 1;
                                        let dateControl = getFecha();
                                        codigo_control = codigoControl(nAuth, nFactura, nit, dateControl, parseInt(total), '442F3w5AggG7644D737asd4BH5677sasdL4%44643(3C3674F4');
                                        console.log(codigo_control);
                                        let codControl = codigo_control;
                                        let newfactura = {
                                            detalle,
                                            nombre,
                                            nFactura,
                                            nit,
                                            total,
                                            fecha,
                                            pedidoId,
                                            codControl
                                        };
                                        nuevaFactura(newfactura, next);
                                    });
                                }
                            }
                        });
                        
                    } else {
                        //crea factura
                        let total = 0;
                        console.log(detalle);
                        for (let i = 0; i < detalle.length; i++) {
                            total += (parseFloat(detalle[i].precioU) * parseFloat(detalle[i].cantidad));
                        }
                        let nombre = nom_factura;
                        Empresa.find((err, data) => {
                            if(err){
                                console.log('Error: ' + err);
                            } else{
                                if(data.length === 0){
                                    console.log('No hay datos para generar codigo.');
                                } else{
                                    nAuth = data[0].nAutorizacion;
                                    Factura.find().then((doc) => {
                                        if(doc.length === 0)
                                            nFactura = 1;
                                        else
                                            nFactura = doc.length + 1;
                                        let dateControl = getFecha();
                                        codigo_control = codigoControl(nAuth, nFactura, nit, dateControl, parseInt(total), '442F3w5AggG7644D737asd4BH5677sasdL4%44643(3C3674F4');
                                        console.log(codigo_control);
                                        let codControl = codigo_control;
                                        let newfactura = {
                                            detalle,
                                            nombre,
                                            nFactura,
                                            nit,
                                            total,
                                            fecha,
                                            pedidoId,
                                            codControl
                                        };
                                        nuevaFactura(newfactura, next);
                                    });
                                }
                            }
                        });
                    }
                });

            } else {
                //crear primero el pedido para luego crear la factura 
                //let detalle = pedido;
                let fecha;
                fecha = getFecha(true);
                let estado = -1;
                let tipoPedido = 0;
                let tarjeta = codigo;
                let cliente = nit;
                let newpedido = {
                    detalle,
                    fecha,
                    estado,
                    tipoPedido,
                    tarjeta,
                    cliente,
                    numMesa
                };
                nuevoPedido(newpedido, next).then(ped => {
                    pedidoId = ped._id;
                    pedidoId = pedidoId.toString();
                    if ((nombrecli === "") && (apellidocli === "")) {
                        //crear factura sin nombre
                        let total = 0;
                        for (let i = 0; i < detalle.length; i++) {
                            total += (parseFloat(detalle[i].precioU) * parseFloat(detalle[i].cantidad));
                        }
                        let nombre = "S/N";
                        nit = "0";
                        Empresa.find((err, data) => {
                            if(err){
                                console.log('Error: ' + err);
                            } else{
                                if(data.length === 0){
                                    console.log('No hay datos para generar codigo.');
                                } else{
                                    nAuth = data[0].nAutorizacion;
                                    Factura.find().then((doc) => {
                                        if(doc.length === 0)
                                            nFactura = 1;
                                        else
                                            nFactura = doc.length +1;
                                        let dateControl = getFecha();
                                        codigo_control = codigoControl(nAuth, nFactura, nit, dateControl, parseInt(total), '442F3w5AggG7644D737asd4BH5677sasdL4%44643(3C3674F4');
                                        console.log(codigo_control);
                                        let codControl = codigo_control;
                                        let newfactura = {
                                            detalle,
                                            nombre,
                                            nFactura,
                                            nit,
                                            total,
                                            fecha,
                                            pedidoId,
                                            codControl
                                        };
                                        nuevaFactura(newfactura, next);
                                    });
                                }
                            }
                        });
                    } else if ((nombrecli !== "") || (apellidocli !== "")) {
                        //crea factura
                        let total = 0;
                        for (let i = 0; i < detalle.length; i++) {
                            total += (parseFloat(detalle[i].precioU) * parseFloat(detalle[i].cantidad));
                        }
                        let nombre = nom_factura;
                        Empresa.find((err, data) => {
                            if(err){
                                console.log('Error: ' + err);
                            } else{
                                if(data.length === 0){
                                    console.log('No hay datos para generar codigo.');
                                } else{
                                    nAuth = data[0].nAutorizacion;
                                    Factura.find().then((doc) => {
                                        if(doc.length === 0)
                                            nFactura = 1;
                                        else
                                            nFactura = doc.length + 1;
                                        let dateControl = getFecha();
                                        codigo_control = codigoControl(nAuth, nFactura, nit, dateControl, parseInt(total), '442F3w5AggG7644D737asd4BH5677sasdL4%44643(3C3674F4');
                                        console.log(codigo_control);
                                        let codControl = codigo_control;
                                        let newfactura = {
                                            detalle,
                                            nombre,
                                            nFactura,
                                            nit,
                                            total,
                                            fecha,
                                            pedidoId,
                                            codControl
                                        };
                                        nuevaFactura(newfactura, next);
                                    });
                                }
                            }
                        });
                    }
                });
            }
            fs.unlink(codigo + '.json', function () {
                console.log('Archivo eliminado con exito');
            });
            Menu.find().then((menu) => {
                let show_menucate = "Platos";
                let showMenu = [];
                for(let i = 0; i < menu.length; i++){
                    if(menu[i].disponible){
                        showMenu.push(menu[i]);
                    }
                }
                res.render('pedido_seguir', { title: 'Menu', menu: showMenu, show_menucate: show_menucate });
            });

        });
});

router.get('/mostrar/lista', function(req, res, next){
    if(req.session.name && ((req.session.name.rol === "cocinero") || (req.session.name.rol === "garzon"))){
        Pedidos.find().then((pedidos) => {
            let pedDom = [];
            let pedLoc = [];
            for(let i = 0; i < pedidos.length; i++){
                pedidos[i].n = i + 1;
                if(pedidos[i].tipoPedido === 0){
                    pedLoc.push(pedidos[i]);
                } else{
                    pedDom.push(pedidos[i]);
                }
            }
            console.log(pedidos);
            res.render('lista_pedidos', { title: "Pedidos", pedidosL: pedLoc, pedidosD: pedDom, nameUser: req.session.name.nombre });
        })
        .catch(next);
    } else{
        res.redirect('/');
    }
});

router.post('/cambiar/estado', function(req, res, next){
    let _id = req.body.id;
    let itemn = req.body.itemn;
    Pedidos.findOne({ _id }).then((pedido) => {
        pedido.estado++;
        pedido.save().then((ped) => {
            console.log(ped);
            if(ped.estado === 0)
                res.send(`<button id="btnestado${itemn}" onclick="cambiarEstado('${ped._id}','${itemn}')">Preparando</button>`)
            else
                res.send(`<button id="btnestado${itemn}" onclick="cambiarEstado('${ped._id}','${itemn}')">Finalizado</button>`)
        })
    })
    .catch(next);
});

router.get('/verificar/lista', function(req, res, next){
    Pedidos.find().then((pedidos) => {
        
        res.json(pedidos);
    })
    .catch(next);
});

router.get('/actualizar/lista', function(req, res, next){
    Pedidos.find().then((pedidos) => {
        let pedLoc = [], pedDom = [];
        for(let i = 0; i < pedidos.length; i++){
            pedidos[i].n = i + 1;
            if(pedidos[i].tipoPedido === 0){
                pedLoc.push(pedidos[i]);
            } else{
                pedDom.push(pedidos[i]);
            }
        }
        res.render('lista_pedidos_actualizar', { pedidosL: pedLoc, pedidosD: pedDom });
    })
    .catch(next);
});

router.post('/datos/cliente', function(req, res, next){
    let ciNit = req.body.nit;
    console.log(ciNit);
    Clientes.findOne({ ciNit }).then((cli) => {
        console.log(cli);
        res.json(cli);
    })
    .catch(next);
});

router.get('/cocina/admin/menu', function(req, res, next){
    if(req.session.name && ((req.session.name.rol === "cocinero") || (req.session.name.rol === "garzon"))){
        Menu.find().then(menu => {
            for(let i = 0; i < menu.length; i++){
                menu[i].identi = i + 1;
            }
            res.render('menuItems', { title: "Disponibilidad de Menú", menu: menu, nameUser: req.session.name.nombre});
        })
        .catch(next);
    } else{
        res.redirect('/');
    }
});

router.get('/cocina/cambiar/:id', function(req, res, next){
    let _id = req.params.id;
    Menu.findOne({_id}).then(item => {
        if(item.disponible){
            item.disponible = false;
        } else{
            item.disponible = true;
        }
        item.save().then(saveditem => {
            let message = "";
            let controler = false;
            if(item.disponible){
                message = `${saveditem.nombre} ya está disponible.`;
                controler = true;
            } else{
                message = `${saveditem.nombre} no está disponible.`;
                controler = false;
            }
            res.json({message: message, boolcont: controler, nombre: saveditem.nombre});
        })
        .catch(next);
    })
    .catch(next);
});

async function getNombreCliente(nitCi){
    let ciNit = nitCi;
    const cli = await Clientes.findOne({ciNit});
    return `${cli.nombre} ${cli.apPaterno}`;
}

router.get('/envios/get', async function(req, res){
    const peds = await Pedidos.find();
    let sendPeds = [];
    let nome = '0;'
    for(let i = 0; i < peds.length; i++){
        if((peds[i].tipoPedido === 1) && (peds[i].estado === 1)){
            sendPeds.push(peds[i]);
        }
    }
    for(let i = 0; i < sendPeds.length; i++){
        nome = await getNombreCliente(sendPeds[i].cliente);
        console.log(nome);
        sendPeds[i].tarjeta = nome;
    }
    console.log(sendPeds);
    res.json({"envios": sendPeds});
    
});

router.post('/ped/client/get', async function(req, res){
    let _id = req.body.idPed;
    const ped = await Pedidos.findOne({_id});
    let ciNit = ped.cliente;
    const cli = await Clientes.findOne({ciNit});
    console.log(ped);
    console.log(cli);
    res.json({"pedido": ped, "cliente": cli});
});

router.post('/delivered', function(req, res, next){
    let _id = req.body.idPed;
    Pedidos.findOne({_id}).then(ped => {
        ped.estado++;
        ped.save();
        res.json({"del": true});
    })
    .catch(next);
});

module.exports = router;