import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/system'
import App from './App.jsx'
import './assets/global.css'

import { PublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"
import { msalConfig } from "./authConfig" 

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
          <HeroUIProvider>
            <App />
          </HeroUIProvider>
        </BrowserRouter>
      </MsalProvider>
    </React.StrictMode>,
  )
});