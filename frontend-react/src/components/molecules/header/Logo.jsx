import { Link } from 'react-router-dom';

const Logo = () => {
    return (
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {/* Cambiado a bg-slate-900 */}
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
                V
            </div>
            {/* Cambiado a text-slate-900 */}
            <span className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">
                Visual Vault
            </span>
        </Link>
    );
};

export default Logo;