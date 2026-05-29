import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login as loginService } from '../services/authService';

export function useLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError(null);
    try {
      const { token, usuario } = await loginService(data);
      login(token, usuario);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Usuario o clave incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    loading,
    serverError,
  };
}
