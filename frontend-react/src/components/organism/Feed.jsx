import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from "@heroui/react";
import PinCard from '../molecules/Pincard'; 

const Feed = () => {
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado inicializado correctamente
    const [viewedPins, setViewedPins] = useState(() => {
        const saved = localStorage.getItem('viewedPins');
        return saved ? JSON.parse(saved) : [];
    }); 
    const navigate = useNavigate();

    useEffect(() => {
        // Llamada a la API limpia
        const fetchPins = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/pins`); 
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                setPins(data); 
            } catch (err) {
                console.error("Error al obtener los pines:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPins();
    }, []);

    const handlePinClick = (pin) => {
        console.log("2. [Feed] handlePinClick activado con éxito para el pin ID:", pin.id);

        if (!viewedPins.includes(pin.id)) {
            const updatedViewedPins = [...viewedPins, pin.id];
            setViewedPins(updatedViewedPins);
            localStorage.setItem('viewedPins', JSON.stringify(updatedViewedPins));
            console.log("3. [Feed] ID guardado en localStorage");
        }

        console.log("4. [Feed] Intentando navegar a: /pin/" + pin.id);
        navigate(`/pin/${pin.id}`);
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center items-center h-64">
                <Spinner color="danger" size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full text-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">cloud_off</span>
                <h2 className="text-2xl font-bold text-gray-700">No se pudo conectar al servidor</h2>
                <p className="text-gray-500 mt-2">{error}</p>
                <p className="text-sm font-semibold text-brandPrimary mt-4">¿Encendiste tu servidor de FastAPI?</p>
            </div>
        );
    }

    return (
        <div className="w-full mt-4">
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {pins.map((pin) => (
                    <PinCard 
                        key={pin.id} 
                        pin={pin} 
                        isViewed={viewedPins.includes(pin.id)} 
                        onClick={handlePinClick} 
                    />
                ))}
            </div>
        </div>
    );
};

export default Feed;