import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthMsal from "../../hooks/useAuthMsal";
import Logo from "../atoms/Logo";
import UserMenu from "../molecules/UserMenu";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const { accounts } = useAuthMsal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Derivación directa del estado de autenticación
  const token = localStorage.getItem("token");
  const hasActiveMicrosoftAccount = accounts.length > 0;
  const isAuthenticated = !!token || hasActiveMicrosoftAccount;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 flex justify-center transition-all duration-500 pointer-events-none ${isScrolled ? "pt-4" : "pt-6"}`}
    >
      <nav
        className={`pointer-events-auto flex items-center transition-all duration-500 bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-lg ${
          isScrolled
            ? isAuthenticated
              ? "rounded-full px-3 py-1.5 w-16 h-12 justify-center shadow-md"
              : "rounded-full px-5 py-2 gap-3 shadow-md"
            : "w-[90%] max-w-[1200px] rounded-full px-6 py-3 justify-between"
        }`}
      >
        {!isScrolled && (
          <div className="flex items-center gap-8 animate-in fade-in zoom-in duration-300">
            <Logo />
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="animate-in fade-in duration-300">
              <UserMenu isScrolled={isScrolled} />
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`font-semibold rounded-full transition-all flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 ${
                  isScrolled
                    ? "h-9 px-4 text-xs bg-white shadow-sm border border-slate-100"
                    : "h-10 px-4 text-sm"
                }`}
              >
                Inicio de Sesión
              </Link>

              <Link
                to="/register"
                className={`font-semibold rounded-full transition-all flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 shadow-md ${
                  isScrolled ? "h-9 px-4 text-xs" : "h-10 px-6 text-sm"
                }`}
              >
                Registro
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
