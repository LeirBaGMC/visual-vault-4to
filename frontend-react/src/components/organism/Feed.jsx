import { useState, useEffect } from 'react';
import { Spinner } from "@heroui/react";
import PinCard from '../molecules/feed/Pincard';

const Feed = () => {
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPins = async () => {
            try {
                // Asumo que tu backend de FastAPI corre en el puerto 8000.
                // Ajusta la ruta "/pins" según el endpoint que creaste en tu backend.
                const response = await fetch('http://localhost:8000/api/v1/pins'); 
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Si FastAPI devuelve un objeto como { "data": [...] }, usa setPins(data.data)
                // Si devuelve directamente el arreglo [...], usa setPins(data)
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

    // Pantalla de carga mientras trae los datos de AWS/FastAPI
    if (loading) {
        return (
            <div className="w-full flex justify-center items-center h-64">
                <Spinner color="danger" size="lg" />
            </div>
        );
    }

    // Pantalla de error por si el backend está apagado
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

    // El Feed real renderizado
    return (
        <div className="w-full mt-4">
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {pins.map((pin) => (
                    <PinCard key={pin.id} pin={pin} />
                ))}
            </div>
        </div>
    );
};

export default Feed;