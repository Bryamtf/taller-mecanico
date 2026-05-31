import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login as loginService } from '../services/authService';
import { swalError } from '@/lib/swal';

export function useLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { token, usuario } = await loginService(data);
      login(token, usuario);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Usuario o clave incorrectos';
      swalError('Error al iniciar sesión', message);
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    loading,
  };
}
