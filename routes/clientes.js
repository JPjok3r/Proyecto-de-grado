const { AsyncLocalStorage } = require('async_hooks');
let express = require('express');
const path = require('path');
const mongoContext = require('../mongo'),
    Cliente = mongoContext.Cliente,
    Menu = mongoContext.Menu,
    Pedidos = mongoContext.Pedidos,
    Factura = mongoContext.Factura,
    Empresa = mongoContext.Empresa,
    fs = require('fs'),
    mailer = require('nodemailer'),
    pdf = require('html-pdf'),
    qr = require('qr-image');

const plantillaF = require.resolve('../views/facturaCdom.html');

let router = express.Router();

const transporter = mailer.createTransport({
	service: 'Gmail',
	host: 'smtp.gmail.com',
	secure: true,
	auth: {
		user: 'jokerjp4ps@gmail.com',
		pass: 'Jok3rJPsaavedra2205'
	},
	tls: { rejectUnauthorized: false }
});

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

const oneDigitMat = [];
const twoDigitSpecial = [];
const twoDigitMat = [];
const treeDigitMat = [];
oneDigitMat[0] = ["1","Uno"]; oneDigitMat[1] = ["2","Dos"]; oneDigitMat[2] = ["3","Tres"]; oneDigitMat[3] = ["4","Cuatro"]; oneDigitMat[4] = ["5","Cinco"]; oneDigitMat[5] = ["6","Seis"]; oneDigitMat[6] = ["7","Siete"]; oneDigitMat[7] = ["8","Ocho"]; oneDigitMat[8] = ["9","Nueve"];
twoDigitSpecial[0] = ["11","Once"]; twoDigitSpecial[1] = ["12","Doce"]; twoDigitSpecial[2] = ["13","Trece"]; twoDigitSpecial[3] = ["14","Catorce"]; twoDigitSpecial[4] = ["15","Quince"];
twoDigitMat[0]= ["1","Diez"]; twoDigitMat[1]= ["2","Veinte"]; twoDigitMat[2]= ["3","Treinta"]; twoDigitMat[3]= ["4","Cuarenta"]; twoDigitMat[4]= ["5","Cincuenta"]; twoDigitMat[5]= ["6","Sesenta"]; twoDigitMat[6]= ["7","Setenta"]; twoDigitMat[7]= ["8","Ochenta"]; twoDigitMat[8]= ["9","Noventa"];
treeDigitMat[0]= ["1","Ciento"]; treeDigitMat[1]= ["2","Doscientos"]; treeDigitMat[2]= ["3","Trescientos"]; treeDigitMat[3]= ["4","Cuatrocientos"]; treeDigitMat[4]= ["5","Quinientos"]; treeDigitMat[5]= ["6","Seiscientos"]; treeDigitMat[6]= ["7","Setecientos"]; treeDigitMat[7]= ["8","Ochocientos"]; treeDigitMat[8]= ["9","Novecientos"];

