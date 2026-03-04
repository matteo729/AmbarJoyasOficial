// Configuración de Supabase
const SUPABASE_URL = 'https://cvhxhauzvgqpsaacxfcs.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aHhoYXV6dmdxcHNhYWN4ZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzYwNDYsImV4cCI6MjA4ODIxMjA0Nn0.3Nt_O3aS5Ps9JqOYQ-WjTEw1_z06_VyTyyBd8fJmlsc; // Reemplaza con tu key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos del DOM
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const productoForm = document.getElementById('producto-form');
const mensajeToast = document.getElementById('mensaje-toast');

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', verificarSesion);

async function verificarSesion() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Usuario logueado
            loginSection.style.display = 'none';
            adminPanel.style.display = 'block';
            cargarProductosAdmin();
        } else {
            // No logueado
            loginSection.style.display = 'flex';
            adminPanel.style.display = 'none';
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        mostrarToast('¡Bienvenida!', 'success');
        verificarSesion();
    } catch (error) {
        mostrarToast('Error al iniciar sesión: ' + error.message, 'error');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        mostrarToast('Sesión cerrada', 'success');
        verificarSesion();
    } catch (error) {
        mostrarToast('Error al cerrar sesión', 'error');
    }
});

// Agregar producto
productoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const descripcion = document.getElementById('descripcion').value;
    const imagenFile = document.getElementById('imagen').files[0];
    
    if (!imagenFile) {
        mostrarToast('Por favor selecciona una imagen', 'error');
        return;
    }
    
    // Validar tipo de archivo
    if (!imagenFile.type.startsWith('image/')) {
        mostrarToast('El archivo debe ser una imagen', 'error');
        return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (imagenFile.size > 5 * 1024 * 1024) {
        mostrarToast('La imagen no debe superar los 5MB', 'error');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        mostrarToast('Subiendo imagen...', 'success');
        
        // Generar nombre único para la imagen
        const fileExt = imagenFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Subir imagen a Storage
        const { data: imagenData, error: imagenError } = await supabase.storage
            .from('joyas-imagenes')
            .upload(filePath, imagenFile, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (imagenError) {
            console.error('Error subiendo imagen:', imagenError);
            throw new Error('Error al subir la imagen');
        }
        
        // Obtener URL pública de la imagen
        const { data: { publicUrl } } = supabase.storage
            .from('joyas-imagenes')
            .getPublicUrl(filePath);
        
        // Guardar producto en la base de datos
        const { error: productoError } = await supabase
            .from('productos')
            .insert([
                {
                    nombre: nombre,
                    precio: parseFloat(precio),
                    descripcion: descripcion,
                    imagen_url: publicUrl
                }
            ]);
        
        if (productoError) {
            // Si falla, eliminar la imagen subida
            await supabase.storage
                .from('joyas-imagenes')
                .remove([filePath]);
            throw productoError;
        }
        
        mostrarToast('Producto agregado exitosamente', 'success');
        productoForm.reset();
        cargarProductosAdmin();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al agregar el producto: ' + error.message, 'error');
    }
});

// Cargar productos para el admin
async function cargarProductosAdmin() {
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        mostrarProductosAdmin(productos);
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarToast('Error al cargar los productos', 'error');
    }
}

function mostrarProductosAdmin(productos) {
    const lista = document.getElementById('admin-productos-lista');
    
    if (!productos || productos.length === 0) {
        lista.innerHTML = '<p class="sin-productos">No hay productos cargados</p>';
        return;
    }
    
    lista.innerHTML = productos.map(producto => `
        <div class="admin-producto-item" data-id="${producto.id}">
            <img src="${producto.imagen_url}" alt="${producto.nombre}" class="admin-producto-imagen" loading="lazy">
            <div class="admin-producto-info">
                <h3>${producto.nombre}</h3>
                <p>$${parseFloat(producto.precio).toFixed(2)}</p>
                <p class="producto-descripcion">${producto.descripcion}</p>
            </div>
            <div class="admin-producto-acciones">
                <button onclick="editarProducto('${producto.id}')" class="btn-editar">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="eliminarProducto('${producto.id}')" class="btn-eliminar">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// Eliminar producto
window.eliminarProducto = async (id) => {
    if (!confirm('¿Estás segura de que quieres eliminar este producto?')) return;
    
    try {
        // Primero obtener la URL de la imagen para eliminarla del storage
        const { data: producto, error: getError } = await supabase
            .from('productos')
            .select('imagen_url')
            .eq('id', id)
            .single();
        
        if (getError) throw getError;
        
        // Eliminar de la base de datos
        const { error: deleteError } = await supabase
            .from('productos')
            .delete()
            .eq('id', id);
        
        if (deleteError) throw deleteError;
        
        // Eliminar imagen del storage si existe
        if (producto && producto.imagen_url) {
            const urlParts = producto.imagen_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            const { error: storageError } = await supabase.storage
                .from('joyas-imagenes')
                .remove([fileName]);
            
            if (storageError) {
                console.error('Error eliminando imagen:', storageError);
                // No detenemos el flujo si la imagen no se puede eliminar
            }
        }
        
        mostrarToast('Producto eliminado', 'success');
        cargarProductosAdmin();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al eliminar el producto', 'error');
    }
};

// Editar producto
window.editarProducto = async (id) => {
    const nuevaDescripcion = prompt('Ingresa la nueva descripción:');
    
    if (!nuevaDescripcion) return;
    
    try {
        const { error } = await supabase
            .from('productos')
            .update({ descripcion: nuevaDescripcion })
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarToast('Descripción actualizada', 'success');
        cargarProductosAdmin();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al actualizar', 'error');
    }
};

// Mostrar toast
function mostrarToast(mensaje, tipo = 'success') {
    mensajeToast.textContent = mensaje;
    mensajeToast.className = `toast show ${tipo}`;
    
    setTimeout(() => {
        mensajeToast.classList.remove('show');
    }, 3000);

}
