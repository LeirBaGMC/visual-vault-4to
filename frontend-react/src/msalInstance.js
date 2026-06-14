import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

// MSAL requiere la Web Crypto API (crypto.subtle), disponible SOLO en contextos
// seguros (HTTPS o localhost). En http://IP-plana el constructor lanza
// 'crypto_nonexistent' y, como la app se montaba dentro de initialize().then(),
// quedaba en PANTALLA EN BLANCO.
//
// Lo construimos con guard: si no se puede, el login de Microsoft queda
// deshabilitado pero TODO lo demás (correo/contraseña, feed, subidas) funciona.
let instance = null;
try {
  instance = new PublicClientApplication(msalConfig);
} catch (e) {
  console.warn(
    "[MSAL] No disponible (¿sirviendo en HTTP sin contexto seguro?). " +
      "Login de Microsoft deshabilitado; usa correo/contraseña. Detalle:",
    e?.errorCode || e
  );
}

export const msalInstance = instance;
export const msalDisponible = Boolean(instance);

// Stub inofensivo con la superficie que usan los componentes cuando no hay MSAL.
export const msalStub = {
  getAllAccounts: () => [],
  getActiveAccount: () => null,
  handleRedirectPromise: () => Promise.resolve(null),
  loginRedirect: () => {
    alert("El inicio de sesión con Microsoft requiere HTTPS. Usa correo y contraseña.");
    return Promise.resolve();
  },
  logoutRedirect: () => Promise.resolve(),
};
