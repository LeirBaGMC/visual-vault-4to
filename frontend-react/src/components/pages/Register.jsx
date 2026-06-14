import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthMsal from "../../hooks/useAuthMsal";
import { loginRequest } from "../../authConfig";
import { Button, Input } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import CodeVerification from "../molecules/CodeVerification";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  const [paso, setPaso] = useState("form");

  const navigate = useNavigate();
  const { instance } = useAuthMsal();
  const procesandoAuth = useRef(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  const finalizarSesion = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("username", data.username);
    navigate("/perfil");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      if (
        window.confirm(
          "Ya tienes una sesión activa. ¿Quieres cerrar sesión para registrar una cuenta nueva?",
        )
      ) {
        localStorage.clear();
        instance.logoutRedirect().catch(console.error);
      } else {
        navigate("/perfil");
      }
    }
  }, [navigate, instance]);

  useEffect(() => {
    if (procesandoAuth.current) return;
    instance
      .handleRedirectPromise()
      .then(async (msResponse) => {
        if (msResponse && !procesandoAuth.current) {
          procesandoAuth.current = true;
          setIsLoading(true);
          try {
            const formData = new URLSearchParams();
            formData.append("ms_token", msResponse.accessToken);

            const response = await fetch(`${apiUrl}/microsoft`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: formData,
            });

            const data = await response.json();
            if (!response.ok)
              throw new Error(data.detail || "Error validando con el servidor");

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("username", data.username);
            navigate("/perfil");
          } catch (err) {
            console.error("Error validando Microsoft:", err);
            setError("Error al procesar el registro con Microsoft");
            procesandoAuth.current = false;
          } finally {
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("MSAL Error:", err);
        procesandoAuth.current = false;
      });
  }, [instance, navigate]);

  useEffect(() => {
    const fetchRandomPin = async () => {
      try {
        const response = await fetch(`${apiUrl}/pins/`);
        if (!response.ok) throw new Error("Error de red");
        const data = await response.json();

        if (data?.length > 0) {
          const highResPins = data.filter((pin) =>
            pin.image_url?.includes("w=2000"),
          );
          const pool = highResPins.length > 0 ? highResPins : data;
          setBgImage(pool[Math.floor(Math.random() * pool.length)].image_url);
        }
      } catch (error) {
        console.error("Error cargando fondo:", error);
      }
    };
    fetchRandomPin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, birthdate }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Error al crear la cuenta");

      setPaso("codigo");
    } catch (err) {
      console.error("Error en registro manual:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF7F4] font-sans selection:bg-slate-900 selection:text-white">
      {/* PANEL VISUAL (Lado Izquierdo) */}
      <div className="hidden lg:block lg:w-1/2 p-4">
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-2xl bg-slate-800">
          {bgImage ? (
            <img
              src={bgImage}
              alt="Code Vault"
              className="w-full h-full object-cover animate-in fade-in duration-1000"
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-slate-700"></div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>

          <Link
            to="/"
            className="absolute top-8 left-8 flex items-center gap-3 z-10 hover:opacity-75 transition-opacity cursor-pointer group"
          >
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold text-xl border border-white/30 group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="text-xl font-black text-white tracking-tight drop-shadow-md">
              Visual Vault
            </span>
          </Link>

          {/* Cristal Premium para el Quote */}
          <div className="absolute inset-0 flex items-center justify-center p-16">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2rem] shadow-2xl max-w-lg transform hover:scale-105 transition-transform duration-500">
              <blockquote className="text-3xl text-white font-display font-medium tracking-tight leading-snug drop-shadow-lg text-center">
                "Construye tu propio cerebro digital. Guarda piezas de código,
                arquitecturas y diseños UI para tu próximo gran proyecto."
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE REGISTRO (Lado Derecho) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <Link
          to="/"
          className="lg:hidden absolute top-8 left-8 flex items-center gap-2 hover:opacity-75 transition-opacity"
        >
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
            V
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Visual Vault
          </span>
        </Link>

        <div className="max-w-md w-full mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {paso === "codigo" ? (
            <CodeVerification
              email={email}
              purpose="register"
              onVerified={finalizarSesion}
              onBack={() => setPaso("form")}
            />
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-display font-semibold text-slate-900 tracking-tight mb-3">
                Comienza tu bóveda
              </h2>
              <p className="text-slate-500 mb-8 text-lg">
                Únete gratis y centraliza tus recursos hoy mismo.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium shadow-sm animate-in fade-in">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  type="text"
                  label="Nombre de Usuario"
                  placeholder="Gabriel Minda"
                  variant="flat"
                  size="md"
                  isRequired
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  classNames={{
                    inputWrapper:
                      "!rounded-full bg-white border border-slate-200 hover:border-slate-300 focus-within:!border-slate-900 focus-within:!ring-1 focus-within:!ring-slate-900 shadow-sm transition-all px-6",
                    label: "font-semibold text-slate-700 ml-2",
                  }}
                />

                <Input
                  type="email"
                  label="Correo Electrónico"
                  placeholder="tu@correo.com"
                  variant="flat"
                  size="md"
                  isRequired
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  classNames={{
                    inputWrapper:
                      "!rounded-full bg-white border border-slate-200 hover:border-slate-300 focus-within:!border-slate-900 focus-within:!ring-1 focus-within:!ring-slate-900 shadow-sm transition-all px-6",
                    label: "font-semibold text-slate-700 ml-2",
                  }}
                />

                <Input
                  type={isVisible ? "text" : "password"}
                  label="Contraseña"
                  placeholder="Crea una contraseña segura"
                  variant="flat"
                  size="md"
                  isRequired
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  classNames={{
                    inputWrapper:
                      "!rounded-full bg-white border border-slate-200 hover:border-slate-300 focus-within:!border-slate-900 focus-within:!ring-1 focus-within:!ring-slate-900 shadow-sm transition-all px-6",
                    label: "font-semibold text-slate-700 ml-2",
                  }}
                  endContent={
                    <button
                      className="focus:outline-none p-2 rounded-full hover:bg-slate-100 transition-colors"
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  }
                />

                <Input
                  type="date"
                  label="Fecha de Nacimiento"
                  placeholder=" "
                  variant="flat"
                  size="md"
                  isRequired
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  classNames={{
                    inputWrapper:
                      "!rounded-full bg-white border border-slate-200 hover:border-slate-300 focus-within:!border-slate-900 focus-within:!ring-1 focus-within:!ring-slate-900 shadow-sm transition-all px-6",
                    label: "font-semibold text-slate-700 ml-2",
                  }}
                />

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full !rounded-full bg-slate-900 text-white font-bold text-md mt-6 shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                >
                  Crear mi cuenta
                </Button>
              </form>

              <div className="mt-8 flex items-center justify-between">
                <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
                <span className="text-xs text-center text-slate-400 uppercase font-bold tracking-widest">
                  O regístrate con
                </span>
                <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
              </div>

              <Button
                type="button"
                onPress={() => instance.loginRedirect(loginRequest)}
                isDisabled={isLoading}
                variant="bordered"
                size="lg"
                className="w-full !rounded-full font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 mt-6"
                startContent={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 23 23"
                  >
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                }
              >
                Microsoft Outlook
              </Button>
              <p className="text-center text-slate-500 mt-10 text-sm font-medium">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  to="/login"
                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
