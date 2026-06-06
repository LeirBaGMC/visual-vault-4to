import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../authConfig";

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthdate, setBirthdate] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [bgImage, setBgImage] = useState(null);
    const navigate = useNavigate();

    // 1. Instancia de Microsoft
    const { instance } = useMsal();

    // 🚨 EXPULSOR DE SESIÓN: Si el usuario ya está logueado, no debería estar en Registro
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Si ya hay sesión, preguntamos si quiere salir o ir al perfil
            const salir = window.confirm("Ya tienes una sesión activa. ¿Quieres cerrar sesión para registrar una cuenta nueva?");
            if (salir) {
                localStorage.clear(); // Limpiamos todo
                instance.logoutRedirect(); // Cerramos sesión en Microsoft también
            } else {
                navigate('/perfil'); // Si no quiere salir, lo mandamos al perfil
            }
        }
    }, [navigate, instance]);

    // 2. EL ATRAPADOR DEL REDIRECT DE MICROSOFT (Igual que en Login)
    useEffect(() => {
        instance.handleRedirectPromise().then(async (msResponse) => {
            if (msResponse) {
                setIsLoading(true);
                try {
                    const msToken = msResponse.accessToken;
                    const formData = new URLSearchParams();
                    formData.append('ms_token', msToken);

                    const response = await fetch('http://localhost:8000/api/v1/microsoft', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    });

                    const data = await response.json();

                    if (!response.ok) throw new Error(data.detail || "Error validando con el servidor");

                    // ¡Éxito! Guardamos credenciales y vamos al perfil
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('username', data.username);
                    navigate('/perfil');
                } catch (err) {
                    setError("Error al procesar el registro con Microsoft");
                } finally {
                    setIsLoading(false);
                }
            }
        }).catch(err => {
            console.error(err);
        });
    }, [instance, navigate]);

    // 3. Traer imagen de fondo aleatoria
    useEffect(() => {
        const fetchRandomPin = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/pins/');
                if (!response.ok) throw new Error("Error de red");
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const highResPins = data.filter(pin => pin.image_url && pin.image_url.includes('w=2000'));
                    const pool = highResPins.length > 0 ? highResPins : data;
                    const randomPin = pool[Math.floor(Math.random() * pool.length)];
                    setBgImage(randomPin.image_url);
                }
            } catch (error) {
                console.error("Error cargando imagen del bucket:", error);
            }
        };

        fetchRandomPin();
    }, []);

    // 4. Registro manual (Correo y contraseña)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/v1/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username, 
                    email: email,
                    password: password,
                    birthdate: birthdate 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Error al crear la cuenta");
            }

            navigate('/login'); 

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 5. EL BOTÓN DE MICROSOFT AHORA USA REDIRECT
    const handleMicrosoftLogin = () => {
        instance.loginRedirect(loginRequest);
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FAF7F4] font-sans">
            
            {/* PANEL VISUAL (Lado Izquierdo) */}
            <div className="hidden lg:block lg:w-1/2 p-4">
                <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-2xl bg-slate-800">
                    
                    {bgImage ? (
                        <img 
                            src={bgImage} 
                            alt="Code Vault"
                            className="w-full h-full object-cover animate-in fade-in duration-1000"
                        />
                    ) : (
                        <div className="w-full h-full animate-pulse bg-slate-700"></div>
                    )}
                    
                    <div className="absolute inset-0 bg-slate-900/50 mix-blend-multiply"></div>
                    
                    <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 z-10 hover:opacity-75 transition-opacity cursor-pointer">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold text-xl shadow-inner">
                            V
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">
                            Visual Vault
                        </span>
                    </Link>

                    <div className="absolute inset-0 flex items-center justify-center p-16">
                        <blockquote className="text-3xl text-white font-display font-medium tracking-tight leading-tight drop-shadow-2xl text-center">
                            "Construye tu propio cerebro digital. Guarda piezas de código, arquitecturas y diseños UI para tu próximo gran proyecto."
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* FORMULARIO DE REGISTRO (Lado Derecho) */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
                
                <Link to="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 hover:opacity-75 transition-opacity">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
                        V
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                        Visual Vault
                    </span>
                </Link>

                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl md:text-4xl font-display font-medium text-slate-900 tracking-tight mb-2">
                        Comienza tu bóveda
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Únete gratis y centraliza tus recursos hoy mismo.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-in fade-in">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Nombre de Usuario</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Gabriel Minda"
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
                            <input 
                                type="email" 
                                required
                                placeholder="tu@correo.com"
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                            <input 
                                type="password" 
                                required
                                placeholder="Crea una contraseña segura"
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Fecha de Nacimiento</label>
                            <input 
                                type="date" 
                                required
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 mt-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? 'Creando bóveda...' : 'Crear mi cuenta'}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between">
                        <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
                        <span className="text-xs text-center text-slate-500 uppercase font-bold tracking-wider">O regístrate con</span>
                        <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
                    </div>

                    <button 
                        type="button" 
                        onClick={handleMicrosoftLogin}
                        disabled={isLoading}
                        className="w-full h-12 mt-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M1 1h10v10H1z"/>
                            <path fill="#81bc06" d="M12 1h10v10H12z"/>
                            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                            <path fill="#ffba08" d="M12 12h10v10H12z"/>
                        </svg>
                        Microsoft Outlook
                    </button>

                    <p className="text-center text-slate-500 mt-8 text-sm">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="font-bold text-slate-900 hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>

        </div>
    );
};

export default Register;