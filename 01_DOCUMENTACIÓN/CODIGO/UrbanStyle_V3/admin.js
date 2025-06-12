import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// 🔐 Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCK0U80c0G17eGxJiMBH4HACR0gpeQkUko",
  authDomain: "urbanshop-39d8c.firebaseapp.com",
  databaseURL: "https://urbanshop-39d8c-default-rtdb.firebaseio.com",
  projectId: "urbanshop-39d8c",
  storageBucket: "urbanshop-39d8c.appspot.com",
  messagingSenderId: "907363889049",
  appId: "1:907363889049:web:ce2f808f067beacd6f2d08"
};

// 🔧 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔄 Mostrar clientes
const listaClientes = document.getElementById('listaClientes');
onValue(dbRef(db, "clientes"), (snapshot) => {
  const data = snapshot.val();
  listaClientes.innerHTML = '';
  if (data) {
    Object.entries(data).forEach(([id, cliente]) => {
      listaClientes.innerHTML += `
        <div class="item">
          <h4>${cliente.nombre}</h4>
          <p>Email: ${cliente.email}</p>
          <p>Productos: ${cliente.carrito?.map(p => `${p.nombre} x${p.cantidad}`).join(', ')}</p>
          <p>Total gastado: $${cliente.totalGastado}</p>
          <p>Fecha: ${new Date(cliente.fecha).toLocaleString()}</p>
        </div>
      `;
    });
  } else {
    listaClientes.innerHTML = '<p>No hay clientes aún.</p>';
  }
});

// 🛒 Mostrar inventario
const listaInventario = document.getElementById('listaInventario');
onValue(dbRef(db, "inventario"), (snapshot) => {
  const data = snapshot.val();
  listaInventario.innerHTML = '';
  if (data) {
    Object.entries(data).forEach(([id, producto]) => {
      listaInventario.innerHTML += `
        <div class="item">
          <h4>${producto.nombre}</h4>
          <p>Precio: $${producto.precio}</p>
          <p>Stock: ${producto.stock}</p>
          <button onclick="sumarStock('${id}', ${producto.stock})">➕ Agregar stock</button>
          <button onclick="eliminarProducto('${id}')">🗑 Eliminar</button>
        </div>
      `;
    });
  } else {
    listaInventario.innerHTML = '<p>No hay productos en inventario.</p>';
  }
});

// ➕ Función para sumar stock
window.sumarStock = function(id, stockActual) {
  Swal.fire({
    title: '¿Cuántos quieres agregar?',
    input: 'number',
    inputAttributes: {
      min: 1
    },
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      const nuevoStock = stockActual + parseInt(result.value);
      update(dbRef(db, `inventario/${id}`), { stock: nuevoStock })
        .then(() => {
          Swal.fire('Éxito', 'Stock actualizado', 'success');
        })
        .catch((err) => {
          Swal.fire('Error', err.message, 'error');
        });
    }
  });
};

// ❌ Eliminar producto
window.eliminarProducto = function(id) {
  Swal.fire({
    title: '¿Eliminar este producto?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      remove(dbRef(db, `inventario/${id}`))
        .then(() => Swal.fire('Eliminado', 'Producto eliminado', 'success'))
        .catch((err) => Swal.fire('Error', err.message, 'error'));
    }
  });
};

// ✅ Agregar nuevo producto
const form = document.getElementById("formProducto");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const precio = parseFloat(document.getElementById("precio").value);
  const stock = parseInt(document.getElementById("stock").value);

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    Swal.fire("Campos incompletos", "Completa todos los campos", "warning");
    return;
  }

  try {
    await push(dbRef(db, "inventario"), {
      nombre,
      precio,
      stock
    });
    form.reset();
    Swal.fire("Producto agregado", "El producto se guardó correctamente", "success");
  } catch (error) {
    console.error("Error al agregar producto:", error);
    Swal.fire("Error", "No se pudo guardar el producto", "error");
  }
});