function numtostr(numero){
    let sepnum = numero.split(".");
    let enteros = sepnum[0];
    let digitos = enteros.length;
    let first = "";
    let second = "";
    let third = "";
    let fourth = "";
    let final = "";
    switch(digitos){
        case 1:
            for(let i = 0; i < oneDigitMat.length; i++){
                if(enteros[0] === oneDigitMat[i][0]){
                    first = oneDigitMat[i][1];    
                }
            }
            break;
        case 2:
            if(parseInt(numero) > 10 && parseInt(numero) <= 15){
                for(let i = 0; i < twoDigitSpecial.length; i++){
                    if(numero === twoDigitSpecial[i][0]){
                        second = twoDigitSpecial[i][1];
                    }
                }
            } else{
                let aux = enteros.split("");
                if(parseInt(aux[0]) !== 0){
                    for(let i = 0; i < twoDigitMat.length; i++){
                        if(aux[0] === twoDigitMat[i][0]){
                            second = twoDigitMat[i][1];    
                        }
                    }
                    if(parseInt(aux[1]) !== 0){
                        second += " y ";
                        second += numtostr(aux[1]);
                    }
                } else{
                    second = numtostr(aux[1]);
                }
            }
            break;
        case 3:
            let aux = enteros.split("");
            if(parseInt(aux[0]) === 0){
                let se = aux[1] + aux[2];
                third = numtostr(se);
            } else{
                if((parseInt(aux[1]) === 0) && (parseInt(aux[2]) === 0)){
                    third += "Cien ";
                } else{
                    for(let i = 0; i < treeDigitMat.length; i++){
                        if(aux[0] === treeDigitMat[i][0]){
                            third += treeDigitMat[i][1];
                        }
                    }
                    let se = aux[1] + aux[2];
                    third += numtostr(se);
                }
            }
            break;
        case 4:
            let aux2 = enteros.split("");
            if(parseInt(aux2[0]) === 1){
                fourth = "Mil";
            } else{
                for(let i = 0; i < oneDigitMat.length; i++){
                    if(parseInt(aux2[0]) === oneDigitMat[i][0]){
                        fourth = oneDigitMat[i][0] + " Mil ";
                    }
                }
            }
            let fo = "";
            for(let i = 1; i < aux2.length; i++){
                fo += aux2[i];
            }
            fourth += numtostr(fo);
            break;
    }
    final = fourth + " " + third + " " + second + " " + first;
    return final;
}

router.get('/obtener', function(req, res, next){
    Cliente.find().then((clientes) => {
        console.log(clientes);
        let resJson = [{"clientes": clientes}];
        console.log(resJson);
        res.json(resJson);
    })
    .catch(next);
});

router.post('/login/app', function(req, res, next){
    let username = req.body.usern;
    let password = req.body.passn;
    console.log(username);
    console.log(password);
    Cliente.findOne({ username }).then((cli)=> {
        let resJson;
        if(cli !== null){
            let passObtenido = cli.password;
            if(password === passObtenido){
                let auxJson = cli.toJSON();
                auxJson.validacion = true;
                auxJson.mensaje = "valido";
                resJson = {"cliente": auxJson};
                console.log(resJson);
            } else{
                resJson = {"cliente":{
                    "mensaje": "Nombre de usuario o contraseña incorrectos",
                    "validacion": false
                }};
            }
            res.json(resJson);
        } else{
            //mensaje de error o que no existe en formato JSON
            resJson = {"cliente":{
                "mensaje": "Usuario no valido, por favor cree una cuenta.",
                "validacion": false
            }};
            res.json(resJson);
        }
        
    })
    .catch(next);
});

router.get('/obtener/menu', function(req, res, next){
    Menu.find().then((menu) => {
        let showMenu = [];
        for(let i = 0; i < menu.length; i++){
            if(menu[i].disponible){
                showMenu.push(menu[i]);
            }
        }
        let resJSON = [{"menu": showMenu}];
        console.log(resJSON);
        res.json(resJSON);
    })
    .catch(next);
});

router.post('/get/user/data', function(req, res, next){
    let username = req.body.usern;
    let password = req.body.passn;
    console.log(username);
    console.log(password);
    Cliente.findOne({ username }).then((cli)=> {
        res.json(cli);
    })
    .catch(next);
});

router.post('/check/username', function(req, res, next){
    let username = req.body.checkUsername;
    Cliente.findOne({ username }).then((cli) => {
        let resJSON
        if(cli === null ){
            resJSON = {
                "usern": "no existe",
                "controlUser": false
            }
        } else{
            resJSON = {
                "usern": cli.username,
                "controlUser": true
            }
        }
        res.json(resJSON);
    })
    .catch(next);
});

