// src/components/templates/PrivateRoute.jsx
// Guard de rutas privadas: deja pasar si hay token JWT o sesión activa de Microsoft.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthMsal from "../../hooks/useAuthMsal";

const PrivateRoute = () => {
  const location = useLocation();
  const { accounts } = useAuthMsal();

  const token = localStorage.getItem("token");
  const hasMicrosoftAccount = accounts.length > 0;
  const isAuthenticated = !!token || hasMicrosoftAccount;

  if (!isAuthenticated) {
    // Redirige a login conservando a dónde quería ir el usuario.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;
