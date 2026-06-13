export const REGLAS = {
  titulo: {
    required: 'El título es requerido',
    minLength: { value: 5,   message: 'Mínimo 5 caracteres' },
    maxLength: { value: 150, message: 'Máximo 150 caracteres' },
    validate: (v) => v.trim().length >= 5 || 'El título no puede estar vacío',
  },
  descripcion: {
    required: 'La descripción es requerida',
    minLength: { value: 10,   message: 'Mínimo 10 caracteres' },
    maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
  },
  categoria: {
    required: 'Selecciona una categoría',
  },
  urgencia: {
    required: 'Selecciona la urgencia',
  },
  impacto: {
    required: 'Selecciona el impacto',
  },
  solucion: {
    maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
  },
  nota: {
    required: 'La nota no puede estar vacía',
    minLength: { value: 5,   message: 'Mínimo 5 caracteres' },
    maxLength: { value: 500, message: 'Máximo 500 caracteres' },
  },
  descripcionEstado: {
    maxLength: { value: 300, message: 'Máximo 300 caracteres' },
  },
};

export { sanitizar } from '@/utils/inputSanitizer';

// Cálculo de prioridad

export const calcularPrioridad = (urgencia, impacto) => {
  const matriz = {
    alta:  { alto: 'critica', medio: 'alta',  bajo: 'media' },
    media: { alto: 'alta',   medio: 'media', bajo: 'baja'  },
    baja:  { alto: 'media',  medio: 'baja',  bajo: 'baja'  },
  };
  return matriz[urgencia]?.[impacto] ?? null;
};

// Opciones de selects

export const CATEGORIAS = [
  { value: 'tecnica',    label: 'Técnica' },
  { value: 'operativa',  label: 'Operativa' },
  { value: 'cliente',    label: 'Cliente' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'seguridad',  label: 'Seguridad' },
];

export const URGENCIAS = [
  { value: 'baja',  label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta',  label: 'Alta' },
];

export const IMPACTOS = [
  { value: 'bajo',  label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto',  label: 'Alto' },
];

export const ESTADOS = [
  { value: 'abierta',    label: 'Abierta' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'escalada',   label: 'Escalada' },
  { value: 'resuelta',   label: 'Resuelta' },
  { value: 'cerrada',    label: 'Cerrada' },
];

export const CATEGORIAS_CIERRE = [
  { value: 'resuelto',     label: 'Resuelto' },
  { value: 'workaround',   label: 'Solución temporal' },
  { value: 'sin_solucion', label: 'Sin solución' },
  { value: 'duplicada',    label: 'Duplicada' },
];

// Badges de prioridad

export const PRIORIDAD_BADGE = {
  critica: 'bg-red-100 text-red-700 border border-red-200',
  alta:    'bg-orange-100 text-orange-700 border border-orange-200',
  media:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  baja:    'bg-green-100 text-green-700 border border-green-200',
};

export const PRIORIDAD_LABEL = {
  critica: 'Crítica',
  alta:    'Alta',
  media:   'Media',
  baja:    'Baja',
};

// Badges de estado

export const ESTADO_BADGE = {
  abierta:    'bg-blue-100 text-blue-700',
  en_proceso: 'bg-orange-100 text-orange-700',
  escalada:   'bg-red-100 text-red-700',
  resuelta:   'bg-green-100 text-green-700',
  cerrada:    'bg-gray-100 text-gray-600',
};

export const ESTADO_LABEL = {
  abierta:    'Abierta',
  en_proceso: 'En Proceso',
  escalada:   'Escalada',
  resuelta:   'Resuelta',
  cerrada:    'Cerrada',
};

// Labels de categoría

export const CATEGORIA_LABEL = {
  tecnica:    'Técnica',
  operativa:  'Operativa',
  cliente:    'Cliente',
  inventario: 'Inventario',
  seguridad:  'Seguridad',
};

// Sugerencias de urgencia/impacto por categoría - prellenado

export const SUGERENCIAS_CATEGORIA = {
  seguridad:  { urgencia: 'alta',  impacto: 'alto' },
  operativa:  { urgencia: 'media', impacto: 'medio' },
  cliente:    { urgencia: 'media', impacto: 'medio' },
  tecnica:    { urgencia: 'media', impacto: 'medio' },
  inventario: { urgencia: 'baja',  impacto: 'bajo' },
};
