import { useState } from "react";
import { Button } from "@heroui/react";
import { MailCheck, ArrowLeft } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Paso de verificación por código de 6 dígitos.
// purpose: "register" -> POST /users/verify | "login" -> POST /login/verify
const CodeVerification = ({ email, purpose, onVerified, onBack }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const endpoint = purpose === "login" ? "/login/verify" : "/users/verify";
  const titulo =
    purpose === "login" ? "Verificación en dos pasos" : "Confirma tu correo";

  const verificar = async (e) => {
    e?.preventDefault();
    const limpio = code.trim();
    if (limpio.length !== 6) {
      setError("Ingresa los 6 dígitos completos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: limpio }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Código inválido o expirado.");
      onVerified(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setError("");
    try {
      await fetch(`${apiUrl}/users/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError("No se pudo reenviar el código.");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Icono Superior Premium */}
      <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center mb-6 shadow-[0_4px_14px_0_rgba(15,23,42,0.39)]">
        <MailCheck className="w-7 h-7" />
      </div>

      <h2 className="text-3xl md:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-3">
        {titulo}
      </h2>
      <p className="text-slate-500 mb-8 text-lg leading-relaxed">
        Enviamos un código de 6 dígitos a{" "}
        <span className="font-semibold text-slate-800">{email}</span>. Caduca en
        10 minutos.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium shadow-sm animate-in fade-in">
          {error}
        </div>
      )}

      <form onSubmit={verificar} className="space-y-6">
        {/* Input de Código Estilo Píldora */}
        <input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (error) setError(""); // Limpia el error al escribir
          }}
          placeholder="······"
          className="w-full text-center text-3xl md:text-4xl tracking-[0.5em] font-bold text-slate-900 bg-white border border-slate-200 !rounded-full py-4 shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 hover:border-slate-300 transition-all placeholder:text-slate-300"
        />

        {/* Botón Principal con Física Premium */}
        <Button
          type="submit"
          size="lg"
          radius="full"
          isLoading={loading}
          className="w-full !rounded-full bg-slate-900 text-white font-bold text-md mt-2 shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          Verificar y continuar
        </Button>
      </form>

      {/* Enlaces de Acción Inferiores */}
      <div className="mt-8 flex items-center justify-between text-sm font-medium">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={reenviar}
          disabled={resent}
          className={`transition-colors px-3 py-1.5 -mr-3 rounded-lg ${
            resent
              ? "text-green-600 bg-green-50 cursor-default"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {resent ? "✓ Código reenviado" : "Reenviar código"}
        </button>
      </div>
    </div>
  );
};

export default CodeVerification;
