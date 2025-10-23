// Inicializar productos desde localStorage
let productos = JSON.parse(localStorage.getItem('productos')) || [];

// Clase para manejar productos
class ProductManager {
    static validateProduct(nombre, cantidad, precio, impuesto) {
        const errors = [];

        if (!nombre) errors.push("El nombre es obligatorio");
        if (isNaN(cantidad) || cantidad <= 0) errors.push("La cantidad debe ser un número mayor a 0");
        if (isNaN(precio) || precio <= 0) errors.push("El precio debe ser un número mayor a 0");
        if (isNaN(impuesto) || impuesto < 0) errors.push("El impuesto debe ser un número no negativo");
        if (ProductManager.productExists(nombre)) errors.push("Ya existe un producto con ese nombre");

        return errors;
    }

    static productExists(nombre) {
        return productos.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    }

    static addProduct(nombre, cantidad, precio, impuesto) {
        const id = Date.now();
        const tasaImpuesto = impuesto / 100;
        const precioTotalUnitario = precio * (1 + tasaImpuesto);

        const producto = {
            id,
            nombre,
            cantidad,
            precioBase: precio,
            impuesto,
            precioTotal: precioTotalUnitario
        };

        productos.push(producto);
        localStorage.setItem('productos', JSON.stringify(productos));
        return producto;
    }

    static removeProduct(id) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('productos', JSON.stringify(productos));
    }

    static clearAll() {
        productos = [];
        localStorage.removeItem('productos');
    }
}

// Mostrar mensajes en pantalla
function showMessage(message, isError = false) {
    const mensajeError = document.getElementById('mensajeError');
    mensajeError.textContent = message;
    mensajeError.className = isError ? 'error' : 'success';

    setTimeout(() => {
        mensajeError.textContent = "";
        mensajeError.className = '';
    }, 3000);
}

// Evento para guardar producto
document.getElementById('productForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const precio = parseFloat(document.getElementById('precio').value);
    const impuesto = parseFloat(document.getElementById('impuesto').value);

    const errors = ProductManager.validateProduct(nombre, cantidad, precio, impuesto);
    if (errors.length > 0) {
        showMessage(errors.join('. '), true);
        return;
    }

    try {
        ProductManager.addProduct(nombre, cantidad, precio, impuesto);
        showMessage("Producto guardado correctamente", false);
        this.reset();
        mostrarProductos();
    } catch {
        showMessage("Error al guardar el producto", true);
    }
});

// Mostrar productos en tabla
function mostrarProductos() {
    const tabla = document.querySelector('#tablaProductos tbody');
    tabla.innerHTML = "";

    if (productos.length === 0) {
        const fila = document.createElement('tr');
        fila.innerHTML = '<td colspan="6" style="text-align: center; color: #666;">No hay productos registrados</td>';
        tabla.appendChild(fila);
        return;
    }

    let totalGeneralSinImpuesto = 0;
    let totalGeneralConImpuesto = 0;

    productos.forEach(p => {
        const subtotalBase = p.cantidad * p.precioBase;
        const subtotalTotal = p.cantidad * p.precioTotal;
        totalGeneralSinImpuesto += subtotalBase;
        totalGeneralConImpuesto += subtotalTotal;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>$${p.precioBase.toFixed(2)}</td>
            <td>${p.impuesto.toFixed(2)}%</td>
            <td>$${p.precioTotal.toFixed(2)}</td>
            <td><button onclick="eliminarProducto(${p.id})" class="btn-eliminar">🗑️ Eliminar</button></td>
        `;
        tabla.appendChild(fila);
    });

    const filaSubtotal = document.createElement('tr');
    filaSubtotal.innerHTML = `
        <td colspan="2"><strong>SUBTOTAL SIN IMPUESTO:</strong></td>
        <td><strong>$${totalGeneralSinImpuesto.toFixed(2)}</strong></td>
        <td colspan="3"></td>
    `;
    filaSubtotal.style.backgroundColor = '#e0e0e0';
    tabla.appendChild(filaSubtotal);

    const filaTotalimpuesto = document.createElement('tr');
    filaTotalimpuesto.innerHTML = `
        <td colspan="4"><strong>TOTAL CON IMPUESTO:</strong></td>
        <td><strong>$${totalGeneralConImpuesto.toFixed(2)}</strong></td>
        <td></td>
    `;
    filaTotalimpuesto.style.backgroundColor = '#c0c0c0';
    tabla.appendChild(filaTotalimpuesto);
}

// Eliminar producto
function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        ProductManager.removeProduct(id);
        mostrarProductos();
        showMessage("Producto eliminado correctamente", false);
    }
}

// Limpiar todos
function limpiarTodos() {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los productos?')) {
        ProductManager.clearAll();
        mostrarProductos();
        showMessage("Todos los productos han sido eliminados", false);
    }
}

// Descargar archivo .txt
function descargarArchivo() {
    if (productos.length === 0) {
        showMessage("No hay productos para descargar", true);
        return;
    }

    let contenido = "Nombre\tCantidad\tPrecio Base\tImpuesto (%)\tPrecio Total (x Ud.)\tSubtotal Total\n";
    let totalGeneral = 0;

    productos.forEach(p => {
        const subtotalTotal = p.cantidad * p.precioTotal;
        totalGeneral += subtotalTotal;
        contenido += `${p.nombre}\t${p.cantidad}\t$${p.precioBase.toFixed(2)}\t${p.impuesto.toFixed(2)}%\t$${p.precioTotal.toFixed(2)}\t$${subtotalTotal.toFixed(2)}\n`;
    });

    contenido += `\nTOTAL CON IMPUESTO:\t\t\t\t\t$${totalGeneral.toFixed(2)}`;

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `productos_${new Date().toISOString().split('T')[0]}.txt`;
    enlace.click();

    showMessage("Archivo descargado correctamente", false);
}

// Inicializar tabla al cargar
document.addEventListener('DOMContentLoaded', mostrarProductos);
