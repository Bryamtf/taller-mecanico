import { useLogin } from '../hooks/useLogin';

export default function LoginForm() {
  const { register, handleSubmit, errors, loading } = useLogin();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-center text-2xl font-bold tracking-widest text-[#C9A227] uppercase">
        Iniciar Sesión
      </h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Usuario/Correo</label>
        <input
          {...register('username', { required: 'El usuario es requerido' })}
          type="text"
          placeholder="Ingresa tu usuario"
          className="rounded-lg border border-gray-400 px-4 py-3 text-sm outline-none focus:border-[#C9A227] transition-colors tracking-widest"
        />
        {errors.username && (
          <span className="text-xs text-red-500">{errors.username.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Clave</label>
        <input
          {...register('password', { required: 'La clave es requerida' })}
          type="password"
          placeholder="••••••••"
          className="rounded-lg border border-gray-400 px-4 py-3 text-sm outline-none focus:border-[#C9A227] transition-colors tracking-widest"
        />
        {errors.password && (
          <span className="text-xs text-red-500">{errors.password.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-[#C9A227] py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-[#b8911f] disabled:opacity-60 transition-colors"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
