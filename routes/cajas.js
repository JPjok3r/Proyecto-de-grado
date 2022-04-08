let express = require('express');
let router = express.Router();
let mongoContext = require('../mongo');
let Clientes = mongoContext.Cliente;   // talvez no necesite
let Tarjetas = mongoContext.Tarjetas;
let Usuario = mongoContext.Users;
let Factura = mongoContext.Factura;
let Pedidos = mongoContext.Pedidos;
let Empresa = mongoContext.Empresa;
let qr = require('qr-image');

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

function changeState(codigo){
    Tarjetas.findOne({codigo}).then((tar)=>{
        tar.estado = false;
        tar.save();
    });
}

router.get('/', function(req, res, next){
    //control de la sesion
    if(req.session.name && (req.session.name.rol === "cajero")){
        res.render('cajas', { title: "Cajas", cajero: "Cajero: " + "" /*aniadir nombre obteniendo de la sesion */});
    } else{
        res.redirect('/');
    }
});

router.get('/facturacion/:codigo', function(req, res, next){
    if(req.session.name && (req.session.name.rol === "cajero")){
        let codigo = req.params.codigo;
        let tarjeta = codigo;
        Pedidos.findOne({tarjeta}).then((pedido) => {
            if(pedido !== null){
                let pedidoId = pedido._id.toString();
                Factura.findOne({pedidoId}).then((factura) => {
                    Empresa.find().then(datosE=>{
                        //renderizar para mostrar la factura
                        console.log(datosE);
                        let estTot = false;
                        let tot, decimals, envtotal;
                        let total = factura.total.toString();
                        console.log(total);
                        for(let ii = 0; ii < total.length; ii++){
                            if(total[ii] === '.')
                                estTot = true;
                        }
                        if(estTot){
                            let totaux = factura.total.toFixed(2);
                            tot = totaux.split(".");
                            decimals = tot[1];
                            envtotal = `Son: ${numtostr(total)} ${decimals}/100 Bolivianos.`;
                        } else{
                            envtotal = `Son: ${numtostr(total)} 00/100 Bolivianos.`;
                        }
                        let ff = new Date(factura.fecha);
                        console.log(ff.toISOString());
                        let ff2 = ff.toISOString().split('T');
                        let fechaAux = ff2[0].split('-');
                        let fechaShow = `${fechaAux[2]}/${fechaAux[1]}/${fechaAux[0]}`;
                        res.render('facturacion', { title: "Factura", datos: datosE[0], factura: factura, totalcad: envtotal, fechaF: fechaShow });
                        //llamar al metodo para limpiar la tarjeta en pedido y cambiar el estado de la tarjeta
                        changeState(codigo);
                        pedido.tarjeta = '0';
                        pedido.save();
                        
                        //no olvidar de controlar la sesion

                        //probar los fetch's para ver si resulta(pero en lo del select ver un div para llamar un onload)
                    })
                    .catch(next);
                })
                .catch(next);
            } else{
                Tarjetas.findOne({codigo}).then(tar => {
                    if(tar.estado){
                        res.send(`<p>La tarjeta esta en uso, pero no tiene un pedido realizado</p>
                        <p>Desea liberar la tarjeta?</p>
                        <button><a href="/cajas/liberar/${tarjeta}">Liberar</button>
                        <button><a href="/cajas">Volver</button>`);
                    }
                    else{
                        res.send(`<p>La tarjeta esta libre, no hay pedidos asociados al código: ${codigo}</p>
                        <button><a href="/cajas">Volver</button>`);
                    }
                })
                .catch(next); 
            }
        })
        .catch(next);
    } else{
        res.redirect('/');
    }
});

router.get('/liberar/:codigo', function(req, res){
    let code = req.params.codigo;
    changeState(code);
    res.redirect('/');
});

router.get('/factura/qr/:code', function(req, res, next){
    console.log(req.params.code);
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