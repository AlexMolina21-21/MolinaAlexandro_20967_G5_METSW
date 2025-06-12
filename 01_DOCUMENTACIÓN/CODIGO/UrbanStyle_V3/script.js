import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCK0U80c0G17eGxJiMBH4HACR0gpeQkUko",
    authDomain: "urbanshop-39d8c.firebaseapp.com",
    databaseURL: "https://urbanshop-39d8c-default-rtdb.firebaseio.com",
    projectId: "urbanshop-39d8c",
    storageBucket: "urbanshop-39d8c.appspot.com",
    messagingSenderId: "907363889049",
    appId: "1:907363889049:web:ce2f808f067beacd6f2d08"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Carrito
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function mostrarCarrito() {
    const container = document.getElementById('carrito');
    if (!container) return;
    container.innerHTML = '<h2>Productos en tu carrito:</h2>';
    let total = 0;

    if (carrito.length === 0) {
        container.innerHTML += '<p>El carrito está vacío.</p>';
    } else {
        carrito.forEach((producto, index) => {
            let subtotal = producto.precio * producto.cantidad;
            container.innerHTML += `
                <div class="item-carrito">
                    <p>${producto.nombre} x ${producto.cantidad} = $${subtotal}</p>
                    <button onclick="aumentarCantidad(${index})">+</button>
                    <button onclick="disminuirCantidad(${index})">-</button>
                    <button onclick="eliminarProducto(${index})">Eliminar</button>
                </div>
            `;
            total += subtotal;
        });

        container.innerHTML += `<h3>Total a pagar: $${total}</h3>`;
    }

    if (document.getElementById('paypal-button-container')) {
        document.getElementById('paypal-button-container').style.display = carrito.length > 0 ? 'block' : 'none';
    }
}

function agregarAlCarrito(nombre, precio) {
    let existente = carrito.find(p => p.nombre === nombre);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ nombre, precio, cantidad: 1 });
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
    mostrarMensaje(`${nombre} agregado al carrito`, 'success');
}

function aumentarCantidad(indice) {
    carrito[indice].cantidad++;
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
}

function disminuirCantidad(indice) {
    if (carrito[indice].cantidad > 1) {
        carrito[indice].cantidad--;
    } else {
        carrito.splice(indice, 1);
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
}

function eliminarProducto(indice) {
    carrito.splice(indice, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
}

function limpiarCarrito() {
    carrito = [];
    localStorage.removeItem('carrito');
    mostrarCarrito();
}

// ✅ GUARDAR COMPRA + VALIDAR Y RESTAR STOCK
async function guardarCompra() {
    const nombre = document.getElementById('nombreCliente').value;
    const email = document.getElementById('emailCliente').value;

    if (!nombre || !email) {
        mostrarMensaje('Por favor, completa todos los campos.', 'error');
        return;
    }

    if (carrito.length === 0) {
        mostrarMensaje('Tu carrito está vacío.', 'error');
        return;
    }

    // Obtener inventario completo
    const snapshot = await get(ref(db, 'inventario'));
    const inventario = snapshot.val();

    // Convertimos en array de [id, producto]
    const inventarioArray = Object.entries(inventario || {});

    // Validamos stock
    for (const item of carrito) {
        const productoEncontrado = inventarioArray.find(([id, prod]) => prod.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim());
        if (!productoEncontrado) {
            mostrarMensaje(`Producto "${item.nombre}" no encontrado en inventario.`, 'error');
            return;
        }
        const [id, prod] = productoEncontrado;
        if (item.cantidad > prod.stock) {
            mostrarMensaje(`No hay suficiente stock para "${item.nombre}".`, 'error');
            return;
        }
    }

    // Guardar cliente
    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    await push(ref(db, 'clientes'), {
        nombre,
        email,
        carrito,
        totalGastado: total,
        fecha: new Date().toISOString()
    });

    // Actualizar stock
    for (const item of carrito) {
        const productoEncontrado = inventarioArray.find(([id, prod]) => prod.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim());
        if (productoEncontrado) {
            const [id, prod] = productoEncontrado;
            const nuevoStock = prod.stock - item.cantidad;
            await set(ref(db, `inventario/${id}/stock`), nuevoStock);
        }
    }

    mostrarMensaje(`Compra registrada. Gracias, ${nombre}.`, 'success');
    limpiarCarrito();
}


async function verificarStockAntesDeComprar() {
    for (let item of carrito) {
        const clave = item.nombre.trim().toLowerCase();
        const snapshot = await get(ref(db, 'inventario/' + clave));

        if (!snapshot.exists()) {
            mostrarMensaje(`Producto "${item.nombre}" no encontrado en inventario.`, 'error');
            return false;
        }

        const productoEnDB = snapshot.val();

        if (productoEnDB.stock < item.cantidad) {
            mostrarMensaje(`No hay suficiente stock para "${item.nombre}". Solo quedan ${productoEnDB.stock}.`, 'error');
            return false;
        }
    }
    return true;
}

async function actualizarStockEnFirebase() {
    for (let item of carrito) {
        const clave = item.nombre.trim().toLowerCase();
        const snapshot = await get(ref(db, 'inventario/' + clave));

        if (snapshot.exists()) {
            const productoEnDB = snapshot.val();
            const nuevoStock = productoEnDB.stock - item.cantidad;

            await set(ref(db, 'inventario/' + clave), {
                ...productoEnDB,
                stock: nuevoStock
            });
        }
    }
}

function mostrarMensaje(mensaje, tipo = 'info') {
    const div = document.createElement('div');
    div.className = `mensaje ${tipo}`;
    div.innerText = mensaje;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// PayPal
if (document.getElementById('paypal-button-container')) {
    paypal.Buttons({
        createOrder: function(data, actions) {
            let total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
            if (carrito.length === 0) {
                mostrarMensaje('Tu carrito está vacío', 'error');
                return actions.reject();
            }

            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2)
                    },
                    description: 'Compra en Urban Shop'
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                mostrarMensaje(`Pago completado por ${details.payer.name.given_name}`, 'success');
                limpiarCarrito();
            });
        },
        onError: function(err) {
            console.error(err);
            mostrarMensaje('Error en PayPal', 'error');
        }
    }).render('#paypal-button-container');
}

if (document.getElementById('carrito')) {
    mostrarCarrito();
}

// Exponer funciones
window.agregarAlCarrito = agregarAlCarrito;
window.aumentarCantidad = aumentarCantidad;
window.disminuirCantidad = disminuirCantidad;
window.eliminarProducto = eliminarProducto;
window.limpiarCarrito = limpiarCarrito;
window.guardarCompra = guardarCompra;
