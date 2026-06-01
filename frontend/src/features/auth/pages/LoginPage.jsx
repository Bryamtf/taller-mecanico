import logo from '@/assets/logo.webp';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-sm shadow-2xl overflow-hidden rounded-xl">

        {/* Header oscuro con logo */}
        <div className="bg-[#000000] flex flex-col items-center py-4 px-6 gap-3">
          <img src={logo} alt="Autonort Perú SAC" className="h-20 w-40 object-contain" />
          <h1 className="text-[#e5ba4a] text-xl font-bold tracking-widest uppercase">
            Mi Autonort
          </h1>
        </div>

        {/* Formulario en blanco */}
        <div className="bg-white px-8 py-10">
          <LoginForm />
        </div>

      </div>
    </div>
  );
}
