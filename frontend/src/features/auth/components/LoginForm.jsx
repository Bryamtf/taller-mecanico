import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';

export default function LoginForm() {
  const { register, handleSubmit, errors, loading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-center text-2xl font-bold tracking-widest text-[#e5ba4a] uppercase">
        Iniciar Sesión
      </h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Usuario/Correo</label>
        <input
          {...register('username', { required: 'El usuario es requerido' })}
          type="text"
          placeholder="Ingresa tu usuario"
          className="rounded-lg border border-gray-400 px-4 py-3 text-sm outline-none focus:border-[#e5ba4a] transition-colors tracking-widest"
        />
        {errors.username && (
          <span className="text-xs text-red-500">{errors.username.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Clave</label>
        <div className="relative">
          <input
            {...register('password', { required: 'La clave es requerida' })}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-400 pl-4 pr-11 py-3 text-sm outline-none focus:border-[#e5ba4a] transition-colors tracking-widest"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs text-red-500">{errors.password.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-[#e5ba4a] py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-[#b8911f] disabled:opacity-60 transition-colors"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}