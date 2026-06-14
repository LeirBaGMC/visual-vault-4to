import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/system'
import App from './App.jsx'
import './assets/global.css'

import { MsalProvider } from "@azure/msal-react"
import { msalInstance } from "./msalInstance"

function montarApp() {
  const arbol = (
    <BrowserRouter>
      <HeroUIProvider>
        <App />
      </HeroUIProvider>
    </BrowserRouter>
  );

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      {msalInstance ? <MsalProvider instance={msalInstance}>{arbol}</MsalProvider> : arbol}
    </React.StrictMode>,
  );
}

// La app SIEMPRE se monta, haya o no MSAL (evita la pantalla en blanco en HTTP).
if (msalInstance) {
  msalInstance
    .initialize()
    .then(montarApp)
    .catch((e) => {
      console.warn("[MSAL] init falló; la app carga igual sin login de Microsoft:", e);
      montarApp();
    });
} else {
  montarApp();
}
