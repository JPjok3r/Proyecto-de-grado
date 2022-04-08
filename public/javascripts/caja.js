function obtenerCamaras(){
    const html5QRcode = new Html5Qrcode("reader");
    Html5Qrcode.getCameras().then(devices => {
        if(devices && devices.length){
            const select = document.querySelector("#cameraselector");
            let valor = "";
            let text = "";
            for(let i = 0; i < devices.length; i++){
                valor = devices[i].id;
                text = devices[i].label;
                const option = document.createElement("option");
                option.value = valor;
                option.text = text;
                select.appendChild(option);
            }
            
        }
    }).catch(err=>{
        console.log(err);
    });
}

document.querySelector("#container-camcanvas").onload = obtenerCamaras();

function scaner(){
    const html5QRcode = new Html5Qrcode("reader");
    let select = document.querySelector("#cameraselector");
    let cameraId = select.options[select.selectedIndex].value;
    html5QRcode.start(
        cameraId,
        {
            fps: 1,
            qrbox: 200
        },
        qrCodeMessage=>{
            //para posible fetch
            html5QRcode.stop().then(ignore=>{
                console.log(qrCodeMessage);
                fetch(`/cajas/facturacion/${qrCodeMessage}`, {method: 'GET'})
                .then((res) => res.text()).then((res) => {
                    document.querySelector("#container-cajas").innerHTML = res;
                });
                console.log("Stopped");
            }).catch(error=>{
                console.log("No se pudo detener" + error);
            });
        },
        errorMessage=>{
            console.log(errorMessage);
        }
    ).catch(err=>{

    });
}

function printFactura(){
    console.log("imprimir");
    window.print();
    /*var printContents = document.querySelector("#printArea").innerHTML;
        w = window.open();
        w.document.write(printContents);
        w.document.close(); // necessary for IE >= 10
        w.focus(); // necessary for IE >= 10
		w.print();
		w.close();
        return true;*/
}