export const calcularFechaDesdeDias = (dias) => {
  if (!dias || dias <= 0) return "";
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + parseInt(dias));
  return fecha.toISOString().split("T")[0];
};

export const calcularDiasDesdeFecha = (fecha) => {
  if (!fecha) return "";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaEntregaObj = new Date(anio, mes - 1, dia);
  const diffTime = fechaEntregaObj - hoy;
  const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDias > 0 ? diffDias : "";
};

export const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("T")[0].split("-");
  return `${dia}/${mes}/${anio}`;
};

export const inicializarFechaYDias = (fechaExistente, diasDefault = 0) => {
  if (fechaExistente) {
    const fecha = fechaExistente.split("T")[0];
    const dias = calcularDiasDesdeFecha(fecha);
    return { fecha, dias: dias || "" };
  }
  if (diasDefault > 0) {
    const fecha = calcularFechaDesdeDias(diasDefault);
    const dias = calcularDiasDesdeFecha(fecha);
    return { fecha, dias: dias || String(diasDefault) };
  }
  return { fecha: "", dias: "" };
};