router.post('/nuevo/cliente', function(req, res, next){
    let datos = req.body;
    let nombre, apPaterno, apMaterno, email, celular, nomFactura, ciNit, username, password, dir, fechaaux, fecha;
    nombre = datos.nombre;
    apPaterno = datos.apPat;
    apMaterno = datos.apMat;
    email = datos.email;
    celular = datos.cel;
    nomFactura = datos.nomFactura;
    ciNit = datos.ciNit;
    username = datos.username;
    password = datos.passwd;
    dir = datos.dir;
    fechaaux = getFecha(true);
    fecha = new Date(fechaaux);
    let saveCliJson = {
        nombre,
        apPaterno,
        apMaterno,
        email,
        celular,
        nomFactura,
        ciNit,
        username,
        password,
        dir,
        fecha
    }
    let svcli = new Cliente(saveCliJson);
    svcli.save().then((cli) => {
        console.log(cli);
        res.json({'ok': true});
    })
    .catch(next);
});

router.post('/get/cliente', function(req, res, next){
    let ciNit = req.body.ciNit;
    Cliente.findOne({ciNit}).then(cli => {
        console.log(cli);
        res.json({'client': cli});
    })
    .catch(next);
});



router.post('/nuevo/pedido', function(req, res, next){
    let pedidoDet = req.body.pedido;
    let cliData = req.body.cliente;
    let nFactura = 0;
    let nAuth = '';
    console.log(pedidoDet);
    console.log(cliData);
    let detalle = pedidoDet;
    let fechaAux = getFecha(true);
    let fecha = new Date(fechaAux);
    console.log(fecha);
    let tipoPedido = 1;
    let estado = -1;
    let cliente = cliData.client.ciNit;
    let tarjeta = 'No';
    let nombre = cliData.client.nomFactura;
    let numMesa = -1;
    let newpedido = {
        detalle,
        fecha,
        estado,
        tipoPedido,
        tarjeta,
        cliente,
        numMesa
    };
    let newPed = new Pedidos(newpedido);
    let message = '';
    newPed.save().then(ped => {
        if(ped != null){
            message = 'Recibimos su pedido, aguarde que lo preparamos';
            Empresa.find((err, data) => {
                let pedidoId = ped._id.toString();
                let nit = cliente;
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
                            let total = 0;
                            for(let i = 0; i < detalle.length; i++){
                                total += (parseFloat(detalle[i].precioItem) * parseFloat(detalle[i].cantidad));
                            }
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
                            let newFtra = new Factura(newfactura);
                            newFtra.save().then(fact => {
                                if(fact !== null){
                                    enviarFactura(fact._id);
                                }
                            })
                            .catch(next);
                        });
                    }
                }
                res.json({'message': message, 'control': true});
            });
        } else{
            message = 'Su pedido no pudo ser obtenido, disculpe las molestias';
        }
    })
    .catch(next);
    
    //res.json({'mensaje': message, 'control': true});
});

