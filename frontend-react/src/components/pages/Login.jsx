import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthMsal from "../../hooks/useAuthMsal";
import { loginRequest } from "../../authConfig";
import { Button, Input } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import CodeVerification from "../molecules/CodeVerification";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bgImage, setBgImage] = useState(null);

    // Flujo en 2 pasos: tras la contraseña se pide un código (2FA) o verificación de correo.
    const [paso, setPaso] = useState("credenciales"); // "credenciales" | "codigo"
    const [codeEmail, setCodeEmail] = useState("");
    const [codePurpose, setCodePurpose] = useState("login"); // "login" | "register"

    const navigate = useNavigate();
    const { instance } = useAuthMsal();
    const procesandoAuth = useRef(false); // Evita ejecuciones concurrentes de la promesa

    // Guarda la sesión tras verificar el código y entra al perfil.
    const finalizarSesion = (data) => {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        navigate('/perfil');
    };

    // 1. Manejo del Login de Microsoft Corregido
    useEffect(() => {
        if (procesandoAuth.current) return;

        instance.handleRedirectPromise().then(async (msResponse) => {
            if (msResponse && !procesandoAuth.current) {
                procesandoAuth.current = true;
                setIsLoading(true);
                try {
                    const formData = new URLSearchParams();
                    formData.append('ms_token', msResponse.accessToken);

                    const response = await fetch(`${import.meta.env.VITE_API_URL}/microsoft`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.detail || "Error validando con el servidor");

                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('username', data.username);
                    navigate('/perfil');
                } catch (err) {
                    console.error(err);
                    setError("...");
                    procesandoAuth.current = false;
                } finally {
                    setIsLoading(false);
                }
            }
        }).catch((err) => {
            console.error(err);
            procesandoAuth.current = false;
        });
    }, [instance, navigate]);

    // 2. Fondo Aleatorio Dinámico
    useEffect(() => {
        const fetchRandomPin = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/pins`);
                if (!response.ok) throw new Error("Error de red");
                const data = await response.json();
                
                if (data?.length > 0) {
                    const highResPins = data.filter(pin => pin.image_url?.includes('w=2000'));
                    const pool = highResPins.length > 0 ? highResPins : data;
                    setBgImage(pool[Math.floor(Math.random() * pool.length)].image_url);
                }
            } catch (error) {
                console.error("Error al cargar fondo:", error);
            }
        };
        fetchRandomPin();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', email); 
            formData.append('password', password);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Credenciales incorrectas");

            // El backend no devuelve token aún: pide un código (2FA o verificación de correo).
            setCodeEmail(data.email || email);
            setCodePurpose(data.requires_verification ? "register" : "login");
            setPaso("codigo");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FAF7F4] font-sans">
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative">
                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">V</div>
                    <span className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">Visual Vault</span>
                </Link>

                <div className="max-w-md w-full mx-auto mt-16">
                  {paso === "codigo" ? (
                    <CodeVerification
                      email={codeEmail}
                      purpose={codePurpose}
                      onVerified={finalizarSesion}
                      onBack={() => setPaso("credenciales")}
                    />
                  ) : (
                   <>
                    <h2 className="text-3xl md:text-4xl font-display font-medium text-slate-900 tracking-tight mb-2">Bienvenido de vuelta</h2>
                    <p className="text-slate-500 mb-8">Ingresa a tu bóveda y continúa construyendo.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <Input 
                            type="email" 
                            label="Correo Electrónico" 
                            placeholder="tu@correo.com"
                            variant="bordered" radius="md" size="lg" isRequired
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            classNames={{ label: "font-semibold text-slate-700" }}
                        />

                        <div className="space-y-1">
                            <Input 
                                type={isVisible ? "text" : "password"}
                                label="Contraseña" placeholder="••••••••"
                                variant="bordered" radius="md" size="lg" isRequired
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                classNames={{ label: "font-semibold text-slate-700" }}
                                endContent={
                                    <button className="focus:outline-none" type="button" onClick={() => setIsVisible(!isVisible)}>
                                        {isVisible ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                    </button>
                                }
                            />
                            <div className="flex justify-end pt-1">
                                <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">¿Olvidaste tu contraseña?</a>
                            </div>
                        </div>

                        <Button 
                            type="submit" color="primary" size="lg" radius="md" isLoading={isLoading}
                            className="w-full bg-slate-900 font-bold hover:bg-slate-800 text-md mt-2"
                        >
                            Entrar a la Bóveda
                        </Button>
                    </form>

                    <div className="mt-6 flex items-center justify-between">
                        <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
                        <span className="text-xs text-center text-slate-500 uppercase font-bold tracking-wider">O continúa con</span>
                        <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
                    </div>

                    <Button 
                        type="button" 
                        onPress={() => instance.loginRedirect(loginRequest)}
                        isDisabled={isLoading} variant="bordered" size="lg" radius="md"
                        className="w-full font-bold text-slate-700 border-slate-200 hover:bg-slate-50 mt-6"
                        startContent={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                                <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                            </svg>
                        }
                    >
                        Microsoft Outlook
                    </Button>

                    <p className="text-center text-slate-500 mt-8 text-sm">
                        ¿No tienes una cuenta? <Link to="/register" className="font-bold text-slate-900 hover:underline">Regístrate gratis</Link>
                    </p>
                   </>
                  )}
                </div>
            </div>

            <div className="hidden lg:block lg:w-1/2 p-4">
                <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-2xl bg-slate-800">
                    {bgImage ? (
                        <img src={bgImage} alt="Visual Vault Inspiration" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full animate-pulse bg-slate-700"></div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
                    <div className="absolute inset-0 flex items-center justify-center p-16">
                        <blockquote className="text-3xl text-white font-display font-medium tracking-tight leading-tight drop-shadow-2xl text-center">
                            "La organización visual no es solo guardar cosas, es encontrar la inspiración exactamente cuando la necesitas."
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;