function cambiarEstado(idpedido, ii) {
    let id = idpedido;
    fetch('/pedidos/cambiar/estado', { 
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({ id: id, itemn: ii })
    })
    .then((res) => res.text()).then((res) => {
        document.querySelector("#chkstatefor"+ii).innerHTML = res;
        let txtaux = document.querySelector("#btnestado"+ii).textContent;
        if(txtaux === "Finalizado"){
            updateList();
        }
    });
}

let verifPed = 0;
function verificarLista() {
    fetch('/pedidos/verificar/lista', { method: 'GET' })
    .then((res) => res.json()).then((res) => {
        console.log(res.length);
        if(res.length !== verifPed){
            updateList();
            verifPed = res.length;
        } 
    });
}

function updateList() {
    fetch('/pedidos/actualizar/lista', { method: 'GET' })
    .then((res) => res.text()).then((res) => {
         document.querySelector("#pedidos_list").innerHTML = res;
    });
}

setInterval(verificarLista, 5000);

