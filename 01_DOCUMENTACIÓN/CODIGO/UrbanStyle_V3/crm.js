import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Tu configuración real
const firebaseConfig = {
    apiKey: "AIzaSyCK0U80c0G17eGxJiMBH4HACR0gpeQkUko",
    authDomain: "urbanshop-39d8c.firebaseapp.com",
    databaseURL: "https://urbanshop-39d8c-default-rtdb.firebaseio.com",
    projectId: "urbanshop-39d8c",
    storageBucket: "urbanshop-39d8c.appspot.com",
    messagingSenderId: "907363889049",
    appId: "1:907363889049:web:ce2f808f067beacd6f2d08"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Guardar compra
function guardarCompra() {
    let nombre = document.getElementById('nombreCliente').value;
    let email = document.getElementById('emailCliente').value;
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (!nombre || !email) {
        alert('Completa tus datos');
        return;
    }

    // Calculamos total del carrito
    let total = carrito.reduce((acc, item) => acc + item.precio, 0);

    // Guardar en base de datos
    push(ref(db, 'clientes'), {
        nombre: nombre,
        email: email,
        carrito: carrito,
        totalGastado: total,
        fecha: new Date().toISOString()
    });

    alert('Compra registrada en CRM');
    localStorage.clear();
    window.location.href = 'index.html';
}

// Mostrar clientes en admin.html
if (document.getElementById('clientes')) {
    const clientesRef = ref(db, 'clientes');
    onValue(clientesRef, (snapshot) => {
        let datos = snapshot.val();
        let html = "";
        for (let id in datos) {
            html += `<p><strong>${datos[id].nombre}</strong> - ${datos[id].email}<br>`;
            html += `Productos:<ul>`;
            datos[id].carrito.forEach(p => {
                let subtotal = p.precio * p.cantidad;
                html += `<li>${p.nombre} - $${p.precio} x ${p.cantidad} = <strong>$${subtotal}</strong></li>`;
            });
            html += `</ul>`;
            html += `Total gastado: <strong>$${datos[id].totalGastado}</strong><br>`;
            html += `Fecha: ${new Date(datos[id].fecha).toLocaleString()}</p><hr>`;
        }
        document.getElementById('clientes').innerHTML = html;
    });
}

