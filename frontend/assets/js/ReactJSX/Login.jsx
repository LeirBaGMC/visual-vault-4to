const { useState } = React;

function LoginForm() {
    // 1. Estados
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    // 2. Función de envío
    const manejarLogin = async (evento) => {
        evento.preventDefault();
        setCargando(true);
        setError(null);

        // ⚠️ El estándar OAuth2 requiere que los datos se empaqueten de esta manera específica
        const datosFormulario = new URLSearchParams();
        datosFormulario.append("username", email); // FastAPI espera que el campo se llame 'username' aunque enviemos el correo
        datosFormulario.append("password", password);

        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/v1/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded" // 👈 Formato especial de seguridad
                },
                body: datosFormulario
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Código 200: ¡Éxito!
                
                // 3. GUARDAMOS EL TOKEN EN LA BÓVEDA DEL NAVEGADOR (LocalStorage)
                localStorage.setItem("token_vv", datos.access_token);
                localStorage.setItem("usuario_nombre", datos.username);
                localStorage.setItem("usuario_id", datos.usuario_id);

                // 4. Redirigimos a la pantalla principal
                window.location.href = "index.html";
            } else {
                // Código 401: Contraseña o correo incorrectos
                setError(datos.detail || "Credenciales incorrectas. Intenta de nuevo.");
            }
        } catch (err) {
            setError("Error de conexión. Revisa que FastAPI esté encendido.");
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    // 5. Interfaz
    return (
        <form onSubmit={manejarLogin} className="auth-form" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* Alerta de Error */}
            {error && (
                <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                    type="email"
                    id="email"
                    required
                    placeholder="tu_correo@uide.edu.ec"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                    type="password"
                    id="password"
                    required
                    placeholder="Escribe tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={cargando} style={{ opacity: cargando ? 0.7 : 1, marginTop: '10px' }}>
                {cargando ? 'Desbloqueando bóveda...' : 'Iniciar Sesión'}
            </button>
        </form>
    );
}

const rootElement = document.getElementById('react-login-root');
const root = ReactDOM.createRoot(rootElement);
root.render(<LoginForm />);