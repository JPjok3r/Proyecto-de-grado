let express = require('express');
let mongoContext = require('../mongo');
let Menu = mongoContext.Menu;
let Usuarios = mongoContext.Users;
let Pedidos = mongoContext.Pedidos;
let Factura = mongoContext.Factura;
let Cliente = mongoContext.Cliente;
const pdf = require('html-pdf'),
    fs = require('fs');
let router = express.Router();
let options = {
    format: 'Letter',
    border: {
        top: '0.8in',
        bottom: '0.8in',
        right: '0.80in',
        left: '0.8in'
    }
};

const plantillaRep = require.resolve('../views/reportesPDF.html');

router.get('/', function(req, res, next){
    //mostrar pagina principal (el menu) de los reportes.
    if(req.session.name && (req.session.name.rol === "administrador")){
        let nombreU = req.session.name.nombre;
        res.render('reportes', {title: 'Reportes', userNombre: nombreU});
    } else{
        res.redirect('/');
    }  
});

router.get('/generar/reporte/:opcion', function(req, res) {
   let op = req.params.opcion;
   res.render('reportes_opciones', {opcion: op})
   /* switch (op) {
        case "pedidos":
            res.render('reportes_opciones', {opcion: op})
            break;
   
        case "facturas":

            break;
        case "clientes":
            break;

   } */
    
});

