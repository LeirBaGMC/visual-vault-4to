import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import useLogout from "../../hooks/useLogout";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const Configuracion = () => {
  const navigate = useNavigate();
  const logout = useLogout();
  const [seccion, setSeccion] = useState("perfil"); // "perfil" | "cuenta"
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", username: "", bio: "", website: "" });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return navigate("/login");
    fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!u) return;
        setUser(u);
        setForm({
          name: u.name || "",
          username: u.username || "",
          bio: u.bio || "",
          website: u.website || "",
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setGuardado(false);
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      const r = await fetch(`${apiUrl}/users/me`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "No se pudo guardar.");
      setUser(data);
      localStorage.setItem("username", data.name || data.username);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () =>
    user &&
    setForm({
      name: user.name || "",
      username: user.username || "",
      bio: user.bio || "",
      website: user.website || "",
    });

  const iniciales = (form.name || form.username || "VV").slice(0, 2).toUpperCase();

  const navItems = [
    { key: "perfil", label: "Editar perfil" },
    { key: "cuenta", label: "Gestión de la cuenta" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Barra superior */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-5 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm ml-auto">
          V
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col md:flex-row gap-10">
        {/* Nav izquierda */}
        <nav className="md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto">
          {navItems.map((it) => (
            <button
              key={it.key}
              onClick={() => setSeccion(it.key)}
              className={`text-left whitespace-nowrap px-3 py-2 rounded-lg text-[15px] font-semibold transition-colors ${
                seccion === it.key
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>

        {/* Contenido */}
        <main className="flex-1 max-w-xl">
          {seccion === "perfil" ? (
            <>
              <h1 className="text-3xl font-display font-medium tracking-tight mb-1">Editar perfil</h1>
              <p className="text-slate-500 mb-8">
                Mantén la privacidad de tus datos. Cualquiera que vea tu perfil puede ver esta información.
              </p>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Foto */}
              <div className="mb-7">
                <p className="text-xs font-semibold text-slate-500 mb-2">Foto</p>
                <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                  {iniciales}
                </div>
              </div>

              <Campo label="Nombre">
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Tu nombre"
                  className={inputCls}
                />
              </Campo>

              <Campo label="Info" ayuda="Cuenta tu historia">
                <textarea
                  value={form.bio}
                  onChange={set("bio")}
                  rows={3}
                  placeholder="Cuenta tu historia"
                  className={`${inputCls} resize-none`}
                />
              </Campo>

              <Campo label="Sitio web" ayuda="Añade un enlace para impulsar el tráfico a tu sitio">
                <input
                  value={form.website}
                  onChange={set("website")}
                  placeholder="https://"
                  className={inputCls}
                />
              </Campo>

              <Campo label="Nombre de usuario" ayuda={`visualvault.com/${form.username || "usuario"}`}>
                <input
                  value={form.username}
                  onChange={set("username")}
                  placeholder="usuario"
                  className={inputCls}
                />
              </Campo>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-display font-medium tracking-tight mb-1">
                Gestión de la cuenta
              </h1>
              <p className="text-slate-500 mb-8">Modifica tu información personal o tu cuenta.</p>

              <Campo label="Correo electrónico">
                <input
                  value={user?.email || ""}
                  disabled
                  className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`}
                />
              </Campo>

              <div className="flex items-center justify-between py-4 border-t border-slate-100">
                <div>
                  <p className="font-semibold">Rol</p>
                  <p className="text-sm text-slate-500">
                    {user?.is_admin ? "Administrador" : "Usuario"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-slate-100">
                <div>
                  <p className="font-semibold">Cerrar sesión</p>
                  <p className="text-sm text-slate-500">Salir de tu cuenta en este dispositivo.</p>
                </div>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-sm transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Barra de guardado fija */}
      {seccion === "perfil" && (
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-slate-100 px-5 py-3 flex justify-center gap-3">
          <button
            onClick={restablecer}
            className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-sm transition-colors"
          >
            Restablecer
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center gap-2"
          >
            {guardado ? (
              <>
                <Check className="w-4 h-4" /> Guardado
              </>
            ) : guardando ? (
              "Guardando…"
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const inputCls =
  "w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-[15px] focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400";

const Campo = ({ label, ayuda, children }) => (
  <div className="mb-6">
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
    {children}
    {ayuda && <p className="text-xs text-slate-400 mt-1.5">{ayuda}</p>}
  </div>
);

export default Configuracion;
