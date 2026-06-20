function formatFecha(fecha) {
  if (!fecha) return "-";
  const iso = typeof fecha === "string" ? fecha : fecha.toISOString();
  const [anio, mes, dia] = iso.split("T")[0].split("-");
  return `${dia}/${mes}/${anio}`;
}

module.exports = formatFecha;
