// Configuración de Supabase
const SUPABASE_URL = 'https://cvhxhaavzqgpsaacxfcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aHhoYXV6dmdxcHNhYWN4ZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzYwNDYsImV4cCI6MjA4ODIxMjA0Nn0.3Nt_O3aS5Ps9JqOYQ-WjTEw1_z06_VyTyyBd8fJmlsc'; // ¡REEMPLAZA con tu clave completa!

// Verificar que Supabase está disponible
if (typeof window.supabase === 'undefined') {
    console.error('Error: Supabase no está cargado');
    document.addEventListener('DOMContentLoaded', () => {
        mostrarToast('Error: No se pudo cargar Supabase', 'error');
    });
} else {
    console.log('Supabase cargado correctamente');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos del DOM
let loginSection, adminPanel, loginForm, logoutBtn, productoForm, mensajeToast;
let emailInput, passwordInput, loginError, submitBtn;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando admin...');
    
    // Obtener referencias a elementos del DOM
    loginSection = document.getElementById('login-section');
    adminPanel = document.getElementById('admin-panel');
    loginForm = document.getElementById('login-form');
    logoutBtn = document.getElementById('logout-btn');
    productoForm = document.getElementById('producto-form');
    mensajeToast = document.getElementById('mensaje-toast');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    loginError = document.getElementById('login-error');
    submitBtn = document.getElementById('submit-producto');

    // Verificar que los elementos existen
    console.log('Elementos encontrados:', {
        loginSection: !!loginSection,
        adminPanel: !!adminPanel,
        loginForm: !!loginForm,
        logoutBtn: !!logoutBtn,
        productoForm: !!productoForm
    });

    // Verificar sesión al cargar
    verificarSesion();

    // Event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login form listener agregado');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (productoForm) {
        productoForm.addEventListener('submit', handleAddProduct);
    }

    // Preview de imagen
    const imagenInput = document.getElementById('imagen');
    if (imagenInput) {
        imagenInput.addEventListener('change', previewImagen);
    }
});

// Función para verificar sesión
async function verificarSesion() {
    try {
        console.log('Verificando sesión...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error al verificar sesión:', error);
            throw error;
        }
        
        console.log('Sesión:', session ? 'Activa' : 'Inactiva');
        
        if (session) {
            // Usuario logueado
            if (loginSection) loginSection.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            
            console.log('Usuario logueado:', session.user.email);
            cargarProductosAdmin();
        } else {
            // No logueado
            if (loginSection) loginSection.style.display = 'flex';
            if (adminPanel) adminPanel.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            console.log('No hay sesión activa');
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        mostrarToast('Error al verificar sesión', 'error');
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput ? emailInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    
    console.log('Intentando login con email:', email);
    
    if (!email || !password) {
        mostrarToast('Por favor ingresa email y contraseña', 'error');
        return;
    }
    
    // Deshabilitar botón mientras procesa
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Error de login:', error);
            throw error;
        }
        
        console.log('Login exitoso:', data);
        mostrarToast('¡Bienvenida!', 'success');
        
        // Limpiar formulario
        if (loginForm) loginForm.reset();
        if (loginError) loginError.style.display = 'none';
        
        // Actualizar UI
        await verificarSesion();
        
    } catch (error) {
        console.error('Error en login:', error);
        
        let mensajeError = 'Error al iniciar sesión';
        if (error.message.includes('Invalid login credentials')) {
            mensajeError = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
            mensajeError = 'Por favor confirma tu email primero';
        } else if (error.message.includes('Invalid API key')) {
            mensajeError = 'Error de configuración: API key inválida';
        }
        
        if (loginError) {
            loginError.textContent = mensajeError;
            loginError.style.display = 'block';
        }
        
        mostrarToast(mensajeError, 'error');
    } finally {
        // Rehabilitar botón
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        }
    }
}

// Manejar logout
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        mostrarToast('Sesión cerrada', 'success');
        await verificarSesion();
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        mostrarToast('Error al cerrar sesión', 'error');
    }
}

// Preview de imagen
function previewImagen(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagen-preview');
    const previewImg = preview ? preview.querySelector('img') : null;
    
    if (file && preview && previewImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Agregar producto
async function handleAddProduct(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre')?.value;
    const precio = document.getElementById('precio')?.value;
    const descripcion = document.getElementById('descripcion')?.value;
    const imagenFile = document.getElementById('imagen')?.files[0];
    
    if (!nombre || !precio || !descripcion || !imagenFile) {
        mostrarToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!imagenFile.type.startsWith('image/')) {
        mostrarToast('El archivo debe ser una imagen', 'error');
        return;
    }
    
    if (imagenFile.size > 5 * 1024 * 1024) {
        mostrarToast('La imagen no debe superar los 5MB', 'error');
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('No hay sesión activa');
        }
        
        const fileExt = imagenFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        console.log('Subiendo imagen:', fileName);
        
        const { data: imagenData, error: imagenError } = await supabase.storage
            .from('joyas-imagenes')
            .upload(fileName, imagenFile, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (imagenError) {
            console.error('Error subiendo imagen:', imagenError);
            throw new Error('Error al subir la imagen');
        }
        
        const { data: { publicUrl } } = supabase.storage
            .from('joyas-imagenes')
            .getPublicUrl(fileName);
        
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
            await supabase.storage.from('joyas-imagenes').remove([fileName]);
            throw productoError;
        }
        
        mostrarToast('Producto agregado exitosamente', 'success');
        
        if (productoForm) productoForm.reset();
        if (preview) preview.style.display = 'none';
        
        await cargarProductosAdmin();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error: ' + error.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Agregar Producto';
        }
    }
}

// Cargar productos
async function cargarProductosAdmin() {
    const lista = document.getElementById('admin-productos-lista');
    if (!lista) return;
    
    try {
        lista.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</div>';
        
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!productos || productos.length === 0) {
            lista.innerHTML = '<p class="sin-productos">No hay productos cargados</p>';
            return;
        }
        
        lista.innerHTML = productos.map(producto => `
            <div class="admin-producto-item" data-id="${producto.id}">
                <img src="${producto.imagen_url}" alt="${producto.nombre}" class="admin-producto-imagen" loading="lazy">
                <div class="admin-producto-info">
                    <h3>${producto.nombre}</h3>
                    <p class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</p>
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
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        lista.innerHTML = '<p class="sin-productos error">Error al cargar los productos</p>';
    }
}

// Eliminar producto
window.eliminarProducto = async (id) => {
    if (!confirm('¿Estás segura de que quieres eliminar este producto?')) return;
    
    try {
        const { data: producto, error: getError } = await supabase
            .from('productos')
            .select('imagen_url')
            .eq('id', id)
            .single();
        
        if (getError) throw getError;
        
        const { error: deleteError } = await supabase
            .from('productos')
            .delete()
            .eq('id', id);
        
        if (deleteError) throw deleteError;
        
        if (producto && producto.imagen_url) {
            const fileName = producto.imagen_url.split('/').pop();
            await supabase.storage.from('joyas-imagenes').remove([fileName]);
        }
        
        mostrarToast('Producto eliminado', 'success');
        await cargarProductosAdmin();
        
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
        await cargarProductosAdmin();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al actualizar', 'error');
    }
};

// Mostrar toast
function mostrarToast(mensaje, tipo = 'success') {
    if (!mensajeToast) return;
    
    mensajeToast.textContent = mensaje;
    mensajeToast.className = `toast show ${tipo}`;
    
    setTimeout(() => {
        mensajeToast.classList.remove('show');
    }, 3000);
}