async function enviarFactura(id){
    let _id = id;
    const dataEmp = await Empresa.find();
    const datosFtra = await Factura.findOne({ _id });
    let datosE = dataEmp[0];
    let facturaPdf = fs.readFileSync(plantillaF, 'utf-8');
    facturaPdf = facturaPdf.replace("{{nombreEmpresa}}", datosE.nombre);
    facturaPdf = facturaPdf.replace("{{dirEmp}}", datosE.dir);
    facturaPdf = facturaPdf.replace("{{telfEmp}}", datosE.telefono);
    facturaPdf = facturaPdf.replace("{{nitEmp}}", datosE.telefono);
    facturaPdf = facturaPdf.replace("{{numFactura}}", datosFtra.nFactura);
    facturaPdf = facturaPdf.replace("{{autEmp}}", datosE.nAutorizacion);
    let ff = new Date(datosFtra.fecha);
    let ff2 = ff.toISOString().split('T');
    let fechaAux = ff2[0].split('-');
    let fechaShow = `${fechaAux[2]}/${fechaAux[1]}/${fechaAux[0]}`;
    facturaPdf = facturaPdf.replace("{{dateFact}}", fechaShow);
    facturaPdf = facturaPdf.replace("{{nitFact}}", datosFtra.nit);
    facturaPdf = facturaPdf.replace("{{nompFact}}", datosFtra.nombre);
    let tabla = '';
    for(let i = 0; i < datosFtra.detalle.length; i++){
        let totItem = datosFtra.detalle[i].precioItem * datosFtra.detalle[i].cantidad;
        tabla += `<tr>
            <td>${datosFtra.detalle[i].cantidad}</td>
            <td>${datosFtra.detalle[i].nombreItem}</td>
            <td>${datosFtra.detalle[i].precioItem}</td>
            <td>${totItem}</td>
            </tr>`;
    }
    facturaPdf = facturaPdf.replace("{{contTablaF}}", tabla); 
    facturaPdf = facturaPdf.replace("{{totalFact}}", datosFtra.total.toFixed(2));
    let estTot = false;
    let tot, decimals, envtotal;
    let total = datosFtra.total.toString();
    console.log(total);
    for(let ii = 0; ii < total.length; ii++){
        if(total[ii] === '.')
            estTot = true;
    }
    if(estTot){
        let totaux = datosFtra.total.toFixed(2);
        tot = totaux.split(".");
        decimals = tot[1];
        envtotal = `Son: ${numtostr(total)} ${decimals}/100 Bolivianos.`;
    } else{
        envtotal = `Son: ${numtostr(total)} 00/100 Bolivianos.`;
    }
    facturaPdf = facturaPdf.replace("{{totalCad}}", envtotal);
    facturaPdf = facturaPdf.replace("{{codContFact}}", datosFtra.codControl);
    facturaPdf = facturaPdf.replace("{{facturaid}}", datosFtra._id);
    pdf.create(facturaPdf).toFile(`factura${datosFtra.nit}.pdf`, (error) => {
        if(error)
            console.log("Error al crear el PDF: " + error);
        else{
            console.log("PDF creado correctamente");
            let ciNit = datosFtra.nit;
            console.log(ciNit);
            Cliente.findOne({ciNit}).then(datacli => {
                let mensajehtml = `<html>
                    <body>
                    <p>Estimado ${datacli.nombre} ${datacli.apPaterno}</p>
                    <p>Le brindamos nuestros mas cordiales saludos y anunciamos que se le hace envío de su factura</p>
                    </body>
                    </html>`;
                let emailto = datacli.email;
                console.log(emailto);
                let mail_op = {
                    from: 'jokerjp4ps@gmail.com',
                    to: emailto,
                    subject: 'Factura de su pedido',
                    text: '',
                    html: mensajehtml,
                    attachments: [{
                        filename: `factura${ciNit}.pdf`,
                        path: path.join(__dirname, `../factura${ciNit}.pdf`),
                        contentType: 'application/pdf'
                    }]
                    
                }
                transporter.sendMail(mail_op, function(err, info){
                    if(err)
                        console.log(err);
                    else {
                        console.log('Email enviado: ' + info);
                        /* fs.unlink(`../output/factura${datosFtra.nit}.pdf`, function(){
                            console.log("Archivo eliminado");
                        }); */
                    }
                    transporter.close();
                });
            });
        }
    });
    
    
}

router.get('/factura/qr/:code', function(req, res, next){
    let _id = req.params.code;
    Empresa.find().then(dataE=>{
        Factura.findOne({_id}).then(factura=>{
            let ff = new Date(factura.fecha);
            let ff2 = ff.toISOString().split('T');
            let fechaAux = ff2[0].split('-');
            let fechaShow = `${fechaAux[2]}/${fechaAux[1]}/${fechaAux[0]}`;
            let cod = `${dataE[0].nitE}|${factura.nFactura}|${dataE[0].nAutorizacion}|${fechaShow}|${factura.total}|${factura.total}|${factura.codControl}|${factura.nit}|0.00|0.00|0.00|0.00`; 
            console.log(cod);
            let gencode = qr.image(cod, {type: 'png'});
            res.setHeader('Content-type', 'image/png');
            gencode.pipe(res);
        })
        .catch(next);
    })
    .catch(next);
});

module.exports = router;