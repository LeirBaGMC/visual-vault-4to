import { Link } from 'react-router-dom';
import { Button } from "@heroui/react";

const UserMenu = () => {
    return (
        <div className="flex items-center gap-3">
            <Link to="/login">
                <Button variant="light" className="font-semibold text-gray-700 hidden sm:flex">
                    Iniciar sesión
                </Button>
            </Link>
            <Link to="/register">
                <Button color="danger" radius="full" className="font-bold text-white shadow-md">
                    Registrarse
                </Button>
            </Link>
        </div>
    );
};

export default UserMenu;