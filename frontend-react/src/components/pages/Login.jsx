import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthMsal from "../../hooks/useAuthMsal";
import { loginRequest } from "../../authConfig";
import { Button, Input } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import CodeVerification from "../molecules/CodeVerification";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  const [paso, setPaso] = useState("credenciales");
  const [codeEmail, setCodeEmail] = useState("");
  const [codePurpose, setCodePurpose] = useState("login");

  const navigate = useNavigate();
  const { instance } = useAuthMsal();
  const procesandoAuth = useRef(false);

  const finalizarSesion = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("username", data.username);
    navigate("/perfil");
  };

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

            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/microsoft`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
              },
            );

            const data = await response.json();
            if (!response.ok)
              throw new Error(data.detail || "Error validando con el servidor");

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("username", data.username);
            navigate("/perfil");
          } catch (err) {
            console.error(err);
            setError("Error al procesar el inicio de sesión");
            procesandoAuth.current = false;
          } finally {
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        procesandoAuth.current = false;
      });
  }, [instance, navigate]);

  useEffect(() => {
    const fetchRandomPin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/pins`);
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
        console.error("Error al cargar fondo:", error);
      }
    };
    fetchRandomPin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Credenciales incorrectas");

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
    <div className="min-h-screen w-full flex bg-[#FAF7F4] font-sans selection:bg-slate-900 selection:text-white">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative z-10">
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-3 hover:opacity-70 transition-opacity cursor-pointer group"
        >
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">
            Visual Vault
          </span>
        </Link>

        <div className="max-w-md w-full mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {paso === "codigo" ? (
            <CodeVerification
              email={codeEmail}
              purpose={codePurpose}
              onVerified={finalizarSesion}
              onBack={() => setPaso("credenciales")}
            />
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-display font-semibold text-slate-900 tracking-tight mb-3">
                Bienvenido
              </h2>
              <p className="text-slate-500 mb-10 text-lg">
                Ingresa a tu bóveda y continúa construyendo.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium shadow-sm animate-in fade-in">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <Input
                  type="email"
                  label="Correo Electrónico"
                  placeholder="tu@correo.com"
                  variant="flat"
                  size="lg"
                  isRequired
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  classNames={{
                    inputWrapper:
                      "!rounded-full bg-white border border-slate-200 hover:border-slate-300 focus-within:!border-slate-900 focus-within:!ring-1 focus-within:!ring-slate-900 shadow-sm transition-all px-6",
                    label: "font-semibold text-slate-700 ml-2",
                  }}
                />

                <div className="space-y-1">
                  <Input
                    type={isVisible ? "text" : "password"}
                    label="Contraseña"
                    placeholder="••••••••"
                    variant="flat"
                    size="lg"
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
                          <EyeOff className="w-5 h-5 text-slate-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                    }
                  />
                  <div className="flex justify-end pt-2 px-4">
                    <a
                      href="#"
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-semibold"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full !rounded-full bg-slate-900 text-white font-bold text-md mt-4 shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                >
                  Entrar a la Bóveda
                </Button>
              </form>

              <div className="mt-8 flex items-center justify-between">
                <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
                <span className="text-xs text-center text-slate-400 uppercase font-bold tracking-widest">
                  O continúa con
                </span>
                <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
              </div>

              <Button
                type="button"
                onPress={() => instance.loginRedirect(loginRequest)}
                isDisabled={isLoading}
                variant="bordered"
                size="lg"
                className="w-full !rounded-full font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 mt-8"
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
                ¿No tienes una cuenta?{" "}
                <Link
                  to="/register"
                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Regístrate gratis
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 p-4">
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-2xl bg-slate-800">
          {bgImage ? (
            <img
              src={bgImage}
              alt="Visual Vault Inspiration"
              className="w-full h-full object-cover animate-in fade-in duration-1000"
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-slate-700"></div>
          )}
          <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply"></div>

          {/* Cristal Premium para el Quote */}
          <div className="absolute inset-0 flex items-center justify-center p-16">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2rem] shadow-2xl max-w-lg transform hover:scale-105 transition-transform duration-500">
              <blockquote className="text-3xl text-white font-display font-medium tracking-tight leading-snug drop-shadow-lg text-center">
                "La organización visual no es solo guardar cosas, es encontrar
                la inspiración exactamente cuando la necesitas."
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
