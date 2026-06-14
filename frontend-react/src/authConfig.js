export const msalConfig = {
  auth: {
    // Configurables por entorno para poder desplegar en cualquier dominio.
    // clientId: usa tu propia app de Azure vía VITE_MSAL_CLIENT_ID.
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "36b4918b-b0ee-4b5e-b49c-c94ac557e6a1",
    authority: "https://login.microsoftonline.com/common",
    // redirectUri: por defecto usa el origen actual (localhost en dev, tu URL de EC2 en prod).
    // Ese mismo origen DEBE estar registrado como Redirect URI en el portal de Azure.
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
  prompt: "select_account",
};
