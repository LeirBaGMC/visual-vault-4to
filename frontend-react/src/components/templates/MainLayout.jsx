// src/components/templates/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from '../organism/Header'; // Asegúrate de ajustar la ruta si es necesario

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-white relative">
            <Header />
            {/* El componente Outlet le dice a React Router: "Inserta aquí el contenido de la página actual" */}
            <main className="w-full">
                <Outlet /> 
            </main>
        </div>
    );
};

export default MainLayout;