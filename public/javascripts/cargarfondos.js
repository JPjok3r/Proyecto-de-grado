function cargarFondo(){
    let images = ["fondo.png", "fondo1.png", "fondo2.png"];
    //document.querySelector("#background").css({'background-image': `url(/public/images/fondos/${images[Math.floor(Math.random() * images.length)]})`});
    $('#background').css({'background-image': `url(/images/fondos/${images[Math.floor(Math.random() * images.length)]}`});
}