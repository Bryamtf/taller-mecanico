import { CheckCircle2, Circle } from 'lucide-react';
import { passwordRules } from '../utils/validacionesUsuario';

const RULES = [
  { key: 'length', label: 'Mínimo 8 caracteres' },
  { key: 'uppercase', label: 'Una letra mayúscula' },
  { key: 'lowercase', label: 'Una letra minúscula' },
  { key: 'number', label: 'Un número' },
];

export default function PasswordChecklist({ value = '' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
      {RULES.map((rule) => {
        const ok = passwordRules[rule.key](value);
        const Icon = ok ? CheckCircle2 : Circle;
        return (
          <div key={rule.key} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
            <Icon size={13} />
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}
