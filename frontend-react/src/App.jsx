import { Routes, Route, useLocation } from 'react-router-dom';

// 1. Importamos tus componentes globales
import Header from './components/organism/Header'; 
import PageLoader from './components/organism/PageLoader'; 
import HomePage from './components/template/HomePage';

// 2. IMPORTAMOS TUS NUEVAS PÁGINAS REALES
// (Asegúrate de que la ruta de la carpeta coincida con donde las guardaste)
import Login from './components/pages/Login'; 
import Register from './components/pages/Register';
import Perfil from './components/pages/Perfil';

function App() {
  // useLocation nos dice en qué URL está el usuario en este momento
  const location = useLocation();

  // Definimos en qué rutas NO queremos que aparezca el Header flotante
  const hideHeaderRoutes = ['/login', '/register', '/perfil']; // Agrega aquí cualquier ruta donde quieras ocultar el Header
  const isAuthPage = hideHeaderRoutes.includes(location.pathname);

  return (
    // Cambiamos bg-white por bg-[#FAF7F4] para mantener la consistencia del color crema
    <div className="min-h-screen bg-[#FAF7F4] relative">
      
      {/* El PageLoader solo se mostrará en la página principal (Home) */}
      {location.pathname === '/' && <PageLoader />}
      
      {/* El Header NO se mostrará si estamos en Login o Register */}
      {!isAuthPage && <Header />}
      
      <main className="w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          {/* OJO: Rutas en minúsculas para que coincidan con los Link */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/perfil" element={<Perfil />} />
          
        </Routes>
      </main>
    </div>
  );
}

export default App;