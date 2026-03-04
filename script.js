// Configuración de Supabase
const SUPABASE_URL = 'https://cvhxhauzvgqpsaacxfcs.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aHhoYXV6dmdxcHNhYWN4ZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzYwNDYsImV4cCI6MjA4ODIxMjA0Nn0.3Nt_O3aS5Ps9JqOYQ-WjTEw1_z06_VyTyyBd8fJmlsc'; // Reemplaza con tu key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Número de WhatsApp de la dueña (reemplazar con el número real)
const WHATSAPP_NUMBER = '5491112345678'; // Formato: código de país + número sin +

// Carrito de compras
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Elementos del DOM
const carritoIcono = document.getElementById('carrito-icono');
const carritoModal = document.getElementById('carrito-modal');
const closeModal = document.querySelector('.close-modal');
const carritoItems = document.getElementById('carrito-items');
const carritoTotal = document.getElementById('carrito-total');
const carritoContador = document.getElementById('carrito-contador');
const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
const ordenarPedidoBtn = document.getElementById('ordenar-pedido');
const clienteForm = document.getElementById('cliente-form');
const inputsCliente = {
    nombre: document.getElementById('cliente-nombre'),
    email: document.getElementById('cliente-email'),
    telefono: document.getElementById('cliente-telefono')
};

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarContadorCarrito();
    actualizarBotonOrdenar();
});

// Event listeners para el carrito
carritoIcono.addEventListener('click', abrirCarrito);
closeModal.addEventListener('click', cerrarCarrito);
vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
ordenarPedidoBtn.addEventListener('click', enviarPorWhatsApp);

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target === carritoModal) {
        cerrarCarrito();
    }
});

// Validar formulario en tiempo real
Object.values(inputsCliente).forEach(input => {
    input.addEventListener('input', actualizarBotonOrdenar);
});

// Funciones del carrito
function abrirCarrito() {
    carritoModal.style.display = 'block';
    mostrarCarrito();
}

function cerrarCarrito() {
    carritoModal.style.display = 'none';
}

function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    carritoContador.textContent = totalItems;
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarBotonOrdenar() {
    const nombreValido = inputsCliente.nombre.value.trim().length > 0;
    const emailValido = inputsCliente.email.value.trim().length > 0 && 
                        inputsCliente.email.value.includes('@');
    const telefonoValido = inputsCliente.telefono.value.trim().length > 0;
    const carritoValido = carrito.length > 0;
    
    ordenarPedidoBtn.disabled = !(nombreValido && emailValido && telefonoValido && carritoValido);
}

function mostrarCarrito() {
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<p class="sin-productos">Tu carrito está vacío</p>';
        carritoTotal.textContent = '0.00';
        return;
    }

    carritoItems.innerHTML = carrito.map((item, index) => `
        <div class="carrito-item">
            <img src="${item.imagen}" alt="${item.nombre}" class="carrito-item-imagen">
            <div class="carrito-item-info">
                <div class="carrito-item-nombre">${item.nombre}</div>
                <div class="carrito-item-precio">$${item.precio.toFixed(2)} c/u</div>
                <div class="carrito-item-cantidad">
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span class="cantidad-numero">${item.cantidad}</span>
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
            </div>
            <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    carritoTotal.textContent = total.toFixed(2);
}

// Funciones globales para los botones del carrito
window.cambiarCantidad = (index, cambio) => {
    const nuevaCantidad = carrito[index].cantidad + cambio;
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(index);
    } else {
        carrito[index].cantidad = nuevaCantidad;
        actualizarContadorCarrito();
        mostrarCarrito();
        actualizarBotonOrdenar();
    }
};

window.eliminarDelCarrito = (index) => {
    carrito.splice(index, 1);
    actualizarContadorCarrito();
    mostrarCarrito();
    actualizarBotonOrdenar();
    
    if (carrito.length === 0) {
        mostrarCarrito();
    }
    
    mostrarToast('Producto eliminado del carrito');
};

function vaciarCarrito() {
    if (confirm('¿Estás segura de que quieres vaciar el carrito?')) {
        carrito = [];
        actualizarContadorCarrito();
        mostrarCarrito();
        actualizarBotonOrdenar();
        mostrarToast('Carrito vaciado');
    }
}

function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id === producto.id);
    
    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen_url,
            cantidad: 1
        });
    }
    
    actualizarContadorCarrito();
    mostrarToast('Producto agregado al carrito');
}

// Función para enviar por WhatsApp
function enviarPorWhatsApp() {
    if (!validarFormulario()) return;
    
    const nombre = inputsCliente.nombre.value.trim();
    const email = inputsCliente.email.value.trim();
    const telefono = inputsCliente.telefono.value.trim();
    
    // Crear mensaje
    let mensaje = `🛍️ *NUEVO PEDIDO - ÁMBAR JOYAS* 🛍️\n\n`;
    mensaje += `👤 *Cliente:* ${nombre}\n`;
    mensaje += `📧 *Email:* ${email}\n`;
    mensaje += `📱 *Teléfono:* ${telefono}\n\n`;
    mensaje += `*PRODUCTOS SOLICITADOS:*\n`;
    
    let total = 0;
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `• ${item.cantidad}x ${item.nombre} - $${item.precio.toFixed(2)} c/u = $${subtotal.toFixed(2)}\n`;
    });
    
    mensaje += `\n💰 *TOTAL:* $${total.toFixed(2)} 💰\n\n`;
    mensaje += `¡Gracias por tu compra! Te contactaremos a la brevedad. ✨`;
    
    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Abrir WhatsApp
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCodificado}`, '_blank');
    
    // Vaciar carrito después del pedido
    setTimeout(() => {
        if (confirm('¿Deseas vaciar el carrito?')) {
            vaciarCarrito();
            cerrarCarrito();
            
            // Limpiar formulario
            inputsCliente.nombre.value = '';
            inputsCliente.email.value = '';
            inputsCliente.telefono.value = '';
        }
    }, 1000);
}

function validarFormulario() {
    let valido = true;
    const errores = [];
    
    if (!inputsCliente.nombre.value.trim()) {
        errores.push('Nombre y apellido');
        valido = false;
    }
    
    if (!inputsCliente.email.value.trim() || !inputsCliente.email.value.includes('@')) {
        errores.push('Email válido');
        valido = false;
    }
    
    if (!inputsCliente.telefono.value.trim()) {
        errores.push('Teléfono');
        valido = false;
    }
    
    if (carrito.length === 0) {
        errores.push('Agregar productos al carrito');
        valido = false;
    }
    
    if (!valido) {
        mostrarToast('Completa: ' + errores.join(', '), 'error');
    }
    
    return valido;
}

// Funciones de productos
async function cargarProductos() {
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        mostrarProductos(productos);
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarToast('Error al cargar los productos', 'error');
    }
}

function mostrarProductos(productos) {
    const grid = document.getElementById('productos-grid');
    
    if (!productos || productos.length === 0) {
        grid.innerHTML = `
            <div class="sin-productos">
                <p>✨ Próximamente nuevos ingresos ✨</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = productos.map(producto => `
        <div class="producto-card">
            <img src="${producto.imagen_url}" alt="${producto.nombre}" class="producto-imagen">
            <div class="producto-info">
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</p>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <button class="btn-agregar-carrito" onclick="agregarAlCarrito(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                    <i class="fas fa-cart-plus"></i> Agregar al carrito
                </button>
            </div>
        </div>
    `).join('');
}

// Toast notifications
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('mensaje-toast');
    toast.textContent = mensaje;
    toast.className = `toast show ${tipo}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);

}
