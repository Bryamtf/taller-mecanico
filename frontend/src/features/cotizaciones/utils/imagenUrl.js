const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

export const getImagenUrl = (ruta) => `${baseURL}${ruta}`;
