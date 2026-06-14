import { useMsal } from "@azure/msal-react";
import { msalDisponible, msalStub } from "../msalInstance";

// Wrapper seguro de useMsal:
// - Si MSAL está disponible (HTTPS/localhost) usa el hook real.
// - Si no (HTTP plano) devuelve un stub para que la app no se caiga.
// `msalDisponible` es una constante de módulo (no cambia entre renders), por lo
// que el orden de hooks es estable y la rama condicional es segura.
export default function useAuthMsal() {
  if (msalDisponible) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMsal();
  }
  return { instance: msalStub, accounts: [], inProgress: "none" };
}
