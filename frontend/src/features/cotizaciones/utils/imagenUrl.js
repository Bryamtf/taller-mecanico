const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

export const getImagenUrl = (ruta) => {
  if (!ruta) return "";
  if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
    return ruta;
  }
  return `${baseURL}${ruta}`;
};