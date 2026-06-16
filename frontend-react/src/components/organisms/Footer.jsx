import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 py-24 px-6 md:px-12 rounded-t-[40px] mt-12 relative z-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-[100%] blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto flex flex-col gap-20 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-800/80 pb-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-5xl md:text-7xl font-medium text-white tracking-tight mb-6">
              Deja de buscar. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                Empieza a crear.
              </span>
            </h2>
            <p className="text-xl text-slate-400 font-sans max-w-lg">
              Únete a la bóveda y mantén tus referencias, arquitecturas y
              diseños UI centralizados en un solo lugar.
            </p>
          </div>
          <Link
            to="/register"
            className="h-14 px-8 rounded-full bg-white text-slate-900 font-bold text-lg flex items-center justify-center hover:bg-slate-200 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] shrink-0"
          >
            Crear cuenta gratis
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-16">
          <div className="flex flex-col gap-6 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-black text-xl">
                V
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Visual Vault
              </span>
            </div>
          </div>

          <div className="flex gap-16 md:gap-24"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
