document.addEventListener('DOMContentLoaded', () => {
    const carrito = document.getElementById('carrito');
    const elementos1 = document.getElementById('lista-1');
    const lista = document.querySelector('#lista-carrito-tbody');
    const vaciarCarritoBtn = document.getElementById('vaciar-carrito');

    cargarEventListeners();

    function cargarEventListeners() {
        // Escuchar cuando se haga click en el botón de agregar al carrito
        elementos1.addEventListener('click', comprarElemento);
        // Escuchar cuando se haga click en el carrito para eliminar elementos
        carrito.addEventListener('click', eliminarElemento);
        // Escuchar cuando se haga click en el botón de vaciar carrito
        vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
    }

    function comprarElemento(e) {
        e.preventDefault();
        // Verificar si el click fue sobre el botón de agregar al carrito
        if (e.target.classList.contains('agregar-carrito')) {
            const elemento = e.target.closest('.producto');  // Ajuste para obtener el contenedor del producto
            leerDatosElemento(elemento);
        }
    }

    function leerDatosElemento(elemento) {
        // Extraer los datos del producto seleccionado
        const infoElemento = {
            imagen: elemento.querySelector('img').src,
            titulo: elemento.querySelector('h3').textContent,
            precio: elemento.querySelector('.precio').textContent,
            id: elemento.querySelector('a').getAttribute('data-id')
        };
        insertarCarrito(infoElemento);
    }

    function insertarCarrito(elemento) {
        // Crear una fila para agregar el producto al carrito
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${elemento.imagen}" width="100" /></td>
            <td>${elemento.titulo}</td>
            <td>${elemento.precio}</td>
            <td><a href="#" class="borrar" data-id="${elemento.id}">X</a></td>
        `;
        lista.appendChild(row);
    }

    function eliminarElemento(e) {
        e.preventDefault();
        // Verificar si el click fue sobre el botón de eliminar producto
        if (e.target.classList.contains('borrar')) {
            // Eliminar el producto del carrito
            const productoId = e.target.getAttribute('data-id');
            e.target.closest('tr').remove();
            // Aquí puedes agregar lógica para actualizar el carrito si usas almacenamiento local
        }
    }

    function vaciarCarrito() {
        // Eliminar todos los productos del carrito
        while (lista.firstChild) {
            lista.removeChild(lista.firstChild);
        }
        // Si usas almacenamiento local, también puedes limpiar ahí el carrito
    }
});