router.get('/mostrar/reporte/:codrep', async function(req, res, next){
    
    let op = req.params.codrep;
    let tabla = ''; 
    if(op === '1'){
        let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
        let peds = await Pedidos.find()
        let title = "Cantidad de pedidos por dia.";
        let fecha = peds[0].fecha;
        let cont = 0;
        let result = [];
        for(let i = 0; i < peds.length; i++){
            if(peds[i].fecha.getDate() === fecha.getDate()){
                cont++;
            } else{
                let ff = new Date(fecha);
                let ff2 = ff.toISOString().split('T');
                result.push({"fecha":ff2[0], "cant":cont});
                fecha = peds[i].fecha;
                cont = 1;
            }
            if(i == peds.length - 1){
                let ff = new Date(fecha);
                let ff2 = ff.toISOString().split('T');
                result.push({"fecha":ff2[0], "cant":cont});
                //result.push({"fecha":fecha, "cant":cont});
            }
        }
        
        tabla += `<thead>
            <tr>
            <th>Fecha</th>
            <th>Cantidad de pedidos</th>
            </tr>
            </thead>
            <tbody>`;
        for(let i = 0; i < result.length; i++){
            tabla += `<tr>
                <td>${result[i].fecha}</td>
                <td>${result[i].cant}</td>
                </tr>`;
        }
        tabla += '</tbody>';
        reportePDF = reportePDF.replace("{{titulo}}", title);
        reportePDF = reportePDF.replace("{{reporte}}", tabla);
        console.log(reportePDF);
        let namePDF = `reporte${req.params.codrep}`;
        pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
            if(error)
                return console.log(error);
            else{
                console.log('PDF creado correctamente!!');
                
                res.render('repPedUno', {report: result, nombrefile: namePDF});
            }
        });
            //res.render('repPedUno', {report: result, nombrefile: namePDF});
    } else if(op === '2'){
        let peds = await Pedidos.find();
        let pedLocal = 0;
        let pedDom = 0;
        for(let i = 0; i < peds.length; i++){
            if(peds[i].tipoPedido === 0){
                pedLocal++;
            }
            if(peds[i].tipoPedido === 1){
                pedDom++;
            }
        }
        let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
        reportePDF = reportePDF.replace("{{titulo}}", "Cantidad de pedidos locales y a domicilio");
        tabla += `<thead>
            <tr>
            <th>Pedidos locales</th>
            <th>Pedidos a domicilio</th>
            </tr>
            </thead>
            <tbody>
            <tr>
            <td>${pedLocal}</td>
            <td>${pedDom}</td>
            </tr>
            </tbody>`;
        reportePDF = reportePDF.replace("{{reporte}}", tabla);
        let namePDF = `reporte${req.params.codrep}`;
        pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
            if(error)
                return console.log(error);
            else{
                console.log('PDF creado correctamente!!');
                res.render('repPedDos', {locales: pedLocal, domi: pedDom, nombrefile: namePDF});
            }
        });
    }
    else if(op === '3'){
        Menu.find().then(menuarr => {
            let arraux = [];
            for(let mp = 0; mp < menuarr.length; mp++){
                if(menuarr[mp].categoria === "Platos"){
                    arraux.push({'name':menuarr[mp].nombre, 'cant': 0});
                }
            }
            console.log(arraux);
            Pedidos.find().then(peds => {
                let jsonaux = [];
                let pedDom = -1;
                for(let i = 0; i < peds.length; i++){
                    for(let jd = 0; jd < peds[i].detalle.length; jd++){
                        for(let p = 0; p < arraux.length; p++){
                            if(peds[i].detalle[jd].item === arraux[p].name){
                                arraux[p].cant++;
                            }
                        }
                    }
                }
                console.log(arraux);
                arraux.sort(function(a, b){
                    if(a.cant > b.cant){
                        return -1;
                    }
                    if(a.cant < b.cant){
                        return 1;
                    }
                    return 0;
                });
                let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
                reportePDF = reportePDF.replace("{{titulo}}", "Plato más pedido");
                tabla += `<thead>
                    <tr>
                    <th>Plato</th>
                    <th>Cantidad</th>
                    </tr>
                    </thead>
                    <tbody>`;
                for(let i = 0; i < arraux.length; i++){
                    tabla += `<tr>
                    <td>${arraux[i].name}</td>
                    <td>${arraux[i].cant}</td>
                    </tr>`;
                }    
                tabla += `</tbody>`;
                reportePDF = reportePDF.replace("{{reporte}}", tabla);
                let namePDF = `reporte${req.params.codrep}`;
                pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                    if(error)
                        return console.log(error);
                    else{
                        console.log('PDF creado correctamente!!');
                        res.render('repPedTres', {platos: arraux, nombrefile: namePDF});
                    }
                });
            }) 
            .catch(next);
        })
        .catch(next);
    } else if(op === 'f1'){
        let result = await Factura.find();
        let totalT = 0
        for(let i = 0; i < result.length; i++){
            totalT += result[i].total;
        }
        let totalE = totalT.toFixed(2);
        
        let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
        reportePDF = reportePDF.replace("{{titulo}}", "Total de ingresos");
        tabla += `<thead>
            <tr>
            <th>Facturas emitidas</th>
            <th>Ingreso total</th>
            </tr>
            </thead>
            <tbody>
            <tr>
            <td>${result.length}</td>
            <td>${totalE}</td>
            </tr>
            </tbody>`;
        reportePDF = reportePDF.replace("{{reporte}}", tabla);
        let namePDF = `reporte${req.params.codrep}`;
        pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
            if(error)
                return console.log(error);
            else{
                console.log('PDF creado correctamente!!');
                res.render('repPedF1', {cant: result.length, total:totalE, nombrefile: namePDF}); 
            }
        });
    } else if(op === 'c1'){
        Cliente.find().then(cli => {
            let fecha = cli[0].fecha;
            let cont = 0;
            let result = [];
            for(let i = 0; i < cli.length; i++){
                if(cli[i].fecha.getDate() === fecha.getDate()){
                    cont++;
                } else{
                    let ff = new Date(fecha);
                    let ff2 = ff.toISOString().split('T');
                    console.log(ff2);
                    result.push({"fecha":ff2[0], "cant":cont});
                    fecha = cli[i].fecha;
                    cont = 1;
                }
                if(i == cli.length - 1){
                    let ff = new Date(fecha);
                    let ff2 = ff.toISOString().split('T');
                    result.push({"fecha":ff2[0], "cant":cont});
                }
            }
            let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
            reportePDF = reportePDF.replace("{{titulo}}", "Cantidad de clientes nuevos por día");
            tabla += `<thead>
                <tr>
                <th>Plato</th>
                <th>Cantidad</th>
                </tr>
                </thead>
                <tbody>`;
            for(let i = 0; i < result.length; i++){
                tabla += `<tr>
                <td>${result[i].fecha}</td>
                <td>${result[i].cant}</td>
                </tr>`;
            }    
            tabla += `</tbody>`;
            reportePDF = reportePDF.replace("{{reporte}}", tabla);
            let namePDF = `reporte${req.params.codrep}`;
            pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                if(error)
                    return console.log(error);
                else{
                    console.log('PDF creado correctamente!!');
                    res.render('repPedUno', {report: result, cli: true, nombrefile: namePDF});
                }
            });
            
        })
        .catch(next);
    } else if(op === 'c2'){
        let cliRes = [];
        Cliente.find().then(clie => {
            for(let i = 0; i < clie.length; i++){
                if(clie[i].email){
                    cliRes.push(clie[i]);
                }
            }
            let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
            reportePDF = reportePDF.replace("{{titulo}}", "Datos de clientes");
            tabla += `<thead>
                <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>E-mail</th>
                </tr>
                </thead>
                <tbody>`;
            for(let i = 0; i < cliRes.length; i++){
                tabla += `<tr>
                <td>${cliRes[i].nombre} ${cliRes[i].apPaterno} ${cliRes[i].apMaterno}</td>
                <td>${cliRes[i].celular}</td>
                <td>${cliRes[i].email}</td>
                </tr>`;
            }    
            tabla += `</tbody>`;
            reportePDF = reportePDF.replace("{{reporte}}", tabla);
            let namePDF = `reporte${req.params.codrep}`;
            pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                if(error)
                    return console.log(error);
                else{
                    console.log('PDF creado correctamente!!');
                    res.render('repCli2', {datos: cliRes, nombrefile: namePDF});
                }
            });
            
        })
        .catch(next);
    }
});

