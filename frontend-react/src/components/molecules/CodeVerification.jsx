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
  const titulo = purpose === "login" ? "Verificación en dos pasos" : "Confirma tu correo";

  const verificar = async (e) => {
    e?.preventDefault();
    const limpio = code.trim();
    if (limpio.length !== 6) {
      setError("Ingresa los 6 dígitos.");
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
    <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-5">
        <MailCheck className="w-6 h-6" />
      </div>
      <h2 className="text-3xl md:text-4xl font-display font-medium text-slate-900 tracking-tight mb-2">
        {titulo}
      </h2>
      <p className="text-slate-500 mb-8">
        Enviamos un código de 6 dígitos a{" "}
        <span className="font-semibold text-slate-700">{email}</span>. Caduca en 10 minutos.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={verificar} className="space-y-5">
        <input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="······"
          className="w-full text-center text-3xl tracking-[0.5em] font-bold text-slate-900 bg-white border-2 border-slate-200 rounded-2xl py-4 focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
        />

        <Button
          type="submit"
          color="primary"
          size="lg"
          radius="md"
          isLoading={loading}
          className="w-full bg-slate-900 font-bold hover:bg-slate-800 text-md"
        >
          Verificar y continuar
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={reenviar}
          className="font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          {resent ? "✓ Código reenviado" : "Reenviar código"}
        </button>
      </div>
    </div>
  );
};

export default CodeVerification;
