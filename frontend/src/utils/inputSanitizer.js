const esControlKey = (e) =>
  ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
  e.ctrlKey ||
  e.metaKey;

export const onKeyDown = {
  // Solo dígitos 0-9. Para DNI, teléfono, cantidades, etc
  soloNumeros: (e) => {
    if (esControlKey(e)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  },

  // Dígitos y un único punto decimal. Para precios y cantidades con decimales
  soloDecimal: (e) => {
    if (esControlKey(e)) return;
    if (e.key === '.' && e.target.value.includes('.')) { e.preventDefault(); return; }
    if (!/[\d.]/.test(e.key)) e.preventDefault();
  },

  // Solo letras y espacios simples. Para nombres y apellidos
  soloLetras: (e) => {
    if (esControlKey(e)) return;
    if (e.key === ' ') return;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/.test(e.key)) e.preventDefault();
  },

  // Letras, dígitos y guion. Para placa de vehículo
  soloPlaca: (e) => {
    if (esControlKey(e)) return;
    if (!/^[a-zA-Z0-9-]$/.test(e.key)) e.preventDefault();
  },

  // Letras, dígitos, espacios y puntos. Para razón social / nombres de empresa
  soloTextoEmpresa: (e) => {
    if (esControlKey(e)) return;
    if (e.key === ' ' || e.key === '.') return;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]$/.test(e.key)) e.preventDefault();
  },
};

export const sanitizar = {
  // Solo dígitos, máx 8 caracteres
  dni: (v) => v.replace(/\D/g, '').slice(0, 8),

  // Solo dígitos, máx 11 caracteres
  ruc: (v) => v.replace(/\D/g, '').slice(0, 11),

  // Solo dígitos, máx 9 caracteres
  telefono: (v) => v.replace(/\D/g, '').slice(0, 9),

  // Alfanumérico + guion, mayúsculas, máx 8 caracteres
  placa: (v) => v.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 8),

  // Solo letras, espacios simples, sin espacios al inicio
  nombre: (v) =>
    v
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart(),

  // Texto general: elimina < > { } y no permite espacios al inicio
  texto: (v) => v.replace(/[<>{}]/g, '').trimStart(),

  // Precio
  precio: (v) => {
    const limpio = v.replace(/[^\d.]/g, '');
    const partes = limpio.split('.');
    if (partes.length > 2) return partes[0] + '.' + partes.slice(1).join('');
    return limpio;
  },

  // Solo dígitos enteros positivos. Para stock, cantidades, etc
  entero: (v) => v.replace(/\D/g, ''),

  // Email: minúsculas, sin espacios
  email: (v) => v.toLowerCase().replace(/\s/g, ''),
};

export const validar = {
  // DNI: exactamente 8 dígitos
  dni: (v) => !v || /^\d{8}$/.test(v) || 'El DNI debe tener exactamente 8 dígitos',

  // RUC: exactamente 11 dígitos
  ruc: (v) => !v || /^\d{11}$/.test(v) || 'El RUC debe tener exactamente 11 dígitos',

  // DNI o RUC: 8 u 11 dígitos
  dniOrRuc: (v) => !v || /^\d{8}$/.test(v) || /^\d{11}$/.test(v) || 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos)',

  // Teléfono: 9 dígitos
  telefono: (v) => !v || /^\d{9}$/.test(v) || 'El teléfono debe tener 9 dígitos',

  // Email con formato básico
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Correo electrónico inválido',

  // Placa: 3 letras + guion opcional + 3-4 dígitos
  placa: (v) => !v || /^[A-Z0-9]{3}-?[0-9]{3,4}$/.test(v) || 'Placa inválida (Ej: ABC-123)',

  // Precio mayor a 0
  precio: (v) => !v || (Number(v) > 0) || 'El precio debe ser mayor a 0',

  // Entero mayor o igual a 0
  enteroPositivo: (v) => v === '' || v === undefined || Number(v) >= 0 || 'El valor debe ser 0 o mayor',

  // Entero estrictamente mayor a 0
  enteroMayorCero: (v) => !v || Number(v) > 0 || 'El valor debe ser mayor a 0',
};