router.post('/mostrar/reporte/:codrep', function(req, res, next){
    let op = req.params.codrep;
    let tabla = '';
    if(op === '4'){
        let fecha = req.body.fecha;
        let fechacomp = new Date(fecha);
        Pedidos.find().then(pedidos => {
            let datesResult = [];
            for(let i = 0; i < pedidos.length; i++){
                if(pedidos[i].fecha.getDate() === fechacomp.getDate()){
                    datesResult.push(pedidos[i]);
                }
            }
            console.log(datesResult);
            Cliente.find().then(cli => {
                for(let i = 0; i < datesResult.length; i++){
                    for(let j = 0; j < cli.length; j++){
                        if(datesResult[i].cliente === cli[j].ciNit){
                            datesResult[i].nombreCli = cli[j].nombre + " " + cli[j].apPaterno;
                        } else{
                            datesResult[i].nombreCli = 'S/N';
                        }
                    }
                }
                let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
                reportePDF = reportePDF.replace("{{titulo}}", `Pedidos por fecha específica ${fechacomp}`);
                tabla += `<thead>
                    <tr>
                    <th>Detalle</th>
                    <th>Tipo de pedido</th>
                    <th>Cliente</th>
                    </tr>
                    </thead>
                    <tbody>`;
                for(let i = 0; i < datesResult.length; i++){
                    tabla += `<tr>
                    <td>
                    <ul>`;
                    for(let j = 0; j < datesResult[i].detalle.length; j++){
                        if(datesResult[i].tipoPedido === 0){
                            tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].item}</li>`;
                        } else{
                            tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].nombreItem}</li>`;
                        }
                    }
                    tabla += `</ul>
                    </td>`;
                    if(datesResult[i].tipoPedido === 0){
                        tabla += `<td>Pedido Local</td>`;
                    } else{
                        tabla += `<td>Pedido Domicilio</td>`;
                    }
                    tabla += `<td>${datesResult[i].nombreCli}</td>
                    </tr>`;
                }    
                tabla += `</tbody>`;
                reportePDF = reportePDF.replace("{{reporte}}", tabla);
                let namePDF = `reporte${req.params.codrep}`;
                pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                    if(error)
                        return console.log(error);
                    else{
                        console.log('PDF creado correctamente!!');
                        res.render('repPedFour', {listaPed: datesResult, nombrefile: namePDF});
                    }
                });
            })
            .catch(next); 
        })
        .catch(next);
    } else if(op === '5'){
        let fechade = req.body.fechade;
        let fechaa = req.body.fecha;
        let fechadecomp = new Date(fechade);
        let fechaacomp = new Date(fechaa);
        Pedidos.find().then(pedidos => {
            let datesResult = [];
            for(let i = 0; i < pedidos.length; i++){
                if((pedidos[i].fecha >= fechadecomp) && (pedidos[i].fecha <= fechaacomp)){
                    datesResult.push(pedidos[i]);
                }
            }
            console.log(datesResult);
            Cliente.find().then(cli => {
                //let clientes = [];
                for(let i = 0; i < datesResult.length; i++){
                    for(let j = 0; j < cli.length; j++){
                        if(datesResult[i].cliente === cli[j].ciNit){
                            datesResult[i].nombreCli = cli[j].nombre + " " + cli[j].apPaterno;
                        }
                    }
                }
                let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
                let ddf1 = new Date(fechadecomp);
                let ddf2 = new Date(fechaacomp);
                reportePDF = reportePDF.replace("{{titulo}}", `Pedidos entre rango de fechas ${ddf1.toISOString().split('T')[0]} - ${ddf2.toISOString().split('T')[0]}`);
                tabla += `<thead>
                    <tr>
                    <th>Fecha</th>
                    <th>Detalle</th>
                    <th>Tipo de pedido</th>
                    <th>Cliente</th>
                    <th>Monto Total</th>
                    </tr>
                    </thead>
                    <tbody>`;
                for(let i = 0; i < datesResult.length; i++){
                    let tot = 0;
                    let dff = new Date(datesResult[i].fecha)
                    tabla += `<tr>
                    <td>${dff.toISOString().split('T')[0]}</td>
                    <td>
                    <ul>`;
                    for(let j = 0; j < datesResult[i].detalle.length; j++){
                        if(datesResult[i].tipoPedido === 0){
                            tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].item}</li>`;
                            tot += datesResult[i].detalle[j].cantidad * datesResult[i].detalle[j].precioU;
                        } else{
                            tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].nombreItem}</li>`;
                            tot += datesResult[i].detalle[j].cantidad * datesResult[i].detalle[j].precioItem;
                        }
                    }
                    datesResult[i].total = tot;
                    tabla += `</ul>
                    </td>`;
                    if(datesResult[i].tipoPedido === 0){
                        tabla += `<td>Pedido Local</td>`;
                    } else{
                        tabla += `<td>Pedido Domicilio</td>`;
                    }
                    tabla += `<td>${datesResult[i].nombreCli}</td>
                    <td>${datesResult[i].total}</td>
                    </tr>`;
                }    
                tabla += `</tbody>`;
                reportePDF = reportePDF.replace("{{reporte}}", tabla);
                let namePDF = `reporte${req.params.codrep}`;
                pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                    if(error)
                        return console.log(error);
                    else{
                        console.log('PDF creado correctamente!!');
                        res.render('repPedCinco', {listaPed: datesResult, nombrefile: namePDF});
                    }
                });
            })
            .catch(next); 
        })
        .catch(next);
    } else if(op === 'f2'){
        let fechaf = req.body.fecha;
        let fechacomp2 = new Date(fechaf);
        Factura.find().then(factRes => {
            let datesResultf = [];
            for(let i = 0; i < factRes.length; i++){
                if(factRes[i].fecha.getDate() === fechacomp2.getDate()){
                    datesResultf.push(factRes[i]);
                }
            }
            console.log(datesResultf);
            Cliente.find().then(cli => {
                for(let i = 0; i < datesResultf.length; i++){
                    for(let j = 0; j < cli.length; j++){
                        if(datesResultf[i].nit === cli[j].ciNit){
                            datesResultf[i].nombreCli = cli[j].nombre + " " + cli[j].apPaterno;
                        }
                    }
                }
                let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
                reportePDF = reportePDF.replace("{{titulo}}", `Facturas por fecha específica ${fechacomp2}`);
                tabla += `<thead>
                    <tr>
                    <th>Detalle</th>
                    <th>N° factura</th>
                    <th>Cliente</th>
                    <th>NIT/CI cliente</th>
                    </tr>
                    </thead>
                    <tbody>`;
                for(let i = 0; i < datesResult.length; i++){
                    tabla += `<tr>
                    <td>
                    <ul>`;
                    for(let j = 0; j < datesResult[i].detalle.length; j++){
                        if(datesResult[i].tipoPedido === 0){
                            tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].item}</li>`;
                        } else{
                            tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].nombreItem}</li>`;
                        }
                    }
                    tabla += `</ul>
                    </td>
                    <td>${datesResult[i].nFactura}</td>
                    <td>${datesResult[i].nombreCli}</td>
                    <td>${datesResult[i].nit}</td>
                    </tr>`;
                }    
                tabla += `</tbody>`;
                reportePDF = reportePDF.replace("{{reporte}}", tabla);
                let namePDF = `reporte${req.params.codrep}`;
                pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                    if(error)
                        return console.log(error);
                    else{
                        console.log('PDF creado correctamente!!');
                        res.render('repPedF2', {listaPed: datesResult, nombrefile: namePDF});
                    }
                });
            })
            .catch(next); 
        })
        .catch(next);
    } else if(op === 'f3'){
        let fechadef = req.body.fechade;
            let fechaaf = req.body.fecha;
            let fechadecompf = new Date(fechadef);
            let fechaacompf = new Date(fechaaf);
            Factura.find().then(factura => {
                let datesResult = [];
                for(let i = 0; i < factura.length; i++){
                    if((factura[i].fecha >= fechadecompf) && (factura[i].fecha <= fechaacompf)){
                        datesResult.push(factura[i]);
                    }
                }
                console.log(datesResult);
                Cliente.find().then(cli => {
                    //let clientes = [];
                    for(let i = 0; i < datesResult.length; i++){
                        for(let j = 0; j < cli.length; j++){
                            if(datesResult[i].cliente === cli[j].ciNit){
                                datesResult[i].nombreCli = cli[j].nombre + " " + cli[j].apPaterno;
                            }
                        }
                    }
                    let reportePDF = fs.readFileSync(plantillaRep, 'utf-8');
                    let df11 = new Date(fechadecompf);
                    let df22 = new Date(fechaacompf);
                    reportePDF = reportePDF.replace("{{titulo}}", `Facturas en rango de fechas ${df11.toISOString().split('T')[0]} - ${df22.toISOString().split('T')[0]}`);
                    tabla += `<thead>
                        <tr>
                        <th>Fecha</th>
                        <th>Detalle</th>
                        <th>Tipo de pedido</th>
                        <th>Cliente</th>
                        <th>NIT</th>
                        <th>Total</th>
                        </tr>
                        </thead>
                        <tbody>`;
                    for(let i = 0; i < datesResult.length; i++){
                        let datf = new Date(datesResult[i].fecha);
                        tabla += `<tr>
                        <td>${datf.toISOString().split('T')[0]}</td>
                        <td>
                        <ul>`;
                        for(let j = 0; j < datesResult[i].detalle.length; j++){
                            if(datesResult[i].detalle[j].item){
                                tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].item}</li>`;
                            } else{
                                tabla += `<li>${datesResult[i].detalle[j].cantidad} ${datesResult[i].detalle[j].nombreItem}</li>`;
                            }
                        }
                        tabla += `</ul>
                        </td>
                        <td>${datesResult[i].nFactura}</td>
                        <td>${datesResult[i].nombre}</td>
                        <td>${datesResult[i].nit}</td>
                        <td>${datesResult[i].total.toFixed(2)}</td>
                        </tr>`;
                    }    
                    tabla += `</tbody>`;
                    reportePDF = reportePDF.replace("{{reporte}}", tabla);
                    let namePDF = `reporte${req.params.codrep}`;
                    pdf.create(reportePDF, options).toFile(`public/files/${namePDF}.pdf`, (error) => {
                        if(error)
                            return console.log(error);
                        else{
                            console.log('PDF creado correctamente!!');
                            res.render('repPedF2', {listaPed: datesResult, nombrefile: namePDF});
                        }
                    });
                })
                .catch(next); 
            })
            .catch(next);
    }
});

router.get('/download/:fileName', function(req, res){
    res.download(`public/files/${req.params.fileName}.pdf`, (error) => {
        if(error)
            console.log(error);
        else{
            //delete file
            console.log('file downloaded');
        }
    });
});
module.exports = router;