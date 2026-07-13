export const REGLAS = {
  cliente_id: {
    required: 'Selecciona un cliente',
  },
  vehiculo_id: {
    required: 'Selecciona un vehículo',
  },
  fecha: {
    required: 'La fecha es requerida',
  },
  hora: {
    required: 'La hora es requerida',
  },
  tipo_servicio: {
    required: 'Selecciona el tipo de servicio',
  },
  descripcion_problema: {
    maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
  },
  observaciones_tecnico: {
    maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
  },
};

export const ESTADOS = [
  { value: 'pendiente',           label: 'Pendiente' },
  { value: 'confirmada',          label: 'Confirmada' },
  { value: 'en_proceso',          label: 'En proceso' },
  { value: 'en_espera_repuesto',  label: 'En espera de repuesto' },
  { value: 'finalizada',          label: 'Finalizada' },
  { value: 'cancelada',           label: 'Cancelada' },
];

export const ESTADO_BADGE = {
  pendiente:          'bg-blue-100 text-blue-700',
  confirmada:          'bg-purple-100 text-purple-700',
  en_proceso:          'bg-orange-100 text-orange-700',
  en_espera_repuesto:  'bg-yellow-100 text-yellow-800',
  finalizada:          'bg-green-100 text-green-700',
  cancelada:           'bg-red-100 text-red-700',
};

export const ESTADO_LABEL = {
  pendiente:          'Pendiente',
  confirmada:          'Confirmada',
  en_proceso:          'En proceso',
  en_espera_repuesto:  'En espera de repuesto',
  finalizada:          'Finalizada',
  cancelada:           'Cancelada',
};

export const TIPOS_SERVICIO = [
  { value: 'diagnostico',   label: 'Diagnóstico' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'reparacion',    label: 'Reparación' },
  { value: 'revision',      label: 'Revisión' },
];

export const TIPO_SERVICIO_LABEL = {
  diagnostico:   'Diagnóstico',
  mantenimiento: 'Mantenimiento',
  reparacion:    'Reparación',
  revision:      'Revisión',
};
