// src/App.jsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/templates/MainLayout";
import PrivateRoute from "./components/templates/PrivateRoute";

// Páginas
import HomePage from "./components/pages/HomePage";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Perfil from "./components/pages/Perfil";
import PinPage from "./components/pages/PinPage"; // Nombre corregido
import Tableros from "./components/pages/Tableros";

function App() {
  return (
    <Routes>
      {/* 1. RUTAS LIBRES (Sin Header global, tienen su propia navegación interna) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pin/:id" element={<PinPage />} />

      {/* RUTAS PRIVADAS (requieren sesión: token JWT o cuenta de Microsoft) */}
      <Route element={<PrivateRoute />}>
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/tableros" element={<Tableros />} />
      </Route>

      {/* 2. RUTAS CON PLANTILLA (Automáticamente envueltas con el Header) */}
      <Route element={<MainLayout />}>
        {/* Cualquier ruta que pongas aquí adentro tendrá el Header arriba */}
        <Route path="/" element={<HomePage />} />
        {/* Aquí puedes agregar en el futuro: <Route path="/about" element={<AboutPage />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
