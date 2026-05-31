const { useState } = React;

function RegisterForm() {
    // Estados del formulario
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [termsAgree, setTermsAgree] = useState(false);
    
    // Estados de UI
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    const manejarRegistro = async (evento) => {
        evento.preventDefault();
        
        if (!termsAgree) {
            setError("Debes aceptar las políticas para continuar.");
            return;
        }

        setCargando(true);
        setError(null);

        // Armamos el paquete incluyendo la fecha de nacimiento
        const paqueteDatos = {
            username: username,
            email: email,
            password: password,
            birthdate: birthdate 
        };

        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/v1/users/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paqueteDatos)
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                setExito(true);
                setTimeout(() => window.location.href = "login.html", 5000);
            } else {
                setError(datos.detail || "Error al crear la cuenta.");
            }
        } catch (err) {
            setError("Error de conexión. Revisa que FastAPI esté encendido.");
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    if (exito) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-primary)' }}>
                <h3>¡Bóveda creada con éxito! 🔐</h3>
                <p>Preparando entorno seguro...</p>
            </div>
        );
    }

    return (
        <form onSubmit={manejarRegistro} className="auth-form" noValidate>
            
            {/* Alerta de Error General */}
            {error && (
                <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="username">Nombre de usuario único</label>
                <input
                    type="text"
                    id="username"
                    required
                    aria-required="true"
                    aria-describedby="username-hint"
                    placeholder="ej. gabo_minda_cto"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <small id="username-hint" className="field-hint">Solo letras, números y guiones bajos.</small>
            </div>

            <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                    type="email"
                    id="email"
                    required
                    aria-required="true"
                    placeholder="tu_correo@uide.edu.ec"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                    type="password"
                    id="password"
                    required
                    aria-required="true"
                    aria-describedby="password-hint"
                    placeholder="Crea una contraseña segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <small id="password-hint" className="field-hint">Mínimo 12 caracteres, mayúscula, minúscula, número y símbolo.</small>
            </div>

            <div className="form-group">
                <label htmlFor="birthdate">Fecha de nacimiento</label>
                <input
                    type="date"
                    id="birthdate"
                    required
                    aria-required="true"
                    aria-describedby="birthdate-hint"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                />
                <small id="birthdate-hint" className="field-hint">Utilizado para restringir contenido sensible de forma ética.</small>
            </div>

            <div className="form-group-checkbox" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '15px 0' }}>
                <input
                    type="checkbox"
                    id="terms-agree"
                    required
                    aria-required="true"
                    checked={termsAgree}
                    onChange={(e) => setTermsAgree(e.target.checked)}
                    style={{ marginTop: '4px' }}
                />
                <label htmlFor="terms-agree" style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                    Acepto las políticas de uso ético, seguridad del sistema de información y privacidad de datos.
                </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={cargando} style={{ opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Registrando credenciales...' : 'Registrarse'}
            </button>
        </form>
    );
}

const rootElement = document.getElementById('react-register-root');
const root = ReactDOM.createRoot(rootElement);
root.render(<RegisterForm />);