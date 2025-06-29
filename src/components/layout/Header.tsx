import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sun, Moon, LogIn, LogOut, Settings, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useAuthStore } from '@/lib/store/auth-store';

interface HeaderProps {
  onAdminLogin: () => void;
  onBackToWizard: () => void;
  onGoToAdmin?: () => void;
  currentView: 'wizard' | 'login' | 'admin' | 'test';
}

const Header: React.FC<HeaderProps> = ({ onAdminLogin, onBackToWizard, onGoToAdmin, currentView }) => {
  const { isDarkMode, toggleTheme } = useAppStore();
  const { isAuthenticated, isAdmin, logout, user } = useAuthStore();

  // Debug: Zeige Auth-Status
  console.log('🔍 Header Auth Status:', { isAuthenticated, isAdmin, user: !!user });

  const handleLogout = () => {
    logout();
    onBackToWizard();
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-4 cursor-pointer select-none"
            onClick={() => {
              console.log('🔄 Logo geklickt - handleBackToWizard wird aufgerufen');
              onBackToWizard();
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-3 rounded-2xl shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                RevierKompass
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Polizei Baden-Württemberg
              </p>
            </div>
          </motion.div>

          {/* Navigation & Controls */}
          <div className="flex items-center space-x-4">
            {/* Back Button für Admin/Login */}
            {currentView !== 'wizard' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBackToWizard}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Zurück zum Wizard</span>
              </motion.button>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 shadow-sm"
              title={isDarkMode ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </motion.button>

            {/* Admin Login/User Info */}
            {!isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAdminLogin}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <LogIn className="h-4 w-4" />
                <span>Als Admin anmelden</span>
              </motion.button>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Admin Dashboard Button - Nur wenn nicht bereits im Admin-Bereich */}
                {currentView !== 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      console.log('Admin Dashboard Button geklickt');
                      if (onGoToAdmin) {
                        onGoToAdmin();
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl transition-all duration-200 font-medium"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Admin Dashboard</span>
                  </motion.button>
                )}

                {/* User Info Badge - Zeigt aktuellen Benutzer */}
                <motion.div 
                  className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-xl"
                >
                  <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    {user?.username || 'Admin'}
                  </span>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl transition-all duration-200 font-medium"
                  title="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Abmelden</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;