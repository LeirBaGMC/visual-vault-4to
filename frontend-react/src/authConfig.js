export const msalConfig = {
  auth: {
    clientId: "36b4918b-b0ee-4b5e-b49c-c94ac557e6a1",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173", // <--- Volvemos a la ruta original
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
