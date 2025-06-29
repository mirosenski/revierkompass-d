import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Shield, User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onSuccess: () => void;
}

interface LoginFormData {
  username: string;
  password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    trigger
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    await loginWithCredentials(data.username, data.password);
  };

  const fillDemoCredentials = async () => {
    // Korrekte Verwendung von setValue und trigger für Validierung
    setValue('username', 'admin');
    setValue('password', 'admin123');
    
    // Trigger Validierung nach dem Setzen der Werte
    await trigger(['username', 'password']);
    
    toast('Demo-Anmeldedaten eingefügt', { icon: 'ℹ️' });
  };

  const loginWithCredentials = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (username === 'admin' && password === 'admin123') {
        const user = {
          id: '1',
          username: 'admin',
          email: 'admin@polizei-bw.de',
          role: 'admin' as const,
          isAdmin: true,
          lastLogin: new Date()
        };

        login(user);
        toast.success('Erfolgreich angemeldet!');
        onSuccess();
      } else {
        setError('password', {
          type: 'manual',
          message: 'Ungültige Anmeldedaten'
        });
        toast.error('Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const directDemoLogin = () => {
    loginWithCredentials('admin', 'admin123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 rounded-3xl shadow-xl">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin-Anmeldung
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Melden Sie sich an, um auf das Admin-Dashboard zuzugreifen
          </p>
        </motion.div>

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-800 dark:text-blue-200 font-medium">Demo-Anmeldedaten</p>
              <p className="text-blue-700 dark:text-blue-300">
                Benutzername: <span className="font-mono font-bold">admin</span> | 
                Passwort: <span className="font-mono font-bold">admin123</span>
              </p>
              <div className="flex space-x-4 mt-2">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium underline disabled:opacity-50"
                >
                  Demo-Daten ausfüllen
                </button>
                <button
                  type="button"
                  onClick={directDemoLogin}
                  disabled={isLoading}
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium underline disabled:opacity-50"
                >
                  Direkt als Admin anmelden
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Benutzername
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', { 
                    required: 'Benutzername ist erforderlich',
                    minLength: { value: 3, message: 'Mindestens 3 Zeichen erforderlich' }
                  })}
                  type="text"
                  id="username"
                  autoComplete="username"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.username 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Geben Sie Ihren Benutzernamen ein"
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', { 
                    required: 'Passwort ist erforderlich',
                    minLength: { value: 6, message: 'Mindestens 6 Zeichen erforderlich' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className={`block w-full pl-10 pr-12 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.password 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Geben Sie Ihr Passwort ein"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Anmeldung läuft...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Anmelden</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>
            🔒 Sichere Verbindung • Diese Anmeldung ist nur für autorisierte Benutzer der Polizei Baden-Württemberg
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;