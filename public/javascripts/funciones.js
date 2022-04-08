
function loadMenu(show_menucat){
    console.log(show_menucat);
    let p = document.getElementById("code").value;
    console.log(p);
    fetch('/pedidos/pedido/local/'+p, {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({show_menucat: show_menucat})
    }).then(res=> res.text()).then(res=>{
        console.log(res);
        document.querySelector("#menu-container").innerHTML = res;
    })
    /*let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200){
            document.getElementById("menu-container").innerHTML = this.responseText;
        }
    };
    xhttp.open("POST", "/pedidos/pedido/local/"+p, true);
    xhttp.open()
    xhttp.send(show_menucat);*/
}

function agregarItem(nombre) {
    
    let codigo = document.getElementById("code").value;
    let nom = document.getElementById(nombre).value;
    let precio = document.getElementById(nombre+"p").value;
    console.log(nombre);
    console.log(precio);
    console.log(codigo);
    console.log(nom);
    fetch('/pedidos/pedido/agregar', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            nombre: nom,
            precio: precio,
            codigo: codigo
        })
    }).then(res=> res.text()).then(res=>{
        console.log(res);
    })
}

async function controlPedido(codigo){
    let retorno = false;
    await fetch(`/pedidos/pedido/existe/${codigo}`, {method: 'GET'})
    .then(res=> res.text()).then(res=>{
        if(res === "Existe"){
            console.log(res);
            retorno = true;
            console.log(retorno);
        } 
    });
    console.log(retorno);
    return retorno;
}

function siguiente(control_code){
    console.log(control_code);
    let classbtnnext = document.querySelector("#btnsiguiente").className;
    //console.log(classbtnnext);
    switch(classbtnnext){
        case "GET":
            //realizar la peticion para mostrar todo el pedido mas los datos de facturacion
            let nombrecli = document.querySelector("#nombref").value;
            let apellidocli = document.querySelector("#apellido").value;
            let nitcli = document.querySelector("#nit").value;
            let opmostrar = document.querySelector('input[name="nom_factura"]:checked').value;
            //console.log(opmostrar);
            fetch(`/pedidos/pedido/mostrar/pedido/${control_code}?nombre=${nombrecli}&apellido=${apellidocli}&nit=${nitcli}&nomfactura=${opmostrar}`, {method: "GET"})
            .then((res)=> res.text()).then((res)=>{
                //debe recibir en respuesta el formulario de datos de facturacion y mostrarlo en la seccion correspondiente
                //console.log(res);
                document.querySelector("#total_container").innerHTML = res;
                document.querySelector("#btnsiguiente").textContent = "Aceptar";
                
            });
            
            document.querySelector("#btnsiguiente").className = "POST";
            document.querySelector("#btnanterior").className = "POST";
            break;
        case "POST":
            //peticion para enviar al servidor todos los datos y que guarde todo el la base de datos
            let nombreclif="", apellidoclif="", nitclif="", pedido, nomfactura="";
            pedido =[];
            if(document.querySelector("#nombrecli")){
                nombreclif = document.querySelector("#nombrecli").value;
            }
            if(document.querySelector("#apellidocli")){
                apellidoclif = document.querySelector("#apellidocli").value;
            }
            if(document.querySelector("#nit")){
                nitclif = document.querySelector("#nit").value;
            }
            if(document.querySelector("#nomfactura")){
                nomfactura = document.querySelector("#nomfactura").value;
            }
            let cont = document.querySelector("#contador").value;
            console.log(cont);
            for(let i = 1; i < cont; i++){
                console.log(document.querySelector("#preciounidad"+i).value);
                console.log(parseFloat(document.querySelector("#preciounidad"+i).value));
                pedido.push({
                    "item": document.querySelector("#nombreitem"+i).value,
                    "cantidad": parseInt(document.querySelector("#cantidad"+i).value),
                    "precioU": parseFloat(document.querySelector("#preciounidad"+i).value) 
                });
            }
            console.log(nombreclif);
            console.log(apellidoclif);
            console.log(pedido);
            let nummesa = document.querySelector("#nummesa").value;
            fetch('/pedidos/pedido/factura/'+control_code, {
                method: 'POST',
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({
                    nombre: nombreclif,
                    apellido: apellidoclif,
                    nit: nitclif,
                    nomfactura: nomfactura,
                    pedido: pedido,
                    numesa: nummesa
                })
            }).then(res=> res.text()).then(res=>{
                console.log(res);
                document.querySelector("#total_container").innerHTML = res;
                document.querySelector("#btnsiguiente").textContent = "Siguiente";
            })
            document.querySelector("#btnanterior").className = "abutnback";
            document.querySelector("#btnsiguiente").className = "abutnnext";
            break;
        default:
            //realizar la peticion para mostrar el formulario de datos de facturaccion
            
            controlPedido(control_code).then((res) => {
                //console.log(res);
                if(res){
                    fetch('/pedidos/pedido/datos/facturacion/'+control_code, {method: "GET"})
                    .then((ress)=> ress.text()).then((ress)=>{
                        //debe recibir en respuesta el formulario de datos de facturacion y mostrarlo en la seccion correspondiente
                        //console.log(res);
                        document.querySelector("#total_container").innerHTML = ress;
                    });
                    document.querySelector("#btnsiguiente").className = "GET";
                    document.querySelector("#btnanterior").className = "GET";
                } else{
                    WebAndroid.showToast("No realizó su pedido aún, por favor agregue al menos un item al pedido.");
                }
            })
            break;
    }
    
    
}

