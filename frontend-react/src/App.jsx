import { Routes, Route } from 'react-router-dom';
import Header from './components/organism/Header'; 
import Feed from './components/organism/Feed'; 
import PageLoader from './components/organism/PageLoader'; 
import HomePage from './components/template/HomePage';

const Login = () => <div className="p-10 text-center text-2xl font-bold text-gray-800">Iniciar Sesión 🔐</div>;
const Register = () => <div className="p-10 text-center text-2xl font-bold text-gray-800">Registro 📝</div>;
const Perfil = () => <div className="p-10 text-center text-2xl font-bold text-gray-800">Mi Perfil 👤</div>;

function App() {
  return (
    <div className="min-h-screen bg-white relative">
      <PageLoader /> 
      <Header />
      
      {/* Reduje un poco el padding (p-4 en lugar de p-6) para que parezca más a Pinterest */}
      <main className="w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
        </Routes>
      </main>
    </div>
  );
}

export default App;