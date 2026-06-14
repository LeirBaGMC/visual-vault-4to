import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

// Cierre de sesión consistente para toda la app:
// borra el token/username locales Y cierra la sesión de Microsoft (MSAL) si la hay.
// El bug anterior: varias pantallas solo hacían navigate('/login') sin limpiar nada,
// por lo que con cuenta de Outlook (MSAL) seguías autenticado.
export default function useLogout() {
  const navigate = useNavigate();
  const { instance } = useMsal();

  return () => {
    localStorage.clear();
    const tieneCuentaMs =
      instance.getActiveAccount() || instance.getAllAccounts().length > 0;
    if (tieneCuentaMs) {
      instance.logoutRedirect().catch((e) => {
        console.error("Error al cerrar sesión de Microsoft:", e);
        navigate("/login");
      });
    } else {
      navigate("/login");
    }
  };
}