function back(control_code){
    let classbtnback = document.querySelector("#btnanterior").className;
    console.log(classbtnback);
    if(classbtnback !== "abutnback"){
        switch(classbtnback){
            case "GET":
                //esta en formulario y debe volver a mostrar el menu
                fetch('/pedidos/pedido/volver/'+control_code, {method: "GET"})
                .then((res)=> res.text()).then((res)=> {
                    document.querySelector("#total_container").innerHTML = res;
                });
                document.querySelector("#btnanterior").className = "abutnback";
                document.querySelector("#btnsiguiente").className = "abutnnext";
                break;
            case "POST":
                //Muestra todo el pedido y debe volver al formulario
                let nombrec="", apellidoc="", nitc="";
                if(document.querySelector("#nombrecli")){
                    nombrec = document.querySelector("#nombrecli").value;
                }
                if(document.querySelector("#apellidocli")){
                    apellidoc = document.querySelector("#apellidocli").value;
                }
                if(document.querySelector("#nit")){
                    nitc = document.querySelector("#nit").value;
                }
                fetch(`/pedidos/pedido/volver/${control_code}`, {
                    method: 'POST',
                    headers: {'Content-type': 'application/json'},
                    body: JSON.stringify({
                        nombre: nombrec,
                        apellido: apellidoc,
                        nit: nitc
                    })
                }).then((res)=> res.text()).then((res)=>{
                    document.querySelector("#total_container").innerHTML = res;
                });
                document.querySelector("#btnanterior").className = "GET";
                document.querySelector("#btnsiguiente").className = "GET";
                break;
        }
    }
}

function obtenerDataClient() {
    let nit = document.querySelector("#nit").value;
    console.log(nit);
    fetch('/pedidos/datos/cliente', { 
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({nit:nit}) 
    })
    .then((res) => res.json()).then((res) => {
        console.log(res);
        if(res !== null){
            document.querySelector("#nombref").value = res.nombre;
            document.querySelector("#apellido").value = res.apPaterno;
        }
    });
}

function verifyUsername() {
    let username = document.querySelector("#username").value;
    fetch('/users/verificar/existe/username', { 
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({username: username}) 
    })
    .then((res)=> res.json()).then((res)=> {
        if(res.userExist){
            document.querySelector("#username").setCustomValidity("El nombre de usuario ya existe");
        }
    });
}

function opcionesReportes(opcion){
    fetch('/administracion/reportes/generar/reporte/'+opcion, {method: "GET"})
    .then((res) => res.text()).then((res) => {
        document.querySelector("#seccion_reporte").innerHTML = res;
    });
}

function generarReporte(opcion){
    console.log(opcion);
    let prueba = "";
    switch(opcion){
        case '1':
            //directo el fetch
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {method: "GET"})
            .then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case '2':
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {method: "GET"})
            .then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case '3':
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {method: "GET"})
            .then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case '4':
            let fecha = document.querySelector('#xfecha').value;
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {
                method: 'POST',
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({fecha:fecha})
            }).then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case '5':
            let fecha1 = document.querySelector('#de').value;
            let fecha2 = document.querySelector('#a').value;
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {
                method: 'POST',
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({fechade:fecha1, fecha:fecha2})
            }).then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case 'f1':
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {method: 'GET'})
            .then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case 'f2':
            let fechaf2 = document.querySelector('#xfechaf').value;
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {
                method: 'POST',
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({fecha:fechaf2})
            }).then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case 'f3':
            let fechaf1 = document.querySelector('#def').value;
            let fechaaf2 = document.querySelector('#af').value;
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {
                method: 'POST',
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({fechade:fechaf1, fecha:fechaaf2})
            }).then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case 'c1':
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {method: "GET"})
            .then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
        case 'c2':
            fetch(`/administracion/reportes/mostrar/reporte/${opcion}`, {method: "GET"})
            .then((res) => res.text()).then((res) => {
                document.querySelector("#reporte-generado").innerHTML = res;
            });
            break;
    }
}

function itemCambiar(id, numId){
    fetch(`/pedidos/cocina/cambiar/${id}`, {method: 'GET'})
    .then(res => res.json()).then(res => {
        alert(res.message);
        if(res.boolcont){
            console.log(res.nombre);
            document.querySelector("#disp"+numId).textContent = "Disponible";
        } else{
            console.log(res.nombre);
            document.querySelector("#disp"+numId).textContent = "No disponible";
        }
    });
}

function confirmDelete(nombre, id){
    let cres = confirm("Está seguro que desea eliminar al usuario " + nombre);
    console.log(cres);
    if(cres == true){
        document.getElementById(id).submit();
    } else{
        return(false);
    }
}